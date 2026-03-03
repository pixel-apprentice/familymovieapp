import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Movie } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import { MovieCard } from '../MovieCard';
import { hapticFeedback } from '../../utils/haptics';

interface UpNextSectionProps {
  wishlistMovies: Movie[];
  loading: boolean;
  pickRandom: () => void;
  randomMovie: Movie | null;
  setRandomMovie: (movie: Movie | null) => void;
}

export function UpNextSection({
  wishlistMovies,
  loading,
  pickRandom,
  randomMovie,
  setRandomMovie
}: UpNextSectionProps) {
  const { theme } = useTheme();

  return (
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
  );
}
