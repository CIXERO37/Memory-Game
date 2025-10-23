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

      // Try to update existing room session first
      if (roomCode) {
        const { data: existingRoom } = await supabase
          .from('rooms')
          .select('id')
          .eq('room_code', roomCode)
          .single()

        if (existingRoom) {
          // Update room with session data
          const { error } = await supabase
            .from('rooms')
            .update({
              session_id: finalSessionId,
              is_session_active: true,
              session_last_active: new Date().toISOString(),
              session_data: sessionData
            })
            .eq('room_code', roomCode)

          if (error) {
            console.error('[SupabaseSessionManager] Error updating room session:', error)
            throw error
          }
        }
      }
      
      // Note: Session data is now stored in rooms table
      // For non-room sessions, we store in localStorage only

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
        .from('rooms')
        .select('session_id, is_session_active, session_last_active, session_data')
        .eq('session_id', sessionId)
        .eq('is_session_active', true)
        .single()

      if (error) {
        console.error('[SupabaseSessionManager] Error getting session data:', error)
        return null
      }

      // Parse session_data if available
      if (data && data.session_data) {
        return {
          id: data.session_id,
          session_id: data.session_id,
          user_type: data.session_data.user_type,
          user_data: data.session_data.user_data,
          room_code: data.session_data.room_code,
          device_info: data.session_data.device_info,
          created_at: data.session_data.created_at || '',
          last_active: data.session_last_active,
          expires_at: data.session_data.expires_at || '',
          is_active: data.is_session_active
        }
      }

      return null
    } catch (error) {
      console.error('[SupabaseSessionManager] Error in getSessionData:', error)
      return null
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ is_session_active: false })
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
        .from('rooms')
        .select('session_id, is_session_active, session_last_active, session_data')
        .eq('room_code', roomCode)
        .eq('is_session_active', true)
        .single()

      if (error) {
        console.error('[SupabaseSessionManager] Error getting session by room:', error)
        return null
      }

      // Parse session_data and filter by user_type
      if (data && data.session_data && data.session_data.user_type === userType) {
        return {
          id: data.session_id,
          session_id: data.session_id,
          user_type: data.session_data.user_type,
          user_data: data.session_data.user_data,
          room_code: roomCode,
          device_info: data.session_data.device_info,
          created_at: data.session_data.created_at || '',
          last_active: data.session_last_active,
          expires_at: data.session_data.expires_at || '',
          is_active: data.is_session_active
        }
      }

      return null
    } catch (error) {
      console.error('[SupabaseSessionManager] Error in getSessionByRoom:', error)
      return null
    }
  }

  // Update session activity
  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('rooms')
        .update({ session_last_active: new Date().toISOString() })
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
