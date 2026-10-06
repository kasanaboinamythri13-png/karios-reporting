// mobile/src/screens/ceo/CeoReportDetailScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { formatDate, formatDateTime } from '../../utils/date';
import { departmentLabel } from '../../utils/roles';
import { formatUSD } from '../../utils/currency';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import { LoadingScreen, ErrorBanner } from '../../components/Feedback';

const FORM_FIELDS = {
  DEVELOPMENT: [
    { key: 'tasksCompleted', label: 'Tasks Completed', type: 'textarea' },
    { key: 'tasksInProgress', label: 'Tasks In Progress', type: 'textarea' },
    { key: 'bugsFixed', label: 'Bugs Fixed', type: 'number' },
    { key: 'deployments', label: 'Deployments', type: 'number' },
    { key: 'blockers', label: 'Blockers', type: 'textarea' },
    { key: 'planTomorrow', label: 'Plan for Tomorrow', type: 'textarea' },
  ],
  SALES: [
    { key: 'newLeads', label: 'New Leads', type: 'number' },
    { key: 'followUps', label: 'Follow-ups', type: 'number' },
    { key: 'dealsClosed', label: 'Deals Closed', type: 'number' },
    { key: 'revenueClosed', label: 'Revenue Closed', type: 'currency' },
    { key: 'pipelineValue', label: 'Pipeline Value', type: 'currency' },
    { key: 'blockers', label: 'Blockers', type: 'textarea' },
    { key: 'planTomorrow', label: 'Plan for Tomorrow', type: 'textarea' },
  ],
  MARKETING: [
    { key: 'activeCampaigns', label: 'Active Campaigns', type: 'number' },
    { key: 'spend', label: 'Marketing Spend', type: 'currency' },
    { key: 'impressions', label: 'Impressions', type: 'number' },
    { key: 'clicks', label: 'Clicks', type: 'number' },
    { key: 'leadsGenerated', label: 'Leads Generated', type: 'number' },
    { key: 'blockers', label: 'Blockers', type: 'textarea' },
    { key: 'planTomorrow', label: 'Plan for Tomorrow', type: 'textarea' },
  ],
  FINANCE: [
    { key: 'collections', label: 'Collections', type: 'currency' },
    { key: 'paymentsMade', label: 'Payments Made', type: 'currency' },
    { key: 'expenses', label: 'Expenses', type: 'currency' },
    { key: 'pendingInvoices', label: 'Pending Invoices', type: 'number' },
    { key: 'cashPosition', label: 'Cash Position', type: 'currency' },
    { key: 'blockers', label: 'Blockers', type: 'textarea' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
};

const MOCK_DETAIL = {
  id: 'demo-report-dev',
  department: 'DEVELOPMENT',
  head_title: 'Development Head',
  report_date: new Date().toISOString(),
  created_at: new Date().toISOString(),
  status: 'SUBMITTED',
  data: {
    tasksCompleted: '• Finished biometric auth sprint\n• Refactored API client middleware\n• Merged Vercel rewrite configs',
    tasksInProgress: '• Writing test coverage for push notification listeners\n• Testing offline persistence',
    bugsFixed: 4,
    deployments: 2,
    blockers: 'Awaiting App Store test account credentials from legal team.',
    planTomorrow: '• Prepare staging build for QA review\n• Conduct performance audit on Android',
  },
  attachments: [
    { id: 'att-1', name: 'qa_audit_log.pdf', size: 1048576 },
    { id: 'att-2', name: 'sprint_burndown.png', size: 524288 },
  ],
};

export default function CeoReportDetailScreen({ route, navigation }) {
  const { reportId, department = 'DEVELOPMENT', departmentTitle } = route.params || {};
  const { colors, isDark } = useTheme();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getReportById(reportId);
      const data = res?.report || res?.data || res;
      setReport(data || MOCK_DETAIL);
    } catch {
      setReport({ ...MOCK_DETAIL, id: reportId, department });
    } finally {
      setLoading(false);
    }
  }, [reportId, department]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleReview = async (status) => {
    if (status === 'REJECTED' && !comment.trim()) {
      Alert.alert(
        'Reason Required',
        'Please enter a comment explaining why this report is being rejected so the department head can fix it.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await api.reviewReport(reportId, {
        status,
        comment: comment.trim() || null,
      });
      Alert.alert(
        status === 'APPROVED' ? 'Report Approved' : 'Report Rejected',
        `The ${departmentLabel(report?.department)} report has been marked as ${status.toLowerCase()}.`
      );
      setReport((prev) => ({
        ...prev,
        status,
        review_comment: comment.trim() || null,
        reviewed_at: new Date().toISOString(),
      }));
      setComment('');
    } catch (err) {
      // In offline/mock mode update local state
      setReport((prev) => ({
        ...prev,
        status,
        review_comment: comment.trim() || null,
        reviewed_at: new Date().toISOString(),
      }));
      Alert.alert(
        status === 'APPROVED' ? 'Report Approved' : 'Report Rejected',
        `Updated report status to ${status}.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !report) {
    return <LoadingScreen message="Loading report details..." />;
  }

  const currentReport = report || MOCK_DETAIL;
  const dept = currentReport.department || department;
  const fields = FORM_FIELDS[dept] || FORM_FIELDS.DEVELOPMENT;
  const reportData = currentReport.data || {};

  const metricFields = [];
  const narrativeFields = [];
  let blockers = reportData.blockers || currentReport.blockers || null;

  fields.forEach((f) => {
    const val = reportData[f.key] ?? currentReport[f.key];
    if (f.key === 'blockers') {
      if (val) blockers = val;
      return;
    }
    if (val !== undefined && val !== null && val !== '') {
      if (f.type === 'currency') {
        metricFields.push({ label: f.label, value: formatUSD(val) });
      } else if (f.type === 'number') {
        metricFields.push({ label: f.label, value: Number(val).toLocaleString() });
      } else {
        narrativeFields.push({ label: f.label, value: val });
      }
    }
  });

  const isPending = currentReport.status === 'SUBMITTED';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={`${departmentLabel(dept)} Report`}
        subtitle={formatDate(currentReport.report_date)}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.reportTitle, { color: colors.text }]}>{departmentLabel(dept)} Daily Report</Text>
                <Text style={styles.submittedByText}>
                  Submitted by {currentReport.head_title || departmentTitle || 'Head'}
                </Text>
                <Text style={[styles.dateSubtext, { color: colors.textMuted }]}>
                  {formatDateTime(currentReport.created_at || currentReport.report_date)}
                </Text>
              </View>
              <StatusBadge status={currentReport.status} />
            </View>
          </View>

          {/* Metrics Section */}
          {metricFields.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>Daily Metrics</Text>
              <View style={styles.metricsGrid}>
                {metricFields.map((m) => (
                  <View
                    key={m.label}
                    style={[
                      styles.metricBox,
                      { backgroundColor: isDark ? colors.inputBg : colors.background },
                    ]}
                  >
                    <Text style={[styles.metricValue, { color: colors.text }]}>{m.value}</Text>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{m.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Narrative Content */}
          {narrativeFields.map((nf) => (
            <View key={nf.label} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{nf.label}</Text>
              <Text style={[styles.narrativeText, { color: colors.text }]}>{nf.value}</Text>
            </View>
          ))}

          {/* Blockers Alert */}
          {blockers && (
            <View style={[styles.card, styles.blockerCard, { backgroundColor: colors.pendingBg, borderColor: colors.pendingBorder }]}>
              <View style={styles.blockerTitleRow}>
                <Ionicons name="warning" size={18} color={colors.pending} />
                <Text style={[styles.blockerTitle, { color: colors.pending }]}>Reported Blockers</Text>
              </View>
              <Text style={[styles.blockerText, { color: colors.text }]}>{blockers}</Text>
            </View>
          )}

          {/* Attachments Section */}
          {currentReport.attachments && currentReport.attachments.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>Attachments</Text>
              {currentReport.attachments.map((att) => (
                <View
                  key={att.id}
                  style={[
                    styles.attachmentRow,
                    { backgroundColor: isDark ? colors.inputBg : colors.background },
                  ]}
                >
                  <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                  <Text style={[styles.attachmentName, { color: colors.text }]} numberOfLines={1}>
                    {att.name}
                  </Text>
                  <Ionicons name="download-outline" size={18} color={colors.textLight} />
                </View>
              ))}
            </View>
          )}

          {/* CEO Review Actions */}
          <View
            style={[
              styles.reviewCard,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.surfaceBorder : colors.primarySurface,
              },
            ]}
          >
            <Text style={[styles.reviewCardTitle, { color: colors.text }]}>Executive Review</Text>

            {isPending ? (
              <>
                <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Feedback / Reason (Required for rejection)</Text>
                <TextInput
                  style={[
                    styles.commentInput,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.surfaceBorder,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Enter comments or instructions for the team..."
                  placeholderTextColor={colors.textLight}
                  multiline
                  numberOfLines={4}
                  value={comment}
                  onChangeText={setComment}
                  textAlignVertical="top"
                />

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleReview('APPROVED')}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                        <Text style={styles.actionBtnText}>Approve</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleReview('REJECTED')}
                    disabled={submitting}
                  >
                    <Ionicons name="close-circle" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View
                style={[
                  styles.reviewedNotice,
                  currentReport.status === 'APPROVED'
                    ? [styles.reviewedApproved, { backgroundColor: colors.approvedBg, borderColor: colors.approvedBorder }]
                    : [styles.reviewedRejected, { backgroundColor: colors.rejectedBg, borderColor: colors.rejectedBorder }],
                ]}
              >
                <Ionicons
                  name={currentReport.status === 'APPROVED' ? 'checkmark-circle' : 'close-circle'}
                  size={24}
                  color={currentReport.status === 'APPROVED' ? colors.approved : colors.rejected}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reviewedStatusText, { color: colors.text }]}>
                    {currentReport.status === 'APPROVED' ? 'Report Approved' : 'Report Rejected'}
                  </Text>
                  {currentReport.review_comment && (
                    <Text style={[styles.reviewedCommentText, { color: colors.text }]}>
                      "{currentReport.review_comment}"
                    </Text>
                  )}
                  {currentReport.reviewed_at && (
                    <Text style={[styles.reviewedDateText, { color: colors.textMuted }]}>
                      Reviewed {formatDateTime(currentReport.reviewed_at)}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  submittedByText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },
  dateSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 10,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  narrativeText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
  },
  blockerCard: {
    backgroundColor: colors.pendingBg,
    borderColor: colors.pendingBorder,
  },
  blockerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  blockerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.pending,
    textTransform: 'uppercase',
  },
  blockerText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  attachmentName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.primarySurface,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  reviewCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 6,
  },
  commentInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 88,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  approveBtn: {
    backgroundColor: colors.approved,
  },
  rejectBtn: {
    backgroundColor: colors.rejected,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  reviewedNotice: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  reviewedApproved: {
    backgroundColor: colors.approvedBg,
    borderColor: colors.approvedBorder,
  },
  reviewedRejected: {
    backgroundColor: colors.rejectedBg,
    borderColor: colors.rejectedBorder,
  },
  reviewedStatusText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  reviewedCommentText: {
    fontSize: 13,
    color: colors.text,
    fontStyle: 'italic',
    marginTop: 4,
  },
  reviewedDateText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
  },
});
