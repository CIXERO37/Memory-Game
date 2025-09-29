"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, Trophy, Users, Target } from "lucide-react"
import { getQuizById, getRandomQuestions, type Question } from "@/lib/quiz-data"
import { useRoom } from "@/hooks/use-room"
import { roomManager } from "@/lib/room-manager"

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

export default function QuizPage({ params, searchParams }: QuizPageProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [gameFinished, setGameFinished] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [quizTitle, setQuizTitle] = useState("")
  const [gameStarted, setGameStarted] = useState(false)
  const [isInMemoryGame, setIsInMemoryGame] = useState(false)
  const [memoryGameScore, setMemoryGameScore] = useState(0)
  const [playerId] = useState(() => {
    const player = localStorage.getItem("currentPlayer")
    return player ? JSON.parse(player).id : null
  })
  const [isHost, setIsHost] = useState(false)
  const [previousRankings, setPreviousRankings] = useState<{ [key: string]: number }>({})
  const [rankingChanges, setRankingChanges] = useState<{ [key: string]: "up" | "down" | null }>({})
  const { room, loading } = useRoom(params.roomCode)

  useEffect(() => {
    if (room && playerId) {
      const currentPlayer = room.players.find((p) => p.id === playerId)
      const hostStatus = currentPlayer?.isHost || false
      setIsHost(hostStatus)

      // Debug log for host detection
      console.log("[v0] Host detection:", { playerId, currentPlayer, hostStatus })
    }
  }, [room, playerId])

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

  // Initialize quiz questions
  useEffect(() => {
    if (!loading && (!room || !room.gameStarted)) {
      window.location.href = "/"
      return
    }

    if (!room || loading) return

    setGameStarted(true)

    const quizId = searchParams.quizId || "math-basic"
    const questionCount = Number.parseInt(searchParams.questionCount || "10")
    const timeLimit = Number.parseInt(searchParams.timeLimit || "30")

    const quiz = getQuizById(quizId)
    if (quiz) {
      const selectedQuestions = getRandomQuestions(quiz, questionCount)
      setQuestions(selectedQuestions)
      setQuizTitle(quiz.title)
      setTimeRemaining(timeLimit)
    }
  }, [searchParams, params.roomCode, room, loading])

  useEffect(() => {
    const checkMemoryGameReturn = () => {
      const memoryReturn = localStorage.getItem(`memory-return-${params.roomCode}`)
      if (memoryReturn) {
        const data = JSON.parse(memoryReturn)
        setMemoryGameScore(data.score || 0)
        setCurrentQuestion(data.resumeQuestion || currentQuestion)
        localStorage.removeItem(`memory-return-${params.roomCode}`)

        // Update total score in room
        if (playerId) {
          roomManager.updatePlayerMemoryScore(params.roomCode, playerId, data.score || 0)
        }
      }
    }

    if (gameStarted && !isHost) {
      checkMemoryGameReturn()
    }
  }, [gameStarted, params.roomCode, playerId, isHost, currentQuestion])

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0 || gameFinished || questions.length === 0 || isInMemoryGame) {
      if (timeRemaining <= 0) {
        handleNextQuestion()
      }
      return
    }

    const timer = setTimeout(() => {
      setTimeRemaining(timeRemaining - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeRemaining, gameFinished, questions.length, isInMemoryGame])

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null || showResult) return
    setSelectedAnswer(answerIndex)
    setShowResult(true)

    // Check if correct
    if (answerIndex === questions[currentQuestion].correct) {
      const newScore = score + 1
      setScore(newScore)
      const newCorrectAnswers = correctAnswers + 1
      setCorrectAnswers(newCorrectAnswers)

      if (newCorrectAnswers === 3) {
        // Update quiz score immediately
        if (playerId) {
          roomManager.updatePlayerScore(params.roomCode, playerId, newScore)
        }

        // Store current progress and redirect to memory game
        localStorage.setItem(
          `quiz-progress-${params.roomCode}`,
          JSON.stringify({
            currentQuestion: currentQuestion + 1,
            score: newScore,
            correctAnswers: newCorrectAnswers,
            timeLimit: searchParams.timeLimit || "30",
          }),
        )

        setTimeout(() => {
          window.location.href = `/game/${params.roomCode}/memory-challenge`
        }, 2000)
        return
      }
    }

    // Update score in real-time for host monitoring
    if (playerId) {
      roomManager.updatePlayerScore(
        params.roomCode,
        playerId,
        score + (answerIndex === questions[currentQuestion].correct ? 1 : 0),
      )
    }

    // Auto advance after 2 seconds
    setTimeout(() => {
      handleNextQuestion()
    }, 2000)
  }

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setTimeRemaining(Number.parseInt(searchParams.timeLimit || "30"))
    } else {
      setGameFinished(true)

      if (playerId) {
        roomManager.updatePlayerScore(params.roomCode, playerId, score)
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
            <div className="text-lg">{!gameStarted ? "Invalid game session. Redirecting..." : "Loading quiz..."}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progress = (currentQuestion / questions.length) * 100

  if (gameFinished) {
    const totalScore = score + memoryGameScore
    
    // Get player name from localStorage
    const getPlayerName = () => {
      try {
        const player = localStorage.getItem("currentPlayer")
        return player ? JSON.parse(player).username : "Player"
      } catch {
        return "Player"
      }
    }
    
    const playerName = getPlayerName()

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

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="max-w-lg mx-auto">
            {/* Main Result Card */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 border-4 border-white/30 rounded-lg p-8 pixel-lobby-card text-center">
              {/* Game Title */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white pixel-header-title">MEMORY QUIZ GAME</h1>
              </div>
              
              {/* Player Avatar */}
              <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden mx-auto mb-6">
                <img
                  src="/ava1.png"
                  alt="Player Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Player Name */}
              <h2 className="text-xl font-bold text-white mb-6">{playerName}</h2>
              
              {/* Score Display */}
              <div className="mb-8">
                <div className="text-5xl font-bold text-white mb-2">{totalScore}</div>
                <div className="text-lg text-white">points</div>
              </div>
              
              {/* Player Position */}
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-white/30 rounded-lg p-6 mb-8">
                <div className="text-lg text-white mb-3">Your Position</div>
                <div className="text-4xl font-bold text-yellow-400">#1</div>
              </div>
              
              {/* Play Again Button */}
              <button
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-4 border-white/30 rounded-lg px-8 py-4 text-white font-bold text-lg transition-all duration-300 hover:scale-105 pixel-button flex items-center justify-center gap-3"
                onClick={() => {
                  roomManager.updateGameStatus(params.roomCode, "finished")
                  window.location.href = "/"
                }}
              >
                ⭐ PLAY AGAIN
              </button>
            </div>
          </div>
        </div>
        
        {/* Pixel Background Elements */}
        <PixelBackgroundElements />
      </div>
    )
  }

  const question = questions[currentQuestion]

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg border-2 border-white shadow-xl flex items-center justify-center pixel-brain">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white pixel-header-title">QUIZ GAME</h1>
              <p className="text-sm text-blue-200">Room: {params.roomCode}</p>
            </div>
          </div>
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg px-3 py-1">
            <span className="text-blue-400 font-bold text-xs">Question {currentQuestion + 1} of {questions.length}</span>
          </div>
        </div>

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
          <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-white/30 rounded-lg p-3 pixel-lobby-card">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-red-400 rounded border border-white flex items-center justify-center">
                <Clock className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-bold text-white">TIME</span>
            </div>
            <div className={`text-lg font-bold ${timeRemaining <= 10 ? "text-red-400" : "text-red-400"}`}>
              {timeRemaining}s
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-2 border-white/30 rounded-lg p-3 pixel-lobby-card">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-yellow-400 rounded border border-white flex items-center justify-center">
                <Trophy className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-bold text-white">SCORE</span>
            </div>
            <div className="text-lg font-bold text-yellow-400">{score + memoryGameScore}</div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-cyan-500/20 border-2 border-white/30 rounded-lg p-3 pixel-lobby-card">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-green-400 rounded border border-white flex items-center justify-center">
                <Target className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-bold text-white">CORRECT</span>
            </div>
            <div className={`text-lg font-bold ${correctAnswers >= 3 ? "text-green-400" : "text-gray-400"}`}>
              {correctAnswers}/3
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/30 rounded-lg p-6 pixel-lobby-card">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-3">{question.question}</h2>
            </div>
            <div className="grid gap-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                    showResult
                      ? index === question.correct
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
                        ? index === question.correct
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
              ))}
            </div>
          </div>
        </div>

        {showResult && (
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              {selectedAnswer === question.correct ? "Correct! 🎉" : "Incorrect. The correct answer was highlighted."}
            </p>
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
