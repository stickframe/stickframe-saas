import { FASES } from "../utils/constants";
import { fmt } from "../utils/format";
import { hoje } from "../utils/date";
import { printHtml } from "../utils/printHtml";

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
.dh-img{max-height:32px;max-width:80px;object-fit:contain;}
.dh-name{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:700;letter-spacing:1px;color:#fff;}
.dh-name span{font-weight:300;}
.dh-right{text-align:right;}
.dh-doc{font-size:11px;font-weight:700;letter-spacing:2px;color:var(--brick);text-transform:uppercase;}
.dh-sub{font-size:10px;color:rgba(255,255,255,.45);margin-top:2px;}
.dh-bar{height:3px;}

/* Body */
.body{padding:28px 28px 36px;}
.section-title{font-size:9px;font-weight:700;letter-spacing:2px;color:var(--brick);text-transform:uppercase;margin:28px 0 10px;padding-bottom:6px;border-bottom:1px solid var(--line);}
.section-title:first-child{margin-top:0;}

/* KPI */
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

/* Info grid */
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--line);border-radius:8px;overflow:hidden;margin-bottom:20px;}
.info-item{padding:9px 14px;font-size:11px;border-bottom:1px solid var(--line);}
.info-item:nth-child(even){background:var(--bg);}
.info-item:nth-last-child(-n+2){border-bottom:none;}
.info-label{font-size:9px;color:var(--ink2);margin-bottom:3px;text-transform:uppercase;letter-spacing:.6px;}
.info-val{font-weight:700;font-size:13px;}

/* Progress */
.prog-pct{font-family:'Barlow Condensed',sans-serif;font-size:36px;font-weight:800;color:var(--brick);}
.prog-bar{height:10px;background:var(--line);border-radius:5px;overflow:hidden;margin:10px 0 18px;}
.prog-fill{height:10px;border-radius:5px;}

/* Phases */
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

/* RDO */
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

