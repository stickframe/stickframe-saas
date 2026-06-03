import { sb, getEmpresaId } from "../supabase";

export const EVENTOS_DISPONIVEIS = [
  { value: "obra.fase_avancada",      label: "Fase da obra avançada" },
  { value: "medicao.aprovada",        label: "Medição aprovada" },
  { value: "contrato.assinado",       label: "Contrato assinado" },
  { value: "orcamento.aprovado",      label: "Orçamento aprovado" },
  { value: "change_order.aprovado",   label: "Aditivo aprovado" },
  { value: "obra.concluida",          label: "Obra concluída" },
  { value: "cliente.criado",          label: "Novo cliente cadastrado" },
];

export async function listarWebhooks() {
  const { data, error } = await sb.from("webhooks").select("*").eq("empresa_id", getEmpresaId()).order("created_at");
  if (error) throw error;
  return data || [];
}

export async function criarWebhook(payload) {
  const segredo = crypto.randomUUID().replace(/-/g, "");
  const { data, error } = await sb
    .from("webhooks")
    .insert({ ...payload, empresa_id: getEmpresaId(), segredo })
    .select().single();
  if (error) throw error;
  return data;
}

export async function atualizarWebhook(id, updates) {
  const { data, error } = await sb.from("webhooks").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deletarWebhook(id) {
  const { error } = await sb.from("webhooks").delete().eq("id", id);
  if (error) throw error;
}

export async function listarLogs(webhookId) {
  const { data, error } = await sb
    .from("webhook_logs")
    .select("*")
    .eq("webhook_id", webhookId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}

// Called internally after key events — dispatches to all active webhooks for the evento
export async function dispararWebhook(evento, payload) {
  try {
    const { data: hooks } = await sb
      .from("webhooks")
      .select("*")
      .eq("empresa_id", getEmpresaId())
      .eq("ativo", true)
      .contains("eventos", [evento]);
    if (!hooks?.length) return;
    await Promise.allSettled(hooks.map((h) => fetch(h.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-StickFrame-Event": evento, "X-StickFrame-Secret": h.segredo || "" },
      body: JSON.stringify({ evento, timestamp: new Date().toISOString(), ...payload }),
    }).then(async (r) => {
      await sb.from("webhook_logs").insert({ webhook_id: h.id, evento, payload, status_code: r.status });
    }).catch(async (e) => {
      await sb.from("webhook_logs").insert({ webhook_id: h.id, evento, payload, erro: e.message });
    })));
  } catch (_) {}
}
