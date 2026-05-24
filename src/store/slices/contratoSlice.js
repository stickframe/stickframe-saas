import { listarContratos, criarContrato } from "../../services/repositories/contratoRepository";
import { listarOrcamentos, criarOrcamento, atualizarOrcamento, deletarOrcamento } from "../../services/repositories/orcamentoRepository";

export const createContratoSlice = (set, get) => ({
  contratos:  [],
  orcamentos: [],

  loadContratos: async () => {
    if (get().loaded.contratos) return;
    get().setLoading("contratos", true);
    try {
      const data = await listarContratos();
      set((s) => ({ contratos: data, loaded: { ...s.loaded, contratos: true } }));
    } finally {
      get().setLoading("contratos", false);
    }
  },

  addContrato: async (contrato) => {
    const data = await criarContrato(contrato);
    set((s) => ({ contratos: [data, ...s.contratos] }));
    get().registrar("contrato", "criado", `Contrato ${contrato.ref} criado para ${contrato.cliente}`);
  },

  loadOrcamentos: async () => {
    if (get().loaded.orcamentos) return;
    get().setLoading("orcamentos", true);
    try {
      const data = await listarOrcamentos();
      set((s) => ({ orcamentos: data, loaded: { ...s.loaded, orcamentos: true } }));
    } finally {
      get().setLoading("orcamentos", false);
    }
  },

  addOrcamento: async (o) => {
    const data = await criarOrcamento(o);
    set((s) => ({ orcamentos: [data, ...s.orcamentos] }));
    get().registrar("orcamento", "criado", `Orçamento ${o.ref} gerado para ${o.cliente}`);
  },

  updateOrcamento: async (id, updates) => {
    const data = await atualizarOrcamento(id, updates);
    set((s) => ({ orcamentos: s.orcamentos.map((o) => (o.id === id ? data : o)) }));
    get().registrar("orcamento", "editado", `Orçamento editado`);
  },

  deleteOrcamento: async (id) => {
    const o = get().orcamentos.find((x) => x.id === id);
    await deletarOrcamento(id);
    set((s) => ({ orcamentos: s.orcamentos.filter((x) => x.id !== id) }));
    get().registrar("orcamento", "deletado", `Orçamento ${o?.ref} removido`);
  },
});
