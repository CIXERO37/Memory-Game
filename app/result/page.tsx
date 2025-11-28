"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Trophy, Users, Home, Star, Medal } from "lucide-react"
import { roomManager } from "@/lib/room-manager"
import { sessionManager } from "@/lib/supabase-session-manager"
import { RobustGoogleAvatar } from "@/components/robust-google-avatar"
import { useTranslation } from "react-i18next"

interface Player {
  id: string
  nickname: string
  avatar: string
  quizScore?: number
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

function ResultPageContent() {
  const { t } = useTranslation()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [playerRanking, setPlayerRanking] = useState<{
    rank: number
    totalScore: number
    player: Player
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const searchParams = useSearchParams()
  const router = useRouter()
  const roomCode = searchParams.get("roomCode")

  // CRITICAL: Retry mechanism untuk fetch room
  const fetchRoom = async (attempt = 1, maxAttempts = 3) => {
    try {
      setError(null)
      if (!roomCode) {
        setError("Room code not found")
        return
      }


      const roomData = await roomManager.getRoom(roomCode)

      if (roomData) {
        setRoom(roomData)

        // Find current player
        let player = null
        const sessionId = sessionManager.getSessionIdFromStorage()
        if (sessionId) {
          try {
            const sessionData = await sessionManager.getSessionData(sessionId)
            if (sessionData && sessionData.user_type === 'player') {
              player = sessionData.user_data

            }
          } catch (error) {
            console.warn("Error getting session data:", error)
          }
        }

        if (!player && typeof window !== 'undefined') {
          const playerData = localStorage.getItem("currentPlayer")
          if (playerData) {
            player = JSON.parse(playerData)

          }
        }

        if (player) {
          const allPlayers = roomData.players.filter(p => !p.isHost)

          // Sort players by total score
          const sortedPlayers = [...allPlayers].sort((a, b) => {
            const aTotal = a.quizScore || 0
            const bTotal = b.quizScore || 0
            return bTotal - aTotal
          })

          const playerIndex = sortedPlayers.findIndex(p => p.id === player.id)
          if (playerIndex !== -1) {
            const playerObj = sortedPlayers[playerIndex]
            // Use the avatar from session data (player) instead of room data
            const playerWithCorrectAvatar = {
              ...playerObj,
              avatar: player.avatar || playerObj.avatar
            }
            setPlayerRanking({
              rank: playerIndex + 1,
              totalScore: playerObj.quizScore || 0,
              player: playerWithCorrectAvatar
            })
          } else {
            // Player tidak ditemukan di room, coba lagi
            if (attempt < maxAttempts) {

              setTimeout(() => fetchRoom(attempt + 1), 1000 * attempt)
            } else {
              setError("Player data not found. Please ensure you completed the quiz.")
            }
          }
        } else {
          setError("No player session found. Please join the game again.")
        }
      } else {
        setError("Room not found. The game may have been ended.")
      }
    } catch (error) {
      console.error("Error fetching room:", error)
      if (attempt < maxAttempts) {

        setTimeout(() => fetchRoom(attempt + 1), 1000 * attempt)
      } else {
        setError("Failed to load results. Please try again.")
      }
    } finally {
      if (attempt === 1) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (!roomCode) {
      router.push("/")
      return
    }

    fetchRoom()
  }, [roomCode, router, retryCount])

  // Add retry button if error
  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="bg-linear-to-br from-red-500/20 to-orange-500/20 border-2 border-white/30 rounded-lg p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">ERROR</h2>
            <p className="text-red-200 mb-4">{error}</p>
            <button
              onClick={() => {
                setLoading(true)
                setError(null)
                setRetryCount(prev => prev + 1)
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-2 border-white/30 rounded-lg px-6 py-3 text-white font-bold transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="absolute inset-0 opacity-20">
          <div className="pixel-grid"></div>
        </div>

        <div className="absolute inset-0 opacity-10">
          <div className="scanlines"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 bg-linear-to-r from-blue-400 to-purple-400 rounded-lg border-2 border-white shadow-xl flex items-center justify-center pixel-brain mb-4 mx-auto animate-pulse">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{t('lobby.loadingResults')}</h2>
            <p className="text-sm text-blue-200">Calculating your score</p>
          </div>
        </div>
      </div>
    )
  }

  if (!room || !playerRanking) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">RESULTS NOT FOUND</h2>
            <p className="text-sm text-red-200">Redirecting to home...</p>
          </div>
        </div>
      </div>
    )
  }

