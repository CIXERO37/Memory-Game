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
  quizId?: string
  quizTitle?: string
}

function formatPlayerName(nickname: string): string {
  const words = nickname.trim().split(/\s+/)
  if (words.length >= 2) {
    return words.slice(0, 2).join('\n')
  } else {
    return nickname
  }
}

function LeaderboardHostPageContent() {
  const { t } = useTranslation()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [playersWithCorrectAvatars, setPlayersWithCorrectAvatars] = useState<Player[]>([])
  const [hostId, setHostId] = useState<string | null>(null)
  const [isRestarting, setIsRestarting] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  // roomCode can come from query or from host session/localStorage
  const roomCodeFromQuery = searchParams.get("roomCode")
  const [roomCode, setRoomCode] = useState<string | null>(roomCodeFromQuery)
  const [resolvingCode, setResolvingCode] = useState(true)

  useEffect(() => {
    if (roomCodeFromQuery) {
      setRoomCode(roomCodeFromQuery)
      setResolvingCode(false)
      return
    }
    const loadFromSession = async () => {
      try {
        const sessionId = sessionManager.getSessionIdFromStorage()
        if (sessionId) {
          const sessionData = await sessionManager.getSessionData(sessionId).catch(() => null)
          if (sessionData && sessionData.user_type === 'host') {
            const code = sessionData.user_data?.roomCode || sessionData.room_code
            if (code) {
              setRoomCode(code)
              setResolvingCode(false)
              return
            }
          }
        }
      } catch { }
      try {
        const hostData = localStorage.getItem("currentHost")
        if (hostData) {
          const parsed = JSON.parse(hostData)
          if (parsed?.roomCode) {
            setRoomCode(parsed.roomCode)
            setResolvingCode(false)
            return
          }
        }
      } catch { }
      setResolvingCode(false)
    }
    loadFromSession()
  }, [roomCodeFromQuery])

  useEffect(() => {
    if (!roomCode && !resolvingCode) {
      router.push("/")
      return
    }

    const fetchRoom = async () => {
      try {
        const roomData = roomCode ? await roomManager.getRoom(roomCode) : null
        if (roomData) {
          setRoom(roomData)
          setHostId(roomData.hostId)

          const playersWithAvatars = await Promise.all(
            roomData.players.filter(p => !p.isHost).map(async (player) => {
              try {
                const sessionData = await sessionManager.getSessionByRoom(roomData.code, 'player')
                if (sessionData && sessionData.user_data && sessionData.user_data.id === player.id) {
                  return {
                    ...player,
                    avatar: sessionData.user_data.avatar || player.avatar
                  }
                }
                return player
              } catch (error) {
                return player
              }
            })
          )
          setPlayersWithCorrectAvatars(playersWithAvatars)
        } else if (!resolvingCode) {
          router.push("/")
        }
      } catch (error) {
        if (!resolvingCode) {
          router.push("/")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRoom()
  }, [roomCode, resolvingCode, router])

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-1/4 w-96 h-96 opacity-40 animate-pulse">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30 blur-3xl"></div>
          </div>
          <div className="absolute bottom-20 right-20 w-80 h-80 opacity-35 animate-pulse" style={{ animationDelay: '1s' }}>
            <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-400/30 to-pink-400/30 blur-3xl"></div>
          </div>
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
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-1/4 w-96 h-96 opacity-40 animate-pulse">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30 blur-3xl"></div>
          </div>
          <div className="absolute bottom-20 right-20 w-80 h-80 opacity-35 animate-pulse" style={{ animationDelay: '1s' }}>
            <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-400/30 to-pink-400/30 blur-3xl"></div>
          </div>
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

  const playersToUse = playersWithCorrectAvatars.length > 0 ? playersWithCorrectAvatars : (room?.players.filter(p => !p.isHost) || [])
  const sortedPlayers = [...playersToUse]
    .sort((a, b) => {
      const aTotal = a.quizScore || 0
      const bTotal = b.quizScore || 0
      return bTotal - aTotal
    })

  const champion = sortedPlayers[0]

  const handleRestart = async () => {
    if (!room || !hostId || !room.quizId || !room.quizTitle || isRestarting) {
      return
    }
    setIsRestarting(true)
    try {
      const newRoom = await roomManager.createRoom(
        hostId,
        {
          questionCount: room.settings.questionCount,
          totalTimeLimit: room.settings.totalTimeLimit,
        },
        room.quizId,
        room.quizTitle
      )
      if (!newRoom) {
        setIsRestarting(false)
        return
      }
      const verifyRoom = await roomManager.getRoom(newRoom.code)
      if (!verifyRoom) {
        setIsRestarting(false)
        return
      }
      try {
        await sessionManager.createOrUpdateSession(
          null,
          'host',
          {
            id: hostId,
            roomCode: newRoom.code,
            quizId: room.quizId,
          },
          newRoom.code
        )
      } catch { }
      try {
        localStorage.setItem('hostId', hostId)
        localStorage.setItem('roomCode', newRoom.code)
        localStorage.setItem('quizId', room.quizId)
        localStorage.setItem('currentHost', JSON.stringify({
          hostId,
          roomCode: newRoom.code,
          quizId: room.quizId,
          isHost: true,
          timestamp: Date.now()
        }))
      } catch { }
      router.push(`/host/${newRoom.code}`)
    } catch (error) {
      setIsRestarting(false)
    }
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
      </div>

      {/* Fixed Home Button - Left Side */}
      <div
        className="hidden md:block"
        style={{
          position: 'fixed',
          left: '24px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 9999,
        }}
      >
        <button
          className="relative hover:scale-110 transition-all duration-200 group"
          onClick={() => {
            router.push("/")
          }}
          style={{
            imageRendering: 'pixelated',
          }}
        >
          <div
            className="w-14 h-14 flex items-center justify-center"
            style={{
              background: '#533483',
              border: '3px solid #3d2562',
              borderRadius: '4px',
              boxShadow: `
                inset -2px -2px 0px #6b4a9e,
                inset 2px 2px 0px #3d2562,
                0 0 0 2px #2a1a3d,
                4px 4px 0px rgba(0, 0, 0, 0.3)
              `,
              imageRendering: 'pixelated',
            }}
          >
            <Home className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
          </div>
        </button>
      </div>

      {/* Fixed Restart Button - Right Side */}
      <div
        className="hidden md:block"
        style={{
          position: 'fixed',
          right: '24px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 9999,
        }}
      >
        <button
          className="relative hover:scale-110 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          onClick={handleRestart}
          disabled={isRestarting || !room || !hostId || !room.quizId || !room.quizTitle}
          style={{
            imageRendering: 'pixelated',
          }}
        >
          <div
            className="w-14 h-14 flex items-center justify-center"
            style={{
              background: '#4a90e2',
              border: '3px solid #2c5f8d',
              borderRadius: '4px',
              boxShadow: `
                inset -2px -2px 0px #6ba3e8,
                inset 2px 2px 0px #2c5f8d,
                0 0 0 2px #1a3d5f,
                4px 4px 0px rgba(0, 0, 0, 0.3)
              `,
              imageRendering: 'pixelated',
            }}
          >
            <RotateCw className="w-6 h-6 text-white group-hover:rotate-180 transition-transform duration-300" />
          </div>
        </button>
      </div>

      {/* Top-left Memory Quiz Logo */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8 z-20">
        <img
          draggable={false}
          src="/images/memoryquizv4.webp"
          alt="Memory Quiz"
          className="h-8 sm:h-12 md:h-16 lg:h-20 xl:h-24 w-auto object-contain drop-shadow-lg"
        />
      </div>
      {/* Top-right GameForSmart Logo */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 z-20">
        <img
          src="/images/gameforsmartlogo.webp"
          alt="GameForSmart Logo"
          className="h-8 sm:h-12 md:h-16 lg:h-20 xl:h-24 w-auto object-contain drop-shadow-lg"
        />
      </div>
      <div className="relative z-10 container mx-auto px-4 py-8 mt-16 sm:mt-20 md:mt-24 lg:mt-28">
        <div className="text-center mb-6 hidden md:block">
          <div className="relative inline-block mb-4">
            <div className="flex items-center justify-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400/50 blur-lg animate-pulse"></div>
                <div className="relative w-16 h-16 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full border-4 border-white shadow-2xl flex items-center justify-center mx-auto animate-bounce-slow">
                  <Crown className="w-8 h-8 text-white" />
                </div>
              </div>
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

        {/* Mobile Leaderboard View */}
        <div className="md:hidden w-full max-w-md mx-auto pb-24 relative z-0">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 drop-shadow-2xl">
              {t('lobby.champions')}
            </h1>
          </div>
          <div className="space-y-3 relative z-10">
            {sortedPlayers.map((player, index) => {
              const rank = index + 1
              let rankColor = "text-white"
              if (rank === 1) rankColor = "text-yellow-400"
              if (rank === 2) rankColor = "text-gray-300"
              if (rank === 3) rankColor = "text-orange-400"

              return (
                <div key={player.id} className="flex items-center justify-between bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-600/50 rounded-lg px-4 py-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <span className={`text-xl font-black ${rankColor} drop-shadow-md w-8`}>#{rank}</span>
                    <span className="text-white font-bold text-lg truncate max-w-[150px] tracking-wide" style={{ textShadow: '1px 1px 0 #000' }}>
                      {player.nickname}
                    </span>
                  </div>
                  <span className="text-cyan-400 font-black text-xl drop-shadow-md">{player.quizScore || 0}</span>
                </div>
              )
            })}
          </div>

          {/* Mobile Bottom Buttons */}
          <div className="fixed bottom-6 left-0 right-0 px-6 flex gap-4 justify-center z-50">
            <button
              onClick={() => router.push("/")}
              className="flex-1 py-3 flex items-center justify-center group transition-transform active:scale-95"
              style={{
                background: '#533483',
                border: '3px solid #3d2562',
                borderRadius: '4px',
                boxShadow: `
                  inset -2px -2px 0px #6b4a9e,
                  inset 2px 2px 0px #3d2562,
                  0 0 0 2px #2a1a3d,
                  4px 4px 0px rgba(0, 0, 0, 0.3)
                `,
                imageRendering: 'pixelated',
              }}
            >
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-white" />
                <span className="text-white font-bold uppercase tracking-wider text-sm">Home</span>
              </div>
            </button>
            <button
              onClick={handleRestart}
              disabled={isRestarting || !room || !hostId || !room.quizId || !room.quizTitle}
              className="flex-1 py-3 flex items-center justify-center group transition-transform active:scale-95 disabled:opacity-50 disabled:grayscale"
              style={{
                background: '#4a90e2',
                border: '3px solid #2c5f8d',
                borderRadius: '4px',
                boxShadow: `
                  inset -2px -2px 0px #6ba3e8,
                  inset 2px 2px 0px #2c5f8d,
                  0 0 0 2px #1a3d5f,
                  4px 4px 0px rgba(0, 0, 0, 0.3)
                `,
                imageRendering: 'pixelated',
              }}
            >
              <div className="flex items-center gap-2">
                <RotateCw className="w-5 h-5 text-white group-hover:rotate-180 transition-transform duration-300" />
                <span className="text-white font-bold uppercase tracking-wider text-sm">Restart</span>
              </div>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mb-16 hidden md:block">
          <div className="relative">
            <div className="flex justify-center items-center gap-6 sm:gap-12 relative">
              {sortedPlayers[1] && (
                <div className="flex flex-col items-center relative group self-end mb-8">
                  <div className="relative transform group-hover:scale-105 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-400/30 to-slate-600/30 blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    <div className="relative bg-gradient-to-br from-slate-500/40 to-slate-700/40 border-4 border-slate-400/70 rounded-3xl p-8 backdrop-blur-sm shadow-2xl min-w-[280px]">
                      <div className="absolute top-4 right-4 w-10 h-10 bg-gradient-to-br from-slate-300 to-slate-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                        <span className="text-lg font-bold text-white">2</span>
                      </div>
                      <div className="w-24 h-24 rounded-full border-4 border-slate-400 overflow-hidden mx-auto mb-6 shadow-2xl">
                        <div className="absolute inset-0 bg-slate-400/40 rounded-full blur-sm"></div>
                        {/^https?:\/\//.test(sortedPlayers[1].avatar) ? (
                          <RobustGoogleAvatar
                            avatarUrl={sortedPlayers[1].avatar}
                            alt={`${sortedPlayers[1].nickname}'s avatar`}
                            width={96}
                            height={96}
                            className="w-full h-full relative z-10"
                          />
                        ) : (
                          <img
                            src={sortedPlayers[1].avatar}
                            alt={`${sortedPlayers[1].nickname}'s avatar`}
                            className="w-full h-full object-cover relative z-10"
                            onError={(e) => {
                              e.currentTarget.src = "/ava1.webp"
                            }}
                          />
                        )}
                      </div>
                      <h3 className="text-2xl font-bold text-slate-200 mb-6 text-center whitespace-pre-line">{formatPlayerName(sortedPlayers[1].nickname)}</h3>
                      <div className="bg-gradient-to-r from-slate-400 to-slate-600 rounded-2xl px-8 py-6 shadow-2xl">
                        <div className="text-5xl font-bold text-white text-center">{sortedPlayers[1].quizScore || 0}</div>
                        <div className="text-lg text-black text-center font-bold" style={{ textShadow: '1px 1px 0px #fff, -1px -1px 0px #fff, 1px -1px 0px #fff, -1px 1px 0px #fff' }}>{t('lobby.points')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {champion && (
                <div className="flex flex-col items-center relative z-20 group -mt-8">
                  <div className="relative transform group-hover:scale-[1.02] transition-all duration-300">
                    {/* Subtle glow effect */}
                    <div className="absolute -inset-4 bg-gradient-to-br from-yellow-400/30 via-amber-400/20 to-yellow-500/30 rounded-3xl blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>

                    {/* Main card */}
                    <div className="relative bg-gradient-to-b from-yellow-300 via-yellow-200 to-yellow-400 rounded-3xl p-12 shadow-[0_25px_70px_rgba(251,191,36,0.5)] min-w-[360px] border-4 border-yellow-100/70">
                      {/* Top-left sparkle decoration */}
                      <div className="absolute top-6 left-6 opacity-60">
                        <Sparkles className="w-5 h-5 text-yellow-600" />
                      </div>

                      {/* Rank badge with star */}
                      <div className="absolute top-6 right-6 flex items-start justify-center gap-0">
                        <Star className="w-5 h-5 text-yellow-600 -mt-1.5 -mr-1 z-10" fill="currentColor" />
                        <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full border-3 border-white shadow-lg flex items-center justify-center relative">
                          <span className="text-2xl font-bold text-white">1</span>
                        </div>
                      </div>

                      {/* Profile picture */}
                      <div className="relative w-36 h-36 mx-auto mb-6">
                        <div className="w-full h-full rounded-full bg-white p-2 shadow-2xl border-4 border-yellow-100">
                          <div className="w-full h-full rounded-full overflow-hidden bg-white">
                            {/^https?:\/\//.test(champion.avatar) ? (
                              <RobustGoogleAvatar
                                avatarUrl={champion.avatar}
                                alt={`${champion.nickname}'s avatar`}
                                width={128}
                                height={128}
                                className="w-full h-full relative z-10"
                              />
                            ) : (
                              <img
                                src={champion.avatar}
                                alt={`${champion.nickname}'s avatar`}
                                className="w-full h-full object-cover relative z-10"
                                onError={(e) => {
                                  e.currentTarget.src = "/ava1.webp"
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Player name */}
                      <h2 className="text-2xl font-bold text-gray-900 mb-1 text-center whitespace-pre-line leading-tight">
                        {formatPlayerName(champion.nickname)}
                      </h2>

                      {/* Points display box */}
                      <div className="mt-8 bg-gradient-to-br from-amber-600 to-yellow-700 rounded-2xl px-10 py-7 shadow-lg border-2 border-amber-700/40">
                        <div className="text-5xl font-bold text-white text-center mb-1 leading-none">
                          {champion.quizScore || 0}
                        </div>
                        <div className="text-lg text-white text-center font-bold tracking-wide uppercase">
                          {t('lobby.points')}
                        </div>
                      </div>

                      {/* Bottom decorations */}
                      <div className="absolute bottom-6 left-6 opacity-50">
                        <Zap className="w-5 h-5 text-yellow-700" />
                      </div>
                      <div className="absolute bottom-6 right-6 opacity-50">
                        <Award className="w-5 h-5 text-amber-700" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {sortedPlayers[2] && (
                <div className="flex flex-col items-center relative group self-end mb-8">
                  <div className="relative transform group-hover:scale-105 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-orange-600/30 blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    <div className="relative bg-gradient-to-br from-amber-600/40 to-orange-700/40 border-4 border-amber-500/70 rounded-3xl p-8 backdrop-blur-sm shadow-2xl min-w-[280px]">
                      <div className="absolute top-4 right-4 w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                        <span className="text-lg font-bold text-white">3</span>
                      </div>
                      <div className="w-24 h-24 rounded-full border-4 border-amber-500 overflow-hidden mx-auto mb-6 shadow-2xl">
                        <div className="absolute inset-0 bg-amber-500/40 rounded-full blur-sm"></div>
                        {/^https?:\/\//.test(sortedPlayers[2].avatar) ? (
                          <RobustGoogleAvatar
                            avatarUrl={sortedPlayers[2].avatar}
                            alt={`${sortedPlayers[2].nickname}'s avatar`}
                            width={96}
                            height={96}
                            className="w-full h-full relative z-10"
                          />
                        ) : (
                          <img
                            src={sortedPlayers[2].avatar}
                            alt={`${sortedPlayers[2].nickname}'s avatar`}
                            className="w-full h-full object-cover relative z-10"
                            onError={(e) => {
                              e.currentTarget.src = "/ava1.webp"
                            }}
                          />
                        )}
                      </div>
                      <h3 className="text-2xl font-bold text-amber-200 mb-6 text-center whitespace-pre-line">{formatPlayerName(sortedPlayers[2].nickname)}</h3>
                      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl px-8 py-6 shadow-2xl">
                        <div className="text-5xl font-bold text-white text-center">{sortedPlayers[2].quizScore || 0}</div>
                        <div className="text-lg text-black text-center font-bold" style={{ textShadow: '1px 1px 0px #fff, -1px -1px 0px #fff, 1px -1px 0px #fff, -1px 1px 0px #fff' }}>{t('lobby.points')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="absolute inset-0 pointer-events-none"></div>
          </div>
        </div>

        {sortedPlayers.length > 3 && (
          <div className="max-w-6xl mx-auto mb-16 hidden md:block">
            <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-4 border-indigo-400/40 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-3xl blur-xl"></div>
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
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {sortedPlayers.slice(3).map((player, index) => {
                  const totalScore = player.quizScore || 0
                  const rank = index + 4
                  return (
                    <div key={player.id} className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-lg blur-md group-hover:blur-lg transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                      <div className="relative bg-gradient-to-r from-slate-800/60 to-slate-900/60 rounded-lg p-3 border border-slate-600/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-indigo-400/60">
                        <div className="grid grid-cols-[auto_48px_1fr_auto] items-center gap-2">
                          {/* Rank - fixed width */}
                          <div className="text-yellow-400 font-bold text-base w-8 text-center flex-shrink-0">
                            #{rank}
                          </div>
                          {/* Avatar - fixed size */}
                          <div className="w-12 h-12 rounded-full border-2 border-slate-400 overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-300 flex-shrink-0 relative">
                            <div className="absolute inset-0 bg-indigo-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            {/^https?:\/\//.test(player.avatar) ? (
                              <RobustGoogleAvatar
                                avatarUrl={player.avatar}
                                alt={`${player.nickname}'s avatar`}
                                width={48}
                                height={48}
                                className="w-full h-full relative z-10"
                              />
                            ) : (
                              <img
                                src={player.avatar}
                                alt={`${player.nickname}'s avatar`}
                                className="w-full h-full object-cover relative z-10"
                                onError={(e) => {
                                  e.currentTarget.src = "/ava1.webp"
                                }}
                              />
                            )}
                          </div>
                          {/* Name - truncate to prevent overlap */}
                          <div className="min-w-0 overflow-hidden">
                            <h4 className="font-bold text-sm text-white group-hover:text-indigo-200 transition-colors duration-300 truncate" title={player.nickname}>{player.nickname}</h4>
                          </div>
                          {/* Points card - fixed width */}
                          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg px-2 py-1.5 shadow-sm group-hover:scale-105 transition-transform duration-300 flex-shrink-0 min-w-[60px]">
                            <div className="text-center">
                              <div className="text-base font-bold text-white leading-tight">{totalScore}</div>
                              <div className="text-[10px] text-white/90 font-semibold uppercase tracking-wide">{t('lobby.points')}</div>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-1 left-1 w-1 h-1 bg-indigo-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute bottom-1 right-1 w-1 h-1 bg-purple-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-indigo-400/50 rounded-tl-xl"></div>
              <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-indigo-400/50 rounded-tr-xl"></div>
              <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-indigo-400/50 rounded-bl-xl"></div>
              <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-indigo-400/50 rounded-br-xl"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LeaderboardHostPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-1/4 w-96 h-96 opacity-40 animate-pulse">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30 blur-3xl"></div>
          </div>
          <div className="absolute bottom-20 right-20 w-80 h-80 opacity-35 animate-pulse" style={{ animationDelay: '1s' }}>
            <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-400/30 to-pink-400/30 blur-3xl"></div>
          </div>
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
      <LeaderboardHostPageContent />
    </Suspense>
  )
}

function PixelBackgroundElements() {
  return (
    <>
      <div className="absolute top-20 left-10 w-4 h-4 bg-blue-400 animate-float opacity-60"></div>
      <div className="absolute top-40 right-20 w-3 h-3 bg-purple-400 animate-float-delayed opacity-70"></div>
      <div className="absolute bottom-32 left-1/4 w-5 h-5 bg-cyan-400 animate-float-slow opacity-50"></div>
      <div className="absolute bottom-20 right-1/3 w-3 h-3 bg-pink-400 animate-float-delayed-slow opacity-60"></div>
      <div className="absolute top-1/2 left-20 w-4 h-4 bg-green-400 animate-float opacity-40"></div>
      <div className="absolute top-1/3 right-40 w-3 h-3 bg-yellow-400 animate-float-delayed opacity-55"></div>
      <div className="absolute top-60 left-1/3 w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-400 animate-pixel-float opacity-30"></div>
      <div className="absolute bottom-40 right-20 w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-400 animate-pixel-block-float opacity-25"></div>
      <div className="absolute top-80 right-1/2 w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 animate-pixel-float-delayed opacity-35"></div>
      <div className="absolute top-0 left-1/4 w-2 h-2 bg-blue-400 animate-falling opacity-40"></div>
      <div className="absolute top-0 right-1/3 w-2 h-2 bg-purple-400 animate-falling-delayed opacity-30"></div>
      <div className="absolute top-0 left-2/3 w-2 h-2 bg-cyan-400 animate-falling-slow opacity-35"></div>
    </>
  )
}


