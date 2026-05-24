import { sb, getEmpresaId } from "./supabase";

export const obraService = {
  async getAll() {
    const { data, error } = await sb
      .from("obras")
      .select("*")
      .eq("empresa_id", getEmpresaId())
      .order("created_at");
    if (error) throw error;
    return data;
  },

  async updateFase(id, fase, progresso) {
    const { data, error } = await sb
      .from("obras")
      .update({ fase, progresso, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Arquivos
  async getArquivos(obraId) {
    const { data, error } = await sb
      .from("arquivos")
      .select("*")
      .eq("obra_id", obraId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async addArquivos(obraId, arquivos) {
    const rows = arquivos.map((a) => ({
      ...a,
      obra_id: obraId,
      empresa_id: getEmpresaId(),
    }));
    const { data, error } = await sb.from("arquivos").insert(rows).select();
    if (error) throw error;
    return data;
  },

  async deleteArquivo(id) {
    const { error } = await sb.from("arquivos").delete().eq("id", id);
    if (error) throw error;
  },

  // Diário
  async getDiario(obraId) {
    const { data, error } = await sb
      .from("diario")
      .select("*")
      .eq("obra_id", obraId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async addDiario(obraId, registro, usuarioId) {
    const { data, error } = await sb
      .from("diario")
      .insert({ ...registro, obra_id: obraId, empresa_id: getEmpresaId(), usuario_id: usuarioId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Medições
  async getMedicoes(obraId) {
    const { data, error } = await sb
      .from("medicoes")
      .select("*")
      .eq("obra_id", obraId)
      .order("numero");
    if (error) throw error;
    return data;
  },

  async addMedicao(obraId, medicao) {
    const { data, error } = await sb
      .from("medicoes")
      .insert({ ...medicao, obra_id: obraId, empresa_id: getEmpresaId() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async aprovarMedicao(id) {
    const { data, error } = await sb
      .from("medicoes")
      .update({ status: "Aprovada" })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Realtime
  subscribeObras(callback) {
    return sb
      .channel("obras-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "obras" }, callback)
      .subscribe();
  },

  subscribeDiario(obraId, callback) {
    return sb
      .channel(`diario-${obraId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "diario",
        filter: `obra_id=eq.${obraId}`,
      }, callback)
      .subscribe();
  },
};
