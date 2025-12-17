import { useState, useEffect, useRef } from 'react'
import { quizApi, Quiz, QuizCategory } from '@/lib/supabase'
import { quizzes as localQuizzes } from '@/lib/quiz-data'

// Cache key and duration constants
const QUIZ_CACHE_KEY = 'quizzes_cache'
const QUIZ_CACHE_TIMESTAMP_KEY = 'quizzes_cache_timestamp'
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes

// Image cache for category backgrounds
const IMAGE_CACHE_KEY = 'image_cache_preloaded'

/**
 * Preload and cache category background images
 * Call this function on app initialization for faster image loading
 */
export function preloadCategoryImages(imageUrls: string[]): void {
  if (typeof window === 'undefined') return

  // Check if already preloaded in this session
  const preloaded = sessionStorage.getItem(IMAGE_CACHE_KEY)
  if (preloaded === 'true') return

  // Preload images in parallel
  const preloadPromises = imageUrls.map(url => {
    return new Promise<void>((resolve) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => resolve() // Resolve even on error to not block
      img.src = url
    })
  })

  Promise.all(preloadPromises).then(() => {
    sessionStorage.setItem(IMAGE_CACHE_KEY, 'true')
  })
}

/**
 * Get cached quizzes from sessionStorage
 */
function getCachedQuizzes(): Quiz[] | null {
  if (typeof window === 'undefined') return null

  try {
    const cached = sessionStorage.getItem(QUIZ_CACHE_KEY)
    const timestamp = sessionStorage.getItem(QUIZ_CACHE_TIMESTAMP_KEY)

    if (!cached || !timestamp) return null

    const cacheAge = Date.now() - parseInt(timestamp, 10)

    // Return cached data if still fresh (within cache duration)
    // For stale-while-revalidate, we return stale data too
    if (cached) {
      return JSON.parse(cached) as Quiz[]
    }

    return null
  } catch (error) {
    console.warn('[useQuizzes] Cache read error:', error)
    return null
  }
}

/**
 * Check if cache is stale (needs revalidation)
 */
function isCacheStale(): boolean {
  if (typeof window === 'undefined') return true

  try {
    const timestamp = sessionStorage.getItem(QUIZ_CACHE_TIMESTAMP_KEY)
    if (!timestamp) return true

    const cacheAge = Date.now() - parseInt(timestamp, 10)
    return cacheAge > CACHE_DURATION_MS
  } catch {
    return true
  }
}

/**
 * Save quizzes to cache
 */
function setCachedQuizzes(quizzes: Quiz[]): void {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.setItem(QUIZ_CACHE_KEY, JSON.stringify(quizzes))
    sessionStorage.setItem(QUIZ_CACHE_TIMESTAMP_KEY, Date.now().toString())
  } catch (error) {
    console.warn('[useQuizzes] Cache write error:', error)
  }
}

