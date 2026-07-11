// 
// StickFrame StickFlow Zustand Slice
// 

import { listarStickFlows, criarStickFlow, atualizarStickFlow, deletarStickFlow } from "../../services/repositories/stickflowRepository";

export const createStickflowSlice = (set, get) => ({
  stickflows: [],

  loadStickFlows: async () => {
    if (get().loaded.stickflows) return;
    get().setLoading("stickflows", true);
    try {
      const data = await listarStickFlows();
      set((s) => ({ stickflows: data, loaded: { ...s.loaded, stickflows: true } }));
    } finally {
      get().setLoading("stickflows", false);
    }
  },

  addStickFlow: async (sf) => {
    const data = await criarStickFlow(sf);
    set((s) => ({ stickflows: [...s.stickflows, data] }));
    return data;
  },

  updateStickFlow: async (id, updates) => {
    const anterior = get().stickflows.find((s) => s.id === id);
    set((s) => ({ stickflows: s.stickflows.map((s) => s.id === id ? { ...s, ...updates } : s) }));
    try {
      const data = await atualizarStickFlow(id, updates);
      set((s) => ({ stickflows: s.stickflows.map((s) => s.id === id ? data : s) }));
      return data;
    } catch (e) {
      set((s) => ({ stickflows: s.stickflows.map((s) => s.id === id ? anterior : s) }));
      throw e;
    }
  },

  deleteStickFlow: async (id) => {
    const sf = get().stickflows.find((x) => x.id === id);
    if (!sf) return;
    set((s) => ({ stickflows: s.stickflows.filter((x) => x.id !== id) }));
    try {
      await deletarStickFlow(id);
    } catch (e) {
      set((s) => ({ stickflows: [sf, ...s.stickflows] }));
      throw e;
    }
  }
});
