import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  try {
    const { roomCode } = params
    const body = await request.json()
    const { playerId, clientTime } = body

    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      )
    }

    // Update player's last heartbeat timestamp
    const { error: updateError } = await supabase
      .from('players')
      .update({ 
        last_heartbeat: new Date().toISOString(),
        client_time_offset: clientTime ? Date.now() - clientTime : null
      })
      .eq('room_code', roomCode)
      .eq('player_id', playerId)

    if (updateError) {
      console.error('[Heartbeat API] Error updating heartbeat:', updateError)
      return NextResponse.json(
        { error: 'Failed to update heartbeat' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      serverTime: Date.now(),
      roomCode,
      playerId
    })

  } catch (error) {
    console.error('[Heartbeat API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
