// src/screens/ceo/CeoReportsListScreen.js
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { listReports } from '../../api/reportsApi';
import StatusBadge from '../../components/StatusBadge';
import { useTheme } from '../../context/ThemeContext';
import { formatRelativeDate, departmentLetter, departmentLabel } from '../../utils/formatters';
import ReportFilterBar from '../../components/ReportFilterBar';

export default function CeoReportsListScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus]         = useState('ALL');
  const [from, setFrom]             = useState('');
  const [to, setTo]                 = useState('');

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

  const hasActiveFilters = Boolean((status && status !== 'ALL') || from || to);

  function renderItem({ item }) {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => navigation.navigate('CeoReportDetail', { reportId: item.id })}
        activeOpacity={0.75}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.deptBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.deptBadgeText}>{departmentLetter(item.department)}</Text>
          </View>
          <View>
            <Text style={[styles.deptName, { color: colors.text }]}>{departmentLabel(item.department)}</Text>
            <Text style={[styles.dateStr, { color: colors.textSecondary }]}>{formatRelativeDate(item.report_date)}</Text>
          </View>
        </View>
        <StatusBadge status={item.status} small />
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
    <FlatList
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      data={displayed}
      keyExtractor={(r) => String(r.id)}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadReports(true)} tintColor={colors.primary} />
      }
      ListHeaderComponent={
        <View style={styles.listHeader}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>All Reports</Text>
          <ReportFilterBar
            status={status}
            from={from}
            to={to}
            onStatusChange={(s) => setStatus(s)}
            onFromChange={(f) => setFrom(f)}
            onToChange={(t) => setTo(t)}
            onClear={() => {
              setStatus('ALL');
              setFrom('');
              setTo('');
            }}
          />
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📂</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {hasActiveFilters ? 'No reports match these filters' : 'No reports found'}
          </Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            {hasActiveFilters ? 'Try adjusting or clearing the status or date range.' : 'No department reports yet.'}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   { padding: 20, paddingBottom: 40, gap: 10 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listHeader:{ marginBottom: 4, gap: 14 },
  pageTitle: { fontSize: 22, fontWeight: '800' },
  card: {
    borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardLeft:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  deptBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  deptName:  { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  dateStr:   { fontSize: 12 },
  empty:     { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle:{ fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySub:  { fontSize: 14 },
});
