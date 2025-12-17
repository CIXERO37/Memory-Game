"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
import { quizApi } from "@/lib/supabase"
import { scoreUpdateQueue } from "@/lib/score-update-queue"
import { participantsApi } from "@/lib/supabase-players"
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

// CRITICAL: Delay untuk memastikan Supabase sync selesai sebelum redirect
const COMPLETION_CHECK_DELAY = 3000 // 3 detik delay untuk final sync
const QUIZ_LOAD_TIMEOUT = 5000 // 5 detik timeout untuk load quiz

/**
 * Helper function to determine font size based on question text length
 * Returns Tailwind CSS classes for responsive font sizing
 */
function getQuestionFontSize(text: string): string {
  const length = text?.length || 0

  if (length < 80) {
    // Short questions - large font
    return 'text-xl sm:text-2xl'
  } else if (length < 150) {
    // Medium questions
    return 'text-lg sm:text-xl'
  } else if (length < 250) {
    // Longer questions
    return 'text-base sm:text-lg'
  } else if (length < 400) {
    // Very long questions
    return 'text-sm sm:text-base'
  } else {
    // Extremely long questions - smallest readable font with max height
    return 'text-sm'
  }
}

/**
 * Helper function to determine if question needs scrollable container
 */
function needsScrollableContainer(text: string): boolean {
  return (text?.length || 0) > 400
}

/**
 * Helper function to determine font size for answer options
 */
