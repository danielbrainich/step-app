import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert
} from 'react-native'
import { useAuth } from '../hooks/useAuth'

export default function LoginScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(email, password, username)
      } else {
        await signIn(email, password)
      }
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>StepBattle</Text>
        <Text style={styles.subtitle}>Challenge a friend. Walk more. Win.</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="Username (e.g. danielb)"
              placeholderTextColor="#999"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '...' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            <Text style={styles.toggle}>
              {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 36, fontWeight: '700', color: '#111', marginBottom: 6 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 40 },
  form: { gap: 12 },
  input: {
    borderWidth: 0.5,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111',
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#185FA5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  toggle: { color: '#185FA5', textAlign: 'center', marginTop: 12, fontSize: 14 },
})
