import { useState, useMemo, useEffect, useCallback } from 'react';
import { useData, Movie } from '../contexts/DataContext';
import { hapticFeedback } from '../utils/haptics';
import { useLocation } from 'react-router-dom';
import { isCouchModeEnabled } from '../utils/isCouchMode';
import { calculateAverageRating, sortMoviesByDate } from '../constants/movies';

const STORAGE_KEY = 'fmn_view_mode';
const FILTERS_STORAGE_KEY = 'fmn_movie_filters';

type SortMode = 'recent' | 'title' | 'rating';
const SORT_MODES: SortMode[] = ['recent', 'title', 'rating'];

const getStoredFilters = (): { pickerFilter: string; genreFilter: string; sortMode: SortMode } => {
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return { pickerFilter: 'all', genreFilter: 'all', sortMode: 'recent' };
    const parsed = JSON.parse(raw);
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

export function useMovieFilters() {
  const { movies, profiles, couchState, pushCouchState } = useData();
  const location = useLocation();
  const isCouchMode = isCouchModeEnabled(location.search);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try { return (localStorage.getItem(STORAGE_KEY) as 'grid' | 'list') || 'grid'; } catch { return 'grid'; }
  });
  const [pickerFilter, setPickerFilter] = useState(() => getStoredFilters().pickerFilter);
  const [genreFilter, setGenreFilter] = useState(() => getStoredFilters().genreFilter);
  const [sortMode, setSortMode] = useState<SortMode>(() => getStoredFilters().sortMode);
  const [randomMovie, setRandomMovie] = useState<Movie | null>(null);

  const wishlistMovies = useMemo(() => movies.filter(m => m.status === 'wishlist'), [movies]);
  const watchedMoviesRaw = useMemo(() => movies.filter(m => m.status === 'watched'), [movies]);

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
    if (sortMode === 'recent') list.sort(sortMoviesByDate);
    return list;
  }, [watchedMoviesRaw, pickerFilter, genreFilter, sortMode]);

  const togglePicker = useCallback((pickerId: string) => {
    hapticFeedback.light();
    setPickerFilter(prev => {
      if (pickerId === 'all') return 'all';
      if (prev === 'all') return pickerId;
      return prev === pickerId ? 'all' : pickerId;
    });
  }, []);

  const pickRandom = useCallback(() => {
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
  }, [filteredWishlist, watchedMoviesRaw]);

  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({ pickerFilter, genreFilter, sortMode }));
  }, [pickerFilter, genreFilter, sortMode]);

  // Couch Sync
  useEffect(() => {
    if (!isCouchMode) {
      pushCouchState({ viewMode, pickerFilter, genreFilter, path: window.location.pathname });
    }
  }, [viewMode, pickerFilter, genreFilter, isCouchMode, pushCouchState]);

  useEffect(() => {
    if (isCouchMode && couchState) {
      if (couchState.viewMode) setViewMode(couchState.viewMode);
      if (couchState.pickerFilter) setPickerFilter(couchState.pickerFilter);
      if (couchState.genreFilter) setGenreFilter(couchState.genreFilter);
    }
  }, [isCouchMode, couchState]);

  return {
    viewMode, setViewMode,
    pickerFilter, setPickerFilter, togglePicker,
    genreFilter, setGenreFilter,
    sortMode, setSortMode,
    filteredWishlist, filteredWatched,
    pickRandom, randomMovie, setRandomMovie,
    isCouchMode
  };
}
