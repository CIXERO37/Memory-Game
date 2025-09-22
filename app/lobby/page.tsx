"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Users, Copy, QrCode, Share, Play, Maximize2 } from "lucide-react"
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
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const { toast } = useToast()
  const { room, loading } = useRoom(roomCode || "")

  useEffect(() => {
    const roomCodeParam = searchParams.get("roomCode")

    // Always try to hydrate from localStorage first
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem("currentHost")
      if (hostData) {
        try {
          const { hostId: storedHostId, roomCode: storedRoomCode, quizId: storedQuizId } = JSON.parse(hostData)
          setHostId(storedHostId)
          setQuizId(storedQuizId)
          
          if (!roomCodeParam) {
            setRoomCode(storedRoomCode)
          } else if (roomCodeParam === storedRoomCode) {
            // Room code matches, this is a valid host session
            setRoomCode(roomCodeParam)
          } else {
            // Room code doesn't match, clear old data and treat as new room
            console.log("Room code mismatch, clearing old host data")
            localStorage.removeItem("currentHost")
            setRoomCode(roomCodeParam)
          }
        } catch (error) {
          console.error("Error parsing host data:", error)
          localStorage.removeItem("currentHost")
          if (roomCodeParam) {
            setRoomCode(roomCodeParam)
          } else {
            router.push("/select-quiz")
          }
        }
      } else {
        if (roomCodeParam) {
          setRoomCode(roomCodeParam)
        } else {
          // No URL param and no local storage → back to select quiz
          router.push("/select-quiz")
        }
      }
    }
  }, [searchParams, router])

  useEffect(() => {
    if (room?.gameStarted) {
      setGameStarted(true)
    }
  }, [room])


  const shareUrl = roomCode && typeof window !== 'undefined' ? `${window.location.origin}/join?room=${roomCode}` : ""
  const smallQrUrl = shareUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=384x384&data=${encodeURIComponent(shareUrl)}` : ""
  const largeQrUrl = shareUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(shareUrl)}` : ""

  const copyRoomCode = () => {
    if (!roomCode) return
    navigator.clipboard.writeText(roomCode)
    toast({
      title: "Room code copied!",
      description: "Share this code with your friends",
    })
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 1500)
  }

  const copyShareLink = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Share link copied!",
      description: "Send this link to your friends",
    })
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 1500)
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
        <div className="text-center text-white">
          <div className="text-xl">Loading room...</div>
        </div>
      </div>
    )
  }

  if (!room && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white space-y-4">
          <div className="text-xl">Room not found</div>
          <div className="text-sm text-gray-300">
            The room may have been closed or the host left.
          </div>
          <Button 
            onClick={() => router.push("/select-quiz")}
            className="w-full"
          >
            Create New Room
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Edge-aligned header */}
      <div className="w-full px-4 pt-6">
        <div className="flex items-center gap-4">
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
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Room Info */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="text-center md:text-left">
              <CardTitle className="text-2xl text-white">Room Created!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Room Code Card */}
              <div className="relative rounded-xl bg-blue-400/10 border border-white/10 p-6">
                <button
                  onClick={copyRoomCode}
                  aria-label="Copy room code"
                  className={`absolute top-3 right-3 inline-flex items-center justify-center h-8 w-8 rounded-md border ${copiedCode ? "bg-green-500/20 border-green-500/30 text-green-400" : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}
                >
                  {copiedCode ? <span className="font-semibold">✓</span> : <Copy className="h-4 w-4" />}
                </button>
                <div className="text-center">
                  <div className="text-6xl md:text-7xl font-bold font-mono tracking-wider text-blue-400">
                    {roomCode}
                  </div>
                </div>
              </div>

              {/* QR Card */}
              {smallQrUrl && (
                <div className="relative rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col items-center">
                  <button
                    onClick={() => setQrOpen(true)}
                    aria-label="Enlarge QR"
                    className="absolute top-3 right-3 inline-flex items-center justify-center h-8 w-8 rounded-md border bg-white/5 border-white/10 text-white hover:bg-white/10"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                  <img
                    src={smallQrUrl}
                    alt="Room share QR"
                    className="rounded-md border border-white/10 bg-white p-2"
                    width={384}
                    height={384}
                  />
                  {shareUrl && (
                    <div className="mt-5 relative mx-auto">
                      <div className="inline-block rounded-xl bg-white text-slate-900 shadow-sm pl-4 pr-12 py-3 text-sm font-medium break-all">
                        {shareUrl}
                      </div>
                      <button
                        onClick={copyShareLink}
                        aria-label="Copy share link"
                        className={`absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-9 w-9 rounded-md border ${copiedLink ? "bg-green-500/20 border-green-500/30 text-green-600" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                      >
                        {copiedLink ? <span className="font-semibold">✓</span> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <Dialog open={qrOpen} onOpenChange={setQrOpen}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Share QR Code</DialogTitle>
                  </DialogHeader>
                  <div className="flex justify-center py-2">
                    {largeQrUrl && (
                      <img
                        src={largeQrUrl}
                        alt="Room share QR large"
                        className="rounded-lg border border-white/10 bg-white/5 p-4"
                        width={512}
                        height={512}
                      />
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Players List */}
          <Card className="bg-white/5 border-white/10 h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  <CardTitle className="text-white">Players ({room?.players.length || 0})</CardTitle>
                </div>
                {room && room.players.length >= 1 && !gameStarted && (
                  <Button onClick={startGame} className="font-semibold bg-blue-500 hover:bg-blue-600">
                    <Play className="h-4 w-4 mr-2" />
                    Start Quiz
                  </Button>
                )}
                {gameStarted && <Badge variant="secondary">Game Started</Badge>}
              </div>
              <CardDescription className="text-blue-100">
                {room && room.players.length === 0
                  ? "Waiting for players to join..."
                  : gameStarted
                    ? "Game in progress"
                    : "Players in your room"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {room && room.players.length === 0 ? (
                <div className="text-center py-8 text-blue-200">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No players yet. Share the room code to get started!</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {room && room.players.map((player) => (
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
