import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, Alert, TextInput
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { generateInviteCode } from '../lib/utils'
import { RootStackParamList, ChallengeType } from '../types'

type Nav = NativeStackNavigationProp<RootStackParamList, 'NewChallenge'>

const STEP_GOALS = [5000, 7500, 10000, 15000, 20000]

export default function NewChallengeScreen() {
  const navigation = useNavigation<Nav>()
  const { user } = useAuth()
  const [type, setType] = useState<ChallengeType>('single_day')
  const [stepGoal, setStepGoal] = useState(10000)
  const [days, setDays] = useState('7')
  const [loading, setLoading] = useState(false)

  async function createChallenge() {
    if (!user) return
    setLoading(true)
    try {
      const startDate = new Date().toISOString().split('T')[0]
      const endDate = type === 'single_day'
        ? startDate
        : (() => {
            const d = new Date()
            d.setDate(d.getDate() + parseInt(days) - 1)
            return d.toISOString().split('T')[0]
          })()

      const inviteCode = generateInviteCode()

      const { data, error } = await supabase
        .from('challenges')
        .insert({
          type,
          step_goal: stepGoal,
          start_date: startDate,
          end_date: endDate,
          status: 'active',
          invite_code: inviteCode,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error

      // Add creator as participant
      await supabase.from('challenge_participants').insert({
        challenge_id: data.id,
        user_id: user.id,
        status: 'active',
      })

      navigation.replace('Challenge', { challengeId: data.id })
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New challenge</Text>
        </View>

        {/* Challenge type */}
        <Text style={styles.sectionLabel}>Type</Text>
        <View style={styles.toggleRow}>
          {(['single_day', 'multi_day'] as ChallengeType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.toggleOption, type === t && styles.toggleOptionActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.toggleOptionText, type === t && styles.toggleOptionTextActive]}>
                {t === 'single_day' ? 'Single day' : 'Multi-day'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Duration (multi-day only) */}
        {type === 'multi_day' && (
          <>
            <Text style={styles.sectionLabel}>Duration (days)</Text>
            <View style={styles.durationRow}>
              {['3', '5', '7', '14', '30'].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.durationOption, days === d && styles.durationOptionActive]}
                  onPress={() => setDays(d)}
                >
                  <Text style={[styles.durationText, days === d && styles.durationTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Step goal */}
        <Text style={styles.sectionLabel}>Daily step goal</Text>
        <View style={styles.goalGrid}>
          {STEP_GOALS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.goalOption, stepGoal === g && styles.goalOptionActive]}
              onPress={() => setStepGoal(g)}
            >
              <Text style={[styles.goalText, stepGoal === g && styles.goalTextActive]}>
                {g.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {type === 'single_day'
              ? `One day · ${stepGoal.toLocaleString()} steps`
              : `${days} days · ${stepGoal.toLocaleString()} steps/day`}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={createChallenge}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Create & get invite link'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 20, gap: 12 },
  header: { marginBottom: 8 },
  back: { fontSize: 16, color: '#185FA5', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#111' },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleOption: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#e5e5e5',
  },
  toggleOptionActive: { backgroundColor: '#185FA5', borderColor: '#185FA5' },
  toggleOptionText: { fontSize: 15, fontWeight: '500', color: '#555' },
  toggleOptionTextActive: { color: '#fff' },
  durationRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  durationOption: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#e5e5e5',
  },
  durationOptionActive: { backgroundColor: '#185FA5', borderColor: '#185FA5' },
  durationText: { fontSize: 15, fontWeight: '500', color: '#555' },
  durationTextActive: { color: '#fff' },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goalOption: {
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#e5e5e5',
  },
  goalOptionActive: { backgroundColor: '#185FA5', borderColor: '#185FA5' },
  goalText: { fontSize: 15, fontWeight: '500', color: '#555' },
  goalTextActive: { color: '#fff' },
  summary: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 0.5, borderColor: '#e5e5e5', alignItems: 'center',
    marginTop: 8,
  },
  summaryText: { fontSize: 17, fontWeight: '600', color: '#111' },
  createButton: {
    backgroundColor: '#185FA5', borderRadius: 12, padding: 18,
    alignItems: 'center', marginTop: 8,
  },
  createButtonDisabled: { opacity: 0.6 },
  createButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
})
