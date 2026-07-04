/**
 * StickFEM™ — EngineeringTimelineService: ponto ÚNICO de registro de eventos.
 *
 * Toda a aplicação registra por aqui (nunca escrevendo direto no banco), evitando
 * logging espalhado. É best-effort: falha de persistência NUNCA quebra a UX — o
 * evento normalizado é sempre devolvido (e pode alimentar a UI localmente).
 *
 *   timeline.record(projetoId, { tipo, modulo?, payload, severidade?, hash?,
 *                                usuario?, engineVersion?, descricao?, revisaoId? })
 */
import { normalizarEvento } from "./events";
import { inserirEventoTimeline } from "../repository";

class EngineeringTimeline {
  /**
   * Registra um evento. Persiste em background; devolve o evento normalizado
   * imediatamente para uso otimista na UI.
   */
  record(projetoId, evento) {
    const norm = normalizarEvento(evento);
    if (projetoId) {
      // best-effort: não aguarda nem propaga erro para não travar a ação do usuário
      inserirEventoTimeline(projetoId, norm).catch((e) => {
        if (typeof console !== "undefined") console.warn("[timeline] falha ao persistir:", e?.message || e);
      });
    }
    return norm;
  }
}

export const timeline = new EngineeringTimeline();
