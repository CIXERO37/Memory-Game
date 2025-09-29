import { supabase } from './supabase'

export interface Player {
  id: string
  username: string
  avatar: string
  joinedAt: string
  isReady: boolean
  isHost: boolean
  quizScore?: number
  memoryScore?: number
}

export interface Room {
  code: string
  hostId: string
  players: Player[]
  settings: {
    questionCount: number
    timePerQuestion: number
  }
  status: "waiting" | "countdown" | "quiz" | "memory" | "finished"
  createdAt: string
  gameStarted: boolean
  countdownStartTime?: string
  countdownDuration?: number
}

class SupabaseRoomManager {
  private listeners: Set<(room: Room | null) => void> = new Set()
  private subscriptions: Map<string, any> = new Map()

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
      const roomCode = this.generateRoomCode()
      
      // Create room in database
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
          room_code: roomCode,
          host_name: `Host-${hostId.slice(0, 6)}`,
          quiz_id: quizId,
          quiz_title: quizTitle,
          time_limit: settings.timePerQuestion,
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
        gameStarted: false
      }

      console.log('[SupabaseRoomManager] Room created:', room)
      return room
    } catch (error) {
      console.error('[SupabaseRoomManager] Error creating room:', error)
      return null
    }
  }

  async getRoom(roomCode: string): Promise<Room | null> {
    try {
      // Get room data
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single()

      if (roomError || !roomData) {
        console.log('[SupabaseRoomManager] Room not found:', roomCode)
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
        memoryScore: player.memory_game_score
      }))

      const room: Room = {
        code: roomData.room_code,
        hostId: roomData.host_name, // Using host_name as hostId for now
        players,
        settings: {
          questionCount: roomData.question_count,
          timePerQuestion: roomData.time_limit
        },
        status: roomData.status as Room["status"],
        createdAt: roomData.created_at,
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

      console.log('[SupabaseRoomManager] Player joined:', playerData)
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

        console.log('[SupabaseRoomManager] Player rejoined (existing):', existingPlayer)
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

        console.log('[SupabaseRoomManager] Player rejoined (new):', playerData)
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

      console.log('[SupabaseRoomManager] Player left:', playerId)
      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error leaving room:', error)
      return false
    }
  }

  async startCountdown(roomCode: string, hostId: string, duration: number = 10): Promise<boolean> {
    try {
      // Get room data
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single()

      if (roomError || !roomData) {
        console.error('[SupabaseRoomManager] Room not found for countdown:', roomCode)
        return false
      }

      const countdownStartTime = new Date().toISOString()

      // Update room status to countdown
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ 
          status: 'countdown',
          countdown_start_time: countdownStartTime,
          countdown_duration: duration
        })
        .eq('room_code', roomCode)

      if (updateError) {
        console.error('[SupabaseRoomManager] Error starting countdown:', updateError)
        return false
      }

      console.log('[SupabaseRoomManager] Countdown started:', roomCode, 'Duration:', duration)
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

      // Update room status
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ 
          status: 'quiz',
          started_at: new Date().toISOString()
        })
        .eq('room_code', roomCode)

      if (updateError) {
        console.error('[SupabaseRoomManager] Error starting game:', updateError)
        return false
      }

      console.log('[SupabaseRoomManager] Game started:', roomCode)
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

  async updatePlayerScore(roomCode: string, playerId: string, quizScore?: number, memoryScore?: number): Promise<boolean> {
    try {
      const updateData: any = {}
      if (quizScore !== undefined) updateData.quiz_score = quizScore
      if (memoryScore !== undefined) updateData.memory_game_score = memoryScore

      const { error } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', playerId)

      if (error) {
        console.error('[SupabaseRoomManager] Error updating player score:', error)
        return false
      }

      console.log('[SupabaseRoomManager] Player score updated:', playerId, updateData)
      return true
    } catch (error) {
      console.error('[SupabaseRoomManager] Error updating player score:', error)
      return false
    }
  }

  async subscribe(roomCode: string, callback: (room: Room | null) => void) {
    // Get room ID first
    const roomId = await this.getRoomId(roomCode)
    if (!roomId) {
      console.error('[SupabaseRoomManager] Could not get room ID for subscription')
      return () => {}
    }

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
          console.log('[SupabaseRoomManager] Room data changed:', payload.eventType, payload)
          const updatedRoom = await this.getRoom(roomCode)
          if (updatedRoom) {
            callback(updatedRoom)
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
          console.log('[SupabaseRoomManager] Players data changed:', payload.eventType, payload)
          
          // Log specific player actions
          if (payload.eventType === 'INSERT') {
            console.log('[SupabaseRoomManager] New player joined:', payload.new)
          } else if (payload.eventType === 'DELETE') {
            console.log('[SupabaseRoomManager] Player left:', payload.old)
          } else if (payload.eventType === 'UPDATE') {
            console.log('[SupabaseRoomManager] Player updated:', payload.new)
          }
          
          const updatedRoom = await this.getRoom(roomCode)
          if (updatedRoom) {
            callback(updatedRoom)
          }
        }
      )
      .subscribe((status) => {
        console.log('[SupabaseRoomManager] Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('[SupabaseRoomManager] Successfully subscribed to room updates for:', roomCode)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[SupabaseRoomManager] Subscription error for room:', roomCode)
        }
      })

    this.subscriptions.set(roomCode, roomSubscription)
    this.listeners.add(callback)

    return () => {
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

  cleanup() {
    // Unsubscribe from all channels
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe()
    })
    this.subscriptions.clear()
    this.listeners.clear()
  }
}

export const supabaseRoomManager = new SupabaseRoomManager()
