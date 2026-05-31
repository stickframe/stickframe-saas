import { sb, getEmpresaId } from "../supabase";

const T = "checklists_sf";

export async function listarChecklistObra(obraId) {
  const { data, error } = await sb
    .from(T)
    .select("*")
    .eq("obra_id", obraId)
    .eq("empresa_id", getEmpresaId());
  if (error) throw error;
  return data || [];
}

export async function salvarItemChecklist({ obra_id, etapa, item, status, obs }) {
  const { data, error } = await sb
    .from(T)
    .upsert(
      {
        obra_id,
        etapa,
        item,
        status,
        obs: obs || null,
        empresa_id: getEmpresaId(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "obra_id,etapa,item" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}
