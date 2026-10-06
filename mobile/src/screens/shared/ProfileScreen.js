// src/screens/shared/ProfileScreen.js
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { departmentLabel, departmentLetter } from '../../utils/formatters';

export default function ProfileScreen() {
  const { user, signOut, isCEO } = useAuth();
  const { theme, isDark, colors, setTheme } = useTheme();

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  const dept   = user?.department || '';
  const label  = isCEO ? 'CEO' : departmentLabel(dept);
  const role   = user?.role || '';
  const letter = isCEO ? 'C' : departmentLetter(dept);

  const defaultTitles = {
    DEVELOPER_HEAD: 'Developer Head',
    SALES_HEAD: 'Sales Head',
    MARKETING_HEAD: 'Marketing Head',
    FINANCE_HEAD: 'Finance Head',
    CEO: 'Chief Executive Officer',
  };
  const displayName = defaultTitles[role] || user?.title || `${label} Head`;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Avatar block */}
      <View style={[styles.avatarCard, { backgroundColor: colors.primary }]}>
        <View style={styles.avatar}>
          <Text style={[styles.avatarLetter, { color: colors.primary }]}>{letter}</Text>
        </View>
        <Text style={styles.roleName}>{displayName}</Text>
      </View>

      {/* Appearance Section */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        <View style={styles.themeRow}>
          <TouchableOpacity
            style={[
              styles.themeOption,
              {
                backgroundColor: !isDark ? (colors.primarySoft || '#EDE9FE') : colors.surfaceElevated,
                borderColor: !isDark ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setTheme('light')}
            activeOpacity={0.8}
          >
            <Ionicons name="sunny" size={20} color={!isDark ? colors.primary : colors.textSecondary} />
            <Text
              style={[
                styles.themeOptionText,
                { color: !isDark ? colors.primary : colors.textSecondary, fontWeight: !isDark ? '700' : '600' },
              ]}
            >
              Light
            </Text>
            {!isDark && (
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={styles.checkIcon} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeOption,
              {
                backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : colors.surfaceElevated,
                borderColor: isDark ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setTheme('dark')}
            activeOpacity={0.8}
          >
            <Ionicons name="moon" size={20} color={isDark ? colors.primary : colors.textSecondary} />
            <Text
              style={[
                styles.themeOptionText,
                { color: isDark ? colors.primary : colors.textSecondary, fontWeight: isDark ? '700' : '600' },
              ]}
            >
              Dark
            </Text>
            {isDark && (
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={styles.checkIcon} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Info rows */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Details</Text>
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Role</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>{role}</Text>
        </View>
        {dept ? (
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Department</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>{departmentLabel(dept)}</Text>
          </View>
        ) : null}
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Timezone</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>Asia/Kolkata (IST)</Text>
        </View>
      </View>

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

      <Text style={[styles.notice, { color: colors.textMuted }]}>
        No personal names are shown. Department titles only, per company policy.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   { padding: 20, paddingBottom: 48, gap: 16, alignItems: 'stretch' },

  avatarCard: {
    borderRadius: 20, padding: 28,
    alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 4,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  avatarLetter: { fontSize: 38, fontWeight: '800' },
  roleName:    { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginTop: 4 },

  section: {
    borderRadius: 16, padding: 16, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  themeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  themeOptionText: {
    fontSize: 14,
  },
  checkIcon: {
    marginLeft: 2,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '600' },

  signOutBtn: {
    borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', borderWidth: 1.5,
  },
  signOutText: { fontSize: 16, fontWeight: '700' },
  notice: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
