"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Keyboard } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import { VideoPlayer, VideoPlayerRef } from "@/components/tv/VideoPlayer";
import { VideoControls } from "@/components/tv/VideoControls";
import { VideoInfoDialog } from "@/components/tv/VideoInfoDialog";
import { VideoReacts } from "@/components/tv/VideoReacts";
import { ReactAnimation } from "@/components/tv/ReactAnimation";
import { Section, Bracket } from "@/types/event";
import { Video } from "@/types/video";
import { Info, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useSession } from "next-auth/react";

import Link from "next/link";
import { StyleBadge } from "@/components/ui/style-badge";

interface TVClientProps {
  initialSections: Array<{
    section: Section;
    eventId: string;
    eventTitle: string;
    bracket?: Bracket;
    city?: string;
    eventDate?: string; // Formatted as "Mar 2026"
  }>;
}

// Extended section type with video-to-bracket mapping
interface CombinedSectionData {
  section: Section;
  eventId: string;
  eventTitle: string;
  bracket?: Bracket;
  city?: string;
  eventDate?: string; // Formatted as "Mar 2026"
  videoToBracketMap: Map<string, Bracket>; // Map video ID to bracket
}

// Combine brackets within the same section
// The backend splits brackets into separate section entries, we need to combine them back
function combineBracketSections(
  sections: Array<{
    section: Section;
    eventId: string;
    eventTitle: string;
    bracket?: Bracket;
    city?: string;
    eventDate?: string; // Formatted as "Mar 2026"
  }>,
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
      city?: string;
      eventDate?: string; // Formatted as "Mar 2026"
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
      city: firstSection.city,
      eventDate: firstSection.eventDate, // Pass through eventDate
      videoToBracketMap,
    });
  }

  return result;
}

