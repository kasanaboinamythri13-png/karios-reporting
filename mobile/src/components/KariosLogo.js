// src/components/KariosLogo.js
import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function KariosLogo({
  width = 172,
  height = 54,
  style,
  resizeMode = 'contain',
}) {
  const { isDark } = useTheme();

  return (
    <Image
      source={
        isDark
          ? require('../../assets/karios-logo-dark.png')
          : require('../../assets/karios-logo.png')
      }
      style={[
        styles.logo,
        { width, height },
        style,
      ]}
      resizeMode={resizeMode}
    />
  );
}

const styles = StyleSheet.create({
  logo: {},
});
