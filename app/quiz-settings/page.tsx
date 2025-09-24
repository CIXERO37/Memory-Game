"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Settings, Clock, HelpCircle } from "lucide-react"
import { getQuizById } from "@/lib/quiz-data"

interface QuizSettingsProps {
  quizId: string
  onComplete: (settings: { timeLimit: number; questionCount: number }) => void
  onBack: () => void
}

export function QuizSettings({ quizId, onComplete, onBack }: QuizSettingsProps) {
  const [timeLimit, setTimeLimit] = useState([10]) // Default 10 menit
  const [questionCount, setQuestionCount] = useState([10]) // Default 10 questions
  const [maxQuestions, setMaxQuestions] = useState(50) // Default max questions
  const [quiz, setQuiz] = useState<any>(null)

  useEffect(() => {
    // Get quiz data to determine max questions
    const quizData = getQuizById(quizId)
    if (quizData) {
      setQuiz(quizData)
      setMaxQuestions(quizData.questions.length)
      // Set default question count to min of 10 or total questions
      setQuestionCount([Math.min(10, quizData.questions.length)])
    }
  }, [quizId])

  const handleComplete = () => {
    onComplete({
      timeLimit: timeLimit[0],
      questionCount: questionCount[0],
    })
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Main Settings Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-indigo-100 border-2 border-blue-200 shadow-2xl rounded-2xl">
        {/* Card corner decorations */}
        <div className="absolute top-4 left-4 w-8 h-8 border-2 border-blue-300 rounded-lg transform rotate-45 opacity-60"></div>
        <div className="absolute top-4 right-4 w-8 h-8 border-2 border-blue-300 rounded-lg transform rotate-45 opacity-60"></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-2 border-blue-300 rounded-lg transform rotate-45 opacity-60"></div>
        <div className="absolute bottom-4 right-4 w-8 h-8 border-2 border-blue-300 rounded-lg transform rotate-45 opacity-60"></div>

        <CardHeader className="text-center relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform transition-all duration-300 hover:scale-110 hover:rotate-6">
            <Settings className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Quiz Settings
          </CardTitle>
          <CardDescription className="text-gray-600 font-medium">
            Configure your quiz preferences
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 relative z-10">
          {/* Time Limit Card */}
          <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-blue-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <Label className="text-base font-semibold text-gray-700">Time Limit for Quiz</Label>
              </div>
              <div className="bg-blue-100 px-3 py-1 rounded-full">
                <span className="text-sm font-bold text-blue-700">{timeLimit[0]} min</span>
              </div>
            </div>
            <div className="relative">
              <Slider 
                value={timeLimit} 
                onValueChange={setTimeLimit} 
                max={60} 
                min={5} 
                step={5} 
                className="w-full quiz-slider"
              />
              {/* Card-like slider track overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="h-2 bg-gradient-to-r from-blue-100 via-blue-200 to-indigo-200 rounded-full opacity-60"></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>5 min</span>
              <span>60 min</span>
            </div>
          </div>

          {/* Question Count Card */}
          <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-blue-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-indigo-600" />
                <Label className="text-base font-semibold text-gray-700">Number of Questions</Label>
              </div>
              <div className="bg-indigo-100 px-3 py-1 rounded-full">
                <span className="text-sm font-bold text-indigo-700">{questionCount[0]} questions</span>
              </div>
            </div>
            <div className="relative">
              <Slider
                value={questionCount}
                onValueChange={setQuestionCount}
                max={maxQuestions}
                min={1}
                step={1}
                className="w-full quiz-slider"
              />
              {/* Card-like slider track overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="h-2 bg-gradient-to-r from-indigo-100 via-indigo-200 to-purple-200 rounded-full opacity-60"></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>1</span>
              <span>{maxQuestions}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button 
              variant="outline" 
              onClick={onBack} 
              className="flex-1 bg-white/80 backdrop-blur-sm border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 hover:scale-105 hover:shadow-lg rounded-xl font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={handleComplete} 
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 hover:scale-105 hover:shadow-xl rounded-xl font-semibold shadow-lg"
            >
              Create Room
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
