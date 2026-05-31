import { FASES } from "../utils/constants";
import { fmt } from "../utils/format";
import { hoje } from "../utils/date";

// ─── HELPER ──────────────────────────────────────────────────────────────────
function download(html, filename) {
  const blob = new Blob([html], { type: "text/html" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const BASE_HEADER = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;color:#222;background:#fff;font-size:12px;}
  .header{background:#414141;padding:20px 30px 16px;display:flex;justify-content:space-between;align-items:center;}
  .logo-box{width:36px;height:36px;background:#981915;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:13px;border:1px solid rgba(255,255,255,.3);}
  .logo-row{display:flex;align-items:center;gap:10px;}
  .logo-name{font-size:17px;font-weight:800;letter-spacing:3px;color:#f0f0f0;}
  .logo-name span{color:#981915;}
  .logo-sub{font-size:8px;color:#666;letter-spacing:2px;}
  .header-right{text-align:right;color:#aaa;font-size:11px;}
  .header-right strong{color:#fff;font-size:13px;display:block;margin-bottom:2px;}
  .red-bar{height:4px;background:#981915;}
  .body{padding:28px 30px;}
  h2{font-size:9px;font-weight:700;letter-spacing:1.5px;color:#981915;text-transform:uppercase;margin:24px 0 10px;border-bottom:1px solid #eee;padding-bottom:6px;}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
`;

function logoHTML(titulo, subtitulo) {
  return `
  <div class="header">
    <div class="logo-row">
      <div class="logo-box">SF</div>
      <div><div class="logo-name">STICK<span>FRAME</span></div><div class="logo-sub">SISTEMAS CONSTRUTIVOS</div></div>
    </div>
    <div class="header-right"><strong>${titulo}</strong>${subtitulo}</div>
  </div>
  <div class="red-bar"></div>`;
}

// ─── RELATÓRIO FINANCEIRO ────────────────────────────────────────────────────
export function gerarRelatorioFinanceiro(obras, financeiro) {
  const mes  = new Date().toLocaleString("pt-BR", { month: "long" });
  const ano  = new Date().getFullYear();
  const data = hoje();

  const obrasData = obras.map((o) => {
    const fin  = financeiro[o.id] || { contrato: 0, lancamentos: [] };
    const rec  = fin.lancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + l.valor, 0);
    const desp = fin.lancamentos.filter((l) => l.tipo === "despesa").reduce((a, l) => a + l.valor, 0);
    const saldo = rec - desp;
    const marg  = rec > 0 ? (saldo / rec) * 100 : 0;
    return { ...o, fin, rec, desp, saldo, marg, contrato: fin.contrato || o.contrato || 0 };
  });

  const totRec  = obrasData.reduce((a, o) => a + o.rec, 0);
  const totDesp = obrasData.reduce((a, o) => a + o.desp, 0);
  const totSaldo = totRec - totDesp;
  const totMarg  = totRec > 0 ? (totSaldo / totRec) * 100 : 0;
  const totCont  = obrasData.reduce((a, o) => a + o.contrato, 0);
  const cor = (v) => (v >= 0 ? "#2e9e5b" : "#c0392b");

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>Relatório Financeiro</title>
  <style>${BASE_HEADER}
    .kpi-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:20px;}
    .kpi{background:#f7f7f7;border:1px solid #ddd;border-radius:8px;padding:12px;text-align:center;}
    .kpi-label{font-size:9px;color:#888;margin-bottom:6px;text-transform:uppercase;}
    .kpi-val{font-size:14px;font-weight:800;}
    table{width:100%;border-collapse:collapse;margin-bottom:20px;}
    th{background:#414141;color:#fff;padding:8px 10px;text-align:left;font-size:9px;letter-spacing:.8px;font-weight:700;}
    th.r{text-align:right;} td{padding:7px 10px;border-bottom:1px solid #eee;font-size:11px;}
    td.r{text-align:right;font-weight:700;}
    tr:nth-child(even) td{background:#f9f9f9;}
    .total-row td{background:#981915!important;color:#fff;font-weight:800;}
    .subtotal-row td{background:#2e9e5b!important;color:#fff;font-weight:800;}
    .subtotal-row.neg td{background:#c0392b!important;}
    .footer{margin-top:32px;padding-top:12px;border-top:1px solid #eee;display:flex;justify-content:space-between;font-size:9px;color:#aaa;}
  </style></head><body>
  ${logoHTML(`RELATÓRIO FINANCEIRO — ${mes.toUpperCase()} ${ano}`, `Emitido em ${data}`)}
  <div class="body">
    <h2>Consolidado Geral</h2>
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-label">Contratos</div><div class="kpi-val">${fmt(totCont)}</div></div>
      <div class="kpi"><div class="kpi-label">Receitas</div><div class="kpi-val" style="color:#2e9e5b">${fmt(totRec)}</div></div>
      <div class="kpi"><div class="kpi-label">Despesas</div><div class="kpi-val" style="color:#981915">${fmt(totDesp)}</div></div>
      <div class="kpi"><div class="kpi-label">Saldo</div><div class="kpi-val" style="color:${cor(totSaldo)}">${fmt(totSaldo)}</div></div>
      <div class="kpi"><div class="kpi-label">Margem</div><div class="kpi-val" style="color:${cor(totMarg)}">${totMarg.toFixed(1)}%</div></div>
      <div class="kpi"><div class="kpi-label">A receber</div><div class="kpi-val" style="color:#c88a00">${fmt(totCont - totRec)}</div></div>
    </div>
    <h2>Resumo por Obra</h2>
    <table><thead><tr>
      <th>Obra</th><th>Cliente</th><th>Fase</th>
      <th class="r">Receitas</th><th class="r">Despesas</th><th class="r">Saldo</th><th class="r">Margem</th>
    </tr></thead><tbody>
    ${obrasData.map((o) => `<tr>
      <td>${o.nome.split("—")[0].trim()}</td><td style="color:#888">${o.cliente}</td><td style="color:#888">${o.fase}</td>
      <td class="r" style="color:#2e9e5b">${fmt(o.rec)}</td>
      <td class="r" style="color:#981915">${fmt(o.desp)}</td>
      <td class="r" style="color:${cor(o.saldo)}">${fmt(o.saldo)}</td>
      <td class="r" style="color:${cor(o.marg)}">${o.marg.toFixed(1)}%</td>
    </tr>`).join("")}
    <tr class="total-row">
      <td colspan="3"><strong>TOTAL</strong></td>
      <td class="r">${fmt(totRec)}</td><td class="r">${fmt(totDesp)}</td>
      <td class="r">${fmt(totSaldo)}</td><td class="r">${totMarg.toFixed(1)}%</td>
    </tr>
    </tbody></table>
    ${obrasData.map((o) => `
    <h2>Detalhamento — ${o.nome}</h2>
    <table><thead><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th class="r">Valor</th></tr></thead><tbody>
    ${(o.fin.lancamentos || []).map((l) => `<tr>
      <td style="color:#888">${l.data}</td>
      <td style="color:${l.tipo === "receita" ? "#2e9e5b" : "#981915"};font-weight:700">${l.tipo.charAt(0).toUpperCase() + l.tipo.slice(1)}</td>
      <td>${l.categoria}</td><td>${l.descricao}</td>
      <td class="r" style="color:${l.tipo === "receita" ? "#2e9e5b" : "#981915"}">${l.tipo === "receita" ? "+" : "-"} ${fmt(l.valor)}</td>
    </tr>`).join("")}
    <tr class="subtotal-row${o.saldo < 0 ? " neg" : ""}">
      <td colspan="4"><strong>Saldo do período</strong></td>
      <td class="r">${o.saldo >= 0 ? "+" : ""}${fmt(o.saldo)}</td>
    </tr>
    </tbody></table>`).join("")}
    <div class="footer">
      <div>Stick Frame Sistemas Construtivos Ltda. | Documento confidencial</div>
      <div>Santo André, ${data}</div>
    </div>
  </div></body></html>`;

  download(html, `Relatorio_Financeiro_${mes}_${ano}.html`);
}

// ─── CONTRATO ────────────────────────────────────────────────────────────────
export function gerarContratoPDF(contrato) {
  const data = hoje();
  const v30 = fmt(contrato.valor * 0.30);
  const v40 = fmt(contrato.valor * 0.40);
  const v30f = fmt(contrato.valor * 0.30);

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>Contrato ${contrato.ref}</title>
  <style>${BASE_HEADER}
    .titulo{font-size:20px;font-weight:800;color:#414141;margin-bottom:4px;}
    .subtitulo{font-size:12px;color:#888;margin-bottom:24px;}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:0;}
    .field{padding:9px 14px;border:1px solid #eee;font-size:11px;}
    .field:nth-child(even){background:#f9f9f9;}
    .field-label{font-size:9px;color:#888;margin-bottom:3px;}
    .field-val{font-weight:600;}
    .clausula{margin-bottom:14px;line-height:1.7;font-size:11.5px;color:#333;}
    .valor-box{background:#f7f7f7;border:1px solid #ddd;border-radius:8px;padding:16px 20px;margin:12px 0;}
    .valor-total{font-size:22px;font-weight:800;color:#981915;}
    .pgto-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px;}
    .pgto-item{background:#fff;border:1px solid #ddd;border-radius:6px;padding:12px;text-align:center;}
    .pgto-pct{font-size:18px;font-weight:800;color:#981915;margin-bottom:4px;}
    .pgto-desc{font-size:9px;color:#888;margin-bottom:6px;}
    .pgto-val{font-size:12px;font-weight:700;}
    .assin-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:50px;}
    .assin-box{text-align:center;}
    .assin-line{border-top:1px solid #999;margin-bottom:8px;margin-top:50px;}
    .footer{margin-top:32px;padding-top:12px;border-top:1px solid #eee;display:flex;justify-content:space-between;font-size:9px;color:#aaa;}
  </style></head><body>
  ${logoHTML("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", `${contrato.ref} | ${contrato.data}`)}
  <div class="body">
    <div class="titulo">Contrato de Prestação de Serviços</div>
    <div class="subtitulo">Sistema Construtivo Steel Frame — ${contrato.obra}</div>
    <h2>Partes Contratantes</h2>
    <div class="grid2">
      <div class="field"><div class="field-label">Contratada</div><div class="field-val">Stick Frame Sistemas Construtivos Ltda.</div></div>
      <div class="field"><div class="field-label">CNPJ</div><div class="field-val">XX.XXX.XXX/0001-XX</div></div>
      <div class="field"><div class="field-label">Endereço</div><div class="field-val">Santo André / SP</div></div>
      <div class="field"><div class="field-label">Representante</div><div class="field-val">André Queiroz Candido</div></div>
      <div class="field"><div class="field-label">Contratante</div><div class="field-val">${contrato.cliente}</div></div>
      <div class="field"><div class="field-label">Data</div><div class="field-val">${contrato.data}</div></div>
    </div>
    <h2>Objeto</h2>
    <div class="clausula"><strong>Cláusula 1ª.</strong> Construção de <strong>${contrato.unidades} unidade(s)</strong> em Steel Frame, área de <strong>${contrato.area} m²</strong> cada (total: ${contrato.unidades * contrato.area} m²), padrão <strong>${contrato.padrao}</strong>, conforme projeto executivo, no empreendimento <strong>${contrato.obra}</strong>.</div>
    <h2>Valor e Pagamento</h2>
    <div class="valor-box">
      <div style="font-size:10px;color:#888;margin-bottom:4px;">VALOR TOTAL DO CONTRATO</div>
      <div class="valor-total">${fmt(contrato.valor)}</div>
      <div style="font-size:10px;color:#888;margin-top:4px;">${fmt(contrato.valor / contrato.unidades)}/unid. · ${fmt(contrato.valor / (contrato.unidades * contrato.area))}/m²</div>
    </div>
    <div class="pgto-grid">
      <div class="pgto-item"><div class="pgto-pct">30%</div><div class="pgto-desc">Na assinatura</div><div class="pgto-val">${v30}</div></div>
      <div class="pgto-item"><div class="pgto-pct">40%</div><div class="pgto-desc">Na conclusão da estrutura</div><div class="pgto-val">${v40}</div></div>
      <div class="pgto-item"><div class="pgto-pct">30%</div><div class="pgto-desc">Na entrega</div><div class="pgto-val">${v30f}</div></div>
    </div>
    <h2>Prazo</h2>
    <div class="clausula"><strong>Cláusula 3ª.</strong> Prazo de execução: <strong>${contrato.prazo !== "—" ? contrato.prazo : "a definir"}</strong>, contado da emissão da Ordem de Serviço e do primeiro pagamento.</div>
    <h2>Garantia</h2>
    <div class="clausula"><strong>Cláusula 4ª.</strong> A Stick Frame garante a estrutura por <strong>10 anos</strong>, conforme normas ABNT NBR 15575.</div>
    <h2>Foro</h2>
    <div class="clausula"><strong>Cláusula 5ª.</strong> Comarca de Santo André/SP.</div>
    <div class="assin-grid">
      <div class="assin-box"><div class="assin-line"></div><div>Stick Frame Sistemas Construtivos Ltda.</div><div style="font-size:10px;color:#888">Contratada — André Queiroz Candido</div></div>
      <div class="assin-box"><div class="assin-line"></div><div>${contrato.cliente}</div><div style="font-size:10px;color:#888">Contratante</div></div>
    </div>
    <div class="footer"><div>Santo André, ${data} | ${contrato.ref}</div><div>Stick Frame Sistemas Construtivos Ltda.</div></div>
  </div></body></html>`;

  download(html, `Contrato_${contrato.ref}.html`);
}

// ─── DIÁRIO DE OBRA ──────────────────────────────────────────────────────────
export function gerarDiarioPDF(obra, registros) {
  const data = hoje();

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>Diário — ${obra.nome}</title>
  <style>${BASE_HEADER}
    .titulo{font-size:20px;font-weight:800;color:#414141;margin-bottom:4px;}
    .subtitulo{font-size:12px;color:#888;margin-bottom:24px;}
    .registro{border:1px solid #ddd;border-radius:8px;margin-bottom:16px;overflow:hidden;}
    .reg-header{background:#f7f7f7;padding:12px 16px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;border-bottom:1px solid #eee;}
    .reg-field{font-size:10px;} .reg-label{color:#888;margin-bottom:3px;} .reg-val{font-weight:700;}
    .reg-body{padding:14px 16px;}
    .reg-section{margin-bottom:12px;}
    .reg-section-label{font-size:9px;color:#888;text-transform:uppercase;margin-bottom:6px;}
    .reg-section-val{font-size:11.5px;color:#333;line-height:1.6;}
    .ocorrencia{background:#fff5f5;border-left:3px solid #981915;padding:8px 12px;border-radius:0 4px 4px 0;font-size:11px;}
    .footer{margin-top:32px;padding-top:12px;border-top:1px solid #eee;display:flex;justify-content:space-between;font-size:9px;color:#aaa;}
  </style></head><body>
  ${logoHTML("DIÁRIO DE OBRA", `Emitido em ${data}`)}
  <div class="body">
    <div class="titulo">${obra.nome}</div>
    <div class="subtitulo">Cliente: ${obra.cliente} · Fase: ${obra.fase} · ${registros.length} registro(s)</div>
    ${registros.length === 0
      ? '<p style="color:#888;text-align:center;padding:32px 0">Nenhum registro lançado.</p>'
      : registros.map((r) => `
    <div class="registro">
      <div class="reg-header">
        <div class="reg-field"><div class="reg-label">Data</div><div class="reg-val">${r.data}</div></div>
        <div class="reg-field"><div class="reg-label">Turno</div><div class="reg-val">${r.turno}</div></div>
        <div class="reg-field"><div class="reg-label">Clima</div><div class="reg-val">${r.clima}</div></div>
        <div class="reg-field"><div class="reg-label">Equipe</div><div class="reg-val">${r.equipe} pessoas</div></div>
      </div>
      <div class="reg-body">
        <div class="reg-section"><div class="reg-section-label">Responsável</div><div class="reg-section-val">${r.responsavel}</div></div>
        <div class="reg-section"><div class="reg-section-label">Atividades</div><div class="reg-section-val">${r.atividades}</div></div>
        ${r.ocorrencias ? `<div class="reg-section"><div class="reg-section-label">Ocorrências</div><div class="ocorrencia">${r.ocorrencias}</div></div>` : ""}
      </div>
    </div>`).join("")}
    <div class="footer"><div>Stick Frame Sistemas Construtivos Ltda.</div><div>Santo André, ${data}</div></div>
  </div></body></html>`;

  download(html, `Diario_${obra.nome.split("—")[0].trim().replace(/\s/g, "_")}.html`);
}

// ─── RELATÓRIO DE OBRA ───────────────────────────────────────────────────────
export function gerarRelatorioObra(obra, arquivos = []) {
  const data = hoje();
  const faseIdx = FASES.indexOf(obra.fase);

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>Relatório — ${obra.nome}</title>
  <style>${BASE_HEADER}
    .capa{background:linear-gradient(135deg,#1A1A1A 60%,#981915 100%);min-height:260px;padding:44px 36px;display:flex;flex-direction:column;justify-content:flex-end;color:#fff;}
    .capa-logo{display:flex;align-items:center;gap:12px;margin-bottom:36px;}
    .capa-logo-box{width:40px;height:40px;background:#981915;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:14px;border:1.5px solid rgba(255,255,255,.3);}
    .capa-logo-nome{font-size:18px;font-weight:800;letter-spacing:3px;color:#f0f0f0;}
    .capa-logo-nome span{color:#981915;}
    .capa-logo-sub{font-size:8px;color:#555;letter-spacing:1.5px;}
    .capa-titulo{font-size:10px;letter-spacing:2px;color:rgba(255,255,255,.5);margin-bottom:10px;}
    .capa-nome{font-size:26px;font-weight:800;margin-bottom:6px;}
    .capa-cliente{font-size:13px;color:rgba(255,255,255,.7);margin-bottom:14px;}
    .capa-badges{display:flex;gap:8px;flex-wrap:wrap;}
    .capa-badge{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:20px;padding:3px 12px;font-size:10px;font-weight:600;}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;}
    .info-item{padding:9px 14px;border:1px solid #eee;font-size:11px;}
    .info-item:nth-child(even){background:#f9f9f9;}
    .info-label{color:#888;margin-bottom:3px;font-size:9px;text-transform:uppercase;}
    .info-val{font-weight:700;font-size:13px;}
    .prog-box{background:#f7f7f7;border-radius:8px;padding:20px;margin-bottom:20px;}
    .prog-pct{font-size:34px;font-weight:800;color:#981915;}
    .prog-label{font-size:11px;color:#888;margin-bottom:12px;}
    .prog-bar{height:10px;background:#e8e8e8;border-radius:5px;overflow:hidden;margin-bottom:18px;}
    .prog-fill{height:10px;border-radius:5px;background:linear-gradient(90deg,#981915,#6e1210);}
    .fase-row{display:flex;align-items:center;gap:12px;padding:7px 0;border-bottom:1px solid #f4f4f4;}
    .fase-row:last-child{border:none;}
    .fase-dot{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;}
    .fase-dot.done{background:#2e9e5b;color:#fff;}
    .fase-dot.current{background:#981915;color:#fff;}
    .fase-dot.pending{background:#f0f0f0;color:#bbb;}
    .fase-nome{font-size:12px;}
    .fase-nome.done{color:#2e9e5b;} .fase-nome.current{font-weight:700;color:#981915;} .fase-nome.pending{color:#bbb;}
    .fase-atual-badge{margin-left:auto;background:#981915;color:#fff;border-radius:10px;padding:2px 10px;font-size:9px;font-weight:700;}
    .arq-row{display:flex;align-items:center;gap:12px;padding:8px 14px;border-bottom:1px solid #f5f5f5;font-size:11px;}
    .arq-row:last-child{border:none;}
    .footer{margin-top:36px;padding-top:12px;border-top:1px solid #eee;display:flex;justify-content:space-between;font-size:9px;color:#aaa;}
  </style></head><body>
  <div class="capa">
    <div class="capa-logo">
      <div class="capa-logo-box">SF</div>
      <div><div class="capa-logo-nome">STICK<span>FRAME</span></div><div class="capa-logo-sub">SISTEMAS CONSTRUTIVOS</div></div>
    </div>
    <div class="capa-titulo">RELATÓRIO DE OBRA</div>
    <div class="capa-nome">${obra.nome}</div>
    <div class="capa-cliente">Cliente: ${obra.cliente}</div>
    <div class="capa-badges">
      <div class="capa-badge">${obra.status}</div>
      <div class="capa-badge">Prazo: ${obra.prazo}</div>
      <div class="capa-badge">Emitido: ${data}</div>
    </div>
  </div>
  <div class="red-bar"></div>
  <div class="body">
    <h2>Dados da Obra</h2>
    <div class="info-grid">
      <div class="info-item"><div class="info-label">Nome</div><div class="info-val">${obra.nome}</div></div>
      <div class="info-item"><div class="info-label">Cliente</div><div class="info-val">${obra.cliente}</div></div>
      <div class="info-item"><div class="info-label">Status</div><div class="info-val">${obra.status}</div></div>
      <div class="info-item"><div class="info-label">Prazo</div><div class="info-val">${obra.prazo}</div></div>
      <div class="info-item"><div class="info-label">Fase atual</div><div class="info-val">${obra.fase}</div></div>
      <div class="info-item"><div class="info-label">Data do relatório</div><div class="info-val">${data}</div></div>
    </div>
    <h2>Progresso</h2>
    <div class="prog-box">
      <div class="prog-pct">${obra.progresso}%</div>
      <div class="prog-label">concluído</div>
      <div class="prog-bar"><div class="prog-fill" style="width:${obra.progresso}%"></div></div>
      ${FASES.map((f, i) => {
        const done = i < faseIdx, curr = i === faseIdx;
        const cls = done ? "done" : curr ? "current" : "pending";
        return `<div class="fase-row">
          <div class="fase-dot ${cls}">${done ? "✓" : i + 1}</div>
          <div class="fase-nome ${cls}">${f}</div>
          ${curr ? `<div class="fase-atual-badge">Fase atual</div>` : ""}
        </div>`;
      }).join("")}
    </div>
    ${arquivos.length > 0 ? `
    <h2>Documentos e Arquivos (${arquivos.length})</h2>
    <div style="border:1px solid #eee;border-radius:8px;overflow:hidden;">
      ${arquivos.map((a) => `
      <div class="arq-row">
        <span style="font-size:18px">${a.tipo === "pdf" ? "📄" : a.tipo === "imagem" ? "🖼️" : "📎"}</span>
        <span style="flex:1;font-weight:600">${a.nome}</span>
        <span style="color:#888">${a.categoria} · ${a.tamanho} · ${a.data}</span>
      </div>`).join("")}
    </div>` : ""}
    <div class="footer"><div>Stick Frame Sistemas Construtivos Ltda. · Santo André/SP</div><div>${data}</div></div>
  </div></body></html>`;

  download(html, `Relatorio_${obra.nome.split("—")[0].trim().replace(/\s/g, "_")}.html`);
}

// ─── PORTAL DO CLIENTE (download) ────────────────────────────────────────────
export function gerarPortalCliente(obra, registros, financeiro) {
  const data = hoje();
  const fin  = financeiro[obra.id] || { contrato: 0, lancamentos: [] };
  const rec  = fin.lancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + l.valor, 0);
  const pct  = fin.contrato > 0 ? Math.round((rec / fin.contrato) * 100) : 0;
  const faseIdx = FASES.indexOf(obra.fase);

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Acompanhamento — ${obra.cliente}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'DM Sans',sans-serif;background:#f4f4f4;color:#222;min-height:100vh;}
    .header{background:#1A1A1A;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;}
    .logo-row{display:flex;align-items:center;gap:10px;}
    .logo-box{width:32px;height:32px;background:#981915;border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:12px;border:1px solid #333;}
    .logo-name{font-size:14px;font-weight:800;letter-spacing:2px;color:#f0f0f0;}
    .logo-name span{color:#981915;}
    .logo-sub{font-size:8px;color:#444;letter-spacing:1.5px;}
    .hero{background:linear-gradient(135deg,#981915,#6e1210);padding:26px 20px;color:#fff;}
    .hero-label{font-size:10px;letter-spacing:1.5px;opacity:.7;margin-bottom:6px;}
    .hero-nome{font-size:19px;font-weight:800;margin-bottom:4px;}
    .hero-cliente{font-size:13px;opacity:.8;margin-bottom:14px;}
    .hero-badges{display:flex;gap:8px;flex-wrap:wrap;}
    .hero-badge{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:20px;padding:3px 12px;font-size:11px;font-weight:600;}
    .body{padding:14px;max-width:480px;margin:0 auto;}
    .card{background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 1px 6px rgba(0,0,0,.06);}
    .card-title{font-size:10px;font-weight:700;letter-spacing:1.2px;color:#888;margin-bottom:10px;text-transform:uppercase;}
    .prog-pct{font-size:30px;font-weight:800;color:#981915;}
    .prog-label{font-size:11px;color:#888;margin-top:2px;margin-bottom:10px;}
    .prog-bar{height:8px;background:#f0f0f0;border-radius:4px;overflow:hidden;}
    .prog-fill{height:8px;border-radius:4px;background:linear-gradient(90deg,#981915,#6e1210);}
    .fase-row{display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #f5f5f5;}
    .fase-row:last-child{border:none;}
    .fase-dot{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;}
    .fase-dot.done{background:#2e9e5b;color:#fff;}
    .fase-dot.current{background:#981915;color:#fff;}
    .fase-dot.pending{background:#f0f0f0;color:#bbb;}
    .fase-nome{font-size:12px;}
    .fase-nome.done{color:#2e9e5b;} .fase-nome.current{font-weight:700;color:#981915;} .fase-nome.pending{color:#bbb;}
    .fase-badge{margin-left:auto;background:#981915;color:#fff;border-radius:10px;padding:1px 8px;font-size:9px;font-weight:700;}
    .fin-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;}
    .fin-item{background:#f9f9f9;border-radius:8px;padding:10px;}
    .fin-label{font-size:9px;color:#888;margin-bottom:3px;}
    .fin-val{font-size:14px;font-weight:800;}
    .fin-val.green{color:#2e9e5b;}
    .rec-bar{height:6px;background:#f0f0f0;border-radius:3px;overflow:hidden;margin-bottom:5px;}
    .rec-fill{height:6px;background:linear-gradient(90deg,#2e9e5b,#1a7a40);border-radius:3px;}
    .rec-label{display:flex;justify-content:space-between;font-size:10px;color:#888;}
    .diario-item{padding:10px 0;border-bottom:1px solid #f5f5f5;}
    .diario-item:last-child{border:none;}
    .diario-data{font-size:10px;color:#888;margin-bottom:3px;}
    .diario-text{font-size:12px;color:#444;line-height:1.5;}
    .diario-oc{background:#fff5f5;border-left:3px solid #981915;padding:6px 10px;border-radius:0 4px 4px 0;font-size:11px;margin-top:5px;}
    .footer{text-align:center;padding:18px;font-size:10px;color:#aaa;}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
  </style></head><body>
  <div class="header">
    <div class="logo-row">
      <div class="logo-box">SF</div>
      <div><div class="logo-name">STICK<span>FRAME</span></div><div class="logo-sub">SISTEMAS CONSTRUTIVOS</div></div>
    </div>
    <div style="font-size:10px;color:#444">Atualizado em ${data}</div>
  </div>
  <div class="hero">
    <div class="hero-label">ACOMPANHAMENTO DE OBRA</div>
    <div class="hero-nome">${obra.nome}</div>
    <div class="hero-cliente">Cliente: ${obra.cliente}</div>
    <div class="hero-badges">
      <div class="hero-badge">${obra.status}</div>
      <div class="hero-badge">Prazo: ${obra.prazo}</div>
      <div class="hero-badge">${obra.progresso}% concluído</div>
    </div>
  </div>
  <div class="body">
    <div class="card">
      <div class="card-title">Progresso Geral</div>
      <div class="prog-pct">${obra.progresso}%</div>
      <div class="prog-label">concluído</div>
      <div class="prog-bar"><div class="prog-fill" style="width:${obra.progresso}%"></div></div>
    </div>
    <div class="card">
      <div class="card-title">Etapas da Obra</div>
      ${FASES.map((f, i) => {
        const done = i < faseIdx, curr = i === faseIdx;
        const cls = done ? "done" : curr ? "current" : "pending";
        return `<div class="fase-row">
          <div class="fase-dot ${cls}">${done ? "✓" : i + 1}</div>
          <div class="fase-nome ${cls}">${f}</div>
          ${curr ? `<div class="fase-badge">Atual</div>` : ""}
        </div>`;
      }).join("")}
    </div>
    ${fin.contrato > 0 ? `
    <div class="card">
      <div class="card-title">Financeiro</div>
      <div class="fin-grid">
        <div class="fin-item"><div class="fin-label">Contrato</div><div class="fin-val">${fmt(fin.contrato)}</div></div>
        <div class="fin-item"><div class="fin-label">Recebido</div><div class="fin-val green">${fmt(rec)}</div></div>
      </div>
      <div class="rec-bar"><div class="rec-fill" style="width:${pct}%"></div></div>
      <div class="rec-label"><span>${pct}% recebido</span><span>${100 - pct}% a receber</span></div>
    </div>` : ""}
    ${registros.length > 0 ? `
    <div class="card">
      <div class="card-title">Últimas Atualizações</div>
      ${registros.slice(0, 5).map((r) => `
      <div class="diario-item">
        <div class="diario-data">${r.data} · ${r.clima} · ${r.turno}</div>
        <div class="diario-text">${r.atividades}</div>
        ${r.ocorrencias ? `<div class="diario-oc">⚠️ ${r.ocorrencias}</div>` : ""}
      </div>`).join("")}
    </div>` : ""}
    <div class="footer"><strong style="color:#555">Stick Frame Sistemas Construtivos</strong><br/>Santo André/SP · ${data}</div>
  </div></body></html>`;

  download(html, `Portal_${obra.cliente.replace(/\s/g, "_")}.html`);
}
