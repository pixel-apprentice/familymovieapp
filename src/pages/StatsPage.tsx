import React, { useState, useMemo } from 'react';
import { useData, FamilyMember, TURN_ORDER, FAMILY_COLORS } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { useModal } from '../contexts/ModalContext';
import { motion, AnimatePresence } from 'motion/react';
import { StarIcon } from '../components/Icons';

export function StatsPage() {
  const { movies, resetDatabase, isLocalMode } = useData();
  const { theme } = useTheme();
  const { showModal } = useModal();
  const [isResetting, setIsResetting] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  const handleReset = async () => {
    const confirmed = await showModal({
      type: 'confirm',
      title: 'Reset Database',
      message: 'Are you sure you want to reset the database? This will clear all movies and re-seed from the master list.',
      confirmText: 'Reset',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      setIsResetting(true);
      await resetDatabase();
    }
  };

  const watchedMovies = useMemo(() => movies.filter(m => m.status === 'watched'), [movies]);

  const stats = useMemo(() => {
    const stats: Record<FamilyMember, { totalPicked: number, totalRating: number, ratingCount: number, genres: Record<string, number> }> = {
      Jack: { totalPicked: 0, totalRating: 0, ratingCount: 0, genres: {} },
      Simone: { totalPicked: 0, totalRating: 0, ratingCount: 0, genres: {} },
      Mom: { totalPicked: 0, totalRating: 0, ratingCount: 0, genres: {} },
      Dad: { totalPicked: 0, totalRating: 0, ratingCount: 0, genres: {} }
    };

    watchedMovies.forEach(m => {
      if (m.pickedBy in stats) {
        stats[m.pickedBy as FamilyMember].totalPicked++;
        m.genres?.forEach(g => {
          stats[m.pickedBy as FamilyMember].genres[g] = (stats[m.pickedBy as FamilyMember].genres[g] || 0) + 1;
        });
      }
      Object.entries(m.ratings).forEach(([member, rating]) => {
        const r = rating as number;
        if (r > 0 && member in stats) {
          stats[member as FamilyMember].totalRating += r;
          stats[member as FamilyMember].ratingCount++;
        }
      });
    });

    return stats;
  }, [watchedMovies]);

  return (
    <div className="flex flex-col gap-12 w-full max-w-7xl mx-auto px-4 py-8">
      {/* Connection Status */}
      <div className="flex justify-end">
        <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${isLocalMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
          {isLocalMode ? '⚠️ Local Mode (No Sync)' : '✅ Firebase Connected'}
        </div>
      </div>

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

      {/* Advanced Stats Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className={`text-xl md:text-2xl font-black uppercase tracking-widest text-theme-primary ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
            Advanced Family Stats
          </h2>
          <div className="h-px flex-1 bg-theme-border/30" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TURN_ORDER.map(member => {
            const s = stats[member];
            const avg = s.ratingCount > 0 ? (Number(s.totalRating) / Number(s.ratingCount)).toFixed(1) : '—';
            const topGenre = Object.entries(s.genres).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || '—';
            const color = FAMILY_COLORS[member];

            return (
              <motion.div 
                key={member} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-theme-surface/30 border-2 border-theme-border p-4 rounded-[1.5rem] flex flex-col items-center relative overflow-hidden group shadow-lg hover:border-theme-primary/50 transition-all ${
                  theme === 'modern-pinnacle' ? 'rounded-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-white/[0.02]' : ''
                } ${
                  theme === 'modern-luminous' ? 'rounded-2xl border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl bg-black/[0.02]' : ''
                }`}
              >
                <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: color }} />
                
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-xl mb-3 shadow-inner" style={{ backgroundColor: color }}>
                  {member[0]}
                </div>

                <span className="text-base font-black uppercase tracking-widest text-theme-text mb-0.5">{member}</span>
                <span className="text-[9px] font-mono uppercase tracking-widest text-theme-muted mb-4">Master Critic</span>

                <div className="flex flex-col items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black" style={{ color }}>{avg}</span>
                    <StarIcon filled className="w-5 h-5" style={{ color }} />
                  </div>
                  <span className="text-[8px] font-mono uppercase tracking-widest text-theme-muted mt-1">Average Rating Given</span>
                </div>

                <div className="w-full space-y-3 pt-4 border-t border-theme-border/30">
                  <div className="flex justify-between items-center px-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-theme-muted">Picked</span>
                      <span className="text-lg font-black text-theme-text">{s.totalPicked}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-theme-muted">Rated</span>
                      <span className="text-lg font-black text-theme-text">{s.ratingCount}</span>
                    </div>
                  </div>

                  <div className="bg-theme-base/50 p-3 rounded-xl border border-theme-border/30">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-theme-muted block mb-0.5">Favorite Genre</span>
                    <span className="text-xs font-black text-theme-primary uppercase tracking-tight">{topGenre}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Fun Facts / Insights */}
      <section className="grid grid-cols-1 gap-6">
        <div className={`bg-theme-surface/30 border-2 border-theme-border p-8 rounded-[2.5rem] shadow-xl ${
          theme === 'modern-pinnacle' ? 'rounded-3xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-white/[0.02]' : ''
        } ${
          theme === 'modern-luminous' ? 'rounded-3xl border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl bg-black/[0.02]' : ''
        }`}>
          <h3 className="text-lg font-black uppercase tracking-widest text-theme-primary mb-6">Movie Night Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 bg-theme-base/30 rounded-2xl border border-theme-border/20">
              <div className="w-10 h-10 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary">
                🎬
              </div>
              <div>
                <p className="text-sm font-black text-theme-text">Total Movies Watched</p>
                <p className="text-xs text-theme-muted font-mono">{watchedMovies.length} cinematic adventures and counting!</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-theme-base/30 rounded-2xl border border-theme-border/20">
              <div className="w-10 h-10 rounded-full bg-theme-accent/20 flex items-center justify-center text-theme-accent">
                ⭐
              </div>
              <div>
                <p className="text-sm font-black text-theme-text">Highest Rated Picker</p>
                <p className="text-xs text-theme-muted font-mono">
                  {Object.entries(stats).sort((a, b) => {
                    const sA = a[1] as any;
                    const sB = b[1] as any;
                    const avgA = sA.ratingCount > 0 ? sA.totalRating / sA.ratingCount : 0;
                    const avgB = sB.ratingCount > 0 ? sB.totalRating / sB.ratingCount : 0;
                    return avgB - avgA;
                  })[0][0]} is the most generous critic!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="mt-12 pt-12 border-t border-theme-border/20">
        <div className="bg-red-500/10 border-2 border-red-500/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-lg font-black uppercase tracking-widest text-red-500">Danger Zone</h3>
            <p className="text-xs text-theme-muted font-mono uppercase tracking-widest">Reset the database to the master seed list</p>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <button 
              onClick={handleReset}
              disabled={isResetting}
              className="px-8 py-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 transition-all uppercase text-xs tracking-widest shadow-lg disabled:opacity-50"
            >
              {isResetting ? 'Resetting...' : 'Reset Database'}
            </button>
            {isLocalMode && localStorage.getItem('forceLocal') === 'true' ? (
              <button 
                onClick={() => {
                  localStorage.removeItem('forceLocal');
                  window.location.reload();
                }}
                className="px-8 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black rounded-xl hover:bg-emerald-500/20 transition-all uppercase text-[10px] tracking-widest"
              >
                Try Firebase Again
              </button>
            ) : !isLocalMode && (
              <button 
                onClick={async () => {
                  const confirmed = await showModal({
                    type: 'confirm',
                    title: 'Switch to Local Mode',
                    message: "Switch to Local Mode? This will ignore Firebase and use your browser's storage instead.",
                    confirmText: 'Switch',
                    cancelText: 'Cancel'
                  });
                  if (confirmed) {
                    localStorage.setItem('forceLocal', 'true');
                    window.location.reload();
                  }
                }}
                className="px-8 py-2 bg-theme-surface border border-theme-border text-theme-muted font-black rounded-xl hover:text-theme-primary transition-all uppercase text-[10px] tracking-widest"
              >
                Force Local Mode
              </button>
            )}
          </div>
        </div>
      </section>
      {/* About Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className={`text-xl md:text-2xl font-black uppercase tracking-widest text-theme-primary ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
            About
          </h2>
          <div className="h-px flex-1 bg-theme-border/30" />
        </div>
        
        <div className={`bg-theme-surface/30 p-6 rounded-[2.5rem] border-2 border-theme-border shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 ${
          theme === 'modern-pinnacle' ? 'rounded-3xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-white/[0.02]' : ''
        } ${
          theme === 'modern-luminous' ? 'rounded-3xl border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl bg-black/[0.02]' : ''
        }`}>
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-black uppercase tracking-widest text-theme-text">App Version</h3>
            <p className="text-xs text-theme-muted font-mono uppercase tracking-widest mt-1">Current Build: v0.5</p>
          </div>
          <button 
            onClick={() => setShowChangelog(true)}
            className="px-6 py-3 bg-theme-primary text-theme-base font-black rounded-2xl hover:scale-105 transition-transform shadow-lg uppercase text-[10px] tracking-widest"
          >
            View Changelog
          </button>
        </div>
      </section>

      {/* Footer Version */}
      <div className="text-center py-8 opacity-30 border-t border-theme-border/10 mt-8">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-theme-muted">Family Movie Night v0.5</p>
      </div>

      {/* Changelog Modal */}
      <AnimatePresence>
        {showChangelog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowChangelog(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-lg rounded-[2rem] border-2 border-theme-primary p-8 shadow-2xl overflow-hidden relative ${
                theme === 'modern-pinnacle' ? 'bg-black/80 backdrop-blur-xl border-white/20' : 'bg-theme-surface'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-theme-primary">Changelog</h2>
                <button 
                  onClick={() => setShowChangelog(false)} 
                  className="p-2 hover:bg-theme-base rounded-full transition-colors text-theme-muted hover:text-theme-text"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-theme-border/30 pb-2">
                    <h3 className="text-sm font-black uppercase tracking-widest text-theme-text">v0.5 (Current)</h3>
                    <span className="text-[10px] font-mono text-theme-primary bg-theme-primary/10 px-2 py-1 rounded-lg">LATEST</span>
                  </div>
                  <ul className="space-y-3 text-xs font-mono text-theme-text">
                    <li className="flex gap-3 items-start">
                      <span className="text-lg leading-none">✨</span>
                      <span>Added "Magic Suggestions" AI feature for personalized picks</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-lg leading-none">🎨</span>
                      <span>New Theme: Neon Cyberpunk</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-lg leading-none">📊</span>
                      <span>Advanced Family Stats Dashboard</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-lg leading-none">🔒</span>
                      <span>Secure Local Mode & Firebase Sync</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3 opacity-80">
                  <div className="flex items-center justify-between border-b border-theme-border/30 pb-2">
                    <h3 className="text-sm font-black uppercase tracking-widest text-theme-text">v0.1 - v0.4</h3>
                  </div>
                  <ul className="space-y-3 text-xs font-mono text-theme-text">
                    <li className="flex gap-3 items-start">
                      <span className="text-lg leading-none">🎬</span>
                      <span>Basic Movie Tracking & Wishlist</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-lg leading-none">👥</span>
                      <span>Family Member Profiles</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-lg leading-none">🎲</span>
                      <span>Random Movie Picker</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-theme-border/30 text-center">
                <p className="text-[10px] font-mono uppercase tracking-widest text-theme-text/70">Built with ❤️ by Dad for Pizza Movie Night</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
