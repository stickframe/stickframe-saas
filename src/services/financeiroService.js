import { sb, getEmpresaId } from "./supabase";

export const financeiroService = {
  async getLancamentos(obraId) {
    const { data, error } = await sb
      .from("financeiro")
      .select("*")
      .eq("obra_id", obraId)
      .order("created_at");
    if (error) throw error;
    return data;
  },

  async addLancamento(obraId, lancamento) {
    const { data, error } = await sb
      .from("financeiro")
      .insert({ ...lancamento, obra_id: obraId, empresa_id: getEmpresaId() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
