import { sb, setEmpresaId } from "../../services/supabase";
import { listarMembrosEmpresa } from "../../services/repositories/obraMembrosRepository";

async function _hydrateUser(set, get, authUser, email) {
  const { data: usuario } = await sb.from("usuarios").select("*").eq("id", authUser.id).single();
  if (!usuario) throw new Error("Usuário não encontrado. Contate o administrador.");
  const empId = usuario.empresa_id;
  setEmpresaId(empId);
  set({
    user: {
      email: email || authUser.email,
      nome:   usuario.nome  || authUser.email.split("@")[0],
      cargo:  usuario.cargo || "Usuário",
      perfil: usuario.perfil || "comercial",
      uid:    authUser.id,
      id:     authUser.id,
    },
    empresaId: empId,
  });
  listarMembrosEmpresa().then((list) => get().setAllObraMembros(list)).catch(() => {});
  import("../services/alertasService").then(({ verificarAlertas }) => {
    verificarAlertas(empId, authUser.id);
  }).catch(() => {});
}

export const createAuthSlice = (set, get) => ({
  user:      null,
  empresaId: null,

  login: async (email, password) => {
    get().setLoading("auth", true);
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error("E-mail ou senha incorretos.");
      await _hydrateUser(set, get, data.user, email);
      return data.session?.refresh_token;
    } finally {
      get().setLoading("auth", false);
    }
  },

  loginWithRefreshToken: async (refreshToken) => {
    get().setLoading("auth", true);
    try {
      const { data, error } = await sb.auth.refreshSession({ refresh_token: refreshToken });
      if (error || !data.user) throw new Error("Sessão expirada. Faça login novamente.");
      await _hydrateUser(set, get, data.user, data.user.email);
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
