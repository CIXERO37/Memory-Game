"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import { roomManager } from "@/lib/room-manager"
import { getQuizById } from "@/lib/quiz-data"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Clock, HelpCircle } from "lucide-react"

function QuizSettingsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null)
  const [hostId] = useState(() => Math.random().toString(36).substr(2, 9))
  const [timeLimit, setTimeLimit] = useState([10]) // Default 10 menit
  const [questionCount, setQuestionCount] = useState([10]) // Default 10 questions
  const [maxQuestions, setMaxQuestions] = useState(50) // Default max questions
  const [quiz, setQuiz] = useState<any>(null)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)

  useEffect(() => {
    const quizId = searchParams.get("quizId")
    if (quizId) {
      setSelectedQuiz(quizId)
      // Get quiz data to determine max questions
      const quizData = getQuizById(quizId)
      if (quizData) {
        setQuiz(quizData)
        setMaxQuestions(quizData.questions.length)
        // Set default question count to min of 10 or total questions
        setQuestionCount([Math.min(10, quizData.questions.length)])
      }
    } else {
      // Redirect to select quiz if no quizId
      router.push("/select-quiz")
    }
  }, [searchParams, router])

  const handleSettingsComplete = async () => {
    if (!selectedQuiz || isCreatingRoom) return

    setIsCreatingRoom(true)

    try {
      // Get quiz title from quiz data
      const quizTitle = `Quiz ${selectedQuiz}` // You can enhance this to get actual quiz title
      
      console.log("[QuizSettings] Creating room with settings:", {
        timeLimit: timeLimit[0],
        questionCount: questionCount[0]
      })
      
      const room = await roomManager.createRoom(hostId, {
        questionCount: questionCount[0],
        totalTimeLimit: timeLimit[0],
      }, selectedQuiz, quizTitle)

      if (!room) {
        console.error("[QuizSettings] Failed to create room")
        alert("Failed to create room. Please try again.")
        setIsCreatingRoom(false)
        return
      }

      console.log("[QuizSettings] Room created successfully:", room)

      // Verify room exists before proceeding
      const verifyRoom = await roomManager.getRoom(room.code)
      if (!verifyRoom) {
        console.error("[QuizSettings] Room verification failed")
        alert("Room was created but verification failed. Please try again.")
        setIsCreatingRoom(false)
        return
      }

      console.log("[QuizSettings] Room verification successful:", verifyRoom)

      // Store host info
      localStorage.setItem(
        "currentHost",
        JSON.stringify({
          hostId,
          roomCode: room.code,
          quizId: selectedQuiz,
        }),
      )

      // Store quiz settings for the game
      localStorage.setItem(
        `game-${room.code}`,
        JSON.stringify({
          quizId: selectedQuiz,
          settings: {
            questionCount: questionCount[0],
            totalTimeLimit: timeLimit[0],
          },
        }),
      )

      console.log("[QuizSettings] Host data stored, navigating to lobby")

      // Navigate to lobby with a small delay to ensure data is stored
      setTimeout(() => {
        router.push(`/lobby?roomCode=${room.code}`)
      }, 100)
      
    } catch (error) {
      console.error("[QuizSettings] Error creating room:", error)
      alert("An error occurred while creating the room. Please try again.")
      setIsCreatingRoom(false)
    }
  }

  if (!selectedQuiz) {
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
                <Settings className="h-8 w-8 text-black animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 pixel-font">LOADING...</h3>
              <p className="text-white/80 pixel-font-sm">PREPARING QUIZ SETTINGS</p>
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
          <Link href="/select-quiz">
            <div className="relative pixel-button-container">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
              <Button variant="outline" size="sm" className="relative bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 border-2 border-black rounded flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div className="inline-block bg-white border-2 border-black rounded px-4 py-2 pixel-header-title">
              <h1 className="text-xl font-bold text-black pixel-font">SETTINGS</h1>
            </div>
          </div>
        </div>

        {/* Quiz Settings */}
        <div className="max-w-md mx-auto">
          {/* Pixel Settings Card */}
          <div className="relative pixel-settings-container">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg border-4 border-black shadow-2xl pixel-settings-card">
              <div className="p-6 space-y-6">
                {/* Pixel Header */}
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-white border-4 border-black rounded-lg flex items-center justify-center mx-auto mb-4 pixel-settings-icon">
                    <Settings className="h-8 w-8 text-black" />
                  </div>
                  <div className="inline-block bg-white border-2 border-black rounded px-4 py-2 pixel-header-title">
                    <h2 className="text-xl font-bold text-black pixel-font">QUIZ SETTINGS</h2>
                  </div>
                  <div className="bg-black/20 border border-white/30 rounded px-3 py-2">
                    <p className="text-sm text-white font-medium pixel-font-sm">CONFIGURE YOUR QUIZ PREFERENCES</p>
                  </div>
                </div>

                {/* Pixel Time Limit Section */}
                <div className="bg-white border-2 border-black rounded p-4 pixel-setting-section">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 border border-black rounded flex items-center justify-center">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                      <div className="inline-block bg-blue-500 border border-black rounded px-2 py-1">
                        <Label className="text-white font-bold text-xs pixel-font-sm">TIME LIMIT</Label>
                      </div>
                    </div>
                    <div className="bg-yellow-400 border-2 border-black rounded px-3 py-1">
                      <span className="text-black font-bold text-sm pixel-font-sm">{timeLimit[0]} MIN</span>
                    </div>
                  </div>
                  <div className="relative">
                    <Slider 
                      value={timeLimit} 
                      onValueChange={setTimeLimit} 
                      max={60} 
                      min={5} 
                      step={5} 
                      className="w-full pixel-slider"
                    />
                    <div className="flex justify-between text-xs text-black mt-2 pixel-font-sm">
                      <span>5 MIN</span>
                      <span>60 MIN</span>
                    </div>
                  </div>
                </div>

                {/* Pixel Question Count Section */}
                <div className="bg-white border-2 border-black rounded p-4 pixel-setting-section">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500 border border-black rounded flex items-center justify-center">
                        <HelpCircle className="h-4 w-4 text-white" />
                      </div>
                      <div className="inline-block bg-green-500 border border-black rounded px-2 py-1">
                        <Label className="text-white font-bold text-xs pixel-font-sm">QUESTIONS</Label>
                      </div>
                    </div>
                    <div className="bg-orange-400 border-2 border-black rounded px-3 py-1">
                      <span className="text-black font-bold text-sm pixel-font-sm">{questionCount[0]} Q'S</span>
                    </div>
                  </div>
                  <div className="relative">
                    <Slider
                      value={questionCount}
                      onValueChange={setQuestionCount}
                      max={maxQuestions}
                      min={1}
                      step={1}
                      className="w-full pixel-slider"
                    />
                    <div className="flex justify-between text-xs text-black mt-2 pixel-font-sm">
                      <span>1</span>
                      <span>{maxQuestions}</span>
                    </div>
                  </div>
                </div>

                {/* Pixel Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <div className="flex-1 relative pixel-button-container">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push("/select-quiz")} 
                      className="relative w-full bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200 font-bold"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      <span className="pixel-font-sm">BACK</span>
                    </Button>
                  </div>
                  <div className="flex-1 relative pixel-button-container">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                    <Button 
                      onClick={handleSettingsComplete} 
                      disabled={isCreatingRoom}
                      className="relative w-full bg-gradient-to-br from-green-500 to-emerald-500 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-green-400 hover:to-emerald-400 transform hover:scale-105 transition-all duration-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <span className="pixel-font-sm">{isCreatingRoom ? "CREATING..." : "CREATE ROOM"}</span>
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

export default function QuizSettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
        <div className="relative z-10 text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg border-4 border-black shadow-2xl p-6">
              <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                <Settings className="h-8 w-8 text-black animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 pixel-font">LOADING...</h3>
              <p className="text-white/80 pixel-font-sm">PREPARING QUIZ SETTINGS</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <QuizSettingsPageContent />
    </Suspense>
  )
}