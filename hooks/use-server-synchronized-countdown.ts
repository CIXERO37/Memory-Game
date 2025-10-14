import { useState, useEffect, useRef, useCallback } from "react"

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

  // Calculate client time with server offset
  const getSynchronizedTime = useCallback(() => {
    return Date.now() + serverOffset
  }, [serverOffset])

  // Fetch countdown state from server with retry mechanism for poor network
  const fetchCountdownState = useCallback(async (retryCount = 0): Promise<ServerCountdownResponse | null> => {
    try {
      const clientTimestamp = Date.now().toString()
      
      // Add timeout for poor network conditions
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // Reduced timeout to 5 seconds
      
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
      
      // Calculate server offset more accurately
      const responseTime = Date.now()
      const requestLatency = responseTime - parseInt(clientTimestamp)
      const estimatedServerTime = data.serverTime + (requestLatency / 2)
      setServerOffset(estimatedServerTime - responseTime)
      
      // Log sync info for debugging
      console.log('[ServerCountdown] Sync:', {
        syncId: data.syncId,
        serverTime: data.serverTime,
        clientTime: responseTime,
        offset: estimatedServerTime - responseTime,
        requestLatency: requestLatency,
        latencyCompensation: data.countdownState?.latencyCompensation,
        remaining: data.countdownState?.remaining
      })
      
      setIsConnected(true)
      lastServerSyncRef.current = responseTime
      
      // Store last known countdown for fallback
      if (data.countdownState) {
        setLastKnownCountdown(data.countdownState.remaining)
        setFallbackStartTime(responseTime)
      }
      
      return data
    } catch (error) {
      console.error('[ServerCountdown] Error fetching countdown state:', error, 'retry:', retryCount)
      
      // Retry mechanism for poor network conditions
      if (retryCount < 2) { // Reduced retry count
        console.log('[ServerCountdown] Retrying in', (retryCount + 1) * 1000, 'ms')
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000))
        return fetchCountdownState(retryCount + 1)
      }
      
      setIsConnected(false)
      return null
    }
  }, [roomCode])

  // Send heartbeat to server
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
  }, [roomCode])

  // Update countdown based on server state
  const updateCountdown = useCallback(async () => {
    const serverData = await fetchCountdownState()
    
    if (!serverData || !serverData.countdownState) {
      setIsActive(false)
      setCountdown(0)
      return
    }

    const { countdownState } = serverData
    
    if (countdownState.isActive) {
      // Use server-calculated remaining time directly for better accuracy
      const newCountdown = countdownState.remaining
      
      // Only update if the countdown value has actually changed to avoid unnecessary re-renders
      if (newCountdown !== countdown) {
        setCountdown(newCountdown)
        console.log('[ServerCountdown] Countdown updated:', newCountdown, 'isInDelayPeriod:', countdownState.isInDelayPeriod)
      }
      
      setIsActive(true)
      setIsInDelayPeriod(countdownState.isInDelayPeriod || false)
      
      // Check if countdown is complete
      if (newCountdown <= 0) {
        console.log('[ServerCountdown] Countdown completed, triggering callback')
        setIsActive(false)
        onCountdownComplete?.()
      }
    } else {
      console.log('[ServerCountdown] Countdown not active, was:', countdown)
      setIsActive(false)
      setCountdown(0)
      setIsInDelayPeriod(false)
      // Trigger completion callback if countdown is not active but was active before
      if (countdown > 0) {
        console.log('[ServerCountdown] Countdown ended, triggering callback')
        onCountdownComplete?.()
      }
    }
  }, [fetchCountdownState, onCountdownComplete, countdown])

  // Fallback countdown for poor network conditions
  const updateFallbackCountdown = useCallback(() => {
    if (!isConnected && lastKnownCountdown > 0 && fallbackStartTime > 0) {
      const timeSinceFallback = Date.now() - fallbackStartTime
      const fallbackCountdown = Math.max(0, lastKnownCountdown - Math.floor(timeSinceFallback / 1000))
      
      console.log('[ServerCountdown] Using fallback countdown:', fallbackCountdown, 'original:', lastKnownCountdown)
      
      // Only update if countdown has changed
      if (fallbackCountdown !== countdown) {
        setCountdown(fallbackCountdown)
      }
      setIsActive(fallbackCountdown > 0)
      
      if (fallbackCountdown <= 0) {
        console.log('[ServerCountdown] Fallback countdown completed')
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
      console.log('[ServerCountdown] Attempting reconnection...')
      const serverData = await fetchCountdownState()
      
      if (serverData) {
        console.log('[ServerCountdown] Reconnected successfully')
        await updateCountdown()
      } else {
        // Try again in 3 seconds (increased from 2 seconds)
        attemptReconnection()
      }
    }, 3000)
  }, [fetchCountdownState, updateCountdown])

  useEffect(() => {
    if (!roomCode) return

    // Initial sync
    updateCountdown()

    // Set up periodic server sync with more consistent frequency
    const syncInterval = setInterval(() => {
      const now = Date.now()
      
      // More consistent sync frequency for better synchronization
      let syncIntervalMs = 1000 // Default 1 second for stability
      if (countdown <= 5) {
        syncIntervalMs = 500 // More frequent when countdown is low
      }
      
      // Sync based on time elapsed since last sync
      if (now - lastServerSyncRef.current > syncIntervalMs || !isConnected) {
        updateCountdown()
      }
    }, 500) // Check every 500ms but sync based on countdown state

    // Set up heartbeat (every 10 seconds for less network overhead)
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 10000)

    // Set up reconnection attempts for disconnected state
    if (!isConnected) {
      attemptReconnection()
    }

    // Cleanup
    return () => {
      clearInterval(syncInterval)
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [roomCode, updateCountdown, sendHeartbeat, isConnected, attemptReconnection])

  // Fallback countdown for poor network conditions
  useEffect(() => {
    if (!isConnected && lastKnownCountdown > 0) {
      const fallbackInterval = setInterval(() => {
        updateFallbackCountdown()
      }, 1000) // Update every second for fallback

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
