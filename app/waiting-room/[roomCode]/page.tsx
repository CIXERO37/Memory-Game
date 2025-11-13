"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ArrowLeft, Users, Clock } from "lucide-react"
import { useRoom } from "@/hooks/use-room"
import { roomManager } from "@/lib/room-manager"
import { sessionManager } from "@/lib/supabase-session-manager"
import { CountdownTimer } from "@/components/countdown-timer"
import { RobustGoogleAvatar } from "@/components/robust-google-avatar"

export default function WaitingRoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.roomCode as string
  const { room, loading } = useRoom(roomCode)
  const [gameStarting, setGameStarting] = useState(false)
  const [forceCountdown, setForceCountdown] = useState(false)
  const [broadcastRoomData, setBroadcastRoomData] = useState<any>(null)
  const [playerInfo, setPlayerInfo] = useState<{
    username: string
    avatar: string
    playerId: string
  } | null>(null)
  // Use ref to avoid stale closure in BroadcastChannel and subscription callbacks
  const playerInfoRef = useRef<{
    username: string
    avatar: string
    playerId: string
  } | null>(null)
  const [previousPlayerCount, setPreviousPlayerCount] = useState(0)
  const [showPlayerJoinedAnimation, setShowPlayerJoinedAnimation] = useState(false)

  // Restore player info from Supabase session on page load/refresh
  useEffect(() => {
    const restorePlayerInfo = async () => {
      try {
        console.log("[WaitingRoom] Restoring player info for room:", roomCode)
        
        // Try to get session from Supabase
        const sessionId = sessionManager.getSessionIdFromStorage()
        console.log("[WaitingRoom] Session ID from storage:", sessionId)
        
        if (sessionId) {
          const sessionData = await sessionManager.getSessionData(sessionId)
          console.log("[WaitingRoom] Session data from Supabase:", sessionData)
          
          if (sessionData && sessionData.user_type === 'player' && sessionData.room_code === roomCode) {
            console.log("[WaitingRoom] Valid session found, setting player info")
            const playerData = {
              username: sessionData.user_data.username,
              avatar: sessionData.user_data.avatar,
              playerId: sessionData.user_data.id,
            }
            setPlayerInfo(playerData)
            playerInfoRef.current = playerData
            return
          } else {
            console.log("[WaitingRoom] Session validation failed:", {
              hasSessionData: !!sessionData,
              userType: sessionData?.user_type,
              sessionRoomCode: sessionData?.room_code,
              expectedRoomCode: roomCode
            })
          }
        }
        
        // Fallback to localStorage if Supabase session not found
        if (typeof window !== 'undefined') {
          const storedPlayer = localStorage.getItem("currentPlayer")
          console.log("[WaitingRoom] Stored player from localStorage:", storedPlayer)
          
          if (storedPlayer) {
            try {
              const player = JSON.parse(storedPlayer)
              console.log("[WaitingRoom] Parsed player data:", player)
              
              if (player.roomCode === roomCode) {
                console.log("[WaitingRoom] Valid localStorage player found, setting player info")
                const playerData = {
                  username: player.username,
                  avatar: player.avatar,
                  playerId: player.id,
                }
                setPlayerInfo(playerData)
                playerInfoRef.current = playerData
                return
              } else {
                console.log("[WaitingRoom] localStorage room code mismatch:", {
                  storedRoomCode: player.roomCode,
                  expectedRoomCode: roomCode
                })
              }
            } catch (error) {
              console.error("[WaitingRoom] Error parsing stored player info:", error)
            }
          }
        }
        
        // If no valid player info found, try to get player from room data as last resort
        console.log("[WaitingRoom] No valid player info found, trying to get player from room data")
        
        // Try to get player info from room data (as fallback)
        if (room && room.players && room.players.length > 0) {
          console.log("[WaitingRoom] Found players in room, using first player as fallback")
          const firstPlayer = room.players[0]
          const playerData = {
            username: firstPlayer.username,
            avatar: firstPlayer.avatar,
            playerId: firstPlayer.id,
          }
          setPlayerInfo(playerData)
          playerInfoRef.current = playerData
          return
        }
        
        // If still no valid player info found, redirect to join page
        console.log("[WaitingRoom] No valid player info found anywhere, redirecting to join page")
        router.push(`/join?room=${roomCode}`)
      } catch (error) {
        console.error("[WaitingRoom] Error restoring player info:", error)
        router.push(`/join?room=${roomCode}`)
      }
    }

    restorePlayerInfo()
  }, [roomCode, router])

  // Listen for game start and countdown
  useEffect(() => {
    console.log("[WaitingRoom] Room status changed:", room?.status, "GameStarted:", room?.gameStarted)
    
    if (room?.status === "countdown") {
      console.log("[WaitingRoom] Countdown started, showing countdown timer immediately")
      // Force countdown to show immediately
      setForceCountdown(true)
      // Countdown will be handled by the CountdownTimer component
      // No need to set gameStarting state for countdown
    } else if (room?.gameStarted && !gameStarting) {
      setGameStarting(true)
      
      // Add a small delay before redirecting
      setTimeout(() => {
        const params = new URLSearchParams()
        if (playerInfo) {
          params.append("playerId", playerInfo.playerId)
          params.append("username", playerInfo.username)
          params.append("avatar", playerInfo.avatar)
        }
        window.location.href = `/game/${roomCode}/quiz?${params.toString()}`
      }, 1000)
    }
  }, [room?.status, room?.gameStarted, gameStarting, roomCode])

  // Detect new players joining and show animation
  useEffect(() => {
    if (room && room.players) {
      const currentPlayerCount = room.players.length
      
      // Check if a new player joined (not the first load)
      if (previousPlayerCount > 0 && currentPlayerCount > previousPlayerCount) {
        console.log("[WaitingRoom] New player joined! Count:", previousPlayerCount, "->", currentPlayerCount)
        
        // Show animation for new player
        setShowPlayerJoinedAnimation(true)
        
        // Hide animation after 3 seconds
        setTimeout(() => {
          setShowPlayerJoinedAnimation(false)
        }, 3000)
      }
      
      // Update previous count
      setPreviousPlayerCount(currentPlayerCount)
    }
  }, [room?.players, previousPlayerCount])

  // Immediate countdown detection with aggressive polling
  useEffect(() => {
    if (!roomCode) return

    console.log("[WaitingRoom] Setting up immediate countdown detection")
    
    // Set up broadcast channel for immediate communication
    const broadcastChannel = new BroadcastChannel(`countdown-${roomCode}`)
    const kickChannel = new BroadcastChannel(`kick-${roomCode}`)
    
    // Listen for countdown broadcasts
    broadcastChannel.onmessage = (event) => {
      if (event.data.type === 'countdown-started') {
        console.log("[WaitingRoom] Countdown broadcast received!")
        console.log("[WaitingRoom] Received room data:", event.data.room)
        console.log("[WaitingRoom] Countdown start time:", event.data.countdownStartTime)
        console.log("[WaitingRoom] Countdown duration:", event.data.countdownDuration)
        
        // Create room data with countdown information
        const countdownRoomData = {
          ...event.data.room,
          countdownStartTime: event.data.countdownStartTime,
          countdownDuration: event.data.countdownDuration
        }
        
        setBroadcastRoomData(countdownRoomData)
        setForceCountdown(true)
        // Immediately show countdown UI
        console.log("[WaitingRoom] Forcing countdown display immediately with data:", countdownRoomData)
      }
    }
    
    // Listen for kick broadcasts - use ref to avoid stale closure
    kickChannel.onmessage = (event) => {
      const currentPlayerInfo = playerInfoRef.current
      if (event.data.type === 'player-kicked' && event.data.playerId === currentPlayerInfo?.playerId) {
        console.log("[WaitingRoom] Player was kicked via broadcast!", {
          kickedPlayerId: event.data.playerId,
          currentPlayerId: currentPlayerInfo?.playerId
        })
        
        // Clear session when kicked
        sessionManager.clearSession().catch(console.error)
        if (typeof window !== 'undefined') {
          localStorage.removeItem("currentPlayer")
        }
        
        // Redirect to landing page immediately
        window.location.href = "/"
      } else {
        console.log("[WaitingRoom] Kick broadcast received but not for this player:", {
          kickedPlayerId: event.data.playerId,
          currentPlayerId: currentPlayerInfo?.playerId,
          match: event.data.playerId === currentPlayerInfo?.playerId
        })
      }
    }
    
    // Immediate check for countdown status
    const checkCountdownImmediately = async () => {
      try {
        const currentRoom = await roomManager.getRoom(roomCode)
        if (currentRoom?.status === "countdown") {
          console.log("[WaitingRoom] Countdown already active - should show immediately")
          setForceCountdown(true)
        }
      } catch (error) {
        console.error("[WaitingRoom] Error in immediate countdown check:", error)
      }
    }
    
    checkCountdownImmediately()
    
    // Very aggressive polling for countdown detection
    const immediatePolling = setInterval(async () => {
      try {
        const currentRoom = await roomManager.getRoom(roomCode)
        if (currentRoom?.status === "countdown") {
          console.log("[WaitingRoom] Countdown detected via immediate polling!")
          setForceCountdown(true)
          // Force a state update by triggering a re-render
          window.dispatchEvent(new CustomEvent('countdown-detected', { 
            detail: { room: currentRoom } 
          }))
        }
      } catch (error) {
        console.error("[WaitingRoom] Error in immediate polling:", error)
      }
    }, 500) // Check every 500ms for immediate detection

    // Listen for countdown detection events
    const handleCountdownDetected = (event: CustomEvent) => {
      console.log("[WaitingRoom] Countdown detection event received:", event.detail)
      setForceCountdown(true)
    }
    
    window.addEventListener('countdown-detected', handleCountdownDetected as EventListener)

    return () => {
      clearInterval(immediatePolling)
      window.removeEventListener('countdown-detected', handleCountdownDetected as EventListener)
      broadcastChannel.close()
      kickChannel.close()
    }
  }, [roomCode, playerInfo])

  // Listen for room updates via subscription to detect kicks immediately
  // Note: This subscription is separate from useRoom hook because we need to detect kicks
  // useRoom hook subscription is for general room updates, this one is specifically for kick detection
  useEffect(() => {
    if (!playerInfo || !roomCode) {
      console.log("[WaitingRoom] Skipping subscription setup - missing playerInfo or roomCode")
      return
    }

    console.log("[WaitingRoom] Setting up kick detection subscription for player:", playerInfo.playerId)
    let unsubscribe: (() => void) | null = null
    let isCleaningUp = false
    
    const setupSubscription = async () => {
      try {
        console.log("[WaitingRoom] Creating kick detection subscription for room:", roomCode)
        unsubscribe = await roomManager.subscribe(roomCode, async (updatedRoom) => {
          // Skip if already cleaning up
          if (isCleaningUp) return
          
          console.log("[WaitingRoom] Kick detection subscription callback triggered")
          
          // Use ref to avoid stale closure
          const currentPlayerInfo = playerInfoRef.current
          
          if (updatedRoom?.code === roomCode && currentPlayerInfo) {
            // Check if current player still exists in room
            const existingPlayer = updatedRoom?.players?.find(p => p.id === currentPlayerInfo.playerId)
            
            if (!existingPlayer) {
              console.log("[WaitingRoom] Player not found in room via subscription - they were kicked!", {
                playerId: currentPlayerInfo.playerId,
                playersInRoom: updatedRoom?.players?.map(p => p.id)
              })
              
              isCleaningUp = true
              
              // Clear session when kicked
              try {
                await sessionManager.clearSession()
                if (typeof window !== 'undefined') {
                  localStorage.removeItem("currentPlayer")
                }
                console.log("[WaitingRoom] Session cleared successfully")
              } catch (error) {
                console.error("[WaitingRoom] Error clearing session after kick:", error)
              }
              
              // Player was kicked, redirect to landing page immediately
              console.log("[WaitingRoom] Player was kicked - redirecting to landing page...")
              try {
                // Use window.location for immediate redirect to landing page
                window.location.href = "/"
              } catch (error) {
                console.error("[WaitingRoom] Redirect failed:", error)
                // Fallback to join page
                window.location.href = `/join?room=${roomCode}`
              }
              return
            }
          }
        })
        console.log("[WaitingRoom] Kick detection subscription created successfully")
      } catch (error) {
        console.error("[WaitingRoom] Error setting up kick detection subscription:", error)
      }
    }
    
    setupSubscription()

    return () => {
      console.log("[WaitingRoom] Cleaning up kick detection subscription")
      isCleaningUp = true
      if (unsubscribe) {
        try {
          unsubscribe()
        } catch (error) {
          console.error("[WaitingRoom] Error during subscription cleanup:", error)
        }
        unsubscribe = null
      }
    }
  }, [playerInfo, roomCode, router])

  // Periodic check as fallback for player list updates and kick detection
  useEffect(() => {
    if (!playerInfo || !room || !roomCode) {
      console.log("[WaitingRoom] Skipping periodic check - missing playerInfo, room, or roomCode")
      return
    }

    console.log("[WaitingRoom] Setting up periodic check for player list updates:", playerInfo.playerId)
    const rejoinInterval = setInterval(async () => {
      try {
        // Use ref to get current player info
        const currentPlayerInfo = playerInfoRef.current
        if (!currentPlayerInfo) {
          console.log("[WaitingRoom] No player info in ref, skipping periodic check")
          return
        }

        console.log("[WaitingRoom] Periodic check running for player list updates...")
        const currentRoom = await roomManager.getRoom(roomCode)
        if (currentRoom) {
          // Compare player lists to detect new players
          const currentPlayerIds = room.players.map(p => p.id).sort().join(',')
          const latestPlayerIds = currentRoom.players.map(p => p.id).sort().join(',')
          
          console.log("[WaitingRoom] Player list comparison:", {
            current: currentPlayerIds,
            latest: latestPlayerIds,
            currentCount: room.players.length,
            latestCount: currentRoom.players.length
          })
          
          // If player list changed, force update via subscription callback
          if (currentPlayerIds !== latestPlayerIds) {
            console.log("[WaitingRoom] 🔄 Player list changed detected via periodic check, forcing update")
            // Trigger subscription callback manually to update room state
            // The useRoom hook should pick this up, but we can also manually trigger
            // by calling getRoom again which will update the subscription
            const updatedRoom = await roomManager.getRoom(roomCode)
            if (updatedRoom) {
              // Force re-render by updating room state
              // This will be handled by useRoom hook subscription, but we log it
              console.log("[WaitingRoom] ✅ Player list updated:", updatedRoom.players.map(p => p.username))
            }
          }
          
          // Check for countdown status changes - log for debugging
          if (currentRoom.status === "countdown" && room.status !== "countdown") {
            console.log("[WaitingRoom] Countdown detected via periodic check - room should update via subscription")
            // The subscription should handle this, but we can log it for debugging
          }
          
          const existingPlayer = currentRoom.players.find(p => p.id === currentPlayerInfo.playerId)
          console.log("[WaitingRoom] Existing player in periodic check:", existingPlayer, {
            playerId: currentPlayerInfo.playerId,
            playersInRoom: currentRoom.players.map(p => p.id)
          })
          
          if (!existingPlayer) {
            console.log("[WaitingRoom] Player not found in room via periodic check - they may have been kicked")
            
            // Clear session when kicked
            try {
              await sessionManager.clearSession()
              if (typeof window !== 'undefined') {
                localStorage.removeItem("currentPlayer")
              }
              console.log("[WaitingRoom] Session cleared via periodic check")
            } catch (error) {
              console.error("[WaitingRoom] Error clearing session after kick:", error)
            }
            
            // Player was kicked or left, redirect to landing page
            console.log("[WaitingRoom] Player was kicked - redirecting to landing page via periodic check...")
            try {
              // Use window.location for immediate redirect to landing page
              window.location.href = "/"
            } catch (error) {
              console.error("[WaitingRoom] Redirect failed in periodic check:", error)
              // Fallback to join page
              window.location.href = `/join?room=${roomCode}`
            }
            return
          } else {
            // Player exists, just ensure they're marked as ready
            existingPlayer.isReady = true
            console.log("[WaitingRoom] Player still exists in room via periodic check")
          }
        } else {
          console.log("[WaitingRoom] No room data in periodic check")
        }
      } catch (error) {
        console.error("[WaitingRoom] Error in periodic room check:", error)
      }
    }, 1000) // Check every 1 second for faster detection

    return () => {
      console.log("[WaitingRoom] Cleaning up periodic check")
      clearInterval(rejoinInterval)
    }
  }, [playerInfo, roomCode, router, room])

  const handleLeaveRoom = async () => {
    if (playerInfo) {
      try {
        await roomManager.leaveRoom(roomCode, playerInfo.playerId)
      } catch (error) {
        console.error("[WaitingRoom] Error leaving room:", error)
      }
    }
    
    // Clear Supabase session
    try {
      await sessionManager.clearSession()
    } catch (error) {
      console.error("[WaitingRoom] Error clearing session:", error)
    }
    
    // Fallback: clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem("currentPlayer")
    }
    
    router.push("/join")
  }

  const handleCountdownComplete = () => {
    // Redirect to quiz when countdown completes
    const params = new URLSearchParams()
    if (playerInfo) {
      params.append("playerId", playerInfo.playerId)
      params.append("username", playerInfo.username)
      params.append("avatar", playerInfo.avatar)
    }
    window.location.href = `/game/${roomCode}/quiz?${params.toString()}`
  }

  if (loading || !playerInfo) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        {/* Pixel Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="pixel-grid"></div>
        </div>
        {/* Retro Scanlines */}
        <div className="absolute inset-0 opacity-10">
          <div className="scanlines"></div>
        </div>
        {/* Floating Pixel Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <PixelBackgroundElements />
        </div>
        <div className="relative z-10 text-center w-full max-w-sm">
          <div className="relative inline-block mb-4 sm:mb-6 w-full">
            <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-linear-to-br from-blue-500 to-purple-500 rounded-lg border-2 sm:border-4 border-black shadow-2xl p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-3 sm:mb-4">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-black animate-pulse" />
              </div>
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-2 pixel-font">LOADING...</h3>
              <p className="text-white/80 pixel-font-sm text-xs sm:text-sm">CONNECTING TO ROOM</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state if room is not loaded yet but we have player info
  if (!room && !loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        {/* Pixel Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="pixel-grid"></div>
        </div>
        {/* Retro Scanlines */}
        <div className="absolute inset-0 opacity-10">
          <div className="scanlines"></div>
        </div>
        {/* Floating Pixel Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <PixelBackgroundElements />
        </div>
        <div className="relative z-10 text-center w-full max-w-sm">
          <div className="relative inline-block mb-4 sm:mb-6 w-full">
            <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-linear-to-br from-blue-500 to-purple-500 rounded-lg border-2 sm:border-4 border-black shadow-2xl p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-3 sm:mb-4">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-black animate-pulse" />
              </div>
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-2 pixel-font">LOADING ROOM...</h3>
              <p className="text-white/80 pixel-font-sm text-xs sm:text-sm">PLEASE WAIT</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        {/* Pixel Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="pixel-grid"></div>
        </div>
        {/* Retro Scanlines */}
        <div className="absolute inset-0 opacity-10">
          <div className="scanlines"></div>
        </div>
        {/* Floating Pixel Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <PixelBackgroundElements />
        </div>
        <div className="relative z-10 text-center w-full max-w-sm">
          <div className="relative inline-block mb-4 sm:mb-6 w-full">
            <div className="absolute inset-0 bg-linear-to-br from-red-600 to-red-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-linear-to-br from-red-500 to-red-600 rounded-lg border-2 sm:border-4 border-black shadow-2xl p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">⚠️</span>
              </div>
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-2 pixel-font">ROOM NOT FOUND</h3>
              <p className="text-white/80 mb-3 sm:mb-4 pixel-font-sm text-xs sm:text-sm px-2">THE ROOM MAY HAVE BEEN CLOSED OR THE HOST LEFT</p>
              <div className="space-y-2 sm:space-y-3">
                <div className="relative pixel-button-container">
                  <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-blue-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                  <Button 
                    onClick={() => router.push(`/join?room=${roomCode}`)} 
                    className="relative bg-linear-to-br from-blue-500 to-blue-600 border-2 border-black rounded-lg text-white hover:bg-linear-to-br hover:from-blue-400 hover:to-blue-500 transform hover:scale-105 transition-all duration-200 font-bold w-full min-h-[44px]"
                  >
                    <span className="pixel-font-sm text-xs sm:text-sm">TRY TO REJOIN</span>
                  </Button>
                </div>
                <div className="relative pixel-button-container">
                  <div className="absolute inset-0 bg-linear-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                  <Button 
                    onClick={() => router.push("/join")} 
                    className="relative bg-linear-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-linear-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200 font-bold w-full min-h-[44px]"
                  >
                    <span className="pixel-font-sm text-xs sm:text-sm">JOIN DIFFERENT ROOM</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show countdown timer if room is in countdown status or force countdown is true
  if ((room && room.status === "countdown") || forceCountdown) {
    // Use broadcast room data if available, otherwise use current room data
    const countdownRoom = broadcastRoomData || room
    
    // Always show CountdownTimer when countdown is active, even if data is not fully ready
    // This ensures countdown number is displayed immediately
    return (
      <CountdownTimer 
        room={countdownRoom || { 
          code: roomCode, 
          status: "countdown" as const, 
          countdownStartTime: (countdownRoom as any)?.countdownStartTime || new Date().toISOString(), 
          countdownDuration: (countdownRoom as any)?.countdownDuration || 10 
        }} 
        onCountdownComplete={handleCountdownComplete}
      />
    )
  }

  if (gameStarting) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        {/* Pixel Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="pixel-grid"></div>
        </div>
        {/* Retro Scanlines */}
        <div className="absolute inset-0 opacity-10">
          <div className="scanlines"></div>
        </div>
        {/* Floating Pixel Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <PixelBackgroundElements />
        </div>
        <div className="relative z-10 text-center w-full max-w-sm">
          <div className="relative inline-block mb-4 sm:mb-6 w-full">
            <div className="absolute inset-0 bg-linear-to-br from-green-600 to-green-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-linear-to-br from-green-500 to-green-600 rounded-lg border-2 sm:border-4 border-black shadow-2xl p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl animate-pulse">🎮</span>
              </div>
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-2 pixel-font">STARTING QUIZ...</h3>
              <p className="text-white/80 pixel-font-sm text-xs sm:text-sm">REDIRECTING TO THE GAME</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
      {/* Pixel Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="pixel-grid"></div>
      </div>
      
      {/* Retro Scanlines */}
      <div className="absolute inset-0 opacity-10">
        <div className="scanlines"></div>
      </div>
      
      {/* Floating Pixel Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <PixelBackgroundElements />
      </div>

      {/* Pixel Header with responsive layout */}
      <div className="relative z-10 w-full px-2 sm:px-4 pt-3 sm:pt-4 md:pt-6">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {/* Left side - Memory Quiz Logo */}
          <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              {/* Memory Quiz Logo with glow effect */}
              <img 
                draggable={false}
                src="/images/memoryquiz.webp" 
                alt="Memory Quiz" 
                className="h-6 sm:h-8 md:h-10 lg:h-12 xl:h-16 2xl:h-20 w-auto object-contain max-w-[45%] sm:max-w-none"
                style={{ 
                  filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5)) drop-shadow(0 4px 12px rgba(0,0,0,0.6))',
                }}
              />
            </div>
          </div>
          
          {/* Right side - GameForSmart Logo */}
          <div className="shrink-0">
            <img 
              draggable={false}
              src="/images/gameforsmartlogo.png" 
              alt="GameForSmart Logo" 
              className="h-6 sm:h-8 md:h-10 lg:h-12 xl:h-16 2xl:h-20 w-auto object-contain drop-shadow-lg max-w-[45%] sm:max-w-none"
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* New Player Joined Animation */}
        {showPlayerJoinedAnimation && (
          <div className="fixed top-2 sm:top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce w-[90%] sm:w-auto max-w-sm">
            <div className="relative inline-block w-full">
              <div className="absolute inset-0 bg-linear-to-br from-green-600 to-green-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
              <div className="relative bg-linear-to-br from-green-500 to-green-600 rounded-lg border-2 sm:border-4 border-black shadow-2xl p-2 sm:p-3 md:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white border-2 border-black rounded flex items-center justify-center shrink-0">
                    <Users className="h-3 w-3 sm:h-5 sm:w-5 text-black animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-bold text-xs sm:text-sm pixel-font truncate">NEW PLAYER JOINED!</div>
                    <div className="text-white/80 text-[10px] sm:text-xs pixel-font-sm truncate">REFRESHING PLAYER LIST...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

       

        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
          {/* Pixel Waiting Room Card */}
          <div className="relative pixel-waiting-container">
            <div className="absolute inset-0 bg-linear-to-br from-green-600 to-cyan-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-linear-to-br from-green-500 to-cyan-500 rounded-lg border-2 sm:border-4 border-black shadow-2xl pixel-waiting-card">
              <div className="p-3 sm:p-4 md:p-6 relative">
                {/* Leave Room Button - Top Right Corner */}
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 md:top-6 md:right-6 z-10">
                  <div className="relative pixel-button-container">
                    <div className="absolute inset-0 bg-linear-to-br from-red-600 to-red-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="relative bg-linear-to-br from-red-500 to-red-600 border-2 border-black rounded-lg text-white hover:bg-linear-to-br hover:from-red-400 hover:to-red-500 transform hover:scale-105 transition-all duration-200 font-bold text-[10px] sm:text-xs md:text-sm px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-2 min-h-[32px] sm:min-h-[36px] md:min-h-[44px]">
                          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="pixel-font-sm hidden sm:inline">LEAVE ROOM</span>
                          <span className="pixel-font-sm sm:hidden">LEAVE</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-linear-to-br from-blue-500 to-purple-500 border-2 sm:border-4 border-black shadow-2xl pixel-dialog max-w-[90vw] sm:max-w-md">
                        <AlertDialogHeader>
                          <div className="text-center mb-3 sm:mb-4">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-2 sm:mb-3">
                              <span className="text-xl sm:text-2xl">⚠️</span>
                            </div>
                            <div className="inline-block bg-white border-2 border-black rounded px-3 py-1.5 sm:px-4 sm:py-2 mb-2 sm:mb-3">
                              <AlertDialogTitle className="text-black font-bold text-sm sm:text-base md:text-lg pixel-font">LEAVE ROOM?</AlertDialogTitle>
                            </div>
                          </div>
                          <div className="bg-black/20 border border-white/30 rounded px-3 py-2 sm:px-4 sm:py-3 text-center">
                            <AlertDialogDescription className="text-white text-xs sm:text-sm pixel-font-sm">
                              ARE YOU SURE YOU WANT TO LEAVE THIS ROOM?
                            </AlertDialogDescription>
                          </div>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mt-4 sm:mt-6">
                          <div className="relative pixel-button-container w-full sm:w-auto">
                            <div className="absolute inset-0 bg-linear-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                            <AlertDialogCancel className="relative bg-linear-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-linear-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200 font-bold pixel-font-sm w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 min-h-[44px]">
                              STAY IN ROOM
                            </AlertDialogCancel>
                          </div>
                          <div className="relative pixel-button-container w-full sm:w-auto">
                            <div className="absolute inset-0 bg-linear-to-br from-red-600 to-red-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                            <AlertDialogAction 
                              onClick={handleLeaveRoom} 
                              className="relative bg-linear-to-br from-red-500 to-red-600 border-2 border-black rounded-lg text-white hover:bg-linear-to-br hover:from-red-400 hover:to-red-500 transform hover:scale-105 transition-all duration-200 font-bold pixel-font-sm w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 min-h-[44px]"
                            >
                              LEAVE ROOM
                            </AlertDialogAction>
                          </div>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Pixel Header */}
                <div className="text-center mb-3 sm:mb-4 md:mb-6">
                  <div className="inline-block bg-white border-2 border-black rounded px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2">
                    <h2 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-black pixel-font">WAITING ROOM</h2>
                  </div>
                </div>
                
                {/* Current Player Card - Displayed at the top */}
                {playerInfo && (
                  <div className="mb-3 sm:mb-4 md:mb-6">
                    <div className="bg-blue-100 border-2 border-blue-500 rounded p-2 sm:p-3 pixel-player-card">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center overflow-hidden shrink-0">
                          <RobustGoogleAvatar
                            avatarUrl={playerInfo.avatar}
                            alt={`${playerInfo.username} avatar`}
                            className="w-full h-full"
                            width={40}
                            height={40}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-black pixel-font-sm text-xs sm:text-sm truncate">
                            <span className="truncate block">{playerInfo.username.toUpperCase()}</span>
                            <span className="text-blue-600 text-[10px] sm:text-xs">(YOU)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Other Players Section */}
                <div className="mb-3 sm:mb-4 md:mb-6">
                  <div className="grid gap-2 sm:gap-3">
                    {room.players
                      .filter(player => player.username !== playerInfo?.username)
                      .map((player) => {
                        console.log("[WaitingRoom] Rendering other player:", player)
                        return (
                          <div key={player.id} className="bg-white border-2 border-black rounded p-2 sm:p-3 pixel-player-card">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center overflow-hidden shrink-0">
                                <RobustGoogleAvatar
                                  avatarUrl={player.avatar}
                                  alt={`${player.username} avatar`}
                                  className="w-full h-full"
                                  width={32}
                                  height={32}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-black pixel-font-sm text-xs sm:text-sm">
                                  <span className="truncate block">{player.username.toUpperCase()}</span>
                                  {player.isHost && <span className="text-orange-600 text-[10px] sm:text-xs">(HOST)</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>

                {/* Pixel Status Section */}
                <div className="bg-black/20 border border-white/30 rounded p-3 sm:p-4 text-center">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto bg-white border border-black rounded flex items-center justify-center mb-2 sm:mb-3">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-black" />
                  </div>
                  <p className="text-white text-xs sm:text-sm pixel-font-sm leading-tight sm:leading-normal">
                    {room.gameStarted ? "GAME STARTING SOON..." : "WAITING FOR HOST TO START THE GAME..."}
                  </p>
                  
                 
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PixelBackgroundElements() {
  const pixels = [
    { id: 1, color: 'bg-red-500', size: 'w-2 h-2', delay: '0s', duration: '3s', x: '10%', y: '20%' },
    { id: 2, color: 'bg-blue-500', size: 'w-3 h-3', delay: '1s', duration: '4s', x: '80%', y: '30%' },
    { id: 3, color: 'bg-green-500', size: 'w-2 h-2', delay: '2s', duration: '3.5s', x: '20%', y: '70%' },
    { id: 4, color: 'bg-yellow-500', size: 'w-4 h-4', delay: '0.5s', duration: '5s', x: '70%', y: '10%' },
    { id: 5, color: 'bg-purple-500', size: 'w-2 h-2', delay: '1.5s', duration: '4.5s', x: '50%', y: '80%' },
    { id: 6, color: 'bg-pink-500', size: 'w-3 h-3', delay: '2.5s', duration: '3s', x: '30%', y: '50%' },
    { id: 7, color: 'bg-cyan-500', size: 'w-2 h-2', delay: '0.8s', duration: '4s', x: '90%', y: '60%' },
    { id: 8, color: 'bg-orange-500', size: 'w-3 h-3', delay: '1.8s', duration: '3.8s', x: '15%', y: '40%' },
    { id: 9, color: 'bg-lime-500', size: 'w-2 h-2', delay: '2.2s', duration: '4.2s', x: '60%', y: '25%' },
    { id: 10, color: 'bg-indigo-500', size: 'w-4 h-4', delay: '0.3s', duration: '5.5s', x: '85%', y: '75%' },
  ]

  return (
    <>
      {pixels.map((pixel) => (
        <div
          key={pixel.id}
          className={`absolute ${pixel.color} ${pixel.size} pixel-float`}
          style={{
            left: pixel.x,
            top: pixel.y,
            animationDelay: pixel.delay,
            animationDuration: pixel.duration,
          }}
        />
      ))}
      
      {/* Floating Pixel Blocks */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-linear-to-br from-blue-400 to-purple-400 opacity-30 pixel-block-float">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute top-40 right-20 w-12 h-12 bg-linear-to-br from-green-400 to-cyan-400 opacity-40 pixel-block-float-delayed">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-linear-to-br from-red-400 to-pink-400 opacity-35 pixel-block-float-slow">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute bottom-20 right-1/3 w-14 h-14 bg-linear-to-br from-yellow-400 to-orange-400 opacity-45 pixel-block-float-delayed-slow">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
    </>
  )
}