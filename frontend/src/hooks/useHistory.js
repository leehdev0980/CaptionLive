import { useState, useEffect, useCallback } from 'react';

export function useHistory({ storageKey = 'caption_history' } = {}) {
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever history changes
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(history));
  }, [history, storageKey]);

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
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return { history, addEntry, updateEntry, clearHistory };
}
