import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  try {
    const { roomCode } = params
    
    // Get client timestamp for latency compensation
    const clientTimestamp = request.headers.get('x-client-timestamp')
    const requestStartTime = Date.now()

    // Get game session data from Supabase
    const { data: sessionData, error: sessionError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('game_pin', roomCode)
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    // Calculate server-side countdown state with precise timing
    const now = Date.now()
    let countdownState = null

    // Check if countdown is active (status is 'active' and countdown_started_at exists)
    if (sessionData.status === 'active' && sessionData.countdown_started_at) {
      const countdownStart = new Date(sessionData.countdown_started_at).getTime()
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
    let mappedStatus = sessionData.status
    if (sessionData.status === 'active' && sessionData.countdown_started_at) {
      // If active and countdown started, treat as countdown
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
