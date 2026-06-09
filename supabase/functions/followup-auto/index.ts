import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DIAS_SEM_MOVIMENTACAO = 5;
const STATUS_FECHADOS = ["Fechado", "Em execução", "Perdido"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Função de cron — exige segredo para evitar disparos não autorizados.
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().split("T")[0];

    // Busca leads sem movimentação há X dias, status não-fechado,
    // e que ainda não receberam follow-up hoje.
    const { data: clientes, error } = await sb
      .from("clientes")
      .select("id, nome, empresa_id, responsavel, contato, followup_sent_at, updated_at")
      .not("status", "in", `(${STATUS_FECHADOS.map((s) => `"${s}"`).join(",")})`)
      .lt("updated_at", new Date(Date.now() - DIAS_SEM_MOVIMENTACAO * 86400000).toISOString())
      .or(`followup_sent_at.is.null,followup_sent_at.lt.${today}`);

    if (error) throw error;

    const phoneId = Deno.env.get("WHATSAPP_PHONE_ID");
    const token = Deno.env.get("WHATSAPP_TOKEN");

    if (!phoneId || !token) {
      return new Response(
        JSON.stringify({ error: "WHATSAPP_PHONE_ID or WHATSAPP_TOKEN not configured", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Busca os diretores/admins de cada empresa para fallback de telefone
    const empresaIds = [...new Set((clientes ?? []).map((c) => c.empresa_id))];
    let diretoresPorEmpresa: Record<string, string> = {};

    if (empresaIds.length > 0) {
      // Tenta pegar whatsapp_alertas da tabela empresas como fallback
      const { data: empresas } = await sb
        .from("empresas")
        .select("id, whatsapp_alertas, telefone")
        .in("id", empresaIds);

      for (const emp of empresas ?? []) {
        const phone = (emp.whatsapp_alertas || emp.telefone || "").replace(/\D/g, "");
        if (phone) diretoresPorEmpresa[emp.id] = phone;
      }
    }

    let sent = 0;
    const errors: string[] = [];
    const updatedIds: string[] = [];

    for (const cliente of clientes ?? []) {
      // Calcula dias sem movimentação
      const updatedAt = new Date(cliente.updated_at);
      const diasParados = Math.floor((Date.now() - updatedAt.getTime()) / 86400000);

      // Determina telefone: usa contato do lead se disponível, senão fallback da empresa
      const phone = (cliente.contato || "").replace(/\D/g, "") ||
        diretoresPorEmpresa[cliente.empresa_id] || "";

      if (!phone) {
        errors.push(`${cliente.nome}: sem telefone disponível`);
        continue;
      }

      const responsavel = cliente.responsavel || "Responsável";
      const message =
        `⚠️ Lembrete: o lead *${cliente.nome}* está sem movimentação há ${diasParados} dia${diasParados !== 1 ? "s" : ""}. Acesse o sistema para dar continuidade.\n\nStick Frame · stickframe.com.br`;

      const res = await fetch(
        `https://graph.facebook.com/v18.0/${phoneId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phone,
            type: "text",
            text: { body: message },
          }),
        }
      );

      if (res.ok) {
        sent++;
        updatedIds.push(cliente.id);
      } else {
        const err = await res.text();
        errors.push(`${cliente.nome}: ${err}`);
      }
    }

    // Marca followup_sent_at = hoje para não reenviar no mesmo dia
    if (updatedIds.length > 0) {
      await sb
        .from("clientes")
        .update({ followup_sent_at: today })
        .in("id", updatedIds);
    }

    return new Response(
      JSON.stringify({
        sent,
        total: clientes?.length ?? 0,
        date: today,
        dias_sem_movimentacao: DIAS_SEM_MOVIMENTACAO,
        errors: errors.length ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
