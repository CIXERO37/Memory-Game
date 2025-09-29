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

function MonitorPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [previousRankings, setPreviousRankings] = useState<{ [key: string]: number }>({})
  const [rankingChanges, setRankingChanges] = useState<{ [key: string]: "up" | "down" | null }>({})
  const { room, loading } = useRoom(roomCode || "")

  // Get quiz settings from room data
  const quizSettings = room ? {
    timeLimit: room.settings.totalTimeLimit,
    questionCount: room.settings.questionCount,
  } : {
    timeLimit: 30,
    questionCount: 10,
  }
  
  const timerState = useSynchronizedTimer(room, quizSettings.timeLimit)

  useEffect(() => {
    const roomCodeParam = searchParams.get("roomCode")
    if (roomCodeParam) {
      setRoomCode(roomCodeParam)
    } else {
      // Try to get from localStorage
      const hostData = localStorage.getItem("currentHost")
      if (hostData) {
        const { roomCode: storedRoomCode } = JSON.parse(hostData)
        setRoomCode(storedRoomCode)
      } else {
        router.push("/select-quiz")
      }
    }
  }, [searchParams, router])

  // Timer is now handled by useSynchronizedTimer hook


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

  const endGame = async () => {
    console.log("End Game clicked, roomCode:", roomCode)
    if (roomCode) {
      try {
        const success = await roomManager.updateGameStatus(roomCode, "finished")
        console.log("Game status updated:", success)
        
        if (success) {
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
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-4 border-white/30 rounded-lg p-8 text-center pixel-lobby-card">
            <div className="text-white">LOADING HOST MONITOR...</div>
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
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-4 border-white/30 rounded-lg p-8 text-center pixel-lobby-card">
            <div className="text-white">LOADING ROOM...</div>
            <div className="text-blue-200 text-sm mt-2">Please wait while we connect to the game</div>
          </div>
        </div>
      </div>
    )
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

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Monitor Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg border-4 border-white shadow-2xl flex items-center justify-center pixel-brain">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-4">
                  <h1 className="text-4xl font-bold text-white pixel-header-title">PLAYER PROGRESS</h1>
                  <div className="bg-blue-500/20 border-2 border-blue-500/50 rounded-lg px-4 py-2">
                    <span className="text-blue-400 font-bold text-sm">{players.length} PLAYERS</span>
                  </div>
                  <div className="bg-green-500/20 border-2 border-green-500/50 rounded-lg px-4 py-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-bold text-sm">
                      {getTimerDisplayText(timerState)}
                    </span>
                  </div>
                </div>
                <p className="text-lg text-blue-200">Room: {roomCode}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={endGame} 
              className="relative pixel-button-container"
              onMouseDown={(e) => {
                console.log("Button clicked, calling endGame...")
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
              <button className="relative bg-gradient-to-br from-red-500 to-orange-500 border-4 border-black rounded-lg shadow-2xl font-bold text-white text-lg pixel-button-host transform hover:scale-105 transition-all duration-300 px-6 py-3">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 bg-black rounded border-2 border-white flex items-center justify-center">
                    <span className="text-white font-bold text-sm">✕</span>
                  </div>
                  <span className="text-lg font-bold">END GAME</span>
                </div>
              </button>
            </button>
          </div>
        </div>


        {/* Player Progress Cards */}
        <div className="space-y-8 mb-8">
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-4 border-white/30 rounded-lg p-6 pixel-lobby-card">
            {players.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-400 rounded border-4 border-white mx-auto mb-6 flex items-center justify-center">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <p className="text-lg text-white">NO PLAYERS HAVE JOINED THE GAME YET</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedPlayers.map((player, index) => {
                const rank = index + 1
                const quizScore = player.quizScore || 0
                const memoryScore = player.memoryScore || 0
                const totalScore = quizScore + memoryScore
                const quizProgress = Math.min((quizScore / quizSettings.questionCount) * 100, 100)
                const rankingChange = rankingChanges[player.id]

                return (
                  <div key={player.id} className="relative bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20 rounded-lg p-4 pixel-player-card hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`text-lg font-bold ${rank === 1 ? "text-yellow-500" : rank === 2 ? "text-gray-400" : rank === 3 ? "text-amber-600" : "text-blue-400"}`}
                          >
                            #{rank}
                          </div>
                          {rankingChange === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                          {rankingChange === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                        </div>
                        <div className="w-12 h-12 rounded border-2 border-white overflow-hidden">
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
                          <h3 className="font-bold text-lg text-white">{player.username}</h3>
                        </div>
                      </div>
                      <div className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-lg px-3 py-1">
                        <span className="text-yellow-400 font-bold text-sm">{totalScore} POINTS</span>
                      </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-white">QUIZ PROGRESS</span>
                          <span className="text-sm text-blue-300">
                            {quizScore}/{quizSettings.questionCount} ({Math.round(quizProgress)}%)
                          </span>
                        </div>
                        <div className="w-full bg-black/30 border-2 border-white/30 rounded-lg h-3">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg transition-all duration-300"
                            style={{ width: `${quizProgress}%` }}
                          />
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
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-4 border-white/30 rounded-lg p-8 text-center">
            <div className="text-white">LOADING...</div>
          </div>
        </div>
      </div>
    }>
      <MonitorPageContent />
    </Suspense>
  )
}
