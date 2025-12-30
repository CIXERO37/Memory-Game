import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase Players Client - Dedicated database for game participants
 * 
 * This separate Supabase instance handles all player-related data:
 * - game_participants table with individual rows per player
 * - Enables parallel updates (no JSONB bottleneck)
 * - Structure matches the participants JSONB format
 */

// Use placeholder values to prevent build errors - actual values from env
const supabasePlayersUrl = process.env.NEXT_PUBLIC_SUPABASE_PLAYERS_URL || 'https://placeholder.supabase.co'
const supabasePlayersAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PLAYERS_ANON_KEY || 'placeholder-key'

// Create client for Players database (will only be used if properly configured)
export const supabasePlayers: SupabaseClient = createClient(supabasePlayersUrl, supabasePlayersAnonKey)

// Helper function to check if Players Supabase is properly configured
export const isPlayersSupabaseConfigured = () => {
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_PLAYERS_URL
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_PLAYERS_ANON_KEY
    const isValidUrl = hasUrl && !process.env.NEXT_PUBLIC_SUPABASE_PLAYERS_URL?.includes('placeholder')
    const isValidKey = hasKey && !process.env.NEXT_PUBLIC_SUPABASE_PLAYERS_ANON_KEY?.includes('placeholder')
    const result = isValidUrl && isValidKey

    // 🔍 DEBUG: Log configuration status
    console.log('[PlayersDB Config]', {
        hasUrl,
        hasKey,
        isValidUrl,
        isValidKey,
        configured: result,
        urlPreview: process.env.NEXT_PUBLIC_SUPABASE_PLAYERS_URL?.substring(0, 30) + '...'
    })

    return result
}

/**
 * Generate XID - similar format to the one in JSONB
 * Example: d3fmdnp53dtg000j5r30
 */
