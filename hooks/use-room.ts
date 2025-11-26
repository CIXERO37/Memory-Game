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
            console.log('[useRoom] Room updated via subscription:', {
              playerCount: updatedRoom.players?.length,
              players: updatedRoom.players?.map(p => ({
                nickname: p.nickname,
                questionsAnswered: p.questionsAnswered,
                quizScore: p.quizScore
              })),
              status: updatedRoom.status
            })
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
    const fallbackPolling = setInterval(async () => {
      try {
        const latestRoom = await roomManager.getRoom(roomCode)
        if (latestRoom) {
          const currentRoom = roomRef.current
          if (currentRoom) {
            const currentPlayerIds = currentRoom.players?.map(p => p.id).sort().join(',') || ''
            const latestPlayerIds = latestRoom.players?.map(p => p.id).sort().join(',') || ''

            // Check for player list changes
            const playerListChanged = currentPlayerIds !== latestPlayerIds

            // 🚀 IMPROVED: More sensitive progress change detection
            const progressChanged = currentRoom.players?.some(player => {
              const latestPlayer = latestRoom.players?.find(p => p.id === player.id)
              if (!latestPlayer) return false
              const currentAnswered = player.questionsAnswered || 0
              const latestAnswered = latestPlayer.questionsAnswered || 0
              const currentScore = player.quizScore || 0
              const latestScore = latestPlayer.quizScore || 0

              // Detect any progress increase (more sensitive than just difference)
              return latestAnswered > currentAnswered || latestScore > currentScore ||
                (player.memoryScore || 0) !== (latestPlayer.memoryScore || 0)
            })

            if (playerListChanged || progressChanged) {
              console.log('[useRoom] 🔄 Fallback polling detected changes, updating room:', {
                playerListChanged,
                progressChanged,
                players: latestRoom.players?.map(p => ({
                  nickname: p.nickname,
                  questionsAnswered: p.questionsAnswered,
                  quizScore: p.quizScore
                }))
              })
              setRoom(latestRoom)
              roomRef.current = latestRoom
            }
          } else {
            // If no current room, just set it
            setRoom(latestRoom)
            roomRef.current = latestRoom
          }
        }
      } catch (error) {
        // Silent error handling for polling
        console.error('[useRoom] Error in fallback polling:', error)
      }
    }, 5000) // 🚀 OPTIMIZED: Poll every 5 seconds as safety net, rely on Realtime for speed

    return () => {
      if (unsubscribe) unsubscribe()
      clearInterval(fallbackPolling)
    }
  }, [roomCode])

  return { room, loading, isConnected }
}
