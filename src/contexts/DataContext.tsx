import React, { createContext, useContext } from 'react';
import { db } from '../services/firebase';
import { collection, doc, setDoc, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import { seedData } from '../utils/seedData';
import { useAuth } from './AuthContext';
import { useModal } from './ModalContext';
import { useFirebaseData } from './useFirebaseData';

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
  tmdbId?: string;
  title: string;
  poster_url?: string;
  trailerKey?: string;
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
  addMovie: (movie: Omit<Movie, 'id'> & { id?: string }) => Promise<void>;
  updateMovie: (id: string, updates: Partial<Movie>) => Promise<void>;
  removeMovie: (id: string) => Promise<void>;
  markWatched: (id: string) => Promise<void>;
  skipTurn: () => Promise<void>;
  setTurn: (index: number) => Promise<void>;
  resetDatabase: () => Promise<void>;
  updateProfiles: (profiles: FamilyProfile[]) => Promise<void>;
  refreshMetadata: (forceAll?: boolean) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { showModal } = useModal();

  const {
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
  } = useFirebaseData();

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
