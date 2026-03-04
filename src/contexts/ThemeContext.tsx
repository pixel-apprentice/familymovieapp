import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme =
  | 'modern-pinnacle'
  | 'modern-luminous'
  | 'cinematic-glass'
  | 'film-noir'
  | 'matinee-popcorn'
  | 'midnight-cinema'
  | 'vintage-ticket'
  | 'neon-cyberpunk'
  | 'minimalist-studio'
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
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('activeTheme');
    return (saved as Theme) || 'modern-pinnacle';
  });

  useEffect(() => {
    localStorage.setItem('activeTheme', theme);
    document.documentElement.setAttribute('data-theme', theme);
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
