import { sb as supabase, getEmpresaId } from "../supabase";

export async function listarBimElementos(obraId) {
  const { data } = await supabase
    .from("obra_bim_elementos")
    .select("*")
    .eq("obra_id", obraId);
  return data || [];
}

export async function upsertBimElemento(obraId, elementoId, updates) {
  const empresaId = getEmpresaId();
  const { data, error } = await supabase
    .from("obra_bim_elementos")
    .upsert({
      empresa_id: empresaId,
      obra_id:    obraId,
      elemento_id: elementoId,
      ...updates,
      updated_at: new Date().toISOString(),
    }, { onConflict: "obra_id,elemento_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertBimElementosBatch(obraId, updates) {
  // updates: [{ elementoId, status, qtd_total, qtd_comprada, updated_by }]
  const empresaId = getEmpresaId();
  const rows = updates.map(u => ({
    empresa_id:  empresaId,
    obra_id:     obraId,
    elemento_id: u.elementoId,
    ...(u.status       !== undefined && { status:       u.status }),
    ...(u.qtd_total    !== undefined && { qtd_total:    u.qtd_total }),
    ...(u.qtd_comprada !== undefined && { qtd_comprada: u.qtd_comprada }),
    ...(u.updated_by   !== undefined && { updated_by:   u.updated_by }),
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from("obra_bim_elementos")
    .upsert(rows, { onConflict: "obra_id,elemento_id" });
  if (error) throw error;
}
