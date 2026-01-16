"use client";

import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { extractYouTubeVideoId } from "@/lib/utils";

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
  loadVideoById: (videoId: string) => void;
  getPlayerState: () => number;
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
    const currentTimeRef = useRef<number>(0);

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
            onStateChange?.(event.data);
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

    // Track current time periodically
    useEffect(() => {
      if (!playerRef.current) return;

      const interval = setInterval(() => {
        try {
          if (playerRef.current && playerRef.current.getCurrentTime) {
            currentTimeRef.current = playerRef.current.getCurrentTime();
          }
        } catch (e) {
          // Ignore errors
        }
      }, 1000); // Update every second

      return () => clearInterval(interval);
    }, [playerRef.current]);

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
          return currentTimeRef.current;
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
      }),
      [isPlayerReady]
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

    return (
      <div className={`relative w-full h-full ${className || ""}`}>
        <div ref={containerRef} className="w-full h-full" />
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";
