import { sb } from "../supabase";

const T = "checkins_obra";

export async function registrarCheckin({ obra_id, nome_operario, funcao }) {
  const { data, error } = await sb
    .from(T)
    .insert({ obra_id, nome_operario, funcao: funcao || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listarCheckinsDia(obraId) {
  const hoje = new Date().toISOString().split("T")[0];
  const { data, error } = await sb
    .from(T)
    .select("*")
    .eq("obra_id", obraId)
    .gte("created_at", hoje + "T00:00:00Z")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listarCheckins(obraId) {
  const { data, error } = await sb
    .from(T)
    .select("*")
    .eq("obra_id", obraId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}
