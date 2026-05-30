import {
  listarFornecedores, criarFornecedor, atualizarFornecedor, deletarFornecedor,
  listarCotacoes, criarCotacao, atualizarCotacao, deletarCotacao,
} from "../../services/repositories/fornecedoresRepository";

export const createFornecedoresSlice = (set, get) => ({
  fornecedores: [],
  cotacoes: {},

  loadFornecedores: async () => {
    if (get().loaded.fornecedores) return;
    get().setLoading("fornecedores", true);
    try {
      const data = await listarFornecedores();
      set((s) => ({ fornecedores: data, loaded: { ...s.loaded, fornecedores: true } }));
    } finally {
      get().setLoading("fornecedores", false);
    }
  },

  addFornecedor: async (f) => {
    const data = await criarFornecedor(f);
    set((s) => ({ fornecedores: [...s.fornecedores, data] }));
    return data;
  },

  updateFornecedor: async (id, updates) => {
    const data = await atualizarFornecedor(id, updates);
    set((s) => ({ fornecedores: s.fornecedores.map((f) => f.id === id ? data : f) }));
  },

  deleteFornecedor: async (id) => {
    await deletarFornecedor(id);
    set((s) => ({
      fornecedores: s.fornecedores.filter((f) => f.id !== id),
      cotacoes: Object.fromEntries(Object.entries(s.cotacoes).filter(([k]) => k !== id)),
    }));
  },

  loadCotacoes: async (fornecedorId) => {
    if (get().cotacoes[fornecedorId]) return;
    const data = await listarCotacoes(fornecedorId);
    set((s) => ({ cotacoes: { ...s.cotacoes, [fornecedorId]: data } }));
  },

  addCotacao: async (fornecedorId, cotacao) => {
    const data = await criarCotacao({ ...cotacao, fornecedor_id: fornecedorId });
    set((s) => ({ cotacoes: { ...s.cotacoes, [fornecedorId]: [data, ...(s.cotacoes[fornecedorId] || [])] } }));
    return data;
  },

  updateCotacao: async (fornecedorId, id, updates) => {
    const data = await atualizarCotacao(id, updates);
    set((s) => ({
      cotacoes: {
        ...s.cotacoes,
        [fornecedorId]: (s.cotacoes[fornecedorId] || []).map((c) => c.id === id ? data : c),
      },
    }));
  },

  deleteCotacao: async (fornecedorId, id) => {
    await deletarCotacao(id);
    set((s) => ({
      cotacoes: {
        ...s.cotacoes,
        [fornecedorId]: (s.cotacoes[fornecedorId] || []).filter((c) => c.id !== id),
      },
    }));
  },
});
