import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, isFirebaseInitialized } from '../services/firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, writeBatch, getDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { seedData } from '../utils/seedData';
import { useAuth } from './AuthContext';
import { useModal } from './ModalContext';

import { searchMovies, GENRE_MAP } from '../services/tmdb';

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
  updateProfiles: (profiles: FamilyProfile[]) => Promise<void>;
  refreshMetadata: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { showModal } = useModal();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [profiles, setProfiles] = useState<FamilyProfile[]>(() => {
    const localProfiles = localStorage.getItem('localProfiles');
    return localProfiles ? JSON.parse(localProfiles) : DEFAULT_PROFILES;
  });
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isLocalMode, setIsLocalMode] = useState(() => {
    const forced = localStorage.getItem('forceLocal') === 'true';
    return forced || !isFirebaseInitialized;
  });

  // Metadata Enrichment Logic
  const refreshMetadata = async () => {
    const missingPosters = movies.filter(m => !m.poster_url && m.title);
    
    if (missingPosters.length === 0) {
      console.log("[Metadata] All movies have posters.");
      return;
    }

    console.log(`[Metadata] Found ${missingPosters.length} movies missing posters. Starting enrichment...`);

    // Process one by one with delay to avoid rate limits
    for (const movie of missingPosters) {
      try {
        // Extract year from date if available
        const year = movie.date ? movie.date.split('-')[0] : undefined;
        const results = await searchMovies(movie.title, year);
        
        if (results && results.length > 0) {
          // Find best match (exact title match preferred)
          const bestMatch = results.find(r => r.title.toLowerCase() === movie.title.toLowerCase()) || results[0];
          
          if (bestMatch.poster_path) {
            console.log(`[Metadata] Found poster for "${movie.title}"`);
            await updateMovie(movie.id, { 
              poster_url: bestMatch.poster_path,
              summary: bestMatch.overview,
              genres: bestMatch.genre_ids?.map(id => GENRE_MAP[id]).filter(Boolean) as string[] | undefined
            });
          }
        }
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(`[Metadata] Failed to enrich "${movie.title}":`, e);
      }
    }
  };

  // Auto-run enrichment on load/change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
        refreshMetadata();
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [movies.length, isLocalMode]);

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
      console.warn("Firebase initialized but user not authenticated. Switching to local mode.");
      setIsLocalMode(true);
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

  const saveLocalProfiles = (newProfiles: FamilyProfile[]) => {
    setProfiles(newProfiles);
    localStorage.setItem('localProfiles', JSON.stringify(newProfiles));
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

  const updateProfiles = async (newProfiles: FamilyProfile[]) => {
    if (isLocalMode) {
      saveLocalProfiles(newProfiles);
    } else {
      await setDoc(doc(db, 'metadata', 'config'), { profiles: newProfiles }, { merge: true });
    }
  };

  const resetDatabase = async () => {
    try {
      if (isLocalMode) {
        localStorage.removeItem('localMovies');
        localStorage.removeItem('localTurn');
        window.location.reload();
      } else {
        if (!user) {
          throw new Error("User not authenticated. Please wait for connection or switch to local mode.");
        }

        const moviesSnap = await getDocs(collection(db, 'movies'));
        
        // 1. Delete existing movies
        // Try batch delete first for performance
        try {
          const batchSize = 400;
          const chunks = [];
          for (let i = 0; i < moviesSnap.docs.length; i += batchSize) {
            chunks.push(moviesSnap.docs.slice(i, i + batchSize));
          }

          for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(d => batch.delete(d.ref));
            await batch.commit();
          }
        } catch (batchError) {
          console.warn("Batch delete failed, attempting individual deletes...", batchError);
          // Fallback: Delete one by one (best effort)
          const deletePromises = moviesSnap.docs.map(d => 
            deleteDoc(d.ref).catch(e => console.warn(`Failed to delete doc ${d.id}:`, e))
          );
          await Promise.all(deletePromises);
        }

        // 2. Re-seed data
        try {
          const seedBatch = writeBatch(db);
          seedData.forEach((m) => {
            let picker = m.picker;
            if (picker.includes('Family')) picker = 'Family';
            if (picker === 'Lauren' || picker === 'Mom') picker = 'Mom';

            const newDocRef = doc(collection(db, 'movies'));
            seedBatch.set(newDocRef, {
              title: m.title,
              status: 'watched',
              pickedBy: picker,
              date: m.date,
              ratings: {}
            });
          });
          await seedBatch.commit();
        } catch (seedError) {
          console.error("Seeding failed:", seedError);
          throw new Error("Failed to re-seed database. " + (seedError as Error).message);
        }

        // 3. Reset config
        try {
          const configBatch = writeBatch(db);
          configBatch.set(doc(db, 'metadata', 'config'), { isSeeded: false, currentTurnIndex: 0 }, { merge: true });
          await configBatch.commit();
        } catch (configError) {
          console.warn("Config reset failed (non-critical):", configError);
        }
        
        window.location.reload();
      }
    } catch (error) {
      console.error("Reset failed:", error);
      await showModal({
        type: 'alert',
        title: 'Reset Failed',
        message: "Reset failed. " + (error as Error).message,
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
    resetDatabase,
    updateProfiles,
    refreshMetadata
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
