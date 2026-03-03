import React from 'react';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { SystemHealthPanel } from '../components/stats/SystemHealthPanel';
import { UserStatsPanel } from '../components/stats/UserStatsPanel';
import { DatabaseManagementPanel } from '../components/stats/DatabaseManagementPanel';
import { AboutPanel } from '../components/stats/AboutPanel';

export function StatsPage() {
  const { isLocalMode } = useData();
  const { theme } = useTheme();

  return (
    <div className="flex flex-col gap-12 w-full max-w-7xl mx-auto px-4 py-8">
      {/* Connection Status */}
      <div className="flex justify-end">
        <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${isLocalMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
          {isLocalMode ? '⚠️ Local Mode (No Sync)' : '✅ Firebase Connected'}
        </div>
      </div>

      <SystemHealthPanel />

      {/* Theme Picker Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className={`text-xl md:text-2xl font-black uppercase tracking-widest text-theme-primary ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
            Appearance
          </h2>
          <div className="h-px flex-1 bg-theme-border/30" />
        </div>
        <div className={`bg-theme-surface/30 p-6 rounded-[2.5rem] border-2 border-theme-border shadow-xl ${
          theme === 'modern-pinnacle' ? 'rounded-3xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-white/[0.02]' : ''
        } ${
          theme === 'modern-luminous' ? 'rounded-3xl border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl bg-black/[0.02]' : ''
        }`}>
          <p className="text-xs font-mono uppercase tracking-widest text-theme-muted mb-6 px-4">Choose your family's vibe</p>
          <ThemeSwitcher />
        </div>
      </section>

      <UserStatsPanel />
      <DatabaseManagementPanel />
      <AboutPanel />
    </div>
  );
}
