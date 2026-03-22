export type User = {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
}

export type ChallengeType = 'single_day' | 'multi_day'
export type ChallengeStatus = 'pending' | 'active' | 'completed'
export type ParticipantStatus = 'pending' | 'active' | 'forfeit'

export type Challenge = {
  id: string
  type: ChallengeType
  step_goal: number
  start_date: string
  end_date: string
  status: ChallengeStatus
  invite_code: string
  created_by: string
  created_at: string
}

export type ChallengeParticipant = {
  id: string
  challenge_id: string
  user_id: string
  status: ParticipantStatus
  joined_at: string
}

export type DailyLog = {
  id: string
  challenge_id: string
  user_id: string
  log_date: string
  step_count: number
  synced_at: string
}

// Enriched types for UI
export type ChallengeWithParticipants = Challenge & {
  participants: (ChallengeParticipant & { user: User })[]
  my_logs: DailyLog[]
  opponent_logs: DailyLog[]
}

export type RootStackParamList = {
  Login: undefined
  Home: undefined
  Challenge: { challengeId: string }
  NewChallenge: undefined
  JoinChallenge: { inviteCode: string }
  Profile: undefined
}
