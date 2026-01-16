"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Keyboard } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import { VideoPlayer, VideoPlayerRef } from "@/components/tv/VideoPlayer";
import { VideoControls } from "@/components/tv/VideoControls";
import { VideoInfoDialog } from "@/components/tv/VideoInfoDialog";
import { Section, Bracket } from "@/types/event";
import { Video } from "@/types/video";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TVClientProps {
  initialSections: Array<{
    section: Section;
    eventId: string;
    eventTitle: string;
    bracket?: Bracket;
  }>;
}

// Extended section type with video-to-bracket mapping
interface CombinedSectionData {
  section: Section;
  eventId: string;
  eventTitle: string;
  bracket?: Bracket;
  videoToBracketMap: Map<string, Bracket>; // Map video ID to bracket
}

// Flattened video with metadata
interface VideoWithMetadata {
  video: Video;
  eventId: string;
  eventTitle: string;
  section: Section;
  bracket?: Bracket;
}

// Combine brackets within the same section
// The backend splits brackets into separate section entries, we need to combine them back
function combineBracketSections(
  sections: Array<{
    section: Section;
    eventId: string;
    eventTitle: string;
    bracket?: Bracket;
  }>
): CombinedSectionData[] {
  const result: CombinedSectionData[] = [];
  // Group by original section (eventId + original section ID)
  // The backend creates section IDs like `${sectionId}-${bracket.id}`, so we extract the original section ID
  const sectionGroups = new Map<
    string,
    Array<{
      section: Section;
      eventId: string;
      eventTitle: string;
      bracket?: Bracket;
    }>
  >();

  // Group sections by their original section (before bracket split)
  // Store original section ID with each group
  const sectionIdMap = new Map<string, string>(); // sectionKey -> originalSectionId

  for (const sectionData of sections) {
    // Extract original section ID by removing the bracket suffix
    // Format is usually `${sectionId}-${bracket.id}`
    let originalSectionId = sectionData.section.id;
    if (sectionData.bracket) {
      // Try to extract original section ID
      const bracketSuffix = `-${sectionData.bracket.id}`;
      if (originalSectionId.endsWith(bracketSuffix)) {
        originalSectionId = originalSectionId.slice(0, -bracketSuffix.length);
      }
    }

    // Create a key that identifies the original section
    const sectionKey = `${sectionData.eventId}-${originalSectionId}`;

    if (!sectionGroups.has(sectionKey)) {
      sectionGroups.set(sectionKey, []);
      sectionIdMap.set(sectionKey, originalSectionId);
    }
    sectionGroups.get(sectionKey)!.push(sectionData);
  }

  // Combine all brackets within each section
  for (const [sectionKey, groupSections] of sectionGroups.entries()) {
    if (groupSections.length === 0) continue;

    // Use the first section as the base
    const firstSection = groupSections[0];
    const combinedVideos: Video[] = [];
    const videoToBracketMap = new Map<string, Bracket>();

    // Check if any section has brackets
    const hasBrackets = groupSections.some((s) => s.bracket !== undefined);

    // Combine all videos from all brackets in this section
    for (const sectionData of groupSections) {
      for (const video of sectionData.section.videos) {
        combinedVideos.push(video);
        // Map each video to its bracket
        if (sectionData.bracket) {
          videoToBracketMap.set(video.id, sectionData.bracket);
        }
      }
    }

    // Extract original section title (remove bracket suffix if present)
    let originalTitle = firstSection.section.title;
    if (firstSection.bracket) {
      // Title format is usually `${sectionTitle} - ${bracketTitle}`
      const bracketSuffix = ` - ${firstSection.bracket.title}`;
      if (originalTitle.endsWith(bracketSuffix)) {
        originalTitle = originalTitle.slice(0, -bracketSuffix.length);
      }
    }

    // Create combined section with all brackets' videos
    const originalSectionId =
      sectionIdMap.get(sectionKey) || firstSection.section.id;
    result.push({
      section: {
        ...firstSection.section,
        id: originalSectionId, // Use original section ID
        title: originalTitle,
        videos: combinedVideos,
        hasBrackets: hasBrackets,
      },
      eventId: firstSection.eventId,
      eventTitle: firstSection.eventTitle,
      bracket: undefined, // Section-level bracket is undefined since we have multiple brackets
      videoToBracketMap,
    });
  }

  return result;
}

