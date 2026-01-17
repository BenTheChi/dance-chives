"use client";

import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { extractYouTubeVideoId } from "@/lib/utils";
import Image from "next/image";

// YouTube Player API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface VideoPlayerRef {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unmute: () => void;
  isMuted: () => boolean;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number) => void;
  loadVideoById: (videoId: string) => void;
  getPlayerState: () => number;
  isLoading: () => boolean;
}

interface VideoPlayerProps {
  videoId: string | null;
  onReady?: () => void;
  onStateChange?: (state: number) => void;
  onError?: (error: number) => void;
  autoplay?: boolean;
  muted?: boolean;
  className?: string;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  (
    {
      videoId,
      onReady,
      onStateChange,
      onError,
      autoplay = false,
      muted = true,
      className,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const [isApiReady, setIsApiReady] = useState(false);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [currentVideoId, setCurrentVideoId] = useState<string | null>(
      videoId
    );
    const [isVisible, setIsVisible] = useState(false);
    const [playerState, setPlayerState] = useState<number>(-1); // -1 = unstarted
    const currentTimeRef = useRef<number>(0);
    const [isMobile, setIsMobile] = useState(false);

    // Check if mobile device
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.matchMedia("(max-width: 768px)").matches);
      };

      checkMobile();
      const mediaQuery = window.matchMedia("(max-width: 768px)");
      mediaQuery.addEventListener("change", checkMobile);

