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

      console.log('Supabase URL:', supabaseUrl)
      console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing')
      
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

      console.log('Raw data from Supabase (filtered to public only):', publicQuizzes)
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
  }
}