import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Create client with fallback values for build time
// This prevents build errors when environment variables are not available
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isValidUrl = hasUrl && !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
  const isValidKey = hasKey && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('placeholder')

  return isValidUrl && isValidKey
}

// Helper function to get configuration status for debugging
export const getSupabaseConfigStatus = () => {
  return {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET',
    keyValue: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET',
    isConfigured: isSupabaseConfigured(),
    isUsingPlaceholder: supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')
  }
}

// Database types for TypeScript - Consolidated JSON structure
export interface QuizCategory {
  name: string
  description: string
  icon: string
  color: string
}

export interface QuestionData {
  id: string
  question: string
  type: 'multiple_choice' | 'true_false' | 'text'
  options?: string[]
  correct_answer: string
  explanation?: string
  points: number
}

export interface QuizMetadata {
  total_points: number
  estimated_time?: string // Make optional
  tags?: string[] // Make optional
  [key: string]: any // Allow additional metadata
}

export interface Quiz {
  id: string
  title: string
  description?: string
  category: 'General' | 'Science' | 'Mathematics' | 'History' | 'Geography' | 'Language' | 'Technology' | 'Sports' | 'Entertainment' | 'Business'
  questions: QuestionData[]
  metadata?: QuizMetadata
  created_at: string
  updated_at: string
}

// Helper function to check if quiz is public
// Support berbagai format: is_public sebagai kolom atau di metadata
function isQuizPublic(quiz: any): boolean {
  // Cek is_public sebagai kolom langsung
  if (quiz.is_public === false || quiz.is_public === 'false') return false
  if (quiz.is_public === true || quiz.is_public === 'true') return true

  // Cek di metadata (JSONB)
  if (quiz.metadata) {
    // Cek metadata.is_public
    if (quiz.metadata.is_public === false || quiz.metadata.is_public === 'false') return false
    if (quiz.metadata.is_public === true || quiz.metadata.is_public === 'true') return true

    // Cek metadata.public
    if (quiz.metadata.public === false || quiz.metadata.public === 'false') return false
    if (quiz.metadata.public === true || quiz.metadata.public === 'true') return true
  }

  // Default: jika tidak ada field is_public, anggap public (backward compatibility)
  return true
}

