"use client"

import { useState, useEffect } from "react"
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
  const [previousPlayerCount, setPreviousPlayerCount] = useState(0)
  const [showPlayerJoinedAnimation, setShowPlayerJoinedAnimation] = useState(false)

  // Restore player info from Supabase session on page load/refresh
  useEffect(() => {
    const restorePlayerInfo = async () => {
      try {
        // Try to get session from Supabase
        const sessionId = sessionManager.getSessionIdFromStorage()
        if (sessionId) {
          const sessionData = await sessionManager.getSessionData(sessionId)
          if (sessionData && sessionData.user_type === 'player' && sessionData.room_code === roomCode) {
            setPlayerInfo({
              username: sessionData.user_data.username,
              avatar: sessionData.user_data.avatar,
              playerId: sessionData.user_data.id,
            })
            return
          }
        }
        
        // Fallback to localStorage if Supabase session not found
        if (typeof window !== 'undefined') {
          const storedPlayer = localStorage.getItem("currentPlayer")
          if (storedPlayer) {
            try {
              const player = JSON.parse(storedPlayer)
              if (player.roomCode === roomCode) {
                setPlayerInfo({
                  username: player.username,
                  avatar: player.avatar,
                  playerId: player.id,
                })
                return
              }
            } catch (error) {
              console.error("Error parsing stored player info:", error)
            }
          }
        }
        
        // If no valid player info found, redirect to join page
        router.push(`/join?room=${roomCode}`)
      } catch (error) {
        console.error("Error restoring player info:", error)
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
    
    // Listen for kick broadcasts
    kickChannel.onmessage = (event) => {
      if (event.data.type === 'player-kicked' && event.data.playerId === playerInfo?.playerId) {
        console.log("[WaitingRoom] Player was kicked via broadcast!")
        
        // Clear session when kicked
        sessionManager.clearSession().catch(console.error)
        if (typeof window !== 'undefined') {
          localStorage.removeItem("currentPlayer")
        }
        
        // Redirect to landing page immediately
        window.location.href = "/"
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
  useEffect(() => {
    if (!playerInfo || !roomCode) {
      console.log("[WaitingRoom] Skipping subscription setup - missing playerInfo or roomCode")
      return
    }

    console.log("[WaitingRoom] Setting up subscription for player:", playerInfo.playerId)
    let unsubscribe: (() => void) | null = null
    
    const setupSubscription = async () => {
      try {
        console.log("[WaitingRoom] Creating subscription for room:", roomCode)
        unsubscribe = await roomManager.subscribe(roomCode, async (updatedRoom) => {
          console.log("[WaitingRoom] Subscription callback triggered")
          console.log("[WaitingRoom] Updated room:", updatedRoom)
          console.log("[WaitingRoom] Current playerInfo:", playerInfo)
          
          if (updatedRoom?.code === roomCode && playerInfo) {
            console.log("[WaitingRoom] Room updated via subscription:", updatedRoom)
            console.log("[WaitingRoom] Current player ID:", playerInfo.playerId)
            console.log("[WaitingRoom] Players in room:", updatedRoom?.players?.map(p => ({ id: p.id, username: p.username })))
            
            // Check if current player still exists in room
            const existingPlayer = updatedRoom?.players?.find(p => p.id === playerInfo.playerId)
            console.log("[WaitingRoom] Existing player found:", existingPlayer)
            
            if (!existingPlayer) {
              console.log("[WaitingRoom] Player not found in room via subscription - they were kicked!")
              
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
            } else {
              console.log("[WaitingRoom] Player still exists in room")
            }
          } else {
            console.log("[WaitingRoom] Skipping - room code mismatch or no playerInfo")
          }
        })
        console.log("[WaitingRoom] Subscription created successfully")
      } catch (error) {
        console.error("[WaitingRoom] Error setting up subscription:", error)
      }
    }
    
    setupSubscription()

    return () => {
      console.log("[WaitingRoom] Cleaning up subscription")
      if (unsubscribe) unsubscribe()
    }
  }, [playerInfo, roomCode, router])

  // Periodic check as fallback (reduced frequency)
  useEffect(() => {
    if (!playerInfo || !room) {
      console.log("[WaitingRoom] Skipping periodic check - missing playerInfo or room")
      return
    }

    console.log("[WaitingRoom] Setting up periodic check for player:", playerInfo.playerId)
    const rejoinInterval = setInterval(async () => {
      try {
        console.log("[WaitingRoom] Periodic check running...")
        const currentRoom = await roomManager.getRoom(roomCode)
        if (currentRoom) {
          console.log("[WaitingRoom] Current room players:", currentRoom.players?.map(p => ({ id: p.id, username: p.username })))
          
          // Check for countdown status changes - log for debugging
          if (currentRoom.status === "countdown" && room.status !== "countdown") {
            console.log("[WaitingRoom] Countdown detected via periodic check - room should update via subscription")
            // The subscription should handle this, but we can log it for debugging
          }
          
          const existingPlayer = currentRoom.players.find(p => p.id === playerInfo.playerId)
          console.log("[WaitingRoom] Existing player in periodic check:", existingPlayer)
          
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
  }, [playerInfo, roomCode, router])

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
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
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
        <div className="relative z-10 text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg border-4 border-black shadow-2xl p-6">
              <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-black animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 pixel-font">LOADING...</h3>
              <p className="text-white/80 pixel-font-sm">CONNECTING TO ROOM</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state if room is not loaded yet but we have player info
  if (!room && !loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
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
        <div className="relative z-10 text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg border-4 border-black shadow-2xl p-6">
              <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-black animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 pixel-font">LOADING ROOM...</h3>
              <p className="text-white/80 pixel-font-sm">PLEASE WAIT</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
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
        <div className="relative z-10 text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-lg border-4 border-black shadow-2xl p-6">
              <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 pixel-font">ROOM NOT FOUND</h3>
              <p className="text-white/80 mb-4 pixel-font-sm">THE ROOM MAY HAVE BEEN CLOSED OR THE HOST LEFT</p>
              <div className="space-y-3">
                <div className="relative pixel-button-container">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                  <Button 
                    onClick={() => router.push(`/join?room=${roomCode}`)} 
                    className="relative bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-blue-400 hover:to-blue-500 transform hover:scale-105 transition-all duration-200 font-bold w-full"
                  >
                    <span className="pixel-font-sm">TRY TO REJOIN</span>
                  </Button>
                </div>
                <div className="relative pixel-button-container">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                  <Button 
                    onClick={() => router.push("/join")} 
                    className="relative bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200 font-bold w-full"
                  >
                    <span className="pixel-font-sm">JOIN DIFFERENT ROOM</span>
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
    
    // Show loading state while countdown data is being prepared (only if we don't have broadcast data)
    if (!countdownRoom?.countdownStartTime && !forceCountdown && !broadcastRoomData) {
      return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
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
          <div className="relative z-10 text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg border-4 border-black shadow-2xl p-6">
                <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-black animate-spin" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 pixel-font">PREPARING COUNTDOWN...</h3>
                <p className="text-white/80 pixel-font-sm">GET READY FOR THE QUIZ!</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

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
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
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
        <div className="relative z-10 text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-green-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-lg border-4 border-black shadow-2xl p-6">
              <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                <span className="text-2xl animate-pulse">🎮</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 pixel-font">STARTING QUIZ...</h3>
              <p className="text-white/80 pixel-font-sm">REDIRECTING TO THE GAME</p>
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

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* New Player Joined Animation */}
        {showPlayerJoinedAnimation && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-green-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
              <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-lg border-4 border-black shadow-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white border-2 border-black rounded flex items-center justify-center">
                    <Users className="h-5 w-5 text-black animate-pulse" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm pixel-font">NEW PLAYER JOINED!</div>
                    <div className="text-white/80 text-xs pixel-font-sm">REFRESHING PLAYER LIST...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pixel Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-8 h-8 bg-green-500 border-2 border-black rounded flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div className="inline-block bg-white border-2 border-black rounded px-4 py-2 pixel-header-title">
            <h1 className="text-xl font-bold text-black pixel-font">WAITING ROOM</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Pixel Waiting Room Card */}
          <div className="relative pixel-waiting-container">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-cyan-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-green-500 to-cyan-500 rounded-lg border-4 border-black shadow-2xl pixel-waiting-card">
              <div className="p-6">
                {/* Pixel Header */}
                <div className="text-center mb-6">
                  <div className="inline-block bg-white border-2 border-black rounded px-4 py-2">
                    <h2 className="text-lg font-bold text-black pixel-font">WAITING ROOM</h2>
                  </div>
                </div>
                
                {/* Current Player Card - Displayed at the top */}
                {playerInfo && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 bg-blue-500 border border-black rounded flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div className="inline-block bg-blue-500 border border-black rounded px-2 py-1">
                        <span className="text-white font-bold text-xs pixel-font-sm">
                          YOU
                        </span>
                      </div>
                    </div>

                    <div className="bg-blue-100 border-2 border-blue-500 rounded p-3 pixel-player-card">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 border border-black rounded flex items-center justify-center overflow-hidden">
                          <img 
                            src={playerInfo.avatar} 
                            alt={`${playerInfo.username} avatar`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-black pixel-font-sm">
                            {playerInfo.username.toUpperCase()}
                            <span className="text-blue-600 ml-2">(YOU)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Other Players Section */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-white border border-black rounded flex items-center justify-center">
                      <Users className="h-4 w-4 text-black" />
                    </div>
                    <div className="inline-block bg-white border border-black rounded px-2 py-1">
                      <span className="text-black font-bold text-xs pixel-font-sm">
                        OTHER PLAYERS ({room.players.filter(p => p.username !== playerInfo?.username).length})
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {room.players
                      .filter(player => player.username !== playerInfo?.username)
                      .map((player) => {
                        console.log("[WaitingRoom] Rendering other player:", player)
                        return (
                          <div key={player.id} className="bg-white border-2 border-black rounded p-3 pixel-player-card">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-100 border border-black rounded flex items-center justify-center overflow-hidden">
                                <img 
                                  src={player.avatar} 
                                  alt={`${player.username} avatar`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="font-bold text-black pixel-font-sm">
                                  {player.username.toUpperCase()}
                                  {player.isHost && <span className="text-orange-600 ml-2">(HOST)</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>

                {/* Pixel Status Section */}
                <div className="bg-black/20 border border-white/30 rounded p-4 text-center">
                  <div className="w-8 h-8 mx-auto bg-white border border-black rounded flex items-center justify-center mb-3">
                    <Clock className="h-5 w-5 text-black" />
                  </div>
                  <p className="text-white text-sm pixel-font-sm">
                    {room.gameStarted ? "GAME STARTING SOON..." : "WAITING FOR HOST TO START THE GAME..."}
                  </p>
                  
                  {/* Real-time Status Indicator */}
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-white/70 text-xs pixel-font-sm">LIVE UPDATES ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative pixel-button-container">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="relative bg-gradient-to-br from-red-500 to-red-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-red-400 hover:to-red-500 transform hover:scale-105 transition-all duration-200 font-bold">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <span className="pixel-font-sm">LEAVE ROOM</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gradient-to-br from-blue-500 to-purple-500 border-4 border-black shadow-2xl pixel-dialog">
                  <AlertDialogHeader>
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-3">
                        <span className="text-2xl">⚠️</span>
                      </div>
                      <div className="inline-block bg-white border-2 border-black rounded px-4 py-2 mb-3">
                        <AlertDialogTitle className="text-black font-bold text-lg pixel-font">LEAVE ROOM?</AlertDialogTitle>
                      </div>
                    </div>
                    <div className="bg-black/20 border border-white/30 rounded px-4 py-3 text-center">
                      <AlertDialogDescription className="text-white text-sm pixel-font-sm">
                        ARE YOU SURE YOU WANT TO LEAVE THIS ROOM? YOU WILL NEED TO REJOIN WITH THE ROOM CODE IF YOU WANT TO PARTICIPATE IN THE GAME.
                      </AlertDialogDescription>
                    </div>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex gap-3 justify-center mt-6">
                    <div className="relative pixel-button-container">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                      <AlertDialogCancel className="relative bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200 font-bold pixel-font-sm">
                        STAY IN ROOM
                      </AlertDialogCancel>
                    </div>
                    <div className="relative pixel-button-container">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                      <AlertDialogAction 
                        onClick={handleLeaveRoom} 
                        className="relative bg-gradient-to-br from-red-500 to-red-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-red-400 hover:to-red-500 transform hover:scale-105 transition-all duration-200 font-bold pixel-font-sm"
                      >
                        LEAVE ROOM
                      </AlertDialogAction>
                    </div>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
      <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 opacity-30 pixel-block-float">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute top-40 right-20 w-12 h-12 bg-gradient-to-br from-green-400 to-cyan-400 opacity-40 pixel-block-float-delayed">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-red-400 to-pink-400 opacity-35 pixel-block-float-slow">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute bottom-20 right-1/3 w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-400 opacity-45 pixel-block-float-delayed-slow">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
    </>
  )
}