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

function JoinPageContent() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const { userProfile, isAuthenticated, loading } = useAuth()
  const [username, setUsername] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [selectedAvatar, setSelectedAvatar] = useState("") // Will be set to random avatar
  const [userChangedAvatar, setUserChangedAvatar] = useState(false)
  const [userChangedUsername, setUserChangedUsername] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [roomError, setRoomError] = useState("")
  const [playerId, setPlayerId] = useState<string>("")
  const [sessionId, setSessionId] = useState<string>("")
  const [hasClickedJoin, setHasClickedJoin] = useState(false)
  const [usernameError, setUsernameError] = useState("")
  const [roomCodeError, setRoomCodeError] = useState("")
  const [showScanner, setShowScanner] = useState(false)

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
              // Only set username from session if user is NOT authenticated
              // If user is authenticated, username will be set from userProfile in the next effect
              if (!isAuthenticated && !username && sessionData.user_data.username) {
                setUsername(sessionData.user_data.username)
              }
              if (!selectedAvatar) {
                setSelectedAvatar(sessionData.user_data.avatar || "")
              }
              console.log('[Join] Existing session found:', {
                playerId: sessionData.user_data.id,
                username: sessionData.user_data.username,
                avatar: sessionData.user_data.avatar,
                roomCode: sessionData.room_code
              })
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
        console.log('[Join] Generated new player ID:', newPlayerId)
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
    console.log('=== JOIN PAGE DEBUG ===')
    console.log('Loading:', loading)
    console.log('Is Authenticated:', isAuthenticated)
    console.log('User Profile:', userProfile)
    console.log('User Profile Username:', userProfile?.username)
    console.log('User Profile Name:', userProfile?.name)
    console.log('Avatar URL:', userProfile?.avatar_url)
    console.log('User Changed Avatar:', userChangedAvatar)
    console.log('User Changed Username:', userChangedUsername)
    console.log('Current Username:', username)
    console.log('========================')
    
    if (!loading && isAuthenticated && userProfile) {
      // Get username from Google - prioritize username field, then name field
      const authUsername = userProfile.username || userProfile.name || ""
      
      // If user is authenticated, ALWAYS use Google username unless user manually changed it
      if (authUsername) {
        if (!userChangedUsername) {
          // User hasn't manually changed username, so use Google username
          if (username !== authUsername) {
            console.log('Setting username from Google auth:', authUsername)
            setUsername(authUsername)
          }
        } else {
          // User has manually changed username, but if current username is empty or from localStorage,
          // still prefer Google username
          if (!username || username.trim() === "") {
            console.log('Username was changed but is empty, restoring from Google auth:', authUsername)
            setUsername(authUsername)
            setUserChangedUsername(false) // Reset flag since we're using Google username
          }
        }
      }
      
      // If logged in and user hasn't manually changed avatar, prefer auth avatar
      if (userProfile.avatar_url && !userChangedAvatar) {
        console.log('Setting selected avatar to:', userProfile.avatar_url)
        setSelectedAvatar(userProfile.avatar_url)
      }
    } else if (!loading && !isAuthenticated) {
      // User is not authenticated, load from localStorage as fallback
      if (typeof window !== 'undefined' && !username && !userChangedUsername) {
        const savedUsername = localStorage.getItem('lastUsername')
        if (savedUsername) {
          console.log('Loading saved username from localStorage (not authenticated):', savedUsername)
          setUsername(savedUsername)
        }
      }
    }
  }, [loading, isAuthenticated, userProfile, userChangedAvatar, userChangedUsername, username])

  // Additional effect to handle username persistence when auth state changes
  useEffect(() => {
    // If user becomes authenticated and username is empty or doesn't match Google username, update it
    if (!loading && isAuthenticated && userProfile && !userChangedUsername) {
      const authUsername = userProfile.username || userProfile.name || ""
      if (authUsername) {
        // If username is empty or different from Google username, update it
        if (!username || username.trim() === "" || username !== authUsername) {
          console.log('Updating username to match Google auth:', authUsername)
          setUsername(authUsername)
        }
      }
    }
  }, [isAuthenticated, userProfile, loading, userChangedUsername, username])

  // Emergency fallback: restore username if it becomes empty unexpectedly
  useEffect(() => {
    if (!loading && !username.trim() && !userChangedUsername) {
      // Try to restore from auth first (highest priority)
      if (isAuthenticated && userProfile) {
        const authUsername = userProfile.username || userProfile.name || ""
        if (authUsername) {
          console.log('Emergency restore from Google auth:', authUsername)
          setUsername(authUsername)
          return
        }
      }
      
      // Fallback to localStorage only if not authenticated
      if (!isAuthenticated && typeof window !== 'undefined') {
        const savedUsername = localStorage.getItem('lastUsername')
        if (savedUsername) {
          console.log('Emergency restore from localStorage (not authenticated):', savedUsername)
          setUsername(savedUsername)
        }
      }
    }
  }, [username, loading, isAuthenticated, userProfile, userChangedUsername])

  // Save username to localStorage whenever it changes
  useEffect(() => {
    if (username && username.trim() && typeof window !== 'undefined') {
      localStorage.setItem('lastUsername', username.trim())
    }
  }, [username])

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
      return
    }

    if (room.gameStarted) {
      setRoomError("This game has already started. Please join a new room.")
      setIsJoining(false)
      setHasClickedJoin(false)
      return
    }

    // Check if player already exists in room by username and avatar (not just playerId)
    const existingPlayer = room.players.find((p: any) => 
      p.username === username.trim() && p.avatar === selectedAvatar
    )
    
    console.log("[Join] Checking for existing player:", {
      username: username.trim(),
      avatar: selectedAvatar,
      existingPlayer,
      allPlayers: room.players.map(p => ({ username: p.username, avatar: p.avatar, id: p.id })),
      currentPlayerId: playerId
    })
    
    // If player exists, update the playerId to match the existing player
    if (existingPlayer) {
      console.log("[Join] Player exists, updating playerId from", playerId, "to", existingPlayer.id)
      setPlayerId(existingPlayer.id)
      // Also update the session with the correct player ID
      try {
        const existingSessionId = sessionManager.getSessionIdFromStorage()
        if (existingSessionId) {
          await sessionManager.getOrCreateSession(
            'player',
            {
              id: existingPlayer.id,
              username: username.trim(),
              avatar: selectedAvatar,
              roomCode,
            },
            roomCode
          )
          console.log("[Join] Updated existing session with correct player ID")
        }
      } catch (error) {
        console.warn("[Join] Error updating session with correct player ID:", error)
      }
    }
    
    let success: boolean
    if (existingPlayer) {
      // Player exists, use rejoinRoom with existing player ID
      console.log("[Join] Player exists, rejoining with ID:", existingPlayer.id)
      success = await roomManager.rejoinRoom(roomCode, {
        id: existingPlayer.id,
        username: username.trim(),
        avatar: selectedAvatar,
      })
    } else {
      // New player, use joinRoom
      console.log("[Join] New player, joining room")
      success = await roomManager.joinRoom(roomCode, {
        username: username.trim(),
        avatar: selectedAvatar,
      })
    }

    console.log("[Join] Join/Rejoin result:", success)

    if (success) {
      // Get the actual player ID from the room
      const updatedRoom = await roomManager.getRoom(roomCode)
      const actualPlayer = updatedRoom?.players.find((p: any) => 
        p.username === username.trim() && p.avatar === selectedAvatar
      )
      const finalPlayerId = actualPlayer?.id || existingPlayer?.id || playerId
      
      console.log("[Join] Player successfully joined/rejoined:", {
        finalPlayerId,
        existingPlayerId: existingPlayer?.id,
        actualPlayerId: actualPlayer?.id,
        wasExistingPlayer: !!existingPlayer
      })
      
      // Store player info in Supabase session
      try {
        console.log("[Join] Creating/updating session for player:", {
          id: finalPlayerId,
          username: username.trim(),
          avatar: selectedAvatar,
          roomCode
        })
        
        // Always create/update session with the correct player ID
        console.log("[Join] Creating/updating session with final player ID:", finalPlayerId)
        const { sessionId } = await sessionManager.getOrCreateSession(
          'player',
          {
            id: finalPlayerId,
            username: username.trim(),
            avatar: selectedAvatar,
            roomCode,
          },
          roomCode
        )
        const newSessionId = sessionId
        
        setSessionId(newSessionId)
        console.log("[Join] Session created/updated:", newSessionId)
        
        // Also store in localStorage as backup
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
          console.log("[Join] Player data also stored in localStorage with final ID:", finalPlayerId)
        }
      } catch (error) {
        console.warn("[Join] Error creating session:", error)
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
          console.log("[Join] Fallback: Player data stored in localStorage only with final ID:", finalPlayerId)
        }
        // Still set session ID for consistency
        setSessionId(`fallback_${finalPlayerId}_${Date.now()}`)
      }

      console.log("[Join] Successfully joined/rejoined, redirecting to waiting room")
      console.log("[Join] Final player data:", {
        id: finalPlayerId,
        username: username.trim(),
        avatar: selectedAvatar,
        roomCode,
        wasExistingPlayer: !!existingPlayer
      })
      
      // Add a small delay to ensure session is saved
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Redirect to waiting room route
      console.log("[Join] Redirecting to waiting room:", `/waiting-room/${roomCode}`)
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
            src="/images/gameforsmartlogo.png"
            alt="GameForSmart Logo"
            width={240}
            height={72}
            className="h-10 sm:h-14 md:h-16 w-auto"
            priority
          />
        </div>
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
        <Link href="/">
              <div className="relative pixel-button-container">
                <div className="absolute inset-0 bg-linear-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                <Button variant="outline" size="default" className="relative bg-linear-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-linear-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200 h-10 w-10 min-h-[44px] min-w-[44px]">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            </Link>
            {/* MemoryQuiz Logo to the right of ArrowLeft */}
            <Image
              src="/images/memoryquiz.webp"
              alt="Memory Quiz Logo"
              width={240}
              height={72}
              className="h-10 sm:h-14 md:h-16 w-auto"
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
                        <Label htmlFor="username" className="text-black font-bold text-xs sm:text-sm">USERNAME</Label>
                      </div>
                        <div className="relative">
                          <Input
                            id="username"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => {
                              setUsername(e.target.value)
                              setUserChangedUsername(true)
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

                    {!roomCode && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="inline-block bg-white rounded px-2 py-1 border border-black">
                            <Label htmlFor="roomCode" className="text-black font-bold text-xs sm:text-sm">ROOM CODE</Label>
                          </div>
                          <Button
                            type="button"
                            onClick={() => setShowScanner(true)}
                            className="flex items-center gap-2 bg-white hover:bg-gray-100 border-2 border-black rounded px-3 py-1 text-black font-bold text-xs sm:text-sm transform hover:scale-105 transition-all duration-200 min-h-[36px]"
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
                            className="flex items-center gap-2 bg-white hover:bg-gray-100 border-2 border-black rounded px-3 py-1 text-black font-bold text-xs sm:text-sm transform hover:scale-105 transition-all duration-200 min-h-[36px]"
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
