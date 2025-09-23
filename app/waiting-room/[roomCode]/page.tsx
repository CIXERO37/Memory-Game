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

  // Rejoin room if player info is available
  useEffect(() => {
    const handleRejoin = async () => {
      if (playerInfo && room) {
        // Check if player is already in the room
        const existingPlayer = room.players.find(p => p.id === playerInfo.playerId)
        
        if (!existingPlayer) {
          // Player not found, try to rejoin with the same ID
          console.log("[WaitingRoom] Player not found, attempting to rejoin:", playerInfo)
          try {
            const success = await roomManager.rejoinRoom(roomCode, {
              id: playerInfo.playerId,
              username: playerInfo.username,
              avatar: playerInfo.avatar,
            })
            
            if (!success) {
              // If rejoin fails, redirect to join page
              console.log("[WaitingRoom] Rejoin failed, redirecting to join page")
              router.push(`/join?room=${roomCode}`)
            }
          } catch (error) {
            console.error("[WaitingRoom] Error rejoining room:", error)
            router.push(`/join?room=${roomCode}`)
          }
        } else {
          // Player exists, just ensure they're marked as ready
          console.log("[WaitingRoom] Player found, marking as ready:", existingPlayer)
          existingPlayer.isReady = true
        }
      }
    }

    handleRejoin()
  }, [playerInfo, room, roomCode, router])

  useEffect(() => {
    if (room?.gameStarted && !gameStarting) {
      setGameStarting(true)
      // Check if we're on the client side
      if (typeof window !== 'undefined') {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card className="text-center">
              <CardContent className="py-12">
                <p>Loading room...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card className="text-center">
              <CardContent className="py-12 space-y-4">
                <div className="text-xl font-semibold">Room not found</div>
                <div className="text-sm text-muted-foreground">
                  The room may have been closed or the host left.
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={() => router.push(`/join?room=${roomCode}`)} 
                    className="w-full"
                  >
                    Try to Rejoin
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => router.push("/join")} 
                    className="w-full"
                  >
                    Join Different Room
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (gameStarting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card className="text-center">
              <CardContent className="py-12">
                <div className="text-2xl font-bold text-primary mb-4">Starting Quiz...</div>
                <p className="text-muted-foreground">Redirecting to the game...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Waiting Room</h1>
          </div>
        </div>

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
                {room.players.map((player) => {
                  console.log("[WaitingRoom] Rendering player:", player)
                  return (
                    <div key={player.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl">{player.avatar}</div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {player.username}
                          {player.username === playerInfo?.username && <span className="text-primary ml-2">(You)</span>}
                          {player.isHost && <span className="text-accent ml-2">(Host)</span>}
                        </div>
                      </div>
                      <Badge variant="outline">Ready</Badge>
                    </div>
                  )
                })}
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Leave Room
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
  )
}
