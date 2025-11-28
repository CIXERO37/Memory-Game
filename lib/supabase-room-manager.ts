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
  memoryScore?: number
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
  questions?: any[]
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
        // Gunakan kolom yang pasti ada di schema: username, full_name (atau fullname di beberapa deployment), avatar_url
        // Di sini kita select username, full_name, avatar_url lalu handle kedua kemungkinan nama kolom di bawah
        .select('id, username, full_name, avatar_url')
        .eq('auth_user_id', userId)
        .single()

      if (error || !profile) {
        return {
          user_id: null,
          nickname: 'User',
          avatar: '/avatars/default.webp'
        }
      }

      const nickname = (profile.full_name as string | null) || profile.username || 'User'
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

      // Get quiz detail for quiz_detail JSONB AND questions
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('title, description, category, language, image_url, questions')
        .eq('id', quizId)
        .single()

      // Generate looped and randomized questions
      let sessionQuestions: any[] = []
      const originalQuestions = quizData?.questions || []
      const targetCount = settings.questionCount === 0 ? originalQuestions.length : settings.questionCount

      if (originalQuestions.length > 0) {
        // Helper to shuffle array
        const shuffle = (array: any[]) => {
          const newArray = [...array]
          for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
          }
          return newArray
        }

        let currentCount = 0
        // If target is small, just take random subset
        if (targetCount <= originalQuestions.length) {
          sessionQuestions = shuffle(originalQuestions).slice(0, targetCount)
        } else {
          // If target is larger, loop and shuffle
          while (currentCount < targetCount) {
            const shuffled = shuffle(originalQuestions)
            const needed = targetCount - currentCount
            const toAdd = shuffled.slice(0, needed)
            sessionQuestions = [...sessionQuestions, ...toAdd]
            currentCount += toAdd.length
          }
        }
      }

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
          current_questions: sessionQuestions, // Store generated questions
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
        quizTitle: quizTitle,
        questions: sessionQuestions
      }

      return room
    } catch (error) {
      console.error('[SupabaseRoomManager] Error creating room:', error)
      return null
    }
  }

  // Helper to parse session data into Room object
  private _parseSessionDataToRoom(sessionData: any): Room {
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
      questionsAnswered: p.questions_answered || 0,
      memoryScore: p.memory_score || 0 // Ensure memory score is mapped
    }))

    // Extract quiz title and question count
    const quizTitle = sessionData.quiz_detail?.title || ''
    const questionCount = sessionData.question_limit === 'all' ? 0 : parseInt(sessionData.question_limit || '0')

    return {
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
      quizTitle: quizTitle,
      questions: sessionData.current_questions || []
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

      return this._parseSessionDataToRoom(sessionData)
    } catch (error) {
      console.error('[SupabaseRoomManager] Error getting room:', error)
      return null
    }
  }

  async joinRoom(roomCode: string, player: Omit<Player, "id" | "joinedAt" | "isReady" | "isHost">, userId?: string): Promise<boolean> {
    try {
      if (!isSupabaseConfigured()) return false

      // Get current room data
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('game_pin', roomCode)
        .single()

      if (sessionError || !sessionData) {
        console.error('[SupabaseRoomManager] Room not found:', roomCode)
        return false
      }

      if (sessionData.status !== 'waiting') {
        console.warn('[SupabaseRoomManager] Game already started')
        return false
      }

      const participants = Array.isArray(sessionData.participants) ? [...sessionData.participants] : []

      // Check if nickname taken
      if (participants.some((p: any) => p.nickname === player.nickname)) {
        console.warn('[SupabaseRoomManager] Nickname already taken:', player.nickname)
        return false
      }

      // Get user info if userId provided
      const userInfo = await this.getUserInfo(userId)

      const newPlayer = {
        id: Math.random().toString(36).substr(2, 9),
        user_id: userInfo.user_id,
        nickname: player.nickname,
        avatar: player.avatar,
        joined_at: new Date().toISOString(),
        is_ready: true,
        is_host: false,
        quiz_score: 0,
        questions_answered: 0,
        memory_score: 0
      }

      participants.push(newPlayer)

      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({ participants })
        .eq('game_pin', roomCode)

      if (updateError) {
        console.error('[SupabaseRoomManager] Error joining room:', updateError)
        return false
      }

      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error in joinRoom:', error)
      return false
    }
  }

  async rejoinRoom(roomCode: string, player: Omit<Player, "joinedAt" | "isReady" | "isHost">, userId?: string): Promise<boolean> {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('participants')
        .eq('game_pin', roomCode)
        .single()

      if (sessionError || !sessionData) return false

      let participants = Array.isArray(sessionData.participants) ? [...sessionData.participants] : []
      const playerIndex = participants.findIndex((p: any) => p.id === player.id)

      if (playerIndex === -1) {
        // If player not found by ID, try by nickname (fallback)
        const nicknameIndex = participants.findIndex((p: any) => p.nickname === player.nickname)
        if (nicknameIndex === -1) return false

        // Update the found player
        participants[nicknameIndex] = {
          ...participants[nicknameIndex],
          avatar: player.avatar, // Update avatar if changed
          is_ready: true
        }
      } else {
        participants[playerIndex] = {
          ...participants[playerIndex],
          nickname: player.nickname,
          avatar: player.avatar,
          is_ready: true
        }
      }

      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({ participants })
        .eq('game_pin', roomCode)

      return !updateError
    } catch (error) {
      console.error('[SupabaseRoomManager] Error in rejoinRoom:', error)
      return false
    }
  }

  async updatePlayerScore(roomCode: string, playerId: string, quizScore?: number, questionsAnswered?: number): Promise<boolean> {
    return this.updateGameProgress(roomCode, playerId, { quizScore, questionsAnswered })
  }

  async startCountdown(roomCode: string, hostId: string, duration: number = 10): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({
          status: 'active', // Use active for countdown phase too, distinguished by countdown_started_at
          countdown_started_at: new Date().toISOString(),
          started_at: null // Reset started_at until countdown finishes
        })
        .eq('game_pin', roomCode)
        .eq('host_id', hostId)

      return !error
    } catch (error) {
      console.error('[SupabaseRoomManager] Error starting countdown:', error)
      return false
    }
  }

  async startGame(roomCode: string, hostId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('game_pin', roomCode)
        .eq('host_id', hostId)

      return !error
    } catch (error) {
      console.error('[SupabaseRoomManager] Error starting game:', error)
      return false
    }
  }

  async updateGameStatus(roomCode: string, status: Room["status"]): Promise<boolean> {
    try {
      // Map Room status to DB status
      let dbStatus = 'waiting'
      if (status === 'countdown' || status === 'quiz' || status === 'memory') dbStatus = 'active'
      if (status === 'finished') dbStatus = 'finished'

      const updateData: any = { status: dbStatus }

      if (status === 'countdown') {
        updateData.countdown_started_at = new Date().toISOString()
      } else if (status === 'quiz') {
        updateData.started_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('game_sessions')
        .update(updateData)
        .eq('game_pin', roomCode)

      return !error
    } catch (error) {
      console.error('[SupabaseRoomManager] Error updating game status:', error)
      return false
    }
  }

  async leaveRoom(roomCode: string, playerId: string): Promise<boolean> {
    try {
      const { data: sessionData } = await supabase
        .from('game_sessions')
        .select('participants')
        .eq('game_pin', roomCode)
        .single()

      if (!sessionData) return false

      const participants = Array.isArray(sessionData.participants)
        ? sessionData.participants.filter((p: any) => p.id !== playerId)
        : []

      const { error } = await supabase
        .from('game_sessions')
        .update({ participants })
        .eq('game_pin', roomCode)

      return !error
    } catch (error) {
      console.error('[SupabaseRoomManager] Error leaving room:', error)
      return false
    }
  }

  async kickPlayer(roomCode: string, playerId: string, hostId: string): Promise<boolean> {
    // For now, just remove the player. 
    return this.leaveRoom(roomCode, playerId)
  }

  async isPlayerKicked(roomCode: string, nickname: string): Promise<boolean> {
    // Placeholder as we don't have kicked_players column yet
    return false
  }

  async subscribe(roomCode: string, callback: (room: Room | null) => void) {
    // Initialize lastRoomData with current room state
    const initialRoom = await this.getRoom(roomCode)
    if (initialRoom) {
      this.lastRoomData.set(roomCode, initialRoom)
      // Immediate callback for initial state
      callback(initialRoom)
    }

    const DEBOUNCE_DELAY = 50 // Reduced delay for snappier updates

    const debouncedCallback = (updatedRoom: Room | null) => {
      const existingTimer = this.debounceTimers.get(roomCode)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      const timer = setTimeout(() => {
        const lastRoom = this.lastRoomData.get(roomCode)

        // Deep comparison to avoid unnecessary updates
        const hasChanged = !lastRoom ||
          lastRoom.status !== updatedRoom?.status ||
          lastRoom.players?.length !== updatedRoom?.players?.length ||
          lastRoom.countdownStartTime !== updatedRoom?.countdownStartTime ||
          JSON.stringify(lastRoom.players?.map(p => p.id).sort()) !== JSON.stringify(updatedRoom?.players?.map(p => p.id).sort()) ||
          JSON.stringify(lastRoom.players?.map(p => ({
            id: p.id,
            quizScore: p.quizScore,
            questionsAnswered: p.questionsAnswered,
            memoryScore: p.memoryScore // Include memory score in comparison
          })).sort((a, b) => a.id.localeCompare(b.id))) !==
          JSON.stringify(updatedRoom?.players?.map(p => ({
            id: p.id,
            quizScore: p.quizScore,
            questionsAnswered: p.questionsAnswered,
            memoryScore: p.memoryScore
          })).sort((a, b) => a.id.localeCompare(b.id)))

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
          // OPTIMIZATION: Use payload.new directly instead of fetching
          if (payload.new && typeof payload.new === 'object') {
            try {
              // payload.new contains the updated row. We can parse it directly.
              const updatedRoom = this._parseSessionDataToRoom(payload.new)
              debouncedCallback(updatedRoom)
            } catch (err) {
              console.error('[SupabaseRoomManager] Error parsing payload:', err)
              // Fallback to fetch if parsing fails
              const fetchedRoom = await this.getRoom(roomCode)
              if (fetchedRoom) debouncedCallback(fetchedRoom)
            }
          } else {
            // Fallback for delete events or weird payloads
            const updatedRoom = await this.getRoom(roomCode)
            if (updatedRoom) debouncedCallback(updatedRoom)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {

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
      memoryProgress?: {
        correct_matches: number
        last_updated: string
      }
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
      let hasChanged = false

      // OPTIMIZATION: Delta Updates - Only update if values actually changed
      // Note: While Supabase uses JSON (not Protobuf), this logic minimizes data transfer
      // by preventing redundant writes, achieving the same goal of bandwidth conservation.

      if (progress.quizScore !== undefined) {
        const newScore = Math.max(currentPlayer.quiz_score || 0, progress.quizScore)
        if (newScore !== currentPlayer.quiz_score) {
          currentPlayer.quiz_score = newScore
          hasChanged = true
        }
      }

      if (progress.questionsAnswered !== undefined) {
        const newAnswered = Math.max(currentPlayer.questions_answered || 0, progress.questionsAnswered)
        if (newAnswered !== currentPlayer.questions_answered) {
          currentPlayer.questions_answered = newAnswered
          hasChanged = true
        }
      }

      if (progress.memoryProgress !== undefined) {
        // Deep compare for object
        if (JSON.stringify(currentPlayer.memory_progress) !== JSON.stringify(progress.memoryProgress)) {
          currentPlayer.memory_progress = progress.memoryProgress
          hasChanged = true
        }
      }

      if (!hasChanged) {
        // No changes needed, skip database write
        return true
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
