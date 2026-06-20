import { create } from 'zustand';

export const useSessionStore = create((set) => ({
  status: 'idle',
  isRecording: false,
  isConnected: false,
  translate: true, // Added default value
  latency: 0,
  history: [],
  transcript: {
    text: '',
    timestamp: null,
  },
  translation: {
    text: '',
    timestamp: null,
  },

  // Actions to update the state
  setStatus: (status) => set({ status }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setLatency: (latency) => set({ latency }),
  
  // Action to add a new entry to the history
  addHistory: (entry) => set((state) => ({ history: [...state.history, entry] })),

  // Actions to update the live transcript and translation
  setTranscript: (text, timestamp) => set({ transcript: { text, timestamp } }),
  setTranslation: (text, timestamp) => set({ translation: { text, timestamp } }),

  // New actions for toggling and clearing
  toggleTranslate: () => set((state) => ({ translate: !state.translate })),
  clearHistory: () => set({ history: [] }),

  // Action to reset the session state
  resetSession: () => set({
    status: 'idle',
    isRecording: false,
    latency: 0,
    history: [],
    transcript: { text: '', timestamp: null },
    translation: { text: '', timestamp: null },
  }),
}));
