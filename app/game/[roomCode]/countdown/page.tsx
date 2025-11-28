"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import { useRoom } from "@/hooks/use-room"
import { CountdownTimer } from "@/components/countdown-timer"
import { sessionManager } from "@/lib/supabase-session-manager"
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation()
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [hostId, setHostId] = useState<string | null>(null)
  const { room, loading } = useRoom(params.roomCode)

  // Load player data from session manager
  useEffect(() => {
    const loadPlayerData = async () => {
      try {
        const sessionId = sessionManager.getSessionIdFromStorage()
        if (sessionId) {
          const sessionData = await sessionManager.getSessionData(sessionId)
          if (sessionData && sessionData.user_type === 'player') {
            setPlayerId(sessionData.user_data.id)
          } else if (sessionData && sessionData.user_type === 'host') {
            setPlayerId(sessionData.user_data.id)
            setHostId(sessionData.user_data.hostId)
            setIsHost(true)

          }
        }

        // Fallback to localStorage if session not found
        if (!playerId && typeof window !== 'undefined') {
          const player = localStorage.getItem("currentPlayer")
          if (player) {
            const playerInfo = JSON.parse(player)
            setPlayerId(playerInfo.id)
          }
        }
      } catch (error) {
        console.error("[Countdown] Error loading player data:", error)
      }
    }

    loadPlayerData()
  }, [])

  // Determine if user is host based on room data or session
  useEffect(() => {
    if (room && playerId) {
      // Check if this is a host by comparing with room.hostId
      if (room.hostId && hostId && room.hostId === hostId) {
        setIsHost(true)

        return
      }

      // Fallback: check if player is in room.players and is host
      const currentPlayer = room.players.find((p) => p.id === playerId)
      const hostStatus = currentPlayer?.isHost || false
      setIsHost(hostStatus)

    }
  }, [room, playerId, hostId])

  useEffect(() => {
    if (!loading && (!room || !room.gameStarted)) {
      window.location.href = "/"
      return
    }
  }, [room, loading])

  const handleCountdownComplete = () => {


    // Clean up any event listeners that might trigger beforeunload
    window.removeEventListener('beforeunload', () => { })

    if (isHost) {
      // Host goes to monitor page - immediate redirect

      window.location.replace(`/monitor?roomCode=${params.roomCode}`)
    } else {
      // Player goes to quiz page

      window.location.replace(`/quiz/${params.roomCode}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="py-8">
            <div className="text-lg">{t('lobby.loading')}</div>
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
            <div className="text-lg">{t('lobby.invalidGameSession')}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show countdown timer if room is in countdown status
  if (room.status === "countdown") {
    return <CountdownTimer room={room} playerId={playerId || undefined} isHost={isHost} onCountdownComplete={handleCountdownComplete} />
  }

  // Fallback countdown for backward compatibility
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center">
      <Card className="max-w-md mx-auto text-center border-2 border-primary/20">
        <CardContent className="py-16">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            <h1 className="text-2xl font-bold">{t('lobby.getReady')}</h1>
            <Sparkles className="h-8 w-8 text-accent animate-pulse" />
          </div>

          <div className="text-8xl font-bold text-primary mb-6 animate-bounce">10</div>

          <p className="text-lg text-muted-foreground mb-4">{t('lobby.quizAboutToBegin')}</p>

          <div className="text-sm text-muted-foreground">
            {t('lobby.remember')}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
