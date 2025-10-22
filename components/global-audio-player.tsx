"use client"

import { Volume2, VolumeX } from "lucide-react"
import { useGlobalAudio } from "@/hooks/use-global-audio"

interface GlobalAudioPlayerProps {
  className?: string
}

export function GlobalAudioPlayer({ className = "" }: GlobalAudioPlayerProps) {
  const { isAudioMuted, toggleAudio } = useGlobalAudio()

  return (
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
  )
}
