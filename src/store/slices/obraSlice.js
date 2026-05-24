import {
  listarObras, atualizarFase,
  listarDiario, adicionarDiario,
  listarMedicoes, adicionarMedicao, aprovarMedicao,
  listarArquivos, adicionarArquivos, deletarArquivo,
  subscribeObras, subscribeDiario,
} from "../../services/repositories/obraRepository";

export const createObraSlice = (set, get) => ({
  obras:    [],
  diario:   {},
  medicoes: {},
  arquivos: {},

  loadObras: async () => {
    if (get().loaded.obras) return;
    get().setLoading("obras", true);
    try {
      const data = await listarObras();
      set((s) => ({ obras: data, loaded: { ...s.loaded, obras: true } }));
    } finally {
      get().setLoading("obras", false);
    }
  },

  avancarFase: async (obraId, novaFase, progresso) => {
    await atualizarFase(obraId, novaFase, progresso);
    set((s) => ({ obras: s.obras.map((o) => o.id === obraId ? { ...o, fase: novaFase, progresso } : o) }));
    const o = get().obras.find((x) => x.id === obraId);
    get().registrar("obra", "fase", `Obra ${o?.nome?.split("—")[0]?.trim()} avançou para: ${novaFase}`);
  },

  loadDiario: async (obraId) => {
    if (get().loaded.diario[obraId]) return;
    get().setLoading("diario", true);
    try {
      const data = await listarDiario(obraId);
      set((s) => ({
        diario: { ...s.diario, [obraId]: data.map((r) => ({ ...r, fotos: [], created: new Date(r.created_at).toLocaleString("pt-BR") })) },
        loaded: { ...s.loaded, diario: { ...s.loaded.diario, [obraId]: true } },
      }));
    } finally {
      get().setLoading("diario", false);
    }
  },

  addDiario: async (obraId, registro) => {
    const { user, empresaId } = get();
    const data = await adicionarDiario(obraId, registro, user?.uid, empresaId);
    const novo = { ...data, fotos: [], created: new Date(data.created_at).toLocaleString("pt-BR") };
    set((s) => ({ diario: { ...s.diario, [obraId]: [novo, ...(s.diario[obraId] || [])] } }));
    const o = get().obras.find((x) => x.id === obraId);
    get().registrar("obra", "editado", `Diário registrado em ${o?.nome?.split("—")[0]?.trim()} — ${registro.data}`);
  },

  loadMedicoes: async (obraId) => {
    if (get().loaded.medicoes[obraId]) return;
    const data = await listarMedicoes(obraId);
    set((s) => ({
      medicoes: { ...s.medicoes, [obraId]: data },
      loaded: { ...s.loaded, medicoes: { ...s.loaded.medicoes, [obraId]: true } },
    }));
  },

  addMedicao: async (obraId, medicao) => {
    const lista = get().medicoes[obraId] || [];
    const data = await adicionarMedicao(obraId, { ...medicao, numero: lista.length + 1, status: "Pendente" }, get().empresaId);
    set((s) => ({ medicoes: { ...s.medicoes, [obraId]: [...(s.medicoes[obraId] || []), data] } }));
    const o = get().obras.find((x) => x.id === obraId);
    get().registrar("financeiro", "criado", `Medição ${data.numero} registrada — ${o?.nome?.split("—")[0]?.trim()}`);
  },

  aprovarMedicao: async (obraId, id) => {
    await aprovarMedicao(id);
    set((s) => ({ medicoes: { ...s.medicoes, [obraId]: s.medicoes[obraId].map((m) => m.id === id ? { ...m, status: "Aprovada" } : m) } }));
    const o = get().obras.find((x) => x.id === obraId);
    get().registrar("financeiro", "receita", `Medição aprovada — ${o?.nome?.split("—")[0]?.trim()}`);
  },

  loadArquivos: async (obraId) => {
    if (get().loaded.arquivos[obraId]) return;
    const data = await listarArquivos(obraId);
    set((s) => ({ arquivos: { ...s.arquivos, [obraId]: data }, loaded: { ...s.loaded, arquivos: { ...s.loaded.arquivos, [obraId]: true } } }));
  },

  addArquivos: async (obraId, novos) => {
    const data = await adicionarArquivos(obraId, novos, get().empresaId);
    set((s) => ({ arquivos: { ...s.arquivos, [obraId]: [...(data || novos), ...(s.arquivos[obraId] || [])] } }));
    const o = get().obras.find((x) => x.id === obraId);
    get().registrar("obra", "editado", `${novos.length} arquivo(s) adicionado(s) em ${o?.nome?.split("—")[0]?.trim()}`);
  },

  deleteArquivo: async (obraId, arqId) => {
    await deletarArquivo(arqId);
    set((s) => ({ arquivos: { ...s.arquivos, [obraId]: s.arquivos[obraId].filter((a) => a.id !== arqId) } }));
  },

  subscribeObras: () => subscribeObras((payload) => {
    if (payload.eventType === "UPDATE")
      set((s) => ({ obras: s.obras.map((o) => o.id === payload.new.id ? { ...o, ...payload.new } : o) }));
  }),

  subscribeDiario: (obraId) => subscribeDiario(obraId, (payload) => {
    if (payload.eventType === "INSERT") {
      const novo = { ...payload.new, fotos: [], created: new Date(payload.new.created_at).toLocaleString("pt-BR") };
      set((s) => ({ diario: { ...s.diario, [obraId]: [novo, ...(s.diario[obraId] || [])] } }));
    }
  }),
});
