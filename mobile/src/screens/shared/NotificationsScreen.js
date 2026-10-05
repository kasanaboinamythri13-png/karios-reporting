// src/screens/shared/NotificationsScreen.js
// Notifications / Alerts screen matching user mockup

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getNotifications, markAllNotificationsRead } from '../../api/notificationsApi';
import { useTheme } from '../../context/ThemeContext';

function formatNotifTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (isToday) {
    return `Today at ${timePart}`;
  }
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${datePart} at ${timePart}`;
}

function NotifIcon({ item, colors, isDark }) {
  const title = (item?.title || '').toLowerCase();
  const type = item?.type || '';
  const isApproved = type === 'REPORT_APPROVED' || title.includes('approved');
  const isRejected = type === 'REPORT_REJECTED' || title.includes('rejected');
  const isReminder = type === 'REMINDER' || title.includes('pending') || title.includes('reminder');

  if (isApproved) {
    return (
      <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5' }]}>
        <Ionicons name="checkmark-circle" size={24} color={colors.approved} />
      </View>
    );
  }
  if (isRejected) {
    return (
      <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2' }]}>
        <Ionicons name="alert-circle" size={24} color={colors.rejected} />
      </View>
    );
  }
  if (isReminder) {
    return (
      <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FFFBEB' }]}>
        <Ionicons name="alarm" size={24} color={colors.pending} />
      </View>
    );
  }
  return (
    <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EEF2FF' }]}>
      <Ionicons name="notifications" size={22} color={colors.primary} />
    </View>
  );
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await getNotifications();
      const list = Array.isArray(data) ? data : (data?.notifications || data?.data || []);
      setNotifs(list);
    } catch {
      setNotifs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleMarkAll() {
    try {
      await markAllNotificationsRead();
      await load(true);
    } catch { /* silent */ }
  }

  const notifsList = Array.isArray(notifs) ? notifs : [];
  const unreadCount = notifsList.filter((n) => !n.is_read && !n.read_at).length;

  function renderItem({ item }) {
    const isUnread = !item.is_read && !item.read_at;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
          isUnread && { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(139, 92, 246, 0.08)' : '#FAF8FF' },
        ]}
        onPress={() => {
          if (item.report_id) {
            navigation.navigate('ReportDetail', { reportId: item.report_id });
          }
        }}
        activeOpacity={0.75}
      >
        <NotifIcon item={item} colors={colors} isDark={isDark} />
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.cardMsg, { color: colors.textSecondary }]}>{item.message}</Text>
          <Text style={[styles.cardTime, { color: colors.textMuted }]}>{formatNotifTime(item.created_at)}</Text>
        </View>
        <View style={styles.cardRight}>
          {isUnread && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
          {item.report_id && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Top Header ── */}
      <View style={[styles.topHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAll} activeOpacity={0.7}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Notifications List ── */}
      <FlatList
        contentContainerStyle={styles.listContent}
        data={notifsList}
        keyExtractor={(n) => String(n.id)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyCircle, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="notifications-off-outline" size={36} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications yet</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              You'll be notified when your daily reports are reviewed or reminders are sent.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, marginTop: 3 },
  markAllText: { fontSize: 13, fontWeight: '700' },

  listContent: { padding: 18, gap: 12, flexGrow: 1 },

  card: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardMsg: { fontSize: 13, lineHeight: 18 },
  cardTime: { fontSize: 12, marginTop: 2 },

  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
