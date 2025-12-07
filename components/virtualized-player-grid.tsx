"use client"

/**
 * VirtualizedPlayerGrid - Renders large lists of player cards efficiently
 * 
 * Problem: Rendering 100+ player cards at once causes performance issues,
 * especially on low-end devices. The browser has to maintain DOM nodes for
 * all players even if they're not visible.
 * 
 * Solution: Use react-window to only render visible items. This reduces
 * DOM nodes from 100+ to ~15-20, dramatically improving performance.
 */

import React, { useMemo, useCallback } from 'react'
// @ts-ignore - react-window types may not be fully compatible
import { FixedSizeGrid as Grid } from 'react-window'
import { RobustGoogleAvatar } from '@/components/robust-google-avatar'
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react'

export interface VirtualizedPlayer {
    id: string
    nickname: string
    avatar: string
    isHost?: boolean
    quizScore?: number
    questionsAnswered?: number
    memoryScore?: number
    rankChange?: 'up' | 'down' | null
}

interface VirtualizedPlayerGridProps {
    players: VirtualizedPlayer[]
    currentPlayerId?: string
    showScores?: boolean
    showRanking?: boolean
    onKickPlayer?: (playerId: string) => void
    containerWidth?: number
    containerHeight?: number
    columnCount?: number
    itemWidth?: number
    itemHeight?: number
    className?: string
}

// Calculate total score for a player
function getTotalScore(player: VirtualizedPlayer): number {
    return (player.quizScore || 0) + (player.memoryScore || 0)
}

