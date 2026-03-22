import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as Linking from 'expo-linking'
import { RootStackParamList } from '../types'
import { useAuth } from '../hooks/useAuth'

import LoginScreen from '../screens/LoginScreen'
import HomeScreen from '../screens/HomeScreen'
import ChallengeScreen from '../screens/ChallengeScreen'
import NewChallengeScreen from '../screens/NewChallengeScreen'

const Stack = createNativeStackNavigator<RootStackParamList>()

const linking = {
  prefixes: [Linking.createURL('/'), 'stepbattle://'],
  config: {
    screens: {
      JoinChallenge: 'join/:inviteCode',
    },
  },
}

export default function Navigation() {
  const { session, loading } = useAuth()

  if (loading) return null

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Challenge" component={ChallengeScreen} />
            <Stack.Screen name="NewChallenge" component={NewChallengeScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
