import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Movie, FamilyProfile, DEFAULT_PROFILES } from './DataContext';
import { useAuth } from './AuthContext';
import { searchMovies, getMovieDetails, pickBestMovieMatch, GENRE_MAP } from '../services/tmdb';

export function useFirebaseData() {
  const { user, loading: authLoading } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [profiles, setProfiles] = useState<FamilyProfile[]>(DEFAULT_PROFILES);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'local-only'>('syncing');

  useEffect(() => {
    // Don't do anything while Firebase Auth is still initializing
    if (authLoading) return;

    if (!user) {
      setIsLocalMode(true);
      setSyncStatus('local-only');
      const localMovies = localStorage.getItem('localMovies');
      if (localMovies) setMovies(JSON.parse(localMovies));
      const localTurn = localStorage.getItem('localTurn');
      if (localTurn) setCurrentTurnIndex(Number(localTurn));
      return;
    }

    setIsLocalMode(false);
    setSyncStatus(navigator.onLine ? 'synced' : 'offline');

    const unsubscribeMovies = onSnapshot(collection(db, 'movies'), (snapshot) => {
      const moviesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movie));
      setMovies(moviesData);
      setSyncStatus(navigator.onLine ? 'synced' : 'offline');
    });

    const unsubscribeConfig = onSnapshot(doc(db, 'metadata', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.currentTurnIndex !== undefined) setCurrentTurnIndex(data.currentTurnIndex);
        if (data.profiles) setProfiles(data.profiles);
      }
    });

    return () => {
      unsubscribeMovies();
      unsubscribeConfig();
    };
  }, [user, authLoading]);


  useEffect(() => {
    const onOnline = () => {
      if (isLocalMode) return;
      setSyncStatus('synced');
    };
    const onOffline = () => {
      setSyncStatus(isLocalMode ? 'local-only' : 'offline');
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [isLocalMode]);

  const saveLocalMovies = (newMovies: Movie[]) => {
    setMovies(newMovies);
    localStorage.setItem('localMovies', JSON.stringify(newMovies));
  };

  const addMovie = async (movie: Omit<Movie, 'id'> & { id?: string }) => {
    if (isLocalMode) {
      const newMovie = { ...movie, id: movie.id || Date.now().toString() } as Movie;
      saveLocalMovies([...movies, newMovie]);
      return;
    }
    // Strip undefined/null values — Firestore setDoc rejects undefined
    const sanitized = Object.fromEntries(
      Object.entries(movie).filter(([_, v]) => v !== undefined && v !== null)
    );
    const docRef = movie.id ? doc(db, 'movies', movie.id) : doc(collection(db, 'movies'));
    setSyncStatus('syncing');
    await setDoc(docRef, sanitized);
  };

  const updateMovie = async (id: string, updates: Partial<Movie>) => {
    if (isLocalMode) {
      saveLocalMovies(movies.map(m => m.id === id ? { ...m, ...updates } : m));
      return;
    }
    // Strip undefined values — Firestore rejects them
    const sanitized = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    setSyncStatus('syncing');
    await updateDoc(doc(db, 'movies', id), sanitized);
  };

  const removeMovie = async (id: string) => {
    if (isLocalMode) {
      saveLocalMovies(movies.filter(m => m.id !== id));
      return;
    }
    setSyncStatus('syncing');
    await deleteDoc(doc(db, 'movies', id));
  };

  const markWatched = async (id: string) => {
    const updates = { status: 'watched' as const, date: new Date().toISOString().split('T')[0] };
    if (isLocalMode) {
      saveLocalMovies(movies.map(m => m.id === id ? { ...m, ...updates } : m));
      return;
    }
    setSyncStatus('syncing');
    await updateDoc(doc(db, 'movies', id), updates);
  };

  const skipTurn = async () => {
    const nextTurn = (currentTurnIndex + 1) % profiles.length;
    if (isLocalMode) {
      setCurrentTurnIndex(nextTurn);
      localStorage.setItem('localTurn', nextTurn.toString());
      return;
    }
    setSyncStatus('syncing');
    await setDoc(doc(db, 'metadata', 'config'), { currentTurnIndex: nextTurn }, { merge: true });
  };

  const setTurn = async (index: number) => {
    if (isLocalMode) {
      setCurrentTurnIndex(index);
      localStorage.setItem('localTurn', index.toString());
      return;
    }
    setSyncStatus('syncing');
    await setDoc(doc(db, 'metadata', 'config'), { currentTurnIndex: index }, { merge: true });
  };

  const updateProfiles = async (newProfiles: FamilyProfile[]) => {
    if (isLocalMode) {
      setProfiles(newProfiles);
      return;
    }
    setSyncStatus('syncing');
    await setDoc(doc(db, 'metadata', 'config'), { profiles: newProfiles }, { merge: true });
  };

  const refreshMetadata = async (forceAll = false) => {
    // Bulk-fetch TMDB posters.
    // - default: only missing/broken posters
    // - forceAll=true: refresh every movie (used by "Refresh All")
    const moviesToRefresh = forceAll
      ? movies
      : movies.filter(m =>
          !m.poster_url ||
          m.poster_url.trim() === '' ||
          (!m.poster_url.startsWith('http') && m.poster_url.length < 5) // Catch broken short strings
        );

    if (moviesToRefresh.length === 0) return;

    setSyncStatus('syncing');
    for (const movie of moviesToRefresh) {
      try {
        let best: any = null;

        // If we already know the TMDB id, trust it first (same behavior users expect from detail refresh)
        if (movie.tmdbId && /^\d+$/.test(String(movie.tmdbId))) {
          best = await getMovieDetails(Number(movie.tmdbId));
        }

        // Fallback to title search for older rows without tmdbId
        if (!best) {
          // We do NOT use movie.date as the year, because movie.date is the date *watched*.
          // We also pass allowRatedR=true so we can fetch posters for any movie already in the DB.
          const results = await searchMovies(movie.title, undefined, true);
          best = pickBestMovieMatch(movie.title, results);
        }

        if (!best) {
          console.warn(`No TMDB match found for ${movie.title}`);
          continue;
        }

        const fullPosterUrl = best.poster_path
          ? `https://image.tmdb.org/t/p/w500${best.poster_path}`
          : '';

        const sanitized = Object.fromEntries(
          Object.entries({
            poster_url: fullPosterUrl,
            summary: best.overview,
            genres: best.genre_ids?.map((id: number) => GENRE_MAP[id]).filter(Boolean),
            tmdbId: String(best.id),
          }).filter(([_, v]) => v !== undefined && v !== null)
        );
        await updateDoc(doc(db, 'movies', movie.id), sanitized);
      } catch (e) {
        console.warn(`Failed to refresh metadata for ${movie.title}:`, e);
      }
    }
  };

  return {
    movies,
    profiles,
    currentTurnIndex,
    isLocalMode,
    syncStatus,
    addMovie,
    updateMovie,
    removeMovie,
    markWatched,
    skipTurn,
    setTurn,
    updateProfiles,
    refreshMetadata
  };
}
