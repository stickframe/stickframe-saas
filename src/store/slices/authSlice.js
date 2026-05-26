import { sb, setEmpresaId } from "../../services/supabase";

const PERFIL_MAP = {
  "andre@stickframe.com.br":      "diretor",
  "jonathan@stickframe.com.br":   "diretor",
  "vendas@stickframe.com.br":     "comercial",
  "eng@stickframe.com.br":        "engenheiro",
  "financeiro@stickframe.com.br": "financeiro",
};
const NOME_MAP = {
  "andre@stickframe.com.br":      { nome: "André",         cargo: "Diretor Comercial" },
  "jonathan@stickframe.com.br":   { nome: "Jonathan",      cargo: "Diretor" },
  "vendas@stickframe.com.br":     { nome: "Equipe Vendas", cargo: "Consultor" },
  "eng@stickframe.com.br":        { nome: "Engenheiro",    cargo: "Eng. Civil" },
  "financeiro@stickframe.com.br": { nome: "Financeiro",    cargo: "Analista Financeiro" },
};

export const createAuthSlice = (set, get) => ({
  user:      null,
  empresaId: null,

  login: async (email, password) => {
    get().setLoading("auth", true);
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error("E-mail ou senha incorretos.");
      const { data: usuario } = await sb.from("usuarios").select("*").eq("id", data.user.id).single();
      const info   = NOME_MAP[email.toLowerCase()] || { nome: email.split("@")[0], cargo: "Usuário" };
      const perfil = usuario?.perfil || PERFIL_MAP[email.toLowerCase()] || "comercial";
      const empId  = usuario?.empresa_id;
      setEmpresaId(empId);
      set({ user: { email, nome: info.nome, cargo: info.cargo, perfil, uid: data.user.id }, empresaId: empId });
    } finally {
      get().setLoading("auth", false);
    }
  },

  logout: async () => {
    await sb.auth.signOut();
    setEmpresaId(null);
    set({
      user: null, empresaId: null, activePage: "dashboard",
      loaded: { clientes:false, obras:false, orcamentos:false, financeiro:false, contratos:false, diario:{}, medicoes:{}, eventos:false, historico:false, arquivos:{} },
      clientes:[], orcamentos:[], obras:[], financeiro:{}, diario:{}, historico:[], eventos:[], arquivos:{}, medicoes:{}, contratos:[],
    });
  },
});
