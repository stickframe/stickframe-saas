import { listarLancamentos, adicionarLancamento } from "../../services/repositories/financeiroRepository";
import { listarObras } from "../../services/repositories/obraRepository";

export const createFinanceiroSlice = (set, get) => ({
  financeiro: {},

  loadFinanceiro: async () => {
    if (get().loaded.financeiro) return;
    get().setLoading("financeiro", true);
    try {
      const obras = get().obras.length ? get().obras : await listarObras();
      const results = await Promise.all(obras.map((o) => listarLancamentos(o.id)));
      const all = results.flat();
      const fin = {};
      obras.forEach((o) => {
        fin[o.id] = { contrato: o.contrato || 0, lancamentos: all.filter((l) => l.obra_id === o.id) };
      });
      set((s) => ({ financeiro: fin, loaded: { ...s.loaded, financeiro: true } }));
    } finally {
      get().setLoading("financeiro", false);
    }
  },

  addLancamento: async (obraId, lancamento) => {
    const data = await adicionarLancamento(obraId, lancamento);
    const novo = data || { ...lancamento, id: Date.now() };
    set((s) => {
      const fin = s.financeiro[obraId] || { contrato: 0, lancamentos: [] };
      return { financeiro: { ...s.financeiro, [obraId]: { ...fin, lancamentos: [...fin.lancamentos, novo] } } };
    });
    const o = get().obras.find((x) => x.id === obraId);
    get().registrar("financeiro", lancamento.tipo === "receita" ? "receita" : "despesa",
      `${lancamento.tipo === "receita" ? "Receita" : "Despesa"} de R$ ${lancamento.valor} — ${o?.nome?.split("—")[0]?.trim()}`);
  },

  // Carrega dados essenciais para o Dashboard e navegação inicial
  loadInitialData: async () => {
    await Promise.all([
      get().loadClientes(),
      get().loadObras(),
      get().loadOrcamentos(),
      get().loadContratos(),
      get().loadEventos(),
      get().loadHistorico(),
    ]);
    // Financeiro depende de obras — carrega depois
    await get().loadFinanceiro();
  },

  loadDashboard: async () => {
    await Promise.all([get().loadClientes(), get().loadObras(), get().loadFinanceiro()]);
  },
});
