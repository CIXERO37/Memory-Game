"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Settings } from "lucide-react"

interface QuizSettingsProps {
  quizId: string
  onComplete: (settings: { timeLimit: number; questionCount: number }) => void
  onBack: () => void
}

export function QuizSettings({ quizId, onComplete, onBack }: QuizSettingsProps) {
  const [timeLimit, setTimeLimit] = useState([30])
  const [questionCount, setQuestionCount] = useState([10])

  const handleComplete = () => {
    onComplete({
      timeLimit: timeLimit[0],
      questionCount: questionCount[0],
    })
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Quiz Settings</CardTitle>
          <CardDescription>Configure your quiz preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Time Limit per Question</Label>
              <span className="text-sm font-medium text-primary">{timeLimit[0]} seconds</span>
            </div>
            <Slider value={timeLimit} onValueChange={setTimeLimit} max={60} min={10} step={5} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10s</span>
              <span>60s</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Number of Questions</Label>
              <span className="text-sm font-medium text-primary">{questionCount[0]} questions</span>
            </div>
            <Slider
              value={questionCount}
              onValueChange={setQuestionCount}
              max={25}
              min={5}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5</span>
              <span>25</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onBack} className="flex-1 bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleComplete} className="flex-1">
              Create Room
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
