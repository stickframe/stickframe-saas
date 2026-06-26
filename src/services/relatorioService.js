import { printHtml } from "../utils/printHtml";
import { STICK_SCORE_DIMENSOES, gerarInsights } from "../utils/stickScore";

// ── Shared design system ──────────────────────────────────────────────────────

const FONTS = `https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap`;

const BASE_CSS = `
@import url('${FONTS}');
:root {
  --brick:#981915; --brick-soft:#f3e7e5;
  --g2:#1a191c; --g1:#2b2b2e;
  --bg:#e9e5dd; --white:#ffffff;
  --line:#ddd9d0; --ink:#2d2c30; --ink2:#6b6872;
  --success:#3f7a4b; --warn:#b07a1e; --danger:#a33327;
}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Hanken Grotesk',sans-serif;background:var(--bg);color:var(--ink);font-size:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.toolbar{display:flex;justify-content:center;padding:16px;gap:12px;}
.toolbar button{background:var(--brick);color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:13px;font-family:inherit;font-weight:700;cursor:pointer;}
@media print{.toolbar{display:none!important;}}
.page{max-width:820px;margin:0 auto;background:var(--white);border-radius:4px;overflow:hidden;}

/* Header */
.dh{background:var(--g2);padding:20px 28px;display:flex;justify-content:space-between;align-items:center;}
.dh-logo{display:flex;align-items:center;gap:10px;}
.dh-mark{width:32px;height:32px;background:var(--brick);border-radius:6px;display:flex;align-items:center;justify-content:center;font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:14px;color:#fff;}
.dh-name{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:700;letter-spacing:1px;color:#fff;}
.dh-name span{font-weight:300;}
.dh-right{text-align:right;}
.dh-doc{font-size:11px;font-weight:700;letter-spacing:2px;color:var(--brick);text-transform:uppercase;}
.dh-sub{font-size:10px;color:rgba(255,255,255,.45);margin-top:2px;}
.dh-bar{height:3px;background:var(--brick);}

/* Body */
.body{padding:28px 28px 36px;}
.section-title{font-size:9px;font-weight:700;letter-spacing:2px;color:var(--brick);text-transform:uppercase;margin:28px 0 10px;padding-bottom:6px;border-bottom:1px solid var(--line);}
.section-title:first-child{margin-top:0;}

/* KPI grid */
.kpi-grid{display:grid;gap:10px;margin-bottom:20px;}
.kpi-grid-6{grid-template-columns:repeat(6,1fr);}
.kpi-grid-4{grid-template-columns:repeat(4,1fr);}
.kpi-grid-3{grid-template-columns:repeat(3,1fr);}
.kpi{background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:12px 14px;text-align:center;}
.kpi-label{font-size:9px;color:var(--ink2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.8px;}
.kpi-val{font-size:16px;font-weight:800;font-family:'Barlow Condensed',sans-serif;}

/* Tables */
table{width:100%;border-collapse:collapse;margin-bottom:16px;}
th{background:var(--g2);color:#fff;padding:8px 11px;text-align:left;font-size:9px;font-weight:700;letter-spacing:.8px;}
th.r{text-align:right;}
td{padding:7px 11px;border-bottom:1px solid var(--line);font-size:11px;vertical-align:top;}
td.r{text-align:right;font-weight:600;}
tr:nth-child(even) td{background:#faf9f7;}
.tr-total td{background:var(--g2)!important;color:#fff;font-weight:800;}
.tr-foot td{background:var(--brick)!important;color:#fff;font-weight:800;}

/* Info grid */
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--line);border-radius:8px;overflow:hidden;margin-bottom:20px;}
.info-item{padding:9px 14px;font-size:11px;border-bottom:1px solid var(--line);}
.info-item:nth-child(even){background:var(--bg);}
.info-item:nth-last-child(-n+2){border-bottom:none;}
.info-label{font-size:9px;color:var(--ink2);margin-bottom:3px;text-transform:uppercase;letter-spacing:.6px;}
.info-val{font-weight:700;font-size:13px;}

/* Progress */
.prog-bar{height:8px;background:var(--line);border-radius:4px;overflow:hidden;margin:10px 0 18px;}
.prog-fill{height:8px;border-radius:4px;background:linear-gradient(90deg,var(--brick),#c0312c);}

/* Phase list */
.fase-row{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--line);}
.fase-row:last-child{border:none;}
.fase-dot{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;}
.fase-dot.done{background:var(--success);color:#fff;}
.fase-dot.current{background:var(--brick);color:#fff;}
.fase-dot.pending{background:var(--line);color:var(--ink2);}
.fase-nome{font-size:12px;}
.fase-nome.done{color:var(--success);}
.fase-nome.current{font-weight:700;color:var(--brick);}
.fase-nome.pending{color:var(--ink2);}
.fase-badge{margin-left:auto;background:var(--brick);color:#fff;border-radius:20px;padding:2px 10px;font-size:9px;font-weight:700;}

/* Footer */
.docfoot{margin-top:32px;padding-top:12px;border-top:1px solid var(--line);display:flex;justify-content:space-between;font-size:9px;color:var(--ink2);}

/* Capa (cover) */
.capa{background:linear-gradient(135deg,var(--g2) 55%,var(--brick) 150%);padding:44px 36px 36px;color:#fff;}
.capa-eyebrow{font-size:9px;font-weight:700;letter-spacing:2.5px;color:rgba(255,255,255,.4);text-transform:uppercase;margin-bottom:14px;}
.capa-title{font-family:'Barlow Condensed',sans-serif;font-size:30px;font-weight:800;line-height:1.1;margin-bottom:8px;}
.capa-sub{font-size:13px;color:rgba(255,255,255,.65);margin-bottom:18px;}
.capa-badges{display:flex;gap:8px;flex-wrap:wrap;}
.capa-badge{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:20px;padding:3px 12px;font-size:10px;font-weight:600;}

/* RDO registro */
.registro{border:1px solid var(--line);border-radius:8px;margin-bottom:16px;overflow:hidden;}
.reg-header{background:var(--bg);padding:11px 16px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;border-bottom:1px solid var(--line);}
.reg-field-label{font-size:9px;color:var(--ink2);margin-bottom:2px;text-transform:uppercase;}
.reg-field-val{font-weight:700;font-size:12px;}
.reg-body{padding:14px 16px;}
.reg-section{margin-bottom:12px;}
.reg-section:last-child{margin-bottom:0;}
.reg-section-label{font-size:9px;color:var(--ink2);text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;}
.reg-section-val{font-size:12px;color:var(--ink);line-height:1.65;white-space:pre-wrap;}
.ocorrencia{background:#fff5f5;border-left:3px solid var(--brick);padding:9px 13px;border-radius:0 4px 4px 0;font-size:11px;}

/* Valor box (contrato) */
.valor-box{background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:18px 20px;margin:12px 0;}
.valor-total{font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:800;color:var(--brick);}
.pgto-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px;}
.pgto-item{background:#fff;border:1px solid var(--line);border-radius:6px;padding:13px;text-align:center;}
.pgto-pct{font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:800;color:var(--brick);margin-bottom:3px;}
.pgto-desc{font-size:9px;color:var(--ink2);margin-bottom:6px;}
.pgto-val{font-size:12px;font-weight:700;}

/* Assinaturas */
.assin-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:52px;}
.assin-box{text-align:center;}
.assin-line{border-top:1px solid #999;margin-top:52px;margin-bottom:8px;}

/* Clausulas */
.clausula{margin-bottom:14px;line-height:1.7;font-size:11.5px;color:var(--ink);}
`;

