"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Play } from "lucide-react"
import Link from "next/link"
import { AvatarSelector } from "@/components/avatar-selector"
import { useRouter } from "next/navigation"
import { roomManager } from "@/lib/room-manager"

export default function JoinPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [selectedAvatar, setSelectedAvatar] = useState("🦄") // Set default avatar
  const [isJoining, setIsJoining] = useState(false)
  const [roomError, setRoomError] = useState("")
  const [playerId] = useState(() => {
    // Check if we're on the client side
    if (typeof window === 'undefined') {
      return Math.random().toString(36).substr(2, 9)
    }
    
    // Try to get existing player ID from localStorage first
    const storedPlayer = localStorage.getItem("currentPlayer")
    if (storedPlayer) {
      try {
        const player = JSON.parse(storedPlayer)
        return player.id || Math.random().toString(36).substr(2, 9)
      } catch (error) {
        console.error("Error parsing stored player:", error)
      }
    }
    return Math.random().toString(36).substr(2, 9)
  })

  useEffect(() => {
    const roomFromUrl = searchParams.get("room")
    if (roomFromUrl) {
      setRoomCode(roomFromUrl.toUpperCase())
    }

    // Check if user is already in a waiting room (only on client side)
    if (typeof window !== 'undefined') {
      const storedPlayer = localStorage.getItem("currentPlayer")
      if (storedPlayer) {
        try {
          const player = JSON.parse(storedPlayer)
          if (player.roomCode) {
            // Check if the room still exists and user is still in it
            const room = roomManager.getRoom(player.roomCode)
            if (room && room.players.find(p => p.id === player.id)) {
              // User is still in the room, redirect to waiting room
              router.push(`/waiting-room/${player.roomCode}`)
              return
            } else {
              // Room doesn't exist or user is not in it, clear stored data
              localStorage.removeItem("currentPlayer")
            }
          }
        } catch (error) {
          console.error("Error parsing stored player info:", error)
          localStorage.removeItem("currentPlayer")
        }
      }
    }
  }, [searchParams, router])

  const handleJoinRoom = async () => {
    if (!username.trim() || !roomCode.trim()) return

    setIsJoining(true)
    setRoomError("")

    await new Promise((resolve) => setTimeout(resolve, 500))

    const room = roomManager.getRoom(roomCode)

    if (!room) {
      setRoomError("Room not found. Please check the room code.")
      setIsJoining(false)
      return
    }

    if (room.gameStarted) {
      setRoomError("This game has already started. Please join a new room.")
      setIsJoining(false)
      return
    }

    // Always use rejoinRoom to ensure consistent player ID
    const success = roomManager.rejoinRoom(roomCode, {
      id: playerId,
      username: username.trim(),
      avatar: selectedAvatar,
    })

    if (success) {
      // Store player info locally (only on client side)
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          "currentPlayer",
          JSON.stringify({
            id: playerId,
            username: username.trim(),
            avatar: selectedAvatar,
            roomCode,
          }),
        )
      }

      // Redirect to waiting room route
      router.push(`/waiting-room/${roomCode}`)
    } else {
      setRoomError("Failed to join room. Please try again.")
    }

    setIsJoining(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Play className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Join a Game</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Join Room</CardTitle>
                <CardDescription>
                  {roomCode ? "Enter your username to join the game" : "Enter your details to join the game"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                {!searchParams.get("room") && (
                  <div className="space-y-2">
                    <Label htmlFor="roomCode">Room Code</Label>
                    <Input
                      id="roomCode"
                      placeholder="Enter room code"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className="uppercase"
                    />
                    {roomError && <p className="text-sm text-destructive">{roomError}</p>}
                  </div>
                )}

                {searchParams.get("room") && (
                  <div className="space-y-2">
                    <Label>Room Code</Label>
                    <div className="p-3 bg-muted rounded-md text-center font-mono text-lg font-semibold">
                      {roomCode}
                    </div>
                    {roomError && <p className="text-sm text-destructive">{roomError}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Choose Avatar (Optional)</Label>
                  <AvatarSelector selectedAvatar={selectedAvatar} onAvatarSelect={setSelectedAvatar} />
                  <p className="text-xs text-muted-foreground">Default: 🦄 Unicorn</p>
                </div>

                <Button
                  className="w-full"
                  onClick={handleJoinRoom}
                  disabled={!username.trim() || !roomCode.trim() || isJoining}
                >
                  {isJoining ? "Joining..." : "Join Room"}
                </Button>
              </CardContent>
            </Card>
          </div>

      </div>
    </div>
  )
}