/* Contrato */
.clausula{margin-bottom:14px;line-height:1.7;font-size:11.5px;color:var(--ink);}
.valor-box{background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:18px 20px;margin:12px 0;}
.valor-total{font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:800;color:var(--brick);}
.pgto-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px;}
.pgto-item{background:#fff;border:1px solid var(--line);border-radius:6px;padding:13px;text-align:center;}
.pgto-pct{font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:800;color:var(--brick);margin-bottom:3px;}
.pgto-desc{font-size:9px;color:var(--ink2);margin-bottom:6px;}
.pgto-val{font-size:12px;font-weight:700;}
.assin-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:52px;}
.assin-box{text-align:center;}
.assin-line{border-top:1px solid #999;margin-top:52px;margin-bottom:8px;}

/* Cover */
.capa{padding:44px 36px 36px;color:#fff;}
.capa-eyebrow{font-size:9px;font-weight:700;letter-spacing:2.5px;color:rgba(255,255,255,.4);text-transform:uppercase;margin-bottom:14px;}
.capa-title{font-family:'Barlow Condensed',sans-serif;font-size:30px;font-weight:800;line-height:1.1;margin-bottom:8px;}
.capa-sub{font-size:13px;color:rgba(255,255,255,.65);margin-bottom:18px;}
.capa-badges{display:flex;gap:8px;flex-wrap:wrap;}
.capa-badge{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:20px;padding:3px 12px;font-size:10px;font-weight:600;}

/* Footer */
.docfoot{margin-top:32px;padding-top:12px;border-top:1px solid var(--line);display:flex;justify-content:space-between;font-size:9px;color:var(--ink2);}
`;

function docHead(titulo, subtitulo, branding = null) {
  const cor = branding?.cor_primaria || "#981915";
  const nome = branding?.nome || "STICKFRAME";
  const logoContent = branding?.logo_url
    ? `<img src="${branding.logo_url}" class="dh-img"/>`
    : `<div class="dh-mark" style="background:${cor}">SF</div>`;

  return `
  <div class="dh">
    <div class="dh-logo">
      ${logoContent}
      <div class="dh-name" style="color:#fff">${nome.toUpperCase()}<span style="font-weight:300"></span></div>
    </div>
    <div class="dh-right">
      <div class="dh-doc" style="color:${cor}">${titulo}</div>
      <div class="dh-sub">${subtitulo}</div>
    </div>
  </div>
  <div class="dh-bar" style="background:${cor}"></div>`;
}

function wrap(head, body, title = "StickFrame") {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <style>${BASE_CSS}</style>
</head>
<body>
<div class="toolbar"><button onclick="window.print()">Imprimir / Salvar PDF</button></div>
<div class="page">
  ${head}
  <div class="body">${body}</div>
</div>
</body>
</html>`;
}

function corSaldo(v) {
  return Number(v) >= 0 ? "var(--success)" : "var(--danger)";
}

// ── 1. Relatório Financeiro ───────────────────────────────────────────────────

export function gerarRelatorioFinanceiro(obras, financeiro) {
  const mes  = new Date().toLocaleString("pt-BR", { month: "long" });
  const ano  = new Date().getFullYear();
  const data = hoje();

  const obrasData = obras.map(o => {
    const fin  = financeiro[o.id] || { contrato: 0, lancamentos: [] };
    const rec  = fin.lancamentos.filter(l => l.tipo === "receita").reduce((a, l) => a + l.valor, 0);
    const desp = fin.lancamentos.filter(l => l.tipo === "despesa").reduce((a, l) => a + l.valor, 0);
    const saldo = rec - desp;
    const marg  = rec > 0 ? (saldo / rec) * 100 : 0;
    return { ...o, fin, rec, desp, saldo, marg, contrato: fin.contrato || o.contrato || 0 };
  });

  const totRec   = obrasData.reduce((a, o) => a + o.rec, 0);
  const totDesp  = obrasData.reduce((a, o) => a + o.desp, 0);
  const totSaldo = totRec - totDesp;
  const totMarg  = totRec > 0 ? (totSaldo / totRec) * 100 : 0;
  const totCont  = obrasData.reduce((a, o) => a + o.contrato, 0);

  const rows = obrasData.map(o => `<tr>
    <td>${(o.nome || "—").split("—")[0].trim()}</td>
    <td style="color:var(--ink2)">${o.cliente || "—"}</td>
    <td style="color:var(--ink2)">${o.fase || "—"}</td>
    <td class="r" style="color:var(--success)">${fmt(o.rec)}</td>
    <td class="r" style="color:var(--danger)">${fmt(o.desp)}</td>
    <td class="r" style="color:${corSaldo(o.saldo)}">${fmt(o.saldo)}</td>
    <td class="r" style="color:${corSaldo(o.marg)}">${o.marg.toFixed(1)}%</td>
  </tr>`).join("");

  const body = `
  <div class="section-title">Consolidado Geral</div>
  <div class="kpi-grid kpi-grid-6" style="margin-bottom:24px">
    <div class="kpi"><div class="kpi-label">Contratos</div><div class="kpi-val">${fmt(totCont)}</div></div>
    <div class="kpi"><div class="kpi-label">Receitas</div><div class="kpi-val" style="color:var(--success)">${fmt(totRec)}</div></div>
    <div class="kpi"><div class="kpi-label">Despesas</div><div class="kpi-val" style="color:var(--danger)">${fmt(totDesp)}</div></div>
    <div class="kpi"><div class="kpi-label">Saldo</div><div class="kpi-val" style="color:${corSaldo(totSaldo)}">${fmt(totSaldo)}</div></div>
    <div class="kpi"><div class="kpi-label">Margem</div><div class="kpi-val" style="color:${corSaldo(totMarg)}">${totMarg.toFixed(1)}%</div></div>
    <div class="kpi"><div class="kpi-label">A receber</div><div class="kpi-val" style="color:var(--warn)">${fmt(totCont - totRec)}</div></div>
  </div>

  <div class="section-title">Resumo por Obra</div>
  <table>
    <thead><tr>
      <th>Obra</th><th>Cliente</th><th>Fase</th>
      <th class="r">Receitas</th><th class="r">Despesas</th><th class="r">Saldo</th><th class="r">Margem</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr class="tr-total">
      <td colspan="3"><strong>TOTAL</strong></td>
      <td class="r">${fmt(totRec)}</td>
      <td class="r">${fmt(totDesp)}</td>
      <td class="r">${fmt(totSaldo)}</td>
      <td class="r">${totMarg.toFixed(1)}%</td>
    </tr></tfoot>
  </table>

  <div class="docfoot">
    <span>StickFrame Sistemas Construtivos — Documento Confidencial</span>
    <span>Emitido em ${data}</span>
  </div>`;

  printHtml(
    wrap(docHead(`RELATÓRIO FINANCEIRO — ${mes.toUpperCase()} ${ano}`, `Emitido em ${data}`), body, "Relatório Financeiro"),
    `Relatorio_Financeiro_${mes}_${ano}`
  );
}

// ── 2. Contrato de Prestação de Serviços ─────────────────────────────────────

export function gerarContratoPDF(contrato) {
  const data = hoje();
  const v30  = fmt(contrato.valor * 0.30);
  const v40  = fmt(contrato.valor * 0.40);
  const v30f = fmt(contrato.valor * 0.30);
  const cidade = contrato.cidade || "Votuporanga";

  const body = `
  <div style="margin-bottom:6px">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:800;color:var(--g2)">Contrato de Prestação de Serviços</div>
    <div style="font-size:12px;color:var(--ink2);margin-top:4px">Sistema Construtivo Steel Frame — ${contrato.obra}</div>
  </div>

  <div class="section-title">Partes Contratantes</div>
  <div class="info-grid">
    <div class="info-item"><div class="info-label">Contratada</div><div class="info-val">Stick Frame Sistemas Construtivos Ltda.</div></div>
    <div class="info-item"><div class="info-label">CNPJ</div><div class="info-val">XX.XXX.XXX/0001-XX</div></div>
    <div class="info-item"><div class="info-label">Endereço de Operação</div><div class="info-val">${cidade} / SP</div></div>
    <div class="info-item"><div class="info-label">Representante</div><div class="info-val">André Queiroz Candido</div></div>
    <div class="info-item"><div class="info-label">Contratante</div><div class="info-val">${contrato.cliente}</div></div>
    <div class="info-item"><div class="info-label">Data</div><div class="info-val">${contrato.data}</div></div>
  </div>

  <div class="section-title">Objeto</div>
  <div class="clausula"><strong>Cláusula 1ª.</strong> Construção de <strong>${contrato.unidades} unidade(s)</strong> em Steel Frame, área de <strong>${contrato.area} m²</strong> cada (total: ${contrato.unidades * contrato.area} m²), padrão <strong>${contrato.padrao}</strong>, conforme projeto executivo, no empreendimento <strong>${contrato.obra}</strong>.</div>

  <div class="section-title">Valor e Pagamento</div>
  <div class="valor-box">
    <div style="font-size:9px;color:var(--ink2);margin-bottom:4px;text-transform:uppercase;letter-spacing:1px">Valor Total do Contrato</div>
    <div class="valor-total">${fmt(contrato.valor)}</div>
    <div style="font-size:10px;color:var(--ink2);margin-top:4px">${fmt(contrato.valor / contrato.unidades)}/unid. · ${fmt(contrato.valor / (contrato.unidades * contrato.area))}/m²</div>
  </div>
  <div class="pgto-grid">
    <div class="pgto-item"><div class="pgto-pct">30%</div><div class="pgto-desc">Na assinatura</div><div class="pgto-val">${v30}</div></div>
    <div class="pgto-item"><div class="pgto-pct">40%</div><div class="pgto-desc">Na conclusão da estrutura</div><div class="pgto-val">${v40}</div></div>
    <div class="pgto-item"><div class="pgto-pct">30%</div><div class="pgto-desc">Na entrega</div><div class="pgto-val">${v30f}</div></div>
  </div>

  <div class="section-title">Prazo</div>
  <div class="clausula"><strong>Cláusula 3ª.</strong> Prazo de execução: <strong>${contrato.prazo !== "—" ? contrato.prazo : "a definir"}</strong>, contado da emissão da Ordem de Serviço e do primeiro pagamento.</div>

  <div class="section-title">Garantia</div>
  <div class="clausula"><strong>Cláusula 4ª.</strong> A Stick Frame garante a estrutura por <strong>10 anos</strong>, conforme normas ABNT NBR 15575.</div>

  <div class="section-title">Foro</div>
  <div class="clausula"><strong>Cláusula 5ª.</strong> Eleito o Foro da Comarca de ${cidade}/SP para dirimir quaisquer dúvidas deste instrumento.</div>

  <div class="assin-grid">
    <div class="assin-box">
      <div class="assin-line"></div>
      <div style="font-weight:700">Stick Frame Sistemas Construtivos Ltda.</div>
      <div style="font-size:10px;color:var(--ink2)">Contratada — André Queiroz Candido</div>
    </div>
    <div class="assin-box">
      <div class="assin-line"></div>
      <div style="font-weight:700">${contrato.cliente}</div>
      <div style="font-size:10px;color:var(--ink2)">Contratante</div>
    </div>
  </div>

  <div class="docfoot" style="margin-top:24px">
    <span>${cidade}/SP, ${data} · ${contrato.ref}</span>
    <span>Stick Frame Sistemas Construtivos</span>
  </div>`;

  printHtml(
    wrap(docHead("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", `${contrato.ref} · ${contrato.data}`), body, "Contrato"),
    `Contrato_${contrato.ref}`
  );
}

// ── 3. Diário de Obra ─────────────────────────────────────────────────────────

export function gerarDiarioPDF(obra, registros, branding = null) {
  const data = hoje();

  const regHtml = registros.length === 0
    ? `<p style="color:var(--ink2);text-align:center;padding:32px 0">Nenhum registro lançado.</p>`
    : registros.map(r => `
    <div class="registro">
      <div class="reg-header">
        <div><div class="reg-field-label">Data</div><div class="reg-field-val">${r.data || "—"}</div></div>
        <div><div class="reg-field-label">Turno</div><div class="reg-field-val">${r.turno || "—"}</div></div>
        <div><div class="reg-field-label">Clima</div><div class="reg-field-val">${r.clima || "—"}</div></div>
        <div><div class="reg-field-label">Equipe</div><div class="reg-field-val">${r.equipe || 0} pessoas</div></div>
      </div>
      <div class="reg-body">
        <div class="reg-section"><div class="reg-section-label">Responsável</div><div class="reg-section-val" style="font-weight:700">${r.responsavel || "—"}</div></div>
        <div class="reg-section"><div class="reg-section-label">Atividades</div><div class="reg-section-val">${r.atividades || "—"}</div></div>
        ${r.ocorrencias ? `<div class="reg-section"><div class="reg-section-label">Ocorrências</div><div class="ocorrencia">${r.ocorrencias}</div></div>` : ""}
      </div>
    </div>`).join("");

  const body = `
  <div style="margin-bottom:20px">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:800;color:var(--g2)">${obra.nome || "Obra"}</div>
    <div style="font-size:12px;color:var(--ink2);margin-top:4px">Cliente: ${obra.cliente || "—"} · Fase: ${obra.fase || "—"} · ${registros.length} registro(s)</div>
  </div>

  <div class="section-title">Registros</div>
  ${regHtml}

  <div class="docfoot">
    <span>StickFrame Sistemas Construtivos</span>
    <span>${obra.cidade || "Votuporanga"}/SP, ${data}</span>
  </div>`;

  const nome = (obra.nome || "obra").split("—")[0].trim().replace(/\s/g, "_");
  printHtml(
    wrap(docHead("DIÁRIO DE OBRA", `Emitido em ${data}`, branding), body, "Diário de Obra"),
    `Diario_${nome}`
  );
}

// ── 4. Relatório de Obra (RDO completo com capa) ──────────────────────────────

export function gerarRelatorioObra(obra, arquivos = [], branding = null) {
  const data = hoje();
  const faseIdx = FASES.indexOf(obra.fase);
  const cor = branding?.cor_primaria || "#981915";

  const faseRows = FASES.map((f, i) => {
    const done = i < faseIdx, curr = i === faseIdx;
    const cls = done ? "done" : curr ? "current" : "pending";
    return `<div class="fase-row">
      <div class="fase-dot ${cls}">${done ? "✓" : i + 1}</div>
      <div class="fase-nome ${cls}">${f}</div>
      ${curr ? `<div class="fase-badge">Fase atual</div>` : ""}
    </div>`;
  }).join("");

  const capa = `
  <div class="capa" style="background:linear-gradient(135deg,var(--g2) 55%,${cor} 150%)">
    <div class="capa-eyebrow">Relatório de Acompanhamento</div>
    <div class="capa-title">${obra.nome || "Obra"}</div>
    <div class="capa-sub">Cliente: ${obra.cliente || "—"}</div>
    <div class="capa-badges">
      <div class="capa-badge">${obra.status || "—"}</div>
      <div class="capa-badge">Prazo: ${obra.prazo || "—"}</div>
      <div class="capa-badge">Emitido: ${data}</div>
    </div>
  </div>`;

  const body = `
  <div class="section-title">Dados da Estrutura</div>
  <div class="info-grid">
    <div class="info-item"><div class="info-label">Nome</div><div class="info-val">${obra.nome || "—"}</div></div>
    <div class="info-item"><div class="info-label">Cliente</div><div class="info-val">${obra.cliente || "—"}</div></div>
    <div class="info-item"><div class="info-label">Status</div><div class="info-val">${obra.status || "—"}</div></div>
    <div class="info-item"><div class="info-label">Cidade</div><div class="info-val">${obra.cidade || "Votuporanga"}/SP</div></div>
    <div class="info-item"><div class="info-label">Fase Atual</div><div class="info-val" style="color:${cor}">${obra.fase || "—"}</div></div>
    <div class="info-item"><div class="info-label">Emissão</div><div class="info-val">${data}</div></div>
  </div>

  <div class="section-title">Progresso Realizado</div>
  <div style="background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:20px;margin-bottom:20px">
    <div class="prog-pct" style="color:${cor}">${obra.progresso || 0}%</div>
    <div style="font-size:11px;color:var(--ink2);margin-bottom:10px">concluído</div>
    <div class="prog-bar"><div class="prog-fill" style="width:${obra.progresso || 0}%;background:linear-gradient(90deg,${cor},#c0312c)"></div></div>
    ${faseRows}
  </div>

  <div class="docfoot">
    <span>StickFrame Sistemas Construtivos</span>
    <span>${data}</span>
  </div>`;

  const nome = (obra.nome || "obra").split("—")[0].trim().replace(/\s/g, "_");
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Relatório — ${obra.nome || "Obra"}</title>
  <style>${BASE_CSS}</style>
</head>
<body>
<div class="toolbar"><button onclick="window.print()">Imprimir / Salvar PDF</button></div>
<div class="page">
  ${capa}
  ${docHead("RELATÓRIO DE ACOMPANHAMENTO", `Emitido em ${data}`, branding)}
  <div class="body">${body}</div>
</div>
</body>
</html>`;

  printHtml(html, `Relatorio_${nome}`);
}

// ── 5. Portal do Cliente ──────────────────────────────────────────────────────

export function gerarPortalCliente(obra, registros, financeiro) {
  const data  = hoje();
  const fin   = financeiro[obra.id] || { contrato: 0, lancamentos: [] };
  const rec   = fin.lancamentos.filter(l => l.tipo === "receita").reduce((a, l) => a + l.valor, 0);
  const faseIdx = FASES.indexOf(obra.fase);

  const faseRows = FASES.map((f, i) => {
    const done = i < faseIdx, curr = i === faseIdx;
    const cls = done ? "done" : curr ? "current" : "pending";
    return `<div class="fase-row">
      <div class="fase-dot ${cls}">${done ? "✓" : i + 1}</div>
      <div class="fase-nome ${cls}">${f}</div>
      ${curr ? `<div class="fase-badge">Em andamento</div>` : ""}
    </div>`;
  }).join("");

  const ultReg = registros.slice(-3).reverse();
  const regHtml = ultReg.length === 0
    ? `<p style="color:var(--ink2);padding:20px 0">Nenhum registro disponível.</p>`
    : ultReg.map(r => `
    <div class="registro">
      <div class="reg-header">
        <div><div class="reg-field-label">Data</div><div class="reg-field-val">${r.data || "—"}</div></div>
        <div><div class="reg-field-label">Turno</div><div class="reg-field-val">${r.turno || "—"}</div></div>
        <div><div class="reg-field-label">Clima</div><div class="reg-field-val">${r.clima || "—"}</div></div>
        <div><div class="reg-field-label">Equipe</div><div class="reg-field-val">${r.equipe || 0} pessoas</div></div>
      </div>
      <div class="reg-body">
        <div class="reg-section"><div class="reg-section-label">Atividades</div><div class="reg-section-val">${r.atividades || "—"}</div></div>
        ${r.ocorrencias ? `<div class="reg-section"><div class="ocorrencia">${r.ocorrencias}</div></div>` : ""}
      </div>
    </div>`).join("");

  const capa = `
  <div class="capa" style="background:linear-gradient(135deg,var(--g2) 55%,var(--brick) 150%)">
    <div class="capa-eyebrow">Portal do Cliente</div>
    <div class="capa-title">${obra.nome || "Obra"}</div>
    <div class="capa-sub">Cliente: ${obra.cliente || "—"} · Prazo: ${obra.prazo || "—"}</div>
    <div class="capa-badges">
      <div class="capa-badge">${obra.progresso || 0}% concluído</div>
      <div class="capa-badge">${obra.status || "—"}</div>
      <div class="capa-badge">Emitido: ${data}</div>
    </div>
  </div>`;

  const body = `
  <div class="section-title">Progresso da Obra</div>
  <div style="background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:20px;margin-bottom:20px">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:36px;font-weight:800;color:var(--brick)">${obra.progresso || 0}%</div>
    <div style="font-size:11px;color:var(--ink2);margin-bottom:10px">concluído</div>
    <div class="prog-bar"><div class="prog-fill" style="width:${obra.progresso || 0}%;background:linear-gradient(90deg,var(--brick),#c0312c)"></div></div>
    ${faseRows}
  </div>

  ${ultReg.length > 0 ? `<div class="section-title">Últimos Registros</div>${regHtml}` : ""}

  <div class="docfoot">
    <span>StickFrame Sistemas Construtivos</span>
    <span>${data}</span>
  </div>`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Portal — ${obra.cliente || "Cliente"}</title>
  <style>${BASE_CSS}</style>
</head>
<body>
<div class="toolbar"><button onclick="window.print()">Imprimir / Salvar PDF</button></div>
<div class="page">
  ${capa}
  <div class="body">${body}</div>
</div>
</body>
</html>`;

  printHtml(html, `Portal_${(obra.cliente || "Cliente").replace(/\s/g, "_")}`);
}

// ── 6. RDO Individual ────────────────────────────────────────────────────────

export function gerarSingleRdoPDF(obra, r) {
  const data = hoje();

  const body = `
  <div style="margin-bottom:20px">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:800;color:var(--g2)">${obra?.nome || "Obra"}</div>
    <div style="font-size:12px;color:var(--ink2);margin-top:4px">Cliente: ${obra?.cliente || "—"} · ${obra?.cidade || "Votuporanga"}/SP</div>
  </div>

  <div class="section-title">Registro Diário</div>
  <div class="registro">
    <div class="reg-header">
      <div><div class="reg-field-label">Data</div><div class="reg-field-val">${r.data || "—"}</div></div>
      <div><div class="reg-field-label">Turno</div><div class="reg-field-val">${r.turno || "—"}</div></div>
      <div><div class="reg-field-label">Clima</div><div class="reg-field-val">${r.clima || "—"}</div></div>
      <div><div class="reg-field-label">Equipe</div><div class="reg-field-val">${r.equipe || 0} pessoas</div></div>
    </div>
    <div class="reg-body">
      <div class="reg-section">
        <div class="reg-section-label">Responsável Técnico</div>
        <div class="reg-section-val" style="font-weight:700">${r.responsavel || "—"}</div>
      </div>
      <div class="reg-section">
        <div class="reg-section-label">Atividades Executadas</div>
        <div class="reg-section-val">${r.atividades || "—"}</div>
      </div>
      ${r.ocorrencias ? `<div class="reg-section"><div class="reg-section-label">Ocorrências</div><div class="ocorrencia">${r.ocorrencias}</div></div>` : ""}
    </div>
  </div>

  <div class="docfoot">
    <span>StickFrame Sistemas Construtivos</span>
    <span>${data}</span>
  </div>`;

  const nome = obra?.nome?.split("—")?.[0]?.trim()?.replace(/\s/g, "_") || "Obra";
  printHtml(
    wrap(docHead("RELATÓRIO DIÁRIO DE OBRA (RDO)", `Emitido em ${data}`), body, "RDO"),
    `RDO_${nome}`
  );
}
