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
    status: "waiting" | "quiz" | "memory" | "finished"
    createdAt: string
    gameStarted: boolean
  }
  
  class RoomManager {
    private channel: BroadcastChannel
    private listeners: Set<(room: Room | null) => void> = new Set()
    private isConnected = true
  
    constructor() {
      this.channel = new BroadcastChannel("quiz-game-rooms")
      this.channel.addEventListener("message", this.handleBroadcast.bind(this))
      this.channel.addEventListener("messageerror", this.handleError.bind(this))
    }
  
    private handleBroadcast(event: MessageEvent) {
      try {
        const { type, roomCode, data } = event.data
        if (type === "room-updated") {
          const room = this.getRoom(roomCode)
          this.notifyListeners(room)
        } else if (type === "player-joined" || type === "game-started") {
          const room = this.getRoom(roomCode)
          this.notifyListeners(room)
        }
      } catch (error) {
        console.error("[RoomManager] Error handling broadcast:", error)
      }
    }
  
    private handleError(event: MessageEvent) {
      console.error("[RoomManager] Broadcast channel error:", event)
      this.isConnected = false
      // Try to reconnect after a delay
      setTimeout(() => {
        try {
          this.channel = new BroadcastChannel("quiz-game-rooms")
          this.channel.addEventListener("message", this.handleBroadcast.bind(this))
          this.channel.addEventListener("messageerror", this.handleError.bind(this))
          this.isConnected = true
        } catch (error) {
          console.error("[RoomManager] Failed to reconnect:", error)
        }
      }, 1000)
    }
  
    private notifyListeners(room: Room | null) {
      this.listeners.forEach((listener) => {
        try {
          listener(room)
        } catch (error) {
          console.error("[RoomManager] Error in listener:", error)
        }
      })
    }
  
    private broadcast(type: string, roomCode: string, data?: any) {
      if (!this.isConnected) return
  
      try {
        this.channel.postMessage({ type, roomCode, data })
      } catch (error) {
        console.error("[RoomManager] Error broadcasting:", error)
        this.isConnected = false
      }
    }
  
    generateRoomCode(): string {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      let result = ""
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }
  
    createRoom(hostId: string, settings: Room["settings"]): Room {
      const roomCode = this.generateRoomCode()
      const room: Room = {
        code: roomCode,
        hostId,
        players: [],
        settings,
        status: "waiting",
        createdAt: new Date().toISOString(),
        gameStarted: false,
      }
  
      localStorage.setItem(`room-${roomCode}`, JSON.stringify(room))
      this.broadcast("room-updated", roomCode)
      return room
    }
  
    getRoom(roomCode: string): Room | null {
      const roomData = localStorage.getItem(`room-${roomCode}`)
      return roomData ? JSON.parse(roomData) : null
    }
  
    joinRoom(roomCode: string, player: Omit<Player, "id" | "joinedAt" | "isReady" | "isHost">): boolean {
      const room = this.getRoom(roomCode)
      if (!room || room.gameStarted) return false
  
      const newPlayer: Player = {
        ...player,
        id: Math.random().toString(36).substr(2, 9),
        joinedAt: new Date().toISOString(),
        isReady: true,
        isHost: false,
      }
  
      room.players.push(newPlayer)
      localStorage.setItem(`room-${roomCode}`, JSON.stringify(room))
      this.broadcast("player-joined", roomCode, { player: newPlayer })
      return true
    }
  
    updatePlayerScore(roomCode: string, playerId: string, quizScore?: number, memoryScore?: number): boolean {
      const room = this.getRoom(roomCode)
      if (!room) return false
  
      const player = room.players.find((p) => p.id === playerId)
      if (!player) return false
  
      if (quizScore !== undefined) player.quizScore = quizScore
      if (memoryScore !== undefined) player.memoryScore = memoryScore
  
      localStorage.setItem(`room-${roomCode}`, JSON.stringify(room))
      this.broadcast("room-updated", roomCode)
      return true
    }
  
    updatePlayerMemoryScore(roomCode: string, playerId: string, memoryScore: number): boolean {
      return this.updatePlayerScore(roomCode, playerId, undefined, memoryScore)
    }
  
    startGame(roomCode: string, hostId: string): boolean {
      const room = this.getRoom(roomCode)
      if (!room || room.hostId !== hostId) return false
  
      room.gameStarted = true
      room.status = "quiz"
      localStorage.setItem(`room-${roomCode}`, JSON.stringify(room))
      this.broadcast("game-started", roomCode)
      return true
    }
  
    updateGameStatus(roomCode: string, status: Room["status"]): boolean {
      const room = this.getRoom(roomCode)
      if (!room) return false
  
      room.status = status
      localStorage.setItem(`room-${roomCode}`, JSON.stringify(room))
      this.broadcast("room-updated", roomCode)
      return true
    }
  
    leaveRoom(roomCode: string, playerId: string): boolean {
      const room = this.getRoom(roomCode)
      if (!room) return false
  
      room.players = room.players.filter((p) => p.id !== playerId)
  
      if (room.players.length === 0) {
        localStorage.removeItem(`room-${roomCode}`)
      } else {
        localStorage.setItem(`room-${roomCode}`, JSON.stringify(room))
      }
  
      this.broadcast("room-updated", roomCode)
      return true
    }
  
    subscribe(callback: (room: Room | null) => void) {
      this.listeners.add(callback)
      return () => this.listeners.delete(callback)
    }
  
    isChannelConnected(): boolean {
      return this.isConnected
    }
  
    cleanup() {
      try {
        this.channel.close()
      } catch (error) {
        console.error("[RoomManager] Error closing channel:", error)
      }
      this.listeners.clear()
      this.isConnected = false
    }
  }
  
  export const roomManager = new RoomManager()
  