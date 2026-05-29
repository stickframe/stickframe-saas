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

export async function emailFaseAvancada({ obraEmail, obraNome, fase, progresso }) {
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
       <p style="color:#444;line-height:1.6;">Acesse o portal para mais detalhes.</p>`
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
