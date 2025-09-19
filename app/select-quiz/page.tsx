"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, FileSearch, BookOpen, Calculator, Globe, Beaker, Palette, Music, Trophy, Zap, Search, Filter } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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

export default function SelectQuizPage() {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("all")

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSearchTerm(searchInput)
    }
  }

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const matchesSearch = searchTerm === "" || 
                           quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesDifficulty = difficultyFilter === "all" || quiz.difficulty === difficultyFilter
      return matchesSearch && matchesDifficulty
    })
  }, [searchTerm, difficultyFilter])

  const handleQuizSelect = (quizId: string) => {
    // Navigate to settings page with quizId
    router.push(`/settings?quizId=${quizId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10 hover:border-white/30 bg-white/5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <FileSearch className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Select Quiz</h1>
          </div>
        </div>

        {/* Quiz Selector Content */}
        <div className="max-w-4xl mx-auto">
          {/* Search and Filter Section */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by title or description..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearch}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                />
              </div>
              
              {/* Difficulty Filter */}
              <div className="sm:w-48">
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-blue-400">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by difficulty" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">All Difficulties</SelectItem>
                    <SelectItem value="Easy" className="text-white hover:bg-slate-700">Easy</SelectItem>
                    <SelectItem value="Medium" className="text-white hover:bg-slate-700">Medium</SelectItem>
                    <SelectItem value="Hard" className="text-white hover:bg-slate-700">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQuizzes.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No quizzes found</h3>
                <p className="text-gray-400">Try adjusting your search terms or difficulty filter</p>
              </div>
            ) : (
              filteredQuizzes.map((quiz) => {
                const Icon = iconMap[quiz.icon as keyof typeof iconMap]
                return (
                  <Card
                    key={quiz.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50"
                    onClick={() => handleQuizSelect(quiz.id)}
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
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
