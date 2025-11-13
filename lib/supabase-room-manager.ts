import { supabase, isSupabaseConfigured } from './supabase'

export interface Player {
  id: string
  username: string
  avatar: string
  joinedAt: string
  isReady: boolean
  isHost: boolean
  quizScore?: number
  memoryScore?: number
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

  async createRoom(hostId: string, settings: Room["settings"], quizId: string, quizTitle: string): Promise<Room | null> {
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        console.warn('[SupabaseRoomManager] Supabase not configured, returning null')
        return null
      }

      const roomCode = this.generateRoomCode()
      
      // Create room in database
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
          room_code: roomCode,
          host_name: `Host-${hostId.slice(0, 6)}`,
          quiz_id: quizId,
          quiz_title: quizTitle,
          time_limit: settings.totalTimeLimit,
          question_count: settings.questionCount,
          status: 'waiting'
        })
        .select()
        .single()

      if (roomError) {
        console.error('[SupabaseRoomManager] Error creating room:', roomError)
        return null
      }

      // Don't create host player - host is not a player in the game
      const room: Room = {
        code: roomCode,
        hostId,
        players: [], // Start with empty players array
        settings,
        status: 'waiting',
        createdAt: roomData.created_at,
        startedAt: roomData.started_at,
        gameStarted: false
      }

      // Room created successfully
      return room
    } catch (error) {
      console.error('[SupabaseRoomManager] Error creating room:', error)
      return null
    }
  }

  async getRoom(roomCode: string): Promise<Room | null> {
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        console.warn('[SupabaseRoomManager] Supabase not configured, returning null')
        return null
      }

      // Get room data
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single()

      if (roomError || !roomData) {
        // Room not found
        return null
      }

      // Get players data (exclude host players)
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomData.id)
        .eq('is_host', false) // Only get non-host players
        .order('joined_at', { ascending: true })

      if (playersError) {
        console.error('[SupabaseRoomManager] Error fetching players:', playersError)
        return null
      }

      const players: Player[] = playersData.map(player => ({
        id: player.id,
        username: player.username,
        avatar: player.avatar,
        joinedAt: player.joined_at,
        isReady: true, // Always ready for now
        isHost: false, // All players in this list are non-host
        quizScore: player.quiz_score,
        memoryScore: player.memory_game_score,
        questionsAnswered: player.questions_answered
      }))

      const room: Room = {
        code: roomData.room_code,
        hostId: roomData.host_name, // Using host_name as hostId for now
        players,
        settings: {
          questionCount: roomData.question_count,
          totalTimeLimit: roomData.time_limit
        },
        status: roomData.status as Room["status"],
        createdAt: roomData.created_at,
        startedAt: roomData.started_at,
        gameStarted: roomData.status !== 'waiting',
        countdownStartTime: roomData.countdown_start_time,
        countdownDuration: roomData.countdown_duration
      }

      return room
    } catch (error) {
      console.error('[SupabaseRoomManager] Error getting room:', error)
      return null
    }
  }

  async joinRoom(roomCode: string, player: Omit<Player, "id" | "joinedAt" | "isReady" | "isHost">): Promise<boolean> {
    try {
      // Get room data
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single()

      if (roomError || !roomData) {
        console.error('[SupabaseRoomManager] Room not found for join:', roomCode)
        return false
      }

      if (roomData.status !== 'waiting') {
        console.error('[SupabaseRoomManager] Game already started')
        return false
      }

      // Create player in database
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: roomData.id,
          username: player.username,
          avatar: player.avatar,
          is_host: false // Ensure player is not host
        })
        .select()
        .single()

      if (playerError) {
        console.error('[SupabaseRoomManager] Error creating player:', playerError)
        return false
      }

      // Player joined successfully
      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error joining room:', error)
      return false
    }
  }

  async rejoinRoom(roomCode: string, player: Omit<Player, "joinedAt" | "isReady" | "isHost">): Promise<boolean> {
    try {
      // Get room data
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single()

      if (roomError || !roomData) {
        console.error('[SupabaseRoomManager] Room not found for rejoin:', roomCode)
        return false
      }

      if (roomData.status !== 'waiting') {
        console.error('[SupabaseRoomManager] Game already started')
        return false
      }

      // Check if player exists
      const { data: existingPlayer, error: checkError } = await supabase
        .from('players')
        .select('*')
        .eq('id', player.id)
        .eq('room_id', roomData.id)
        .single()

      if (existingPlayer) {
        // Player exists, update last_active
        const { error: updateError } = await supabase
          .from('players')
          .update({ last_active: new Date().toISOString() })
          .eq('id', player.id)

        if (updateError) {
          console.error('[SupabaseRoomManager] Error updating player:', updateError)
          return false
        }

        // Player rejoined (existing)
        return true
      } else {
        // Player doesn't exist, create new one
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .insert({
            id: player.id,
            room_id: roomData.id,
            username: player.username,
            avatar: player.avatar,
            is_host: false
          })
          .select()
          .single()

        if (playerError) {
          console.error('[SupabaseRoomManager] Error creating player:', playerError)
          return false
        }

        // Player rejoined (new)
        return true
      }
    } catch (error) {
      console.error('[SupabaseRoomManager] Error rejoining room:', error)
      return false
    }
  }

  async leaveRoom(roomCode: string, playerId: string): Promise<boolean> {
    try {
      // Get room data
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single()

      if (roomError || !roomData) {
        console.error('[SupabaseRoomManager] Room not found for leave:', roomCode)
        return false
      }

      // Delete player
      const { error: deleteError } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId)
        .eq('room_id', roomData.id)

      if (deleteError) {
        console.error('[SupabaseRoomManager] Error deleting player:', deleteError)
        return false
      }

      // Player left successfully
      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error leaving room:', error)
      return false
    }
  }

  async kickPlayer(roomCode: string, playerId: string, hostId: string): Promise<boolean> {
    try {
      // Get room data and verify host
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single()

      if (roomError || !roomData) {
        console.error('[SupabaseRoomManager] Room not found for kick:', roomCode)
        return false
      }

      // Verify the requester is the host
      // host_name is stored as "Host-{hostId.slice(0, 6)}" so we need to check if hostId starts with the same prefix
      const expectedHostName = `Host-${hostId.slice(0, 6)}`
      if (roomData.host_name !== expectedHostName) {
        console.error('[SupabaseRoomManager] Host verification failed:', { host_name: roomData.host_name, hostId, expectedHostName })
        return false
      }

      // Get player info before deleting
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('username')
        .eq('id', playerId)
        .eq('room_id', roomData.id)
        .single()

      if (playerError || !playerData) {
        console.error('[SupabaseRoomManager] Player not found for kick:', playerId)
        return false
      }

      // Delete player
      const { error: deleteError } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId)
        .eq('room_id', roomData.id)

      if (deleteError) {
        console.error('[SupabaseRoomManager] Error kicking player:', deleteError)
        return false
      }

      // Player kicked successfully
      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error kicking player:', error)
      return false
    }
  }

  async startCountdown(roomCode: string, hostId: string, duration: number = 10): Promise<boolean> {
    try {
      console.log('[SupabaseRoomManager] Starting countdown for room:', roomCode, 'host:', hostId, 'duration:', duration)
      
      // Get room data
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single()

      if (roomError || !roomData) {
        console.error('[SupabaseRoomManager] Room not found for countdown:', roomCode, 'error:', roomError)
        return false
      }

      console.log('[SupabaseRoomManager] Found room data:', roomData)

      const countdownStartTime = new Date().toISOString()
      console.log('[SupabaseRoomManager] Countdown start time:', countdownStartTime)

      // Update room status to countdown
      const updateData = { 
        status: 'countdown',
        countdown_start_time: countdownStartTime,
        countdown_duration: duration,
        updated_at: countdownStartTime // Add updated_at field to satisfy Supabase audit
      }
      
      console.log('[SupabaseRoomManager] Updating room with data:', updateData)
      
      const { error: updateError } = await supabase
        .from('rooms')
        .update(updateData)
        .eq('room_code', roomCode)

      if (updateError) {
        console.error('[SupabaseRoomManager] Error starting countdown:', updateError)
        return false
      }

      console.log('[SupabaseRoomManager] Countdown started successfully')
      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error starting countdown:', error)
      return false
    }
  }

  async startGame(roomCode: string, hostId: string): Promise<boolean> {
    try {
      // Get room data
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single()

      if (roomError || !roomData) {
        console.error('[SupabaseRoomManager] Room not found for start:', roomCode)
        return false
      }

      const startedAtTime = new Date().toISOString()

      // Update room status
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ 
          status: 'quiz',
          started_at: startedAtTime
        })
        .eq('room_code', roomCode)

      if (updateError) {
        console.error('[SupabaseRoomManager] Error starting game:', updateError)
        return false
      }

      // Game started
      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error starting game:', error)
      return false
    }
  }

  async updateGameStatus(roomCode: string, status: Room["status"]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ status })
        .eq('room_code', roomCode)

      if (error) {
        console.error('[SupabaseRoomManager] Error updating game status:', error)
        return false
      }

      console.log('[SupabaseRoomManager] Game status updated:', roomCode, status)
      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error updating game status:', error)
      return false
    }
  }

  async updatePlayerScore(roomCode: string, playerId: string, quizScore?: number, memoryScore?: number, questionsAnswered?: number): Promise<boolean> {
    try {
      // Get current game progress
      const { data: currentPlayer } = await supabase
        .from('players')
        .select('game_progress, quiz_score, memory_game_score, questions_answered')
        .eq('id', playerId)
        .single()

      if (!currentPlayer) {
        console.error('[SupabaseRoomManager] Player not found:', playerId)
        return false
      }

      // Build new game progress (make updates monotonic - never decrease counts/scores)
      const currentProgress = currentPlayer.game_progress || {}

      const currentQuizScore = currentPlayer.quiz_score || 0
      const currentMemoryScore = currentPlayer.memory_game_score || 0
      const currentQuestionsAnswered = currentPlayer.questions_answered || 0

      const quizScoreToWrite = quizScore !== undefined ? Math.max(currentQuizScore, quizScore) : currentQuizScore
      const memoryScoreToWrite = memoryScore !== undefined ? Math.max(currentMemoryScore, memoryScore) : currentMemoryScore
      const questionsAnsweredToWrite = questionsAnswered !== undefined ? Math.max(currentQuestionsAnswered, questionsAnswered) : currentQuestionsAnswered

      const newProgress = {
        ...currentProgress,
        quiz_score: quizScoreToWrite,
        memory_score: memoryScoreToWrite,
        questions_answered: questionsAnsweredToWrite,
        updated_at: new Date().toISOString()
      }

      // Update both old fields (for backward compatibility) and new JSONB field
      const updateData: any = {
        game_progress: newProgress,
        last_activity: new Date().toISOString()
      }
      
  // Ensure legacy fields are also monotonic
  if (quizScore !== undefined) updateData.quiz_score = quizScoreToWrite
  if (memoryScore !== undefined) updateData.memory_game_score = memoryScoreToWrite
  if (questionsAnswered !== undefined) updateData.questions_answered = questionsAnsweredToWrite

      console.log('[SupabaseRoomManager] 🚀 ATTEMPTING player score update:', {
        playerId,
        roomCode,
        updateData,
        timestamp: new Date().toISOString()
      })

      const { data, error, count } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', playerId)
        .select()

      if (error) {
        console.error('[SupabaseRoomManager] ❌ ERROR updating player score:', {
          error,
          playerId,
          updateData,
          errorCode: error.code,
          errorMessage: error.message
        })
        return false
      }

      // Verify the update was successful
      if (!data || data.length === 0) {
        console.error('[SupabaseRoomManager] ⚠️ WARNING: Update returned no data, player may not exist:', {
          playerId,
          updateData,
          returnedData: data
        })
        return false
      }

      console.log('[SupabaseRoomManager] ✅ Player score updated successfully:', {
        playerId,
        updateData,
        updatedRecord: data[0],
        timestamp: new Date().toISOString()
      })

  // Double-check the update by reading back the data
      const { data: verifyData, error: verifyError } = await supabase
        .from('players')
        .select('quiz_score, memory_game_score, questions_answered')
        .eq('id', playerId)
        .single()

      if (verifyError) {
        console.warn('[SupabaseRoomManager] ⚠️ Could not verify update:', verifyError)
      } else {
        console.log('[SupabaseRoomManager] 🔍 VERIFICATION - Current player data:', {
          playerId,
          currentData: verifyData,
          expectedData: updateData
        })

        // Check if the update was actually applied
        const isVerified = (
          // Verify using the monotonic values we wrote
          (quizScore === undefined || verifyData.quiz_score === quizScoreToWrite) &&
          (memoryScore === undefined || verifyData.memory_game_score === memoryScoreToWrite) &&
          (questionsAnswered === undefined || verifyData.questions_answered === questionsAnsweredToWrite)
        )

        if (!isVerified) {
          console.error('[SupabaseRoomManager] 💥 VERIFICATION FAILED - Update not applied correctly:', {
            expected: updateData,
            actual: verifyData
          })
          return false
        }

        console.log('[SupabaseRoomManager] ✅ VERIFICATION PASSED - Update confirmed')
      }

      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] 💥 EXCEPTION during player score update:', {
        error,
        playerId,
        roomCode,
        updateData: { quizScore, memoryScore, questionsAnswered }
      })
      return false
    }
  }

  async isPlayerKicked(roomCode: string, username: string): Promise<boolean> {
    // Always return false since we removed kick prevention
    return false
  }

  async subscribe(roomCode: string, callback: (room: Room | null) => void) {
    // Get room ID first
    const roomId = await this.getRoomId(roomCode)
    if (!roomId) {
      console.error('[SupabaseRoomManager] Could not get room ID for subscription')
      return () => {}
    }

    // Initialize lastRoomData with current room state to ensure proper comparison
    // Also trigger initial callback to ensure UI is in sync
    const initialRoom = await this.getRoom(roomCode)
    if (initialRoom) {
      this.lastRoomData.set(roomCode, initialRoom)
      // Trigger initial callback to ensure UI is synced with current state
      // Use a small delay to ensure subscription is fully set up first
      setTimeout(() => {
        callback(initialRoom)
      }, 100)
    }

    // Reduced debounce delay for faster updates, especially for player joins and score updates
    const DEBOUNCE_DELAY = 100 // 100ms debounce for faster response
    
    const debouncedCallback = (updatedRoom: Room | null, immediate: boolean = false) => {
      // For immediate updates (like player join/leave or score updates), skip debounce
      if (immediate) {
        const lastRoom = this.lastRoomData.get(roomCode)
        // Enhanced change detection to include score and progress changes
        const hasChanged = !lastRoom || 
          lastRoom.status !== updatedRoom?.status ||
          lastRoom.players?.length !== updatedRoom?.players?.length ||
          lastRoom.countdownStartTime !== updatedRoom?.countdownStartTime ||
          JSON.stringify(lastRoom.players?.map(p => p.id).sort()) !== JSON.stringify(updatedRoom?.players?.map(p => p.id).sort()) ||
          // Check for score/progress changes
          JSON.stringify(lastRoom.players?.map(p => ({ id: p.id, quizScore: p.quizScore, memoryScore: p.memoryScore, questionsAnswered: p.questionsAnswered })).sort((a, b) => a.id.localeCompare(b.id))) !== 
          JSON.stringify(updatedRoom?.players?.map(p => ({ id: p.id, quizScore: p.quizScore, memoryScore: p.memoryScore, questionsAnswered: p.questionsAnswered })).sort((a, b) => a.id.localeCompare(b.id)))
        
        if (hasChanged && updatedRoom) {
          this.lastRoomData.set(roomCode, updatedRoom)
          callback(updatedRoom)
        }
        return
      }

      // Clear existing timer for this room
      const existingTimer = this.debounceTimers.get(roomCode)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }
      
      // Set new timer
      const timer = setTimeout(() => {
        // Only call callback if data actually changed
        const lastRoom = this.lastRoomData.get(roomCode)
        // Enhanced change detection to include score and progress changes
        const hasChanged = !lastRoom || 
          lastRoom.status !== updatedRoom?.status ||
          lastRoom.players?.length !== updatedRoom?.players?.length ||
          lastRoom.countdownStartTime !== updatedRoom?.countdownStartTime ||
          JSON.stringify(lastRoom.players?.map(p => p.id).sort()) !== JSON.stringify(updatedRoom?.players?.map(p => p.id).sort()) ||
          // Check for score/progress changes
          JSON.stringify(lastRoom.players?.map(p => ({ id: p.id, quizScore: p.quizScore, memoryScore: p.memoryScore, questionsAnswered: p.questionsAnswered })).sort((a, b) => a.id.localeCompare(b.id))) !== 
          JSON.stringify(updatedRoom?.players?.map(p => ({ id: p.id, quizScore: p.quizScore, memoryScore: p.memoryScore, questionsAnswered: p.questionsAnswered })).sort((a, b) => a.id.localeCompare(b.id)))
        
        if (hasChanged && updatedRoom) {
          this.lastRoomData.set(roomCode, updatedRoom)
          callback(updatedRoom)
        } else if (!hasChanged) {
          console.log('[SupabaseRoomManager] No changes detected, skipping callback')
        }
        
        this.debounceTimers.delete(roomCode)
      }, DEBOUNCE_DELAY)
      
      this.debounceTimers.set(roomCode, timer)
    }

    // Setting up subscription for room

    // Subscribe to room changes
    const roomSubscription = supabase
      .channel(`room-${roomCode}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'rooms',
          filter: `room_code=eq.${roomCode}`
        }, 
        async (payload) => {
          // Only fetch room data when room table changes
          const updatedRoom = await this.getRoom(roomCode)
          if (updatedRoom) {
            debouncedCallback(updatedRoom)
          }
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'players',
          filter: `room_id=eq.${roomId}`
        }, 
        async (payload) => {
          // Log player changes for debugging
          if (payload.eventType === 'INSERT') {
            console.log('[SupabaseRoomManager] ✅ Player joined:', payload.new?.username)
          } else if (payload.eventType === 'DELETE') {
            console.log('[SupabaseRoomManager] ❌ Player left:', payload.old?.username)
          } else if (payload.eventType === 'UPDATE') {
            // Log score updates for debugging
            const oldData = payload.old
            const newData = payload.new
            if (oldData && newData && (
              oldData.quiz_score !== newData.quiz_score ||
              oldData.memory_game_score !== newData.memory_game_score ||
              oldData.questions_answered !== newData.questions_answered
            )) {
              console.log('[SupabaseRoomManager] 📊 Player score updated:', {
                username: newData.username,
                quizScore: newData.quiz_score,
                memoryScore: newData.memory_game_score,
                questionsAnswered: newData.questions_answered
              })
            }
          }
          
          // For player join/leave/score updates, use immediate callback (no debounce) for faster updates
          const isPlayerChange = payload.eventType === 'INSERT' || payload.eventType === 'DELETE' || payload.eventType === 'UPDATE'
          
          // Fetch updated room data
          const updatedRoom = await this.getRoom(roomCode)
          if (updatedRoom) {
            // Use immediate callback for player changes and score updates to show changes instantly
            debouncedCallback(updatedRoom, isPlayerChange)
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
      // Clear debounce timer for this room
      const timer = this.debounceTimers.get(roomCode)
      if (timer) {
        clearTimeout(timer)
        this.debounceTimers.delete(roomCode)
      }
      
      // Clear cached room data
      this.lastRoomData.delete(roomCode)
      
      console.log('[SupabaseRoomManager] Unsubscribing from room:', roomCode)
      roomSubscription.unsubscribe()
      this.subscriptions.delete(roomCode)
      this.listeners.delete(callback)
    }
  }

  private async getRoomId(roomCode: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_code', roomCode)
        .single()

      if (error || !data) return null
      return data.id
    } catch (error) {
      console.error('[SupabaseRoomManager] Error getting room ID:', error)
      return null
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
      memoryScore?: number
      questionsAnswered?: number
      memoryProgress?: any
    }
  ): Promise<boolean> {
    try {
      // Get current progress
      const { data: currentPlayer } = await supabase
        .from('players')
        .select('game_progress, memory_game_progress')
        .eq('id', playerId)
        .single()

      if (!currentPlayer) {
        console.error('[SupabaseRoomManager] Player not found:', playerId)
        return false
      }

      // Build new progress
      const currentGameProgress = currentPlayer.game_progress || {}
      const currentMemoryProgress = currentPlayer.memory_game_progress || {}

      // Monotonic updates: never decrease numeric values
      const existingQuizScore = currentGameProgress.quiz_score || 0
      const existingQuestionsAnswered = currentGameProgress.questions_answered || 0
      const existingCorrectAnswers = currentGameProgress.correct_answers || 0
      const existingCurrentQuestion = currentGameProgress.current_question || 0

      const quizScoreToWrite = progress.quizScore !== undefined ? Math.max(existingQuizScore, progress.quizScore) : existingQuizScore
      const questionsAnsweredToWrite = progress.questionsAnswered !== undefined ? Math.max(existingQuestionsAnswered, progress.questionsAnswered) : existingQuestionsAnswered
      const correctAnswersToWrite = progress.correctAnswers !== undefined ? Math.max(existingCorrectAnswers, progress.correctAnswers) : existingCorrectAnswers
      const currentQuestionToWrite = progress.currentQuestion !== undefined ? Math.max(existingCurrentQuestion, progress.currentQuestion) : existingCurrentQuestion

      const newGameProgress = {
        ...currentGameProgress,
        current_question: currentQuestionToWrite,
        correct_answers: correctAnswersToWrite,
        quiz_score: quizScoreToWrite,
        questions_answered: questionsAnsweredToWrite,
        updated_at: new Date().toISOString()
      }

      const newMemoryProgress = {
        ...currentMemoryProgress,
        ...progress.memoryProgress,
        updated_at: new Date().toISOString()
      }

      const updateData: any = {
        game_progress: newGameProgress,
        memory_game_progress: newMemoryProgress,
        last_activity: new Date().toISOString()
      }

      // Also update legacy fields for backward compatibility
  // Ensure legacy fields are written with monotonic values
  if (progress.quizScore !== undefined) updateData.quiz_score = quizScoreToWrite
  if (progress.memoryScore !== undefined) updateData.memory_game_score = progress.memoryScore
  if (progress.questionsAnswered !== undefined) updateData.questions_answered = questionsAnsweredToWrite
  if (progress.currentQuestion !== undefined) updateData.current_question = currentQuestionToWrite
  if (progress.correctAnswers !== undefined) updateData.correct_answers = correctAnswersToWrite

      const { error } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', playerId)

      if (error) {
        console.error('[SupabaseRoomManager] Error updating game progress:', error)
        return false
      }

      console.log('[SupabaseRoomManager] ✅ Game progress updated successfully:', {
        playerId,
        roomCode,
        progress,
        timestamp: new Date().toISOString()
      })

      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error in updateGameProgress:', error)
      return false
    }
  }

  // Get player game progress
  async getPlayerGameProgress(roomCode: string, playerId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('game_progress, memory_game_progress, quiz_score, memory_game_score, questions_answered, current_question, correct_answers')
        .eq('id', playerId)
        .single()

      if (error) {
        console.error('[SupabaseRoomManager] Error getting player game progress:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('[SupabaseRoomManager] Error in getPlayerGameProgress:', error)
      return null
    }
  }

  // Update room game state
  async updateRoomGameState(roomCode: string, gameState: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ 
          game_state: gameState,
          updated_at: new Date().toISOString()
        })
        .eq('room_code', roomCode)

      if (error) {
        console.error('[SupabaseRoomManager] Error updating room game state:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error in updateRoomGameState:', error)
      return false
    }
  }

  // Get room game state
  async getRoomGameState(roomCode: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('game_state, status, memory_game_active, memory_game_players')
        .eq('room_code', roomCode)
        .single()

      if (error) {
        console.error('[SupabaseRoomManager] Error getting room game state:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('[SupabaseRoomManager] Error in getRoomGameState:', error)
      return null
    }
  }
}

export const supabaseRoomManager = new SupabaseRoomManager()
