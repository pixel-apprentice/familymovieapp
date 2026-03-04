import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeSwitcher, themes } from '../components/ThemeSwitcher';
import { UserStatsPanel } from '../components/stats/UserStatsPanel';
import { AboutPanel } from '../components/stats/AboutPanel';
import { SearchPreferencesPanel } from '../components/stats/SearchPreferencesPanel';
import { DataManagementPanel } from '../components/stats/DataManagementPanel';

export function StatsPage() {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col gap-12 w-full max-w-7xl mx-auto px-4 py-8">

      {/* Theme Picker Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className={`text-xl md:text-2xl font-black uppercase tracking-widest text-theme-primary ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
            Appearance
          </h2>
          <div className="h-px flex-1 bg-theme-border/30" />
        </div>
        <div className={`bg-theme-surface/30 p-6 rounded-[2.5rem] border-2 border-theme-border shadow-xl ${theme === 'modern-pinnacle' ? 'rounded-3xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-white/[0.02]' : ''
          } ${theme === 'modern-luminous' ? 'rounded-3xl border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl bg-black/[0.02]' : ''
          }`}>
          <p className="text-xs font-mono uppercase tracking-widest text-theme-muted mb-6 px-4">
            Choose your family's vibe:{' '}
            <span className="text-theme-primary font-black">
              {themes.find(t => t.id === theme)?.label ?? theme}
            </span>
          </p>
          <ThemeSwitcher />
        </div>
      </section>

      <SearchPreferencesPanel />

      <DataManagementPanel />

      <UserStatsPanel />
      <AboutPanel />
    </div>
  );
}

