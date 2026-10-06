// src/screens/head/SubmitReportScreen.js
// Department Head Submit / Edit Report screen with dynamic form schema per department

import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { submitReport, updateReport, getReport, getTodayReport, getFormSchema } from '../../api/reportsApi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { departmentLabel } from '../../utils/formatters';
import { getDepartmentFields, toFormValues, buildReportData } from '../../utils/reportForm';

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
  const [fieldErrors, setFieldErrors] = useState({});

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
            currentFields = schemaRes.fields.map((f) => ({
              ...fallbackMap.get(f.key),
              ...f,
            }));
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
          setValues(toFormValues(currentFields, rep.data));
        } else if (isMounted) {
          setValues(toFormValues(currentFields, {}));
        }
      } catch (err) {
        if (isMounted) setValues(toFormValues(getDepartmentFields(dept), {}));
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

  async function handleSubmit() {
    const { data, errors } = buildReportData(fields, values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      Alert.alert('Required Field', firstError);
      return;
    }

    setSaving(true);
    try {
      const payload = { data };

      if (activeReportId) {
        await updateReport(activeReportId, payload);
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
                    if (repObj.data) setValues(toFormValues(fields, repObj.data));
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
    const isDirty = Object.values(values).some((v) => typeof v === 'string' && v.trim() !== '');
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
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* ── Top App Bar ── */}
        <View style={styles.appBar}>
          <TouchableOpacity
            style={[styles.backBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
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
                    <Text style={[styles.currencyHint, { color: colors.textMuted }]}>in INR (₹)</Text>
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
                    Shown to the CEO on the executive dashboard.
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
            <Text style={[styles.attachmentTitle, { color: colors.textSecondary }]}>SUPPORTING ATTACHMENTS</Text>
            <TouchableOpacity
              style={[styles.attachBtn, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#EDE9FE' }]}
              onPress={() => Alert.alert('Attachments', 'Select PDF, CSV, or screenshot to attach.')}
              activeOpacity={0.8}
            >
              <Ionicons name="attach" size={14} color={colors.primary} />
              <Text style={[styles.attachBtnText, { color: colors.primary }]}>Attach File</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.attachmentSub, { color: colors.textMuted }]}>
            No files attached. Optional PDF, CSV, or screenshots.
          </Text>
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
    gap: 6,
  },
  attachmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  attachBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  attachmentSub: {
    fontSize: 12,
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
