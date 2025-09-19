"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, Clock } from "lucide-react"
import { useRoom } from "@/hooks/use-room"
import { roomManager } from "@/lib/room-manager"

interface WaitingRoomProps {
  username: string
  avatar: string
  roomCode: string
  playerId: string
  onBack: () => void
}

export function WaitingRoom({ username, avatar, roomCode, playerId, onBack }: WaitingRoomProps) {
  const { room, loading } = useRoom(roomCode)
  const [gameStarting, setGameStarting] = useState(false)

  useEffect(() => {
    if (room?.gameStarted && !gameStarting) {
      setGameStarting(true)
      const gameSession = localStorage.getItem(`game-${roomCode}`)
      if (gameSession) {
        const { quizId, settings } = JSON.parse(gameSession)
        const params = new URLSearchParams({
          quizId,
          questionCount: settings.questionCount.toString(),
          timeLimit: settings.timeLimit.toString(),
        })
        window.location.href = `/game/${roomCode}/quiz?${params.toString()}`
      }
    }
  }, [room?.gameStarted, gameStarting, roomCode])

  const handleLeaveRoom = () => {
    roomManager.leaveRoom(roomCode, playerId)
    localStorage.removeItem("currentPlayer")
    onBack()
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="text-center">
          <CardContent className="py-12">
            <p>Loading room...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="text-center">
          <CardContent className="py-12">
            <p>Room not found</p>
            <Button onClick={onBack} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (gameStarting) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="text-center">
          <CardContent className="py-12">
            <div className="text-2xl font-bold text-primary mb-4">Starting Quiz...</div>
            <p className="text-muted-foreground">Redirecting to the game...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Waiting Room</CardTitle>
          <CardDescription>
            Room Code: <span className="font-mono font-bold text-primary">{roomCode}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5" />
            <span className="font-medium">Players ({room.players.length})</span>
          </div>

          <div className="grid gap-3">
            {room.players.map((player) => (
              <div key={player.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="text-2xl">{player.avatar}</div>
                <div className="flex-1">
                  <div className="font-medium">
                    {player.username}
                    {player.username === username && <span className="text-primary ml-2">(You)</span>}
                    {player.isHost && <span className="text-accent ml-2">(Host)</span>}
                  </div>
                </div>
                <Badge variant="outline">Ready</Badge>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center">
            <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {room.gameStarted ? "Game starting soon..." : "Waiting for host to start the game..."}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button variant="outline" onClick={handleLeaveRoom}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Leave Room
        </Button>
      </div>
    </div>
  )
}
