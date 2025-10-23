"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, Trophy, Users, Target } from "lucide-react"
import { getQuizById, getRandomQuestions, type Question } from "@/lib/quiz-data"
import { useRoom } from "@/hooks/use-room"
import { roomManager } from "@/lib/room-manager"
import { getTimerDisplayText } from "@/lib/timer-utils"
import { useSynchronizedTimer } from "@/hooks/use-synchronized-timer"
import { sessionManager } from "@/lib/supabase-session-manager"
import { supabaseRoomManager } from "@/lib/supabase-room-manager"
import { failedUpdatesManager } from "@/lib/failed-updates-manager"
import { useGlobalAudio } from "@/hooks/use-global-audio"
import { useTranslation } from "react-i18next"

interface QuizPageProps {
  params: {
    roomCode: string
  }
  searchParams: {
    quizId?: string
    questionCount?: string
    timeLimit?: string
  }
}

// Function to shuffle array while preserving original indices
function shuffleArrayWithIndices<T>(array: T[]): { shuffled: T[], originalIndices: number[] } {
  const originalIndices = array.map((_, index) => index)
  const shuffled = [...array]
  const shuffledIndices = [...originalIndices]
  
  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j: number = Math.floor(Math.random() * (i + 1))
    // Swap elements
    const tempElement = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = tempElement
    // Swap indices
    const tempIndex = shuffledIndices[i]
    shuffledIndices[i] = shuffledIndices[j]
    shuffledIndices[j] = tempIndex
  }
  
  return { shuffled, originalIndices: shuffledIndices }
}

