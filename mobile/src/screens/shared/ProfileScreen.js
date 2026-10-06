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
import { departmentLabel } from '../../utils/roles';
import Header from '../../components/Header';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { isDark, colors, toggleTheme } = useTheme();

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

  const isCeo = user?.role === 'CEO';
  const roleDisplay = isCeo ? 'CEO' : (user?.title || `${departmentLabel(user?.department)} Head`);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Account" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
              shadowColor: '#000',
            },
          ]}
        >
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Text style={styles.avatarText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.name || roleDisplay}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textMuted }]}>
              {user?.email}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: isDark ? '#2d244a' : '#f3e8ff' }]}>
              <Text style={[styles.roleBadgeText, { color: colors.primary }]}>
                {roleDisplay}
              </Text>
            </View>
          </View>
        </View>

        {/* Details Card */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            ORGANIZATION INFO
          </Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Role</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.role || 'Staff'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Department</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {isCeo ? 'CEO Office' : departmentLabel(user?.department)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>System</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>Karios Daily Reporting</Text>
          </View>
        </View>

        {/* Settings & Appearance */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            APPEARANCE
          </Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Text style={[styles.settingValue, { color: colors.primary, fontWeight: '700' }]}>
              {isDark ? 'Enabled' : 'Disabled'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Actions Card */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.signOutButton,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fee2e2',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fca5a5',
              },
            ]}
            onPress={handleLogout}
            activeOpacity={0.8}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sectionCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingValue: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    marginVertical: 10,
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
