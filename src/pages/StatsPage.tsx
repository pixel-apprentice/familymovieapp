import React, { useState, useMemo } from 'react';
import { useData, FamilyMember, TURN_ORDER, FAMILY_COLORS } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { motion } from 'motion/react';
import { StarIcon } from '../components/Icons';

export function StatsPage() {
  const { movies, resetDatabase } = useData();
  const { theme } = useTheme();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset the database? This will clear all movies and re-seed from the master list.")) {
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
      {/* Theme Picker Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className={`text-xl md:text-2xl font-black uppercase tracking-widest text-theme-primary ${theme === 'enchanted-library' ? 'font-serif italic' : ''}`}>
            Appearance
          </h2>
          <div className="h-px flex-1 bg-theme-border/30" />
        </div>
        <div className="bg-theme-surface/30 p-6 rounded-[2.5rem] border-2 border-theme-border shadow-xl">
          <p className="text-xs font-mono uppercase tracking-widest text-theme-muted mb-6 px-4">Choose your family's vibe</p>
          <ThemeSwitcher />
        </div>
      </section>

      {/* Advanced Stats Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className={`text-xl md:text-2xl font-black uppercase tracking-widest text-theme-primary ${theme === 'enchanted-library' ? 'font-serif italic' : ''}`}>
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
                className="bg-theme-surface/30 border-2 border-theme-border p-6 rounded-[2rem] flex flex-col items-center relative overflow-hidden group shadow-lg hover:border-theme-primary/50 transition-all"
              >
                <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: color }} />
                
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl mb-4 shadow-inner" style={{ backgroundColor: color }}>
                  {member[0]}
                </div>

                <span className="text-lg font-black uppercase tracking-widest text-theme-text mb-1">{member}</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-theme-muted mb-6">Master Critic</span>

                <div className="flex flex-col items-center mb-8">
                  <div className="flex items-center gap-2">
                    <span className="text-4xl font-black" style={{ color }}>{avg}</span>
                    <StarIcon filled className="w-6 h-6" style={{ color }} />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-theme-muted mt-1">Average Rating Given</span>
                </div>

                <div className="w-full space-y-4 pt-6 border-t border-theme-border/30">
                  <div className="flex justify-between items-center px-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono uppercase tracking-widest text-theme-muted">Movies Picked</span>
                      <span className="text-xl font-black text-theme-text">{s.totalPicked}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-mono uppercase tracking-widest text-theme-muted">Ratings Left</span>
                      <span className="text-xl font-black text-theme-text">{s.ratingCount}</span>
                    </div>
                  </div>

                  <div className="bg-theme-base/50 p-4 rounded-2xl border border-theme-border/30">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-theme-muted block mb-1">Favorite Genre</span>
                    <span className="text-sm font-black text-theme-primary uppercase tracking-tight">{topGenre}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Fun Facts / Insights */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-theme-surface/30 border-2 border-theme-border p-8 rounded-[2.5rem] shadow-xl">
          <h3 className="text-lg font-black uppercase tracking-widest text-theme-primary mb-6">Movie Night Insights</h3>
          <div className="space-y-4">
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

        <div className="bg-theme-primary text-theme-base p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-center items-center text-center">
          <span className="text-4xl mb-4">🍿</span>
          <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Ready for the next one?</h3>
          <p className="text-xs font-mono uppercase tracking-widest opacity-80">Keep the tradition alive</p>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="mt-12 pt-12 border-t border-theme-border/20">
        <div className="bg-red-500/10 border-2 border-red-500/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-lg font-black uppercase tracking-widest text-red-500">Danger Zone</h3>
            <p className="text-xs text-theme-muted font-mono uppercase tracking-widest">Reset the database to the master seed list</p>
          </div>
          <button 
            onClick={handleReset}
            disabled={isResetting}
            className="px-8 py-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 transition-all uppercase text-xs tracking-widest shadow-lg disabled:opacity-50"
          >
            {isResetting ? 'Resetting...' : 'Reset Database'}
          </button>
        </div>
      </section>
    </div>
  );
}
