"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Trophy, Users, Home, Star, Crown, Medal, Award, Zap, Sparkles, RotateCw } from "lucide-react"
import { roomManager } from "@/lib/room-manager"
import { sessionManager } from "@/lib/supabase-session-manager"
import { RobustGoogleAvatar } from "@/components/robust-google-avatar"
import { useTranslation } from "react-i18next"
import { supabase } from "@/lib/supabase"

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

// Utility function to format player names
function formatPlayerName(username: string): string {
  const words = username.trim().split(/\s+/)
  
  if (words.length >= 2) {
    // Two or more words: break line between first two words
    return words.slice(0, 2).join('\n')
  } else {
    // Single word: return as is
    return username
  }
}

function LeaderboardPageContent() {
  const { t } = useTranslation()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [playersWithCorrectAvatars, setPlayersWithCorrectAvatars] = useState<Player[]>([])
  const [quizId, setQuizId] = useState<string | null>(null)
  const [quizTitle, setQuizTitle] = useState<string | null>(null)
  const [hostId, setHostId] = useState<string | null>(null)
  const [isRestarting, setIsRestarting] = useState(false)
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
          setHostId(roomData.hostId)
          
          // Fetch quizId and quizTitle from database
          try {
            const { data: roomDbData, error } = await supabase
              .from('rooms')
              .select('quiz_id, quiz_title')
              .eq('room_code', roomCode)
              .single()
            
            if (!error && roomDbData) {
              setQuizId(roomDbData.quiz_id)
              setQuizTitle(roomDbData.quiz_title)
            }
          } catch (error) {
            console.warn("Error fetching quiz data from database:", error)
          }
          
          // Fetch session data for each player to get correct avatars
          const playersWithAvatars = await Promise.all(
            roomData.players.filter(p => !p.isHost).map(async (player) => {
              try {
                // Try to get session data for this player
                const sessionData = await sessionManager.getSessionByRoom(roomCode, 'player')
                if (sessionData && sessionData.user_data && sessionData.user_data.id === player.id) {
                  return {
                    ...player,
                    avatar: sessionData.user_data.avatar || player.avatar
                  }
                }
                return player
              } catch (error) {
                console.warn(`Error fetching session data for player ${player.id}:`, error)
                return player
              }
            })
          )
          
          setPlayersWithCorrectAvatars(playersWithAvatars)
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
        {/* Fine Grid Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        
        {/* Soft Glowing Areas */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Upper-middle glow */}
          <div className="absolute top-20 right-1/4 w-96 h-96 opacity-40 animate-pulse">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30 blur-3xl"></div>
          </div>
          
          {/* Lower-right glow */}
          <div className="absolute bottom-20 right-20 w-80 h-80 opacity-35 animate-pulse" style={{ animationDelay: '1s' }}>
            <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-400/30 to-pink-400/30 blur-3xl"></div>
          </div>
          
          {/* Scattered Square Particles */}
          <PixelBackgroundElements />
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/40 to-amber-400/40 blur-2xl animate-pulse"></div>
              <div className="relative w-20 h-20 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full border-4 border-white shadow-2xl flex items-center justify-center mx-auto animate-bounce-slow">
                <Crown className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400 mb-4">LOADING LEADERBOARD...</h2>
            <p className="text-lg text-yellow-200 font-semibold">Preparing tournament results</p>
          </div>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        {/* Fine Grid Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        
        {/* Soft Glowing Areas */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Upper-middle glow */}
          <div className="absolute top-20 right-1/4 w-96 h-96 opacity-40 animate-pulse">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30 blur-3xl"></div>
          </div>
          
          {/* Lower-right glow */}
          <div className="absolute bottom-20 right-20 w-80 h-80 opacity-35 animate-pulse" style={{ animationDelay: '1s' }}>
            <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-400/30 to-pink-400/30 blur-3xl"></div>
          </div>
          
          {/* Scattered Square Particles */}
          <PixelBackgroundElements />
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">ROOM NOT FOUND</h2>
            <p className="text-sm text-red-200">Redirecting to home...</p>
          </div>
        </div>
      </div>
    )
  }

  // Sort players by total score using corrected avatars, fallback to room players if needed
  const playersToUse = playersWithCorrectAvatars.length > 0 ? playersWithCorrectAvatars : (room?.players.filter(p => !p.isHost) || [])
  const sortedPlayers = [...playersToUse]
    .sort((a, b) => {
      const aTotal = (a.quizScore || 0) + (a.memoryScore || 0)
      const bTotal = (b.quizScore || 0) + (b.memoryScore || 0)
      return bTotal - aTotal
    })

  const champion = sortedPlayers[0]

  // Handle restart game
  const handleRestart = async () => {
    if (!room || !hostId || !quizId || !quizTitle || isRestarting) {
      console.error("[Leaderboard] Missing required data for restart:", { room, hostId, quizId, quizTitle })
      return
    }

    setIsRestarting(true)

    try {
      console.log("[Leaderboard] Restarting game with settings:", {
        questionCount: room.settings.questionCount,
        totalTimeLimit: room.settings.totalTimeLimit,
        quizId,
        quizTitle
      })

      // Create new room with same settings
      const newRoom = await roomManager.createRoom(
        hostId,
        {
          questionCount: room.settings.questionCount,
          totalTimeLimit: room.settings.totalTimeLimit,
        },
        quizId,
        quizTitle
      )

      if (!newRoom) {
        console.error("[Leaderboard] Failed to create new room")
        alert("Failed to create new room. Please try again.")
        setIsRestarting(false)
        return
      }

      console.log("[Leaderboard] New room created successfully:", newRoom)

      // Verify room exists before proceeding
      const verifyRoom = await roomManager.getRoom(newRoom.code)
      if (!verifyRoom) {
        console.error("[Leaderboard] Room verification failed")
        alert("Room was created but verification failed. Please try again.")
        setIsRestarting(false)
        return
      }

      console.log("[Leaderboard] Room verification successful:", verifyRoom)

      // Store host info in session manager
      try {
        await sessionManager.createOrUpdateSession(
          null, // Generate new session ID
          'host',
          {
            id: hostId,
            roomCode: newRoom.code,
            quizId: quizId,
          },
          newRoom.code
        )
        console.log("[Leaderboard] Host session created in Supabase")
      } catch (error) {
        console.error("[Leaderboard] Error creating host session:", error)
      }

      // Store host info in localStorage as fallback
      try {
        localStorage.setItem('hostId', hostId)
        localStorage.setItem('roomCode', newRoom.code)
        localStorage.setItem('quizId', quizId)
        console.log("[Leaderboard] Host info stored in localStorage")
      } catch (error) {
        console.error("[Leaderboard] Error storing host info in localStorage:", error)
      }

      // Redirect to lobby
      console.log("[Leaderboard] Redirecting to lobby with room code:", newRoom.code)
      router.push(`/lobby?roomCode=${newRoom.code}`)
    } catch (error) {
      console.error("[Leaderboard] Error restarting game:", error)
      alert("An error occurred while restarting the game. Please try again.")
      setIsRestarting(false)
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

      {/* Memory Quiz Logo - Top Left */}
      <div className="absolute top-4 left-4 z-50">
        <img
          src="/images/memoryquiz.png"
          alt="MEMORY QUIZ"
          className="h-12 w-auto sm:h-16 md:h-20 lg:h-24 object-contain"
          draggable={false}
        />
      </div>

      {/* GameForSmart Logo - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <img
          src="/images/gameforsmartlogo.png"
          alt="GameForSmart Logo"
          className="h-12 w-auto sm:h-16 md:h-20 lg:h-24 object-contain"
          draggable={false}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 mt-16 sm:mt-20 md:mt-24 lg:mt-28">
        {/* Modern Header Section */}
        <div className="text-center mb-6">
          {/* Main Title with Enhanced Effects */}
          <div className="relative inline-block mb-4">
            <div className="flex items-center justify-center gap-6">
              {/* Crown Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400/50 blur-lg animate-pulse"></div>
                <div className="relative w-16 h-16 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full border-4 border-white shadow-2xl flex items-center justify-center animate-bounce-slow">
                  <Crown className="w-8 h-8 text-white" />
                </div>
              </div>
              
              {/* Title */}
              <div className="relative">
                <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 drop-shadow-2xl">
                  {t('lobby.champions')}
                </h1>
                <div className="absolute inset-0 text-5xl md:text-6xl font-bold text-yellow-400/20 blur-sm">
                  {t('lobby.champions')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stunning 3D Podium */}
        <div className="max-w-7xl mx-auto mb-16">
          <div className="relative">
            {/* Podium Base with 3D Effect */}
            <div className="flex justify-center items-end gap-6 sm:gap-12 relative">
              
              {/* 2nd Place - Silver Medal */}
              {sortedPlayers[1] && (
                <div className="flex flex-col items-center relative group">
                 
                  
                  {/* Player Card */}
                  <div className="relative transform group-hover:scale-105 transition-all duration-500">
                    {/* Card Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-400/30 to-slate-600/30 blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    
                    {/* Card */}
                    <div className="relative bg-gradient-to-br from-slate-500/40 to-slate-700/40 border-4 border-slate-400/70 rounded-3xl p-8 backdrop-blur-sm shadow-2xl min-w-[280px]">
                    
                      
                      {/* Rank Number */}
                      <div className="absolute top-4 right-4 w-10 h-10 bg-gradient-to-br from-slate-300 to-slate-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                        <span className="text-lg font-bold text-white">2</span>
                      </div>
                      
                      {/* Avatar */}
                      <div className="w-24 h-24 rounded-full border-4 border-slate-400 overflow-hidden mx-auto mb-6 shadow-2xl">
                        <div className="absolute inset-0 bg-slate-400/40 rounded-full blur-sm"></div>
                        {/^https?:\/\//.test(sortedPlayers[1].avatar) ? (
                          <RobustGoogleAvatar
                            avatarUrl={sortedPlayers[1].avatar}
                            alt={`${sortedPlayers[1].username}'s avatar`}
                            width={96}
                            height={96}
                            className="w-full h-full relative z-10"
                          />
                        ) : (
                          <img
                            src={sortedPlayers[1].avatar}
                            alt={`${sortedPlayers[1].username}'s avatar`}
                            className="w-full h-full object-cover relative z-10"
                            onError={(e) => {
                              e.currentTarget.src = "/ava1.png"
                            }}
                          />
                        )}
                      </div>
                      
                      {/* Name */}
                      <h3 className="text-2xl font-bold text-slate-200 mb-6 text-center whitespace-pre-line">{formatPlayerName(sortedPlayers[1].username)}</h3>
                      
                      {/* Score */}
                      <div className="bg-gradient-to-r from-slate-400 to-slate-600 rounded-2xl px-8 py-6 shadow-2xl">
                        <div className="text-5xl font-bold text-white text-center">{(sortedPlayers[1].quizScore || 0) + (sortedPlayers[1].memoryScore || 0)}</div>
                        <div className="text-lg text-black text-center font-bold" style={{ textShadow: '1px 1px 0px #fff, -1px -1px 0px #fff, 1px -1px 0px #fff, -1px 1px 0px #fff' }}>{t('lobby.points')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place - Gold Champion */}
              {champion && (
                <div className="flex flex-col items-center relative z-20 group">
               
                  
                  {/* Champion Card */}
                  <div className="relative transform group-hover:scale-105 transition-all duration-500">
                    {/* Champion Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/40 to-amber-500/40 blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse"></div>
                    
                    {/* Card */}
                    <div className="relative bg-gradient-to-br from-yellow-500/50 to-amber-600/50 border-6 border-yellow-400/80 rounded-3xl p-10 backdrop-blur-sm shadow-2xl min-w-[320px] animate-pulse">
                    
                      
                      {/* Rank Number */}
                      <div className="absolute top-6 right-6 w-12 h-12 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full border-3 border-white shadow-xl flex items-center justify-center">
                        <span className="text-xl font-bold text-white">1</span>
                      </div>
                      
                      {/* Champion Avatar */}
                      <div className="w-32 h-32 rounded-full border-6 border-yellow-400 overflow-hidden mx-auto mb-8 shadow-2xl">
                        <div className="absolute inset-0 bg-yellow-400/50 rounded-full blur-lg animate-pulse"></div>
                        {/^https?:\/\//.test(champion.avatar) ? (
                          <RobustGoogleAvatar
                            avatarUrl={champion.avatar}
                            alt={`${champion.username}'s avatar`}
                            width={128}
                            height={128}
                            className="w-full h-full relative z-10"
                          />
                        ) : (
                          <img
                            src={champion.avatar}
                            alt={`${champion.username}'s avatar`}
                            className="w-full h-full object-cover relative z-10"
                            onError={(e) => {
                              e.currentTarget.src = "/ava1.png"
                            }}
                          />
                        )}
                      </div>
                      
                      {/* Champion Name */}
                      <h2 className="text-3xl font-bold text-yellow-200 mb-8 text-center whitespace-pre-line">{formatPlayerName(champion.username)}</h2>
                      
                      {/* Champion Score */}
                      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl px-8 py-6 shadow-2xl">
                        <div className="text-5xl font-bold text-white text-center">{(champion.quizScore || 0) + (champion.memoryScore || 0)}</div>
                        <div className="text-lg text-black text-center font-bold" style={{ textShadow: '1px 1px 0px #fff, -1px -1px 0px #fff, 1px -1px 0px #fff, -1px 1px 0px #fff' }}>{t('lobby.points')}</div>
                      </div>
                      
                      {/* Champion Sparkles */}
                      <div className="absolute top-4 left-4">
                        <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                      </div>
                      <div className="absolute top-4 right-4">
                        <Star className="w-6 h-6 text-amber-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <Zap className="w-6 h-6 text-yellow-300 animate-pulse" style={{ animationDelay: '1s' }} />
                      </div>
                      <div className="absolute bottom-4 right-4">
                        <Award className="w-6 h-6 text-amber-300 animate-pulse" style={{ animationDelay: '1.5s' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place - Bronze Medal */}
              {sortedPlayers[2] && (
                <div className="flex flex-col items-center relative group">
                 
                  
                  {/* Player Card */}
                  <div className="relative transform group-hover:scale-105 transition-all duration-500">
                    {/* Card Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-orange-600/30 blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    
                    {/* Card */}
                    <div className="relative bg-gradient-to-br from-amber-600/40 to-orange-700/40 border-4 border-amber-500/70 rounded-3xl p-8 backdrop-blur-sm shadow-2xl min-w-[280px]">
                     
                      
                      {/* Rank Number */}
                      <div className="absolute top-4 right-4 w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                        <span className="text-lg font-bold text-white">3</span>
                      </div>
                      
                      {/* Avatar */}
                      <div className="w-24 h-24 rounded-full border-4 border-amber-500 overflow-hidden mx-auto mb-6 shadow-2xl">
                        <div className="absolute inset-0 bg-amber-500/40 rounded-full blur-sm"></div>
                        {/^https?:\/\//.test(sortedPlayers[2].avatar) ? (
                          <RobustGoogleAvatar
                            avatarUrl={sortedPlayers[2].avatar}
                            alt={`${sortedPlayers[2].username}'s avatar`}
                            width={96}
                            height={96}
                            className="w-full h-full relative z-10"
                          />
                        ) : (
                          <img
                            src={sortedPlayers[2].avatar}
                            alt={`${sortedPlayers[2].username}'s avatar`}
                            className="w-full h-full object-cover relative z-10"
                            onError={(e) => {
                              e.currentTarget.src = "/ava1.png"
                            }}
                          />
                        )}
                      </div>
                      
                      {/* Name */}
                      <h3 className="text-2xl font-bold text-amber-200 mb-6 text-center whitespace-pre-line">{formatPlayerName(sortedPlayers[2].username)}</h3>
                      
                      {/* Score */}
                      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl px-8 py-6 shadow-2xl">
                        <div className="text-5xl font-bold text-white text-center">{(sortedPlayers[2].quizScore || 0) + (sortedPlayers[2].memoryScore || 0)}</div>
                        <div className="text-lg text-black text-center font-bold" style={{ textShadow: '1px 1px 0px #fff, -1px -1px 0px #fff, 1px -1px 0px #fff, -1px 1px 0px #fff' }}>{t('lobby.points')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Enhanced Confetti Effect */}
            <div className="absolute inset-0 pointer-events-none">
            </div>
          </div>
        </div>

         {/* Modern Other Participants Section */}
         {sortedPlayers.length > 3 && (
           <div className="max-w-6xl mx-auto mb-16">
             <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-4 border-indigo-400/40 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden shadow-2xl">
               {/* Background Glow */}
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-3xl blur-xl"></div>
               
               {/* Header */}
               <div className="relative z-10 text-center mb-6">
                 <div className="flex items-center justify-center gap-3 mb-4">
                   <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full border-2 border-white shadow-xl flex items-center justify-center">
                     <Users className="w-5 h-5 text-white" />
                   </div>
                   <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-400 drop-shadow-lg">
                     OTHERS
                   </h3>
                 </div>
               
               </div>
               
               {/* Participants Grid - Horizontal Compact Cards */}
               <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                 {sortedPlayers.slice(3).map((player, index) => {
                   const totalScore = (player.quizScore || 0) + (player.memoryScore || 0)
                   const rank = index + 4
                   
                   return (
                     <div key={player.id} className="group relative">
                       {/* Card Glow */}
                       <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-lg blur-md group-hover:blur-lg transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                       
                       {/* Horizontal Compact Card */}
                       <div className="relative bg-gradient-to-r from-slate-800/60 to-slate-900/60 rounded-lg p-3 border border-slate-600/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-indigo-400/60 overflow-hidden">
                         {/* Content Layout - Horizontal */}
                         <div className="flex items-center gap-4">
                           {/* Rank - Left */}
                           <div className="text-yellow-400 font-bold text-lg flex-shrink-0">
                             #{rank}
                           </div>
                           
                           {/* Avatar */}
                           <div className="w-12 h-12 rounded-full border-2 border-slate-400 overflow-hidden shadow-md group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                             <div className="absolute inset-0 bg-indigo-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                             {/^https?:\/\//.test(player.avatar) ? (
                               <RobustGoogleAvatar
                                 avatarUrl={player.avatar}
                                 alt={`${player.username}'s avatar`}
                                 width={48}
                                 height={48}
                                 className="w-full h-full relative z-10"
                               />
                             ) : (
                               <img
                                 src={player.avatar}
                                 alt={`${player.username}'s avatar`}
                                 className="w-full h-full object-cover relative z-10"
                                 onError={(e) => {
                                   e.currentTarget.src = "/ava1.png"
                                 }}
                               />
                             )}
                           </div>
                           
                           {/* Player Name - Middle */}
                           <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-lg text-white group-hover:text-indigo-200 transition-colors duration-300 whitespace-pre-line">{formatPlayerName(player.username)}</h4>
                           </div>
                           
                           {/* Points - Right */}
                           <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg px-3 py-2 shadow-sm group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                             <div className="text-center">
                               <div className="text-lg font-bold text-white">{totalScore}</div>
                               <div className="text-xs text-black font-bold" style={{ textShadow: '1px 1px 0px #fff, -1px -1px 0px #fff, 1px -1px 0px #fff, -1px 1px 0px #fff' }}>{t('lobby.points')}</div>
                             </div>
                           </div>
                         </div>
                         
                         {/* Decorative Elements */}
                         <div className="absolute top-1 left-1 w-1 h-1 bg-indigo-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                         <div className="absolute bottom-1 right-1 w-1 h-1 bg-purple-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                       </div>
                     </div>
                   )
                 })}
               </div>
               
               {/* Decorative Border Elements */}
               <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-indigo-400/50 rounded-tl-xl"></div>
               <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-indigo-400/50 rounded-tr-xl"></div>
               <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-indigo-400/50 rounded-bl-xl"></div>
               <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-indigo-400/50 rounded-br-xl"></div>
             </div>
           </div>
         )}

        {/* Back Button - Left Center Card */}
        <div className="fixed left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-50">
          <button
            className="relative bg-gradient-to-br from-blue-500/40 to-purple-600/40 border-2 sm:border-2 md:border-4 border-blue-400/70 rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-5 lg:p-6 backdrop-blur-sm shadow-xl sm:shadow-2xl transform hover:scale-105 transition-all duration-500 group"
            onClick={() => {
              router.push("/")
            }}
          >
            {/* Card Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-purple-400/30 blur-lg sm:blur-xl group-hover:blur-xl sm:group-hover:blur-2xl transition-all duration-500 rounded-xl sm:rounded-2xl md:rounded-3xl"></div>
            
            {/* Icon */}
            <div className="relative z-10 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
              <Home className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-0.5 -left-0.5 sm:-top-1 sm:-left-1 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-blue-400 border border-white sm:border-2 border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-purple-400 border border-white sm:border-2 border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Restart Button - Right Center Card */}
        <div className="fixed right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-50">
          <button
            className="relative bg-gradient-to-br from-blue-500/40 to-purple-600/40 border-2 sm:border-2 md:border-4 border-blue-400/70 rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-5 lg:p-6 backdrop-blur-sm shadow-xl sm:shadow-2xl transform hover:scale-105 transition-all duration-500 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            onClick={handleRestart}
            disabled={isRestarting || !room || !hostId || !quizId || !quizTitle}
          >
            {/* Card Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-purple-400/30 blur-lg sm:blur-xl group-hover:blur-xl sm:group-hover:blur-2xl transition-all duration-500 rounded-xl sm:rounded-2xl md:rounded-3xl"></div>
            
            {/* Icon */}
            <div className="relative z-10 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg group-hover:rotate-180 transition-transform duration-300">
              <RotateCw className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-0.5 -left-0.5 sm:-top-1 sm:-left-1 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-blue-400 border border-white sm:border-2 border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-purple-400 border border-white sm:border-2 border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  const { t } = useTranslation()
  
  return (
    <Suspense fallback={
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        {/* Fine Grid Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        
        {/* Soft Glowing Areas */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Upper-middle glow */}
          <div className="absolute top-20 right-1/4 w-96 h-96 opacity-40 animate-pulse">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30 blur-3xl"></div>
          </div>
          
          {/* Lower-right glow */}
          <div className="absolute bottom-20 right-20 w-80 h-80 opacity-35 animate-pulse" style={{ animationDelay: '1s' }}>
            <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-400/30 to-pink-400/30 blur-3xl"></div>
          </div>
          
          {/* Scattered Square Particles */}
          <PixelBackgroundElements />
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/40 to-amber-400/40 blur-2xl animate-pulse"></div>
              <div className="relative w-20 h-20 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full border-4 border-white shadow-2xl flex items-center justify-center mx-auto animate-bounce-slow">
                <Crown className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400 mb-4">LOADING LEADERBOARD...</h2>
            <p className="text-lg text-yellow-200 font-semibold">Preparing tournament results</p>
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

 