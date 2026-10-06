// src/navigation/HeadTabs.js
// Bottom tab navigator for Department Heads matching user mockup (5 tabs: Home, Submit, History, Alerts, Account)

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

import HeadHomeScreen     from '../screens/head/HeadHomeScreen';
import SubmitReportScreen from '../screens/head/SubmitReportScreen';
import HeadHistoryScreen  from '../screens/head/HeadHistoryScreen';
import ReportDetailScreen from '../screens/shared/ReportDetailScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import ProfileScreen       from '../screens/shared/ProfileScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HeadHome" component={HeadHomeScreen} />
      <Stack.Screen name="SubmitReport" component={SubmitReportScreen} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
    </Stack.Navigator>
  );
}

function SubmitStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SubmitReport" component={SubmitReportScreen} />
      <Stack.Screen name="SubmitReportScreen" component={SubmitReportScreen} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
    </Stack.Navigator>
  );
}

function HistoryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HeadHistory" component={HeadHistoryScreen} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
      <Stack.Screen name="SubmitReport" component={SubmitReportScreen} />
    </Stack.Navigator>
  );
}

function AlertsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
      <Stack.Screen name="SubmitReport" component={SubmitReportScreen} />
    </Stack.Navigator>
  );
}

function AccountStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

export default function HeadTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          const s = size || 22;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Submit') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Alerts') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={s} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen name="Submit" component={SubmitStack} options={{ title: 'Submit' }} />
      <Tab.Screen name="History" component={HistoryStack} options={{ title: 'History' }} />
      <Tab.Screen name="Alerts" component={AlertsStack} options={{ title: 'Alerts' }} />
      <Tab.Screen name="Account" component={AccountStack} options={{ title: 'Account' }} />
    </Tab.Navigator>
  );
}
