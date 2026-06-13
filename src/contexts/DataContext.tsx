import React, { createContext, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, doc, setDoc, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import { seedData } from '../utils/seedData';
import { useAuth } from './AuthContext';
import { useModal } from './ModalContext';
import { useFirebaseData } from './useFirebaseData';
import { logger } from '../utils/logger';

import { FamilyProfile, Movie, CouchState, PulseEvent } from '../types/movie';
export type { FamilyProfile, Movie, CouchState, PulseEvent };
import { DEFAULT_PROFILES } from '../constants/settings';

interface DataContextType {
  movies: Movie[];
  profiles: FamilyProfile[];
  currentTurnIndex: number;
  isLocalMode: boolean;
  isInitializing: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'local-only';
  authError: Error | null;
  addMovie: (movie: Omit<Movie, 'id'> & { id?: string }) => Promise<void>;
  updateMovie: (id: string, updates: Partial<Movie>) => Promise<void>;
  removeMovie: (id: string) => Promise<void>;
  markWatched: (id: string) => Promise<void>;
  skipTurn: () => Promise<void>;
  setTurn: (index: number) => Promise<void>;
  resetDatabase: () => Promise<void>;
  updateProfiles: (profiles: FamilyProfile[]) => Promise<void>;
  refreshMetadata: (forceAll?: boolean) => Promise<void>;
  couchState: CouchState | null;
  pulseEvent: PulseEvent | null;
  pushCouchState: (updates: Partial<CouchState>) => Promise<void>;
  pushPulseEvent: (event: Omit<PulseEvent, 'timestamp'>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { showModal } = useModal();
  const navigate = useNavigate();

  const {
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
    clearData,
    isInitializing,
    authError
  } = useFirebaseData();

  const resetDatabase = async () => {
    try {
      clearData();
      if (isLocalMode) {
        localStorage.removeItem('localMovies');
        localStorage.removeItem('localTurn');
        navigate('/');
        setTimeout(() => window.location.reload(), 100); // Small fallback for local storage sync
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

interface SeedMovie {
  date: string;
  title: string;
  picker: string;
}

        // 2. Re-seed data
        try {
          const seedBatch = writeBatch(db);
          (seedData as SeedMovie[]).forEach((m) => {
            let picker = m.picker;
            if (picker.includes('Family')) picker = 'Family';
            // Normalize specific mappings
            const mappings: Record<string, string> = { 'Lauren': 'Mom', 'Dad': 'Dad', 'Jack': 'Jack', 'Simone': 'Simone' };
            if (mappings[picker]) picker = mappings[picker];

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
          logger.error("Seeding failed:", seedError);
          throw new Error("Failed to re-seed database. " + (seedError as Error).message);
        }

        // 3. Reset config
        try {
          const configBatch = writeBatch(db);
          configBatch.set(doc(db, 'metadata', 'config'), { isSeeded: false, currentTurnIndex: 0 }, { merge: true });
          await configBatch.commit();
          
          // Trigger a silent metadata refresh to fill in posters
          refreshMetadata(true).catch(e => logger.error("Post-seed refresh failed:", e));
        } catch (configError) {
          console.warn("Config reset failed (non-critical):", configError);
        }

        navigate('/');
      }
    } catch (error) {
      logger.error("Reset failed:", error);
      await showModal({
        type: 'alert',
        title: 'Reset Failed',
        message: "Reset failed. " + (error as Error).message,
        confirmText: 'OK'
      });
    }
  };

  const value = useMemo(() => ({
    movies,
    profiles,
    currentTurnIndex,
    isLocalMode,
    isInitializing,
    syncStatus,
    couchState,
    pulseEvent,
    addMovie,
    updateMovie,
    removeMovie,
    markWatched,
    skipTurn,
    resetDatabase,
    pushCouchState,
    pushPulseEvent,
    setTurn,
    updateProfiles,
    clearData,
    authError
  }), [movies, profiles, currentTurnIndex, isLocalMode, isInitializing, syncStatus, couchState, pulseEvent, resetDatabase, addMovie, updateMovie, removeMovie, markWatched, skipTurn, pushCouchState, pushPulseEvent, setTurn, updateProfiles, clearData, authError]);

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
