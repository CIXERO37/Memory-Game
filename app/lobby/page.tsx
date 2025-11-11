"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Users, Copy, QrCode, Share, Play, Maximize2, ChevronLeft, ChevronRight, AlertTriangle, X, Check } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import Link from "next/link"
import { roomManager, type Room } from "@/lib/room-manager"
import { sessionManager } from "@/lib/supabase-session-manager"
import { useToast } from "@/hooks/use-toast"
import { useRoom } from "@/hooks/use-room"
import { CountdownTimer } from "@/components/countdown-timer"
import { RobustGoogleAvatar } from "@/components/robust-google-avatar"
import { useTranslation } from "react-i18next"

function LobbyPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useTranslation()
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [hostId, setHostId] = useState<string | null>(null)
  const [quizId, setQuizId] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrSize, setQrSize] = useState(800)
  const [localRoom, setLocalRoom] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [playerCountChanged, setPlayerCountChanged] = useState(false)
  const [playerLeft, setPlayerLeft] = useState(false)
  const [showKickDialog, setShowKickDialog] = useState(false)
  const [playerToKick, setPlayerToKick] = useState<any>(null)
  const lastUpdateTimeRef = useRef<number>(0)
  const { toast } = useToast()
  const { room, loading } = useRoom(roomCode || "")
  
  // Use localRoom if available, otherwise use room from hook
  // Prioritize localRoom for countdown state to prevent override
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
      // Don't show dialog if we're redirecting programmatically
      if (isRedirecting) {
        return
      }
      e.preventDefault()
      e.returnValue = t('lobby.leaveWarningDesc')
      return t('lobby.leaveWarningDesc')
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
  }, [isRedirecting])

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
        title: t('lobby.error'),
        description: t('lobby.missingData'),
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
          title: t('lobby.playerKicked'),
          description: `👢 ${playerToKick.username} ${t('lobby.playerKickedDesc')}`,
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
          title: t('lobby.failedToKick'),
          description: t('lobby.failedToKickDesc'),
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("[Lobby] Error kicking player:", error)
      toast({
        title: t('lobby.error'),
        description: t('lobby.errorKickingPlayer'),
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
    
    setIsRedirecting(true) // Prevent flash of lobby content
    
    // Clean up all event listeners and state before redirect
    try {
      // Remove all event listeners that might trigger beforeunload
      const beforeUnloadHandler = () => {}
      window.removeEventListener('beforeunload', beforeUnloadHandler)
      
      // Clear any pending timeouts or intervals
      // Note: This is a simplified cleanup - in production you'd track specific timeout IDs
      console.log("[Lobby] Cleaning up before redirect")
      
      // Start the actual game after countdown
      const success = await roomManager.startGame(roomCode, hostId)
      if (success) {
        console.log("[Lobby] Game started successfully, redirecting to monitor")
        
        // Use replace instead of href to prevent back button issues
        window.location.replace(`/monitor?roomCode=${roomCode}`)
      } else {
        console.error("[Lobby] Failed to start game after countdown")
        // Fallback redirect even if game start failed
        window.location.replace(`/monitor?roomCode=${roomCode}`)
      }
    } catch (error) {
      console.error("[Lobby] Error starting game after countdown:", error)
      // Fallback redirect even if there's an error
      window.location.replace(`/monitor?roomCode=${roomCode}`)
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
            
            // Debounce rapid updates (prevent multiple updates within 100ms) using ref
            if (now - lastUpdateTimeRef.current < 100) {
              console.log("[Lobby] Debouncing rapid update")
              return
            }
            lastUpdateTimeRef.current = now
            
            // Use functional state updates to avoid stale closure issues
            setLocalRoom((prevLocalRoom: Room | null) => {
              console.log("[Lobby] Received room update via Supabase subscription:", updatedRoom)
              console.log("[Lobby] Player count changed from", prevLocalRoom?.players?.length || 0, "to", updatedRoom?.players?.length || 0)
              console.log("[Lobby] Current players:", prevLocalRoom?.players?.map((p: any) => ({ id: p.id, username: p.username })))
              console.log("[Lobby] Updated players:", updatedRoom?.players?.map((p: any) => ({ id: p.id, username: p.username })))
              
              // Always update the room state first to prevent race conditions
              // But preserve countdown state if it's already active locally and server doesn't have countdown
              if (prevLocalRoom?.status === "countdown" && updatedRoom.status !== "countdown") {
                console.log("[Lobby] Preserving local countdown state, not overriding with server state")
                return prevLocalRoom
              }
              
              // If server has countdown data, use it (it's more authoritative)
              if (updatedRoom.status === "countdown" && updatedRoom.countdownStartTime && updatedRoom.countdownDuration) {
                console.log("[Lobby] Using server countdown data:", updatedRoom.countdownStartTime, updatedRoom.countdownDuration)
              }
              
              // Show toast notification for player changes BEFORE updating state
              if (updatedRoom?.players && prevLocalRoom?.players) {
                const newPlayerCount = updatedRoom.players.length
                const oldPlayerCount = prevLocalRoom.players.length
                
                if (newPlayerCount > oldPlayerCount) {
                  // Player joined
                  const newPlayers = updatedRoom.players.slice(oldPlayerCount)
                  newPlayers.forEach(player => {
                    toast({
                      title: t('lobby.playerJoined'),
                      description: `🎉 ${player.username} joined the game`,
                      duration: 3000,
                    })
                  })
                  
                  // Special case: first player joined
                  if (oldPlayerCount === 0 && newPlayerCount > 0) {
                    toast({
                      title: t('lobby.gameReady'),
                      description: t('lobby.firstPlayerJoined'),
                      duration: 3000,
                    })
                  }
                  
                  // Trigger visual indicator
                  setPlayerCountChanged(true)
                  setTimeout(() => setPlayerCountChanged(false), 2000)
                } else if (newPlayerCount < oldPlayerCount) {
                  // Player left - find which players left
                  const oldPlayerIds = prevLocalRoom.players.map((p: any) => p.id)
                  const newPlayerIds = updatedRoom.players.map((p: any) => p.id)
                  const leftPlayerIds = oldPlayerIds.filter((id: string) => !newPlayerIds.includes(id))
                  const leftPlayers = prevLocalRoom.players.filter((p: any) => leftPlayerIds.includes(p.id))
                  
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
                      title: t('lobby.allPlayersLeft'),
                      description: t('lobby.allPlayersHaveLeft'),
                      duration: 4000,
                    })
                  }
                  
                  // Special case: last player left
                  if (oldPlayerCount === 1 && newPlayerCount === 0) {
                    toast({
                      title: t('lobby.lastPlayerLeft'),
                      description: t('lobby.lastPlayerLeft'),
                      duration: 3000,
                    })
                  }
                } else if (newPlayerCount === oldPlayerCount && newPlayerCount > 0) {
                  // Same count but different players (rejoin scenario)
                  const oldPlayerIds = prevLocalRoom.players.map((p: any) => p.id)
                  const newPlayerIds = updatedRoom.players.map((p: any) => p.id)
                  const hasChanges = !oldPlayerIds.every((id: string) => newPlayerIds.includes(id)) || 
                                   !newPlayerIds.every((id: string) => oldPlayerIds.includes(id))
                  
                  if (hasChanges) {
                    console.log("[Lobby] Player list changed but count remains same - possible rejoin")
                    // Could add specific rejoin notification here if needed
                  }
                }
              }
              
              // Return updated room state
              return updatedRoom
            })
          }
        })
      } catch (error) {
        console.error("[Lobby] Error setting up subscription:", error)
      }
    }
    
    setupSubscription()

    // Fallback polling for production builds where subscription might not work reliably
    // This ensures player cards appear even if subscription fails
    const pollingInterval = setInterval(async () => {
      try {
        const currentRoom = await roomManager.getRoom(roomCode)
        if (currentRoom) {
          setLocalRoom((prevLocalRoom: Room | null) => {
            // Only update if there are actual changes to avoid unnecessary re-renders
            if (!prevLocalRoom || 
                prevLocalRoom.players?.length !== currentRoom.players?.length ||
                JSON.stringify(prevLocalRoom.players?.map(p => p.id).sort()) !== JSON.stringify(currentRoom.players?.map(p => p.id).sort())) {
              console.log("[Lobby] Polling detected player changes:", {
                oldCount: prevLocalRoom?.players?.length || 0,
                newCount: currentRoom.players?.length || 0
              })
              return currentRoom
            }
            return prevLocalRoom
          })
        }
      } catch (error) {
        console.error("[Lobby] Error in polling fallback:", error)
      }
    }, 2000) // Poll every 2 seconds as fallback

    return () => {
      if (unsubscribe) unsubscribe()
      clearInterval(pollingInterval)
    }
  }, [roomCode, toast, t])

  useEffect(() => {
    const roomCodeParam = searchParams.get("roomCode")

    // Try to hydrate from Supabase session first
    const initializeHostSession = async () => {
      try {
        // Try to get session from Supabase (non-blocking - if it fails, fallback to localStorage)
        const sessionId = sessionManager.getSessionIdFromStorage()
        if (sessionId) {
          // Try to get session data, but don't block if it fails (e.g., 406 error)
          const sessionData = await sessionManager.getSessionData(sessionId)
          
          // Only use session data if it was successfully retrieved and is for a host
          if (sessionData && sessionData.user_type === 'host') {
            try {
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
                await sessionManager.clearSession().catch(() => {
                  // Ignore errors when clearing session
                })
                setRoomCode(roomCodeParam)
              }
              return
            } catch (error) {
              console.warn("[Lobby] Error processing session data, falling back to localStorage:", error)
              // Continue with fallback logic below
            }
          } else {
            // Session data not found or not a host session, continue with fallback
            console.log("[Lobby] No valid host session found, using localStorage fallback")
          }
        }
        
        // Fallback to localStorage if Supabase session not found (temporary)
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

  // Removed polling - subscription handles all real-time updates
  // Subscription in useEffect above (lines 254-399) is sufficient for all updates


  const shareUrl = roomCode && typeof window !== 'undefined' ? `${window.location.origin}/join?room=${roomCode}` : ""
  const joinUrl = shareUrl // Use joinUrl for consistency with HostContent

  // Calculate QR code size for modal - update when modal opens or window resizes
  // Account for border (8px * 2 = 16px) and padding (16px * 2 = 32px) = 48px total
  useEffect(() => {
    if (showQRModal && typeof window !== 'undefined') {
      const updateQrSize = () => {
        // Modal is 98vw x 98vh, but we need to account for:
        // - Border: 8px on each side = 16px total
        // - Padding: 16px on each side = 32px total  
        // - Close button space: ~16px
        // Total: ~64px to be safe
        const borderPadding = 80 // Conservative padding to ensure QR fits
        // Use the smaller dimension to ensure QR code fits (square aspect ratio)
        const modalWidth = window.innerWidth * 0.98
        const modalHeight = window.innerHeight * 0.98
        const availableWidth = modalWidth - borderPadding
        const availableHeight = modalHeight - borderPadding
        // Use 90% of available space to be extra safe
        const size = Math.min(
          availableWidth * 0.9,
          availableHeight * 0.9,
          4000 // Maximum size for very large screens
        )
        setQrSize(Math.max(400, Math.floor(size))) // Ensure minimum size and round down
      }
      updateQrSize()
      const resizeTimer = setTimeout(updateQrSize, 100) // Small delay to ensure DOM is ready
      window.addEventListener('resize', updateQrSize)
      return () => {
        window.removeEventListener('resize', updateQrSize)
        clearTimeout(resizeTimer)
      }
    }
  }, [showQRModal])

  const copyRoomCode = () => {
    if (!roomCode) return
    // Copy the full URL instead of just the room code
    navigator.clipboard.writeText(shareUrl || `${window.location.origin}/join?room=${roomCode}`)
    toast({
      title: t('lobby.shareLinkCopied'),
      description: "Send this link to your friends",
    })
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 1500)
  }

  const copyShareLink = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: t('lobby.shareLinkCopied'),
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
        const countdownStartTime = new Date().toISOString()
        const updatedRoom = {
          ...currentRoom,
          status: "countdown" as const,
          countdownStartTime: countdownStartTime,
          countdownDuration: 10
        }
        setLocalRoom(updatedRoom)
        console.log("[Lobby] Updated local room state for countdown:", updatedRoom)
        
        // Broadcast countdown start to all players immediately
        if (typeof window !== 'undefined') {
          const broadcastChannel = new BroadcastChannel(`countdown-${roomCode}`)
          broadcastChannel.postMessage({ 
            type: 'countdown-started', 
            room: updatedRoom,
            countdownStartTime: countdownStartTime,
            countdownDuration: 10
          })
          broadcastChannel.close()
          console.log("[Lobby] Broadcasted countdown start to players with data:", updatedRoom)
        }
        
        // Force a small delay to ensure state is updated before rendering
        setTimeout(() => {
          console.log("[Lobby] Countdown state should now be active")
        }, 100)
      } else {
        console.error("[Lobby] Failed to start countdown")
        toast({
          title: t('lobby.failedToStartGame'),
          description: t('lobby.couldNotStartCountdown'),
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("[Lobby] Error starting countdown:", error)
      toast({
        title: t('lobby.error'),
        description: t('lobby.errorStartingGame'),
        duration: 3000,
      })
    }
  }

  // Show countdown timer if room is in countdown status
  if (currentRoom && currentRoom.status === "countdown") {
    console.log("[Lobby] Showing countdown timer, room status:", currentRoom.status, "countdownStartTime:", currentRoom.countdownStartTime, "countdownDuration:", currentRoom.countdownDuration)
    return (
      <CountdownTimer 
        room={currentRoom} 
        playerId={hostId || undefined}
        isHost={true}
        onCountdownComplete={handleCountdownComplete}
      />
    )
  }

  // Show loading screen if redirecting to prevent flash
  if (isRedirecting) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="relative z-10 text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-cyan-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-linear-to-br from-blue-500 to-cyan-500 rounded-lg border-4 border-black shadow-2xl p-6">
              <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                <div className="h-8 w-8 text-black animate-spin">⏳</div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 pixel-font">REDIRECTING...</h3>
              <p className="text-white/80 pixel-font-sm">GOING TO MONITOR PAGE</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Log room status for debugging
  if (currentRoom) {
    console.log("[Lobby] Room status:", currentRoom.status, "Game started:", currentRoom.gameStarted, "Countdown data:", {
      countdownStartTime: currentRoom.countdownStartTime,
      countdownDuration: currentRoom.countdownDuration
    })
  }

  if (loading && !currentRoom) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-xl">{t('lobby.loadingRoom')}</div>
        </div>
      </div>
    )
  }

  // Add a small delay to prevent flash of "ROOM NOT FOUND" when creating new rooms
  if (!currentRoom && !loading && !roomCode) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
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
          <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
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
                <div className="absolute inset-0 bg-linear-to-br from-red-600 to-red-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                <div className="relative bg-linear-to-br from-red-500 to-red-600 rounded-lg border-4 border-black shadow-2xl p-6">
                  <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 pixel-font">ROOM NOT FOUND</h3>
                  <p className="text-white/80 mb-4 pixel-font-sm">THE ROOM MAY HAVE BEEN CLOSED OR THE HOST LEFT</p>
                  <div className="relative pixel-button-container">
                    <div className="absolute inset-0 bg-linear-to-br from-orange-600 to-orange-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                    <Button 
                      onClick={() => router.push("/select-quiz")}
                      className="relative bg-linear-to-br from-orange-500 to-orange-600 border-2 border-black rounded-lg text-white hover:bg-linear-to-br hover:from-orange-400 hover:to-orange-500 transform hover:scale-105 transition-all duration-200 font-bold"
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
      {/* Background blur overlay when QR is open */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-40" />
      )}
      
      {/* Pixel Grid Background */}
      <div className={`absolute inset-0 opacity-20 ${showQRModal ? 'blur-md' : ''}`}>
        <div className="pixel-grid"></div>
      </div>
      
      {/* Retro Scanlines */}
      <div className={`absolute inset-0 opacity-10 ${showQRModal ? 'blur-md' : ''}`}>
        <div className="scanlines"></div>
      </div>
      
      {/* Floating Pixel Elements */}
      <div className={`absolute inset-0 overflow-hidden ${showQRModal ? 'blur-md' : ''}`}>
        <PixelBackgroundElements />
      </div>

      {/* Pixel Header with responsive layout */}
      <div className={`relative z-10 w-full px-4 pt-6 ${showQRModal ? 'blur-md' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          {/* Left side - Navigation and Title */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div 
              onClick={() => handleNavigationAttempt("/quiz-settings")}
              className="cursor-pointer shrink-0"
            >
              <div className="relative pixel-button-container">
                <div className="absolute inset-0 bg-linear-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                <Button variant="outline" size="sm" className="relative bg-linear-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-linear-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200">
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              {/* Memory Quiz Logo with glow effect */}
              <img 
                draggable={false}
                src="/images/memoryquiz.png" 
                alt="Memory Quiz" 
                className="h-8 sm:h-12 md:h-16 lg:h-20 xl:h-24 w-auto object-contain"
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
              className={`h-8 sm:h-12 md:h-16 lg:h-20 xl:h-24 w-auto object-contain drop-shadow-lg ${showQRModal ? 'blur-sm' : ''}`}
            />
          </div>
        </div>
      </div>

      <div className={`relative z-10 mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-6 ${showQRModal ? 'blur-md' : ''}`}>
        <div className="mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
          {/* Pixel Room Info */}
          <div className="relative pixel-lobby-container">
            <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-linear-to-br from-blue-500 to-purple-500 rounded-lg border-2 sm:border-4 border-black shadow-2xl pixel-lobby-card">
              <div className="p-4 sm:p-6 space-y-2">
               
                {/* Quiz Info Pills */}
                <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mb-4">
                  {/* Time Pill */}
                  <div className="bg-blue-100 border border-blue-300 rounded-full px-3 sm:px-4 py-2 flex items-center gap-2 shadow-sm">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">⏱️</span>
                    </div>
                    <span className="text-blue-700 font-medium text-xs sm:text-sm">
                      {currentRoom?.settings.totalTimeLimit || 30}:00
                    </span>
                  </div>
                  
                  {/* Questions Pill */}
                  <div className="bg-green-100 border border-green-300 rounded-full px-3 sm:px-4 py-2 flex items-center gap-2 shadow-sm">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">❓</span>
                    </div>
                    <span className="text-green-700 font-medium text-xs sm:text-sm">
                      {currentRoom?.settings.questionCount || 10} {t('lobby.questions')}
                    </span>
                  </div>
                </div>

                {/* Simplified Room Code Display */}
                <div className="bg-white border-2 border-black rounded pt-2 pb-3 sm:pt-3 sm:pb-4 md:pt-4 md:pb-6 px-3 sm:px-4 md:px-6 pixel-room-code relative">
                  {/* Copy icon di pojok kanan atas */}
                  <button
                    onClick={copyRoomCode}
                    aria-label="Copy room code"
                    className={`absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded border-2 border-black flex items-center justify-center ${copiedCode ? "bg-green-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
                  >
                    {copiedCode ? <span className="font-bold text-xs sm:text-sm md:text-lg">✓</span> : <Copy className="h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6" />}
                  </button>
                  
                  {/* Room code di tengah - diperbesar dengan overflow protection */}
                  <div className="text-center pt-0 px-8 sm:px-12 md:px-16">
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black font-mono text-black room-code-text break-all leading-tight">
                      {roomCode}
                    </div>
                  </div>
                </div>

                {/* Pixel QR Card - Compact QR Code */}
                {joinUrl && (
                  <div className="bg-white border-2 border-black rounded p-2 sm:p-3 md:p-4 pixel-qr-card">
                    <div className="relative inline-block w-full max-w-full">
                      <div className="bg-white text-black rounded-lg py-2 sm:py-3 px-3 sm:px-4 w-full flex flex-col justify-center items-center relative">
                        {/* Maximize button in top-right corner */}
                        <button
                          onClick={() => setShowQRModal(true)}
                          className="absolute top-1 right-1 p-1.5 hover:bg-gray-100 rounded transition-colors z-10 border-2 border-black"
                          title="Click to enlarge QR code"
                        >
                          <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                        </button>
                        
                        {/* QR Code - Compact size to minimize scrolling */}
                        <div className="mb-3 py-0.5 w-full flex justify-center">
                          <QRCodeSVG 
                            value={joinUrl} 
                            size={typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.3, 300) : 300}
                            className="mx-auto"
                            style={{ width: '100%', maxWidth: '300px', height: 'auto' }}
                          />
                        </div>
                        
                        {/* Share Link with Copy Button */}
                        <div className="w-full">
                          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 sm:p-3 border-2 border-black">
                            <span className="text-xs sm:text-sm font-mono break-all flex-1 text-gray-900">{joinUrl}</span>
                            <button
                              onClick={copyShareLink}
                              className="p-2 hover:bg-gray-200 rounded transition-colors shrink-0 border border-black"
                              title="Copy join link"
                            >
                              {copiedLink ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Large QR Modal - Almost Fullscreen */}
              <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
                <DialogContent 
                  className="max-w-fit! w-auto! h-auto! z-50 backdrop-blur-sm bg-white border-8 border-black shadow-2xl p-4! overflow-hidden!"
                  showCloseButton={true}
                >
                  <div className="flex justify-center items-center h-full w-full min-w-0 min-h-0 box-border overflow-hidden">
                    {joinUrl && (
                      <div 
                        className="flex items-center justify-center min-w-0 min-h-0 box-border overflow-hidden" 
                        style={{ 
                          maxWidth: 'calc(100% - 32px)', 
                          maxHeight: 'calc(100% - 32px)',
                          width: `${qrSize}px`,
                          height: `${qrSize}px`
                        }}
                      >
                        <QRCodeSVG 
                          value={joinUrl} 
                          size={qrSize}
                          style={{ 
                            display: 'block',
                            width: `${qrSize}px`,
                            height: `${qrSize}px`,
                            maxWidth: '100%',
                            maxHeight: '100%',
                            boxSizing: 'border-box',
                            flexShrink: 0
                          }}
                        />
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </div>
          </div>

          {/* Pixel Players List */}
          <div className="relative pixel-lobby-container">
            <div className="absolute inset-0 bg-linear-to-br from-green-600 to-cyan-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-linear-to-br from-green-500 to-cyan-500 rounded-lg border-2 sm:border-4 border-black shadow-2xl pixel-lobby-card">
              <div className="p-4 sm:p-6">
                {/* Pixel Players Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`inline-block bg-white border border-black rounded px-2 py-1 transition-all duration-500 ${
                      playerCountChanged ? 'animate-pulse bg-green-100 border-green-400' : 
                      playerLeft ? 'animate-pulse bg-red-100 border-red-400' : ''
                    }`}>
                      <span className="text-black font-bold text-xs sm:text-sm pixel-font-sm">
                        {playerCountChanged ? '🎉 ' : playerLeft ? '👋 ' : ''}{t('lobby.players')} ({currentRoom?.players.length || 0})
                      </span>
                    </div>
                  </div>
                  {currentRoom && !gameStarted && (
                    <div className="w-full sm:w-auto">
                      <div className="relative pixel-button-container">
                        <div className="absolute inset-0 bg-linear-to-br from-purple-600 to-purple-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                        <button 
                          onClick={() => {
                            console.log("[Lobby] START QUIZ button clicked, button state:", {
                              roomCode: !!roomCode,
                              hostId: !!hostId,
                              currentRoom: !!currentRoom,
                              playerCount: currentRoom?.players?.length || 0,
                              disabled: !roomCode || !hostId || !currentRoom || currentRoom.players.length === 0
                            })
                            startGame()
                          }}
                          disabled={!roomCode || !hostId || !currentRoom || currentRoom.players.length === 0}
                          className="relative w-full sm:w-auto bg-linear-to-br from-purple-500 to-purple-600 border-2 border-black rounded-lg text-white hover:bg-linear-to-br hover:from-purple-400 hover:to-purple-500 transform hover:scale-105 transition-all duration-200 font-bold px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-lg tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-h-[44px]"
                        >
                          <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="pixel-font-sm">{t('lobby.startGame')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {gameStarted && (
                    <div className="bg-yellow-400 border-2 border-black rounded px-3 py-1">
                      <span className="text-black font-bold text-xs pixel-font-sm">{t('lobby.gameStarted')}</span>
                    </div>
                  )}
                </div>
                
                {/* Pixel Status */}
                
                {/* Pixel Players List */}
                {currentRoom && currentRoom.players.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-black" />
                    </div>
                    <div className="bg-white border-2 border-black rounded px-3 sm:px-4 py-2 inline-block">
                      <p className="text-black font-bold text-xs sm:text-sm pixel-font-sm">{t('lobby.noPlayersYet')}</p>
                      <p className="text-black text-xs pixel-font-sm">{t('lobby.shareRoomCode')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Players Grid - 2 columns on mobile, 4 on desktop */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lobby-players">
                      {currentPlayers.map((player: any) => (
                        <div key={player.id} className="bg-white border-2 border-black rounded p-2 pixel-player-card relative">
                          {/* Kick button - only show for host */}
                          {hostId && (
                            <button
                              onClick={() => handleKickPlayer(player)}
                              className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 border border-black rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                              title={`Kick ${player.username}`}
                            >
                              <X className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />
                            </button>
                          )}
                          <div className="flex flex-col items-center gap-1 sm:gap-2">
                            <div className="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center overflow-hidden">
                              <RobustGoogleAvatar
                                avatarUrl={player.avatar}
                                alt={`${player.username} avatar`}
                                className="w-full h-full"
                                width={48}
                                height={48}
                              />
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-black pixel-font-sm text-xs leading-tight player-username">
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
                          <div className="absolute inset-0 bg-linear-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                          <Button 
                            onClick={goToPreviousPage}
                            disabled={currentPage === 0}
                            className="relative bg-linear-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-linear-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] px-3 sm:px-4"
                          >
                            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="pixel-font-sm text-xs sm:text-sm">PREV</span>
                          </Button>
                        </div>

                        <div className="bg-white border-2 border-black rounded px-2 sm:px-3 py-1">
                          <span className="text-black font-bold text-xs sm:text-sm pixel-font-sm">
                            {currentPage + 1} / {totalPages}
                          </span>
                        </div>

                        <div className="relative pixel-button-container">
                          <div className="absolute inset-0 bg-linear-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                          <Button 
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages - 1}
                            className="relative bg-linear-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-linear-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] px-3 sm:px-4"
                          >
                            <span className="pixel-font-sm text-xs sm:text-sm">NEXT</span>
                            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
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
        <DialogContent className="max-w-md bg-transparent border-none p-0 z-50">
          <div className="relative pixel-dialog-container">
            <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-purple-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-linear-to-br from-blue-500 to-purple-600 rounded-lg border-4 border-black shadow-2xl p-6">
              {/* Dialog Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 pixel-font">{t('lobby.leaveWarning')}</h3>
                <p className="text-white/90 text-sm pixel-font-sm leading-relaxed">
                  {t('lobby.leaveWarningDesc')}<br/>
                </p>
              </div>

              {/* Dialog Buttons */}
              <div className="flex gap-4 justify-center">
                <div className="relative pixel-button-container">
                  <div className="absolute inset-0 bg-linear-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                  <Button 
                    onClick={cancelLeave}
                    className="relative bg-linear-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-linear-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200 font-bold px-6 py-2"
                  >
                    <span className="pixel-font-sm">{t('lobby.cancel')}</span>
                  </Button>
                </div>

                <div className="relative pixel-button-container">
                  <div className="absolute inset-0 bg-linear-to-br from-red-600 to-red-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                  <Button 
                    onClick={confirmLeave}
                    className="relative bg-linear-to-br from-red-500 to-red-600 border-2 border-black rounded-lg text-white hover:bg-linear-to-br hover:from-red-400 hover:to-red-500 transform hover:scale-105 transition-all duration-200 font-bold px-6 py-2"
                  >
                    <span className="pixel-font-sm">{t('lobby.leave')}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kick Player Confirmation Dialog */}
      <Dialog open={showKickDialog} onOpenChange={setShowKickDialog}>
        <DialogContent className="max-w-md bg-transparent border-none p-0 z-50">
          <div className="relative pixel-dialog-container">
            <div className="absolute inset-0 bg-linear-to-br from-red-600 to-red-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-linear-to-br from-red-500 to-red-600 rounded-lg border-4 border-black shadow-2xl p-6">
              {/* Dialog Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 pixel-font">{t('lobby.kickPlayer')}?</h3>
                <p className="text-white/90 text-sm pixel-font-sm leading-relaxed">
                  {t('lobby.confirmKick')}<br/>
                  <span className="font-bold text-yellow-300">{playerToKick?.username?.toUpperCase()}</span><br/>
                  ?
                </p>
              </div>

              {/* Dialog Buttons */}
              <div className="flex gap-4 justify-center">
                <div className="relative pixel-button-container">
                  <div className="absolute inset-0 bg-linear-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                  <Button 
                    onClick={cancelKickPlayer}
                    className="relative bg-linear-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-linear-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200 font-bold px-6 py-2"
                  >
                    <span className="pixel-font-sm">{t('lobby.cancel')}</span>
                  </Button>
                </div>

                <div className="relative pixel-button-container">
                  <div className="absolute inset-0 bg-linear-to-br from-red-600 to-red-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                  <Button 
                    onClick={confirmKickPlayer}
                    className="relative bg-linear-to-br from-red-500 to-red-600 border-2 border-black rounded-lg text-white hover:bg-linear-to-br hover:from-red-400 hover:to-red-500 transform hover:scale-105 transition-all duration-200 font-bold px-6 py-2"
                  >
                    <span className="pixel-font-sm">{t('lobby.kickPlayer')}</span>
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

export default function LobbyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="relative z-10 text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-linear-to-br from-blue-500 to-purple-500 rounded-lg border-4 border-black shadow-2xl p-6">
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
