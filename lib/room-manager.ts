import { supabaseRoomManager, type Player, type Room } from './supabase-room-manager'

// Re-export types for backward compatibility
export type { Player, Room }

class RoomManager {
  // Wrapper class that uses Supabase Room Manager
  // This maintains backward compatibility with existing code

  generateRoomCode(): string {
    return supabaseRoomManager.generateRoomCode()
  }

  async createRoom(hostId: string, settings: Room["settings"], quizId?: string, quizTitle?: string): Promise<Room | null> {
    if (!quizId || !quizTitle) {
      console.error("[RoomManager] Quiz ID and title are required for Supabase integration")
      return null
    }
    return await supabaseRoomManager.createRoom(hostId, settings, quizId, quizTitle)
  }

  createRoomWithCode(roomCode: string, hostId: string, settings: Room["settings"]): Room | null {
    console.warn("[RoomManager] createRoomWithCode is deprecated. Use createRoom instead.")
    return null
  }

  async getRoom(roomCode: string): Promise<Room | null> {
    return await supabaseRoomManager.getRoom(roomCode)
  }

  async joinRoom(roomCode: string, player: Omit<Player, "id" | "joinedAt" | "isReady" | "isHost">, userId?: string): Promise<boolean> {
    return await supabaseRoomManager.joinRoom(roomCode, player, userId)
  }

  async rejoinRoom(roomCode: string, player: Omit<Player, "joinedAt" | "isReady" | "isHost">, userId?: string): Promise<boolean> {
    return await supabaseRoomManager.rejoinRoom(roomCode, player, userId)
  }

  async updatePlayerScore(roomCode: string, playerId: string, quizScore?: number, questionsAnswered?: number): Promise<boolean> {
    return await supabaseRoomManager.updatePlayerScore(roomCode, playerId, quizScore, questionsAnswered)
  }

  async startCountdown(roomCode: string, hostId: string, duration: number = 10): Promise<boolean> {
    return await supabaseRoomManager.startCountdown(roomCode, hostId, duration)
  }

  async startGame(roomCode: string, hostId: string): Promise<boolean> {
    return await supabaseRoomManager.startGame(roomCode, hostId)
  }

  async updateGameStatus(roomCode: string, status: Room["status"]): Promise<boolean> {
    return await supabaseRoomManager.updateGameStatus(roomCode, status)
  }

  async leaveRoom(roomCode: string, playerId: string): Promise<boolean> {
    return await supabaseRoomManager.leaveRoom(roomCode, playerId)
  }

  async kickPlayer(roomCode: string, playerId: string, hostId: string): Promise<boolean> {
    return await supabaseRoomManager.kickPlayer(roomCode, playerId, hostId)
  }

  async deleteRoom(roomCode: string, hostId: string): Promise<boolean> {
    return await supabaseRoomManager.deleteRoom(roomCode, hostId)
  }

  async subscribe(roomCode: string, callback: (room: Room | null) => void) {
    return await supabaseRoomManager.subscribe(roomCode, callback)
  }

  async isPlayerKicked(roomCode: string, nickname: string): Promise<boolean> {
    return await supabaseRoomManager.isPlayerKicked(roomCode, nickname)
  }

  // 🆕 NEW: Get profile ID from profiles table by email
  async getProfileIdByEmail(email: string): Promise<string | null> {
    return await supabaseRoomManager.getProfileIdByEmail(email)
  }

  isChannelConnected(): boolean {
    return true // Supabase is always connected
  }

  cleanup() {
    supabaseRoomManager.cleanup()
  }
}

export const roomManager = new RoomManager()
