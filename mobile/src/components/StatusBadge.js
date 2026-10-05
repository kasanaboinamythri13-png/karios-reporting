// src/components/StatusBadge.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function StatusBadge({ status, small = false }) {
  const { colors } = useTheme();

  const config = {
    APPROVED: { label: 'Approved',       bg: colors.approvedBg, color: colors.approvedText, dot: colors.approved },
    REJECTED: { label: 'Rejected',       bg: colors.rejectedBg, color: colors.rejectedText, dot: colors.rejected },
    SUBMITTED:{ label: 'Pending Review', bg: colors.pendingBg,  color: colors.pendingText,  dot: colors.pending  },
    MISSING:  { label: 'Not Submitted',  bg: colors.missingBg,  color: colors.missingText,  dot: colors.missing  },
  };

  const cfg = config[status] || config.MISSING;

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }, small && styles.small]}>
      <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
      <Text style={[styles.label, { color: cfg.color }, small && styles.labelSmall]}>
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  labelSmall: {
    fontSize: 10,
  },
});
