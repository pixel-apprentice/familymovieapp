import React from 'react';
import { Link } from 'react-router-dom';
import { Movie, FamilyProfile } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import { StarIcon } from '../Icons';
import { hapticFeedback } from '../../utils/haptics';

interface HistorySectionProps {
  watchedMovies: Movie[];
  loading: boolean;
  profiles: FamilyProfile[];
  calculateAverageRating: (ratings: Movie['ratings']) => number;
}

export function HistorySection({
  watchedMovies,
  loading,
  profiles,
  calculateAverageRating
}: HistorySectionProps) {
  const { theme } = useTheme();

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className={`text-xl md:text-2xl font-black uppercase tracking-widest text-theme-primary ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
          History
        </h2>
        <div className="h-px flex-1 bg-theme-border/30" />
      </div>

      <div className={`flex flex-col gap-3`}>
        {loading ? (
          // Skeleton Loaders for History
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`history-skeleton-${i}`} className="flex items-center justify-between p-4 rounded-2xl border border-theme-border/20 bg-theme-surface/10 animate-pulse">
              <div className="flex flex-col gap-2 w-1/2">
                <div className="h-5 bg-theme-border/20 rounded w-full" />
                <div className="h-3 bg-theme-border/20 rounded w-1/2" />
              </div>
              <div className="h-8 w-16 bg-theme-border/20 rounded-xl" />
            </div>
          ))
        ) : (
          watchedMovies.map(movie => {
            const avg = calculateAverageRating(movie.ratings);
            return (
              <Link to={`/movie/${movie.id}`} key={movie.id} onClick={() => hapticFeedback.light()} className={`flex items-center justify-between p-4 rounded-2xl border border-theme-border/50 bg-theme-surface/30 backdrop-blur-sm hover:border-theme-primary/50 transition-colors group ${
                theme === 'modern-pinnacle' ? 'rounded-3xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-white/[0.02]' : ''
              } ${
                theme === 'modern-luminous' ? 'rounded-3xl border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl bg-black/[0.02]' : ''
              }`}>
                <div className="flex flex-col min-w-0 pr-4">
                  <span className={`text-base md:text-lg font-black text-theme-text truncate group-hover:text-theme-primary transition-colors ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
                    {movie.title}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-black uppercase tracking-widest text-theme-primary/80">
                      {profiles.find(p => p.id === movie.pickedBy)?.name || movie.pickedBy}
                    </span>
                    <span className="text-theme-border/50">•</span>
                    <span className="text-xs font-mono text-theme-muted">
                      {movie.date}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 bg-theme-base/50 px-3 py-1.5 rounded-xl border border-theme-border/30">
                    <span className="text-base font-black text-theme-primary">{avg > 0 ? avg.toFixed(1) : 'Not Rated'}</span>
                    {avg > 0 && <StarIcon filled className="w-4 h-4 text-theme-primary" />}
                  </div>
                </div>
              </Link>
            );
          })
        )}
        {!loading && watchedMovies.length === 0 && (
          <div className="text-center py-12 text-theme-muted font-mono uppercase tracking-widest opacity-50 text-xs border border-theme-border/50 rounded-2xl bg-theme-surface/30">
            No watched movies yet
          </div>
        )}
      </div>
    </section>
  );
}
