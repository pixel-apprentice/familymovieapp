import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeSwitcher, themes } from '../components/ThemeSwitcher';
import { UserStatsPanel } from '../components/stats/UserStatsPanel';
import { AboutPanel } from '../components/stats/AboutPanel';
import { SearchPreferencesPanel } from '../components/stats/SearchPreferencesPanel';
import { DataManagementPanel } from '../components/stats/DataManagementPanel';
import { DataStatusPanel } from '../components/stats/DataStatusPanel';
import { WrappedPanel } from '../components/stats/WrappedPanel';
import { AlertCircle, Terminal, Copy, Trash2, Check } from 'lucide-react';
import { ErrorLog } from '../utils/logger';
import { toast } from 'sonner';

export function StatsPage() {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col gap-12 w-full max-w-7xl mx-auto px-4 py-8">

      {/* Family Movie Wrapped — hero placement */}
      <WrappedPanel />

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

      {/* Debug Section (System Logs) */}
      {(() => {
        let logs: ErrorLog[] = [];
        try {
          const logsRaw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('fmn_error_logs') : null;
          logs = logsRaw ? JSON.parse(logsRaw) : [];
          if (!Array.isArray(logs)) logs = [];
        } catch (e) {
          logs = [];
        }
        
        if (logs.length === 0) return null;

        const copyLogs = async (text: string, label: string) => {
          try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied to clipboard`);
          } catch (e) {
            toast.error("Failed to copy to clipboard");
          }
        };

        return (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                  <Terminal size={20} />
                  System Logs
                </h2>
                <div className="h-px w-24 bg-red-500/20" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyLogs(JSON.stringify(logs, null, 2), "Full log history")}
                  className="flex items-center gap-2 px-3 py-1.5 bg-theme-primary/10 text-theme-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-theme-primary/20 transition-all border border-theme-primary/20"
                >
                  <Copy size={14} />
                  Copy All
                </button>
                <button
                  onClick={() => { sessionStorage.removeItem('fmn_error_logs'); window.location.reload(); }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20"
                >
                  <Trash2 size={14} />
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {logs.map((log, i) => (
                <div key={i} className="p-4 bg-theme-surface/30 border border-theme-border/50 rounded-2xl font-mono text-[10px] group transition-all hover:bg-theme-surface/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2 overflow-hidden">
                      <div className="flex items-center gap-2 text-theme-muted">
                        <span className="text-red-500 opacity-50">#{(logs.length - i).toString().padStart(2, '0')}</span>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-red-400 font-black text-xs break-all">{log.message}</p>
                      {log.args && <p className="text-theme-text opacity-70 break-all">{log.args}</p>}
                      {log.stack && (
                        <details className="mt-2 group/stack">
                          <summary className="cursor-pointer text-theme-muted hover:text-theme-primary transition-colors flex items-center gap-1 select-none">
                            <span className="text-[9px] uppercase tracking-tighter">View Stack Trace</span>
                          </summary>
                          <pre className="mt-2 p-3 bg-black/40 rounded-xl text-theme-muted/80 whitespace-pre-wrap break-all border border-white/5 leading-relaxed text-[8px] max-h-48 overflow-y-auto">
                            {log.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                    <button
                      onClick={() => copyLogs(JSON.stringify(log, null, 2), "Entry")}
                      className="p-2 text-theme-muted hover:text-theme-primary transition-colors opacity-0 group-hover:opacity-100"
                      title="Copy this entry"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })()}
      
      <DataStatusPanel />
    </div>
  );
}

