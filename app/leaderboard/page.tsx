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
        {/* Mobile Layout - Horizontal with MEMORY QUIZ, CHAMPIONS, and Logo */}
        <div className="flex flex-row justify-between items-center mb-8 relative z-30 gap-2 sm:hidden">
          {/* MEMORY QUIZ Title - Mobile Left */}
          <div className="relative">
            <div className="relative inline-block">
              {/* Pixel Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 blur-lg animate-pulse"></div>
              
              <div className="relative bg-gradient-to-br from-blue-500/20 to-purple-600/20 border-2 border-blue-400/50 backdrop-blur-sm z-30 pixel-card">
                <h2 className="text-xs font-bold text-white tracking-wider uppercase drop-shadow-lg px-2 py-1.5">
                  MEMORY QUIZ
                </h2>
                
                {/* Pixel Decorative Elements */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-blue-400/60 animate-ping pixel-dot"></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-purple-400/60 animate-ping pixel-dot" style={{ animationDelay: '0.7s' }}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-cyan-400/60 animate-ping pixel-dot" style={{ animationDelay: '1.4s' }}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-blue-300/60 animate-ping pixel-dot" style={{ animationDelay: '2.1s' }}></div>
              </div>
            </div>
          </div>

          {/* CHAMPIONS Card - Mobile Center */}
          <div className="relative">
            <div className="relative inline-block">
              {/* Pixel Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-amber-400/30 blur-lg animate-pulse"></div>
              
              <div className="relative bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-2 border-yellow-400/50 backdrop-blur-sm z-30 pixel-card">
                <div className="flex items-center justify-center gap-1 mb-1 px-2 py-2">
                  {/* Pixel Trophy Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400/50 blur-sm animate-pulse"></div>
                    <div className="relative w-6 h-6 bg-gradient-to-r from-yellow-400 to-amber-500 border-2 border-white shadow-lg flex items-center justify-center pixel-icon animate-bounce-slow">
                      <Trophy className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  
                  {/* Title */}
                  <div className="relative">
                    <h1 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400 pixel-text drop-shadow-lg">
                      CHAMPIONS
                    </h1>
                    <div className="absolute inset-0 text-sm font-bold text-yellow-400/20 pixel-text blur-sm">
                      CHAMPIONS
                    </div>
                  </div>
                </div>
                
                {/* Pixel Decorative Elements */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-yellow-400/60 animate-ping pixel-dot"></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-amber-400/60 animate-ping pixel-dot" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-yellow-300/60 animate-ping pixel-dot" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-amber-300/60 animate-ping pixel-dot" style={{ animationDelay: '1.5s' }}></div>
              </div>
            </div>
          </div>

          {/* GameForSmart Logo - Mobile Right */}
          <div className="relative">
            <div className="relative inline-block">
              {/* Pixel Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/30 to-green-400/30 blur-lg animate-pulse"></div>
              
              <div className="relative bg-gradient-to-br from-orange-500/20 to-green-600/20 border-2 border-orange-400/50 backdrop-blur-sm z-30 pixel-card">
                <div className="px-1.5 py-1.5">
                  <img
                    src="/images/gameforsmartlogo.png"
                    alt="GameForSmart Logo"
                    className="h-6 w-auto object-contain pixel-image"
                  />
                </div>
                
                {/* Pixel Decorative Elements */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-orange-400/60 animate-ping pixel-dot"></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-green-400/60 animate-ping pixel-dot" style={{ animationDelay: '0.7s' }}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-yellow-400/60 animate-ping pixel-dot" style={{ animationDelay: '1.4s' }}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-orange-300/60 animate-ping pixel-dot" style={{ animationDelay: '2.1s' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Three elements aligned horizontally */}
        <div className="hidden sm:flex flex-row items-center relative z-30 mb-12">
          {/* MEMORY QUIZ Title - Desktop Left */}
          <div className="relative flex-1 flex justify-start">
            <div className="relative inline-block">
              {/* Pixel Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 blur-xl animate-pulse"></div>
              
              <div className="relative bg-gradient-to-br from-blue-500/20 to-purple-600/20 border-4 border-blue-400/50 backdrop-blur-sm z-30 pixel-card-large">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-wider uppercase drop-shadow-lg px-4 py-3">
                  MEMORY QUIZ
                </h2>
                
                {/* Pixel Decorative Elements */}
                <div className="absolute top-2 left-2 w-2 h-2 bg-blue-400/60 animate-ping pixel-dot-large"></div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-purple-400/60 animate-ping pixel-dot-large" style={{ animationDelay: '0.7s' }}></div>
                <div className="absolute bottom-2 left-2 w-2 h-2 bg-cyan-400/60 animate-ping pixel-dot-large" style={{ animationDelay: '1.4s' }}></div>
                <div className="absolute bottom-2 right-2 w-2 h-2 bg-blue-300/60 animate-ping pixel-dot-large" style={{ animationDelay: '2.1s' }}></div>
              </div>
            </div>
          </div>

          {/* CHAMPIONS Card - Desktop Center */}
          <div className="relative flex-1 flex justify-center">
            <div className="relative inline-block">
              {/* Pixel Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-amber-400/30 blur-xl animate-pulse"></div>
              
              <div className="relative bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-4 border-yellow-400/50 backdrop-blur-sm z-30 pixel-card-large">
                <div className="flex items-center justify-center gap-4 mb-3 px-4 py-4">
                  {/* Pixel Trophy Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400/50 blur-lg animate-pulse"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-r from-yellow-400 to-amber-500 border-3 border-white shadow-2xl flex items-center justify-center pixel-icon-large animate-bounce-slow">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  {/* Title */}
                  <div className="relative">
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400 pixel-text-large drop-shadow-2xl">
                      CHAMPIONS
                    </h1>
                    <div className="absolute inset-0 text-4xl font-bold text-yellow-400/20 pixel-text-large blur-sm">
                      CHAMPIONS
                    </div>
                  </div>
                  
                  {/* Pixel Star Icons */}
                  <div className="flex flex-col gap-1">
                    <Star className="w-5 h-5 text-yellow-400 animate-pulse pixel-star" />
                    <Star className="w-3 h-3 text-amber-400 animate-pulse pixel-star" style={{ animationDelay: '0.5s' }} />
                  </div>
                </div>
                
                {/* Pixel Decorative Elements */}
                <div className="absolute top-2 left-2 w-3 h-3 bg-yellow-400/60 animate-ping pixel-dot-large"></div>
                <div className="absolute top-2 right-2 w-3 h-3 bg-amber-400/60 animate-ping pixel-dot-large" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-2 left-2 w-2 h-2 bg-yellow-300/60 animate-ping pixel-dot-large" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-2 right-2 w-2 h-2 bg-amber-300/60 animate-ping pixel-dot-large" style={{ animationDelay: '1.5s' }}></div>
              </div>
            </div>
          </div>

          {/* GameForSmart Logo - Desktop Right */}
          <div className="relative flex-1 flex justify-end">
            <div className="relative inline-block">
              {/* Pixel Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/30 to-green-400/30 blur-xl animate-pulse"></div>
              
              <div className="relative bg-gradient-to-br from-orange-500/20 to-green-600/20 border-4 border-orange-400/50 backdrop-blur-sm z-30 pixel-card-large">
                <div className="px-3 py-3">
                  <img
                    src="/images/gameforsmartlogo.png"
                    alt="GameForSmart Logo"
                    className="h-12 w-auto object-contain pixel-image-large"
                  />
                </div>
                
                {/* Pixel Decorative Elements */}
                <div className="absolute top-2 left-2 w-2 h-2 bg-orange-400/60 animate-ping pixel-dot-large"></div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-green-400/60 animate-ping pixel-dot-large" style={{ animationDelay: '0.7s' }}></div>
                <div className="absolute bottom-2 left-2 w-2 h-2 bg-yellow-400/60 animate-ping pixel-dot-large" style={{ animationDelay: '1.4s' }}></div>
                <div className="absolute bottom-2 right-2 w-2 h-2 bg-orange-300/60 animate-ping pixel-dot-large" style={{ animationDelay: '2.1s' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Podium - Top 3 Players */}
        <div className="max-w-6xl mx-auto mb-12 mt-8">
            {/* Podium Platform */}
            <div className="relative">
              {/* Podium Base */}
              <div className="flex justify-center items-end gap-4 sm:gap-8 relative">
              
              {/* 2nd Place Platform */}
              {sortedPlayers[1] && (
                <div className="flex flex-col items-center relative mt-8">
                  
                  {/* 2nd Place Card */}
                  <div className="bg-gradient-to-br from-slate-600/30 to-slate-800/30 border-4 border-slate-400/60 rounded-2xl p-6 pixel-lobby-card text-center relative w-56 hover:scale-105 transition-all duration-500 backdrop-blur-sm">
                    {/* Ranking Number */}
                    <div className="absolute top-3 left-3 w-8 h-8 bg-gradient-to-br from-slate-300 to-slate-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center z-20">
                      <span className="text-lg font-bold text-white">2</span>
                    </div>
                    
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-400/20 to-slate-600/20 rounded-2xl blur-xl"></div>
                    
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-full border-4 border-slate-400 overflow-hidden mx-auto mb-4 relative z-10 shadow-xl">
                      <div className="absolute inset-0 bg-slate-400/40 rounded-full blur-sm"></div>
                      <img
                        src={sortedPlayers[1].avatar}
                        alt={`${sortedPlayers[1].username}'s avatar`}
                        className="w-full h-full object-cover relative z-10"
                        onError={(e) => {
                          e.currentTarget.src = "/ava1.png"
                        }}
                      />
                    </div>
                    
                    {/* Name */}
                    <h3 className="text-xl font-bold text-slate-200 mb-4 relative z-10">{sortedPlayers[1].username}</h3>
                    
                    {/* Score */}
                    <div className="bg-gradient-to-r from-slate-400 to-slate-600 rounded-xl px-6 py-3 relative z-10 shadow-lg">
                      <div className="absolute inset-0 bg-slate-400/30 rounded-xl blur-sm"></div>
                      <div className="text-3xl font-bold text-white relative z-10">{(sortedPlayers[1].quizScore || 0) + (sortedPlayers[1].memoryScore || 0)}</div>
                      <div className="text-sm text-slate-100 relative z-10 font-bold">POINTS</div>
                    </div>
                    
                  </div>
                </div>
              )}

              {/* 1st Place Platform - Champion */}
              {champion && (
                <div className="flex flex-col items-center relative z-10 mt-0">
                  
                  {/* Champion Card */}
                  <div className="bg-gradient-to-br from-yellow-500/30 to-amber-600/30 border-4 border-yellow-400/70 pixel-lobby-card text-center relative w-80 hover:scale-105 transition-all duration-500 backdrop-blur-sm animate-pulse pixel-card-champion">
                    {/* Ranking Number */}
                    <div className="absolute top-3 left-3 w-10 h-10 bg-gradient-to-br from-yellow-300 to-amber-500 border-2 border-white shadow-xl flex items-center justify-center z-20 pixel-rank-badge">
                      <span className="text-xl font-bold text-white">1</span>
                    </div>
                    
                    {/* Champion Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-amber-400/30 blur-2xl animate-pulse"></div>
                    
                    {/* Champion Avatar with Enhanced Glow */}
                    <div className="w-24 h-24 border-4 border-yellow-400 overflow-hidden mx-auto mb-6 relative z-10 shadow-2xl pixel-avatar-large">
                      <div className="absolute inset-0 bg-yellow-400/50 blur-lg animate-pulse"></div>
                      <img
                        src={champion.avatar}
                        alt={`${champion.username}'s avatar`}
                        className="w-full h-full object-cover relative z-10 pixel-image-avatar"
                        onError={(e) => {
                          e.currentTarget.src = "/ava1.png"
                        }}
                      />
                    </div>
                    
                    {/* Champion Name */}
                    <h2 className="text-2xl font-bold text-yellow-300 mb-6 relative z-10 pixel-text-champion">{champion.username}</h2>
                    
                    {/* Champion Score with Enhanced Glow */}
                    <div className="bg-gradient-to-r from-yellow-400 to-amber-500 px-8 py-4 relative z-10 shadow-2xl pixel-score-card">
                      <div className="absolute inset-0 bg-yellow-400/40 blur-lg animate-pulse"></div>
                      <div className="text-4xl font-bold text-white relative z-10 pixel-score-text">{(champion.quizScore || 0) + (champion.memoryScore || 0)}</div>
                      <div className="text-sm text-yellow-100 relative z-10 font-bold pixel-points-text">POINTS</div>
                    </div>
                    
                  </div>
                </div>
              )}

              {/* 3rd Place Platform */}
              {sortedPlayers[2] && (
                <div className="flex flex-col items-center relative mt-16">
                  
                  {/* 3rd Place Card */}
                  <div className="bg-gradient-to-br from-amber-700/30 to-orange-800/30 border-4 border-amber-600/60 rounded-2xl p-6 pixel-lobby-card text-center relative w-56 hover:scale-105 transition-all duration-500 backdrop-blur-sm">
                    {/* Ranking Number */}
                    <div className="absolute top-3 left-3 w-8 h-8 bg-gradient-to-br from-amber-600 to-orange-700 rounded-full border-2 border-white shadow-lg flex items-center justify-center z-20">
                      <span className="text-lg font-bold text-white">3</span>
                    </div>
                    
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-orange-600/20 rounded-2xl blur-xl"></div>
                    
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-full border-4 border-amber-600 overflow-hidden mx-auto mb-4 relative z-10 shadow-xl">
                      <div className="absolute inset-0 bg-amber-600/40 rounded-full blur-sm"></div>
                      <img
                        src={sortedPlayers[2].avatar}
                        alt={`${sortedPlayers[2].username}'s avatar`}
                        className="w-full h-full object-cover relative z-10"
                        onError={(e) => {
                          e.currentTarget.src = "/ava1.png"
                        }}
                      />
                    </div>
                    
                    {/* Name */}
                    <h3 className="text-xl font-bold text-amber-200 mb-4 relative z-10">{sortedPlayers[2].username}</h3>
                    
                    {/* Score */}
                    <div className="bg-gradient-to-r from-amber-600 to-orange-700 rounded-xl px-6 py-3 relative z-10 shadow-lg">
                      <div className="absolute inset-0 bg-amber-600/30 rounded-xl blur-sm"></div>
                      <div className="text-3xl font-bold text-white relative z-10">{(sortedPlayers[2].quizScore || 0) + (sortedPlayers[2].memoryScore || 0)}</div>
                      <div className="text-sm text-amber-100 relative z-10 font-bold">POINTS</div>
                    </div>
                    
                  </div>
                </div>
              )}
            </div>
            
            {/* Confetti Effect */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-10 left-1/4 w-2 h-2 bg-yellow-400 animate-falling opacity-70"></div>
              <div className="absolute top-0 left-1/3 w-2 h-2 bg-blue-400 animate-falling-delayed opacity-60"></div>
              <div className="absolute top-5 right-1/4 w-2 h-2 bg-purple-400 animate-falling-slow opacity-80"></div>
              <div className="absolute top-0 right-1/3 w-2 h-2 bg-green-400 animate-falling opacity-50"></div>
              <div className="absolute top-8 left-1/2 w-2 h-2 bg-pink-400 animate-falling-delayed opacity-70"></div>
            </div>
          </div>
        </div>

         {/* Enhanced Other Participants Section */}
         {sortedPlayers.length > 3 && (
           <div className="max-w-4xl mx-auto mb-12">
             <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-4 border-indigo-400/50 rounded-2xl p-8 pixel-lobby-card backdrop-blur-sm relative overflow-hidden">
               {/* Background Glow */}
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-2xl blur-xl"></div>
               
               {/* Header */}
               <div className="relative z-10 text-center mb-8">
                 <div className="flex items-center justify-center gap-3 mb-4">
                   <div className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-lg border-2 border-white shadow-xl flex items-center justify-center pixel-brain">
                     <Users className="w-6 h-6 text-white" />
                   </div>
                   <h3 className="text-2xl font-bold text-white pixel-header-title">OTHER PARTICIPANTS</h3>
                 </div>
               </div>
               
               {/* Participants Grid */}
               <div className="relative z-10 grid gap-4">
                 {sortedPlayers.slice(3).map((player, index) => {
                   const totalScore = (player.quizScore || 0) + (player.memoryScore || 0)
                   const rank = index + 4 // Start from rank 4
                   
                   return (
                     <div key={player.id} className="group flex items-center gap-6 p-6 bg-gradient-to-r from-slate-800/40 to-slate-900/40 rounded-xl border-2 border-slate-600/50 hover:border-indigo-400/60 transition-all duration-500 hover:scale-[1.02] backdrop-blur-sm relative overflow-hidden">
                       {/* Hover Glow Effect */}
                       <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/5 to-purple-400/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                       
                       {/* Rank Badge */}
                       <div className="relative z-10 w-16 h-16 rounded-xl border-3 border-indigo-400 flex items-center justify-center font-bold text-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                         #{rank}
                       </div>
                       
                       {/* Avatar */}
                       <div className="relative z-10 w-16 h-16 rounded-xl border-3 border-slate-400 overflow-hidden shadow-lg group-hover:scale-110 transition-transform duration-300">
                         <div className="absolute inset-0 bg-indigo-400/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                         <img
                           src={player.avatar}
                           alt={`${player.username}'s avatar`}
                           className="w-full h-full object-cover relative z-10"
                           onError={(e) => {
                             e.currentTarget.src = "/ava1.png"
                           }}
                         />
                       </div>
                       
                       {/* Player Info */}
                       <div className="relative z-10 flex-1">
                         <h4 className="font-bold text-xl text-white group-hover:text-indigo-200 transition-colors duration-300">{player.username}</h4>
                         <p className="text-slate-400 text-sm mt-1">Participant</p>
                       </div>
                       
                       {/* Score Display */}
                       <div className="relative z-10 text-right">
                         <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg px-4 py-2 shadow-lg group-hover:scale-110 transition-transform duration-300">
                           <div className="text-2xl font-bold text-white">{totalScore}</div>
                           <div className="text-xs text-indigo-100 font-bold">POINTS</div>
                         </div>
                       </div>
                       
                       {/* Decorative Elements */}
                       <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                       <div className="absolute bottom-2 left-2 w-2 h-2 bg-purple-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                     </div>
                   )
                 })}
               </div>
               
               {/* Decorative Border Elements */}
               <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-indigo-400/50 rounded-tl-lg"></div>
               <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-indigo-400/50 rounded-tr-lg"></div>
               <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-indigo-400/50 rounded-bl-lg"></div>
               <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-indigo-400/50 rounded-br-lg"></div>
             </div>
           </div>
         )}

        {/* Enhanced Back to Dashboard Button */}
        <div className="text-center relative">
          <div className="relative inline-block">
            {/* Button Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-xl opacity-50 animate-pulse"></div>
            
            <button
              className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 border-4 border-white/40 px-10 py-5 text-white font-bold text-xl transition-all duration-500 hover:scale-110 hover:shadow-2xl pixel-button flex items-center justify-center gap-4 backdrop-blur-sm group overflow-hidden"
              onClick={() => {
                router.push("/")
              }}
            >
              {/* Button Background Animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Icon */}
              <div className="relative z-10 w-8 h-8 bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 pixel-icon">
                <Home className="w-5 h-5" />
              </div>
              
              {/* Text */}
              <span className="relative z-10 pixel-text-large">BACK TO DASHBOARD</span>
              
              {/* Decorative Elements */}
              <div className="absolute top-2 right-2 w-2 h-2 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pixel-dot"></div>
              <div className="absolute bottom-2 left-2 w-2 h-2 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pixel-dot"></div>
            </button>
          </div>
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


// ikan
 