  // Get rank display
  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { text: t('lobby.champion'), icon: "🥇", color: "from-yellow-400 to-amber-400", borderColor: "border-yellow-400/50" }
    if (rank === 2) return { text: "2ND PLACE", icon: "🥈", color: "from-gray-400 to-gray-500", borderColor: "border-gray-400/50" }
    if (rank === 3) return { text: "3RD PLACE", icon: "🥉", color: "from-amber-600 to-orange-600", borderColor: "border-amber-600/50" }
    return { text: `${rank}TH PLACE`, icon: "🏅", color: "from-blue-400 to-purple-400", borderColor: "border-blue-400/50" }
  }

  const rankDisplay = getRankDisplay(playerRanking.rank)

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
            <h1 className="text-3xl font-bold text-white pixel-header-title">{t('lobby.gameResults')}</h1>
          </div>
        </div>

        {/* Player Result Card */}
        <div className="max-w-md mx-auto mb-8">
          <div className={`bg-gradient-to-br from-slate-800/35 to-slate-900/45 backdrop-blur-xl border-2 border-slate-400/25 rounded-lg p-8 pixel-lobby-card text-center relative shadow-2xl`}>
            {/* Card Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/8 to-blue-400/8 rounded-lg blur-xl -z-10"></div>
            {/* Card Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent rounded-lg"></div>

            {/* MEMORYQUIZ Identity - Top Left Corner */}
            <div className="absolute top-4 left-4 flex items-center p-2">
              <img
                src="/images/memoryquiz.webp"
                alt="Memory Quiz"
                className="h-12 w-auto object-contain drop-shadow-lg"
                draggable={false}
              />
            </div>

            {/* GameForSmart Logo - Top Right Corner */}
            <div className="absolute top-4 right-4 flex items-center w-32 h-12 opacity-80 hover:opacity-100 transition-opacity duration-300">
              <img
                src="/images/gameforsmartlogo.webp"
                alt="GameForSmart Logo"
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>
            {/* Player Avatar with Glow */}
            <div className="w-24 h-24 rounded-full border-3 border-slate-300/50 overflow-hidden mx-auto mb-6 relative shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/25 to-blue-400/25 rounded-full blur-lg"></div>
              <div className="absolute inset-0 ring-1 ring-white/20 rounded-full"></div>
              {/^https?:\/\//.test(playerRanking.player.avatar) ? (
                <RobustGoogleAvatar
                  avatarUrl={playerRanking.player.avatar}
                  alt={`${playerRanking.player.nickname}'s avatar`}
                  width={96}
                  height={96}
                  className="w-full h-full relative z-10"
                />
              ) : (
                <img
                  src={playerRanking.player.avatar}
                  alt={`${playerRanking.player.nickname}'s avatar`}
                  className="w-full h-full object-cover relative z-10"
                  onError={(e) => {
                    e.currentTarget.src = "/ava1.webp"
                  }}
                />
              )}
            </div>

            {/* Player Name */}
            <h2 className="text-2xl font-bold text-white/95 mb-4 drop-shadow-lg line-clamp-2 leading-tight">{playerRanking.player.nickname}</h2>

            {/* Rank Display */}
            <div className="mb-6">
              <div className="text-6xl mb-2">{rankDisplay.icon}</div>
              <div className={`text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent drop-shadow-sm`}>
                {rankDisplay.text}
              </div>
            </div>

            {/* Score Display with Glow */}
            <div className="bg-gradient-to-r from-slate-700/60 to-slate-800/70 backdrop-blur-sm rounded-lg px-8 py-4 mb-6 relative border border-slate-400/30 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/15 to-blue-400/15 rounded-lg blur-sm"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent rounded-lg"></div>
              <div className="text-4xl font-bold text-cyan-100 relative z-10 drop-shadow-lg">{playerRanking.totalScore}</div>
              <div className="text-lg text-slate-200/80 relative z-10">{t('lobby.points')}</div>
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
            {t('lobby.back')}
          </button>
        </div>
      </div>

      {/* Pixel Background Elements */}
      <PixelBackgroundElements />
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg border-2 border-white shadow-xl flex items-center justify-center pixel-brain mb-4 mx-auto animate-pulse">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">LOADING...</h2>
            <p className="text-sm text-blue-200">Preparing results</p>
          </div>
        </div>
      </div>
    }>
      <ResultPageContent />
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