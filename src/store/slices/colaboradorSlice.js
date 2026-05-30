import {
  listarColaboradores, criarColaborador, atualizarColaborador, deletarColaborador,
  listarAlocacoes, criarAlocacao, deletarAlocacao,
  listarHoras, criarHoras, deletarHoras,
} from "../../services/repositories/colaboradorRepository";

export const createColaboradorSlice = (set, get) => ({
  colaboradores: [],
  alocacoes:     [],
  horasTrabalhadas: [],

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

  // ── Alocações ─────────────────────────────────────────────────────────────
  loadAlocacoes: async () => {
    const data = await listarAlocacoes();
    set({ alocacoes: data });
  },
  addAlocacao: async (a) => {
    const data = await criarAlocacao(a);
    set((s) => ({ alocacoes: [data, ...s.alocacoes] }));
    return data;
  },
  removeAlocacao: async (id) => {
    await deletarAlocacao(id);
    set((s) => ({ alocacoes: s.alocacoes.filter((x) => x.id !== id) }));
  },

  // ── Horas trabalhadas ──────────────────────────────────────────────────────
  loadHorasTrabalhadas: async () => {
    const data = await listarHoras();
    set({ horasTrabalhadas: data });
  },
  addHorasTrabalhadas: async (h) => {
    const data = await criarHoras(h);
    set((s) => ({ horasTrabalhadas: [data, ...s.horasTrabalhadas] }));
    return data;
  },
  removeHorasTrabalhadas: async (id) => {
    await deletarHoras(id);
    set((s) => ({ horasTrabalhadas: s.horasTrabalhadas.filter((x) => x.id !== id) }));
  },
});
