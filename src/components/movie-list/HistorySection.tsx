import React from 'react';
import { Movie, FamilyProfile } from '../../contexts/DataContext';
import { MovieCard } from '../MovieCard';
import { MovieListRow } from '../MovieListRow';
import { useTheme, useThemeText } from '../../contexts/ThemeContext';

interface HistorySectionProps {
  watchedMovies: Movie[];
  profiles: FamilyProfile[];
  calculateAverageRating: (ratings: Movie['ratings']) => number;
  viewMode: 'grid' | 'list';
}

export function HistorySection({ watchedMovies, profiles, calculateAverageRating, viewMode }: HistorySectionProps) {
  const { theme } = useTheme();
  const getThemeText = useThemeText();
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-black text-theme-text uppercase tracking-tighter opacity-30">
          {getThemeText('historyTitle')}
        </h2>
      </div>

      {watchedMovies.length === 0 ? (
        <div className="text-center py-12 bg-theme-surface/50 rounded-3xl border border-theme-border border-dashed">
          <p className="text-theme-muted font-mono text-sm uppercase tracking-widest">
            {getThemeText('historyEmpty')}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 opacity-80 hover:opacity-100 transition-opacity duration-500">
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
