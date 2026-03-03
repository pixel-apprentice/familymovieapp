import React from 'react';
import { Movie, FamilyProfile } from '../../contexts/DataContext';
import { MovieCard } from '../MovieCard';

interface HistorySectionProps {
  watchedMovies: Movie[];
  loading: boolean;
  profiles: FamilyProfile[];
  calculateAverageRating: (ratings: Movie['ratings']) => number;
}

export function HistorySection({ watchedMovies, loading, profiles, calculateAverageRating }: HistorySectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-theme-text uppercase tracking-tighter opacity-50">History</h2>
        <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted">{watchedMovies.length} Movies</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-theme-border border-t-theme-primary rounded-full animate-spin opacity-50" />
        </div>
      ) : watchedMovies.length === 0 ? (
        <div className="text-center py-12 bg-theme-surface/50 rounded-3xl border border-theme-border border-dashed">
          <p className="text-theme-muted font-mono text-sm uppercase tracking-widest">No watched movies yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-80 hover:opacity-100 transition-opacity duration-500">
          {watchedMovies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </section>
  );
}
