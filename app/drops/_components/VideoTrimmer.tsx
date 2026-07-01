"use client";

import { useState, useRef, useEffect } from "react";

const MAX_DURATION = 30;

interface VideoTrimmerProps {
  src: string;
  onTrimChange: (trim: { startTime: number; endTime: number }) => void;
}

export function VideoTrimmer({ src, onTrimChange }: VideoTrimmerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const maxStartTime = Math.max(0, videoDuration - MAX_DURATION);

  // Load video metadata
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleMetadata = () => {
      setVideoDuration(video.duration);
      // Set initial end time
      onTrimChange({ startTime: 0, endTime: Math.min(video.duration, MAX_DURATION) });
    };

    video.addEventListener("loadedmetadata", handleMetadata);
    return () => video.removeEventListener("loadedmetadata", handleMetadata);
  }, [src, onTrimChange]);

  // Handle playback and looping within the trim window
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const endTime = startTime + MAX_DURATION;
      if (video.currentTime >= endTime) {
        video.currentTime = startTime;
        if (!video.loop) {
          video.pause();
          setIsPlaying(false);
        }
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [startTime]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      // If playback is at the end of the clip, restart it
      if (video.currentTime >= startTime + MAX_DURATION) {
        video.currentTime = startTime;
      }
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = parseFloat(event.target.value);
    setStartTime(newStartTime);
    onTrimChange({
      startTime: newStartTime,
      endTime: newStartTime + MAX_DURATION,
    });
    if (videoRef.current) {
      videoRef.current.currentTime = newStartTime;
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-black">
      <div className="relative flex-1 w-full" onClick={handlePlayPause}>
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-contain"
          playsInline
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
      </div>

      {videoDuration > MAX_DURATION && (
        <div className="flex-shrink-0 p-4 bg-gray-950/80">
          <div className="text-center text-white text-xs mb-2">
            Trim video to 30 seconds
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{formatTime(startTime)}</span>
            <input
              type="range"
              min="0"
              max={maxStartTime}
              step="0.1"
              value={startTime}
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#00f0ff]"
            />
            <span className="text-xs text-gray-400">{formatTime(startTime + MAX_DURATION)}</span>
          </div>
        </div>
      )}
    </div>
  );
}