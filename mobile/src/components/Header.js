// mobile/src/components/Header.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function Header({
  title,
  subtitle,
  onBack,
  rightAction,
  rightIcon,
  onRightPress,
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
      <View style={styles.leftContainer}>
        {onBack ? (
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.background }]}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : null}
        <View style={styles.titleWrapper}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {rightAction ? (
        rightAction
      ) : rightIcon ? (
        <TouchableOpacity
          style={[styles.rightButton, { backgroundColor: colors.background }]}
          onPress={onRightPress}
          activeOpacity={0.7}
        >
          <Ionicons name={rightIcon} size={22} color={colors.text} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 10,
    padding: 4,
    borderRadius: 8,
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  rightButton: {
    padding: 8,
    borderRadius: 8,
  },
});
