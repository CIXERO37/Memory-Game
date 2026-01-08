import { supabase, isSupabaseConfigured } from './supabase'
import { participantsApi, sessionsApi, isPlayersSupabaseConfigured, GameParticipant } from './supabase-players'

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
    const chars = "0123456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Map database status to Room status
  // DB status: waiting, active, finished
  // Room status: waiting, countdown, quiz, memory, finished
  // Countdown detected via countdown_started_at
  private mapSessionStatusToRoomStatus(sessionStatus: string, countdownStartedAt?: string | null, startedAt?: string | null): Room["status"] {
    if (sessionStatus === 'finished') {
      return 'finished'
    }

    if (sessionStatus === 'active') {
      return 'quiz'
    }

    // Status 'waiting' - check if countdown has started
    if (sessionStatus === 'waiting') {
      if (countdownStartedAt) {
        return 'countdown'
      }
      return 'waiting'
    }

    return 'waiting'
  }

  // 🆕 NEW: Get profile ID from profiles table by email
  async getProfileIdByEmail(email: string): Promise<string | null> {
    try {
      if (!email) return null

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (error) {
        console.warn('[SupabaseRoomManager] Error fetching profile by email:', error)
        return null
      }

      return profile?.id || null
    } catch (error) {
      console.error('[SupabaseRoomManager] Exception getting profile by email:', error)
      return null
    }
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

      // 🚀 SUPABASE B: Create session FIRST for realtime operations
      let supabaseBSessionId: string | null = null
      if (isPlayersSupabaseConfigured()) {
        const sessionB = await sessionsApi.createSession({
          game_pin: roomCode,
          host_id: hostId,
          quiz_id: quizId,
          quiz_title: quizTitle,
          settings: {
            questionCount: settings.questionCount === 0 ? originalQuestions.length : settings.questionCount,
            totalTimeLimit: settings.totalTimeLimit
          },
          questions: sessionQuestions
        })

        if (sessionB) {
          supabaseBSessionId = sessionB.id
          console.log('[SupabaseRoomManager] ✅ Session created in Supabase B:', roomCode, 'ID:', supabaseBSessionId)
        } else {
          console.warn('[SupabaseRoomManager] ⚠️ Failed to create session in Supabase B, continuing with A only')
        }
      }

      // Also create in Supabase A (for historical data / backup)
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
          current_questions: sessionQuestions,
          application: 'memoryquiz',
          game_end_mode: 'manual'
        })
        .select()
        .single()

      if (sessionError) {
        console.error('[SupabaseRoomManager] Error creating game session in Supabase A:', sessionError)
        // If Supabase B succeeded, we can still continue
        if (!supabaseBSessionId) {
          return null
        }
      }

      const room: Room = {
        code: roomCode,
        hostId,
        players: [],
        settings,
        status: 'waiting',
        createdAt: sessionData?.created_at || new Date().toISOString(),
        startedAt: sessionData?.started_at,
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

  // Helper to convert GameParticipant from Players DB to Player
  private _convertParticipantToPlayer(p: GameParticipant): Player {
    return {
      id: p.id,  // XID format
      user_id: undefined,
      nickname: p.nickname,
      avatar: p.avatar || '/avatars/default.webp',
      joinedAt: p.joined_at,
      isReady: true,
      isHost: p.is_host,
      quizScore: p.score || 0,
      questionsAnswered: p.questions_answered || 0,
      memoryScore: 0  // memory_score removed from DB
    }
  }

  // Helper to parse session data into Room object
  // Now supports both JSONB (legacy) and Players DB (new)
  private _parseSessionDataToRoom(sessionData: any, playersFromDB?: GameParticipant[]): Room {
    let players: Player[]

    // 🚀 DUAL DB: If we have players from Players DB, use those (more up-to-date scores)
    if (playersFromDB && playersFromDB.length > 0) {
      players = playersFromDB.map(p => this._convertParticipantToPlayer(p))
    } else {
      // Fallback to JSONB participants (backward compatible)
      const participants = Array.isArray(sessionData.participants) ? sessionData.participants : []
      players = participants.map((p: any) => ({
        id: p.id || '',
        user_id: p.user_id || null,
        nickname: p.nickname || 'Guest',
        avatar: p.avatar || '/avatars/default.webp',
        joinedAt: p.joined_at || new Date().toISOString(),
        isReady: true,
        isHost: false,
        quizScore: p.quiz_score || 0,
        questionsAnswered: p.questions_answered || 0,
        memoryScore: p.memory_score || 0
      }))
    }

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

      // 🚀 SUPABASE B FIRST: Try to get session from Supabase B for faster realtime
      if (isPlayersSupabaseConfigured()) {
        try {
          const sessionB = await sessionsApi.getSession(roomCode)
          const playersFromDB = await participantsApi.getParticipants(roomCode)

          if (sessionB) {
            // Convert Supabase B session to Room format
            const players: Player[] = playersFromDB.map(p => this._convertParticipantToPlayer(p))

            const room: Room = {
              code: sessionB.game_pin,
              hostId: sessionB.host_id,
              players,
              settings: {
                questionCount: sessionB.settings?.questionCount || 10,
                totalTimeLimit: sessionB.settings?.totalTimeLimit || 300
              },
              status: this.mapSessionStatusToRoomStatus(sessionB.status, sessionB.countdown_started_at, sessionB.started_at),
              createdAt: sessionB.created_at,
              startedAt: sessionB.started_at || undefined,
              gameStarted: sessionB.status !== 'waiting',
              countdownStartTime: sessionB.countdown_started_at || undefined,
              countdownDuration: sessionB.countdown_duration_seconds || 10,
              quizId: sessionB.quiz_id || undefined,
              quizTitle: sessionB.quiz_title || undefined,
              questions: sessionB.questions || []
            }

            return room
          }
        } catch (error) {
          console.warn('[SupabaseRoomManager] Supabase B fetch failed, falling back to A:', error)
        }
      }

      // Fallback: Get game session data from Supabase A
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('game_pin', roomCode)
        .single()

      if (sessionError || !sessionData) {
        return null
      }

      // Try to get participants from Players DB for up-to-date scores
      let playersFromDB: GameParticipant[] = []
      if (isPlayersSupabaseConfigured()) {
        try {
          playersFromDB = await participantsApi.getParticipants(roomCode)
        } catch (error) {
          console.warn('[SupabaseRoomManager] Players DB fetch failed, using JSONB fallback:', error)
        }
      }

      return this._parseSessionDataToRoom(sessionData, playersFromDB)
    } catch (error) {
      console.error('[SupabaseRoomManager] Error getting room:', error)
      return null
    }
  }

  async joinRoom(roomCode: string, player: Omit<Player, "id" | "joinedAt" | "isReady" | "isHost">, userId?: string): Promise<boolean> {
    try {
      if (!isSupabaseConfigured() && !isPlayersSupabaseConfigured()) return false

      let sessionStatus: string = ''
      let participants: any[] = []
      let useSupabaseB = false

      // 🚀 SUPABASE B FIRST: Check if session exists in Players DB (faster)
      if (isPlayersSupabaseConfigured()) {
        try {
          const sessionB = await sessionsApi.getSession(roomCode)
          if (sessionB) {
            useSupabaseB = true
            sessionStatus = sessionB.status

            // Get existing participants from Players DB
            const existingPlayers = await participantsApi.getParticipants(roomCode)
            participants = existingPlayers.map(p => ({
              id: p.id,
              nickname: p.nickname,
              avatar: p.avatar,
              joined_at: p.joined_at,
              is_ready: true,
              is_host: p.is_host,
              score: p.score || 0,
              questions_answered: p.questions_answered || 0,
              memory_score: 0
            }))

            console.log('[SupabaseRoomManager] Using Supabase B for joinRoom validation')
          }
        } catch (error) {
          console.warn('[SupabaseRoomManager] Supabase B check failed, falling back to A:', error)
        }
      }

      // Fallback to Supabase A if B not available or failed
      if (!useSupabaseB && isSupabaseConfigured()) {
        const { data: sessionData, error: sessionError } = await supabase
          .from('game_sessions')
          .select('status, participants')
          .eq('game_pin', roomCode)
          .single()

        if (sessionError || !sessionData) {
          console.error('[SupabaseRoomManager] Room not found in any database:', roomCode)
          return false
        }

        sessionStatus = sessionData.status
        participants = Array.isArray(sessionData.participants) ? [...sessionData.participants] : []
      }

      // Room not found in either database
      if (!sessionStatus) {
        console.error('[SupabaseRoomManager] Room not found:', roomCode)
        return false
      }

      if (sessionStatus !== 'waiting') {
        console.warn('[SupabaseRoomManager] Game already started')
        return false
      }

      // 🔧 FIX: Instead of rejecting duplicate nicknames, we now allow rejoin by cleaning up old entries
      // This handles the case when a player leaves and rejoins with the same nickname
      // The cleanup is done in addParticipant for Supabase B, and below for Supabase A (JSONB)

      // Generate player ID using XID format if Players DB configured, otherwise use short ID
      const playerId = isPlayersSupabaseConfigured()
        ? participantsApi.generatePlayerId()
        : Math.random().toString(36).substr(2, 9)

      // Create player object for JSONB
      const newPlayer = {
        id: playerId,
        user_id: userId || null, // Include user_id from profiles table
        nickname: player.nickname,
        avatar: player.avatar,
        joined_at: new Date().toISOString(),
        is_ready: true,
        is_host: false,
        score: 0,
        questions_answered: 0,
        memory_score: 0
      }

      // 🚀 WRITE TO SUPABASE B FIRST (Players DB) - Primary source
      // addParticipant now handles cleanup of old entries with same nickname
      if (isPlayersSupabaseConfigured()) {
        try {
          await participantsApi.addParticipant(
            roomCode,
            playerId,
            player.nickname,
            player.avatar,
            false, // not host
            userId || null // user_id from profiles table
          )
          console.log(`[SupabaseRoomManager] Player ${player.nickname} added to Supabase B with user_id: ${userId || 'null'}`)
        } catch (error) {
          console.error('[SupabaseRoomManager] Players DB insert failed:', error)
          // Try to continue with Supabase A
        }
      }

      // 🔄 ALSO WRITE TO SUPABASE A (JSONB) - For Realtime updates to host
      if (isSupabaseConfigured()) {
        // Refetch participants to ensure we have latest data for JSONB update
        const { data: latestSession } = await supabase
          .from('game_sessions')
          .select('participants')
          .eq('game_pin', roomCode)
          .single()

        // 🔧 FIX: Remove any existing participant with the same nickname before adding new one
        const latestParticipants = Array.isArray(latestSession?.participants)
          ? latestSession.participants.filter((p: any) => p.nickname !== player.nickname)
          : []
        latestParticipants.push(newPlayer)

        const { error: updateError } = await supabase
          .from('game_sessions')
          .update({ participants: latestParticipants })
          .eq('game_pin', roomCode)

        if (updateError) {
          console.warn('[SupabaseRoomManager] Error updating Supabase A (non-critical if B succeeded):', updateError)
          // If Supabase B succeeded, we can still return true
          if (isPlayersSupabaseConfigured()) {
            return true
          }
          return false
        }
      }

      console.log(`[SupabaseRoomManager] Player ${player.nickname} joined room ${roomCode} successfully`)
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
    // 🚀 FULL SUPABASE B: Only update Players DB during game
    // Data will be synced to Supabase A (JSONB) when game finishes
    if (isPlayersSupabaseConfigured() && quizScore !== undefined && questionsAnswered !== undefined) {
      try {
        const success = await participantsApi.updateScore(
          roomCode,
          playerId,
          quizScore,
          questionsAnswered
        )

        if (success) {
          return true
        }
      } catch (error) {
        console.warn('[SupabaseRoomManager] Players DB update failed, falling back to JSONB:', error)
      }
    }

    // Fallback to JSONB update only if Players DB not configured or failed
    return this.updateGameProgress(roomCode, playerId, { quizScore, questionsAnswered })
  }

  async startCountdown(roomCode: string, hostId: string, duration: number = 10): Promise<boolean> {
    try {
      const countdownStartTime = new Date().toISOString()

      // 🚀 SUPABASE B FIRST: Update for instant realtime
      if (isPlayersSupabaseConfigured()) {
        try {
          await sessionsApi.startCountdown(roomCode, duration)
          console.log('[SupabaseRoomManager] ✅ Countdown started in Supabase B')
        } catch (error) {
          console.warn('[SupabaseRoomManager] Failed to start countdown in Supabase B:', error)
        }
      }

      // Also update Supabase A - NOTE: Keep status as 'waiting' during countdown
      // Status 'active' should only be set when countdown finishes and quiz actually starts
      // Countdown is detected via countdown_started_at field
      const { error } = await supabase
        .from('game_sessions')
        .update({
          countdown_started_at: countdownStartTime,
          started_at: null
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
      // 🚀 SUPABASE B FIRST: Update for instant realtime
      if (isPlayersSupabaseConfigured()) {
        try {
          await sessionsApi.updateStatus(roomCode, 'active')
          console.log('[SupabaseRoomManager] ✅ Game started in Supabase B')
        } catch (error) {
          console.warn('[SupabaseRoomManager] Failed to start game in Supabase B:', error)
        }
      }

      // Also update Supabase A
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

      // 🚀 SUPABASE B FIRST: Update for instant realtime
      if (isPlayersSupabaseConfigured()) {
        try {
          await sessionsApi.updateStatus(roomCode, dbStatus as any)
          console.log('[SupabaseRoomManager] ✅ Status updated in Supabase B:', status)
        } catch (error) {
          console.warn('[SupabaseRoomManager] Failed to update status in Supabase B:', error)
        }
      }

      const updateData: any = { status: dbStatus }

      if (status === 'countdown') {
        updateData.countdown_started_at = new Date().toISOString()
      } else if (status === 'quiz') {
        updateData.started_at = new Date().toISOString()
      } else if (status === 'finished') {
        updateData.ended_at = new Date().toISOString()
      }

      // 🚀 GAME FINISHED: Sync all player data from Supabase B to Supabase A
      if (status === 'finished' && isPlayersSupabaseConfigured()) {
        try {
          console.log('[SupabaseRoomManager] Game finished - syncing players to main database...')

          // Get all players from Supabase B
          const playersFromB = await participantsApi.getParticipants(roomCode)
          console.log('[SupabaseRoomManager] Players from Supabase B:', playersFromB.length, playersFromB)

          if (playersFromB.length > 0) {
            // Convert to JSONB format for participants field
            const participantsForJsonb = playersFromB.map(p => ({
              id: p.id,
              user_id: p.user_id || null, // Include user_id from profiles table
              nickname: p.nickname,
              avatar: p.avatar || '/avatars/default.webp',
              joined_at: p.joined_at,
              started: p.started,
              ended: p.ended,
              is_ready: true,
              is_host: p.is_host,
              score: p.score || 0,
              questions_answered: p.questions_answered || 0
            }))

            // 🆕 Build responses array with answers for history
            const responsesForJsonb = playersFromB
              .filter(p => !p.is_host) // Exclude host from responses
              .map(p => ({
                id: p.id,
                user_id: p.user_id || null, // Include user_id from profiles table
                participant: p.id,
                nickname: p.nickname,
                score: p.score || 0,
                answers: p.answers || [],
                correct: (p.answers || []).filter((a: any) => a.is_correct).length,
                total_question: p.questions_answered || 0,
                accuracy: p.questions_answered > 0
                  ? ((p.answers || []).filter((a: any) => a.is_correct).length / p.questions_answered * 100).toFixed(2)
                  : "0.00",
                completion: true,
                duration: p.started && p.ended
                  ? Math.round((new Date(p.ended).getTime() - new Date(p.started).getTime()) / 1000)
                  : 0
              }))

            // Add to update data
            updateData.participants = participantsForJsonb
            updateData.responses = responsesForJsonb

            console.log(`[SupabaseRoomManager] ✅ Prepared ${playersFromB.length} players and ${responsesForJsonb.length} responses for sync`)
            console.log('[SupabaseRoomManager] Responses data:', JSON.stringify(responsesForJsonb, null, 2))
          } else {
            console.warn('[SupabaseRoomManager] ⚠️ No players found in Supabase B for room:', roomCode)
          }
        } catch (syncError) {
          console.error('[SupabaseRoomManager] ❌ Error syncing players on game finish:', syncError)
        }
      }

      // Update Supabase A (for historical data)
      console.log('[SupabaseRoomManager] Updating Supabase A with data:', {
        roomCode,
        status: updateData.status,
        hasParticipants: !!updateData.participants,
        hasResponses: !!updateData.responses,
        participantsCount: updateData.participants?.length,
        responsesCount: updateData.responses?.length,
        ended_at: updateData.ended_at
      })

      const { error, data } = await supabase
        .from('game_sessions')
        .update(updateData)
        .eq('game_pin', roomCode)
        .select()

      if (error) {
        console.error('[SupabaseRoomManager] ❌ Error updating Supabase A:', error)
        return false
      }

      console.log('[SupabaseRoomManager] ✅ Supabase A updated successfully:', data)
      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error updating game status:', error)
      return false
    }
  }

  async leaveRoom(roomCode: string, playerId: string): Promise<boolean> {
    try {
      // 🔄 WRITE TO SUPABASE A (JSONB) - For Realtime updates to host
      const { data: sessionData } = await supabase
        .from('game_sessions')
        .select('participants')
        .eq('game_pin', roomCode)
        .single()

      if (sessionData) {
        const participants = Array.isArray(sessionData.participants)
          ? sessionData.participants.filter((p: any) => p.id !== playerId)
          : []

        const { error } = await supabase
          .from('game_sessions')
          .update({ participants })
          .eq('game_pin', roomCode)

        if (error) {
          console.error('[SupabaseRoomManager] Error leaving room (JSONB):', error)
        }
      }

      // 🚀 ALSO REMOVE FROM SUPABASE B (Players DB)
      if (isPlayersSupabaseConfigured()) {
        try {
          await participantsApi.removeParticipant(roomCode, playerId)
          console.log(`[SupabaseRoomManager] Player ${playerId} removed from both databases`)
        } catch (error) {
          console.warn('[SupabaseRoomManager] Players DB remove failed (non-critical):', error)
        }
      }

      return true
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

  /**
   * Delete a room when host leaves
   * This will remove the session from both Supabase A and B
   * Players will be automatically kicked out when they detect room is null
   */
  async deleteRoom(roomCode: string, hostId: string): Promise<boolean> {
    try {
      console.log(`[SupabaseRoomManager] 🗑️ Host leaving - deleting room ${roomCode}`)

      // 🚀 SUPABASE B FIRST: Delete session and all participants
      if (isPlayersSupabaseConfigured()) {
        try {
          // Delete all participants first (foreign key constraint)
          await participantsApi.clearSession(roomCode)
          console.log(`[SupabaseRoomManager] ✅ Cleared participants from Supabase B`)

          // Delete session
          await sessionsApi.deleteSession(roomCode)
          console.log(`[SupabaseRoomManager] ✅ Deleted session from Supabase B`)
        } catch (error) {
          console.warn('[SupabaseRoomManager] Supabase B cleanup failed (non-critical):', error)
        }
      }

      // 🔄 DELETE FROM SUPABASE A (game_sessions)
      const { error } = await supabase
        .from('game_sessions')
        .delete()
        .eq('game_pin', roomCode)
        .eq('host_id', hostId)

      if (error) {
        console.error('[SupabaseRoomManager] Error deleting room from Supabase A:', error)
        return false
      }

      console.log(`[SupabaseRoomManager] ✅ Room ${roomCode} deleted successfully from all databases`)
      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error deleting room:', error)
      return false
    }
  }

  async subscribe(roomCode: string, callback: (room: Room | null) => void) {
    // Initialize lastRoomData with current room state
    const initialRoom = await this.getRoom(roomCode)
    if (initialRoom) {
      this.lastRoomData.set(roomCode, initialRoom)
      // Immediate callback for initial state
      callback(initialRoom)
    }

    // 🚀 INSTANT: No debounce - immediate callback for realtime updates
    const instantCallback = (updatedRoom: Room | null) => {
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
          memoryScore: p.memoryScore
        })).sort((a, b) => a.id.localeCompare(b.id))) !==
        JSON.stringify(updatedRoom?.players?.map(p => ({
          id: p.id,
          quizScore: p.quizScore,
          questionsAnswered: p.questionsAnswered,
          memoryScore: p.memoryScore
        })).sort((a, b) => a.id.localeCompare(b.id)))

      if (hasChanged && updatedRoom) {
        this.lastRoomData.set(roomCode, updatedRoom)
        callback(updatedRoom) // Immediate callback - no delay!
      }
    }

    // Subscribe to game_sessions changes (Supabase A - for status, settings)
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
          // Fetch complete room data to ensure we get players from both databases
          try {
            const updatedRoom = await this.getRoom(roomCode)
            if (updatedRoom) {
              instantCallback(updatedRoom)
            }
          } catch (err) {
            console.error('[SupabaseRoomManager] Error fetching room on update:', err)
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

    // 🚀 SUPABASE B: Subscribe to sessions table for realtime session updates - INSTANT UPDATE
    let sessionsUnsubscribe: (() => void) | null = null
    if (isPlayersSupabaseConfigured()) {
      sessionsUnsubscribe = sessionsApi.subscribeToSession(
        roomCode,
        async (session) => {
          // 🚀 INSTANT UPDATE: Update session data directly from realtime payload
          try {
            const lastRoom = this.lastRoomData.get(roomCode)
            if (lastRoom && session) {
              // Update room with new session data directly - NO FULL FETCH!
              const updatedRoom: Room = {
                ...lastRoom,
                status: this.mapSessionStatusToRoomStatus(session.status, session.countdown_started_at, session.started_at),
                countdownStartTime: session.countdown_started_at || undefined,
                startedAt: session.started_at || undefined,
                gameStarted: session.status !== 'waiting'
              }

              instantCallback(updatedRoom)
            } else {
              // Fallback to full fetch if no lastRoom
              const updatedRoom = await this.getRoom(roomCode)
              if (updatedRoom) {
                instantCallback(updatedRoom)
              }
            }
          } catch (err) {
            console.error('[SupabaseRoomManager] Error on session update:', err)
          }
        }
      )
    }

    // 🚀 SUPABASE B: Subscribe to participants table for score updates - INSTANT UPDATE
    let playersUnsubscribe: (() => void) | null = null
    if (isPlayersSupabaseConfigured()) {
      playersUnsubscribe = participantsApi.subscribeToParticipants(
        roomCode,
        async (participants) => {
          // 🚀 INSTANT UPDATE: Use lastRoomData and update players directly from realtime data
          try {
            const lastRoom = this.lastRoomData.get(roomCode)
            if (lastRoom) {
              // 🔧 FIX: Always update players, even if empty (all players kicked)
              // Convert participants to players directly - NO FETCH!
              const updatedPlayers = participants.map(p => this._convertParticipantToPlayer(p))

              const updatedRoom: Room = {
                ...lastRoom,
                players: updatedPlayers
              }

              instantCallback(updatedRoom)
            } else {
              // Fallback to fetch if no lastRoom
              const updatedRoom = await this.getRoom(roomCode)
              if (updatedRoom) {
                instantCallback(updatedRoom)
              }
            }
          } catch (err) {
            console.error('[SupabaseRoomManager] Error on players update:', err)
          }
        }
      )
    }

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

      // Unsubscribe from Supabase B sessions
      if (sessionsUnsubscribe) {
        sessionsUnsubscribe()
      }

      // Unsubscribe from Supabase B participants
      if (playersUnsubscribe) {
        playersUnsubscribe()
      }
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
      // 1. Try to use RPC for atomic update (prevents race conditions)
      const { error: rpcError } = await supabase.rpc('update_player_progress', {
        p_game_pin: roomCode,
        p_player_id: playerId,
        p_quiz_score: progress.quizScore,
        p_questions_answered: progress.questionsAnswered,
        p_memory_progress: progress.memoryProgress || null
      })

      if (!rpcError) {
        return true
      }

      // If RPC fails (e.g. function doesn't exist), fallback to legacy method
      // Only log warning if it's not a "function not found" error to avoid noise
      if (rpcError.code !== 'PGRST202') { // PGRST202 is "function not found" usually, but Supabase might return different codes
        console.warn('[SupabaseRoomManager] RPC update failed, falling back to manual update:', rpcError.message)
      }

      // 2. Fallback: Get current game session (Legacy Method - Prone to Race Conditions)
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
