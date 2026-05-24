import { create } from "zustand";
import { persist } from "zustand/middleware";

import { createAuthSlice }       from "./slices/authSlice";
import { createClienteSlice }    from "./slices/clienteSlice";
import { createObraSlice }       from "./slices/obraSlice";
import { createFinanceiroSlice } from "./slices/financeiroSlice";
import { createContratoSlice }   from "./slices/contratoSlice";
import { createAgendaSlice }     from "./slices/agendaSlice";
import { createHistoricoSlice }  from "./slices/historicoSlice";

const createBaseSlice = (set) => ({
  activePage: "dashboard",
  setActivePage: (page) => set({ activePage: page }),

  loading: {
    auth:false, clientes:false, obras:false, orcamentos:false,
    financeiro:false, contratos:false, diario:false, medicoes:false,
    eventos:false, historico:false, arquivos:false,
  },
  setLoading: (modulo, val) =>
    set((s) => ({ loading: { ...s.loading, [modulo]: val } })),

  loaded: {
    clientes:false, obras:false, orcamentos:false, financeiro:false,
    contratos:false, diario:{}, medicoes:{}, eventos:false, historico:false, arquivos:{},
  },
});

const useAppStore = create(
  persist(
    (...a) => ({
      ...createBaseSlice(...a),
      ...createAuthSlice(...a),
      ...createClienteSlice(...a),
      ...createObraSlice(...a),
      ...createFinanceiroSlice(...a),
      ...createContratoSlice(...a),
      ...createAgendaSlice(...a),
      ...createHistoricoSlice(...a),
    }),
    {
      name: "stickframe-storage",
      // Persiste APENAS user e activePage — nada mais
      partialize: (s) => ({
        user:       s.user       ? { email: s.user.email, nome: s.user.nome, cargo: s.user.cargo, perfil: s.user.perfil, uid: s.user.uid } : null,
        empresaId:  s.empresaId,
        activePage: s.activePage,
      }),
    }
  )
);

export default useAppStore;
