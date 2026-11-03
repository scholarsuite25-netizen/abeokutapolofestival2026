"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Film, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FestivalVideoPlayerProps {
  src?: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  aspectRatio?: "16/9" | "4/3" | "auto";
  title?: string;
  showBadge?: boolean;
}

export function FestivalVideoPlayer({
  src = "/videos/abeokuta-polo-trailer.mp4",
  autoPlay = false,
  muted = false,
  loop = true,
  className = "",
  aspectRatio = "16/9",
  title = "Abeokuta Polo Festival 2026 — Official Teaser Trailer",
  showBadge = true,
}: FestivalVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasStarted, setHasStarted] = useState(autoPlay);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
        setCurrentTime(video.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      if (!loop) {
        setIsPlaying(false);
      }
    };

    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", updateProgress);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
    };
  }, [loop]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => {
        setIsPlaying(true);
        setHasStarted(true);
      }).catch((err) => {
        console.warn("Video autoplay/playback prevented:", err);
      });
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border-2 border-gold/40 bg-forest-deep shadow-2xl ${className}`}
      style={{ aspectRatio: aspectRatio === "auto" ? undefined : aspectRatio }}
    >
      {/* HTML5 Video element */}
      <video
        ref={videoRef}
        src={src}
        playsInline
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        className="size-full object-cover cursor-pointer"
        onClick={togglePlay}
      >
        Your browser does not support the video tag.
      </video>

      {/* Top Banner Tag */}
      {showBadge && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
          <Badge className="bg-forest-deep/90 text-gold border border-gold/60 backdrop-blur-md font-semibold text-[10px] shadow-lg">
            <Sparkles className="mr-1 size-3 text-gold" />
            OFFICIAL 2026 TRAILER
          </Badge>
          <span className="hidden sm:inline-block rounded-full bg-forest-deep/80 px-2.5 py-0.5 text-[10px] font-medium text-ivory/80 backdrop-blur-sm border border-ivory/10">
            Abeokuta Polo Club &amp; Country Resort
          </span>
        </div>
      )}

      {/* Center Big Play Button Overlay (when paused or before start) */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-forest-deep/45 backdrop-blur-[2px] cursor-pointer transition duration-300 hover:bg-forest-deep/30"
        >
          <div className="flex size-16 sm:size-20 items-center justify-center rounded-full bg-gold text-forest shadow-[0_0_30px_rgba(223,190,117,0.7)] transition-transform duration-300 group-hover:scale-110">
            <Play className="ml-1 size-7 sm:size-9 fill-current" />
          </div>
          <span className="mt-3 rounded-full bg-forest-deep/90 px-4 py-1.5 text-xs font-semibold text-ivory backdrop-blur-sm border border-gold/30 shadow">
            {hasStarted ? "Resume Teaser" : "Play Official Trailer"}
          </span>
        </div>
      )}

      {/* Ambient Gradient Bottom Overlay for Controls */}
      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-forest-deep via-forest-deep/70 to-transparent p-3 sm:p-4 pt-8 transition-opacity duration-300 opacity-95 group-hover:opacity-100">
        {/* Scrubber Bar */}
        <div
          onClick={handleSeek}
          className="relative mb-2.5 h-1.5 w-full cursor-pointer rounded-full bg-ivory/20 transition-all hover:h-2.5"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold/80 via-gold to-emerald-400"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Video Control Bar */}
        <div className="flex items-center justify-between text-ivory text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="rounded-lg p-1.5 text-ivory hover:text-gold hover:bg-white/10 transition cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
            </button>

            <button
              onClick={toggleMute}
              className="rounded-lg p-1.5 text-ivory hover:text-gold hover:bg-white/10 transition cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>

            <span className="font-mono text-[11px] text-ivory/70 ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline-block text-[11px] text-ivory/70 truncate max-w-xs">
              {title}
            </span>
            <button
              onClick={handleFullscreen}
              className="rounded-lg p-1.5 text-ivory hover:text-gold hover:bg-white/10 transition cursor-pointer"
              title="Fullscreen"
              aria-label="Fullscreen"
            >
              <Maximize className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal Dialog Trigger for playing the video in a dedicated luxury modal
 */
export function FestivalVideoModal({
  triggerText = "Watch Teaser Video",
  triggerVariant = "outline",
  className = "",
  size = "default",
}: {
  triggerText?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size={size}
          className={`cursor-pointer ${className}`}
        >
          <Film className="mr-2 size-4 text-gold" />
          {triggerText}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl border-2 border-gold/40 bg-forest-deep p-4 sm:p-6 text-ivory shadow-2xl">
        <DialogHeader className="mb-2">
          <div className="flex items-center justify-between">
            <Badge className="bg-gold text-forest font-bold text-[10px]">
              <Sparkles className="mr-1 size-3" /> OFFICIAL 2026 PREVIEW
            </Badge>
          </div>
          <DialogTitle className="font-display text-2xl font-semibold text-ivory mt-2">
            Abeokuta Polo Festival 2026 — The Blueprint
          </DialogTitle>
          <DialogDescription className="text-xs text-ivory/70">
            December 18–20, 2026 · Abeokuta Polo Club &amp; Country Resort. Day 1 is 100% Free Public Admission!
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 overflow-hidden rounded-xl">
          {open && (
            <FestivalVideoPlayer
              src="/videos/abeokuta-polo-trailer.mp4"
              autoPlay={true}
              muted={false}
              loop={true}
              aspectRatio="16/9"
            />
          )}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-ivory/10 pt-3 text-xs text-ivory/70">
          <span>Venue: Kobape, Abeokuta, Ogun State, Nigeria</span>
          <Button
            size="sm"
            onClick={() => setOpen(false)}
            variant="ghost"
            className="text-ivory/70 hover:text-ivory text-xs"
          >
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
