import { useEffect } from 'react';
import { db, isFirebaseInitialized } from '../services/firebase';
import { doc, getDoc, writeBatch, collection } from 'firebase/firestore';
import { seedData } from '../utils/seedData';
import { useAuth } from '../contexts/AuthContext';

export function useDatabaseSeed() {
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    async function seedDatabase() {
      if (!isFirebaseInitialized) return;
      if (authLoading || !user) return;

      try {
        const configRef = doc(db, 'metadata', 'config');
        const configSnap = await getDoc(configRef);

        if (!configSnap.exists() || !configSnap.data().isSeeded) {
          console.log("Seeding database...");
          const batch = writeBatch(db);
          
          seedData.forEach((movie) => {
            const movieRef = doc(collection(db, 'movies'));
            let picker = movie.picker;
            if (picker.includes('Family')) picker = 'Family';
            if (picker === 'Lauren' || picker === 'Mom') picker = 'Mom';
            
            batch.set(movieRef, {
              title: movie.title,
              date: movie.date,
              pickedBy: picker,
              status: 'watched',
              ratings: {}
            });
          });

          batch.set(configRef, { 
            isSeeded: true, 
            currentTurnIndex: 0,
            profiles: [
              { id: 'Jack', name: 'Jack', color: '#60a5fa' },
              { id: 'Simone', name: 'Simone', color: '#f472b6' },
              { id: 'Mom', name: 'Mom', color: '#34d399' },
              { id: 'Dad', name: 'Dad', color: '#fbbf24' }
            ]
          }, { merge: true });
          await batch.commit();
          console.log("Database seeded successfully.");
        }
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          console.warn("Permission denied while seeding database. Falling back to local mode.");
        } else {
          console.error("Error seeding database:", error);
        }
      }
    }

    seedDatabase();
  }, [user, authLoading]);
}
