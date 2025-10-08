import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create client with fallback values for build time
// This prevents build errors when environment variables are not available
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
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
  difficulty: 'Easy' | 'Medium' | 'Hard'
  category?: QuizCategory // Make category optional since it's not in database
  questions: QuestionData[]
  metadata?: QuizMetadata // Make metadata optional since it's not in database
  created_at: string
  updated_at: string
}

// Quiz API functions
export const quizApi = {
  // Get all quizzes
  async getQuizzes(): Promise<Quiz[]> {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching quizzes:', error)
      throw error
    }

    return data || []
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
  async getCategories(): Promise<QuizCategory[]> {
    const quizzes = await this.getQuizzes()
    const categories = new Map<string, QuizCategory>()
    
    quizzes.forEach(quiz => {
      if (quiz.category) {
        categories.set(quiz.category.name, quiz.category)
      }
    })
    
    return Array.from(categories.values())
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

    return data || []
  },

  // Get quizzes by difficulty
  async getQuizzesByDifficulty(difficulty: 'Easy' | 'Medium' | 'Hard'): Promise<Quiz[]> {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('difficulty', difficulty)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching quizzes by difficulty:', error)
      throw error
    }

    return data || []
  },

  // Get quizzes by category (not implemented - no category field in database)
  async getQuizzesByCategory(categoryName: string): Promise<Quiz[]> {
    // Since we don't have categories in the database, return empty array
    console.warn('getQuizzesByCategory: Categories not implemented in current database structure')
    return []
  }
}