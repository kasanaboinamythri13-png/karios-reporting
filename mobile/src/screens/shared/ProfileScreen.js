// mobile/src/screens/shared/ProfileScreen.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { isDark, colors } = useTheme();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const permissions = [
    'View All Reports',
    'Approve Reports',
    'Reject Reports',
    'Dashboard Overview',
  ];
  const accessLevel = 'Full Admin Access — All Departments';
  const initial = 'C';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Profile"
        subtitle="Account settings & permissions"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : null}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ── Exact Web App Profile Card ── */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {/* Avatar & Header */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
            <Text style={[styles.profileRoleTitle, { color: colors.text }]}>
              {user?.role || 'CEO'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
              {user?.email || 'ceo@karios.local'}
            </Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

          {/* Role Section */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Role</Text>
            <Text style={[styles.sectionValue, { color: colors.text }]}>{user?.role || 'CEO'}</Text>
          </View>

          {/* Access Level Section */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Access Level</Text>
            <Text style={[styles.sectionValue, { color: colors.text }]}>{accessLevel}</Text>
          </View>

          {/* Permissions Section */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Permissions</Text>
            <View style={styles.permissionsGrid}>
              {permissions.map((p) => (
                <View
                  key={p}
                  style={[
                    styles.permissionPill,
                    {
                      backgroundColor: isDark ? colors.primaryLight : '#f3e8ff',
                      borderColor: isDark ? 'rgba(139, 92, 246, 0.4)' : '#e9d5ff',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.permissionPillText,
                      { color: isDark ? '#c4b5fd' : colors.primary },
                    ]}
                  >
                    {p}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

          {/* Sign Out Button */}
          <TouchableOpacity
            style={[
              styles.signOutButton,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#fca5a5',
              },
            ]}
            onPress={handleLogout}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.signOutButtonText,
                { color: isDark ? '#f87171' : '#dc2626' },
              ]}
            >
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },


  // ── Profile Card ──
  profileCard: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
  },
  profileRoleTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginVertical: 18,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  permissionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  permissionPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  permissionPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  signOutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
