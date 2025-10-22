"use client"

import { useEffect, useRef, useState } from 'react'

// Global audio instance
let globalAudio: HTMLAudioElement | null = null
let globalAudioState = {
  isMuted: false,
  isLoaded: false,
  isPaused: false,
  listeners: new Set<(state: { isMuted: boolean; isLoaded: boolean; isPaused: boolean }) => void>()
}

// Function to notify all listeners
const notifyListeners = () => {
  globalAudioState.listeners.forEach(listener => {
    listener({
      isMuted: globalAudioState.isMuted,
      isLoaded: globalAudioState.isLoaded,
      isPaused: globalAudioState.isPaused
    })
  })
}

// Function to initialize global audio
const initializeGlobalAudio = () => {
  if (globalAudio) return globalAudio

  globalAudio = new Audio('/audio/chill-lofi-347217.mp3')
  globalAudio.volume = 0.2
  globalAudio.loop = true
  globalAudio.preload = 'auto'

  globalAudio.addEventListener('loadeddata', () => {
    globalAudioState.isLoaded = true
    notifyListeners()
  })

  globalAudio.addEventListener('error', () => {
    console.log('Global audio failed to load')
    globalAudioState.isLoaded = false
    notifyListeners()
  })

  // Try to play audio (will be muted by browser policy until user interaction)
  const playAudio = async () => {
    if (globalAudio && !globalAudioState.isMuted && !globalAudioState.isPaused) {
      try {
        await globalAudio.play()
      } catch (error) {
        console.log('Audio autoplay prevented:', error)
      }
    }
  }
  
  playAudio()

  return globalAudio
}

export function useGlobalAudio() {
  const [isAudioMuted, setIsAudioMuted] = useState(globalAudioState.isMuted)
  const [isAudioLoaded, setIsAudioLoaded] = useState(globalAudioState.isLoaded)
  const [isAudioPaused, setIsAudioPaused] = useState(globalAudioState.isPaused)

  useEffect(() => {
    // Initialize global audio if not already done
    initializeGlobalAudio()

    // Add listener for state changes
    const listener = (state: { isMuted: boolean; isLoaded: boolean; isPaused: boolean }) => {
      setIsAudioMuted(state.isMuted)
      setIsAudioLoaded(state.isLoaded)
      setIsAudioPaused(state.isPaused)
    }

    globalAudioState.listeners.add(listener)

    // Set initial state
    listener({
      isMuted: globalAudioState.isMuted,
      isLoaded: globalAudioState.isLoaded,
      isPaused: globalAudioState.isPaused
    })

    return () => {
      globalAudioState.listeners.delete(listener)
    }
  }, [])

  const toggleAudio = () => {
    if (globalAudio) {
      if (globalAudioState.isMuted) {
        globalAudio.muted = false
        globalAudioState.isMuted = false
      } else {
        globalAudio.muted = true
        globalAudioState.isMuted = true
      }
      notifyListeners()
    }
  }

  const playAudio = async () => {
    if (globalAudio && !globalAudioState.isMuted && !globalAudioState.isPaused) {
      try {
        await globalAudio.play()
      } catch (error) {
        console.log('Audio play failed:', error)
      }
    }
  }

  const pauseAudio = () => {
    if (globalAudio) {
      globalAudio.pause()
      globalAudioState.isPaused = true
      notifyListeners()
    }
  }

  const resumeAudio = () => {
    if (globalAudio) {
      globalAudioState.isPaused = false
      notifyListeners()
      playAudio()
    }
  }

  return {
    isAudioMuted,
    isAudioLoaded,
    isAudioPaused,
    toggleAudio,
    playAudio,
    pauseAudio,
    resumeAudio
  }
}
