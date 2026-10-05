// src/screens/shared/ReportDetailScreen.js
// Generic report detail screen with Back navigation and Edit Report capability

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getReport } from '../../api/reportsApi';
import StatusBadge from '../../components/StatusBadge';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { departmentLabel, departmentLetter, formatRelativeDate, formatISTTime } from '../../utils/formatters';

export default function ReportDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { reportId } = route.params || {};
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reportId) {
      setLoading(false);
      return;
    }
    getReport(reportId)
      .then(setReport)
      .catch(() => Alert.alert('Error', 'Could not load report.'))
      .finally(() => setLoading(false));
  }, [reportId]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Report not found.</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Can the logged-in user edit this report?
  // Only Heads can edit, and only if not yet approved.
  const isHead = user?.role === 'HEAD' || (user?.department && user.department === report.department);
  const canEdit = isHead && report.status !== 'APPROVED';

  const handleEdit = () => {
    navigation.navigate('SubmitReport', { editId: report.id });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Top App Bar ── */}
      <View style={[styles.appBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.appBarCenter}>
          <Text style={[styles.appBarTitle, { color: colors.text }]}>Report Details</Text>
        </View>

        {canEdit ? (
          <TouchableOpacity
            style={[styles.editTopBtn, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE' }]}
            onPress={handleEdit}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={[styles.editTopBtnText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Status Header Card ── */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.deptBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.deptBadgeText}>{departmentLetter(report.department)}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.deptTitle, { color: colors.text }]}>{departmentLabel(report.department)}</Text>
            <Text style={[styles.dateStr, { color: colors.textSecondary }]}>{formatRelativeDate(report.report_date)}</Text>
          </View>
          <StatusBadge status={report.status} />
        </View>

        <Text style={[styles.submittedAt, { color: colors.textMuted }]}>
          Submitted at {formatISTTime(report.created_at)}
        </Text>

        {/* ── Rejection Alert if Rejected ── */}
        {report.status === 'REJECTED' && (
          <View style={[styles.rejectedBanner, { backgroundColor: isDark ? '#3E1F1F' : '#FEF2F2', borderColor: '#EF4444' }]}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.rejectedTitle, { color: '#EF4444' }]}>Changes Requested by CEO</Text>
              {report.review_comment ? (
                <Text style={[styles.rejectedDesc, { color: colors.text }]}>"{report.review_comment}"</Text>
              ) : null}
              <Text style={[styles.rejectedHint, { color: colors.textSecondary }]}>
                Tap "Edit Report" below to make adjustments and re-submit for review.
              </Text>
            </View>
          </View>
        )}

        {/* ── Report Fields Card ── */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Report</Text>
          {Object.entries(report.data || {}).map(([key, val]) => {
            if (!val && val !== 0) return null;
            if (key === 'blockers' && report.blockers) return null;
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
            return (
              <View key={key} style={[styles.fieldRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
                <Text style={[styles.fieldValue, { color: colors.text }]}>{String(val)}</Text>
              </View>
            );
          })}
          {report.blockers ? (
            <View style={[styles.fieldRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Blockers</Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>{report.blockers}</Text>
            </View>
          ) : null}
        </View>

        {/* ── CEO Review Card ── */}
        {(report.reviewed_at || report.review_comment) && (
          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderLeftWidth: 4,
                borderLeftColor: report.status === 'APPROVED' ? colors.approved : colors.rejected,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>CEO Review</Text>
            <Text style={[styles.reviewAt, { color: colors.textMuted }]}>Reviewed {formatISTTime(report.reviewed_at)}</Text>
            {report.review_comment ? (
              <Text style={[styles.reviewComment, { color: colors.text }]}>{report.review_comment}</Text>
            ) : null}
          </View>
        )}

        {/* ── Bottom Action: Edit Report Button ── */}
        {canEdit && (
          <TouchableOpacity
            style={[styles.bottomEditBtn, { backgroundColor: colors.primary }]}
            onPress={handleEdit}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text style={styles.bottomEditBtnText}>Edit This Report</Text>
          </TouchableOpacity>
        )}

        {report.status === 'APPROVED' && (
          <View style={styles.approvedNote}>
            <Ionicons name="checkmark-circle" size={16} color={colors.approved} />
            <Text style={[styles.approvedNoteText, { color: colors.textSecondary }]}>
              This report has been approved by the CEO and is read-only.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   { padding: 18, paddingBottom: 48, gap: 14 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, marginBottom: 16 },
  retryBtn:  { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryText: { color: '#FFFFFF', fontWeight: '700' },

  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarCenter: { flex: 1, alignItems: 'center' },
  appBarTitle: { fontSize: 17, fontWeight: '800' },
  editTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  editTopBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 18,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  deptBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptBadgeText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerInfo: { flex: 1 },
  deptTitle:  { fontSize: 17, fontWeight: '800' },
  dateStr:    { fontSize: 13, marginTop: 2 },
  submittedAt:{ fontSize: 12, marginTop: -6, marginLeft: 4 },

  rejectedBanner: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  rejectedTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  rejectedDesc: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
  },
  rejectedHint: {
    fontSize: 12,
    marginTop: 4,
  },

  section: {
    borderRadius: 16, padding: 16, gap: 10,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  fieldRow:   { borderBottomWidth: 1, paddingBottom: 10, gap: 3 },
  fieldLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldValue: { fontSize: 14, lineHeight: 20 },
  reviewAt:   { fontSize: 12 },
  reviewComment: { fontSize: 14, lineHeight: 20 },

  bottomEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  bottomEditBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  approvedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  approvedNoteText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