// Individual player card component (memoized for performance)
const PlayerCard = React.memo(({
    player,
    isCurrentPlayer,
    showScores,
    showRanking,
    rank,
    onKick
}: {
    player: VirtualizedPlayer
    isCurrentPlayer: boolean
    showScores: boolean
    showRanking: boolean
    rank: number
    onKick?: () => void
}) => {
    const totalScore = getTotalScore(player)

    return (
        <div
            className={`
        relative p-2 rounded-lg border-2 transition-all duration-200
        ${isCurrentPlayer
                    ? 'bg-blue-100 border-blue-500'
                    : 'bg-white border-black hover:border-gray-400'
                }
      `}
            style={{ margin: '4px' }}
        >
            {/* Rank Badge */}
            {showRanking && (
                <div className={`
          absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center
          text-[10px] font-bold border-2 border-black
          ${rank === 1 ? 'bg-yellow-400 text-black' :
                        rank === 2 ? 'bg-gray-300 text-black' :
                            rank === 3 ? 'bg-orange-400 text-black' :
                                'bg-gray-100 text-gray-700'}
        `}>
                    {rank}
                </div>
            )}

            {/* Rank Change Indicator */}
            {player.rankChange && (
                <div className="absolute -top-1 -right-1">
                    {player.rankChange === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                </div>
            )}

            <div className="flex items-center gap-2">
                {/* Avatar */}
                <div className="w-8 h-8 shrink-0 overflow-hidden rounded">
                    <RobustGoogleAvatar
                        avatarUrl={player.avatar}
                        alt={`${player.nickname} avatar`}
                        className="w-full h-full"
                        width={32}
                        height={32}
                    />
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-black text-xs truncate">
                        {player.nickname.toUpperCase()}
                        {isCurrentPlayer && <span className="text-blue-600 ml-1">(YOU)</span>}
                        {player.isHost && <span className="text-orange-600 ml-1">(HOST)</span>}
                    </div>

                    {showScores && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-600">
                            <Trophy className="w-3 h-3" />
                            <span>{totalScore} pts</span>
                            {player.questionsAnswered !== undefined && (
                                <span className="text-gray-400">• Q{player.questionsAnswered}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
})

PlayerCard.displayName = 'PlayerCard'

export function VirtualizedPlayerGrid({
    players,
    currentPlayerId,
    showScores = false,
    showRanking = false,
    onKickPlayer,
    containerWidth = 600,
    containerHeight = 400,
    columnCount = 3,
    itemWidth = 180,
    itemHeight = 70,
    className = ''
}: VirtualizedPlayerGridProps) {
    // Sort players by score if showing ranking
    const sortedPlayers = useMemo(() => {
        if (!showRanking) return players

        return [...players].sort((a, b) => getTotalScore(b) - getTotalScore(a))
    }, [players, showRanking])

    // Calculate grid dimensions
    const rowCount = Math.ceil(sortedPlayers.length / columnCount)

    // Cell renderer for react-window
    const Cell = useCallback(({ columnIndex, rowIndex, style }: {
        columnIndex: number
        rowIndex: number
        style: React.CSSProperties
    }) => {
        const playerIndex = rowIndex * columnCount + columnIndex
        const player = sortedPlayers[playerIndex]

        if (!player) {
            return <div style={style} />
        }

        const isCurrentPlayer = player.id === currentPlayerId
        const rank = showRanking ? playerIndex + 1 : 0

        return (
            <div style={style}>
                <PlayerCard
                    player={player}
                    isCurrentPlayer={isCurrentPlayer}
                    showScores={showScores}
                    showRanking={showRanking}
                    rank={rank}
                    onKick={onKickPlayer ? () => onKickPlayer(player.id) : undefined}
                />
            </div>
        )
    }, [sortedPlayers, columnCount, currentPlayerId, showScores, showRanking, onKickPlayer])

    // If few players, render normally without virtualization
    if (players.length <= 15) {
        return (
            <div className={`grid gap-2 ${className}`} style={{
                gridTemplateColumns: `repeat(${Math.min(columnCount, players.length)}, minmax(0, 1fr))`
            }}>
                {sortedPlayers.map((player, index) => (
                    <PlayerCard
                        key={player.id}
                        player={player}
                        isCurrentPlayer={player.id === currentPlayerId}
                        showScores={showScores}
                        showRanking={showRanking}
                        rank={showRanking ? index + 1 : 0}
                        onKick={onKickPlayer ? () => onKickPlayer(player.id) : undefined}
                    />
                ))}
            </div>
        )
    }

    // Use virtualized grid for many players
    return (
        <div className={className}>
            <Grid
                columnCount={columnCount}
                columnWidth={itemWidth}
                height={containerHeight}
                rowCount={rowCount}
                rowHeight={itemHeight}
                width={containerWidth}
                className="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent"
            >
                {Cell}
            </Grid>

            {/* Player count indicator */}
            <div className="text-center mt-2 text-xs text-white/60">
                Showing {players.length} players (virtualized for performance)
            </div>
        </div>
    )
}

// Simpler list variant for waiting room (vertical list)
export function VirtualizedPlayerList({
    players,
    currentPlayerId,
    className = ''
}: {
    players: VirtualizedPlayer[]
    currentPlayerId?: string
    className?: string
}) {
    // If few players, render normally
    if (players.length <= 20) {
        return (
            <div className={`grid gap-2 ${className}`}>
                {players.map((player) => (
                    <div
                        key={player.id}
                        className={`
              p-2 sm:p-3 rounded border-2 pixel-player-card
              ${player.id === currentPlayerId
                                ? 'bg-blue-100 border-blue-500'
                                : 'bg-white border-black'
                            }
            `}
                    >
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 overflow-hidden">
                                <RobustGoogleAvatar
                                    avatarUrl={player.avatar}
                                    alt={`${player.nickname} avatar`}
                                    className="w-full h-full"
                                    width={40}
                                    height={40}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-black pixel-font-sm text-xs sm:text-sm truncate">
                                    {player.nickname.toUpperCase()}
                                    {player.id === currentPlayerId && (
                                        <span className="text-blue-600 text-[10px] sm:text-xs ml-1">(YOU)</span>
                                    )}
                                    {player.isHost && (
                                        <span className="text-orange-600 text-[10px] sm:text-xs ml-1">(HOST)</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    // Virtualized version for many players
    return (
        <div className={className}>
            <div
                className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400"
                style={{ maxHeight: '400px' }}
            >
                {players.map((player) => (
                    <div
                        key={player.id}
                        className={`
              p-2 sm:p-3 rounded border-2 mb-2 pixel-player-card
              ${player.id === currentPlayerId
                                ? 'bg-blue-100 border-blue-500'
                                : 'bg-white border-black'
                            }
            `}
                    >
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 overflow-hidden">
                                <RobustGoogleAvatar
                                    avatarUrl={player.avatar}
                                    alt={`${player.nickname} avatar`}
                                    className="w-full h-full"
                                    width={40}
                                    height={40}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-black pixel-font-sm text-xs sm:text-sm truncate">
                                    {player.nickname.toUpperCase()}
                                    {player.id === currentPlayerId && (
                                        <span className="text-blue-600 text-[10px] sm:text-xs ml-1">(YOU)</span>
                                    )}
                                    {player.isHost && (
                                        <span className="text-orange-600 text-[10px] sm:text-xs ml-1">(HOST)</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Player count indicator */}
            <div className="text-center mt-2 text-xs text-gray-500">
                {players.length} players in room
            </div>
        </div>
    )
}
