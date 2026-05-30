import { listarHistorico, adicionarHistorico, listarHistoricoObra } from "../../services/repositories/historicoRepository";

const nowBR = () => {
  const d = new Date();
  return { data: d.toLocaleDateString("pt-BR"), hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) };
};

export const createHistoricoSlice = (set, get) => ({
  historico: [],

  loadHistorico: async () => {
    if (get().loaded.historico) return;
    get().setLoading("historico", true);
    try {
      const data = await listarHistorico();
      set((s) => ({ historico: data, loaded: { ...s.loaded, historico: true } }));
    } finally {
      get().setLoading("historico", false);
    }
  },

  registrar: async (tipo, acao, desc, obraId, detalhes) => {
    const { user } = get();
    const { data, hora } = nowBR();
    const r = {
      tipo, acao, descricao: desc,
      usuario: user?.nome || "Sistema", data, hora, usuario_id: user?.uid,
      obra_id: obraId || null,
      detalhes: detalhes || null,
    };
    try {
      const novo = await adicionarHistorico(r);
      if (novo) set((s) => ({ historico: [novo, ...s.historico] }));
    } catch (_) {
      // não quebra o fluxo se histórico falhar
    }
  },

  loadHistoricoObra: async (obraId) => {
    try {
      const data = await listarHistoricoObra(obraId);
      return data;
    } catch (_) {
      return [];
    }
  },
});
