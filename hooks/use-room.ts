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

    // Initial load
    const initialRoom = roomManager.getRoom(roomCode)
    setRoom(initialRoom)
    setLoading(false)

    // Subscribe to updates
    const unsubscribe = roomManager.subscribe((updatedRoom) => {
      if (updatedRoom?.code === roomCode) {
        setRoom(updatedRoom)
        setIsConnected(roomManager.isChannelConnected())
      }
    })

    const connectionCheck = setInterval(() => {
      setIsConnected(roomManager.isChannelConnected())
    }, 5000)

    return () => {
      unsubscribe()
      clearInterval(connectionCheck)
    }
  }, [roomCode])

  return { room, loading, isConnected }
}
