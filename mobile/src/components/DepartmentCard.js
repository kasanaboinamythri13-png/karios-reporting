// src/components/DepartmentCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import StatusBadge from './StatusBadge';
import { useTheme } from '../context/ThemeContext';
import { departmentLetter, formatISTTime } from '../utils/formatters';

export default function DepartmentCard({ dept, onPress }) {
  const { colors } = useTheme();
  const isClickable = !!dept.reportId;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={() => isClickable && onPress && onPress(dept.reportId)}
      activeOpacity={isClickable ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={[styles.deptBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.deptBadgeText}>{departmentLetter(dept.department)}</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{dept.title || dept.department}</Text>
      </View>
      <StatusBadge status={dept.status} small />
      {dept.submittedAt ? (
        <Text style={[styles.time, { color: colors.textSecondary }]}>
          Submitted {formatISTTime(dept.submittedAt)}
        </Text>
      ) : (
        <Text style={[styles.timeMissing, { color: colors.textMuted }]}>Not submitted today</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    flex: 1,
    minWidth: 145,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  deptBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  time: {
    fontSize: 11,
    marginTop: 8,
  },
  timeMissing: {
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
