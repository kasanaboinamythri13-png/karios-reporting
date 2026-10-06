// mobile/src/components/StatusBadge.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STATUS_CONFIG } from '../utils/roles';
import { useTheme } from '../context/ThemeContext';

export default function StatusBadge({ status, size = 'medium' }) {
  const { colors, isDark } = useTheme();
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_SUBMITTED;

  const isSmall = size === 'small';

  const badgeColor = isDark
    ? (status === 'APPROVED'
        ? colors.approved
        : status === 'REJECTED'
        ? colors.rejected
        : status === 'SUBMITTED'
        ? colors.pending
        : colors.missing)
    : config.color;

  const badgeBg = isDark
    ? (status === 'APPROVED'
        ? colors.approvedBg
        : status === 'REJECTED'
        ? colors.rejectedBg
        : status === 'SUBMITTED'
        ? colors.pendingBg
        : colors.missingBg)
    : config.bg;

  const badgeBorder = isDark
    ? (status === 'APPROVED'
        ? colors.approvedBorder
        : status === 'REJECTED'
        ? colors.rejectedBorder
        : status === 'SUBMITTED'
        ? colors.pendingBorder
        : colors.missingBorder)
    : config.border;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeBg,
          borderColor: badgeBorder,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 8 : 10,
        },
      ]}
    >
      <Ionicons
        name={config.icon}
        size={isSmall ? 12 : 14}
        color={badgeColor}
        style={styles.icon}
      />
      <Text
        style={[
          styles.text,
          {
            color: badgeColor,
            fontSize: isSmall ? 10 : 12,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
