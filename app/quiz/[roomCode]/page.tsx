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
import { quizApi } from "@/lib/supabase"
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
    console.log("[Quiz] Reset questionsInitialized flag for new room")
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
            console.log("[Quiz] ✅ Loaded player data from session:", sessionData.user_data)
          }
        }

        // Fallback to localStorage if session not found
        if (!playerId && typeof window !== 'undefined') {
          const player = localStorage.getItem("currentPlayer")
          if (player) {
            const playerInfo = JSON.parse(player)
            setPlayerId(playerInfo.id)
            setPlayerData(playerInfo)
            console.log("[Quiz] ✅ Loaded player data from localStorage fallback:", playerInfo)
          }
        }
      } catch (error) {
        console.error("[Quiz] ❌ Error loading player data:", error)
      }
    }

    loadPlayerData()
  }, [])

  // Handle timer expiration
  const handleTimeUp = async () => {
    if (timeUpHandled || redirecting) return
    setTimeUpHandled(true)
    setRedirecting(true)

    console.log("[Quiz] ⏰ Timer expired! Ending game automatically...")

    try {
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
          console.log("[Quiz] 📡 Broadcasted game end event to players")
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
  }

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
        console.log("[Quiz] 🔄 Initial sync from database:", {
          questionsAnswered: dbQuestionsAnswered,
          quizScore: dbQuizScore
        })
        setQuestionsAnswered(dbQuestionsAnswered)
        setScore(dbQuizScore)
        // FIX: Pastikan currentQuestion tidak pernah negatif
        setCurrentQuestion(Math.min(dbQuestionsAnswered, Math.max(0, questions.length - 1)))
        setQuestionsAnsweredInitialized(true)
      }

      console.log("[Quiz] ✅ Host detection:", { playerId, hostStatus, isHostDetected: true })
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
          console.log("[Quiz] 🔄 REAL-TIME SYNC:", {
            questionsAnswered: { old: questionsAnswered, new: dbQuestionsAnswered },
            quizScore: { old: score, new: dbQuizScore },
            timestamp: new Date().toISOString()
          })

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
      console.log("[Quiz] 🔄 Syncing currentQuestion after questions loaded:", questionsAnswered)
      setCurrentQuestion(Math.min(questionsAnswered, questions.length - 1))
    }
  }, [questions.length, questionsAnswered, currentQuestion])

  // Monitor room status for game end
  useEffect(() => {
    if (room && room.status === "finished" && !isHost) {
      console.log("[Quiz] 🎮 Game finished, redirecting to result page...")
      window.location.href = `/result?roomCode=${params.roomCode}`
    }
  }, [room?.status, isHost, params.roomCode])



  // Listen for immediate game end broadcast
  useEffect(() => {
    if (!isHost && params.roomCode) {
      const broadcastChannel = new BroadcastChannel(`game-end-${params.roomCode}`)

      broadcastChannel.onmessage = (event) => {
        if (event.data.type === 'game-ended') {
          console.log("[Quiz] 📡 Game end broadcast received - redirecting...")
          broadcastChannel.close()
          window.location.href = `/result?roomCode=${params.roomCode}`
        }
      }

      return () => {
        broadcastChannel.close()
      }
    }
  }, [isHost, params.roomCode])

  // CRITICAL: Initialize quiz questions - FIX infinite loading
  useEffect(() => {
    if (!loading && (!room || !room.gameStarted)) {
      console.log("[Quiz] ❌ Room not ready or game not started, redirecting to home...")
      window.location.href = "/"
      return
    }

    if (!room || loading) {
      console.log("[Quiz] ⏳ Waiting for room data... Room:", !!room, "Loading:", loading)
      return
    }

    // Cek apakah soal sudah diinisialisasi sebelumnya menggunakan useRef
    if (questionsInitialized.current) {
      console.log("[Quiz] ⚠️ Questions already initialized, skipping...")
      return
    }

    const initQuestions = async () => {
      console.log("[Quiz] ✅ Starting question initialization...")
      questionsInitialized.current = true

      // FIX: Use room.quizId as primary source, fallback to searchParams or default
      const quizId = room.quizId || searchParams.quizId || "math-basic"
      const questionCount = room.settings.questionCount
      const timeLimit = room.settings.totalTimeLimit

      console.log("[Quiz] 📋 Quiz config - ID:", quizId, "Count:", questionCount, "Time:", timeLimit)

      // Try to get from local data first
      const localQuiz = getQuizById(quizId)
      let quizQuestions: Question[] = []
      let title = ""

      if (localQuiz) {
        console.log("[Quiz] 📚 Local quiz data loaded:", localQuiz.title)
        const countToFetch = questionCount === 0 ? localQuiz.questions.length : questionCount
        quizQuestions = getRandomQuestions(localQuiz, countToFetch)
        title = localQuiz.title
      } else {
        console.log("[Quiz] 🔍 Local quiz not found, trying Supabase...")
        try {
          const supabaseQuiz = await quizApi.getQuizById(quizId)
          if (supabaseQuiz) {
            console.log("[Quiz] 📚 Supabase quiz data loaded:", supabaseQuiz.title)
            title = supabaseQuiz.title

            // Collect all potential answers for distractors (Pass 1)
            const allPotentialAnswers = new Set<string>()
            supabaseQuiz.questions.forEach((q: any) => {
              const ans = q.correct_answer || q.correct || q.answer
              if (ans) allPotentialAnswers.add(String(ans))

              const opts = q.options || q.choices || q.answers
              if (Array.isArray(opts)) {
                opts.forEach((o: any) => {
                  if (typeof o === 'object' && o !== null) {
                    // Handle object structure like { answer: "..." }
                    const val = o.answer || o.text || o.value || o.label
                    if (val) allPotentialAnswers.add(String(val))
                  } else {
                    allPotentialAnswers.add(String(o))
                  }
                })
              }
            })
            const distractorPool = Array.from(allPotentialAnswers)

            // Map Supabase questions to local format
            const mappedQuestions: Question[] = supabaseQuiz.questions.map((q: any, index) => {
              // 1. Robust Option Extraction
              let rawOptions = q.options || q.choices || q.answers || []
              let options: string[] = []

              if (Array.isArray(rawOptions)) {
                options = rawOptions.map((opt: any) => {
                  if (typeof opt === 'object' && opt !== null) {
                    // Handle { id: "0", answer: "13" } format from Supabase JSONB
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
              // The correct_answer field might be the answer text itself (e.g. "13") or an index
              const rawCorrectAnswer = q.correct_answer || q.correct || q.answer

              // 3. Ensure Correct Answer is in options
              let correctIndex = -1

              if (rawCorrectAnswer !== undefined && rawCorrectAnswer !== null) {
                const correctStr = String(rawCorrectAnswer).trim()

                // First, try to find matching option text
                correctIndex = options.findIndex(opt => opt.trim() === correctStr)

                // If not found, try case-insensitive
                if (correctIndex === -1) {
                  correctIndex = options.findIndex(opt => opt.toLowerCase().trim() === correctStr.toLowerCase())
                }

                // If still not found, check if rawCorrectAnswer is actually a valid index (0-3)
                // BUT only if it looks like a number and is within range
                if (correctIndex === -1 && !isNaN(Number(rawCorrectAnswer))) {
                  const idx = Number(rawCorrectAnswer)
                  if (idx >= 0 && idx < options.length) {
                    correctIndex = idx
                  }
                }

                // If STILL not found, add it as a new option
                if (correctIndex === -1) {
                  options.push(correctStr)
                  correctIndex = options.length - 1
                }
              } else {
                // No correct answer specified? Default to 0 if options exist
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

              // 4b. Numeric Distractor Generation (if pool failed or empty)
              if (options.length < 4 && rawCorrectAnswer && !isNaN(Number(rawCorrectAnswer))) {
                const num = Number(rawCorrectAnswer)
                const offsets = [-1, 1, -2, 2, -3, 3]
                for (const offset of offsets) {
                  if (options.length >= 4) break
                  const dist = String(num + offset)
                  if (!options.includes(dist)) options.push(dist)
                }
              }

              // 5. FINAL FALLBACK: If options are STILL empty, add placeholders
              if (options.length === 0) {
                console.warn(`[Quiz] ⚠️ Question ${index + 1} has NO options and NO correct answer. Adding placeholders.`)
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

            // Shuffle and limit
            const shuffled = [...mappedQuestions].sort(() => Math.random() - 0.5)
            const countToFetch = questionCount === 0 ? shuffled.length : questionCount
            quizQuestions = shuffled.slice(0, countToFetch)
          } else {
            console.error("[Quiz] ❌ Quiz not found in Supabase either:", quizId)
            // Fallback to math-basic if everything fails
            const fallbackQuiz = getQuizById("math-basic")
            if (fallbackQuiz) {
              const countToFetch = questionCount === 0 ? fallbackQuiz.questions.length : questionCount
              quizQuestions = getRandomQuestions(fallbackQuiz, countToFetch)
              title = fallbackQuiz.title
            }
          }
        } catch (err) {
          console.error("[Quiz] ❌ Error fetching from Supabase:", err)
          // Fallback
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
        console.log("[Quiz] 🎯 Selected questions:", quizQuestions.length, "questions")

        setQuestions(quizQuestions)
        setQuizTitle(title)
        setTotalTimeSelected(timeLimit)

        // Create shuffled options for each question
        const shuffledOptionsMap: { [questionIndex: number]: { shuffled: string[], originalIndices: number[] } } = {}
        quizQuestions.forEach((question, index) => {
          const shuffled = shuffleArrayWithIndices(question.options)
          shuffledOptionsMap[index] = shuffled
        })
        console.log("[Quiz] 🔀 Shuffled options for", Object.keys(shuffledOptionsMap).length, "questions")
        setShuffledOptions(shuffledOptionsMap)
      } else {
        console.error("[Quiz] ❌ Failed to load any questions")
        setQuestions([])
        setQuizTitle("Quiz Not Found")
      }
    }

    initQuestions()
  }, [searchParams, params.roomCode, room, loading])

  // CRITICAL: Timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (questions.length === 0 && gameStarted && !loading) {
        console.error("[Quiz] ⏰ Quiz loading timeout - questions still empty after", QUIZ_LOAD_TIMEOUT, "ms")
        console.log("[Quiz] 📊 Current state - questions:", questions.length, "gameStarted:", gameStarted, "loading:", loading)
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
        console.log("[Quiz] 🎮 Memory game return detected:", memoryReturn)
        const data = JSON.parse(memoryReturn)

        // Restore progress data from Supabase
        if (playerId) {
          const progressData = await supabaseRoomManager.getPlayerGameProgress(params.roomCode, playerId)
          if (progressData && progressData.game_progress) {
            const progress = progressData.game_progress
            console.log("[Quiz] 📥 Restoring progress data from Supabase:", progress)
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
        console.log("[Quiz] ✅ Memory game return processed")

        // Check if player has completed all questions after memory game
        const totalQuestions = room?.settings.questionCount || 10
        const currentQuestionsAnswered = questionsAnswered || 0

        if (currentQuestionsAnswered >= totalQuestions) {
          console.log("[Quiz] 🎯 Player completed all questions after memory game, ending game...")

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

    if (isCorrect) {
      newScore = score + 1
      setScore(newScore)
      newCorrectAnswers = correctAnswers + 1
      setCorrectAnswers(newCorrectAnswers)
    }

    const newQuestionsAnswered = questionsAnswered + 1
    setQuestionsAnswered(newQuestionsAnswered)

    console.log("[Quiz] ✅ ANSWER CHECKED - Correct:", isCorrect, "Score:", newScore, "Questions Answered:", newQuestionsAnswered)

    // Check for memory game trigger
    if (isCorrect && newCorrectAnswers > 0 && newCorrectAnswers % 3 === 0 && currentQuestion < questions.length - 1) {
      console.log("[Quiz] 🎯 MEMORY GAME TRIGGER - Player has answered", newCorrectAnswers, "correct questions")

      if (playerId) {
        console.log("[Quiz] 🎯 Updating final scores before memory redirect")
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
          console.log("[Quiz] ✅ Progress saved to Supabase before memory game")
        } catch (error) {
          console.error("[Quiz] ❌ Error saving progress to Supabase:", error)
        }
      }

      console.log("[Quiz] 🚀 Redirecting to memory challenge in 2 seconds...")
      setTimeout(() => {
        window.location.href = `/game/${params.roomCode}/memory-challenge`
      }, 2000)
      return
    }

    // CRITICAL: Update progress to Supabase dengan menunggu selesai
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
        isLastQuestion: currentQuestion >= questions.length - 1,
        timestamp: new Date().toISOString()
      })

      // Retry mechanism dengan await
      const attemptUpdate = async (attempt = 1, maxAttempts = 5) => {
        try {
          const success = await roomManager.updatePlayerScore(
            params.roomCode,
            playerId,
            updateData.quizScore,
            updateData.questionsAnswered
          )

          if (success) {
            console.log(`[Quiz] ✅ Progress updated successfully (attempt ${attempt})`)

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
                console.log("[Quiz] 📡 Broadcasted progress update")
              }
            } finally {
              if (broadcastChannel) {
                broadcastChannel.close()
              }
            }

            // Jika soal terakhir, tunggu sebentar sebelum lanjut
            if (currentQuestion >= questions.length - 1) {
              console.log("[Quiz] 🎯 Last question answered, waiting for sync...")
              await new Promise(resolve => setTimeout(resolve, 1000))
            }

            return true
          } else {
            throw new Error(`Update failed on attempt ${attempt}`)
          }
        } catch (error) {
          console.error(`[Quiz] ❌ Update failed (attempt ${attempt}):`, error)

          if (attempt < maxAttempts) {
            const delay = Math.pow(2, attempt) * 500
            console.log(`[Quiz] 🔄 Retrying in ${delay}ms...`)
            await new Promise(resolve => setTimeout(resolve, delay))
            return attemptUpdate(attempt + 1, maxAttempts)
          } else {
            console.error(`[Quiz] 💥 All ${maxAttempts} attempts failed.`)
            return false
          }
        }
      }

      // Jalankan update dan tunggu selesai
      await attemptUpdate()
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

      console.log("[Quiz] 🎉 Quiz completed! Starting robust final sync...")

      try {
        if (playerId) {
          // 🚀 IMPROVED: Multiple verification attempts for final update
          const finalUpdate = async (attempt = 1, maxAttempts = 3) => {
            try {
              console.log(`[Quiz] 🔄 Final update attempt ${attempt}/${maxAttempts}...`)

              const success = await roomManager.updatePlayerScore(
                params.roomCode,
                playerId,
                score,
                questionsAnswered
              )

              if (success) {
                console.log(`[Quiz] ✅ Final update successful (attempt ${attempt})`)

                // 🚀 CRITICAL: Verify the update was actually applied
                const verifyRoom = await roomManager.getRoom(params.roomCode)
                const currentPlayer = verifyRoom?.players.find(p => p.id === playerId)

                if (currentPlayer && (currentPlayer.questionsAnswered || 0) >= questionsAnswered) {
                  console.log(`[Quiz] ✅ VERIFICATION PASSED - questionsAnswered: ${currentPlayer.questionsAnswered}`)
                  return true
                } else {
                  console.log(`[Quiz] ⚠️ VERIFICATION FAILED - expected >= ${questionsAnswered}, got ${currentPlayer?.questionsAnswered || 0}`)
                  throw new Error(`Verification failed on attempt ${attempt}`)
                }
              }
              throw new Error(`Final update failed on attempt ${attempt}`)
            } catch (error) {
              console.error(`[Quiz] ❌ Final update failed (attempt ${attempt}):`, error)
              if (attempt < maxAttempts) {
                const delay = attempt * 1000 // Progressive delay: 1s, 2s, 3s
                console.log(`[Quiz] ⏳ Retrying in ${delay}ms...`)
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
          console.log("[Quiz] ⏳ Waiting for database sync...")
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
            console.log("[Quiz] 📡 Broadcasted final progress update")
          }
        } finally {
          if (progressChannel) {
            progressChannel.close()
          }
        }

        // Update room status jika belum finished (don't wait for this)
        roomManager.updateGameStatus(params.roomCode, "finished").catch(error => {
          console.error("[Quiz] Error updating game status:", error)
        })

        // Broadcast game end
        let broadcastChannel: BroadcastChannel | null = null
        try {
          if (typeof window !== 'undefined') {
            broadcastChannel = new BroadcastChannel(`game-end-${params.roomCode}`)
            broadcastChannel.postMessage({
              type: 'game-ended',
              roomCode: params.roomCode,
              timestamp: Date.now()
            })
            console.log("[Quiz] 📡 Broadcasted game end event")
          }
        } finally {
          if (broadcastChannel) {
            broadcastChannel.close()
          }
        }

        // 🚀 IMPROVED: Shorter delay since we already waited for sync
        console.log(`[Quiz] ⏳ Final delay before redirect...`)
        await new Promise(resolve => setTimeout(resolve, 2000))

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
    console.log("[Quiz] ❌ Game not ready - gameStarted:", gameStarted, "questions:", questions.length, "room:", !!room, "currentQuestion:", currentQuestion)
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
    console.log("[Quiz] ❌ Shuffled options not ready for question", currentQuestion)
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
    console.log("[Quiz] ❌ Invalid currentQuestion index:", currentQuestion)
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
              <h2 className="text-xl font-bold text-white mb-3">{question.question}</h2>
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
                      <span className="text-sm font-medium">{option}</span>
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
