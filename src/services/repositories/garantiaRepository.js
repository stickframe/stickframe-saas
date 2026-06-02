import { sb, getEmpresaId } from "../supabase";

export async function listarChamados(obraId) {
  const { data, error } = await sb
    .from("chamados_garantia")
    .select("*")
    .eq("obra_id", obraId)
    .eq("empresa_id", getEmpresaId())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function adicionarChamado(chamado) {
  const { data, error } = await sb
    .from("chamados_garantia")
    .insert({ ...chamado, empresa_id: getEmpresaId() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function atualizarChamado(id, payload) {
  const { data, error } = await sb
    .from("chamados_garantia")
    .update(payload)
    .eq("id", id)
    .eq("empresa_id", getEmpresaId())
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function excluirChamado(id) {
  const { error } = await sb
    .from("chamados_garantia")
    .delete()
    .eq("id", id)
    .eq("empresa_id", getEmpresaId());
  if (error) throw error;
}
