import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Database types
export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          room_code: string
          host_name: string
          quiz_id: string
          quiz_title: string
          time_limit: number
          question_count: number
          status: 'waiting' | 'countdown' | 'memory_challenge' | 'quiz' | 'finished'
          current_question: number
          created_at: string
          started_at: string | null
          finished_at: string | null
        }
        Insert: {
          id?: string
          room_code: string
          host_name: string
          quiz_id: string
          quiz_title: string
          time_limit?: number
          question_count?: number
          status?: 'waiting' | 'countdown' | 'memory_challenge' | 'quiz' | 'finished'
          current_question?: number
          created_at?: string
          started_at?: string | null
          finished_at?: string | null
        }
        Update: {
          id?: string
          room_code?: string
          host_name?: string
          quiz_id?: string
          quiz_title?: string
          time_limit?: number
          question_count?: number
          status?: 'waiting' | 'countdown' | 'memory_challenge' | 'quiz' | 'finished'
          current_question?: number
          created_at?: string
          started_at?: string | null
          finished_at?: string | null
        }
      }
      players: {
        Row: {
          id: string
          room_id: string
          username: string
          avatar: string
          is_host: boolean
          memory_game_completed: boolean
          memory_game_score: number
          quiz_score: number
          current_answer: string | null
          joined_at: string
          last_active: string
        }
        Insert: {
          id?: string
          room_id: string
          username: string
          avatar: string
          is_host?: boolean
          memory_game_completed?: boolean
          memory_game_score?: number
          quiz_score?: number
          current_answer?: string | null
          joined_at?: string
          last_active?: string
        }
        Update: {
          id?: string
          room_id?: string
          username?: string
          avatar?: string
          is_host?: boolean
          memory_game_completed?: boolean
          memory_game_score?: number
          quiz_score?: number
          current_answer?: string | null
          joined_at?: string
          last_active?: string
        }
      }
      game_states: {
        Row: {
          id: string
          room_id: string
          state_type: string
          state_data: any
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          state_type: string
          state_data: any
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          state_type?: string
          state_data?: any
          created_at?: string
        }
      }
      player_answers: {
        Row: {
          id: string
          room_id: string
          player_id: string
          question_number: number
          selected_answer: string
          is_correct: boolean
          answered_at: string
        }
        Insert: {
          id?: string
          room_id: string
          player_id: string
          question_number: number
          selected_answer: string
          is_correct: boolean
          answered_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          player_id?: string
          question_number?: number
          selected_answer?: string
          is_correct?: boolean
          answered_at?: string
        }
      }
      memory_game_results: {
        Row: {
          id: string
          room_id: string
          player_id: string
          matches_found: number
          time_taken: number
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          player_id: string
          matches_found: number
          time_taken: number
          completed: boolean
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          player_id?: string
          matches_found?: number
          time_taken?: number
          completed?: boolean
          created_at?: string
        }
      }
    }
  }
}
