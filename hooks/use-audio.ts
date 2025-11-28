"use client"

import { useEffect, useRef, useState } from 'react'

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isAudioLoaded, setIsAudioLoaded] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = 0.2 // Set volume to 20%
      audio.loop = true

      const handleLoadedData = () => {
        setIsAudioLoaded(true)
      }

      const handleError = () => {

        setIsAudioLoaded(false)
      }

      audio.addEventListener('loadeddata', handleLoadedData)
      audio.addEventListener('error', handleError)

      // Try to play audio (will be muted by browser policy until user interaction)
      const playAudio = async () => {
        try {
          await audio.play()
        } catch (error) {

        }
      }

      playAudio()

      return () => {
        audio.removeEventListener('loadeddata', handleLoadedData)
        audio.removeEventListener('error', handleError)
      }
    }
  }, [])

  const toggleAudio = () => {
    const audio = audioRef.current
    if (audio) {
      if (isAudioMuted) {
        audio.muted = false
        setIsAudioMuted(false)
      } else {
        audio.muted = true
        setIsAudioMuted(true)
      }
    }
  }

  const playAudio = async () => {
    const audio = audioRef.current
    if (audio && !isAudioMuted) {
      try {
        await audio.play()
      } catch (error) {

      }
    }
  }

  const pauseAudio = () => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
    }
  }

  return {
    audioRef,
    isAudioMuted,
    isAudioLoaded,
    toggleAudio,
    playAudio,
    pauseAudio
  }
}
