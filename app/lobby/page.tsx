"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Users, Copy, QrCode, Share, Play } from "lucide-react"
import Link from "next/link"
import { roomManager } from "@/lib/room-manager"
import { useToast } from "@/hooks/use-toast"
import { useRoom } from "@/hooks/use-room"

export default function LobbyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [hostId, setHostId] = useState<string | null>(null)
  const [quizId, setQuizId] = useState<string | null>(null)
  const [quizSettings, setQuizSettings] = useState({
    timeLimit: 30,
    questionCount: 10,
  })
  const [gameStarted, setGameStarted] = useState(false)
  const { toast } = useToast()
  const { room, loading } = useRoom(roomCode || "")

  useEffect(() => {
    const roomCodeParam = searchParams.get("roomCode")
    if (roomCodeParam) {
      setRoomCode(roomCodeParam)
    } else {
      // Try to get from localStorage
      const hostData = localStorage.getItem("currentHost")
      if (hostData) {
        const { hostId: storedHostId, roomCode: storedRoomCode, quizId: storedQuizId } = JSON.parse(hostData)
        setHostId(storedHostId)
        setRoomCode(storedRoomCode)
        setQuizId(storedQuizId)
      } else {
        router.push("/select-quiz")
      }
    }
  }, [searchParams, router])

  useEffect(() => {
    if (room?.gameStarted) {
      setGameStarted(true)
    }
  }, [room])

  const shareUrl = roomCode ? `${window.location.origin}/join?room=${roomCode}` : ""

  const copyRoomCode = () => {
    if (!roomCode) return
    navigator.clipboard.writeText(roomCode)
    toast({
      title: "Room code copied!",
      description: "Share this code with your friends",
    })
  }

  const copyShareLink = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Share link copied!",
      description: "Send this link to your friends",
    })
  }

  const startGame = () => {
    if (gameStarted || !room || !roomCode || !hostId) return

    const success = roomManager.startGame(roomCode, hostId)
    if (success) {
      setGameStarted(true)
      // Navigate to monitor
      router.push(`/monitor?roomCode=${roomCode}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">Loading room...</div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">Room not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/settings">
            <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10 hover:border-white/30 bg-white/5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Lobby</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Room Info */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Room Created!</CardTitle>
              <CardDescription className="text-blue-100">Share the room code or link with your friends</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Room Code */}
              <div className="text-center">
                <Label className="text-sm font-medium text-blue-200">Room Code</Label>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="text-4xl font-bold font-mono tracking-wider text-blue-400 bg-blue-400/10 px-6 py-3 rounded-lg">
                    {roomCode}
                  </div>
                  <Button variant="outline" size="icon" onClick={copyRoomCode} className="border-white/20 text-white hover:bg-white/10">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Share Options */}
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={copyShareLink} className="border-white/20 text-white hover:bg-white/10">
                  <Share className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <QrCode className="h-4 w-4 mr-2" />
                  Show QR Code
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Players List */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  <CardTitle className="text-white">Players ({room.players.length})</CardTitle>
                </div>
                {room.players.length >= 1 && !gameStarted && (
                  <Button onClick={startGame} className="font-semibold bg-blue-500 hover:bg-blue-600">
                    <Play className="h-4 w-4 mr-2" />
                    Start Quiz
                  </Button>
                )}
                {gameStarted && <Badge variant="secondary">Game Started</Badge>}
              </div>
              <CardDescription className="text-blue-100">
                {room.players.length === 0
                  ? "Waiting for players to join..."
                  : gameStarted
                    ? "Game in progress"
                    : "Players in your room"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {room.players.length === 0 ? (
                <div className="text-center py-8 text-blue-200">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No players yet. Share the room code to get started!</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {room.players.map((player) => (
                    <div key={player.id} className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                      <div className="text-2xl">{player.avatar}</div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{player.username}</div>
                        <div className="text-xs text-blue-200">
                          Joined {new Date(player.joinedAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <Badge variant="outline" className="border-white/20 text-white">
                        {gameStarted ? "Playing" : "Ready"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
