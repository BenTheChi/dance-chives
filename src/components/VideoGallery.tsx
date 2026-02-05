"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { VideoPlayer, VideoPlayerRef } from "@/components/watch/VideoPlayer";
import { VideoControls } from "@/components/watch/VideoControls";
import { VideoInfoDialog } from "@/components/watch/VideoInfoDialog";
import { VideoReacts } from "@/components/watch/VideoReacts";
import { Button } from "@/components/ui/button";
import { ReactAnimation } from "@/components/watch/ReactAnimation";
import { Section, Bracket, CombinedSectionPayload } from "@/types/event";
import { Video } from "@/types/video";
import { UserSearchItem } from "@/types/user";
import { Info } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { StyleBadge } from "@/components/ui/style-badge";
import { cn } from "@/lib/utils";
import { VideoFilterDialog } from "@/components/watch/VideoFilterDialog";
import { DEFAULT_VIDEO_FILTERS } from "@/types/video-filter";
import { filtersAreEqual } from "@/lib/utils/video-filters";
import { useVideoFilters } from "../hooks/use-video-filters";
import { useWatchSections } from "@/hooks/use-watch-sections";

interface VideoGalleryProps {
  /** Server returns one full section per item (brackets already combined) */
  initialSections: CombinedSectionPayload[];
  eventId?: string; // If provided, enables URL routing
  enableUrlRouting?: boolean; // Only true for event-specific views
  /** Filter options from server (multi-event view). Omit or pass [] for event-specific view. */
  availableCities?: string[];
  availableStyles?: string[];
}

// Client-side shape: payload + Map for bracket lookup per video
interface CombinedSectionData {
  section: Section;
  eventId: string;
  eventTitle: string;
  city?: string;
  eventDate?: string; // Formatted as "Mar 2026"
  videoToBracketMap: Map<string, Bracket>;
}

function payloadToCombinedSectionData(
  payload: CombinedSectionPayload
): CombinedSectionData {
  const videoToBracketMap = new Map<string, Bracket>();
  for (const { videoId, bracket } of payload.videoToBracket ?? []) {
    videoToBracketMap.set(videoId, bracket);
  }
  return {
    section: payload.section,
    eventId: payload.eventId,
    eventTitle: payload.eventTitle,
    city: payload.city,
    eventDate: payload.eventDate,
    videoToBracketMap,
  };
}

