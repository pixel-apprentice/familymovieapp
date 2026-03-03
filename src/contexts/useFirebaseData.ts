import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Movie, FamilyProfile, DEFAULT_PROFILES } from './DataContext';
import { useAuth } from './AuthContext';

export function useFirebaseData() {
  const { user } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [profiles, setProfiles] = useState<FamilyProfile[]>(DEFAULT_PROFILES);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
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
  }, [user]);

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
    const docRef = movie.id ? doc(db, 'movies', movie.id) : doc(collection(db, 'movies'));
    await setDoc(docRef, movie);
  };

  const updateMovie = async (id: string, updates: Partial<Movie>) => {
    if (isLocalMode) {
      saveLocalMovies(movies.map(m => m.id === id ? { ...m, ...updates } : m));
      return;
    }
    await updateDoc(doc(db, 'movies', id), updates);
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
    // Optional: force refresh
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
