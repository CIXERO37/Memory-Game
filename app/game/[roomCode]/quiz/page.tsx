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
import { HostMonitor } from "@/components/host-monitor"

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
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="py-8">
            <div className="text-lg">Loading...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isHost && !loading && room) {
    const questionCount = Number.parseInt(searchParams.questionCount || "10")
    return <HostMonitor roomCode={params.roomCode} totalQuestions={questionCount} />
  }

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

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl">Game Complete!</CardTitle>
            <CardDescription>Great job completing the {quizTitle} quiz and memory challenge</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">{totalScore}</div>
              <div className="text-sm text-muted-foreground">
                Quiz: {score} points | Memory: {memoryGameScore} points
              </div>
            </div>
            <p className="text-muted-foreground">Quiz Score: {Math.round((score / questions.length) * 100)}%</p>

            <Button
              className="w-full"
              onClick={() => {
                roomManager.updateGameStatus(params.roomCode, "finished")
                window.location.href = "/"
              }}
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const question = questions[currentQuestion]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-medium">Room: {params.roomCode}</span>
          </div>
          <Badge variant="secondary">
            Question {currentQuestion + 1} of {questions.length}
          </Badge>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Timer, Score, and Correct Answers */}
        <div className="flex justify-center gap-4 mb-8">
          <Card>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">Time</span>
              </div>
              <div className={`text-lg font-bold ${timeRemaining <= 10 ? "text-destructive" : "text-accent"}`}>
                {timeRemaining}s
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Score</span>
              </div>
              <div className="text-lg font-bold text-primary">{score + memoryGameScore}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">Correct</span>
              </div>
              <div className={`text-lg font-bold ${correctAnswers >= 3 ? "text-accent" : "text-muted-foreground"}`}>
                {correctAnswers}/3
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl text-center text-balance">{question.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {question.options.map((option, index) => (
              <Button
                key={index}
                variant={
                  showResult
                    ? index === question.correct
                      ? "default"
                      : selectedAnswer === index
                        ? "destructive"
                        : "outline"
                    : selectedAnswer === index
                      ? "secondary"
                      : "outline"
                }
                className="w-full text-left justify-start h-auto py-4 px-6"
                onClick={() => handleAnswerSelect(index)}
                disabled={selectedAnswer !== null}
              >
                <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                {option}
              </Button>
            ))}
          </CardContent>
        </Card>

        {showResult && (
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              {selectedAnswer === question.correct ? "Correct! 🎉" : "Incorrect. The correct answer was highlighted."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
