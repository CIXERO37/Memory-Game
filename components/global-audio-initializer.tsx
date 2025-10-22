"use client"

import { useEffect } from 'react'
import { useGlobalAudio } from '@/hooks/use-global-audio'

export function GlobalAudioInitializer() {
  const { playAudio, isAudioPaused } = useGlobalAudio()

  useEffect(() => {
    // Only initialize audio if it's not paused
    if (!isAudioPaused) {
      playAudio()
    }
  }, [playAudio, isAudioPaused])

  return null // This component doesn't render anything
}
