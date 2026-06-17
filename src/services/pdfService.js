import { FASES } from "../utils/constants";
import { fmt } from "../utils/format";
import { hoje } from "../utils/date";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

//  NOVO HELPER: GERADOR DE PDF REAL NATIVO 
async function exportarParaPDFReal(htmlContent, filename) {
  // Cria um container temporário escondido na tela para renderizar o HTML
  const container = document.createElement("div");
  container.innerHTML = htmlContent;
  container.style.position = "fixed";
  container.style.top = "-9999px";
  container.style.left = "-9999px";
  container.style.width = "800px"; // Largura ideal para folha A4 proporcional
  container.style.background = "#fff";
  document.body.appendChild(container);

  try {
    // Transforma o HTML em uma imagem de alta definição
    const canvas = await html2canvas(container, {
      scale: 2, // Aumenta a qualidade para o texto não ficar borrado
      useCORS: true, // Permite carregar fontes do Google e imagens externas
      logging: false
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    
    // Configura a folha A4 no jsPDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const imgWidth = 210; // Largura da folha A4 em mm
    const pageHeight = 295; // Altura da folha A4 em mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Adiciona a primeira página
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, "", "FAST");
    heightLeft -= pageHeight;

    // Se o relatório for longo, cria páginas adicionais automaticamente
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, "", "FAST");
      heightLeft -= pageHeight;
    }

    // Salva o arquivo final na máquina do usuário
    pdf.save(filename);
  } catch (error) {
    console.error("Falha ao gerar o arquivo PDF legítimo:", error);
  } finally {
    // Remove o elemento temporário da memória
    document.body.removeChild(container);
  }
}

