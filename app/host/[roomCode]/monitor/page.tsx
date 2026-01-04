"use client"

import { useState, useEffect, Suspense, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Users, Trophy, Clock, TrendingUp, TrendingDown } from "lucide-react"
import { useRoom } from "@/hooks/use-room"
import { roomManager } from "@/lib/room-manager"
import { getTimerDisplayText } from "@/lib/timer-utils"
import { useSynchronizedTimer } from "@/hooks/use-synchronized-timer"
import { sessionManager } from "@/lib/supabase-session-manager"
import { RobustGoogleAvatar } from "@/components/robust-google-avatar"
import { useTranslation } from "react-i18next"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function MonitorPageContent() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const previousRankingsRef = useRef<{ [key: string]: number }>({})
  const [rankingChanges, setRankingChanges] = useState<{ [key: string]: "up" | "down" | null }>({})
  const [forceRefresh, setForceRefresh] = useState(0)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const [timeUpHandled, setTimeUpHandled] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const [isHostDetected, setIsHostDetected] = useState(false)
  const [lastVerifiedCompletion, setLastVerifiedCompletion] = useState(false)
  const { room, loading } = useRoom(roomCode || "")

  // 🚀 CRITICAL: Timing constants
  const HOST_COMPLETION_DELAY = 5000


  // Debug log
  useEffect(() => {
    if (room) {


      // 🚀 CRITICAL: Immediate redirect check when room status changes to finished
      // Check with isHost conditions first
      if (room.status === "finished" && isHost && isHostDetected && !redirecting && roomCode) {

        setRedirecting(true)
        // Use setTimeout to ensure state is set before redirect
        setTimeout(() => {
          const redirectUrl = `/host/leaderboad?roomCode=${roomCode}`

          try {
            window.location.href = redirectUrl
          } catch (error) {
            console.error("[Monitor] Immediate redirect error:", error)
            try {
              window.location.replace(redirectUrl)
            } catch (error2) {
              router.push(redirectUrl)
            }
          }
        }, 50)
      } else if (room.status === "finished" && !redirecting && roomCode) {
        // 🚀 FALLBACK: Redirect even if isHost/isHostDetected not set yet (we're on /host/[roomCode]/monitor)

        setRedirecting(true)
        setTimeout(() => {
          const redirectUrl = `/host/leaderboad?roomCode=${roomCode}`

          try {
            window.location.href = redirectUrl
          } catch (error) {
            console.error("[Monitor] Fallback redirect error:", error)
            try {
              window.location.replace(redirectUrl)
            } catch (error2) {
              router.push(redirectUrl)
            }
          }
        }, 50)
      }
    }
  }, [room, isHost, isHostDetected, redirecting, roomCode, router])

  const quizSettings = room ? {
    timeLimit: room.settings.totalTimeLimit,
    questionCount: room.settings.questionCount,
  } : {
    timeLimit: 30,
    questionCount: 10,
  }

  const handleTimeUp = useCallback(async () => {
    if (timeUpHandled || !roomCode) return
    setTimeUpHandled(true)



    try {
      await roomManager.updateGameStatus(roomCode, "finished")

      let broadcastChannel: BroadcastChannel | null = null
      try {
        if (typeof window !== 'undefined') {
          broadcastChannel = new BroadcastChannel(`game-end-${roomCode}`)
          broadcastChannel.postMessage({
            type: 'game-ended',
            roomCode: roomCode,
            timestamp: Date.now()
          })

        }
      } finally {
        if (broadcastChannel) {
          broadcastChannel.close()
        }
      }

      window.location.href = `/host/leaderboad?roomCode=${roomCode}`
    } catch (error) {
      console.error("[Monitor] Error ending game due to timer expiration:", error)
      window.location.href = `/host/leaderboad?roomCode=${roomCode}`
    }
  }, [timeUpHandled, roomCode])

  const timerState = useSynchronizedTimer(room, quizSettings.timeLimit, handleTimeUp)

  useEffect(() => {
    if (timerState.remainingTime <= 60 && timerState.remainingTime > 0) {
      setShowTimeWarning(true)
    } else {
      setShowTimeWarning(false)
    }
  }, [timerState.remainingTime])

  useEffect(() => {
    if (timerState.remainingTime <= 0 && !timeUpHandled) {
      setShowTimeWarning(true)
    }
  }, [timerState.remainingTime, timeUpHandled])

  useEffect(() => {
    const roomCodeParam = typeof params?.roomCode === "string" ? params.roomCode : Array.isArray(params?.roomCode) ? params.roomCode[0] : null
    if (roomCodeParam) {
      setRoomCode(roomCodeParam)
    } else {
      const loadHostData = async () => {
        try {
          const sessionId = sessionManager.getSessionIdFromStorage()
          if (sessionId) {
            try {
              const sessionData = await sessionManager.getSessionData(sessionId)
              if (sessionData && sessionData.user_type === 'host' && sessionData.room_code) {
                setRoomCode(sessionData.room_code)
                setIsHost(true)
                setIsHostDetected(true)
                return
              }
            } catch (error) {
              console.warn("Error getting host session:", error)
            }
          }
        } catch (error) {
          console.warn("Error accessing session manager:", error)
        }

        const hostData = localStorage.getItem("currentHost")
        if (hostData) {
          const { roomCode: storedRoomCode, isHost } = JSON.parse(hostData)
          setRoomCode(storedRoomCode)
          setIsHost(isHost || false)
          setIsHostDetected(true)
        } else {
          router.push("/select-quiz")
        }
      }

      loadHostData()
    }
  }, [params, router])

  // 🚀 Broadcast listener for progress updates
  useEffect(() => {
    if (roomCode) {
      const broadcastChannel = new BroadcastChannel(`progress-update-${roomCode}`)
      let lastUpdateTime = 0

      broadcastChannel.onmessage = (event) => {
        if (event.data.type === 'progress-update') {
          const now = Date.now()
          if (now - lastUpdateTime < 1000) return
          lastUpdateTime = now



          if (redirecting) {

            return
          }

          roomManager.getRoom(roomCode).then((updatedRoom) => {
            if (updatedRoom?.status === 'finished') {

              return
            }

            if (updatedRoom) {
              setForceRefresh(prev => prev + 1)
            }
          })
        }
      }

      return () => {
        broadcastChannel.close()
      }
    }
  }, [roomCode, redirecting])

  // 🚀 CRITICAL: Listen for game-ended broadcast for immediate redirect
  useEffect(() => {
    if (!roomCode || redirecting) return

    const gameEndChannel = new BroadcastChannel(`game-end-${roomCode}`)

    gameEndChannel.onmessage = (event) => {
      if (event.data.type === 'game-ended') {
        console.log('[Monitor] Received game-ended broadcast, redirecting to leaderboard')
        setRedirecting(true)
        setLastVerifiedCompletion(true)

        // Immediate redirect
        window.location.href = `/host/leaderboad?roomCode=${roomCode}`
      }
    }

    return () => {
      gameEndChannel.close()
    }
  }, [roomCode, redirecting])

  // 🚀 SUPABASE REALTIME: Updates are handled by useRoom hook via Realtime subscriptions
  // This effect only checks for 'finished' status as a fallback (every 5 seconds)
  useEffect(() => {
    if (!roomCode || redirecting) return

    const checkForFinished = async () => {
      try {
        const currentRoom = await roomManager.getRoom(roomCode)
        if (currentRoom?.status === 'finished' && !redirecting) {
          console.log('[Monitor] Fallback check detected game finished, redirecting...')
          setRedirecting(true)
          setLastVerifiedCompletion(true)
          window.location.href = `/host/leaderboad?roomCode=${roomCode}`
        }
      } catch (error) {
        console.error('[Monitor] Error checking for finished:', error)
      }
    }

    const interval = setInterval(checkForFinished, 5000) // Fallback check every 5 seconds

    return () => clearInterval(interval)
  }, [roomCode, redirecting])

  useEffect(() => {
    if (room) {
      const players = room.players.filter((p) => !p.isHost)
      const sortedPlayers = [...players].sort((a, b) => {
        const aTotal = a.quizScore || 0
        const bTotal = b.quizScore || 0
        return bTotal - aTotal
      })

      const newRankings: { [key: string]: number } = {}
      const changes: { [key: string]: "up" | "down" | null } = {}
      const previousRankings = previousRankingsRef.current

      sortedPlayers.forEach((player, index) => {
        const newRank = index + 1
        newRankings[player.id] = newRank
        const oldRank = previousRankings[player.id]

        if (oldRank && oldRank !== newRank) {
          changes[player.id] = oldRank > newRank ? "up" : "down"
        } else {
          changes[player.id] = null
        }
      })

      // Update ref instead of state to avoid infinite loop
      previousRankingsRef.current = newRankings
      setRankingChanges(changes)

      setTimeout(() => {
        setRankingChanges({})
      }, 3000)
    }
  }, [room, forceRefresh])

  // 🚀 CRITICAL: Monitor room status untuk redirect otomatis ketika game finished
  useEffect(() => {


    if (room && isHost && isHostDetected && room.status === "finished" && !redirecting) {

      setRedirecting(true)

      // Redirect host ke leaderboard dengan multiple fallback - IMMEDIATE
      const redirectToLeaderboard = () => {

        try {
          const url = `/host/leaderboad?roomCode=${roomCode}`

          window.location.href = url
        } catch (error) {
          console.error("[Monitor] Error with window.location.href, trying window.location.replace...", error)
          try {
            window.location.replace(`/host/leaderboad?roomCode=${roomCode}`)
          } catch (error2) {
            console.error("[Monitor] Error with window.location.replace, trying router.push...", error2)
            router.push(`/host/leaderboad?roomCode=${roomCode}`)
          }
        }
      }

      // Redirect immediately, no delay
      redirectToLeaderboard()
    } else if (room && room.status === "finished") {

    }
  }, [room?.status, isHost, isHostDetected, redirecting, roomCode, router])



  // 🚀 CRITICAL: Auto-end game ketika ada player yang selesai - force semua player selesai
  useEffect(() => {
    if (room && isHost && isHostDetected && !redirecting && !lastVerifiedCompletion) {
      const nonHostPlayers = room.players.filter(p => !p.isHost)
      // Use questions array length if available, otherwise use settings.questionCount
      const totalQuestions = room.questions?.length || room.settings.questionCount || 10



      // Cek apakah ada player yang sudah selesai (bukan semua player)
      const hasPlayerCompleted = nonHostPlayers.some(player => {
        const answered = player.questionsAnswered || 0
        return answered >= totalQuestions
      })

      if (hasPlayerCompleted && nonHostPlayers.length > 0) {


        // 🚀 IMPROVED: Multiple verification attempts with faster delays
        const verifyAndForceFinish = async (attempt = 1, maxAttempts = 3) => {
          if (!roomCode) return
          try {


            // Reduced delays for faster redirect
            const delay = attempt === 1 ? 500 : attempt === 2 ? 1000 : 1500
            await new Promise(resolve => setTimeout(resolve, delay))

            const verifiedRoom = await roomManager.getRoom(roomCode!)

            if (!verifiedRoom) {
              console.error("[Monitor] Verification failed: room not found")
              if (attempt < maxAttempts) {
                return verifyAndForceFinish(attempt + 1, maxAttempts)
              }
              setRedirecting(false)
              setLastVerifiedCompletion(false)
              return
            }

            // Force finish semua player yang belum selesai
            const playersToForceFinish = verifiedRoom.players
              .filter(p => !p.isHost && (p.questionsAnswered || 0) < totalQuestions)



            // Update semua player yang belum selesai
            const forceFinishPromises = playersToForceFinish.map(async (player) => {
              const currentScore = player.quizScore || 0

              return roomManager.updatePlayerScore(
                roomCode!,
                player.id,
                currentScore,
                totalQuestions // Force questionsAnswered ke totalQuestions
              )
            })

            // Tunggu semua update selesai
            const results = await Promise.all(forceFinishPromises)
            const allSucceeded = results.every(result => result === true)

            if (!allSucceeded) {
              console.warn("[Monitor] Some force finish updates failed, but continuing...")
            }

            // Verifikasi lagi setelah force finish (reduced delay)
            await new Promise(resolve => setTimeout(resolve, 300))
            const finalRoom = await roomManager.getRoom(roomCode!)

            if (!finalRoom) {
              console.error("[Monitor] Could not verify final room state")
              if (attempt < maxAttempts) {
                return verifyAndForceFinish(attempt + 1, maxAttempts)
              }
              setRedirecting(false)
              setLastVerifiedCompletion(false)
              return
            }

            const allCompleted = finalRoom.players
              .filter(p => !p.isHost)
              .every(p => (p.questionsAnswered || 0) >= totalQuestions)

            if (!allCompleted) {

              if (attempt < maxAttempts) {
                return verifyAndForceFinish(attempt + 1, maxAttempts)
              }

              console.warn("[Monitor] Could not verify all players completed, but forcing game end anyway.")
              // Proceed to end game logic
            }


            setLastVerifiedCompletion(true)
            setRedirecting(true)

            // Update game status ke finished
            await roomManager.updateGameStatus(roomCode!, "finished")


            // Broadcast game end untuk memberitahu semua player
            const broadcastChannel = new BroadcastChannel(`game-end-${roomCode}`)
            broadcastChannel.postMessage({
              type: 'game-ended',
              roomCode: roomCode,
              timestamp: Date.now()
            })
            broadcastChannel.close()



            // Redirect host ke leaderboard IMMEDIATELY - tidak perlu tunggu


            // Use setTimeout with 0 delay to ensure redirect happens after state updates
            setTimeout(() => {
              try {

                window.location.href = `/host/leaderboad?roomCode=${roomCode}`
              } catch (error) {
                console.error("[Monitor] Error with window.location.href, trying window.location.replace...")
                try {
                  window.location.replace(`/host/leaderboad?roomCode=${roomCode}`)
                } catch (error2) {
                  console.error("[Monitor] Error with window.location.replace, trying router.push...")
                  router.push(`/host/leaderboad?roomCode=${roomCode}`)
                }
              }
            }, 100) // Very short delay just to ensure state is set

          } catch (error) {
            console.error(`[Monitor] Error during force finish attempt ${attempt}:`, error)
            if (attempt < maxAttempts) {
              return verifyAndForceFinish(attempt + 1, maxAttempts)
            }
            // Fallback: tetap redirect meskipun ada error

            setRedirecting(true)
            setTimeout(() => {
              try {
                window.location.href = `/host/leaderboad?roomCode=${roomCode}`
              } catch (error) {
                window.location.replace(`/host/leaderboad?roomCode=${roomCode}`)
              }
            }, 1000)
          }
        }

        setLastVerifiedCompletion(true)
        setRedirecting(true)
        verifyAndForceFinish()
      }
    }
  }, [room, isHost, isHostDetected, redirecting, roomCode, forceRefresh, lastVerifiedCompletion, router])



  // 🚀 Monitoring completion (Reactive instead of polling)
  useEffect(() => {
    if (room && isHost && !redirecting) {
      const nonHostPlayers = room.players.filter(p => !p.isHost)
      const totalQuestions = room.settings.questionCount || 10
      const completedCount = nonHostPlayers.filter(p => (p.questionsAnswered || 0) >= totalQuestions).length



      // 🚀 CRITICAL: Force redirect if status is finished (backup check)
      if (room.status === "finished" && !redirecting && roomCode) {

        setRedirecting(true)
        setTimeout(() => {
          try {
            window.location.href = `/host/leaderboad?roomCode=${roomCode}`
          } catch (error) {
            window.location.replace(`/host/leaderboad?roomCode=${roomCode}`)
          }
        }, 100)
      }
    }
  }, [room, isHost, redirecting, lastVerifiedCompletion, roomCode])

  const endGame = async () => {
    if (!roomCode) return

    try {
      const success = await roomManager.updateGameStatus(roomCode, "finished")
      if (success) {
        const broadcastChannel = new BroadcastChannel(`game-end-${roomCode}`)
        broadcastChannel.postMessage({ type: 'game-ended', roomCode, timestamp: Date.now() })
        broadcastChannel.close()

        router.push(`/host/leaderboad?roomCode=${roomCode}`)
        setTimeout(() => {
          if (window.location.pathname !== `/host/leaderboad`) {
            window.location.href = `/host/leaderboad?roomCode=${roomCode}`
          }
        }, 1000)
      }
    } catch (error) {
      console.error("Error ending game:", error)
      window.location.href = `/host/leaderboad?roomCode=${roomCode}`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="absolute inset-0 opacity-20">
          <div className="pixel-grid"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="bg-linear-to-br from-blue-500/20 to-purple-500/20 border-2 sm:border-4 border-white/30 rounded-lg p-6 sm:p-8 text-center pixel-lobby-card">
            <div className="text-white text-sm sm:text-base">{t('monitor.loadingHostMonitor')}</div>
          </div>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="absolute inset-0 opacity-20">
          <div className="pixel-grid"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="bg-linear-to-br from-blue-500/20 to-purple-500/20 border-2 sm:border-4 border-white/30 rounded-lg p-6 sm:p-8 text-center pixel-lobby-card">
            <div className="text-white text-sm sm:text-base">{t('monitor.loadingRoom')}</div>
            <div className="text-blue-200 text-xs sm:text-sm mt-2">{t('monitor.connectingGame')}</div>
          </div>
        </div>
      </div>
    )
  }

  const splitPlayerName = (name: string) => {
    const words = name.split(' ')

    if (words.length === 1 || name.length <= 8) {
      return { firstWord: name, secondWord: '' }
    }

    if (words.length === 2) {
      return { firstWord: words[0], secondWord: words[1] }
    }

    if (words.length > 2) {
      return { firstWord: words[0], secondWord: words[1] }
    }

    return { firstWord: name, secondWord: '' }
  }

  const players = room.players.filter((p) => !p.isHost)
  const sortedPlayers = [...players].sort((a, b) => {
    const aTotal = (a.quizScore || 0)
    const bTotal = (b.quizScore || 0)
    return bTotal - aTotal
  })

  if (redirecting) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 bg-linear-to-r from-blue-400 to-purple-400 rounded-lg border-2 border-white shadow-xl flex items-center justify-center pixel-brain mb-4 mx-auto animate-pulse">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">GAME ENDING...</h2>
            <p className="text-sm text-blue-200">Finalizing scores...</p>
            <p className="text-xs text-blue-300 mt-2">Redirecting in 5 seconds...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
      <div className="absolute inset-0 opacity-20">
        <div className="pixel-grid"></div>
      </div>

      <div className="absolute inset-0 opacity-10">
        <div className="scanlines"></div>
      </div>

      <div className="absolute inset-0 overflow-hidden">
        <PixelBackgroundElements />
        <div className="absolute top-20 left-10 w-32 h-32 opacity-20 animate-float">
          <div className="w-full h-full rounded-full bg-linear-to-r from-blue-400 to-purple-400 blur-xl"></div>
        </div>
        <div className="absolute top-40 right-20 w-24 h-24 opacity-30 animate-float-delayed">
          <div className="w-full h-full rounded-full bg-linear-to-r from-cyan-400 to-blue-400 blur-lg"></div>
        </div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 opacity-25 animate-float-slow">
          <div className="w-full h-full rounded-full bg-linear-to-r from-purple-400 to-pink-400 blur-2xl"></div>
        </div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 opacity-35 animate-float-delayed-slow">
          <div className="w-full h-full rounded-full bg-linear-to-r from-green-400 to-cyan-400 blur-xl"></div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <div>
                <div className="flex flex-row sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <img
                    src="/images/memoryquizv4.webp"
                    alt="MEMORY QUIZ"
                    className="h-12 w-auto sm:h-16 md:h-20 object-contain"
                    draggable={false}
                  />
                  <img
                    src="/images/gameforsmartlogo.webp"
                    alt="GameForSmart Logo"
                    className="h-12 w-auto sm:h-16 md:h-20 object-contain"
                  />
                  <div className="flex flex-row sm:flex-row gap-2">
                    <div className="bg-blue-500/20 border-2 border-blue-500/50 rounded-lg px-2 sm:px-4 py-1 sm:py-2">
                      <span className="text-blue-400 font-bold text-xs sm:text-sm">{players.length} {t('monitor.players')}</span>
                    </div>
                    <div className={`${showTimeWarning ? 'bg-red-500/20 border-red-500/50 animate-pulse' : 'bg-green-500/20 border-green-500/50'} border-2 rounded-lg px-2 sm:px-4 py-1 sm:py-2 flex items-center gap-2`}>
                      <Clock className={`w-3 h-3 sm:w-4 sm:h-4 ${showTimeWarning ? 'text-red-400' : 'text-green-400'}`} />
                      <span className={`font-bold text-xs sm:text-sm ${showTimeWarning ? 'text-red-400' : 'text-green-400'}`}>
                        {getTimerDisplayText(timerState)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <AlertDialog>
              <AlertDialogTrigger className="relative pixel-button-container w-full sm:w-auto">
                <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-cyan-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                <div className="relative bg-linear-to-br from-blue-500 to-cyan-500 border-2 sm:border-4 border-black rounded-lg shadow-2xl font-bold text-white text-sm sm:text-base lg:text-lg pixel-button-host transform hover:scale-105 transition-all duration-300 px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto min-h-[44px] flex items-center justify-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-black rounded border-2 border-white flex items-center justify-center">
                      <span className="text-white font-bold text-xs sm:text-sm">✕</span>
                    </div>
                    <span className="text-sm sm:text-base lg:text-lg font-bold">{t('monitor.endGame')}</span>
                  </div>
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-900 border-2 border-white/20 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Akhiri Game?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-300">
                    Apakah Anda yakin ingin mengakhiri game ini?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-800 text-white border-slate-600 hover:bg-slate-700 hover:text-white">
                    Batal
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={endGame} className="bg-red-600 hover:bg-red-700 text-white border-none">
                    Ya, Akhiri
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {showTimeWarning && (
          <div className="mb-4 sm:mb-6 bg-red-500/20 border-2 border-red-500/50 rounded-lg p-3 sm:p-4 animate-pulse">
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              <span className="text-red-400 font-bold text-sm sm:text-base lg:text-lg">
                {timerState.remainingTime <= 0 ? t('monitor.timeUp') : t('monitor.timeAlmostUp')}
              </span>
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            </div>
            <p className="text-red-300 text-center text-xs sm:text-sm mt-1">
              {timerState.remainingTime <= 0
                ? t('monitor.gameWillEnd')
                : t('monitor.gameWillEndWhenTimeUp')
              }
            </p>
          </div>
        )}

        <div className="space-y-6 sm:space-y-8 mb-6 sm:mb-8">
          <div className="bg-linear-to-br from-blue-500/20 to-purple-500/20 border-2 sm:border-4 border-white/30 rounded-lg p-4 sm:p-6 pixel-lobby-card">
            {players.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-400 rounded border-2 sm:border-4 border-white mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-white">{t('monitor.noPlayers')}</p>
              </div>
            ) : (
              <>
                {/* 🚀 OPTIMIZED: Scrollable container for large player lists */}
                <div
                  className={`${players.length > 20 ? 'max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent pr-2' : ''}`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {sortedPlayers.map((player, index) => {
                      const rank = index + 1
                      const quizScore = player.quizScore || 0
                      const totalScore = quizScore
                      const questionsAnswered = player.questionsAnswered || 0
                      const quizProgress = Math.min((questionsAnswered / quizSettings.questionCount) * 100, 100)
                      const rankingChange = rankingChanges[player.id]

                      return (
                        <div key={player.id} className="relative bg-linear-to-br from-white/10 to-white/5 border-2 border-white/20 rounded-lg p-3 sm:p-4 pixel-player-card hover:bg-white/15 transition-all duration-300">
                          {/* Grid layout: rank | avatar | name | points */}
                          <div className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-2 mb-2 sm:mb-3">
                            {/* Rank + trend icon */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <div
                                className={`text-sm sm:text-base font-bold ${rank === 1 ? "text-yellow-500" : rank === 2 ? "text-gray-400" : rank === 3 ? "text-amber-600" : "text-blue-400"}`}
                              >
                                #{rank}
                              </div>
                              {rankingChange === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
                              {rankingChange === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
                            </div>
                            {/* Avatar */}
                            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center overflow-hidden flex-shrink-0">
                              <RobustGoogleAvatar
                                avatarUrl={player.avatar}
                                alt={`${player.nickname} avatar`}
                                className="w-full h-full"
                                width={40}
                                height={40}
                              />
                            </div>
                            {/* Name - truncated to prevent overlap */}
                            <div className="min-w-0 overflow-hidden">
                              <h3 className="font-bold text-sm sm:text-base text-white truncate" title={player.nickname}>
                                {player.nickname}
                              </h3>
                            </div>
                            {/* Points card - fixed width */}
                            <div className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-lg px-2 py-1 flex-shrink-0 min-w-[50px]">
                              <div className="text-center">
                                <span className="text-yellow-400 font-bold text-xs sm:text-sm block leading-tight">{totalScore}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 sm:space-y-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-slate-300">QUIZ PROGRESS</span>
                                <span className={`text-xs sm:text-sm font-bold ${questionsAnswered >= quizSettings.questionCount
                                  ? 'text-green-300'
                                  : questionsAnswered > 0
                                    ? 'text-blue-300'
                                    : 'text-gray-400'
                                  }`}>
                                  {questionsAnswered}/{quizSettings.questionCount}
                                </span>
                              </div>
                              <div className="w-full bg-black/30 border-2 border-white/30 rounded-lg h-3 sm:h-4 relative overflow-hidden">
                                <div
                                  className={`h-full rounded-lg transition-all duration-500 ${questionsAnswered >= quizSettings.questionCount
                                    ? 'bg-linear-to-r from-green-400 to-emerald-400'
                                    : questionsAnswered > 0
                                      ? 'bg-linear-to-r from-blue-400 to-purple-400'
                                      : 'bg-linear-to-r from-gray-400 to-gray-500'
                                    }`}
                                  style={{ width: `${Math.max(quizProgress, 2)}%` }}
                                />
                                {questionsAnswered > 0 && questionsAnswered < quizSettings.questionCount && (
                                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                                )}
                                {questionsAnswered >= quizSettings.questionCount && (
                                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-green-300/30 to-transparent animate-ping"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
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

export default function MonitorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="absolute inset-0 opacity-20">
          <div className="pixel-grid"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="bg-linear-to-br from-blue-500/20 to-purple-500/20 border-2 sm:border-4 border-white/30 rounded-lg p-6 sm:p-8 text-center">
            <div className="text-white text-sm sm:text-base">LOADING...</div>
          </div>
        </div>
      </div>
    }>
      <MonitorPageContent />
    </Suspense>
  )
}