      return () => {
        mediaQuery.removeEventListener("change", checkMobile);
      };
    }, []);

    // Intersection Observer for lazy loading
    useEffect(() => {
      if (!containerRef.current) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              // Once visible, we can disconnect the observer
              observer.disconnect();
            }
          });
        },
        {
          rootMargin: "50px", // Start loading 50px before entering viewport
          threshold: 0.1,
        }
      );

      observer.observe(containerRef.current);

      return () => {
        observer.disconnect();
      };
    }, []);

    // Load YouTube iFrame API
    useEffect(() => {
      if (window.YT && window.YT.Player) {
        setIsApiReady(true);
        return;
      }

      // Check if script is already loading
      if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        // Wait for API to be ready
        const checkReady = setInterval(() => {
          if (window.YT && window.YT.Player) {
            setIsApiReady(true);
            clearInterval(checkReady);
          }
        }, 100);
        return () => clearInterval(checkReady);
      }

      // Create script tag
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      // Set up callback
      window.onYouTubeIframeAPIReady = () => {
        setIsApiReady(true);
      };
    }, []);

    // Initialize player when API is ready and component is visible
    useEffect(() => {
      if (!isApiReady || !containerRef.current || !currentVideoId || !isVisible)
        return;

      const youtubeId = extractYouTubeVideoId(currentVideoId);
      if (!youtubeId) {
        console.error("Invalid YouTube video ID:", currentVideoId);
        return;
      }

      // Destroy existing player if any
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore errors during destruction
        }
        playerRef.current = null;
      }

      setIsPlayerReady(false);
      setPlayerState(-1); // Reset to unstarted state

      // Create new player
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: "100%",
        width: "100%",
        videoId: youtubeId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          mute: muted ? 1 : 0,
          playsinline: 1,
          enablejsapi: 1,
          controls: 0,
          fs: 0,
          rel: 0,
          origin: typeof window !== "undefined" ? window.location.origin : "",
        },
        events: {
          onReady: (event: any) => {
            setIsPlayerReady(true);
            if (muted) {
              event.target.mute();
            }
            onReady?.();
          },
          onStateChange: (event: any) => {
            const state = event.data;
            setPlayerState(state);
            onStateChange?.(state);
          },
          onError: (event: any) => {
            onError?.(event.data);
          },
        },
      });

      return () => {
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch (e) {
            // Ignore errors during cleanup
          }
        }
      };
    }, [
      isApiReady,
      currentVideoId,
      autoplay,
      muted,
      onReady,
      onStateChange,
      onError,
      isVisible,
    ]);

    // Update video when videoId prop changes
    useEffect(() => {
      if (videoId !== currentVideoId) {
        setCurrentVideoId(videoId);
        if (playerRef.current && videoId) {
          const youtubeId = extractYouTubeVideoId(videoId);
          if (youtubeId) {
            playerRef.current.loadVideoById({
              videoId: youtubeId,
              startSeconds: 0,
            });
          }
        }
      }
    }, [videoId, currentVideoId]);

    // Track current time periodically - this keeps the ref updated
    useEffect(() => {
      if (!isPlayerReady) return;

      const interval = setInterval(() => {
        try {
          if (
            playerRef.current &&
            isPlayerReady &&
            typeof playerRef.current.getCurrentTime === "function"
          ) {
            const time = playerRef.current.getCurrentTime();
            if (time >= 0 && isFinite(time) && !isNaN(time)) {
              currentTimeRef.current = time;
            }
          }
        } catch (e) {
          // Ignore errors
        }
      }, 250); // Update 4 times per second for smooth tracking

      return () => clearInterval(interval);
    }, [isPlayerReady]);

    // Expose player methods via ref
    useImperativeHandle(
      ref,
      () => ({
        playVideo: () => {
          if (
            playerRef.current &&
            isPlayerReady &&
            typeof playerRef.current.playVideo === "function"
          ) {
            try {
              playerRef.current.playVideo();
            } catch (e) {
              console.error("Error playing video:", e);
            }
          }
        },
        pauseVideo: () => {
          if (
            playerRef.current &&
            isPlayerReady &&
            typeof playerRef.current.pauseVideo === "function"
          ) {
            try {
              playerRef.current.pauseVideo();
            } catch (e) {
              console.error("Error pausing video:", e);
            }
          }
        },
        mute: () => {
          if (
            playerRef.current &&
            isPlayerReady &&
            typeof playerRef.current.mute === "function"
          ) {
            try {
              playerRef.current.mute();
            } catch (e) {
              console.error("Error muting video:", e);
            }
          }
        },
        unmute: () => {
          if (
            playerRef.current &&
            isPlayerReady &&
            typeof playerRef.current.unMute === "function"
          ) {
            try {
              playerRef.current.unMute();
            } catch (e) {
              console.error("Error unmuting video:", e);
            }
          }
        },
        isMuted: () => {
          if (
            playerRef.current &&
            isPlayerReady &&
            typeof playerRef.current.isMuted === "function"
          ) {
            try {
              return playerRef.current.isMuted();
            } catch (e) {
              return true;
            }
          }
          return true;
        },
        getCurrentTime: () => {
          if (
            playerRef.current &&
            isPlayerReady &&
            typeof playerRef.current.getCurrentTime === "function"
          ) {
            try {
              const time = playerRef.current.getCurrentTime();
              if (time >= 0 && isFinite(time)) {
                currentTimeRef.current = time;
                return time;
              }
            } catch (e) {
              // Fall back to ref value
            }
          }
          return currentTimeRef.current;
        },
        getDuration: () => {
          if (
            playerRef.current &&
            isPlayerReady &&
            typeof playerRef.current.getDuration === "function"
          ) {
            try {
              return playerRef.current.getDuration();
            } catch (e) {
              return 0;
            }
          }
          return 0;
        },
        seekTo: (seconds: number) => {
          if (
            playerRef.current &&
            isPlayerReady &&
            typeof playerRef.current.seekTo === "function"
          ) {
            try {
              playerRef.current.seekTo(seconds, true);
              currentTimeRef.current = seconds;
            } catch (e) {
              console.error("Error seeking video:", e);
            }
          }
        },
        loadVideoById: (newVideoId: string) => {
          const youtubeId = extractYouTubeVideoId(newVideoId);
          if (
            playerRef.current &&
            isPlayerReady &&
            youtubeId &&
            typeof playerRef.current.loadVideoById === "function"
          ) {
            try {
              playerRef.current.loadVideoById({
                videoId: youtubeId,
                startSeconds: 0,
              });
              setCurrentVideoId(newVideoId);
              setIsPlayerReady(false); // Reset ready state when loading new video
              setPlayerState(-1); // Reset to unstarted state
            } catch (e) {
              console.error("Error loading video:", e);
            }
          } else if (youtubeId) {
            // If player not ready, just update the video ID and let the effect handle it
            setCurrentVideoId(newVideoId);
          }
        },
        getPlayerState: () => {
          if (
            playerRef.current &&
            isPlayerReady &&
            typeof playerRef.current.getPlayerState === "function"
          ) {
            try {
              return playerRef.current.getPlayerState();
            } catch (e) {
              return -1; // unstarted
            }
          }
          return -1;
        },
        isLoading: () => {
          // Player not ready yet, unstarted, or cued
          return (
            !isPlayerReady ||
            playerState === -1 || // Unstarted
            playerState === 5 // Cued
          );
        },
      }),
      [isPlayerReady, playerState]
    );

    if (!currentVideoId) {
      return (
        <div
          className={`flex items-center justify-center bg-black ${
            className || ""
          }`}
        >
          <p className="text-white text-sm">No video selected</p>
        </div>
      );
    }

    const youtubeId = extractYouTubeVideoId(currentVideoId);
    if (!youtubeId) {
      return (
        <div
          className={`flex items-center justify-center bg-black ${
            className || ""
          }`}
        >
          <p className="text-white text-sm">Invalid YouTube URL</p>
        </div>
      );
    }

    // Determine if we should show loading spinner
    // Show spinner when: player not ready, unstarted, buffering, or cued
    const isLoading =
      !isPlayerReady || // Player not ready yet
      playerState === -1 || // Unstarted
      playerState === 5; // Cued

    return (
      <div className={`relative w-full h-full ${className || ""} `}>
        <div
          ref={containerRef}
          className={`w-full h-full ${
            isMobile ? "pointer-events-none" : "pointer-events-auto"
          } `}
        />
        {/* Loading Spinner Overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center z-10 pointer-events-none bg-secondary-dark transition-opacity duration-700 ${
            isLoading ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src="/Dancechives_Icon_Color_onDark.svg"
            alt="Loading"
            width={100}
            height={100}
            className="animate-rock mt-5"
          />
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";
