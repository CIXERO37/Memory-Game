import { useState, useEffect } from 'react'
import { quizApi, Quiz, QuizCategory } from '@/lib/supabase'

// Hook for fetching all quizzes
export function useQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      const data = await quizApi.getQuizzes()
      setQuizzes(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quizzes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuizzes()
  }, [])

  return { quizzes, loading, error, refetch: fetchQuizzes }
}

// Hook for fetching a single quiz with questions
export function useQuiz(id: string | null) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    async function fetchQuiz() {
      try {
        setLoading(true)
        const data = await quizApi.getQuizById(id!)
        setQuiz(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch quiz')
      } finally {
        setLoading(false)
      }
    }

    fetchQuiz()
  }, [id])

  return { quiz, loading, error }
}

// Hook for searching quizzes
export function useSearchQuizzes(query: string) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setQuizzes([])
      return
    }

    async function searchQuizzes() {
      try {
        setLoading(true)
        const data = await quizApi.searchQuizzes(query)
        setQuizzes(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search quizzes')
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(searchQuizzes, 300) // Debounce search
    return () => clearTimeout(timeoutId)
  }, [query])

  return { quizzes, loading, error }
}

// Hook for fetching categories
export function useCategories() {
  const [categories, setCategories] = useState<QuizCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true)
        const data = await quizApi.getCategories()
        setCategories(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return { categories, loading, error }
}

// Transform Supabase quiz data to match existing interface
export function transformQuizData(quiz: Quiz): any {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description || '',
    difficulty: quiz.difficulty,
    category: quiz.category?.name || 'General', // Provide default category if not available
    questions: quiz.questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options || [],
      correct: q.correct_answer,
      explanation: q.explanation || '',
      points: q.points || 10
    }))
  }
}

// Hook for quizzes by difficulty
export function useQuizzesByDifficulty(difficulty: 'Easy' | 'Medium' | 'Hard') {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        setLoading(true)
        const data = await quizApi.getQuizzesByDifficulty(difficulty)
        setQuizzes(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch quizzes')
      } finally {
        setLoading(false)
      }
    }

    fetchQuizzes()
  }, [difficulty])

  return { quizzes, loading, error }
}

// Hook for quizzes by category
export function useQuizzesByCategory(categoryName: string) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        setLoading(true)
        const data = await quizApi.getQuizzesByCategory(categoryName)
        setQuizzes(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch quizzes')
      } finally {
        setLoading(false)
      }
    }

    fetchQuizzes()
  }, [categoryName])

  return { quizzes, loading, error }
}
