import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData, Movie } from '../contexts/DataContext';
import { hapticFeedback } from '../utils/haptics';
import { UpNextSection } from './movie-list/UpNextSection';
import { HistorySection } from './movie-list/HistorySection';
import { AnimatePresence, motion } from 'motion/react';
import { LayoutGrid, List, ChevronUp, Filter, WandSparkles, Trash2, CircleCheck, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'fmn_view_mode';
const FILTERS_STORAGE_KEY = 'fmn_movie_filters';

type SortMode = 'recent' | 'title' | 'rating';

const SORT_MODES: SortMode[] = ['recent', 'title', 'rating'];

const getStoredFilters = (): { pickerFilter: string; genreFilter: string; sortMode: SortMode } => {
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return { pickerFilter: 'all', genreFilter: 'all', sortMode: 'recent' };
    const parsed = JSON.parse(raw) as { pickerFilter?: string; genreFilter?: string; sortMode?: string };
    const sortMode = SORT_MODES.includes(parsed.sortMode as SortMode) ? (parsed.sortMode as SortMode) : 'recent';
    return {
      pickerFilter: parsed.pickerFilter || 'all',
      genreFilter: parsed.genreFilter || 'all',
      sortMode,
    };
  } catch {
    return { pickerFilter: 'all', genreFilter: 'all', sortMode: 'recent' };
  }
};

export function MovieList() {
  const { movies, profiles, markWatched, removeMovie } = useData();

  const initialFilters = getStoredFilters();

  const [randomMovie, setRandomMovie] = useState<Movie | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try { return (localStorage.getItem(STORAGE_KEY) as 'grid' | 'list') || 'grid'; } catch { return 'grid'; }
  });
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pickerFilter, setPickerFilter] = useState(initialFilters.pickerFilter);
  const [genreFilter, setGenreFilter] = useState(initialFilters.genreFilter);
  const [sortMode, setSortMode] = useState<SortMode>(initialFilters.sortMode);
  const mobileFilterPanelRef = useRef<HTMLDivElement | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

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

  const pickerIds = useMemo(() => new Set(profiles.map(profile => profile.id)), [profiles]);

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

  // Feature #2: weighted smart picker
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

  useEffect(() => {
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({ pickerFilter, genreFilter, sortMode }));
    } catch {
      // ignore persisting preference failures
    }
  }, [pickerFilter, genreFilter, sortMode]);

  useEffect(() => {
    if (pickerFilter !== 'all' && !pickerIds.has(pickerFilter)) {
      setPickerFilter('all');
    }
    if (genreFilter !== 'all' && !uniqueGenres.includes(genreFilter)) {
      setGenreFilter('all');
    }
  }, [pickerFilter, genreFilter, pickerIds, uniqueGenres]);

  useEffect(() => {
    if (!showFilters) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowFilters(false);
    };

    const closeOnOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (!mobileFilterPanelRef.current) return;
      const target = event.target as Node | null;
      if (target && !mobileFilterPanelRef.current.contains(target)) {
        setShowFilters(false);
      }
    };

    window.addEventListener('keydown', closeOnEscape);
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('touchstart', closeOnOutsideClick);

    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('touchstart', closeOnOutsideClick);
    };
  }, [showFilters]);

  const resetFilters = () => {
    hapticFeedback.light();
    setPickerFilter('all');
    setGenreFilter('all');
    setSortMode('recent');
  };

  const activeFilterCount = Number(pickerFilter !== 'all') + Number(genreFilter !== 'all') + Number(sortMode !== 'recent');
  const selectedPickerName = pickerFilter === 'all' ? 'All Pickers' : profiles.find(profile => profile.id === pickerFilter)?.name || 'Unknown Picker';
  const selectedGenreLabel = genreFilter === 'all' ? 'All Genres' : genreFilter;
  const selectedSortLabel = sortMode === 'recent' ? 'Recent' : sortMode === 'title' ? 'Title' : 'Rating';

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
      <div className="relative rounded-2xl border border-theme-border bg-theme-surface/80 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <span className="rounded-full border border-theme-border bg-theme-base px-2.5 py-1 text-theme-muted">Wishlist {filteredWishlist.length}</span>
            <span className="rounded-full border border-theme-border bg-theme-base px-2.5 py-1 text-theme-muted">Watched {filteredWatched.length}</span>
            {activeFilterCount > 0 && (
              <span className="rounded-full border border-theme-primary/40 bg-theme-primary/15 px-2.5 py-1 text-theme-primary">
                {activeFilterCount} active
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowFilters(prev => !prev)}
              aria-expanded={showFilters}
              aria-controls="movie-filters-panel"
              aria-label={showFilters ? "Hide filters" : "Show filters"}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition ${showFilters ? 'border-theme-primary text-theme-primary bg-theme-primary/10' : 'border-theme-border text-theme-muted hover:text-theme-primary'}`}
            >
              <SlidersHorizontal size={12} />
              Filters
            </button>

            <div className="flex items-center gap-1 rounded-lg border border-theme-border bg-theme-base p-1">
              <button onClick={() => changeViewMode('grid')} aria-label="Grid view" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-theme-primary text-theme-base shadow-sm' : 'text-theme-muted hover:text-theme-primary'}`}>
                <LayoutGrid size={13} /><span>Grid</span>
              </button>
              <button onClick={() => changeViewMode('list')} aria-label="List view" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-theme-primary text-theme-base shadow-sm' : 'text-theme-muted hover:text-theme-primary'}`}>
                <List size={13} /><span>List</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-theme-muted">
          <span className="inline-flex items-center gap-1 rounded-lg border border-theme-border bg-theme-base px-2 py-1"><Filter size={11} /> {selectedPickerName}</span>
          <span className="rounded-lg border border-theme-border bg-theme-base px-2 py-1">{selectedGenreLabel}</span>
          <span className="rounded-lg border border-theme-border bg-theme-base px-2 py-1">Sort {selectedSortLabel}</span>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              id="movie-filters-panel"
              ref={mobileFilterPanelRef}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-3 rounded-xl border border-theme-border bg-theme-base p-3"
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <label className="flex flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-theme-muted">
                  Picker
                  <select value={pickerFilter} onChange={(e) => setPickerFilter(e.target.value)} className="bg-theme-surface border border-theme-border rounded-lg px-2 py-2 text-xs font-black text-theme-text">
                    <option value="all">All Pickers</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-theme-muted">
                  Genre
                  <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className="bg-theme-surface border border-theme-border rounded-lg px-2 py-2 text-xs font-black text-theme-text">
                    <option value="all">All Genres</option>
                    {uniqueGenres.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-theme-muted">
                  Sort
                  <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} className="bg-theme-surface border border-theme-border rounded-lg px-2 py-2 text-xs font-black text-theme-text">
                    <option value="recent">Recent</option>
                    <option value="title">Title</option>
                    <option value="rating">Rating</option>
                  </select>
                </label>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  onClick={resetFilters}
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-theme-muted hover:text-theme-primary"
                >
                  <RotateCcw size={12} /> Reset
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-theme-primary px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-theme-base"
                >
                  Done
                </button>
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
