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
      className={`w-12 h-12 bg-purple-800/80 backdrop-blur-sm border-2 border-purple-300 rounded-lg flex items-center justify-center hover:bg-purple-700/90 transition-all duration-300 shadow-xl ${className}`}
    >
      {isAudioMuted ? (
        <VolumeX className="w-6 h-6 text-white" />
      ) : (
        <Volume2 className="w-6 h-6 text-white" />
      )}
    </button>
  )
}
