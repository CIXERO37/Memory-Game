"use client"

import { useEffect, useRef, useState } from "react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>
}

const checkIsStandalone = () => {
  if (typeof window === "undefined") return false
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true
}

// Extend Window interface to include our custom property
declare global {
  interface Window {
    __pwaPromptDismissed?: boolean
  }
}

// Check if prompt was dismissed in this page session (resets on refresh)
const checkIsDismissed = () => {
  if (typeof window === "undefined") return false
  return window.__pwaPromptDismissed === true
}

// Mark prompt as dismissed (persists during navigation but resets on refresh)
const markAsDismissed = () => {
  if (typeof window === "undefined") return
  window.__pwaPromptDismissed = true
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isDevelopment, setIsDevelopment] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const promptShownRef = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Check if already dismissed in this session
    const dismissed = checkIsDismissed()
    setIsDismissed(dismissed)
    if (dismissed) {
      promptShownRef.current = true
    }

    const isDev =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.port !== ""
    setIsDevelopment(isDev)

    if (checkIsStandalone()) {
      setIsInstalled(true)
      setCanInstall(false)
      return
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistration()
        .then((registration) => {
          if (registration) {
            setCanInstall(true)
          } else if (isDev) {
            setCanInstall(true)
          }
        })
        .catch(() => {
          if (isDev) setCanInstall(true)
        })
    } else if (isDev) {
      setCanInstall(true)
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      if (checkIsStandalone()) return
      if (checkIsDismissed()) return // Don't show if dismissed
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setCanInstall(true)
      setShowPrompt(true)
      promptShownRef.current = true
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
      setDeferredPrompt(null)
      setShowPrompt(false)
      promptShownRef.current = false
      markAsDismissed() // Also mark as dismissed when installed
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  useEffect(() => {
    // Don't show if already dismissed in this session
    if (isDismissed) return

    if (!isInstalled && (canInstall || deferredPrompt) && !promptShownRef.current) {
      setShowPrompt(true)
      promptShownRef.current = true
    }
  }, [isInstalled, canInstall, deferredPrompt, isDismissed])

  const triggerInstall = async () => {
    if (!deferredPrompt) {
      setShowPrompt(true)
      return
    }

    try {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
    } finally {
      setDeferredPrompt(null)
      setShowPrompt(false)
      promptShownRef.current = true
      markAsDismissed()
    }
  }

  const dismissPrompt = () => {
    setShowPrompt(false)
    promptShownRef.current = true
    markAsDismissed() // Save to sessionStorage
    setIsDismissed(true)
  }

  return {
    canInstall: !isInstalled && (canInstall || isDevelopment),
    hasInstallEvent: !!deferredPrompt,
    showPrompt,
    triggerInstall,
    dismissPrompt,
    isInstalled,
  }
}

