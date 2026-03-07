import React, { useState, useMemo, useEffect } from 'react';
import { useData, Movie } from '../contexts/DataContext';
import { hapticFeedback } from '../utils/haptics';
import { UpNextSection } from './movie-list/UpNextSection';
import { HistorySection } from './movie-list/HistorySection';
import { AnimatePresence, motion } from 'motion/react';
import { LayoutGrid, List, ChevronUp, Filter, WandSparkles, Trash2, CircleCheck, X } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'fmn_view_mode';

type SortMode = 'recent' | 'title' | 'rating';

export function MovieList() {
  const { movies, profiles, markWatched, removeMovie } = useData();
  const [randomMovie, setRandomMovie] = useState<Movie | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try { return (localStorage.getItem(STORAGE_KEY) as 'grid' | 'list') || 'grid'; } catch { return 'grid'; }
  });
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [pickerFilter, setPickerFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const wishlistMovies = useMemo(() => movies.filter(m => m.status === 'wishlist'), [movies]);
  const watchedMoviesRaw = useMemo(() => movies.filter(m => m.status === 'watched'), [movies]);

  const calculateAverageRating = (ratings: Movie['ratings']) => {
    const values = Object.values(ratings).filter((r): r is number => typeof r === 'number' && r > 0);
    if (values.length === 0) return 0;
    return parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
  };

  const uniqueGenres = useMemo(() => {
    const set = new Set<string>();
    movies.forEach(m => (m.genres || []).forEach(g => set.add(g)));
    return Array.from(set).sort();
  }, [movies]);

  const filteredWishlist = useMemo(() => {
    let list = [...wishlistMovies];
    if (pickerFilter !== 'all') list = list.filter(m => m.pickedBy === pickerFilter);
    if (genreFilter !== 'all') list = list.filter(m => (m.genres || []).includes(genreFilter));
    if (sortMode === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
    if (sortMode === 'rating') list.sort((a, b) => calculateAverageRating(b.ratings) - calculateAverageRating(a.ratings));
    if (sortMode === 'recent') list.sort((a, b) => Number(b.id) - Number(a.id));
    return list;
  }, [wishlistMovies, pickerFilter, genreFilter, sortMode]);

  const filteredWatched = useMemo(() => {
    let list = [...watchedMoviesRaw];
    if (pickerFilter !== 'all') list = list.filter(m => m.pickedBy === pickerFilter);
    if (genreFilter !== 'all') list = list.filter(m => (m.genres || []).includes(genreFilter));
    if (sortMode === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
    if (sortMode === 'rating') list.sort((a, b) => calculateAverageRating(b.ratings) - calculateAverageRating(a.ratings));
    if (sortMode === 'recent') list.sort((a, b) => {
      const aDate = a.date === 'Unknown' ? null : a.date;
      const bDate = b.date === 'Unknown' ? null : b.date;
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
    return list;
  }, [watchedMoviesRaw, pickerFilter, genreFilter, sortMode]);

  const hasActiveFilters = pickerFilter !== 'all' || genreFilter !== 'all' || sortMode !== 'recent';

  const clearFilters = () => {
    setPickerFilter('all');
    setGenreFilter('all');
    setSortMode('recent');
  };

  const pickRandom = () => {
    if (filteredWishlist.length === 0) return;
    hapticFeedback.medium();

    const watchedByPicker: Record<string, number> = {};
    watchedMoviesRaw.forEach(m => {
      watchedByPicker[m.pickedBy] = (watchedByPicker[m.pickedBy] || 0) + 1;
    });

    const watchedGenres = new Set(watchedMoviesRaw.flatMap(m => m.genres || []));

    const weightedPool = filteredWishlist.flatMap(movie => {
      const pickerWeight = Math.max(1, 6 - (watchedByPicker[movie.pickedBy] || 0));
      const noveltyWeight = (movie.genres || []).some(g => !watchedGenres.has(g)) ? 4 : 1;
      const totalWeight = Math.min(12, pickerWeight + noveltyWeight);
      return Array.from({ length: totalWeight }, () => movie);
    });

    const picked = weightedPool[Math.floor(Math.random() * weightedPool.length)] || filteredWishlist[0];
    setRandomMovie(picked);
    setTimeout(() => setRandomMovie(null), 5000);
  };

  const changeViewMode = (mode: 'grid' | 'list') => {
    hapticFeedback.light();
    setViewMode(mode);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* ignore */ }
  };

  const runBulkMarkWatched = async () => {
    if (filteredWishlist.length === 0) return;
    setBulkBusy(true);
    try {
      for (const movie of filteredWishlist) {
        await markWatched(movie.id);
      }
      toast.success(`Marked ${filteredWishlist.length} movie(s) watched.`);
    } finally {
      setBulkBusy(false);
    }
  };

  const runBulkRemove = async () => {
    if (filteredWishlist.length === 0) return;
    setBulkBusy(true);
    try {
      for (const movie of filteredWishlist) {
        await removeMovie(movie.id);
      }
      toast.success(`Removed ${filteredWishlist.length} filtered wishlist movie(s).`);
    } finally {
      setBulkBusy(false);
    }
  };

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
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2">
      <div className="flex items-center justify-between gap-2 relative">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${showFilters || hasActiveFilters
              ? 'border-theme-primary text-theme-primary bg-theme-primary/10'
              : 'border-theme-border text-theme-muted hover:text-theme-primary hover:border-theme-primary/50'
              }`}
          >
            <Filter size={12} />
            Filters
            {hasActiveFilters && <span className="px-1.5 py-0.5 rounded bg-theme-primary text-theme-base text-[9px]">ON</span>}
          </button>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-theme-muted hover:text-theme-primary border border-theme-border">
              <X size={11} /> Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-theme-surface border border-theme-border rounded-xl p-1 justify-end">
          <button onClick={() => changeViewMode('grid')} aria-label="Grid view" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-theme-primary text-theme-base shadow-sm' : 'text-theme-muted hover:text-theme-primary'}`}>
            <LayoutGrid size={13} /><span>Grid</span>
          </button>
          <button onClick={() => changeViewMode('list')} aria-label="List view" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-theme-primary text-theme-base shadow-sm' : 'text-theme-muted hover:text-theme-primary'}`}>
            <List size={13} /><span>List</span>
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className="absolute top-12 left-0 z-30 w-full md:w-auto bg-theme-surface border border-theme-border rounded-xl p-2 shadow-2xl"
            >
              <div className="flex flex-wrap items-center gap-2">
                <select value={pickerFilter} onChange={(e) => setPickerFilter(e.target.value)} className="bg-theme-base border border-theme-border rounded-lg px-2 py-1 text-xs font-black text-theme-text">
                  <option value="all">All Pickers</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className="bg-theme-base border border-theme-border rounded-lg px-2 py-1 text-xs font-black text-theme-text">
                  <option value="all">All Genres</option>
                  {uniqueGenres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} className="bg-theme-base border border-theme-border rounded-lg px-2 py-1 text-xs font-black text-theme-text">
                  <option value="recent">Sort: Recent</option>
                  <option value="title">Sort: Title</option>
                  <option value="rating">Sort: Rating</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={pickRandom} disabled={filteredWishlist.length === 0} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-theme-primary text-theme-base disabled:opacity-40">
          <WandSparkles size={12} /> Smart Pick
        </button>
        <button onClick={runBulkMarkWatched} disabled={bulkBusy || filteredWishlist.length === 0} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 disabled:opacity-40">
          <CircleCheck size={12} /> Mark Filtered Watched
        </button>
        <button onClick={runBulkRemove} disabled={bulkBusy || filteredWishlist.length === 0} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 disabled:opacity-40">
          <Trash2 size={12} /> Remove Filtered
        </button>
      </div>

      <UpNextSection wishlistMovies={filteredWishlist} pickRandom={pickRandom} randomMovie={randomMovie} setRandomMovie={setRandomMovie} viewMode={viewMode} />
      <HistorySection watchedMovies={filteredWatched} profiles={profiles} calculateAverageRating={calculateAverageRating} viewMode={viewMode} />

      <AnimatePresence>
        {showBackToTop && (
          <motion.button key="back-to-top" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.25 }} onClick={scrollToTop} aria-label="Back to top" style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999 }} className="flex items-center gap-2 px-4 py-3 bg-theme-primary text-theme-base rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 touch-manipulation">
            <ChevronUp size={14} /><span>Top</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
