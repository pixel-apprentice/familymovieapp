import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeSwitcher, themes } from '../components/ThemeSwitcher';
import { UserStatsPanel } from '../components/stats/UserStatsPanel';
import { AboutPanel } from '../components/stats/AboutPanel';
import { SearchPreferencesPanel } from '../components/stats/SearchPreferencesPanel';
import { DataManagementPanel } from '../components/stats/DataManagementPanel';
import { AlertCircle, Terminal } from 'lucide-react';

export function StatsPage() {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col gap-12 w-full max-w-7xl mx-auto px-4 py-8">

      {/* Theme Picker Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className={`text-xl md:text-2xl font-black uppercase tracking-widest text-theme-primary ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
            {theme === 'mooooovies' ? 'Pasture Look' :
             theme === 'drive-in' ? 'Lot Appearance' :
             theme === 'blockbuster' ? 'Store Layout' :
             theme === 'sci-fi-hologram' ? 'Holo-Interface' :
             theme === 'golden-age' ? 'Set Design' :
             'Appearance'}
          </h2>
          <div className="h-px flex-1 bg-theme-border/30" />
        </div>
        <div className={`bg-theme-surface/30 p-6 rounded-[2.5rem] border-2 border-theme-border shadow-xl ${theme === 'modern-pinnacle' ? 'rounded-3xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-white/[0.02]' : ''
          } ${theme === 'modern-luminous' ? 'rounded-3xl border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl bg-black/[0.02]' : ''
          }`}>
          <p className="text-xs font-mono uppercase tracking-widest text-theme-muted mb-6 px-4">
            {theme === 'mooooovies' ? 'Choose your herd\'s vibe:' :
             theme === 'drive-in' ? 'Choose your crew\'s vibe:' :
             theme === 'blockbuster' ? 'Choose your store\'s vibe:' :
             theme === 'sci-fi-hologram' ? 'Select interface mode:' :
             theme === 'golden-age' ? 'Choose your cast\'s vibe:' :
             'Choose your family\'s vibe:'}{' '}
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

      {/* Debug Section (Hidden unless error exists) */}
      {sessionStorage.getItem('fmn_last_error') && (
        <section className="mt-8 opacity-50 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-xl font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
              <Terminal size={20} />
              Crash Debugger
            </h2>
            <div className="h-px flex-1 bg-red-500/20" />
          </div>
          <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-3xl font-mono text-[10px] space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <div className="space-y-2">
                <p className="text-red-400 font-black">LAST CAPTURED ERROR:</p>
                <div className="p-3 bg-black/40 rounded-xl text-red-300 break-all border border-red-500/10">
                  {sessionStorage.getItem('fmn_last_error')}
                </div>
                <button 
                  onClick={() => { sessionStorage.removeItem('fmn_last_error'); window.location.reload(); }}
                  className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors uppercase font-black"
                >
                  Clear Debug Log
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

