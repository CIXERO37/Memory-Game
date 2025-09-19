"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import { QuizSettings } from "@/app/quiz-settings/page"
import { roomManager } from "@/lib/room-manager"

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null)
  const [hostId] = useState(() => Math.random().toString(36).substr(2, 9))

  useEffect(() => {
    const quizId = searchParams.get("quizId")
    if (quizId) {
      setSelectedQuiz(quizId)
    } else {
      // Redirect to select quiz if no quizId
      router.push("/select-quiz")
    }
  }, [searchParams, router])

  const handleSettingsComplete = (settings: { timeLimit: number; questionCount: number }) => {
    if (!selectedQuiz) return

    const room = roomManager.createRoom(hostId, {
      questionCount: settings.questionCount,
      timePerQuestion: settings.timeLimit,
    })

    // Store host info
    localStorage.setItem(
      "currentHost",
      JSON.stringify({
        hostId,
        roomCode: room.code,
        quizId: selectedQuiz,
      }),
    )

    // Navigate to lobby
    router.push(`/lobby?roomCode=${room.code}`)
  }

  if (!selectedQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/select-quiz">
            <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10 hover:border-white/30 bg-white/5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Settings</h1>
          </div>
        </div>

        {/* Quiz Settings */}
        <QuizSettings
          quizId={selectedQuiz}
          onComplete={handleSettingsComplete}
          onBack={() => router.push("/select-quiz")}
        />
      </div>
    </div>
  )
}
