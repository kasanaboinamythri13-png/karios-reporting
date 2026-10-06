// src/components/DatePickerModal.js
// Custom sleek date picker modal in pure React Native (zero native dependencies)

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function toIsoDate(year, month, day) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

export function formatDdMmYyyy(isoStr) {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length !== 3) return isoStr;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

export default function DatePickerModal({
  visible,
  title = 'Select Date',
  currentDate,
  minDate,
  maxDate,
  onSelect,
  onClose,
  onClear,
}) {
  const { colors, isDark } = useTheme();
  const today = new Date();
  const initialYear = currentDate ? parseInt(currentDate.split('-')[0], 10) : today.getFullYear();
  const initialMonth = currentDate ? parseInt(currentDate.split('-')[1], 10) - 1 : today.getMonth();

  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);
  const [selectedIso, setSelectedIso] = useState(currentDate || '');

  useEffect(() => {
    if (visible) {
      const y = currentDate ? parseInt(currentDate.split('-')[0], 10) : today.getFullYear();
      const m = currentDate ? parseInt(currentDate.split('-')[1], 10) - 1 : today.getMonth();
      setViewYear(y);
      setViewMonth(m);
      setSelectedIso(currentDate || '');
    }
  }, [visible, currentDate]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  // Days in month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays = [];

  // Prev month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthDays - i,
      month: viewMonth === 0 ? 11 : viewMonth - 1,
      year: viewMonth === 0 ? viewYear - 1 : viewYear,
      isCurrentMonth: false,
    });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({
      day: d,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true,
    });
  }

  // Next month padding to fill grid
  const remaining = 42 - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    calendarDays.push({
      day: d,
      month: viewMonth === 11 ? 0 : viewMonth + 1,
      year: viewMonth === 11 ? viewYear + 1 : viewYear,
      isCurrentMonth: false,
    });
  }

  const todayIso = toIsoDate(today.getFullYear(), today.getMonth(), today.getDate());

  function handleDayPress(cell) {
    const iso = toIsoDate(cell.year, cell.month, cell.day);
    setSelectedIso(iso);
    onSelect(iso);
    onClose();
  }

  function handleSelectToday() {
    setSelectedIso(todayIso);
    onSelect(todayIso);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated }]}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Month / Year Navigator */}
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={prevMonth}
              style={[styles.navArrow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.navMonth, { color: colors.text }]}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity
              onPress={nextMonth}
              style={[styles.navArrow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Weekday Labels */}
          <View style={styles.weekRow}>
            {DAY_LABELS.map((label, idx) => (
              <Text key={idx} style={[styles.weekLabel, { color: colors.textMuted }]}>
                {label}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.grid}>
            {calendarDays.map((cell, idx) => {
              const cellIso = toIsoDate(cell.year, cell.month, cell.day);
              const isSelected = selectedIso === cellIso;
              const isToday = todayIso === cellIso;
              const isDisabled =
                !cell.isCurrentMonth ||
                (minDate && cellIso < minDate) ||
                (maxDate && cellIso > maxDate);

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayCell,
                    isSelected && [styles.dayCellSelected, { backgroundColor: colors.primary }],
                    isToday && !isSelected && [styles.dayCellToday, { borderColor: colors.primary }],
                  ]}
                  disabled={isDisabled}
                  onPress={() => handleDayPress(cell)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: colors.text },
                      !cell.isCurrentMonth && { color: colors.textMuted, opacity: 0.4 },
                      isDisabled && { color: colors.textMuted, opacity: 0.25 },
                      isToday && !isSelected && { color: colors.primary, fontWeight: '800' },
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {cell.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.todayBtn,
                {
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE',
                  borderColor: isDark ? '#3A3A5C' : '#DDD6FE',
                },
              ]}
              onPress={handleSelectToday}
              activeOpacity={0.75}
            >
              <Text style={[styles.todayBtnText, { color: colors.primary }]}>Today</Text>
            </TouchableOpacity>

            {onClear && (
              <TouchableOpacity
                style={[styles.clearBtn, { backgroundColor: colors.rejectedBg }]}
                onPress={() => {
                  setSelectedIso('');
                  onClear();
                  onClose();
                }}
                activeOpacity={0.75}
              >
                <Text style={[styles.clearBtnText, { color: colors.rejected }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  navMonth: {
    fontSize: 16,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  weekLabel: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
  },
  dayCellSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  dayCellToday: {
    borderWidth: 1.5,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  todayBtn: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  todayBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  clearBtn: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