export function TVClient({ initialSections }: TVClientProps) {
  // Combine bracket sections on initialization and when new sections are loaded
  const [sections, setSections] = useState<CombinedSectionData[]>(() =>
    combineBracketSections(initialSections)
  );
  // Track all loaded sections (before combining) for pagination
  const [allLoadedSections, setAllLoadedSections] = useState(initialSections);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<
    Map<number, number>
  >(new Map());

  // Console log the sections for debugging
  useEffect(() => {
    console.log("TV Page - Event Sections (combined):", sections);
    console.log("TV Page - Sections Count:", sections.length);
    sections.forEach((sectionData, index) => {
      console.log(`Section ${index}:`, {
        eventTitle: sectionData.eventTitle,
        eventId: sectionData.eventId,
        sectionTitle: sectionData.section.title,
        sectionId: sectionData.section.id,
        bracketTitle: sectionData.bracket?.title,
        bracketId: sectionData.bracket?.id,
        videoCount: sectionData.section.videos.length,
        videos: sectionData.section.videos.map((v) => ({
          id: v.id,
          title: v.title,
          src: v.src,
          bracket: sectionData.videoToBracketMap.get(v.id)?.title,
        })),
      });
    });
  }, [sections]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const lastAutoplayedVideoRef = useRef<string | null>(null);

  const mainSwiperRef = useRef<SwiperType | null>(null);
  const videoSwipersRef = useRef<Map<number, SwiperType>>(new Map());
  const playerRef = useRef<VideoPlayerRef>(null);

  // Get current video
  const getCurrentVideo = useCallback((): {
    video: Video;
    eventId: string;
    eventTitle: string;
    section: Section;
    bracket?: Bracket;
  } | null => {
    if (sections.length === 0) return null;
    const section = sections[currentSectionIndex];
    if (!section) return null;

    const videoIndex = currentVideoIndex.get(currentSectionIndex) || 0;
    const videos = section.section.videos;
    if (videos.length === 0) return null;

    const video = videos[videoIndex];
    if (!video) return null;

    // Get bracket from video-to-bracket map
    const bracket = section.videoToBracketMap.get(video.id);

    return {
      video,
      eventId: section.eventId,
      eventTitle: section.eventTitle,
      section: section.section,
      bracket,
    };
  }, [sections, currentSectionIndex, currentVideoIndex]);

  const currentVideo = getCurrentVideo();

  // Load more sections when near bottom
  const loadMoreSections = useCallback(async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const response = await fetch(
        `/api/tv/sections?offset=${allLoadedSections.length}&limit=10`
      );
      if (response.ok) {
        const newSections = await response.json();
        // Add new sections to the loaded list
        const updatedLoadedSections = [...allLoadedSections, ...newSections];
        setAllLoadedSections(updatedLoadedSections);
        // Recombine all sections (this will merge brackets properly)
        setSections(combineBracketSections(updatedLoadedSections));
      }
    } catch (error) {
      console.error("Error loading more sections:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [allLoadedSections.length, isLoadingMore]);

  // Handle main swiper (sections) slide change
  const handleSectionChange = useCallback(
    (swiper: SwiperType) => {
      const newIndex = swiper.activeIndex;
      setCurrentSectionIndex(newIndex);

      // Load more if near end
      if (newIndex >= sections.length - 3) {
        loadMoreSections();
      }

      // Ensure video index is set for this section (default to 0 if not set)
      const videoIndex = currentVideoIndex.get(newIndex) ?? 0;
      if (!currentVideoIndex.has(newIndex)) {
        setCurrentVideoIndex((prev) => {
          const newMap = new Map(prev);
          newMap.set(newIndex, 0);
          return newMap;
        });
      }

      // Get the video for this section and index
      const section = sections[newIndex];
      if (section && section.section.videos.length > 0) {
        const video = section.section.videos[videoIndex];
        if (video && playerRef.current) {
          playerRef.current.loadVideoById(video.src);
          playerRef.current.mute();
          setIsMuted(true);
          // Only autoplay if this video hasn't been seen before
          if (lastAutoplayedVideoRef.current !== video.id) {
            setTimeout(() => {
              if (
                playerRef.current &&
                lastAutoplayedVideoRef.current !== video.id
              ) {
                playerRef.current.playVideo();
                setIsPlaying(true);
                lastAutoplayedVideoRef.current = video.id;
              }
            }, 300);
          }
        }
      }
    },
    [sections, currentVideoIndex, loadMoreSections]
  );

  // Handle video swiper (within section) slide change
  const handleVideoChange = useCallback(
    (sectionIndex: number, swiper: SwiperType) => {
      const newVideoIndex = swiper.activeIndex;
      setCurrentVideoIndex((prev) => {
        const newMap = new Map(prev);
        newMap.set(sectionIndex, newVideoIndex);
        return newMap;
      });

      const section = sections[sectionIndex];
      if (section && section.section.videos.length > newVideoIndex) {
        const video = section.section.videos[newVideoIndex];
        if (video && playerRef.current) {
          playerRef.current.loadVideoById(video.src);
          playerRef.current.mute();
          setIsMuted(true);
          // Only autoplay if this video hasn't been seen before
          if (lastAutoplayedVideoRef.current !== video.id) {
            playerRef.current.playVideo();
            setIsPlaying(true);
            lastAutoplayedVideoRef.current = video.id;
          }
        }
      }
    },
    [sections]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return; // Don't handle if typing in input
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          navigateVideo(-1);
          break;
        case "ArrowDown":
          e.preventDefault();
          navigateVideo(1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          navigateSection(-1);
          break;
        case "ArrowRight":
          e.preventDefault();
          navigateSection(1);
          break;
        case " ":
          e.preventDefault();
          togglePlayPause();
          break;
        case "m":
        case "M":
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // Navigation functions
  const navigateVideo = useCallback(
    (direction: number) => {
      const section = sections[currentSectionIndex];
      if (!section) return;

      const currentIdx = currentVideoIndex.get(currentSectionIndex) || 0;
      const videos = section.section.videos;
      if (videos.length === 0) return;

      const videoSwiper = videoSwipersRef.current.get(currentSectionIndex);
      if (videoSwiper) {
        const newIndex = Math.max(
          0,
          Math.min(videos.length - 1, currentIdx + direction)
        );
        videoSwiper.slideTo(newIndex);
      }
    },
    [sections, currentSectionIndex, currentVideoIndex]
  );

  const navigateSection = useCallback(
    (direction: number) => {
      if (mainSwiperRef.current) {
        const newIndex = Math.max(
          0,
          Math.min(sections.length - 1, currentSectionIndex + direction)
        );
        mainSwiperRef.current.slideTo(newIndex);
      }
    },
    [sections.length, currentSectionIndex]
  );

  const togglePlayPause = useCallback(() => {
    if (playerRef.current) {
      // Get actual player state instead of relying on local state
      const playerState = playerRef.current.getPlayerState();
      // YouTube Player States: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
      if (playerState === 1) {
        // Currently playing, so pause
        playerRef.current.pauseVideo();
      } else {
        // Not playing (paused, ended, unstarted, etc.), so play
        playerRef.current.playVideo();
      }
      // Don't set state here - let handlePlayerStateChange update it based on actual player state
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unmute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    }
  }, [isMuted]);

  // Auto-play when video enters center (muted) - only on first appearance
  useEffect(() => {
    if (currentVideo && playerRef.current) {
      const videoId = currentVideo.video.id;

      // Only autoplay if this video hasn't been autoplayed before
      if (lastAutoplayedVideoRef.current !== videoId) {
        const timer = setTimeout(() => {
          if (playerRef.current && lastAutoplayedVideoRef.current !== videoId) {
            // Ensure muted before playing
            if (!isMuted) {
              playerRef.current.mute();
              setIsMuted(true);
            }
            playerRef.current.playVideo();
            setIsPlaying(true);
            lastAutoplayedVideoRef.current = videoId;
          }
        }, 500); // Small delay for smooth transition

        return () => clearTimeout(timer);
      }
    }
  }, [currentVideo?.video.id, isMuted]);

  // Update playing state based on player state
  const handlePlayerStateChange = useCallback((state: number) => {
    // YouTube Player States: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    if (state === 1) {
      setIsPlaying(true);
    } else if (state === 2 || state === 0) {
      setIsPlaying(false);
    }
  }, []);

  // Get bracket name for display - use currentVideo to ensure accuracy
  const getBracketName = () => {
    if (currentVideo?.bracket) {
      return currentVideo.bracket.title;
    }
    return null;
  };

  if (sections.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-foreground">No battle sections available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-black">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent z-50 shrink-0">
        <div>
          <h2 className="text-white font-semibold text-sm md:text-base">
            {currentVideo?.eventTitle}
            {currentVideo?.bracket && ` - ${currentVideo.bracket.title}`}
            {!currentVideo?.bracket &&
              getBracketName() &&
              ` - ${getBracketName()}`}
          </h2>
        </div>
        <div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsInfoDialogOpen(true)}
            className="text-white hover:bg-white/20"
            aria-label="Video information"
          >
            <Info className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area - Flex layout */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-0 relative z-30">
        {/* Video Name */}
        {currentVideo && (
          <div className="shrink-0">
            <h3 className="text-white font-medium text-sm md:text-base bg-black/60 px-4 py-2 rounded backdrop-blur-sm">
              {currentVideo.video.title}
            </h3>
          </div>
        )}

        <Swiper
          direction="horizontal"
          modules={[Navigation, Keyboard]}
          onSwiper={(swiper) => {
            mainSwiperRef.current = swiper;
          }}
          onSlideChange={handleSectionChange}
          slidesPerView={1}
          spaceBetween={0}
          centeredSlides={true}
          keyboard={{
            enabled: true,
            onlyInViewport: false,
          }}
          className="w-full h-full"
          speed={300}
        >
          {sections.map((sectionData, sectionIdx) => {
            const videos = sectionData.section.videos;
            if (videos.length === 0) return null;

            return (
              <SwiperSlide
                key={sectionData.section.id}
                className="flex items-center justify-center"
              >
                {/* Nested Swiper - Vertical Videos (all brackets combined) */}
                <Swiper
                  direction="vertical"
                  modules={[Navigation, Keyboard]}
                  onSwiper={(swiper) => {
                    videoSwipersRef.current.set(sectionIdx, swiper);
                  }}
                  onSlideChange={(swiper) => {
                    handleVideoChange(sectionIdx, swiper);
                  }}
                  slidesPerView={1}
                  spaceBetween={0}
                  centeredSlides={true}
                  keyboard={{
                    enabled: true,
                    onlyInViewport: false,
                  }}
                  className="w-full h-full"
                  speed={300}
                >
                  {videos.map((video, videoIdx) => {
                    // Only render VideoPlayer for the current video to enable lazy loading
                    const isCurrentVideo =
                      currentVideo && currentVideo.video.id === video.id;
                    return (
                      <SwiperSlide
                        key={video.id}
                        className="flex items-center justify-center"
                      >
                        <p className="text-white text-sm">{videoIdx}</p>
                        {isCurrentVideo ? (
                          <VideoPlayer
                            ref={playerRef}
                            videoId={currentVideo.video.src}
                            autoplay={true}
                            muted={true}
                            onStateChange={handlePlayerStateChange}
                            className="w-full aspect-video"
                          />
                        ) : (
                          <div className="w-full aspect-video bg-black flex items-center justify-center">
                            <p className="text-white text-sm opacity-50">
                              {video.title}
                            </p>
                          </div>
                        )}
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Controls */}
        <div className="shrink-0 pb-4">
          <VideoControls
            onUp={() => navigateVideo(-1)}
            onDown={() => navigateVideo(1)}
            onLeft={() => navigateSection(-1)}
            onRight={() => navigateSection(1)}
            onPlayPause={togglePlayPause}
            onMuteToggle={toggleMute}
            isPlaying={isPlaying}
            isMuted={isMuted}
          />
        </div>
      </div>

      {/* Filters Link - Bottom Right */}
      <div className="absolute bottom-4 right-4 z-40">
        <Link
          href="#"
          className="text-white/70 hover:text-white underline text-sm"
          onClick={(e) => {
            e.preventDefault();
            // Placeholder for future filters
          }}
        >
          Filters
        </Link>
      </div>

      {/* Info Dialog */}
      {currentVideo && (
        <VideoInfoDialog
          isOpen={isInfoDialogOpen}
          onClose={() => setIsInfoDialogOpen(false)}
          eventTitle={currentVideo.eventTitle}
          eventId={currentVideo.eventId}
          section={currentVideo.section}
          bracket={currentVideo.bracket}
          video={currentVideo.video}
        />
      )}
    </div>
  );
}
