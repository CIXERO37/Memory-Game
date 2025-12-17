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
import { VirtualizedPlayerList } from "@/components/virtualized-player-grid"

export default function WaitingRoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.roomCode as string
  const { room, loading } = useRoom(roomCode)
  const [gameStarting, setGameStarting] = useState(false)
  const [forceCountdown, setForceCountdown] = useState(false)
  const [broadcastRoomData, setBroadcastRoomData] = useState<any>(null)
  const [playerInfo, setPlayerInfo] = useState<{
    nickname: string
    avatar: string
    playerId: string
  } | null>(null)
  // Use ref to avoid stale closure in BroadcastChannel and subscription callbacks
  const playerInfoRef = useRef<{
    nickname: string
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

            const playerData = {
              nickname: sessionData.user_data.nickname || sessionData.user_data.username,
              avatar: sessionData.user_data.avatar,
              playerId: sessionData.user_data.id,
            }
            setPlayerInfo(playerData)
            playerInfoRef.current = playerData
            return
          } else {

          }
        }

        // Fallback to localStorage if Supabase session not found
        if (typeof window !== 'undefined') {
          const storedPlayer = localStorage.getItem("currentPlayer")


          if (storedPlayer) {
            try {
              const player = JSON.parse(storedPlayer)


              if (player.roomCode === roomCode) {

                const playerData = {
                  nickname: player.nickname || player.username,
                  avatar: player.avatar,
                  playerId: player.id,
                }
                setPlayerInfo(playerData)
                playerInfoRef.current = playerData
                return
              } else {

              }
            } catch (error) {
              console.error("[WaitingRoom] Error parsing stored player info:", error)
            }
          }
        }

        // If no valid player info found, try to get player from room data as last resort


        // Try to get player info from room data (as fallback)
        if (room && room.players && room.players.length > 0) {

          const firstPlayer = room.players[0]
          const playerData = {
            nickname: firstPlayer.nickname,
            avatar: firstPlayer.avatar,
            playerId: firstPlayer.id,
          }
          setPlayerInfo(playerData)
          playerInfoRef.current = playerData
          return
        }

        // If still no valid player info found, redirect to join page

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
    // 🚀 FIX: Check for countdown first using both status and countdownStartTime
    // This ensures countdown is detected even if status hasn't updated yet
    if (room?.status === "countdown" || (room?.countdownStartTime && !room?.gameStarted)) {
      // Force countdown to show immediately
      setForceCountdown(true)
      // Countdown will be handled by the CountdownTimer component
      // No need to set gameStarting state for countdown
    } else if (room?.status === "quiz" && !gameStarting) {
      // Only redirect to quiz after countdown completes (status becomes 'quiz')
      setGameStarting(true)
      setForceCountdown(false)

      // Add a small delay before redirecting
      window.location.href = `/quiz/${roomCode}`
    }
  }, [room?.status, room?.countdownStartTime, room?.gameStarted, gameStarting, roomCode])

  // Detect new players joining and show animation
  useEffect(() => {
    if (room && room.players) {
      const currentPlayerCount = room.players.length

      // Check if a new player joined (not the first load)
      if (previousPlayerCount > 0 && currentPlayerCount > previousPlayerCount) {


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



    // Set up broadcast channel for immediate communication
    const broadcastChannel = new BroadcastChannel(`countdown-${roomCode}`)
    const kickChannel = new BroadcastChannel(`kick-${roomCode}`)
    const hostLeftChannel = new BroadcastChannel(`host-left-${roomCode}`)

    // Listen for countdown broadcasts
    broadcastChannel.onmessage = (event) => {
      if (event.data.type === 'countdown-started') {


        // Create room data with countdown information
        const countdownRoomData = {
          ...event.data.room,
          countdownStartTime: event.data.countdownStartTime,
          countdownDuration: event.data.countdownDuration
        }

        setBroadcastRoomData(countdownRoomData)
        setForceCountdown(true)
        // Immediately show countdown UI

      }
    }

    // Listen for kick broadcasts - use ref to avoid stale closure
    kickChannel.onmessage = (event) => {
      const currentPlayerInfo = playerInfoRef.current
      if (event.data.type === 'player-kicked' && event.data.playerId === currentPlayerInfo?.playerId) {


        // Clear session when kicked
        sessionManager.clearSession().catch(console.error)
        if (typeof window !== 'undefined') {
          localStorage.removeItem("currentPlayer")
        }

        // Redirect to landing page immediately
        window.location.href = "/"
      } else {

      }
    }

    // Listen for host-left broadcasts - redirect players when host leaves
    hostLeftChannel.onmessage = (event) => {
      if (event.data.type === 'host-left' && event.data.roomCode === roomCode) {
        console.log('[WaitingRoom] Host left the room, redirecting...')

        // Clear session
        sessionManager.clearSession().catch(console.error)
        if (typeof window !== 'undefined') {
          localStorage.removeItem("currentPlayer")
        }

        // Redirect to join page with message
        window.location.href = "/join?message=host-left"
      }
    }

    // Immediate check for countdown status
    const checkCountdownImmediately = async () => {
      try {
        const currentRoom = await roomManager.getRoom(roomCode)
        if (currentRoom?.status === "countdown") {

          setForceCountdown(true)
        }
      } catch (error) {
        console.error("[WaitingRoom] Error in immediate countdown check:", error)
      }
    }

    checkCountdownImmediately()



    // Listen for countdown detection events
    const handleCountdownDetected = (event: CustomEvent) => {

      setForceCountdown(true)
    }

    window.addEventListener('countdown-detected', handleCountdownDetected as EventListener)

    return () => {
      window.removeEventListener('countdown-detected', handleCountdownDetected as EventListener)
      broadcastChannel.close()
      kickChannel.close()
      hostLeftChannel.close()
    }
  }, [roomCode, playerInfo])



  // Reactive kick detection and countdown check based on room updates
  useEffect(() => {
    if (!playerInfo || !room || !roomCode) return

    // Check for countdown status
    if (room.status === "countdown") {

      setForceCountdown(true)
    }

    // Check if player is still in the room (Kick detection)
    const existingPlayer = room.players.find(p => p.id === playerInfo.playerId)
    if (!existingPlayer) {


      // Clear session when kicked
      sessionManager.clearSession().catch(console.error)
      if (typeof window !== 'undefined') {
        localStorage.removeItem("currentPlayer")
      }

      // Redirect to landing page
      window.location.href = "/"
    }
  }, [room, playerInfo, roomCode])

  // Detect when host deletes the room (cross-device support via polling)
  // This is needed because BroadcastChannel only works within the same browser
  useEffect(() => {
    if (!roomCode || !playerInfo) return

    // State to track if we've already detected room deletion
    let hasRedirected = false

    // Poll to check if room still exists (for cross-device support)
    const checkRoomExists = async () => {
      if (hasRedirected) return

      try {
        const currentRoom = await roomManager.getRoom(roomCode)
        if (!currentRoom && !hasRedirected) {
          hasRedirected = true
          console.log('[WaitingRoom] Room no longer exists, host may have left')

          // Clear session
          sessionManager.clearSession().catch(console.error)
          if (typeof window !== 'undefined') {
            localStorage.removeItem("currentPlayer")
          }

          // Redirect to join page with message
          window.location.href = "/join?message=host-left"
        }
      } catch (error) {
        console.error('[WaitingRoom] Error checking room existence:', error)
      }
    }

    // Check every 3 seconds
    const pollInterval = setInterval(checkRoomExists, 3000)

    return () => {
      clearInterval(pollInterval)
    }
  }, [roomCode, playerInfo])

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
    window.location.href = `/quiz/${roomCode}`
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
                className="h-8 sm:h-10 md:h-12 lg:h-16 xl:h-20 2xl:h-24 w-auto object-contain max-w-[45%] sm:max-w-none"
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
              src="/images/gameforsmartlogo.webp"
              alt="GameForSmart Logo"
              className="h-8 sm:h-10 md:h-12 lg:h-16 xl:h-20 2xl:h-24 w-auto object-contain drop-shadow-lg max-w-[45%] sm:max-w-none"
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
                            alt={`${playerInfo.nickname} avatar`}
                            className="w-full h-full"
                            width={40}
                            height={40}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-black pixel-font-sm text-xs sm:text-sm truncate">
                            <span className="truncate block">{playerInfo.nickname.toUpperCase()}</span>
                            <span className="text-blue-600 text-[10px] sm:text-xs">(YOU)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 🚀 OPTIMIZED: Other Players Section with Virtualized List */}
                <div className="mb-3 sm:mb-4 md:mb-6">
                  <VirtualizedPlayerList
                    players={room.players
                      .filter(player => player.nickname !== playerInfo?.nickname)
                      .map(player => ({
                        id: player.id,
                        nickname: player.nickname,
                        avatar: player.avatar,
                        isHost: player.isHost
                      }))}
                    currentPlayerId={playerInfo?.playerId}
                  />
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