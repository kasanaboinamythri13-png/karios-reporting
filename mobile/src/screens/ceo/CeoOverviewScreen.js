// src/screens/ceo/CeoOverviewScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { fetchCeoOverview } from '../../api/dashboardApi';
import { useTheme } from '../../context/ThemeContext';
import KariosLogo from '../../components/KariosLogo';
import ThemeToggleBtn from '../../components/ThemeToggleBtn';
import DepartmentCard from '../../components/DepartmentCard';
import MetricCard from '../../components/MetricCard';
import { formatCurrency, formatToday } from '../../utils/formatters';

export default function CeoOverviewScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadOverview = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetchCeoOverview();
      setData(res.data);
    } catch (err) {
      setError(err?.message || 'Failed to load executive overview');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={[styles.errorTitle, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => loadOverview()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const summary = data?.summary || { totalDepartments: 4, submittedCount: 0, pendingCount: 0, approvedCount: 0, rejectedCount: 0 };
  const departments = data?.departments || [];
  const metrics = data?.metrics || {};
  const blockers = data?.blockers || [];
  const today = formatToday();

  const pendingCount = summary.pendingCount ?? (summary.submittedCount - summary.approvedCount - summary.rejectedCount);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadOverview(true)} tintColor={colors.primary} />
      }
    >
      {/* ── Brand Bar ── */}
      <View style={styles.brandRow}>
        <KariosLogo width={175} height={55} />
        <View style={styles.brandActions}>
          <View
            style={[
              styles.submissionPill,
              {
                backgroundColor: isDark ? 'rgba(139, 92, 246, 0.22)' : colors.primaryLight,
                borderColor: isDark ? '#3A3A5C' : '#DDD6FE',
              },
            ]}
          >
            <Text style={[styles.submissionPillText, { color: isDark ? '#A78BFA' : colors.primary }]}>
              {summary.submittedCount}/{summary.totalDepartments} submitted
            </Text>
          </View>
          <ThemeToggleBtn size={38} />
        </View>
      </View>

      {/* ── Header ── */}
      <View style={styles.topHeader}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Executive Overview</Text>
          <Text style={[styles.pageDate, { color: colors.textSecondary }]}>{today}</Text>
        </View>
      </View>

      {/* ── Submission Summary Counters ── */}
      <View style={[styles.countersRow, { backgroundColor: colors.surface }]}>
        <View style={styles.counter}>
          <Text style={[styles.counterVal, { color: colors.text }]}>
            {summary.submittedCount}/{summary.totalDepartments}
          </Text>
          <Text style={[styles.counterLabel, { color: colors.textMuted }]}>Submitted</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.counter}>
          <Text style={[styles.counterVal, { color: colors.pending }]}>{pendingCount}</Text>
          <Text style={[styles.counterLabel, { color: colors.textMuted }]}>Pending</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.counter}>
          <Text style={[styles.counterVal, { color: colors.approved }]}>{summary.approvedCount}</Text>
          <Text style={[styles.counterLabel, { color: colors.textMuted }]}>Approved</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.counter}>
          <Text style={[styles.counterVal, { color: colors.rejected }]}>{summary.rejectedCount}</Text>
          <Text style={[styles.counterLabel, { color: colors.textMuted }]}>Rejected</Text>
        </View>
      </View>

      {/* ── Department Status Cards ── */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Department Status</Text>
      <View style={styles.deptGrid}>
        {departments.map((dept) => (
          <DepartmentCard
            key={dept.department}
            dept={dept}
            onPress={(id) => navigation.navigate('CeoReportDetail', { reportId: id })}
          />
        ))}
      </View>

      {/* ── Key Daily Metrics ── */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Key Metrics</Text>
      <View style={styles.metricsGrid}>
        <MetricCard
          icon="💰"
          label="Collections"
          value={formatCurrency(metrics?.collections)}
          accentColor={colors.finance}
          subLabel="Finance"
        />
        <MetricCard
          icon="📈"
          label="Closed Deals"
          value={formatCurrency(metrics?.closedDeals)}
          accentColor={colors.sales}
          subLabel="Sales"
        />
        <MetricCard
          icon="📣"
          label="Mkt. Spend"
          value={formatCurrency(metrics?.marketingSpend)}
          accentColor={colors.marketing}
          subLabel="Marketing"
        />
        <MetricCard
          icon="🎯"
          label="New Leads"
          value={String(metrics?.leads || 0)}
          accentColor={colors.growth}
          subLabel="Growth"
        />
      </View>

      {/* ── Active Blockers ── */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Blockers</Text>
      {blockers && blockers.length > 0 ? (
        blockers.map((b, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.blockerCard, { backgroundColor: colors.rejectedBg, borderLeftColor: colors.rejected }]}
            onPress={() => b.reportId && navigation.navigate('CeoReportDetail', { reportId: b.reportId })}
            activeOpacity={0.75}
          >
            <View style={styles.blockerHeader}>
              <Text style={[styles.blockerDept, { color: colors.rejectedText }]}>⚠️ {b.title || b.department}</Text>
              {b.reportId && <Text style={[styles.blockerLink, { color: colors.rejected }]}>View →</Text>}
            </View>
            <Text style={[styles.blockerText, { color: colors.textSecondary }]}>{b.blocker}</Text>
          </TouchableOpacity>
        ))
      ) : (
        <View style={[styles.noBlockers, { backgroundColor: colors.approvedBg }]}>
          <Text style={[styles.noBlockersText, { color: colors.approvedText }]}>✅ No blockers reported today</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   { padding: 20, paddingBottom: 48, gap: 16 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 10,
  },
  pageTitle: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  pageDate:  { fontSize: 13 },
  submissionPill: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  submissionPillText: { fontSize: 13, fontWeight: '700' },

  countersRow: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  counter:     { alignItems: 'center', flex: 1 },
  counterVal:  { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  counterLabel:{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 },
  divider:     { width: 1, height: 36 },

  sectionTitle:{ fontSize: 16, fontWeight: '700', marginTop: 4 },
  deptGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  blockerCard: {
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
  },
  blockerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  blockerDept:   { fontSize: 14, fontWeight: '700' },
  blockerLink:   { fontSize: 13, fontWeight: '600' },
  blockerText:   { fontSize: 13, lineHeight: 19 },

  noBlockers:    { borderRadius: 14, padding: 16, alignItems: 'center' },
  noBlockersText:{ fontSize: 14, fontWeight: '600' },

  errorIcon:  { fontSize: 48, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  retryBtn:   { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryText:  { color: '#FFFFFF', fontWeight: '700' },
});
