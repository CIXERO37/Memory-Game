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
        className={`w-12 h-12 bg-purple-800/80 backdrop-blur-sm border-2 border-purple-300 rounded-lg flex items-center justify-center hover:bg-purple-700/90 transition-all duration-300 shadow-xl ${className}`}
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
// ikan