//  ESTILOS E COMPONENTES VISUAIS REUTILIZÁVEIS 
const BASE_HEADER = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;color:#222;background:#fff;font-size:12px;padding: 20px;}
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
`;

// Renderiza a Logo dinâmica aceitando White-Label (Branding customizado de parceiros)
function logoHTML(titulo, subtitulo, branding = null) {
  const corPrimaria = branding?.cor_primaria || "#981915";
  const nomeEmpresa = branding?.nome || "STICK FRAME";
  const logoUrl = branding?.logo_url;

  // Se a empresa parceira tiver logo, exibe a imagem, se não, exibe a sigla em texto
  const logoBoxContent = logoUrl 
    ? `<img src="${logoUrl}" style="max-height:32px; max-width:100%; object-fit:contain;" />`
    : `<div class="logo-box" style="background: ${corPrimaria}">SF</div>`;

  return `
  <div class="header">
    <div class="logo-row">
      ${logoBoxContent}
      <div>
        <div class="logo-name">${nomeEmpresa.toUpperCase()}</div>
        <div class="logo-sub">${branding ? 'CONSTRUTOR PARCEIRO' : 'SISTEMAS CONSTRUTIVOS'}</div>
      </div>
    </div>
    <div class="header-right"><strong>${titulo}</strong>${subtitulo}</div>
  </div>
  <div class="red-bar" style="background: ${corPrimaria}"></div>`;
}

//  RELATÓRIO FINANCEIRO 
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

  const html = `<html><head><style>${BASE_HEADER}
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
    <div class="footer">
      <div>Stick Frame Sistemas Construtivos | Documento Confidencial</div>
      <div>Emitido em ${data}</div>
    </div>
  </div></body></html>`;

  exportarParaPDFReal(html, `Relatorio_Financeiro_${mes}_${ano}.pdf`);
}

//  CONTRATO DE PRESTAÇÃO DE SERVIÇOS 
export function gerarContratoPDF(contrato) {
  const data = hoje();
  const v30 = fmt(contrato.valor * 0.30);
  const v40 = fmt(contrato.valor * 0.40);
  const v30f = fmt(contrato.valor * 0.30);
  
  // Alinhamento geográfico dinâmico (Usa a cidade do contrato ou assume Votuporanga por padrão)
  const cidadeAtuacao = contrato.cidade || "Votuporanga";

  const html = `<html><head><style>${BASE_HEADER}
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
      <div class="field"><div class="field-label">Endereço de Operação</div><div class="field-val">${cidadeAtuacao} / SP</div></div>
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
    <div class="clausula"><strong>Cláusula 5ª.</strong> Eleito o Foro da Comarca de ${cidadeAtuacao}/SP para dirimir quaisquer dúvidas deste instrumento.</div>
    <div class="assin-grid">
      <div class="assin-box"><div class="assin-line"></div><div>Stick Frame Sistemas Construtivos Ltda.</div><div style="font-size:10px;color:#888">Contratada — André Queiroz Candido</div></div>
      <div class="assin-box"><div class="assin-line"></div><div>${contrato.cliente}</div><div style="font-size:10px;color:#888">Contratante</div></div>
    </div>
    <div class="footer"><div>${cidadeAtuacao}/SP, ${data} | ${contrato.ref}</div><div>Stick Frame Sistemas Construtivos</div></div>
  </div></body></html>`;

  exportarParaPDFReal(html, `Contrato_${contrato.ref}.pdf`);
}

//  DIÁRIO DE OBRA 
export function gerarDiarioPDF(obra, registros, branding = null) {
  const data = hoje();

  const html = `<html><head><style>${BASE_HEADER}
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
  ${logoHTML("DIÁRIO DE OBRA", `Emitido em ${data}`, branding)}
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
    <div class="footer"><div>Stick Frame Sistemas Construtivos</div><div>${obra.cidade || "Votuporanga"}/SP, ${data}</div></div>
  </div></body></html>`;

  exportarParaPDFReal(html, `Diario_${obra.nome.split("—")[0].trim().replace(/\s/g, "_")}.pdf`);
}

//  RELATÓRIO DE OBRA (RDO COMPLETO) 
export function gerarRelatorioObra(obra, arquivos = [], branding = null) {
  const data = hoje();
  const faseIdx = FASES.indexOf(obra.fase);
  const corPrimaria = branding?.cor_primaria || "#981915";

  const html = `<html><head><style>${BASE_HEADER}
    .capa{background:linear-gradient(135deg,#1A1A1A 60%,${corPrimaria} 100%);min-height:260px;padding:44px 36px;display:flex;flex-direction:column;justify-content:flex-end;color:#fff;}
    .capa-logo{display:flex;align-items:center;gap:12px;margin-bottom:36px;}
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
    .prog-pct{font-size:34px;font-weight:800;color:${corPrimaria};}
    .prog-label{font-size:11px;color:#888;margin-bottom:12px;}
    .prog-bar{height:10px;background:#e8e8e8;border-radius:5px;overflow:hidden;margin-bottom:18px;}
    .prog-fill{height:10px;border-radius:5px;background:linear-gradient(90deg,${corPrimaria},#414141);}
    .fase-row{display:flex;align-items:center;gap:12px;padding:7px 0;border-bottom:1px solid #f4f4f4;}
    .fase-row:last-child{border:none;}
    .fase-dot{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;}
    .fase-dot.done{background:#2e9e5b;color:#fff;}
    .fase-dot.current{background:${corPrimaria};color:#fff;}
    .fase-dot.pending{background:#f0f0f0;color:#bbb;}
    .fase-nome{font-size:12px;}
    .fase-nome.done{color:#2e9e5b;} .fase-nome.current{font-weight:700;color:${corPrimaria};} .fase-nome.pending{color:#bbb;}
    .fase-atual-badge{margin-left:auto;background:${corPrimaria};color:#fff;border-radius:10px;padding:2px 10px;font-size:9px;font-weight:700;}
    .arq-row{display:flex;align-items:center;gap:12px;padding:8px 14px;border-bottom:1px solid #f5f5f5;font-size:11px;}
    .footer{margin-top:36px;padding-top:12px;border-top:1px solid #eee;display:flex;justify-content:space-between;font-size:9px;color:#aaa;}
  </style></head><body>
  <div class="capa">
    <div class="capa-titulo">RELATÓRIO DE ACOMPANHAMENTO</div>
    <div class="capa-nome">${obra.nome}</div>
    <div class="capa-cliente">Cliente: ${obra.cliente}</div>
    <div class="capa-badges">
      <div class="capa-badge">${obra.status}</div>
      <div class="capa-badge">Prazo: ${obra.prazo}</div>
      <div class="capa-badge">Emitido: ${data}</div>
    </div>
  </div>
  <div class="body">
    <h2>Dados da Estrutura</h2>
    <div class="info-grid">
      <div class="info-item"><div class="info-label">Nome</div><div class="info-val">${obra.nome}</div></div>
      <div class="info-item"><div class="info-label">Cliente</div><div class="info-val">${obra.cliente}</div></div>
      <div class="info-item"><div class="info-label">Status</div><div class="info-val">${obra.status}</div></div>
      <div class="info-item"><div class="info-label">Cidade / Foro</div><div class="info-val">${obra.cidade || "Votuporanga"}/SP</div></div>
      <div class="info-item"><div class="info-label">Fase atual</div><div class="info-val">${obra.fase}</div></div>
      <div class="info-item"><div class="info-label">Data de Emissão</div><div class="info-val">${data}</div></div>
    </div>
    <h2>Progresso Realizado</h2>
    <div class="prog-box">
      <div class="prog-pct">${obra.progresso}%</div>
      <div class="prog-label">concluído</div>
      <div class="prog-bar"><div class="prog-fill" style="width:${obra.progresso}%"></div></div>
      ${FASES.map((f, i) => {
        const done = i < faseIdx, curr = i === faseIdx;
        const cls = done ? "done" : curr ? "current" : "pending";
        return `<div class="fase-row">
          <div class="fase-dot ${cls}">${done ? "" : i + 1}</div>
          <div class="fase-nome ${cls}">${f}</div>
          ${curr ? `<div class="fase-atual-badge">Fase atual</div>` : ""}
        </div>`;
      }).join("")}
    </div>
    <div class="footer"><div>Stick Frame Sistemas Construtivos</div><div>${data}</div></div>
  </div></body></html>`;

  exportarParaPDFReal(html, `Relatorio_${obra.nome.split("—")[0].trim().replace(/\s/g, "_")}.pdf`);
}

//  PORTAL DO CLIENTE (DOWNLOAD CONSOLIDADO) 
export function gerarPortalCliente(obra, registros, financeiro) {
  const data = hoje();
  const fin  = financeiro[obra.id] || { contrato: 0, lancamentos: [] };
  const rec  = fin.lancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + l.valor, 0);
  const pct  = fin.contrato > 0 ? Math.round((rec / fin.contrato) * 100) : 0;
  const faseIdx = FASES.indexOf(obra.fase);

  const html = `<html><head><style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'DM Sans',sans-serif;background:#fff;color:#222;padding:20px;}
    .hero{background:linear-gradient(135deg,#981915,#6e1210);padding:26px 20px;color:#fff;}
    .hero-nome{font-size:19px;font-weight:800;margin-bottom:4px;}
    .card{background:#f9f9f9;border:1px solid #eee;border-radius:12px;padding:16px;margin-bottom:12px;}
    .prog-pct{font-size:30px;font-weight:800;color:#981915;}
    .fase-row{display:flex;align-items:center;gap:10px;padding:6px 0;}
    .fase-dot.done{color:#2e9e5b;} .fase-dot.current{color:#981915;font-weight:700;}
  </style></head><body>
  <div class="hero">
    <div class="hero-nome">${obra.nome}</div>
    <div>Cliente: ${obra.cliente} · Prazo: ${obra.prazo || "Votuporanga"}</div>
  </div>
  <div class="body">
    <div class="card">
      <h3>Progresso Geral: ${obra.progresso}%</h3>
    </div>
    <div class="card">
      <h3>Estágio da Construção</h3>
      ${FASES.map((f, i) => {
        const done = i < faseIdx, curr = i === faseIdx;
        return `<div class="fase-row">
          <span>${done ? "" : i + 1}</span>
          <span style="color:${curr ? '#981915' : '#333'}">${f}</span>
        </div>`;
      }).join("")}
    </div>
  </div></body></html>`;

  exportarParaPDFReal(html, `Portal_${obra.cliente.replace(/\s/g, "_")}.pdf`);
}

//  RDO INDIVIDUAL (SINGLE REPORT) 
export function gerarSingleRdoPDF(obra, r) {
  const data = hoje();
  const html = `<html><head><style>${BASE_HEADER}
    .titulo{font-size:20px;font-weight:800;color:#414141;margin-bottom:4px;}
    .subtitulo{font-size:12px;color:#888;margin-bottom:24px;}
    .registro{border:1px solid #ddd;border-radius:8px;overflow:hidden;margin-bottom:20px;}
    .reg-header{background:#f7f7f7;padding:12px 16px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;border-bottom:1px solid #eee;}
    .reg-field{font-size:10px;} .reg-label{color:#888;margin-bottom:3px;} .reg-val{font-weight:700;}
    .reg-body{padding:16px 20px;}
    .reg-section{margin-bottom:16px;}
    .reg-section-label{font-size:9px;color:#888;text-transform:uppercase;margin-bottom:6px;letter-spacing:1px;}
    .reg-section-val{font-size:12px;color:#333;line-height:1.7;white-space:pre-wrap;}
    .ocorrencia{background:#fff5f5;border-left:3px solid #981915;padding:10px 14px;border-radius:0 4px 4px 0;font-size:11.5px;color:#333;}
    .footer{margin-top:32px;padding-top:12px;border-top:1px solid #eee;display:flex;justify-content:space-between;font-size:9px;color:#aaa;}
  </style></head><body>
  ${logoHTML("RELATÓRIO DIÁRIO DE OBRA (RDO)", `Emitido em ${data}`)}
  <div class="body">
    <div class="titulo">${obra?.nome || "Diário de Obra"}</div>
    <div class="subtitulo">Cliente: ${obra?.cliente || "—"} · Cidade: ${obra?.cidade || "Votuporanga"}/SP</div>
    
    <div class="registro">
      <div class="reg-header">
        <div class="reg-field"><div class="reg-label">Data</div><div class="reg-val">${r.data || "—"}</div></div>
        <div class="reg-field"><div class="reg-label">Turno</div><div class="reg-val">${r.turno || "—"}</div></div>
        <div class="reg-field"><div class="reg-label">Clima</div><div class="reg-val">${r.clima || "—"}</div></div>
        <div class="reg-field"><div class="reg-label">Equipe</div><div class="reg-val">${r.equipe || 0} pessoas</div></div>
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
        ${r.ocorrencias ? `<div class="reg-section"><div class="ocorrencia"> ${r.ocorrencias}</div></div>` : ""}
      </div>
    </div>
    <div class="footer"><div>Stick Frame Sistemas Construtivos</div><div>${data}</div></div>
  </div></body></html>`;

  exportarParaPDFReal(html, `RDO_${obra?.nome?.split("—")?.[0]?.trim()?.replace(/\s/g, "_") || "Obra"}.pdf`);
}