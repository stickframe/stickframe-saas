import {
  listarObras, criarObra, atualizarObra, deletarObra, atualizarFase,
  listarDiario, adicionarDiario,
  listarMedicoes, adicionarMedicao, aprovarMedicao,
  listarArquivos, adicionarArquivos, deletarArquivo, marcarCienteArquivo,
  subscribeObras, subscribeDiario,
} from "../../services/repositories/obraRepository";
import { criarNotificacao } from "../../services/repositories/notificacoesRepository";
import { emailFaseAvancada, emailMedicaoAprovada } from "../../services/emailService";

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
    const anterior = get().obras.find((x) => x.id === obraId);
    await atualizarFase(obraId, novaFase, progresso);
    set((s) => ({ obras: s.obras.map((o) => o.id === obraId ? { ...o, fase: novaFase, progresso } : o) }));
    const o = get().obras.find((x) => x.id === obraId);
    const nome = o?.nome?.split("—")[0]?.trim();
    get().registrar("obra", "fase", `Obra ${nome} avançou para: ${novaFase}`, obraId, {
      campos: [{ campo: "Fase", de: anterior?.fase || "—", para: novaFase }],
    });
    const uid = get().user?.uid;
    if (uid) criarNotificacao({ usuarioId: uid, titulo: `Fase avançada: ${novaFase}`, mensagem: `Obra ${nome} avançou para a fase "${novaFase}".`, tipo: "info" }).catch(() => {});
    if (o?.email_cliente) emailFaseAvancada({ obraEmail: o.email_cliente, obraNome: nome, fase: novaFase, progresso, portalToken: o.token_portal }).catch(() => {});
  },

  addObra: async (obra) => {
    const data = await criarObra(obra);
    set((s) => ({ obras: [...s.obras, data] }));
    get().registrar("obra", "criado", `Obra ${data.nome} cadastrada`, data.id);
    const uid = get().user?.uid;
    if (uid) criarNotificacao({ usuarioId: uid, titulo: "Nova obra cadastrada", mensagem: `A obra "${data.nome}" foi adicionada.`, tipo: "info" }).catch(() => {});
    return data;
  },

  updateObra: async (id, updates) => {
    const anterior = get().obras.find((o) => o.id === id);
    // Optimistic update
    set((s) => ({ obras: s.obras.map((o) => o.id === id ? { ...o, ...updates } : o) }));
    try {
      const data = await atualizarObra(id, updates);
      set((s) => ({ obras: s.obras.map((o) => o.id === id ? data : o) }));
      const LABELS = { nome: "Nome", cliente: "Cliente", status: "Status", contrato: "Contrato (R$)", email_cliente: "Email do cliente", prazo_inicio: "Início", prazo_fim: "Entrega", fase: "Fase" };
      const campos = Object.entries(LABELS)
        .filter(([k]) => updates[k] !== undefined && String(updates[k] ?? "") !== String(anterior?.[k] ?? ""))
        .map(([k, label]) => ({ campo: label, de: String(anterior?.[k] ?? "—") || "—", para: String(updates[k] ?? "—") || "—" }));
      get().registrar("obra", "editado", `Obra ${data.nome} atualizada`, id, campos.length > 0 ? { campos } : null);
    } catch (e) {
      // Rollback
      set((s) => ({ obras: s.obras.map((o) => o.id === id ? anterior : o) }));
      throw e;
    }
  },

  deleteObra: async (id) => {
    const o = get().obras.find((x) => x.id === id);
    // Optimistic remove
    set((s) => ({ obras: s.obras.filter((x) => x.id !== id) }));
    try {
      await deletarObra(id);
      get().registrar("obra", "deletado", `Obra ${o?.nome} removida`);
    } catch (e) {
      // Rollback
      set((s) => ({ obras: [o, ...s.obras] }));
      throw e;
    }
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
    const o    = get().obras.find((x) => x.id === obraId);
    const nome = o?.nome?.split("—")[0]?.trim();
    const med  = get().medicoes[obraId]?.find((m) => m.id === id);
    get().registrar("financeiro", "receita", `Medição aprovada — ${nome}`);
    const uid = get().user?.uid;
    if (uid) criarNotificacao({ usuarioId: uid, titulo: `Medição ${med?.numero || ""} aprovada`, mensagem: `Medição da obra "${nome}" foi aprovada.`, tipo: "sucesso" }).catch(() => {});
    if (o?.email_cliente) emailMedicaoAprovada({ obraEmail: o.email_cliente, obraNome: nome, numMedicao: med?.numero, valor: med?.valor }).catch(() => {});
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

  deleteArquivo: async (obraId, arqId, path) => {
    await deletarArquivo(arqId, path);
    set((s) => ({ arquivos: { ...s.arquivos, [obraId]: s.arquivos[obraId].filter((a) => a.id !== arqId) } }));
  },

  marcarCiente: async (obraId, arqId, userId) => {
    await marcarCienteArquivo(arqId);
    set((s) => ({
      arquivos: {
        ...s.arquivos,
        [obraId]: (s.arquivos[obraId] || []).map((a) =>
          a.id === arqId ? { ...a, cientes_uids: [...(a.cientes_uids || []), userId] } : a
        ),
      },
    }));
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
