// src/screens/head/HeadHistoryScreen.js
// Department Report History screen matching user reference image:
// - Header: "< Development Reports / Development department submissions"
// - Tabs: [ All ] [ Pending ] [ Approved ] [ Rejected ]
// - Date Filter: From [dd-mm-yyyy 📅] to [dd-mm-yyyy 📅]
// - Cards: Department name, Status pill (APPROVED / PENDING REVIEW / REJECTED),
//          Submitted by: Development Head, Timestamp, Inspect ->

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { listReports } from '../../api/reportsApi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { departmentLabel } from '../../utils/formatters';
import DatePickerModal, { formatDdMmYyyy } from '../../components/DatePickerModal';
import ThemeToggleBtn from '../../components/ThemeToggleBtn';

const STATUS_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'SUBMITTED', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
];

function formatCardDate(dateStr, timeStr) {
  if (!dateStr) return '';
  const d = new Date(timeStr || dateStr);
  const monthDay = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  if (timeStr) {
    const time = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${monthDay} · ${time}`;
  }
  return monthDay;
}

export default function HeadHistoryScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [activeDatePicker, setActiveDatePicker] = useState(null); // 'from' | 'to' | null

  const deptKey = user?.department || 'DEVELOPMENT';
  const deptName = departmentLabel(deptKey) || 'Development';
  const roleTitle = user?.title || `${deptName} Head`;

  const loadReports = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const filters = {};
      if (status && status !== 'ALL') filters.status = status;
      if (from) filters.from = from;
      if (to) filters.to = to;
      const data = await listReports(filters);
      const list = Array.isArray(data) ? data : (data?.reports || data?.data || []);
      setReports(list);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status, from, to]);

  useFocusEffect(useCallback(() => { loadReports(); }, [loadReports]));

  const reportsList = Array.isArray(reports) ? reports : [];

  const displayed = reportsList.filter((r) => {
    if (status === 'SUBMITTED' && r.status !== 'SUBMITTED') return false;
    if (status === 'APPROVED' && r.status !== 'APPROVED') return false;
    if (status === 'REJECTED' && r.status !== 'REJECTED') return false;
    if (from && r.report_date < from) return false;
    if (to && r.report_date > to) return false;
    return true;
  });

  const hasDateFilter = Boolean(from || to);

  function renderItem({ item }) {
    const isApproved = item.status === 'APPROVED';
    const isRejected = item.status === 'REJECTED';
    const isPending = !isApproved && !isRejected;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => navigation.navigate('ReportDetail', { reportId: item.id })}
        activeOpacity={0.75}
      >
        {/* Top Header: Dept Name & Status Pill */}
        <View style={styles.cardHeader}>
          <Text style={[styles.cardDeptTitle, { color: colors.text }]}>{deptName}</Text>
          <View
            style={[
              styles.statusPill,
              isApproved && { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7' },
              isRejected && { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' },
              isPending && { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' },
            ]}
          >
            <Ionicons
              name={isApproved ? 'checkmark-circle' : isRejected ? 'close-circle' : 'time'}
              size={13}
              color={isApproved ? colors.approved : isRejected ? colors.rejected : colors.pending}
            />
            <Text
              style={[
                styles.statusPillText,
                isApproved && { color: colors.approved },
                isRejected && { color: colors.rejected },
                isPending && { color: colors.pending },
              ]}
            >
              {isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : 'PENDING REVIEW'}
            </Text>
          </View>
        </View>

        {/* Submitted by */}
        <View style={styles.metaRow}>
          <Ionicons name="person-outline" size={15} color={colors.textMuted} />
          <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
            Submitted by:{' '}
            <Text style={[styles.metaValue, { color: colors.text }]}>
              {roleTitle}
            </Text>
          </Text>
        </View>

        {/* Timestamp */}
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={15} color={colors.textMuted} />
          <Text style={[styles.metaTime, { color: colors.textSecondary }]}>
            {formatCardDate(item.report_date, item.created_at)}
          </Text>
        </View>

        {/* Inspect Link */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.inspectBtn}
            onPress={() => navigation.navigate('ReportDetail', { reportId: item.id })}
            activeOpacity={0.7}
          >
            <Text style={[styles.inspectText, { color: colors.primary }]}>Inspect</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Top App Bar matching reference mockup ── */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? colors.surfaceElevated : '#F1F5F9' }]}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.appBarTextCol}>
          <Text style={[styles.appBarTitle, { color: colors.text }]}>{deptName} Reports</Text>
          <Text style={[styles.appBarSub, { color: colors.textSecondary }]}>
            {deptName} department submissions
          </Text>
        </View>
        <ThemeToggleBtn size={36} />
      </View>

      {/* ── Filter Controls Container ── */}
      <View style={[styles.filterControlsArea, { backgroundColor: colors.background }]}>
        {/* Status Filter Tabs matching mockup: [All] [Pending] [Approved] [Rejected] */}
        <View style={styles.statusTabsRow}>
          {STATUS_TABS.map((tab) => {
            const active = status === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.statusTabBtn,
                  {
                    backgroundColor: active
                      ? (colors.primary || '#2563EB')
                      : (isDark ? colors.surfaceElevated : '#F1F5F9'),
                  },
                ]}
                onPress={() => setStatus(tab.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.statusTabText,
                    {
                      color: active ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: active ? '700' : '600',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date Range Filter Bar */}
        <View style={[styles.dateFilterCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* From Date Box */}
          <TouchableOpacity
            style={[
              styles.dateBox,
              { backgroundColor: colors.inputBg, borderColor: colors.border },
              from && { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : '#F5F3FF' },
            ]}
            onPress={() => setActiveDatePicker('from')}
            activeOpacity={0.75}
          >
            <Text style={[styles.dateBoxLabel, { color: colors.textSecondary }]}>From:</Text>
            <Text style={[styles.dateBoxVal, { color: from ? colors.text : colors.textMuted }]}>
              {from ? formatDdMmYyyy(from) : 'dd-mm-yyyy'}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={from ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>

          <Text style={[styles.dateDividerArrow, { color: colors.textMuted }]}>→</Text>

          {/* To Date Box */}
          <TouchableOpacity
            style={[
              styles.dateBox,
              { backgroundColor: colors.inputBg, borderColor: colors.border },
              to && { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : '#F5F3FF' },
            ]}
            onPress={() => setActiveDatePicker('to')}
            activeOpacity={0.75}
          >
            <Text style={[styles.dateBoxLabel, { color: colors.textSecondary }]}>To:</Text>
            <Text style={[styles.dateBoxVal, { color: to ? colors.text : colors.textMuted }]}>
              {to ? formatDdMmYyyy(to) : 'dd-mm-yyyy'}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={to ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>

          {hasDateFilter && (
            <TouchableOpacity
              style={[styles.clearDatesBtn, { backgroundColor: colors.rejectedBg }]}
              onPress={() => {
                setFrom('');
                setTo('');
              }}
              activeOpacity={0.75}
            >
              <Ionicons name="close-circle" size={14} color={colors.rejected} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Reports FlatList ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadReports(true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyCircle, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name="document-text-outline" size={36} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Reports Found</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                {status !== 'ALL' || hasDateFilter
                  ? 'No reports match your current filters. Try changing or clearing filters.'
                  : 'You have not submitted any daily reports yet.'}
              </Text>
              {(status !== 'ALL' || hasDateFilter) && (
                <TouchableOpacity
                  style={[styles.resetFilterBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setStatus('ALL');
                    setFrom('');
                    setTo('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resetFilterBtnText}>Reset All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Date Picker Modal for From */}
      <DatePickerModal
        visible={activeDatePicker === 'from'}
        title="Select From Date"
        currentDate={from}
        maxDate={to || undefined}
        onSelect={(iso) => {
          setFrom(iso);
          setActiveDatePicker(null);
        }}
        onClear={() => {
          setFrom('');
          setActiveDatePicker(null);
        }}
        onClose={() => setActiveDatePicker(null)}
      />

      {/* Date Picker Modal for To */}
      <DatePickerModal
        visible={activeDatePicker === 'to'}
        title="Select To Date"
        currentDate={to}
        minDate={from || undefined}
        onSelect={(iso) => {
          setTo(iso);
          setActiveDatePicker(null);
        }}
        onClear={() => {
          setTo('');
          setActiveDatePicker(null);
        }}
        onClose={() => setActiveDatePicker(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTextCol: { flex: 1 },
  appBarTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  appBarSub: { fontSize: 13, marginTop: 2 },

  filterControlsArea: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 10,
  },

  statusTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusTabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTabText: {
    fontSize: 13,
  },

  dateFilterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    gap: 8,
  },
  dateBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginRight: 4,
  },
  dateBoxVal: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  dateDividerArrow: {
    fontSize: 14,
    fontWeight: '700',
  },
  clearDatesBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 14,
    flexGrow: 1,
  },

  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cardDeptTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    fontSize: 13,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  metaTime: {
    fontSize: 13,
    fontWeight: '500',
  },

  cardFooter: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  inspectText: {
    fontSize: 13.5,
    fontWeight: '700',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
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
  resetFilterBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
