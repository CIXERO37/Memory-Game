import { supabase, isSupabaseConfigured } from './supabase'

export interface Player {
  id: string
  user_id?: string
  nickname: string
  avatar: string
  joinedAt: string
  isReady: boolean
  isHost: boolean
  quizScore?: number
  questionsAnswered?: number
}

export interface Room {
  code: string
  hostId: string
  players: Player[]
  settings: {
    questionCount: number
    totalTimeLimit: number
  }
  status: "waiting" | "countdown" | "quiz" | "memory" | "finished"
  createdAt: string
  startedAt?: string
  gameStarted: boolean
  countdownStartTime?: string
  countdownDuration?: number
  quizId?: string
  quizTitle?: string
}

class SupabaseRoomManager {
  private listeners: Set<(room: Room | null) => void> = new Set()
  private subscriptions: Map<string, any> = new Map()
  private connectionStatus: boolean = true
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map()
  private lastRoomData: Map<string, Room | null> = new Map()

  generateRoomCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Map game_sessions status to Room status
  private mapSessionStatusToRoomStatus(sessionStatus: string, countdownStartedAt?: string | null, startedAt?: string | null): Room["status"] {
    if (sessionStatus === 'active') {
      // If startedAt is present, the game has officially started (post-countdown)
      if (startedAt) {
        return 'quiz'
      }
      // If only countdownStartedAt is present, it's in countdown phase
      if (countdownStartedAt) {
        return 'countdown'
      }
      // Active but no countdown and no start time (shouldn't happen normally, but treat as quiz)
      return 'quiz'
    }
    if (sessionStatus === 'finished') {
      return 'finished'
    }
    return 'waiting'
  }

