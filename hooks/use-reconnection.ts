"use client"

import { useState, useEffect, useCallback } from "react"
import { roomManager } from "@/lib/room-manager"
import { sessionManager } from "@/lib/supabase-session-manager"

interface ReconnectionState {
  isReconnecting: boolean
  reconnectionAttempts: number
  isConnected: boolean
  lastDisconnect: Date | null
  canReconnect: boolean
}

interface PlayerInfo {
  id: string
  username: string
  avatar: string
  roomCode: string
}

export function useReconnection(roomCode: string | null, playerInfo: PlayerInfo | null) {
  const [reconnectionState, setReconnectionState] = useState<ReconnectionState>({
    isReconnecting: false,
    reconnectionAttempts: 0,
    isConnected: true,
    lastDisconnect: null,
    canReconnect: true
  })

  // Check if player can reconnect to the room
  const checkReconnectionEligibility = useCallback(async (): Promise<boolean> => {
    if (!roomCode || !playerInfo) return false

    try {
      // Check if room still exists
      const room = await roomManager.getRoom(roomCode)
      if (!room) {

        return false
      }

      // Check if game is finished
      if (room.status === 'finished') {

        return false
      }

      // Check if player was in the room
      const existingPlayer = room.players.find(p => p.id === playerInfo.id)
      if (existingPlayer) {

        return true
      }

      // If player not found but game hasn't started, they might have been kicked
      // but can still rejoin if game is in waiting status
      if (room.status === 'waiting') {

        return true
      }


      return false
    } catch (error) {
      console.error('[useReconnection] Error checking reconnection eligibility:', error)
      return false
    }
  }, [roomCode, playerInfo])

  // Attempt to reconnect player to the room
  const attemptReconnection = useCallback(async (): Promise<boolean> => {
    if (!roomCode || !playerInfo || reconnectionState.isReconnecting) {
      return false
    }



    setReconnectionState(prev => ({
      ...prev,
      isReconnecting: true,
      reconnectionAttempts: prev.reconnectionAttempts + 1
    }))

    try {
      // Check if we can reconnect
      const canReconnect = await checkReconnectionEligibility()
      if (!canReconnect) {
        setReconnectionState(prev => ({
          ...prev,
          isReconnecting: false,
          canReconnect: false
        }))
        return false
      }

      // Attempt to rejoin the room
      const success = await roomManager.rejoinRoom(roomCode, {
        id: playerInfo.id,
        nickname: playerInfo.username,
        avatar: playerInfo.avatar
      })

      if (success) {


        // Update session
        try {
          await sessionManager.getOrCreateSession(
            'player',
            {
              id: playerInfo.id,
              username: playerInfo.username,
              avatar: playerInfo.avatar,
              roomCode
            },
            roomCode
          )
        } catch (sessionError) {
          console.warn('[useReconnection] Failed to update session after reconnection:', sessionError)
        }

        setReconnectionState(prev => ({
          ...prev,
          isReconnecting: false,
          isConnected: true,
          lastDisconnect: null
        }))

        return true
      } else {
        console.error('[useReconnection] Failed to reconnect to room')
        setReconnectionState(prev => ({
          ...prev,
          isReconnecting: false,
          canReconnect: false
        }))
        return false
      }
    } catch (error) {
      console.error('[useReconnection] Error during reconnection:', error)
      setReconnectionState(prev => ({
        ...prev,
        isReconnecting: false
      }))
      return false
    }
  }, [roomCode, playerInfo, reconnectionState.isReconnecting, checkReconnectionEligibility])

  // Handle connection status changes
  const handleConnectionChange = useCallback((connected: boolean) => {
    setReconnectionState(prev => {
      if (prev.isConnected === connected) return prev

      return {
        ...prev,
        isConnected: connected,
        lastDisconnect: connected ? null : new Date()
      }
    })

    // If connection is restored and we were disconnected, attempt reconnection
    if (connected && !reconnectionState.isConnected && reconnectionState.canReconnect) {

      setTimeout(() => {
        attemptReconnection()
      }, 1000) // Wait 1 second before attempting reconnection
    }
  }, [reconnectionState.isConnected, reconnectionState.canReconnect, attemptReconnection])

  // Monitor connection status
  useEffect(() => {
    if (!roomCode) return

    const checkConnection = () => {
      const isConnected = roomManager.isChannelConnected()
      handleConnectionChange(isConnected)
    }

    // Check immediately
    checkConnection()

    // Check periodically
    const interval = setInterval(checkConnection, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [roomCode, handleConnectionChange])

  // Auto-reconnection on page visibility change (when user comes back to tab)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleVisibilityChange = () => {
      if (!document.hidden && !reconnectionState.isConnected && reconnectionState.canReconnect) {

        setTimeout(() => {
          attemptReconnection()
        }, 500)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [reconnectionState.isConnected, reconnectionState.canReconnect, attemptReconnection])

  // Force reconnection method
  const forceReconnect = useCallback(async (): Promise<boolean> => {

    return await attemptReconnection()
  }, [attemptReconnection])

  // Reset reconnection state
  const resetReconnectionState = useCallback(() => {
    setReconnectionState({
      isReconnecting: false,
      reconnectionAttempts: 0,
      isConnected: true,
      lastDisconnect: null,
      canReconnect: true
    })
  }, [])

  return {
    ...reconnectionState,
    attemptReconnection,
    forceReconnect,
    resetReconnectionState,
    checkReconnectionEligibility
  }
}
