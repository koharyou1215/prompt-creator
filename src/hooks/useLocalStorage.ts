'use client';

import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    syncAcrossTabs?: boolean;
    debounce?: number;
  }
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Debounce timer
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      // Save state
      setStoredValue(valueToStore);

      // Save to local storage
      if (typeof window !== 'undefined') {
        // Clear existing debounce timer
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        // Set new debounce timer if specified
        if (options?.debounce) {
          const timer = setTimeout(() => {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));

            // Dispatch storage event for cross-tab sync
            if (options.syncAcrossTabs) {
              window.dispatchEvent(
                new StorageEvent('storage', {
                  key,
                  newValue: JSON.stringify(valueToStore),
                  url: window.location.href,
                  storageArea: window.localStorage,
                })
              );
            }
          }, options.debounce);

          setDebounceTimer(timer);
        } else {
          // Save immediately if no debounce
          window.localStorage.setItem(key, JSON.stringify(valueToStore));

          // Dispatch storage event for cross-tab sync
          if (options?.syncAcrossTabs) {
            window.dispatchEvent(
              new StorageEvent('storage', {
                key,
                newValue: JSON.stringify(valueToStore),
                url: window.location.href,
                storageArea: window.localStorage,
              })
            );
          }
        }
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Remove value from localStorage
  const removeValue = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        setStoredValue(initialValue);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  // Listen to storage events for cross-tab synchronization
  useEffect(() => {
    if (typeof window === 'undefined' || !options?.syncAcrossTabs) {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Error parsing storage event value:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, options?.syncAcrossTabs]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return [storedValue, setValue, removeValue];
}