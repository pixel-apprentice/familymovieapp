import React from 'react';
import { Movie, FamilyProfile } from '../../contexts/DataContext';
import { MovieCard } from '../MovieCard';
import { MovieListRow } from '../MovieListRow';

interface HistorySectionProps {
  watchedMovies: Movie[];
  profiles: FamilyProfile[];
  calculateAverageRating: (ratings: Movie['ratings']) => number;
  viewMode: 'grid' | 'list';
}

export function HistorySection({ watchedMovies, profiles, calculateAverageRating, viewMode }: HistorySectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-theme-text uppercase tracking-tighter opacity-50">History</h2>
        <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted">{watchedMovies.length} Movies</span>
      </div>

      {watchedMovies.length === 0 ? (
        <div className="text-center py-12 bg-theme-surface/50 rounded-3xl border border-theme-border border-dashed">
          <p className="text-theme-muted font-mono text-sm uppercase tracking-widest">No watched movies yet</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 opacity-80 hover:opacity-100 transition-opacity duration-500">
          {watchedMovies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {watchedMovies.map(movie => (
            <MovieListRow key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </section>
  );
}