// Quiz API functions
export const quizApi = {
  // Get all quizzes
  async getQuizzes(): Promise<Quiz[]> {
    try {
      // Check if Supabase is properly configured
      if (!isSupabaseConfigured()) {
        const configStatus = getSupabaseConfigStatus()
        console.error('Supabase configuration error:', configStatus)

        if (configStatus.isUsingPlaceholder) {
          throw new Error('Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file. See env.example.txt for instructions.')
        } else {
          throw new Error('Supabase configuration incomplete. Missing required environment variables.')
        }
      }




      // Fetch semua quiz, kemudian filter di client side untuk quiz public
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error fetching quizzes:', error)
        throw new Error(`Database error: ${error.message}. Please check your Supabase project settings and database permissions.`)
      }

      // Filter hanya quiz yang public
      const publicQuizzes = (data || []).filter(isQuizPublic)


      return publicQuizzes
    } catch (err) {
      console.error('Error in getQuizzes:', err)
      throw err
    }
  },

  // Get quiz by ID
  async getQuizById(id: string): Promise<Quiz | null> {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching quiz:', error)
      throw error
    }

    return data
  },

  // Create a new quiz
  async createQuiz(quiz: Omit<Quiz, 'id' | 'created_at' | 'updated_at'>): Promise<Quiz> {
    const { data, error } = await supabase
      .from('quizzes')
      .insert(quiz)
      .select()
      .single()

    if (error) {
      console.error('Error creating quiz:', error)
      throw error
    }

    return data
  },

  // Update quiz
  async updateQuiz(id: string, updates: Partial<Omit<Quiz, 'id' | 'created_at' | 'updated_at'>>): Promise<Quiz> {
    const { data, error } = await supabase
      .from('quizzes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating quiz:', error)
      throw error
    }

    return data
  },

  // Delete quiz
  async deleteQuiz(id: string): Promise<void> {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting quiz:', error)
      throw error
    }
  },

  // Add question to quiz
  async addQuestion(quizId: string, question: QuestionData): Promise<Quiz> {
    // First get the current quiz
    const quiz = await this.getQuizById(quizId)
    if (!quiz) throw new Error('Quiz not found')

    // Add the new question to the questions array
    const updatedQuestions = [...quiz.questions, question]

    // Update metadata
    const updatedMetadata = {
      ...quiz.metadata,
      total_points: updatedQuestions.reduce((sum, q) => sum + q.points, 0)
    }

    // Update the quiz
    return this.updateQuiz(quizId, {
      questions: updatedQuestions,
      metadata: updatedMetadata
    })
  },

  // Remove question from quiz
  async removeQuestion(quizId: string, questionId: string): Promise<Quiz> {
    const quiz = await this.getQuizById(quizId)
    if (!quiz) throw new Error('Quiz not found')

    // Remove the question
    const updatedQuestions = quiz.questions.filter(q => q.id !== questionId)

    // Update metadata
    const updatedMetadata = {
      ...quiz.metadata,
      total_points: updatedQuestions.reduce((sum, q) => sum + q.points, 0)
    }

    return this.updateQuiz(quizId, {
      questions: updatedQuestions,
      metadata: updatedMetadata
    })
  },

  // Get unique categories from all quizzes
  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('quizzes')
      .select('category')
      .not('category', 'is', null)

    if (error) {
      console.error('Error fetching categories:', error)
      throw error
    }

    // Get unique categories
    const uniqueCategories = [...new Set(data?.map(q => q.category) || [])]
    return uniqueCategories
  },

  // Search quizzes
  async searchQuizzes(query: string): Promise<Quiz[]> {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching quizzes:', error)
      throw error
    }

    // Filter hanya quiz yang public
    const publicQuizzes = (data || []).filter(isQuizPublic)

    return publicQuizzes
  },

  // Get quizzes by category
  async getQuizzesByCategory(category: string): Promise<Quiz[]> {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching quizzes by category:', error)
      throw error
    }

    // Filter hanya quiz yang public
    const publicQuizzes = (data || []).filter(isQuizPublic)

    return publicQuizzes
  },

  // Get quizzes created by a specific user (including private ones)
  async getQuizzesByCreator(creatorId: string): Promise<Quiz[]> {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching quizzes by creator:', error)
      throw error
    }

    return data || []
  },

  // Get quizzes with server-side offset-based pagination
  async getQuizzesPaginated(options: {
    page: number
    limit: number
    category?: string
    searchQuery?: string
  }): Promise<{ quizzes: Quiz[]; totalCount: number; totalPages: number }> {
    try {
      // Check if Supabase is properly configured
      if (!isSupabaseConfigured()) {
        const configStatus = getSupabaseConfigStatus()
        console.error('Supabase configuration error:', configStatus)
        throw new Error('Supabase not configured.')
      }

      const { page, limit, category, searchQuery } = options
      const offset = (page - 1) * limit

      // Build query for count (total items matching filters)
      let countQuery = supabase
        .from('quizzes')
        .select('id', { count: 'exact', head: true })

      // Build query for data
      let dataQuery = supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply category filter (server-side)
      if (category && category !== 'all') {
        countQuery = countQuery.ilike('category', category)
        dataQuery = dataQuery.ilike('category', category)
      }

      // Apply search filter (server-side)
      if (searchQuery && searchQuery.trim() !== '') {
        const searchTerm = `%${searchQuery.trim()}%`
        countQuery = countQuery.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        dataQuery = dataQuery.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      }

      // Apply pagination with range (offset-based)
      dataQuery = dataQuery.range(offset, offset + limit - 1)

      // Execute both queries in parallel
      const [countResult, dataResult] = await Promise.all([
        countQuery,
        dataQuery
      ])

      if (countResult.error) {
        console.error('Error counting quizzes:', countResult.error)
        throw countResult.error
      }

      if (dataResult.error) {
        console.error('Error fetching paginated quizzes:', dataResult.error)
        throw dataResult.error
      }

      // Filter public quizzes on client side (since is_public might be in metadata)
      const publicQuizzes = (dataResult.data || []).filter(isQuizPublic)

      // Note: total count might include non-public quizzes, but this is acceptable
      // for pagination purposes. For exact count, a server-side function would be needed.
      const totalCount = countResult.count || 0
      const totalPages = Math.ceil(totalCount / limit)

      return {
        quizzes: publicQuizzes,
        totalCount,
        totalPages
      }
    } catch (err) {
      console.error('Error in getQuizzesPaginated:', err)
      throw err
    }
  }
}