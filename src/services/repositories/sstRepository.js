import { sb, getEmpresaId } from "../supabase";

// ── DDS ──────────────────────────────────────────────────────────────────────
export async function listarDDS(filters = {}) {
  let q = sb.from("sst_dds")
    .select("*, obra:obras(nome)")
    .eq("empresa_id", getEmpresaId())
    .order("data", { ascending: false });
  if (filters.obra_id) q = q.eq("obra_id", filters.obra_id);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function criarDDS(d) {
  const { data, error } = await sb.from("sst_dds")
    .insert({ ...d, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarDDS(id, updates) {
  const { data, error } = await sb.from("sst_dds").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deletarDDS(id) {
  const { error } = await sb.from("sst_dds").delete().eq("id", id);
  if (error) throw error;
}

// ── Incidentes ───────────────────────────────────────────────────────────────
export async function listarIncidentes(filters = {}) {
  let q = sb.from("sst_incidentes")
    .select("*, obra:obras(nome), colaborador:colaboradores(nome)")
    .eq("empresa_id", getEmpresaId())
    .order("data", { ascending: false });
  if (filters.status) q = q.eq("status", filters.status);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function criarIncidente(d) {
  const { data, error } = await sb.from("sst_incidentes")
    .insert({ ...d, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarIncidente(id, updates) {
  const { data, error } = await sb.from("sst_incidentes").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deletarIncidente(id) {
  const { error } = await sb.from("sst_incidentes").delete().eq("id", id);
  if (error) throw error;
}

// ── EPIs ─────────────────────────────────────────────────────────────────────
export async function listarEpis(filters = {}) {
  let q = sb.from("sst_epis")
    .select("*, colaborador:colaboradores(nome), obra:obras(nome)")
    .eq("empresa_id", getEmpresaId())
    .order("data_entrega", { ascending: false });
  if (filters.colaborador_id) q = q.eq("colaborador_id", filters.colaborador_id);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function criarEpi(d) {
  const { data, error } = await sb.from("sst_epis")
    .insert({ ...d, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarEpi(id, updates) {
  const { data, error } = await sb.from("sst_epis").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deletarEpi(id) {
  const { error } = await sb.from("sst_epis").delete().eq("id", id);
  if (error) throw error;
}
