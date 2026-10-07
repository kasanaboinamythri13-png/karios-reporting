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
import AttachmentViewerModal from '../../components/AttachmentViewerModal';

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
    { key: 'planTomorrow', label: 'Plan for Tomorrow', type: 'textarea' },
  ],
};

export default function CeoReportDetailScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const { reportId, id, report_id, department, departmentTitle } = route.params || {};
  const activeReportId = reportId || id || report_id;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeReportId) {
        const res = await api.getReport(activeReportId);
        // Handle all shapes: direct object, wrapped in report, or wrapped in data
        const rep = (res && res.id)
          ? res
          : (res?.report?.id ? res.report : (res?.data?.id ? res.data : (res?.report || res)));

        if (rep && (rep.id || rep.department || rep.status)) {
          setReport(rep);
          return;
        }
      }

      // Fallback: If no reportId or report not found by ID, check if department was provided
      const targetDept = department || route?.params?.department;
      if (targetDept) {
        const res = await api.getReports({ department: targetDept });
        const list = res?.reports || (Array.isArray(res?.data) ? res.data : []) || (Array.isArray(res) ? res : []);
        if (list && list.length > 0) {
          setReport(list[0]);
          return;
        }
      }

      setError('Report not found.');
    } catch (err) {
      setError(err.message || 'Failed to load report from server.');
    } finally {
      setLoading(false);
    }
  }, [activeReportId, department, route?.params?.department]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleReview = async (decision) => {
    if (decision === 'REJECTED' && !comment.trim()) {
      Alert.alert(
        'Rejection Comment Required',
        'Please enter a comment explaining why this report is rejected. A comment is mandatory when rejecting a report.'
      );
      return;
    }

    Alert.alert(
      decision === 'APPROVED' ? 'Approve Report' : 'Reject Report',
      `Are you sure you want to mark this report as ${decision.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: decision === 'APPROVED' ? 'Approve' : 'Reject',
          style: decision === 'REJECTED' ? 'destructive' : 'default',
          onPress: async () => {
            setSubmitting(true);
            try {
              const currentId = activeReportId || report?.id;
              await api.reviewReport(currentId, {
                status: decision,
                comment: comment.trim(),
              });
              Alert.alert('Success', `Report has been marked as ${decision}.`);
              setReport((prev) => {
                const base = prev?.report || prev || {};
                return {
                  ...base,
                  status: decision,
                  review_comment: comment.trim(),
                  reviewed_at: new Date().toISOString(),
                };
              });
              setComment('');
            } catch (err) {
              Alert.alert('Review Failed', err.message || 'Could not submit review to server.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingScreen message="Loading report details..." />;
  }

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('CeoMain');
    }
  };

  if (!report) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Report Details" onBack={handleBack} />
        <View style={{ padding: 20 }}>
          <ErrorBanner message={error || 'Report not found.'} onRetry={fetchReport} />
          <TouchableOpacity
            style={[styles.goBackBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={16} color={colors.primary} />
            <Text style={[styles.goBackBtnText, { color: colors.primary }]}>Go Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentReport = report?.report || report || {};
  const deptKey = currentReport.department || department || 'DEVELOPMENT';
  const fields = FORM_FIELDS[deptKey] || FORM_FIELDS.DEVELOPMENT;
  const reportData = { ...(currentReport.data || {}), ...currentReport };
  const isPending = currentReport.status === 'SUBMITTED';

  const numericFields = fields.filter((f) => f.type === 'number' || f.type === 'currency');
  const narrativeFields = fields.filter((f) => f.type === 'textarea');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={`${departmentLabel(deptKey)} Report`}
        subtitle={formatDate(currentReport.date || currentReport.created_at)}
        onBack={handleBack}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ErrorBanner message={error} onRetry={fetchReport} />

          {/* Header Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.reportTitle, { color: colors.text }]}>
                  {departmentLabel(deptKey)} Daily Report
                </Text>
                <Text style={[styles.submittedByText, { color: colors.primary }]}>
                  Submitted by {currentReport.head_title || departmentTitle || 'Head'}
                </Text>
                <Text style={[styles.dateSubtext, { color: colors.textMuted }]}>
                  {formatDateTime(currentReport.created_at)}
                </Text>
              </View>
              <StatusBadge status={currentReport.status} />
            </View>
          </View>

          {/* Numeric Metrics Grid */}
          {numericFields.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>Daily Metrics</Text>
              <View style={styles.metricsGrid}>
                {numericFields.map((nf) => {
                  const rawVal = reportData[nf.key];
                  const val =
                    rawVal !== undefined && rawVal !== null
                      ? nf.type === 'currency'
                        ? formatUSD(rawVal)
                        : String(rawVal)
                      : '—';
                  return (
                    <View key={nf.key} style={[styles.metricBox, { backgroundColor: colors.background }]}>
                      <Text style={[styles.metricValue, { color: colors.text }]}>{val}</Text>
                      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{nf.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Narrative Operations Fields */}
          {narrativeFields.map((nf) => {
            const val = reportData[nf.key];
            if (!val && val !== '') return null;
            const isBlocker = nf.key.toLowerCase().includes('blocker');

            return (
              <View
                key={nf.key}
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                  isBlocker && Boolean(val) && [
                    styles.blockerCard,
                    {
                      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : colors.pendingBg,
                      borderColor: isDark ? 'rgba(217, 119, 6, 0.4)' : colors.pendingBorder,
                    },
                  ],
                ]}
              >
                {isBlocker ? (
                  <View style={styles.blockerTitleRow}>
                    <Ionicons name="warning-outline" size={16} color={colors.pending} />
                    <Text style={[styles.blockerTitle, { color: colors.pending }]}>{nf.label}</Text>
                  </View>
                ) : (
                  <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{nf.label}</Text>
                )}
                <Text
                  style={[
                    styles.narrativeText,
                    { color: colors.text },
                    isBlocker && { color: isDark ? '#fef3c7' : colors.text },
                  ]}
                >
                  {val || 'None reported.'}
                </Text>
              </View>
            );
          })}

          {/* Attachments Section */}
          {currentReport.attachments && currentReport.attachments.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
                Attachments ({currentReport.attachments.length})
              </Text>
              {currentReport.attachments.map((att, idx) => {
                const name = att.fileName || att.filename || att.name || `Document #${idx + 1}`;
                const isImg = att.mimeType?.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(name);
                const isPdf = att.mimeType === 'application/pdf' || /\.pdf$/i.test(name);

                return (
                  <TouchableOpacity
                    key={att.id || idx}
                    style={[
                      styles.attachmentRow,
                      {
                        backgroundColor: colors.background,
                        borderWidth: 1,
                        borderColor: colors.surfaceBorder,
                      },
                    ]}
                    onPress={() => setSelectedAttachment(att)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.attachmentIconWrap,
                        {
                          backgroundColor: isImg
                            ? 'rgba(124, 58, 237, 0.12)'
                            : isPdf
                            ? 'rgba(239, 68, 68, 0.12)'
                            : 'rgba(100, 116, 139, 0.12)',
                        },
                      ]}
                    >
                      <Ionicons
                        name={isImg ? 'image' : isPdf ? 'document-text' : 'attach'}
                        size={20}
                        color={isImg ? colors.primary : isPdf ? '#EF4444' : '#64748B'}
                      />
                    </View>

                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.attachmentName, { color: colors.text }]} numberOfLines={1}>
                        {name}
                      </Text>
                    </View>

                    <View style={[styles.viewBadge, { backgroundColor: isDark ? 'rgba(167, 139, 250, 0.15)' : '#F3E8FF' }]}>
                      <Ionicons name="eye-outline" size={16} color={colors.primary} />
                      <Text style={[styles.viewBadgeText, { color: colors.primary }]}>View</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* CEO Decision Actions */}
          <View style={[styles.card, styles.reviewCard, { backgroundColor: colors.surface, borderColor: isDark ? colors.surfaceBorder : colors.primarySurface }]}>
            <Text style={[styles.reviewCardTitle, { color: colors.text }]}>CEO Review</Text>

            {isPending ? (
              <>
                <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>
                  CEO Feedback & Directives (Optional for approval, mandatory for rejection):
                </Text>
                <TextInput
                  style={[
                    styles.commentInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.surfaceBorder,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Enter comments or directives (mandatory if rejecting)..."
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
                    : currentReport.status === 'REJECTED'
                    ? [styles.reviewedRejected, { backgroundColor: colors.rejectedBg, borderColor: colors.rejectedBorder }]
                    : [styles.reviewedNotice, { backgroundColor: colors.surfaceBorder, borderColor: colors.surfaceBorder }],
                ]}
              >
                <Ionicons
                  name={
                    currentReport.status === 'APPROVED'
                      ? 'checkmark-circle'
                      : currentReport.status === 'REJECTED'
                      ? 'close-circle'
                      : 'time-outline'
                  }
                  size={24}
                  color={
                    currentReport.status === 'APPROVED'
                      ? colors.approved
                      : currentReport.status === 'REJECTED'
                      ? colors.rejected
                      : colors.textMuted
                  }
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reviewedStatusText, { color: colors.text }]}>
                    {currentReport.status === 'APPROVED'
                      ? 'Report Approved by CEO'
                      : currentReport.status === 'REJECTED'
                      ? 'Report Rejected by CEO'
                      : 'Awaiting Submission'}
                  </Text>
                  {currentReport.review_comment ? (
                    <Text style={[styles.reviewedCommentText, { color: colors.text }]}>
                      "{currentReport.review_comment}"
                    </Text>
                  ) : null}
                  {currentReport.reviewed_at ? (
                    <Text style={[styles.reviewedDateText, { color: colors.textMuted }]}>
                      Reviewed {formatDateTime(currentReport.reviewed_at)}
                    </Text>
                  ) : null}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AttachmentViewerModal
        visible={Boolean(selectedAttachment)}
        attachment={selectedAttachment}
        onClose={() => setSelectedAttachment(null)}
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
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
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
  },
  submittedByText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  dateSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
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
    padding: 12,
    borderRadius: 10,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  narrativeText: {
    fontSize: 14,
    lineHeight: 22,
  },
  blockerCard: {},
  blockerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  blockerTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  attachmentIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  attachmentSub: {
    fontSize: 11,
    marginTop: 2,
  },
  viewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  viewBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reviewCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    elevation: 2,
  },
  reviewCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
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
    backgroundColor: '#059669',
  },
  rejectBtn: {
    backgroundColor: '#dc2626',
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
  reviewedApproved: {},
  reviewedRejected: {},
  reviewedStatusText: {
    fontSize: 15,
    fontWeight: '700',
  },
  reviewedCommentText: {
    fontSize: 13,
    marginTop: 4,
  },
  reviewedDateText: {
    fontSize: 11,
    marginTop: 6,
  },
  goBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
  },
  goBackBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
