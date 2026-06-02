import { create } from "zustand";
import { persist } from "zustand/middleware";

import { createAuthSlice }      from "./slices/authSlice";
import { createClienteSlice }   from "./slices/clienteSlice";
import { createObraSlice }      from "./slices/obraSlice";
import { createFinanceiroSlice} from "./slices/financeiroSlice";
import { createContratoSlice }  from "./slices/contratoSlice";
import { createAgendaSlice }    from "./slices/agendaSlice";
import { createHistoricoSlice }    from "./slices/historicoSlice";
import { createColaboradorSlice }  from "./slices/colaboradorSlice";
import { createVistoriaSlice }     from "./slices/vistoriaSlice";
import { createBimSlice }          from "./slices/bimSlice";
import { createFornecedoresSlice } from "./slices/fornecedoresSlice";

// ─── ESTADO BASE (loading + loaded + activePage) ─────────────────────────────
const createBaseSlice = (set) => ({
  activePage: "dashboard",
  setActivePage: (page) => set({ activePage: page }),

  loading: {
    auth:false, clientes:false, obras:false, orcamentos:false,
    financeiro:false, contratos:false, diario:false, medicoes:false,
    eventos:false, historico:false, arquivos:false, colaboradores:false, fornecedores:false,
  },
  setLoading: (modulo, val) =>
    set((s) => ({ loading: { ...s.loading, [modulo]: val } })),

  loaded: {
    clientes:false, obras:false, orcamentos:false, financeiro:false,
    contratos:false, diario:{}, medicoes:{}, eventos:false, historico:false, arquivos:{}, colaboradores:false, fornecedores:false,
  },
});

// ─── STORE PRINCIPAL — composição de slices ───────────────────────────────────
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
      ...createColaboradorSlice(...a),
      ...createVistoriaSlice(...a),
      ...createBimSlice(...a),
      ...createFornecedoresSlice(...a),
    }),
    {
      name: "stickframe-storage",
      // Persiste só estado de UI — dados do banco são recarregados
      partialize: (s) => ({
        user:      s.user,
        empresaId: s.empresaId,
        // activePage removido: a URL agora é a fonte de verdade da navegação
      }),
    }
  )
);

export default useAppStore;
