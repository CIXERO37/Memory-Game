"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Trophy, Clock, Target, TrendingUp, TrendingDown, Play } from "lucide-react"
import { useRoom } from "@/hooks/use-room"
import { roomManager } from "@/lib/room-manager"

interface HostMonitorProps {
  roomCode: string
  totalQuestions: number
}

export function HostMonitor({ roomCode, totalQuestions }: HostMonitorProps) {
  const { room, loading } = useRoom(roomCode)
  const [previousRankings, setPreviousRankings] = useState<{ [key: string]: number }>({})
  const [rankingChanges, setRankingChanges] = useState<{ [key: string]: "up" | "down" | null }>({})

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

  if (loading || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="py-8">
            <div className="text-lg">Loading host monitor...</div>
          </CardContent>
        </Card>
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
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Host Monitor</h1>
              <p className="text-sm text-muted-foreground">Room: {roomCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              Game Active
            </Badge>
            <Badge variant="outline">{players.length} Players</Badge>
          </div>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Active Players</span>
              </div>
              <div className="text-2xl font-bold text-primary">{players.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">Total Questions</span>
              </div>
              <div className="text-2xl font-bold text-accent">{totalQuestions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Highest Score</span>
              </div>
              <div className="text-2xl font-bold text-yellow-500">
                {sortedPlayers.length > 0 ? (sortedPlayers[0].quizScore || 0) + (sortedPlayers[0].memoryScore || 0) : 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Game Status</span>
              </div>
              <div className="text-sm font-bold text-blue-500">In Progress</div>
            </CardContent>
          </Card>
        </div>

        {/* Player Progress Cards */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Player Progress</h2>

          {sortedPlayers.map((player, index) => {
            const rank = index + 1
            const quizScore = player.quizScore || 0
            const memoryScore = player.memoryScore || 0
            const totalScore = quizScore + memoryScore
            const quizProgress = Math.min((quizScore / totalQuestions) * 100, 100)
            const rankingChange = rankingChanges[player.id]

            return (
              <Card key={player.id} className="relative">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`text-xl font-bold ${rank === 1 ? "text-yellow-500" : rank === 2 ? "text-gray-400" : rank === 3 ? "text-amber-600" : "text-primary"}`}
                        >
                          #{rank}
                        </div>
                        {rankingChange === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {rankingChange === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                      </div>
                      <div className="text-3xl">{player.avatar}</div>
                      <div>
                        <h3 className="font-semibold text-lg">{player.username}</h3>
                        <p className="text-sm text-muted-foreground">
                          Quiz: {quizScore} | Memory: {memoryScore} | Total: {totalScore}
                        </p>
                      </div>
                    </div>
                    <Badge variant={rank === 1 ? "default" : "outline"} className="text-sm">
                      {totalScore} points
                    </Badge>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Quiz Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {quizScore}/{totalQuestions} ({Math.round(quizProgress)}%)
                        </span>
                      </div>
                      <Progress value={quizProgress} className="h-2" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Memory Game Score</span>
                        <span className="text-sm text-muted-foreground">{memoryScore} points</span>
                      </div>
                      <Progress value={Math.min((memoryScore / 100) * 100, 100)} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {players.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No players have joined the game yet</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Game Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Game Controls</CardTitle>
            <CardDescription>Manage the current game session</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              onClick={() => {
                roomManager.updateGameStatus(roomCode, "finished")
                window.location.href = "/"
              }}
              variant="destructive"
            >
              End Game
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
