import React from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  SafeAreaView, TouchableOpacity, Share, ActivityIndicator
} from 'react-native'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { useAuth } from '../hooks/useAuth'
import { useChallenge } from '../hooks/useChallenge'
import { useStepSync } from '../hooks/useStepSync'
import { formatSteps, getProgressPercent, getDayLabel } from '../lib/utils'
import { RootStackParamList } from '../types'

type Route = RouteProp<RootStackParamList, 'Challenge'>

export default function ChallengeScreen() {
  const { params } = useRoute<Route>()
  const navigation = useNavigation()
  const { user } = useAuth()
  const { challenge, loading } = useChallenge(params.challengeId, user!.id)

  // Sync steps whenever this screen is active
  useStepSync(params.challengeId, user!.id, !loading && challenge?.status === 'active')

  if (loading || !challenge) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 40 }} />
      </SafeAreaView>
    )
  }

  const me = challenge.participants.find(p => p.user_id === user!.id)
  const opponent = challenge.participants.find(p => p.user_id !== user!.id)
  const today = new Date().toISOString().split('T')[0]

  const myTodaySteps = challenge.my_logs.find(l => l.log_date === today)?.step_count ?? 0
  const opponentTodaySteps = challenge.opponent_logs.find(l => l.log_date === today)?.step_count ?? 0

  const myPercent = getProgressPercent(myTodaySteps, challenge.step_goal)
  const opponentPercent = getProgressPercent(opponentTodaySteps, challenge.step_goal)
  const stepsRemaining = Math.max(0, challenge.step_goal - myTodaySteps)

  const totalDays = Math.round(
    (new Date(challenge.end_date).getTime() - new Date(challenge.start_date).getTime()) / 86400000
  ) + 1
  const currentDay = Math.round(
    (new Date(today).getTime() - new Date(challenge.start_date).getTime()) / 86400000
  ) + 1

  // Build day-by-day win array for multi-day challenges
  const days = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(challenge.start_date)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const mySteps = challenge.my_logs.find(l => l.log_date === dateStr)?.step_count ?? 0
    const oppSteps = challenge.opponent_logs.find(l => l.log_date === dateStr)?.step_count ?? 0
    const isToday = dateStr === today
    const isPast = dateStr < today
    const iWon = isPast && mySteps >= challenge.step_goal
    return { dateStr, mySteps, oppSteps, isToday, isPast, iWon, label: getDayLabel(dateStr) }
  })

  async function shareInvite() {
    await Share.share({
      message: `Join my StepBattle challenge! Use code: ${challenge.invite_code}\n\nOr open: stepbattle://join/${challenge.invite_code}`,
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerMeta}>
            <Text style={styles.dayCounter}>Day {Math.min(currentDay, totalDays)} of {totalDays}</Text>
            <View style={[styles.badge, challenge.status === 'active' && styles.activeBadge]}>
              <Text style={styles.badgeText}>{challenge.status}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.title}>{formatSteps(challenge.step_goal)} steps / day</Text>

        {/* VS card */}
        <View style={styles.card}>
          {/* Me */}
          <View style={styles.playerRow}>
            <View style={[styles.avatar, { backgroundColor: '#E6F1FB' }]}>
              <Text style={[styles.avatarText, { color: '#0C447C' }]}>
                {user!.username.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.playerInfo}>
              <View style={styles.playerNameRow}>
                <Text style={styles.playerName}>You</Text>
                <Text style={styles.stepCount}>{formatSteps(myTodaySteps)}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${myPercent}%`, backgroundColor: '#185FA5' }]} />
              </View>
            </View>
          </View>

          <View style={styles.vsDivider}>
            <View style={styles.vsLine} />
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.vsLine} />
          </View>

          {/* Opponent */}
          {opponent ? (
            <View style={styles.playerRow}>
              <View style={[styles.avatar, { backgroundColor: '#FAECE7' }]}>
                <Text style={[styles.avatarText, { color: '#993C1D' }]}>
                  {opponent.user.username.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.playerInfo}>
                <View style={styles.playerNameRow}>
                  <Text style={styles.playerName}>@{opponent.user.username}</Text>
                  <Text style={styles.stepCount}>{formatSteps(opponentTodaySteps)}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressBar, { width: `${opponentPercent}%`, backgroundColor: '#993C1D' }]} />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.waitingRow}>
              <Text style={styles.waitingText}>Waiting for opponent...</Text>
              <TouchableOpacity style={styles.shareButton} onPress={shareInvite}>
                <Text style={styles.shareButtonText}>Share invite</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Today's goal progress */}
        <View style={styles.card}>
          <View style={styles.goalHeader}>
            <Text style={styles.cardLabel}>Today's goal</Text>
            <Text style={styles.goalRemaining}>
              {stepsRemaining === 0 ? '🎉 Goal reached!' : `${formatSteps(stepsRemaining)} to go`}
            </Text>
          </View>
          <View style={styles.goalTrack}>
            <View style={[styles.goalBar, { width: `${myPercent}%` }]} />
          </View>
          <View style={styles.goalEndpoints}>
            <Text style={styles.goalEndpointText}>0</Text>
            <Text style={styles.goalEndpointText}>{formatSteps(challenge.step_goal)}</Text>
          </View>
        </View>

        {/* Daily wins (multi-day only) */}
        {totalDays > 1 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Daily wins</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysRow}>
              {days.map((day) => (
                <View key={day.dateStr} style={styles.dayItem}>
                  <View style={[
                    styles.dayDot,
                    day.isToday && styles.dayDotToday,
                    day.iWon && styles.dayDotWon,
                  ]}>
                    {day.iWon && <Text style={styles.checkmark}>✓</Text>}
                    {day.isToday && !day.iWon && <Text style={styles.dayDotTodayText}>•</Text>}
                  </View>
                  <Text style={styles.dayLabel}>{day.label}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Invite code */}
        {!opponent && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Invite code</Text>
            <Text style={styles.inviteCode}>{challenge.invite_code}</Text>
            <TouchableOpacity style={styles.shareButton} onPress={shareInvite}>
              <Text style={styles.shareButtonText}>Share invite link</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 20, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  back: { fontSize: 16, color: '#185FA5' },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayCounter: { fontSize: 13, color: '#999' },
  badge: { backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  activeBadge: { backgroundColor: '#E6F1FB' },
  badgeText: { fontSize: 12, color: '#555', fontWeight: '500' },
  title: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#e5e5e5',
    gap: 12,
  },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontWeight: '600' },
  playerInfo: { flex: 1, gap: 6 },
  playerNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  playerName: { fontSize: 15, fontWeight: '500', color: '#111' },
  stepCount: { fontSize: 20, fontWeight: '600', color: '#111' },
  progressTrack: { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: 6, borderRadius: 3 },
  vsDivider: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vsLine: { flex: 1, height: 0.5, backgroundColor: '#e5e5e5' },
  vsText: { fontSize: 11, color: '#bbb', fontWeight: '600', letterSpacing: 1 },
  waitingRow: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  waitingText: { color: '#999', fontSize: 15 },
  cardLabel: { fontSize: 12, fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalRemaining: { fontSize: 14, fontWeight: '500', color: '#111' },
  goalTrack: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  goalBar: { height: 8, backgroundColor: '#185FA5', borderRadius: 4 },
  goalEndpoints: { flexDirection: 'row', justifyContent: 'space-between' },
  goalEndpointText: { fontSize: 11, color: '#bbb' },
  daysRow: { marginTop: 4 },
  dayItem: { alignItems: 'center', gap: 4, marginRight: 10, width: 36 },
  dayDot: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center', alignItems: 'center',
  },
  dayDotToday: { backgroundColor: '#E6F1FB', borderWidth: 1.5, borderColor: '#185FA5' },
  dayDotWon: { backgroundColor: '#185FA5' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  dayDotTodayText: { color: '#185FA5', fontSize: 18, lineHeight: 20 },
  dayLabel: { fontSize: 10, color: '#999' },
  inviteCode: { fontSize: 28, fontWeight: '700', color: '#111', letterSpacing: 2, textAlign: 'center' },
  shareButton: {
    backgroundColor: '#185FA5',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  shareButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})
