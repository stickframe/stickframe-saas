// 
// StickFrame Event Bus Service Vanilla SDK
// 

import { sb, getEmpresaId } from "../supabase";
import { EVENT_TYPES, ORIGIN_MODULES, VISIBILITY_LEVELS } from "../../utils/eventTypes";

// Helper para gerar UUIDv4 simples caso crypto.randomUUID não esteja disponível
function generateUUID() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

class EventBusService {
  listeners = {};

  subscribe(eventType, callback) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(callback);
    return () => this.unsubscribe(eventType, callback);
  }

  unsubscribe(eventType, callback) {
    if (!this.listeners[eventType]) return;
    this.listeners[eventType] = this.listeners[eventType].filter(cb => cb !== callback);
  }

  async publish({
    type,
    stickflowId,
    payload = {},
    originModule,
    visibility = 'INTERNO',
    correlationId = null,
    eventVersion = 1,
    descricao = ''
  }) {
    try {
      // 1. Validar inputs básicos
      if (!EVENT_TYPES[type]) {
        console.error(`[EventBus] Tipo de evento inválido: ${type}`);
        return null;
      }
      if (!ORIGIN_MODULES[originModule]) {
        console.error(`[EventBus] Módulo de origem inválido: ${originModule}`);
        return null;
      }
      if (!VISIBILITY_LEVELS[visibility]) {
        console.error(`[EventBus] Nível de visibilidade inválido: ${visibility}`);
        return null;
      }

      // 2. Obter ID da empresa (multitenancy)
      const empresaId = getEmpresaId();
      if (!empresaId) {
        console.error("[EventBus] ID da empresa não encontrado.");
        return null;
      }

      // 3. Obter ID do usuário autenticado no momento
      const { data: { session } } = await sb.auth.getSession();
      const usuarioId = session?.user?.id || null;

      // 4. Garantir Correlation ID
      const finalCorrelationId = correlationId || generateUUID();

      const eventData = {
        empresa_id: empresaId,
        stickflow_id: stickflowId,
        evento_tipo: type,
        origem: originModule,
        usuario_id: usuarioId,
        visibilidade: visibility,
        payload,
        correlation_id: finalCorrelationId,
        event_version: eventVersion,
        descricao: descricao || `${type} disparado por ${originModule}`
      };

      // 5. Persistir na base de dados (tabela stickflow_eventos)
      const { data, error } = await sb
        .from("stickflow_eventos")
        .insert(eventData)
        .select()
        .single();

      if (error) {
        console.error("[EventBus] Erro ao persistir evento no Supabase:", error);
        return null;
      }

      // 6. Emitir para listeners locais em memória no frontend
      const eventCallbacks = this.listeners[type] || [];
      const globalCallbacks = this.listeners["*"] || [];

      [...eventCallbacks, ...globalCallbacks].forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[EventBus] Erro ao rodar callback local para evento ${type}:`, err);
        }
      });

      return data;
    } catch (err) {
      console.error("[EventBus] Erro inesperado no barramento de eventos:", err);
      return null;
    }
  }
}

export const eventBus = new EventBusService();
