import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';

export function SearchPreferencesPanel() {
    const { theme } = useTheme();
    const { allowRatedR, setAllowRatedR } = useSettings();

    return (
        <section className="space-y-6">
            <div className="flex items-center gap-4">
                <h2 className={`text-xl md:text-2xl font-black uppercase tracking-widest text-theme-primary ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
                    Search Preferences
                </h2>
                <div className="h-px flex-1 bg-theme-border/30" />
            </div>

            <div className={`bg-theme-surface/30 p-6 rounded-[2.5rem] border-2 border-theme-border shadow-xl ${theme === 'modern-pinnacle' ? 'rounded-3xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-white/[0.02]' : ''
                } ${theme === 'modern-luminous' ? 'rounded-3xl border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl bg-black/[0.02]' : ''
                }`}>
                <div className="flex items-center justify-between gap-6">
                    <div className="flex-1">
                        <h3 className="text-sm font-black uppercase tracking-widest text-theme-text">
                            🔞 Allow R-Rated Movies
                        </h3>
                        <p className="text-xs text-theme-muted font-mono mt-1 leading-relaxed">
                            When enabled, R-rated movies may appear in search results and AI recommendations.
                            Off by default to keep things family-friendly.
                        </p>
                    </div>

                    {/* Toggle Switch */}
                    <button
                        id="allow-rated-r-toggle"
                        role="switch"
                        aria-checked={allowRatedR}
                        onClick={() => setAllowRatedR(!allowRatedR)}
                        className={`relative flex-shrink-0 w-14 h-7 rounded-full border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-primary ${allowRatedR
                                ? 'bg-theme-primary border-theme-primary'
                                : 'bg-theme-border border-theme-border'
                            }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${allowRatedR ? 'translate-x-7' : 'translate-x-0'
                                }`}
                        />
                    </button>
                </div>

                {allowRatedR && (
                    <div className="mt-4 px-4 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                        <p className="text-[11px] font-mono text-orange-400 uppercase tracking-widest">
                            ⚠️ R-rated content enabled — search results may include mature titles
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
