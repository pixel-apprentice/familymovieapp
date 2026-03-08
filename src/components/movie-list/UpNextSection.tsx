import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Movie } from '../../contexts/DataContext';
import { MovieCard } from '../MovieCard';
import { MovieListRow } from '../MovieListRow';
import { hapticFeedback } from '../../utils/haptics';
import { useTheme, useThemeText } from '../../contexts/ThemeContext';
import { WandSparkles } from 'lucide-react';

interface UpNextSectionProps {
  wishlistMovies: Movie[];
  pickRandom: () => void;
  randomMovie: Movie | null;
  setRandomMovie: (movie: Movie | null) => void;
  viewMode: 'grid' | 'list';
}

export function UpNextSection({ wishlistMovies, pickRandom, randomMovie, setRandomMovie, viewMode }: UpNextSectionProps) {
  const { theme } = useTheme();
  const getThemeText = useThemeText();
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-black text-theme-primary uppercase tracking-tighter">
          {getThemeText('upNextTitle')}
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={pickRandom}
            disabled={wishlistMovies.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-theme-primary text-theme-base shadow-lg hover:shadow-theme-primary/20 transition-all disabled:opacity-40"
          >
            <WandSparkles size={14} />
            <span className="hidden sm:inline">Smart Pick</span>
          </button>
        </div>
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
                <h3 className="text-sm font-black uppercase tracking-widest text-theme-accent">
                  {getThemeText('randomPick')}
                </h3>
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
          <p className="text-theme-muted font-mono text-sm uppercase tracking-widest">
            {getThemeText('upNextEmpty')}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
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
