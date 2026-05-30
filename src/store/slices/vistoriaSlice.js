import { listarVistorias, criarVistoria, atualizarVistoria, deletarVistoria } from "../../services/repositories/vistoriaRepository";

export const createVistoriaSlice = (set, get) => ({
  vistorias: {}, // { [obraId]: [...] }

  loadVistorias: async (obraId) => {
    if (!obraId) return;
    const data = await listarVistorias(obraId);
    set((s) => ({ vistorias: { ...s.vistorias, [obraId]: data } }));
  },

  addVistoria: async (obraId, vistoria) => {
    const data = await criarVistoria({ ...vistoria, obra_id: obraId });
    set((s) => ({ vistorias: { ...s.vistorias, [obraId]: [data, ...(s.vistorias[obraId] || [])] } }));
    return data;
  },

  updateVistoria: async (obraId, id, updates) => {
    const data = await atualizarVistoria(id, updates);
    set((s) => ({
      vistorias: {
        ...s.vistorias,
        [obraId]: (s.vistorias[obraId] || []).map((v) => v.id === id ? data : v),
      },
    }));
    return data;
  },

  deleteVistoria: async (obraId, id) => {
    await deletarVistoria(id);
    set((s) => ({
      vistorias: {
        ...s.vistorias,
        [obraId]: (s.vistorias[obraId] || []).filter((v) => v.id !== id),
      },
    }));
  },
});
