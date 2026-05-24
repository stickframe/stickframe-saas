import { listarEventos, criarEvento, deletarEvento } from "../../services/repositories/agendaRepository";

export const createAgendaSlice = (set, get) => ({
  eventos: [],

  loadEventos: async () => {
    if (get().loaded.eventos) return;
    get().setLoading("eventos", true);
    try {
      const data = await listarEventos();
      set((s) => ({ eventos: data, loaded: { ...s.loaded, eventos: true } }));
    } finally {
      get().setLoading("eventos", false);
    }
  },

  addEvento: async (evento) => {
    const data = await criarEvento(evento);
    set((s) => ({ eventos: [...s.eventos, data] }));
    get().registrar("cliente", "criado", `Evento agendado: ${evento.titulo} — ${evento.data}`);
  },

  deleteEvento: async (id) => {
    await deletarEvento(id);
    set((s) => ({ eventos: s.eventos.filter((e) => e.id !== id) }));
  },
});
