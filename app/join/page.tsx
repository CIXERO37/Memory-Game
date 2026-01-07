"use client"
// ikan
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Play, Camera } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AvatarSelector } from "@/components/avatar-selector"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { roomManager } from "@/lib/room-manager"
import { sessionManager } from "@/lib/supabase-session-manager"
import { QRScanner } from "@/components/qr-scanner"
import { useToast } from "@/hooks/use-toast"

function JoinPageContent() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const { userProfile, isAuthenticated, loading } = useAuth()
  const [nickname, setNickname] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [selectedAvatar, setSelectedAvatar] = useState("") // Will be set to random avatar
  const [userChangedAvatar, setUserChangedAvatar] = useState(false)
  const [userChangedNickname, setUserChangedNickname] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [roomError, setRoomError] = useState("")
  const [playerId, setPlayerId] = useState<string>("")
  const [sessionId, setSessionId] = useState<string>("")
  const [hasClickedJoin, setHasClickedJoin] = useState(false)
  const [nicknameError, setNicknameError] = useState("")
  const [roomCodeError, setRoomCodeError] = useState("")
  const [showScanner, setShowScanner] = useState(false)

  // Show toast if player was redirected because host left
  useEffect(() => {
    const message = searchParams.get("message")
    if (message === 'host-left') {
      toast({
        title: "Session Ended",
        description: "The host has left the room. Please join another room.",
        duration: 5000,
      })
      // Remove the message from URL to prevent showing toast again on refresh
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('message')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [searchParams, toast])

  useEffect(() => {
    const roomFromUrl = searchParams.get("room")
    if (roomFromUrl) {
      setRoomCode(roomFromUrl.toUpperCase())
    } else if (typeof pathname === 'string') {
      // Fallback: extract code from /join/<code>
      const parts = pathname.split('/').filter(Boolean)
      if (parts[0] === 'join' && parts[1] && /^[A-Z0-9]{6}$/i.test(parts[1])) {
        setRoomCode(parts[1].toUpperCase())
      }
    }

    // Initialize session and get existing player data
    const initializeSession = async () => {
      try {
        // Try to get existing session
        const existingSessionId = sessionManager.getSessionIdFromStorage()
        if (existingSessionId) {
          try {
            const sessionData = await sessionManager.getSessionData(existingSessionId)
            if (sessionData && sessionData.user_type === 'player') {
              setPlayerId(sessionData.user_data.id)
              setSessionId(existingSessionId)
              // Only set nickname from session if user is NOT authenticated
              // If user is authenticated, nickname will be set from userProfile in the next effect
              if (!isAuthenticated && !nickname && sessionData.user_data.nickname) {
                setNickname(sessionData.user_data.nickname)
              }
              if (!selectedAvatar) {
                setSelectedAvatar(sessionData.user_data.avatar || "")
              }

              return
            }
          } catch (error) {
            console.warn('[Join] Error getting session data:', error)
            // Continue with fallback logic
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
  }, [searchParams, pathname, router])

  // Prefill from authenticated user once available - HIGHEST PRIORITY
  useEffect(() => {


    if (!loading && isAuthenticated && userProfile) {
      // Get nickname from Google - prioritize name field, then username
      const authNickname = userProfile.nickname || userProfile.name || userProfile.username || ""

      // If user is authenticated, ALWAYS use Google nickname unless user manually changed it
      if (authNickname) {
        if (!userChangedNickname) {
          // User hasn't manually changed nickname, so use Google nickname
          if (nickname !== authNickname) {

            setNickname(authNickname)
          }
        } else {
          // User has manually changed nickname, but if current nickname is empty or from localStorage,
          // still prefer Google nickname
          if (!nickname || nickname.trim() === "") {

            setNickname(authNickname)
            setUserChangedNickname(false) // Reset flag since we're using Google nickname
          }
        }
      }

      // If logged in and user hasn't manually changed avatar, prefer auth avatar
      if (userProfile.avatar_url && !userChangedAvatar) {

        setSelectedAvatar(userProfile.avatar_url)
      }
    } else if (!loading && !isAuthenticated) {
      // User is not authenticated, load from localStorage as fallback
      if (typeof window !== 'undefined' && !nickname && !userChangedNickname) {
        const savedNickname = localStorage.getItem('lastNickname')
        if (savedNickname) {

          setNickname(savedNickname)
        }
      }
    }
  }, [loading, isAuthenticated, userProfile, userChangedAvatar, userChangedNickname, nickname])

  // Additional effect to handle nickname persistence when auth state changes
  useEffect(() => {
    // If user becomes authenticated and nickname is empty or doesn't match Google nickname, update it
    if (!loading && isAuthenticated && userProfile && !userChangedNickname) {
      const authNickname = userProfile.nickname || userProfile.name || userProfile.username || ""
      if (authNickname) {
        // If nickname is empty or different from Google nickname, update it
        if (!nickname || nickname.trim() === "" || nickname !== authNickname) {

          setNickname(authNickname)
        }
      }
    }
  }, [isAuthenticated, userProfile, loading, userChangedNickname, nickname])

  // Emergency fallback: restore nickname if it becomes empty unexpectedly
  useEffect(() => {
    if (!loading && !nickname.trim() && !userChangedNickname) {
      // Try to restore from auth first (highest priority)
      if (isAuthenticated && userProfile) {
        const authNickname = userProfile.nickname || userProfile.name || userProfile.username || ""
        if (authNickname) {

          setNickname(authNickname)
          return
        }
      }

      // Fallback to localStorage only if not authenticated
      if (!isAuthenticated && typeof window !== 'undefined') {
        const savedNickname = localStorage.getItem('lastNickname')
        if (savedNickname) {

          setNickname(savedNickname)
        }
      }
    }
  }, [nickname, loading, isAuthenticated, userProfile, userChangedNickname])

  // Save nickname to localStorage whenever it changes
  useEffect(() => {
    if (nickname && nickname.trim() && typeof window !== 'undefined') {
      localStorage.setItem('lastNickname', nickname.trim())
    }
  }, [nickname])

  // Handle first avatar change from selector
  // Avatar selector akan set avatar random sekali saat pertama kali mount
  const handleFirstAvatarChange = (avatar: string) => {
    // If authenticated with avatar and user hasn't changed manually, keep auth avatar as default
    if (isAuthenticated && userProfile?.avatar_url && !userChangedAvatar) {
      setSelectedAvatar(userProfile.avatar_url)
      return
    }
    if (!selectedAvatar) {
      setSelectedAvatar(avatar)
    }
  }


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

  // Handle QR code scan
  const handleQRScan = (data: string) => {
    const extractedCode = extractRoomCodeFromUrl(data)
    if (extractedCode) {
      setRoomCode(extractedCode)
      setShowScanner(false)
      // Clear any previous room code error
      setRoomCodeError("")
    }
  }

  const handleJoinRoom = async () => {
    // Clear previous validation errors
    setNicknameError("")
    setRoomCodeError("")
    setRoomError("")

    // Check for validation errors
    let hasValidationError = false

    if (!nickname.trim()) {
      setNicknameError("Nickname belum diisi")
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



    await new Promise((resolve) => setTimeout(resolve, 500))

    const room = await roomManager.getRoom(roomCode)


    if (!room) {

      setRoomError("Room not found. Please check the room code.")
      setIsJoining(false)
      setHasClickedJoin(false)
      return
    }

    if (room.gameStarted) {
      setRoomError("This game has already started. Please join a new room.")
      setIsJoining(false)
      setHasClickedJoin(false)
      return
    }

    // Check if player already exists in room by nickname and avatar (not just playerId)
    const existingPlayer = room.players.find((p: any) =>
      p.nickname === nickname.trim() && p.avatar === selectedAvatar
    )



    // If player exists, update the playerId to match the existing player
    if (existingPlayer) {

      setPlayerId(existingPlayer.id)
      // Also update the session with the correct player ID
      try {
        const existingSessionId = sessionManager.getSessionIdFromStorage()
        if (existingSessionId) {
          await sessionManager.getOrCreateSession(
            'player',
            {
              id: existingPlayer.id,
              nickname: nickname.trim(),
              avatar: selectedAvatar,
              roomCode,
            },
            roomCode
          )

        }
      } catch (error) {
        console.warn("[Join] Error updating session with correct player ID:", error)
      }
    }

    // 🆕 FIX: Get profile ID from profiles table by email (not auth user id)
    // This ensures user_id in participants matches the id from profiles table
    let profileId: string | null = null
    if (isAuthenticated && userProfile?.email) {
      console.log('[Join] Getting profile ID for email:', userProfile.email)
      profileId = await roomManager.getProfileIdByEmail(userProfile.email)
      console.log('[Join] Profile ID from profiles table:', profileId)
    }

    let success: boolean
    if (existingPlayer) {
      // Player exists, use rejoinRoom with existing player ID
      console.log('[Join] Rejoining room with profile ID:', profileId)
      success = await roomManager.rejoinRoom(roomCode, {
        id: existingPlayer.id,
        nickname: nickname.trim(),
        avatar: selectedAvatar,
      }, profileId || undefined)
    } else {
      // New player, use joinRoom
      console.log('[Join] Joining room with profile ID:', profileId)
      success = await roomManager.joinRoom(roomCode, {
        nickname: nickname.trim(),
        avatar: selectedAvatar,
      }, profileId || undefined)
    }



    if (success) {
      // Get the actual player ID from the room
      const updatedRoom = await roomManager.getRoom(roomCode)
      const actualPlayer = updatedRoom?.players.find((p: any) =>
        p.nickname === nickname.trim() && p.avatar === selectedAvatar
      )
      const finalPlayerId = actualPlayer?.id || existingPlayer?.id || playerId



      // Store player info in Supabase session
      try {


        // Always create/update session with the correct player ID

        const { sessionId } = await sessionManager.getOrCreateSession(
          'player',
          {
            id: finalPlayerId,
            nickname: nickname.trim(),
            avatar: selectedAvatar,
            roomCode,
          },
          roomCode
        )
        const newSessionId = sessionId

        setSessionId(newSessionId)


        // Also store in localStorage as backup
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            "currentPlayer",
            JSON.stringify({
              id: finalPlayerId,
              nickname: nickname.trim(),
              avatar: selectedAvatar,
              roomCode,
            }),
          )

        }
      } catch (error) {
        console.warn("[Join] Error creating session:", error)
        // Fallback to localStorage if Supabase fails
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            "currentPlayer",
            JSON.stringify({
              id: finalPlayerId,
              nickname: nickname.trim(),
              avatar: selectedAvatar,
              roomCode,
            }),
          )

        }
        // Still set session ID for consistency
        setSessionId(`fallback_${finalPlayerId}_${Date.now()}`)
      }




      // Add a small delay to ensure session is saved
      await new Promise(resolve => setTimeout(resolve, 100))

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
        {/* Top-right GameForSmart Logo */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20">
          <Image
            src="/images/gameforsmartlogo.webp"
            alt="GameForSmart Logo"
            width={240}
            height={72}
            className="h-12 sm:h-16 md:h-20 w-auto"
            priority
          />
        </div>
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/">
            <div className="relative pixel-button-container">
              <div className="absolute inset-0 bg-linear-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
              <Button variant="outline" size="default" className="relative bg-linear-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-linear-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200 h-10 w-10 min-h-11 min-w-11">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
          </Link>
          {/* MemoryQuiz Logo to the right of ArrowLeft */}
          <Image
            src="/images/memoryquizv4.webp"
            alt="Memory Quiz Logo"
            width={240}
            height={72}
            className="h-12 sm:h-16 md:h-20 w-auto"
            priority
          />

        </div>

        <div className="max-w-md mx-auto">
          <div className="relative pixel-card-container">
            {/* Pixel Card Background */}
            <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-1 pixel-card-shadow"></div>
            <div className="relative bg-linear-to-br from-blue-500 to-purple-500 rounded-lg border-2 sm:border-4 border-black shadow-2xl pixel-card-main">
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
                      <Label htmlFor="nickname" className="text-black font-bold text-xs sm:text-sm">NICKNAME</Label>
                    </div>
                    <div className="relative">
                      <Input
                        id="nickname"
                        placeholder="Enter your nickname"
                        value={nickname}
                        onChange={(e) => {
                          setNickname(e.target.value)
                          setUserChangedNickname(true)
                          if (nicknameError) setNicknameError("")
                        }}
                        className="bg-white border-2 border-black rounded-none shadow-lg font-mono text-black placeholder:text-gray-500 focus:border-blue-600 h-12 sm:h-auto"
                      />
                    </div>
                    {nicknameError && (
                      <div className="bg-red-500 border-2 border-black rounded px-3 py-2">
                        <p className="text-xs sm:text-sm text-white font-bold">{nicknameError}</p>
                      </div>
                    )}
                  </div>

                  {!roomCode && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="inline-block bg-white rounded px-2 py-1 border border-black">
                          <Label htmlFor="roomCode" className="text-black font-bold text-xs sm:text-sm">ROOM CODE</Label>
                        </div>
                        <Button
                          type="button"
                          onClick={() => setShowScanner(true)}
                          className="flex items-center gap-2 bg-white hover:bg-gray-100 border-2 border-black rounded px-3 py-1 text-black font-bold text-xs sm:text-sm transform hover:scale-105 transition-all duration-200 min-h-9"
                        >
                          <Camera className="h-4 w-4" />
                          <span>SCAN</span>
                        </Button>
                      </div>
                      <div className="relative">
                        <Input
                          id="roomCode"
                          type="text"
                          placeholder="Enter 6-digit"
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

                  {roomCode && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="inline-block bg-white rounded px-2 py-1 border border-black">
                          <Label className="text-black font-bold text-xs sm:text-sm">ROOM CODE</Label>
                        </div>
                        <Button
                          type="button"
                          onClick={() => setShowScanner(true)}
                          className="flex items-center gap-2 bg-white hover:bg-gray-100 border-2 border-black rounded px-3 py-1 text-black font-bold text-xs sm:text-sm transform hover:scale-105 transition-all duration-200 min-h-9"
                        >
                          <Camera className="h-4 w-4" />
                          <span>SCAN</span>
                        </Button>
                      </div>
                      <div className="relative">
                        <Input
                          id="roomCodeFromUrl"
                          type="text"
                          placeholder="Enter 6-digit"
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

                  {/* Pixel Avatar Section */}
                  <div className="space-y-2">
                    <div className="inline-block bg-white rounded px-2 py-1 border border-black">
                      <Label className="text-black font-bold text-xs sm:text-sm">CHOOSE AVATAR</Label>
                    </div>
                    <div className="bg-white border-2 border-black rounded p-2 sm:p-3">
                      <AvatarSelector
                        selectedAvatar={selectedAvatar}
                        onAvatarSelect={(a) => { setSelectedAvatar(a); setUserChangedAvatar(true) }}
                        onFirstAvatarChange={handleFirstAvatarChange}
                        externalAvatar={isAuthenticated && userProfile?.avatar_url ? userProfile.avatar_url : undefined}
                      />
                    </div>
                  </div>

                  {/* Pixel Button */}
                  <div className="pt-3 sm:pt-4">
                    <Button
                      className="w-full bg-green-500 hover:bg-green-600 border-2 border-black rounded-none shadow-lg font-bold text-black text-base sm:text-lg py-3 sm:py-3 transform hover:scale-105 transition-all duration-200 min-h-11"
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

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}
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
      <div className="absolute top-20 left-10 w-16 h-16 bg-linear-to-br from-blue-400 to-purple-400 opacity-30 pixel-block-float">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute top-40 right-20 w-12 h-12 bg-linear-to-br from-green-400 to-cyan-400 opacity-40 pixel-block-float-delayed">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-linear-to-br from-red-400 to-pink-400 opacity-35 pixel-block-float-slow">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute bottom-20 right-1/3 w-14 h-14 bg-linear-to-br from-yellow-400 to-orange-400 opacity-45 pixel-block-float-delayed-slow">
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
            <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-linear-to-br from-blue-500 to-purple-500 rounded-lg border-4 border-black shadow-2xl p-6">
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
