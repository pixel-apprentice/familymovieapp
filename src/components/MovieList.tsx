import React, { useState, useMemo } from 'react';
import { useData, Movie, FamilyMember, TURN_ORDER, FAMILY_COLORS } from '../contexts/DataContext';
import { MovieCard } from './MovieCard';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';
import { StarIcon } from './Icons';

export function MovieList() {
  const { movies } = useData();
  const { theme } = useTheme();
  const [randomMovie, setRandomMovie] = useState<Movie | null>(null);

  const wishlistMovies = useMemo(() => movies.filter(m => m.status === 'wishlist'), [movies]);
  const watchedMovies = useMemo(() => movies.filter(m => m.status === 'watched').sort((a, b) => {
    if (a.date && b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    return 0;
  }), [movies]);

  const calculateAverageRating = (ratings: Movie['ratings']) => {
    const values = Object.values(ratings).filter(r => r > 0);
    if (values.length === 0) return 0;
    return parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
  };

  const pickRandom = () => {
    if (wishlistMovies.length === 0) return;
    const randomIndex = Math.floor(Math.random() * wishlistMovies.length);
    setRandomMovie(wishlistMovies[randomIndex]);
    setTimeout(() => setRandomMovie(null), 5000);
  };

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4">
      {/* Up Next Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <h2 className={`text-xl md:text-2xl font-black uppercase tracking-widest text-theme-primary ${theme === 'enchanted-library' ? 'font-serif italic' : ''}`}>
              Up Next
            </h2>
            <div className="h-px flex-1 bg-theme-border/30" />
          </div>
          {wishlistMovies.length > 1 && (
            <button 
              onClick={pickRandom}
              className="ml-4 px-4 py-2 bg-theme-primary text-theme-base text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform shadow-lg"
            >
              🎲 Random Pick
            </button>
          )}
        </div>

        <AnimatePresence>
          {randomMovie && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-theme-base/80 backdrop-blur-xl"
            >
              <div className="max-w-sm w-full">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-black text-theme-primary uppercase tracking-tighter mb-2">The Chosen One</h3>
                  <p className="text-xs text-theme-muted font-mono uppercase tracking-widest">Fate has decided</p>
                </div>
                <MovieCard movie={randomMovie} />
                <button 
                  onClick={() => setRandomMovie(null)}
                  className="mt-8 w-full py-4 bg-theme-surface border-2 border-theme-primary text-theme-primary font-black rounded-2xl hover:bg-theme-primary hover:text-theme-base transition-all uppercase text-xs tracking-widest"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
          <AnimatePresence>
            {wishlistMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </AnimatePresence>
        </motion.div>

        {wishlistMovies.length === 0 && (
          <div className="text-center py-12 text-theme-muted font-mono uppercase tracking-widest opacity-50 text-xs">
            No movies in wishlist
          </div>
        )}
      </section>

      {/* History Section - Compact List */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className={`text-xl md:text-2xl font-black uppercase tracking-widest text-theme-primary ${theme === 'enchanted-library' ? 'font-serif italic' : ''}`}>
            History
          </h2>
          <div className="h-px flex-1 bg-theme-border/30" />
        </div>

        <div className={`flex flex-col gap-3 ${theme === '8-bit-arcade' ? 'rounded-none' : ''}`}>
          {watchedMovies.map(movie => {
            const avg = calculateAverageRating(movie.ratings);
            return (
              <div key={movie.id} className="flex items-center justify-between p-4 rounded-2xl border border-theme-border/50 bg-theme-surface/30 backdrop-blur-sm hover:border-theme-primary/50 transition-colors group">
                <div className="flex flex-col min-w-0 pr-4">
                  <span className={`text-base md:text-lg font-black text-theme-text truncate group-hover:text-theme-primary transition-colors ${theme === 'enchanted-library' ? 'font-serif italic' : ''}`}>
                    {movie.title}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-black uppercase tracking-widest text-theme-primary/80">
                      {movie.pickedBy}
                    </span>
                    <span className="text-theme-border/50">•</span>
                    <span className="text-xs font-mono text-theme-muted">
                      {movie.date}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 bg-theme-base/50 px-3 py-1.5 rounded-xl border border-theme-border/30">
                  <span className="text-base font-black text-theme-primary">{avg > 0 ? avg.toFixed(1) : '—'}</span>
                  {avg > 0 && <StarIcon filled className="w-4 h-4 text-theme-primary" />}
                </div>
              </div>
            );
          })}
          {watchedMovies.length === 0 && (
            <div className="text-center py-12 text-theme-muted font-mono uppercase tracking-widest opacity-50 text-xs border border-theme-border/50 rounded-2xl bg-theme-surface/30">
              No watched movies yet
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


