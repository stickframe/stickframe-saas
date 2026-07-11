import { listarClientes, criarCliente, atualizarCliente, deletarCliente, importarClientes } from "../../services/repositories/clienteRepository";
import { criarStickFlow, atualizarStickFlow } from "../../services/repositories/stickflowRepository";
import { eventBus } from "../../services/eventBus/eventBus";
import { EVENT_TYPES, ORIGIN_MODULES, VISIBILITY_LEVELS } from "../../utils/eventTypes";

export const createClienteSlice = (set, get) => ({
  clientes: [],

  loadClientes: async () => {
    if (get().loaded.clientes) return;
    get().setLoading("clientes", true);
    try {
      const data = await listarClientes();
      set((s) => ({ clientes: data, loaded: { ...s.loaded, clientes: true } }));
      
      // Fase 3: Carregar StickFlows em paralelo
      await get().loadStickFlows();
    } finally {
      get().setLoading("clientes", false);
    }
  },

  addCliente: async (c) => {
    const data = await criarCliente(c);
    set((s) => ({ clientes: [...s.clientes, data] }));
    get().registrar("cliente", "criado", `Cliente ${c.nome} cadastrado`);
    
    // Fase 3: Criar StickFlow automático para o Lead cadastrado
    try {
      const sf = await criarStickFlow({
        cliente_id: data.id,
        nome: `Jornada - ${data.nome}`,
        status: 'CAPTACAO',
        origem: data.origem || 'manual',
        progresso: 0
      });
      
      set((s) => ({ stickflows: [...(s.stickflows || []), sf] }));

      // Publicar evento LEAD_CRIADO no barramento
      await eventBus.publish({
        type: EVENT_TYPES.LEAD_CRIADO,
        stickflowId: sf.id,
        payload: { cliente_id: data.id, nome: data.nome, status: data.status },
        originModule: ORIGIN_MODULES.CRM,
        visibility: VISIBILITY_LEVELS.INTERNO,
        descricao: `Lead ${data.nome} cadastrado no CRM`
      });
    } catch (err) {
      console.error("[clienteSlice] Erro ao criar StickFlow ou publicar evento LEAD_CRIADO:", err);
    }

    return data;
  },

  updateCliente: async (id, updates) => {
    const anterior = get().clientes.find((c) => c.id === id);
    // Optimistic update
    set((s) => ({ clientes: s.clientes.map((c) => c.id === id ? { ...c, ...updates } : c) }));
    try {
      const data = await atualizarCliente(id, updates);
      set((s) => ({ clientes: s.clientes.map((c) => c.id === id ? data : c) }));
      get().registrar("cliente", "editado", `Cliente ${updates.nome || anterior?.nome} atualizado`);

      // Fase 3: Atualizar status do StickFlow e publicar evento LEAD_CONVERTIDO se status mudar para Fechado/Execução
      if (updates.status && updates.status !== anterior?.status) {
        try {
          const sf = get().stickflows?.find((sf) => sf.cliente_id === id);
          if (sf) {
            let novoStatus = sf.status;
            let eventType = EVENT_TYPES.LEAD_SCORE_ALTERADO; // fallback
            let desc = `Lead ${data.nome} atualizado para status ${updates.status}`;
            let vis = VISIBILITY_LEVELS.INTERNO;
            
            if (updates.status === 'Fechado' || updates.status === 'Em execução') {
              novoStatus = 'CONTRATO';
              eventType = EVENT_TYPES.LEAD_CONVERTIDO;
              desc = `Lead ${data.nome} convertido em Cliente/Contrato`;
              vis = VISIBILITY_LEVELS.CLIENTE;
            }

            const sfAtualizado = await atualizarStickFlow(sf.id, { status: novoStatus });
            set((s) => ({ stickflows: s.stickflows.map((x) => x.id === sf.id ? sfAtualizado : x) }));

            await eventBus.publish({
              type: eventType,
              stickflowId: sf.id,
              payload: { cliente_id: id, status_anterior: anterior.status, novo_status: updates.status },
              originModule: ORIGIN_MODULES.CRM,
              visibility: vis,
              descricao: desc
            });
          }
        } catch (err) {
          console.error("[clienteSlice] Erro ao atualizar StickFlow ou publicar evento no updateCliente:", err);
        }
      }
    } catch (e) {
      set((s) => ({ clientes: s.clientes.map((c) => c.id === id ? anterior : c) }));
      throw e;
    }
  },

  deleteCliente: async (id) => {
    const c = get().clientes.find((x) => x.id === id);
    if (!c) return;

    // Capture undo snapshot before deleting
    const { push } = (await import("../undoStore")).useUndoStore.getState();
    push(`Cliente "${c.nome}"`, async () => {
      const { error } = await (await import("../../services/supabase")).sb.from("clientes").upsert(c);
      if (!error) set((s) => ({ clientes: [c, ...s.clientes] }));
    });

    // Optimistic remove
    set((s) => ({ clientes: s.clientes.filter((x) => x.id !== id) }));
    try {
      await deletarCliente(id);
      get().registrar("cliente", "deletado", `Cliente ${c?.nome} removido`);
    } catch (e) {
      set((s) => ({ clientes: [c, ...s.clientes] }));
      throw e;
    }
  },

  importClientes: async (lista) => {
    const data = await importarClientes(lista);
    set((s) => ({ clientes: [...s.clientes, ...data] }));
    get().registrar("cliente", "criado", `${data.length} clientes importados via CSV`);
    return data;
  },
});
