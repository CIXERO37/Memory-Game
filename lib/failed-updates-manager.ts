import { supabase } from './supabase'

export interface FailedUpdate {
  id: string
  room_code: string
  player_id: string
  update_type: 'score' | 'progress' | 'status'
  update_data: any
  attempts: number
  max_attempts: number
  created_at: string
  last_attempt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

class FailedUpdatesManager {
  // Store failed update for retry later
  async storeFailedUpdate(
    roomCode: string,
    playerId: string,
    updateType: 'score' | 'progress' | 'status',
    updateData: any
  ): Promise<boolean> {
    try {
      const failedUpdate = {
        room_code: roomCode,
        player_id: playerId,
        update_type: updateType,
        update_data: updateData,
        attempts: 0,
        max_attempts: 3,
        status: 'pending' as const
      }

      const { error } = await supabase
        .from('failed_updates')
        .insert(failedUpdate)

      if (error) {
        console.error('[FailedUpdatesManager] Error storing failed update:', error)
        return false
      }



      return true
    } catch (error) {
      console.error('[FailedUpdatesManager] Error in storeFailedUpdate:', error)
      return false
    }
  }

  // Get pending failed updates for a player
  async getPendingUpdates(roomCode: string, playerId: string): Promise<FailedUpdate[]> {
    try {
      const { data, error } = await supabase
        .from('failed_updates')
        .select('*')
        .eq('room_code', roomCode)
        .eq('player_id', playerId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('[FailedUpdatesManager] Error getting pending updates:', error)
        return []
      }

      // Filter by attempts < max_attempts in JavaScript
      return (data || []).filter(update => update.attempts < update.max_attempts)
    } catch (error) {
      console.error('[FailedUpdatesManager] Error in getPendingUpdates:', error)
      return []
    }
  }

  // Retry a failed update
  async retryUpdate(updateId: string, retryFunction: (updateData: any) => Promise<boolean>): Promise<boolean> {
    try {
      // Get the failed update
      const { data: failedUpdate, error: getError } = await supabase
        .from('failed_updates')
        .select('*')
        .eq('id', updateId)
        .single()

      if (getError || !failedUpdate) {
        console.error('[FailedUpdatesManager] Failed update not found:', updateId)
        return false
      }

      // Mark as processing
      await supabase
        .from('failed_updates')
        .update({
          status: 'processing',
          last_attempt: new Date().toISOString()
        })
        .eq('id', updateId)

      // Attempt the retry
      const success = await retryFunction(failedUpdate.update_data)

      if (success) {
        // Mark as completed
        await supabase
          .from('failed_updates')
          .update({ status: 'completed' })
          .eq('id', updateId)


        return true
      } else {
        // Increment attempts and mark as pending again
        const newAttempts = failedUpdate.attempts + 1
        const newStatus = newAttempts >= failedUpdate.max_attempts ? 'failed' : 'pending'

        await supabase
          .from('failed_updates')
          .update({
            attempts: newAttempts,
            status: newStatus,
            last_attempt: new Date().toISOString()
          })
          .eq('id', updateId)


        return false
      }
    } catch (error) {
      console.error('[FailedUpdatesManager] Error in retryUpdate:', error)
      return false
    }
  }

  // Process all pending updates for a player
  async processPendingUpdates(
    roomCode: string,
    playerId: string,
    retryFunctions: {
      score?: (data: any) => Promise<boolean>
      progress?: (data: any) => Promise<boolean>
      status?: (data: any) => Promise<boolean>
    }
  ): Promise<{ success: number; failed: number }> {
    try {
      const pendingUpdates = await this.getPendingUpdates(roomCode, playerId)
      let successCount = 0
      let failedCount = 0

      for (const update of pendingUpdates) {
        const retryFunction = retryFunctions[update.update_type]
        if (retryFunction) {
          const success = await this.retryUpdate(update.id, retryFunction)
          if (success) {
            successCount++
          } else {
            failedCount++
          }
        } else {
          console.warn('[FailedUpdatesManager] No retry function for update type:', update.update_type)
          failedCount++
        }
      }


      return { success: successCount, failed: failedCount }
    } catch (error) {
      console.error('[FailedUpdatesManager] Error in processPendingUpdates:', error)
      return { success: 0, failed: 0 }
    }
  }

  // Clean up old completed/failed updates
  async cleanupOldUpdates(daysOld: number = 7): Promise<boolean> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const { error } = await supabase
        .from('failed_updates')
        .delete()
        .in('status', ['completed', 'failed'])
        .lt('created_at', cutoffDate.toISOString())

      if (error) {
        console.error('[FailedUpdatesManager] Error cleaning up old updates:', error)
        return false
      }


      return true
    } catch (error) {
      console.error('[FailedUpdatesManager] Error in cleanupOldUpdates:', error)
      return false
    }
  }

  // Get failed updates statistics
  async getFailedUpdatesStats(roomCode?: string): Promise<any> {
    try {
      let query = supabase
        .from('failed_updates')
        .select('status, update_type, created_at')

      if (roomCode) {
        query = query.eq('room_code', roomCode)
      }

      const { data, error } = await query

      if (error) {
        console.error('[FailedUpdatesManager] Error getting stats:', error)
        return null
      }

      const stats = {
        total: data?.length || 0,
        pending: data?.filter(u => u.status === 'pending').length || 0,
        processing: data?.filter(u => u.status === 'processing').length || 0,
        completed: data?.filter(u => u.status === 'completed').length || 0,
        failed: data?.filter(u => u.status === 'failed').length || 0,
        byType: {
          score: data?.filter(u => u.update_type === 'score').length || 0,
          progress: data?.filter(u => u.update_type === 'progress').length || 0,
          status: data?.filter(u => u.update_type === 'status').length || 0
        }
      }

      return stats
    } catch (error) {
      console.error('[FailedUpdatesManager] Error in getFailedUpdatesStats:', error)
      return null
    }
  }
}

export const failedUpdatesManager = new FailedUpdatesManager()
