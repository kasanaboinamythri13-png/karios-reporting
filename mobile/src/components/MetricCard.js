// src/components/MetricCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function MetricCard({ icon, label, value, accentColor, subLabel }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderLeftColor: accentColor || colors.primary }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color: accentColor || colors.primary }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      {subLabel ? <Text style={[styles.subLabel, { color: colors.textMuted }]}>{subLabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
    minWidth: 140,
  },
  icon: {
    fontSize: 22,
    marginBottom: 8,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  subLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});
