import { sb, getEmpresaId } from "../supabase";

export async function listarComentarios(entidade, entidadeId) {
  const { data, error } = await sb
    .from("comentarios")
    .select("*, usuario:usuarios(id, nome, perfil)")
    .eq("entidade", entidade)
    .eq("entidade_id", entidadeId)
    .order("created_at");
  if (error) throw error;
  return data || [];
}

export async function adicionarComentario(entidade, entidadeId, texto, parentId = null) {
  const { data: me } = await sb.auth.getUser();
  const { data, error } = await sb
    .from("comentarios")
    .insert({
      empresa_id: getEmpresaId(),
      entidade, entidade_id: entidadeId,
      texto, parent_id: parentId,
      usuario_id: me.user.id,
    })
    .select("*, usuario:usuarios(id, nome, perfil)")
    .single();
  if (error) throw error;
  return data;
}

export async function editarComentario(id, texto) {
  const { data, error } = await sb
    .from("comentarios")
    .update({ texto, editado: true })
    .eq("id", id)
    .select("*, usuario:usuarios(id, nome, perfil)")
    .single();
  if (error) throw error;
  return data;
}

export async function deletarComentario(id) {
  const { error } = await sb.from("comentarios").delete().eq("id", id);
  if (error) throw error;
}
