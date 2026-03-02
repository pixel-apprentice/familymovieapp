import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, isFirebaseInitialized } from '../services/firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, writeBatch, getDoc } from 'firebase/firestore';
import { seedData } from '../utils/seedData';
import { useAuth } from './AuthContext';
import { useModal } from './ModalContext';

export interface FamilyProfile {
  id: string;
  name: string;
  color: string;
}

export const DEFAULT_PROFILES: FamilyProfile[] = [
  { id: 'Jack', name: 'Jack', color: '#60a5fa' },
  { id: 'Simone', name: 'Simone', color: '#f472b6' },
  { id: 'Mom', name: 'Mom', color: '#34d399' },
  { id: 'Dad', name: 'Dad', color: '#fbbf24' }
];

export interface Movie {
  id: string;
  title: string;
  poster_url?: string;
  summary?: string;
  status: 'wishlist' | 'watched';
  pickedBy: string;
  date?: string;
  genres?: string[];
  ratings: Record<string, number>;
}

interface DataContextType {
  movies: Movie[];
  profiles: FamilyProfile[];
  currentTurnIndex: number;
  isLocalMode: boolean;
  addMovie: (movie: Omit<Movie, 'id'>) => Promise<void>;
  updateMovie: (id: string, updates: Partial<Movie>) => Promise<void>;
  removeMovie: (id: string) => Promise<void>;
  markWatched: (id: string) => Promise<void>;
  skipTurn: () => Promise<void>;
  setTurn: (index: number) => Promise<void>;
  resetDatabase: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { showModal } = useModal();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [profiles, setProfiles] = useState<FamilyProfile[]>(DEFAULT_PROFILES);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isLocalMode, setIsLocalMode] = useState(() => {
    const forced = localStorage.getItem('forceLocal') === 'true';
    return forced || !isFirebaseInitialized;
  });

  useEffect(() => {
    if (isLocalMode) {
      // Local fallback mode
      console.log("Running in local mode");
      const localMovies = localStorage.getItem('localMovies');
      const localTurn = localStorage.getItem('localTurn');
      
      if (localMovies) {
        setMovies(JSON.parse(localMovies));
      } else {
        // Seed local data
        const seededMovies = seedData.map((m, i) => {
          let picker = m.picker;
          if (picker.includes('Family')) picker = 'Family';
          if (picker === 'Lauren' || picker === 'Mom') picker = 'Mom';
          
          return {
            id: `local-${i}`,
            title: m.title,
            status: 'watched' as const,
            pickedBy: picker,
            date: m.date,
            ratings: {}
          };
        });
        setMovies(seededMovies);
        localStorage.setItem('localMovies', JSON.stringify(seededMovies));
      }
      
      if (localTurn) {
        setCurrentTurnIndex(parseInt(localTurn, 10));
      }
      return;
    }

    // Firebase mode - wait for auth
    if (authLoading) return;
    if (!user) {
      console.warn("Firebase initialized but user not authenticated. Waiting...");
      return;
    }

    const unsubscribeMovies = onSnapshot(collection(db, 'movies'), (snapshot) => {
      const moviesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movie));
      setMovies(moviesData);
    }, (error: any) => {
      console.error("Error fetching movies:", error);
      if (error.code === 'permission-denied') {
        setIsLocalMode(true);
      }
    });

    const unsubscribeConfig = onSnapshot(doc(db, 'metadata', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.currentTurnIndex !== undefined) {
          setCurrentTurnIndex(data.currentTurnIndex);
        }
        if (data.profiles && Array.isArray(data.profiles)) {
          setProfiles(data.profiles);
        }
      }
    }, (error: any) => {
      console.error("Error fetching config:", error);
      if (error.code === 'permission-denied') {
        setIsLocalMode(true);
      }
    });

    return () => {
      unsubscribeMovies();
      unsubscribeConfig();
    };
  }, [isLocalMode, user, authLoading]);

  const saveLocalMovies = (newMovies: Movie[]) => {
    setMovies(newMovies);
    localStorage.setItem('localMovies', JSON.stringify(newMovies));
  };

  const saveLocalTurn = (newTurn: number) => {
    setCurrentTurnIndex(newTurn);
    localStorage.setItem('localTurn', newTurn.toString());
  };

  const addMovie = async (movie: Omit<Movie, 'id'>) => {
    if (isLocalMode) {
      const newMovie = { ...movie, id: `local-${Date.now()}` };
      saveLocalMovies([...movies, newMovie]);
    } else {
      const newDocRef = doc(collection(db, 'movies'));
      await setDoc(newDocRef, movie);
    }
  };

  const updateMovie = async (id: string, updates: Partial<Movie>) => {
    if (isLocalMode) {
      const newMovies = movies.map(m => m.id === id ? { ...m, ...updates } : m);
      saveLocalMovies(newMovies);
    } else {
      await updateDoc(doc(db, 'movies', id), updates);
    }
  };

  const removeMovie = async (id: string) => {
    if (isLocalMode) {
      const newMovies = movies.filter(m => m.id !== id);
      saveLocalMovies(newMovies);
    } else {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'movies', id));
    }
  };

  const markWatched = async (id: string) => {
    const nextTurn = (currentTurnIndex + 1) % profiles.length;
    const today = new Date().toISOString().split('T')[0];
    
    if (isLocalMode) {
      const newMovies = movies.map(m => m.id === id ? { ...m, status: 'watched', date: today } : m);
      saveLocalMovies(newMovies as Movie[]);
      saveLocalTurn(nextTurn);
    } else {
      const batch = writeBatch(db);
      batch.update(doc(db, 'movies', id), { status: 'watched', date: today });
      batch.set(doc(db, 'metadata', 'config'), { currentTurnIndex: nextTurn }, { merge: true });
      await batch.commit();
    }
  };

  const skipTurn = async () => {
    const nextTurn = (currentTurnIndex + 1) % profiles.length;
    if (isLocalMode) {
      saveLocalTurn(nextTurn);
    } else {
      await setDoc(doc(db, 'metadata', 'config'), { currentTurnIndex: nextTurn }, { merge: true });
    }
  };

  const setTurn = async (index: number) => {
    if (isLocalMode) {
      saveLocalTurn(index);
    } else {
      await setDoc(doc(db, 'metadata', 'config'), { currentTurnIndex: index }, { merge: true });
    }
  };

  const resetDatabase = async () => {
    try {
      if (isLocalMode) {
        localStorage.removeItem('localMovies');
        localStorage.removeItem('localTurn');
        window.location.reload();
      } else {
        const { getDocs, deleteDoc, collection, doc, writeBatch } = await import('firebase/firestore');
        const moviesSnap = await getDocs(collection(db, 'movies'));
        const batch = writeBatch(db);
        moviesSnap.docs.forEach(d => batch.delete(d.ref));
        batch.set(doc(db, 'metadata', 'config'), { isSeeded: false, currentTurnIndex: 0 }, { merge: true });
        await batch.commit();
        window.location.reload();
      }
    } catch (error) {
      console.error("Reset failed:", error);
      await showModal({
        type: 'alert',
        title: 'Reset Failed',
        message: "Reset failed. If you're using Firebase, check your API keys and permissions. Error: " + (error as Error).message,
        confirmText: 'OK'
      });
    }
  };

  const value = React.useMemo(() => ({
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
    resetDatabase
  }), [movies, profiles, currentTurnIndex, isLocalMode]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
