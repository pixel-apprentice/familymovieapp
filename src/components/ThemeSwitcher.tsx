import React from 'react';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { ThemeIcon } from './Icons';

const themes: { id: Theme; label: string }[] = [
  { id: 'modern-pinnacle', label: 'Pinnacle' },
  { id: 'modern-luminous', label: 'Luminous' },
  { id: 'midnight-cinema', label: 'Midnight' },
  { id: 'vintage-ticket', label: 'Vintage' },
  { id: 'neon-cyberpunk', label: 'Neon' },
  { id: 'minimalist-studio', label: 'Studio' },
  { id: 'velvet-theater', label: 'Velvet' },
  { id: 'sci-fi-hologram', label: 'Sci-Fi' }
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`flex flex-wrap gap-1 md:gap-2 p-2 md:p-4 bg-theme-surface border-b border-theme-border transition-all duration-500 ${
      theme === 'modern-pinnacle' ? 'rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] border border-white/10 m-2 md:m-4 backdrop-blur-xl' : ''
    } ${
      theme === 'modern-luminous' ? 'rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-black/5 m-2 md:m-4 backdrop-blur-xl' : ''
    } ${
      theme === 'velvet-theater' ? 'border-b-4 border-amber-600 bg-rose-950/50' : ''
    } ${
      theme === 'neon-cyberpunk' ? 'border-b-2 border-cyan-400 bg-indigo-950/80 shadow-[0_4px_20px_rgba(0,240,255,0.15)]' : ''
    } ${
      theme === 'vintage-ticket' ? 'rounded-xl shadow-inner border-b-2 border-amber-900/20' : ''
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
            theme === 'modern-pinnacle' ? 'rounded-xl border border-white/5 hover:border-white/20' : ''
          } ${
            theme === 'modern-luminous' ? 'rounded-xl border border-black/5 hover:border-black/10' : ''
          } ${
            theme === 'velvet-theater' ? 'rounded-none mx-0.5 border border-amber-700/30' : ''
          } ${
            theme === 'neon-cyberpunk' ? 'rounded-sm border border-cyan-500/30 hover:shadow-[0_0_10px_rgba(0,240,255,0.4)]' : ''
          } ${
            theme === 'sci-fi-hologram' ? 'rounded-full hover:shadow-[0_0_15px_currentColor]' : ''
          } ${
            theme === 'vintage-ticket' ? 'ticket-stub rounded-none border border-amber-900/20 shadow-sm' : ''
          }`}
        >
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-theme-text text-theme-base text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {t.label}
          </div>
          <div className="relative z-10 flex items-center gap-1 md:gap-2">
            <ThemeIcon themeName={t.id} />
            <span className="hidden xs:inline">{t.label}</span>
          </div>
          
          {theme === 'sci-fi-hologram' && theme === t.id && (
            <div className="absolute inset-0 bg-sky-400/20 blur-md animate-pulse" />
          )}
        </button>
      ))}
    </div>
  );
}

