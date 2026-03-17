import React, { createContext, useContext, useEffect, useState } from 'react';
import { getThemeText, ThemeTextKey } from '../utils/themeDictionary';

import { CACHE_KEYS, DEFAULTS } from '../constants/settings';
import { usePersistence } from '../hooks/usePersistence';

export type Theme =
  | 'modern-pinnacle'
  | 'modern-luminous'
  | 'cinematic-glass'
  | 'matinee-popcorn'
  | 'velvet-theater'
  | 'sci-fi-hologram'
  | 'drive-in'
  | 'golden-age'
  | 'blockbuster'
  | 'mooooovies';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = usePersistence<Theme>(
    CACHE_KEYS.THEME,
    DEFAULTS.THEME
  );

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    
    // Explicitly sync the color scheme to override system preferences
    const isLight = ['modern-luminous', 'matinee-popcorn', 'vintage-ticket', 'mooooovies'].includes(theme);
    root.style.colorScheme = isLight ? 'light' : 'dark';
    
    // Force a secondary safeguard for dark mode interference
    if (isLight) {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useThemeText() {
  const { theme } = useTheme();
  return (key: ThemeTextKey) => getThemeText(theme, key);
}
