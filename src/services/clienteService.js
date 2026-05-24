import { sb, getEmpresaId } from "./supabase";

const TABLE = "clientes";

export const clienteService = {
  async getAll() {
    const { data, error } = await sb
      .from(TABLE)
      .select("*")
      .eq("empresa_id", getEmpresaId())
      .order("created_at");
    if (error) throw error;
    return data;
  },

  async create(cliente) {
    const { data, error } = await sb
      .from(TABLE)
      .insert({ ...cliente, empresa_id: getEmpresaId() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await sb
      .from(TABLE)
      .update({ ...updates, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await sb.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  },
};
