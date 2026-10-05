// src/navigation/RootNavigator.js
// Root: Auth gate → Role-based tab navigator

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import Colors from '../theme/colors';

import LoginScreen from '../screens/auth/LoginScreen';
import HeadTabs   from './HeadTabs';
import CeoTabs    from './CeoTabs';

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : user.role === 'CEO' ? (
        <Stack.Screen name="CeoApp" component={CeoTabs} />
      ) : (
        <Stack.Screen name="HeadApp" component={HeadTabs} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
});
