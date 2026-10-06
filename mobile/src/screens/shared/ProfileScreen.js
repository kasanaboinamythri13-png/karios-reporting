// src/screens/shared/ProfileScreen.js
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggleBtn from '../../components/ThemeToggleBtn';
import { departmentLabel, departmentLetter } from '../../utils/formatters';

export default function ProfileScreen() {
  const { user, signOut, isCEO } = useAuth();
  const { colors, isDark } = useTheme();

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  const dept   = user?.department || '';
  const label  = isCEO ? 'CEO' : departmentLabel(dept);
  const role   = user?.role || (isCEO ? 'CEO' : `${dept}_HEAD`);
  const letter = isCEO ? 'C' : departmentLetter(dept);

  const defaultTitles = {
    DEVELOPER_HEAD: 'Developer Head',
    SALES_HEAD: 'Sales Head',
    MARKETING_HEAD: 'Marketing Head',
    FINANCE_HEAD: 'Finance Head',
    CEO: 'CEO',
  };
  const displayName = isCEO ? 'CEO' : (defaultTitles[role] || user?.title || `${label} Head`);
  const displayEmail = user?.email || (isCEO ? 'ceo@karios.com' : `${(dept || 'user').toLowerCase()}@karios.local`);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* ── Top Header with Title and Sun/Moon button on Right (matching Home page) ── */}
      <View style={styles.topHeaderRow}>
        <View style={styles.topHeaderLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Account settings
          </Text>
        </View>
        <ThemeToggleBtn size={38} />
      </View>

      {/* ── Single Box for the whole Account Details ── */}
      <View style={[styles.mainCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Top Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarLetter}>{letter}</Text>
          </View>
          <Text style={[styles.roleTitle, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.emailText, { color: colors.textSecondary }]}>{displayEmail}</Text>
        </View>

        {/* Single Line Divider */}
        <View style={[styles.singleDivider, { backgroundColor: colors.border }]} />

        {/* Details Section */}
        <View style={styles.detailsSection}>
          {/* Role */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Role</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{role}</Text>
          </View>

          {/* Department (for Department Heads) */}
          {!isCEO && dept ? (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Department</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{departmentLabel(dept)}</Text>
            </View>
          ) : null}

          {/* Timezone */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Timezone</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>Asia/Kolkata (IST)</Text>
          </View>

          {/* Permissions (ONLY for CEO page as requested) */}
          {isCEO && (
            <View style={styles.detailBlock}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Permissions</Text>
              <View style={styles.permissionChipsWrap}>
                <View style={[styles.permChip, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.18)' : '#EDE9FE', borderColor: isDark ? '#4C1D95' : '#DDD6FE' }]}>
                  <Text style={[styles.permChipText, { color: isDark ? '#C4B5FD' : colors.primary }]}>View All Reports</Text>
                </View>
                <View style={[styles.permChip, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.18)' : '#EDE9FE', borderColor: isDark ? '#4C1D95' : '#DDD6FE' }]}>
                  <Text style={[styles.permChipText, { color: isDark ? '#C4B5FD' : colors.primary }]}>Approve Reports</Text>
                </View>
                <View style={[styles.permChip, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.18)' : '#EDE9FE', borderColor: isDark ? '#4C1D95' : '#DDD6FE' }]}>
                  <Text style={[styles.permChipText, { color: isDark ? '#C4B5FD' : colors.primary }]}>Reject Reports</Text>
                </View>
                <View style={[styles.permChip, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.18)' : '#EDE9FE', borderColor: isDark ? '#4C1D95' : '#DDD6FE' }]}>
                  <Text style={[styles.permChipText, { color: isDark ? '#C4B5FD' : colors.primary }]}>Dashboard Overview</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[
            styles.signOutBtn,
            {
              backgroundColor: colors.rejectedBg,
              borderColor: colors.rejected,
            },
          ]}
          onPress={handleSignOut}
          activeOpacity={0.85}
        >
          <Text style={[styles.signOutText, { color: colors.rejected }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 16,
  },

  // Top Header
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  topHeaderLeft: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
  },

  // Main Card
  mainCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 20,
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    gap: 6,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarLetter: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  emailText: {
    fontSize: 13,
  },

  // Single Divider Line
  singleDivider: {
    height: 1,
    width: '100%',
  },

  // Details Section
  detailsSection: {
    gap: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  detailBlock: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Permissions Chips
  permissionChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  permChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  permChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Sign Out Button
  signOutBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
