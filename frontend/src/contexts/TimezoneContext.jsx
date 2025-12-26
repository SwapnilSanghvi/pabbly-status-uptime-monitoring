import { createContext, useContext, useState, useEffect } from 'react';
import { getUserTimezone } from '../utils/timezone';

const TimezoneContext = createContext();

const STORAGE_KEY = 'user-timezone-preference';

export function TimezoneProvider({ children }) {
  // Initialize timezone from localStorage or auto-detect
  const [selectedTimezone, setSelectedTimezone] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return stored;
    }
    // Auto-detect user's timezone
    return getUserTimezone();
  });

  // Save to localStorage whenever timezone changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedTimezone);
  }, [selectedTimezone]);

  const value = {
    timezone: selectedTimezone,
    setTimezone: setSelectedTimezone,
  };

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
}
