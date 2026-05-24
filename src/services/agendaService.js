import { sb, getEmpresaId } from "./supabase";

export const agendaService = {
  async getAll() {
    const { data, error } = await sb
      .from("eventos")
      .select("*")
      .eq("empresa_id", getEmpresaId())
      .order("data");
    if (error) throw error;
    return data;
  },

  async create(evento) {
    const { data, error } = await sb
      .from("eventos")
      .insert({ ...evento, empresa_id: getEmpresaId() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await sb.from("eventos").delete().eq("id", id);
    if (error) throw error;
  },
};
