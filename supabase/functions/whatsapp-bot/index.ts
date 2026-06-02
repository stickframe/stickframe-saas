import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Webhook verification (GET)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode      = url.searchParams.get("hub.mode");
    const challenge = url.searchParams.get("hub.challenge");
    const token     = url.searchParams.get("hub.verify_token");
    if (mode === "subscribe" && token) {
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data } = await sb.from("ia_config").select("id").eq("verify_token", token).eq("ativo", true).single();
      if (data) return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  try {
    const body = await req.json();
    const change   = body.entry?.[0]?.changes?.[0];
    const msg      = change?.value?.messages?.[0];
    if (!msg?.text?.body) return new Response("OK");

    const senderPhone  = msg.from;
    const messageText  = msg.text.body;
    const phoneNumId   = change?.value?.metadata?.phone_number_id;

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: config } = await sb.from("ia_config")
      .select("*").eq("phone_number_id", phoneNumId).eq("ativo", true).single();
    if (!config) return new Response("OK");

    const { data: ctx } = await sb.rpc("whatsapp_bot_context", {
      p_empresa_id: config.empresa_id,
      p_telefone:   senderPhone,
    });

    const defaultPrompt = `Você é um assistente virtual de uma construtora de Steel Frame. Responda de forma simpática, clara e objetiva em português. Seja breve (máximo 3 parágrafos).`;
    const systemPrompt  = config.sistema_prompt || defaultPrompt;

    let contextInfo = "";
    if (ctx?.cliente_encontrado) {
      const o = ctx.obra;
      const v = ctx.proximos_vencimentos;
      contextInfo = `\n\n[DADOS DO CLIENTE]\nNome: ${ctx.cliente.nome}`;
      if (o) contextInfo += `\nObra: ${o.nome} | Fase: ${o.fase} | Progresso: ${o.progresso}% | Status: ${o.status}`;
      if (o?.prazo_fim) contextInfo += ` | Previsão de entrega: ${new Date(o.prazo_fim).toLocaleDateString("pt-BR")}`;
      if (v?.length) contextInfo += `\nPróximos vencimentos: ${v.map((x: Record<string,unknown>) => `${x.descricao} R$${x.valor} em ${x.data_vencimento}`).join("; ")}`;
    } else {
      contextInfo = "\n\n[CONTEXTO] Cliente não identificado no sistema pelo número de telefone.";
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${config.openai_key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.modelo_openai || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt + contextInfo },
          { role: "user",   content: messageText },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const openaiData = await openaiRes.json();
    const replyText  = openaiData.choices?.[0]?.message?.content?.trim() ||
      "Olá! Nosso assistente está temporariamente indisponível. Em breve retornaremos. 🙏";

    await fetch(`https://graph.facebook.com/v19.0/${phoneNumId}/messages`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${config.waba_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: senderPhone,
        type: "text",
        text: { body: replyText },
      }),
    });

    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("whatsapp-bot error:", e);
    return new Response("OK", { status: 200 });
  }
});
