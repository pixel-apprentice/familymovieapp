import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Movie } from '../../contexts/DataContext';
import { MovieCard } from '../MovieCard';
import { MovieListRow } from '../MovieListRow';
import { hapticFeedback } from '../../utils/haptics';

interface UpNextSectionProps {
  wishlistMovies: Movie[];
  pickRandom: () => void;
  randomMovie: Movie | null;
  setRandomMovie: (movie: Movie | null) => void;
  viewMode: 'grid' | 'list';
}

export function UpNextSection({ wishlistMovies, pickRandom, randomMovie, setRandomMovie, viewMode }: UpNextSectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-theme-primary uppercase tracking-tighter">Up Next</h2>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={pickRandom}
          disabled={wishlistMovies.length === 0}
          className="px-4 py-2 bg-theme-accent text-theme-base font-black rounded-xl hover:scale-105 transition-transform disabled:opacity-50 shadow-lg uppercase text-[10px] tracking-widest flex items-center gap-2"
        >
          <span className="text-sm">🎲</span> Pick Random
        </motion.button>
      </div>

      <AnimatePresence mode="popLayout">
        {randomMovie && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setRandomMovie(null)}
          >
            <motion.div
              className="max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-theme-surface p-6 rounded-3xl border-2 border-theme-accent shadow-2xl text-center space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-theme-accent">The Universe Has Chosen</h3>
                <MovieCard movie={randomMovie} />
                <button
                  onClick={() => setRandomMovie(null)}
                  className="w-full py-3 bg-theme-base text-theme-text font-black rounded-xl uppercase text-xs tracking-widest hover:bg-theme-border transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {wishlistMovies.length === 0 ? (
        <div className="text-center py-12 bg-theme-surface rounded-3xl border border-theme-border border-dashed">
          <p className="text-theme-muted font-mono text-sm uppercase tracking-widest">No movies in wishlist</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {wishlistMovies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {wishlistMovies.map(movie => (
            <MovieListRow key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </section>
  );
}
