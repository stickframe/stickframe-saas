import { sb } from "./supabase";

async function enviarEmail({ to, subject, html }) {
  const { error } = await sb.functions.invoke("send-email", {
    body: { to, subject, html },
  });
  if (error) console.error("Erro ao enviar email:", error);
}

function templateBase(titulo, corpo) {
  return `
    <div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
      <div style="background:linear-gradient(135deg,#981915,#6e1210);padding:28px 32px;">
        <div style="font-size:20px;font-weight:800;letter-spacing:2px;color:#fff;">
          <span style="color:#aaa;">STICK</span><span style="color:#fff;">FRAME</span>
        </div>
        <div style="font-size:10px;color:#c88;letter-spacing:1.5px;margin-top:2px;">SISTEMAS CONSTRUTIVOS</div>
      </div>
      <div style="padding:28px 32px;">
        <h2 style="margin:0 0 16px;font-size:18px;color:#1a1a1a;">${titulo}</h2>
        ${corpo}
      </div>
      <div style="padding:16px 32px;background:#f9f9f9;border-top:1px solid #eee;font-size:11px;color:#888;">
        Stick Frame Sistemas Construtivos · Santo André/SP · <a href="https://stickframe.com.br" style="color:#981915;">stickframe.com.br</a>
      </div>
    </div>
  `;
}

export async function emailFaseAvancada({ obraEmail, obraNome, fase, progresso, portalToken }) {
  const portalUrl = portalToken ? `${window.location.origin}/portal/${portalToken}` : null;
  await enviarEmail({
    to: obraEmail,
    subject: `Atualização de obra: ${obraNome}`,
    html: templateBase(
      `Sua obra avançou para: ${fase}`,
      `<p style="color:#444;line-height:1.6;">Olá! Sua obra <strong>${obraNome}</strong> avançou para a fase <strong style="color:#981915;">${fase}</strong>.</p>
       <div style="background:#f4f4f4;border-radius:8px;padding:16px;margin:16px 0;">
         <div style="font-size:12px;color:#888;margin-bottom:6px;">PROGRESSO GERAL</div>
         <div style="font-size:28px;font-weight:800;color:#981915;">${progresso}%</div>
         <div style="height:6px;background:#e0e0e0;border-radius:3px;margin-top:8px;">
           <div style="height:6px;width:${progresso}%;background:linear-gradient(90deg,#981915,#6e1210);border-radius:3px;"></div>
         </div>
       </div>
       ${portalUrl ? `<div style="text-align:center;margin:20px 0;"><a href="${portalUrl}" style="display:inline-block;background:linear-gradient(135deg,#981915,#6e1210);color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:14px;"> Ver minha obra no portal</a></div><p style="font-size:11px;color:#aaa;text-align:center;">Ou acesse: <a href="${portalUrl}" style="color:#981915;">${portalUrl}</a></p>` : "<p style=\"color:#444;line-height:1.6;\">Entre em contato para mais detalhes.</p>"}`
    ),
  });
}

