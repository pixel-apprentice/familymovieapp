import React, { useState, useMemo } from 'react';
import { useData, Movie } from '../contexts/DataContext';
import { MovieCard } from './MovieCard';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';
import { useModal } from '../contexts/ModalContext';
import { StarIcon } from './Icons';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';

export function MovieList() {
  const { movies, removeMovie, loading, profiles } = useData();
  const { theme } = useTheme();
  const { showModal } = useModal();
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

  const handleDeleteWatched = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = await showModal({
      type: 'confirm',
      title: 'Delete from History',
      message: 'Are you sure you want to delete this movie from history?',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      removeMovie(id);
    }
  };

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4">
      {/* Up Next Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <h2 className={`text-xl md:text-2xl font-black uppercase tracking-widest text-theme-primary ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
              Up Next
            </h2>
            <div className="h-px flex-1 bg-theme-border/30" />
          </div>
          {wishlistMovies.length > 1 && (
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={pickRandom}
              className="ml-4 px-4 py-2 bg-theme-primary text-theme-base text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform shadow-lg"
            >
              🎲 Random Pick
            </motion.button>
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
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { hapticFeedback.light(); setRandomMovie(null); }}
                  className="mt-8 w-full py-4 bg-theme-surface border-2 border-theme-primary text-theme-primary font-black rounded-2xl hover:bg-theme-primary hover:text-theme-base transition-all uppercase text-xs tracking-widest"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
          <AnimatePresence>
            {loading ? (
              // Skeleton Loaders
              Array.from({ length: 4 }).map((_, i) => (
                <motion.div 
                  key={`skeleton-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="aspect-[2/3] rounded-2xl bg-theme-border/20 animate-pulse border-2 border-theme-border/10"
                />
              ))
            ) : (
              wishlistMovies.map(movie => (
                <MovieCard key={movie.id} movie={movie} />
              ))
            )}
          </AnimatePresence>
        </motion.div>

        {!loading && wishlistMovies.length === 0 && (
          <div className="text-center py-12 text-theme-muted font-mono uppercase tracking-widest opacity-50 text-xs">
            No movies in wishlist
          </div>
        )}
      </section>

      {/* History Section - Compact List */}
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
    </div>
  );
}


