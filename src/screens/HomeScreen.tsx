import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, SafeAreaView, Alert
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Challenge, RootStackParamList } from '../types'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>

export default function HomeScreen() {
  const navigation = useNavigation<Nav>()
  const { user, signOut } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [inviteCode, setInviteCode] = useState('')

  useEffect(() => {
    fetchChallenges()
  }, [])

  async function fetchChallenges() {
    if (!user) return
    const { data } = await supabase
      .from('challenge_participants')
      .select('challenge:challenges(*)')
      .eq('user_id', user.id)
    if (data) {
      setChallenges(data.map((d: any) => d.challenge).filter(Boolean))
    }
  }

  async function joinByCode(code: string) {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('invite_code', code.toLowerCase().trim())
      .single()
    if (error || !data) return Alert.alert('Not found', 'No challenge with that code.')
    navigation.navigate('Challenge', { challengeId: data.id })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>StepBattle</Text>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.signOut}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.greeting}>Hey @{user?.username}</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('NewChallenge')}
        >
          <Text style={styles.primaryButtonText}>+ New challenge</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>Your challenges</Text>

      {challenges.length === 0 ? (
        <Text style={styles.empty}>No challenges yet. Start one or ask a friend for their invite code.</Text>
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.challengeCard}
              onPress={() => navigation.navigate('Challenge', { challengeId: item.id })}
            >
              <Text style={styles.challengeTitle}>
                {item.step_goal.toLocaleString()} steps / day
              </Text>
              <Text style={styles.challengeMeta}>
                {item.type === 'multi_day' ? `${item.start_date} → ${item.end_date}` : item.start_date}
              </Text>
              <View style={[styles.statusBadge, item.status === 'active' && styles.activeBadge]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  signOut: { fontSize: 14, color: '#999' },
  greeting: { fontSize: 16, color: '#555', paddingHorizontal: 20, marginBottom: 20 },
  actions: { paddingHorizontal: 20, marginBottom: 24 },
  primaryButton: {
    backgroundColor: '#185FA5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#999', paddingHorizontal: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { paddingHorizontal: 20, color: '#999', fontSize: 15, lineHeight: 22 },
  challengeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#e5e5e5',
  },
  challengeTitle: { fontSize: 17, fontWeight: '600', color: '#111', marginBottom: 4 },
  challengeMeta: { fontSize: 13, color: '#999', marginBottom: 10 },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  activeBadge: { backgroundColor: '#E6F1FB' },
  statusText: { fontSize: 12, color: '#555', fontWeight: '500' },
})
