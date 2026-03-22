import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { ChallengeWithParticipants, DailyLog } from '../types'

export function useChallenge(challengeId: string, myUserId: string) {
  const [challenge, setChallenge] = useState<ChallengeWithParticipants | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchChallenge = useCallback(async () => {
    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        participants:challenge_participants(
          *,
          user:users(*)
        )
      `)
      .eq('id', challengeId)
      .single()

    if (error || !data) return

    const { data: logs } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('log_date', { ascending: true })

    const allLogs: DailyLog[] = logs ?? []
    const myLogs = allLogs.filter(l => l.user_id === myUserId)
    const opponentLogs = allLogs.filter(l => l.user_id !== myUserId)

    setChallenge({ ...data, my_logs: myLogs, opponent_logs: opponentLogs })
    setLoading(false)
  }, [challengeId, myUserId])

  useEffect(() => {
    fetchChallenge()

    // Realtime: listen for step count updates
    const channel = supabase
      .channel(`challenge-${challengeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_logs',
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => fetchChallenge()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [challengeId, fetchChallenge])

  return { challenge, loading, refetch: fetchChallenge }
}
