// mobile/src/context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { lightColors, darkColors } from '../theme/colors';

const STORAGE_KEY = '@karios_ceo_theme';

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
  const [ceoThemePreference, setCeoThemePreference] = useState('light');

  // Load saved CEO theme on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (isMounted && (saved === 'dark' || saved === 'light')) {
          setCeoThemePreference(saved);
        }
      } catch {}
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const changeTheme = async (newTheme) => {
    if (newTheme !== 'dark' && newTheme !== 'light') return;
    setCeoThemePreference(newTheme);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    changeTheme(ceoThemePreference === 'light' ? 'dark' : 'light');
  };

  // Rule: Dark theme is ONLY available for CEO role; Department Heads always stay in Light theme
  const isCeoRole = user?.role === 'CEO';
  const effectiveTheme = isCeoRole ? ceoThemePreference : 'light';
  const isDark = effectiveTheme === 'dark';
  const activeColors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({
      theme: effectiveTheme,
      ceoThemePreference,
      isDark,
      colors: activeColors,
      setTheme: changeTheme,
      toggleTheme,
      isCeoRole,
    }),
    [effectiveTheme, ceoThemePreference, isDark, activeColors, isCeoRole]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
