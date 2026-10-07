import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getTodayReport, listReports } from '../../api/reportsApi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import KariosLogo from '../../components/KariosLogo';
import ThemeToggleBtn from '../../components/ThemeToggleBtn';
import { departmentLabel, departmentLetter, formatRelativeDate } from '../../utils/formatters';

export default function HeadHomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const [todayReport, setTodayReport] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [stats, setStats] = useState({ submitted: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [today, history] = await Promise.all([
        getTodayReport().catch(() => null),
        listReports().catch(() => []),
      ]);

      const actualReport = today?.report || (today?.id ? today : null);
      setTodayReport(actualReport && actualReport.id && actualReport.status !== 'MISSING' ? actualReport : null);

      const list = Array.isArray(history) ? history : (history?.reports || history?.data || []);
      setRecentReports(list.slice(0, 3));

      // Calculate stats
      const submitted = list.length;
      const pending = list.filter((r) => r.status === 'SUBMITTED').length;
      const approved = list.filter((r) => r.status === 'APPROVED').length;
      const rejected = list.filter((r) => r.status === 'REJECTED').length;
      setStats({ submitted, pending, approved, rejected });
    } catch {
      setTodayReport(null);
      setRecentReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // Date formatting: "Monday, October 5, 2026"
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const shortDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const deptName = departmentLabel(user?.department) || 'Development';
  const roleTitle = user?.title || 'Engineering Head';

  const isSubmitted = !!todayReport;
  const isApproved = todayReport?.status === 'APPROVED';
  const isRejected = todayReport?.status === 'REJECTED';
  const isPending = isSubmitted && !isApproved && !isRejected;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Top Brand Bar: Exact Karios Reporting Logo + Quick Theme Toggle ── */}
      <View
        style={[
          styles.topBrandBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.surfaceBorder || colors.border,
          },
        ]}
      >
        <KariosLogo size={36} subtitle="REPORTING" align="left" />
        <ThemeToggleBtn size={38} />
      </View>

      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={colors.primary} />
        }
      >
        {/* ── Top Header ── */}
      <View style={styles.topHeader}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Department Overview</Text>
          <Text style={[styles.headerDate, { color: colors.textSecondary }]}>{formattedToday}</Text>
        </View>
      </View>

      {/* ── Department Card ── */}
      <View style={[styles.deptCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.deptIconCircle, { backgroundColor: colors.primary }]}>
          <Text style={styles.deptIconLetter}>{departmentLetter(user?.department)}</Text>
        </View>
        <View>
          <Text style={[styles.deptName, { color: colors.text }]}>{deptName}</Text>
          <Text style={[styles.deptRole, { color: colors.textSecondary }]}>{roleTitle}</Text>
        </View>
      </View>

      {/* ── Today's Daily Report Card ── */}
      <View style={[styles.todayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.todayCardHeader}>
          <Text style={[styles.todayCardTitle, { color: colors.text }]}>Today's Daily Report</Text>
          <View
            style={[
              styles.statusPill,
              !isSubmitted && { backgroundColor: isDark ? 'rgba(148, 163, 184, 0.15)' : '#F1F5F9' },
              isPending && { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7' },
              isApproved && { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#D1FAE5' },
              isRejected && { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2' },
            ]}
          >
            <Ionicons
              name={
                !isSubmitted
                  ? 'information-circle'
                  : isApproved
                  ? 'checkmark-circle'
                  : isRejected
                  ? 'close-circle'
                  : 'time'
              }
              size={13}
              color={
                !isSubmitted
                  ? colors.textSecondary
                  : isApproved
                  ? colors.approved
                  : isRejected
                  ? colors.rejected
                  : colors.pending
              }
            />
            <Text
              style={[
                styles.statusPillText,
                !isSubmitted && { color: colors.textSecondary },
                isPending && { color: colors.pending },
                isApproved && { color: colors.approved },
                isRejected && { color: colors.rejected },
              ]}
            >
              {!isSubmitted
                ? 'Not Submitted'
                : isApproved
                ? 'Approved'
                : isRejected
                ? 'Rejected'
                : 'Pending Review'}
            </Text>
          </View>
        </View>

        <Text style={[styles.todayCardDate, { color: colors.textSecondary }]}>{shortDate}</Text>
        <Text style={[styles.todayCardDesc, { color: colors.textSecondary }]}>
          {!isSubmitted
            ? 'Submit your daily operational updates, metrics, and blockers for today.'
            : isApproved
            ? 'Your report has been reviewed and approved by the CEO.'
            : isRejected
            ? 'Your report was rejected by the CEO. Please review feedback.'
            : 'Your report has been submitted and is currently pending review.'}
        </Text>

        {!isSubmitted ? (
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Submit')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>Submit Today's Report</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.viewBtn,
                {
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#EEF2FF',
                  borderColor: isDark ? '#3A3A5C' : '#DDD6FE',
                  flex: 1,
                },
              ]}
              onPress={() => navigation.navigate('ReportDetail', { reportId: todayReport.id })}
              activeOpacity={0.8}
            >
              <Ionicons name="eye" size={17} color={colors.primary} />
              <Text style={[styles.viewBtnText, { color: colors.primary }]}>View</Text>
            </TouchableOpacity>

            {!isApproved && (
              <TouchableOpacity
                style={[styles.editActionBtn, { backgroundColor: colors.primary, flex: 1.2 }]}
                onPress={() => navigation.navigate('SubmitReport', { editId: todayReport.id })}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={17} color="#FFFFFF" />
                <Text style={styles.editActionBtnText}>Edit Report</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* ── Key Metrics 2x2 Grid ── */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metricVal, { color: colors.text }]}>{stats.submitted}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>TOTAL REPORTS</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metricVal, { color: colors.pending }]}>{stats.pending}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>PENDING</Text>
          </View>
        </View>
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metricVal, { color: colors.approved }]}>{stats.approved}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>APPROVED</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metricVal, { color: colors.rejected }]}>{stats.rejected}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>REJECTED</Text>
          </View>
        </View>
      </View>

      {/* ── Recent Reports ── */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={[styles.recentTitle, { color: colors.text }]}>Recent Reports</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')} activeOpacity={0.7}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View all →</Text>
          </TouchableOpacity>
        </View>

        {recentReports.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No previous reports found</Text>
          </View>
        ) : (
          <View style={styles.recentList}>
            {recentReports.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => navigation.navigate('ReportDetail', { reportId: report.id })}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={[styles.historyDate, { color: colors.text }]}>
                    {formatRelativeDate(report.report_date)}
                  </Text>
                  <Text style={[styles.historySub, { color: colors.textSecondary }]} numberOfLines={1}>
                    {report.summary || 'Operational Daily Report'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    report.status === 'APPROVED' && { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#D1FAE5' },
                    report.status === 'REJECTED' && { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2' },
                    report.status === 'SUBMITTED' && { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      report.status === 'APPROVED' && { color: colors.approved },
                      report.status === 'REJECTED' && { color: colors.rejected },
                      report.status === 'SUBMITTED' && { color: colors.pending },
                    ]}
                  >
                    {report.status === 'APPROVED' ? 'Approved' : report.status === 'REJECTED' ? 'Rejected' : 'Pending'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  topBrandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  content: { padding: 20, paddingTop: 16, paddingBottom: 40, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  headerDate: { fontSize: 13, marginTop: 3 },

  deptCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  deptIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptIconLetter: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  deptName: { fontSize: 17, fontWeight: '700' },
  deptRole: { fontSize: 13, marginTop: 2 },

  todayCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  todayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayCardTitle: { fontSize: 16, fontWeight: '700' },
  todayCardDate: { fontSize: 13, marginTop: -4 },
  todayCardDesc: { fontSize: 14, lineHeight: 20 },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusPillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },

  submitBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10 },
  viewBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewBtnText: { fontSize: 14, fontWeight: '700' },
  editActionBtn: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  editActionBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  metricsContainer: {
    gap: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'center',
  },
  metricVal: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  metricLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  recentSection: { gap: 12, marginTop: 4 },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentTitle: { fontSize: 16, fontWeight: '700' },
  viewAllText: { fontSize: 13, fontWeight: '700' },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyText: { fontSize: 14 },
  recentList: { gap: 8 },
  historyCard: {
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  historyDate: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  historySub: { fontSize: 12, maxWidth: 180 },
});
