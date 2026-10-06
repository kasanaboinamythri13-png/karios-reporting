// mobile/src/components/KariosLogo.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { colors as defaultColors } from '../theme/colors';

export default function KariosLogo({
  size = 36,
  width,
  height,
  subtitle = 'REPORTING',
  showTagline = false,
  textColor,
  subtitleColor,
  align = 'center',
}) {
  let themeColors = defaultColors;
  let isDarkMode = false;
  try {
    const theme = useTheme();
    if (theme?.colors) themeColors = theme.colors;
    if (theme?.isDark !== undefined) isDarkMode = theme.isDark;
  } catch {
    // fallback if used outside ThemeProvider
  }

  const effectiveSize = height || size || 36;
  const computedTitleColor = textColor || (isDarkMode ? '#ffffff' : themeColors.text);
  const computedSubtitleColor = subtitleColor || (isDarkMode ? '#8b949e' : themeColors.textMuted);
  const titleSize = Math.round(effectiveSize * 0.62);
  const subSize = Math.max(9, Math.round(effectiveSize * 0.28));

  return (
    <View style={[styles.container, align === 'left' && styles.alignLeft]}>
      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/karios-symbol.png')}
          style={{ width: effectiveSize, height: effectiveSize }}
          resizeMode="contain"
        />
        <View style={styles.textCol}>
          <Text
            style={[
              styles.title,
              { fontSize: titleSize, color: computedTitleColor, lineHeight: titleSize + 4 },
            ]}
          >
            Karios
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                { fontSize: subSize, color: computedSubtitleColor, lineHeight: subSize + 2 },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {showTagline && (
        <Text style={[styles.tagline, { color: computedSubtitleColor }]}>
          Daily Reporting System
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  alignLeft: {
    alignItems: 'flex-start',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  textCol: {
    justifyContent: 'center',
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 10,
    letterSpacing: -0.2,
  },
});
