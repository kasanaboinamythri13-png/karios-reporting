// mobile/src/context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { lightColors, darkColors, LightColors, DarkColors } from '../theme/colors';

const THEME_STORAGE_KEY = '@karios_theme';

const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  colors: lightColors,
  setTheme: () => {},
  toggleTheme: () => {},
  isCeoRole: false,
});

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [themePreference, setThemePreference] = useState('light');

  // Load saved theme on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (isMounted && (saved === 'dark' || saved === 'light')) {
          setThemePreference(saved);
        }
      } catch {}
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const changeTheme = async (nextTheme) => {
    const val = nextTheme === 'dark' ? 'dark' : 'light';
    setThemePreference(val);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, val);
    } catch {}
  };

  const toggleTheme = () => {
    changeTheme(themePreference === 'light' ? 'dark' : 'light');
  };

  // Rule: Dark theme is available for CEO; Department Heads stay in Light theme
  const isCeoRole = user?.role === 'CEO';
  const effectiveTheme = isCeoRole ? themePreference : 'light';
  const isDark = effectiveTheme === 'dark';
  const activeColors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({
      theme: effectiveTheme,
      isDark,
      colors: activeColors,
      setTheme: changeTheme,
      toggleTheme,
      isCeoRole,
    }),
    [effectiveTheme, isDark, activeColors, isCeoRole]
  );

  return (
    <ThemeContext.Provider value={value}>
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
      isCeoRole: false,
    };
  }
  return ctx;
}

export default ThemeContext;
