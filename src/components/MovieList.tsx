import React, { useState, useMemo, useEffect } from 'react';
import { useData, Movie } from '../contexts/DataContext';
import { hapticFeedback } from '../utils/haptics';
import { UpNextSection } from './movie-list/UpNextSection';
import { HistorySection } from './movie-list/HistorySection';
import { AnimatePresence, motion } from 'motion/react';
import { LayoutGrid, List, ChevronUp, ImageOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Persist view mode across page visits
const STORAGE_KEY = 'fmn_view_mode';

export function MovieList() {
  const { movies, profiles, refreshMetadata } = useData();
  const [randomMovie, setRandomMovie] = useState<Movie | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try { return (localStorage.getItem(STORAGE_KEY) as 'grid' | 'list') || 'grid'; } catch { return 'grid'; }
  });
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isRefreshingPosters, setIsRefreshingPosters] = useState(false);

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
    const values = Object.values(ratings).filter((r): r is number => typeof r === 'number' && r > 0);
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

  const changeViewMode = (mode: 'grid' | 'list') => {
    hapticFeedback.light();
    setViewMode(mode);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* ignore */ }
  };

  // Back to top — cross-platform (iOS Safari uses document.documentElement.scrollTop)
  useEffect(() => {
    const getScrollY = () =>
      window.scrollY ?? document.documentElement.scrollTop ?? document.body.scrollTop ?? 0;

    const handleScroll = () => {
      setShowBackToTop(getScrollY() > 500);
    };

    // Use both window and document scroll events for maximum compat
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    hapticFeedback.light();
    // Cross-platform smooth scroll — fallback for iOS Safari
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  };

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4">
      {/* View mode toggle */}
      <div className="flex justify-end">
        <div className="flex items-center gap-1 bg-theme-surface border border-theme-border rounded-xl p-1">
          <button
            onClick={() => changeViewMode('grid')}
            aria-label="Grid view"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid'
              ? 'bg-theme-primary text-theme-base shadow-sm'
              : 'text-theme-muted hover:text-theme-primary'
              }`}
          >
            <LayoutGrid size={13} />
            <span>Grid</span>
          </button>
          <button
            onClick={() => changeViewMode('list')}
            aria-label="List view"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list'
              ? 'bg-theme-primary text-theme-base shadow-sm'
              : 'text-theme-muted hover:text-theme-primary'
              }`}
          >
            <List size={13} />
            <span>List</span>
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

      {/* Back to top — fixed, cross-platform */}
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
            <ChevronUp size={14} />
            <span>Top</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
