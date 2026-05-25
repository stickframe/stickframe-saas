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

function lerSessao() {
  try { return JSON.parse(sessionStorage.getItem("sf_session") || "{}"); } catch { return {}; }
}
function salvarSessao(dados) {
  try { sessionStorage.setItem("sf_session", JSON.stringify({ ...lerSessao(), ...dados })); } catch {}
}

const sessao = lerSessao();

// Restaura empresaId na memória do supabase.js ao iniciar
if (sessao.empresaId) setEmpresaId(sessao.empresaId);

export const createAuthSlice = (set, get) => ({
  user:      sessao.user || null,
  empresaId: sessao.empresaId || null,

  // Responsabilidade única: atualiza store + supabase.js + sessão
  setEmpresa: (id) => {
    setEmpresaId(id);                    // supabase.js em memória
    salvarSessao({ empresaId: id });     // sessionStorage
    set({ empresaId: id });              // store
  },

  login: async (email, password) => {
    get().setLoading("auth", true);
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error("E-mail ou senha incorretos.");

      const { data: usuario } = await sb
        .from("usuarios")
        .select("empresa_id, perfil")
        .eq("id", data.user.id)
        .single();

      const info   = NOME_MAP[email.toLowerCase()] || { nome: email.split("@")[0], cargo: "Usuário" };
      const perfil = usuario?.perfil || PERFIL_MAP[email.toLowerCase()] || "comercial";
      const empId  = usuario?.empresa_id;

      const user = { email, nome: info.nome, cargo: info.cargo, perfil, uid: data.user.id };

      // Usa setEmpresa para sincronizar tudo de uma vez
      get().setEmpresa(empId);
      salvarSessao({ user });
      set({ user });
    } finally {
      get().setLoading("auth", false);
    }
  },

  logout: async () => {
    await sb.auth.signOut();
    setEmpresaId(null);
    sessionStorage.removeItem("sf_session");
    set({
      user: null, empresaId: null, activePage: "dashboard",
      loaded: {
        clientes:false, obras:false, orcamentos:false, financeiro:false,
        contratos:false, diario:{}, medicoes:{}, eventos:false, historico:false, arquivos:{},
      },
      clientes:[], orcamentos:[], obras:[], financeiro:{}, diario:{},
      historico:[], eventos:[], arquivos:{}, medicoes:{}, contratos:[],
    });
  },
});
