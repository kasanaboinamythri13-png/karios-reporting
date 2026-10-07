import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { submitReport, updateReport, getReport, getTodayReport, getFormSchema } from '../../api/reportsApi';
import { uploadAttachment, validateAttachment, formatFileSize, MAX_FILES_PER_REPORT } from '../../api/attachmentsApi';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { departmentLabel } from '../../utils/formatters';
import { getDepartmentFields, toFormValues, buildReportData } from '../../utils/reportForm';
import ThemeToggleBtn from '../../components/ThemeToggleBtn';

function areReportDataEqual(a = {}, b = {}) {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function areAttachmentsEqual(listA = [], listB = []) {
  const idsA = (listA || []).map((a) => String(a.id || a.attachmentId || '')).filter(Boolean).sort();
  const idsB = (listB || []).map((b) => String(b.id || b.attachmentId || '')).filter(Boolean).sort();
  if (idsA.length !== idsB.length) return false;
  for (let i = 0; i < idsA.length; i++) {
    if (idsA[i] !== idsB[i]) return false;
  }
  return true;
}

export default function SubmitReportScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const editId = route.params?.editId || null;

  const dept = user?.department || 'DEVELOPMENT';
  const deptName = departmentLabel(dept) || 'Development';
  const roleTitle = user?.title || 'Engineering Head';

  // Fields schema & form values
  const [fields, setFields] = useState(() => getDepartmentFields(dept));
  const [values, setValues] = useState({});
  const [initialValues, setInitialValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  // Attachments state
  const [attachments, setAttachments] = useState([]);
  const [initialAttachments, setInitialAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeReportId, setActiveReportId] = useState(editId);

  // Date formatted: "Monday, October 5, 2026"
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Preload form schema & existing report if editing or if today's report already exists
  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      try {
        let currentFields = getDepartmentFields(dept);
        try {
          const schemaRes = await getFormSchema();
          if (schemaRes?.fields && schemaRes.fields.length > 0) {
            // Merge with local fallback definitions to retain nice placeholders
            const fallbackMap = new Map(currentFields.map((f) => [f.key, f]));
            currentFields = schemaRes.fields.map((f) => {
              const localDef = fallbackMap.get(f.key) || {};
              return {
                ...f,
                ...localDef,
                required: localDef.required !== undefined ? localDef.required : f.required,
              };
            });
            if (isMounted) setFields(currentFields);
          }
        } catch {
          // Schema API failed or offline, proceed with local fallback
        }

        let rep = null;
        if (editId) {
          rep = await getReport(editId);
        } else {
          const today = await getTodayReport();
          const repObj = today?.report || (today?.id ? today : null);
          if (repObj && repObj.id && repObj.status !== 'MISSING') {
            rep = repObj;
            if (isMounted) setActiveReportId(repObj.id);
          }
        }

        if (rep && rep.data && isMounted) {
          const loadedVals = toFormValues(currentFields, rep.data);
          setValues(loadedVals);
          setInitialValues(loadedVals);
          const loadedAtts = Array.isArray(rep.attachments) ? rep.attachments : [];
          setAttachments(loadedAtts);
          setInitialAttachments(loadedAtts);
        } else if (isMounted) {
          const emptyVals = toFormValues(currentFields, {});
          setValues(emptyVals);
          setInitialValues(emptyVals);
          setAttachments([]);
          setInitialAttachments([]);
        }
      } catch (err) {
        if (isMounted) {
          const fallbackVals = toFormValues(getDepartmentFields(dept), {});
          setValues(fallbackVals);
          setInitialValues(fallbackVals);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInitial();
    return () => {
      isMounted = false;
    };
  }, [editId, dept]);

  const handleFieldChange = (key, text) => {
    setValues((prev) => ({ ...prev, [key]: text }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handlePickDocument = async () => {
    if (attachments.length >= MAX_FILES_PER_REPORT) {
      Alert.alert('Limit Reached', `A report can have at most ${MAX_FILES_PER_REPORT} attachments.`);
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const availableSlots = MAX_FILES_PER_REPORT - attachments.length;
      const selectedAssets = result.assets.slice(0, availableSlots);

      if (result.assets.length > availableSlots) {
        Alert.alert('Notice', `Only ${availableSlots} file(s) added to stay within the limit of ${MAX_FILES_PER_REPORT}.`);
      }

      setUploadingFile(true);

      const newlyUploaded = [];
      for (const asset of selectedAssets) {
        const valError = validateAttachment(asset);
        if (valError) {
          Alert.alert('Unsupported File', `${asset.name || 'File'}: ${valError}`);
          continue;
        }

        try {
          const res = await uploadAttachment(asset);
          newlyUploaded.push({
            id: res.attachmentId,
            attachmentId: res.attachmentId,
            fileName: res.fileName || asset.name,
            mimeType: res.mimeType || asset.mimeType,
            sizeBytes: res.sizeBytes || asset.size,
          });
        } catch (uploadErr) {
          Alert.alert('Upload Failed', `Could not upload "${asset.name}": ${uploadErr.message}`);
        }
      }

      if (newlyUploaded.length > 0) {
        setAttachments((prev) => [...prev, ...newlyUploaded]);
      }
    } catch (err) {
      Alert.alert('File Picker Error', err.message || 'Could not open file picker.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveAttachment = (targetId) => {
    setAttachments((prev) => prev.filter((a) => (a.id || a.attachmentId) !== targetId));
  };

  async function handleSubmit() {
    const { data, errors } = buildReportData(fields, values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      Alert.alert('Required Field', firstError);
      return;
    }

    if (activeReportId) {
      const { data: initialData } = buildReportData(fields, initialValues);
      const dataUnchanged = areReportDataEqual(data, initialData);
      const attachmentsUnchanged = areAttachmentsEqual(attachments, initialAttachments);

      if (dataUnchanged && attachmentsUnchanged) {
        Alert.alert('No Changes', 'No changes made to update');
        return;
      }
    }

    setSaving(true);
    try {
      const attachmentIds = attachments.map((a) => a.id || a.attachmentId).filter(Boolean);
      const payload = { data, attachmentIds };

      if (activeReportId) {
        await updateReport(activeReportId, payload);
        setInitialValues(values);
        setInitialAttachments(attachments);
        Alert.alert('Report Updated', 'Your daily report has been successfully updated.', [
          { text: 'OK', onPress: () => navigation.navigate('Home') },
        ]);
      } else {
        await submitReport(payload);
        Alert.alert('Report Submitted', 'Your daily report has been submitted to the CEO for review.', [
          { text: 'OK', onPress: () => navigation.navigate('Home') },
        ]);
      }
    } catch (err) {
      if (err?.response?.status === 409) {
        Alert.alert(
          'Already Submitted',
          'You have already submitted a report for today. Would you like to edit it?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Edit Report',
              onPress: async () => {
                try {
                  const today = await getTodayReport();
                  const repObj = today?.report || (today?.id ? today : null);
                  if (repObj?.id) {
                    setActiveReportId(repObj.id);
                    if (repObj.data) {
                      const v = toFormValues(fields, repObj.data);
                      setValues(v);
                      setInitialValues(v);
                    }
                    if (Array.isArray(repObj.attachments)) {
                      setAttachments(repObj.attachments);
                      setInitialAttachments(repObj.attachments);
                    }
                  }
                } catch {
                  // Ignore
                }
              },
            },
          ]
        );
      } else {
        const errorMsg =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Could not submit report.';
        Alert.alert('Submission Error', errorMsg);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    let isDirty = false;
    if (activeReportId) {
      const { data } = buildReportData(fields, values);
      const { data: initialData } = buildReportData(fields, initialValues);
      const dataUnchanged = areReportDataEqual(data, initialData);
      const attachmentsUnchanged = areAttachmentsEqual(attachments, initialAttachments);
      isDirty = !dataUnchanged || !attachmentsUnchanged;
    } else {
      const hasText = Object.values(values).some((v) => typeof v === 'string' && v.trim() !== '');
      const hasFiles = attachments.length > 0;
      isDirty = hasText || hasFiles;
    }

    if (isDirty) {
      Alert.alert('Discard Changes?', 'You have unsaved changes. Are you sure you want to discard them?', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* ── Top App Bar ── */}
        <View style={styles.appBar}>
          <TouchableOpacity
            style={[styles.backBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleCancel}
            activeOpacity={0.75}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.appBarCenter}>
            <Text style={[styles.appBarTitle, { color: colors.text }]}>
              {activeReportId ? 'Edit Report' : 'Submit Report'}
            </Text>
            <Text style={[styles.appBarSub, { color: colors.textSecondary }]}>
              {deptName} · {formattedToday}
            </Text>
          </View>

          <ThemeToggleBtn size={36} />
        </View>

        {/* ── Daily Report Card ── */}
        <View style={[styles.authorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.authorCardTitle, { color: colors.text }]}>{deptName} Daily Report</Text>
          <Text style={[styles.authorCardSub, { color: colors.textSecondary }]}>Author: {roleTitle}</Text>
        </View>

        {/* ── Dynamic Form Section ── */}
        <View style={[styles.formContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>DEPARTMENT METRICS & UPDATES</Text>

          {fields.map((field) => {
            const isTextarea = field.type === 'textarea';
            const isNumberOrCurrency = field.type === 'number' || field.type === 'currency';
            const hasError = !!fieldErrors[field.key];

            return (
              <View key={field.key} style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>
                    {field.label}
                    {field.required && <Text style={styles.requiredStar}> *</Text>}
                  </Text>
                  {field.type === 'currency' && (
                    <Text style={[styles.currencyHint, { color: colors.textMuted }]}>in USD ($)</Text>
                  )}
                </View>

                <TextInput
                  style={[
                    styles.inputBox,
                    isTextarea && styles.textArea,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: hasError ? '#EF4444' : colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={values[field.key] ?? ''}
                  onChangeText={(txt) => handleFieldChange(field.key, txt)}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                  placeholderTextColor={colors.textMuted}
                  keyboardType={
                    isNumberOrCurrency
                      ? field.type === 'currency'
                        ? 'decimal-pad'
                        : 'number-pad'
                      : 'default'
                  }
                  multiline={isTextarea}
                  numberOfLines={isTextarea ? 3 : 1}
                  textAlignVertical={isTextarea ? 'top' : 'center'}
                  editable={!saving}
                />

                {field.key === 'blockers' && (
                  <Text style={[styles.fieldHintText, { color: colors.textSecondary }]}>
                    Shown to the CEO on the CEO dashboard.
                  </Text>
                )}

                {hasError && (
                  <Text style={styles.fieldErrorText}>
                    {fieldErrors[field.key]}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* ── Supporting Attachments Card ── */}
        <View style={[styles.attachmentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.attachmentHeader}>
            <View style={styles.attachmentTitleRow}>
              <Text style={[styles.attachmentTitle, { color: colors.textSecondary }]}>SUPPORTING ATTACHMENTS</Text>
              {attachments.length > 0 && (
                <View style={[styles.countBadge, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.25)' : '#EDE9FE' }]}>
                  <Text style={[styles.countBadgeText, { color: colors.primary }]}>{attachments.length}/5</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.attachBtn,
                { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#EDE9FE' },
                uploadingFile && styles.attachBtnDisabled,
              ]}
              onPress={handlePickDocument}
              disabled={uploadingFile}
              activeOpacity={0.8}
            >
              {uploadingFile ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="attach" size={15} color={colors.primary} />
              )}
              <Text style={[styles.attachBtnText, { color: colors.primary }]}>
                {uploadingFile ? 'Uploading...' : 'Attach File'}
              </Text>
            </TouchableOpacity>
          </View>

          {attachments.length === 0 ? (
            <TouchableOpacity
              style={[styles.emptyAttachZone, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]}
              onPress={handlePickDocument}
              disabled={uploadingFile}
              activeOpacity={0.7}
            >
              <Ionicons name="cloud-upload-outline" size={24} color={colors.textMuted} />
              <Text style={[styles.attachmentSub, { color: colors.textMuted }]}>
                Attach PDF or screenshots (up to 5 MB each, max 5 files)
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.attachmentList}>
              {attachments.map((file, idx) => {
                const id = file.id || file.attachmentId || `att-${idx}`;
                const name = file.fileName || file.filename || 'Attachment';
                const isPdf = file.mimeType === 'application/pdf' || name.toLowerCase().endsWith('.pdf');

                return (
                  <View
                    key={id}
                    style={[
                      styles.fileItem,
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.fileIconBox, { backgroundColor: isPdf ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)' }]}>
                      <Ionicons
                        name={isPdf ? 'document-text' : 'image'}
                        size={18}
                        color={isPdf ? '#EF4444' : '#3B82F6'}
                      />
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                        {name}
                      </Text>
                      {file.sizeBytes ? (
                        <Text style={[styles.fileSize, { color: colors.textMuted }]}>
                          {formatFileSize(file.sizeBytes)}
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={styles.removeFileBtn}
                      onPress={() => handleRemoveAttachment(id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Action Buttons Row ── */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.cancelBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }, saving && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {activeReportId ? 'Update Report' : 'Submit Report'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 18, paddingTop: 14, paddingBottom: 40, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarCenter: { flex: 1 },
  appBarTitle: { fontSize: 18, fontWeight: '800' },
  appBarSub: { fontSize: 12, marginTop: 2 },

  authorCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    gap: 4,
  },
  authorCardTitle: { fontSize: 16, fontWeight: '700' },
  authorCardSub: { fontSize: 13 },

  formContainer: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    gap: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  fieldGroup: { gap: 6 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: { fontSize: 13, fontWeight: '700' },
  requiredStar: { color: '#EF4444' },
  currencyHint: { fontSize: 11, fontWeight: '600' },
  fieldHintText: { fontSize: 12, marginTop: 2 },
  fieldErrorText: { color: '#EF4444', fontSize: 12, marginTop: 2, fontWeight: '600' },

  inputBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: {
    minHeight: 76,
  },

  attachmentCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  attachmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attachmentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  attachmentTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  attachBtnDisabled: {
    opacity: 0.6,
  },
  attachBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyAttachZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
  },
  attachmentSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  attachmentList: {
    gap: 8,
    marginTop: 6,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  fileIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
  },
  fileSize: {
    fontSize: 11,
    marginTop: 2,
  },
  removeFileBtn: {
    padding: 4,
  },

  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
