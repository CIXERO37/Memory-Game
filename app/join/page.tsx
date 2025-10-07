"use client"

import { useState, useEffect, Suspense } from "react"
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
import { sessionManager } from "@/lib/supabase-session-manager"

function JoinPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [selectedAvatar, setSelectedAvatar] = useState("/ava1.png") // Set default avatar
  const [isJoining, setIsJoining] = useState(false)
  const [roomError, setRoomError] = useState("")
  const [playerId, setPlayerId] = useState<string>("")
  const [sessionId, setSessionId] = useState<string>("")
  const [hasClickedJoin, setHasClickedJoin] = useState(false)
  const [usernameError, setUsernameError] = useState("")
  const [roomCodeError, setRoomCodeError] = useState("")

  useEffect(() => {
    const roomFromUrl = searchParams.get("room")
    if (roomFromUrl) {
      setRoomCode(roomFromUrl.toUpperCase())
    }

    // Initialize session and get existing player data
    const initializeSession = async () => {
      try {
        // Try to get existing session
        const existingSessionId = sessionManager.getSessionIdFromStorage()
        if (existingSessionId) {
          const sessionData = await sessionManager.getSessionData(existingSessionId)
          if (sessionData && sessionData.user_type === 'player') {
            setPlayerId(sessionData.user_data.id)
            setSessionId(existingSessionId)
            setUsername(sessionData.user_data.username || "")
            setSelectedAvatar(sessionData.user_data.avatar || "/ava1.png")
            return
          }
        }
        
        // Generate new player ID if no valid session
        const newPlayerId = Math.random().toString(36).substr(2, 9)
        setPlayerId(newPlayerId)
      } catch (error) {
        console.error("Error initializing session:", error)
        const newPlayerId = Math.random().toString(36).substr(2, 9)
        setPlayerId(newPlayerId)
      }
    }

    initializeSession()
  }, [searchParams, router])

  // Function to extract room code from URL
  const extractRoomCodeFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url)
      const roomParam = urlObj.searchParams.get('room')
      if (roomParam) {
        return roomParam.toUpperCase()
      }
      // If no room parameter, try to extract from path
      const pathParts = urlObj.pathname.split('/')
      const lastPart = pathParts[pathParts.length - 1]
      if (lastPart && lastPart.length === 6 && /^[A-Z0-9]+$/.test(lastPart)) {
        return lastPart.toUpperCase()
      }
    } catch (error) {
      // If URL parsing fails, check if it's just a 6-character code
      if (url.length === 6 && /^[A-Z0-9]+$/.test(url)) {
        return url.toUpperCase()
      }
    }
    return ""
  }

  // Handle paste event to extract room code from URL
  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text')
    const extractedCode = extractRoomCodeFromUrl(pastedText)
    if (extractedCode) {
      setRoomCode(extractedCode)
      e.preventDefault() // Prevent default paste behavior
    }
  }

  const handleJoinRoom = async () => {
    // Clear previous validation errors
    setUsernameError("")
    setRoomCodeError("")
    setRoomError("")
    
    // Check for validation errors
    let hasValidationError = false
    
    if (!username.trim()) {
      setUsernameError("Username belum diisi")
      hasValidationError = true
    }
    
    if (!roomCode.trim()) {
      setRoomCodeError("Room code belum diisi")
      hasValidationError = true
    }
    
    // If there are validation errors, don't proceed
    if (hasValidationError) return
    
    if (hasClickedJoin) return

    setHasClickedJoin(true)
    setIsJoining(true)

    console.log("[Join] Attempting to join room:", roomCode)

    await new Promise((resolve) => setTimeout(resolve, 500))

    const room = await roomManager.getRoom(roomCode)
    console.log("[Join] Room found:", room)

    if (!room) {
      console.log("[Join] Room not found for code:", roomCode)
      setRoomError("Room not found. Please check the room code.")
      setIsJoining(false)
      setHasClickedJoin(false)
      
      // Kick prevention has been removed
      return
    }

    if (room.gameStarted) {
      setRoomError("This game has already started. Please join a new room.")
      setIsJoining(false)
      setHasClickedJoin(false)
      return
    }

    // Kick prevention has been removed - players can now rejoin after being kicked

    // Check if player already exists in room
    const existingPlayer = room.players.find((p: any) => p.id === playerId)
    
    let success: boolean
    if (existingPlayer) {
      // Player exists, use rejoinRoom
      success = await roomManager.rejoinRoom(roomCode, {
        id: playerId,
        username: username.trim(),
        avatar: selectedAvatar,
      })
    } else {
      // New player, use joinRoom
      success = await roomManager.joinRoom(roomCode, {
        username: username.trim(),
        avatar: selectedAvatar,
      })
    }

    console.log("[Join] Rejoin result:", success)

    if (success) {
      // Get the actual player ID from the room (in case it was generated by joinRoom)
      const updatedRoom = await roomManager.getRoom(roomCode)
      const actualPlayer = updatedRoom?.players.find((p: any) => 
        p.username === username.trim() && p.avatar === selectedAvatar
      )
      const finalPlayerId = actualPlayer?.id || playerId
      
      // Store player info in Supabase session
      try {
        const { sessionId: newSessionId } = await sessionManager.getOrCreateSession(
          'player',
          {
            id: finalPlayerId,
            username: username.trim(),
            avatar: selectedAvatar,
            roomCode,
          },
          roomCode
        )
        setSessionId(newSessionId)
        console.log("[Join] Session created/updated:", newSessionId)
      } catch (error) {
        console.error("[Join] Error creating session:", error)
        // Fallback to localStorage if Supabase fails
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            "currentPlayer",
            JSON.stringify({
              id: finalPlayerId,
              username: username.trim(),
              avatar: selectedAvatar,
              roomCode,
            }),
          )
        }
      }

      console.log("[Join] Successfully joined, redirecting to waiting room")
      // Redirect to waiting room route
      router.push(`/waiting-room/${roomCode}`)
    } else {
      setRoomError("Failed to join room. Please try again.")
      setHasClickedJoin(false)
    }

    setIsJoining(false)
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
      {/* Pixel Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="pixel-grid"></div>
      </div>
      
      {/* Floating Pixel Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <FloatingPixelElements />
      </div>
      
      {/* Retro Scanlines */}
      <div className="absolute inset-0 opacity-10">
        <div className="scanlines"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 min-h-[44px] min-w-[44px]">
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
             
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
            <h1 className="text-lg sm:text-2xl font-bold text-white">Join a Game</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto">
            <div className="relative pixel-card-container">
              {/* Pixel Card Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-1 pixel-card-shadow"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg border-2 sm:border-4 border-black shadow-2xl pixel-card-main">
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Pixel Header */}
                  <div className="text-center space-y-2">
                    <div className="inline-block bg-white rounded px-3 sm:px-4 py-1 sm:py-2 border-2 border-black transform -rotate-1 shadow-lg">
                      <h2 className="text-lg sm:text-xl font-bold text-black pixel-font">JOIN ROOM</h2>
                    </div>
                   
                  </div>
                  {/* Pixel Input Fields */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <div className="inline-block bg-white rounded px-2 py-1 border border-black">
                        <Label htmlFor="username" className="text-black font-bold text-xs sm:text-sm">USERNAME</Label>
                      </div>
                        <div className="relative">
                          <Input
                            id="username"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => {
                              setUsername(e.target.value)
                              if (usernameError) setUsernameError("")
                            }}
                            className="bg-white border-2 border-black rounded-none shadow-lg font-mono text-black placeholder:text-gray-500 focus:border-blue-600 h-12 sm:h-auto"
                          />
                        </div>
                        {usernameError && (
                          <div className="bg-red-500 border-2 border-black rounded px-3 py-2">
                            <p className="text-xs sm:text-sm text-white font-bold">{usernameError}</p>
                          </div>
                        )}
                    </div>

                    {!searchParams.get("room") && (
                      <div className="space-y-2">
                        <div className="inline-block bg-white rounded px-2 py-1 border border-black">
                          <Label htmlFor="roomCode" className="text-black font-bold text-xs sm:text-sm">ROOM CODE</Label>
                        </div>
                        <div className="relative">
                          <Input
                            id="roomCode"
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={roomCode}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                              if (value.length <= 6) {
                                setRoomCode(value);
                              }
                              if (roomCodeError) setRoomCodeError("")
                            }}
                            onPaste={handlePaste}
                            maxLength={6}
                            className="room-code-input h-12 sm:h-auto"
                          />
                        </div>
                        {roomCodeError && (
                          <div className="bg-red-500 border-2 border-black rounded px-3 py-2">
                            <p className="text-xs sm:text-sm text-white font-bold">{roomCodeError}</p>
                          </div>
                        )}
                        {roomError && (
                          <div className="bg-red-500 border-2 border-black rounded px-3 py-2">
                            <p className="text-xs sm:text-sm text-white font-bold">{roomError}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {searchParams.get("room") && (
                      <div className="space-y-2">
                        <div className="inline-block bg-white rounded px-2 py-1 border border-black">
                          <Label className="text-black font-bold text-xs sm:text-sm">ROOM CODE</Label>
                        </div>
                        <div className="bg-yellow-400 border-2 border-black rounded px-3 sm:px-4 py-2 sm:py-3 text-center shadow-lg">
                          <div className="font-mono text-xl sm:text-2xl font-bold text-black">
                            {roomCode}
                          </div>
                        </div>
                        {roomCodeError && (
                          <div className="bg-red-500 border-2 border-black rounded px-3 py-2">
                            <p className="text-xs sm:text-sm text-white font-bold">{roomCodeError}</p>
                          </div>
                        )}
                        {roomError && (
                          <div className="bg-red-500 border-2 border-black rounded px-3 py-2">
                            <p className="text-xs sm:text-sm text-white font-bold">{roomError}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pixel Avatar Section */}
                    <div className="space-y-2">
                      <div className="inline-block bg-white rounded px-2 py-1 border border-black">
                        <Label className="text-black font-bold text-xs sm:text-sm">CHOOSE AVATAR</Label>
                      </div>
                      <div className="bg-white border-2 border-black rounded p-2 sm:p-3">
                        <AvatarSelector selectedAvatar={selectedAvatar} onAvatarSelect={setSelectedAvatar} />
                      </div>
                    </div>

                    {/* Pixel Button */}
                    <div className="pt-3 sm:pt-4">
                      <Button
                        className="w-full bg-green-500 hover:bg-green-600 border-2 border-black rounded-none shadow-lg font-bold text-black text-base sm:text-lg py-3 sm:py-3 transform hover:scale-105 transition-all duration-200 min-h-[44px]"
                        onClick={handleJoinRoom}
                        disabled={isJoining || hasClickedJoin}
                      >
                        {isJoining ? "JOINING..." : hasClickedJoin ? "PROCESSING..." : "JOIN ROOM"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

      </div>
    </div>
  )
}

function FloatingPixelElements() {
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

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="relative z-10 text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg border-4 border-black shadow-2xl p-6">
              <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                <Play className="h-8 w-8 text-black animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 pixel-font">LOADING...</h3>
              <p className="text-white/80 pixel-font-sm">PREPARING JOIN PAGE</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <JoinPageContent />
    </Suspense>
  )
}
