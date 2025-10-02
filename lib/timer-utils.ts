/**
 * Utility functions for synchronized timer calculations
 * Ensures consistent timing between host monitor and player quiz pages
 */

export interface TimerState {
  duration: number
  countdown: number | null
  remainingTime: number
}

export interface Room {
  createdAt: string
  startedAt?: string
  status: "waiting" | "countdown" | "quiz" | "memory" | "finished"
  countdownStartTime?: string
  countdownDuration?: number
  settings: {
    totalTimeLimit: number
  }
}

/**
 * Calculate synchronized timer state for both host and player
 * Uses startedAt for accurate timing, falls back to createdAt
 * Uses Math.ceil for more precise countdown display
 * Optimized for real-time updates with minimal delay
 * Enhanced with better synchronization logic
 */
export function calculateTimerState(room: Room): TimerState {
  if (!room) {
    return {
      duration: 0,
      countdown: null,
      remainingTime: 0
    }
  }

  const now = Date.now() // Use timestamp for better performance
  
  // Use startedAt for more accurate timing, fallback to createdAt
  const gameStartTime = room.startedAt ? new Date(room.startedAt).getTime() : new Date(room.createdAt).getTime()
  const elapsedSeconds = Math.floor((now - gameStartTime) / 1000)
  
  // Add small buffer to prevent timing discrepancies between host and players
  const syncBuffer = 0.5 // 500ms buffer for network latency

  // Calculate remaining time for quiz (total time limit - elapsed time)
  const totalTimeLimitSeconds = room.settings.totalTimeLimit * 60 // Convert minutes to seconds
  const remainingTime = Math.max(0, Math.floor(totalTimeLimitSeconds - elapsedSeconds + syncBuffer))

  // Calculate countdown if in countdown phase
  let countdown: number | null = null
  if (room.status === "countdown" && room.countdownStartTime && room.countdownDuration) {
    const countdownStart = new Date(room.countdownStartTime).getTime()
    const countdownEnd = countdownStart + (room.countdownDuration * 1000)
    // Use Math.ceil for countdown to show the next second immediately
    countdown = Math.max(0, Math.ceil((countdownEnd - now) / 1000))
  }

  return {
    duration: elapsedSeconds,
    countdown,
    remainingTime
  }
}

/**
 * Format time in MM:SS format
 */
export function formatTime(seconds: number): string {
  // Ensure seconds is always an integer
  const totalSeconds = Math.floor(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Get display text for timer (countdown or remaining time)
 */
export function getTimerDisplayText(timerState: TimerState): string {
  if (timerState.countdown !== null) {
    return `${Math.floor(timerState.countdown)}s`
  }
  return formatTime(timerState.remainingTime)
}