// Format seconds to MM:SS
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function TVClient({ initialSections }: TVClientProps) {
  // Combine bracket sections on initialization and when new sections are loaded
  const [sections, setSections] = useState<CombinedSectionData[]>(() =>
    combineBracketSections(initialSections),
  );
  // Track all loaded sections (before combining) for pagination
  const [allLoadedSections, setAllLoadedSections] = useState(initialSections);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<
    Map<number, number>
  >(new Map());

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSliderVisible, setIsSliderVisible] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0,
  );
  const lastAutoplayedVideoRef = useRef<string | null>(null);
  const sliderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(isPlaying);

  const mainSwiperRef = useRef<SwiperType | null>(null);
  const videoSwipersRef = useRef<Map<number, SwiperType>>(new Map());
  const playerRef = useRef<VideoPlayerRef>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // React state management
  const { data: session } = useSession();
  const [videoReacts, setVideoReacts] = useState<
    Map<
      string,
      Array<{
        userId: string;
        fire: number;
        clap: number;
        wow: number;
        heart: number;
      }>
    >
  >(new Map());
  const triggeredReacts = useRef<Map<string, Set<string>>>(new Map());

  const MAX_CACHED_VIDEOS = 10;

  // Clamp currentTime to valid range and ensure slider value is always valid
  const clampedTime = Math.max(
    0,
    Math.min(currentTime, duration > 0 ? duration : currentTime),
  );
  const sliderValue = duration > 0 ? [clampedTime] : [0];
  const maxValue = duration > 0 ? duration : 100;

  // Show slider and reset fade-out timer
  const showSlider = useCallback(() => {
    setIsSliderVisible(true);
    if (sliderTimeoutRef.current) {
      clearTimeout(sliderTimeoutRef.current);
      sliderTimeoutRef.current = null;
    }
    // Only auto-hide if playing (use ref to avoid dependency)
    if (isPlayingRef.current) {
      sliderTimeoutRef.current = setTimeout(() => {
        setIsSliderVisible(false);
      }, 2000);
    }
  }, []);

  // Get current video
  const getCurrentVideo = useCallback((): {
    video: Video;
    eventId: string;
    eventTitle: string;
    section: Section;
    bracket?: Bracket;
    city?: string;
    eventDate?: string; // Formatted as "Mar 2026"
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
      city: section.city,
      eventDate: section.eventDate,
    };
  }, [sections, currentSectionIndex, currentVideoIndex]);

  const currentVideo = getCurrentVideo();

  // Memoize user reacts for current video
  const userReacts = useMemo(() => {
    if (!currentVideo || !session?.user?.id) return null;
    const allReacts = videoReacts.get(currentVideo.video.id) || [];
    const userReact = allReacts.find((r) => r.userId === session.user.id);
    if (!userReact) return null;
    return {
      fire: userReact.fire,
      clap: userReact.clap,
      wow: userReact.wow,
      heart: userReact.heart,
    };
  }, [videoReacts, currentVideo?.video.id, session?.user?.id]);

  // Memoize sorted reacts for current video (for animation triggering)
  const sortedReacts = useMemo(() => {
    if (!currentVideo) return [];
    const allReacts = videoReacts.get(currentVideo.video.id) || [];
    const reactItems: Array<{ type: string; timestamp: number; id: string }> =
      [];

    for (const react of allReacts) {
      if (react.fire > 0) {
        reactItems.push({
          type: "fire",
          timestamp: react.fire,
          id: `${react.userId}-fire`,
        });
      }
      if (react.clap > 0) {
        reactItems.push({
          type: "clap",
          timestamp: react.clap,
          id: `${react.userId}-clap`,
        });
      }
      if (react.wow > 0) {
        reactItems.push({
          type: "wow",
          timestamp: react.wow,
          id: `${react.userId}-wow`,
        });
      }
      if (react.heart > 0) {
        reactItems.push({
          type: "heart",
          timestamp: react.heart,
          id: `${react.userId}-heart`,
        });
      }
    }

    return reactItems.sort((a, b) => a.timestamp - b.timestamp);
  }, [videoReacts, currentVideo?.video.id]);

  // Fetch reacts for a video
  const fetchReacts = useCallback(async (videoId: string) => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`/api/tv/videos/${videoId}/reacts`, {
        signal: abortControllerRef.current.signal,
      });
      if (response.ok) {
        const reacts = await response.json();
        setVideoReacts((prev) => {
          const newMap = new Map(prev);
          newMap.set(videoId, reacts);

          // Enforce memory limit
          if (newMap.size > MAX_CACHED_VIDEOS) {
            const firstKey = newMap.keys().next().value;
            if (firstKey) {
              newMap.delete(firstKey);
            }
          }

          return newMap;
        });
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error fetching reacts:", error);
      }
    }
  }, []);

  // Fetch reacts when video changes
  useEffect(() => {
    const videoId = currentVideo?.video.id;
    if (videoId) {
      fetchReacts(videoId);
      // Clear triggered reacts for new video
      triggeredReacts.current.delete(videoId);
    }
  }, [currentVideo?.video.id, fetchReacts]);

  // Handle user react
  const handleReact = useCallback(
    async (type: string, timestamp: number) => {
      if (!currentVideo || !session?.user?.id) return;

      const videoId = currentVideo.video.id;
      const userId = session.user.id;

      // Optimistic update
      setVideoReacts((prev) => {
        const newMap = new Map(prev);
        const existingReacts = newMap.get(videoId) || [];
        const existingUserReact = existingReacts.find(
          (r) => r.userId === userId,
        );

        if (existingUserReact) {
          const updatedReacts = existingReacts.map((r) =>
            r.userId === userId ? { ...r, [type]: timestamp } : r,
          );
          newMap.set(videoId, updatedReacts);
        } else {
          newMap.set(videoId, [
            ...existingReacts,
            {
              userId,
              fire: type === "fire" ? timestamp : 0,
              clap: type === "clap" ? timestamp : 0,
              wow: type === "wow" ? timestamp : 0,
              heart: type === "heart" ? timestamp : 0,
            },
          ]);
        }

        return newMap;
      });

      // Fire and forget API call
      fetch(`/api/tv/videos/${videoId}/reacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, timestamp }),
      }).catch((error) => {
        console.error("Error saving react:", error);
      });
    },
    [currentVideo, session?.user?.id],
  );

  // Handle reset
  const handleReset = useCallback(async () => {
    if (!currentVideo || !session?.user?.id) return;

    const videoId = currentVideo.video.id;
    const userId = session.user.id;

    // Optimistic update
    setVideoReacts((prev) => {
      const newMap = new Map(prev);
      const existingReacts = newMap.get(videoId) || [];
      const updatedReacts = existingReacts.map((r) =>
        r.userId === userId ? { ...r, fire: 0, clap: 0, wow: 0, heart: 0 } : r,
      );
      newMap.set(videoId, updatedReacts);
      return newMap;
    });

    // Fire and forget API call
    fetch(`/api/tv/videos/${videoId}/reacts`, {
      method: "DELETE",
    }).catch((error) => {
      console.error("Error resetting react:", error);
    });
  }, [currentVideo, session?.user?.id]);

  // Load more sections when near bottom
  const loadMoreSections = useCallback(async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const response = await fetch(
        `/api/tv/sections?offset=${allLoadedSections.length}&limit=10`,
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
      showSlider(); // Show slider when navigating

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
          // Always autoplay after manual navigation
          setTimeout(() => {
            if (playerRef.current) {
              playerRef.current.playVideo();
              setIsPlaying(true);
              lastAutoplayedVideoRef.current = video.id;
            }
          }, 300);
        }
      }
    },
    [sections, currentVideoIndex, loadMoreSections, showSlider],
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
      showSlider(); // Show slider when navigating

      const section = sections[sectionIndex];
      if (section && section.section.videos.length > newVideoIndex) {
        const video = section.section.videos[newVideoIndex];
        if (video && playerRef.current) {
          playerRef.current.loadVideoById(video.src);
          playerRef.current.mute();
          setIsMuted(true);
          // Always autoplay after manual navigation
          playerRef.current.playVideo();
          setIsPlaying(true);
          lastAutoplayedVideoRef.current = video.id;
        }
      }
    },
    [sections, showSlider],
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
    (direction: number, circular: boolean = false) => {
      const section = sections[currentSectionIndex];
      if (!section) return;

      const currentIdx = currentVideoIndex.get(currentSectionIndex) || 0;
      const videos = section.section.videos;
      if (videos.length === 0) return;

      const videoSwiper = videoSwipersRef.current.get(currentSectionIndex);
      if (videoSwiper) {
        let newIndex: number;
        if (circular) {
          // Circular navigation: wrap around
          newIndex = (currentIdx + direction + videos.length) % videos.length;
        } else {
          // Normal navigation: clamp to bounds
          newIndex = Math.max(
            0,
            Math.min(videos.length - 1, currentIdx + direction),
          );
        }
        videoSwiper.slideTo(newIndex);
      }
    },
    [sections, currentSectionIndex, currentVideoIndex],
  );

  const navigateSection = useCallback(
    (direction: number) => {
      if (mainSwiperRef.current) {
        const newIndex = Math.max(
          0,
          Math.min(sections.length - 1, currentSectionIndex + direction),
        );
        mainSwiperRef.current.slideTo(newIndex);
      }
    },
    [sections.length, currentSectionIndex],
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

        return () => {
          clearTimeout(timer);
        };
      }
    }
  }, [currentVideo?.video.id, isMuted]);

  // Update playing state based on player state
  // Track video time and duration
  useEffect(() => {
    if (!playerRef.current || !currentVideo) return;

    const interval = setInterval(() => {
      if (playerRef.current) {
        try {
          const time = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();

          // Only update if we have valid values
          if (time >= 0 && isFinite(time) && !isNaN(time)) {
            setCurrentTime(time);
          }
          if (dur > 0 && isFinite(dur) && !isNaN(dur)) {
            setDuration(dur);
          }
        } catch (e) {
          // Ignore errors (player might not be ready)
        }
      }
    }, 250); // Update 4 times per second for smooth slider

    return () => clearInterval(interval);
  }, [currentVideo?.video.id]);

  // Track video loading state
  useEffect(() => {
    if (!playerRef.current || !currentVideo) {
      setIsVideoLoading(false);
      return;
    }

    const interval = setInterval(() => {
      if (playerRef.current) {
        try {
          const loading = playerRef.current.isLoading();
          setIsVideoLoading(loading);
        } catch (e) {
          // Ignore errors
        }
      }
    }, 250); // Check loading state frequently

    return () => clearInterval(interval);
  }, [currentVideo?.video.id]);

  // Reset time when video changes
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    showSlider(); // Show slider when video changes
  }, [currentVideo?.video.id, showSlider]);

  // Update slider visibility based on playing state and loading state
  useEffect(() => {
    isPlayingRef.current = isPlaying; // Keep ref in sync
    if (!isPlaying || isVideoLoading) {
      // Always show when paused or loading
      setIsSliderVisible(true);
      if (sliderTimeoutRef.current) {
        clearTimeout(sliderTimeoutRef.current);
        sliderTimeoutRef.current = null;
      }
    } else {
      // If playing and not loading, fade out immediately
      if (sliderTimeoutRef.current) {
        clearTimeout(sliderTimeoutRef.current);
        sliderTimeoutRef.current = null;
      }
      setIsSliderVisible(false);
    }
  }, [isPlaying, isVideoLoading]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (sliderTimeoutRef.current) {
        clearTimeout(sliderTimeoutRef.current);
      }
    };
  }, []);

  // Detect landscape mode
  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(orientation: landscape) and (max-height: 500px)",
    );
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsLandscape(e.matches);
    };
    handleChange(mediaQuery); // Set initial value
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Detect mobile device and window width
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        ) || width < 768;
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Calculate if emojis should be large: width > sm breakpoint (640px) AND not in landscape mode
  const useLargeEmojis = windowWidth > 640 && !isLandscape;

  const handleSeek = useCallback(
    (value: number[]) => {
      if (playerRef.current && value.length > 0) {
        const seekTime = Math.max(0, value[0]);
        playerRef.current.seekTo(seekTime);
        setCurrentTime(seekTime);
        showSlider(); // Show slider when interacting

        // Clear triggered reacts to allow retriggering when seeking
        if (currentVideo?.video.id) {
          triggeredReacts.current.delete(currentVideo.video.id);
        }
      }
    },
    [showSlider, currentVideo?.video.id],
  );

  const handleRewind = useCallback(() => {
    if (playerRef.current) {
      const newTime = Math.max(0, currentTime - 10);
      playerRef.current.seekTo(newTime);
      setCurrentTime(newTime);
      showSlider(); // Show slider when rewinding
    }
  }, [currentTime, showSlider]);

  const handleFastForward = useCallback(() => {
    if (playerRef.current) {
      const newTime = Math.min(duration, currentTime + 10);
      playerRef.current.seekTo(newTime);
      setCurrentTime(newTime);
      showSlider(); // Show slider when fast forwarding
    }
  }, [currentTime, duration, showSlider]);

  const handleRestart = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.seekTo(0);
      setCurrentTime(0);
      showSlider(); // Show slider when restarting
    }
  }, [showSlider]);

  const handlePlayerReady = useCallback(() => {
    if (playerRef.current) {
      const dur = playerRef.current.getDuration();
      if (dur > 0) {
        setDuration(dur);
      }
    }
  }, []);

  const handlePlayerStateChange = useCallback(
    (state: number) => {
      // YouTube Player States: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
      if (state === 1) {
        setIsPlaying(true);
      } else if (state === 2 || state === 0) {
        setIsPlaying(false);
        showSlider(); // Show slider when paused or ended

        // Auto-advance to next video when current video ends (state 0)
        if (state === 0) {
          // Use a small delay to ensure state is properly updated
          setTimeout(() => {
            navigateVideo(1, true); // Navigate down with circular navigation
          }, 500);
        }
      }
    },
    [showSlider, navigateVideo],
  );

  return (
    <div className="relative w-full max-w-5xl flex flex-col justify-center overflow-hidden bg-black tv-container-height landscape:pt-0 pt-10">
      {/* Header */}
      <div className="flex flex-col px-4 py-2 bg-gradient-to-b from-black/80 to-transparent z-50 shrink-0 landscape:hidden">
        <div className="flex justify-between items-baseline mb-2">
          <div className="flex flex-col items-start">
            <h2 className="!text-lg">{currentVideo?.eventTitle}</h2>
            {currentVideo?.eventDate && <p>{currentVideo.eventDate}</p>}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsInfoDialogOpen(true)}
              className="text-white hover:bg-white/20"
              aria-label="Video information"
            >
              <Info className="h-5 w-5" />
            </Button>
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
        </div>
        <div className="flex justify-between gap-2">
          {currentVideo?.video.styles &&
            currentVideo?.video.styles.map((style) => (
              <StyleBadge key={style} style={style} />
            ))}
        </div>
      </div>

      {/* React Animation Overlay - Outside SwiperSlide when not in landscape */}
      {currentVideo && !isLandscape && isMobile && (
        <ReactAnimation
          reacts={sortedReacts}
          currentTime={currentTime}
          videoContainerRef={videoContainerRef as any}
          isPlaying={isPlaying}
          animationType="slide"
          useLargeEmojis={useLargeEmojis}
        />
      )}

      {/* Main Content Area - Flex layout */}
      <div className="flex-1 flex flex-col items-center min-h-0 relative z-30">
        <div className="w-full">
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
            touchEventsTarget="container"
            allowTouchMove={true}
            simulateTouch={true}
            touchStartPreventDefault={false}
            touchReleaseOnEdges={true}
            className="w-full aspect-video"
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
                    touchEventsTarget="container"
                    allowTouchMove={true}
                    simulateTouch={true}
                    touchStartPreventDefault={false}
                    touchReleaseOnEdges={true}
                    className="w-full h-full"
                    speed={300}
                  >
                    {videos.map((video, videoIdx) => {
                      // Only render VideoPlayer for the current video to enable lazy loading
                      const isCurrentVideo =
                        currentVideo && currentVideo.video.id === video.id;
                      return (
                        <SwiperSlide key={video.id} className="relative">
                          {isCurrentVideo ? (
                            <>
                              <div
                                ref={videoContainerRef}
                                className="relative w-full aspect-video"
                              >
                                <VideoPlayer
                                  ref={playerRef}
                                  videoId={currentVideo.video.src}
                                  autoplay={true}
                                  muted={true}
                                  onReady={handlePlayerReady}
                                  onStateChange={handlePlayerStateChange}
                                  className="w-full aspect-video"
                                />
                              </div>

                              {/* Tap interaction overlay */}
                              <div
                                className="absolute inset-0 z-10"
                                onTouchStart={showSlider}
                                onMouseDown={showSlider}
                                onClick={(e) => {
                                  showSlider();
                                  togglePlayPause();
                                }}
                              />

                              {/* Video Title - Overlay on top */}
                              <h3
                                className={`absolute top-2 left-0 right-0 text-center z-30 pointer-events-none transition-opacity duration-700 py-2 ${
                                  isSliderVisible ? "opacity-100" : "opacity-0"
                                }`}
                              >
                                <a
                                  href={currentVideo.video.src}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-white hover:text-primary-light underline transition-colors pointer-events-auto font-bold"
                                >
                                  {currentVideo.video.title}
                                </a>
                                <br />
                                <span className="!text-sm no-underline">
                                  {currentVideo?.bracket &&
                                    currentVideo.bracket.title}
                                </span>
                              </h3>

                              {/* Timeline Slider - Overlay on video */}
                              <div
                                className={`absolute bottom-0 left-0 right-0 px-4 pb-4 flex items-center gap-3 pointer-events-none transition-opacity duration-700 z-20 landscape:mx-10 ${
                                  isSliderVisible ? "opacity-100" : "opacity-0"
                                }`}
                              >
                                <span className="text-white text-xs font-mono min-w-[3.5rem] text-right tabular-nums pointer-events-auto">
                                  {formatTime(clampedTime)}
                                </span>
                                <div className="flex-1 pointer-events-auto">
                                  <Slider
                                    value={sliderValue}
                                    min={0}
                                    max={maxValue}
                                    step={0.1}
                                    onValueChange={handleSeek}
                                    disabled={duration === 0}
                                  />
                                </div>
                                <span className="text-white text-xs font-mono min-w-[3.5rem] tabular-nums pointer-events-auto">
                                  {formatTime(duration)}
                                </span>
                              </div>

                              {/* React Animation Overlay - Inside SwiperSlide when in landscape */}
                              {(isLandscape || !isMobile) && (
                                <ReactAnimation
                                  reacts={sortedReacts}
                                  currentTime={currentTime}
                                  videoContainerRef={videoContainerRef as any}
                                  isPlaying={isPlaying}
                                  animationType="pop"
                                  useLargeEmojis={useLargeEmojis}
                                />
                              )}
                            </>
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
        </div>

        {/* Controls */}
        <div className="w-full pb-4 flex flex-col gap-2 landscape:hidden">
          <VideoControls
            onUp={() => navigateVideo(-1)}
            onDown={() => navigateVideo(1)}
            onLeft={() => navigateSection(-1)}
            onRight={() => navigateSection(1)}
            onPlayPause={togglePlayPause}
            onMuteToggle={toggleMute}
            onRewind={handleRewind}
            onFastForward={handleFastForward}
            onRestart={handleRestart}
            isPlaying={isPlaying}
            isMuted={isMuted}
            videoId={currentVideo?.video.id}
            currentTime={currentTime}
            onReact={handleReact}
            userReacts={userReacts}
            onReset={handleReset}
          />
          {/* Video Reacts - Below controls on mobile (only on very small screens) */}
          {currentVideo && isMobile && (
            <div className="sm:hidden">
              <VideoReacts
                videoId={currentVideo.video.id}
                currentTime={currentTime}
                onReact={handleReact}
                userReacts={userReacts}
                onReset={handleReset}
              />
            </div>
          )}
        </div>
      </div>

      {/* Info Button - Top right on landscape only */}
      <div className="absolute top-3 right-3 z-40 hidden landscape:block">
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

      {/* Mute Link - Bottom right on landscape only */}
      <div className="absolute bottom-3 right-3 z-40 hidden landscape:block">
        <button
          onClick={toggleMute}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX className="h-6 w-6 text-red-400 hover:text-red-300 transition-colors" />
          ) : (
            <Volume2 className="h-6 w-6 text-purple-400 hover:text-purple-300 transition-colors" />
          )}
        </button>
      </div>

      {/* Video Reacts - Left side in landscape */}
      {currentVideo && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-40 hidden landscape:block">
          <VideoReacts
            videoId={currentVideo.video.id}
            currentTime={currentTime}
            onReact={handleReact}
            userReacts={userReacts}
            onReset={handleReset}
          />
        </div>
      )}

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
          city={currentVideo.city}
          eventDate={currentVideo.eventDate}
        />
      )}
    </div>
  );
}
