// mobile/src/screens/shared/NotificationsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { formatDateTime } from '../../utils/date';
import Header from '../../components/Header';
import { LoadingScreen, EmptyState } from '../../components/Feedback';

const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Report Approved',
    body: 'The CEO approved your Development Daily Report.',
    is_read: false,
    report_id: 'demo-report-dev',
    created_at: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    title: 'New Daily Submission',
    body: 'Sales department submitted their daily report.',
    is_read: false,
    report_id: 'demo-report-sales',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'notif-3',
    title: 'Report Rejected',
    body: 'Your Marketing report was returned for revision: "Need campaign budget breakout".',
    is_read: true,
    report_id: 'demo-report-mktg',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function NotificationsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await api.getNotifications();
      const list = res?.notifications || res?.data || res || [];
      setNotifications(Array.isArray(list) && list.length > 0 ? list : MOCK_NOTIFICATIONS);
    } catch {
      setNotifications(MOCK_NOTIFICATIONS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleOpenNotification = async (item) => {
    if (!item.is_read) {
      try {
        await api.markNotificationRead(item.id);
      } catch {}
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
    }

    if (item.report_id) {
      navigation.navigate('CeoReportDetail', {
        reportId: item.report_id,
      });
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const renderItem = ({ item }) => {
    const isApproved = item.title?.toLowerCase().includes('approved');
    const isRejected = item.title?.toLowerCase().includes('rejected');

    let iconName = 'notifications';
    let iconColor = colors.primary;

    if (isApproved) {
      iconName = 'checkmark-circle';
      iconColor = colors.approved;
    } else if (isRejected) {
      iconName = 'alert-circle';
      iconColor = colors.rejected;
    }

    return (
      <TouchableOpacity
        style={[
          styles.itemCard,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          !item.is_read && [
            styles.itemCardUnread,
            {
              backgroundColor: isDark ? '#1d193b' : '#faf5ff',
              borderColor: isDark ? colors.primary : '#e9d5ff',
            },
          ],
        ]}
        onPress={() => handleOpenNotification(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconCol}>
          <Ionicons name={iconName} size={24} color={iconColor} />
          {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
        </View>

        <View style={styles.contentCol}>
          <Text
            style={[
              styles.itemTitle,
              { color: colors.text },
              !item.is_read && [styles.itemTitleBold, { color: colors.text }],
            ]}
          >
            {item.title}
          </Text>
          <Text style={[styles.itemBody, { color: colors.textMuted }]} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={[styles.itemTime, { color: colors.textLight }]}>{formatDateTime(item.created_at)}</Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllRead} style={styles.markReadBtn}>
              <Text style={styles.markReadText}>Mark all read</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {loading && !refreshing ? (
        <LoadingScreen message="Loading notifications..." />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title="No notifications"
              description="You will be notified when daily reports are submitted or reviewed."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  markReadBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: colors.surfaceHover,
    borderRadius: 6,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  itemCardUnread: {
    backgroundColor: '#ffffff',
    borderColor: colors.primaryLight,
    borderWidth: 1.5,
  },
  iconCol: {
    position: 'relative',
    marginRight: 12,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.primary,
  },
  contentCol: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  itemTitleBold: {
    fontWeight: '800',
    color: colors.text,
  },
  itemBody: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  itemTime: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 4,
  },
});
