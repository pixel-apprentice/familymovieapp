import { useState, useEffect, useRef } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Movie, FamilyProfile, DEFAULT_PROFILES, CouchState, PulseEvent } from './DataContext';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from './AuthContext';
import { searchMovies, getMovieDetails, pickBestMovieMatch, GENRE_MAP } from '../services/tmdb';
import { logger } from '../utils/logger';
import { isCouchModeEnabled } from '../utils/isCouchMode';

export function useFirebaseData() {
  const { user, loading: authLoading } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [profiles, setProfiles] = useState<FamilyProfile[]>(() => {
    const saved = localStorage.getItem('fmn_profiles_cache');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILES;
  });
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(() => {
    const saved = localStorage.getItem('fmn_turn_cache');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'local-only'>('syncing');
  const [couchState, setCouchState] = useState<CouchState | null>(null);
  const [pulseEvent, setPulseEvent] = useState<PulseEvent | null>(null);
  const couchStateRef = useRef<CouchState | null>(null);

  useEffect(() => {
    // Don't do anything while Firebase Auth is still initializing
    if (authLoading) return;

    if (!user && !isCouchModeEnabled(window.location.search)) {
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
            localStorage.setItem('fmn_turn_cache', data.currentTurnIndex.toString());
          }
          if (data.profiles) {
            setProfiles(data.profiles);
            localStorage.setItem('fmn_profiles_cache', JSON.stringify(data.profiles));
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
    const sanitized = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined && v !== null)
    );
    setSyncStatus('syncing');
    // Using setDoc with merge: true is safer than updateDoc as it won't fail if the doc mission
    await setDoc(doc(db, 'movies', id), sanitized, { merge: true });
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
    await setDoc(doc(db, 'movies', id), updates, { merge: true });
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
    const moviesToRefresh = forceAll
      ? movies
      : movies.filter(m =>
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
  };

  const pushCouchState = async (updates: Partial<CouchState>) => {
    if (isLocalMode) return;
    
    const newState = {
      ...(couchStateRef.current || {}),
      ...updates,
      timestamp: Date.now()
    } as CouchState;
    
    await setDoc(doc(db, 'metadata', 'couch'), newState);
  };

  const pushPulseEvent = async (event: Omit<PulseEvent, 'timestamp'>) => {
    if (isLocalMode) return;
    const fullEvent: PulseEvent = { ...event, timestamp: Date.now() };
    await setDoc(doc(db, 'metadata', 'pulse'), fullEvent);
  };

  const clearData = () => {
    setMovies([]);
    setProfiles(DEFAULT_PROFILES);
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
    refreshMetadata,
    couchState,
    pulseEvent,
    pushCouchState,
    pushPulseEvent,
    clearData
  };
}
