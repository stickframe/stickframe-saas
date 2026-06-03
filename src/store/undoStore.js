import { create } from "zustand";

export const useUndoStore = create((set, get) => ({
  stack: [],
  push: (label, restoreFn) => {
    set((s) => ({ stack: [...s.stack.slice(-9), { label, restoreFn, id: Date.now() }] }));
  },
  pop: () => {
    const { stack } = get();
    if (!stack.length) return null;
    const entry = stack[stack.length - 1];
    set({ stack: stack.slice(0, -1) });
    return entry;
  },
  clear: () => set({ stack: [] }),
}));