export default function QuizPage({ params, searchParams }: QuizPageProps) {
  const { t } = useTranslation()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const [questionsAnsweredInitialized, setQuestionsAnsweredInitialized] = useState(false)
  // Removed per-question timer to allow unlimited thinking time
  const [totalTimeSelected, setTotalTimeSelected] = useState(0)
  const [gameFinished, setGameFinished] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [quizTitle, setQuizTitle] = useState("")
  const [gameStarted, setGameStarted] = useState(false)
  const [isInMemoryGame, setIsInMemoryGame] = useState(false)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const [timeUpHandled, setTimeUpHandled] = useState(false)
  const [countdownToNext, setCountdownToNext] = useState(0)
  const [isShowingResult, setIsShowingResult] = useState(false)
  // Store shuffled options for each question
  const [shuffledOptions, setShuffledOptions] = useState<{ [questionIndex: number]: { shuffled: string[], originalIndices: number[] } }>({})
  // Get player ID from session manager
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [playerData, setPlayerData] = useState<any>(null)
  const [isHost, setIsHost] = useState(false)
  const [previousRankings, setPreviousRankings] = useState<{ [key: string]: number }>({})
  const [rankingChanges, setRankingChanges] = useState<{ [key: string]: "up" | "down" | null }>({})
  const { room, loading } = useRoom(params.roomCode)
  const { pauseAudio } = useGlobalAudio()
  
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
            console.log("[Quiz] Loaded player data from session:", sessionData.user_data)
          }
        }
        
        // Fallback to localStorage if session not found
        if (!playerId && typeof window !== 'undefined') {
          const player = localStorage.getItem("currentPlayer")
          if (player) {
            const playerInfo = JSON.parse(player)
            setPlayerId(playerInfo.id)
            setPlayerData(playerInfo)
            console.log("[Quiz] Loaded player data from localStorage fallback:", playerInfo)
          }
        }
      } catch (error) {
        console.error("[Quiz] Error loading player data:", error)
      }
    }

    loadPlayerData()
  }, [])

  // Handle timer expiration
  const handleTimeUp = async () => {
    if (timeUpHandled) return // Prevent multiple calls
    setTimeUpHandled(true)
    
    console.log("[Quiz] Timer expired! Ending game automatically...")
    
    try {
      // End the game automatically
      await roomManager.updateGameStatus(params.roomCode, "finished")
      
      // Broadcast game end event to all players
      if (typeof window !== 'undefined') {
        const broadcastChannel = new BroadcastChannel(`game-end-${params.roomCode}`)
        broadcastChannel.postMessage({ 
          type: 'game-ended', 
          roomCode: params.roomCode,
          timestamp: Date.now()
        })
        broadcastChannel.close()
        console.log("[Quiz] Broadcasted game end event to players")
      }
      
      // Redirect based on user type
      if (!isHost) {
        window.location.href = `/result?roomCode=${params.roomCode}`
      } else {
        window.location.href = `/leaderboard?roomCode=${params.roomCode}`
      }
    } catch (error) {
      console.error("[Quiz] Error ending game due to timer expiration:", error)
      // Fallback redirect
      if (!isHost) {
        window.location.href = `/result?roomCode=${params.roomCode}`
      } else {
        window.location.href = `/leaderboard?roomCode=${params.roomCode}`
      }
    }
  }
  
  const timerState = useSynchronizedTimer(room, undefined, handleTimeUp)
  const questionsInitialized = useRef(false)
  
  // Disable audio when on quiz page
  useEffect(() => {
    pauseAudio()
    
    // Resume audio when leaving the page
    return () => {
      // Note: We don't resume audio here as it should stay paused for quiz
      // Audio will resume when user navigates to other pages
    }
  }, [pauseAudio])
  
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
    if (room && playerId) {
      const currentPlayer = room.players.find((p) => p.id === playerId)
      const hostStatus = currentPlayer?.isHost || false
      setIsHost(hostStatus)

      // Sync questionsAnswered with database
      if (currentPlayer && !questionsAnsweredInitialized) {
        const dbQuestionsAnswered = currentPlayer.questionsAnswered || 0
        const dbQuizScore = currentPlayer.quizScore || 0
        console.log("[Quiz] Syncing player data from database:", { 
          questionsAnswered: dbQuestionsAnswered, 
          quizScore: dbQuizScore 
        })
        setQuestionsAnswered(dbQuestionsAnswered)
        setScore(dbQuizScore)
        // Set currentQuestion based on questionsAnswered to maintain consistency
        setCurrentQuestion(dbQuestionsAnswered)
        setQuestionsAnsweredInitialized(true)
      }

      // Debug log for host detection
      console.log("[v0] Host detection:", { playerId, currentPlayer, hostStatus })
    }
  }, [room, playerId, questionsAnsweredInitialized])

  // Listen for room updates and sync questionsAnswered and score
  useEffect(() => {
    if (room && playerId && questionsAnsweredInitialized) {
      const currentPlayer = room.players.find((p) => p.id === playerId)
      if (currentPlayer) {
        const dbQuestionsAnswered = currentPlayer.questionsAnswered || 0
        const dbQuizScore = currentPlayer.quizScore || 0
        
        if (dbQuestionsAnswered !== questionsAnswered) {
          console.log("[Quiz] Syncing questionsAnswered from room update:", dbQuestionsAnswered)
          setQuestionsAnswered(dbQuestionsAnswered)
        }
        
        if (dbQuizScore !== score) {
          console.log("[Quiz] Syncing quiz score from room update:", dbQuizScore)
          setScore(dbQuizScore)
        }
        
        // Sync currentQuestion with questionsAnswered ONLY if not showing result
        // This prevents the next question from showing while player is viewing the result
        if (dbQuestionsAnswered !== currentQuestion && !isShowingResult) {
          console.log("[Quiz] Syncing currentQuestion with questionsAnswered:", dbQuestionsAnswered)
          setCurrentQuestion(dbQuestionsAnswered)
        }
      }
    }
  }, [room, playerId, questionsAnsweredInitialized, questionsAnswered, score, currentQuestion, isShowingResult])

  // Timer is now handled by useSynchronizedTimer hook

  // Monitor room status for game end
  useEffect(() => {
    if (room && room.status === "finished" && !isHost) {
      console.log("[Quiz] Game finished, redirecting to result page...")
      // Redirect to result page for players
      window.location.href = `/result?roomCode=${params.roomCode}`
    }
  }, [room?.status, isHost, params.roomCode])

  // Check if all players have completed the quiz
  useEffect(() => {
    if (room && isHost && room.players.length > 0) {
      const nonHostPlayers = room.players.filter(p => !p.isHost)
      const totalQuestions = room.settings.questionCount || 10
      
      // Check if all players have completed all questions
      const allPlayersCompleted = nonHostPlayers.every(player => 
        (player.questionsAnswered || 0) >= totalQuestions
      )
      
      if (allPlayersCompleted && nonHostPlayers.length > 0) {
        console.log("[Quiz] All players completed quiz, ending game automatically...")
        
        // End the game automatically
        roomManager.updateGameStatus(params.roomCode, "finished").then(() => {
          // Broadcast game end event to all players
          if (typeof window !== 'undefined') {
            const broadcastChannel = new BroadcastChannel(`game-end-${params.roomCode}`)
            broadcastChannel.postMessage({ 
              type: 'game-ended', 
              roomCode: params.roomCode,
              timestamp: Date.now()
            })
            broadcastChannel.close()
            console.log("[Quiz] Broadcasted game end event to players")
          }
          
          // Redirect host to leaderboard
          window.location.href = `/leaderboard?roomCode=${params.roomCode}`
        }).catch((error) => {
          console.error("[Quiz] Error ending game automatically:", error)
          // Fallback redirect
          window.location.href = `/leaderboard?roomCode=${params.roomCode}`
        })
      }
    }
  }, [room, isHost, params.roomCode])

  // Aggressive polling for game end detection (fallback)
  useEffect(() => {
    if (!isHost && params.roomCode) {
      const gameEndPolling = setInterval(async () => {
        try {
          const currentRoom = await roomManager.getRoom(params.roomCode)
          if (currentRoom && currentRoom.status === "finished") {
            console.log("[Quiz] Game finished detected via aggressive polling - redirecting immediately...")
            clearInterval(gameEndPolling)
            window.location.href = `/result?roomCode=${params.roomCode}`
          }
        } catch (error) {
          console.error("[Quiz] Error in game end polling:", error)
        }
      }, 1000) // Check every 1 second for game end

      return () => clearInterval(gameEndPolling)
    }
  }, [isHost, params.roomCode])

  // Listen for immediate game end broadcast
  useEffect(() => {
    if (!isHost && params.roomCode) {
      const broadcastChannel = new BroadcastChannel(`game-end-${params.roomCode}`)
      
      broadcastChannel.onmessage = (event) => {
        if (event.data.type === 'game-ended') {
          console.log("[Quiz] Game end broadcast received - redirecting immediately...")
          broadcastChannel.close()
          window.location.href = `/result?roomCode=${params.roomCode}`
        }
      }

      return () => {
        broadcastChannel.close()
      }
    }
  }, [isHost, params.roomCode])

  useEffect(() => {
    if (room && isHost) {
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
  }, [room, isHost, previousRankings])

  // Redirect hosts to the monitor page (host monitor moved to /monitor)
  useEffect(() => {
    if (!loading && room && isHost) {
      window.location.href = `/monitor?roomCode=${params.roomCode}`
    }
  }, [loading, room, isHost, params.roomCode])

  // Initialize quiz questions - hanya dijalankan sekali untuk mencegah soal diacak ulang
  useEffect(() => {
    if (!loading && (!room || !room.gameStarted)) {
      window.location.href = "/"
      return
    }

    if (!room || loading) return

    // Cek apakah soal sudah diinisialisasi sebelumnya menggunakan useRef
    // Ini mencegah soal diacak ulang setiap kali komponen di-render
    if (questionsInitialized.current) return

    setGameStarted(true)
    questionsInitialized.current = true

    const quizId = searchParams.quizId || "math-basic"
    // Use room settings instead of searchParams
    const questionCount = room.settings.questionCount
    const timeLimit = room.settings.totalTimeLimit

    const quiz = getQuizById(quizId)
    if (quiz) {
      // Soal hanya diacak sekali saat pertama kali dimuat
      const selectedQuestions = getRandomQuestions(quiz, questionCount)
      setQuestions(selectedQuestions)
      setQuizTitle(quiz.title)
      // Removed per-question timer - players can think without time pressure
      setTotalTimeSelected(timeLimit) // Total durasi quiz
      
      // Create shuffled options for each question
      const shuffledOptionsMap: { [questionIndex: number]: { shuffled: string[], originalIndices: number[] } } = {}
      selectedQuestions.forEach((question, index) => {
        const shuffled = shuffleArrayWithIndices(question.options)
        shuffledOptionsMap[index] = shuffled
      })
      setShuffledOptions(shuffledOptionsMap)
    }
  }, [searchParams, params.roomCode, room, loading])

  // FAILED UPDATE RECOVERY MECHANISM
  useEffect(() => {
    const recoverFailedUpdates = async () => {
      if (!playerId) return
      
      try {
        const result = await failedUpdatesManager.processPendingUpdates(
          params.roomCode,
          playerId,
          {
            progress: async (updateData) => {
              return await supabaseRoomManager.updateGameProgress(
                params.roomCode,
                playerId,
                updateData
              )
            }
          }
        )
        
        console.log("[Quiz] 🔄 Processed failed updates:", result)
      } catch (error) {
        console.error("[Quiz] Error recovering failed updates:", error)
      }
    }
    
    // Try to recover failed updates every 5 seconds
    const recoveryInterval = setInterval(recoverFailedUpdates, 5000)
    
    return () => clearInterval(recoveryInterval)
  }, [playerId, params.roomCode])

  useEffect(() => {
    const checkMemoryGameReturn = async () => {
      const memoryReturn = localStorage.getItem(`memory-return-${params.roomCode}`)
      if (memoryReturn) {
        console.log("[Quiz] Memory game return detected:", memoryReturn)
        const data = JSON.parse(memoryReturn)
        
        // Restore progress data from Supabase
        if (playerId) {
          const progressData = await supabaseRoomManager.getPlayerGameProgress(params.roomCode, playerId)
          if (progressData && progressData.game_progress) {
            const progress = progressData.game_progress
            console.log("[Quiz] Restoring progress data from Supabase:", progress)
            setCurrentQuestion(progress.current_question || data.resumeQuestion || currentQuestion)
            setScore(progress.quiz_score || 0)
            setCorrectAnswers(progress.correct_answers || 0)
            setQuestionsAnswered(progress.questions_answered || 0)
          } else {
            // Fallback to memory return data
            setCurrentQuestion(data.resumeQuestion || currentQuestion)
          }
        } else {
          // Fallback to memory return data
          setCurrentQuestion(data.resumeQuestion || currentQuestion)
        }
        
        localStorage.removeItem(`memory-return-${params.roomCode}`)
        console.log("[Quiz] Memory game return processed, continuing quiz...")

        // Check if player has completed all questions after memory game
        const totalQuestions = room?.settings.questionCount || 10
        const currentQuestionsAnswered = questionsAnswered || 0
        
        if (currentQuestionsAnswered >= totalQuestions) {
          console.log("[Quiz] Player completed all questions after memory game, ending game...")
          
          try {
            await roomManager.updateGameStatus(params.roomCode, "finished")
            
            // Redirect based on user type
            if (!isHost) {
              window.location.href = `/result?roomCode=${params.roomCode}`
            } else {
              window.location.href = `/leaderboard?roomCode=${params.roomCode}`
            }
          } catch (error) {
            console.error("[Quiz] Error ending game after memory return:", error)
            // Continue with normal quiz flow
          }
        }

        // No memory score update needed - memory game is just an obstacle
      }
    }

    if (gameStarted && !isHost && room) {
      checkMemoryGameReturn()
    }
  }, [gameStarted, params.roomCode, playerId, isHost, room, questionsAnswered])

  // Removed per-question timer countdown - players can take their time to think

  const handleAnswerSelect = async (answerIndex: number) => {
    // Prevent multiple selections while showing result
    if (selectedAnswer !== null || showResult) return
    
    // STEP 1: Set the selected answer and show result immediately
    setSelectedAnswer(answerIndex)
    setShowResult(true)
    setIsShowingResult(true) // Prevent question from changing while showing result

    // STEP 2: Check if the answer is correct BEFORE updating any scores
    // Get the shuffled options for current question
    const currentShuffled = shuffledOptions[currentQuestion]
    if (!currentShuffled) {
      console.error("[Quiz] No shuffled options found for question", currentQuestion)
      return
    }
    
    // Find the original index of the selected answer in the shuffled array
    const originalIndex = currentShuffled.originalIndices[answerIndex]
    const isCorrect = originalIndex === questions[currentQuestion].correct
    let newScore = score
    let newCorrectAnswers = correctAnswers
    
    // STEP 3: Update scores based on correctness
    if (isCorrect) {
      newScore = score + 1
      setScore(newScore)
      newCorrectAnswers = correctAnswers + 1
      setCorrectAnswers(newCorrectAnswers)
    }

    // STEP 4: Always increment questions answered after checking correctness
    const newQuestionsAnswered = questionsAnswered + 1
    setQuestionsAnswered(newQuestionsAnswered)
    
    console.log("[Quiz] ✅ ANSWER CHECKED - Correct:", isCorrect, "Score:", newScore, "Questions Answered:", newQuestionsAnswered)
    console.log("[Quiz] 🔍 DEBUG - correctAnswers:", correctAnswers, "newCorrectAnswers:", newCorrectAnswers, "isCorrect:", isCorrect)

    // STEP 5: Check if player has answered 3 correct questions (memory game trigger)
    // Changed: Now triggers every time player reaches a multiple of 3 correct answers (3, 6, 9, etc.)
    if (isCorrect && newCorrectAnswers > 0 && newCorrectAnswers % 3 === 0) {
      console.log("[Quiz] 🎯 MEMORY GAME TRIGGER CONDITION MET!")
      console.log("[Quiz] 🎯 Player has answered", newCorrectAnswers, "correct questions (multiple of 3), redirecting to memory game...")
      
      // Update quiz score and questions answered immediately before memory game
      if (playerId) {
        console.log("[Quiz] 🎯 MEMORY GAME TRIGGER - Updating final scores before redirect")
        roomManager.updatePlayerScore(params.roomCode, playerId, newScore, undefined, newQuestionsAnswered)
      }

      // Store current progress in both Supabase and localStorage before redirect to memory game
      const progressData = {
        currentQuestion: currentQuestion + 1,
        correctAnswers: newCorrectAnswers,
        quizScore: newScore,
        questionsAnswered: newQuestionsAnswered
      }

      // Save to localStorage for immediate access by memory challenge page
      localStorage.setItem(`quiz-progress-${params.roomCode}`, JSON.stringify(progressData))
      console.log("[Quiz] ✅ Progress saved to localStorage:", progressData)

      // Also save to Supabase
      if (playerId) {
        try {
          await supabaseRoomManager.updateGameProgress(params.roomCode, playerId, progressData)
          console.log("[Quiz] ✅ Progress saved to Supabase successfully")
        } catch (error) {
          console.error("[Quiz] ❌ Error saving progress to Supabase:", error)
        }
      }

      console.log("[Quiz] 🚀 Redirecting to memory challenge in 2 seconds...")
      setTimeout(() => {
        console.log("[Quiz] 🔄 Executing redirect to memory challenge")
        window.location.href = `/game/${params.roomCode}/memory-challenge`
      }, 2000)
      return
    }

    // ENHANCED PROGRESS BAR RELIABILITY FIX
    if (playerId) {
      const updateData = {
        quizScore: newScore,
        questionsAnswered: newQuestionsAnswered
      }
      
      console.log("[Quiz] 📊 PROGRESS UPDATE:", {
        playerId,
        currentQuestion: currentQuestion + 1,
        ...updateData,
        isCorrect,
        timestamp: new Date().toISOString()
      })
      
      // ENHANCED MULTIPLE RETRY STRATEGY untuk memastikan progress bar update dengan sinkronisasi yang lebih baik
      const attemptUpdate = async (attempt = 1, maxAttempts = 5) => {
        try {
          const success = await roomManager.updatePlayerScore(
            params.roomCode,
            playerId,
            updateData.quizScore,
            undefined,
            updateData.questionsAnswered
          )
          
          if (success) {
            console.log(`[Quiz] ✅ Progress updated successfully (attempt ${attempt})`)
            return true
          } else {
            throw new Error(`Update failed on attempt ${attempt}`)
          }
        } catch (error) {
          console.error(`[Quiz] ❌ Update failed (attempt ${attempt}):`, error)
          
          if (attempt < maxAttempts) {
            const delay = Math.pow(2, attempt) * 500 // Faster exponential backoff: 1s, 2s, 4s, 8s, 16s
            console.log(`[Quiz] 🔄 Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxAttempts})`)
            
            setTimeout(() => {
              attemptUpdate(attempt + 1, maxAttempts)
            }, delay)
          } else {
            console.error(`[Quiz] 💥 All ${maxAttempts} attempts failed. Progress may not be reflected in monitor.`)
            
            // IMMEDIATE FALLBACK: Broadcast progress update to monitor for instant sync
            if (typeof window !== 'undefined') {
              const broadcastChannel = new BroadcastChannel(`progress-update-${params.roomCode}`)
              broadcastChannel.postMessage({ 
                type: 'progress-update', 
                playerId,
                updateData,
                timestamp: Date.now()
              })
              broadcastChannel.close()
              console.log("[Quiz] 📡 Broadcasted progress update as fallback")
            }
            
            // FALLBACK: Store failed update for later sync
            const failedUpdate = {
              playerId,
              roomCode: params.roomCode,
              updateData,
              timestamp: Date.now()
            }
            // Store failed update in Supabase for retry
            await failedUpdatesManager.storeFailedUpdate(
              params.roomCode,
              playerId,
              'progress',
              updateData
            )
            console.log("[Quiz] 💾 Stored failed update for later sync:", updateData)
          }
          return false
        }
      }
      
      // Start the update attempt chain
      attemptUpdate()
    }

    // STEP 6: Start countdown timer to give players time to see the result
    // Players will see the correct/incorrect answer for 1 second before next question
    setCountdownToNext(1)
    const countdownInterval = setInterval(() => {
      setCountdownToNext((prev: number) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          // STEP 7: Move to next question after countdown finishes
          handleNextQuestion()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleNextQuestion = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setCountdownToNext(0) // Reset countdown
      // No timer reset needed - players can think without time pressure
    } else {
      // Quiz completed - end the game for all players
      setGameFinished(true)

      if (playerId) {
        // Update final score
        await roomManager.updatePlayerScore(params.roomCode, playerId, score, undefined, questionsAnswered)
      }

      // End the game and redirect based on user type
      try {
        await roomManager.updateGameStatus(params.roomCode, "finished")
        
        // Redirect player to result page
        if (!isHost) {
          window.location.href = `/result?roomCode=${params.roomCode}`
        } else {
          // Host gets redirected to leaderboard
          window.location.href = `/leaderboard?roomCode=${params.roomCode}`
        }
      } catch (error) {
        console.error("[Quiz] Error ending game:", error)
        // Fallback redirect
        if (!isHost) {
          window.location.href = `/result?roomCode=${params.roomCode}`
        } else {
          window.location.href = `/leaderboard?roomCode=${params.roomCode}`
        }
      }
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
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg border-2 border-white shadow-xl flex items-center justify-center pixel-brain mb-4 mx-auto animate-pulse">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">LOADING QUIZ...</h2>
            <p className="text-sm text-blue-200">Preparing your questions</p>
          </div>
        </div>
      </div>
    )
  }

  // Host users will be redirected above; render continues for players

  if (!gameStarted || questions.length === 0 || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="py-8">
            <div className="text-lg">{!gameStarted ? t('lobby.invalidGameSession') : t('lobby.loadingQuiz')}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progress = (questionsAnswered / (room?.settings.questionCount || questions.length)) * 100

  // Removed temporary result display - redirect directly to result page
  if (gameFinished) {
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
            <h2 className="text-xl font-bold text-white mb-2">QUIZ COMPLETED!</h2>
            <p className="text-sm text-blue-200">{t('lobby.redirectingToResults')}</p>
          </div>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const currentShuffled = shuffledOptions[currentQuestion]

  // Don't render if shuffled options are not ready
  if (!currentShuffled) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg border-2 border-white shadow-xl flex items-center justify-center pixel-brain mb-4 mx-auto animate-pulse">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">LOADING QUESTION...</h2>
            <p className="text-sm text-blue-200">Preparing answer choices</p>
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
        {/* Header with responsive layout */}
        <div className="flex items-center justify-between gap-2 mb-6">
          {/* Left side - Title and Room Code */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg border-2 border-white shadow-xl flex items-center justify-center pixel-brain">
                <Users className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
              <div className="min-w-0">
                {/* Enhanced MEMORY QUIZ Title */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 border-2 border-white rounded-lg px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 shadow-2xl transition-all duration-300 inline-block">
                  <h1 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold text-white tracking-wider uppercase drop-shadow-lg whitespace-nowrap">
                    {t('lobby.memoryQuiz')}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-blue-200 mt-1">{t('lobby.room')} {params.roomCode}</p>
              </div>
          </div>
          
          {/* Right side - GameForSmart Logo */}
          <div className="flex-shrink-0">
            <img 
              src="/images/gameforsmartlogo.png" 
              alt="GameForSmart Logo" 
              className="h-8 sm:h-12 md:h-16 lg:h-20 xl:h-24 w-auto object-contain drop-shadow-lg"
            />
          </div>
        </div>

        {/* Time Warning */}
        {showTimeWarning && (
          <div className="mb-6 bg-red-500/20 border-2 border-red-500/50 rounded-lg p-4 animate-pulse">
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-bold text-lg">
                {timerState.remainingTime <= 0 ? "WAKTU HABIS!" : "WAKTU HAMPIR HABIS!"}
              </span>
              <Clock className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-red-300 text-center text-sm mt-1">
              {timerState.remainingTime <= 0 
                ? "Game akan berakhir secara otomatis..." 
                : "Selesaikan pertanyaan Anda secepat mungkin!"
              }
            </p>
          </div>
        )}

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-white">PROGRESS</span>
            <span className="text-sm text-blue-300">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-black/30 border border-white/30 rounded-lg h-3">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Timer, Score, and Correct Answers */}
        <div className="flex justify-center gap-4 mb-6">
          <div className="bg-blue-500/20 border-2 border-blue-500/50 rounded-lg px-4 py-2 flex items-center gap-2">
            <span className="text-blue-400 font-bold text-sm">{t('lobby.question')} {questionsAnswered + 1} of {room?.settings.questionCount || questions.length}</span>
          </div>

          <div className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-lg px-4 py-2 flex items-center gap-2">
            <span className="text-yellow-400 font-bold text-sm">{t('lobby.points')}: {score}</span>
          </div>

          <div className={`${showTimeWarning ? 'bg-red-500/20 border-red-500/50 animate-pulse' : 'bg-green-500/20 border-green-500/50'} border-2 rounded-lg px-4 py-2 flex items-center gap-2`}>
            <Clock className={`w-4 h-4 ${showTimeWarning ? 'text-red-400' : 'text-green-400'}`} />
            <span className={`font-bold text-sm ${showTimeWarning ? 'text-red-400' : 'text-green-400'}`}>
              {getTimerDisplayText(timerState)}
            </span>
          </div>
        </div>

        {/* Question */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/30 rounded-lg p-6 pixel-lobby-card">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-3">{question.question}</h2>
            </div>
            <div className="grid gap-3">
              {currentShuffled.shuffled.map((option, index) => {
                // Find the original index of this option to check if it's correct
                const originalIndex = currentShuffled.originalIndices[index]
                const isCorrectAnswer = originalIndex === question.correct
                
                return (
                  <button
                    key={index}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                      showResult
                        ? isCorrectAnswer
                          ? "bg-green-500/20 border-green-400 text-green-300"
                          : selectedAnswer === index
                            ? "bg-red-500/20 border-red-400 text-red-300"
                            : "bg-white/5 border-white/20 text-white"
                        : selectedAnswer === index
                          ? "bg-blue-500/20 border-blue-400 text-blue-300"
                          : "bg-white/5 border-white/20 text-white hover:bg-white/10"
                    }`}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={selectedAnswer !== null}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded border border-white flex items-center justify-center font-bold text-sm ${
                        showResult
                          ? isCorrectAnswer
                            ? "bg-green-400 text-white"
                            : selectedAnswer === index
                              ? "bg-red-400 text-white"
                              : "bg-gray-400 text-white"
                          : selectedAnswer === index
                            ? "bg-blue-400 text-white"
                            : "bg-white/20 text-white"
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="text-sm font-medium">{option}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

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
