"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { QuizSelector } from "@/components/quiz-selector"
import { QuizSettings } from "@/components/quiz-settings"
import { HostLobby } from "@/components/host-lobby"
import { roomManager } from "@/lib/room-manager"

type HostStep = "select-quiz" | "settings" | "lobby"

export default function HostPage() {
  const [currentStep, setCurrentStep] = useState<HostStep>("select-quiz")
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null)
  const [quizSettings, setQuizSettings] = useState({
    timeLimit: 30,
    questionCount: 10,
  })
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [hostId] = useState(() => Math.random().toString(36).substr(2, 9))

  const handleQuizSelect = (quizId: string) => {
    setSelectedQuiz(quizId)
    setCurrentStep("settings")
  }

  const handleSettingsComplete = (settings: { timeLimit: number; questionCount: number }) => {
    setQuizSettings(settings)

    const room = roomManager.createRoom(hostId, {
      questionCount: settings.questionCount,
      timePerQuestion: settings.timeLimit,
    })

    setRoomCode(room.code)

    localStorage.setItem(
      "currentHost",
      JSON.stringify({
        hostId,
        roomCode: room.code,
        quizId: selectedQuiz,
      }),
    )

    setCurrentStep("lobby")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Host a Game</h1>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                currentStep === "select-quiz"
                  ? "bg-primary text-primary-foreground"
                  : selectedQuiz
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">1</span>
              Select Quiz
            </div>
            <div className={`w-8 h-0.5 ${selectedQuiz ? "bg-accent" : "bg-muted"}`} />
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                currentStep === "settings"
                  ? "bg-primary text-primary-foreground"
                  : roomCode
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">2</span>
              Settings
            </div>
            <div className={`w-8 h-0.5 ${roomCode ? "bg-accent" : "bg-muted"}`} />
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                currentStep === "lobby" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">3</span>
              Lobby
            </div>
          </div>
        </div>

        {/* Content */}
        {currentStep === "select-quiz" && <QuizSelector onQuizSelect={handleQuizSelect} />}

        {currentStep === "settings" && selectedQuiz && (
          <QuizSettings
            quizId={selectedQuiz}
            onComplete={handleSettingsComplete}
            onBack={() => setCurrentStep("select-quiz")}
          />
        )}

        {currentStep === "lobby" && roomCode && (
          <HostLobby
            roomCode={roomCode}
            hostId={hostId}
            quizId={selectedQuiz!}
            settings={quizSettings}
            onBack={() => setCurrentStep("settings")}
          />
        )}
      </div>
    </div>
  )
}