function docHead(titulo, subtitulo) {
  return `
  <div class="dh">
    <div class="dh-logo">
      <div class="dh-mark">SF</div>
      <div class="dh-name">STICK<span>FRAME</span></div>
    </div>
    <div class="dh-right">
      <div class="dh-doc">${titulo}</div>
      <div class="dh-sub">${subtitulo}</div>
    </div>
  </div>
  <div class="dh-bar"></div>`;
}

function docToolbar(label = "Imprimir / Salvar PDF") {
  return `<div class="toolbar"><button onclick="window.print()">${label}</button></div>`;
}

function wrap(head, body) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>${BASE_CSS}</style>
</head>
<body>
${docToolbar()}
<div class="page">
  ${head}
  <div class="body">${body}</div>
</div>
</body>
</html>`;
}

function fmtR(v) {
  return `R$ ${Number(v ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function corSaldo(v) {
  return Number(v) >= 0 ? "var(--success)" : "var(--danger)";
}

// ── 1. Relatório de Obra (financeiro + lançamentos) ──────────────────────────

export function gerarRelatorioObra(obra, financeiro, medicoes = []) {
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const receitas = (financeiro ?? []).filter(f => f.tipo === "receita");
  const despesas = (financeiro ?? []).filter(f => f.tipo === "despesa");
  const totRec   = receitas.reduce((a, f) => a + (f.valor || 0), 0);
  const totDesp  = despesas.reduce((a, f) => a + (f.valor || 0), 0);
  const saldo    = totRec - totDesp;
  const contrato = obra.contrato || 0;
  const margem   = contrato > 0 ? ((saldo / contrato) * 100).toFixed(1) : "—";

  const lancRows = (financeiro ?? []).slice(0, 30).map(f => `<tr>
    <td>${f.data || "—"}</td>
    <td>${f.descricao || "—"}</td>
    <td style="color:${f.tipo === "receita" ? "var(--success)" : "var(--danger)"}">${f.tipo === "receita" ? "Receita" : "Despesa"}</td>
    <td class="r" style="color:${f.tipo === "receita" ? "var(--success)" : "var(--danger)"}">${fmtR(f.valor)}</td>
  </tr>`).join("");

  const medRows = medicoes.map((m, i) => `<tr>
    <td>${i + 1}</td>
    <td>${m.descricao || m.servico || "—"}</td>
    <td>${m.data || "—"}</td>
    <td class="r">${m.percentual_previsto || 0}%</td>
    <td class="r">${m.percentual || m.percentual_acumulado || 0}%</td>
    <td class="r">${fmtR((m.percentual || 0) / 100 * contrato)}</td>
  </tr>`).join("");

  const body = `
  <div class="section-title">Identificação</div>
  <div class="info-grid">
    <div class="info-item"><div class="info-label">Obra</div><div class="info-val">${obra.nome || "—"}</div></div>
    <div class="info-item"><div class="info-label">Cliente</div><div class="info-val">${obra.cliente || "—"}</div></div>
    <div class="info-item"><div class="info-label">Status</div><div class="info-val">${obra.status || "—"}</div></div>
    <div class="info-item"><div class="info-label">Fase</div><div class="info-val">${obra.fase || "—"}</div></div>
    <div class="info-item"><div class="info-label">Progresso</div><div class="info-val">${obra.progresso || 0}%</div></div>
    <div class="info-item"><div class="info-label">Valor Contratado</div><div class="info-val" style="color:var(--brick)">${fmtR(contrato)}</div></div>
  </div>

  <div class="section-title">Resumo Financeiro</div>
  <div class="kpi-grid kpi-grid-4" style="margin-bottom:20px">
    <div class="kpi"><div class="kpi-label">Receitas</div><div class="kpi-val" style="color:var(--success)">${fmtR(totRec)}</div></div>
    <div class="kpi"><div class="kpi-label">Despesas</div><div class="kpi-val" style="color:var(--danger)">${fmtR(totDesp)}</div></div>
    <div class="kpi"><div class="kpi-label">Saldo</div><div class="kpi-val" style="color:${corSaldo(saldo)}">${fmtR(saldo)}</div></div>
    <div class="kpi"><div class="kpi-label">Margem</div><div class="kpi-val" style="color:${corSaldo(saldo)}">${margem}%</div></div>
  </div>

  ${(financeiro ?? []).length > 0 ? `
  <div class="section-title">Lançamentos Financeiros</div>
  <table>
    <thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th class="r">Valor</th></tr></thead>
    <tbody>${lancRows}</tbody>
  </table>` : ""}

  ${medicoes.length > 0 ? `
  <div class="section-title">Medições</div>
  <table>
    <thead><tr><th>#</th><th>Serviço / Etapa</th><th>Data</th><th class="r">% Prev.</th><th class="r">% Real.</th><th class="r">Valor Medido</th></tr></thead>
    <tbody>${medRows}</tbody>
  </table>` : ""}

  <div class="docfoot">
    <span>StickFrame Sistemas Construtivos — Documento Confidencial</span>
    <span>Emitido em ${hoje}</span>
  </div>`;

  const nome = (obra.nome || "obra").replace(/\s+/g, "-").toLowerCase();
  printHtml(wrap(docHead("RELATÓRIO DE OBRA", `Emitido em ${hoje}`), body), `relatorio-${nome}`);
}

// ── 2. Relatório Mensal ──────────────────────────────────────────────────────

export function gerarRelatorioMensal(empresaNome, obras, clientes, financeiro) {
  const hoje  = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const mesAno = new Date().toLocaleString("pt-BR", { month: "long", year: "numeric" });

  const obrasAtivas  = obras.filter(o => o.status === "Em execução").length;
  const totRec  = financeiro.filter(f => f.tipo === "receita").reduce((a, f) => a + (f.valor || 0), 0);
  const totDesp = financeiro.filter(f => f.tipo === "despesa").reduce((a, f) => a + (f.valor || 0), 0);
  const saldo   = totRec - totDesp;

  const obrasRows = obras.map(o => `<tr>
    <td>${o.nome || "—"}</td>
    <td style="color:var(--ink2)">${o.cliente || "—"}</td>
    <td style="color:var(--ink2)">${o.status || "—"}</td>
    <td class="r">${o.progresso || 0}%</td>
    <td class="r" style="color:var(--brick)">${fmtR(o.contrato)}</td>
  </tr>`).join("");

  const body = `
  <div class="section-title">Consolidado — ${mesAno}</div>
  <div class="kpi-grid kpi-grid-6" style="margin-bottom:24px">
    <div class="kpi"><div class="kpi-label">Clientes</div><div class="kpi-val">${clientes.length}</div></div>
    <div class="kpi"><div class="kpi-label">Obras ativas</div><div class="kpi-val" style="color:var(--brick)">${obrasAtivas}</div></div>
    <div class="kpi"><div class="kpi-label">Total obras</div><div class="kpi-val">${obras.length}</div></div>
    <div class="kpi"><div class="kpi-label">Receitas</div><div class="kpi-val" style="color:var(--success)">${fmtR(totRec)}</div></div>
    <div class="kpi"><div class="kpi-label">Despesas</div><div class="kpi-val" style="color:var(--danger)">${fmtR(totDesp)}</div></div>
    <div class="kpi"><div class="kpi-label">Saldo</div><div class="kpi-val" style="color:${corSaldo(saldo)}">${fmtR(saldo)}</div></div>
  </div>

  ${obras.length > 0 ? `
  <div class="section-title">Obras</div>
  <table>
    <thead><tr><th>Obra</th><th>Cliente</th><th>Status</th><th class="r">Progresso</th><th class="r">Contrato</th></tr></thead>
    <tbody>${obrasRows}</tbody>
  </table>` : ""}

  <div class="docfoot">
    <span>StickFrame · ${empresaNome || "Empresa"}</span>
    <span>Emitido em ${hoje}</span>
  </div>`;

  printHtml(wrap(docHead(`RELATÓRIO MENSAL — ${mesAno.toUpperCase()}`, `Emitido em ${hoje}`), body), `relatorio-mensal`);
}

// ── 3. Boletim de Medição ────────────────────────────────────────────────────

export function gerarBoletimMedicao(obra, medicoes = []) {
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const contrato = obra.contrato || 0;

  const totPrev = medicoes.reduce((a, m) => a + (m.percentual_previsto || 0), 0);
  const totReal = medicoes.reduce((a, m) => a + (m.percentual || m.percentual_acumulado || 0), 0);
  const totValor = medicoes.reduce((a, m) => a + (m.percentual || 0) / 100 * contrato, 0);

  const rows = medicoes.map((m, i) => `<tr>
    <td>${i + 1}</td>
    <td>${m.descricao || m.servico || "—"}</td>
    <td>${m.data || "—"}</td>
    <td class="r">${(m.percentual_previsto || 0).toFixed(1)}%</td>
    <td class="r">${(m.percentual || m.percentual_acumulado || 0).toFixed(1)}%</td>
    <td class="r">${fmtR((m.percentual || 0) / 100 * contrato)}</td>
  </tr>`).join("");

  const body = `
  <div class="section-title">Identificação</div>
  <div class="info-grid">
    <div class="info-item"><div class="info-label">Obra</div><div class="info-val">${obra.nome || "—"}</div></div>
    <div class="info-item"><div class="info-label">Cliente</div><div class="info-val">${obra.cliente || "—"}</div></div>
    <div class="info-item"><div class="info-label">Valor Contratado</div><div class="info-val" style="color:var(--brick)">${fmtR(contrato)}</div></div>
    <div class="info-item"><div class="info-label">Progresso Geral</div><div class="info-val">${obra.progresso || 0}%</div></div>
  </div>

  <div class="section-title">Medições</div>
  ${medicoes.length === 0
    ? `<p style="color:var(--ink2);text-align:center;padding:32px 0">Nenhuma medição registrada.</p>`
    : `<table>
    <thead><tr><th>#</th><th>Serviço / Etapa</th><th>Data</th><th class="r">% Previsto</th><th class="r">% Realizado</th><th class="r">Valor Medido</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr class="tr-foot">
      <td colspan="3"><strong>TOTAL</strong></td>
      <td class="r">${totPrev.toFixed(1)}%</td>
      <td class="r">${totReal.toFixed(1)}%</td>
      <td class="r">${fmtR(totValor)}</td>
    </tr></tfoot>
  </table>`}

  <div class="docfoot">
    <span>StickFrame Sistemas Construtivos</span>
    <span>Emitido em ${hoje}</span>
  </div>`;

  const nome = (obra.nome || "obra").replace(/\s+/g, "-").toLowerCase();
  printHtml(wrap(docHead("BOLETIM DE MEDIÇÃO", `Emitido em ${hoje}`), body), `boletim-${nome}`);
}

// ── 4. StickScore™ Relatório Compartilhável ──────────────────────────────────

export function gerarRelatorioStickScore(obra, score, historico = []) {
  const { total, scores, nivel, cor, penalidade } = score;
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const delta = historico.length >= 2
    ? total - historico[historico.length - 2].total
    : null;

  const size = 120, r = 48, circ = 2 * Math.PI * r;
  const dash = (total / 100) * circ;
  const ringBg = cor + "22";
  const scoreSvg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg)">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${ringBg}" stroke-width="10"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${cor}" stroke-width="10"
        stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}" stroke-linecap="round"/>
    </svg>`;

  let historicoHtml = "";
  if (historico.length >= 2) {
    const W = 480, H = 80;
    const vals = historico.map(h => h.total);
    const min  = Math.max(0, Math.min(...vals) - 8);
    const max  = Math.min(100, Math.max(...vals) + 5);
    const range = max - min || 1;
    const padX = 16;
    const pts = vals.map((v, i) => ({
      x: padX + (i / (vals.length - 1)) * (W - padX * 2),
      y: H - ((v - min) / range) * (H - 12),
      v,
      mes: historico[i].mes.slice(5),
    }));
    const poly = pts.map(p => `${p.x},${p.y}`).join(" ");
    const area = `M ${poly.replace(/ /g, " L ")} L ${pts[pts.length-1].x},${H} L ${pts[0].x},${H} Z`;

    historicoHtml = `
      <div style="margin-top:24px">
        <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.35);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px">Evolução mensal</div>
        <svg viewBox="0 0 ${W} ${H + 20}" style="width:100%;height:auto;display:block">
          <defs>
            <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${cor}" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="${cor}" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <path d="${area}" fill="url(#hg)"/>
          <polyline points="${poly}" fill="none" stroke="${cor}" stroke-width="2" stroke-linejoin="round"/>
          ${pts.map((p, i) =>
            `<circle cx="${p.x}" cy="${p.y}" r="${i === pts.length-1 ? 5 : 3}" fill="${i === pts.length-1 ? cor : "rgba(255,255,255,0.4)"}"/>`
          ).join("")}
          ${pts.map(p =>
            `<text x="${p.x}" y="${H + 14}" text-anchor="middle" font-size="9" fill="rgba(255,255,255,.45)">${p.mes}</text>`
          ).join("")}
          ${pts.map((p, i) => i === pts.length - 1
            ? `<text x="${p.x}" y="${p.y - 8}" text-anchor="middle" font-size="10" fill="${cor}" font-weight="800">${p.v}</text>`
            : ""
          ).join("")}
        </svg>
      </div>`;
  }

  const dimBars = STICK_SCORE_DIMENSOES.map(({ key, label, peso }) => {
    const val = scores[key] ?? 0;
    const barCor = val >= 85 ? "#059669" : val >= 70 ? "#3f7a4b" : val >= 55 ? "#3b6ea5" : val >= 40 ? "#b07a1e" : "#981915";
    return `
      <div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px">
          <span style="font-size:12px;color:rgba(255,255,255,.6)">${label} <span style="font-size:9px;opacity:.4">${peso}</span></span>
          <span style="font-size:12px;font-weight:800;color:${barCor}">${val}</span>
        </div>
        <div style="height:6px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden">
          <div style="height:6px;width:${val}%;background:linear-gradient(90deg,${barCor}90,${barCor});border-radius:3px"></div>
        </div>
      </div>`;
  }).join("");

  const insights = gerarInsights(score, historico);
  const insightStyle = {
    positivo: { bg: "#3f7a4b20", border: "#3f7a4b40", color: "#6ee7b7", icon: "↑" },
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

  const deltaBadge = delta !== null ? `
    <div style="margin-top:8px;font-size:13px;font-weight:700;color:${delta >= 0 ? "#6ee7b7" : "#fca5a5"}">
      ${delta >= 0 ? "↑ +" : "↓ "}${delta} pts vs mês anterior
    </div>` : "";

  const penalHtml = penalidade ? `
    <div style="margin-top:16px;padding:10px 12px;border-radius:8px;background:#b07a1e20;border:1px solid #b07a1e40;font-size:12px;color:#fcd34d;display:flex;gap:8px">
      <span></span><span>Score limitado a ${total} — ${penalidade}</span>
    </div>` : "";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>StickScore™ — ${obra.nome || "Obra"}</title>
  <style>
    @import url('${FONTS}');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Hanken Grotesk',sans-serif;background:#e9e5dd;color:#2d2c30;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .toolbar{display:flex;justify-content:center;padding:16px;}
    .toolbar button{background:#981915;color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:13px;font-family:inherit;font-weight:700;cursor:pointer;}
    @media print{.toolbar{display:none!important;} body{background:#fff;}}
    .page{max-width:680px;margin:0 auto;padding-bottom:32px;}
  </style>
</head>
<body>
${docToolbar()}
<div class="page">

  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:24px 0 20px;flex-wrap:wrap;gap:12px">
    <div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:800;color:#981915;letter-spacing:1px">STICK<span style="font-weight:300">FRAME</span></div>
      <div style="font-size:10px;color:#9aa0a8;margin-top:2px">Gestão de Obras Steel Frame</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#981915;text-transform:uppercase">StickScore™</div>
      <div style="font-size:11px;color:#9aa0a8;margin-top:2px">Relatório de Desempenho</div>
      <div style="font-size:10px;color:#c0c4cc;margin-top:2px">${hoje} · ${hora}</div>
    </div>
  </div>

  <div style="background:#fff;border:1px solid #ddd9d0;border-radius:12px;padding:18px 20px;margin-bottom:20px">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:800;color:#1a191c;margin-bottom:6px">${obra.nome || "Sem nome"}</div>
    <div style="display:flex;gap:20px;flex-wrap:wrap">
      ${obra.cliente  ? `<span style="font-size:12px;color:#6b7280"> ${obra.cliente}</span>` : ""}
      ${obra.status   ? `<span style="font-size:12px;color:#6b7280"> ${obra.status}</span>` : ""}
      ${obra.progresso != null ? `<span style="font-size:12px;color:#6b7280"> ${obra.progresso}% concluído</span>` : ""}
    </div>
  </div>

  <div style="background:linear-gradient(135deg,#0f0f14 0%,#1a191c 100%);border-radius:16px;padding:28px;border:1px solid ${cor}30;box-shadow:0 8px 32px ${cor}18;margin-bottom:20px">
    <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap">
      <div style="position:relative;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">
        ${scoreSvg}
        <div style="position:absolute;text-align:center">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:32px;font-weight:800;color:${cor};line-height:1">${total}</div>
          <div style="font-size:9px;color:rgba(255,255,255,.3)">/&nbsp;100</div>
        </div>
      </div>
      <div>
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:${cor};text-transform:uppercase;margin-bottom:6px">StickScore™</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:30px;font-weight:800;color:#fff;line-height:1">${nivel}</div>
        ${deltaBadge}
        <div style="display:inline-flex;align-items:center;gap:6px;background:${cor}20;border:1px solid ${cor}40;border-radius:20px;padding:5px 14px;margin-top:10px">
          <div style="width:7px;height:7px;border-radius:50%;background:${cor}"></div>
          <span style="font-size:11px;font-weight:700;color:${cor}">Índice de Saúde da Obra</span>
        </div>
      </div>
    </div>
    <div style="margin-top:24px;border-top:1px solid rgba(255,255,255,.06);padding-top:20px">
      ${dimBars}
    </div>
    ${penalHtml}
    ${insightsHtml}
    ${historicoHtml}
  </div>

  <div style="text-align:center;padding:16px;font-size:10px;color:#9aa0a8;line-height:1.6">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;color:#6b7280;margin-bottom:2px">StickFrame · StickScore™</div>
    Índice proprietário que mede a saúde da obra em tempo real —
    cronograma, financeiro, compras, equipe e qualidade num único número de 0 a 100.
  </div>

</div>
</body>
</html>`;

  printHtml(html, `stickscore-${(obra.nome || "obra").toLowerCase().replace(/\s+/g, "-")}`);
}
