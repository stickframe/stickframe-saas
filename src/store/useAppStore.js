import { create } from "zustand";

import { createAuthSlice }       from "./slices/authSlice";
import { createClienteSlice }    from "./slices/clienteSlice";
import { createObraSlice }       from "./slices/obraSlice";
import { createFinanceiroSlice } from "./slices/financeiroSlice";
import { createContratoSlice }   from "./slices/contratoSlice";
import { createAgendaSlice }     from "./slices/agendaSlice";
import { createHistoricoSlice }  from "./slices/historicoSlice";

// Lê sessão salva no sessionStorage (sobrevive ao F5, some ao fechar aba)
function lerSessao() {
  try {
    const s = sessionStorage.getItem("sf_session");
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}

const sessao = lerSessao();

const createBaseSlice = (set) => ({
  activePage: sessao.activePage || "dashboard",
  setActivePage: (page) => {
    try { sessionStorage.setItem("sf_session", JSON.stringify({ ...lerSessao(), activePage: page })); } catch {}
    set({ activePage: page });
  },

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

const useAppStore = create((...a) => ({
  ...createBaseSlice(...a),
  ...createAuthSlice(...a),
  ...createClienteSlice(...a),
  ...createObraSlice(...a),
  ...createFinanceiroSlice(...a),
  ...createContratoSlice(...a),
  ...createAgendaSlice(...a),
  ...createHistoricoSlice(...a),
}));

export default useAppStore;
