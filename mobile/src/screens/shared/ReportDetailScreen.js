// src/screens/shared/ReportDetailScreen.js
// Generic report detail screen with Back navigation and Edit Report capability

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getReport, listReports } from '../../api/reportsApi';
import { formatFileSize } from '../../api/attachmentsApi';
import StatusBadge from '../../components/StatusBadge';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { departmentLabel, departmentLetter, formatRelativeDate, formatISTTime } from '../../utils/formatters';
import AttachmentViewerModal from '../../components/AttachmentViewerModal';

function formatRejectionDateTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeFormatted = d.toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${dateFormatted}, ${timeFormatted}`;
  } catch {
    return dateStr;
  }
}

export default function ReportDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { reportId, id, report_id, department } = route.params || {};
  const activeReportId = reportId || id || report_id;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAttachment, setSelectedAttachment] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!activeReportId && !department) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        if (activeReportId) {
          const res = await getReport(activeReportId);
          const rep = (res && res.id) ? res : (res?.report?.id ? res.report : (res?.report || res));
          if (rep && (rep.id || rep.department) && isMounted) {
            setReport(rep);
            return;
          }
        }
        if (department) {
          const list = await listReports({ department });
          if (list && list.length > 0 && isMounted) {
            setReport(list[0]);
            return;
          }
        }
      } catch {
        if (isMounted) Alert.alert('Error', 'Could not load report.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [activeReportId, department]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      if (user?.role === 'CEO') {
        navigation.navigate('CeoMain');
      } else {
        navigation.navigate('HeadApp');
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Report not found.</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={handleBack}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
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
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Top App Bar ── */}
      <View style={[styles.appBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.appBarCenter}>
          <Text style={[styles.appBarTitle, { color: colors.text }]}>Report Details</Text>
        </View>

        <View style={{ width: 40 }} />
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
          <View
            style={[
              styles.rejectedBanner,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.14)' : '#FEF2F2',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.28)' : '#FECACA',
              },
            ]}
          >
            <Text style={[styles.rejectedTitle, { color: isDark ? '#F87171' : '#DC2626' }]}>
              Rejected by CEO{report.reviewed_at ? ` · ${formatRejectionDateTime(report.reviewed_at)}` : ''}
            </Text>
            {report.review_comment ? (
              <Text style={[styles.rejectedDesc, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
                "{report.review_comment}"
              </Text>
            ) : null}
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

        {/* ── Supporting Attachments Card ── */}
        {Array.isArray(report.attachments) && report.attachments.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Attached Files ({report.attachments.length})
            </Text>
            {report.attachments.map((file, idx) => {
              const name = file.fileName || file.filename || `Attachment ${idx + 1}`;
              const isPdf = file.mimeType === 'application/pdf' || name.toLowerCase().endsWith('.pdf');
              return (
                <TouchableOpacity
                  key={file.id || idx}
                  style={[styles.fieldRow, { borderBottomColor: colors.border, alignItems: 'center' }]}
                  onPress={() => setSelectedAttachment(file)}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <Ionicons
                      name={isPdf ? 'document-text' : 'image'}
                      size={20}
                      color={isPdf ? '#EF4444' : '#3B82F6'}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
                        {name}
                      </Text>
                      {file.sizeBytes ? (
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>
                          {formatFileSize(file.sizeBytes)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <Ionicons name="eye-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              );
            })}
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

      <AttachmentViewerModal
        visible={Boolean(selectedAttachment)}
        attachment={selectedAttachment}
        onClose={() => setSelectedAttachment(null)}
      />
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarCenter: { flex: 1, alignItems: 'center' },
  appBarTitle: { fontSize: 17, fontWeight: '800' },

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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  rejectedTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  rejectedDesc: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
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
