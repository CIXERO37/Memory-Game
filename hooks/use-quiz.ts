import { useState, useEffect } from 'react'
import { quizApi, Quiz, QuizCategory } from '@/lib/supabase'
import { quizzes as localQuizzes } from '@/lib/quiz-data'

// Hook for fetching all quizzes
export function useQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      setError(null)


      const data = await quizApi.getQuizzes()


      // If no quizzes from Supabase, use local quizzes as fallback
      if (data && data.length > 0) {
        setQuizzes(data)
      } else {

        const transformedLocalQuizzes: Quiz[] = localQuizzes.map(q => ({
          id: q.id,
          title: q.title,
          description: q.description,
          category: q.category,
          questions: q.questions.map(qt => ({
            id: qt.id.toString(),
            question: qt.question,
            type: 'multiple_choice',
            options: qt.options,
            correct_answer: qt.options[qt.correct],
            explanation: qt.explanation,
            points: 10
          })),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
        setQuizzes(transformedLocalQuizzes)
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err)

      const transformedLocalQuizzes: Quiz[] = localQuizzes.map(q => ({
        id: q.id,
        title: q.title,
        description: q.description,
        category: q.category,
        questions: q.questions.map(qt => ({
          id: qt.id.toString(),
          question: qt.question,
          type: 'multiple_choice',
          options: qt.options,
          correct_answer: qt.options[qt.correct],
          explanation: qt.explanation,
          points: 10
        })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      setQuizzes(transformedLocalQuizzes)
      setError(null) // Don't show error if we have local fallback
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
  const [categories, setCategories] = useState<string[]>([])
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
export function transformQuizData(quiz: any): any {
  try {
    // Map quiz titles to appropriate categories if category is not set
    let category = quiz.category || 'General'

    if (!quiz.category) {
      const title = quiz.title?.toLowerCase() || ''
      if (title.includes('math') || title.includes('mathematics')) {
        category = 'Mathematics'
      } else if (title.includes('science') || title.includes('physics') || title.includes('nature')) {
        category = 'Science'
      } else if (title.includes('geography') || title.includes('world')) {
        category = 'Geography'
      } else if (title.includes('english') || title.includes('vocabulary') || title.includes('language')) {
        category = 'Language'
      } else if (title.includes('history') || title.includes('historical')) {
        category = 'History'
      } else if (title.includes('art') || title.includes('culture') || title.includes('music')) {
        category = 'Entertainment'
      } else if (title.includes('programming') || title.includes('technology') || title.includes('computer')) {
        category = 'Technology'
      } else if (title.includes('sport') || title.includes('fitness') || title.includes('exercise')) {
        category = 'Sports'
      } else if (title.includes('business') || title.includes('finance') || title.includes('economics')) {
        category = 'Business'
      }
    }

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description || '',
      category: category,
      questions: Array.isArray(quiz.questions) ? quiz.questions.map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options || [],
        correct: q.correct_answer,
        explanation: q.explanation || '',
        points: q.points || 10
      })) : []
    }
  } catch (error) {
    console.error('Error transforming quiz data:', error, quiz)
    return {
      id: quiz.id || 'unknown',
      title: quiz.title || 'Unknown Quiz',
      description: quiz.description || '',
      category: 'General',
      questions: []
    }
  }
}

// Hook for quizzes by category
export function useQuizzesByCategory(category: string) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        setLoading(true)
        const data = await quizApi.getQuizzesByCategory(category)
        setQuizzes(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch quizzes')
      } finally {
        setLoading(false)
      }
    }

    if (category) {
      fetchQuizzes()
    } else {
      setQuizzes([])
      setLoading(false)
    }
  }, [category])

  return { quizzes, loading, error }
}