export function VideoGallery({
  initialSections,
  eventId,
  enableUrlRouting = false,
  availableCities = [],
  availableStyles = [],
}: VideoGalleryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoIdFromUrl = enableUrlRouting ? searchParams.get("video") : null;

  const { filters, applyFilters, saveFilters, clearFilters, isSaving } =
    useVideoFilters({ enableUrlRouting });
  const useInitialData =
    !enableUrlRouting && filtersAreEqual(filters, DEFAULT_VIDEO_FILTERS);
  const {
    sections: sectionPayloads,
    isLoadingMore,
    loadMore,
  } = useWatchSections(filters, {
    initialSections,
    useInitialData,
    disabled: enableUrlRouting,
  });

  // Server sends one full section per item; build Map for bracket display per video
  const [sections, setSections] = useState<CombinedSectionData[]>(() =>
    initialSections.map(payloadToCombinedSectionData)
  );

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<
    Map<number, number>
  >(new Map());

  useEffect(() => {
    const payloads = enableUrlRouting ? initialSections : sectionPayloads;
    const combined = payloads.map(payloadToCombinedSectionData);
    setSections(combined);
    setCurrentSectionIndex((prev) =>
      Math.min(prev, Math.max(0, combined.length - 1))
    );
  }, [enableUrlRouting, initialSections, sectionPayloads]);

  useEffect(() => {
    if (enableUrlRouting) return;
    setCurrentSectionIndex(0);
    setCurrentVideoIndex(new Map());
  }, [enableUrlRouting, filters]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted for first video to comply with autoplay policies
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  const lastAutoplayedVideoRef = useRef<string | null>(null);
  const sliderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const isMutedRef = useRef(isMuted);
  const hasInitializedFromUrlRef = useRef(false);
  const hasPlayedFirstVideoRef = useRef(false);

  const playerRef = useRef<VideoPlayerRef>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<CombinedSectionData[]>(sections);
  const currentSectionIndexRef = useRef(currentSectionIndex);
  const currentVideoIndexRef = useRef(currentVideoIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);

  sectionsRef.current = sections;
  currentSectionIndexRef.current = currentSectionIndex;
  currentVideoIndexRef.current = currentVideoIndex;

  // React state management
  const { data: session } = useSession();
  const [showReacts, setShowReacts] = useState(true); // true = shows reacts (OFF state), false = hides reacts (ON state)
  const [videoReacts, setVideoReacts] = useState<
    Map<
      string,
      Array<{
        userId: string;
        fire: number[];
        clap: number[];
        wow: number[];
        laugh: number[];
      }>
    >
  >(new Map());
  /** Anon reactions per video (browsing session). Only used when !session. */
  const [anonReactsByVideo, setAnonReactsByVideo] = useState<
    Map<
      string,
      { fire: number[]; clap: number[]; wow: number[]; laugh: number[] }
    >
  >(new Map());
  const triggeredReacts = useRef<Map<string, Set<string>>>(new Map());

  const MAX_CACHED_VIDEOS = 10;

  const videoExistsInEvent = useCallback(
    (videoId: string): { sectionIndex: number; videoIndex: number } | null => {
      if (!eventId) return null;
      const secs = sectionsRef.current;
      for (let sectionIdx = 0; sectionIdx < secs.length; sectionIdx++) {
        const section = secs[sectionIdx];
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
    [eventId]
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

  const getCurrentVideo = useCallback((): {
    video: Video;
    eventId: string;
    eventTitle: string;
    section: Section;
    bracket?: Bracket;
    city?: string;
    eventDate?: string; // Formatted as "Mar 2026"
  } | null => {
    const secs = sectionsRef.current;
    if (secs.length === 0) return null;
    const section = secs[currentSectionIndex];
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
  }, [currentSectionIndex, currentVideoIndex]);

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
  // Disable right when at end, or when one-before-end and loading more (so we don't jump while list is updating)
  const canNavigateRight =
    currentSectionIndex < sections.length - 1 &&
    !(currentSectionIndex >= sections.length - 2 && isLoadingMore);
  // Show spinner on right arrow when near end and fetching more sections (last or second-to-last)
  const showRightLoading =
    isLoadingMore && currentSectionIndex >= sections.length - 2;
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

  // Memoize user reacts for current video (logged-in user or anon session state)
  const userReacts = useMemo(() => {
    if (!currentVideo) return null;
    const videoId = currentVideo.video.id;
    if (session?.user?.id) {
      const allReacts = videoReacts.get(videoId) || [];
      const userReact = allReacts.find((r) => r.userId === session.user.id);
      if (!userReact) return null;
      return {
        fire: userReact.fire,
        clap: userReact.clap,
        wow: userReact.wow,
        laugh: userReact.laugh,
      };
    }
    return (
      anonReactsByVideo.get(videoId) ?? {
        fire: [],
        clap: [],
        wow: [],
        laugh: [],
      }
    );
  }, [
    videoReacts,
    currentVideo?.video.id,
    session?.user?.id,
    anonReactsByVideo,
  ]);

  // Memoize sorted reacts for current video (for animation triggering). Use local anon state when not logged in so anon reacts play back.
  const sortedReacts = useMemo(() => {
    if (!currentVideo) return [];
    const videoId = currentVideo.video.id;
    let allReacts = videoReacts.get(videoId) || [];
    if (!session?.user?.id && anonReactsByVideo.has(videoId)) {
      const anonPayload = anonReactsByVideo.get(videoId)!;
      allReacts = allReacts.filter((r) => r.userId !== "anon");
      allReacts = [...allReacts, { userId: "anon", ...anonPayload }];
    }
    const reactItems: Array<{ type: string; timestamp: number; id: string }> =
      [];

    for (const react of allReacts) {
      react.fire.forEach((ts, i) =>
        reactItems.push({
          type: "fire",
          timestamp: ts,
          id: `${react.userId}-fire-${i}`,
        })
      );
      react.clap.forEach((ts, i) =>
        reactItems.push({
          type: "clap",
          timestamp: ts,
          id: `${react.userId}-clap-${i}`,
        })
      );
      react.wow.forEach((ts, i) =>
        reactItems.push({
          type: "wow",
          timestamp: ts,
          id: `${react.userId}-wow-${i}`,
        })
      );
      react.laugh.forEach((ts, i) =>
        reactItems.push({
          type: "laugh",
          timestamp: ts,
          id: `${react.userId}-laugh-${i}`,
        })
      );
    }

    return reactItems.sort((a, b) => a.timestamp - b.timestamp);
  }, [
    videoReacts,
    currentVideo?.video.id,
    session?.user?.id,
    anonReactsByVideo,
  ]);

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

  // Under 3 minutes: 2 per emoji; 3 minutes or more: 3 per emoji. Unknown duration defaults to 3. Anon: 1 per emoji, 2 total.
  const maxReactsPerEmoji = session?.user?.id
    ? duration > 0 && duration < 180
      ? 2
      : 3
    : 1;
  const maxTotalReacts = session?.user?.id ? undefined : 2;
  const allowAnon = true;

  // Handle user react: add timestamp to type array (cap by duration/anon), optimistic update, POST full object
  const handleReact = useCallback(
    async (type: string, timestamp: number) => {
      if (!currentVideo) return;

      const videoId = currentVideo.video.id;
      const ts = Number.isFinite(timestamp) ? Math.floor(Number(timestamp)) : 0;
      const safeTs = Math.max(0, ts);

      if (session?.user?.id) {
        const userId = session.user.id;
        setVideoReacts((prev) => {
          const newMap = new Map(prev);
          const existingReacts = newMap.get(videoId) || [];
          const existingUserReact = existingReacts.find(
            (r) => r.userId === userId
          );

          const base = existingUserReact
            ? {
                fire: [...existingUserReact.fire],
                clap: [...existingUserReact.clap],
                wow: [...existingUserReact.wow],
                laugh: [...existingUserReact.laugh],
              }
            : {
                fire: [] as number[],
                clap: [] as number[],
                wow: [] as number[],
                laugh: [] as number[],
              };

          const arr = base[type as keyof typeof base];
          arr.push(safeTs);
          arr.sort((a, b) => a - b);
          base[type as keyof typeof base] = arr.slice(0, maxReactsPerEmoji);

          const updatedReacts = existingUserReact
            ? existingReacts.map((r) =>
                r.userId === userId
                  ? {
                      ...r,
                      fire: base.fire,
                      clap: base.clap,
                      wow: base.wow,
                      laugh: base.laugh,
                    }
                  : r
              )
            : [
                ...existingReacts,
                {
                  userId,
                  fire: base.fire,
                  clap: base.clap,
                  wow: base.wow,
                  laugh: base.laugh,
                },
              ];
          newMap.set(videoId, updatedReacts);

          fetch(`/api/watch/videos/${videoId}/reacts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(base),
          }).catch((error) => {
            console.error("Error saving react:", error);
          });

          return newMap;
        });
      } else {
        // Anon: 1 per emoji, 2 total — use functional updates to read latest state
        setAnonReactsByVideo((prev) => {
          const base = prev.get(videoId) ?? {
            fire: [] as number[],
            clap: [] as number[],
            wow: [] as number[],
            laugh: [] as number[],
          };
          const total =
            base.fire.length +
            base.clap.length +
            base.wow.length +
            base.laugh.length;
          if (total >= 2) return prev;
          const arr = base[type as keyof typeof base];
          if (arr.length >= 1) return prev;
          const next = {
            fire: [...base.fire],
            clap: [...base.clap],
            wow: [...base.wow],
            laugh: [...base.laugh],
          };
          next[type as keyof typeof next].push(safeTs);
          next[type as keyof typeof next].sort((a, b) => a - b);
          const newMap = new Map(prev);
          newMap.set(videoId, next);

          setVideoReacts((vPrev) => {
            const vMap = new Map(vPrev);
            const list = vPrev.get(videoId) || [];
            const rest = list.filter((r) => r.userId !== "anon");
            vMap.set(videoId, [...rest, { userId: "anon", ...next }]);
            return vMap;
          });
          fetch(`/api/watch/videos/${videoId}/reacts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(next),
          }).catch((error) => {
            console.error("Error saving react:", error);
          });

          return newMap;
        });
      }
    },
    [currentVideo, session?.user?.id, maxReactsPerEmoji]
  );

  // Handle reset: optimistic empty arrays, DELETE (batched for logged-in; immediate for anon)
  const handleReset = useCallback(async () => {
    if (!currentVideo) return;

    const videoId = currentVideo.video.id;

    if (session?.user?.id) {
      const userId = session.user.id;
      setVideoReacts((prev) => {
        const newMap = new Map(prev);
        const existingReacts = newMap.get(videoId) || [];
        const updatedReacts = existingReacts.map((r) =>
          r.userId === userId
            ? { ...r, fire: [], clap: [], wow: [], laugh: [] }
            : r
        );
        newMap.set(videoId, updatedReacts);
        return newMap;
      });
    } else {
      setAnonReactsByVideo((prev) => {
        const newMap = new Map(prev);
        newMap.delete(videoId);
        return newMap;
      });
      setVideoReacts((prev) => {
        const newMap = new Map(prev);
        const existingReacts = newMap.get(videoId) || [];
        const updatedReacts = existingReacts.filter((r) => r.userId !== "anon");
        newMap.set(videoId, updatedReacts);
        return newMap;
      });
    }

    fetch(`/api/watch/videos/${videoId}/reacts`, { method: "DELETE" }).catch(
      (error) => console.error("Error resetting react:", error)
    );
  }, [currentVideo, session?.user?.id]);

  const applyMuteFromRef = useCallback(() => {
    if (playerRef.current) {
      if (isMutedRef.current) playerRef.current.mute();
      else playerRef.current.unmute();
    }
  }, []);

  const applyMuteAndPlayAfterLoad = useCallback(
    (videoId: string, delayMs: number) => {
      setTimeout(() => {
        if (playerRef.current) {
          applyMuteFromRef();
          playerRef.current.playVideo();
          setIsPlaying(true);
          lastAutoplayedVideoRef.current = videoId;
        }
      }, delayMs);
    },
    [applyMuteFromRef]
  );

  const handleSectionChange = useCallback(
    (newIndex: number) => {
      const currentSections = sectionsRef.current;
      // Load more if near end (only for multi-event view)
      if (!enableUrlRouting && newIndex >= currentSections.length - 2) {
        loadMore();
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

      // Get the video for this section and index (from ref so we don't depend on sections)
      const section = currentSections[newIndex];
      if (section && section.section.videos.length > 0) {
        const video = section.section.videos[videoIndex];
        if (video && playerRef.current) {
          playerRef.current.loadVideoById(video.src);
          applyMuteAndPlayAfterLoad(video.id, 300);
        }
      }
    },
    [currentVideoIndex, loadMore, enableUrlRouting, applyMuteAndPlayAfterLoad]
  );

  const handleVideoChange = useCallback(
    (sectionIndex: number, newVideoIndex: number) => {
      const currentSections = sectionsRef.current;
      const section = currentSections[sectionIndex];
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
          applyMuteAndPlayAfterLoad(video.id, 100);
        }
      }
    },
    [enableUrlRouting, eventId, videoExistsInEvent, applyMuteAndPlayAfterLoad]
  );

  const navigateVideo = useCallback(
    (direction: number, circular: boolean = false) => {
      const currentSections = sectionsRef.current;
      const sectionIdx = currentSectionIndexRef.current;
      const section = currentSections[sectionIdx];
      if (!section) return;

      const videoIndexMap = currentVideoIndexRef.current;
      const currentIdx = videoIndexMap.get(sectionIdx) || 0;
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
        newMap.set(sectionIdx, newIndex);
        return newMap;
      });
      handleVideoChange(sectionIdx, newIndex);
    },
    [handleVideoChange]
  );

  const navigateSection = useCallback(
    (direction: number) => {
      const newIndex = Math.max(
        0,
        Math.min(sections.length - 1, currentSectionIndex + direction)
      );
      setCurrentSectionIndex(newIndex);
      handleSectionChange(newIndex);
    },
    [sections.length, currentSectionIndex, handleSectionChange]
  );

  const togglePlayPause = useCallback(() => {
    if (!playerRef.current) return;
    const state = playerRef.current.getPlayerState();
    if (state === 1) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }, []);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unmute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  }, [isMuted]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
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

  useEffect(() => {
    if (!currentVideo || !playerRef.current) return;
    const videoId = currentVideo.video.id;
    if (lastAutoplayedVideoRef.current === videoId) return;
    const timer = setTimeout(() => {
      if (playerRef.current && lastAutoplayedVideoRef.current !== videoId) {
        playerRef.current.playVideo();
        setIsPlaying(true);
        lastAutoplayedVideoRef.current = videoId;
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [currentVideo?.video.id]);

  useEffect(() => {
    if (!playerRef.current || !currentVideo) {
      setIsVideoLoading(false);
      return;
    }
    const interval = setInterval(() => {
      if (!playerRef.current) return;
      try {
        const time = playerRef.current.getCurrentTime();
        const dur = playerRef.current.getDuration();
        const muted = playerRef.current.isMuted();
        const loading = playerRef.current.isLoading();
        if (time >= 0 && isFinite(time) && !isNaN(time)) setCurrentTime(time);
        if (dur > 0 && isFinite(dur) && !isNaN(dur)) setDuration(dur);
        if (!loading) setIsMuted(muted);
        setIsVideoLoading(loading);
      } catch {
        // Player may not be ready
      }
    }, 250);
    return () => clearInterval(interval);
  }, [currentVideo?.video.id]);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
  }, [currentVideo?.video.id]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    if (sliderTimeoutRef.current) {
      clearTimeout(sliderTimeoutRef.current);
      sliderTimeoutRef.current = null;
    }
    return () => {
      if (sliderTimeoutRef.current) clearTimeout(sliderTimeoutRef.current);
    };
  }, [isPlaying, isVideoLoading]);

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

  const handleRewind = useCallback(() => {
    if (!playerRef.current) return;
    const t = Math.max(0, currentTime - 10);
    playerRef.current.seekTo(t);
    setCurrentTime(t);
  }, [currentTime]);

  const handleFastForward = useCallback(() => {
    if (!playerRef.current) return;
    const t = Math.min(duration, currentTime + 10);
    playerRef.current.seekTo(t);
    setCurrentTime(t);
  }, [currentTime, duration]);

  const handleRestart = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.seekTo(0);
      setCurrentTime(0);
    }
  }, []);

  isMutedRef.current = isMuted;

  const handlePlayerReady = useCallback(() => {
    if (playerRef.current) {
      const dur = playerRef.current.getDuration();
      if (dur > 0) setDuration(dur);
      applyMuteFromRef();
    }
  }, [applyMuteFromRef]);

  const handlePlayerStateChange = useCallback(
    (state: number) => {
      if (state === 1) {
        setIsPlaying(true);
        applyMuteFromRef();
        if (!hasPlayedFirstVideoRef.current) {
          hasPlayedFirstVideoRef.current = true;
        }
      } else if (state === 2 || state === 0) {
        setIsPlaying(false);
        if (state === 0) setTimeout(() => navigateVideo(1, true), 500);
      }
    },
    [navigateVideo, applyMuteFromRef]
  );

  // Memoized so player only re-renders when video src or callbacks change; mute is applied via ref.
  const memoizedPlayerProps = useMemo(
    () => ({
      videoId: currentVideo?.video.src ?? null,
      autoplay: true as const,
      onReady: handlePlayerReady,
      onStateChange: handlePlayerStateChange,
      className: "w-full h-full",
    }),
    [currentVideo?.video.src, handlePlayerReady, handlePlayerStateChange]
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
            {!enableUrlRouting && (
              <button
                type="button"
                className="text-white/70 hover:text-white underline text-sm"
                onClick={() => setIsFilterDialogOpen(true)}
              >
                Filters
              </button>
            )}
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
          {/* Player layer - single stable instance on top */}
          <div className="absolute inset-0 z-10">
            <div ref={videoContainerRef} className="relative w-full h-full">
              <VideoPlayer
                key="main-player"
                ref={playerRef}
                {...memoizedPlayerProps}
              />
            </div>
            {/* React Animation Overlay - when in landscape or fullscreen */}
            {currentVideo &&
              (isLandscape || !isMobile || isFullscreen) &&
              showReacts && (
                <ReactAnimation
                  reacts={sortedReacts}
                  currentTime={currentTime}
                  videoContainerRef={videoContainerRef as any}
                  isPlaying={isPlaying}
                  useLargeEmojis={useLargeEmojis}
                />
              )}
          </div>
          {/* Carousel layer - placeholders only, behind */}
          <div
            className="absolute inset-0 z-0 w-full h-full flex transition-transform duration-300 ease-in-out"
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
                  <div
                    className="w-full h-full flex flex-col transition-transform duration-300 ease-in-out"
                    style={{
                      transform: `translateY(-${currentVideoIdx * 100}%)`,
                    }}
                  >
                    {videos.map((video) => (
                      <div
                        key={video.id}
                        className="flex-shrink-0 w-full h-full relative"
                      >
                        <div className="w-full h-full bg-black flex items-center justify-center">
                          <p className="text-white text-sm opacity-50">
                            {video.title}
                          </p>
                        </div>
                      </div>
                    ))}
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
            maxReactsPerEmoji={maxReactsPerEmoji}
            maxTotalReacts={maxTotalReacts}
            allowAnon={allowAnon}
            onToggleFullscreen={toggleFullscreen}
            isFullscreen={isFullscreen}
            showFullscreenButton={!isMobile && !isLandscape}
            canNavigateLeft={canNavigateLeft}
            canNavigateRight={canNavigateRight}
            canNavigateUp={canNavigateUp}
            canNavigateDown={canNavigateDown}
            showRightLoading={showRightLoading}
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
                maxReactsPerEmoji={maxReactsPerEmoji}
                maxTotalReacts={maxTotalReacts}
                allowAnon={allowAnon}
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
            showRightLoading={showRightLoading}
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
            maxReactsPerEmoji={maxReactsPerEmoji}
            maxTotalReacts={maxTotalReacts}
            allowAnon={allowAnon}
            isFullscreen={isFullscreen}
          />
        </div>
      )}

      {!enableUrlRouting && (
        <VideoFilterDialog
          isOpen={isFilterDialogOpen}
          onClose={() => setIsFilterDialogOpen(false)}
          filters={filters}
          defaultFilters={DEFAULT_VIDEO_FILTERS}
          availableCities={availableCities}
          availableStyles={availableStyles}
          onApply={(newFilters) => {
            setIsFilterDialogOpen(false);
            applyFilters(newFilters);
          }}
          onSave={saveFilters}
          onClear={() => {
            setIsFilterDialogOpen(false);
            clearFilters();
          }}
          isSaving={isSaving}
        />
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
