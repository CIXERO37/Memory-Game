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
  private sessionColumnsExist: boolean | null = null // Cache untuk check apakah kolom session ada
  private sessionColumnsCheckPromise: Promise<boolean> | null = null // Promise untuk prevent multiple checks

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
  }

  // Check if session columns exist in rooms table (with caching)
  // Returns false immediately if we know columns don't exist, to avoid 406 errors
  private async checkSessionColumnsExist(): Promise<boolean> {
    // Return cached result if available
    if (this.sessionColumnsExist === false) {
      // If we know columns don't exist, return false immediately to skip queries
      return false
    }
    
    if (this.sessionColumnsExist === true) {
      return true
    }

    // If check is already in progress, wait for it
    if (this.sessionColumnsCheckPromise) {
      return this.sessionColumnsCheckPromise
    }

    // Don't perform initial check - let the first actual query determine if columns exist
    // This way we avoid an extra 406 request just for checking
    // Instead, we'll detect it from the first real query and cache the result
    return true // Assume columns exist initially, will be corrected on first error
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
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        is_active: true
      }

      console.log('[SupabaseSessionManager] Creating/updating session:', {
        sessionId: finalSessionId,
        userType,
        userData,
        roomCode,
        sessionData
      })

      // Try to update existing room session first
      if (roomCode) {
        const { data: existingRoom, error: roomError } = await supabase
          .from('rooms')
          .select('id')
          .eq('room_code', roomCode)
          .single()

        if (roomError) {
          console.error('[SupabaseSessionManager] Error finding room:', roomError)
          throw roomError
        }

        if (existingRoom) {
          console.log('[SupabaseSessionManager] Room found, updating with session data')
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
          
          console.log('[SupabaseSessionManager] Room session updated successfully')
        } else {
          console.error('[SupabaseSessionManager] Room not found for code:', roomCode)
          throw new Error(`Room not found for code: ${roomCode}`)
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
        return null
      }

      // Check if session columns exist - if not, skip query entirely to avoid 406 errors
      const columnsExist = await this.checkSessionColumnsExist()
      if (!columnsExist) {
        // Columns don't exist, return null without making request
        return null
      }

      console.log('[SupabaseSessionManager] Getting session data for ID:', sessionId)

      const { data, error } = await supabase
        .from('rooms')
        .select('session_id, is_session_active, session_last_active, session_data')
        .eq('session_id', sessionId)
        .eq('is_session_active', true)
        .maybeSingle() // Use maybeSingle instead of single to avoid errors when no rows found

      // Handle errors
      if (error) {
        // If we get 406 error even after check, mark columns as not existing
        if (error.code === 'PGRST116' || error.message?.includes('406') || error.message?.includes('column') || error.message?.includes('does not exist')) {
          this.sessionColumnsExist = false // Update cache
          return null
        }
        console.warn('[SupabaseSessionManager] Error getting session data (non-critical):', error.message)
        return null
      }

      // If no data found, return null (not an error)
      if (!data) {
        return null
      }

      // Parse session_data if available
      if (data && data.session_data) {
        const sessionData = {
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
        
        return sessionData
      }

      return null
    } catch (error: any) {
      // Catch any unexpected errors and return null gracefully
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
        // Error 406 or column not found - session columns may not exist
        if (error.code === 'PGRST116' || error.message?.includes('406') || error.message?.includes('column') || error.message?.includes('does not exist')) {
          console.warn('[SupabaseSessionManager] Session columns may not exist, skipping session delete:', error.message)
          return true // Return true to indicate "success" (no-op)
        }
        console.warn('[SupabaseSessionManager] Error deleting session (non-critical):', error.message)
        return false
      }

      return true
    } catch (error: any) {
      console.warn('[SupabaseSessionManager] Error in deleteSession (non-critical):', error?.message || error)
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
      // Check if session columns exist - if not, skip query entirely
      const columnsExist = await this.checkSessionColumnsExist()
      if (!columnsExist) {
        return null
      }

      const { data, error } = await supabase
        .from('rooms')
        .select('session_id, is_session_active, session_last_active, session_data')
        .eq('room_code', roomCode)
        .eq('is_session_active', true)
        .maybeSingle() // Use maybeSingle to avoid errors when no rows found

      // Handle errors
      if (error) {
        // If we get 406 error even after check, mark columns as not existing
        if (error.code === 'PGRST116' || error.message?.includes('406') || error.message?.includes('column') || error.message?.includes('does not exist')) {
          this.sessionColumnsExist = false // Update cache
          return null
        }
        return null
      }

      // If no data found, return null (not an error)
      if (!data) {
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
    } catch (error: any) {
      return null
    }
  }

  // Update session activity
  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ session_last_active: new Date().toISOString() })
        .eq('session_id', sessionId)
      
      if (error) {
        // Error 406 or column not found - session columns may not exist
        if (error.code === 'PGRST116' || error.message?.includes('406') || error.message?.includes('column') || error.message?.includes('does not exist')) {
          // Silently skip if columns don't exist
          return
        }
        console.warn('[SupabaseSessionManager] Error updating session activity (non-critical):', error.message)
      }
    } catch (error: any) {
      // Silently ignore errors - session activity update is not critical
      console.warn('[SupabaseSessionManager] Error in updateSessionActivity (non-critical):', error?.message || error)
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