export async function emailMedicaoAprovada({ obraEmail, obraNome, numMedicao, valor }) {
  const valorFmt = valor ? `R$ ${Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "";
  await enviarEmail({
    to: obraEmail,
    subject: `Medição ${numMedicao} aprovada — ${obraNome}`,
    html: templateBase(
      `Medição ${numMedicao} aprovada`,
      `<p style="color:#444;line-height:1.6;">A <strong>Medição ${numMedicao}</strong> da obra <strong>${obraNome}</strong> foi aprovada.</p>
       ${valorFmt ? `<div style="background:#f0fff4;border:1px solid #2e9e5b;border-radius:8px;padding:16px;margin:16px 0;"><div style="font-size:12px;color:#2e9e5b;margin-bottom:4px;">VALOR APROVADO</div><div style="font-size:22px;font-weight:800;color:#2e9e5b;">${valorFmt}</div></div>` : ""}
       <p style="color:#444;line-height:1.6;">Entre em contato conosco para mais informações.</p>`
    ),
  });
}

export async function emailAlertaPreco({ nomeProduto, precoAnterior, precoAtual, variacao, loja, email }) {
  const fmtBRL = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  await enviarEmail({
    to: email,
    subject: ` Alerta de preço: ${nomeProduto} subiu ${variacao}%`,
    html: templateBase(
      `Alerta de variação de preço`,
      `<p style="color:#444;line-height:1.6;">O produto <strong>${nomeProduto}</strong> teve um aumento de preço acima do limite configurado.</p>
       <div style="background:#fff7ed;border:1px solid #fb923c;border-radius:8px;padding:16px;margin:16px 0;">
         <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">
           <div style="text-align:center;">
             <div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">PREÇO ANTERIOR</div>
             <div style="font-size:18px;font-weight:700;color:#6b7280;text-decoration:line-through;">${fmtBRL(precoAnterior)}</div>
           </div>
           <div style="font-size:24px;color:#fb923c;font-weight:900;">→</div>
           <div style="text-align:center;">
             <div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">PREÇO ATUAL</div>
             <div style="font-size:22px;font-weight:900;color:#dc2626;">${fmtBRL(precoAtual)}</div>
           </div>
           <div style="text-align:center;background:#fef2f2;border-radius:8px;padding:10px 16px;">
             <div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">VARIAÇÃO</div>
             <div style="font-size:22px;font-weight:900;color:#dc2626;"> ${Number(variacao).toFixed(1)}%</div>
           </div>
         </div>
         ${loja ? `<div style="margin-top:10px;font-size:11px;color:#9ca3af;">Loja: <strong>${loja}</strong></div>` : ""}
       </div>
       <p style="color:#444;line-height:1.6;">Acesse o Monitor de Preços para mais detalhes e atualizar seu orçamento.</p>`
    ),
  });
}

export async function emailAlertaObraAtrasada({ nomeObra, prazoFim, diasAtraso, email }) {
  const prazoFmt = prazoFim ? new Date(prazoFim + "T00:00").toLocaleDateString("pt-BR") : "—";
  const portalUrl = window.location.origin + "/obras";
  await enviarEmail({
    to: email,
    subject: ` Obra atrasada: ${nomeObra} (${diasAtraso} dias)`,
    html: templateBase(
      `Obra atrasada: ${nomeObra}`,
      `<p style="color:#444;line-height:1.6;">A obra <strong>${nomeObra}</strong> está atrasada em relação ao prazo previsto.</p>
       <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin:16px 0;">
         <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
           <div>
             <div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">PRAZO PREVISTO</div>
             <div style="font-size:16px;font-weight:700;color:#dc2626;">${prazoFmt}</div>
           </div>
           <div>
             <div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">DIAS DE ATRASO</div>
             <div style="font-size:24px;font-weight:900;color:#dc2626;">${diasAtraso}</div>
           </div>
         </div>
       </div>
       <div style="text-align:center;margin:20px 0;">
         <a href="${portalUrl}" style="display:inline-block;background:linear-gradient(135deg,#981915,#6e1210);color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:14px;"> Acessar painel de obras</a>
       </div>
       <p style="color:#444;line-height:1.6;">Acesse o sistema para reagendar o prazo ou atualizar o status da obra.</p>`
    ),
  });
}

export async function emailAlertaInadimplencia({ email, lancamentos }) {
  const linhas = lancamentos.map((l) =>
    `<tr>
      <td>${l.descricao || "—"}</td>
      <td>${l.data_vencimento ? new Date(l.data_vencimento + "T00:00").toLocaleDateString("pt-BR") : "—"}</td>
      <td style="color:#c0392b;font-weight:700">R$ ${Number(l.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
      <td>${l.obra || "—"}</td>
    </tr>`
  ).join("");

  const corpo = `
    <p style="font-size:15px;margin-bottom:20px">Os seguintes lançamentos estão <strong style="color:#c0392b">vencidos e em aberto</strong>:</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:#f5f5f5">
        <th style="padding:8px;text-align:left">Descrição</th>
        <th style="padding:8px;text-align:left">Vencimento</th>
        <th style="padding:8px;text-align:left">Valor</th>
        <th style="padding:8px;text-align:left">Obra</th>
      </tr></thead>
      <tbody>${linhas}</tbody>
    </table>
  `;
  return enviarEmail({
    to: email,
    subject: ` ${lancamentos.length} lançamento(s) vencido(s) — StickFrame`,
    html: templateBase("Alerta de Inadimplência", corpo),
  });
}

export async function emailNovoOrcamento({ clienteEmail, clienteNome, valor, padrao }) {
  const valorFmt = `R$ ${Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  await enviarEmail({
    to: clienteEmail,
    subject: "Seu orçamento está pronto — Stick Frame",
    html: templateBase(
      "Orçamento disponível",
      `<p style="color:#444;line-height:1.6;">Olá, <strong>${clienteNome}</strong>! Preparamos um orçamento para você.</p>
       <div style="background:#f4f4f4;border-radius:8px;padding:16px;margin:16px 0;">
         <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
           <span style="font-size:12px;color:#888;">PADRÃO</span>
           <span style="font-size:12px;font-weight:700;color:#1a1a1a;">${padrao}</span>
         </div>
         <div style="display:flex;justify-content:space-between;">
           <span style="font-size:12px;color:#888;">VALOR ESTIMADO</span>
           <span style="font-size:16px;font-weight:800;color:#981915;">${valorFmt}</span>
         </div>
       </div>
       <p style="color:#444;line-height:1.6;">Entre em contato para tirar dúvidas ou fechar negócio.</p>`
    ),
  });
}

export async function emailNovoLead({ email, nome, padrao, area, valorMin, valorMax, cidade }) {
  if (!email) return;
  const fmtR = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
  const faixaTexto = valorMin && valorMax
    ? `${fmtR(valorMin)} a ${fmtR(valorMax)}`
    : valorMin ? `a partir de ${fmtR(valorMin)}` : "";

  await enviarEmail({
    to: email,
    subject: "Seu orçamento estimado — Stick Frame",
    html: templateBase(
      `Olá, ${nome}! Recebemos seu pedido`,
      `<p style="color:#444;line-height:1.6;">Obrigado pelo interesse em construir com a <strong>Stick Frame</strong>!</p>
       <p style="color:#444;line-height:1.6;">Com base nas informações que você nos enviou, preparamos uma estimativa inicial:</p>
       <div style="background:#f4f4f4;border-radius:8px;padding:20px;margin:16px 0;">
         <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
           <div><div style="font-size:11px;color:#888;margin-bottom:4px;">PADRÃO</div><div style="font-size:15px;font-weight:700;color:#1a1a1a;">${padrao || "Padrão"}</div></div>
           <div><div style="font-size:11px;color:#888;margin-bottom:4px;">ÁREA</div><div style="font-size:15px;font-weight:700;color:#1a1a1a;">${area || "—"} m²</div></div>
           ${cidade ? `<div><div style="font-size:11px;color:#888;margin-bottom:4px;">CIDADE</div><div style="font-size:15px;font-weight:700;color:#1a1a1a;">${cidade}</div></div>` : ""}
         </div>
         ${faixaTexto ? `<div style="border-top:1px solid #e0e0e0;padding-top:12px;margin-top:4px;"><div style="font-size:11px;color:#888;margin-bottom:4px;">FAIXA ESTIMADA</div><div style="font-size:22px;font-weight:900;color:#981915;">${faixaTexto}</div><div style="font-size:10px;color:#aaa;margin-top:4px;">* Estimativa preliminar. Valor real pode variar conforme projeto.</div></div>` : ""}
       </div>
       <p style="color:#444;line-height:1.6;">Nossa equipe entrará em contato em breve para apresentar uma proposta detalhada. Qualquer dúvida, estamos à disposição!</p>
       <div style="text-align:center;margin:24px 0;">
         <a href="https://stickframe.com.br" style="display:inline-block;background:linear-gradient(135deg,#981915,#6e1210);color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:14px;"> Conheça nosso trabalho</a>
       </div>`
    ),
  });
}