  // Helper function untuk mendapatkan user info dari profiles
  private async getUserInfo(userId?: string): Promise<{ user_id: string | null; nickname: string; avatar: string }> {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          userId = user.id
        }
      }

      if (!userId) {
        return {
          user_id: null,
          nickname: 'Guest',
          avatar: '/avatars/default.webp'
        }
      }

      // Fetch dari profiles table - query berdasarkan auth_user_id (UUID)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username, fullname, avatar_url')
        .eq('auth_user_id', userId)
        .single()

      if (error || !profile) {
        return {
          user_id: null,
          nickname: 'User',
          avatar: '/avatars/default.webp'
        }
      }

      const nickname = profile.fullname || profile.username || 'User'
      const avatar = profile.avatar_url || '/avatars/default.webp'

      return {
        user_id: profile.id,
        nickname,
        avatar
      }
    } catch (error) {
      console.error('[SupabaseRoomManager] Error getting user info:', error)
      return {
        user_id: null,
        nickname: 'Guest',
        avatar: '/avatars/default.webp'
      }
    }
  }

  async createRoom(hostId: string, settings: Room["settings"], quizId: string, quizTitle: string): Promise<Room | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.warn('[SupabaseRoomManager] Supabase not configured, returning null')
        return null
      }

      const roomCode = this.generateRoomCode()

      // Get quiz detail for quiz_detail JSONB
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('title, description, category, language, image_url')
        .eq('id', quizId)
        .single()

      // Create game session in database
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
          game_pin: roomCode,
          host_id: hostId,
          quiz_id: quizId,
          quiz_detail: {
            title: quizTitle,
            description: quizData?.description || '',
            category: quizData?.category || '',
            language: quizData?.language || 'id',
            image: quizData?.image_url || ''
          },
          total_time_minutes: settings.totalTimeLimit,
          question_limit: settings.questionCount === 0 ? 'all' : settings.questionCount.toString(),
          status: 'waiting',
          participants: [],
          responses: [],
          current_questions: [],
          application: 'memoryquiz'
        })
        .select()
        .single()

      if (sessionError) {
        console.error('[SupabaseRoomManager] Error creating game session:', sessionError)
        return null
      }

      const room: Room = {
        code: roomCode,
        hostId,
        players: [],
        settings,
        status: 'waiting',
        createdAt: sessionData.created_at,
        startedAt: sessionData.started_at,
        gameStarted: false,
        quizId: quizId,
        quizTitle: quizTitle
      }

      return room
    } catch (error) {
      console.error('[SupabaseRoomManager] Error creating room:', error)
      return null
    }
  }

  async getRoom(roomCode: string): Promise<Room | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.warn('[SupabaseRoomManager] Supabase not configured, returning null')
        return null
      }

      // Get game session data
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('game_pin', roomCode)
        .single()

      if (sessionError || !sessionData) {
        return null
      }

      // Parse participants from JSONB
      const participants = Array.isArray(sessionData.participants) ? sessionData.participants : []

      const players: Player[] = participants.map((p: any) => ({
        id: p.id || '',
        user_id: p.user_id || null,
        nickname: p.nickname || 'Guest',
        avatar: p.avatar || '/avatars/default.webp',
        joinedAt: p.joined_at || new Date().toISOString(),
        isReady: true,
        isHost: false,
        quizScore: p.quiz_score || 0,
        questionsAnswered: p.questions_answered || 0
      }))

      // Extract quiz title and question count
      const quizTitle = sessionData.quiz_detail?.title || ''
      const questionCount = sessionData.question_limit === 'all' ? 0 : parseInt(sessionData.question_limit || '0')

      const room: Room = {
        code: sessionData.game_pin,
        hostId: sessionData.host_id,
        players,
        settings: {
          questionCount,
          totalTimeLimit: sessionData.total_time_minutes || 60
        },
        status: this.mapSessionStatusToRoomStatus(sessionData.status, sessionData.countdown_started_at, sessionData.started_at),
        createdAt: sessionData.created_at,
        startedAt: sessionData.started_at,
        gameStarted: sessionData.status !== 'waiting' && sessionData.status !== null,
        countdownStartTime: sessionData.countdown_started_at,
        countdownDuration: 10,
        quizId: sessionData.quiz_id,
        quizTitle: quizTitle
      }

      return room
    } catch (error) {
      console.error('[SupabaseRoomManager] Error getting room:', error)
      return null
    }
  }

  async joinRoom(roomCode: string, player: Omit<Player, "id" | "joinedAt" | "isReady" | "isHost">, userId?: string): Promise<boolean> {
    try {
      // Get current game session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('participants, status')
        .eq('game_pin', roomCode)
        .single()

      if (sessionError || !sessionData) {
        console.error('[SupabaseRoomManager] Room not found for join:', roomCode)
        return false
      }

      if (sessionData.status !== 'waiting') {
        console.error('[SupabaseRoomManager] Game already started')
        return false
      }

      // Get user info
      const userInfo = await this.getUserInfo(userId)

      // Generate player session ID
      const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Add player to participants array
      const participants = Array.isArray(sessionData.participants) ? sessionData.participants : []
      const newParticipant = {
        id: playerId,
        user_id: userInfo.user_id,
        nickname: player.nickname || userInfo.nickname,
        avatar: player.avatar || userInfo.avatar,
        quiz_score: 0,
        questions_answered: 0,
        joined_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      }

      participants.push(newParticipant)

      // Update game session with new participant
      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({ participants })
        .eq('game_pin', roomCode)

      if (updateError) {
        console.error('[SupabaseRoomManager] Error adding participant:', updateError)
        return false
      }

      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error joining room:', error)
      return false
    }
  }

  async rejoinRoom(roomCode: string, player: Omit<Player, "joinedAt" | "isReady" | "isHost">, userId?: string): Promise<boolean> {
    try {
      // Get current game session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('participants, status')
        .eq('game_pin', roomCode)
        .single()

      if (sessionError || !sessionData) {
        console.error('[SupabaseRoomManager] Room not found for rejoin:', roomCode)
        return false
      }

      if (sessionData.status !== 'waiting') {
        console.error('[SupabaseRoomManager] Game already started')
        return false
      }

      // Get user info
      const userInfo = await this.getUserInfo(userId)

      const participants = Array.isArray(sessionData.participants) ? [...sessionData.participants] : []

      // Check if player exists by user_id (preferred) or by id
      let playerIndex = -1
      if (userInfo.user_id) {
        playerIndex = participants.findIndex((p: any) => p.user_id === userInfo.user_id)
      }

      // Fallback: check by id if user_id not found
      if (playerIndex === -1 && player.id) {
        playerIndex = participants.findIndex((p: any) => p.id === player.id)
      }

      if (playerIndex !== -1) {
        // Player exists, update last_active dan preserve user_id/nickname
        const existingPlayer = participants[playerIndex]
        existingPlayer.last_active = new Date().toISOString()

        // Update user_id dan nickname jika belum ada atau berbeda
        if (userInfo.user_id && !existingPlayer.user_id) {
          existingPlayer.user_id = userInfo.user_id
        }
        if (userInfo.nickname && !existingPlayer.nickname) {
          existingPlayer.nickname = userInfo.nickname
        }

        participants[playerIndex] = existingPlayer
      } else {
        // Player doesn't exist, create new one
        const playerId = player.id || `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newParticipant = {
          id: playerId,
          user_id: userInfo.user_id,
          nickname: player.nickname || userInfo.nickname,
          avatar: player.avatar || userInfo.avatar,
          quiz_score: 0,
          questions_answered: 0,
          joined_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        }
        participants.push(newParticipant)
      }

      // Update game session
      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({ participants })
        .eq('game_pin', roomCode)

      if (updateError) {
        console.error('[SupabaseRoomManager] Error updating participant:', updateError)
        return false
      }

      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error rejoining room:', error)
      return false
    }
  }

  async leaveRoom(roomCode: string, playerId: string): Promise<boolean> {
    try {
      // Get current game session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('participants')
        .eq('game_pin', roomCode)
        .single()

      if (sessionError || !sessionData) {
        console.error('[SupabaseRoomManager] Room not found for leave:', roomCode)
        return false
      }

      // Remove player from participants array
      const participants = Array.isArray(sessionData.participants) ? sessionData.participants : []
      const filteredParticipants = participants.filter((p: any) => p.id !== playerId)

      // Update game session
      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({ participants: filteredParticipants })
        .eq('game_pin', roomCode)

      if (updateError) {
        console.error('[SupabaseRoomManager] Error removing participant:', updateError)
        return false
      }

      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error leaving room:', error)
      return false
    }
  }

  async kickPlayer(roomCode: string, playerId: string, hostId: string): Promise<boolean> {
    try {
      // Get game session and verify host
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('participants, host_id')
        .eq('game_pin', roomCode)
        .single()

      if (sessionError || !sessionData) {
        console.error('[SupabaseRoomManager] Room not found for kick:', roomCode)
        return false
      }

      // Verify the requester is the host
      if (sessionData.host_id !== hostId) {
        console.error('[SupabaseRoomManager] Host verification failed:', { host_id: sessionData.host_id, hostId })
        return false
      }

      // Remove player from participants array
      const participants = Array.isArray(sessionData.participants) ? sessionData.participants : []
      const filteredParticipants = participants.filter((p: any) => p.id !== playerId)

      if (filteredParticipants.length === participants.length) {
        console.error('[SupabaseRoomManager] Player not found for kick:', playerId)
        return false
      }

      // Update game session
      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({ participants: filteredParticipants })
        .eq('game_pin', roomCode)

      if (updateError) {
        console.error('[SupabaseRoomManager] Error kicking player:', updateError)
        return false
      }

      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error kicking player:', error)
      return false
    }
  }

  async startCountdown(roomCode: string, hostId: string, duration: number = 10): Promise<boolean> {
    try {
      // Get game session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('host_id')
        .eq('game_pin', roomCode)
        .single()

      if (sessionError || !sessionData) {
        console.error('[SupabaseRoomManager] Game session not found for countdown:', roomCode)
        return false
      }

      // Verify host
      if (sessionData.host_id !== hostId) {
        console.error('[SupabaseRoomManager] Host verification failed for countdown')
        return false
      }

      const countdownStartTime = new Date().toISOString()

      // Update game session
      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({
          status: 'active',
          countdown_started_at: countdownStartTime
        })
        .eq('game_pin', roomCode)

      if (updateError) {
        console.error('[SupabaseRoomManager] Error starting countdown:', updateError)
        return false
      }

      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error starting countdown:', error)
      return false
    }
  }

  async startGame(roomCode: string, hostId: string): Promise<boolean> {
    try {
      // Get game session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('host_id')
        .eq('game_pin', roomCode)
        .single()

      if (sessionError || !sessionData) {
        console.error('[SupabaseRoomManager] Game session not found for start:', roomCode)
        return false
      }

      // Verify host
      if (sessionData.host_id !== hostId) {
        console.error('[SupabaseRoomManager] Host verification failed for start game')
        return false
      }

      const startedAtTime = new Date().toISOString()

      // Update game session
      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({
          status: 'active',
          started_at: startedAtTime
        })
        .eq('game_pin', roomCode)

      if (updateError) {
        console.error('[SupabaseRoomManager] Error starting game:', updateError)
        return false
      }

      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error starting game:', error)
      return false
    }
  }

  async updateGameStatus(roomCode: string, status: Room["status"]): Promise<boolean> {
    try {
      // Map Room.status to game_sessions.status
      // Room.status can be: 'waiting' | 'countdown' | 'quiz' | 'memory' | 'finished'
      let sessionStatus = 'waiting'
      if (status === 'countdown' || status === 'quiz' || status === 'memory') {
        sessionStatus = 'active'
      } else if (status === 'finished') {
        sessionStatus = 'finished'
      }

      const { error } = await supabase
        .from('game_sessions')
        .update({ status: sessionStatus })
        .eq('game_pin', roomCode)

      if (error) {
        console.error('[SupabaseRoomManager] Error updating game status:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error updating game status:', error)
      return false
    }
  }

  async updatePlayerScore(roomCode: string, playerId: string, quizScore?: number, questionsAnswered?: number): Promise<boolean> {
    try {
      // Get current game session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('participants')
        .eq('game_pin', roomCode)
        .single()

      if (sessionError || !sessionData) {
        console.error('[SupabaseRoomManager] Game session not found:', roomCode)
        return false
      }

      // Update participant in array
      const participants = Array.isArray(sessionData.participants) ? [...sessionData.participants] : []
      const playerIndex = participants.findIndex((p: any) => p.id === playerId)

      if (playerIndex === -1) {
        console.error('[SupabaseRoomManager] Player not found:', playerId)
        return false
      }

      // Update player scores (monotonic - never decrease)
      const currentPlayer = participants[playerIndex]
      if (quizScore !== undefined) {
        currentPlayer.quiz_score = Math.max(currentPlayer.quiz_score || 0, quizScore)
      }
      if (questionsAnswered !== undefined) {
        currentPlayer.questions_answered = Math.max(currentPlayer.questions_answered || 0, questionsAnswered)
      }
      currentPlayer.last_active = new Date().toISOString()

      participants[playerIndex] = currentPlayer

      // Update game session
      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({ participants })
        .eq('game_pin', roomCode)

      if (updateError) {
        console.error('[SupabaseRoomManager] Error updating player score:', updateError)
        return false
      }

      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error updating player score:', error)
      return false
    }
  }

  async isPlayerKicked(roomCode: string, nickname: string): Promise<boolean> {
    // Always return false since we removed kick prevention
    return false
  }

  async subscribe(roomCode: string, callback: (room: Room | null) => void) {
    // Initialize lastRoomData with current room state
    const initialRoom = await this.getRoom(roomCode)
    if (initialRoom) {
      this.lastRoomData.set(roomCode, initialRoom)
      setTimeout(() => {
        callback(initialRoom)
      }, 100)
    }

    const DEBOUNCE_DELAY = 100

    const debouncedCallback = (updatedRoom: Room | null, immediate: boolean = false) => {
      if (immediate) {
        const lastRoom = this.lastRoomData.get(roomCode)
        const hasChanged = !lastRoom ||
          lastRoom.status !== updatedRoom?.status ||
          lastRoom.players?.length !== updatedRoom?.players?.length ||
          lastRoom.countdownStartTime !== updatedRoom?.countdownStartTime ||
          JSON.stringify(lastRoom.players?.map(p => p.id).sort()) !== JSON.stringify(updatedRoom?.players?.map(p => p.id).sort()) ||
          JSON.stringify(lastRoom.players?.map(p => ({ id: p.id, quizScore: p.quizScore, questionsAnswered: p.questionsAnswered })).sort((a, b) => a.id.localeCompare(b.id))) !==
          JSON.stringify(updatedRoom?.players?.map(p => ({ id: p.id, quizScore: p.quizScore, questionsAnswered: p.questionsAnswered })).sort((a, b) => a.id.localeCompare(b.id)))

        if (hasChanged && updatedRoom) {
          this.lastRoomData.set(roomCode, updatedRoom)
          callback(updatedRoom)
        }
        return
      }

      const existingTimer = this.debounceTimers.get(roomCode)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      const timer = setTimeout(() => {
        const lastRoom = this.lastRoomData.get(roomCode)
        const hasChanged = !lastRoom ||
          lastRoom.status !== updatedRoom?.status ||
          lastRoom.players?.length !== updatedRoom?.players?.length ||
          lastRoom.countdownStartTime !== updatedRoom?.countdownStartTime ||
          JSON.stringify(lastRoom.players?.map(p => p.id).sort()) !== JSON.stringify(updatedRoom?.players?.map(p => p.id).sort()) ||
          JSON.stringify(lastRoom.players?.map(p => ({ id: p.id, quizScore: p.quizScore, questionsAnswered: p.questionsAnswered })).sort((a, b) => a.id.localeCompare(b.id))) !==
          JSON.stringify(updatedRoom?.players?.map(p => ({ id: p.id, quizScore: p.quizScore, questionsAnswered: p.questionsAnswered })).sort((a, b) => a.id.localeCompare(b.id)))

        if (hasChanged && updatedRoom) {
          this.lastRoomData.set(roomCode, updatedRoom)
          callback(updatedRoom)
        }

        this.debounceTimers.delete(roomCode)
      }, DEBOUNCE_DELAY)

      this.debounceTimers.set(roomCode, timer)
    }

    // Subscribe to game_sessions changes
    const roomSubscription = supabase
      .channel(`room-${roomCode}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
          filter: `game_pin=eq.${roomCode}`
        },
        async (payload) => {
          const updatedRoom = await this.getRoom(roomCode)
          if (updatedRoom) {
            debouncedCallback(updatedRoom, true)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[SupabaseRoomManager] ✅ Subscribed to room updates:', roomCode)
          this.connectionStatus = true
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[SupabaseRoomManager] ❌ Subscription error:', roomCode)
          this.connectionStatus = false
        } else if (status === 'CLOSED') {
          console.warn('[SupabaseRoomManager] ⚠️ Subscription closed:', roomCode)
          this.connectionStatus = false
        }
      })

    this.subscriptions.set(roomCode, roomSubscription)
    this.listeners.add(callback)

    return () => {
      const timer = this.debounceTimers.get(roomCode)
      if (timer) {
        clearTimeout(timer)
        this.debounceTimers.delete(roomCode)
      }

      this.lastRoomData.delete(roomCode)

      console.log('[SupabaseRoomManager] Unsubscribing from room:', roomCode)
      roomSubscription.unsubscribe()
      this.subscriptions.delete(roomCode)
      this.listeners.delete(callback)
    }
  }

  isChannelConnected(): boolean {
    return this.connectionStatus
  }

  cleanup() {
    // Clear all debounce timers
    this.debounceTimers.forEach(timer => {
      clearTimeout(timer)
    })
    this.debounceTimers.clear()

    // Clear cached room data
    this.lastRoomData.clear()

    // Unsubscribe from all channels
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe()
    })
    this.subscriptions.clear()
    this.listeners.clear()
  }

  // Update detailed game progress
  async updateGameProgress(
    roomCode: string,
    playerId: string,
    progress: {
      currentQuestion?: number
      correctAnswers?: number
      quizScore?: number
      questionsAnswered?: number
    }
  ): Promise<boolean> {
    try {
      // Get current game session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('participants')
        .eq('game_pin', roomCode)
        .single()

      if (sessionError || !sessionData) {
        console.error('[SupabaseRoomManager] Game session not found:', roomCode)
        return false
      }

      // Update participant in array
      const participants = Array.isArray(sessionData.participants) ? [...sessionData.participants] : []
      const playerIndex = participants.findIndex((p: any) => p.id === playerId)

      if (playerIndex === -1) {
        console.error('[SupabaseRoomManager] Player not found:', playerId)
        return false
      }

      // Update player progress (monotonic - never decrease)
      const currentPlayer = participants[playerIndex]
      if (progress.quizScore !== undefined) {
        currentPlayer.quiz_score = Math.max(currentPlayer.quiz_score || 0, progress.quizScore)
      }
      if (progress.questionsAnswered !== undefined) {
        currentPlayer.questions_answered = Math.max(currentPlayer.questions_answered || 0, progress.questionsAnswered)
      }
      currentPlayer.last_active = new Date().toISOString()

      participants[playerIndex] = currentPlayer

      // Update game session
      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({ participants })
        .eq('game_pin', roomCode)

      if (updateError) {
        console.error('[SupabaseRoomManager] Error updating game progress:', updateError)
        return false
      }

      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error in updateGameProgress:', error)
      return false
    }
  }

  // Get player game progress
  async getPlayerGameProgress(roomCode: string, playerId: string): Promise<any> {
    try {
      const { data: sessionData, error } = await supabase
        .from('game_sessions')
        .select('participants')
        .eq('game_pin', roomCode)
        .single()

      if (error || !sessionData) {
        console.error('[SupabaseRoomManager] Error getting player game progress:', error)
        return null
      }

      const participants = Array.isArray(sessionData.participants) ? sessionData.participants : []
      const player = participants.find((p: any) => p.id === playerId)

      if (!player) {
        return null
      }

      return {
        quiz_score: player.quiz_score || 0,
        questions_answered: player.questions_answered || 0,
        correct_answers: player.correct_answers || 0
      }
    } catch (error) {
      console.error('[SupabaseRoomManager] Error in getPlayerGameProgress:', error)
      return null
    }
  }
}

export const supabaseRoomManager = new SupabaseRoomManager()
