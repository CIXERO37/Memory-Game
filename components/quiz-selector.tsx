"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Calculator, Globe, Beaker, Palette, Music, Trophy, Zap } from "lucide-react"
import { quizzes } from "@/lib/quiz-data"

const iconMap = {
  Calculator,
  Beaker,
  Globe,
  BookOpen,
  Trophy,
  Palette,
  Music,
  Zap,
}

interface QuizSelectorProps {
  onQuizSelect: (quizId: string) => void
}

export function QuizSelector({ onQuizSelect }: QuizSelectorProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Choose a Quiz</h2>
        <p className="text-muted-foreground">Select a quiz category to start your game</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes.map((quiz) => {
          const Icon = iconMap[quiz.icon as keyof typeof iconMap]
          return (
            <Card
              key={quiz.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50"
              onClick={() => onQuizSelect(quiz.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${quiz.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge
                    variant={
                      quiz.difficulty === "Easy"
                        ? "secondary"
                        : quiz.difficulty === "Medium"
                          ? "default"
                          : "destructive"
                    }
                  >
                    {quiz.difficulty}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{quiz.title}</CardTitle>
                <CardDescription className="text-sm">{quiz.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{quiz.questions.length} questions</span>
                  <span>Click to select</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
