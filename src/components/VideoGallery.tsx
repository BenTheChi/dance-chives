"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { VideoPlayer, VideoPlayerRef } from "@/components/watch/VideoPlayer";
import { VideoControls } from "@/components/watch/VideoControls";
import { VideoInfoDialog } from "@/components/watch/VideoInfoDialog";
import { VideoReacts } from "@/components/watch/VideoReacts";
import { Button } from "@/components/ui/button";
import { ReactAnimation } from "@/components/watch/ReactAnimation";
import { Section, Bracket } from "@/types/event";
import { Video } from "@/types/video";
import { UserSearchItem } from "@/types/user";
import { Info, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { StyleBadge } from "@/components/ui/style-badge";
import { cn } from "@/lib/utils";

interface VideoGalleryProps {
  initialSections: Array<{
    section: Section;
    eventId: string;
    eventTitle: string;
    bracket?: Bracket;
    city?: string;
    eventDate?: string; // Formatted as "Mar 2026"
  }>;
  eventId?: string; // If provided, enables URL routing
  enableUrlRouting?: boolean; // Only true for event-specific views
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

export function VideoGallery({
  initialSections,
  eventId,
  enableUrlRouting = false,
}: VideoGalleryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoIdFromUrl = enableUrlRouting ? searchParams.get("video") : null;

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

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted for first video to comply with autoplay policies
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSliderVisible, setIsSliderVisible] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  const lastAutoplayedVideoRef = useRef<string | null>(null);
  const sliderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const hasInitializedFromUrlRef = useRef(false);
  const hasPlayedFirstVideoRef = useRef(false);

  const playerRef = useRef<VideoPlayerRef>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // React state management
  const { data: session } = useSession();
  const [showReacts, setShowReacts] = useState(true); // true = shows reacts (OFF state), false = hides reacts (ON state)
  const [videoReacts, setVideoReacts] = useState<
    Map<
      string,
      Array<{
        userId: string;
        fire: number;
        clap: number;
        wow: number;
        laugh: number;
      }>
    >
  >(new Map());
  const triggeredReacts = useRef<Map<string, Set<string>>>(new Map());

  const MAX_CACHED_VIDEOS = 10;

  // Helper function to check if video exists in current event's sections
  const videoExistsInEvent = useCallback(
    (videoId: string): { sectionIndex: number; videoIndex: number } | null => {
      if (!eventId) return null;

      for (let sectionIdx = 0; sectionIdx < sections.length; sectionIdx++) {
        const section = sections[sectionIdx];
        if (section.eventId !== eventId) continue;

        const videoIdx = section.section.videos.findIndex(
          (v) => v.id === videoId
        );
        if (videoIdx !== -1) {
          return { sectionIndex: sectionIdx, videoIndex: videoIdx };
        }
      }
      return null;
    },
    [sections, eventId]
  );

  // Initialize from URL parameter on mount
  useEffect(() => {
    if (
      !enableUrlRouting ||
      !videoIdFromUrl ||
      hasInitializedFromUrlRef.current ||
      !eventId
    ) {
      return;
    }

    const videoLocation = videoExistsInEvent(videoIdFromUrl);
    if (videoLocation) {
      // Set indexes
      setCurrentSectionIndex(videoLocation.sectionIndex);
      setCurrentVideoIndex((prev) => {
        const newMap = new Map(prev);
        newMap.set(videoLocation.sectionIndex, videoLocation.videoIndex);
        return newMap;
      });

      // State is already set above, just need to load the video
      setTimeout(() => {
        const section = sections[videoLocation.sectionIndex];
        if (
          section &&
          section.section.videos.length > videoLocation.videoIndex
        ) {
          const video = section.section.videos[videoLocation.videoIndex];
          if (video && playerRef.current) {
            playerRef.current.loadVideoById(video.src);
          }
        }
      }, 100);

      hasInitializedFromUrlRef.current = true;
    } else {
      // Video not found, fallback to first video
      console.warn(
        `Video ${videoIdFromUrl} not found in event ${eventId}, falling back to first video`
      );
      hasInitializedFromUrlRef.current = true;
    }
  }, [enableUrlRouting, videoIdFromUrl, eventId, videoExistsInEvent]);

  // Clamp currentTime to valid range and ensure slider value is always valid
  const clampedTime = Math.max(
    0,
    Math.min(currentTime, duration > 0 ? duration : currentTime)
  );

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

  // Optimistically remove user from video when tag is removed
  // Note: removeTagFromVideo removes all roles, so we remove from all arrays
  const handleVideoRemove = useCallback(
    (videoId: string, userId: string, role: string) => {
      setSections((prevSections) => {
        return prevSections.map((sectionData) => {
          const updatedVideos = sectionData.section.videos.map((video) => {
            if (video.id === videoId) {
              const updatedVideo = { ...video };

              // Remove user from all role arrays (since removeTagFromVideo removes all roles)
              const filterUser = (user: UserSearchItem) =>
                user.id !== userId &&
                user.username !== userId &&
                (user.id || user.username) !== userId;

              updatedVideo.taggedDancers = (
                updatedVideo.taggedDancers || []
              ).filter(filterUser);
              updatedVideo.taggedWinners = (
                updatedVideo.taggedWinners || []
              ).filter(filterUser);
              updatedVideo.taggedChoreographers = (
                updatedVideo.taggedChoreographers || []
              ).filter(filterUser);
              updatedVideo.taggedTeachers = (
                updatedVideo.taggedTeachers || []
              ).filter(filterUser);

              return updatedVideo;
            }
            return video;
          });

          return {
            ...sectionData,
            section: {
              ...sectionData.section,
              videos: updatedVideos,
            },
          };
        });
      });
    },
    []
  );

  // Optimistically update video when users are tagged
  const handleVideoUpdate = useCallback(
    (videoId: string, role: string, users: UserSearchItem[]) => {
      setSections((prevSections) => {
        return prevSections.map((sectionData) => {
          const updatedVideos = sectionData.section.videos.map((video) => {
            if (video.id === videoId) {
              // Create updated video with new tagged users
              const updatedVideo = { ...video };

              // Determine which array to update based on role
              if (role === "Dancer") {
                const existingDancers = updatedVideo.taggedDancers || [];
                const newDancers = users.filter(
                  (user) =>
                    !existingDancers.some(
                      (d) =>
                        (d.id && d.id === user.id) ||
                        d.username === user.username
                    )
                );
                updatedVideo.taggedDancers = [
                  ...existingDancers,
                  ...newDancers,
                ];
              } else if (role === "Winner") {
                const existingWinners = updatedVideo.taggedWinners || [];
                const newWinners = users.filter(
                  (user) =>
                    !existingWinners.some(
                      (w) =>
                        (w.id && w.id === user.id) ||
                        w.username === user.username
                    )
                );
                updatedVideo.taggedWinners = [
                  ...existingWinners,
                  ...newWinners,
                ];
              } else if (role === "Choreographer") {
                const existingChoreographers =
                  updatedVideo.taggedChoreographers || [];
                const newChoreographers = users.filter(
                  (user) =>
                    !existingChoreographers.some(
                      (c) =>
                        (c.id && c.id === user.id) ||
                        c.username === user.username
                    )
                );
                updatedVideo.taggedChoreographers = [
                  ...existingChoreographers,
                  ...newChoreographers,
                ];
              } else if (role === "Teacher") {
                const existingTeachers = updatedVideo.taggedTeachers || [];
                const newTeachers = users.filter(
                  (user) =>
                    !existingTeachers.some(
                      (t) =>
                        (t.id && t.id === user.id) ||
                        t.username === user.username
                    )
                );
                updatedVideo.taggedTeachers = [
                  ...existingTeachers,
                  ...newTeachers,
                ];
              }

              return updatedVideo;
            }
            return video;
          });

          return {
            ...sectionData,
            section: {
              ...sectionData.section,
              videos: updatedVideos,
            },
          };
        });
      });
    },
    []
  );

  // Calculate navigation disabled states
  const canNavigateLeft = currentSectionIndex > 0;
  const canNavigateRight = currentSectionIndex < sections.length - 1;
  const currentSection = sections[currentSectionIndex];
  const currentVideoCount = currentSection?.section.videos.length || 0;
  // Disable up/down only if there's only 1 video (looping works for 2+)
  const canNavigateUp = currentVideoCount > 1;
  const canNavigateDown = currentVideoCount > 1;

  // Update URL when video changes (if URL routing is enabled)
  useEffect(() => {
    if (
      !enableUrlRouting ||
      !eventId ||
      !currentVideo ||
      !hasInitializedFromUrlRef.current
    ) {
      return;
    }

    // Validate video belongs to current event
    const videoLocation = videoExistsInEvent(currentVideo.video.id);
    if (videoLocation && videoLocation.sectionIndex === currentSectionIndex) {
      router.replace(`/watch/${eventId}?video=${currentVideo.video.id}`, {
        scroll: false,
      });
    }
  }, [
    enableUrlRouting,
    eventId,
    currentVideo?.video.id,
    currentSectionIndex,
    router,
    videoExistsInEvent,
  ]);

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
      laugh: userReact.laugh,
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
      if (react.laugh > 0) {
        reactItems.push({
          type: "laugh",
          timestamp: react.laugh,
          id: `${react.userId}-laugh`,
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
      const response = await fetch(`/api/watch/videos/${videoId}/reacts`, {
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
          (r) => r.userId === userId
        );

        if (existingUserReact) {
          const updatedReacts = existingReacts.map((r) =>
            r.userId === userId ? { ...r, [type]: timestamp } : r
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
              laugh: type === "laugh" ? timestamp : 0,
            },
          ]);
        }

        return newMap;
      });

      // Fire and forget API call
      fetch(`/api/watch/videos/${videoId}/reacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, timestamp }),
      }).catch((error) => {
        console.error("Error saving react:", error);
      });
    },
    [currentVideo, session?.user?.id]
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
        r.userId === userId ? { ...r, fire: 0, clap: 0, wow: 0, laugh: 0 } : r
      );
      newMap.set(videoId, updatedReacts);
      return newMap;
    });

    // Fire and forget API call
    fetch(`/api/watch/videos/${videoId}/reacts`, {
      method: "DELETE",
    }).catch((error) => {
      console.error("Error resetting react:", error);
    });
  }, [currentVideo, session?.user?.id]);

  // Load more sections when near bottom (only for multi-event view)
  const loadMoreSections = useCallback(async () => {
    if (isLoadingMore || enableUrlRouting) return; // Don't load more for event-specific view
    setIsLoadingMore(true);

    try {
      const response = await fetch(
        `/api/watch/sections?offset=${allLoadedSections.length}&limit=10`
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
  }, [allLoadedSections.length, isLoadingMore, enableUrlRouting]);

  // Handle section change - called when section index changes
  const handleSectionChange = useCallback(
    (newIndex: number) => {
      showSlider(); // Show slider when navigating

      // Load more if near end (only for multi-event view)
      if (!enableUrlRouting && newIndex >= sections.length - 3) {
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
          // Always autoplay after manual navigation
          setTimeout(() => {
            if (playerRef.current) {
              // Apply mute state after player is ready
              if (isMuted) {
                playerRef.current.mute();
              } else {
                playerRef.current.unmute();
              }
              playerRef.current.playVideo();
              setIsPlaying(true);
              lastAutoplayedVideoRef.current = video.id;
            }
          }, 300);
        }
      }
    },
    [
      sections,
      currentVideoIndex,
      loadMoreSections,
      showSlider,
      enableUrlRouting,
      isMuted,
    ]
  );

  // Handle video change - called when video index changes
  const handleVideoChange = useCallback(
    (sectionIndex: number, newVideoIndex: number) => {
      showSlider(); // Show slider when navigating

      const section = sections[sectionIndex];
      if (section && section.section.videos.length > newVideoIndex) {
        const video = section.section.videos[newVideoIndex];
        if (video && playerRef.current) {
          // Validate video belongs to event if URL routing is enabled
          if (enableUrlRouting && eventId) {
            const videoLocation = videoExistsInEvent(video.id);
            if (!videoLocation || videoLocation.sectionIndex !== sectionIndex) {
              // Video doesn't belong to this event, prevent navigation
              console.warn(
                `Video ${video.id} does not belong to event ${eventId}`
              );
              return;
            }
          }

          playerRef.current.loadVideoById(video.src);
          // Always autoplay after manual navigation
          // Apply mute state after a short delay
          setTimeout(() => {
            if (playerRef.current) {
              if (isMuted) {
                playerRef.current.mute();
              } else {
                playerRef.current.unmute();
              }
              playerRef.current.playVideo();
              setIsPlaying(true);
              lastAutoplayedVideoRef.current = video.id;
            }
          }, 100);
        }
      }
    },
    [
      sections,
      showSlider,
      enableUrlRouting,
      eventId,
      videoExistsInEvent,
      isMuted,
    ]
  );

  // Track previous values to avoid unnecessary calls
  const prevSectionIndexRef = useRef(currentSectionIndex);
  const prevVideoIndexRef = useRef<Map<number, number>>(new Map());

  // Effect to handle section changes
  useEffect(() => {
    if (prevSectionIndexRef.current !== currentSectionIndex) {
      prevSectionIndexRef.current = currentSectionIndex;
      handleSectionChange(currentSectionIndex);
    }
  }, [currentSectionIndex, handleSectionChange]);

  // Effect to handle video changes
  useEffect(() => {
    const videoIndex = currentVideoIndex.get(currentSectionIndex) ?? 0;
    const prevVideoIndex =
      prevVideoIndexRef.current.get(currentSectionIndex) ?? -1;

    if (
      prevVideoIndex !== videoIndex ||
      prevSectionIndexRef.current !== currentSectionIndex
    ) {
      prevVideoIndexRef.current.set(currentSectionIndex, videoIndex);
      handleVideoChange(currentSectionIndex, videoIndex);
    }
  }, [currentVideoIndex, currentSectionIndex, handleVideoChange]);

  // Navigation functions
  const navigateVideo = useCallback(
    (direction: number, circular: boolean = false) => {
      const section = sections[currentSectionIndex];
      if (!section) return;

      const currentIdx = currentVideoIndex.get(currentSectionIndex) || 0;
      const videos = section.section.videos;
      if (videos.length === 0) return;

      let newIndex: number;
      if (circular) {
        // Circular navigation: wrap around
        newIndex = (currentIdx + direction + videos.length) % videos.length;
      } else {
        // Normal navigation: clamp to bounds
        newIndex = Math.max(
          0,
          Math.min(videos.length - 1, currentIdx + direction)
        );
      }

      setCurrentVideoIndex((prev) => {
        const newMap = new Map(prev);
        newMap.set(currentSectionIndex, newIndex);
        return newMap;
      });
    },
    [sections, currentSectionIndex, currentVideoIndex]
  );

  const navigateSection = useCallback(
    (direction: number) => {
      const newIndex = Math.max(
        0,
        Math.min(sections.length - 1, currentSectionIndex + direction)
      );
      setCurrentSectionIndex(newIndex);
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
          navigateVideo(-1, true);
          break;
        case "ArrowDown":
          e.preventDefault();
          navigateVideo(1, true);
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
  }, [navigateVideo, navigateSection, togglePlayPause, toggleMute]);

  // Auto-play when video enters center - only on first appearance
  useEffect(() => {
    if (currentVideo && playerRef.current) {
      const videoId = currentVideo.video.id;

      // Only autoplay if this video hasn't been autoplayed before
      if (lastAutoplayedVideoRef.current !== videoId) {
        const timer = setTimeout(() => {
          if (playerRef.current && lastAutoplayedVideoRef.current !== videoId) {
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
  }, [currentVideo?.video.id]);

  // Update playing state based on player state
  // Track video time and duration
  useEffect(() => {
    if (!playerRef.current || !currentVideo) return;

    const interval = setInterval(() => {
      if (playerRef.current) {
        try {
          const time = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          const muted = playerRef.current.isMuted();

          // Only update if we have valid values
          if (time >= 0 && isFinite(time) && !isNaN(time)) {
            setCurrentTime(time);
          }
          if (dur > 0 && isFinite(dur) && !isNaN(dur)) {
            setDuration(dur);
          }

          if (!playerRef.current.isLoading()) {
            // Sync mute state with actual player state
            setIsMuted(muted);
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
      "(orientation: landscape) and (max-height: 500px)"
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
          navigator.userAgent
        ) || width < 768;
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Calculate if emojis should be large: width > sm breakpoint (640px) AND not in landscape mode
  const useLargeEmojis = windowWidth > 640 && !isLandscape;

  // Fullscreen handlers
  const toggleFullscreen = useCallback(async () => {
    if (!fullscreenContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await fullscreenContainerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

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
    [showSlider, currentVideo?.video.id]
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
        // Track that first video has played (for autoplay policy compliance)
        if (!hasPlayedFirstVideoRef.current) {
          hasPlayedFirstVideoRef.current = true;
        }
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
    [showSlider, navigateVideo]
  );

  return (
    <div
      ref={fullscreenContainerRef}
      className={cn(
        "relative w-full flex flex-col justify-center overflow-hidden bg-black tv-container-height landscape:pt-0",
        !isFullscreen && "max-w-[1200px]",
        isFullscreen && "w-screen h-screen max-w-none"
      )}
    >
      {/* Header */}
      <div
        className={`flex flex-col px-4 z-50 mb-2 landscape:hidden ${
          isFullscreen ? "hidden" : ""
        }`}
      >
        <div className="flex justify-between items-baseline pt-2">
          <div className="flex flex-col items-start gap-2">
            {currentVideo && (
              <div className="!text-[14px] sm:!text-[16px] flex flex-col sm:flex-row items-baseline gap-1 sm:gap-8">
                <Link
                  href={`/events/${currentVideo.eventId}`}
                  className="hover:underline font-bold leading-tight"
                >
                  {currentVideo.eventTitle}
                </Link>
                <Link
                  href={`/events/${currentVideo.eventId}/sections/${currentVideo.section.id}`}
                  className="hover:underline"
                >
                  {currentVideo.section.title}
                </Link>
                {currentVideo && (
                  <div className="gap-1 items-center justify-between hidden sm:flex">
                    <div className="flex items-baseline gap-1">
                      {currentVideo.bracket?.title && (
                        <p className="!text-[16px]">
                          {currentVideo.bracket.title} -
                        </p>
                      )}
                      <p className="!text-[16px]">{currentVideo.video.title}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {(() => {
              // Determine styles to display based on section.applyStylesToVideos
              const displayStyles =
                currentVideo?.section.applyStylesToVideos &&
                currentVideo?.section.styles &&
                currentVideo.section.styles.length > 0
                  ? currentVideo.section.styles
                  : currentVideo?.video.styles || [];

              return displayStyles.length > 0 ? (
                <div className="flex justify-between gap-2 opacity-70 sm:mb-4">
                  {displayStyles.map((style) => (
                    <StyleBadge key={style} style={style} asLink={false} />
                  ))}
                </div>
              ) : null;
            })()}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 items-end gap-1">
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
      </div>

      {/* Section Name, Bracket, and Video Title - 80px space below header, only when not playing or loading */}
      <div
        className={`h-[80px] px-4 flex items-center justify-center z-50 landscape:hidden sm:hidden ${
          isPlaying && !isVideoLoading ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex justify-center items-baseline gap-3">
          {currentVideo && (
            <div className="flex items-baseline gap-1">
              {currentVideo.bracket?.title && (
                <p className="!text-[16px]">{currentVideo.bracket.title} -</p>
              )}
              <p className="!text-[16px]">{currentVideo.video.title}</p>
            </div>
          )}
        </div>
      </div>

      {/* React Animation Overlay - Outside video container when not in landscape */}
      {currentVideo && !isLandscape && isMobile && showReacts && (
        <ReactAnimation
          reacts={sortedReacts}
          currentTime={currentTime}
          videoContainerRef={videoContainerRef as any}
          isPlaying={isPlaying}
          useLargeEmojis={useLargeEmojis}
          minYPercent={0.3}
          maxYPercent={0.6}
        />
      )}

      {/* Main Content Area - Flex layout */}
      <div
        className={cn(
          "flex flex-col items-center relative z-30",
          isFullscreen ? "flex-1 h-full" : "flex-1"
        )}
      >
        <div
          className={cn(
            "w-full relative overflow-hidden",
            isFullscreen ? "h-full flex-1" : "aspect-video"
          )}
        >
          {/* Sections Container - Horizontal */}
          <div
            className="w-full h-full flex transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(-${currentSectionIndex * 100}%)`,
            }}
          >
            {sections.map((sectionData, sectionIdx) => {
              const videos = sectionData.section.videos;
              if (videos.length === 0) return null;

              const currentVideoIdx = currentVideoIndex.get(sectionIdx) ?? 0;

              return (
                <div
                  key={sectionData.section.id}
                  className="flex-shrink-0 w-full h-full flex items-center justify-center"
                >
                  {/* Videos Container - Vertical */}
                  <div
                    className="w-full h-full flex flex-col transition-transform duration-300 ease-in-out"
                    style={{
                      transform: `translateY(-${currentVideoIdx * 100}%)`,
                    }}
                  >
                    {videos.map((video, videoIdx) => {
                      // Only render VideoPlayer for the current video to enable lazy loading
                      const isCurrentVideo =
                        currentVideo &&
                        currentVideo.video.id === video.id &&
                        sectionIdx === currentSectionIndex &&
                        videoIdx === currentVideoIdx;
                      return (
                        <div
                          key={video.id}
                          className="flex-shrink-0 w-full h-full relative"
                        >
                          {isCurrentVideo ? (
                            <>
                              <div
                                ref={videoContainerRef}
                                className="relative w-full h-full"
                              >
                                <VideoPlayer
                                  ref={playerRef}
                                  videoId={currentVideo.video.src}
                                  autoplay={true}
                                  muted={isMuted}
                                  onReady={handlePlayerReady}
                                  onStateChange={handlePlayerStateChange}
                                  className="w-full h-full"
                                />
                              </div>

                              {/* React Animation Overlay - Inside when in landscape or fullscreen */}
                              {(isLandscape || !isMobile || isFullscreen) &&
                                showReacts && (
                                  <ReactAnimation
                                    reacts={sortedReacts}
                                    currentTime={currentTime}
                                    videoContainerRef={videoContainerRef as any}
                                    isPlaying={isPlaying}
                                    useLargeEmojis={useLargeEmojis}
                                  />
                                )}
                            </>
                          ) : (
                            <div className="w-full h-full bg-black flex items-center justify-center">
                              <p className="text-white text-sm opacity-50">
                                {video.title}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div
          className={`w-full pb-4 flex flex-col gap-1 ${
            isFullscreen ? "hidden" : "landscape:hidden"
          }`}
        >
          <VideoControls
            onUp={() => navigateVideo(-1, true)}
            onDown={() => navigateVideo(1, true)}
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
            showReacts={showReacts}
            onToggleReacts={() => setShowReacts(!showReacts)}
            onToggleFullscreen={toggleFullscreen}
            isFullscreen={isFullscreen}
            showFullscreenButton={!isMobile && !isLandscape}
            canNavigateLeft={canNavigateLeft}
            canNavigateRight={canNavigateRight}
            canNavigateUp={canNavigateUp}
            canNavigateDown={canNavigateDown}
            isMobile={isMobile}
            isLandscape={isLandscape}
            showMobileNavigation={isMobile}
            showLandscapeNavigation={false}
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
                showReacts={showReacts}
                onToggleReacts={() => setShowReacts(!showReacts)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Info Button and Landscape Navigation - Top right on landscape and fullscreen */}
      <div
        className={`absolute top-1/3 -translate-y-1/3 right-3 z-40 flex flex-col items-end gap-3 ${
          isFullscreen ? "block" : "hidden landscape:block"
        }`}
      >
        <div
          className={cn(
            "flex flex-col items-center gap-3 rounded-lg p-2",
            isFullscreen && "gap-6 p-4"
          )}
        >
          {isFullscreen ? (
            <button
              onClick={() => setIsInfoDialogOpen(true)}
              className="h-24 w-24 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center text-white"
              aria-label="Video information"
            >
              <Info className="size-10" />
            </button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsInfoDialogOpen(true)}
              className="text-white hover:bg-white/20"
              aria-label="Video information"
            >
              <Info />
            </Button>
          )}
          <VideoControls
            onUp={() => navigateVideo(-1, true)}
            onDown={() => navigateVideo(1, true)}
            onLeft={() => navigateSection(-1)}
            onRight={() => navigateSection(1)}
            onPlayPause={togglePlayPause}
            onMuteToggle={toggleMute}
            onRewind={handleRewind}
            onFastForward={handleFastForward}
            onRestart={handleRestart}
            isPlaying={isPlaying}
            isMuted={isMuted}
            onToggleFullscreen={toggleFullscreen}
            isFullscreen={isFullscreen}
            canNavigateLeft={canNavigateLeft}
            canNavigateRight={canNavigateRight}
            canNavigateUp={canNavigateUp}
            canNavigateDown={canNavigateDown}
            isMobile={isMobile}
            isLandscape={isLandscape}
            showMobileNavigation={false}
            showLandscapeNavigation={true}
          />
        </div>
      </div>

      {/* Video Reacts - Left side in landscape and fullscreen */}
      {currentVideo && !(isLandscape && !isPlaying) && (
        <div
          className={`absolute top-1/3 -translate-y-1/3 left-3 z-40 ${
            isFullscreen ? "block" : "hidden landscape:block"
          }`}
        >
          <VideoReacts
            videoId={currentVideo.video.id}
            currentTime={currentTime}
            onReact={handleReact}
            userReacts={userReacts}
            onReset={handleReset}
            showReacts={showReacts}
            onToggleReacts={() => setShowReacts(!showReacts)}
            isFullscreen={isFullscreen}
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
          container={isFullscreen ? fullscreenContainerRef.current : undefined}
          onVideoUpdate={handleVideoUpdate}
          onVideoRemove={handleVideoRemove}
        />
      )}
    </div>
  );
}
