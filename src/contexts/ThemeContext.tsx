import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 
  | 'midnight-minimalist'
  | 'cyber-command'
  | 'galactic-glow'
  | 'golden-marquee'
  | '8-bit-arcade'
  | 'enchanted-library';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('activeTheme');
    return (saved as Theme) || 'midnight-minimalist';
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
