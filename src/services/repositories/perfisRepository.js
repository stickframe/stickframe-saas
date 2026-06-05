import { sb, getEmpresaId } from "../supabase";

export async function listarPerfisCustomizados() {
  const { data, error } = await sb.from("perfis_customizados").select("*").eq("empresa_id", getEmpresaId()).order("nome");
  if (error) throw error;
  return data || [];
}

export async function criarPerfilCustomizado(perfil) {
  const { data, error } = await sb.from("perfis_customizados").insert({ ...perfil, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarPerfilCustomizado(id, updates) {
  const { data, error } = await sb.from("perfis_customizados").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deletarPerfilCustomizado(id) {
  const { error } = await sb.from("perfis_customizados").delete().eq("id", id);
  if (error) throw error;
}
