// mobile/src/screens/ceo/CeoOverviewScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { getTodayISODate, formatLongDate } from '../../utils/date';
import { departmentLabel } from '../../utils/roles';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import KariosLogo from '../../components/KariosLogo';
import { LoadingScreen, ErrorBanner } from '../../components/Feedback';
import DatePickerModal from '../../components/DatePickerModal';

export default function CeoOverviewScreen({ navigation }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const [date, setDate] = useState(getTodayISODate());
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadOverview = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      setError(null);
      try {
        const res = await api.getCeoOverview(date);
        const overviewData = res?.data || res;
        setData(overviewData);
      } catch (err) {
        setError(err.message || 'Cannot load live CEO overview from server.');
        setData(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [date]
  );

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOverview(true);
  };

  if (loading && !refreshing) {
    return <LoadingScreen message="Loading CEO Dashboard..." />;
  }

  const summary = data?.summary || {
    totalDepartments: 0,
    submittedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
  };
  const pendingCount = Math.max(
    0,
    (summary.submittedCount || 0) -
      (summary.approvedCount || 0) -
      (summary.rejectedCount || 0)
  );
  const departments = data?.departments || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Top Brand Bar: Exact Karios Reporting Logo + Quick Theme Toggle ── */}
      <View
        style={[
          styles.topBrandBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.surfaceBorder,
          },
        ]}
      >
        <KariosLogo size={36} subtitle="REPORTING" align="left" />

        {/* Quick Theme Toggle Icon Only */}
        <TouchableOpacity
          style={[
            styles.quickThemeBtn,
            {
              backgroundColor: isDark ? colors.primaryLight : '#f3e8ff',
              borderColor: isDark ? 'rgba(139, 92, 246, 0.4)' : '#e9d5ff',
            },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isDark ? 'sunny-outline' : 'moon-outline'}
            size={18}
            color={isDark ? '#fcd34d' : colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <ErrorBanner message={error} onRetry={() => loadOverview()} />

        {/* ── CEO Overview Header & Date ── */}
        <View style={styles.overviewHeader}>
          <View style={styles.overviewHeaderLeft}>
            <Text style={[styles.overviewTitle, { color: colors.text }]}>CEO Overview</Text>
            <Text style={[styles.overviewDate, { color: colors.textMuted }]}>
              {formatLongDate(date)}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.datePickerBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
            onPress={() => setIsDatePickerVisible(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.datePickerBtnText, { color: colors.text }]}>{date}</Text>
            <Ionicons name="calendar-outline" size={15} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* 4 Quick Stat Cards */}
        <View style={styles.statsGrid}>
          <StatCard
            value={`${summary.submittedCount}/${summary.totalDepartments}`}
            label="Submitted"
            color={colors.text}
          />
          <StatCard
            value={pendingCount}
            label="Pending Review"
            color={colors.pending}
          />
          <StatCard
            value={summary.approvedCount}
            label="Approved"
            color={colors.approved}
          />
          <StatCard
            value={summary.rejectedCount}
            label="Rejected"
            color={colors.rejected}
          />
        </View>

        {/* Department Status Cards Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Department Status</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
            {summary.submittedCount} of {summary.totalDepartments} submitted
          </Text>
        </View>

        <View style={styles.deptGrid}>
          {departments.map((dept) => {
            const hasReport = Boolean(dept.reportId);
            return (
              <TouchableOpacity
                key={dept.department}
                style={[
                  styles.deptCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.surfaceBorder,
                  },
                  !hasReport && [
                    styles.deptCardDisabled,
                    {
                      backgroundColor: isDark ? '#12171f' : '#fafbfc',
                      borderColor: isDark ? '#232b38' : '#ececf4',
                    },
                  ],
                ]}
                activeOpacity={hasReport ? 0.7 : 0.9}
                onPress={() => {
                  if (hasReport) {
                    navigation.navigate('CeoReportDetail', {
                      reportId: dept.reportId,
                      department: dept.department,
                      departmentTitle: dept.title,
                    });
                  } else {
                    Alert.alert(
                      `${departmentLabel(dept.department)} Status`,
                      'No report has been submitted by this department yet today.'
                    );
                  }
                }}
              >
                <View style={styles.deptCardTop}>
                  <View style={styles.deptHeaderRow}>
                    <Text style={[styles.deptName, { color: colors.text }]} numberOfLines={1}>
                      {departmentLabel(dept.department)}
                    </Text>
                    {hasReport ? (
                      <Ionicons
                        name="chevron-forward"
                        size={15}
                        color={colors.primary}
                        style={styles.cardChevron}
                      />
                    ) : null}
                  </View>
                  <Text style={[styles.deptTitle, { color: colors.textMuted }]} numberOfLines={1}>
                    {dept.title || 'Department Head'}
                  </Text>
                </View>

                <View style={styles.deptCardBottom}>
                  <StatusBadge status={dept.status} size="small" />
                  <View style={styles.timestampRow}>
                    <Ionicons
                      name="time-outline"
                      size={11}
                      color={dept.submittedAt ? colors.textMuted : colors.textLight}
                    />
                    <Text
                      style={[styles.timestampText, { color: colors.textMuted }]}
                      numberOfLines={1}
                    >
                      {dept.submittedAt
                        ? `Submitted ${new Date(dept.submittedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
                        : 'Not submitted today'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <DatePickerModal
        visible={isDatePickerVisible}
        title="Select Overview Date"
        currentDate={date}
        maxDate={getTodayISODate()}
        onSelect={(iso) => {
          setDate(iso);
          setIsDatePickerVisible(false);
        }}
        onClose={() => setIsDatePickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  topBrandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  quickThemeBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 2,
    marginTop: 4,
  },
  overviewHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  overviewTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  overviewDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  datePickerBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  deptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  deptCard: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48.5%',
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    minHeight: 138,
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  deptCardDisabled: {
    opacity: 0.85,
  },
  deptCardTop: {
    marginBottom: 10,
  },
  deptHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deptName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 4,
  },
  cardChevron: {
    marginLeft: 2,
  },
  deptTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  deptCardBottom: {
    gap: 8,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestampText: {
    fontSize: 11,
    flex: 1,
  },
});
