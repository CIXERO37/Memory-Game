import { supabase, isSupabaseConfigured } from './supabase'

export interface UserSession {
  id: string
  session_id: string
  user_type: 'host' | 'player'
  user_data: any
  room_code?: string
  device_info?: any
  created_at: string
  last_active: string
  expires_at: string
  is_active: boolean
}

export interface GameSession {
  id: string
  session_id: string
  user_type: 'host' | 'player'
  user_data: any
  room_code?: string
  device_info: any
  created_at: string
  last_active: string
  expires_at: string
  is_active: boolean
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
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        console.warn('[SupabaseSessionManager] Supabase not configured, using fallback session management')
        return sessionId || this.generateSessionId()
      }

      const finalSessionId = sessionId || this.generateSessionId()
      
      // Get device info
      const deviceInfo = this.getDeviceInfo()
      
      const sessionData = {
        session_id: finalSessionId,
        user_type: userType,
        user_data: userData,
        room_code: roomCode || null,
        device_info: deviceInfo,
        last_active: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        is_active: true
      }

      // Try to update existing session first
      const { data: existingSession } = await supabase
        .from('game_sessions')
        .select('id')
        .eq('session_id', finalSessionId)
        .eq('is_active', true)
        .single()

      if (existingSession) {
        // Update existing session
        const { error } = await supabase
          .from('game_sessions')
          .update(sessionData)
          .eq('session_id', finalSessionId)

        if (error) {
          console.error('[SupabaseSessionManager] Error updating session:', error)
          throw error
        }
      } else {
        // Create new session
        const { error } = await supabase
          .from('game_sessions')
          .insert(sessionData)

        if (error) {
          console.error('[SupabaseSessionManager] Error creating session:', error)
          throw error
        }
      }

      console.log('[SupabaseSessionManager] Session created/updated:', finalSessionId)
      return finalSessionId
    } catch (error) {
      console.error('[SupabaseSessionManager] Error in createOrUpdateSession:', error)
      throw error
    }
  }

  async getSessionData(sessionId: string): Promise<UserSession | null> {
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        console.warn('[SupabaseSessionManager] Supabase not configured, returning null')
        return null
      }

      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .single()

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
      const { error } = await supabase
        .from('game_sessions')
        .update({ is_active: false })
        .eq('session_id', sessionId)

      if (error) {
        console.error('[SupabaseSessionManager] Error deleting session:', error)
        return false
      }

      return true
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

  // Get device information
  private getDeviceInfo(): any {
    if (typeof window === 'undefined') return {}
    
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen: {
        width: screen.width,
        height: screen.height
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timestamp: new Date().toISOString()
    }
  }

  // Get session by room code and user type
  async getSessionByRoom(roomCode: string, userType: 'host' | 'player'): Promise<GameSession | null> {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('room_code', roomCode)
        .eq('user_type', userType)
        .eq('is_active', true)
        .order('last_active', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('[SupabaseSessionManager] Error getting session by room:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('[SupabaseSessionManager] Error in getSessionByRoom:', error)
      return null
    }
  }

  // Update session activity
  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('game_sessions')
        .update({ last_active: new Date().toISOString() })
        .eq('session_id', sessionId)
    } catch (error) {
      console.error('[SupabaseSessionManager] Error updating session activity:', error)
    }
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
