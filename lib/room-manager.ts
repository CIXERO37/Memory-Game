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

  async joinRoom(roomCode: string, player: Omit<Player, "id" | "joinedAt" | "isReady" | "isHost">): Promise<boolean> {
    return await supabaseRoomManager.joinRoom(roomCode, player)
  }

  async rejoinRoom(roomCode: string, player: Omit<Player, "joinedAt" | "isReady" | "isHost">): Promise<boolean> {
    return await supabaseRoomManager.rejoinRoom(roomCode, player)
  }

  async updatePlayerScore(roomCode: string, playerId: string, quizScore?: number, memoryScore?: number): Promise<boolean> {
    return await supabaseRoomManager.updatePlayerScore(roomCode, playerId, quizScore, memoryScore)
  }

  updatePlayerMemoryScore(roomCode: string, playerId: string, memoryScore: number): Promise<boolean> {
    return this.updatePlayerScore(roomCode, playerId, undefined, memoryScore)
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

  deleteRoom(roomCode: string, hostId: string): boolean {
    console.warn("[RoomManager] deleteRoom is deprecated. Rooms are managed by Supabase.")
    return false
  }

  async subscribe(roomCode: string, callback: (room: Room | null) => void) {
    return await supabaseRoomManager.subscribe(roomCode, callback)
  }

  isChannelConnected(): boolean {
    return true // Supabase is always connected
  }

  cleanup() {
    supabaseRoomManager.cleanup()
  }
}
  
  export const roomManager = new RoomManager()
  