function generateXID(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 20; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

// Type definitions for answer
export interface QuizAnswer {
    id: string              // XID format
    question_id: string
    answer_id: string
    is_correct: boolean
    points_earned: number
    created_at: string
}

// Type definitions for game_participants table
// Matches the JSONB structure exactly
export interface GameParticipant {
    id: string              // XID format (e.g., "d3fmdnp53dtg000j5r30")
    session_id: string      // session id from sessions table
    game_pin: string        // game pin for easy lookup
    nickname: string
    avatar: string | null
    score: number           // quiz score
    started: string | null  // when player started quiz
    ended: string | null    // when player finished quiz
    questions_answered: number
    is_host: boolean
    joined_at: string
    answers: QuizAnswer[]   // NEW: array of answers
}

// Participants API functions
export const participantsApi = {
    /**
     * Generate XID for new player
     */
    generatePlayerId(): string {
        return generateXID()
    },

    /**
     * Add a player to a game session
     * @param gamePin - The game PIN (room code)
     * @param playerId - XID for the player
     * @param nickname - Player's display name
     * @param avatar - Player's avatar URL
     * @param isHost - Whether this is the host
     */
    async addParticipant(
        gamePin: string,
        playerId: string,
        nickname: string,
        avatar: string,
        isHost: boolean = false
    ): Promise<GameParticipant | null> {
        try {
            // First, get the session_id from sessions table
            const session = await sessionsApi.getSession(gamePin)
            const sessionId = session?.id || gamePin // Fallback to gamePin if session not found

            // 🔧 FIX: Remove any existing participant with the same nickname to prevent duplicates
            // This handles the case when a player leaves and rejoins with the same nickname
            try {
                const { error: deleteError } = await supabasePlayers
                    .from('game_participants')
                    .delete()
                    .eq('game_pin', gamePin)
                    .eq('nickname', nickname)

                if (deleteError) {
                    console.warn('[PlayersDB] Error removing existing participant by nickname (non-critical):', deleteError)
                } else {
                    console.log(`[PlayersDB] Cleaned up any existing participant with nickname: ${nickname}`)
                }
            } catch (cleanupError) {
                console.warn('[PlayersDB] Exception during nickname cleanup (non-critical):', cleanupError)
            }

            const { data, error } = await supabasePlayers
                .from('game_participants')
                .upsert({
                    id: playerId,
                    session_id: sessionId,
                    game_pin: gamePin,
                    nickname,
                    avatar,
                    is_host: isHost,
                    score: 0,
                    questions_answered: 0,
                    started: null,
                    ended: null
                }, {
                    onConflict: 'id'
                })
                .select()
                .single()

            if (error) {
                console.error('[PlayersDB] Error adding participant:', error)
                return null
            }

            return data
        } catch (error) {
            console.error('[PlayersDB] Exception adding participant:', error)
            return null
        }
    },

    /**
     * Get all participants for a game by game_pin
     */
    async getParticipants(gamePin: string): Promise<GameParticipant[]> {
        try {
            const { data, error } = await supabasePlayers
                .from('game_participants')
                .select('*')
                .eq('game_pin', gamePin)
                .order('joined_at', { ascending: true })

            if (error) {
                console.error('[PlayersDB] Error getting participants:', error)
                return []
            }

            return data || []
        } catch (error) {
            console.error('[PlayersDB] Exception getting participants:', error)
            return []
        }
    },

    /**
     * Get a single participant by game_pin and player_id
     */
    async getParticipant(gamePin: string, playerId: string): Promise<GameParticipant | null> {
        try {
            const { data, error } = await supabasePlayers
                .from('game_participants')
                .select('*')
                .eq('game_pin', gamePin)
                .eq('id', playerId)
                .single()

            if (error) {
                console.error('[PlayersDB] Error getting participant:', error)
                return null
            }

            return data
        } catch (error) {
            console.error('[PlayersDB] Exception getting participant:', error)
            return null
        }
    },

    /**
     * Mark player as started (began the quiz)
     */
    async markStarted(gamePin: string, playerId: string): Promise<boolean> {
        try {
            const { error } = await supabasePlayers
                .from('game_participants')
                .update({
                    started: new Date().toISOString()
                })
                .eq('game_pin', gamePin)
                .eq('id', playerId)

            if (error) {
                console.error('[PlayersDB] Error marking started:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('[PlayersDB] Exception marking started:', error)
            return false
        }
    },

    /**
     * Update player score - PARALLEL UPDATES (no JSONB bottleneck!)
     */
    async updateScore(
        gamePin: string,
        playerId: string,
        score: number,
        questionsAnswered: number
    ): Promise<boolean> {
        try {
            // Get current values first for monotonic update
            const current = await this.getParticipant(gamePin, playerId)

            const finalScore = current ? Math.max(current.score, score) : score
            const finalAnswered = current ? Math.max(current.questions_answered, questionsAnswered) : questionsAnswered

            const { error } = await supabasePlayers
                .from('game_participants')
                .update({
                    score: finalScore,
                    questions_answered: finalAnswered
                })
                .eq('game_pin', gamePin)
                .eq('id', playerId)

            if (error) {
                console.error('[PlayersDB] Error updating score:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('[PlayersDB] Exception updating score:', error)
            return false
        }
    },

    /**
     * Mark player as finished (completed the quiz)
     */
    async markFinished(gamePin: string, playerId: string, finalScore: number): Promise<boolean> {
        try {
            const { error } = await supabasePlayers
                .from('game_participants')
                .update({
                    score: finalScore,
                    ended: new Date().toISOString()
                })
                .eq('game_pin', gamePin)
                .eq('id', playerId)

            if (error) {
                console.error('[PlayersDB] Error marking finished:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('[PlayersDB] Exception marking finished:', error)
            return false
        }
    },

    /**
     * Add an answer to participant's answers array
     */
    async addAnswer(
        gamePin: string,
        playerId: string,
        answer: {
            question_id: string
            answer_id: string
            is_correct: boolean
            points_earned: number
        }
    ): Promise<boolean> {
        try {
            // First get current answers
            const { data: participant, error: fetchError } = await supabasePlayers
                .from('game_participants')
                .select('answers')
                .eq('game_pin', gamePin)
                .eq('id', playerId)
                .single()

            if (fetchError) {
                console.error('[PlayersDB] Error fetching participant for answer:', fetchError)
                return false
            }

            const currentAnswers = participant?.answers || []
            const newAnswer: QuizAnswer = {
                id: generateXID(),
                question_id: answer.question_id,
                answer_id: answer.answer_id,
                is_correct: answer.is_correct,
                points_earned: answer.points_earned,
                created_at: new Date().toISOString()
            }

            // Append new answer
            const { error } = await supabasePlayers
                .from('game_participants')
                .update({
                    answers: [...currentAnswers, newAnswer]
                })
                .eq('game_pin', gamePin)
                .eq('id', playerId)

            if (error) {
                console.error('[PlayersDB] Error adding answer:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('[PlayersDB] Exception adding answer:', error)
            return false
        }
    },

    /**
     * Remove a participant (kick or leave)
     */
    async removeParticipant(gamePin: string, playerId: string): Promise<boolean> {
        try {
            const { error } = await supabasePlayers
                .from('game_participants')
                .delete()
                .eq('game_pin', gamePin)
                .eq('id', playerId)

            if (error) {
                console.error('[PlayersDB] Error removing participant:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('[PlayersDB] Exception removing participant:', error)
            return false
        }
    },

    /**
     * Remove all participants for a game (cleanup)
     */
    async clearSession(gamePin: string): Promise<boolean> {
        try {
            const { error } = await supabasePlayers
                .from('game_participants')
                .delete()
                .eq('game_pin', gamePin)

            if (error) {
                console.error('[PlayersDB] Error clearing session:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('[PlayersDB] Exception clearing session:', error)
            return false
        }
    },

    /**
     * Subscribe to participant changes for a game - INSTANT with cache
     */
    subscribeToParticipants(
        gamePin: string,
        callback: (participants: GameParticipant[]) => void
    ): () => void {
        // Cache participants locally for instant updates
        let cachedParticipants: GameParticipant[] = []
        // Flag to track if initial fetch has completed
        let initialFetchComplete = false

        // Initial fetch - call callback once complete to sync state
        this.getParticipants(gamePin).then(participants => {
            cachedParticipants = participants
            initialFetchComplete = true
            // Trigger callback with initial data to ensure UI is in sync
            callback(cachedParticipants)
        })

        const channel = supabasePlayers
            .channel(`participants-${gamePin}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'game_participants',
                    filter: `game_pin=eq.${gamePin}`
                },
                (payload) => {
                    // 🚀 INSTANT: Update cache incrementally from payload
                    if (payload.eventType === 'INSERT' && payload.new) {
                        const newParticipant = payload.new as GameParticipant
                        // 🔧 FIX: Remove any existing participant with the same ID OR same nickname
                        // This prevents brief duplicate cards when INSERT event arrives before DELETE
                        // (e.g., when a player rejoins with a new ID but same nickname)
                        cachedParticipants = cachedParticipants.filter(p =>
                            p.id !== newParticipant.id && p.nickname !== newParticipant.nickname
                        )
                        // Add the new participant
                        cachedParticipants = [...cachedParticipants, newParticipant]
                        callback(cachedParticipants)
                    } else if (payload.eventType === 'UPDATE' && payload.new) {
                        const updatedParticipant = payload.new as GameParticipant
                        cachedParticipants = cachedParticipants.map(p =>
                            p.id === updatedParticipant.id ? updatedParticipant : p
                        )
                        callback(cachedParticipants)
                    } else if (payload.eventType === 'DELETE' && payload.old) {
                        const deletedId = (payload.old as any).id
                        cachedParticipants = cachedParticipants.filter(p => p.id !== deletedId)
                        callback(cachedParticipants)
                    }
                }
            )
            .subscribe()

        // Return unsubscribe function
        return () => {
            supabasePlayers.removeChannel(channel)
        }
    }
}

// =====================================================
// Sessions API - game_sessions in Supabase B
// =====================================================

// Type for game_sessions in Supabase B
export interface GameSessionB {
    id: string
    game_pin: string
    host_id: string
    quiz_id: string | null
    quiz_title: string | null
    status: 'waiting' | 'active' | 'finished'
    time_limit_minutes: number
    settings: {
        questionCount: number
        totalTimeLimit: number
    }
    questions: any[]
    created_at: string
    started_at: string | null
    countdown_started_at: string | null
    countdown_duration_seconds: number
}

export const sessionsApi = {
    /**
     * Create a new game session in Supabase B
     */
    async createSession(sessionData: {
        game_pin: string
        host_id: string
        quiz_id?: string
        quiz_title?: string
        settings?: { questionCount: number; totalTimeLimit: number }
        questions?: any[]
    }): Promise<GameSessionB | null> {
        try {
            const { data, error } = await supabasePlayers
                .from('sessions')
                .insert({
                    game_pin: sessionData.game_pin,
                    host_id: sessionData.host_id,
                    quiz_id: sessionData.quiz_id || null,
                    quiz_title: sessionData.quiz_title || null,
                    status: 'waiting',
                    settings: sessionData.settings || { questionCount: 10, totalTimeLimit: 300 },
                    questions: sessionData.questions || [],
                    time_limit_minutes: Math.ceil((sessionData.settings?.totalTimeLimit || 300) / 60),
                    countdown_duration_seconds: 10
                })
                .select()
                .single()

            if (error) {
                console.error('[SessionsDB] Error creating session:', error)
                return null
            }

            return data
        } catch (error) {
            console.error('[SessionsDB] Exception creating session:', error)
            return null
        }
    },

    /**
     * Get session by game_pin
     */
    async getSession(gamePin: string): Promise<GameSessionB | null> {
        try {
            const { data, error } = await supabasePlayers
                .from('sessions')
                .select('*')
                .eq('game_pin', gamePin)
                .single()

            if (error) {
                if (error.code !== 'PGRST116') { // Ignore "no rows" error
                    console.error('[SessionsDB] Error getting session:', error)
                }
                return null
            }

            return data
        } catch (error) {
            console.error('[SessionsDB] Exception getting session:', error)
            return null
        }
    },

    /**
     * Update session data
     */
    async updateSession(gamePin: string, updates: Partial<GameSessionB>): Promise<boolean> {
        try {
            const { error } = await supabasePlayers
                .from('sessions')
                .update(updates)
                .eq('game_pin', gamePin)

            if (error) {
                console.error('[SessionsDB] Error updating session:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('[SessionsDB] Exception updating session:', error)
            return false
        }
    },

    /**
     * Update session status
     */
    async updateStatus(gamePin: string, status: GameSessionB['status']): Promise<boolean> {
        try {
            const updates: any = { status }

            if (status === 'active') {
                updates.started_at = new Date().toISOString()
            }

            const { error } = await supabasePlayers
                .from('sessions')
                .update(updates)
                .eq('game_pin', gamePin)

            if (error) {
                console.error('[SessionsDB] Error updating status:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('[SessionsDB] Exception updating status:', error)
            return false
        }
    },

    /**
     * Start countdown
     */
    async startCountdown(gamePin: string, duration: number = 10): Promise<boolean> {
        try {
            const { error } = await supabasePlayers
                .from('sessions')
                .update({
                    // Status tetap 'waiting', countdown dideteksi via countdown_started_at
                    countdown_started_at: new Date().toISOString(),
                    countdown_duration_seconds: duration
                })
                .eq('game_pin', gamePin)

            if (error) {
                console.error('[SessionsDB] Error starting countdown:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('[SessionsDB] Exception starting countdown:', error)
            return false
        }
    },

    /**
     * Delete session
     */
    async deleteSession(gamePin: string): Promise<boolean> {
        try {
            const { error } = await supabasePlayers
                .from('sessions')
                .delete()
                .eq('game_pin', gamePin)

            if (error) {
                console.error('[SessionsDB] Error deleting session:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('[SessionsDB] Exception deleting session:', error)
            return false
        }
    },

    /**
     * Subscribe to session changes for realtime updates - INSTANT
     */
    subscribeToSession(
        gamePin: string,
        callback: (session: GameSessionB | null) => void
    ): () => void {
        const channel = supabasePlayers
            .channel(`session-${gamePin}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'sessions',
                    filter: `game_pin=eq.${gamePin}`
                },
                async (payload) => {
                    if (payload.eventType === 'DELETE') {
                        callback(null)
                    } else if (payload.new) {
                        // 🚀 INSTANT: Use payload.new directly - NO FETCH!
                        callback(payload.new as GameSessionB)
                    }
                }
            )
            .subscribe()

        // Return unsubscribe function
        return () => {
            supabasePlayers.removeChannel(channel)
        }
    }
}
