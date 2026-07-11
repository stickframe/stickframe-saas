import { sb, getEmpresaId } from "../supabase";

/**
 * Retorna todo o histórico de transições de status de um Lead específico.
 */
export async function listarHistoricoLead(leadId) {
  const { data, error } = await sb
    .from("lead_historico")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Adiciona um novo registro de transição de status no histórico do Lead.
 */
export async function adicionarHistoricoLead(leadId, statusAnterior, statusNovo, observacao = "", usuarioNome, tipo = "status_change", meta = {}) {
  const { data, error } = await sb
    .from("lead_historico")
    .insert({
      lead_id: leadId,
      empresa_id: getEmpresaId(),
      usuario: usuarioNome || "Sistema",
      status_anterior: statusAnterior,
      status_novo: statusNovo,
      observacao,
      tipo,
      meta,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
