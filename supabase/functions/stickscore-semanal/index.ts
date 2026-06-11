import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── StickScore™ calculation (mirrors src/utils/stickScore.js) ─────────────────

const PESOS = { cronograma: 0.25, financeiro: 0.30, compras: 0.20, equipe: 0.15, qualidade: 0.10 };

function clamp(v: number) { return Math.min(100, Math.max(0, v)); }

function classificar(total: number) {
  if (total >= 90) return { nivel: "Elite",     cor: "#059669" };
  if (total >= 80) return { nivel: "Excelente", cor: "#2e9e5b" };
  if (total >= 70) return { nivel: "Bom",       cor: "#3b6ea5" };
  if (total >= 60) return { nivel: "Atenção",   cor: "#b07a1e" };
  return             { nivel: "Crítico",         cor: "#981915" };
}

interface Obra {
  id: string; nome: string; status: string;
  progresso?: number; prazo_inicio?: string; prazo_fim?: string; contrato?: number;
}

function calcularScore(
  obra: Obra,
  lancamentos: {tipo:string; valor:number}[],
  medicoes: {status:string}[],
  nMembros: number,
  nDiario30: number,
) {
  const scores: Record<string, number> = {};

  // Cronograma
  let cronScore = 70;
  if (obra.prazo_inicio && obra.prazo_fim) {
    const inicio = new Date(obra.prazo_inicio);
    const fim    = new Date(obra.prazo_fim);
    const hoje   = new Date();
    const totalDias = Math.max(1, (fim.getTime() - inicio.getTime()) / 86400000);
    const diasPassados = Math.max(0, (hoje.getTime() - inicio.getTime()) / 86400000);
    const esperado = Math.min(100, (diasPassados / totalDias) * 100);
    const delta = (obra.progresso ?? 0) - esperado;
    if (delta >= 10)        cronScore = 100;
    else if (delta >= 0)    cronScore = 85 + (delta / 10) * 15;
    else if (delta >= -15)  cronScore = 65 + ((delta + 15) / 15) * 20;
    else if (delta >= -30)  cronScore = 40 + ((delta + 30) / 15) * 25;
    else                    cronScore = Math.max(20, 40 + ((delta + 30) / 30) * 20);
  } else if (obra.progresso != null) {
    cronScore = Math.min(95, 55 + obra.progresso * 0.40);
  }
  scores.cronograma = clamp(Math.round(cronScore));

  // Financeiro
  let finScore = 72;
  const receitas = lancamentos.filter(f => f.tipo === "receita").reduce((s, f) => s + f.valor, 0);
  const despesas = lancamentos.filter(f => f.tipo === "despesa").reduce((s, f) => s + f.valor, 0);
  const contrato = obra.contrato || 0;
  if (contrato > 0 && despesas > 0) {
    const margem = (receitas - despesas) / contrato;
    if      (margem > 0.25) finScore = 100;
    else if (margem > 0.15) finScore = 90;
    else if (margem > 0.05) finScore = 76;
    else if (margem > 0)    finScore = 60;
    else if (margem > -0.1) finScore = 40;
    else                    finScore = 20;
  } else if (!lancamentos.length) { finScore = 68; }
  scores.financeiro = clamp(Math.round(finScore));

  // Compras
  let compScore = 68;
  if (medicoes.length > 0) {
    const aprovadas = medicoes.filter(m => m.status === "Aprovada").length;
    compScore = 55 + (aprovadas / medicoes.length) * 45;
  }
  scores.compras = clamp(Math.round(compScore));

  // Equipe
  scores.equipe = clamp(Math.round(
    nMembros >= 6 ? 100 : nMembros >= 4 ? 88 : nMembros >= 2 ? 72 : nMembros >= 1 ? 55 : 30
  ));

  // Qualidade
  let qualScore = 68;
  if (nDiario30 >= 22) qualScore = 100;
  else if (nDiario30 >= 14) qualScore = 90;
  else if (nDiario30 >= 8)  qualScore = 78;
  else if (nDiario30 >= 3)  qualScore = 62;
  else if (nDiario30 >= 1)  qualScore = 48;
  else if (nDiario30 === 0 && lancamentos.length > 0) qualScore = 30;
  scores.qualidade = clamp(Math.round(qualScore));

  const CAPS = [
    ["financeiro", 25, 59],
    ["cronograma", 25, 64],
    ["qualidade",  40, 79],
    ["compras",    35, 74],
    ["equipe",     35, 74],
  ] as [string, number, number][];

  let cap = 100;
  for (const [dim, limiar, dimCap] of CAPS) {
    if ((scores[dim] ?? 100) < limiar && dimCap < cap) cap = dimCap;
  }

  let total = clamp(Math.round(
    scores.cronograma * PESOS.cronograma +
    scores.financeiro * PESOS.financeiro +
    scores.compras    * PESOS.compras    +
    scores.equipe     * PESOS.equipe     +
    scores.qualidade  * PESOS.qualidade
  ));
  total = Math.min(total, cap);

  return { total, scores, ...classificar(total) };
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

function nivelBadge(nivel: string, cor: string) {
  return `<span style="display:inline-block;padding:2px 10px;border-radius:20px;background:${cor}22;color:${cor};font-size:11px;font-weight:700;border:1px solid ${cor}44;">${nivel}</span>`;
}

function scoreRingSvg(total: number, cor: string, size = 56) {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const dash = (total / 100) * circ;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block;">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="5"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${cor}" stroke-width="5"
      stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}"
      stroke-linecap="round"
      transform="rotate(-90 ${size/2} ${size/2})"/>
    <text x="${size/2}" y="${size/2+1}" text-anchor="middle" dominant-baseline="middle"
      font-size="13" font-weight="900" fill="${cor}" font-family="Arial,sans-serif">${total}</text>
  </svg>`;
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only PRO companies
    const { data: empresas } = await sb
      .from("empresas")
      .select("id, nome, plano")
      .neq("plano", "free");

    const now = new Date();
    const em30 = new Date(now.getTime() - 30 * 86400000).toISOString();
    const dataRelatorio = now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

    let sent = 0;
    const errors: string[] = [];

    for (const empresa of empresas ?? []) {
      try {
        // Fetch obras ativas
        const { data: obras } = await sb
          .from("obras")
          .select("id, nome, status, progresso, prazo_inicio, prazo_fim, contrato")
          .eq("empresa_id", empresa.id)
          .eq("status", "Em andamento");

        if (!obras?.length) continue;

        // Fetch all needed data for the company in parallel
        const obraIds = obras.map((o: Obra) => o.id);

        const [lancRes, medRes, alocRes, diarRes] = await Promise.all([
          sb.from("lancamentos").select("obra_id, tipo, valor").in("obra_id", obraIds),
          sb.from("medicoes").select("obra_id, status").in("obra_id", obraIds),
          sb.from("alocacoes").select("obra_id").in("obra_id", obraIds),
          sb.from("diario_obra").select("obra_id, created_at").in("obra_id", obraIds).gte("created_at", em30),
        ]);

        // Group by obra
        const lancByObra: Record<string, {tipo:string; valor:number}[]> = {};
        const medByObra: Record<string, {status:string}[]> = {};
        const alocByObra: Record<string, number> = {};
        const diarByObra: Record<string, number> = {};

        for (const l of lancRes.data ?? []) {
          if (!lancByObra[l.obra_id]) lancByObra[l.obra_id] = [];
          lancByObra[l.obra_id].push({ tipo: l.tipo, valor: Number(l.valor) });
        }
        for (const m of medRes.data ?? []) {
          if (!medByObra[m.obra_id]) medByObra[m.obra_id] = [];
          medByObra[m.obra_id].push({ status: m.status });
        }
        for (const a of alocRes.data ?? []) {
          alocByObra[a.obra_id] = (alocByObra[a.obra_id] || 0) + 1;
        }
        for (const d of diarRes.data ?? []) {
          diarByObra[d.obra_id] = (diarByObra[d.obra_id] || 0) + 1;
        }

        // Calculate scores
        const scored = obras.map((o: Obra) => ({
          ...o,
          score: calcularScore(
            o,
            lancByObra[o.id] || [],
            medByObra[o.id] || [],
            alocByObra[o.id] || 0,
            diarByObra[o.id] || 0,
          ),
        })).sort((a: any, b: any) => b.score.total - a.score.total);

        const melhor = scored[0];
        const pior = scored[scored.length - 1];
        const mediaScore = Math.round(scored.reduce((s: number, o: any) => s + o.score.total, 0) / scored.length);
        const mediaClassif = classificar(mediaScore);

        // Obra rows HTML
        const obraRows = scored.map((o: any, i: number) => {
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}º`;
          const receitas = (lancByObra[o.id] || []).filter((f: any) => f.tipo === "receita").reduce((s: number, f: any) => s + f.valor, 0);
          const despesas = (lancByObra[o.id] || []).filter((f: any) => f.tipo === "despesa").reduce((s: number, f: any) => s + f.valor, 0);
          const saldo = receitas - despesas;
          const saldoColor = saldo >= 0 ? "#2e9e5b" : "#981915";

          return `
          <tr>
            <td style="padding:14px 16px;border-bottom:1px solid #f3f4f6;vertical-align:middle;">
              <span style="font-size:16px;">${medal}</span>
            </td>
            <td style="padding:14px 16px;border-bottom:1px solid #f3f4f6;vertical-align:middle;">
              <div style="font-weight:700;color:#111827;font-size:13px;">${o.nome}</div>
              <div style="font-size:11px;color:#9ca3af;margin-top:2px;">${o.progresso ?? 0}% concluído</div>
            </td>
            <td style="padding:14px 16px;border-bottom:1px solid #f3f4f6;vertical-align:middle;text-align:center;">
              ${scoreRingSvg(o.score.total, o.score.cor)}
            </td>
            <td style="padding:14px 16px;border-bottom:1px solid #f3f4f6;vertical-align:middle;text-align:center;">
              ${nivelBadge(o.score.nivel, o.score.cor)}
            </td>
            <td style="padding:14px 16px;border-bottom:1px solid #f3f4f6;vertical-align:middle;text-align:right;">
              <span style="font-size:13px;font-weight:600;color:${saldoColor};">${fmtBRL(saldo)}</span>
            </td>
          </tr>`;
        }).join("");

        // Dimension bars for media
        const dimRows = [
          { key: "cronograma", label: "Cronograma" },
          { key: "financeiro", label: "Financeiro" },
          { key: "compras",    label: "Compras" },
          { key: "equipe",     label: "Equipe" },
          { key: "qualidade",  label: "Qualidade" },
        ].map(({ key, label }) => {
          const avg = Math.round(scored.reduce((s: number, o: any) => s + (o.score.scores[key] || 0), 0) / scored.length);
          const barColor = avg >= 80 ? "#2e9e5b" : avg >= 60 ? "#3b6ea5" : avg >= 40 ? "#b07a1e" : "#981915";
          return `
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#4b5563;width:120px;">${label}</td>
            <td style="padding:6px 8px;">
              <div style="background:#f3f4f6;border-radius:4px;height:8px;overflow:hidden;">
                <div style="width:${avg}%;background:${barColor};height:100%;border-radius:4px;"></div>
              </div>
            </td>
            <td style="padding:6px 0;font-size:12px;font-weight:700;color:${barColor};width:36px;text-align:right;">${avg}</td>
          </tr>`;
        }).join("");

        // Insights
        const alertas: string[] = [];
        if (pior.score.total < 60) alertas.push(`⚠️ <strong>${pior.nome}</strong> está em nível Crítico (${pior.score.total} pts) e requer atenção imediata.`);
        if (melhor.score.nivel === "Elite" || melhor.score.nivel === "Excelente") alertas.push(`🏆 <strong>${melhor.nome}</strong> lidera com ${melhor.score.total} pts — nível ${melhor.score.nivel}.`);
        if (mediaScore >= 80) alertas.push(`✅ Média geral da carteira em ${mediaScore} pts — portfólio saudável.`);
        else if (mediaScore < 65) alertas.push(`📉 Média geral da carteira em ${mediaScore} pts — revise as obras com menor score.`);

        const insightsHtml = alertas.length ? `
          <tr>
            <td style="padding:0 40px 24px;">
              <div style="background:#f0f9ff;border-radius:8px;border:1px solid #bae6fd;padding:16px 20px;">
                <div style="font-size:12px;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Insights da semana</div>
                ${alertas.map(a => `<div style="font-size:13px;color:#1e40af;margin-bottom:6px;line-height:1.5;">${a}</div>`).join("")}
              </div>
            </td>
          </tr>` : "";

        const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StickScore™ Semanal — ${empresa.nome}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;max-width:620px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#981915 0%,#b91c1c 100%);padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="color:#ffffff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">StickFrame</div>
                    <div style="color:rgba(255,255,255,0.75);font-size:12px;margin-top:2px;">SISTEMAS CONSTRUTIVOS</div>
                  </td>
                  <td style="text-align:right;">
                    <div style="color:#ffffff;font-size:13px;font-weight:700;">StickScore™ Semanal</div>
                    <div style="color:rgba(255,255,255,0.65);font-size:11px;margin-top:2px;">${dataRelatorio}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Score médio -->
          <tr>
            <td style="padding:28px 40px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Score médio da carteira</div>
                    <div style="display:flex;align-items:center;gap:12px;">
                      <table cellpadding="0" cellspacing="0"><tr><td>${scoreRingSvg(mediaScore, mediaClassif.cor, 64)}</td></tr></table>
                      <div style="margin-left:12px;display:inline-block;">
                        <div style="font-size:32px;font-weight:900;color:${mediaClassif.cor};line-height:1;">${mediaScore}</div>
                        <div style="margin-top:6px;">${nivelBadge(mediaClassif.nivel, mediaClassif.cor)}</div>
                      </div>
                      <div style="margin-left:16px;display:inline-block;vertical-align:top;">
                        <div style="font-size:11px;color:#6b7280;">${scored.length} obra${scored.length !== 1 ? "s" : ""} ativa${scored.length !== 1 ? "s" : ""}</div>
                      </div>
                    </div>
                  </td>
                  <td style="padding:20px 24px;border-left:1px solid #e2e8f0;vertical-align:top;min-width:180px;">
                    <div style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Média por dimensão</div>
                    <table width="100%" cellpadding="0" cellspacing="0">${dimRows}</table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Insights -->
          ${insightsHtml}
          <!-- Ranking obras -->
          <tr>
            <td style="padding:0 40px 8px;">
              <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:12px;">Ranking de Obras — Semana ${now.toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit" })}</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                <thead>
                  <tr style="background:#f9fafb;">
                    <th style="padding:10px 16px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;">#</th>
                    <th style="padding:10px 16px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;">Obra</th>
                    <th style="padding:10px 16px;text-align:center;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;">Score</th>
                    <th style="padding:10px 16px;text-align:center;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;">Nível</th>
                    <th style="padding:10px 16px;text-align:right;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;">Saldo</th>
                  </tr>
                </thead>
                <tbody>${obraRows}</tbody>
              </table>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding:24px 40px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="background:#981915;border-radius:8px;text-align:center;padding:14px 24px;">
                    <a href="https://stickframe.com.br/obras" style="color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">
                      Ver detalhes no StickFrame →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;margin:0;font-size:12px;line-height:1.6;">
                StickFrame · StickScore™ é uma metodologia proprietária<br>
                <a href="https://stickframe.com.br" style="color:#6b7280;">stickframe.com.br</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        // Get director email
        const { data: usuario } = await sb
          .from("usuarios").select("id").eq("empresa_id", empresa.id).eq("perfil", "diretor").limit(1).single();

        if (!usuario) { errors.push(`${empresa.nome}: diretor não encontrado`); continue; }

        const { data: authUser } = await sb.auth.admin.getUserById(usuario.id);
        if (!authUser?.user?.email) { errors.push(`${empresa.nome}: email não encontrado`); continue; }

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "StickFrame <oi@stickframe.com.br>",
            to: [authUser.user.email],
            subject: `StickScore™ Semanal — ${empresa.nome} · Média ${mediaScore} pts (${mediaClassif.nivel})`,
            html,
          }),
        });

        if (res.ok) sent++;
        else { const t = await res.text(); errors.push(`${empresa.nome}: ${t}`); }

      } catch (err) {
        errors.push(`${empresa.nome}: ${String(err)}`);
      }
    }

    return new Response(
      JSON.stringify({ sent, total: empresas?.length ?? 0, errors: errors.length ? errors : undefined }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
