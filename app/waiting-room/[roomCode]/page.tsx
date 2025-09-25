"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ArrowLeft, Users, Clock } from "lucide-react"
import { useRoom } from "@/hooks/use-room"
import { roomManager } from "@/lib/room-manager"

export default function WaitingRoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.roomCode as string
  const { room, loading } = useRoom(roomCode)
  const [gameStarting, setGameStarting] = useState(false)
  const [playerInfo, setPlayerInfo] = useState<{
    username: string
    avatar: string
    playerId: string
  } | null>(null)

  // Restore player info from localStorage on page load/refresh
  useEffect(() => {
    // Check if we're on the client side
    if (typeof window === 'undefined') return
    
    const storedPlayer = localStorage.getItem("currentPlayer")
    if (storedPlayer) {
      try {
        const player = JSON.parse(storedPlayer)
        if (player.roomCode === roomCode) {
          setPlayerInfo({
            username: player.username,
            avatar: player.avatar,
            playerId: player.id,
          })
          return
        }
      } catch (error) {
        console.error("Error parsing stored player info:", error)
      }
    }
    
    // If no valid player info found, redirect to join page
    router.push(`/join?room=${roomCode}`)
  }, [roomCode, router])

  // Listen for game start
  useEffect(() => {
    if (room?.gameStarted && !gameStarting) {
      setGameStarting(true)
      
      // Add a small delay before redirecting
      setTimeout(() => {
        const params = new URLSearchParams()
        if (playerInfo) {
          params.append("playerId", playerInfo.playerId)
          params.append("username", playerInfo.username)
          params.append("avatar", playerInfo.avatar)
        }
        window.location.href = `/game/${roomCode}/quiz?${params.toString()}`
      }, 1000)
    }
  }, [room?.gameStarted, gameStarting, roomCode])

  // Periodic rejoin to ensure player stays in room
  useEffect(() => {
    if (!playerInfo || !room) return

    const rejoinInterval = setInterval(async () => {
      try {
        const currentRoom = await roomManager.getRoom(roomCode)
        if (currentRoom) {
          const existingPlayer = currentRoom.players.find(p => p.id === playerInfo.playerId)
          if (!existingPlayer) {
            console.log("[WaitingRoom] Periodic rejoin - player not found, rejoining")
            try {
              await roomManager.rejoinRoom(roomCode, {
                id: playerInfo.playerId,
                username: playerInfo.username,
                avatar: playerInfo.avatar,
              })
            } catch (error) {
              console.error("[WaitingRoom] Error in periodic rejoin:", error)
            }
          } else {
            // Player exists, just ensure they're marked as ready
            existingPlayer.isReady = true
          }
        }
      } catch (error) {
        console.error("[WaitingRoom] Error in periodic room check:", error)
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(rejoinInterval)
  }, [playerInfo, room, roomCode])

  const handleLeaveRoom = async () => {
    if (playerInfo) {
      try {
        await roomManager.leaveRoom(roomCode, playerInfo.playerId)
      } catch (error) {
        console.error("[WaitingRoom] Error leaving room:", error)
      }
    }
    // Check if we're on the client side
    if (typeof window !== 'undefined') {
      localStorage.removeItem("currentPlayer")
    }
    router.push("/join")
  }

  if (loading || !playerInfo) {
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
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg border-4 border-black shadow-2xl p-6">
              <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-black animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 pixel-font">LOADING...</h3>
              <p className="text-white/80 pixel-font-sm">CONNECTING TO ROOM</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!room) {
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
              <div className="space-y-3">
                <div className="relative pixel-button-container">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                  <Button 
                    onClick={() => router.push(`/join?room=${roomCode}`)} 
                    className="relative bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-blue-400 hover:to-blue-500 transform hover:scale-105 transition-all duration-200 font-bold w-full"
                  >
                    <span className="pixel-font-sm">TRY TO REJOIN</span>
                  </Button>
                </div>
                <div className="relative pixel-button-container">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                  <Button 
                    onClick={() => router.push("/join")} 
                    className="relative bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200 font-bold w-full"
                  >
                    <span className="pixel-font-sm">JOIN DIFFERENT ROOM</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (gameStarting) {
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
            <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-green-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-lg border-4 border-black shadow-2xl p-6">
              <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                <span className="text-2xl animate-pulse">🎮</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 pixel-font">STARTING QUIZ...</h3>
              <p className="text-white/80 pixel-font-sm">REDIRECTING TO THE GAME</p>
            </div>
          </div>
        </div>
      </div>
    )
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

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Pixel Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-8 h-8 bg-green-500 border-2 border-black rounded flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div className="inline-block bg-white border-2 border-black rounded px-4 py-2 pixel-header-title">
            <h1 className="text-xl font-bold text-black pixel-font">WAITING ROOM</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Pixel Waiting Room Card */}
          <div className="relative pixel-waiting-container">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-cyan-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-green-500 to-cyan-500 rounded-lg border-4 border-black shadow-2xl pixel-waiting-card">
              <div className="p-6">
                {/* Pixel Header */}
                <div className="text-center mb-6">
                  <div className="inline-block bg-white border-2 border-black rounded px-4 py-2 mb-3">
                    <h2 className="text-lg font-bold text-black pixel-font">WAITING ROOM</h2>
                  </div>
                  <div className="bg-black/20 border border-white/30 rounded px-3 py-2 inline-block">
                    <span className="text-white text-sm pixel-font-sm">
                      ROOM CODE: <span className="font-bold text-yellow-400">{roomCode}</span>
                    </span>
                  </div>
                </div>
                
                {/* Pixel Players Section */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-white border border-black rounded flex items-center justify-center">
                      <Users className="h-4 w-4 text-black" />
                    </div>
                    <div className="inline-block bg-white border border-black rounded px-2 py-1">
                      <span className="text-black font-bold text-xs pixel-font-sm">
                        PLAYERS ({room.players.length})
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {room.players.map((player) => {
                      console.log("[WaitingRoom] Rendering player:", player)
                      return (
                        <div key={player.id} className="bg-white border-2 border-black rounded p-3 pixel-player-card">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl w-8 h-8 bg-gray-100 border border-black rounded flex items-center justify-center">
                              {player.avatar}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-black pixel-font-sm">
                                {player.username.toUpperCase()}
                                {player.username === playerInfo?.username && <span className="text-blue-600 ml-2">(YOU)</span>}
                                {player.isHost && <span className="text-orange-600 ml-2">(HOST)</span>}
                              </div>
                            </div>
                            <div className="bg-green-500 border border-black rounded px-2 py-1">
                              <span className="text-white font-bold text-xs pixel-font-sm">READY</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Pixel Status Section */}
                <div className="bg-black/20 border border-white/30 rounded p-4 text-center">
                  <div className="w-8 h-8 mx-auto bg-white border border-black rounded flex items-center justify-center mb-3">
                    <Clock className="h-5 w-5 text-black" />
                  </div>
                  <p className="text-white text-sm pixel-font-sm">
                    {room.gameStarted ? "GAME STARTING SOON..." : "WAITING FOR HOST TO START THE GAME..."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative pixel-button-container">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="relative bg-gradient-to-br from-red-500 to-red-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-red-400 hover:to-red-500 transform hover:scale-105 transition-all duration-200 font-bold">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <span className="pixel-font-sm">LEAVE ROOM</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave Room?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to leave this room? You will need to rejoin with the room code if you want to participate in the game.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Stay in Room</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLeaveRoom} className="bg-red-600 hover:bg-red-700">
                      Leave Room
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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