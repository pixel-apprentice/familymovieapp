import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData, Movie } from '../contexts/DataContext';
import { hapticFeedback } from '../utils/haptics';
import { UpNextSection } from './movie-list/UpNextSection';
import { HistorySection } from './movie-list/HistorySection';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, List, ChevronUp } from 'lucide-react';

export function MovieList() {
  const { movies, profiles } = useData();
  const [randomMovie, setRandomMovie] = useState<Movie | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const wishlistMovies = useMemo(() => movies.filter(m => m.status === 'wishlist'), [movies]);
  const watchedMovies = useMemo(() => movies.filter(m => m.status === 'watched').sort((a, b) => {
    const aDate = a.date === 'Unknown' ? null : a.date;
    const bDate = b.date === 'Unknown' ? null : b.date;
    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
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

  // Back to top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    hapticFeedback.light();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-10 w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4">
      {/* View mode toggle */}
      <div className="flex justify-end">
        <div className="flex items-center gap-1 bg-theme-surface border border-theme-border rounded-xl p-1">
          <button
            onClick={() => { hapticFeedback.light(); setViewMode('grid'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-theme-primary text-theme-base shadow-sm' : 'text-theme-muted hover:text-theme-primary'
              }`}
          >
            <LayoutGrid size={12} />
            Grid
          </button>
          <button
            onClick={() => { hapticFeedback.light(); setViewMode('list'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-theme-primary text-theme-base shadow-sm' : 'text-theme-muted hover:text-theme-primary'
              }`}
          >
            <List size={12} />
            List
          </button>
        </div>
      </div>

      <UpNextSection
        wishlistMovies={wishlistMovies}
        pickRandom={pickRandom}
        randomMovie={randomMovie}
        setRandomMovie={setRandomMovie}
        viewMode={viewMode}
      />

      <HistorySection
        watchedMovies={watchedMovies}
        profiles={profiles}
        calculateAverageRating={calculateAverageRating}
        viewMode={viewMode}
      />

      {/* Back to top button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-4 py-3 bg-theme-primary text-theme-base rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform"
          >
            <ChevronUp size={14} />
            Top
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
