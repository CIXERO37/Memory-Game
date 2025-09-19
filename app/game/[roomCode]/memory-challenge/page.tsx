"use client"

import { useState, useEffect } from "react"
import { MemoryGame } from "@/components/memory-game"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Clock, Target } from "lucide-react"
import { roomManager } from "@/lib/room-manager"

interface MemoryChallengePageProps {
  params: {
    roomCode: string
  }
}

export default function MemoryChallengePage({ params }: MemoryChallengePageProps) {
  const [correctMatches, setCorrectMatches] = useState(0)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [gameWon, setGameWon] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [playerId] = useState(() => {
    const player = localStorage.getItem("currentPlayer")
    return player ? JSON.parse(player).id : null
  })

  useEffect(() => {
    const checkAccess = () => {
      const quizProgress = localStorage.getItem(`quiz-progress-${params.roomCode}`)

      if (!quizProgress) {
        window.location.href = "/"
        return
      }

      const progressData = JSON.parse(quizProgress)
      if (progressData.correctAnswers >= 3) {
        setHasAccess(true)
      } else {
        window.location.href = `/game/${params.roomCode}/quiz`
        return
      }

      setLoading(false)
    }

    checkAccess()
  }, [params.roomCode])

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0 || gameCompleted || !hasAccess) {
      if (timeRemaining <= 0 && !gameCompleted) {
        handleGameEnd()
      }
      return
    }

    const timer = setTimeout(() => {
      setTimeRemaining(timeRemaining - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeRemaining, gameCompleted, hasAccess])

  useEffect(() => {
    if (correctMatches >= 8) {
      setGameCompleted(true)
      setGameWon(true)
      handleGameEnd()
    }
  }, [correctMatches])

  const handleGameEnd = () => {
    setGameCompleted(true)

    const memoryScore = correctMatches * 10 // 10 points per match

    // Update memory score in room
    if (playerId) {
      roomManager.updatePlayerMemoryScore(params.roomCode, playerId, memoryScore)
    }

    // Store return data for quiz page
    const quizProgress = localStorage.getItem(`quiz-progress-${params.roomCode}`)
    const progressData = quizProgress ? JSON.parse(quizProgress) : {}

    localStorage.setItem(
      `memory-return-${params.roomCode}`,
      JSON.stringify({
        score: memoryScore,
        resumeQuestion: progressData.currentQuestion || 0,
      }),
    )

    // Clean up progress data
    localStorage.removeItem(`quiz-progress-${params.roomCode}`)

    // Auto-redirect back to quiz after 3 seconds
    setTimeout(() => {
      window.location.href = `/game/${params.roomCode}/quiz`
    }, 3000)
  }

  const handleCorrectMatch = () => {
    setCorrectMatches((prev) => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="py-8">
            <div className="text-lg">Validating access...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="py-8">
            <div className="text-lg">Access denied. Redirecting...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 text-balance">Memory Mini-Game</h1>
          <p className="text-muted-foreground text-pretty">Find all matching pairs within 30 seconds!</p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-4 mb-6">
          <Card className="text-center">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Matches</span>
              </div>
              <div className="text-lg font-bold text-primary">{correctMatches}/8</div>
            </CardContent>
          </Card>

          <Card className="text-center">
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
        </div>

        {/* Game Result */}
        {gameCompleted && (
          <Card className="max-w-md mx-auto mb-6 border-accent bg-accent/5">
            <CardHeader className="text-center pb-3">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-accent" />
              <CardTitle className="text-accent">Memory Challenge Complete!</CardTitle>
              <CardDescription>
                You found {correctMatches} pairs and earned {correctMatches * 10} points!
                <br />
                <span className="text-sm text-muted-foreground">Returning to quiz in 3 seconds...</span>
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Memory Game */}
        {!gameCompleted && (
          <div className="max-w-2xl mx-auto">
            <MemoryGame onCorrectMatch={handleCorrectMatch} disabled={gameCompleted} />
          </div>
        )}

        {/* Instructions */}
        {!gameCompleted && (
          <Card className="max-w-md mx-auto mt-6">
            <CardContent className="py-4">
              <h3 className="font-semibold mb-2 text-center">How to Play</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Cards will show for 3 seconds, then flip over</li>
                <li>• Click two cards to find matching pairs</li>
                <li>• Find all 8 pairs to maximize your score</li>
                <li>• You have exactly 30 seconds to play!</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
