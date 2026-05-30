import { listarModelos, criarModelo, deletarModelo, uploadIFC, listarApontamentos, criarApontamento, atualizarApontamento, deletarApontamento } from "../../services/repositories/bimRepository";

export const createBimSlice = (set, get) => ({
  bimModelos:       {},
  bimApontamentos:  {},

  loadBimModelos: async (obraId) => {
    const data = await listarModelos(obraId);
    set((s) => ({ bimModelos: { ...s.bimModelos, [obraId]: data } }));
  },

  addBimModelo: async (obraId, file, meta) => {
    const empresaId = get().empresaId;
    const { path, publicUrl } = await uploadIFC(obraId, empresaId, file);
    const data = await criarModelo({ ...meta, obra_id: obraId, storage_path: path, tamanho: (file.size / 1024 / 1024).toFixed(2) + " MB" });
    set((s) => ({ bimModelos: { ...s.bimModelos, [obraId]: [data, ...(s.bimModelos[obraId] || [])] } }));
    return { ...data, publicUrl };
  },

  deleteBimModelo: async (obraId, id, storagePath) => {
    await deletarModelo(id, storagePath);
    set((s) => ({ bimModelos: { ...s.bimModelos, [obraId]: (s.bimModelos[obraId] || []).filter((m) => m.id !== id) } }));
  },

  loadBimApontamentos: async (obraId) => {
    const data = await listarApontamentos(obraId);
    set((s) => ({ bimApontamentos: { ...s.bimApontamentos, [obraId]: data } }));
  },

  addBimApontamento: async (obraId, apt) => {
    const data = await criarApontamento({ ...apt, obra_id: obraId });
    set((s) => ({ bimApontamentos: { ...s.bimApontamentos, [obraId]: [data, ...(s.bimApontamentos[obraId] || [])] } }));
    return data;
  },

  updateBimApontamento: async (obraId, id, updates) => {
    const data = await atualizarApontamento(id, updates);
    set((s) => ({
      bimApontamentos: {
        ...s.bimApontamentos,
        [obraId]: (s.bimApontamentos[obraId] || []).map((a) => a.id === id ? data : a),
      },
    }));
  },

  deleteBimApontamento: async (obraId, id) => {
    await deletarApontamento(id);
    set((s) => ({
      bimApontamentos: {
        ...s.bimApontamentos,
        [obraId]: (s.bimApontamentos[obraId] || []).filter((a) => a.id !== id),
      },
    }));
  },
});
