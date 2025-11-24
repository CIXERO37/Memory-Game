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

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isDevelopment, setIsDevelopment] = useState(false)
  const promptShownRef = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined") return

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
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  useEffect(() => {
    if (!isInstalled && (canInstall || deferredPrompt) && !promptShownRef.current) {
      setShowPrompt(true)
      promptShownRef.current = true
    }
  }, [isInstalled, canInstall, deferredPrompt])

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
    }
  }

  const dismissPrompt = () => {
    setShowPrompt(false)
    promptShownRef.current = true
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

