// mobile/src/screens/ceo/CeoReportsScreen.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  RefreshControl,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { departmentLabel } from '../../utils/roles';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import { LoadingScreen, EmptyState } from '../../components/Feedback';

const STATUS_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'SUBMITTED', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
];

const DEPARTMENTS = [
  { key: '', label: 'All Departments' },
  { key: 'DEVELOPMENT', label: 'Development' },
  { key: 'SALES', label: 'Sales' },
  { key: 'MARKETING', label: 'Marketing' },
  { key: 'FINANCE', label: 'Finance' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const formatDDMMYYYY = (isoStr) => {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return isoStr;
};

const formatReportTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeFormatted = d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateFormatted} · ${timeFormatted}`;
  } catch {
    return dateStr;
  }
};

export default function CeoReportsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [filter, setFilter] = useState('ALL');
  const [department, setDepartment] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [rawReports, setRawReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [deptModalVisible, setDeptModalVisible] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState(null); // 'from' | 'to' | null

  // Calendar state
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(9); // 9 = October (0-indexed)

  const fetchReports = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const params = {};
      if (filter !== 'ALL') params.status = filter;
      if (department) params.department = department;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const res = await api.getReports(params);
      const data = res?.data || res?.reports || res || [];
      setRawReports(Array.isArray(data) ? data : []);
    } catch {
      setRawReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, department, dateFrom, dateTo]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports(true);
  };

  // Local filtering & search over raw reports
  const filteredReports = useMemo(() => {
    return rawReports.filter((r) => {
      // Status filter
      if (filter === 'SUBMITTED' && r.status !== 'SUBMITTED') return false;
      if (filter === 'APPROVED' && r.status !== 'APPROVED') return false;
      if (filter === 'REJECTED' && r.status !== 'REJECTED') return false;

      // Department filter
      if (department && r.department) {
        if (r.department.toUpperCase() !== department.toUpperCase()) return false;
      }

      // Date range filter
      const reportDate = r.report_date ? r.report_date.split('T')[0] : '';
      if (dateFrom && reportDate && reportDate < dateFrom) return false;
      if (dateTo && reportDate && reportDate > dateTo) return false;

      return true;
    });
  }, [rawReports, filter, department, dateFrom, dateTo]);

  const hasActiveFilters = Boolean(department || dateFrom || dateTo);

  const clearAllFilters = () => {
    setDepartment('');
    setDateFrom('');
    setDateTo('');
  };

  // Open calendar modal
  const openDatePicker = (target) => {
    const existingVal = target === 'from' ? dateFrom : dateTo;
    if (existingVal) {
      const parts = existingVal.split('-');
      if (parts.length === 3) {
        setCalYear(parseInt(parts[0], 10));
        setCalMonth(parseInt(parts[1], 10) - 1);
      }
    } else {
      const now = new Date();
      setCalYear(now.getFullYear());
      setCalMonth(now.getMonth());
    }
    setDatePickerTarget(target);
  };

  // Calendar helpers
  const daysInMonth = useMemo(() => {
    return new Date(calYear, calMonth + 1, 0).getDate();
  }, [calYear, calMonth]);

  const firstDayOffset = useMemo(() => {
    return new Date(calYear, calMonth, 1).getDay();
  }, [calYear, calMonth]);

  const handleSelectDay = (day) => {
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const iso = `${calYear}-${mm}-${dd}`;

    if (datePickerTarget === 'from') {
      setDateFrom(iso);
    } else if (datePickerTarget === 'to') {
      setDateTo(iso);
    }
    setDatePickerTarget(null);
  };

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
        },
      ]}
      onPress={() =>
        navigation.navigate('CeoReportDetail', {
          reportId: item.id,
          department: item.department,
          departmentTitle: item.head_title,
        })
      }
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.deptName, { color: colors.text }]}>{departmentLabel(item.department)}</Text>
        <StatusBadge status={item.status} size="small" />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={13} color={colors.textMuted} />
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Submitted by:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
            {item.head_title || item.submitted_by || 'Department Head'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={13} color={colors.textMuted} />
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Time:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
            {formatReportTime(item.created_at || item.submitted_at || item.report_date)}
          </Text>
        </View>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: colors.surfaceBorder }]}>
        <View style={styles.viewRow}>
          <Text style={[styles.viewText, { color: colors.primary }]}>Inspect</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Company Reports" subtitle="All department submissions" />

      {/* Status Filter Tabs */}
      <View style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        {STATUS_FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterTab,
                {
                  backgroundColor: active ? colors.primary : (isDark ? colors.surface : colors.background),
                  borderColor: active ? colors.primary : colors.surfaceBorder,
                },
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: active ? '#ffffff' : colors.textMuted },
                  active && styles.filterTabTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Filter Card (Department & Date Range) */}
      <View style={[styles.filterCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        {/* Filter Controls Row: Department, From Date, To Date */}
        <View style={styles.controlsRow}>
          {/* Department Dropdown */}
          <View style={styles.controlGroupDept}>
            <Text style={[styles.controlLabel, { color: colors.textMuted }]}>Department</Text>
            <TouchableOpacity
              style={[
                styles.dropdownBtn,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.surfaceBorder,
                },
              ]}
              onPress={() => setDeptModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dropdownBtnText,
                  { color: Boolean(department) ? colors.text : colors.textMuted },
                  Boolean(department) && styles.dropdownBtnTextActive,
                ]}
                numberOfLines={1}
              >
                {department ? departmentLabel(department) : 'All'}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* Date Range: From */}
          <View style={styles.controlGroupDate}>
            <Text style={[styles.controlLabel, { color: colors.textMuted }]}>From</Text>
            <TouchableOpacity
              style={[
                styles.dateInputBtn,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: dateFrom ? colors.primary : colors.surfaceBorder,
                },
                Boolean(dateFrom) && [styles.dateInputBtnActive, { backgroundColor: isDark ? colors.primaryLight : '#f5f3ff' }],
              ]}
              onPress={() => openDatePicker('from')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dateInputText,
                  { color: dateFrom ? (isDark ? '#c4b5fd' : colors.primary) : colors.textLight },
                  Boolean(dateFrom) && styles.dateInputTextActive,
                ]}
              >
                {dateFrom ? formatDDMMYYYY(dateFrom) : 'dd-mm-yyyy'}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={dateFrom ? colors.primary : colors.textLight}
              />
            </TouchableOpacity>
          </View>

          {/* Date Range: To */}
          <View style={styles.controlGroupDate}>
            <Text style={[styles.controlLabel, { color: colors.textMuted }]}>To</Text>
            <TouchableOpacity
              style={[
                styles.dateInputBtn,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: dateTo ? colors.primary : colors.surfaceBorder,
                },
                Boolean(dateTo) && [styles.dateInputBtnActive, { backgroundColor: isDark ? colors.primaryLight : '#f5f3ff' }],
              ]}
              onPress={() => openDatePicker('to')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dateInputText,
                  { color: dateTo ? (isDark ? '#c4b5fd' : colors.primary) : colors.textLight },
                  Boolean(dateTo) && styles.dateInputTextActive,
                ]}
              >
                {dateTo ? formatDDMMYYYY(dateTo) : 'dd-mm-yyyy'}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={dateTo ? colors.primary : colors.textLight}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Filters / Clear Button */}
        {hasActiveFilters && (
          <View style={[styles.activeFiltersRow, { borderTopColor: colors.surfaceBorder }]}>
            <Text style={[styles.resultsCountText, { color: colors.textMuted }]}>
              Showing {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}
            </Text>
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={clearAllFilters}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={13} color="#dc2626" />
              <Text style={styles.clearBtnText}>Clear filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Reports List */}
      {loading && !refreshing ? (
        <LoadingScreen message="Loading reports..." />
      ) : (
        <FlatList
          data={filteredReports}
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
              title="No reports found"
              description={
                hasActiveFilters
                  ? 'No submissions match your active filter criteria. Try clearing filters.'
                  : `There are currently no ${filter !== 'ALL' ? filter.toLowerCase() : ''} reports.`
              }
            />
          }
        />
      )}

      {/* ── Department Picker Modal ── */}
      <Modal
        visible={deptModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeptModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDeptModalVisible(false)}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.surfaceBorder }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filter by Department</Text>
              <TouchableOpacity onPress={() => setDeptModalVisible(false)}>
                <Ionicons name="close" size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {DEPARTMENTS.map((dept) => {
                const isSelected = department === dept.key;
                return (
                  <TouchableOpacity
                    key={dept.key || 'ALL'}
                    style={[
                      styles.modalOption,
                      isSelected && {
                        backgroundColor: isDark ? colors.primaryLight : '#f3e8ff',
                      },
                    ]}
                    onPress={() => {
                      setDepartment(dept.key);
                      setDeptModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        { color: isSelected ? (isDark ? '#c4b5fd' : colors.primary) : colors.text },
                        isSelected && styles.modalOptionTextSelected,
                      ]}
                    >
                      {dept.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* ── Date Picker Calendar Modal ── */}
      <Modal
        visible={Boolean(datePickerTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setDatePickerTarget(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDatePickerTarget(null)}>
          <Pressable
            style={[styles.calendarModalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.surfaceBorder }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {datePickerTarget === 'from' ? 'Select "From" Date' : 'Select "To" Date'}
              </Text>
              <TouchableOpacity onPress={() => setDatePickerTarget(null)}>
                <Ionicons name="close" size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigation */}
            <View style={styles.calNavRow}>
              <TouchableOpacity
                style={[styles.calNavBtn, { backgroundColor: isDark ? colors.inputBg : colors.background }]}
                onPress={handlePrevMonth}
              >
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.calNavTitle, { color: colors.text }]}>
                {MONTH_NAMES[calMonth]} {calYear}
              </Text>
              <TouchableOpacity
                style={[styles.calNavBtn, { backgroundColor: isDark ? colors.inputBg : colors.background }]}
                onPress={handleNextMonth}
              >
                <Ionicons name="chevron-forward" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Day Labels */}
            <View style={[styles.calDaysHeader, { borderBottomColor: colors.surfaceBorder }]}>
              {DAY_LABELS.map((d) => (
                <Text key={d} style={[styles.calDayLabel, { color: colors.textLight }]}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.calGrid}>
              {/* Empty leading slots */}
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.calDayCell} />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const mm = String(calMonth + 1).padStart(2, '0');
                const dd = String(day).padStart(2, '0');
                const currentIso = `${calYear}-${mm}-${dd}`;
                const activeVal = datePickerTarget === 'from' ? dateFrom : dateTo;
                const isSelected = activeVal === currentIso;

                return (
                  <TouchableOpacity
                    key={`day-${day}`}
                    style={[styles.calDayCell, isSelected && { backgroundColor: colors.primary }]}
                    onPress={() => handleSelectDay(day)}
                  >
                    <Text
                      style={[
                        styles.calDayText,
                        { color: isSelected ? '#ffffff' : colors.text },
                        isSelected && styles.calDayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Calendar Quick Actions */}
            <View style={[styles.calFooter, { borderTopColor: colors.surfaceBorder }]}>
              <TouchableOpacity
                style={[styles.calFooterBtn, { backgroundColor: isDark ? colors.inputBg : colors.background }]}
                onPress={() => {
                  const today = new Date().toISOString().split('T')[0];
                  if (datePickerTarget === 'from') setDateFrom(today);
                  else setDateTo(today);
                  setDatePickerTarget(null);
                }}
              >
                <Text style={[styles.calFooterBtnText, { color: colors.primary }]}>Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.calFooterBtn, { backgroundColor: isDark ? colors.inputBg : colors.background }]}
                onPress={() => {
                  if (datePickerTarget === 'from') setDateFrom('');
                  else setDateTo('');
                  setDatePickerTarget(null);
                }}
              >
                <Text style={[styles.calFooterBtnText, { color: '#dc2626' }]}>Clear</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  filterTabActive: {},
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterTabTextActive: {
    fontWeight: '700',
  },

  // ── Filter Card ──
  filterCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  controlGroupDept: {
    flex: 1.1,
  },
  controlGroupDate: {
    flex: 1,
  },
  controlLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  dropdownBtnText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  dropdownBtnTextActive: {
    fontWeight: '700',
  },
  dateInputBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  dateInputBtnActive: {},
  dateInputText: {
    fontSize: 11,
    fontWeight: '500',
  },
  dateInputTextActive: {
    fontWeight: '700',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
  },
  resultsCountText: {
    fontSize: 11,
    fontWeight: '600',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },

  // ── Reports List & Card ──
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  deptName: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardBody: {
    gap: 7,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Modals ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalBody: {
    gap: 4,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    fontWeight: '700',
  },

  // ── Calendar Modal ──
  calendarModalCard: {
    width: '100%',
    maxWidth: 330,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  calNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
    paddingHorizontal: 6,
  },
  calNavBtn: {
    padding: 6,
    borderRadius: 8,
  },
  calNavTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  calDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
    paddingVertical: 4,
    borderBottomWidth: 1,
  },
  calDayLabel: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calDayCell: {
    width: `${100 / 7}%`,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    marginVertical: 2,
  },
  calDayText: {
    fontSize: 13,
    fontWeight: '500',
  },
  calDayTextSelected: {
    fontWeight: '700',
  },
  calFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  calFooterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  calFooterBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
