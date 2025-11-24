"use client"

import { useState, useEffect } from "react"
import { MemoryGame } from "@/components/memory-game"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Target } from "lucide-react"
import { roomManager } from "@/lib/room-manager"
import { useRoom } from "@/hooks/use-room"
import { sessionManager } from "@/lib/supabase-session-manager"
import { supabaseRoomManager } from "@/lib/supabase-room-manager"
import { useTranslation } from "react-i18next"

interface MemoryChallengePageProps {
  params: {
    roomCode: string
  }
}

export default function MemoryChallengePage({ params }: MemoryChallengePageProps) {
  const { t } = useTranslation()
  const [correctMatches, setCorrectMatches] = useState(0)
  const [gameCompleted, setGameCompleted] = useState(false)
  // Removed timer - memory game is now an obstacle without time pressure
  const [gameWon, setGameWon] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  
  console.log("[Memory Challenge] Component state:", { correctMatches, gameCompleted, gameWon, hasAccess, loading })
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [playerData, setPlayerData] = useState<any>(null)
  const { room } = useRoom(params.roomCode)

  // Load player data from session manager
  useEffect(() => {
    const loadPlayerData = async () => {
      try {
        const sessionId = sessionManager.getSessionIdFromStorage()
        if (sessionId) {
          const sessionData = await sessionManager.getSessionData(sessionId)
          if (sessionData && sessionData.user_type === 'player') {
            setPlayerId(sessionData.user_data.id)
            setPlayerData(sessionData.user_data)
            console.log("[Memory Challenge] Loaded player data from session:", sessionData.user_data)
          }
        }
        
        // Fallback to localStorage if session not found
        if (!playerId && typeof window !== 'undefined') {
          const player = localStorage.getItem("currentPlayer")
          if (player) {
            const playerInfo = JSON.parse(player)
            setPlayerId(playerInfo.id)
            setPlayerData(playerInfo)
            console.log("[Memory Challenge] Loaded player data from localStorage fallback:", playerInfo)
          }
        }
      } catch (error) {
        console.error("[Memory Challenge] Error loading player data:", error)
      }
    }

    loadPlayerData()
  }, [])

  // Monitor room status for game end
  useEffect(() => {
    if (room && room.status === "finished") {
      console.log("[Memory Challenge] Game finished, redirecting to result page...")
      // Redirect to result page for players
      window.location.href = `/result?roomCode=${params.roomCode}`
    }
  }, [room?.status, params.roomCode])

  // Aggressive polling for game end detection (fallback)
  useEffect(() => {
    if (params.roomCode) {
      const gameEndPolling = setInterval(async () => {
        try {
          const currentRoom = await roomManager.getRoom(params.roomCode)
          if (currentRoom && currentRoom.status === "finished") {
            console.log("[Memory Challenge] Game finished detected via aggressive polling - redirecting immediately...")
            clearInterval(gameEndPolling)
            window.location.href = `/result?roomCode=${params.roomCode}`
          }
        } catch (error) {
          console.error("[Memory Challenge] Error in game end polling:", error)
        }
      }, 1000) // Check every 1 second for game end

      return () => clearInterval(gameEndPolling)
    }
  }, [params.roomCode])

  // Listen for immediate game end broadcast
  useEffect(() => {
    if (params.roomCode) {
      const broadcastChannel = new BroadcastChannel(`game-end-${params.roomCode}`)
      
      broadcastChannel.onmessage = (event) => {
        if (event.data.type === 'game-ended') {
          console.log("[Memory Challenge] Game end broadcast received - redirecting immediately...")
          broadcastChannel.close()
          window.location.href = `/result?roomCode=${params.roomCode}`
        }
      }

      return () => {
        broadcastChannel.close()
      }
    }
  }, [params.roomCode])

  // Initialize progress from Supabase on component mount
  useEffect(() => {
    const loadProgress = async () => {
      if (!playerId) return
      
      try {
        // Always start memory game from 0 - don't load previous progress
        // This ensures each memory game session is fresh
        console.log("[Memory Challenge] Starting fresh memory game session")
        setCorrectMatches(0)
        
        // Clear any previous memory game progress
        localStorage.removeItem(`memory-progress-${params.roomCode}`)
        
        // Also clear from Supabase to ensure fresh start
        if (playerId) {
          try {
            await supabaseRoomManager.updateGameProgress(params.roomCode, playerId, {
              memoryProgress: {
                correct_matches: 0,
                last_updated: new Date().toISOString()
              }
            })
          } catch (error) {
            console.error("[Memory Challenge] Error clearing Supabase progress:", error)
          }
        }
      } catch (error) {
        console.error("[Memory Challenge] Error initializing fresh memory game:", error)
        // Fallback: just start from 0
        setCorrectMatches(0)
      }
    }

    loadProgress()
  }, [params.roomCode, playerId])

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // First check localStorage
        const quizProgress = localStorage.getItem(`quiz-progress-${params.roomCode}`)
        
        if (quizProgress) {
          const progressData = JSON.parse(quizProgress)
          if (progressData.correctAnswers >= 3) {
            console.log("[Memory Challenge] Access granted via localStorage:", progressData)
            setHasAccess(true)
            setLoading(false)
            return
          }
        }

        // If localStorage doesn't have the data, check Supabase
        if (playerId) {
          console.log("[Memory Challenge] Checking Supabase for quiz progress...")
          const supabaseProgress = await supabaseRoomManager.getPlayerGameProgress(params.roomCode, playerId)
          
          if (supabaseProgress && supabaseProgress.correct_answers >= 3) {
            console.log("[Memory Challenge] Access granted via Supabase:", supabaseProgress)
            setHasAccess(true)
            setLoading(false)
            return
          }
        }

        // If neither localStorage nor Supabase has valid progress, redirect to quiz
        console.log("[Memory Challenge] No valid progress found, redirecting to quiz")
        window.location.href = `/game/${params.roomCode}/quiz`
        return

      } catch (error) {
        console.error("[Memory Challenge] Error checking access:", error)
        // On error, redirect to quiz as fallback
        window.location.href = `/game/${params.roomCode}/quiz`
        return
      }
    }

    // Only check access after playerId is loaded
    if (playerId !== null) {
      checkAccess()
    }
  }, [params.roomCode, playerId])

  // Removed timer countdown - memory game is now an obstacle without time pressure

  // Completion logic is now handled in handleCorrectMatch to avoid race conditions

  const handleGameEnd = async () => {
    // Memory game is now just an obstacle - no scoring system
    // No points awarded for completing memory challenge

    // Store return data for quiz page (without score)
    const quizProgress = localStorage.getItem(`quiz-progress-${params.roomCode}`)
    const progressData = quizProgress ? JSON.parse(quizProgress) : {}

    localStorage.setItem(
      `memory-return-${params.roomCode}`,
      JSON.stringify({
        score: 0, // No score from memory game
        resumeQuestion: progressData.currentQuestion || 0,
      }),
    )

    // Clean up progress data
    localStorage.removeItem(`quiz-progress-${params.roomCode}`)
    localStorage.removeItem(`memory-progress-${params.roomCode}`)

    // Check if player has completed all quiz questions
    const totalQuestions = room?.settings.questionCount || 10
    const questionsAnswered = progressData.questionsAnswered || 0
    
    if (questionsAnswered >= totalQuestions) {
      // Player has completed all questions - end the game
      console.log("[Memory Challenge] Player completed all questions, ending game...")
      
      try {
        await roomManager.updateGameStatus(params.roomCode, "finished")
        
        // Get player info to determine if they're host
        const playerData = localStorage.getItem("currentPlayer")
        const isHost = playerData ? JSON.parse(playerData).isHost : false
        
        // Redirect based on user type
        if (!isHost) {
          window.location.href = `/result?roomCode=${params.roomCode}`
        } else {
          window.location.href = `/host/leaderboad?roomCode=${params.roomCode}`
        }
      } catch (error) {
        console.error("[Memory Challenge] Error ending game:", error)
        // Fallback to quiz page
        window.location.href = `/game/${params.roomCode}/quiz`
      }
    } else {
      // Continue to quiz for remaining questions
      console.log("[Memory Challenge] Game completed, redirecting to quiz immediately...")
      try {
        window.location.href = `/game/${params.roomCode}/quiz`
      } catch (error) {
        console.error("[Memory Challenge] Redirect failed:", error)
        // Fallback redirect
        window.location.replace(`/game/${params.roomCode}/quiz`)
      }
    }
  }

  const handleCorrectMatch = async () => {
    const newCount = correctMatches + 1
    console.log(`[Memory Challenge] Match found! Total matches: ${newCount}`)
    
    // Save progress to Supabase to prevent reset on refresh
    if (playerId) {
      try {
        await supabaseRoomManager.updateGameProgress(params.roomCode, playerId, {
          memoryProgress: {
            correct_matches: newCount,
            last_updated: new Date().toISOString()
          }
        })
      } catch (error) {
        console.error("[Memory Challenge] Error saving progress to Supabase:", error)
      }
    }
    
    // Fallback to localStorage
    localStorage.setItem(`memory-progress-${params.roomCode}`, newCount.toString())
    
    setCorrectMatches(newCount)
    
    // Check if game is completed after this match
    if (newCount >= 6) {
      console.log("[Memory Challenge] Game completed via handleCorrectMatch!")
      // Direct redirect without showing completion modal
      handleGameEnd()
    }
  }

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
            <div className="w-12 h-12 bg-linear-to-r from-blue-400 to-purple-400 rounded-lg border-2 border-white shadow-xl flex items-center justify-center pixel-brain mb-4 mx-auto animate-pulse">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">VALIDATING ACCESS...</h2>
            <p className="text-sm text-blue-200">Checking memory game access</p>
          </div>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
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
            <div className="w-12 h-12 bg-linear-to-r from-red-400 to-orange-400 rounded-lg border-2 border-white shadow-xl flex items-center justify-center pixel-brain mb-4 mx-auto animate-pulse">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">ACCESS DENIED</h2>
            <p className="text-sm text-red-200">{t('lobby.redirectingToQuiz')}</p>
          </div>
        </div>
      </div>
    )
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
        {/* Header with responsive layout */}
        <div className="flex items-center justify-between gap-2 mb-6">
          {/* Left side - Memory Quiz Image */}
          <div className="shrink-0">
            <img
              src="/images/memoryquiz.webp"
              alt="Memory Quiz"
              className="h-8 sm:h-12 md:h-16 lg:h-20 xl:h-24 w-auto object-contain drop-shadow-lg"
            />
          </div>

          {/* Right side - GameForSmart Logo */}
          <div className="shrink-0">
            <img 
              src="/images/gameforsmartlogo.webp" 
              alt="GameForSmart Logo" 
              className="h-8 sm:h-12 md:h-16 lg:h-20 xl:h-24 w-auto object-contain drop-shadow-lg"
            />
          </div>
        </div>


        {/* Game Result modal removed - direct redirect after completion */}

        {/* Memory Game */}
        {!gameCompleted && (
          <div className="max-w-2xl mx-auto">
            <MemoryGame onCorrectMatch={handleCorrectMatch} disabled={gameCompleted} />
          </div>
        )}

      </div>
      
      {/* Pixel Background Elements */}
      <PixelBackgroundElements />
    </div>
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
      <div className="absolute top-60 left-1/3 w-6 h-6 bg-linear-to-r from-blue-400 to-purple-400 animate-pixel-float opacity-30"></div>
      <div className="absolute bottom-40 right-20 w-8 h-8 bg-linear-to-r from-cyan-400 to-blue-400 animate-pixel-block-float opacity-25"></div>
      <div className="absolute top-80 right-1/2 w-4 h-4 bg-linear-to-r from-purple-400 to-pink-400 animate-pixel-float-delayed opacity-35"></div>
      
      {/* Falling Pixels */}
      <div className="absolute top-0 left-1/4 w-2 h-2 bg-blue-400 animate-falling opacity-40"></div>
      <div className="absolute top-0 right-1/3 w-2 h-2 bg-purple-400 animate-falling-delayed opacity-30"></div>
      <div className="absolute top-0 left-2/3 w-2 h-2 bg-cyan-400 animate-falling-slow opacity-35"></div>
    </>
  )
}
