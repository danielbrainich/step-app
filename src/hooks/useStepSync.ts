import { useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { getTodaySteps } from '../lib/health'
import { supabase } from '../lib/supabase'

const SYNC_INTERVAL_MS = 15 * 60 * 1000 // 15 minutes

export function useStepSync(challengeId: string, userId: string, enabled: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function syncSteps() {
    try {
      const steps = await getTodaySteps()
      const today = new Date().toISOString().split('T')[0]

      await supabase.from('daily_logs').upsert(
        {
          challenge_id: challengeId,
          user_id: userId,
          log_date: today,
          step_count: steps,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'challenge_id,user_id,log_date' }
      )
    } catch (err) {
      console.warn('Step sync failed:', err)
    }
  }

  useEffect(() => {
    if (!enabled) return

    // Sync immediately on mount
    syncSteps()

    // Sync on interval
    intervalRef.current = setInterval(syncSteps, SYNC_INTERVAL_MS)

    // Sync when app comes to foreground
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') syncSteps()
    }
    const sub = AppState.addEventListener('change', handleAppState)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      sub.remove()
    }
  }, [challengeId, userId, enabled])

  return { syncNow: syncSteps }
}
