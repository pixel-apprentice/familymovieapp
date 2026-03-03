import React, { useState, useMemo } from 'react';
import { useData, Movie } from '../contexts/DataContext';
import { hapticFeedback } from '../utils/haptics';
import { UpNextSection } from './movie-list/UpNextSection';
import { HistorySection } from './movie-list/HistorySection';

export function MovieList() {
  const { movies, loading, profiles } = useData();
  const [randomMovie, setRandomMovie] = useState<Movie | null>(null);

  const wishlistMovies = useMemo(() => movies.filter(m => m.status === 'wishlist'), [movies]);
  const watchedMovies = useMemo(() => movies.filter(m => m.status === 'watched').sort((a, b) => {
    const aDate = a.date === 'Unknown' ? null : a.date;
    const bDate = b.date === 'Unknown' ? null : b.date;
    
    if (!aDate && !bDate) return 0;
    if (!aDate) return 1; // Put movies without dates at the bottom
    if (!bDate) return -1;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  }), [movies]);

  const calculateAverageRating = (ratings: Movie['ratings']) => {
    const values = Object.values(ratings).filter(r => r > 0);
    if (values.length === 0) return 0;
    return parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
  };

  const pickRandom = () => {
    if (wishlistMovies.length === 0) return;
    hapticFeedback.medium();
    const randomIndex = Math.floor(Math.random() * wishlistMovies.length);
    setRandomMovie(wishlistMovies[randomIndex]);
    setTimeout(() => setRandomMovie(null), 5000);
  };

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4">
      <UpNextSection 
        wishlistMovies={wishlistMovies}
        loading={loading}
        pickRandom={pickRandom}
        randomMovie={randomMovie}
        setRandomMovie={setRandomMovie}
      />

      <HistorySection 
        watchedMovies={watchedMovies}
        loading={loading}
        profiles={profiles}
        calculateAverageRating={calculateAverageRating}
      />
    </div>
  );
}


