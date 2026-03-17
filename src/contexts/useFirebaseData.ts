import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Movie, FamilyProfile, CouchState, PulseEvent } from '../types/movie';
import { DEFAULT_PROFILES, CACHE_KEYS, DEFAULTS } from '../constants/settings';
import { usePersistence } from '../hooks/usePersistence';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from './AuthContext';
import { searchMovies, getMovieDetails, pickBestMovieMatch, GENRE_MAP } from '../services/tmdb';
import { logger } from '../utils/logger';
import { isCouchModeEnabled } from '../utils/isCouchMode';

export function useFirebaseData() {
  const { user, loading: authLoading } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  
  const [profiles, setProfiles] = usePersistence<FamilyProfile[]>(
    CACHE_KEYS.PROFILES, 
    DEFAULT_PROFILES
  );
  
  const [currentTurnIndex, setCurrentTurnIndex] = usePersistence<number>(
    CACHE_KEYS.TURN_INDEX, 
    DEFAULTS.TURN_INDEX
  );

  const [localMovies, setLocalMovies, clearLocalMovies] = usePersistence<Movie[]>(
    CACHE_KEYS.LOCAL_MOVIES,
    []
  );

  const [localTurn, setLocalTurn, clearLocalTurn] = usePersistence<number>(
    CACHE_KEYS.LOCAL_TURN,
    DEFAULTS.TURN_INDEX
  );

  const [isLocalMode, setIsLocalMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'local-only'>('syncing');
  const [couchState, setCouchState] = useState<CouchState | null>(null);
  const [pulseEvent, setPulseEvent] = useState<PulseEvent | null>(null);
  const couchStateRef = useRef<CouchState | null>(null);
  const moviesRef = useRef<Movie[]>([]);

  useEffect(() => {
    moviesRef.current = movies;
  }, [movies]);

  useEffect(() => {
    // Don't do anything while Firebase Auth is still initializing
    if (authLoading) return;

    if (!user) {
      if (localMovies.length > 0) setMovies(localMovies);
      setCurrentTurnIndex(localTurn);

      if (!isCouchModeEnabled()) {
        setIsLocalMode(true);
        setSyncStatus('local-only');
        return;
      }
    }

    setIsLocalMode(false);
    setSyncStatus(navigator.onLine ? 'synced' : 'offline');

    // These listeners require a user session for standard users, 
    // but the TV receiver (Couch Mode) must be able to see them even if unauthenticated
    // assuming Firestore Security Rules allow global read for metadata/couch.
    let unsubscribeMovies = () => {};
    let unsubscribeConfig = () => {};

    if (user) {
      unsubscribeMovies = onSnapshot(collection(db, 'movies'), (snapshot) => {
        const moviesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movie));
        setMovies(moviesData);
        setSyncStatus(navigator.onLine ? 'synced' : 'offline');
      }, (error) => {
        logger.error('Firestore movies sync failed:', error);
        setSyncStatus('offline');
      });

      unsubscribeConfig = onSnapshot(doc(db, 'metadata', 'config'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.currentTurnIndex !== undefined) {
            setCurrentTurnIndex(data.currentTurnIndex);
          }
          if (data.profiles) {
            setProfiles(data.profiles);
          }
        }
      }, (error) => {
        logger.error('Firestore config sync failed:', error);
      });
    }

    // Couch and Pulse listeners are ALWAYS active in Couch Mode or for logged in users
    const unsubscribeCouch = onSnapshot(doc(db, 'metadata', 'couch'), (docSnap) => {
      if (docSnap.exists()) {
        setCouchState(docSnap.data() as CouchState);
      }
    }, (error) => {
      logger.error('Firestore couch sync failed:', error);
    });

    const unsubPulse = onSnapshot(doc(db, "metadata", "pulse"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as PulseEvent;
        // Only trigger if it's "fresh" (within last 5 seconds)
        if (Date.now() - data.timestamp < 5000) {
          setPulseEvent(data);
        }
      }
    }, (error) => {
      logger.error('Firestore pulse sync failed:', error);
    });

    return () => {
      unsubscribeMovies();
      unsubscribeConfig();
      unsubscribeCouch();
      unsubPulse();
    };
  }, [user, authLoading]);

  useEffect(() => {
    couchStateRef.current = couchState;
  }, [couchState]);


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

  const saveLocalMovies = useCallback((newMovies: Movie[]) => {
    setMovies(newMovies);
    localStorage.setItem('localMovies', JSON.stringify(newMovies));
  }, []);

  const addMovie = useCallback(async (movie: Omit<Movie, 'id'> & { id?: string }) => {
    if (isLocalMode) {
      const newMovie = { ...movie, id: movie.id || Date.now().toString() } as Movie;
      setLocalMovies(prev => [...prev, newMovie]);
      setMovies(prev => [...prev, newMovie]);
      return;
    }
    const sanitized = Object.fromEntries(
      Object.entries(movie).filter(([_, v]) => v !== undefined && v !== null)
    );
    const docRef = movie.id ? doc(db, 'movies', movie.id) : doc(collection(db, 'movies'));
    setSyncStatus('syncing');
    await setDoc(docRef, sanitized);
  }, [isLocalMode]);

  const updateMovie = useCallback(async (id: string, updates: Partial<Movie>) => {
    if (isLocalMode) {
      setLocalMovies(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
      setMovies(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
      return;
    }
    const sanitized = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined && v !== null)
    );
    setSyncStatus('syncing');
    // Using setDoc with merge: true is safer than updateDoc as it won't fail if the doc mission
    await setDoc(doc(db, 'movies', id), sanitized, { merge: true });
  }, [isLocalMode]);

  const removeMovie = useCallback(async (id: string) => {
    if (isLocalMode) {
      setLocalMovies(prev => prev.filter(m => m.id !== id));
      setMovies(prev => prev.filter(m => m.id !== id));
      return;
    }
    setSyncStatus('syncing');
    await deleteDoc(doc(db, 'movies', id));
  }, [isLocalMode]);

  const markWatched = useCallback(async (id: string) => {
    const updates = { status: 'watched' as const, date: new Date().toISOString().split('T')[0] };
    if (isLocalMode) {
      setMovies(prev => {
        const updated = prev.map(m => m.id === id ? { ...m, ...updates } : m);
        localStorage.setItem('localMovies', JSON.stringify(updated));
        return updated;
      });
      return;
    }
    setSyncStatus('syncing');
    await setDoc(doc(db, 'movies', id), updates, { merge: true });
  }, [isLocalMode]);

  const skipTurn = useCallback(async () => {
    const nextTurn = (currentTurnIndex + 1) % profiles.length;
    if (isLocalMode) {
      setLocalTurn(nextTurn);
      setCurrentTurnIndex(nextTurn);
      return;
    }
    setSyncStatus('syncing');
    await setDoc(doc(db, 'metadata', 'config'), { currentTurnIndex: nextTurn }, { merge: true });
  }, [currentTurnIndex, isLocalMode, profiles.length]);

  const setTurn = useCallback(async (index: number) => {
    if (isLocalMode) {
      setLocalTurn(index);
      setCurrentTurnIndex(index);
      return;
    }
    setSyncStatus('syncing');
    await setDoc(doc(db, 'metadata', 'config'), { currentTurnIndex: index }, { merge: true });
  }, [isLocalMode]);

  const updateProfiles = useCallback(async (newProfiles: FamilyProfile[]) => {
    if (isLocalMode) {
      setProfiles(newProfiles);
      return;
    }
    setSyncStatus('syncing');
    await setDoc(doc(db, 'metadata', 'config'), { profiles: newProfiles }, { merge: true });
  }, [isLocalMode]);

  const refreshMetadata = useCallback(async (forceAll = false) => {
    const currentMovies = moviesRef.current;
    const moviesToRefresh = forceAll
      ? currentMovies
      : currentMovies.filter(m =>
        !m.poster_url ||
        m.poster_url.trim() === '' ||
        (!m.poster_url.startsWith('http') && m.poster_url.length < 5)
      );

    if (moviesToRefresh.length === 0) return;

    setSyncStatus('syncing');
    const batch = writeBatch(db);
    let updatedCount = 0;

    for (const movie of moviesToRefresh) {
      try {
        let best: any = null;
        if (movie.tmdbId && /^\d+$/.test(String(movie.tmdbId))) {
          best = await getMovieDetails(Number(movie.tmdbId));
        }
        if (!best) {
          const results = await searchMovies(movie.title, undefined, true);
          best = pickBestMovieMatch(movie.title, results);
        }
        if (!best) continue;

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
        
        batch.update(doc(db, 'movies', movie.id), sanitized);
        updatedCount++;
      } catch (e) {
        console.warn(`Failed to package metadata for ${movie.title}:`, e);
      }
    }

    if (updatedCount > 0) {
      await batch.commit();
    }
  }, []);

  const pushCouchState = useCallback(async (updates: Partial<CouchState>) => {
    if (isLocalMode) return;
    
    const newState = {
      ...(couchStateRef.current || {}),
      ...updates,
      timestamp: Date.now()
    } as CouchState;
    
    await setDoc(doc(db, 'metadata', 'couch'), newState);
  }, [isLocalMode]);

  const pushPulseEvent = useCallback(async (event: Omit<PulseEvent, 'timestamp'>) => {
    if (isLocalMode) return;
    
    // Sanitize event to prevent Firebase undefined errors
    const sanitizedEvent = {
        ...event,
        userName: event.userName || '',
        movieTitle: event.movieTitle || 'Unknown Movie',
        timestamp: Date.now()
    };

    if (!event.movieTitle || !event.userName) {
        logger.warn(`[Firebase] Pulse event missing details (User: ${event.userName}, Movie: ${event.movieTitle})`, event);
    }

    try {
        await setDoc(doc(db, 'metadata', 'pulse'), sanitizedEvent);
    } catch (err) {
        logger.error('[Firebase] Failed to push pulse event', err);
        throw err;
    }
  }, [isLocalMode]);

  const clearData = useCallback(() => {
    setMovies([]);
    setProfiles(DEFAULT_PROFILES);
  }, []);

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
    refreshMetadata,
    couchState,
    pulseEvent,
    pushCouchState,
    pushPulseEvent,
    clearData
  };
}
