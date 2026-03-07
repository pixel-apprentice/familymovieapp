import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';

export function SearchPreferencesPanel() {
    const { theme } = useTheme();
    const {
        allowRatedR,
        setAllowRatedR,
        recommendationMode,
        setRecommendationMode,
        contentMaxRating,
        setContentMaxRating,
        blockMatureThemes,
        setBlockMatureThemes,
    } = useSettings();

    return (
        <section className="space-y-6">
            <div className="flex items-center gap-4">
                <h2 className={`text-xl md:text-2xl font-black uppercase tracking-widest text-theme-primary ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
                    {theme === 'mooooovies' ? 'Graze Preferences' :
                        theme === 'drive-in' ? 'Screening Preferences' :
                            theme === 'blockbuster' ? 'Rental Preferences' :
                                theme === 'sci-fi-hologram' ? 'Search Parameters' :
                                    theme === 'golden-age' ? 'Casting Preferences' :
                                        'Search Preferences'}
                </h2>
                <div className="h-px flex-1 bg-theme-border/30" />
            </div>

            <div className={`bg-theme-surface/30 p-6 rounded-[2.5rem] border-2 border-theme-border shadow-xl ${theme === 'modern-pinnacle' ? 'rounded-3xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-white/[0.02]' : ''
                } ${theme === 'modern-luminous' ? 'rounded-3xl border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl bg-black/[0.02]' : ''
                }`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <label className="flex flex-col gap-2 text-xs font-mono uppercase tracking-widest text-theme-muted">
                        Max Rating
                        <select
                            value={contentMaxRating}
                            onChange={(e) => setContentMaxRating(e.target.value as 'PG' | 'PG-13' | 'R')}
                            className="bg-theme-base border border-theme-border rounded-xl px-3 py-2 text-theme-text font-black"
                        >
                            <option value="PG">PG</option>
                            <option value="PG-13">PG-13</option>
                            <option value="R">R</option>
                        </select>
                    </label>

                    <label className="flex flex-col gap-2 text-xs font-mono uppercase tracking-widest text-theme-muted">
                        Recommendation Mode
                        <select
                            value={recommendationMode}
                            onChange={(e) => setRecommendationMode(e.target.value as any)}
                            className="bg-theme-base border border-theme-border rounded-xl px-3 py-2 text-theme-text font-black"
                        >
                            <option value="balanced">Balanced</option>
                            <option value="familiar">Comfort Picks</option>
                            <option value="explore">Try Something New</option>
                            <option value="safe">Kid-Safe Only</option>
                        </select>
                    </label>
                </div>

                <div className="mt-5 flex flex-col gap-4">
                    <button
                        id="allow-rated-r-toggle"
                        role="switch"
                        aria-checked={allowRatedR}
                        onClick={() => setAllowRatedR(!allowRatedR)}
                        className="w-full flex items-center justify-between p-3 rounded-2xl border border-theme-border bg-theme-base/60"
                    >
                        <span className="text-xs font-black uppercase tracking-widest text-theme-text">🔞 Allow R-Rated Movies</span>
                        <span className={`text-[10px] font-mono uppercase tracking-widest ${allowRatedR ? 'text-theme-primary' : 'text-theme-muted'}`}>
                            {allowRatedR ? 'Enabled' : 'Disabled'}
                        </span>
                    </button>

                    <button
                        role="switch"
                        aria-checked={blockMatureThemes}
                        onClick={() => setBlockMatureThemes(!blockMatureThemes)}
                        className="w-full flex items-center justify-between p-3 rounded-2xl border border-theme-border bg-theme-base/60"
                    >
                        <span className="text-xs font-black uppercase tracking-widest text-theme-text">🛡️ Block Mature Theme Keywords</span>
                        <span className={`text-[10px] font-mono uppercase tracking-widest ${blockMatureThemes ? 'text-theme-primary' : 'text-theme-muted'}`}>
                            {blockMatureThemes ? 'On' : 'Off'}
                        </span>
                    </button>
                </div>
            </div>
        </section>
    );
}
