"use client"

import { useState, useEffect } from "react"
import { roomManager, type Room } from "@/lib/room-manager"

export function useRoom(roomCode: string | null) {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(true)

  useEffect(() => {
    if (!roomCode) {
      setRoom(null)
      setLoading(false)
      return
    }

    // Load room immediately without delay
    const loadRoom = async () => {
      try {
        const initialRoom = await roomManager.getRoom(roomCode)
        setRoom(initialRoom)
        setLoading(false)
      } catch (error) {
        setLoading(false)
      }
    }

    // Load immediately first
    loadRoom()

    // Subscribe to updates using Supabase realtime
    let unsubscribe: (() => void) | null = null
    
    const setupSubscription = async () => {
      try {
        unsubscribe = await roomManager.subscribe(roomCode, (updatedRoom) => {
          // Always update the room data when subscription triggers
          setRoom(updatedRoom)
          setIsConnected(true) // Supabase is always connected
        })
      } catch (error) {
        // Silent error handling
      }
    }
    
    setupSubscription()

    // No polling needed - Supabase realtime subscription handles all updates
    // Subscription callback will trigger whenever room or players data changes
    // This eliminates the need for continuous polling requests

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [roomCode])

  return { room, loading, isConnected }
}
