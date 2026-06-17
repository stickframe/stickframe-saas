import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { printHtml } from "../utils/printHtml";
import { STICK_SCORE_DIMENSOES, gerarInsights } from "../utils/stickScore";

export function gerarRelatorioObra(obra, financeiro, medicoes = []) {
  const doc = new jsPDF();
  const hoje = new Date().toLocaleDateString("pt-BR");

  // Header
  doc.setFillColor(180, 30, 30);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("STICKFRAME", 14, 12);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Relatório de Obra", 14, 20);
  doc.text(`Gerado em: ${hoje}`, 150, 20);

  // Obra info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(obra.nome || "Obra sem nome", 14, 40);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Cliente: ${obra.cliente || "—"}`, 14, 48);
  doc.text(`Status: ${obra.status || "—"}`, 14, 54);
  doc.text(`Fase: ${obra.fase || "—"}`, 100, 48);
  doc.text(`Progresso: ${obra.progresso || 0}%`, 100, 54);

  // Progress bar
  doc.setFillColor(230, 230, 230);
  doc.rect(14, 60, 182, 6, "F");
  doc.setFillColor(180, 30, 30);
  doc.rect(14, 60, 182 * ((obra.progresso || 0) / 100), 6, "F");

  // Financial summary
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Resumo Financeiro", 14, 80);

  const receitas = financeiro?.filter(f => f.tipo === "receita") || [];
  const despesas = financeiro?.filter(f => f.tipo === "despesa") || [];
  const totalReceitas = receitas.reduce((a, f) => a + (f.valor || 0), 0);
  const totalDespesas = despesas.reduce((a, f) => a + (f.valor || 0), 0);
  const saldo = totalReceitas - totalDespesas;
  const contrato = obra.contrato || 0;
  const margem = contrato > 0 ? ((saldo / contrato) * 100).toFixed(1) : 0;

  autoTable(doc, {
    startY: 85,
    head: [["Item", "Valor"]],
    body: [
      ["Valor contratado", `R$ ${contrato.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Receitas lançadas", `R$ ${totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Despesas lançadas", `R$ ${totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Saldo", `R$ ${saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Margem atual", `${margem}%`],
    ],
    headStyles: { fillColor: [180, 30, 30] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: { 1: { halign: "right" } },
  });

  // Lancamentos table
  if (financeiro?.length > 0) {
    const lastY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Lançamentos Financeiros", 14, lastY);
    autoTable(doc, {
      startY: lastY + 5,
      head: [["Data", "Descrição", "Tipo", "Valor"]],
      body: financeiro.slice(0, 20).map(f => [
        f.data || "—",
        f.descricao || "—",
        f.tipo === "receita" ? "Receita" : "Despesa",
        `R$ ${(f.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      ]),
      headStyles: { fillColor: [180, 30, 30] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: { 3: { halign: "right" } },
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${pageCount} — StickFrame Sistemas Construtivos`, 14, 290);
  }

  doc.save(`relatorio-${(obra.nome || "obra").replace(/\s+/g, "-").toLowerCase()}-${hoje.replace(/\//g, "-")}.pdf`);
}

export function gerarRelatorioMensal(empresaNome, obras, clientes, financeiro) {
  const doc = new jsPDF();
  const hoje = new Date().toLocaleDateString("pt-BR");
  const mesAno = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  // Header
  doc.setFillColor(180, 30, 30);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("STICKFRAME", 14, 12);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Relatório Mensal — ${mesAno}`, 14, 20);
  doc.text(`Gerado em: ${hoje}`, 140, 20);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(empresaNome || "Empresa", 14, 40);

  // KPIs
  const obrasAtivas = obras.filter(o => o.status === "Em execução").length;
  const totalReceitas = financeiro.filter(f => f.tipo === "receita").reduce((a, f) => a + (f.valor || 0), 0);
  const totalDespesas = financeiro.filter(f => f.tipo === "despesa").reduce((a, f) => a + (f.valor || 0), 0);

  autoTable(doc, {
    startY: 48,
    head: [["Métrica", "Valor"]],
    body: [
      ["Total de clientes", clientes.length],
      ["Obras ativas", obrasAtivas],
      ["Total de obras", obras.length],
      ["Receitas lançadas", `R$ ${totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Despesas lançadas", `R$ ${totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Saldo", `R$ ${(totalReceitas - totalDespesas).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
    ],
    headStyles: { fillColor: [180, 30, 30] },
  });

  // Obras table
  if (obras.length > 0) {
    const lastY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Obras", 14, lastY);
    autoTable(doc, {
      startY: lastY + 5,
      head: [["Obra", "Cliente", "Status", "Progresso", "Valor Contrato"]],
      body: obras.map(o => [
        o.nome || "—",
        o.cliente || "—",
        o.status || "—",
        `${o.progresso || 0}%`,
        `R$ ${(o.contrato || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      ]),
      headStyles: { fillColor: [180, 30, 30] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${pageCount} — StickFrame Sistemas Construtivos`, 14, 290);
  }

  doc.save(`relatorio-mensal-${hoje.replace(/\//g, "-")}.pdf`);
}

export function gerarBoletimMedicao(obra, medicoes = []) {
  const doc = new jsPDF();
  const hoje = new Date().toLocaleDateString("pt-BR");

  // Header
  doc.setFillColor(180, 30, 30);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text("STICKFRAME", 14, 12);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text("Boletim de Medição", 14, 21);
  doc.text(hoje, 170, 21);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text(obra.nome || "Obra", 14, 40);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Contrato: R$ ${(obra.contrato||0).toLocaleString("pt-BR", {minimumFractionDigits:2})}  |  Progresso: ${obra.progresso||0}%`, 14, 48);

  autoTable(doc, {
    startY: 56,
    head: [["#","Serviço / Etapa","Data","% Previsto","% Realizado","Valor Medido"]],
    body: medicoes.map((m, i) => [
      i + 1,
      m.descricao || m.servico || "—",
      m.data || "—",
      `${m.percentual_previsto || 0}%`,
      `${m.percentual || m.percentual_acumulado || 0}%`,
      `R$ ${((m.percentual || 0) / 100 * (obra.contrato || 0)).toLocaleString("pt-BR", {minimumFractionDigits:2})}`,
    ]),
    headStyles: { fillColor: [180, 30, 30] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    foot: [[
      "", "TOTAL", "",
      `${medicoes.reduce((a,m) => a+(m.percentual_previsto||0),0).toFixed(1)}%`,
      `${medicoes.reduce((a,m) => a+(m.percentual||m.percentual_acumulado||0),0).toFixed(1)}%`,
      `R$ ${(medicoes.reduce((a,m) => a+(m.percentual||0)/100*(obra.contrato||0),0)).toLocaleString("pt-BR",{minimumFractionDigits:2})}`,
    ]],
    footStyles: { fillColor: [180,30,30], textColor: [255,255,255], fontStyle: "bold" },
  });

  const n = doc.internal.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(150);
    doc.text(`Pág ${i}/${n} — StickFrame`, 14, 290);
  }
  doc.save(`boletim-${(obra.nome||"obra").replace(/\s+/g,"-").toLowerCase()}.pdf`);
}

//  StickScore™ Relatório Compartilhável 

export function gerarRelatorioStickScore(obra, score, historico = []) {
  const { total, scores, nivel, cor, penalidade } = score;
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const hora  = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  // Delta vs mês anterior
  const delta = historico.length >= 2
    ? total - historico[historico.length - 2].total
    : null;

  // SVG do anel principal
  const size = 120, r = 48, circ = 2 * Math.PI * r;
  const dash = (total / 100) * circ;
  const ringBg  = cor + "22";
  const scoreSvg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg)">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${ringBg}" stroke-width="10"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${cor}" stroke-width="10"
        stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}" stroke-linecap="round"/>
    </svg>`;

  // Gráfico de evolução mensal (SVG)
  let historicoHtml = "";
  if (historico.length >= 2) {
    const W = 480, H = 80;
    const vals = historico.map(h => h.total);
    const min  = Math.max(0, Math.min(...vals) - 8);
    const max  = Math.min(100, Math.max(...vals) + 5);
    const range = max - min || 1;
    const pts = vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 12);
      return { x, y, v, mes: historico[i].mes.slice(5) };
    });
    const poly = pts.map(p => `${p.x},${p.y}`).join(" ");
    const area = `M ${poly.replace(/ /g, " L ")} L ${W},${H} L 0,${H} Z`;
    const circles = pts.map((p, i) =>
      `<circle cx="${p.x}" cy="${p.y}" r="${i === pts.length-1 ? 5 : 3}" fill="${i === pts.length-1 ? cor : "rgba(255,255,255,0.4)"}"/>`
    ).join("");
    const labels = pts.map(p =>
      `<text x="${p.x}" y="${H + 14}" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.45)">${p.mes}</text>`
    ).join("");
    const values = pts.map((p, i) => i === pts.length - 1
      ? `<text x="${p.x}" y="${p.y - 8}" text-anchor="middle" font-size="10" fill="${cor}" font-weight="800">${p.v}</text>`
      : ""
    ).join("");

    historicoHtml = `
      <div style="margin-top:24px">
        <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px">Evolução mensal</div>
        <svg viewBox="0 0 ${W} ${H + 20}" style="width:100%;height:auto;display:block">
          <defs>
            <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${cor}" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="${cor}" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <path d="${area}" fill="url(#hg)"/>
          <polyline points="${poly}" fill="none" stroke="${cor}" stroke-width="2" stroke-linejoin="round"/>
          ${circles}
          ${labels}
          ${values}
        </svg>
      </div>`;
  }

  // Barras das dimensões
  const dimBars = STICK_SCORE_DIMENSOES.map(({ key, label, peso }) => {
    const val = scores[key] ?? 0;
    const barCor = val >= 85 ? "#059669" : val >= 70 ? "#2e9e5b" : val >= 55 ? "#3b6ea5" : val >= 40 ? "#b07a1e" : "#981915";
    return `
      <div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px">
          <span style="font-size:12px;color:rgba(255,255,255,0.6)">${label} <span style="font-size:9px;opacity:.4">${peso}</span></span>
          <span style="font-size:12px;font-weight:800;color:${barCor}">${val}</span>
        </div>
        <div style="height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden">
          <div style="height:6px;width:${val}%;background:linear-gradient(90deg,${barCor}90,${barCor});border-radius:3px"></div>
        </div>
      </div>`;
  }).join("");

  // Insights automáticos
  const insights = gerarInsights(score, historico);
  const insightStyle = {
    positivo: { bg: "#2e9e5b20", border: "#2e9e5b40", color: "#6ee7b7", icon: "↑" },
    negativo: { bg: "#98191520", border: "#98191540", color: "#fca5a5", icon: "↓" },
    alerta:   { bg: "#b07a1e20", border: "#b07a1e40", color: "#fcd34d", icon: "" },
    dica:     { bg: "#3b6ea520", border: "#3b6ea540", color: "#93c5fd", icon: "" },
  };
  const insightsHtml = insights.length > 0 ? `
    <div style="margin-top:20px;display:flex;flex-direction:column;gap:8px">
      ${insights.map(ins => {
        const s = insightStyle[ins.tipo] || insightStyle.dica;
        return `<div style="padding:10px 12px;border-radius:8px;background:${s.bg};border:1px solid ${s.border};font-size:12px;color:${s.color};line-height:1.5;display:flex;gap:8px">
          <span style="flex-shrink:0">${s.icon}</span><span>${ins.texto}</span>
        </div>`;
      }).join("")}
    </div>` : "";

  // Penalidade
  const penalHtml = penalidade ? `
    <div style="margin-top:16px;padding:10px 12px;border-radius:8px;background:#b07a1e20;border:1px solid #b07a1e40;font-size:12px;color:#fcd34d;display:flex;gap:8px">
      <span></span><span>Score limitado a ${total} — ${penalidade}</span>
    </div>` : "";

  // Delta badge
  const deltaBadge = delta !== null ? `
    <div style="margin-top:8px;font-size:13px;font-weight:700;color:${delta >= 0 ? "#6ee7b7" : "#fca5a5"}">
      ${delta >= 0 ? "↑ +" : "↓ "}${delta} pts vs mês anterior
    </div>` : "";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>StickScore™ — ${obra.nome || "Obra"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f4f1ec; color: #1a1a2e; }
    .page { max-width: 680px; margin: 0 auto; padding: 40px 24px; }
    @media print {
      body { background: #fff; }
      .page { padding: 20px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;flex-wrap:wrap;gap:12px">
    <div>
      <div style="font-size:22px;font-weight:900;color:#981915;letter-spacing:-0.5px">Stick<span style="font-weight:300">Frame</span></div>
      <div style="font-size:10px;color:#9aa0a8;margin-top:2px">Gestão de Obras Steel Frame</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#981915;text-transform:uppercase">StickScore™</div>
      <div style="font-size:11px;color:#9aa0a8;margin-top:2px">Relatório de Desempenho</div>
      <div style="font-size:10px;color:#c0c4cc;margin-top:2px">${hoje} · ${hora}</div>
    </div>
  </div>

  <!-- Obra info -->
  <div style="background:#fff;border:1px solid #e5e0d8;border-radius:12px;padding:18px 20px;margin-bottom:20px">
    <div style="font-size:18px;font-weight:900;color:#1a1a2e;margin-bottom:6px">${obra.nome || "Sem nome"}</div>
    <div style="display:flex;gap:20px;flex-wrap:wrap">
      ${obra.cliente ? `<span style="font-size:12px;color:#6b7280"> ${obra.cliente}</span>` : ""}
      ${obra.status  ? `<span style="font-size:12px;color:#6b7280"> ${obra.status}</span>` : ""}
      ${obra.progresso != null ? `<span style="font-size:12px;color:#6b7280"> ${obra.progresso}% concluído</span>` : ""}
    </div>
  </div>

  <!-- Score principal -->
  <div style="background:linear-gradient(135deg,#0f0f14 0%,#1a1a2e 100%);border-radius:16px;padding:28px;border:1px solid ${cor}30;box-shadow:0 8px 32px ${cor}18;margin-bottom:20px">

    <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap">
      <!-- Anel -->
      <div style="position:relative;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">
        ${scoreSvg}
        <div style="position:absolute;text-align:center">
          <div style="font-size:30px;font-weight:900;color:${cor};line-height:1">${total}</div>
          <div style="font-size:9px;color:rgba(255,255,255,0.3)">/&nbsp;100</div>
        </div>
      </div>
      <!-- Texto -->
      <div>
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:${cor};text-transform:uppercase;margin-bottom:6px">StickScore™</div>
        <div style="font-size:28px;font-weight:900;color:#fff;line-height:1">${nivel}</div>
        ${deltaBadge}
        <div style="display:inline-flex;align-items:center;gap:6px;background:${cor}20;border:1px solid ${cor}40;border-radius:20px;padding:5px 14px;margin-top:10px">
          <div style="width:7px;height:7px;border-radius:50%;background:${cor}"></div>
          <span style="font-size:11px;font-weight:700;color:${cor}">Índice de Saúde da Obra</span>
        </div>
      </div>
    </div>

    <!-- Dimensões -->
    <div style="margin-top:24px;border-top:1px solid rgba(255,255,255,0.06);padding-top:20px">
      ${dimBars}
    </div>

    ${penalHtml}
    ${insightsHtml}
    ${historicoHtml}
  </div>

  <!-- Rodapé -->
  <div style="text-align:center;padding:16px;font-size:10px;color:#9aa0a8;line-height:1.6">
    <div style="font-weight:700;color:#6b7280;margin-bottom:2px">StickFrame · StickScore™</div>
    Índice proprietário que mede a saúde da obra em tempo real —
    cronograma, financeiro, compras, equipe e qualidade num único número de 0 a 100.<br/>
    Quanto maior o StickScore™, maior a previsibilidade e o controle da obra.
  </div>

</div>
</body>
</html>`;

  const filename = `stickscore-${(obra.nome || "obra").toLowerCase().replace(/\s+/g, "-")}`;
  printHtml(html, filename);
}
