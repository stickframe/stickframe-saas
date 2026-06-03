import { sb, setEmpresaId } from "../../services/supabase";
import { listarMembrosEmpresa } from "../../services/repositories/obraMembrosRepository";

export const createAuthSlice = (set, get) => ({
  user:      null,
  empresaId: null,

  login: async (email, password) => {
    get().setLoading("auth", true);
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error("E-mail ou senha incorretos.");
      const { data: usuario } = await sb.from("usuarios").select("*").eq("id", data.user.id).single();
      if (!usuario) throw new Error("Usuário não encontrado. Contate o administrador.");
      const empId = usuario.empresa_id;
      setEmpresaId(empId);
      set({
        user: {
          email,
          nome:   usuario.nome  || email.split("@")[0],
          cargo:  usuario.cargo || "Usuário",
          perfil: usuario.perfil || "comercial",
          uid:    data.user.id,
          id:     data.user.id,
        },
        empresaId: empId,
      });
      // Carrega memberships de obras em background
      listarMembrosEmpresa().then((list) => get().setAllObraMembros(list)).catch(() => {});
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
