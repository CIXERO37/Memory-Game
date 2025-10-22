"use client"

import { Volume2, VolumeX } from "lucide-react"
import { useAudio } from "@/hooks/use-audio"

interface AudioPlayerProps {
  className?: string
}

export function AudioPlayer({ className = "" }: AudioPlayerProps) {
  const { audioRef, isAudioMuted, toggleAudio } = useAudio()

  return (
    <>
      {/* Audio Element */}
      <audio ref={audioRef} preload="auto">
        <source src="/audio/chill-lofi-347217.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      {/* Audio Toggle Button */}
      <button
        onClick={toggleAudio}
        className={`w-12 h-12 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg flex items-center justify-center hover:bg-white/30 transition-all duration-300 shadow-lg ${className}`}
      >
        {isAudioMuted ? (
          <VolumeX className="w-6 h-6 text-white" />
        ) : (
          <Volume2 className="w-6 h-6 text-white" />
        )}
      </button>
    </>
  )
}
