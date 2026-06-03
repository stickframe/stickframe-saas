import { sb, getEmpresaId } from "../supabase";

export async function listarMembros(obraId) {
  const { data, error } = await sb
    .from("obra_membros")
    .select("*, usuario:usuarios(id, nome, cargo, perfil)")
    .eq("obra_id", obraId)
    .order("created_at");
  if (error) throw error;
  return data || [];
}

export async function listarMembrosEmpresa() {
  // Returns all obra_membros for the current empresa — used to populate store
  const { data, error } = await sb
    .from("obra_membros")
    .select("obra_id, usuario_id, nivel")
    .in("obra_id", await _getObraIds());
  if (error) throw error;
  return data || [];
}

async function _getObraIds() {
  const { data } = await sb
    .from("obras")
    .select("id")
    .eq("empresa_id", getEmpresaId());
  return (data || []).map((o) => o.id);
}

export async function adicionarMembro(obraId, usuarioId, nivel = "colaborador") {
  const { data: me } = await sb.auth.getUser();
  const { data, error } = await sb
    .from("obra_membros")
    .upsert({ obra_id: obraId, usuario_id: usuarioId, nivel, adicionado_por: me.user?.id })
    .select("*, usuario:usuarios(id, nome, cargo, perfil)")
    .single();
  if (error) throw error;
  return data;
}

export async function removerMembro(obraId, usuarioId) {
  const { error } = await sb
    .from("obra_membros")
    .delete()
    .eq("obra_id", obraId)
    .eq("usuario_id", usuarioId);
  if (error) throw error;
}

export async function atualizarNivel(obraId, usuarioId, nivel) {
  const { data, error } = await sb
    .from("obra_membros")
    .update({ nivel })
    .eq("obra_id", obraId)
    .eq("usuario_id", usuarioId)
    .select("*, usuario:usuarios(id, nome, cargo, perfil)")
    .single();
  if (error) throw error;
  return data;
}
