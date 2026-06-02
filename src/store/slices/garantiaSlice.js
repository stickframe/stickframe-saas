import { listarChamados, adicionarChamado, atualizarChamado, excluirChamado } from "../../services/repositories/garantiaRepository";

export const createGarantiaSlice = (set, get) => ({
  chamados: {},

  loadChamados: async (obraId) => {
    const data = await listarChamados(obraId);
    set((s) => ({ chamados: { ...s.chamados, [obraId]: data } }));
  },

  addChamado: async (obraId, chamado) => {
    const data = await adicionarChamado({ ...chamado, obra_id: obraId });
    set((s) => ({
      chamados: { ...s.chamados, [obraId]: [data, ...(s.chamados[obraId] || [])] },
    }));
    return data;
  },

  updateChamado: async (obraId, id, payload) => {
    const data = await atualizarChamado(id, payload);
    set((s) => ({
      chamados: {
        ...s.chamados,
        [obraId]: (s.chamados[obraId] || []).map((c) => c.id === id ? data : c),
      },
    }));
    return data;
  },

  deleteChamado: async (obraId, id) => {
    await excluirChamado(id);
    set((s) => ({
      chamados: {
        ...s.chamados,
        [obraId]: (s.chamados[obraId] || []).filter((c) => c.id !== id),
      },
    }));
  },
});
