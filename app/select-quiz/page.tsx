"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, FileSearch, Search, Filter, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuizzes, transformQuizData } from "@/hooks/use-quiz"


export default function SelectQuizPage() {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  
  // Fetch quizzes from Supabase
  const { quizzes: supabaseQuizzes, loading, error } = useQuizzes()

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSearchTerm(searchInput)
    }
  }

  // Transform Supabase data to match existing interface
  const quizzes = useMemo(() => {
    return supabaseQuizzes.map(transformQuizData)
  }, [supabaseQuizzes])

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const matchesSearch = searchTerm === "" || 
                           quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesDifficulty = difficultyFilter === "all" || quiz.difficulty === difficultyFilter
      return matchesSearch && matchesDifficulty
    })
  }, [quizzes, searchTerm, difficultyFilter])

  const handleQuizSelect = (quizId: string) => {
    // Navigate to settings page with quizId
    router.push(`/quiz-settings?quizId=${quizId}`)
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
          <Link href="/">
            <div className="relative pixel-button-container">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
              <Button variant="outline" size="default" className="relative bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200 h-10 w-10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500 border-2 border-black rounded flex items-center justify-center">
              <FileSearch className="h-5 w-5 text-white" />
            </div>
            <div className="inline-block bg-white border-2 border-black rounded px-3 py-2 pixel-header-title">
              <h1 className="text-xl font-bold text-black">SELECT QUIZ</h1>
            </div>
          </div>
        </div>

        {/* Quiz Selector Content */}
        <div className="max-w-4xl mx-auto">
          {/* Pixel Search and Filter Section */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Pixel Search Input */}
              <div className="relative flex-1">
                <div className="inline-block bg-white border border-black rounded px-2 py-1 mb-2">
                  <label className="text-black font-bold text-sm">SEARCH</label>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-blue-500 border border-black rounded flex items-center justify-center">
                    <Search className="h-4 w-4 text-white" />
                  </div>
                  <Input
                    placeholder="Search by title or description..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleSearch}
                    className="pl-12 h-10 bg-white border-2 border-black rounded-none shadow-lg font-mono text-base text-black placeholder:text-gray-500 focus:border-blue-600"
                  />
                </div>
              </div>
              
              {/* Pixel Difficulty Filter */}
              <div className="sm:w-56">
                <div className="inline-block bg-white border border-black rounded px-2 py-1 mb-2">
                  <label className="text-black font-bold text-sm">FILTER</label>
                </div>
                <div className="relative">
                  <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                    <SelectTrigger className="h-10 bg-white border-2 border-black rounded-none shadow-lg text-base text-black focus:border-blue-600">
                      <div className="w-6 h-6 bg-green-500 border border-black rounded mr-2 flex items-center justify-center">
                        <Filter className="h-4 w-4 text-white" />
                      </div>
                      <SelectValue placeholder="Filter by difficulty" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-black">
                      <SelectItem value="all" className="text-black hover:bg-gray-200 text-base">ALL DIFFICULTIES</SelectItem>
                      <SelectItem value="Easy" className="text-black hover:bg-green-200 text-base">EASY</SelectItem>
                      <SelectItem value="Medium" className="text-black hover:bg-yellow-200 text-base">MEDIUM</SelectItem>
                      <SelectItem value="Hard" className="text-black hover:bg-red-200 text-base">HARD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-6 justify-items-center">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                  <div className="relative bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg border-4 border-black shadow-2xl p-6">
                    <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                      <Loader2 className="h-8 w-8 text-black animate-spin" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">LOADING QUIZZES...</h3>
                    <p className="text-white/80 text-sm">FETCHING QUIZ DATA FROM DATABASE</p>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="col-span-full text-center py-12">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                  <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-lg border-4 border-black shadow-2xl p-6">
                    <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">ERROR LOADING QUIZZES</h3>
                    <p className="text-white/80 mb-4 text-sm">{error}</p>
                    <p className="text-white/60 text-sm">PLEASE CHECK YOUR SUPABASE CONFIGURATION</p>
                  </div>
                </div>
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                  <div className="relative bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg border-4 border-black shadow-2xl p-6">
                    <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                      <Search className="h-8 w-8 text-black" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">NO QUIZZES FOUND</h3>
                    <p className="text-white/80 text-sm">TRY ADJUSTING YOUR SEARCH TERMS OR DIFFICULTY FILTER</p>
                  </div>
                </div>
              </div>
            ) : (
              filteredQuizzes.map((quiz) => {
                const difficultyColor = quiz.difficulty === 'Easy' ? 'bg-green-500' : 
                                       quiz.difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                return (
                  <div
                    key={quiz.id}
                    className="relative cursor-pointer transition-all duration-300 hover:-translate-y-1 pixel-quiz-card-container"
                    onClick={() => handleQuizSelect(quiz.id)}
                  >
                    <div className="relative pixel-quiz-card">
                      {/* Pixel Difficulty badge */}
                      <div className={`absolute -top-2 -right-2 ${difficultyColor} border-2 border-black rounded-lg px-2 py-1 shadow-xl z-20 transform rotate-3`}>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          <span className="text-white font-bold text-xs tracking-wide">
                            {quiz.difficulty.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Pixel Main content */}
                      <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 z-10">
                        <div className="bg-white border-2 border-black rounded px-3 py-1 mb-2 shadow-lg">
                          <h3 className="text-base font-bold text-black">
                            {quiz.title.toUpperCase()}
                          </h3>
                        </div>
                        <div className="bg-black/20 border border-white/30 rounded px-2 py-1 mb-3">
                          <p className="text-xs text-white font-medium leading-relaxed">
                            {quiz.description.toUpperCase()}
                          </p>
                        </div>
                        <div className="bg-blue-500 border-2 border-black rounded px-2 py-1">
                          <div className="text-xs text-white font-bold">
                            {quiz.questions.length} QUESTIONS
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
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
