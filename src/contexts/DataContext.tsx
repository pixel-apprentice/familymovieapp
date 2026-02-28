import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, isFirebaseInitialized } from '../services/firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, writeBatch, getDoc } from 'firebase/firestore';
import { seedData } from '../utils/seedData';

export type FamilyMember = 'Jack' | 'Simone' | 'Mom' | 'Dad';
export const TURN_ORDER: FamilyMember[] = ['Jack', 'Simone', 'Mom', 'Dad'];

export const FAMILY_COLORS: Record<FamilyMember, string> = {
  Jack: '#60a5fa', // Blue
  Simone: '#f472b6', // Pink
  Mom: '#34d399', // Emerald
  Dad: '#fbbf24'  // Amber
};

export interface Movie {
  id: string;
  title: string;
  poster_url?: string;
  status: 'wishlist' | 'watched';
  pickedBy: FamilyMember | 'Lauren' | 'Family' | 'Not specified';
  date?: string;
  genres?: string[];
  ratings: {
    Jack: number;
    Simone: number;
    Mom: number;
    Dad: number;
  };
}

interface DataContextType {
  movies: Movie[];
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
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isLocalMode, setIsLocalMode] = useState(!isFirebaseInitialized);

  useEffect(() => {
    if (!isFirebaseInitialized) {
      // Local fallback mode
      console.log("Running in local fallback mode");
      const localMovies = localStorage.getItem('localMovies');
      const localTurn = localStorage.getItem('localTurn');
      
      if (localMovies) {
        setMovies(JSON.parse(localMovies));
      } else {
        // Seed local data
        const seededMovies = seedData.map((m, i) => ({
          id: `local-${i}`,
          title: m.title,
          status: 'watched' as const,
          pickedBy: m.picker === 'Lauren' ? 'Mom' : m.picker as any,
          date: m.date,
          ratings: { Jack: 0, Simone: 0, Mom: 0, Dad: 0 }
        }));
        setMovies(seededMovies);
        localStorage.setItem('localMovies', JSON.stringify(seededMovies));
      }
      
      if (localTurn) {
        setCurrentTurnIndex(parseInt(localTurn, 10));
      }
      return;
    }

    // Firebase mode
    const unsubscribeMovies = onSnapshot(collection(db, 'movies'), (snapshot) => {
      const moviesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movie));
      setMovies(moviesData);
    });

    const unsubscribeConfig = onSnapshot(doc(db, 'metadata', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.currentTurnIndex !== undefined) {
          setCurrentTurnIndex(data.currentTurnIndex);
        }
      }
    });

    return () => {
      unsubscribeMovies();
      unsubscribeConfig();
    };
  }, []);

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
    const nextTurn = (currentTurnIndex + 1) % 4;
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
    const nextTurn = (currentTurnIndex + 1) % 4;
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
    if (isLocalMode) {
      localStorage.removeItem('localMovies');
      localStorage.removeItem('localTurn');
      window.location.reload();
    } else {
      const { getDocs, deleteDoc } = await import('firebase/firestore');
      const moviesSnap = await getDocs(collection(db, 'movies'));
      const batch = writeBatch(db);
      moviesSnap.docs.forEach(d => batch.delete(d.ref));
      batch.set(doc(db, 'metadata', 'config'), { isSeeded: false, currentTurnIndex: 0 }, { merge: true });
      await batch.commit();
      window.location.reload();
    }
  };

  const value = React.useMemo(() => ({
    movies,
    currentTurnIndex,
    isLocalMode,
    addMovie,
    updateMovie,
    removeMovie,
    markWatched,
    skipTurn,
    setTurn,
    resetDatabase
  }), [movies, currentTurnIndex, isLocalMode]);

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
