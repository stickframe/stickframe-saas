import { listarColaboradores, criarColaborador, atualizarColaborador, deletarColaborador } from "../../services/repositories/colaboradorRepository";

export const createColaboradorSlice = (set, get) => ({
  colaboradores: [],

  loadColaboradores: async () => {
    if (get().loaded.colaboradores) return;
    get().setLoading("colaboradores", true);
    try {
      const data = await listarColaboradores();
      set((s) => ({ colaboradores: data, loaded: { ...s.loaded, colaboradores: true } }));
    } finally {
      get().setLoading("colaboradores", false);
    }
  },

  addColaborador: async (c) => {
    const data = await criarColaborador(c);
    set((s) => ({ colaboradores: [...s.colaboradores, data] }));
    get().registrar("colaborador", "criado", `Colaborador ${c.nome} cadastrado`);
  },

  updateColaborador: async (id, updates) => {
    const data = await atualizarColaborador(id, updates);
    set((s) => ({ colaboradores: s.colaboradores.map((c) => c.id === id ? data : c) }));
  },

  deleteColaborador: async (id) => {
    const c = get().colaboradores.find((x) => x.id === id);
    await deletarColaborador(id);
    set((s) => ({ colaboradores: s.colaboradores.filter((x) => x.id !== id) }));
    get().registrar("colaborador", "deletado", `Colaborador ${c?.nome} removido`);
  },
});
