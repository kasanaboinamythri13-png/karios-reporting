// src/navigation/CeoTabs.js
// Bottom tab navigator for CEO

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

import CeoOverviewScreen    from '../screens/ceo/CeoOverviewScreen';
import CeoReportsListScreen from '../screens/ceo/CeoReportsListScreen';
import CeoReportDetailScreen from '../screens/ceo/CeoReportDetailScreen';
import NotificationsScreen  from '../screens/shared/NotificationsScreen';
import ProfileScreen        from '../screens/shared/ProfileScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ emoji, focused }) {
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.55 }}>
      {emoji}
    </Text>
  );
}

// Overview → ReportDetail stack
function OverviewStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="CeoOverview" component={CeoOverviewScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CeoReportDetail" component={CeoReportDetailScreen} options={{ title: 'Report Detail' }} />
    </Stack.Navigator>
  );
}

// Reports list → Report detail stack
function ReportsStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="CeoReportsList" component={CeoReportsListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CeoReportDetail" component={CeoReportDetailScreen} options={{ title: 'Report Detail' }} />
    </Stack.Navigator>
  );
}

export default function CeoTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.tabBarBorder,
          paddingBottom: 6,
          paddingTop: 6,
          height: 62,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tab.Screen
        name="OverviewTab"
        component={OverviewStack}
        options={{ title: 'Overview', tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} /> }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportsStack}
        options={{ title: 'Reports', tabBarIcon: ({ focused }) => <TabIcon emoji="📂" focused={focused} /> }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{
          title: 'Alerts',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔔" focused={focused} />,
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitle: 'Notifications',
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👑" focused={focused} />,
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitle: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}
