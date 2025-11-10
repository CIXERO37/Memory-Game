"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import { roomManager } from "@/lib/room-manager"
import { getQuizById } from "@/lib/quiz-data"
import { quizApi } from "@/lib/supabase"
import { sessionManager } from "@/lib/supabase-session-manager"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, HelpCircle } from "lucide-react"
import { useTranslation } from "react-i18next"

function QuizSettingsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useTranslation()
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null)
  const [hostId] = useState(() => Math.random().toString(36).substr(2, 9))
  const [timeLimit, setTimeLimit] = useState("5") // Default 5 menit
  const [questionCount, setQuestionCount] = useState("5") // Default 5 questions
  const [quiz, setQuiz] = useState<any>(null)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true)

  useEffect(() => {
    const quizId = searchParams.get("quizId")
    if (quizId) {
      setSelectedQuiz(quizId)
      
      // Try to get quiz data from Supabase first (for UUIDs)
      const fetchQuizData = async () => {
        setIsLoadingQuiz(true)
        try {
          console.log("[QuizSettings] Fetching quiz from Supabase with ID:", quizId)
          const quizData = await quizApi.getQuizById(quizId)
          console.log("[QuizSettings] Supabase Quiz Data:", quizData)
          
          if (quizData) {
            setQuiz(quizData)
            setQuestionCount("5") // Default to 5 questions
            setIsLoadingQuiz(false)
            return
          }
        } catch (error) {
          console.log("[QuizSettings] Supabase fetch failed, trying local data:", error)
        }
        
        // Fallback to local data (for short IDs like "math-basic")
        const localQuizData = getQuizById(quizId)
        console.log("[QuizSettings] Local Quiz Data:", localQuizData)
        
        if (localQuizData) {
          setQuiz(localQuizData)
          setQuestionCount("5") // Default to 5 questions
        } else {
          // If neither found, create a fallback quiz object
          console.warn("[QuizSettings] Quiz not found in both Supabase and local data for ID:", quizId)
          const fallbackQuiz = {
            id: quizId,
            title: "Custom Quiz",
            description: "A custom quiz created by the host",
            icon: "HelpCircle",
            color: "bg-primary/10 text-primary",
            difficulty: "Medium" as const,
            questions: []
          }
          setQuiz(fallbackQuiz)
          setQuestionCount("5") // Default question count
        }
        setIsLoadingQuiz(false)
      }
      
      fetchQuizData()
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
        timeLimit: parseInt(timeLimit),
        questionCount: parseInt(questionCount)
      })
      
      const room = await roomManager.createRoom(hostId, {
        questionCount: parseInt(questionCount),
        totalTimeLimit: parseInt(timeLimit),
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

      // Store host info in session manager
      try {
        await sessionManager.createOrUpdateSession(
          null, // Generate new session ID
          'host',
          {
            id: hostId,
            roomCode: room.code,
            quizId: selectedQuiz,
          },
          room.code
        )
        console.log("[QuizSettings] Host session created in Supabase")
      } catch (error) {
        console.error("[QuizSettings] Error creating host session:", error)
      }

      // Store host info in localStorage as fallback
      localStorage.setItem(
        "currentHost",
        JSON.stringify({
          hostId,
          roomCode: room.code,
          quizId: selectedQuiz,
        }),
      )

      // Store quiz settings for the game (keep in localStorage for now)
      localStorage.setItem(
        `game-${room.code}`,
        JSON.stringify({
          quizId: selectedQuiz,
          settings: {
            questionCount: parseInt(questionCount),
            totalTimeLimit: parseInt(timeLimit),
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
              <h3 className="text-lg font-bold text-white mb-2 pixel-font">{t('quizSettings.loading')}</h3>
              <p className="text-white/80 pixel-font-sm">{t('quizSettings.preparingSettings')}</p>
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

      <div className="relative z-10 container mx-auto px-4 py-4 sm:py-8">
        {/* Pixel Header */}
        <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/select-quiz">
            <div className="relative pixel-button-container">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
              <Button variant="outline" size="sm" className="relative bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200 min-h-[44px] min-w-[44px]">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <div className="inline-block bg-white border-2 border-black rounded px-3 sm:px-4 py-1 sm:py-2 pixel-header-title">
              <h1 className="text-lg sm:text-xl font-bold text-black pixel-font">{t('quizSettings.title')}</h1>
            </div>
          </div>
        </div>

        {/* Quiz Settings */}
        <div className="max-w-md mx-auto">
          {/* Pixel Settings Card */}
          <div className="relative pixel-settings-container">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
            <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg border-2 sm:border-4 border-black shadow-2xl pixel-settings-card">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Pixel Header */}
                <div className="text-center space-y-3 sm:space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white border-2 sm:border-4 border-black rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4 pixel-settings-icon">
                    <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-black" />
                  </div>
                  
                  {/* Quiz Information Display */}
                  {isLoadingQuiz ? (
                    <div className="bg-white border-2 border-black rounded-lg p-3 sm:p-4 pixel-quiz-info">
                      <div className="text-center space-y-2">
                        <div className="animate-pulse">
                          <div className="h-6 bg-gray-300 rounded mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                        <p className="text-sm text-gray-500 pixel-font-sm">{t('quizSettings.loadingQuizData')}</p>
                      </div>
                    </div>
                  ) : quiz ? (
                    <div className="bg-white border-2 border-black rounded-lg p-3 sm:p-4 pixel-quiz-info">
                      <div className="text-center space-y-2">
                        <h2 className="text-lg sm:text-xl font-bold text-black pixel-font">
                          {quiz.title}
                        </h2>
                        <p className="text-sm sm:text-base text-gray-700 pixel-font-sm leading-relaxed">
                          {quiz.description}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Pixel Time Limit Section */}
                <div className="bg-white border-2 border-black rounded p-3 sm:p-4 pixel-setting-section">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 border border-black rounded flex items-center justify-center">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div className="inline-block bg-blue-500 border border-black rounded px-2 py-1">
                        <Label className="text-white font-bold text-xs pixel-font-sm">{t('quizSettings.timeLimit')}</Label>
                      </div>
                    </div>
                    <div className="bg-yellow-400 border-2 border-black rounded px-2 sm:px-3 py-1">
                      <span className="text-black font-bold text-xs sm:text-sm pixel-font-sm">{timeLimit} {t('quizSettings.minutes')}</span>
                    </div>
                  </div>
                  <div className="relative">
                    <Select value={timeLimit} onValueChange={setTimeLimit}>
                      <SelectTrigger className="w-full bg-white border-2 border-black rounded-none shadow-lg font-mono text-sm sm:text-base text-black h-10 sm:h-12">
                        <SelectValue placeholder="Select time limit" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-2 border-black">
                        <SelectItem value="5">5 {t('quizSettings.minutes')}</SelectItem>
                        <SelectItem value="10">10 {t('quizSettings.minutes')}</SelectItem>
                        <SelectItem value="15">15 {t('quizSettings.minutes')}</SelectItem>
                        <SelectItem value="20">20 {t('quizSettings.minutes')}</SelectItem>
                        <SelectItem value="25">25 {t('quizSettings.minutes')}</SelectItem>
                        <SelectItem value="30">30 {t('quizSettings.minutes')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Pixel Question Count Section */}
                <div className="bg-white border-2 border-black rounded p-3 sm:p-4 pixel-setting-section">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 border border-black rounded flex items-center justify-center">
                        <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div className="inline-block bg-green-500 border border-black rounded px-2 py-1">
                        <Label className="text-white font-bold text-xs pixel-font-sm">{t('quizSettings.questions')}</Label>
                      </div>
                    </div>
                    <div className="bg-orange-400 border-2 border-black rounded px-2 sm:px-3 py-1">
                      <span className="text-black font-bold text-xs sm:text-sm pixel-font-sm">{questionCount} {t('quizSettings.questionsShort')}</span>
                    </div>
                  </div>
                  <div className="relative">
                    <Select value={questionCount} onValueChange={setQuestionCount}>
                      <SelectTrigger className="w-full bg-white border-2 border-black rounded-none shadow-lg font-mono text-sm sm:text-base text-black h-10 sm:h-12">
                        <SelectValue placeholder="Select question count" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-2 border-black">
                        <SelectItem value="5">5 {t('quizSettings.questionsShort')}</SelectItem>
                        <SelectItem value="10">10 {t('quizSettings.questionsShort')}</SelectItem>
                        <SelectItem value="20">20 {t('quizSettings.questionsShort')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Pixel Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-4">
                  <div className="flex-1 relative pixel-button-container">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push("/select-quiz")} 
                      className="relative w-full bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200 font-bold min-h-[44px]"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      <span className="pixel-font-sm text-sm sm:text-base">{t('quizSettings.back')}</span>
                    </Button>
                  </div>
                  <div className="flex-1 relative pixel-button-container">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                    <Button 
                      onClick={handleSettingsComplete} 
                      disabled={isCreatingRoom}
                      className="relative w-full bg-gradient-to-br from-green-500 to-emerald-500 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-green-400 hover:to-emerald-400 transform hover:scale-105 transition-all duration-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[44px]"
                    >
                      <span className="pixel-font-sm text-sm sm:text-base">{isCreatingRoom ? t('quizSettings.creating') : t('quizSettings.createRoom')}</span>
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