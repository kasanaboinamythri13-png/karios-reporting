// mobile/src/navigation/RootNavigator.js
import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';

// CEO Screens
import CeoOverviewScreen from '../screens/ceo/CeoOverviewScreen';
import CeoReportsScreen from '../screens/ceo/CeoReportsScreen';
import CeoReportDetailScreen from '../screens/ceo/CeoReportDetailScreen';

// Department Head Navigator (from teammate)
import HeadTabs from './HeadTabs';

// Shared Screens
import ReportDetailScreen from '../screens/shared/ReportDetailScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import { LoadingScreen } from '../components/Feedback';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// CEO Tab Navigator
function CeoTabNavigator() {
  const { colors, isDark } = useTheme();

  const ceoTabOptions = {
    headerShown: false,
    tabBarActiveTintColor: isDark ? '#a78bfa' : colors.primary,
    tabBarInactiveTintColor: isDark ? '#8b949e' : colors.textLight,
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopColor: colors.surfaceBorder,
      borderTopWidth: 1,
      height: Platform.OS === 'ios' ? 86 : 64,
      paddingTop: 8,
      paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '600',
    },
  };

  return (
    <Tab.Navigator screenOptions={ceoTabOptions}>
      <Tab.Screen
        name="OverviewTab"
        component={CeoOverviewScreen}
        options={{
          tabBarLabel: 'Overview',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={CeoReportsScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const { isDark, colors } = useTheme();

  if (loading) {
    return <LoadingScreen message="Starting Karios..." />;
  }

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.surfaceBorder,
          primary: colors.primary,
        },
      }
    : DefaultTheme;

  const isCeo = user?.role === 'CEO';

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : isCeo ? (
          <>
            <Stack.Screen name="CeoMain" component={CeoTabNavigator} />
            <Stack.Screen name="CeoReportDetail" component={CeoReportDetailScreen} />
            <Stack.Screen name="ReportDetail" component={CeoReportDetailScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="HeadApp" component={HeadTabs} />
            <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
