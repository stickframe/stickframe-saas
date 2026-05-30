import { sb, getEmpresaId } from "../supabase";

export async function listarModelos(obraId) {
  const { data, error } = await sb.from("bim_modelos").select("*").eq("obra_id", obraId).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function criarModelo(modelo) {
  const { data, error } = await sb.from("bim_modelos").insert({ ...modelo, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  return data;
}

export async function deletarModelo(id, storagePath) {
  if (storagePath) await sb.storage.from("bim").remove([storagePath]);
  const { error } = await sb.from("bim_modelos").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadIFC(obraId, empresaId, file) {
  const path = `${empresaId}/${obraId}/${Date.now()}-${file.name}`;
  const { error } = await sb.storage.from("bim").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data: { publicUrl } } = sb.storage.from("bim").getPublicUrl(path);
  return { path, publicUrl };
}

export async function listarApontamentos(obraId) {
  const { data, error } = await sb.from("bim_apontamentos").select("*").eq("obra_id", obraId).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function criarApontamento(apt) {
  const { data, error } = await sb.from("bim_apontamentos").insert({ ...apt, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarApontamento(id, updates) {
  const { data, error } = await sb.from("bim_apontamentos").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deletarApontamento(id) {
  const { error } = await sb.from("bim_apontamentos").delete().eq("id", id);
  if (error) throw error;
}
