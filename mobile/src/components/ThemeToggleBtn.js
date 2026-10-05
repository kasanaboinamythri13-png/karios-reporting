// src/components/ThemeToggleBtn.js
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggleBtn({ style, size = 40 }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isDark ? '#21262D' : '#EDE9FE',
          borderColor: isDark ? '#30363D' : '#DDD6FE',
        },
        style,
      ]}
      onPress={toggleTheme}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <Ionicons
        name={isDark ? 'sunny' : 'moon'}
        size={Math.round(size * 0.48)}
        color={isDark ? '#FBBF24' : '#6C5CE7'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
});
