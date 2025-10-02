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

    // More frequent polling as fallback for player updates
    const pollInterval = setInterval(async () => {
      try {
        const currentRoom = await roomManager.getRoom(roomCode)
        if (currentRoom) {
          // Always check for player count changes
          const currentPlayerCount = currentRoom.players?.length || 0
          const previousPlayerCount = room?.players?.length || 0
          
          if (currentPlayerCount !== previousPlayerCount) {
            setRoom(currentRoom)
            return
          }
          
          // Check for critical status changes
          if (currentRoom.status === "countdown" && room?.status !== "countdown") {
            setRoom(currentRoom)
            return
          }
          
          if (currentRoom.status === "quiz" && room?.status !== "quiz") {
            setRoom(currentRoom)
            return
          }
          
          if (currentRoom.status === "finished" && room?.status !== "finished") {
            setRoom(currentRoom)
            return
          }
        }
      } catch (error) {
        console.error("[useRoom] Error polling room:", error)
      }
    }, 1000) // Increased frequency - poll every 1 second for better sync

    const connectionCheck = setInterval(() => {
      setIsConnected(roomManager.isChannelConnected())
    }, 10000) // Check connection every 10 seconds

    return () => {
      clearInterval(pollInterval)
      if (unsubscribe) unsubscribe()
      clearInterval(connectionCheck)
    }
  }, [roomCode])

  return { room, loading, isConnected }
}
