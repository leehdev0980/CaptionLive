import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'caption_history';

export function useHistory() {
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever history changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const addEntry = useCallback((entry) => {
    setHistory(prev => [entry, ...prev].slice(0, 200)); // keep last 200 entries
  }, []);

  const updateEntry = useCallback((id, changes) => {
    setHistory(prev => prev.map(entry => (
      entry.id === id ? { ...entry, ...changes } : entry
    )));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addEntry, updateEntry, clearHistory };
}
