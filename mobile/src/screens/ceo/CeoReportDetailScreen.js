// src/screens/ceo/CeoReportDetailScreen.js
// Full report detail with Approve / Reject modal for CEO

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getReport, reviewReport } from '../../api/reportsApi';
import { formatFileSize } from '../../api/attachmentsApi';
import StatusBadge from '../../components/StatusBadge';
import { useTheme } from '../../context/ThemeContext';
import { departmentLetter, departmentLabel, formatRelativeDate, formatISTTime, formatCurrency } from '../../utils/formatters';

function FieldRow({ label, value, colors }) {
  if (!value && value !== 0) return null;
  return (
    <View style={[styles.fieldRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

export default function CeoReportDetailScreen() {
  const route      = useRoute();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { reportId } = route.params;

  const [report, setReport]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [modalVisible, setModal]    = useState(false);
  const [reviewAction, setAction]   = useState(null); // 'APPROVED' | 'REJECTED'
  const [comment, setComment]       = useState('');
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    getReport(reportId)
      .then(setReport)
      .catch(() => Alert.alert('Error', 'Could not load report.'))
      .finally(() => setLoading(false));
  }, [reportId]);

  async function handleReview() {
    setSaving(true);
    try {
      await reviewReport(reportId, { status: reviewAction, comment: comment.trim() });
      setModal(false);
      const updated = await getReport(reportId);
      setReport(updated);
      Alert.alert('Done', `Report ${reviewAction === 'APPROVED' ? 'approved' : 'rejected'} successfully.`);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not submit review.');
    } finally {
      setSaving(false);
    }
  }

  function openModal(action) {
    setAction(action);
    setComment('');
    setModal(true);
  }

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

  const canReview = report.status === 'SUBMITTED';

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        {/* ── Report Header ── */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.deptBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.deptBadgeText}>{departmentLetter(report.department)}</Text>
            </View>
            <View>
              <Text style={[styles.deptTitle, { color: colors.text }]}>{departmentLabel(report.department)}</Text>
              <Text style={[styles.deptSub, { color: colors.textSecondary }]}>{formatRelativeDate(report.report_date)}</Text>
            </View>
          </View>
          <StatusBadge status={report.status} />
        </View>

        <Text style={[styles.submittedAt, { color: colors.textMuted }]}>
          Submitted at {formatISTTime(report.created_at)}
        </Text>

        {/* ── Department Specific Metrics ── */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Metrics</Text>
          {report.department === 'FINANCE' && (
            <>
              <FieldRow label="Collections" value={formatCurrency(report.data?.collections)} colors={colors} />
              <FieldRow label="Payments Made" value={formatCurrency(report.data?.paymentsMade)} colors={colors} />
            </>
          )}
          {report.department === 'SALES' && (
            <>
              <FieldRow label="Revenue Closed" value={formatCurrency(report.data?.revenueClosed)} colors={colors} />
              <FieldRow label="New Leads" value={report.data?.newLeads} colors={colors} />
            </>
          )}
          {report.department === 'MARKETING' && (
            <>
              <FieldRow label="Active Campaigns" value={report.data?.activeCampaigns} colors={colors} />
              <FieldRow label="Spend" value={formatCurrency(report.data?.spend)} colors={colors} />
            </>
          )}
          {report.department === 'DEVELOPMENT' && (
            <>
              <FieldRow label="Bugs Fixed" value={report.data?.bugsFixed} colors={colors} />
              <FieldRow label="Deployments" value={report.data?.deployments} colors={colors} />
            </>
          )}
        </View>

        {/* ── Tasks ── */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Operations & Tasks</Text>
          <FieldRow label="Tasks Completed" value={report.data?.tasksCompleted} colors={colors} />
          <FieldRow label="Tasks In Progress" value={report.data?.tasksInProgress} colors={colors} />
          <FieldRow label="Blockers / Impediments" value={report.data?.blockers} colors={colors} />
          <FieldRow label="Plan for Tomorrow" value={report.data?.planTomorrow} colors={colors} />
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
                <View
                  key={file.id || idx}
                  style={[styles.fieldRow, { borderBottomColor: colors.border, alignItems: 'center' }]}
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
                </View>
              );
            })}
          </View>
        )}

        {/* ── Existing Review Info ── */}
        {report.review_comment ? (
          <View style={[styles.reviewSection, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : colors.primarySoft }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>CEO Review</Text>
            <Text style={[styles.reviewComment, { color: colors.text }]}>{report.review_comment}</Text>
            {report.reviewed_at ? (
              <Text style={[styles.reviewAt, { color: colors.textMuted }]}>
                Reviewed on {formatISTTime(report.reviewed_at)}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* ── Approve / Reject Buttons (CEO action) ── */}
        {canReview && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn, { backgroundColor: colors.approved }]}
              onPress={() => openModal('APPROVED')}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>✓ Approve Report</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn, { backgroundColor: colors.rejected }]}
              onPress={() => openModal('REJECTED')}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>✕ Reject Report</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── Review Confirmation Modal ── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {reviewAction === 'APPROVED' ? 'Approve Report' : 'Reject Report'}
            </Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              {reviewAction === 'APPROVED'
                ? 'Optionally add a note of recognition or feedback.'
                : 'Please explain why this report is being rejected so the department head can address it.'}
            </Text>

            <Text style={[styles.commentLabel, { color: colors.text }]}>
              {reviewAction === 'APPROVED' ? 'Review Note (optional)' : 'Reason for Rejection *'}
            </Text>
            <TextInput
              style={[
                styles.commentInput,
                { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text },
              ]}
              value={comment}
              onChangeText={setComment}
              placeholder={reviewAction === 'APPROVED' ? 'Great work on closing the deals...' : 'Metrics seem inconsistent with target...'}
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                reviewAction === 'APPROVED' ? { backgroundColor: colors.approved } : { backgroundColor: colors.rejected },
                saving && styles.confirmDisabled,
              ]}
              onPress={handleReview}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.confirmText}>
                    {reviewAction === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
                  </Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelModal} onPress={() => setModal(false)}>
              <Text style={[styles.cancelModalText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   { padding: 20, paddingBottom: 48, gap: 16 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, marginBottom: 16 },
  retryBtn:  { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryText: { color: '#FFFFFF', fontWeight: '700' },

  header: {
    borderRadius: 16, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
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
  deptTitle:  { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  deptSub:    { fontSize: 13 },
  submittedAt:{ fontSize: 12, marginTop: -8 },

  section: {
    borderRadius: 16, padding: 18, gap: 12,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  fieldRow:  { borderBottomWidth: 1, paddingBottom: 10, gap: 4 },
  fieldLabel:{ fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldValue:{ fontSize: 15, lineHeight: 21 },

  reviewSection: {
    borderRadius: 16, padding: 16, gap: 8,
  },
  reviewAt:      { fontSize: 12 },
  reviewComment: { fontSize: 14, lineHeight: 20 },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  actionBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 10, elevation: 4,
  },
  actionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  // Review Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet:   {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, gap: 14,
  },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  modalTitle:   { fontSize: 20, fontWeight: '800' },
  modalSub:     { fontSize: 13, marginTop: -6 },
  commentLabel: { fontSize: 13, fontWeight: '600' },
  commentInput: {
    borderRadius: 12, padding: 14,
    fontSize: 15, minHeight: 100,
    borderWidth: 1.5,
  },
  confirmBtn:     { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  confirmDisabled:{ opacity: 0.6 },
  confirmText:    { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  cancelModal:    { alignItems: 'center', paddingVertical: 12 },
  cancelModalText:{ fontSize: 15 },
});
