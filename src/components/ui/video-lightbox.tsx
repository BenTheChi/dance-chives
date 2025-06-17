"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Users,
  Trophy,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Video } from "@/types/event";
import Link from "next/link";

interface VideoLightboxProps {
  video: Video;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  currentIndex: number;
  totalVideos: number;
  eventLink: string;
  eventTitle: string;
  sectionTitle: string;
  bracketTitle?: string;
}

export function VideoLightbox({
  video,
  isOpen,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  currentIndex,
  totalVideos,
  eventLink,
  eventTitle,
  sectionTitle,
  bracketTitle,
}: VideoLightboxProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (hasPrev) onPrev();
          break;
        case "ArrowRight":
          if (hasNext) onNext();
          break;
        case "f":
        case "F":
          handleFullscreen();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasNext, hasPrev, onNext, onPrev, onClose]);

  //   const winners = video.taggedUsers.filter((user) => user.isWinner);
  const participants = video?.taggedUsers || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle className="sr-only">{video.title}</DialogTitle>
      <DialogContent
        closeButton={false}
        className="h-[95vh] sm:h-[90vh] p-0 gap-0 m-2 !max-w-[95vw] !w-[95vw]"
      >
        <div className="flex flex-col lg:flex-row h-full w-full">
          {/* Video Section */}
          <div className="flex-1 flex flex-col bg-black min-h-0">
            {/* Video Header */}
            <div className="flex items-center justify-between p-2 sm:p-4 bg-black text-white">
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
                <h2 className="text-sm sm:text-lg font-semibold truncate">
                  {video.title}
                </h2>
                <span className="text-xs sm:text-sm text-gray-300 whitespace-nowrap">
                  {currentIndex + 1} of {totalVideos}
                </span>
              </div>

              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                {hasPrev && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onPrev}
                    className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                )}

                {hasNext && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onNext}
                    className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFullscreen}
                  className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
                >
                  <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>

            {/* Video Player */}
            <div className="flex-1 relative min-h-[200px] sm:min-h-[300px]">
              <iframe
                src={`https://www.youtube.com/embed/${
                  video.src.split("v=")[1]
                }?autoplay=1&rel=0`}
                title={video.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 bg-background border-t lg:border-t-0 lg:border-l flex flex-col max-h-[40vh] lg:max-h-none">
            <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
              {/* Video Info */}
              <div className="flex flex-col gap-2">
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Event</h3>
                  <Link
                    href={eventLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm sm:text-base text-blue-500 hover:text-blue-600"
                  >
                    {eventTitle}
                  </Link>
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">
                    Section
                  </h3>
                  <div>{sectionTitle}</div>
                </div>
                <div>
                  {bracketTitle && (
                    <>
                      <h3 className="font-semibold text-sm sm:text-base">
                        Bracket
                      </h3>
                      <div>{bracketTitle}</div>
                    </>
                  )}
                </div>
              </div>
              {/* <div className="space-y-2 sm:space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs sm:text-sm"
                  asChild
                >
                  <a href={eventLink} target="_blank" rel="noopener noreferrer">
                    {eventTitle}
                  </a>
                </Button>
              </div> */}

              <Separator />

              {/* Winners */}
              {/* {winners.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-500" />
                    <h3 className="font-semibold text-sm sm:text-base">
                      Winners
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {winners.map((winner, index) => (
                      <Badge
                        key={index}
                        variant="default"
                        className="bg-yellow-500 hover:bg-yellow-600 text-xs"
                      >
                        <Trophy className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                        {winner.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )} */}

              {/* Participants */}
              {participants.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <h3 className="font-semibold text-sm sm:text-base">
                      Participants
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {participants.map((participant, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {participant.displayName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
