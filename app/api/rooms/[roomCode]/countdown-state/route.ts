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

    // Get room data from Supabase
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', roomCode)
      .single()

    if (roomError || !roomData) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    // Calculate server-side countdown state with precise timing
    const now = Date.now()
    let countdownState = null

    if (roomData.status === 'countdown' && roomData.countdown_start_time && roomData.countdown_duration) {
      const countdownStart = new Date(roomData.countdown_start_time).getTime()
      
      // Add 2 second delay before countdown actually starts
      const actualCountdownStart = countdownStart + 2000 // 2 seconds delay
      const countdownEnd = actualCountdownStart + (roomData.countdown_duration * 1000)
      
      // Calculate latency compensation
      let latencyCompensation = 0
      if (clientTimestamp) {
        const clientTime = parseInt(clientTimestamp)
        const roundTripTime = now - clientTime
        latencyCompensation = roundTripTime / 2 // Half round trip time
      }
      
      // Server-authoritative countdown calculation with latency compensation
      const compensatedNow = now + latencyCompensation
      const timeSinceStart = compensatedNow - actualCountdownStart
      const totalDuration = roomData.countdown_duration * 1000
      
      let remainingSeconds: number
      let isInDelayPeriod: boolean
      
      if (compensatedNow < actualCountdownStart) {
        // Still in delay period
        remainingSeconds = roomData.countdown_duration
        isInDelayPeriod = true
      } else if (timeSinceStart >= totalDuration) {
        // Countdown finished
        remainingSeconds = 0
        isInDelayPeriod = false
      } else {
        // Active countdown - calculate exact remaining time
        const remainingMs = totalDuration - timeSinceStart
        remainingSeconds = Math.ceil(remainingMs / 1000)
        isInDelayPeriod = false
      }
      
      countdownState = {
        remaining: Math.max(0, remainingSeconds),
        isActive: remainingSeconds > 0,
        serverTime: now,
        countdownStartTime: actualCountdownStart,
        countdownEndTime: countdownEnd,
        isInDelayPeriod: isInDelayPeriod,
        // Add precise timing info for client synchronization
        timeSinceStart: timeSinceStart,
        totalDuration: totalDuration,
        latencyCompensation: latencyCompensation,
        compensatedTime: compensatedNow
      }
    }

    return NextResponse.json({
      roomCode,
      status: roomData.status,
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
