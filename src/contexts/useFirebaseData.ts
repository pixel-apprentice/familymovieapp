import { useState, useEffect } from 'react';
import { db, isFirebaseInitialized } from '../services/firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, writeBatch, getDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { seedData } from '../utils/seedData';
import { useAuth } from './AuthContext';
import { searchMovies, GENRE_MAP } from '../services/tmdb';
import { FamilyProfile, DEFAULT_PROFILES, Movie } from './DataContext';

export function useFirebaseData() {
  const { user, loading: authLoading } = useAuth();
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
      const moviesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { ...data, id: doc.id, tmdbId: data.id || data.tmdbId || doc.id } as Movie;
      });
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

  const addMovie = async (movie: Omit<Movie, 'id'> & { id?: string }) => {
    if (isLocalMode) {
      const newMovie = { ...movie, id: movie.id || `local-${Date.now()}` } as Movie;
      saveLocalMovies([...movies, newMovie]);
    } else {
      const newDocRef = movie.id ? doc(db, 'movies', movie.id) : doc(collection(db, 'movies'));
      
      // Strip undefined values and 'id' to prevent Firebase errors and duplication
      const safeMovie = Object.entries(movie).reduce((acc: any, [key, value]) => {
        if (value !== undefined && key !== 'id') {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      await setDoc(newDocRef, safeMovie);
    }
  };

  const updateMovie = async (id: string, updates: Partial<Movie>) => {
    console.log(`[DataContext] Updating movie ${id}:`, updates);
    
    // Strip undefined values and 'id' to prevent Firebase errors
    const safeUpdates = Object.entries(updates).reduce((acc: any, [key, value]) => {
      if (value !== undefined && key !== 'id') {
        acc[key] = value;
      }
      return acc;
    }, {} as Partial<Movie>);

    if (isLocalMode) {
      setMovies(prev => {
        const newMovies = prev.map(m => m.id === id ? { ...m, ...safeUpdates } : m);
        localStorage.setItem('localMovies', JSON.stringify(newMovies));
        return newMovies;
      });
    } else {
      try {
        await updateDoc(doc(db, 'movies', id), safeUpdates);
        console.log(`[DataContext] Firebase update successful for ${id}`);
      } catch (error) {
        console.error(`[DataContext] Firebase update failed for ${id}:`, error);
        throw error;
      }
    }
  };

  const removeMovie = async (id: string) => {
    if (isLocalMode) {
      setMovies(prev => {
        const newMovies = prev.filter(m => m.id !== id);
        localStorage.setItem('localMovies', JSON.stringify(newMovies));
        return newMovies;
      });
    } else {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'movies', id));
    }
  };

  const markWatched = async (id: string) => {
    const nextTurn = (currentTurnIndex + 1) % profiles.length;
    const today = new Date().toISOString().split('T')[0];
    
    if (isLocalMode) {
      setMovies(prev => {
        const newMovies = prev.map(m => m.id === id ? { ...m, status: 'watched', date: today } : m);
        localStorage.setItem('localMovies', JSON.stringify(newMovies));
        return newMovies as Movie[];
      });
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
