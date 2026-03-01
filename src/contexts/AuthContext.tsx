import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { User, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Sign in anonymously if not already signed in
    signInAnonymously(auth).catch((err) => {
      console.warn("Firebase Auth not configured or failed. Falling back to local mode without auth.");
      // We don't set error because we can work without auth in local mode
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
