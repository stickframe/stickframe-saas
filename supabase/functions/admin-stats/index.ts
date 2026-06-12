import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = [
  "andrequeirozcandido@gmail.com",
  "andre@stickframe.com.br",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) throw new Error("Acesso negado");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Busca todas as empresas
    const { data: empresas, error: errEmpresas } = await supabaseAdmin
      .from("empresas")
      .select("id, nome, plano, created_at, limite_obras, trial_ends_at, lead_origem, asaas_customer_id")
      .order("created_at", { ascending: false });
    if (errEmpresas) throw errEmpresas;

    // Busca obras ativas por empresa
    const { data: obrasAtivas } = await supabaseAdmin
      .from("obras")
      .select("empresa_id")
      .not("status", "eq", "Concluída")
      .not("status", "eq", "Cancelada");

    // Todas as obras e orçamentos (para o funil de ativação)
    const { data: todasObras } = await supabaseAdmin.from("obras").select("empresa_id");
    const { data: orcamentos } = await supabaseAdmin.from("orcamentos").select("empresa_id");

    // Busca usuários por empresa (com nome/perfil para identificar o contato)
    const { data: usuarios } = await supabaseAdmin
      .from("usuarios")
      .select("id, empresa_id, nome, perfil");

    // E-mails vêm do auth (não existem em public.usuarios)
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap: Record<string, string> = {};
    const lastSignInMap: Record<string, string> = {};
    for (const au of authList?.users ?? []) {
      emailMap[au.id] = au.email ?? "";
      if (au.last_sign_in_at) lastSignInMap[au.id] = au.last_sign_in_at;
    }

    // Monta contadores por empresa
    const obrasMap: Record<string, number> = {};
    for (const o of obrasAtivas ?? []) {
      obrasMap[o.empresa_id] = (obrasMap[o.empresa_id] ?? 0) + 1;
    }

    const usuariosMap: Record<string, number> = {};
    const contatoMap: Record<string, { nome: string; email: string }> = {};
    const ultimoLoginMap: Record<string, number> = {};
    for (const u of usuarios ?? []) {
      usuariosMap[u.empresa_id] = (usuariosMap[u.empresa_id] ?? 0) + 1;
      // Primeiro diretor encontrado vira o contato da empresa
      if (u.perfil === "diretor" && !contatoMap[u.empresa_id]) {
        contatoMap[u.empresa_id] = { nome: u.nome, email: emailMap[u.id] ?? "" };
      }
      const ls = lastSignInMap[u.id] ? new Date(lastSignInMap[u.id]).getTime() : 0;
      if (ls > (ultimoLoginMap[u.empresa_id] ?? 0)) ultimoLoginMap[u.empresa_id] = ls;
    }

    const empresasComOrcSet = new Set((orcamentos ?? []).map((o) => o.empresa_id));

    const result = (empresas ?? []).map((e) => {
      const loginRecente = (Date.now() - (ultimoLoginMap[e.id] ?? 0)) <= 7 * 86400_000;
      const obraAtiva    = (obrasMap[e.id] ?? 0) > 0;
      const fezOrc       = empresasComOrcSet.has(e.id);
      const multiUser    = (usuariosMap[e.id] ?? 0) > 1;
      // Health Score: engajamento da empresa (risco de churn abaixo de 30)
      const health =
        (loginRecente ? 40 : 0) +
        (obraAtiva    ? 25 : 0) +
        (fezOrc       ? 20 : 0) +
        (multiUser    ? 15 : 0);
      return {
        ...e,
        obras_ativas: obrasMap[e.id] ?? 0,
        total_usuarios: usuariosMap[e.id] ?? 0,
        contato_nome: contatoMap[e.id]?.nome ?? null,
        contato_email: contatoMap[e.id]?.email ?? null,
        trial_ativo: e.plano === "free" && e.trial_ends_at && new Date(e.trial_ends_at) > new Date(),
        health,
        ultimo_login: ultimoLoginMap[e.id] ? new Date(ultimoLoginMap[e.id]).toISOString() : null,
      };
    });

    const totals = {
      total: result.length,
      free: result.filter((e) => e.plano === "free").length,
      pro: result.filter((e) => e.plano === "pro").length,
    };

    // ── Crescimento ──────────────────────────────────────────────────────────
    const agora = Date.now();
    const diaMs = 86400_000;
    const hojeInicio = new Date(); hojeInicio.setHours(0, 0, 0, 0);
    const crescimento = {
      hoje:   result.filter((e) => new Date(e.created_at) >= hojeInicio).length,
      semana: result.filter((e) => agora - new Date(e.created_at).getTime() <= 7 * diaMs).length,
      mes:    result.filter((e) => agora - new Date(e.created_at).getTime() <= 30 * diaMs).length,
      conversao: totals.total > 0 ? Math.round((totals.pro / totals.total) * 1000) / 10 : 0,
      trials_ativos: result.filter((e) => e.trial_ativo).length,
      trials_vencendo_7d: result.filter((e) =>
        e.trial_ativo && new Date(e.trial_ends_at).getTime() - agora <= 7 * diaMs
      ).length,
      trials_expirados: result.filter((e) =>
        e.plano === "free" && e.trial_ends_at && new Date(e.trial_ends_at).getTime() < agora
      ).length,
    };

    // ── Funil de ativação ────────────────────────────────────────────────────
    const empresasComObra = new Set((todasObras ?? []).map((o) => o.empresa_id));
    const empresasComOrc  = new Set((orcamentos ?? []).map((o) => o.empresa_id));
    const funil = {
      criou_conta:     totals.total,
      criou_obra:      result.filter((e) => empresasComObra.has(e.id)).length,
      fez_orcamento:   result.filter((e) => empresasComOrc.has(e.id)).length,
      convidou_usuario: result.filter((e) => e.total_usuarios > 1).length,
      virou_pro:       totals.pro,
    };

    // ── Origem dos leads ─────────────────────────────────────────────────────
    const origens: Record<string, number> = {};
    for (const e of result) {
      const o = e.lead_origem || "desconhecida";
      origens[o] = (origens[o] ?? 0) + 1;
    }

    // ── MRR + estado das assinaturas via Asaas ───────────────────────────────
    let asaas: {
      mrr: number; arr: number; pagantes: number; inadimplentes: number;
    } | null = null;
    // Estado por empresa: trial | pago | inadimplente | aguardando | null
    const estadoMap: Record<string, { assinatura: string; cobranca: string }> = {};
    const asaasKey = Deno.env.get("ASAAS_API_KEY");
    if (asaasKey) {
      try {
        const headers = { "access_token": asaasKey };
        const [subsRes, overdueRes, paidRes] = await Promise.all([
          fetch("https://www.asaas.com/api/v3/subscriptions?limit=100", { headers }),
          fetch("https://www.asaas.com/api/v3/payments?status=OVERDUE&limit=100", { headers }),
          fetch("https://www.asaas.com/api/v3/payments?status=RECEIVED&limit=100", { headers }),
        ]);
        const subs = await subsRes.json();
        const overdue = await overdueRes.json();
        const paid = await paidRes.json();

        const todasSubs = subs?.data ?? [];
        const ativos = todasSubs.filter((s: { status?: string }) => s.status === "ACTIVE");
        const mrr = ativos.reduce((s: number, x: { value?: number }) => s + (Number(x.value) || 0), 0);
        const overdueCustomers = new Set((overdue?.data ?? []).map((p: { customer?: string }) => p.customer));
        const paidCustomers    = new Set((paid?.data ?? []).map((p: { customer?: string }) => p.customer));

        asaas = {
          mrr: Math.round(mrr * 100) / 100,
          arr: Math.round(mrr * 12 * 100) / 100,
          pagantes: ativos.length,
          inadimplentes: overdueCustomers.size,
        };

        // Mapeia estado por empresa (externalReference = empresa.id)
        for (const s of todasSubs) {
          const empId = s.externalReference;
          if (!empId) continue;
          const statusSub =
            s.status === "ACTIVE" ? "ativa" :
            s.status === "EXPIRED" ? "expirada" : "cancelada";
          const cobranca =
            overdueCustomers.has(s.customer) ? "vencida" :
            paidCustomers.has(s.customer)    ? "paga" : "aguardando";
          estadoMap[empId] = { assinatura: statusSub, cobranca };
        }
      } catch (asaasErr) {
        console.error("admin-stats asaas:", asaasErr);
      }
    }

    // Estado consolidado por empresa
    const agora2 = Date.now();
    const empresasFinal = result.map((e) => {
      let estado: string | null = null;
      const est = estadoMap[e.id];
      if (e.plano === "pro") {
        if (est?.cobranca === "vencida") estado = "inadimplente";
        else if (est?.cobranca === "paga") estado = "pago";
        else if (e.trial_ends_at && new Date(e.trial_ends_at).getTime() > agora2) estado = "trial";
        else if (est) estado = "aguardando";
        else estado = "pago"; // PRO sem Asaas (ativação manual)
      }
      return { ...e, estado_assinatura: estado, cobranca: est?.cobranca ?? null };
    });

    const proStats = {
      pagos:         empresasFinal.filter((e) => e.estado_assinatura === "pago").length,
      trial:         empresasFinal.filter((e) => e.estado_assinatura === "trial").length,
      inadimplentes: empresasFinal.filter((e) => e.estado_assinatura === "inadimplente").length,
      aguardando:    empresasFinal.filter((e) => e.estado_assinatura === "aguardando").length,
    };

    return new Response(JSON.stringify({ empresas: empresasFinal, totals, crescimento, funil, origens, asaas, proStats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
