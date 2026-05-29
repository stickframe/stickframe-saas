import { sb, getEmpresaId } from "../supabase";

export async function listarNotificacoes(usuarioId) {
  const { data, error } = await sb
    .from("notificacoes")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function criarNotificacao({ usuarioId, titulo, mensagem, tipo = "info" }) {
  const { data, error } = await sb
    .from("notificacoes")
    .insert({ usuario_id: usuarioId, empresa_id: getEmpresaId(), titulo, mensagem, tipo })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function marcarLida(id) {
  const { error } = await sb.from("notificacoes").update({ lida: true }).eq("id", id);
  if (error) throw error;
}

export async function marcarTodasLidas(usuarioId) {
  const { error } = await sb
    .from("notificacoes")
    .update({ lida: true })
    .eq("usuario_id", usuarioId)
    .eq("lida", false);
  if (error) throw error;
}

export function subscribeNotificacoes(usuarioId, callback) {
  return sb
    .channel(`notificacoes-${usuarioId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "notificacoes", filter: `usuario_id=eq.${usuarioId}` }, callback)
    .subscribe();
}
