import { sb, getEmpresaId } from "../supabase";

export async function listarEventos() {
  const { data, error } = await sb.from("eventos").select("*").eq("empresa_id", getEmpresaId()).order("data");
  if (error) throw error;
  return data;
}
export async function criarEvento(evento) {
  const { data, error } = await sb.from("eventos").insert({ ...evento, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  return data;
}
export async function deletarEvento(id) {
  const { error } = await sb.from("eventos").delete().eq("id", id);
  if (error) throw error;
}
