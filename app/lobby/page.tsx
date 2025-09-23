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
  const [localRoom, setLocalRoom] = useState<any>(null)
  const { toast } = useToast()
  const { room, loading } = useRoom(roomCode || "")
  
  // Use localRoom if available, otherwise use room from hook
  const currentRoom = localRoom || room

  // Subscribe to room updates for real-time synchronization
  useEffect(() => {
    if (!roomCode) return

    // Load room data immediately
    const loadInitialRoom = async () => {
      try {
        const initialRoom = await roomManager.getRoom(roomCode)
        if (initialRoom) {
          console.log("[Lobby] Initial room load:", initialRoom)
          setLocalRoom(initialRoom)
        }
      } catch (error) {
        console.error("[Lobby] Error loading initial room:", error)
      }
    }

    loadInitialRoom()

    let unsubscribe: (() => void) | null = null
    
    const setupSubscription = async () => {
      try {
        unsubscribe = await roomManager.subscribe(roomCode, (updatedRoom) => {
          if (updatedRoom?.code === roomCode) {
            console.log("[Lobby] Received room update via Supabase subscription:", updatedRoom)
            setLocalRoom(updatedRoom)
          }
        })
      } catch (error) {
        console.error("[Lobby] Error setting up subscription:", error)
      }
    }
    
    setupSubscription()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [roomCode])

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
            // Load room data immediately
            const loadRoom = async () => {
              try {
                const room = await roomManager.getRoom(storedRoomCode)
                if (room) {
                  setLocalRoom(room)
                }
              } catch (error) {
                console.error("[Lobby] Error loading room:", error)
              }
            }
            loadRoom()
          } else if (roomCodeParam === storedRoomCode) {
            // Room code matches, this is a valid host session
            setRoomCode(roomCodeParam)
            // Load room data immediately
            const loadRoom = async () => {
              try {
                const room = await roomManager.getRoom(roomCodeParam)
                if (room) {
                  setLocalRoom(room)
                }
              } catch (error) {
                console.error("[Lobby] Error loading room:", error)
              }
            }
            loadRoom()
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
    if (currentRoom?.gameStarted) {
      setGameStarted(true)
    }
    console.log("[Lobby] Room updated:", currentRoom)
  }, [currentRoom])

  // Force refresh room data periodically to ensure host sees all players
  useEffect(() => {
    if (!roomCode) return

    const refreshInterval = setInterval(async () => {
      try {
        const latestRoom = await roomManager.getRoom(roomCode)
        if (latestRoom) {
          // Compare players count to detect changes
          const currentPlayerCount = currentRoom?.players?.length || 0
          const latestPlayerCount = latestRoom.players?.length || 0
          
          if (latestPlayerCount !== currentPlayerCount || 
              JSON.stringify(latestRoom.players) !== JSON.stringify(currentRoom?.players)) {
            console.log("[Lobby] Force refresh - players changed:", {
              current: currentPlayerCount,
              latest: latestPlayerCount,
              latestRoom
            })
            setLocalRoom(latestRoom)
          }
        }
      } catch (error) {
        console.error("[Lobby] Error in refresh interval:", error)
      }
    }, 5000) // Check every 5 seconds (less frequent to reduce delay)

    return () => clearInterval(refreshInterval)
  }, [roomCode, currentRoom])


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

  const startGame = async () => {
    if (gameStarted || !currentRoom || !roomCode || !hostId) return

    try {
      const success = await roomManager.startGame(roomCode, hostId)
      if (success) {
        setGameStarted(true)
        // Navigate to monitor
        router.push(`/monitor?roomCode=${roomCode}`)
      }
    } catch (error) {
      console.error("[Lobby] Error starting game:", error)
    }
  }

  if (loading && !currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-xl">Loading room...</div>
        </div>
      </div>
    )
  }

  if (!currentRoom && !loading) {
    // If we have host data but no room, try to recreate the room
    if (hostId && roomCode && quizId) {
      const recreatedRoom = roomManager.createRoomWithCode(roomCode, hostId, {
        questionCount: quizSettings.questionCount,
        timePerQuestion: quizSettings.timeLimit
      })
      
      if (recreatedRoom) {
        // Update the room state and continue
        setLocalRoom(recreatedRoom)
      } else {
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
    } else {
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
                  <CardTitle className="text-white">Players ({currentRoom?.players.length || 0})</CardTitle>
                </div>
                {currentRoom && currentRoom.players.length >= 1 && !gameStarted && (
                  <Button onClick={startGame} className="font-semibold bg-blue-500 hover:bg-blue-600">
                    <Play className="h-4 w-4 mr-2" />
                    Start Quiz
                  </Button>
                )}
                {gameStarted && <Badge variant="secondary">Game Started</Badge>}
              </div>
              <CardDescription className="text-blue-100">
                {currentRoom && currentRoom.players.length === 0
                  ? "Waiting for players to join..."
                  : gameStarted
                    ? "Game in progress"
                    : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentRoom && currentRoom.players.length === 0 ? (
                <div className="text-center py-8 text-blue-200">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No players yet. Share the room code to get started!</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {currentRoom && currentRoom.players.map((player: any) => (
                    <div key={player.id} className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                      <div className="text-2xl">{player.avatar}</div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{player.username}</div>
                      </div>
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
