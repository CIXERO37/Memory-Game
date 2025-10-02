import { useState, useEffect, useRef } from "react"
import { calculateTimerState, type TimerState } from "@/lib/timer-utils"
import type { Room } from "@/lib/room-manager"

/**
 * Custom hook for synchronized timer that updates smoothly
 * Uses requestAnimationFrame for precise timing updates
 */
export function useSynchronizedTimer(room: Room | null, timeLimit?: number, onTimeUp?: () => void): TimerState {
  const [timerState, setTimerState] = useState<TimerState>({
    duration: 0,
    countdown: null,
    remainingTime: 0
  })
  
  const animationRef = useRef<number>()
  const lastUpdateRef = useRef<number>(0)
  const timeUpTriggered = useRef<boolean>(false)

  useEffect(() => {
    if (!room) {
      setTimerState({
        duration: 0,
        countdown: null,
        remainingTime: 0
      })
      return
    }

    const updateTimer = () => {
      const now = Date.now()
      
      // Update more frequently for better synchronization (every 100ms for better performance)
      if (now - lastUpdateRef.current < 100) {
        animationRef.current = requestAnimationFrame(updateTimer)
        return
      }
      
      lastUpdateRef.current = now
      
      const roomWithSettings = {
        ...room,
        settings: { 
          totalTimeLimit: timeLimit || room.settings.totalTimeLimit 
        }
      }
      
      const newTimerState = calculateTimerState(roomWithSettings)
      setTimerState(newTimerState)
      
      // Check if time is up and trigger callback
      if (newTimerState.remainingTime <= 0 && !timeUpTriggered.current && onTimeUp) {
        timeUpTriggered.current = true
        onTimeUp()
      }
      
      // Continue animation loop
      animationRef.current = requestAnimationFrame(updateTimer)
    }

    // Start animation loop
    animationRef.current = requestAnimationFrame(updateTimer)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [room, timeLimit, onTimeUp])

  return timerState
}
