import { sb, getEmpresaId } from "./supabase";

export const orcamentoService = {
  async getAll() {
    const { data, error } = await sb
      .from("orcamentos")
      .select("*")
      .eq("empresa_id", getEmpresaId())
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(orcamento) {
    const { data, error } = await sb
      .from("orcamentos")
      .insert({ ...orcamento, empresa_id: getEmpresaId() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await sb
      .from("orcamentos")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await sb.from("orcamentos").delete().eq("id", id);
    if (error) throw error;
  },
};
