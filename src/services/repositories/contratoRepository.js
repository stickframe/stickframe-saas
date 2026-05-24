import { sb, getEmpresaId, restoreEmpresaId } from "../supabase";

async function empresaId() {
  return await empresaId() || await restoreEmpresaId();
}

export async function listarContratos() {
  const { data, error } = await sb.from("contratos").select("*").eq("empresa_id", await empresaId()).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function criarContrato(contrato) {
  const { data, error } = await sb.from("contratos").insert({ ...contrato, empresa_id: await empresaId() }).select().single();
  if (error) throw error;
  return data;
}
