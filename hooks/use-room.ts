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
        console.error("[useRoom] Error loading room:", error)
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
          console.log("[useRoom] Room updated via Supabase subscription:", updatedRoom)
          console.log("[useRoom] Players in updated room:", updatedRoom?.players?.map(p => ({ id: p.id, username: p.username, avatar: p.avatar })))
          setRoom(updatedRoom)
          setIsConnected(true) // Supabase is always connected
        })
      } catch (error) {
        console.error("[useRoom] Error setting up subscription:", error)
      }
    }
    
    setupSubscription()

    // Light polling as fallback for critical updates only
    const pollInterval = setInterval(async () => {
      try {
        const currentRoom = await roomManager.getRoom(roomCode)
        if (currentRoom) {
          // Only update for critical status changes
          if (currentRoom.status === "countdown" && room?.status !== "countdown") {
            console.log("[useRoom] Countdown detected via polling - updating immediately")
            setRoom(currentRoom)
            return
          }
          
          if (currentRoom.status === "quiz" && room?.status !== "quiz") {
            console.log("[useRoom] Game started detected via polling - updating immediately")
            setRoom(currentRoom)
            return
          }
          
          if (currentRoom.status === "finished" && room?.status !== "finished") {
            console.log("[useRoom] Game finished detected via polling - updating immediately")
            setRoom(currentRoom)
            return
          }
        }
      } catch (error) {
        console.error("[useRoom] Error polling room:", error)
      }
    }, 3000) // Reduced frequency - poll every 3 seconds for critical updates only

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
