// src/components/ReportFilterBar.js
// Date and status filter bar matching web app reference image:
// [ Status (dropdown) ] [ From (dd-mm-yyyy 📅) ] [ To (dd-mm-yyyy 📅) ]

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DatePickerModal, { formatDdMmYyyy } from './DatePickerModal';
import { useTheme } from '../context/ThemeContext';

const STATUS_OPTIONS = [
  { key: 'ALL', label: 'All', queryVal: '' },
  { key: 'SUBMITTED', label: 'Pending review', queryVal: 'SUBMITTED' },
  { key: 'APPROVED', label: 'Approved', queryVal: 'APPROVED' },
  { key: 'REJECTED', label: 'Rejected', queryVal: 'REJECTED' },
];

export default function ReportFilterBar({
  status = 'ALL',
  from = '',
  to = '',
  onStatusChange,
  onFromChange,
  onToChange,
  onClear,
}) {
  const { colors, isDark } = useTheme();
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [activeDatePicker, setActiveDatePicker] = useState(null); // 'from' | 'to' | null

  const currentOption = STATUS_OPTIONS.find((o) => o.key === status) || STATUS_OPTIONS[0];
  const hasActiveFilters = Boolean((status && status !== 'ALL') || from || to);

  function handleSelectStatus(opt) {
    onStatusChange(opt.key);
    setStatusModalVisible(false);
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Status Field */}
        <View style={[styles.fieldCol, { flex: 1.1 }]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Status</Text>
          <TouchableOpacity
            style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            onPress={() => setStatusModalVisible(true)}
            activeOpacity={0.75}
          >
            <Text style={[styles.inputText, { color: colors.text }]} numberOfLines={1}>
              {currentOption.label}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* From Date Field */}
        <View style={[styles.fieldCol, { flex: 1.2 }]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>From</Text>
          <TouchableOpacity
            style={[
              styles.inputBox,
              { backgroundColor: colors.inputBg, borderColor: colors.border },
              from && { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F5F3FF' },
            ]}
            onPress={() => setActiveDatePicker('from')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.inputText,
                { color: from ? colors.text : colors.textMuted },
                !from && styles.placeholderText,
              ]}
              numberOfLines={1}
            >
              {from ? formatDdMmYyyy(from) : 'dd-mm-yyyy'}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={15}
              color={from ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* To Date Field */}
        <View style={[styles.fieldCol, { flex: 1.2 }]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>To</Text>
          <TouchableOpacity
            style={[
              styles.inputBox,
              { backgroundColor: colors.inputBg, borderColor: colors.border },
              to && { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F5F3FF' },
            ]}
            onPress={() => setActiveDatePicker('to')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.inputText,
                { color: to ? colors.text : colors.textMuted },
                !to && styles.placeholderText,
              ]}
              numberOfLines={1}
            >
              {to ? formatDdMmYyyy(to) : 'dd-mm-yyyy'}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={15}
              color={to ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active filter summary & Clear button */}
      {hasActiveFilters && (
        <View style={[styles.activeBar, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.18)' : '#EEF2FF' }]}>
          <Text style={[styles.activeText, { color: isDark ? '#C4B5FD' : '#475569' }]} numberOfLines={1}>
            Filtered: {status !== 'ALL' ? currentOption.label : ''}
            {from ? `${status !== 'ALL' ? ', ' : ''}From ${formatDdMmYyyy(from)}` : ''}
            {to ? `${status !== 'ALL' || from ? ', ' : ''}To ${formatDdMmYyyy(to)}` : ''}
          </Text>
          <TouchableOpacity
            style={[styles.clearBtn, { backgroundColor: colors.rejectedBg }]}
            onPress={onClear}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={13} color={colors.rejected} />
            <Text style={[styles.clearBtnText, { color: colors.rejected }]}>Reset</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status Selection Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setStatusModalVisible(false)}
        >
          <Pressable
            style={[styles.statusModalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.statusModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.statusModalTitle, { color: colors.text }]}>Filter by Status</Text>
              <TouchableOpacity
                onPress={() => setStatusModalVisible(false)}
                style={[styles.closeIconBtn, { backgroundColor: colors.surfaceElevated }]}
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.statusOptionsList}>
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = opt.key === status;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.statusOptionItem,
                      { borderBottomColor: colors.border },
                      isSelected && { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#F5F3FF' },
                    ]}
                    onPress={() => handleSelectStatus(opt)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.statusOptionLeft}>
                      <View
                        style={[
                          styles.statusDot,
                          opt.key === 'APPROVED' && { backgroundColor: colors.approved },
                          opt.key === 'REJECTED' && { backgroundColor: colors.rejected },
                          opt.key === 'SUBMITTED' && { backgroundColor: colors.pending },
                          opt.key === 'ALL' && { backgroundColor: colors.textMuted },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusOptionText,
                          { color: colors.text },
                          isSelected && { color: colors.primary, fontWeight: '700' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Date Picker Modal for From */}
      <DatePickerModal
        visible={activeDatePicker === 'from'}
        title="Select From Date"
        currentDate={from}
        maxDate={to || undefined}
        onSelect={(iso) => {
          onFromChange(iso);
          setActiveDatePicker(null);
        }}
        onClear={() => {
          onFromChange('');
          setActiveDatePicker(null);
        }}
        onClose={() => setActiveDatePicker(null)}
      />

      {/* Date Picker Modal for To */}
      <DatePickerModal
        visible={activeDatePicker === 'to'}
        title="Select To Date"
        currentDate={to}
        minDate={from || undefined}
        onSelect={(iso) => {
          onToChange(iso);
          setActiveDatePicker(null);
        }}
        onClear={() => {
          onToChange('');
          setActiveDatePicker(null);
        }}
        onClose={() => setActiveDatePicker(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  fieldCol: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
    minHeight: 36,
  },
  inputText: {
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
    marginRight: 4,
  },
  placeholderText: {
    fontWeight: '400',
  },
  activeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 6,
  },
  activeText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  statusModalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  statusModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  statusModalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOptionsList: {
    marginTop: 6,
  },
  statusOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderBottomWidth: 0.5,
  },
  statusOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
