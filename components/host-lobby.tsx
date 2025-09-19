"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Copy, QrCode, Share, Users, Play } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRoom } from "@/hooks/use-room"
import { roomManager } from "@/lib/room-manager"

interface HostLobbyProps {
  roomCode: string
  hostId: string
  quizId: string
  settings: { timeLimit: number; questionCount: number }
  onBack: () => void
}

export function HostLobby({ roomCode, hostId, quizId, settings, onBack }: HostLobbyProps) {
  const { room, loading } = useRoom(roomCode)
  const [gameStarted, setGameStarted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (room?.gameStarted) {
      setGameStarted(true)
    }
  }, [room])

  const shareUrl = `${window.location.origin}/join?room=${roomCode}`

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    toast({
      title: "Room code copied!",
      description: "Share this code with your friends",
    })
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Share link copied!",
      description: "Send this link to your friends",
    })
  }

  const startGame = () => {
    if (gameStarted || !room) return

    const success = roomManager.startGame(roomCode, hostId)
    if (success) {
      setGameStarted(true)

      // Store game session info
      localStorage.setItem(
        `game-${roomCode}`,
        JSON.stringify({
          quizId,
          settings,
          startedAt: new Date().toISOString(),
        }),
      )

      const params = new URLSearchParams({
        quizId,
        questionCount: settings.questionCount.toString(),
        timeLimit: settings.timeLimit.toString(),
      })

      window.location.href = `/game/${roomCode}/quiz?${params.toString()}`
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading room...</div>
  }

  if (!room) {
    return <div className="text-center py-8">Room not found</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Room Info */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Room Created!</CardTitle>
          <CardDescription>Share the room code or link with your friends</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Room Code */}
          <div className="text-center">
            <Label className="text-sm font-medium text-muted-foreground">Room Code</Label>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="text-4xl font-bold font-mono tracking-wider text-primary bg-primary/10 px-6 py-3 rounded-lg">
                {roomCode}
              </div>
              <Button variant="outline" size="icon" onClick={copyRoomCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Share Options */}
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={copyShareLink}>
              <Share className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button variant="outline">
              <QrCode className="h-4 w-4 mr-2" />
              Show QR Code
            </Button>
          </div>

          {/* Quiz Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Quiz Settings</h3>
            <div className="flex gap-4 text-sm">
              <Badge variant="secondary">{settings.questionCount} questions</Badge>
              <Badge variant="secondary">{settings.timeLimit}s per question</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Players who answer 3+ questions correctly will unlock the memory mini-game!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Players List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Players ({room.players.length})</CardTitle>
            </div>
            {room.players.length >= 1 && !gameStarted && (
              <Button onClick={startGame} className="font-semibold">
                <Play className="h-4 w-4 mr-2" />
                Start Quiz
              </Button>
            )}
            {gameStarted && <Badge variant="secondary">Game Started</Badge>}
          </div>
          <CardDescription>
            {room.players.length === 0
              ? "Waiting for players to join..."
              : gameStarted
                ? "Game in progress"
                : "Players in your room"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {room.players.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No players yet. Share the room code to get started!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {room.players.map((player) => (
                <div key={player.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="text-2xl">{player.avatar}</div>
                  <div className="flex-1">
                    <div className="font-medium">{player.username}</div>
                    <div className="text-xs text-muted-foreground">
                      Joined {new Date(player.joinedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <Badge variant="outline">{gameStarted ? "Playing" : "Ready"}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={onBack} disabled={gameStarted}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>
      </div>
    </div>
  )
}
