"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, Trophy, Clock, Target, TrendingUp, TrendingDown, Play } from "lucide-react"
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
  const [previousRankings, setPreviousRankings] = useState<{ [key: string]: number }>({})
  const [rankingChanges, setRankingChanges] = useState<{ [key: string]: "up" | "down" | null }>({})
  const [forceRefresh, setForceRefresh] = useState(0)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const [timeUpHandled, setTimeUpHandled] = useState(false)
  const { room, loading } = useRoom(roomCode || "")
  
  useEffect(() => {
    if (room) {
      console.log("[Monitor] 🔄 Room data updated, triggering re-render:", {
        playersCount: room.players.length,
        timestamp: new Date().toISOString()
      })
    }
  }, [room])

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
      
      if (typeof window !== 'undefined') {
        const broadcastChannel = new BroadcastChannel(`game-end-${roomCode}`)
        broadcastChannel.postMessage({ 
          type: 'game-ended', 
          roomCode: roomCode,
          timestamp: Date.now()
        })
        broadcastChannel.close()
        console.log("[Monitor] Broadcasted game end event to players")
      }
      
      window.location.href = `/host/leaderboad`
    } catch (error) {
      console.error("[Monitor] Error ending game due to timer expiration:", error)
      window.location.href = `/host/leaderboad`
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
          const { roomCode: storedRoomCode } = JSON.parse(hostData)
          setRoomCode(storedRoomCode)
        } else {
          router.push("/select-quiz")
        }
      }
      
      loadHostData()
    }
  }, [params, router])

  useEffect(() => {
    if (roomCode) {
      const broadcastChannel = new BroadcastChannel(`progress-update-${roomCode}`)
      
      broadcastChannel.onmessage = (event) => {
        if (event.data.type === 'progress-update') {
          console.log("[Monitor] 📡 Received progress broadcast:", event.data)
          roomManager.getRoom(roomCode).then((updatedRoom) => {
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
  }, [roomCode])

  useEffect(() => {
    if (roomCode && room) {
      const fallbackPolling = setInterval(async () => {
        try {
          const latestRoom = await roomManager.getRoom(roomCode)
          if (latestRoom) {
            const currentPlayerIds = room.players.map(p => p.id).sort().join(',')
            const latestPlayerIds = latestRoom.players.map(p => p.id).sort().join(',')
            
            const scoresChanged = room.players.some(player => {
              const latestPlayer = latestRoom.players.find(p => p.id === player.id)
              if (!latestPlayer) return false
              return (
                (player.quizScore || 0) !== (latestPlayer.quizScore || 0) ||
                (player.memoryScore || 0) !== (latestPlayer.memoryScore || 0) ||
                (player.questionsAnswered || 0) !== (latestPlayer.questionsAnswered || 0)
              )
            })
            
            if (scoresChanged || currentPlayerIds !== latestPlayerIds) {
              console.log("[Monitor] 🔄 Fallback polling detected changes, forcing refresh")
              setForceRefresh(prev => prev + 1)
            }
          }
        } catch (error) {
          console.error("[Monitor] Error in fallback polling:", error)
        }
      }, 2000)
      
      return () => clearInterval(fallbackPolling)
    }
  }, [roomCode, room])

  useEffect(() => {
    if (room) {
      const players = room.players.filter((p) => !p.isHost)
      const sortedPlayers = [...players].sort((a, b) => {
        const aTotal = (a.quizScore || 0) + (a.memoryScore || 0)
        const bTotal = (b.quizScore || 0) + (b.memoryScore || 0)
        return bTotal - aTotal
      })

      const newRankings: { [key: string]: number } = {}
      const changes: { [key: string]: "up" | "down" | null } = {}

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

      setPreviousRankings(newRankings)
      setRankingChanges(changes)

      setTimeout(() => {
        setRankingChanges({})
      }, 3000)
    }
  }, [room, previousRankings])

  useEffect(() => {
    if (room && room.players.length > 0) {
      const nonHostPlayers = room.players.filter(p => !p.isHost)
      const totalQuestions = room.settings.questionCount || 10
      
      const allPlayersCompleted = nonHostPlayers.every(player => 
        (player.questionsAnswered || 0) >= totalQuestions
      )
      
      if (allPlayersCompleted && nonHostPlayers.length > 0) {
        console.log("[Monitor] All players completed quiz, ending game automatically...")
        
        roomManager.updateGameStatus(roomCode!, "finished").then(() => {
          if (typeof window !== 'undefined') {
            const broadcastChannel = new BroadcastChannel(`game-end-${roomCode}`)
            broadcastChannel.postMessage({ 
              type: 'game-ended', 
              roomCode: roomCode,
              timestamp: Date.now()
            })
            broadcastChannel.close()
            console.log("[Monitor] Broadcasted game end event to players")
          }
          
          window.location.href = `/host/leaderboad`
        }).catch((error) => {
          console.error("[Monitor] Error ending game automatically:", error)
          window.location.href = `/host/leaderboad`
        })
      }
    }
  }, [room, roomCode])

  const endGame = async () => {
    console.log("End Game clicked, roomCode:", roomCode)
    if (roomCode) {
      try {
        const success = await roomManager.updateGameStatus(roomCode, "finished")
        console.log("Game status updated:", success)
        
        if (success) {
          console.log("Game ended successfully, broadcasting to players...")
          
          if (typeof window !== 'undefined') {
            const broadcastChannel = new BroadcastChannel(`game-end-${roomCode}`)
            broadcastChannel.postMessage({ 
              type: 'game-ended', 
              roomCode: roomCode,
              timestamp: Date.now()
            })
            broadcastChannel.close()
            console.log("[Monitor] Broadcasted game end event to players")
          }
          
          console.log("Redirecting to leaderboard...")
          try {
            router.push(`/host/leaderboad`)
            setTimeout(() => {
              if (window.location.pathname !== `/host/leaderboad`) {
                console.log("Router push failed, using window.location fallback")
                window.location.href = `/host/leaderboad`
              }
            }, 1000)
          } catch (routerError) {
            console.error("Router push failed:", routerError)
            window.location.href = `/host/leaderboad`
          }
        } else {
          console.error("Failed to update game status, using fallback redirect")
          window.location.href = `/host/leaderboad`
        }
      } catch (error) {
        console.error("Error ending game:", error)
        window.location.href = `/host/leaderboad`
      }
    } else {
      console.error("No roomCode found")
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <img 
                    src="/images/memoryquiz.png" 
                    alt="MEMORY QUIZ" 
                    className="h-12 w-auto sm:h-16 md:h-20 object-contain"
                    draggable={false}
                  />
                  <img 
                    src="/images/gameforsmartlogo.png" 
                    alt="GameForSmart Logo" 
                    className="h-12 w-auto sm:h-16 md:h-20 object-contain"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
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
              onMouseDown={(e) => {
                console.log("Button clicked, calling endGame...")
              }}
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
                const memoryScore = player.memoryScore || 0
                const totalScore = quizScore + memoryScore
                const questionsAnswered = player.questionsAnswered || 0
                const quizProgress = Math.min((questionsAnswered / quizSettings.questionCount) * 100, 100)
                const rankingChange = rankingChanges[player.id]

                console.log(`[Monitor] 📊 Player ${player.username} DETAILED:`, {
                  questionsAnswered,
                  questionCount: quizSettings.questionCount,
                  progress: quizProgress,
                  quizScore,
                  memoryScore,
                  totalScore,
                  forceRefresh,
                  timestamp: new Date().toISOString(),
                  progressStatus: questionsAnswered >= quizSettings.questionCount ? 'COMPLETED' : 'IN_PROGRESS'
                })

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
                            alt={`${player.username} avatar`}
                            className="w-full h-full"
                            width={48}
                            height={48}
                          />
                        </div>
                        <div>
                          {(() => {
                            const { firstWord, secondWord } = splitPlayerName(player.username)
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
                          <div className="flex items-center gap-1 sm:gap-2">
                          </div>
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


