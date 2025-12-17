import { useState, useEffect, useRef, useCallback } from "react"
import { sessionsApi, isPlayersSupabaseConfigured, GameSessionB } from "@/lib/supabase-players"

interface CountdownState {
  remaining: number
  isActive: boolean
  serverTime: number
  countdownStartTime: number
  countdownEndTime: number
  isInDelayPeriod?: boolean
  timeSinceStart?: number
  totalDuration?: number
  latencyCompensation?: number
  compensatedTime?: number
}

interface ServerCountdownResponse {
  roomCode: string
  status: string
  countdownState: CountdownState | null
  serverTime: number
  timestamp?: number
  syncId?: number
  requestLatency?: number
  clientTimestamp?: string
}

/**
 * Custom hook for server-synchronized countdown timer
 * 🚀 OPTIMIZED: Uses Supabase Realtime subscription instead of polling
 * Ensures all players see the same countdown regardless of network conditions
 */
export function useServerSynchronizedCountdown(
  roomCode: string,
  playerId?: string,
  onCountdownComplete?: () => void
) {
  const [countdown, setCountdown] = useState<number>(0)
  const [isActive, setIsActive] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const [serverOffset, setServerOffset] = useState<number>(0)
  const [isInDelayPeriod, setIsInDelayPeriod] = useState(false)
  const [lastKnownCountdown, setLastKnownCountdown] = useState<number>(0)
  const [fallbackStartTime, setFallbackStartTime] = useState<number>(0)

  const animationRef = useRef<number>()
  const lastServerSyncRef = useRef<number>(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>()
  const countdownIntervalRef = useRef<NodeJS.Timeout>()
  const countdownStartTimeRef = useRef<number | null>(null)
  const countdownDurationRef = useRef<number>(10)

  // Calculate client time with server offset
  const getSynchronizedTime = useCallback(() => {
    return Date.now() + serverOffset
  }, [serverOffset])

  // 🚀 Calculate countdown from session data (Realtime payload)
  const calculateCountdownFromSession = useCallback((session: GameSessionB) => {
    if (!session.countdown_started_at) {
      setIsActive(false)
      setCountdown(0)
      setIsInDelayPeriod(false)
      countdownStartTimeRef.current = null
      return
    }

    const countdownStart = new Date(session.countdown_started_at).getTime()
    const countdownDuration = session.countdown_duration_seconds || 10

    countdownStartTimeRef.current = countdownStart
    countdownDurationRef.current = countdownDuration

    const now = Date.now()
    const totalDuration = countdownDuration * 1000
    const timeSinceStart = now - countdownStart

    let remainingSeconds: number
    let inDelayPeriod: boolean

    if (timeSinceStart < 0) {
      // Countdown hasn't started yet
      remainingSeconds = countdownDuration
      inDelayPeriod = true
    } else if (timeSinceStart >= totalDuration) {
      // Countdown finished
      remainingSeconds = 0
      inDelayPeriod = false
    } else {
      // Active countdown
      const remainingMs = totalDuration - timeSinceStart
      remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
      inDelayPeriod = false
    }

    setCountdown(remainingSeconds)
    setIsActive(remainingSeconds > 0)
    setIsInDelayPeriod(inDelayPeriod)
    setLastKnownCountdown(remainingSeconds)
    setFallbackStartTime(now)

    // Trigger completion if countdown finished
    if (remainingSeconds <= 0 && countdownStartTimeRef.current) {
      onCountdownComplete?.()
    }
  }, [onCountdownComplete])

  // 🚀 Local countdown tick (updates every second based on stored start time)
  const updateLocalCountdown = useCallback(() => {
    if (!countdownStartTimeRef.current) return

    const now = Date.now()
    const countdownStart = countdownStartTimeRef.current
    const totalDuration = countdownDurationRef.current * 1000
    const timeSinceStart = now - countdownStart

    let remainingSeconds: number

    if (timeSinceStart < 0) {
      remainingSeconds = countdownDurationRef.current
    } else if (timeSinceStart >= totalDuration) {
      remainingSeconds = 0
    } else {
      const remainingMs = totalDuration - timeSinceStart
      remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
    }

    // Only update if changed to avoid unnecessary re-renders
    setCountdown(prev => {
      if (prev !== remainingSeconds) {
        return remainingSeconds
      }
      return prev
    })

    setIsActive(remainingSeconds > 0)

    // Trigger completion callback
    if (remainingSeconds <= 0 && countdownStartTimeRef.current) {
      onCountdownComplete?.()
      countdownStartTimeRef.current = null // Prevent multiple calls
    }
  }, [onCountdownComplete])

  // Fetch countdown state from server (fallback for initial load or reconnection)
  const fetchCountdownState = useCallback(async (retryCount = 0): Promise<ServerCountdownResponse | null> => {
    try {
      const clientTimestamp = Date.now().toString()

      // Add timeout for poor network conditions
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`/api/rooms/${roomCode}/countdown-state`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'x-client-timestamp': clientTimestamp
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data: ServerCountdownResponse = await response.json()

      // Calculate server offset
      const responseTime = Date.now()
      const requestLatency = responseTime - parseInt(clientTimestamp)
      const estimatedServerTime = data.serverTime + (requestLatency / 2)
      setServerOffset(estimatedServerTime - responseTime)

      setIsConnected(true)
      lastServerSyncRef.current = responseTime

      // Store countdown info for local updates
      if (data.countdownState) {
        setLastKnownCountdown(data.countdownState.remaining)
        setFallbackStartTime(responseTime)

        // Store start time for local countdown
        if (data.countdownState.countdownStartTime) {
          countdownStartTimeRef.current = data.countdownState.countdownStartTime
          countdownDurationRef.current = (data.countdownState.totalDuration || 10000) / 1000
        }
      }

      return data
    } catch (error) {
      console.error('[ServerCountdown] Error fetching countdown state:', error, 'retry:', retryCount)

      // Retry mechanism for poor network conditions
      if (retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000))
        return fetchCountdownState(retryCount + 1)
      }

      setIsConnected(false)
      return null
    }
  }, [roomCode])

  // Send heartbeat to server (kept for session activity tracking)
  const sendHeartbeat = useCallback(async () => {
    try {
      await fetch(`/api/rooms/${roomCode}/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerId: playerId || 'anonymous',
          clientTime: Date.now()
        })
      })
    } catch (error) {
      console.error('[ServerCountdown] Heartbeat failed:', error)
    }
  }, [roomCode, playerId])

  // Update countdown based on server state (for initial sync and reconnection)
  const updateCountdown = useCallback(async () => {
    const serverData = await fetchCountdownState()

    if (!serverData || !serverData.countdownState) {
      setIsActive(false)
      setCountdown(0)
      return
    }

    const { countdownState } = serverData

    if (countdownState.isActive) {
      const newCountdown = countdownState.remaining

      if (newCountdown !== countdown) {
        setCountdown(newCountdown)
      }

      setIsActive(true)
      setIsInDelayPeriod(countdownState.isInDelayPeriod || false)

      if (newCountdown <= 0) {
        setIsActive(false)
        onCountdownComplete?.()
      }
    } else {
      setIsActive(false)
      setCountdown(0)
      setIsInDelayPeriod(false)
      if (countdown > 0) {
        onCountdownComplete?.()
      }
    }
  }, [fetchCountdownState, onCountdownComplete, countdown])

  // Fallback countdown for poor network conditions
  const updateFallbackCountdown = useCallback(() => {
    if (!isConnected && lastKnownCountdown > 0 && fallbackStartTime > 0) {
      const timeSinceFallback = Date.now() - fallbackStartTime
      const fallbackCountdown = Math.max(0, lastKnownCountdown - Math.floor(timeSinceFallback / 1000))

      if (fallbackCountdown !== countdown) {
        setCountdown(fallbackCountdown)
      }
      setIsActive(fallbackCountdown > 0)

      if (fallbackCountdown <= 0) {
        onCountdownComplete?.()
      }
    }
  }, [isConnected, lastKnownCountdown, fallbackStartTime, onCountdownComplete, countdown])

  // Reconnection logic for poor connections
  const attemptReconnection = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    reconnectTimeoutRef.current = setTimeout(async () => {
      const serverData = await fetchCountdownState()

      if (serverData) {
        await updateCountdown()
      } else {
        attemptReconnection()
      }
    }, 3000)
  }, [fetchCountdownState, updateCountdown])

  useEffect(() => {
    if (!roomCode) return

    // 🚀 INITIAL SYNC: Fetch once to get countdown state
    updateCountdown()

    // 🚀 REALTIME SUBSCRIPTION: Listen to session changes instead of polling
    let unsubscribeSession: (() => void) | null = null

    if (isPlayersSupabaseConfigured()) {
      unsubscribeSession = sessionsApi.subscribeToSession(
        roomCode,
        (session) => {
          if (session) {
            setIsConnected(true)
            calculateCountdownFromSession(session)
          }
        }
      )
      console.log('[ServerCountdown] 🚀 Subscribed to Realtime session updates')
    }

    // 🚀 LOCAL COUNTDOWN TICK: Update every second based on stored start time
    // This replaces the frequent API polling with local calculation
    countdownIntervalRef.current = setInterval(() => {
      updateLocalCountdown()
    }, 1000)

    // Set up heartbeat (every 30 seconds - reduced from 10s since we use Realtime now)
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000)

    // Set up reconnection attempts for disconnected state
    if (!isConnected) {
      attemptReconnection()
    }

    // Cleanup
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (unsubscribeSession) {
        unsubscribeSession()
        console.log('[ServerCountdown] 🔌 Unsubscribed from Realtime session updates')
      }
    }
  }, [roomCode, updateCountdown, sendHeartbeat, isConnected, attemptReconnection, calculateCountdownFromSession, updateLocalCountdown])

  // Fallback countdown for poor network conditions
  useEffect(() => {
    if (!isConnected && lastKnownCountdown > 0) {
      const fallbackInterval = setInterval(() => {
        updateFallbackCountdown()
      }, 1000)

      return () => clearInterval(fallbackInterval)
    }
  }, [isConnected, lastKnownCountdown, updateFallbackCountdown])

  // Smooth animation loop for countdown display
  useEffect(() => {
    if (!isActive) return

    const animate = () => {
      // Server-authoritative countdown - no client-side calculation
      // Just smooth the display updates
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive])

  return {
    countdown,
    isActive,
    isConnected,
    serverOffset,
    isInDelayPeriod
  }
}
