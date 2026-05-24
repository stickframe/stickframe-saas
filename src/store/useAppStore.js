import { create } from "zustand";

export const useAppStore = create((set) => ({

  // Usuário
  user: null,

  // Dados do sistema
  clientes: [],
  orcamentos: [],
  obras: [],
  contratos: [],
  financeiro: [],
  historico: [],

  // Usuário
  setUser: (user) =>
    set({ user }),

  // Clientes
  setClientes: (clientes) =>
    set({ clientes }),

  adicionarCliente: (novoCliente) =>
    set((state) => ({
      clientes: [
        novoCliente,
        ...state.clientes
      ]
    })),

  // Obras
  setObras: (obras) =>
    set({ obras }),

  adicionarObra: (novaObra) =>
    set((state) => ({
      obras: [
        novaObra,
        ...state.obras
      ]
    })),

  // Contratos
  setContratos: (contratos) =>
    set({ contratos }),

  adicionarContrato: (novoContrato) =>
    set((state) => ({
      contratos: [
        novoContrato,
        ...state.contratos
      ]
    })),

  // Financeiro
  setFinanceiro: (financeiro) =>
    set({ financeiro }),

  // Histórico
  registrar: (tipo, acao, desc) => {

    const agora = new Date();

    set((state)=>({

      historico:[
        {
          id: crypto.randomUUID(),
          tipo,
          acao,
          desc,
          usuario:"André",

          data:agora.toLocaleDateString(
            "pt-BR"
          ),

          hora:agora.toLocaleTimeString(
            "pt-BR",
            {
              hour:"2-digit",
              minute:"2-digit"
            }
          )
        },

        ...state.historico
      ]

    }));

  }

}));