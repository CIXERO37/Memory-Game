"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useParams, useRouter } from "next/navigation"
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
  const params = useParams()
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

  const currentRoom = room

  const quizSettings = currentRoom ? {
    timeLimit: currentRoom.settings.totalTimeLimit,
    questionCount: currentRoom.settings.questionCount,
  } : {
    timeLimit: 30,
    questionCount: 10,
  }

  const playersPerPage = 20
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

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
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

  const handleNavigationAttempt = (url: string) => {
    setPendingNavigation(url)
    setShowLeaveDialog(true)
  }

  const confirmLeave = async () => {
    // Delete the room when host leaves - this will kick all players
    if (roomCode && hostId) {
      try {
        // Broadcast to all players that host is leaving
        if (typeof window !== 'undefined') {
          const hostLeftChannel = new BroadcastChannel(`host-left-${roomCode}`)
          hostLeftChannel.postMessage({
            type: 'host-left',
            roomCode: roomCode
          })
          hostLeftChannel.close()
        }

        // Delete the room from database
        await roomManager.deleteRoom(roomCode, hostId)
        console.log(`[Host Lobby] Room ${roomCode} deleted successfully`)
      } catch (error) {
        console.error('[Host Lobby] Error deleting room:', error)
      }
    }

    // Clear host session
    try {
      await sessionManager.clearSession()
    } catch (error) {
      console.error('[Host Lobby] Error clearing session:', error)
    }

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem("currentHost")
    }

    setShowLeaveDialog(false)
    setPendingNavigation(null)

    // Navigate to the pending destination
    if (pendingNavigation === "browser-back") {
      router.push("/select-quiz")
    } else if (pendingNavigation) {
      router.push(pendingNavigation)
    } else {
      router.push("/select-quiz")
    }
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
      const success = await roomManager.kickPlayer(roomCode, playerToKick.id, hostId)

      if (success) {
        toast({
          title: t('lobby.playerKicked'),
          description: `👢 ${playerToKick.nickname} ${t('lobby.playerKickedDesc')}`,
          duration: 3000,
        })



        if (typeof window !== 'undefined') {
          const broadcastChannel = new BroadcastChannel(`kick-${roomCode}`)
          broadcastChannel.postMessage({
            type: 'player-kicked',
            playerId: playerToKick.id,
            nickname: playerToKick.nickname,
            roomCode: roomCode
          })
          broadcastChannel.close()
        }
      } else {
        toast({
          title: t('lobby.failedToKick'),
          description: t('lobby.failedToKickDesc'),
          duration: 3000,
        })
      }
    } catch (error) {
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

    setIsRedirecting(true)

    try {
      const beforeUnloadHandler = () => { }
      window.removeEventListener('beforeunload', beforeUnloadHandler)

      const success = await roomManager.startGame(roomCode, hostId)
      if (success) {
        window.location.replace(`/host/${roomCode}/monitor`)
      } else {
        window.location.replace(`/host/${roomCode}/monitor`)
      }
    } catch (error) {
      window.location.replace(`/host/${roomCode}/monitor`)
    }
  }

  useEffect(() => {
    if (!roomCode) return
    // useRoom hook handles subscription and updates
  }, [roomCode])

  useEffect(() => {
    const paramCode = typeof params?.roomCode === "string" ? params.roomCode : Array.isArray(params?.roomCode) ? params.roomCode[0] : null

    const initializeHostSession = async () => {
      try {
        // 1. Check Supabase Session
        const sessionId = sessionManager.getSessionIdFromStorage()
        if (sessionId) {
          const sessionData = await sessionManager.getSessionData(sessionId).catch(() => null)
          if (sessionData && sessionData.user_type === 'host' && sessionData.user_data?.roomCode === paramCode) {
            try {
              const { hostId: storedHostId, roomCode: storedRoomCode, quizId: storedQuizId } = sessionData.user_data
              setHostId(storedHostId)
              setQuizId(storedQuizId)
              setRoomCode(storedRoomCode)

              // Load room data
              try {
                await roomManager.getRoom(storedRoomCode)
              } catch (error) { }
              return
            } catch (error) {
              console.error("Error setting host session logic", error)
            }
          }
        }

        // 2. Check LocalStorage
        if (typeof window !== 'undefined') {
          const hostData = localStorage.getItem("currentHost")
          if (hostData) {
            try {
              const { hostId: storedHostId, roomCode: storedRoomCode, quizId: storedQuizId } = JSON.parse(hostData)

              // VERIFY that the stored code matches the URL code
              if (storedRoomCode === paramCode) {
                setHostId(storedHostId)
                setQuizId(storedQuizId)
                setRoomCode(storedRoomCode)
                return // VALID HOST
              }
            } catch (error) {
              console.error("Error parsing host data", error)
            }
          }
        }

        // 3. UNAUTHORIZED / NO MATCH
        console.warn(`[Lobby] Access denied for room ${paramCode} - No matching host credentials`)
        if (paramCode) {
          router.replace(`/join/${paramCode}`) // Redirect to join as player
        } else {
          router.push("/select-quiz")
        }

      } catch (error) {
        console.error("Error in host initialization:", error)
        if (paramCode) {
          router.replace(`/join/${paramCode}`)
        } else {
          router.push("/select-quiz")
        }
      }
    }

    initializeHostSession()
  }, [params, router])

  useEffect(() => {
    if (currentRoom?.gameStarted) {
      setGameStarted(true)
    }
  }, [currentRoom, roomCode, hostId, gameStarted])

  const shareUrl = roomCode && typeof window !== 'undefined' ? `${window.location.origin}/join/${roomCode}` : ""
  const joinUrl = shareUrl

  useEffect(() => {
    if (showQRModal && typeof window !== 'undefined') {
      const updateQrSize = () => {
        const borderPadding = 80
        const modalWidth = window.innerWidth * 0.98
        const modalHeight = window.innerHeight * 0.98
        const availableWidth = modalWidth - borderPadding
        const availableHeight = modalHeight - borderPadding
        const size = Math.min(
          availableWidth * 0.9,
          availableHeight * 0.9,
          4000
        )
        setQrSize(Math.max(400, Math.floor(size)))
      }
      updateQrSize()
      const resizeTimer = setTimeout(updateQrSize, 100)
      window.addEventListener('resize', updateQrSize)
      return () => {
        window.removeEventListener('resize', updateQrSize)
        clearTimeout(resizeTimer)
      }
    }
  }, [showQRModal])

  const copyRoomCode = async () => {
    if (!roomCode) return;
    const textToCopy = roomCode; // Only copy the room code, not the full URL

    try {
      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: t('lobby.roomCodeCopied') || "Room Code Copied!",
        description: "Share this code with your friends",
      });
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1500);
    } catch (err) {
      console.error("Failed to copy with navigator.clipboard: ", err);
      // Fallback to execCommand
      try {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed"; // Prevent scrolling to bottom of page in MS Edge.
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);

        toast({
          title: t('lobby.roomCodeCopied') || "Room Code Copied!",
          description: "Share this code with your friends",
        });
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 1500);
      } catch (execErr) {
        console.error("Failed to copy with execCommand: ", execErr);
        toast({
          title: t('lobby.failedToCopy'),
          description: t('lobby.failedToCopyDesc'),
          variant: "destructive",
        });
      }
    }
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: t('lobby.shareLinkCopied'),
        description: "Send this link to your friends",
      });
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    } catch (err) {
      console.error("Failed to copy with navigator.clipboard: ", err);
      // Fallback to execCommand
      try {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);

        toast({
          title: t('lobby.shareLinkCopied'),
          description: "Send this link to your friends",
        });
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 1500);
      } catch (execErr) {
        console.error("Failed to copy with execCommand: ", execErr);
        toast({
          title: t('lobby.failedToCopy'),
          description: t('lobby.failedToCopyDesc'),
          variant: "destructive",
        });
      }
    }
  };

  const startGame = async () => {
    if (gameStarted || !currentRoom || !roomCode || !hostId) {
      return
    }

    try {
      const countdownSuccess = await roomManager.startCountdown(roomCode, hostId, 10)

      if (countdownSuccess) {
        setGameStarted(true)

        const countdownStartTime = new Date().toISOString()
        const updatedRoom = {
          ...currentRoom,
          status: "countdown" as const,
          countdownStartTime: countdownStartTime,
          countdownDuration: 10
        }


        if (typeof window !== 'undefined') {
          const broadcastChannel = new BroadcastChannel(`countdown-${roomCode}`)
          broadcastChannel.postMessage({
            type: 'countdown-started',
            room: updatedRoom,
            countdownStartTime: countdownStartTime,
            countdownDuration: 10
          })
          broadcastChannel.close()
        }

        setTimeout(() => { }, 100)
      } else {
        toast({
          title: t('lobby.failedToStartGame'),
          description: t('lobby.couldNotStartCountdown'),
          duration: 3000,
        })
      }
    } catch (error) {
      toast({
        title: t('lobby.error'),
        description: t('lobby.errorStartingGame'),
        duration: 3000,
      })
    }
  }

  // 🚀 FIX: Check for countdown using both status and countdownStartTime
  if (currentRoom && (currentRoom.status === "countdown" || (currentRoom.countdownStartTime && !currentRoom.gameStarted))) {
    return (
      <CountdownTimer
        room={currentRoom}
        playerId={hostId || undefined}
        isHost={true}
        onCountdownComplete={handleCountdownComplete}
      />
    )
  }

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

  if (currentRoom) {
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
    if (hostId && roomCode && quizId) {
      const recreatedRoom = roomManager.createRoomWithCode(roomCode, hostId, {
        questionCount: 10,
        totalTimeLimit: 30
      })

      if (recreatedRoom) {

      } else {
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
          <div className="absolute inset-0 opacity-20">
            <div className="pixel-grid"></div>
          </div>
          <div className="absolute inset-0 opacity-10">
            <div className="scanlines"></div>
          </div>
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
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-40" />
      )}

      <div className={`absolute inset-0 opacity-20 ${showQRModal ? 'blur-md' : ''}`}>
        <div className="pixel-grid"></div>
      </div>

      <div className={`absolute inset-0 opacity-10 ${showQRModal ? 'blur-md' : ''}`}>
        <div className="scanlines"></div>
      </div>

      <div className={`absolute inset-0 overflow-hidden ${showQRModal ? 'blur-md' : ''}`}>
        <PixelBackgroundElements />
      </div>

      <div className={`relative z-10 w-full px-4 pt-6 ${showQRModal ? 'blur-md' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              onClick={() => {
                if (quizId) localStorage.setItem("selectedQuizId", quizId)
                handleNavigationAttempt(quizId ? "/quiz-settings" : "/select-quiz")
              }}
              className="cursor-pointer shrink-0"
            >
              <div className="relative pixel-button-container">
                <div className="absolute inset-0 bg-linear-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                <Button variant="outline" size="sm" className="relative bg-linear-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-linear-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200">
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 min-w-0 -mt-2">
              <img
                draggable={false}
                src="/images/memoryquizv4.webp"
                alt="Memory Quiz"
                className="h-8 sm:h-12 md:h-16 lg:h-20 xl:h-24 w-auto object-contain"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5)) drop-shadow(0 4px 12px rgba(0,0,0,0.6))',
                }}
              />
            </div>
          </div>

          <div className="shrink-0 -mt-2 sm:-mt-12">
            <img
              draggable={false}
              src="/images/gameforsmartlogo.webp"
              alt="GameForSmart Logo"
              className={`h-8 sm:h-12 md:h-16 lg:h-20 xl:h-24 w-auto object-contain drop-shadow-lg ${showQRModal ? 'blur-sm' : ''}`}
            />
          </div>
        </div>
      </div>

      <div className={`relative z-10 mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-6 ${showQRModal ? 'blur-md' : ''}`}>
        <div className="mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
          <div className="relative pixel-lobby-container">
            <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-linear-to-br from-blue-500 to-purple-500 rounded-lg border-2 sm:border-4 border-black shadow-2xl pixel-lobby-card">
              <div className="p-4 sm:p-6 space-y-2">

                <div className="flex flex-row sm:flex-row justify-center gap-2 sm:gap-4 mb-4">
                  <div className="bg-blue-100 border border-blue-300 rounded-full px-3 sm:px-4 py-2 flex items-center gap-2 shadow-sm">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">⏱️</span>
                    </div>
                    <span className="text-blue-700 font-medium text-xs sm:text-sm">
                      {currentRoom?.settings.totalTimeLimit || 30}:00
                    </span>
                  </div>

                  <div className="bg-green-100 border border-green-300 rounded-full px-3 sm:px-4 py-2 flex items-center gap-2 shadow-sm">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">❓</span>
                    </div>
                    <span className="text-green-700 font-medium text-xs sm:text-sm">
                      {currentRoom?.settings.questionCount || 10} {t('lobby.questions')}
                    </span>
                  </div>
                </div>

                <div className="bg-white border-2 border-black rounded pt-2 pb-3 sm:pt-3 sm:pb-4 md:pt-4 md:pb-6 px-3 sm:px-4 md:px-6 pixel-room-code relative">
                  <button
                    onClick={copyRoomCode}
                    aria-label="Copy room code"
                    className={`absolute bottom-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded border-2 border-black flex items-center justify-center ${copiedCode ? "bg-green-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
                  >
                    {copiedCode ? <span className="font-bold text-xs sm:text-sm md:text-lg">✓</span> : <Copy className="h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6" />}
                  </button>

                  <div className="text-center pt-0 px-8 sm:px-12 md:px-16">
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black font-mono text-black room-code-text break-all leading-tight">
                      {roomCode}
                    </div>
                  </div>
                </div>

                {joinUrl && (
                  <div className="bg-white border-2 border-black rounded p-2 sm:p-3 md:p-4 pixel-qr-card">
                    <div className="relative inline-block w-full max-w-full">
                      <div className="bg-white text-black rounded-lg py-2 sm:py-3 px-3 sm:px-4 w-full flex flex-col justify-center items-center relative">
                        <button
                          onClick={() => setShowQRModal(true)}
                          className="hidden sm:block absolute top-1 right-1 p-1.5 hover:bg-gray-100 rounded transition-colors z-10 border-2 border-black"
                          title="Click to enlarge QR code"
                        >
                          <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                        </button>

                        <div className="mb-3 py-0.5 w-full flex justify-center">
                          <QRCodeSVG
                            value={joinUrl}
                            size={typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.3, 300) : 300}
                            className="mx-auto"
                            style={{ width: '100%', maxWidth: '300px', height: 'auto' }}
                          />
                        </div>

                        <div className="w-full">
                          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 sm:p-3 border-2 border-black">
                            <span className="text-xs sm:text-sm font-mono break-all flex-1 text-gray-900">{joinUrl}</span>
                            <button
                              onClick={copyShareLink}
                              className="p-2 hover:bg-gray-200 rounded transition-colors shrink-0 border border-black flex items-center justify-center"
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

                <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
                  <DialogContent
                    className="max-w-fit! w-auto! h-auto! z-50 backdrop-blur-sm bg-white border-8 border-black shadow-2xl p-4! overflow-hidden!"
                    showCloseButton={true}
                  >
                    <DialogTitle className="sr-only">QR Code</DialogTitle>
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

          <div className="relative pixel-lobby-container">
            <div className="absolute inset-0 bg-linear-to-br from-green-600 to-cyan-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-linear-to-br from-green-500 to-cyan-500 rounded-lg border-2 sm:border-4 border-black shadow-2xl pixel-lobby-card">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`inline-block bg-white border border-black rounded px-2 py-1 transition-all duration-500 ${playerCountChanged ? 'animate-pulse bg-green-100 border-green-400' :
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lobby-players">
                      {currentPlayers.map((player: any) => (
                        <div key={player.id} className="bg-white border-2 border-black rounded p-2 pixel-player-card relative overflow-visible">
                          {hostId && (
                            <button
                              onClick={() => handleKickPlayer(player)}
                              className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-5 sm:h-5 bg-red-500 border border-black rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                              title={`Kick ${player.nickname}`}
                            >
                              <X className="h-3 w-3 sm:h-2.5 sm:w-2.5 text-white" />
                            </button>
                          )}
                          <div className="flex flex-col items-center gap-1 sm:gap-2">
                            <div className="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center overflow-hidden">
                              <RobustGoogleAvatar
                                avatarUrl={player.avatar}
                                alt={`${player.nickname} avatar`}
                                className="w-full h-full"
                                width={48}
                                height={48}
                              />
                            </div>
                            {/* Name with Tooltip */}
                            <div className="text-center w-full relative group">
                              <div
                                className="font-bold text-black pixel-font-sm text-xs leading-tight player-username truncate max-w-full px-1 cursor-pointer group-hover:text-purple-600 transition-colors"
                              >
                                {player.nickname.toUpperCase()}
                              </div>
                              {/* Custom Styled Tooltip - appears above */}
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] pointer-events-none">
                                <div className="relative bg-gradient-to-br from-purple-600 to-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg border-2 border-black shadow-lg whitespace-nowrap">
                                  {player.nickname}
                                  {/* Arrow pointing down */}
                                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-black"></div>
                                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-blue-600"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

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

      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="max-w-md bg-transparent border-none p-0 z-50">
          <div className="relative pixel-dialog-container">
            <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-purple-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-linear-to-br from-blue-500 to-purple-600 rounded-lg border-4 border-black shadow-2xl p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <DialogTitle className="text-xl font-bold text-white mb-2 pixel-font">{t('lobby.leaveWarning')}</DialogTitle>
                <p className="text-white/90 text-sm pixel-font-sm leading-relaxed">
                  {t('lobby.leaveWarningDesc')}<br />
                </p>
              </div>

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

      <Dialog open={showKickDialog} onOpenChange={setShowKickDialog}>
        <DialogContent className="max-w-md bg-transparent border-none p-0 z-50">
          <div className="relative pixel-dialog-container">
            <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-purple-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-linear-to-br from-blue-500 to-purple-600 rounded-lg border-4 border-black shadow-2xl p-6">
              <div className="text-center mb-6">

                <DialogTitle className="text-xl font-bold text-white mb-2 pixel-font">{t('lobby.kickPlayer')}?</DialogTitle>
                <p className="text-white/90 text-sm pixel-font-sm leading-relaxed">
                  {t('lobby.confirmKick')}<br />
                  <span className="font-bold text-red-400 text-lg">{playerToKick?.nickname?.toUpperCase()}</span><br />

                </p>
              </div>

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


