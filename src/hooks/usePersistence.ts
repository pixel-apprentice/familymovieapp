import { useState, useCallback, useEffect } from 'react';
import { logger } from '../utils/logger';

export function usePersistence<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') return initialValue;
      
      const item = window.localStorage.getItem(key);
      if (item === null) return initialValue;
      
      try {
        return JSON.parse(item);
      } catch (parseError) {
        // Migration support: If parsing fails, it's likely a legacy raw string (e.g., "modern-pinnacle" instead of "\"modern-pinnacle\"")
        // We return the raw string as-is.
        return item as unknown as T;
      }
    } catch (error) {
      logger.warn(`[Persistence] Could not parse key "${key}", falling back to initial value.`);
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
