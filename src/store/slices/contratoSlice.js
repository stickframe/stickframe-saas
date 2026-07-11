import { listarContratos, criarContrato, atualizarContrato, deletarContrato } from "../../services/repositories/contratoRepository";
import { listarOrcamentos, criarOrcamento, atualizarOrcamento, deletarOrcamento } from "../../services/repositories/orcamentoRepository";
import { criarStickFlow, atualizarStickFlow } from "../../services/repositories/stickflowRepository";
import { eventBus } from "../../services/eventBus/eventBus";
import { EVENT_TYPES, ORIGIN_MODULES, VISIBILITY_LEVELS } from "../../utils/eventTypes";

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

  updateContrato: async (id, updates) => {
    const anterior = get().contratos.find((c) => c.id === id);
    set((s) => ({ contratos: s.contratos.map((c) => c.id === id ? { ...c, ...updates } : c) }));
    try {
      const data = await atualizarContrato(id, updates);
      set((s) => ({ contratos: s.contratos.map((c) => c.id === id ? data : c) }));
      get().registrar("contrato", "editado", `Contrato atualizado`);
    } catch (e) {
      set((s) => ({ contratos: s.contratos.map((c) => c.id === id ? anterior : c) }));
      throw e;
    }
  },

  deleteContrato: async (id) => {
    const c = get().contratos.find((x) => x.id === id);
    set((s) => ({ contratos: s.contratos.filter((x) => x.id !== id) }));
    try {
      await deletarContrato(id);
      get().registrar("contrato", "deletado", `Contrato ${c?.ref} removido`);
    } catch (e) {
      set((s) => ({ contratos: [c, ...s.contratos] }));
      throw e;
    }
  },

  loadOrcamentos: async (force = false) => {
    if (get().loaded.orcamentos && !force) return;
    get().setLoading("orcamentos", true);
    try {
      const data = await listarOrcamentos();
      set((s) => ({ orcamentos: data, loaded: { ...s.loaded, orcamentos: true } }));

      // Fase 3: Carregar StickFlows em paralelo
      await get().loadStickFlows();
    } finally {
      get().setLoading("orcamentos", false);
    }
  },

  addOrcamento: async (o) => {
    // Vincular o orçamento ao StickFlow correspondente antes da criação
    const sf = get().stickflows?.find((sf) => sf.cliente_id === o.cliente_id);
    if (sf) {
      o.stickflow_id = sf.id;
    }

    const data = await criarOrcamento(o);
    set((s) => ({ orcamentos: [data, ...s.orcamentos] }));
    get().registrar("orcamento", "criado", `Orçamento ${o.ref} gerado para ${o.cliente}`);

    // Fase 3: Atualizar status do StickFlow e publicar evento
    if (sf) {
      try {
        let novoStatus = sf.status;
        if (sf.status === 'CAPTACAO' || sf.status === 'QUALIFICACAO') {
          novoStatus = 'ORCAMENTO';
        }
        const sfAtualizado = await atualizarStickFlow(sf.id, { 
          status: novoStatus, 
          orcamento_id: data.id 
        });
        set((s) => ({ stickflows: (s.stickflows || []).map((x) => x.id === sf.id ? sfAtualizado : x) }));

        await eventBus.publish({
          type: EVENT_TYPES.ORCAMENTO_ENVIADO,
          stickflowId: sf.id,
          payload: { orcamento_id: data.id, valor: data.valor, ref: data.ref },
          originModule: ORIGIN_MODULES.ORCAMENTOS,
          visibility: VISIBILITY_LEVELS.COMERCIAL,
          descricao: `Orçamento ${data.ref} enviado para o cliente ${data.cliente}`
        });
      } catch (err) {
        console.error("[contratoSlice] Erro ao criar eventos ou atualizar stickflow em addOrcamento:", err);
      }
    }
  },

  updateOrcamento: async (id, updates) => {
    const anterior = get().orcamentos.find((o) => o.id === id);
    const data = await atualizarOrcamento(id, updates);
    set((s) => ({ orcamentos: s.orcamentos.map((o) => (o.id === id ? data : o)) }));
    get().registrar("orcamento", "editado", `Orçamento editado`);

    // Fase 3: Tratar alterações de status e publicar eventos
    if (updates.status && updates.status !== anterior?.status) {
      try {
        const stickflowId = data.stickflow_id || anterior?.stickflow_id || get().stickflows?.find((sf) => sf.cliente_id === data.cliente_id)?.id;
        if (stickflowId) {
          let eventType = EVENT_TYPES.ORCAMENTO_ENVIADO; // fallback
          let novoStatus = null;
          let vis = VISIBILITY_LEVELS.COMERCIAL;
          let desc = `Orçamento ${data.ref} atualizado para status ${updates.status}`;

          if (updates.status === 'Aprovado' || updates.status === 'Aceito') {
            eventType = EVENT_TYPES.ORCAMENTO_APROVADO;
            novoStatus = 'NEGOCIACAO';
            vis = VISIBILITY_LEVELS.CLIENTE;
            desc = `Orçamento ${data.ref} aprovado pelo cliente`;
          } else if (updates.status === 'Rejeitado') {
            eventType = 'ORCAMENTO_REJEITADO'; // Usar string literal
            desc = `Orçamento ${data.ref} rejeitado pelo cliente`;
          }

          if (novoStatus) {
            const sfAtualizado = await atualizarStickFlow(stickflowId, { status: novoStatus });
            set((s) => ({ stickflows: (s.stickflows || []).map((x) => x.id === stickflowId ? sfAtualizado : x) }));
          }

          await eventBus.publish({
            type: eventType,
            stickflowId,
            payload: { orcamento_id: id, status_anterior: anterior?.status, novo_status: updates.status },
            originModule: ORIGIN_MODULES.ORCAMENTOS,
            visibility: vis,
            descricao: desc
          });
        }
      } catch (err) {
        console.error("[contratoSlice] Erro ao tratar eventos de status em updateOrcamento:", err);
      }
    }
  },

  deleteOrcamento: async (id) => {
    const o = get().orcamentos.find((x) => x.id === id);
    await deletarOrcamento(id);
    set((s) => ({ orcamentos: s.orcamentos.filter((x) => x.id !== id) }));
    get().registrar("orcamento", "deletado", `Orçamento ${o?.ref} removido`);
  },
});
