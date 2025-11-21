"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Users, Trophy, Clock, Target, TrendingUp, TrendingDown } from "lucide-react"
import { useRoom } from "@/hooks/use-room"
import { roomManager } from "@/lib/room-manager"
import { getTimerDisplayText } from "@/lib/timer-utils"
import { useSynchronizedTimer } from "@/hooks/use-synchronized-timer"
import { sessionManager } from "@/lib/supabase-session-manager"
import { RobustGoogleAvatar } from "@/components/robust-google-avatar"
import { useTranslation } from "react-i18next"

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
  const AGGRESSIVE_POLLING_INTERVAL = 500

  // Debug log
  useEffect(() => {
    if (room) {
      console.log("[Monitor] Room data updated:", {
        playersCount: room.players.length,
        status: room.status,
        timestamp: new Date().toISOString(),
        isHost,
        isHostDetected,
        redirecting
      })

      // 🚀 CRITICAL: Immediate redirect check when room status changes to finished
      // Check with isHost conditions first
      if (room.status === "finished" && isHost && isHostDetected && !redirecting && roomCode) {
        console.log("[Monitor] 🚨 IMMEDIATE REDIRECT: Room status changed to finished in debug log!")
        setRedirecting(true)
        // Use setTimeout to ensure state is set before redirect
        setTimeout(() => {
          const redirectUrl = `/host/leaderboad?roomCode=${roomCode}`
          console.log("[Monitor] Immediate redirect to:", redirectUrl)
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
        console.log("[Monitor] 🚨 FALLBACK REDIRECT: Room status finished, redirecting without host check!")
        setRedirecting(true)
        setTimeout(() => {
          const redirectUrl = `/host/leaderboad?roomCode=${roomCode}`
          console.log("[Monitor] Fallback redirect to:", redirectUrl)
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
  
  const handleTimeUp = async () => {
    if (timeUpHandled) return
    setTimeUpHandled(true)
    
    console.log("[Monitor] Timer expired! Ending game automatically...")
    
    try {
      await roomManager.updateGameStatus(roomCode!, "finished")
      
      let broadcastChannel: BroadcastChannel | null = null
      try {
        if (typeof window !== 'undefined') {
          broadcastChannel = new BroadcastChannel(`game-end-${roomCode}`)
          broadcastChannel.postMessage({ 
            type: 'game-ended', 
            roomCode: roomCode,
            timestamp: Date.now()
          })
          console.log("[Monitor] Broadcasted game end event to players")
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
  }
  
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

  // 🚀 Broadcast listener
  useEffect(() => {
    if (roomCode) {
      const broadcastChannel = new BroadcastChannel(`progress-update-${roomCode}`)
      let lastUpdateTime = 0
      
      broadcastChannel.onmessage = (event) => {
        if (event.data.type === 'progress-update') {
          const now = Date.now()
          if (now - lastUpdateTime < 1000) return
          lastUpdateTime = now
          
          console.log("[Monitor] Received progress broadcast:", event.data)
          
          if (redirecting) {
            console.log("[Monitor] Skipping refresh - already redirecting")
            return
          }
          
          roomManager.getRoom(roomCode).then((updatedRoom) => {
            if (updatedRoom?.status === 'finished') {
              console.log("[Monitor] Game already finished, skipping refresh")
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

  // 🚀 Aggressive polling
  useEffect(() => {
    if (roomCode && room && !redirecting) {
      const aggressivePolling = setInterval(async () => {
        if (redirecting) {
          console.log("[Monitor] Skipping poll - redirecting")
          return
        }
        
        try {
          const latestRoom = await roomManager.getRoom(roomCode)
          
          if (latestRoom?.status === 'finished') {
            console.log("[Monitor] Game finished, stopping poll")
            clearInterval(aggressivePolling)
            return
          }
          
          const hasChanges = JSON.stringify(latestRoom?.players) !== JSON.stringify(room?.players)
          
          if (hasChanges && latestRoom) {
            setForceRefresh(prev => prev + 1)
          }
        } catch (error) {
          console.error("[Monitor] Error in aggressive polling:", error)
        }
      }, AGGRESSIVE_POLLING_INTERVAL)
      
      return () => clearInterval(aggressivePolling)
    }
  }, [roomCode, room, redirecting])

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
    console.log("[Monitor] Status check:", {
      hasRoom: !!room,
      isHost,
      isHostDetected,
      roomStatus: room?.status,
      redirecting,
      roomCode
    })

    if (room && isHost && isHostDetected && room.status === "finished" && !redirecting) {
      console.log("[Monitor] 🎯 Game status is finished, redirecting host to leaderboard...")
      setRedirecting(true)
      
      // Redirect host ke leaderboard dengan multiple fallback - IMMEDIATE
      const redirectToLeaderboard = () => {
        console.log("[Monitor] 🚀 Executing redirect to leaderboard...", { roomCode })
        try {
          const url = `/host/leaderboad?roomCode=${roomCode}`
          console.log("[Monitor] Redirecting to:", url)
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
      console.log("[Monitor] ⚠️ Game is finished but conditions not met:", {
        isHost,
        isHostDetected,
        redirecting
      })
    }
  }, [room?.status, isHost, isHostDetected, redirecting, roomCode, router])

  // 🚀 CRITICAL: Aggressive polling untuk memastikan redirect ketika game finished
  useEffect(() => {
    if (roomCode && isHost && isHostDetected && !redirecting) {
      console.log("[Monitor] Starting status polling for room:", roomCode)
      const statusPolling = setInterval(async () => {
        try {
          const currentRoom = await roomManager.getRoom(roomCode)
          console.log("[Monitor] Polling check - Room status:", currentRoom?.status)
          if (currentRoom && currentRoom.status === "finished") {
            console.log("[Monitor] 🎯 Game finished detected via polling - redirecting immediately...")
            clearInterval(statusPolling)
            setRedirecting(true)
            
            // Redirect immediately with multiple attempts
            const redirectUrl = `/host/leaderboad?roomCode=${roomCode}`
            console.log("[Monitor] Polling redirect to:", redirectUrl)
            
            // Force redirect with multiple methods
            setTimeout(() => {
              try {
                window.location.href = redirectUrl
              } catch (error) {
                console.error("[Monitor] Polling redirect error, trying replace...", error)
                try {
                  window.location.replace(redirectUrl)
                } catch (error2) {
                  console.error("[Monitor] Polling replace error, trying router...", error2)
                  router.push(redirectUrl)
                }
              }
            }, 100)
          }
        } catch (error) {
          console.error("[Monitor] Error in status polling:", error)
        }
      }, 1000) // Check every 1 second

      return () => {
        console.log("[Monitor] Stopping status polling")
        clearInterval(statusPolling)
      }
    }
  }, [roomCode, isHost, isHostDetected, redirecting, router])

  // 🚀 CRITICAL: Auto-end game ketika ada player yang selesai - force semua player selesai
  useEffect(() => {
    if (room && isHost && isHostDetected && !redirecting && !lastVerifiedCompletion) {
      const nonHostPlayers = room.players.filter(p => !p.isHost)
      const totalQuestions = room.settings.questionCount || 10

      console.log("[Monitor] Auto-end check:", {
        totalPlayers: nonHostPlayers.length,
        players: nonHostPlayers.map(p => ({
          nickname: p.nickname,
          answered: p.questionsAnswered || 0,
          total: totalQuestions
        }))
      })

      // Cek apakah ada player yang sudah selesai (bukan semua player)
      const hasPlayerCompleted = nonHostPlayers.some(player => {
        const answered = player.questionsAnswered || 0
        return answered >= totalQuestions
      })

      if (hasPlayerCompleted && nonHostPlayers.length > 0) {
        console.log("[Monitor] 🎯 Player completed detected! Force finishing all players...")

        // 🚀 IMPROVED: Multiple verification attempts with increasing delays
        const verifyAndForceFinish = async (attempt = 1, maxAttempts = 3) => {
          try {
            console.log(`[Monitor] Force finish attempt ${attempt}/${maxAttempts}`)

            // Wait longer between attempts for database sync
            const delay = attempt === 1 ? 1000 : attempt === 2 ? 2000 : 3000
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

            console.log(`[Monitor] Force finishing ${playersToForceFinish.length} players...`)

            // Update semua player yang belum selesai
            const forceFinishPromises = playersToForceFinish.map(async (player) => {
              const currentScore = player.quizScore || 0
              console.log(`[Monitor] Force finishing player ${player.nickname} (${player.id})`)
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

            // Verifikasi lagi setelah force finish
            await new Promise(resolve => setTimeout(resolve, 1000))
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
              console.log(`[Monitor] Verification attempt ${attempt} failed: not all completed after force finish`)
              if (attempt < maxAttempts) {
                return verifyAndForceFinish(attempt + 1, maxAttempts)
              }
              console.log("[Monitor] All verification attempts failed, resetting...")
              setRedirecting(false)
              setLastVerifiedCompletion(false)
              return
            }

            console.log(`[Monitor] ✅ All players force finished! Verification attempt ${attempt} passed!`)
            setLastVerifiedCompletion(true)
            setRedirecting(true)

            // Update game status ke finished
            await roomManager.updateGameStatus(roomCode!, "finished")
            console.log("[Monitor] ✅ Game status updated to 'finished'")

            // Broadcast game end untuk memberitahu semua player
            const broadcastChannel = new BroadcastChannel(`game-end-${roomCode}`)
            broadcastChannel.postMessage({
              type: 'game-ended',
              roomCode: roomCode,
              timestamp: Date.now()
            })
            broadcastChannel.close()

            console.log("[Monitor] 📡 Broadcasted game end event to all players")

            // Redirect host ke leaderboard IMMEDIATELY - tidak perlu tunggu
            console.log("[Monitor] 🚀 Redirecting host to leaderboard IMMEDIATELY...")
            
            // Use setTimeout with 0 delay to ensure redirect happens after state updates
            setTimeout(() => {
              try {
                console.log("[Monitor] Attempting redirect via window.location.href...")
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
            console.log("[Monitor] All attempts failed, forcing redirect to leaderboard...")
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

  // 🚀 Force refresh
  useEffect(() => {
    if (room && isHost && !redirecting) {
      const forceRefreshInterval = setInterval(() => {
        if (redirecting) return
        setForceRefresh(prev => prev + 1)
      }, 2000)
      
      return () => clearInterval(forceRefreshInterval)
    }
  }, [room, isHost, redirecting])

  // 🚀 Monitoring
  useEffect(() => {
    if (room && isHost && !redirecting) {
      const checkCompletion = setInterval(() => {
        const nonHostPlayers = room.players.filter(p => !p.isHost)
        const totalQuestions = room.settings.questionCount || 10
        const completedCount = nonHostPlayers.filter(p => (p.questionsAnswered || 0) >= totalQuestions).length
        
        console.log("[Monitor] Monitoring status:", {
          total: nonHostPlayers.length,
          completed: completedCount,
          redirecting: redirecting,
          lastVerified: lastVerifiedCompletion,
          roomStatus: room.status
        })

        // 🚀 CRITICAL: Force redirect if status is finished (backup check)
        if (room.status === "finished" && !redirecting && roomCode) {
          console.log("[Monitor] 🚨 FORCE REDIRECT: Room status is finished in monitoring check!")
          setRedirecting(true)
          setTimeout(() => {
            try {
              window.location.href = `/host/leaderboad?roomCode=${roomCode}`
            } catch (error) {
              window.location.replace(`/host/leaderboad?roomCode=${roomCode}`)
            }
          }, 100)
        }
      }, 3000)
      
      return () => clearInterval(checkCompletion)
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
    const aTotal = (a.quizScore || 0) + (a.memoryScore || 0)
    const bTotal = (b.quizScore || 0) + (b.memoryScore || 0)
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
                    src="/images/memoryquiz.webp" 
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
            <button 
              onClick={endGame} 
              className="relative pixel-button-container w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-cyan-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
              <button className="relative bg-linear-to-br from-blue-500 to-cyan-500 border-2 sm:border-4 border-black rounded-lg shadow-2xl font-bold text-white text-sm sm:text-base lg:text-lg pixel-button-host transform hover:scale-105 transition-all duration-300 px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto min-h-[44px]">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-black rounded border-2 border-white flex items-center justify-center">
                    <span className="text-white font-bold text-xs sm:text-sm">✕</span>
                  </div>
                  <span className="text-sm sm:text-base lg:text-lg font-bold">{t('monitor.endGame')}</span>
                </div>
              </button>
            </button>
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
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <div
                            className={`text-sm sm:text-base lg:text-lg font-bold ${rank === 1 ? "text-yellow-500" : rank === 2 ? "text-gray-400" : rank === 3 ? "text-amber-600" : "text-blue-400"}`}
                          >
                            #{rank}
                          </div>
                          {rankingChange === "up" && <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />}
                          {rankingChange === "down" && <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />}
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex items-center justify-center overflow-hidden">
                          <RobustGoogleAvatar
                            avatarUrl={player.avatar}
                            alt={`${player.nickname} avatar`}
                            className="w-full h-full"
                            width={48}
                            height={48}
                          />
                        </div>
                        <div>
                          {(() => {
                            const { firstWord, secondWord } = splitPlayerName(player.nickname)
                            return (
                              <div className="text-center">
                                <h3 className="font-bold text-sm sm:text-base lg:text-lg text-white leading-tight">
                                  {firstWord}
                                </h3>
                                {secondWord && (
                                  <h3 className="font-bold text-sm sm:text-base lg:text-lg text-white leading-tight">
                                    {secondWord}
                                  </h3>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-lg px-2 sm:px-3 py-1">
                          <span className="text-yellow-400 font-bold text-xs sm:text-sm">{totalScore} {t('monitor.points')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-300">QUIZ PROGRESS</span>
                          <span className={`text-xs sm:text-sm font-bold ${
                            questionsAnswered >= quizSettings.questionCount 
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
                            className={`h-full rounded-lg transition-all duration-500 ${
                              questionsAnswered >= quizSettings.questionCount
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
