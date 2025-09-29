"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, Trophy, Clock, Target, TrendingUp, TrendingDown, Play } from "lucide-react"
import { useRoom } from "@/hooks/use-room"
import { roomManager } from "@/lib/room-manager"

function MonitorPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [quizSettings, setQuizSettings] = useState({
    timeLimit: 30,
    questionCount: 10,
  })
  const [previousRankings, setPreviousRankings] = useState<{ [key: string]: number }>({})
  const [rankingChanges, setRankingChanges] = useState<{ [key: string]: "up" | "down" | null }>({})
  const { room, loading } = useRoom(roomCode || "")

  useEffect(() => {
    const roomCodeParam = searchParams.get("roomCode")
    if (roomCodeParam) {
      setRoomCode(roomCodeParam)
    } else {
      // Try to get from localStorage
      const hostData = localStorage.getItem("currentHost")
      if (hostData) {
        const { roomCode: storedRoomCode } = JSON.parse(hostData)
        setRoomCode(storedRoomCode)
      } else {
        router.push("/select-quiz")
      }
    }
  }, [searchParams, router])

  // Monitor ranking calculation effect
  useEffect(() => {
    if (room) {
      const players = room.players.filter((p) => !p.isHost)
      const sortedPlayers = [...players].sort((a, b) => {
        const aTotal = (a.quizScore || 0) + (a.memoryScore || 0)
        const bTotal = (b.quizScore || 0) + (b.memoryScore || 0)
        return bTotal - aTotal
      })

      const newRankings: { [key: string]: number } = {}
      const changes: { [key: string]: "up" | "down" | null } = {}

      sortedPlayers.forEach((player, index) => {
        const newRank = index + 1
        newRankings[player.id] = newRank
        const oldRank = previousRankings[player.id]

        if (oldRank && oldRank !== newRank) {
          changes[player.id] = oldRank > newRank ? "up" : "down"
        } else {
          changes[player.id] = null
        }
      })

      setPreviousRankings(newRankings)
      setRankingChanges(changes)

      // Clear ranking change indicators after 3 seconds
      setTimeout(() => {
        setRankingChanges({})
      }, 3000)
    }
  }, [room, previousRankings])

  const endGame = () => {
    if (roomCode) {
      roomManager.updateGameStatus(roomCode, "finished")
      router.push("/")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center bg-white/5 border-white/10">
          <CardContent className="py-8">
            <div className="text-white">Loading host monitor...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">Room not found</div>
      </div>
    )
  }

  const players = room.players.filter((p) => !p.isHost)
  const sortedPlayers = [...players].sort((a, b) => {
    const aTotal = (a.quizScore || 0) + (a.memoryScore || 0)
    const bTotal = (b.quizScore || 0) + (b.memoryScore || 0)
    return bTotal - aTotal
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Monitor Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Host Monitor</h1>
              <p className="text-sm text-blue-200">Room: {roomCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1 bg-green-500/20 text-green-400 border-green-500/30">
              <Play className="h-3 w-3" />
              Game Active
            </Badge>
            <Badge variant="outline" className="border-white/20 text-white">{players.length} Players</Badge>
          </div>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-200">Active Players</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">{players.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-blue-200">Total Questions</span>
              </div>
              <div className="text-2xl font-bold text-yellow-400">{quizSettings.questionCount}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-blue-200">Highest Score</span>
              </div>
              <div className="text-2xl font-bold text-yellow-500">
                {players.length > 0 
                  ? Math.max(...players.map(p => (p.quizScore || 0) + (p.memoryScore || 0)))
                  : 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-200">Game Status</span>
              </div>
              <div className="text-sm font-bold text-blue-500">In Progress</div>
            </CardContent>
          </Card>
        </div>

        {/* Player Progress Cards */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-white">Player Progress</h2>

          {players.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50 text-blue-400" />
                <p className="text-blue-200">No players have joined the game yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedPlayers.map((player, index) => {
                const rank = index + 1
                const quizScore = player.quizScore || 0
                const memoryScore = player.memoryScore || 0
                const totalScore = quizScore + memoryScore
                const quizProgress = Math.min((quizScore / quizSettings.questionCount) * 100, 100)
                const rankingChange = rankingChanges[player.id]

                return (
                  <Card key={player.id} className="relative bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`text-xl font-bold ${rank === 1 ? "text-yellow-500" : rank === 2 ? "text-gray-400" : rank === 3 ? "text-amber-600" : "text-blue-400"}`}
                            >
                              #{rank}
                            </div>
                            {rankingChange === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                            {rankingChange === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                          </div>
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                            <img
                              src={player.avatar}
                              alt={`${player.username}'s avatar`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to default avatar if image fails to load
                                e.currentTarget.src = "/ava1.png"
                              }}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-white">{player.username}</h3>
                            <p className="text-sm text-blue-200">
                              Quiz: {quizScore} | Memory: {memoryScore} | Total: {totalScore}
                            </p>
                          </div>
                        </div>
                        <Badge variant={rank === 1 ? "default" : "outline"} className="text-sm bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          {totalScore} points
                        </Badge>
                      </div>

                      {/* Progress Bars */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-blue-200">Quiz Progress</span>
                            <span className="text-sm text-blue-300">
                              {quizScore}/{quizSettings.questionCount} ({Math.round(quizProgress)}%)
                            </span>
                          </div>
                          <Progress value={quizProgress} className="h-2" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-blue-200">Memory Game Score</span>
                            <span className="text-sm text-blue-300">{memoryScore} points</span>
                          </div>
                          <Progress value={Math.min((memoryScore / 100) * 100, 100)} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Game Controls */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Game Controls</CardTitle>
            <CardDescription className="text-blue-200">Manage the current game session</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={endGame} variant="destructive">
              End Game
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function MonitorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center bg-white/5 border-white/10">
          <CardContent className="py-8">
            <div className="text-white">Loading...</div>
          </CardContent>
        </Card>
      </div>
    }>
      <MonitorPageContent />
    </Suspense>
  )
}
