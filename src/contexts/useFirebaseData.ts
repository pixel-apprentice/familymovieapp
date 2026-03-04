import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Movie, FamilyProfile, DEFAULT_PROFILES } from './DataContext';
import { useAuth } from './AuthContext';
import { searchMovies, GENRE_MAP } from '../services/tmdb';

export function useFirebaseData() {
  const { user, loading: authLoading } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [profiles, setProfiles] = useState<FamilyProfile[]>(DEFAULT_PROFILES);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
    // Don't do anything while Firebase Auth is still initializing
    if (authLoading) return;

    if (!user) {
      setIsLocalMode(true);
      const localMovies = localStorage.getItem('localMovies');
      if (localMovies) setMovies(JSON.parse(localMovies));
      const localTurn = localStorage.getItem('localTurn');
      if (localTurn) setCurrentTurnIndex(Number(localTurn));
      return;
    }

    setIsLocalMode(false);

    const unsubscribeMovies = onSnapshot(collection(db, 'movies'), (snapshot) => {
      const moviesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movie));
      setMovies(moviesData);
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
    await updateDoc(doc(db, 'movies', id), sanitized);
  };

  const removeMovie = async (id: string) => {
    if (isLocalMode) {
      saveLocalMovies(movies.filter(m => m.id !== id));
      return;
    }
    await deleteDoc(doc(db, 'movies', id));
  };

  const markWatched = async (id: string) => {
    const updates = { status: 'watched' as const, date: new Date().toISOString().split('T')[0] };
    if (isLocalMode) {
      saveLocalMovies(movies.map(m => m.id === id ? { ...m, ...updates } : m));
      return;
    }
    await updateDoc(doc(db, 'movies', id), updates);
  };

  const skipTurn = async () => {
    const nextTurn = (currentTurnIndex + 1) % profiles.length;
    if (isLocalMode) {
      setCurrentTurnIndex(nextTurn);
      localStorage.setItem('localTurn', nextTurn.toString());
      return;
    }
    await setDoc(doc(db, 'metadata', 'config'), { currentTurnIndex: nextTurn }, { merge: true });
  };

  const setTurn = async (index: number) => {
    if (isLocalMode) {
      setCurrentTurnIndex(index);
      localStorage.setItem('localTurn', index.toString());
      return;
    }
    await setDoc(doc(db, 'metadata', 'config'), { currentTurnIndex: index }, { merge: true });
  };

  const updateProfiles = async (newProfiles: FamilyProfile[]) => {
    if (isLocalMode) {
      setProfiles(newProfiles);
      return;
    }
    await setDoc(doc(db, 'metadata', 'config'), { profiles: newProfiles }, { merge: true });
  };

  const refreshMetadata = async () => {
    // Bulk-fetch TMDB posters for all movies missing them
    const moviesNeedingPosters = movies.filter(m => !m.poster_url || m.poster_url.trim() === '');
    if (moviesNeedingPosters.length === 0) return;
    for (const movie of moviesNeedingPosters) {
      try {
        let year: string | undefined;
        if (movie.date && /^\d{4}/.test(movie.date)) year = movie.date.split('-')[0];
        const results = await searchMovies(movie.title, year);
        if (results && results.length > 0) {
          const best = results[0];
          const sanitized = Object.fromEntries(
            Object.entries({
              poster_url: best.poster_path || '',
              summary: best.overview,
              genres: best.genre_ids?.map((id: number) => GENRE_MAP[id]).filter(Boolean),
              tmdbId: String(best.id),
            }).filter(([_, v]) => v !== undefined && v !== null)
          );
          await updateDoc(doc(db, 'movies', movie.id), sanitized);
        }
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
