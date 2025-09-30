"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Trophy, Users, Home, Star } from "lucide-react"
import { roomManager } from "@/lib/room-manager"

interface Player {
  id: string
  username: string
  avatar: string
  quizScore?: number
  memoryScore?: number
  isHost: boolean
}

interface Room {
  code: string
  hostId: string
  players: Player[]
  settings: {
    questionCount: number
    totalTimeLimit: number
  }
  status: "waiting" | "countdown" | "quiz" | "memory" | "finished"
  createdAt: string
  startedAt?: string
  gameStarted: boolean
  countdownStartTime?: string
  countdownDuration?: number
}

function LeaderboardPageContent() {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()
  const roomCode = searchParams.get("roomCode")

  useEffect(() => {
    if (!roomCode) {
      router.push("/")
      return
    }

    const fetchRoom = async () => {
      try {
        const roomData = await roomManager.getRoom(roomCode)
        if (roomData) {
          setRoom(roomData)
        } else {
          router.push("/")
        }
      } catch (error) {
        console.error("Error fetching room:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    fetchRoom()
  }, [roomCode, router])

  if (loading) {
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
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg border-2 border-white shadow-xl flex items-center justify-center pixel-brain mb-4 mx-auto animate-pulse">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">LOADING LEADERBOARD...</h2>
            <p className="text-sm text-blue-200">Preparing final results</p>
          </div>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">ROOM NOT FOUND</h2>
            <p className="text-sm text-red-200">Redirecting to home...</p>
          </div>
        </div>
      </div>
    )
  }

  // Sort players by total score
  const sortedPlayers = [...room.players]
    .filter(player => !player.isHost)
    .sort((a, b) => {
      const aTotal = (a.quizScore || 0) + (a.memoryScore || 0)
      const bTotal = (b.quizScore || 0) + (b.memoryScore || 0)
      return bTotal - aTotal
    })

  const champion = sortedPlayers[0]

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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-lg border-2 border-white shadow-xl flex items-center justify-center pixel-brain">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white pixel-header-title">CHAMPIONS</h1>
          </div>
        </div>

        {/* Champion Card - Single Large Card */}
        {champion && (
          <div className="max-w-md mx-auto mb-8">
            <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-4 border-yellow-400/50 rounded-lg p-8 pixel-lobby-card text-center relative">
              {/* Champion Avatar with Glow */}
              <div className="w-24 h-24 rounded-full border-4 border-yellow-400 overflow-hidden mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-lg"></div>
                <img
                  src={champion.avatar}
                  alt={`${champion.username}'s avatar`}
                  className="w-full h-full object-cover relative z-10"
                  onError={(e) => {
                    e.currentTarget.src = "/ava1.png"
                  }}
                />
              </div>
              
              {/* Champion Name */}
              <h2 className="text-2xl font-bold text-yellow-400 mb-6">{champion.username}</h2>
              
              {/* Champion Score with Glow */}
              <div className="bg-gradient-to-r from-yellow-400 to-amber-400 rounded-lg px-8 py-4 mb-6 relative">
                <div className="absolute inset-0 bg-yellow-400/30 rounded-lg blur-sm"></div>
                <div className="text-4xl font-bold text-white relative z-10">{(champion.quizScore || 0) + (champion.memoryScore || 0)}</div>
                <div className="text-lg text-white relative z-10">POINTS</div>
              </div>
              
              {/* Score Breakdown */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="text-yellow-400 font-bold text-lg">{champion.quizScore || 0}</div>
                  <div className="text-white text-xs">QUIZ POINTS</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="text-yellow-400 font-bold text-lg">{champion.memoryScore || 0}</div>
                  <div className="text-white text-xs">MEMORY POINTS</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complete Leaderboard */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/30 rounded-lg p-6 pixel-lobby-card">
            <h3 className="text-xl font-bold text-white mb-6 text-center">FINAL LEADERBOARD</h3>
            
            <div className="space-y-4">
              {sortedPlayers.map((player, index) => {
                const totalScore = (player.quizScore || 0) + (player.memoryScore || 0)
                const rank = index + 1
                
                return (
                  <div key={player.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/20">
                    {/* Rank */}
                    <div className={`w-12 h-12 rounded-lg border-2 border-white flex items-center justify-center font-bold text-lg ${
                      rank === 1 ? "bg-yellow-400 text-white" : 
                      rank === 2 ? "bg-gray-400 text-white" : 
                      rank === 3 ? "bg-amber-600 text-white" : 
                      "bg-blue-400 text-white"
                    }`}>
                      #{rank}
                    </div>
                    
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded border border-white overflow-hidden">
                      <img
                        src={player.avatar}
                        alt={`${player.username}'s avatar`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/ava1.png"
                        }}
                      />
                    </div>
                    
                    {/* Player Info */}
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{player.username}</h4>
                      <div className="text-sm text-blue-200">
                        Quiz: {player.quizScore || 0} | Memory: {player.memoryScore || 0}
                      </div>
                    </div>
                    
                    {/* Total Score */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{totalScore}</div>
                      <div className="text-xs text-blue-200">POINTS</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Back to Dashboard Button */}
        <div className="text-center">
          <button
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-4 border-white/30 rounded-lg px-8 py-4 text-white font-bold text-lg transition-all duration-300 hover:scale-105 pixel-button flex items-center justify-center gap-3 mx-auto"
            onClick={() => {
              router.push("/")
            }}
          >
            <Home className="w-5 h-5" />
            BACK TO DASHBOARD
          </button>
        </div>
      </div>
      
      {/* Pixel Background Elements */}
      <PixelBackgroundElements />
    </div>
  )
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg border-2 border-white shadow-xl flex items-center justify-center pixel-brain mb-4 mx-auto animate-pulse">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">LOADING...</h2>
            <p className="text-sm text-blue-200">Preparing leaderboard</p>
          </div>
        </div>
      </div>
    }>
      <LeaderboardPageContent />
    </Suspense>
  )
}

// Pixel Background Elements Component
function PixelBackgroundElements() {
  return (
    <>
      {/* Floating Pixel Elements */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-blue-400 animate-float opacity-60"></div>
      <div className="absolute top-40 right-20 w-3 h-3 bg-purple-400 animate-float-delayed opacity-70"></div>
      <div className="absolute bottom-32 left-1/4 w-5 h-5 bg-cyan-400 animate-float-slow opacity-50"></div>
      <div className="absolute bottom-20 right-1/3 w-3 h-3 bg-pink-400 animate-float-delayed-slow opacity-60"></div>
      <div className="absolute top-1/2 left-20 w-4 h-4 bg-green-400 animate-float opacity-40"></div>
      <div className="absolute top-1/3 right-40 w-3 h-3 bg-yellow-400 animate-float-delayed opacity-55"></div>
      
      {/* Pixel Blocks */}
      <div className="absolute top-60 left-1/3 w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-400 animate-pixel-float opacity-30"></div>
      <div className="absolute bottom-40 right-20 w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-400 animate-pixel-block-float opacity-25"></div>
      <div className="absolute top-80 right-1/2 w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 animate-pixel-float-delayed opacity-35"></div>
      
      {/* Falling Pixels */}
      <div className="absolute top-0 left-1/4 w-2 h-2 bg-blue-400 animate-falling opacity-40"></div>
      <div className="absolute top-0 right-1/3 w-2 h-2 bg-purple-400 animate-falling-delayed opacity-30"></div>
      <div className="absolute top-0 left-2/3 w-2 h-2 bg-cyan-400 animate-falling-slow opacity-35"></div>
    </>
  )
}



// l