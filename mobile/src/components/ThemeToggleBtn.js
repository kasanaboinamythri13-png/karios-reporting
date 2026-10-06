// src/components/ThemeToggleBtn.js
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggleBtn({ style, size = 38 }) {
  const { isDark, toggleTheme, colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius: 10,
          backgroundColor: isDark ? (colors?.primaryLight || '#21262D') : '#f3e8ff',
          borderColor: isDark ? 'rgba(139, 92, 246, 0.4)' : '#e9d5ff',
        },
        style,
      ]}
      onPress={toggleTheme}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={Math.round(size * 0.48)}
        color={isDark ? '#fcd34d' : (colors?.primary || '#6C5CE7')}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
