import { printHtml } from '../utils/printHtml';
import { LOGO_STICKFRAME } from '../utils/cdn';
import { sb, getEmpresaId } from './supabase';

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtN   = (v, d = 2) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const agora  = () => new Date().toLocaleString('pt-BR');

/**
 * Salva a versão do StickQuote no Supabase e retorna o registro.
 */
export async function salvarStickQuote({ nome, obraNome, clienteNome, selecoes, resultado, observacoes, orcamentoId, clienteId, origem, projetoEstruturalId }) {
  const empresaId = getEmpresaId();
  if (!empresaId) throw new Error('empresa_id não encontrado');

  const { data, error } = await sb
    .from('stickquote_versoes')
    .insert({
      empresa_id:   empresaId,
      nome,
      obra_nome:    obraNome  || null,
      cliente_nome: clienteNome || null,
      orcamento_id: orcamentoId || null,
      cliente_id:   clienteId   || null,
      selecoes:     JSON.parse(JSON.stringify(selecoes)),
      resultado:    JSON.parse(JSON.stringify(resultado)),
      observacoes:  observacoes || null,
      origem:       origem || null,
      projeto_estrutural_id: projetoEstruturalId || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Lista StickQuotes da empresa para vínculo a um orçamento.
 * `apenasLivres` = só os ainda não vinculados a nenhum orçamento.
 */
export async function listarStickQuotesParaVincular({ apenasLivres = true } = {}) {
  let q = sb
    .from('stickquote_versoes')
    .select('id, numero, nome, obra_nome, cliente_nome, resultado, orcamento_id, created_at')
    .order('created_at', { ascending: false })
    .limit(80);
  if (apenasLivres) q = q.is('orcamento_id', null);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

/** Vincula/desvincula um StickQuote a um orçamento (e cliente opcional). */
export async function vincularStickQuoteAoOrcamento(stickquoteId, orcamentoId, clienteId = null) {
  const { error } = await sb
    .from('stickquote_versoes')
    .update({ orcamento_id: orcamentoId, cliente_id: clienteId })
    .eq('id', stickquoteId);
  if (error) throw error;
}

/** StickQuotes técnicos vinculados a um orçamento. */
export async function listarStickQuotesDoOrcamento(orcamentoId) {
  const { data, error } = await sb
    .from('stickquote_versoes')
    .select('id, numero, nome, obra_nome, cliente_nome, resultado, created_at')
    .eq('orcamento_id', orcamentoId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Carrega o histórico de StickQuote da empresa.
 */
export async function carregarHistoricoStickQuote() {
  const { data, error } = await sb
    .from('stickquote_versoes')
    .select('id, nome, obra_nome, cliente_nome, versao, status, resultado, created_at, origem')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

/**
 * Atualiza o status de um StickQuote.
 */
export async function atualizarStatusStickQuote(id, status) {
  const { error } = await sb.from('stickquote_versoes').update({ status }).eq('id', id);
  if (error) throw error;
}

// ── ícones SVG inline (Lucide) ───────────────────────────────────────────────
const ICO = {
  wall:     `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#e0726d" stroke-width="2"><path d="M4 21V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v16M4 21h16M9 4v17M15 4v17"/></svg>`,
  wallInt:  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#e0726d" stroke-width="2"><path d="M4 21V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v16M4 21h16M12 4v17"/></svg>`,
  ceiling:  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#e0726d" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>`,
  roof:     `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#e0726d" stroke-width="2"><path d="M3 21V8l9-5 9 5v13M3 21h18M9 21v-6h6v6"/></svg>`,
  default:  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#e0726d" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
  print:    `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>`,
  doc:      `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#e0726d" stroke-width="2"><path d="M9 7h6M9 11h6M9 15h4M5 3h14a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1z"/></svg>`,
  shield:   `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#a9d9b1" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  shieldLow:`<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#e7a39d" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="15" r=".5" fill="#e7a39d"/></svg>`,
  alert:    `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#981915" stroke-width="1.6"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r=".5" fill="#981915"/></svg>`,
};

function sysIcon(sistema) {
  if (/ext/i.test(sistema) || /^par-ext/.test(sistema)) return ICO.wall;
  if (/int/i.test(sistema) || /drywall/i.test(sistema)) return ICO.wallInt;
  if (/forro|ceil/i.test(sistema)) return ICO.ceiling;
  if (/cobert|lsf|roof/i.test(sistema)) return ICO.roof;
  return ICO.default;
}

/**
 * Gera o PDF comercial StickQuote™ (design handoff v2).
 */
export function gerarStickQuotePDF({ nome, obraNome, clienteNome, selecoes, resultado, observacoes, versaoId, versaoNum, origemIFC }) {
  const LOGO      = LOGO_STICKFRAME;
  const dataGer   = agora();
  const totalCusto = resultado?.totalCusto || 0;
  const breakdown  = resultado?.breakdown  || [];
  const lista      = resultado?.lista      || [];

  // ── Derivados ──────────────────────────────────────────────────────────────
  const areaOrcada  = (selecoes || []).reduce((s, sel) => s + (Number(sel.area) || 0), 0);
  const numInsumos  = lista.length;
  const custoM2     = areaOrcada > 0 ? totalCusto / areaOrcada : 0;

  // StickTrust das observações
  const trustMatch = (observacoes || '').match(/StickTrust™?\s*(\d+)%\s*\(([^)]+)\)/i);
  const trustPct   = trustMatch ? Number(trustMatch[1]) : null;
  const trustNivel = trustMatch ? trustMatch[2] : null;
  const trustOk    = trustPct !== null && trustPct >= 55;
  const trustBg    = trustOk  ? 'rgba(79,125,87,.22)' : 'rgba(180,51,43,.2)';
  const trustColor = trustOk  ? '#a9d9b1' : '#e7a39d';
  const trustIcon  = trustOk  ? ICO.shield : ICO.shieldLow;
  const trustLabel = trustPct !== null ? `StickTrust ${trustPct}%` : '';

  // Origem legível
  const origemLabel = origemIFC
    ? `BIM · ${typeof origemIFC === 'string' ? origemIFC : 'Modelo IFC'}`
    : (observacoes || '').match(/Origem:\s*(DWG[^—\n]*)/i)?.[1]?.trim()
    || (observacoes || '').match(/Origem:\s*(PDF[^—\n]*)/i)?.[1]?.trim()
    || 'Motor de composição técnica StickQuote™';

  const hSub = origemIFC
    ? 'Quantitativo extraído de modelo BIM / IFC'
    : (observacoes || '').includes('DWG')
    ? 'Quantitativo extraído de DWG AutoCAD'
    : (observacoes || '').includes('PDF')
    ? 'Quantitativo extraído de PDF de projeto'
    : 'Motor de composição técnica StickQuote™';

  // Nome digitado pelo usuário tem prioridade — o PDF (e o nome do arquivo)
  // refletem o que está no campo "Nome do orçamento", não a obra aberta.
  const tituloDoc = nome || obraNome || clienteNome;

  // Grupos (resumo)
  const grupos = {};
  lista.forEach(it => { grupos[it.grupo || 'Outros'] = (grupos[it.grupo || 'Outros'] || 0) + it.custo; });
  const maxGrupo = Math.max(...Object.values(grupos), 1);
  const gruposHtml = Object.entries(grupos)
    .sort((a, b) => b[1] - a[1])
    .map(([g, v]) => {
      const pct = (v / maxGrupo * 100).toFixed(1);
      return `<div class="gbar">
        <span class="gn">${g}</span>
        <span class="track"><span class="fill" style="width:${pct}%"></span></span>
        <span class="gv">${v > 0 ? fmtBRL(v) : '—'}</span>
      </div>`;
    }).join('');

  // ── Seções por sistema ─────────────────────────────────────────────────────
  const secoesHtml = breakdown.map(bd => {
    const comp   = (bd.composicao && typeof bd.composicao === 'object') ? bd.composicao : { nome: bd.composicao, id: bd.composicao };
    const compId = comp.sistema || comp.id || '';
    const ico    = sysIcon(compId);
    const itens  = bd.itens || [];

    const rows = itens.map((it, i) => {
      const org = it.origemPreco === 'catalogo' ? 'cat'
        : it.origemPreco === 'mercado' ? 'mkt' : 'est';
      const orgLabel = org === 'cat' ? 'CAT' : org === 'mkt' ? 'MKT' : 'EST';
      const hasPrice = it.custo > 0 && it.preco > 0;
      return `<tr>
        <td>
          <div class="insumo">${it.nome}</div>
          <span class="org ${org}"><span class="d"></span>${orgLabel}</span>
        </td>
        <td><span class="grp">${it.grupo || ''}</span></td>
        <td class="r cons">${fmtN(it.consumo, 3)} ${it.un}/m²</td>
        <td class="r"><span class="qtd">${it.qtdArredondada > 0 ? fmtN(it.qtdArredondada, 0) : '—'} ${it.un}</span></td>
        <td class="r unit">${hasPrice ? fmtBRL(it.preco) : '—'}</td>
        <td class="r"><span class="tot">${hasPrice ? fmtBRL(it.custo) : '—'}</span></td>
      </tr>`;
    }).join('');

    const subtotal = itens.reduce((s, it) => s + it.custo, 0);

    return `<div class="sysblock">
      <div class="sys-h">
        <div class="nm">${ico} ${comp.nome || comp.id || '—'}</div>
        <div class="ar"><b class="num">${fmtN(bd.area, 0)}</b><span>m²</span></div>
      </div>
      <div class="tbl-wrap">
        <table>
          <thead><tr>
            <th>Insumo</th><th>Grupo</th><th class="r">Consumo/m²</th><th class="r">Qtd</th><th class="r">Unit</th><th class="r">Total</th>
          </tr></thead>
          <tbody>
            ${rows}
            <tr class="sub-tr">
              <td colspan="5"><span class="sl">Subtotal — ${comp.nome || comp.id}</span></td>
              <td class="r"><span class="sv">${subtotal > 0 ? fmtBRL(subtotal) : '—'}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`;
  }).join('');

  // ── Empty state (DWG sem layers / 0 sistemas) ──────────────────────────────
  const emptyHtml = breakdown.length === 0 ? `
    <div class="emptystate">
      <div class="es-ico">${ICO.alert}</div>
      <h3>Quantitativo ainda não extraído</h3>
      <p>O arquivo DWG não contém layers construtivos reconhecidos. Complete as informações abaixo para gerar o orçamento.</p>
      <div class="steps">
        <div class="step"><span class="sn">1</span><span>Mapear layers</span></div>
        <div class="step"><span class="sn">2</span><span>Informar áreas</span></div>
        <div class="step"><span class="sn">3</span><span>Confirmar preços</span></div>
      </div>
    </div>
    <div class="resumo" style="margin-top:28px">
      <h2>Resumo por Grupo de Material</h2>
      <div class="placeholder-tbl">
        <div class="ph-head">Aguardando configuração — nenhum sistema incluído</div>
        <div class="bar"></div><div class="bar"></div><div class="bar"></div>
      </div>
    </div>` : '';

  // ── Premissas / rastreabilidade ────────────────────────────────────────────
  const areaObs     = (observacoes || '').match(/[Áá]rea\s+constru[íi]da:\s*([\d.,]+\s*m²)/i)?.[1] || (areaOrcada > 0 ? `${fmtN(areaOrcada, 1)} m²` : '—');
  const premissasTxt = `<b>Premissas:</b> quantitativos ${origemIFC ? `extraídos do modelo IFC (<b>${typeof origemIFC === 'string' ? origemIFC : 'modelo IFC'}</b>)` : `gerados pela metodologia StickQuote™`} e calculados pela composição técnica Steel Frame${trustLabel ? `, com índice de confiança <b>${trustLabel}${trustNivel ? ` (${trustNivel})` : ''}</b>` : ''} sobre área construída de <b>${areaObs}</b>. As perdas já estão incluídas nas quantidades. Itens marcados <b>EST</b> são estimados — confirmar preço com fornecedor. Preços sujeitos a confirmação. StickFrame · StickQuote™ é uma metodologia proprietária.`;

  const metaRows = [
    { k: 'Origem',      v: origemLabel },
    trustLabel ? { k: 'StickTrust™', v: `${trustLabel}${trustNivel ? ` · ${trustNivel}` : ''}` } : null,
    { k: 'Gerado em',   v: dataGer },
    versaoId ? { k: 'Versão',       v: `#${versaoNum || '—'}` } : null,
    versaoId ? { k: 'ID',           v: `<span class="id">${versaoId}</span>` } : null,
  ].filter(Boolean).map(r => `<div class="rm"><div class="k">${r.k}</div><div class="v">${r.v}</div></div>`).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Orçamento Técnico — ${tituloDoc}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet"/>
<style>
:root{
  --brick:#981915;--brick-dk:#7d1411;--brick-soft:#f3e7e5;
  --graphite:#232225;--graphite-2:#1a191c;
  --ink:#26231f;--ink-2:#57514a;--muted:#8c847a;
  --line:#e7e1d8;--line-2:#efeae2;
  --bg:#e9e5dd;--surface:#fff;--surface-2:#faf8f4;
  --cat:#4f7d57;--cat-soft:#eaf1ea;--mkt:#c0892d;--mkt-soft:#f7efdf;--est:#b4332b;--est-soft:#f7e6e4;
  --sans:'Hanken Grotesk',system-ui,sans-serif;
  --cond:'Barlow Condensed',var(--sans);
  --mono:'JetBrains Mono',ui-monospace,monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--sans);background:var(--bg);color:var(--ink);-webkit-font-smoothing:antialiased;line-height:1.5}
.num{font-family:var(--cond);font-variant-numeric:tabular-nums}

/* page */
.page{width:210mm;min-height:297mm;background:var(--surface);margin:18px auto;padding:18mm 16mm 14mm;position:relative;display:flex;flex-direction:column;box-shadow:0 1px 2px rgba(40,30,20,.08),0 18px 50px -24px rgba(40,30,20,.4)}

/* header */
.dochead{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding-bottom:16px;border-bottom:2px solid var(--graphite)}
.dh-l{display:flex;align-items:center;gap:13px}
.dh-l img{width:42px;height:42px;object-fit:contain}
.dh-l .wm{font-family:var(--cond);font-weight:700;font-size:25px;letter-spacing:1.2px;line-height:1;color:var(--ink)}
.dh-l .wm span{color:var(--brick)}
.dh-l .sb{font-size:9px;letter-spacing:1.6px;text-transform:uppercase;color:var(--muted);margin-top:4px}
.dh-r{text-align:right}
.dh-r .ver{display:inline-flex;align-items:center;gap:7px;background:var(--brick);color:#fff;font-family:var(--cond);font-weight:700;font-size:15px;letter-spacing:.5px;padding:4px 12px;border-radius:7px}
.dh-r .gen{font-size:10.5px;color:var(--muted);margin-top:7px;line-height:1.4}
.dh-r .gen b{color:var(--ink-2);font-weight:700}

/* doc title */
.doctitle{margin-top:20px}
.doctitle .ey{font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:var(--brick)}
.doctitle h1{font-family:var(--cond);font-weight:700;font-size:38px;letter-spacing:.5px;line-height:.96;margin-top:6px}
.doctitle .h-sub{font-size:12.5px;color:var(--ink-2);margin-top:5px}

/* id grid */
.idgrid{display:grid;grid-template-columns:1fr 248px;gap:16px;margin-top:22px}
.idbox{border:1px solid var(--line);border-radius:12px;overflow:hidden}
.idbox .cap{font-size:9.5px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--muted);background:var(--surface-2);padding:9px 15px;border-bottom:1px solid var(--line)}
.idrow{display:grid;grid-template-columns:96px 1fr;gap:10px;padding:9px 15px;font-size:12px;border-bottom:1px solid var(--line-2)}
.idrow:last-child{border-bottom:none}
.idrow .k{color:var(--muted);font-weight:700}
.idrow .v{color:var(--ink);font-weight:600;word-break:break-word}
.chip-sys{display:inline-block;font-size:11px;font-weight:700;background:var(--brick-soft);color:var(--brick);padding:1px 8px;border-radius:20px;margin:0 4px 4px 0}

.totalbox{background:var(--graphite-2);border-radius:12px;padding:18px 18px 16px;color:#fff;display:flex;flex-direction:column;position:relative;overflow:hidden}
.totalbox::after{content:"";position:absolute;right:-30px;top:-30px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(152,25,21,.5),transparent 70%)}
.trust{position:absolute;top:14px;right:14px;display:inline-flex;align-items:center;gap:5px;font-size:9px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;padding:3px 9px 3px 7px;border-radius:20px;z-index:2}
.tl{font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.5);position:relative}
.tv{font-family:var(--cond);font-weight:700;font-size:46px;line-height:.9;margin-top:6px;position:relative}
.tv.pending{font-size:28px;color:rgba(255,255,255,.85)}
.tu{font-size:12px;color:rgba(255,255,255,.55);margin-top:8px;position:relative}
.area-row{display:flex;gap:16px;margin-top:14px;padding-top:13px;border-top:1px solid rgba(255,255,255,.12);position:relative}
.area-row .a b{font-family:var(--cond);font-weight:700;font-size:20px;color:#fff;display:block;line-height:1}
.area-row .a span{font-size:10px;color:rgba(255,255,255,.5);letter-spacing:.3px}

/* sistemas */
.sysblock{margin-top:24px;break-inside:avoid}
.sys-h{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:11px 16px;background:var(--graphite);color:#fff;border-radius:10px 10px 0 0}
.sys-h .nm{font-family:var(--cond);font-weight:700;font-size:21px;letter-spacing:.4px;display:flex;align-items:center;gap:10px}
.sys-h .ar{display:flex;align-items:baseline;gap:5px}
.sys-h .ar b{font-family:var(--cond);font-weight:700;font-size:22px}
.sys-h .ar span{font-size:11px;color:rgba(255,255,255,.55)}

table{width:100%;border-collapse:collapse;font-size:11.5px}
table thead th{text-align:left;font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--muted);padding:9px 12px;background:var(--surface-2);border-bottom:1px solid var(--line)}
table thead th.r{text-align:right}
table tbody td{padding:9px 12px;border-bottom:1px solid var(--line-2);vertical-align:top}
table tbody tr:nth-child(even) td{background:#fcfbf8}
td.r{text-align:right}
.insumo{font-weight:700;color:var(--ink);line-height:1.3;max-width:230px}
.grp{display:inline-block;font-size:9.5px;font-weight:700;letter-spacing:.4px;color:var(--ink-2);background:var(--surface-2);border:1px solid var(--line);padding:2px 8px;border-radius:6px;white-space:nowrap}
.cons{color:var(--ink-2);white-space:nowrap}
.qtd{font-family:var(--cond);font-weight:700;font-size:14px;color:var(--ink)}
.unit{color:var(--ink-2);white-space:nowrap;font-variant-numeric:tabular-nums}
.tot{font-family:var(--cond);font-weight:700;font-size:14px;color:var(--ink)}
.org{display:inline-flex;align-items:center;gap:5px;font-size:9.5px;font-weight:800;letter-spacing:.4px;padding:2px 8px;border-radius:20px;white-space:nowrap;margin-top:4px}
.org .d{width:7px;height:7px;border-radius:50%}
.org.cat{background:var(--cat-soft);color:var(--cat)}.org.cat .d{background:var(--cat)}
.org.mkt{background:var(--mkt-soft);color:var(--mkt)}.org.mkt .d{background:var(--mkt)}
.org.est{background:var(--est-soft);color:var(--est)}.org.est .d{background:var(--est)}
.sub-tr td{background:var(--brick-soft)!important;border-bottom:none;padding:11px 12px}
.sub-tr .sl{font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:var(--brick)}
.sub-tr .sv{font-family:var(--cond);font-weight:700;font-size:18px;color:var(--brick);text-align:right;white-space:nowrap}
.tbl-wrap{border:1px solid var(--line);border-top:none;border-radius:0 0 10px 10px;overflow:hidden}

/* resumo */
.resumo{margin-top:26px;break-inside:avoid}
.resumo h2,.rastro h2{font-family:var(--cond);font-weight:700;font-size:13px;letter-spacing:2.5px;text-transform:uppercase;color:var(--ink);display:flex;align-items:center;gap:10px;margin-bottom:16px}
.resumo h2::after,.rastro h2::after{content:"";flex:1;height:1px;background:var(--line)}
.gbars{display:flex;flex-direction:column;gap:11px}
.gbar{display:grid;grid-template-columns:130px 1fr 130px;align-items:center;gap:14px}
.gbar .gn{font-size:12px;font-weight:700;color:var(--ink)}
.gbar .track{display:block;height:11px;background:var(--surface-2);border:1px solid var(--line);border-radius:20px;overflow:hidden}
.gbar .fill{display:block;height:100%;border-radius:20px;background:linear-gradient(90deg,var(--brick),#c0392f)}
.gbar .gv{font-family:var(--cond);font-weight:700;font-size:16px;color:var(--ink);text-align:right}
.grand{display:flex;align-items:center;justify-content:space-between;margin-top:16px;padding:14px 18px;background:var(--graphite-2);border-radius:11px;color:#fff}
.grand .gl{font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.6)}
.grand .gt{font-family:var(--cond);font-weight:700;font-size:30px;line-height:1}

/* legenda */
.legend{display:flex;gap:18px;flex-wrap:wrap;margin-top:18px;padding:13px 16px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px}
.legend .li{display:flex;align-items:center;gap:8px;font-size:10.5px;color:var(--ink-2);font-weight:600}
.legend .li .d{width:9px;height:9px;border-radius:50%}
.legend .li b{font-weight:800;letter-spacing:.3px}
.legend .li.cat .d{background:var(--cat)}.legend .li.cat b{color:var(--cat)}
.legend .li.mkt .d{background:var(--mkt)}.legend .li.mkt b{color:var(--mkt)}
.legend .li.est .d{background:var(--est)}.legend .li.est b{color:var(--est)}

/* rastreabilidade */
.rastro{margin-top:24px;break-inside:avoid}
.rastro .rbox{border:1px solid var(--line);border-radius:11px;padding:15px 18px;background:var(--surface-2)}
.rmeta{display:flex;gap:24px;flex-wrap:wrap;padding-bottom:12px;border-bottom:1px solid var(--line);margin-bottom:12px}
.rmeta .rm .k{font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--muted)}
.rmeta .rm .v{font-size:11.5px;font-weight:700;color:var(--ink);margin-top:3px}
.rmeta .rm .v .id{font-family:var(--mono);font-weight:500;font-size:10px}
.rastro p{font-size:10.5px;color:var(--ink-2);line-height:1.6}
.rastro p b{color:var(--ink);font-weight:700}

/* footer */
.docfoot{margin-top:auto;padding-top:11px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--line);font-size:9.5px;color:var(--muted)}
.docfoot .fb{display:flex;align-items:center;gap:8px}
.docfoot .fb img{width:15px;height:15px;object-fit:contain;opacity:.8}
.docfoot b{color:var(--ink-2);font-weight:700}

/* empty state */
.emptystate{text-align:center;padding:36px 24px;border:1.5px dashed var(--line);border-radius:12px;background:repeating-linear-gradient(-45deg,transparent,transparent 6px,rgba(231,225,216,.25) 6px,rgba(231,225,216,.25) 12px);margin-top:28px}
.es-ico{display:inline-flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:16px;background:var(--surface);box-shadow:0 2px 8px rgba(40,30,20,.12);margin-bottom:14px}
.emptystate h3{font-family:var(--cond);font-weight:700;font-size:26px;color:var(--ink);margin-bottom:8px}
.emptystate p{font-size:13px;color:var(--ink-2);max-width:430px;margin:0 auto 18px}
.steps{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.step{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--ink-2)}
.step .sn{display:inline-flex;align-items:center;justify-content:center;width:21px;height:21px;border-radius:50%;background:var(--brick);color:#fff;font-size:11px;font-weight:800;flex-shrink:0}
.placeholder-tbl{border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-top:0}
.ph-head{padding:12px 16px;background:var(--graphite);color:rgba(255,255,255,.55);font-size:12px;font-weight:700}
.bar{height:20px;margin:12px 16px;border-radius:6px;background:linear-gradient(90deg,var(--surface-2),var(--line));opacity:.7}

/* screen toolbar */
.toolbar{position:sticky;top:0;z-index:20;background:var(--graphite-2);color:#fff;display:flex;align-items:center;justify-content:space-between;padding:10px 18px;font-size:12.5px}
.toolbar .tt{display:flex;align-items:center;gap:9px;font-weight:700}
.toolbar button{display:inline-flex;align-items:center;gap:8px;background:var(--brick);color:#fff;border:none;border-radius:9px;padding:9px 16px;font-family:var(--sans);font-weight:700;font-size:12.5px;cursor:pointer}
.toolbar button:hover{background:var(--brick-dk)}

@media print{
  @page{size:A4;margin:0}
  body{background:#fff}
  .toolbar{display:none}
  .page{box-shadow:none;margin:0;width:auto;min-height:auto}
  .sysblock,.resumo,.rastro,tr{break-inside:avoid}
}
</style>
</head>
<body>

<div class="toolbar">
  <span class="tt">${ICO.doc} Orçamento Técnico StickQuote™ · ${tituloDoc}</span>
  <button onclick="window.print()">${ICO.print} Imprimir / Salvar PDF</button>
</div>

<div class="page">

  <!-- CABEÇALHO -->
  <div class="dochead">
    <div class="dh-l">
      <img src="${LOGO}" alt="StickFrame"/>
      <div>
        <div class="wm">STICK<span>FRAME</span></div>
        <div class="sb">StickQuote™ · Motor de Composição Técnica</div>
      </div>
    </div>
    <div class="dh-r">
      ${versaoId ? `<span class="ver">VERSÃO #${versaoNum || '—'}</span>` : ''}
      <div class="gen">Gerado em<br/><b>${dataGer}</b></div>
    </div>
  </div>

  <!-- TÍTULO -->
  <div class="doctitle">
    <div class="ey">Orçamento Técnico</div>
    <h1>Composição de Materiais<br/>Steel Frame</h1>
    <div class="h-sub">${hSub}</div>
  </div>

  <!-- IDENTIFICAÇÃO + CARD TOTAL -->
  <div class="idgrid">
    <div class="idbox">
      <div class="cap">Identificação</div>
      ${tituloDoc !== nome ? `<div class="idrow"><span class="k">Título</span><span class="v">${nome}</span></div>` : ''}
      ${obraNome  ? `<div class="idrow"><span class="k">Obra</span><span class="v">${obraNome}</span></div>` : ''}
      ${clienteNome ? `<div class="idrow"><span class="k">Cliente</span><span class="v">${clienteNome}</span></div>` : ''}
      <div class="idrow"><span class="k">Origem</span><span class="v">${origemLabel}</span></div>
      <div class="idrow"><span class="k">Biblioteca</span><span class="v">StickFrame v1.0 · Composições Técnicas Steel Frame</span></div>
      <div class="idrow"><span class="k">Sistemas</span><span class="v">${(selecoes || []).map(s => `<span class="chip-sys">${s.composicaoNome || s.composicaoId} · ${fmtN(s.area, 0)} m²</span>`).join('')}</span></div>
    </div>
    <div class="totalbox">
      ${trustLabel ? `<span class="trust" style="background:${trustBg};color:${trustColor}">${trustIcon}${trustLabel}</span>` : ''}
      <div class="tl">Total de Materiais</div>
      ${totalCusto > 0
        ? `<div class="tv num">R$ ${Math.floor(totalCusto).toLocaleString('pt-BR')}<span style="font-size:24px">,${String(Math.round((totalCusto % 1) * 100)).padStart(2, '0')}</span></div>`
        : `<div class="tv pending">A configurar</div>`}
      <div class="tu">${breakdown.length} sistema${breakdown.length !== 1 ? 's' : ''} · ${numInsumos} insumo${numInsumos !== 1 ? 's' : ''} · ${Object.keys(grupos).length} grupo${Object.keys(grupos).length !== 1 ? 's' : ''}</div>
      <div class="area-row">
        <div class="a"><b class="num">${fmtN(areaOrcada, 1)} m²</b><span>Área orçada</span></div>
        ${custoM2 > 0 ? `<div class="a"><b class="num">R$ ${Math.round(custoM2).toLocaleString('pt-BR')}</b><span>Custo / m²</span></div>` : ''}
      </div>
    </div>
  </div>

  <!-- SISTEMAS -->
  ${secoesHtml}
  ${emptyHtml}

  <!-- RESUMO POR GRUPO -->
  ${breakdown.length > 0 ? `
  <div class="resumo">
    <h2>Resumo por Grupo de Material</h2>
    <div class="gbars">${gruposHtml}</div>
    <div class="grand">
      <span class="gl">Total de Materiais</span>
      <span class="gt num">${totalCusto > 0 ? fmtBRL(totalCusto) : 'Preços a configurar'}</span>
    </div>
    <div class="legend">
      <span class="li cat"><span class="d"></span><b>CAT</b> Catálogo confirmado</span>
      <span class="li mkt"><span class="d"></span><b>MKT</b> Preço de mercado (match automático)</span>
      <span class="li est"><span class="d"></span><b>EST</b> Preço pendente — confirmar com fornecedor</span>
    </div>
  </div>` : ''}

  <!-- RASTREABILIDADE -->
  <div class="rastro">
    <h2>Rastreabilidade StickQuote™</h2>
    <div class="rbox">
      <div class="rmeta">${metaRows}</div>
      <p>${premissasTxt}</p>
    </div>
  </div>

  <!-- RODAPÉ -->
  <div class="docfoot">
    <span class="fb"><img src="${LOGO}" alt=""/> <b>StickQuote™</b> · Orçamento Técnico Steel Frame</span>
    <span>${obraNome || tituloDoc}</span>
    <span>StickFrame · ${new Date().getFullYear()}</span>
  </div>

</div>
</body>
</html>`;

  printHtml(html, `stickquote-${(tituloDoc || nome).replace(/\s+/g, '-').toLowerCase()}`);
}