function getOptionFontSize(text: string): string {
  const length = text?.length || 0

  if (length < 50) {
    return 'text-sm sm:text-base'
  } else if (length < 100) {
    return 'text-sm'
  } else {
    return 'text-xs sm:text-sm'
  }
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
  const [shuffledOptions, setShuffledOptions] = useState<{ [questionIndex: number]: { shuffled: string[], originalIndices: number[] } }>({})
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [playerData, setPlayerData] = useState<any>(null)
  const [isHost, setIsHost] = useState(false)
  const [isHostDetected, setIsHostDetected] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [previousRankings, setPreviousRankings] = useState<{ [key: string]: number }>({})
  const [rankingChanges, setRankingChanges] = useState<{ [key: string]: "up" | "down" | null }>({})
  const isUpdatingScore = useRef(false)
  const { room, loading } = useRoom(params.roomCode)
  const questionsInitialized = useRef(false)

  // CRITICAL: Reset initialization flag on room change
  useEffect(() => {
    questionsInitialized.current = false

  }, [params.roomCode])

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

          }
        }

        // Fallback to localStorage if session not found
        if (!playerId && typeof window !== 'undefined') {
          const player = localStorage.getItem("currentPlayer")
          if (player) {
            const playerInfo = JSON.parse(player)
            setPlayerId(playerInfo.id)
            setPlayerData(playerInfo)

          }
        }
      } catch (error) {
        console.error("[Quiz] ❌ Error loading player data:", error)
      }
    }

    loadPlayerData()
  }, [])

  // Handle timer expiration
  const handleTimeUp = useCallback(async () => {
    if (timeUpHandled || redirecting) return
    setTimeUpHandled(true)
    setRedirecting(true)



    try {
      // 🚀 OPTIMIZED: Flush all pending queue updates before game ends
      await scoreUpdateQueue.flushNow()

      await roomManager.updateGameStatus(params.roomCode, "finished")

      let broadcastChannel: BroadcastChannel | null = null
      try {
        if (typeof window !== 'undefined') {
          broadcastChannel = new BroadcastChannel(`game-end-${params.roomCode}`)
          broadcastChannel.postMessage({
            type: 'game-ended',
            roomCode: params.roomCode,
            timestamp: Date.now()
          })

        }
      } finally {
        if (broadcastChannel) {
          broadcastChannel.close()
        }
      }

      if (!isHost) {
        window.location.href = `/result?roomCode=${params.roomCode}`
      } else {
        window.location.href = `/host/leaderboad?roomCode=${params.roomCode}`
      }
    } catch (error) {
      console.error("[Quiz] ❌ Error ending game due to timer expiration:", error)
      if (!isHost) {
        window.location.href = `/result?roomCode=${params.roomCode}`
      } else {
        window.location.href = `/host/leaderboad?roomCode=${params.roomCode}`
      }
    }
  }, [timeUpHandled, redirecting, params.roomCode, isHost])

  const timerState = useSynchronizedTimer(room, undefined, handleTimeUp)

  // Show warning when time is running low
  useEffect(() => {
    if (timerState.remainingTime <= 60 && timerState.remainingTime > 0) {
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

  // CRITICAL: Host detection and initial sync with race condition fix
  useEffect(() => {
    if (room && playerId && questions.length > 0 && !questionsAnsweredInitialized) { // <-- FIX: Tambahkan questions.length > 0
      const currentPlayer = room.players.find((p) => p.id === playerId)
      const hostStatus = currentPlayer?.isHost || false
      setIsHost(hostStatus)
      setIsHostDetected(true)

      // Sync questionsAnswered with database
      if (currentPlayer && !questionsAnsweredInitialized) {
        const dbQuestionsAnswered = currentPlayer.questionsAnswered || 0
        const dbQuizScore = currentPlayer.quizScore || 0

        setQuestionsAnswered(dbQuestionsAnswered)
        setScore(dbQuizScore)
        // FIX: Pastikan currentQuestion tidak pernah negatif
        setCurrentQuestion(Math.min(dbQuestionsAnswered, Math.max(0, questions.length - 1)))
        setQuestionsAnsweredInitialized(true)
      }


    }
  }, [room, playerId, questionsInitialized, questionsAnsweredInitialized, questions.length])

  // CRITICAL: Real-time sync with race condition fix
  useEffect(() => {
    if (room && playerId && questionsAnsweredInitialized && questions.length > 0) { // <-- FIX: Tambahkan questions.length > 0
      const currentPlayer = room.players.find((p) => p.id === playerId)
      if (currentPlayer) {
        const dbQuestionsAnswered = currentPlayer.questionsAnswered || 0
        const dbQuizScore = currentPlayer.quizScore || 0

        // Sync jika nilai database berbeda dengan local
        if (dbQuestionsAnswered !== questionsAnswered || dbQuizScore !== score) {


          if (dbQuestionsAnswered > questionsAnswered) {
            setQuestionsAnswered(dbQuestionsAnswered)
            // FIX: Pastikan currentQuestion tidak pernah negatif
            setCurrentQuestion(Math.min(dbQuestionsAnswered, Math.max(0, questions.length - 1)))
          }

          if (dbQuizScore > score) {
            setScore(dbQuizScore)
          }
        }
      }
    }
  }, [room, playerId, questionsAnsweredInitialized, questionsAnswered, score, questions.length])

  // CRITICAL: Sync currentQuestion when questions are loaded
  useEffect(() => {
    if (questions.length > 0 && currentQuestion === -1) {

      setCurrentQuestion(Math.min(questionsAnswered, questions.length - 1))
    }
  }, [questions.length, questionsAnswered, currentQuestion])

  // Monitor room status for game end
  useEffect(() => {
    if (room && room.status === "finished" && !isHost) {

      window.location.href = `/result?roomCode=${params.roomCode}`
    }
  }, [room?.status, isHost, params.roomCode])



  // Listen for immediate game end broadcast
  useEffect(() => {
    if (!isHost && params.roomCode) {
      const broadcastChannel = new BroadcastChannel(`game-end-${params.roomCode}`)

      broadcastChannel.onmessage = (event) => {
        if (event.data.type === 'game-ended') {

          broadcastChannel.close()
          window.location.href = `/result?roomCode=${params.roomCode}`
        }
      }

      return () => {
        broadcastChannel.close()
      }
    }
  }, [isHost, params.roomCode])

  // Function to shuffle questions deterministically based on a seed (playerId)
  function shuffleQuestionsWithSeed(questions: Question[], seedStr: string): Question[] {
    let seed = 0
    for (let i = 0; i < seedStr.length; i++) {
      seed = ((seed << 5) - seed) + seedStr.charCodeAt(i)
      seed |= 0 // Convert to 32bit integer
    }

    const shuffled = [...questions]
    // Fisher-Yates shuffle with seeded random
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Use Math.sin with the seed and index to generate a deterministic random number
      const x = Math.sin(seed + i) * 10000
      const r = x - Math.floor(x)

      const j = Math.floor(r * (i + 1))

      const temp = shuffled[i]
      shuffled[i] = shuffled[j]
      shuffled[j] = temp
    }

    return shuffled
  }

  // CRITICAL: Initialize quiz questions - FIX infinite loading
  useEffect(() => {
    if (!loading && (!room || !room.gameStarted)) {
      window.location.href = "/"
      return
    }

    // Wait for room, loading, and playerId to be ready
    if (!room || loading || !playerId) {
      return
    }

    // Cek apakah soal sudah diinisialisasi sebelumnya menggunakan useRef
    if (questionsInitialized.current) {
      return
    }

    const initQuestions = async () => {
      questionsInitialized.current = true

      // FIX: Use room.quizId as primary source, fallback to searchParams or default
      const quizId = room.quizId || searchParams.quizId || "math-basic"
      const questionCount = room.settings.questionCount
      const timeLimit = room.settings.totalTimeLimit

      // Try to get from local data first
      const localQuiz = getQuizById(quizId)
      let quizQuestions: Question[] = []
      let title = ""

      // Helper to map raw questions to local format
      const mapQuestions = (rawQuestions: any[]) => {
        // Collect all potential answers for distractors (Pass 1)
        const allPotentialAnswers = new Set<string>()
        rawQuestions.forEach((q: any) => {
          const ans = q.correct_answer || q.correct || q.answer
          if (ans) allPotentialAnswers.add(String(ans))

          const opts = q.options || q.choices || q.answers
          if (Array.isArray(opts)) {
            opts.forEach((o: any) => {
              if (typeof o === 'object' && o !== null) {
                const val = o.answer || o.text || o.value || o.label
                if (val) allPotentialAnswers.add(String(val))
              } else {
                allPotentialAnswers.add(String(o))
              }
            })
          }
        })
        const distractorPool = Array.from(allPotentialAnswers)

        return rawQuestions.map((q: any, index) => {
          // 1. Robust Option Extraction
          let rawOptions = q.options || q.choices || q.answers || []
          let options: string[] = []

          if (Array.isArray(rawOptions)) {
            options = rawOptions.map((opt: any) => {
              if (typeof opt === 'object' && opt !== null) {
                return String(opt.answer || opt.text || opt.value || opt.label || "")
              }
              return String(opt)
            }).filter(opt => opt !== "")
          }

          // Handle True/False without explicit options
          if (options.length === 0 && (q.type === 'true_false' || q.question.toLowerCase().includes('true') || q.question.toLowerCase().includes('false'))) {
            options = ["True", "False"]
          }

          // 2. Robust Correct Answer Extraction
          const rawCorrectAnswer = q.correct_answer || q.correct || q.answer
          let correctIndex = -1

          if (rawCorrectAnswer !== undefined && rawCorrectAnswer !== null) {
            const correctStr = String(rawCorrectAnswer).trim()
            correctIndex = options.findIndex(opt => opt.trim() === correctStr)
            if (correctIndex === -1) {
              correctIndex = options.findIndex(opt => opt.toLowerCase().trim() === correctStr.toLowerCase())
            }
            if (correctIndex === -1 && !isNaN(Number(rawCorrectAnswer))) {
              const idx = Number(rawCorrectAnswer)
              if (idx >= 0 && idx < options.length) {
                correctIndex = idx
              }
            }
            if (correctIndex === -1) {
              options.push(correctStr)
              correctIndex = options.length - 1
            }
          } else {
            if (options.length > 0) correctIndex = 0
          }

          // 4. Fill missing options from Distractor Pool
          if (options.length < 4 && distractorPool.length > 0) {
            let attempts = 0
            while (options.length < 4 && attempts < 50) {
              const randomDistractor = distractorPool[Math.floor(Math.random() * distractorPool.length)]
              if (randomDistractor && !options.includes(randomDistractor)) {
                options.push(randomDistractor)
              }
              attempts++
            }
          }

          // 4b. Numeric Distractor Generation
          if (options.length < 4 && rawCorrectAnswer && !isNaN(Number(rawCorrectAnswer))) {
            const num = Number(rawCorrectAnswer)
            const offsets = [-1, 1, -2, 2, -3, 3]
            for (const offset of offsets) {
              if (options.length >= 4) break
              const dist = String(num + offset)
              if (!options.includes(dist)) options.push(dist)
            }
          }

          // 5. Final Fallback
          if (options.length === 0) {
            console.warn(`[Quiz] ⚠️ Question ${index + 1} has NO options. Adding placeholders.`)
            options = ["Option A", "Option B", "Option C", "Option D"]
            correctIndex = 0
          }

          return {
            id: index + 1,
            question: q.question,
            options: options,
            correct: correctIndex,
            explanation: q.explanation
          }
        })
      }

      // 1. Check if room has pre-generated questions (Priority)
      if (room.questions && room.questions.length > 0) {
        console.log("[Quiz] Using pre-generated questions from room session")
        quizQuestions = mapQuestions(room.questions)
        title = room.quizTitle || "Quiz"
      }
      // 2. Fallback to local data
      else if (localQuiz) {
        const countToFetch = questionCount === 0 ? localQuiz.questions.length : questionCount
        quizQuestions = getRandomQuestions(localQuiz, countToFetch)
        title = localQuiz.title
      }
      // 3. Fallback to fetching from Supabase
      else {
        try {
          const supabaseQuiz = await quizApi.getQuizById(quizId)
          if (supabaseQuiz) {
            title = supabaseQuiz.title
            const mappedQuestions = mapQuestions(supabaseQuiz.questions)

            // Shuffle and limit (since we fetched raw quiz, not session questions)
            const shuffled = [...mappedQuestions].sort(() => Math.random() - 0.5)
            const countToFetch = questionCount === 0 ? shuffled.length : questionCount
            quizQuestions = shuffled.slice(0, countToFetch)
          } else {
            console.error("[Quiz] ❌ Quiz not found in Supabase either:", quizId)
            const fallbackQuiz = getQuizById("math-basic")
            if (fallbackQuiz) {
              const countToFetch = questionCount === 0 ? fallbackQuiz.questions.length : questionCount
              quizQuestions = getRandomQuestions(fallbackQuiz, countToFetch)
              title = fallbackQuiz.title
            }
          }
        } catch (err) {
          console.error("[Quiz] ❌ Error fetching from Supabase:", err)
          const fallbackQuiz = getQuizById("math-basic")
          if (fallbackQuiz) {
            const countToFetch = questionCount === 0 ? fallbackQuiz.questions.length : questionCount
            quizQuestions = getRandomQuestions(fallbackQuiz, countToFetch)
            title = fallbackQuiz.title
          }
        }
      }

      // CRITICAL: Always set gameStarted to true to prevent infinite loading
      setGameStarted(true)

      if (quizQuestions.length > 0) {
        // Apply deterministic shuffle based on playerId
        // This ensures each player gets a random order, but it persists on reload
        if (playerId) {
          quizQuestions = shuffleQuestionsWithSeed(quizQuestions, playerId)
        }

        setQuestions(quizQuestions)
        setQuizTitle(title)
        setTotalTimeSelected(timeLimit)

        // Create shuffled options for each question
        const shuffledOptionsMap: { [questionIndex: number]: { shuffled: string[], originalIndices: number[] } } = {}
        quizQuestions.forEach((question, index) => {
          const shuffled = shuffleArrayWithIndices(question.options)
          shuffledOptionsMap[index] = shuffled
        })

        setShuffledOptions(shuffledOptionsMap)
      } else {
        console.error("[Quiz] ❌ Failed to load any questions")
        setQuestions([])
        setQuizTitle("Quiz Not Found")
      }
    }

    initQuestions()
  }, [searchParams, params.roomCode, room, loading, playerId])

  // CRITICAL: Timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (questions.length === 0 && gameStarted && !loading) {
        console.error("[Quiz] ⏰ Quiz loading timeout - questions still empty after", QUIZ_LOAD_TIMEOUT, "ms")

        // Force set questions to empty array to break loading state
        setQuestions([])
        setShuffledOptions({})
      }
    }, QUIZ_LOAD_TIMEOUT)

    return () => clearTimeout(timeout)
  }, [questions.length, gameStarted, loading])

  // Check memory game return
  useEffect(() => {
    const checkMemoryGameReturn = async () => {
      const memoryReturn = localStorage.getItem(`memory-return-${params.roomCode}`)
      if (memoryReturn) {

        const data = JSON.parse(memoryReturn)

        // Restore progress data from Supabase
        if (playerId) {
          const progressData = await supabaseRoomManager.getPlayerGameProgress(params.roomCode, playerId)
          if (progressData && progressData.game_progress) {
            const progress = progressData.game_progress

            setCurrentQuestion(progress.current_question || data.resumeQuestion || currentQuestion)
            setScore(progress.quiz_score || 0)
            setCorrectAnswers(progress.correct_answers || 0)
            setQuestionsAnswered(progress.questions_answered || 0)
          } else {
            setCurrentQuestion(data.resumeQuestion || currentQuestion)
          }
        } else {
          setCurrentQuestion(data.resumeQuestion || currentQuestion)
        }

        localStorage.removeItem(`memory-return-${params.roomCode}`)


        // Check if player has completed all questions after memory game
        const totalQuestions = room?.settings.questionCount || 10
        const currentQuestionsAnswered = questionsAnswered || 0

        if (currentQuestionsAnswered >= totalQuestions) {


          if (redirecting) return
          setRedirecting(true)

          try {
            await roomManager.updateGameStatus(params.roomCode, "finished")

            if (!isHostDetected) {
              await new Promise(resolve => setTimeout(resolve, 500))
            }

            if (!isHost) {
              window.location.href = `/result?roomCode=${params.roomCode}`
            } else {
              window.location.href = `/host/leaderboad?roomCode=${params.roomCode}`
            }
          } catch (error) {
            console.error("[Quiz] ❌ Error ending game after memory return:", error)
            if (!isHost) {
              window.location.href = `/result?roomCode=${params.roomCode}`
            } else {
              window.location.href = `/host/leaderboad?roomCode=${params.roomCode}`
            }
          }
        }
      }
    }

    if (gameStarted && !isHost && room) {
      checkMemoryGameReturn()
    }
  }, [gameStarted, params.roomCode, playerId, isHost, room, questionsAnswered])

  // CRITICAL: Handle answer selection with robust sync
  const handleAnswerSelect = async (answerIndex: number) => {
    if (selectedAnswer !== null || showResult) return

    setSelectedAnswer(answerIndex)
    setShowResult(true)
    setIsShowingResult(true)

    const currentShuffled = shuffledOptions[currentQuestion]
    if (!currentShuffled) {
      console.error("[Quiz] ❌ No shuffled options found for question", currentQuestion)
      setIsShowingResult(false)
      return
    }

    const originalIndex = currentShuffled.originalIndices[answerIndex]
    const isCorrect = originalIndex === questions[currentQuestion].correct
    let newScore = score
    let newCorrectAnswers = correctAnswers

    // Calculate points earned for this answer
    const pointsPerQuestion = Math.round(100 / (questions.length > 0 ? questions.length : 1))
    const pointsEarned = isCorrect ? pointsPerQuestion : 0

    if (isCorrect) {
      newCorrectAnswers = correctAnswers + 1
      setCorrectAnswers(newCorrectAnswers)

      // Calculate score based on percentage (0-100)
      const totalQuestions = questions.length > 0 ? questions.length : 1
      newScore = Math.round((newCorrectAnswers / totalQuestions) * 100)
      setScore(newScore)
    }

    const newQuestionsAnswered = questionsAnswered + 1
    setQuestionsAnswered(newQuestionsAnswered)

    // 🆕 Save answer to Supabase B for history
    if (playerId && questions[currentQuestion]) {
      participantsApi.addAnswer(params.roomCode, playerId, {
        question_id: String(questions[currentQuestion].id),
        answer_id: String(originalIndex),
        is_correct: isCorrect,
        points_earned: pointsEarned
      }).catch(err => console.error('[Quiz] Error saving answer:', err))
    }


    // Check for memory game trigger
    if (isCorrect && newCorrectAnswers > 0 && newCorrectAnswers % 3 === 0 && currentQuestion < questions.length - 1) {


      if (playerId) {

        await roomManager.updatePlayerScore(params.roomCode, playerId, newScore, newQuestionsAnswered)
      }

      const progressData = {
        currentQuestion: currentQuestion + 1,
        correctAnswers: newCorrectAnswers,
        quizScore: newScore,
        questionsAnswered: newQuestionsAnswered
      }

      localStorage.setItem(`quiz-progress-${params.roomCode}`, JSON.stringify(progressData))

      if (playerId) {
        try {
          await supabaseRoomManager.updateGameProgress(params.roomCode, playerId, progressData)

        } catch (error) {
          console.error("[Quiz] ❌ Error saving progress to Supabase:", error)
        }
      }


      setTimeout(() => {
        window.location.href = `/game/${params.roomCode}/memory-challenge`
      }, 2000)
      return
    }

    // 🚀 OPTIMIZED: Use queue for normal updates, direct update only for last question
    if (playerId) {
      const updateData = {
        quizScore: newScore,
        questionsAnswered: newQuestionsAnswered
      }

      const isLastQuestion = currentQuestion >= questions.length - 1

      if (isLastQuestion) {
        // 🔴 CRITICAL: Last question - use direct update with retry for guaranteed sync
        const attemptUpdate = async (attempt = 1, maxAttempts = 5) => {
          try {
            const success = await roomManager.updatePlayerScore(
              params.roomCode,
              playerId,
              updateData.quizScore,
              updateData.questionsAnswered
            )

            if (success) {
              // Broadcast untuk sync instan
              let broadcastChannel: BroadcastChannel | null = null
              try {
                if (typeof window !== 'undefined') {
                  broadcastChannel = new BroadcastChannel(`progress-update-${params.roomCode}`)
                  broadcastChannel.postMessage({
                    type: 'progress-update',
                    playerId,
                    updateData,
                    timestamp: Date.now()
                  })
                }
              } finally {
                if (broadcastChannel) {
                  broadcastChannel.close()
                }
              }

              await new Promise(resolve => setTimeout(resolve, 1000))
              return true
            } else {
              throw new Error(`Update failed on attempt ${attempt}`)
            }
          } catch (error) {
            console.error(`[Quiz] ❌ Update failed (attempt ${attempt}):`, error)

            if (attempt < maxAttempts) {
              const delay = Math.pow(2, attempt) * 500
              await new Promise(resolve => setTimeout(resolve, delay))
              return attemptUpdate(attempt + 1, maxAttempts)
            } else {
              console.error(`[Quiz] 💥 All ${maxAttempts} attempts failed.`)
              return false
            }
          }
        }

        await attemptUpdate()
      } else {
        // 🚀 REALTIME: Direct update to Supabase B for instant host visibility
        // No queue - direct database update for 0ms delay
        roomManager.updatePlayerScore(
          params.roomCode,
          playerId,
          updateData.quizScore,
          updateData.questionsAnswered
        ).catch(err => console.error('[Quiz] Direct score update failed:', err))
      }
    }

    // Countdown to next question
    setCountdownToNext(1)
    const countdownInterval = setInterval(() => {
      setCountdownToNext((prev: number) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          handleNextQuestion()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // CRITICAL: Handle next question dengan final sync yang lebih robust
  const handleNextQuestion = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setCountdownToNext(0)
    } else {
      // CRITICAL: Quiz completed - final sync sebelum redirect
      if (redirecting) return
      setRedirecting(true)
      setGameFinished(true)



      try {
        // 🚀 OPTIMIZED: Flush all pending queue updates before final sync
        await scoreUpdateQueue.flushNow()

        if (playerId) {
          // 🚀 IMPROVED: Multiple verification attempts for final update
          const finalUpdate = async (attempt = 1, maxAttempts = 3) => {
            try {


              const success = await roomManager.updatePlayerScore(
                params.roomCode,
                playerId,
                score,
                questionsAnswered
              )

              if (success) {


                // 🚀 CRITICAL: Verify the update was actually applied
                const verifyRoom = await roomManager.getRoom(params.roomCode)
                const currentPlayer = verifyRoom?.players.find(p => p.id === playerId)

                if (currentPlayer && (currentPlayer.questionsAnswered || 0) >= questionsAnswered) {

                  return true
                } else {

                  throw new Error(`Verification failed on attempt ${attempt}`)
                }
              }
              throw new Error(`Final update failed on attempt ${attempt}`)
            } catch (error) {
              console.error(`[Quiz] ❌ Final update failed (attempt ${attempt}):`, error)
              if (attempt < maxAttempts) {
                const delay = attempt * 1000 // Progressive delay: 1s, 2s, 3s

                await new Promise(resolve => setTimeout(resolve, delay))
                return finalUpdate(attempt + 1, maxAttempts)
              }
              return false
            }
          }

          const updateSuccess = await finalUpdate()
          if (!updateSuccess) {
            console.error("[Quiz] 💥 All final update attempts failed, but continuing with redirect...")
          }

          // 🚀 IMPROVED: Extra wait time for database sync

          await new Promise(resolve => setTimeout(resolve, 1500))
        }

        // 🚀 IMPROVED: Broadcast progress update before game end
        let progressChannel: BroadcastChannel | null = null
        try {
          if (typeof window !== 'undefined') {
            progressChannel = new BroadcastChannel(`progress-update-${params.roomCode}`)
            progressChannel.postMessage({
              type: 'progress-update',
              playerId,
              updateData: { questionsAnswered, quizScore: score },
              timestamp: Date.now()
            })

          }
        } finally {
          if (progressChannel) {
            progressChannel.close()
          }
        }

        // 🚀 CRITICAL: Update room status to finished - MUST await this!
        try {
          const statusUpdated = await roomManager.updateGameStatus(params.roomCode, "finished")
          if (statusUpdated) {
            console.log("[Quiz] ✅ Game status updated to finished")
          } else {
            console.warn("[Quiz] ⚠️ Failed to update game status to finished")
          }
        } catch (error) {
          console.error("[Quiz] Error updating game status:", error)
        }

        // Small delay to allow Realtime to propagate
        await new Promise(resolve => setTimeout(resolve, 1000))

        if (isHost) {
          window.location.href = `/host/leaderboad?roomCode=${params.roomCode}`
        } else {
          window.location.href = `/result?roomCode=${params.roomCode}`
        }
      } catch (error) {
        console.error("[Quiz] ❌ Error in final sync:", error)
        await new Promise(resolve => setTimeout(resolve, 2000))
        if (isHost) {
          window.location.href = `/host/leaderboad?roomCode=${params.roomCode}`
        } else {
          window.location.href = `/result?roomCode=${params.roomCode}`
        }
      }
    }
  }

  // Render UI
  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="absolute inset-0 opacity-20">
          <div className="pixel-grid"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 bg-linear-to-r from-blue-400 to-purple-400 rounded-lg border-2 border-white shadow-xl flex items-center justify-center pixel-brain mb-4 mx-auto animate-pulse">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">LOADING QUIZ...</h2>
            <p className="text-sm text-blue-200">Preparing your questions</p>
          </div>
        </div>
      </div>
    )
  }

  // CRITICAL: Update kondisi rendering untuk handle currentQuestion negatif
  if (!gameStarted || questions.length === 0 || !room || currentQuestion < 0) { // <-- FIX: Tambahkan currentQuestion < 0

    return (
      <div className="min-h-screen bg-linear-to-br from-background via-card to-muted flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="py-8">
            <div className="text-lg">
              {!gameStarted ? t('lobby.invalidGameSession') :
                questions.length === 0 ? 'Loading questions...' :
                  currentQuestion < 0 ? 'Syncing progress...' : // <-- FIX: Tambahkan pesan ini
                    t('lobby.loadingQuiz')}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progress = (questionsAnswered / (room?.settings.questionCount || questions.length)) * 100

  // CRITICAL: Update UI untuk menampilkan status sync
  if (gameFinished) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 bg-linear-to-r from-blue-400 to-purple-400 rounded-lg border-2 border-white shadow-xl flex items-center justify-center pixel-brain mb-4 mx-auto animate-pulse">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">QUIZ COMPLETED!</h2>
            <p className="text-sm text-blue-200">{t('lobby.redirectingToResults')}</p>
            <p className="text-xs text-blue-300 mt-2">Syncing final scores...</p>
          </div>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const currentShuffled = shuffledOptions[currentQuestion]

  // CRITICAL: Guard clause untuk mencegah render jika shuffled options belum siap
  if (!currentShuffled) {

    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 bg-linear-to-r from-blue-400 to-purple-400 rounded-lg border-2 border-white shadow-xl flex items-center justify-center pixel-brain mb-4 mx-auto animate-pulse">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">LOADING QUESTION...</h2>
            <p className="text-sm text-blue-200">Preparing answer choices</p>
          </div>
        </div>
      </div>
    )
  }

  if (currentQuestion < 0 || currentQuestion >= questions.length) { // <-- FIX: Tambahkan guard clause

    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 bg-linear-to-r from-blue-400 to-purple-400 rounded-lg border-2 border-white shadow-xl flex items-center justify-center pixel-brain mb-4 mx-auto animate-pulse">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">SYNCING PROGRESS...</h2>
            <p className="text-sm text-blue-200">Please wait</p>
          </div>
        </div>
      </div>
    )
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

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header with responsive layout */}
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative shrink-0">
            </div>
            <div className="min-w-0">
              <img
                draggable={false}
                src="/images/memoryquiz.webp"
                alt="Memory Quiz"
                className="h-8 sm:h-12 md:h-16 lg:h-20 xl:h-24 w-auto object-contain drop-shadow-lg"
              />
            </div>
          </div>

          <div className="shrink-0">
            <img
              src="/images/gameforsmartlogo.webp"
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
              className="h-full bg-linear-to-r from-blue-400 to-purple-400 rounded-lg transition-all duration-300"
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
          <div className="bg-linear-to-br from-white/10 to-white/5 border-2 border-white/30 rounded-lg p-6 pixel-lobby-card">
            <div className="text-center mb-6">
              {/* Auto-sizing question text based on length */}
              <div className={needsScrollableContainer(question.question) ? 'max-h-48 overflow-y-auto custom-scrollbar' : ''}>
                <h2 className={`font-bold text-white mb-3 leading-relaxed ${getQuestionFontSize(question.question)}`}>
                  {question.question}
                </h2>
              </div>
            </div>
            <div className="grid gap-3">
              {currentShuffled.shuffled.map((option, index) => {
                const originalIndex = currentShuffled.originalIndices[index]
                const isCorrectAnswer = originalIndex === question.correct

                return (
                  <button
                    key={index}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-300 hover:scale-105 ${showResult
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
                      <div className={`w-8 h-8 rounded border border-white flex items-center justify-center font-bold text-sm ${showResult
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
                      <span className={`font-medium ${getOptionFontSize(option)}`}>{option}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

      </div>

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