// Hook for fetching all quizzes with caching (stale-while-revalidate)
export function useQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isFetchingRef = useRef(false)

  const fetchQuizzes = async (isBackgroundRefresh = false) => {
    // Prevent duplicate fetches
    if (isFetchingRef.current && !isBackgroundRefresh) return
    isFetchingRef.current = true

    try {
      // Only show loading if not a background refresh and no cached data
      if (!isBackgroundRefresh) {
        setLoading(true)
      }
      setError(null)

      const data = await quizApi.getQuizzes()

      // If no quizzes from Supabase, use local quizzes as fallback
      if (data && data.length > 0) {
        setQuizzes(data)
        // Cache the fresh data
        setCachedQuizzes(data)
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
        setCachedQuizzes(transformedLocalQuizzes)
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err)

      // Only use local fallback if no cached data
      if (quizzes.length === 0) {
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
      setError(null) // Don't show error if we have cached/local fallback
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }

  useEffect(() => {
    // 🚀 INSTANT: Try to load from cache first (stale-while-revalidate)
    const cachedQuizzes = getCachedQuizzes()

    if (cachedQuizzes && cachedQuizzes.length > 0) {
      // Show cached data immediately
      setQuizzes(cachedQuizzes)
      setLoading(false)

      // If cache is stale, refresh in background
      if (isCacheStale()) {
        fetchQuizzes(true) // Background refresh
      }
    } else {
      // No cache, fetch normally
      fetchQuizzes()
    }
  }, [])

  return { quizzes, loading, error, refetch: fetchQuizzes }
}

// Paginated cache keys
const PAGINATED_QUIZ_CACHE_KEY = 'quizzes_paginated_cache'
const PAGINATED_QUIZ_CACHE_TIMESTAMP_KEY = 'quizzes_paginated_cache_timestamp'

/**
 * Get cached paginated quizzes from sessionStorage
 */
function getCachedPaginatedQuizzes(cacheKey: string): { quizzes: any[]; totalCount: number; totalPages: number } | null {
  if (typeof window === 'undefined') return null

  try {
    const cached = sessionStorage.getItem(`${PAGINATED_QUIZ_CACHE_KEY}_${cacheKey}`)
    const timestamp = sessionStorage.getItem(`${PAGINATED_QUIZ_CACHE_TIMESTAMP_KEY}_${cacheKey}`)

    if (!cached || !timestamp) return null

    const cacheAge = Date.now() - parseInt(timestamp, 10)

    // Return cached data if still fresh (within cache duration)
    if (cacheAge < CACHE_DURATION_MS) {
      return JSON.parse(cached)
    }

    return null
  } catch (error) {
    console.warn('[useQuizzesPaginated] Cache read error:', error)
    return null
  }
}

/**
 * Save paginated quizzes to cache
 */
function setCachedPaginatedQuizzes(cacheKey: string, data: { quizzes: any[]; totalCount: number; totalPages: number }): void {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.setItem(`${PAGINATED_QUIZ_CACHE_KEY}_${cacheKey}`, JSON.stringify(data))
    sessionStorage.setItem(`${PAGINATED_QUIZ_CACHE_TIMESTAMP_KEY}_${cacheKey}`, Date.now().toString())
  } catch (error) {
    console.warn('[useQuizzesPaginated] Cache write error:', error)
  }
}

// Hook for fetching paginated quizzes with server-side offset pagination
export function useQuizzesPaginated(options: {
  page: number
  limit: number
  category?: string
  searchQuery?: string
  enabled?: boolean // Optional flag to prevent fetching (useful for tabs)
}) {
  const { page, limit, category, searchQuery, enabled = true } = options
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isFetchingRef = useRef(false)

  // Create cache key based on parameters
  const cacheKey = `${page}_${limit}_${category || 'all'}_${searchQuery || ''}`

  const fetchQuizzes = async (isBackgroundRefresh = false) => {
    // Prevent duplicate fetches
    if (isFetchingRef.current && !isBackgroundRefresh) return
    isFetchingRef.current = true

    try {
      // Only show loading if not a background refresh
      if (!isBackgroundRefresh) {
        setLoading(true)
      }
      setError(null)

      const result = await quizApi.getQuizzesPaginated({
        page,
        limit,
        category: category || undefined,
        searchQuery: searchQuery || undefined
      })

      setQuizzes(result.quizzes)
      setTotalCount(result.totalCount)
      setTotalPages(result.totalPages)

      // Cache the fresh data
      setCachedPaginatedQuizzes(cacheKey, result)
    } catch (err) {
      console.error('Error fetching paginated quizzes:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch quizzes')
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }

  useEffect(() => {
    // Skip fetching if not enabled
    if (!enabled) {
      setLoading(false)
      return
    }

    // Try to load from cache first
    const cached = getCachedPaginatedQuizzes(cacheKey)

    if (cached) {
      // Show cached data immediately
      setQuizzes(cached.quizzes)
      setTotalCount(cached.totalCount)
      setTotalPages(cached.totalPages)
      setLoading(false)
    }

    // Always fetch fresh data (background or foreground)
    fetchQuizzes(!cached)
  }, [page, limit, category, searchQuery, enabled, cacheKey])

  return {
    quizzes,
    totalCount,
    totalPages,
    loading,
    error,
    refetch: fetchQuizzes
  }
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
