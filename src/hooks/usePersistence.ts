import { useState, useCallback, useEffect } from 'react';
import { logger } from '../utils/logger';

export function usePersistence<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') return initialValue;
      
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.error(`[Persistence] Error reading key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      logger.error(`[Persistence] Error setting key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeItem = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      logger.error(`[Persistence] Error removing key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeItem] as const;
}
