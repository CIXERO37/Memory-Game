import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sessionsApi, isPlayersSupabaseConfigured } from '@/lib/supabase-players'

export async function GET(
  request: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  try {
    const { roomCode } = params

    // Get client timestamp for latency compensation
    const clientTimestamp = request.headers.get('x-client-timestamp')
    const requestStartTime = Date.now()

    let sessionData: any = null
    let countdownStartedAt: string | null = null
    let sessionStatus: string = 'waiting'

    // 🚀 SUPABASE B FIRST: Check Players DB for faster realtime
    if (isPlayersSupabaseConfigured()) {
      try {
        const sessionB = await sessionsApi.getSession(roomCode)
        if (sessionB) {
          sessionData = sessionB
          countdownStartedAt = sessionB.countdown_started_at || null
          sessionStatus = sessionB.status
          // Removed verbose logging
        }
      } catch (error) {
        console.warn('[CountdownState API] Supabase B fetch failed, falling back to A:', error)
      }
    }

    // Fallback to Supabase A if B not available
    if (!sessionData) {
      const { data, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('game_pin', roomCode)
        .single()

      if (sessionError || !data) {
        return NextResponse.json(
          { error: 'Room not found' },
          { status: 404 }
        )
      }

      sessionData = data
      countdownStartedAt = data.countdown_started_at
      sessionStatus = data.status
    }

    // Calculate server-side countdown state with precise timing
    const now = Date.now()
    let countdownState = null

    // Check if countdown is active
    // NOTE: Supabase B keeps status as 'waiting' during countdown, only countdown_started_at is set
    // So we check for countdown_started_at regardless of status
    if (countdownStartedAt) {
      const countdownStart = new Date(countdownStartedAt).getTime()
      const countdownDuration = 10 // Default 10 seconds

      // Calculate latency compensation more accurately
      let latencyCompensation = 0
      if (clientTimestamp) {
        const clientTime = parseInt(clientTimestamp)
        const roundTripTime = now - clientTime
        // Use more conservative latency compensation
        latencyCompensation = Math.min(roundTripTime / 2, 200) // Cap at 200ms
      }

      // Server-authoritative countdown calculation
      const compensatedNow = now + latencyCompensation
      const totalDuration = countdownDuration * 1000

      // Calculate remaining time based on server time
      const timeSinceStart = compensatedNow - countdownStart

      let remainingSeconds: number
      let isInDelayPeriod: boolean

      if (timeSinceStart < 0) {
        // Countdown hasn't started yet
        remainingSeconds = countdownDuration
        isInDelayPeriod = true
      } else if (timeSinceStart >= totalDuration) {
        // Countdown finished
        remainingSeconds = 0
        isInDelayPeriod = false
      } else {
        // Active countdown - calculate exact remaining time
        const remainingMs = totalDuration - timeSinceStart
        remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
        isInDelayPeriod = false
      }

      countdownState = {
        remaining: remainingSeconds,
        isActive: remainingSeconds > 0,
        serverTime: now,
        countdownStartTime: countdownStart,
        countdownEndTime: countdownStart + totalDuration,
        isInDelayPeriod: isInDelayPeriod,
        // Add precise timing info for client synchronization
        timeSinceStart: timeSinceStart,
        totalDuration: totalDuration,
        latencyCompensation: latencyCompensation,
        compensatedTime: compensatedNow
      }
    }

    // Map game_sessions status to Room status format
    let mappedStatus = sessionStatus
    if (countdownStartedAt && countdownState?.isActive) {
      // If countdown started and still active, treat as countdown
      mappedStatus = 'countdown'
    }

    return NextResponse.json({
      roomCode,
      status: mappedStatus,
      countdownState,
      serverTime: now,
      // Add precise timestamp for client synchronization
      timestamp: now,
      syncId: Math.floor(now / 1000), // Sync ID for debugging
      requestLatency: now - requestStartTime,
      clientTimestamp: clientTimestamp
    })

  } catch (error) {
    console.error('[CountdownState API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

