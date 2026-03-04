import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'motion/react';
import { StarIcon } from '../Icons';

export function UserStatsPanel() {
  const { movies, profiles } = useData();
  const { theme } = useTheme();

  const watchedMovies = useMemo(() => movies.filter(m => m.status === 'watched'), [movies]);

  const stats = useMemo(() => {
    const stats: Record<string, { totalPicked: number, totalRating: number, ratingCount: number, genres: Record<string, number> }> = {};
    
    profiles.forEach(p => {
      stats[p.id] = { totalPicked: 0, totalRating: 0, ratingCount: 0, genres: {} };
    });

    watchedMovies.forEach(m => {
      if (m.pickedBy in stats) {
        stats[m.pickedBy].totalPicked++;
        m.genres?.forEach(g => {
          stats[m.pickedBy].genres[g] = (stats[m.pickedBy].genres[g] || 0) + 1;
        });
      }
      Object.entries(m.ratings).forEach(([member, rating]) => {
        const r = rating as number;
        if (r > 0 && member in stats) {
          stats[member].totalRating += r;
          stats[member].ratingCount++;
        }
      });
    });

    return stats;
  }, [watchedMovies, profiles]);

  return (
    <>
      {/* Advanced Stats Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className={`text-xl md:text-2xl font-black uppercase tracking-widest text-theme-primary ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
            {theme === 'mooooovies' ? 'Herd Stats' :
             theme === 'drive-in' ? 'Crew Stats' :
             theme === 'blockbuster' ? 'Member Stats' :
             theme === 'sci-fi-hologram' ? 'Crew Metrics' :
             theme === 'golden-age' ? 'Cast Stats' :
             'Advanced Family Stats'}
          </h2>
          <div className="h-px flex-1 bg-theme-border/30" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {profiles.map(profile => {
            const member = profile.id;
            const s = stats[member];
            const avg = s.ratingCount > 0 ? (Number(s.totalRating) / Number(s.ratingCount)).toFixed(1) : '—';
            const topGenre = Object.entries(s.genres).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || '—';
            const color = profile.color;

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
                <span className="text-[9px] font-mono uppercase tracking-widest text-theme-muted mb-4">
                  {theme === 'mooooovies' ? 'Top Grazer' :
                   theme === 'drive-in' ? 'Regular' :
                   theme === 'blockbuster' ? 'VIP Member' :
                   theme === 'sci-fi-hologram' ? 'Commander' :
                   theme === 'golden-age' ? 'A-Lister' :
                   'Master Critic'}
                </span>

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
          <h3 className="text-lg font-black uppercase tracking-widest text-theme-primary mb-6">
            {theme === 'mooooovies' ? 'Pasture Insights' :
             theme === 'drive-in' ? 'Screening Insights' :
             theme === 'blockbuster' ? 'Rental Insights' :
             theme === 'sci-fi-hologram' ? 'Log Analysis' :
             theme === 'golden-age' ? 'Box Office Insights' :
             'Movie Night Insights'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 bg-theme-base/30 rounded-2xl border border-theme-border/20">
              <div className="w-10 h-10 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary">
                🎬
              </div>
              <div>
                <p className="text-sm font-black text-theme-text">
                  {theme === 'mooooovies' ? 'Total Movies Grazed' :
                   theme === 'drive-in' ? 'Total Screenings' :
                   theme === 'blockbuster' ? 'Total Tapes Returned' :
                   theme === 'sci-fi-hologram' ? 'Total Logs Archived' :
                   theme === 'golden-age' ? 'Total Pictures Wrapped' :
                   'Total Movies Watched'}
                </p>
                <p className="text-xs text-theme-muted font-mono">
                  {watchedMovies.length} {
                    theme === 'mooooovies' ? 'pastures and counting!' :
                    theme === 'drive-in' ? 'features and counting!' :
                    theme === 'blockbuster' ? 'rentals and counting!' :
                    theme === 'sci-fi-hologram' ? 'transmissions and counting!' :
                    theme === 'golden-age' ? 'scripts and counting!' :
                    'cinematic adventures and counting!'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-theme-base/30 rounded-2xl border border-theme-border/20">
              <div className="w-10 h-10 rounded-full bg-theme-accent/20 flex items-center justify-center text-theme-accent">
                ⭐
              </div>
              <div>
                <p className="text-sm font-black text-theme-text">Highest Rated Picker</p>
                <p className="text-xs text-theme-muted font-mono">
                  {Object.keys(stats).length > 0 ? Object.entries(stats).sort((a, b) => {
                    const sA = a[1] as any;
                    const sB = b[1] as any;
                    const avgA = sA.ratingCount > 0 ? sA.totalRating / sA.ratingCount : 0;
                    const avgB = sB.ratingCount > 0 ? sB.totalRating / sB.ratingCount : 0;
                    return avgB - avgA;
                  })[0][0] : 'No one'} is the most generous critic!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
