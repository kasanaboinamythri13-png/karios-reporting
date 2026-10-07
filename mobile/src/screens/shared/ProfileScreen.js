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
  const roleTitle = isCeo ? 'CEO' : (user?.title || `${departmentLabel(user?.department)} Head`);
  const accessLevel = isCeo
    ? 'Full Admin Access — All Departments'
    : `Department Head Access — ${departmentLabel(user?.department)}`;

  const permissions = isCeo
    ? [
        'View All Reports',
        'Approve Reports',
        'Reject Reports',
        'Dashboard Overview',
      ]
    : [
        'Submit Daily Report',
        'View Department History',
        'Edit Pending Reports',
        'Upload Attachments',
      ];

  const avatarLetter = isCeo
    ? 'C'
    : (user?.department?.charAt(0) || user?.name?.charAt(0) || 'H').toUpperCase();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.background : '#f4f6fa' }]}>
      <Header
        title="Profile"
        subtitle="Account settings & permissions"
        rightIcon={isDark ? 'sunny-outline' : 'moon-outline'}
        onRightPress={toggleTheme}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Profile Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
              shadowColor: '#000',
            },
          ]}
        >
          {/* Avatar & Header Identity */}
          <View style={styles.headerBlock}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>
            <Text style={[styles.profileTitle, { color: colors.text }]}>{roleTitle}</Text>
            <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
              {user?.email || (isCeo ? 'ceo@karios.com' : 'head@karios.com')}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: isDark ? colors.surfaceBorder : '#f1f5f9' }]} />

          {/* Role Section */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Role</Text>
            <Text style={[styles.sectionValue, { color: colors.text }]}>{roleTitle}</Text>
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
              {permissions.map((perm) => (
                <View
                  key={perm}
                  style={[
                    styles.permPill,
                    {
                      backgroundColor: isDark ? 'rgba(139, 92, 246, 0.18)' : '#f3e8ff',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.permPillText,
                      { color: isDark ? '#c084fc' : '#8b5cf6' },
                    ]}
                  >
                    {perm}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sign Out Button Pattern from Image 2 */}
          <TouchableOpacity
            style={[
              styles.signOutButton,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fee2e2',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#fca5a5',
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
    paddingBottom: 36,
  },
  card: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  headerBlock: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
  },
  profileTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  sectionBlock: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 5,
  },
  sectionValue: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  permissionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  permPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  permPillText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  signOutButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
