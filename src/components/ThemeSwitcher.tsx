import React from 'react';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { ThemeIcon } from './Icons';

const themes: { id: Theme; label: string }[] = [
  { id: 'midnight-minimalist', label: 'Midnight' },
  { id: 'cyber-command', label: 'Cyber' },
  { id: 'galactic-glow', label: 'Galactic' },
  { id: 'golden-marquee', label: 'Marquee' },
  { id: '8-bit-arcade', label: 'Arcade' },
  { id: 'enchanted-library', label: 'Library' }
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`flex flex-wrap gap-1 md:gap-2 p-2 md:p-4 bg-theme-surface border-b border-theme-border transition-all duration-500 ${
      theme === 'golden-marquee' ? 'border-4 border-double border-yellow-600 bg-red-900/50' : ''
    } ${
      theme === '8-bit-arcade' ? 'border-4 bg-blue-900' : ''
    } ${
      theme === 'enchanted-library' ? 'rounded-xl shadow-inner' : ''
    }`}>
      {themes.map(t => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm transition-all duration-300 relative overflow-hidden group ${
            theme === t.id 
              ? 'bg-theme-primary text-theme-base font-bold shadow-md scale-105 z-10' 
              : 'text-theme-muted hover:text-theme-text hover:bg-theme-border/20'
          } ${
            theme === 'golden-marquee' ? 'ticket-stub rounded-none mx-0.5 hover:rotate-1' : ''
          } ${
            theme === 'cyber-command' ? 'plastic-btn rounded-sm border border-green-500/30' : ''
          } ${
            theme === 'galactic-glow' ? 'rounded-full hover:shadow-[0_0_15px_currentColor]' : ''
          } ${
            theme === '8-bit-arcade' ? 'rounded-none border-2 border-white shadow-[2px_2px_0_#000] active:translate-y-1 active:shadow-none' : ''
          }`}
        >
          <div className="relative z-10 flex items-center gap-1 md:gap-2">
            <ThemeIcon themeName={t.id} />
            <span className="hidden xs:inline">{t.label}</span>
          </div>
          
          {theme === 'galactic-glow' && theme === t.id && (
            <div className="absolute inset-0 bg-white/20 blur-md animate-pulse" />
          )}
        </button>
      ))}
    </div>
  );
}

