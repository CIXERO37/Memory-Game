"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Users, Copy, QrCode, Share, Play, Maximize2, ChevronLeft, ChevronRight, AlertTriangle, X } from "lucide-react"
import Link from "next/link"
import { roomManager } from "@/lib/room-manager"
import { sessionManager } from "@/lib/supabase-session-manager"
import { useToast } from "@/hooks/use-toast"
import { useRoom } from "@/hooks/use-room"
import { CountdownTimer } from "@/components/countdown-timer"

function LobbyPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [hostId, setHostId] = useState<string | null>(null)
  const [quizId, setQuizId] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [localRoom, setLocalRoom] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [playerCountChanged, setPlayerCountChanged] = useState(false)
  const [playerLeft, setPlayerLeft] = useState(false)
  const [showKickDialog, setShowKickDialog] = useState(false)
  const [playerToKick, setPlayerToKick] = useState<any>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0)
  const { toast } = useToast()
  const { room, loading } = useRoom(roomCode || "")
  
  // Use localRoom if available, otherwise use room from hook
  const currentRoom = localRoom || room

  // Get quiz settings from room data or fallback to defaults
  const quizSettings = currentRoom ? {
    timeLimit: currentRoom.settings.totalTimeLimit,
    questionCount: currentRoom.settings.questionCount,
  } : {
    timeLimit: 30,
    questionCount: 10,
  }

  // Pagination logic
  const playersPerPage = 20 // 4 columns x 5 rows
  const totalPages = currentRoom?.players ? Math.ceil(currentRoom.players.length / playersPerPage) : 0
  const startIndex = currentPage * playersPerPage
  const endIndex = startIndex + playersPerPage
  const currentPlayers = currentRoom?.players?.slice(startIndex, endIndex) || []

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Handle browser navigation (back button, refresh, close tab)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = "Are you sure you want to leave? This will end the lobby for all players."
      return "Are you sure you want to leave? This will end the lobby for all players."
    }

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault()
      setShowLeaveDialog(true)
      setPendingNavigation("browser-back")
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  // Handle navigation confirmation
  const handleNavigationAttempt = (url: string) => {
    setPendingNavigation(url)
    setShowLeaveDialog(true)
  }

  const confirmLeave = () => {
    if (pendingNavigation === "browser-back") {
      // Allow browser back navigation
      window.history.back()
    } else if (pendingNavigation) {
      // Navigate to the intended URL
      router.push(pendingNavigation)
    }
    setShowLeaveDialog(false)
    setPendingNavigation(null)
  }

  const cancelLeave = () => {
    setShowLeaveDialog(false)
    setPendingNavigation(null)
  }

  const handleKickPlayer = (player: any) => {
    setPlayerToKick(player)
    setShowKickDialog(true)
  }

  const confirmKickPlayer = async () => {
    if (!playerToKick || !roomCode || !hostId) {
      toast({
        title: "Error",
        description: "Missing required data to kick player.",
        duration: 3000,
      })
      return
    }

    try {
      console.log("[Lobby] Attempting to kick player:", {
        playerId: playerToKick.id,
        username: playerToKick.username,
        roomCode,
        hostId
      })
      
      const success = await roomManager.kickPlayer(roomCode, playerToKick.id, hostId)
      
      if (success) {
        console.log("[Lobby] Player kicked successfully")
        toast({
          title: "Player Kicked!",
          description: `👢 ${playerToKick.username} has been kicked from the game`,
          duration: 3000,
        })
        
        // Force refresh room data after successful kick
        setTimeout(async () => {
          try {
            const refreshedRoom = await roomManager.getRoom(roomCode)
            if (refreshedRoom) {
              setLocalRoom(refreshedRoom)
            }
          } catch (error) {
            console.error("[Lobby] Error refreshing room after kick:", error)
          }
        }, 500)
        
        // Broadcast kick event to all players immediately
        if (typeof window !== 'undefined') {
          const broadcastChannel = new BroadcastChannel(`kick-${roomCode}`)
          broadcastChannel.postMessage({ 
            type: 'player-kicked', 
            playerId: playerToKick.id,
            username: playerToKick.username,
            roomCode: roomCode
          })
          broadcastChannel.close()
          console.log("[Lobby] Broadcasted kick event to players")
        }
      } else {
        console.log("[Lobby] Failed to kick player")
        toast({
          title: "Failed to Kick Player",
          description: "Could not kick the player. Please try again.",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("[Lobby] Error kicking player:", error)
      toast({
        title: "Error",
        description: "An error occurred while kicking the player.",
        duration: 3000,
      })
    }

    setShowKickDialog(false)
    setPlayerToKick(null)
  }

  const cancelKickPlayer = () => {
    setShowKickDialog(false)
    setPlayerToKick(null)
  }

  const handleCountdownComplete = async () => {
    if (!roomCode || !hostId) return
    
    try {
      // Start the actual game after countdown
      const success = await roomManager.startGame(roomCode, hostId)
      if (success) {
        // Navigate to monitor
        router.push(`/monitor?roomCode=${roomCode}`)
      }
    } catch (error) {
      console.error("[Lobby] Error starting game after countdown:", error)
    }
  }

  // Subscribe to room updates for real-time synchronization
  useEffect(() => {
    if (!roomCode) return

    // Load room data immediately
    const loadInitialRoom = async () => {
      try {
        const initialRoom = await roomManager.getRoom(roomCode)
        if (initialRoom) {
          console.log("[Lobby] Initial room load:", initialRoom)
          setLocalRoom(initialRoom)
        }
      } catch (error) {
        console.error("[Lobby] Error loading initial room:", error)
      }
    }

    loadInitialRoom()

    let unsubscribe: (() => void) | null = null
    
    const setupSubscription = async () => {
      try {
        unsubscribe = await roomManager.subscribe(roomCode, (updatedRoom) => {
          if (updatedRoom?.code === roomCode) {
            const now = Date.now()
            
            // Debounce rapid updates (prevent multiple updates within 100ms)
            if (now - lastUpdateTime < 100) {
              console.log("[Lobby] Debouncing rapid update")
              return
            }
            setLastUpdateTime(now)
            
            console.log("[Lobby] Received room update via Supabase subscription:", updatedRoom)
            console.log("[Lobby] Player count changed from", currentRoom?.players?.length || 0, "to", updatedRoom?.players?.length || 0)
            console.log("[Lobby] Current players:", currentRoom?.players?.map((p: any) => ({ id: p.id, username: p.username })))
            console.log("[Lobby] Updated players:", updatedRoom?.players?.map((p: any) => ({ id: p.id, username: p.username })))
            
            // Always update the room state first to prevent race conditions
            setLocalRoom(updatedRoom)
            
            // Show toast notification for player changes
            if (updatedRoom?.players) {
              const newPlayerCount = updatedRoom.players.length
              const oldPlayerCount = currentRoom?.players?.length || 0
              
              if (newPlayerCount > oldPlayerCount) {
                // Player joined
                const newPlayers = updatedRoom.players.slice(oldPlayerCount)
                newPlayers.forEach(player => {
                  toast({
                    title: "Player Joined!",
                    description: `🎉 ${player.username} joined the game`,
                    duration: 3000,
                  })
                })
                
                // Special case: first player joined
                if (oldPlayerCount === 0 && newPlayerCount > 0) {
                  toast({
                    title: "Game Ready!",
                    description: "🚀 First player joined - game is ready to start!",
                    duration: 3000,
                  })
                }
                
                // Trigger visual indicator
                setPlayerCountChanged(true)
                setTimeout(() => setPlayerCountChanged(false), 2000)
              } else if (newPlayerCount < oldPlayerCount) {
                // Player left - find which players left
                const oldPlayerIds = currentRoom?.players?.map((p: any) => p.id) || []
                const newPlayerIds = updatedRoom.players.map((p: any) => p.id)
                const leftPlayerIds = oldPlayerIds.filter((id: string) => !newPlayerIds.includes(id))
                const leftPlayers = currentRoom?.players?.filter((p: any) => leftPlayerIds.includes(p.id)) || []
                
                console.log("[Lobby] Players left:", leftPlayers.map((p: any) => ({ id: p.id, username: p.username })))
                
                if (leftPlayers.length > 0) {
                  leftPlayers.forEach((player: any) => {
                    toast({
                      title: "Player Left",
                      description: `👋 ${player.username} left the game`,
                      duration: 3000,
                    })
                  })
                  
                  // Trigger visual indicator for player leaving
                  setPlayerLeft(true)
                  setTimeout(() => setPlayerLeft(false), 2000)
                }
                
                // Special case: all players left
                if (newPlayerCount === 0 && oldPlayerCount > 0) {
                  toast({
                    title: "All Players Left",
                    description: "😢 All players have left the game",
                    duration: 4000,
                  })
                }
                
                // Special case: last player left
                if (oldPlayerCount === 1 && newPlayerCount === 0) {
                  toast({
                    title: "Last Player Left",
                    description: "😔 The last player has left the game",
                    duration: 3000,
                  })
                }
              } else if (newPlayerCount === oldPlayerCount && newPlayerCount > 0) {
                // Same count but different players (rejoin scenario)
                const oldPlayerIds = currentRoom?.players?.map((p: any) => p.id) || []
                const newPlayerIds = updatedRoom.players.map((p: any) => p.id)
                const hasChanges = !oldPlayerIds.every((id: string) => newPlayerIds.includes(id)) || 
                                 !newPlayerIds.every((id: string) => oldPlayerIds.includes(id))
                
                if (hasChanges) {
                  console.log("[Lobby] Player list changed but count remains same - possible rejoin")
                  // Could add specific rejoin notification here if needed
                }
              }
            }
          }
        })
      } catch (error) {
        console.error("[Lobby] Error setting up subscription:", error)
      }
    }
    
    setupSubscription()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [roomCode, toast])

  useEffect(() => {
    const roomCodeParam = searchParams.get("roomCode")

    // Try to hydrate from Supabase session first
    const initializeHostSession = async () => {
      try {
        // Try to get session from Supabase
        const sessionId = sessionManager.getSessionIdFromStorage()
        if (sessionId) {
          const sessionData = await sessionManager.getSessionData(sessionId)
          if (sessionData && sessionData.user_type === 'host') {
            const { hostId: storedHostId, roomCode: storedRoomCode, quizId: storedQuizId } = sessionData.user_data
            setHostId(storedHostId)
            setQuizId(storedQuizId)
            
            if (!roomCodeParam) {
              setRoomCode(storedRoomCode)
              // Load room data immediately
              const loadRoom = async () => {
                try {
                  const room = await roomManager.getRoom(storedRoomCode)
                  if (room) {
                    setLocalRoom(room)
                  }
                } catch (error) {
                  console.error("[Lobby] Error loading room:", error)
                }
              }
              loadRoom()
            } else if (roomCodeParam === storedRoomCode) {
              // Room code matches, this is a valid host session
              setRoomCode(roomCodeParam)
              // Load room data immediately
              const loadRoom = async () => {
                try {
                  const room = await roomManager.getRoom(roomCodeParam)
                  if (room) {
                    setLocalRoom(room)
                  }
                } catch (error) {
                  console.error("[Lobby] Error loading room:", error)
                }
              }
              loadRoom()
            } else {
              // Room code doesn't match, clear old data and treat as new room
              console.log("Room code mismatch, clearing old host data")
              await sessionManager.clearSession()
              setRoomCode(roomCodeParam)
            }
            return
          }
        }
        
        // Fallback to localStorage if Supabase session not found
        if (typeof window !== 'undefined') {
          const hostData = localStorage.getItem("currentHost")
          if (hostData) {
            try {
              const { hostId: storedHostId, roomCode: storedRoomCode, quizId: storedQuizId } = JSON.parse(hostData)
              setHostId(storedHostId)
              setQuizId(storedQuizId)
              
              if (!roomCodeParam) {
                setRoomCode(storedRoomCode)
              } else if (roomCodeParam === storedRoomCode) {
                setRoomCode(roomCodeParam)
              } else {
                localStorage.removeItem("currentHost")
                setRoomCode(roomCodeParam)
              }
            } catch (error) {
              console.error("Error parsing host data:", error)
              localStorage.removeItem("currentHost")
              if (roomCodeParam) {
                setRoomCode(roomCodeParam)
              } else {
                router.push("/select-quiz")
              }
            }
          } else {
            if (roomCodeParam) {
              setRoomCode(roomCodeParam)
            } else {
              router.push("/select-quiz")
            }
          }
        }
      } catch (error) {
        console.error("Error initializing host session:", error)
        if (roomCodeParam) {
          setRoomCode(roomCodeParam)
        } else {
          router.push("/select-quiz")
        }
      }
    }

    initializeHostSession()
  }, [searchParams, router])

  useEffect(() => {
    if (currentRoom?.gameStarted) {
      setGameStarted(true)
    }
    console.log("[Lobby] Room updated:", currentRoom)
    console.log("[Lobby] Current values:", { roomCode, hostId, gameStarted, roomStatus: currentRoom?.status })
  }, [currentRoom, roomCode, hostId, gameStarted])

  // Light polling as fallback for critical updates (countdown, game start, player changes)
  useEffect(() => {
    if (!roomCode) return

    const refreshInterval = setInterval(async () => {
      try {
        const latestRoom = await roomManager.getRoom(roomCode)
        if (latestRoom) {
          // Check for player count changes that might be missed by subscription
          const currentPlayerCount = currentRoom?.players?.length || 0
          const latestPlayerCount = latestRoom.players?.length || 0
          
          // Only update for critical status changes or player count changes
          const currentStatus = currentRoom?.status
          const latestStatus = latestRoom.status
          const currentCountdown = currentRoom?.countdownStartTime
          const latestCountdown = latestRoom.countdownStartTime
          
          if ((latestStatus === "countdown" && currentStatus !== "countdown") ||
              (latestStatus === "quiz" && currentStatus !== "quiz") ||
              (latestCountdown !== currentCountdown && latestStatus === "countdown") ||
              (latestPlayerCount !== currentPlayerCount)) {
            console.log("[Lobby] Critical change detected via polling:", {
              currentStatus,
              latestStatus,
              currentCountdown,
              latestCountdown,
              currentPlayerCount,
              latestPlayerCount
            })
            setLocalRoom(latestRoom)
          }
        }
      } catch (error) {
        console.error("[Lobby] Error in refresh interval:", error)
      }
    }, 3000) // Check every 3 seconds for player changes and critical updates

    return () => clearInterval(refreshInterval)
  }, [roomCode, currentRoom?.status, currentRoom?.countdownStartTime, currentRoom?.players?.length])


  const shareUrl = roomCode && typeof window !== 'undefined' ? `${window.location.origin}/join?room=${roomCode}` : ""
  const smallQrUrl = shareUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=384x384&data=${encodeURIComponent(shareUrl)}` : ""
  const largeQrUrl = shareUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(shareUrl)}` : ""

  const copyRoomCode = () => {
    if (!roomCode) return
    // Copy the full URL instead of just the room code
    navigator.clipboard.writeText(shareUrl || `${window.location.origin}/join?room=${roomCode}`)
    toast({
      title: "Share link copied!",
      description: "Send this link to your friends",
    })
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 1500)
  }

  const copyShareLink = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Share link copied!",
      description: "Send this link to your friends",
    })
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 1500)
  }

  const startGame = async () => {
    console.log("[Lobby] Start game clicked", { gameStarted, currentRoom, roomCode, hostId })
    
    if (gameStarted || !currentRoom || !roomCode || !hostId) {
      console.log("[Lobby] Start game blocked:", { gameStarted, hasRoom: !!currentRoom, roomCode, hostId })
      return
    }

    try {
      console.log("[Lobby] Starting countdown...")
      // Start countdown first
      const countdownSuccess = await roomManager.startCountdown(roomCode, hostId, 10)
      console.log("[Lobby] Countdown result:", countdownSuccess)
      
      if (countdownSuccess) {
        setGameStarted(true)
        console.log("[Lobby] Countdown started successfully")
        
        // Immediately update local room state to show countdown
        const updatedRoom = {
          ...currentRoom,
          status: "countdown" as const,
          countdownStartTime: new Date().toISOString(),
          countdownDuration: 10
        }
        setLocalRoom(updatedRoom)
        console.log("[Lobby] Updated local room state for countdown")
        
        // Broadcast countdown start to all players immediately
        if (typeof window !== 'undefined') {
          const broadcastChannel = new BroadcastChannel(`countdown-${roomCode}`)
          broadcastChannel.postMessage({ type: 'countdown-started', room: updatedRoom })
          broadcastChannel.close()
          console.log("[Lobby] Broadcasted countdown start to players")
        }
      } else {
        console.error("[Lobby] Failed to start countdown")
      }
    } catch (error) {
      console.error("[Lobby] Error starting countdown:", error)
    }
  }

  // Show countdown timer if room is in countdown status
  if (currentRoom && currentRoom.status === "countdown") {
    return (
      <CountdownTimer 
        room={currentRoom} 
        onCountdownComplete={handleCountdownComplete}
      />
    )
  }

  if (loading && !currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-xl">Loading room...</div>
        </div>
      </div>
    )
  }

  // Add a small delay to prevent flash of "ROOM NOT FOUND" when creating new rooms
  if (!currentRoom && !loading && !roomCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-xl">Initializing...</div>
        </div>
      </div>
    )
  }

  if (!currentRoom && !loading) {
    // If we have host data but no room, try to recreate the room
    if (hostId && roomCode && quizId) {
      const recreatedRoom = roomManager.createRoomWithCode(roomCode, hostId, {
        questionCount: 10, // Default fallback
        totalTimeLimit: 30 // Default fallback
      })
      
      if (recreatedRoom) {
        // Update the room state and continue
        setLocalRoom(recreatedRoom)
      } else {
        // Show loading while trying to create room
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-xl">Creating room...</div>
            </div>
          </div>
        )
      }
    } else {
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
                  <div className="relative pixel-button-container">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                    <Button 
                      onClick={() => router.push("/select-quiz")}
                      className="relative bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-orange-400 hover:to-orange-500 transform hover:scale-105 transition-all duration-200 font-bold"
                    >
                      <span className="pixel-font-sm">CREATE NEW ROOM</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
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

      {/* Pixel Header */}
      <div className="relative z-10 w-full px-4 pt-6">
        <div className="flex items-center gap-4">
          <div 
            onClick={() => handleNavigationAttempt("/quiz-settings")}
            className="cursor-pointer"
          >
            <div className="relative pixel-button-container">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
              <Button variant="outline" size="sm" className="relative bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 border-2 border-black rounded flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="inline-block bg-white border-2 border-black rounded px-4 py-2 pixel-header-title">
              <h1 className="text-lg font-bold text-black">LOBBY</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-6">
        <div className="mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Pixel Room Info */}
          <div className="relative pixel-lobby-container">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg border-4 border-black shadow-2xl pixel-lobby-card">
              <div className="p-6 space-y-2 ">
               
                {/* Quiz Info Pills */}
                <div className="flex justify-center gap-4 mb-4">
                  {/* Time Pill */}
                  <div className="bg-blue-100 border border-blue-300 rounded-full px-4 py-2 flex items-center gap-2 shadow-sm">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">⏱️</span>
                    </div>
                    <span className="text-blue-700 font-medium text-sm">
                      {currentRoom?.settings.totalTimeLimit || 30}:00
                    </span>
                  </div>
                  
                  {/* Questions Pill */}
                  <div className="bg-green-100 border border-green-300 rounded-full px-4 py-2 flex items-center gap-2 shadow-sm">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">❓</span>
                    </div>
                    <span className="text-green-700 font-medium text-sm">
                      {currentRoom?.settings.questionCount || 10} Questions
                    </span>
                  </div>
                </div>

                {/* Simplified Room Code Display */}
                <div className="bg-white border-2 border-black rounded p-6 pixel-room-code relative">
                  {/* Copy icon di pojok kanan atas */}
                  <button
                    onClick={copyRoomCode}
                    aria-label="Copy room code"
                    className={`absolute top-4 right-4 w-8 h-8 rounded border-2 border-black flex items-center justify-center ${copiedCode ? "bg-green-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
                  >
                    {copiedCode ? <span className="font-bold text-lg">✓</span> : <Copy className="h-6 w-6" />}
                  </button>
                  
                  {/* Room code di tengah - diperbesar */}
                  <div className="text-center pt-2">
                    <div className="text-5xl md:text-6xl lg:text-7xl font-black font-mono text-black room-code-text">
                      {roomCode}
                    </div>
                  </div>
                </div>

                {/* Pixel QR Card */}
                {smallQrUrl && (
                  <div className="bg-white border-2 border-black rounded p-4 pixel-qr-card">
                    <div className="flex justify-end items-center mb-3">
                      <button
                        onClick={() => setQrOpen(true)}
                        aria-label="Enlarge QR"
                        className="w-8 h-8 bg-gray-200 border-2 border-black rounded flex items-center justify-center hover:bg-gray-300"
                      >
                        {/* komen */}
                        <Maximize2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-col items-center">
                      <img
                        src={smallQrUrl}
                        alt="Room share QR"
                        className="rounded border-2 border-black bg-white p-2"
                        width={384}
                        height={384}
                      />
                      {shareUrl && (
                        <div className="mt-4 relative mx-auto">
                          <div className="inline-block bg-gray-100 border-2 border-black rounded pl-3 pr-10 py-2 text-xs font-medium break-all">
                            {shareUrl}
                          </div>
                          <button
                            onClick={copyShareLink}
                            aria-label="Copy share link"
                            className={`absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-7 w-7 rounded ${copiedLink ? "bg-green-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
                          >
                            {copiedLink ? <span className="font-bold text-xs">✓</span> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              <Dialog open={qrOpen} onOpenChange={setQrOpen}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Share QR Code</DialogTitle>
                  </DialogHeader>
                  <div className="flex justify-center py-2">
                    {largeQrUrl && (
                      <img
                        src={largeQrUrl}
                        alt="Room share QR large"
                        className="rounded-lg border border-white/10 bg-white/5 p-4"
                        width={512}
                        height={512}
                      />
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </div>
          </div>

          {/* Pixel Players List */}
          <div className="relative pixel-lobby-container">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-cyan-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-green-500 to-cyan-500 rounded-lg border-4 border-black shadow-2xl pixel-lobby-card">
              <div className="p-6">
                {/* Pixel Players Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white border border-black rounded flex items-center justify-center">
                      <Users className="h-4 w-4 text-black" />
                    </div>
                    <div className={`inline-block bg-white border border-black rounded px-2 py-1 transition-all duration-500 ${
                      playerCountChanged ? 'animate-pulse bg-green-100 border-green-400' : 
                      playerLeft ? 'animate-pulse bg-red-100 border-red-400' : ''
                    }`}>
                      <span className="text-black font-bold text-sm pixel-font-sm">
                        {playerCountChanged ? '🎉 ' : playerLeft ? '👋 ' : ''}PLAYERS ({currentRoom?.players.length || 0})
                      </span>
                    </div>
                  </div>
                  {currentRoom && !gameStarted && (
                    <div className="space-y-3">
                      <div className="relative pixel-button-container">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                        <button 
                          onClick={startGame}
                          disabled={!roomCode || !hostId || !currentRoom || currentRoom.players.length === 0}
                          className="relative bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-purple-400 hover:to-purple-500 transform hover:scale-105 transition-all duration-200 font-bold px-6 py-3 flex items-center justify-center gap-3 text-lg tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          <Play className="h-4 w-4" />
                          <span className="pixel-font-sm">START QUIZ</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {gameStarted && (
                    <div className="bg-yellow-400 border-2 border-black rounded px-3 py-1">
                      <span className="text-black font-bold text-xs pixel-font-sm">GAME STARTED</span>
                    </div>
                  )}
                </div>
                
                {/* Pixel Status */}
                <div className="mb-4">
                  <div className="bg-black/20 border border-white/30 rounded px-3 py-2">
                    <span className="text-white text-sm pixel-font-sm">
                      {currentRoom && currentRoom.players.length === 0
                        ? "WAITING FOR PLAYERS TO JOIN..."
                        : gameStarted
                          ? "GAME IN PROGRESS"
                          : "READY TO START"}
                    </span>
                  </div>
                  
                </div>
                {/* Pixel Players List */}
                {currentRoom && currentRoom.players.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                      <Users className="h-8 w-8 text-black" />
                    </div>
                    <div className="bg-white border-2 border-black rounded px-4 py-2 inline-block">
                      <p className="text-black font-bold pixel-font-sm">NO PLAYERS YET</p>
                      <p className="text-black text-xs pixel-font-sm">SHARE THE ROOM CODE TO GET STARTED!</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Players Grid - 4 columns x 5 rows */}
                    <div className="grid grid-cols-4 gap-2">
                      {currentPlayers.map((player: any) => (
                        <div key={player.id} className="bg-white border-2 border-black rounded p-2 pixel-player-card relative">
                          {/* Kick button - only show for host */}
                          {hostId && (
                            <button
                              onClick={() => handleKickPlayer(player)}
                              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 border-2 border-black rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                              title={`Kick ${player.username}`}
                            >
                              <X className="h-3 w-3 text-white" />
                            </button>
                          )}
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-gray-100 border border-black rounded flex items-center justify-center overflow-hidden">
                              <img 
                                src={player.avatar} 
                                alt={`${player.username} avatar`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-black pixel-font-sm text-xs leading-tight">
                                {player.username.toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Navigation Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="relative pixel-button-container">
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                          <Button 
                            onClick={goToPreviousPage}
                            disabled={currentPage === 0}
                            className="relative bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            <span className="pixel-font-sm">PREV</span>
                          </Button>
                        </div>

                        <div className="bg-white border-2 border-black rounded px-3 py-1">
                          <span className="text-black font-bold text-sm pixel-font-sm">
                            {currentPage + 1} / {totalPages}
                          </span>
                        </div>

                        <div className="relative pixel-button-container">
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                          <Button 
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages - 1}
                            className="relative bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="pixel-font-sm">NEXT</span>
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Confirmation Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="max-w-md bg-transparent border-none p-0">
          <div className="relative pixel-dialog-container">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg border-4 border-black shadow-2xl p-6">
              {/* Dialog Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 pixel-font">LEAVE LOBBY?</h3>
                <p className="text-white/90 text-sm pixel-font-sm leading-relaxed">
                  ARE YOU SURE YOU WANT TO LEAVE?<br/>
                  THIS WILL END THE GAME FOR ALL PLAYERS<br/>
                  AND THEY WILL BE DISCONNECTED
                </p>
              </div>

              {/* Dialog Buttons */}
              <div className="flex gap-4 justify-center">
                <div className="relative pixel-button-container">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                  <Button 
                    onClick={cancelLeave}
                    className="relative bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200 font-bold px-6 py-2"
                  >
                    <span className="pixel-font-sm">CANCEL</span>
                  </Button>
                </div>

                <div className="relative pixel-button-container">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                  <Button 
                    onClick={confirmLeave}
                    className="relative bg-gradient-to-br from-red-500 to-red-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-red-400 hover:to-red-500 transform hover:scale-105 transition-all duration-200 font-bold px-6 py-2"
                  >
                    <span className="pixel-font-sm">LEAVE LOBBY</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kick Player Confirmation Dialog */}
      <Dialog open={showKickDialog} onOpenChange={setShowKickDialog}>
        <DialogContent className="max-w-md bg-transparent border-none p-0">
          <div className="relative pixel-dialog-container">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-lg border-4 border-black shadow-2xl p-6">
              {/* Dialog Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 pixel-font">KICK PLAYER?</h3>
                <p className="text-white/90 text-sm pixel-font-sm leading-relaxed">
                  ARE YOU SURE YOU WANT TO KICK<br/>
                  <span className="font-bold text-yellow-300">{playerToKick?.username?.toUpperCase()}</span><br/>
                  FROM THE GAME?
                </p>
              </div>

              {/* Dialog Buttons */}
              <div className="flex gap-4 justify-center">
                <div className="relative pixel-button-container">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                  <Button 
                    onClick={cancelKickPlayer}
                    className="relative bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200 font-bold px-6 py-2"
                  >
                    <span className="pixel-font-sm">CANCEL</span>
                  </Button>
                </div>

                <div className="relative pixel-button-container">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                  <Button 
                    onClick={confirmKickPlayer}
                    className="relative bg-gradient-to-br from-red-500 to-red-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-red-400 hover:to-red-500 transform hover:scale-105 transition-all duration-200 font-bold px-6 py-2"
                  >
                    <span className="pixel-font-sm">KICK PLAYER</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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

export default function LobbyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="relative z-10 text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg border-4 border-black shadow-2xl p-6">
              <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-black animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 pixel-font">LOADING...</h3>
              <p className="text-white/80 pixel-font-sm">PREPARING LOBBY</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <LobbyPageContent />
    </Suspense>
  )
}
