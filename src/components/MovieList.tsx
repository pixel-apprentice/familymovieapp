import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { hapticFeedback } from '../utils/haptics';
import { UpNextSection } from './movie-list/UpNextSection';
import { HistorySection } from './movie-list/HistorySection';
import { AnimatePresence, motion } from 'motion/react';
import { LayoutGrid, List, ChevronUp } from 'lucide-react';
import { FilterBar } from './movie-list/FilterBar';
import { useMovieFilters } from '../hooks/useMovieFilters';

export function MovieList() {
  const { profiles } = useData();
  const {
    viewMode, setViewMode,
    pickerFilter, setPickerFilter, togglePicker,
    filteredWishlist, filteredWatched,
    pickRandom, randomMovie, setRandomMovie,
    isCouchMode
  } = useMovieFilters();

  const [showBackToTop, setShowBackToTop] = useState(false);
  const mobileFilterPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop((window.scrollY ?? 0) > 500);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    hapticFeedback.light();
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-[2000px] mx-auto px-4 sm:px-8 py-4">
      {/* Unified Filter Bar Row */}
      {!isCouchMode && (
        <FilterBar 
          profiles={profiles} 
          pickerFilter={pickerFilter} 
          togglePicker={togglePicker} 
          viewMode={viewMode} 
          setViewMode={setViewMode} 
        />
      )}

      <UpNextSection
        wishlistMovies={filteredWishlist}
        pickRandom={pickRandom}
        randomMovie={randomMovie}
        setRandomMovie={setRandomMovie}
        viewMode={viewMode}
      />
      <HistorySection
        watchedMovies={filteredWatched}
        profiles={profiles}
        viewMode={viewMode}
      />

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            key="back-to-top"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.25 }}
            onClick={scrollToTop}
            aria-label="Back to top"
            style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999 }}
            className="flex items-center gap-2 px-4 py-3 bg-theme-primary text-theme-base rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 touch-manipulation"
          >
            <ChevronUp size={14} /><span>Top</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
