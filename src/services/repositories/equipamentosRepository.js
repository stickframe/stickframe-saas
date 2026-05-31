import { sb, getEmpresaId } from "../supabase";

const T = "equipamentos";

export async function listarEquipamentos() {
  const { data, error } = await sb
    .from(T)
    .select("*, obras(nome)")
    .eq("empresa_id", getEmpresaId())
    .order("nome");
  if (error) throw error;
  return data;
}

export async function adicionarEquipamento(payload) {
  const { data, error } = await sb
    .from(T)
    .insert({ ...payload, empresa_id: getEmpresaId() })
    .select("*, obras(nome)")
    .single();
  if (error) throw error;
  return data;
}

export async function atualizarEquipamento(id, payload) {
  const { data, error } = await sb
    .from(T)
    .update(payload)
    .eq("id", id)
    .select("*, obras(nome)")
    .single();
  if (error) throw error;
  return data;
}

export async function removerEquipamento(id) {
  const { error } = await sb.from(T).delete().eq("id", id);
  if (error) throw error;
}
