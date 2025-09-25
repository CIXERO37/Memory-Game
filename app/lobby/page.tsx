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
          <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
            {/* Pixel Grid Background */}
            <div className="absolute inset-0 opacity-20">
              <div className="pixel-grid"></div>
            </div>
            
            {/* Retro Scanlines */}
            <div className="absolute inset-0 opacity-10">
              <div className="scanlines"></div>
            </div>
            
            {/* Floating Pixel Elements */}
            <div className="absolute inset-0 overflow-hidden">
              <PixelBackgroundElements />
            </div>

            <div className="relative z-10 text-center">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-lg border-4 border-black shadow-2xl p-6">
                  <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 pixel-font">ROOM NOT FOUND</h3>
                  <p className="text-white/80 mb-4 pixel-font-sm">THE ROOM MAY HAVE BEEN CLOSED OR THE HOST LEFT</p>
                  <div className="relative pixel-button-container">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                    <Button 
                      onClick={() => router.push("/select-quiz")}
                      className="relative bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-orange-400 hover:to-orange-500 transform hover:scale-105 transition-all duration-200 font-bold"
                    >
                      <span className="pixel-font-sm">CREATE NEW ROOM</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    } else {
      return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
          {/* Pixel Grid Background */}
          <div className="absolute inset-0 opacity-20">
            <div className="pixel-grid"></div>
          </div>
          
          {/* Retro Scanlines */}
          <div className="absolute inset-0 opacity-10">
            <div className="scanlines"></div>
          </div>
          
          {/* Floating Pixel Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <PixelBackgroundElements />
          </div>

          <div className="relative z-10 text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
              <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-lg border-4 border-black shadow-2xl p-6">
                <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 pixel-font">ROOM NOT FOUND</h3>
                <p className="text-white/80 mb-4 pixel-font-sm">THE ROOM MAY HAVE BEEN CLOSED OR THE HOST LEFT</p>
                <div className="relative pixel-button-container">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                  <Button 
                    onClick={() => router.push("/select-quiz")}
                    className="relative bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-orange-400 hover:to-orange-500 transform hover:scale-105 transition-all duration-200 font-bold"
                  >
                    <span className="pixel-font-sm">CREATE NEW ROOM</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

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
      
      {/* Floating Pixel Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <PixelBackgroundElements />
      </div>

      {/* Pixel Header */}
      <div className="relative z-10 w-full px-4 pt-6">
        <div className="flex items-center gap-4">
          <Link href="/quiz-settings">
            <div className="relative pixel-button-container">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
              <Button variant="outline" size="sm" className="relative bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 border-2 border-black rounded flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="inline-block bg-white border-2 border-black rounded px-4 py-2 pixel-header-title">
              <h1 className="text-lg font-bold text-black">LOBBY</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-6">
        <div className="mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Pixel Room Info */}
          <div className="relative pixel-lobby-container">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg border-4 border-black shadow-2xl pixel-lobby-card">
              <div className="p-6 space-y-6">
               
                {/* Simplified Room Code Display */}
                <div className="bg-white border-2 border-black rounded p-8 pixel-room-code relative">
                  {/* Copy icon di pojok kanan atas */}
                  <button
                    onClick={copyRoomCode}
                    aria-label="Copy room code"
                    className={`absolute top-4 right-4 w-8 h-8 rounded border-2 border-black flex items-center justify-center ${copiedCode ? "bg-green-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
                  >
                    {copiedCode ? <span className="font-bold text-lg">✓</span> : <Copy className="h-6 w-6" />}
                  </button>
                  
                  {/* Room code di tengah - diperbesar */}
                  <div className="text-center pt-4">
                    <div className="text-5xl md:text-6xl lg:text-7xl font-black font-mono text-black room-code-text">
                      {roomCode}
                    </div>
                  </div>
                </div>

                {/* Pixel QR Card */}
                {smallQrUrl && (
                  <div className="bg-white border-2 border-black rounded p-4 pixel-qr-card">
                    <div className="flex justify-end items-center mb-3">
                      <button
                        onClick={() => setQrOpen(true)}
                        aria-label="Enlarge QR"
                        className="w-8 h-8 bg-gray-200 border-2 border-black rounded flex items-center justify-center hover:bg-gray-300"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-col items-center">
                      <img
                        src={smallQrUrl}
                        alt="Room share QR"
                        className="rounded border-2 border-black bg-white p-2"
                        width={384}
                        height={384}
                      />
                      {shareUrl && (
                        <div className="mt-4 relative mx-auto">
                          <div className="inline-block bg-gray-100 border-2 border-black rounded pl-3 pr-10 py-2 text-xs font-medium break-all">
                            {shareUrl}
                          </div>
                          <button
                            onClick={copyShareLink}
                            aria-label="Copy share link"
                            className={`absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-7 w-7 rounded ${copiedLink ? "bg-green-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
                          >
                            {copiedLink ? <span className="font-bold text-xs">✓</span> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      )}
                    </div>
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
              </div>
            </div>
          </div>

          {/* Pixel Players List */}
          <div className="relative pixel-lobby-container">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-cyan-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-green-500 to-cyan-500 rounded-lg border-4 border-black shadow-2xl pixel-lobby-card">
              <div className="p-6">
                {/* Pixel Players Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white border border-black rounded flex items-center justify-center">
                      <Users className="h-4 w-4 text-black" />
                    </div>
                    <div className="inline-block bg-white border border-black rounded px-2 py-1">
                      <span className="text-black font-bold text-sm pixel-font-sm">
                        PLAYERS ({currentRoom?.players.length || 0})
                      </span>
                    </div>
                  </div>
                  {currentRoom && currentRoom.players.length >= 1 && !gameStarted && (
                    <div className="relative pixel-button-container">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                      <Button 
                        onClick={startGame} 
                        className="relative bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-orange-400 hover:to-orange-500 transform hover:scale-105 transition-all duration-200 font-bold"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        <span className="pixel-font-sm">START QUIZ</span>
                      </Button>
                    </div>
                  )}
                  {gameStarted && (
                    <div className="bg-yellow-400 border-2 border-black rounded px-3 py-1">
                      <span className="text-black font-bold text-xs pixel-font-sm">GAME STARTED</span>
                    </div>
                  )}
                </div>
                
                {/* Pixel Status */}
                <div className="mb-4">
                  <div className="bg-black/20 border border-white/30 rounded px-3 py-2">
                    <span className="text-white text-sm pixel-font-sm">
                      {currentRoom && currentRoom.players.length === 0
                        ? "WAITING FOR PLAYERS TO JOIN..."
                        : gameStarted
                          ? "GAME IN PROGRESS"
                          : "READY TO START"}
                    </span>
                  </div>
                </div>
                {/* Pixel Players List */}
                {currentRoom && currentRoom.players.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                      <Users className="h-8 w-8 text-black" />
                    </div>
                    <div className="bg-white border-2 border-black rounded px-4 py-2 inline-block">
                      <p className="text-black font-bold pixel-font-sm">NO PLAYERS YET</p>
                      <p className="text-black text-xs pixel-font-sm">SHARE THE ROOM CODE TO GET STARTED!</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {currentRoom && currentRoom.players.map((player: any) => (
                      <div key={player.id} className="bg-white border-2 border-black rounded p-3 pixel-player-card">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl w-8 h-8 bg-gray-100 border border-black rounded flex items-center justify-center">
                            {player.avatar}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-black pixel-font-sm">{player.username.toUpperCase()}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PixelBackgroundElements() {
  const pixels = [
    { id: 1, color: 'bg-red-500', size: 'w-2 h-2', delay: '0s', duration: '3s', x: '10%', y: '20%' },
    { id: 2, color: 'bg-blue-500', size: 'w-3 h-3', delay: '1s', duration: '4s', x: '80%', y: '30%' },
    { id: 3, color: 'bg-green-500', size: 'w-2 h-2', delay: '2s', duration: '3.5s', x: '20%', y: '70%' },
    { id: 4, color: 'bg-yellow-500', size: 'w-4 h-4', delay: '0.5s', duration: '5s', x: '70%', y: '10%' },
    { id: 5, color: 'bg-purple-500', size: 'w-2 h-2', delay: '1.5s', duration: '4.5s', x: '50%', y: '80%' },
    { id: 6, color: 'bg-pink-500', size: 'w-3 h-3', delay: '2.5s', duration: '3s', x: '30%', y: '50%' },
    { id: 7, color: 'bg-cyan-500', size: 'w-2 h-2', delay: '0.8s', duration: '4s', x: '90%', y: '60%' },
    { id: 8, color: 'bg-orange-500', size: 'w-3 h-3', delay: '1.8s', duration: '3.8s', x: '15%', y: '40%' },
    { id: 9, color: 'bg-lime-500', size: 'w-2 h-2', delay: '2.2s', duration: '4.2s', x: '60%', y: '25%' },
    { id: 10, color: 'bg-indigo-500', size: 'w-4 h-4', delay: '0.3s', duration: '5.5s', x: '85%', y: '75%' },
  ]

  return (
    <>
      {pixels.map((pixel) => (
        <div
          key={pixel.id}
          className={`absolute ${pixel.color} ${pixel.size} pixel-float`}
          style={{
            left: pixel.x,
            top: pixel.y,
            animationDelay: pixel.delay,
            animationDuration: pixel.duration,
          }}
        />
      ))}
      
      {/* Floating Pixel Blocks */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 opacity-30 pixel-block-float">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute top-40 right-20 w-12 h-12 bg-gradient-to-br from-green-400 to-cyan-400 opacity-40 pixel-block-float-delayed">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-red-400 to-pink-400 opacity-35 pixel-block-float-slow">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute bottom-20 right-1/3 w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-400 opacity-45 pixel-block-float-delayed-slow">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
    </>
  )
}
