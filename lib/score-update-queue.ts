"use client"

/**
 * Score Update Queue - Batches score updates to reduce Supabase rate limit hits
 * 
 * Problem: With 100 players answering simultaneously, each answer triggers an immediate
 * database update. This can hit Supabase's rate limit (~500 requests/10 seconds).
 * 
 * Solution: Queue updates and flush them in batches every few seconds.
 * This reduces requests from 100/second to ~30-50/3 seconds while maintaining
 * near-realtime score updates (max 3 second delay).
 */

import { roomManager } from './room-manager'

interface QueuedUpdate {
    roomCode: string
    playerId: string
    quizScore: number
    questionsAnswered: number
    timestamp: number
}

class ScoreUpdateQueue {
    private queue: Map<string, QueuedUpdate> = new Map()
    private flushTimeout: NodeJS.Timeout | null = null
    private readonly FLUSH_INTERVAL = 100 // 100ms - very fast updates
    private readonly MAX_QUEUE_SIZE = 5 // Force flush with fewer items
    private isProcessing = false

    /**
     * Enqueue a score update. Updates are deduplicated by player - only the latest values are kept.
     */
    enqueue(roomCode: string, playerId: string, quizScore: number, questionsAnswered: number): void {
        const key = `${roomCode}:${playerId}`

        // Always keep the highest values (monotonic updates)
        const existing = this.queue.get(key)
        const finalScore = existing ? Math.max(existing.quizScore, quizScore) : quizScore
        const finalAnswered = existing ? Math.max(existing.questionsAnswered, questionsAnswered) : questionsAnswered

        this.queue.set(key, {
            roomCode,
            playerId,
            quizScore: finalScore,
            questionsAnswered: finalAnswered,
            timestamp: Date.now()
        })

        // Schedule flush if not already scheduled
        if (!this.flushTimeout && !this.isProcessing) {
            this.flushTimeout = setTimeout(() => this.flush(), this.FLUSH_INTERVAL)
        }

        // Force immediate flush if queue is getting too large
        if (this.queue.size >= this.MAX_QUEUE_SIZE && !this.isProcessing) {
            this.flushNow()
        }
    }

    /**
     * Immediately flush all queued updates (for critical moments like game end)
     */
    async flushNow(): Promise<void> {
        if (this.flushTimeout) {
            clearTimeout(this.flushTimeout)
            this.flushTimeout = null
        }
        await this.flush()
    }

    /**
     * Process all queued updates
     */
    private async flush(): Promise<void> {
        this.flushTimeout = null

        if (this.queue.size === 0 || this.isProcessing) {
            return
        }

        this.isProcessing = true

        // Take a snapshot of current queue and clear it
        const updates = Array.from(this.queue.entries())
        this.queue.clear()

        // Process updates in parallel with concurrency limit
        const BATCH_SIZE = 10 // Process 10 updates at a time to avoid overwhelming the server

        for (let i = 0; i < updates.length; i += BATCH_SIZE) {
            const batch = updates.slice(i, i + BATCH_SIZE)

            await Promise.allSettled(
                batch.map(async ([key, update]) => {
                    try {
                        const success = await roomManager.updatePlayerScore(
                            update.roomCode,
                            update.playerId,
                            update.quizScore,
                            update.questionsAnswered
                        )

                        if (!success) {
                            console.warn(`[ScoreUpdateQueue] Failed to update score for ${key}`)
                            // Re-queue failed update for retry
                            this.queue.set(key, update)
                        }
                    } catch (error) {
                        console.error(`[ScoreUpdateQueue] Error updating score for ${key}:`, error)
                        // Re-queue failed update for retry
                        this.queue.set(key, update)
                    }
                })
            )

            // Small delay between batches to be gentle on the server
            if (i + BATCH_SIZE < updates.length) {
                await new Promise(resolve => setTimeout(resolve, 50))
            }
        }

        this.isProcessing = false

        // If there are new updates that came in during processing, schedule another flush
        if (this.queue.size > 0 && !this.flushTimeout) {
            this.flushTimeout = setTimeout(() => this.flush(), this.FLUSH_INTERVAL)
        }
    }

    /**
     * Get the number of pending updates
     */
    getPendingCount(): number {
        return this.queue.size
    }

    /**
     * Check if there are pending updates for a specific player
     */
    hasPendingUpdate(roomCode: string, playerId: string): boolean {
        return this.queue.has(`${roomCode}:${playerId}`)
    }

    /**
     * Clear all pending updates (use with caution)
     */
    clear(): void {
        if (this.flushTimeout) {
            clearTimeout(this.flushTimeout)
            this.flushTimeout = null
        }
        this.queue.clear()
    }
}

// Singleton instance
export const scoreUpdateQueue = new ScoreUpdateQueue()
