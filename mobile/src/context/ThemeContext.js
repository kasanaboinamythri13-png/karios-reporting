// src/context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightColors, DarkColors } from '../theme/colors';

const THEME_STORAGE_KEY = '@karios_theme';

const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  colors: LightColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('light');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') {
          setThemeState(saved);
        }
      } catch (e) {
        // Fallback to light
      }
    })();
  }, []);

  const setTheme = async (nextTheme) => {
    const val = nextTheme === 'dark' ? 'dark' : 'light';
    setThemeState(val);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, val);
    } catch (e) {}
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const isDark = theme === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: 'light',
      isDark: false,
      colors: LightColors,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return ctx;
}

export default ThemeContext;
