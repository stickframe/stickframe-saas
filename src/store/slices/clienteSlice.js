import { listarClientes, criarCliente, atualizarCliente, deletarCliente, importarClientes } from "../../services/repositories/clienteRepository";

export const createClienteSlice = (set, get) => ({
  clientes: [],

  loadClientes: async () => {
    if (get().loaded.clientes) return;
    get().setLoading("clientes", true);
    try {
      const data = await listarClientes();
      set((s) => ({ clientes: data, loaded: { ...s.loaded, clientes: true } }));
    } finally {
      get().setLoading("clientes", false);
    }
  },

  addCliente: async (c) => {
    const data = await criarCliente(c);
    set((s) => ({ clientes: [...s.clientes, data] }));
    get().registrar("cliente", "criado", `Cliente ${c.nome} cadastrado`);
  },

  updateCliente: async (id, updates) => {
    const anterior = get().clientes.find((c) => c.id === id);
    // Optimistic update
    set((s) => ({ clientes: s.clientes.map((c) => c.id === id ? { ...c, ...updates } : c) }));
    try {
      const data = await atualizarCliente(id, updates);
      set((s) => ({ clientes: s.clientes.map((c) => c.id === id ? data : c) }));
      get().registrar("cliente", "editado", `Cliente ${updates.nome || anterior?.nome} atualizado`);
    } catch (e) {
      set((s) => ({ clientes: s.clientes.map((c) => c.id === id ? anterior : c) }));
      throw e;
    }
  },

  deleteCliente: async (id) => {
    const c = get().clientes.find((x) => x.id === id);
    // Optimistic remove
    set((s) => ({ clientes: s.clientes.filter((x) => x.id !== id) }));
    try {
      await deletarCliente(id);
      get().registrar("cliente", "deletado", `Cliente ${c?.nome} removido`);
    } catch (e) {
      set((s) => ({ clientes: [c, ...s.clientes] }));
      throw e;
    }
  },

  importClientes: async (lista) => {
    const data = await importarClientes(lista);
    set((s) => ({ clientes: [...s.clientes, ...data] }));
    get().registrar("cliente", "criado", `${data.length} clientes importados via CSV`);
    return data;
  },
});
