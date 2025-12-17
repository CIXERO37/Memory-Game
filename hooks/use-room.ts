"use client"

import { useState, useEffect, useRef } from "react"
import { roomManager, type Room } from "@/lib/room-manager"

export function useRoom(roomCode: string | null) {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(true)
  const roomRef = useRef<Room | null>(null)

  useEffect(() => {
    if (!roomCode) {
      setRoom(null)
      roomRef.current = null
      setLoading(false)
      return
    }

    // Load room immediately without delay
    const loadRoom = async () => {
      try {
        const initialRoom = await roomManager.getRoom(roomCode)
        setRoom(initialRoom)
        roomRef.current = initialRoom
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
          // Compare with previous room to ensure we're actually updating
          const previousRoom = roomRef.current
          const hasChanged = !previousRoom ||
            previousRoom.players?.length !== updatedRoom?.players?.length ||
            JSON.stringify(previousRoom.players?.map(p => p.id).sort()) !==
            JSON.stringify(updatedRoom?.players?.map(p => p.id).sort()) ||
            previousRoom.status !== updatedRoom?.status ||
            // 🚀 FIX: Check countdownStartTime to detect countdown start
            previousRoom.countdownStartTime !== updatedRoom?.countdownStartTime ||
            previousRoom.gameStarted !== updatedRoom?.gameStarted ||
            // Check for score/progress changes
            JSON.stringify(previousRoom.players?.map(p => ({
              id: p.id,
              quizScore: p.quizScore,
              memoryScore: p.memoryScore,
              questionsAnswered: p.questionsAnswered
            })).sort((a, b) => a.id.localeCompare(b.id))) !==
            JSON.stringify(updatedRoom?.players?.map(p => ({
              id: p.id,
              quizScore: p.quizScore,
              memoryScore: p.memoryScore,
              questionsAnswered: p.questionsAnswered
            })).sort((a, b) => a.id.localeCompare(b.id)))

          if (hasChanged && updatedRoom) {

            setRoom(updatedRoom)
            roomRef.current = updatedRoom
            setIsConnected(true)
          }
        })
      } catch (error) {
        console.error('[useRoom] Error setting up subscription:', error)
      }
    }

    setupSubscription()

    // 🚀 IMPROVED: More aggressive polling for progress updates (every 1 second)
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [roomCode])

  return { room, loading, isConnected }
}
