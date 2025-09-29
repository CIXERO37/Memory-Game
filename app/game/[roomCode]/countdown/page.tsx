"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import { useRoom } from "@/hooks/use-room"

interface CountdownPageProps {
  params: {
    roomCode: string
  }
  searchParams: {
    quizId?: string
    questionCount?: string
    timeLimit?: string
  }
}

export default function CountdownPage({ params, searchParams }: CountdownPageProps) {
  const [countdown, setCountdown] = useState(5)
  const { room, loading } = useRoom(params.roomCode)

  useEffect(() => {
    if (!loading && (!room || !room.gameStarted)) {
      window.location.href = "/"
      return
    }
  }, [room, loading])

  useEffect(() => {
    if (!room || loading) return

    if (countdown === 0) {
      const params_url = new URLSearchParams({
        quizId: searchParams.quizId || "math-basic",
        questionCount: room.settings.questionCount.toString(),
        timeLimit: room.settings.totalTimeLimit.toString(),
      })

      window.location.href = `/game/${params.roomCode}/quiz?${params_url.toString()}`
      return
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, params.roomCode, searchParams, room, loading])

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

  if (!room || !room.gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="py-8">
            <div className="text-lg">Invalid game session. Redirecting...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center">
      <Card className="max-w-md mx-auto text-center border-2 border-primary/20">
        <CardContent className="py-16">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            <h1 className="text-2xl font-bold">Get Ready!</h1>
            <Sparkles className="h-8 w-8 text-accent animate-pulse" />
          </div>

          <div className="text-8xl font-bold text-primary mb-6 animate-bounce">{countdown}</div>

          <p className="text-lg text-muted-foreground mb-4">The quiz is about to begin!</p>

          <div className="text-sm text-muted-foreground">
            Remember: Answer 3+ questions correctly to unlock the memory mini-game
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
