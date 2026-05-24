import { listarClientes, criarCliente, atualizarCliente, deletarCliente } from "../../services/repositories/clienteRepository";

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
    const data = await atualizarCliente(id, updates);
    set((s) => ({ clientes: s.clientes.map((c) => (c.id === id ? data : c)) }));
    get().registrar("cliente", "editado", `Cliente ${updates.nome} atualizado`);
  },

  deleteCliente: async (id) => {
    const c = get().clientes.find((x) => x.id === id);
    await deletarCliente(id);
    set((s) => ({ clientes: s.clientes.filter((x) => x.id !== id) }));
    get().registrar("cliente", "deletado", `Cliente ${c?.nome} removido`);
  },
});
