import { supabase } from './supabase'

export interface UserSession {
  id: string
  session_id: string
  user_type: 'host' | 'player'
  user_data: any
  room_code?: string
  created_at: string
  last_active: string
  expires_at: string
}

class SupabaseSessionManager {
  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
  }

  async createOrUpdateSession(
    sessionId: string | null,
    userType: 'host' | 'player',
    userData: any,
    roomCode?: string
  ): Promise<string> {
    try {
      const finalSessionId = sessionId || this.generateSessionId()
      
      const { data, error } = await supabase.rpc('get_or_create_session', {
        p_session_id: finalSessionId,
        p_user_type: userType,
        p_user_data: userData,
        p_room_code: roomCode || null
      })

      if (error) {
        console.error('[SupabaseSessionManager] Error creating/updating session:', error)
        throw error
      }

      console.log('[SupabaseSessionManager] Session created/updated:', data)
      return finalSessionId
    } catch (error) {
      console.error('[SupabaseSessionManager] Error in createOrUpdateSession:', error)
      throw error
    }
  }

  async getSessionData(sessionId: string): Promise<UserSession | null> {
    try {
      const { data, error } = await supabase.rpc('get_session_data', {
        p_session_id: sessionId
      })

      if (error) {
        console.error('[SupabaseSessionManager] Error getting session data:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('[SupabaseSessionManager] Error in getSessionData:', error)
      return null
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('delete_session', {
        p_session_id: sessionId
      })

      if (error) {
        console.error('[SupabaseSessionManager] Error deleting session:', error)
        return false
      }

      return data
    } catch (error) {
      console.error('[SupabaseSessionManager] Error in deleteSession:', error)
      return false
    }
  }

  // Helper method to get session ID from browser storage (fallback)
  getSessionIdFromStorage(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('sessionId')
  }

  // Helper method to set session ID in browser storage (fallback)
  setSessionIdInStorage(sessionId: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('sessionId', sessionId)
  }

  // Helper method to remove session ID from browser storage
  removeSessionIdFromStorage(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('sessionId')
  }

  // Get or create session with automatic session ID management
  async getOrCreateSession(
    userType: 'host' | 'player',
    userData: any,
    roomCode?: string
  ): Promise<{ sessionId: string; sessionData: UserSession | null }> {
    try {
      // Try to get existing session ID from storage
      let sessionId = this.getSessionIdFromStorage()
      
      // Create or update session
      sessionId = await this.createOrUpdateSession(sessionId, userType, userData, roomCode)
      
      // Store session ID in browser storage for persistence
      this.setSessionIdInStorage(sessionId)
      
      // Get the session data
      const sessionData = await this.getSessionData(sessionId)
      
      return { sessionId, sessionData }
    } catch (error) {
      console.error('[SupabaseSessionManager] Error in getOrCreateSession:', error)
      throw error
    }
  }

  // Clear session and storage
  async clearSession(): Promise<void> {
    try {
      const sessionId = this.getSessionIdFromStorage()
      if (sessionId) {
        await this.deleteSession(sessionId)
      }
      this.removeSessionIdFromStorage()
    } catch (error) {
      console.error('[SupabaseSessionManager] Error clearing session:', error)
    }
  }
}

export const sessionManager = new SupabaseSessionManager()
