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

  const [randomMovie, setRandomMovie] = useState<Movie | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try { return (localStorage.getItem(STORAGE_KEY) as 'grid' | 'list') || 'grid'; } catch { return 'grid'; }
  });
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pickerFilter, setPickerFilter] = useState(() => getStoredFilters().pickerFilter);
  const [genreFilter, setGenreFilter] = useState(() => getStoredFilters().genreFilter);
  const [sortMode, setSortMode] = useState<SortMode>(() => getStoredFilters().sortMode);
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

  const scrollToTop = () => {
    hapticFeedback.light();
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  };

  const togglePicker = (pickerId: string) => {
    hapticFeedback.light();
    setPickerFilter(prev => {
      if (pickerId === 'all') return 'all';
      if (prev === 'all') return pickerId;
      return prev === pickerId ? 'all' : pickerId;
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-[2000px] mx-auto px-4 sm:px-8 py-4">
      {/* High-End Filter Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-theme-surface/50 backdrop-blur-md border border-theme-border p-1.5 md:p-2 rounded-2xl sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0 px-1">
          <button
            onClick={() => togglePicker('all')}
            className={`flex items-center justify-center transition-all whitespace-nowrap h-9 px-3 md:h-10 md:px-4 rounded-xl text-[10px] font-black uppercase tracking-widest ${pickerFilter === 'all'
              ? 'bg-theme-primary text-theme-base shadow-lg scale-105'
              : 'bg-theme-base text-theme-muted hover:text-theme-text border border-theme-border'
              }`}
          >
            All
          </button>

          <div className="w-[1px] h-6 bg-theme-border mx-1" />

          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => togglePicker(p.id)}
              className={`relative flex items-center justify-center transition-all shrink-0 border h-9 w-9 md:h-10 md:w-auto md:px-5 rounded-full md:rounded-xl ${pickerFilter === p.id
                ? 'scale-110 shadow-lg z-10'
                : 'bg-theme-base text-theme-muted hover:text-theme-text border-theme-border'
                }`}
              style={pickerFilter === p.id ? { backgroundColor: p.color, borderColor: p.color, color: '#fff' } : {}}
              title={p.name}
            >
              {/* Desktop Text */}
              <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">{p.name}</span>
              {/* Mobile Initial */}
              <span className="md:hidden text-xs font-black uppercase">{p.name.charAt(0)}</span>

              {/* Mobile Active Dot */}
              {pickerFilter === p.id && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full md:hidden" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-theme-border pt-2 md:pt-0 md:pl-4">
          <div className="flex items-center gap-1 bg-theme-base p-1 rounded-xl border border-theme-border">
            <button onClick={() => changeViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-theme-primary text-theme-base shadow-md' : 'text-theme-muted hover:text-theme-text'}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => changeViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-theme-primary text-theme-base shadow-md' : 'text-theme-muted hover:text-theme-text'}`}>
              <List size={16} />
            </button>
          </div>

          <div className="relative group">
            <button className="p-3 bg-theme-base border border-theme-border rounded-xl text-theme-muted hover:text-theme-primary transition-all">
              <SlidersHorizontal size={16} />
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-theme-surface border border-theme-border rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2 space-y-1">
              <p className="text-[8px] font-black uppercase tracking-widest text-theme-muted p-2">Library Actions</p>
              <button onClick={resetFilters} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-theme-base rounded-xl text-[10px] font-black uppercase tracking-widest text-theme-text">
                <RotateCcw size={14} /> Reset Filters
              </button>
              <button onClick={runBulkMarkWatched} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-emerald-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-500">
                <CircleCheck size={14} /> Mark All Watched
              </button>
              <button onClick={runBulkRemove} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500">
                <Trash2 size={14} /> Delete Filtered
              </button>
            </div>
          </div>
        </div>
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
