"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
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

function MonitorPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [previousRankings, setPreviousRankings] = useState<{ [key: string]: number }>({})
  const [rankingChanges, setRankingChanges] = useState<{ [key: string]: "up" | "down" | null }>({})
  const [forceRefresh, setForceRefresh] = useState(0)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const [timeUpHandled, setTimeUpHandled] = useState(false)
  const { room, loading } = useRoom(roomCode || "")

  // Get quiz settings from room data
  const quizSettings = room ? {
    timeLimit: room.settings.totalTimeLimit,
    questionCount: room.settings.questionCount,
  } : {
    timeLimit: 30,
    questionCount: 10,
  }
  
  // Handle timer expiration for host
  const handleTimeUp = async () => {
    if (timeUpHandled) return // Prevent multiple calls
    setTimeUpHandled(true)
    
    console.log("[Monitor] Timer expired! Ending game automatically...")
    
    try {
      // End the game automatically
      await roomManager.updateGameStatus(roomCode!, "finished")
      
      // Broadcast game end event to all players
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
      
      // Redirect host to leaderboard
      window.location.href = `/leaderboard?roomCode=${roomCode}`
    } catch (error) {
      console.error("[Monitor] Error ending game due to timer expiration:", error)
      // Fallback redirect
      window.location.href = `/leaderboard?roomCode=${roomCode}`
    }
  }
  
  const timerState = useSynchronizedTimer(room, quizSettings.timeLimit, handleTimeUp)
  
  // Show warning when time is running low
  useEffect(() => {
    if (timerState.remainingTime <= 60 && timerState.remainingTime > 0) { // Show warning in last minute
      setShowTimeWarning(true)
    } else {
      setShowTimeWarning(false)
    }
  }, [timerState.remainingTime])
  
  // Show time up notification
  useEffect(() => {
    if (timerState.remainingTime <= 0 && !timeUpHandled) {
      setShowTimeWarning(true)
    }
  }, [timerState.remainingTime, timeUpHandled])

  useEffect(() => {
    const roomCodeParam = searchParams.get("roomCode")
    if (roomCodeParam) {
      setRoomCode(roomCodeParam)
    } else {
      // Try to get from session manager first
      const loadHostData = async () => {
        try {
          const sessionId = sessionManager.getSessionIdFromStorage()
          if (sessionId) {
            const sessionData = await sessionManager.getSessionData(sessionId)
            if (sessionData && sessionData.user_type === 'host' && sessionData.room_code) {
              setRoomCode(sessionData.room_code)
              return
            }
          }
        } catch (error) {
          console.error("Error getting host session:", error)
        }
        
        // Fallback to localStorage
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
  }, [searchParams, router])

  // Timer is now handled by useSynchronizedTimer hook

  // ENHANCED PROGRESS BAR MONITORING
  useEffect(() => {
    if (room && room.players.length > 0) {
      // Enhanced refresh for progress bar reliability - every 500ms for better sync
      const refreshInterval = setInterval(() => {
        setForceRefresh(prev => prev + 1)
        console.log("[Monitor] 🔄 Force refresh triggered for progress bar reliability")
      }, 500)
      
      return () => clearInterval(refreshInterval)
    }
  }, [room])

  // REAL-TIME PROGRESS BROADCAST LISTENER untuk sinkronisasi instant
  useEffect(() => {
    if (roomCode) {
      const broadcastChannel = new BroadcastChannel(`progress-update-${roomCode}`)
      
      broadcastChannel.onmessage = (event) => {
        if (event.data.type === 'progress-update') {
          console.log("[Monitor] 📡 Received progress broadcast:", event.data)
          // Force immediate refresh when receiving progress update
          setForceRefresh(prev => prev + 1)
        }
      }

      return () => {
        broadcastChannel.close()
      }
    }
  }, [roomCode])

  // PROGRESS BAR VALIDATION - Check for inconsistencies
  useEffect(() => {
    if (room && room.players.length > 0) {
      const validationInterval = setInterval(() => {
        room.players.forEach(player => {
          if (!player.isHost) {
            const questionsAnswered = player.questionsAnswered || 0
            const quizScore = player.quizScore || 0
            const maxQuestions = quizSettings.questionCount
            
            // Log potential inconsistencies
            if (questionsAnswered > maxQuestions) {
              console.warn(`[Monitor] ⚠️ Player ${player.username} has answered more questions than available:`, {
                questionsAnswered,
                maxQuestions,
                playerId: player.id
              })
            }
            
            if (quizScore > questionsAnswered) {
              console.warn(`[Monitor] ⚠️ Player ${player.username} has higher score than questions answered:`, {
                quizScore,
                questionsAnswered,
                playerId: player.id
              })
            }
            
            // Log progress for debugging
            console.log(`[Monitor] 📊 Player ${player.username} progress:`, {
              questionsAnswered,
              quizScore,
              progress: Math.min((questionsAnswered / maxQuestions) * 100, 100).toFixed(1) + '%',
              playerId: player.id,
              timestamp: new Date().toISOString()
            })
          }
        })
      }, 2000) // Check every 2 seconds for better sync
      
      return () => clearInterval(validationInterval)
    }
  }, [room, quizSettings.questionCount])

  // Monitor ranking calculation effect
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

      // Clear ranking change indicators after 3 seconds
      setTimeout(() => {
        setRankingChanges({})
      }, 3000)
    }
  }, [room, previousRankings])

  // Check if all players have completed the quiz and auto-redirect
  useEffect(() => {
    if (room && room.players.length > 0) {
      const nonHostPlayers = room.players.filter(p => !p.isHost)
      const totalQuestions = room.settings.questionCount || 10
      
      // Check if all players have completed all questions
      const allPlayersCompleted = nonHostPlayers.every(player => 
        (player.questionsAnswered || 0) >= totalQuestions
      )
      
      if (allPlayersCompleted && nonHostPlayers.length > 0) {
        console.log("[Monitor] All players completed quiz, ending game automatically...")
        
        // End the game automatically
        roomManager.updateGameStatus(roomCode!, "finished").then(() => {
          // Broadcast game end event to all players
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
          
          // Redirect to leaderboard
          window.location.href = `/leaderboard?roomCode=${roomCode}`
        }).catch((error) => {
          console.error("[Monitor] Error ending game automatically:", error)
          // Fallback redirect
          window.location.href = `/leaderboard?roomCode=${roomCode}`
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
          
          // Broadcast game end event to all players immediately
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
          // Try router.push first, then fallback to window.location
          try {
            router.push(`/leaderboard?roomCode=${roomCode}`)
            // Add a timeout fallback
            setTimeout(() => {
              if (window.location.pathname !== `/leaderboard`) {
                console.log("Router push failed, using window.location fallback")
                window.location.href = `/leaderboard?roomCode=${roomCode}`
              }
            }, 1000)
          } catch (routerError) {
            console.error("Router push failed:", routerError)
            window.location.href = `/leaderboard?roomCode=${roomCode}`
          }
        } else {
          console.error("Failed to update game status, using fallback redirect")
          window.location.href = `/leaderboard?roomCode=${roomCode}`
        }
      } catch (error) {
        console.error("Error ending game:", error)
        // Fallback redirect
        window.location.href = `/leaderboard?roomCode=${roomCode}`
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
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 sm:border-4 border-white/30 rounded-lg p-6 sm:p-8 text-center pixel-lobby-card">
            <div className="text-white text-sm sm:text-base">LOADING HOST MONITOR...</div>
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
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 sm:border-4 border-white/30 rounded-lg p-6 sm:p-8 text-center pixel-lobby-card">
            <div className="text-white text-sm sm:text-base">LOADING ROOM...</div>
            <div className="text-blue-200 text-xs sm:text-sm mt-2">Please wait while we connect to the game</div>
          </div>
        </div>
      </div>
    )
  }

  // Function to truncate player names responsively
  const truncatePlayerName = (name: string) => {
    // More aggressive truncation for mobile
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      if (name.length <= 6) {
        return name
      }
      return name.substring(0, 6) + "..."
    }
    // Standard truncation for larger screens
    if (name.length <= 8) {
      return name
    }
    return name.substring(0, 8) + "..."
  }

  const players = room.players.filter((p) => !p.isHost)
  const sortedPlayers = [...players].sort((a, b) => {
    const aTotal = (a.quizScore || 0) + (a.memoryScore || 0)
    const bTotal = (b.quizScore || 0) + (b.memoryScore || 0)
    return bTotal - aTotal
  })

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
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Pixel Elements */}
        <PixelBackgroundElements />
        {/* Floating Brain Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 opacity-20 animate-float">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-400 blur-xl"></div>
        </div>
        <div className="absolute top-40 right-20 w-24 h-24 opacity-30 animate-float-delayed">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 blur-lg"></div>
        </div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 opacity-25 animate-float-slow">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400 blur-2xl"></div>
        </div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 opacity-35 animate-float-delayed-slow">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-green-400 to-cyan-400 blur-xl"></div>
        </div>

        {/* Neural Network Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1000 1000">
          <defs>
            <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <g className="animate-pulse">
            <line x1="100" y1="200" x2="300" y2="150" stroke="url(#neuralGradient)" strokeWidth="2" />
            <line x1="300" y1="150" x2="500" y2="300" stroke="url(#neuralGradient)" strokeWidth="2" />
            <line x1="500" y1="300" x2="700" y2="250" stroke="url(#neuralGradient)" strokeWidth="2" />
            <line x1="200" y1="400" x2="400" y2="350" stroke="url(#neuralGradient)" strokeWidth="2" />
            <line x1="400" y1="350" x2="600" y2="500" stroke="url(#neuralGradient)" strokeWidth="2" />
            <line x1="600" y1="500" x2="800" y2="450" stroke="url(#neuralGradient)" strokeWidth="2" />
            <circle cx="100" cy="200" r="4" fill="#3b82f6" className="animate-ping" />
            <circle cx="300" cy="150" r="4" fill="#8b5cf6" className="animate-ping" style={{ animationDelay: '0.5s' }} />
            <circle cx="500" cy="300" r="4" fill="#06b6d4" className="animate-ping" style={{ animationDelay: '1s' }} />
            <circle cx="700" cy="250" r="4" fill="#3b82f6" className="animate-ping" style={{ animationDelay: '1.5s' }} />
            <circle cx="200" cy="400" r="4" fill="#8b5cf6" className="animate-ping" style={{ animationDelay: '2s' }} />
            <circle cx="400" cy="350" r="4" fill="#06b6d4" className="animate-ping" style={{ animationDelay: '2.5s' }} />
            <circle cx="600" cy="500" r="4" fill="#3b82f6" className="animate-ping" style={{ animationDelay: '3s' }} />
            <circle cx="800" cy="450" r="4" fill="#8b5cf6" className="animate-ping" style={{ animationDelay: '3.5s' }} />
          </g>
        </svg>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-4 sm:py-8">
        {/* Monitor Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg border-2 sm:border-4 border-white shadow-2xl flex items-center justify-center pixel-brain">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  {/* Enhanced MEMORY QUIZ Title */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 border-2 border-white rounded-lg px-4 sm:px-6 py-2 sm:py-3 shadow-2xl transform hover:scale-105 transition-all duration-300">
                    <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-wider uppercase drop-shadow-lg">
                      MEMORY QUIZ
                    </h1>
                  </div>
                  {/* GameForSmart Logo */}
                  <img 
                    src="/images/gameforsmartlogo.png" 
                    alt="GameForSmart Logo" 
                    className="h-12 w-auto sm:h-16 md:h-20 object-contain"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="bg-blue-500/20 border-2 border-blue-500/50 rounded-lg px-2 sm:px-4 py-1 sm:py-2">
                      <span className="text-blue-400 font-bold text-xs sm:text-sm">{players.length} PLAYERS</span>
                    </div>
                    <div className={`${showTimeWarning ? 'bg-red-500/20 border-red-500/50 animate-pulse' : 'bg-green-500/20 border-green-500/50'} border-2 rounded-lg px-2 sm:px-4 py-1 sm:py-2 flex items-center gap-2`}>
                      <Clock className={`w-3 h-3 sm:w-4 sm:h-4 ${showTimeWarning ? 'text-red-400' : 'text-green-400'}`} />
                      <span className={`font-bold text-xs sm:text-sm ${showTimeWarning ? 'text-red-400' : 'text-green-400'}`}>
                        {getTimerDisplayText(timerState)}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-blue-200">Room: {roomCode}</p>
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
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
              <button className="relative bg-gradient-to-br from-blue-500 to-cyan-500 border-2 sm:border-4 border-black rounded-lg shadow-2xl font-bold text-white text-sm sm:text-base lg:text-lg pixel-button-host transform hover:scale-105 transition-all duration-300 px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto min-h-[44px]">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-black rounded border-2 border-white flex items-center justify-center">
                    <span className="text-white font-bold text-xs sm:text-sm">✕</span>
                  </div>
                  <span className="text-sm sm:text-base lg:text-lg font-bold">END GAME</span>
                </div>
              </button>
            </button>
          </div>
        </div>

        {/* Time Warning */}
        {showTimeWarning && (
          <div className="mb-4 sm:mb-6 bg-red-500/20 border-2 border-red-500/50 rounded-lg p-3 sm:p-4 animate-pulse">
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              <span className="text-red-400 font-bold text-sm sm:text-base lg:text-lg">
                {timerState.remainingTime <= 0 ? "WAKTU HABIS!" : "WAKTU HAMPIR HABIS!"}
              </span>
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            </div>
            <p className="text-red-300 text-center text-xs sm:text-sm mt-1">
              {timerState.remainingTime <= 0 
                ? "Game akan berakhir secara otomatis..." 
                : "Game akan berakhir secara otomatis ketika waktu habis!"
              }
            </p>
          </div>
        )}

        {/* Player Progress Cards */}
        <div className="space-y-6 sm:space-y-8 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 sm:border-4 border-white/30 rounded-lg p-4 sm:p-6 pixel-lobby-card">
            {players.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-400 rounded border-2 sm:border-4 border-white mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-white">NO PLAYERS HAVE JOINED THE GAME YET</p>
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

                // Enhanced debug logging for progress bar reliability
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
                  <div key={player.id} className="relative bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20 rounded-lg p-3 sm:p-4 pixel-player-card hover:bg-white/15 transition-all duration-300">
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
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded border-2 border-white overflow-hidden">
                          <img
                            src={player.avatar}
                            alt={`${player.username}'s avatar`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to default avatar if image fails to load
                              e.currentTarget.src = "/ava1.png"
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm sm:text-base lg:text-lg text-white">{truncatePlayerName(player.username)}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs sm:text-sm font-bold ${
                          questionsAnswered >= quizSettings.questionCount 
                            ? 'text-green-300' 
                            : questionsAnswered > 0 
                              ? 'text-blue-300' 
                              : 'text-gray-400'
                        }`}>
                          {questionsAnswered}/{quizSettings.questionCount}
                        </span>
                        <div className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-lg px-2 sm:px-3 py-1">
                          <span className="text-yellow-400 font-bold text-xs sm:text-sm">{totalScore} POINTS</span>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Progress Bars */}
                    <div className="space-y-2 sm:space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1 sm:gap-2">
                          </div>
                        </div>
                        <div className="w-full bg-black/30 border-2 border-white/30 rounded-lg h-3 sm:h-4 relative overflow-hidden">
                          <div 
                            className={`h-full rounded-lg transition-all duration-500 ${
                              questionsAnswered >= quizSettings.questionCount
                                ? 'bg-gradient-to-r from-green-400 to-emerald-400'
                                : questionsAnswered > 0
                                  ? 'bg-gradient-to-r from-blue-400 to-purple-400'
                                  : 'bg-gradient-to-r from-gray-400 to-gray-500'
                            }`}
                            style={{ width: `${Math.max(quizProgress, 2)}%` }}
                          />
                          {/* Progress bar animation for active players */}
                          {questionsAnswered > 0 && questionsAnswered < quizSettings.questionCount && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                          )}
                          {/* Completion celebration effect */}
                          {questionsAnswered >= quizSettings.questionCount && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-300/30 to-transparent animate-ping"></div>
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

export default function MonitorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="absolute inset-0 opacity-20">
          <div className="pixel-grid"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 sm:border-4 border-white/30 rounded-lg p-6 sm:p-8 text-center">
            <div className="text-white text-sm sm:text-base">LOADING...</div>
          </div>
        </div>
      </div>
    }>
      <MonitorPageContent />
    </Suspense>
  )
}


