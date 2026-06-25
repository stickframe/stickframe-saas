import { printHtml } from '../utils/printHtml';
import { LOGO_STICKFRAME } from '../utils/cdn';
import { sb, getEmpresaId } from './supabase';

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtN   = (v, d = 2) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const hoje   = () => new Date().toLocaleDateString('pt-BR');
const agora  = () => new Date().toLocaleString('pt-BR');

const STATUS_LABEL = { rascunho: 'Rascunho', enviado: 'Enviado', aprovado: 'Aprovado ✓', cancelado: 'Cancelado' };
const STATUS_COR   = { rascunho: '#8c847a', enviado: '#3b6ea5', aprovado: '#3f7a4b', cancelado: '#981915' };

const GRUPOS_COR = {
  'Estrutura': '#3b6ea5', 'Fechamento': '#4f7d57', 'Impermeabilização': '#7a5ae0',
  'Acabamento': '#c0892d', 'Isolamento': '#8c847a', 'Fixação': '#981915',
};

/**
 * Salva a versão do StickQuote no Supabase e retorna o registro.
 */
export async function salvarStickQuote({ nome, obraNome, clienteNome, selecoes, resultado, observacoes }) {
  const empresaId = getEmpresaId();
  if (!empresaId) throw new Error('empresa_id não encontrado');

  const { data, error } = await sb
    .from('stickquote_versoes')
    .insert({
      empresa_id:   empresaId,
      nome,
      obra_nome:    obraNome  || null,
      cliente_nome: clienteNome || null,
      selecoes:     JSON.parse(JSON.stringify(selecoes)),
      resultado:    JSON.parse(JSON.stringify(resultado)),
      observacoes:  observacoes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Carrega o histórico de StickQuote da empresa.
 */
export async function carregarHistoricoStickQuote() {
  const { data, error } = await sb
    .from('stickquote_versoes')
    .select('id, nome, obra_nome, cliente_nome, versao, status, resultado, created_at')
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

/**
 * Gera o PDF comercial StickQuote™ e abre a janela de impressão.
 */
export function gerarStickQuotePDF({ nome, obraNome, clienteNome, selecoes, resultado, observacoes, versaoId, versaoNum, origemIFC }) {
  const LOGO = LOGO_STICKFRAME;
  const dataGeracao = agora();
  const totalCusto  = resultado.totalCusto || 0;

  // Área processada pelo orçamento (soma das áreas de composição)
  const areaOrcada = (selecoes || []).reduce((s, sel) => s + (Number(sel.area) || 0), 0);
  // Área informada no documento (extraída das observações via regex, ou da maior seleção)
  const areaDocMatch = (observacoes || '').match(/[Áá]rea\s+constru[íi]da:\s*([\d.,]+)\s*m/i)
    || (observacoes || '').match(/[Áá]rea:\s*([\d.,]+)\s*m/i);
  const areaDocumento = areaDocMatch
    ? parseFloat(areaDocMatch[1].replace(',', '.'))
    : 0;
  const mostrarAreaDivergencia = areaDocumento > 0 && Math.abs(areaDocumento - areaOrcada) > 5;

  // Título comercial
  const tituloComercial = obraNome || clienteNome || nome;
  const subtituloLinha  = obraNome && clienteNome ? clienteNome : '';

  // StickTrust extraído das observações
  const trustMatch  = (observacoes || '').match(/StickTrust™?\s*(\d+)%\s*\(([^)]+)\)/i);
  const trustScore  = trustMatch ? trustMatch[1] : null;
  const trustNivel  = trustMatch ? trustMatch[2] : null;
  const trustCor    = trustNivel === 'alto' ? '#166534' : trustNivel === 'medio' ? '#713f12' : '#991b1b';
  const trustBg     = trustNivel === 'alto' ? '#dcfce7' : trustNivel === 'medio' ? '#fef9c3' : '#fee2e2';

  // ── Seção por composição ─────────────────────────────────────────────────
  const secoesHtml = (resultado.breakdown || []).map((bd) => {
    const comp = bd.composicao;
    const cor  = comp.cor || '#981915';

    const itensRows = (bd.itens || []).map((it, i) => {
      const bgRow = i % 2 === 0 ? '#fff' : '#fafaf9';
      const consumoFmt = `${fmtN(it.consumo, 3)} ${it.un}/m²`;
      const origemBadge = it.origemPreco === 'catalogo'
        ? '<span title="Preço do catálogo da empresa" style="font-size:9px;padding:1px 5px;border-radius:10px;background:#dcfce7;color:#166534;font-weight:700">🟢 CAT</span>'
        : it.origemPreco === 'mercado'
        ? '<span title="Preço de mercado (match fuzzy)" style="font-size:9px;padding:1px 5px;border-radius:10px;background:#fef9c3;color:#713f12;font-weight:700">🟡 MKT</span>'
        : '<span title="Preço pendente — confirmar com fornecedor" style="font-size:9px;padding:1px 5px;border-radius:10px;background:#fee2e2;color:#991b1b;font-weight:700">🔴 Preço pendente</span>';
      return `
        <tr style="background:${bgRow}">
          <td style="padding:7px 12px;border-bottom:1px solid #eee;font-size:12px">${it.nome}</td>
          <td style="padding:7px 12px;text-align:center;border-bottom:1px solid #eee;font-size:11px;color:#6b7280">${it.grupo || ''}</td>
          <td style="padding:7px 12px;text-align:center;border-bottom:1px solid #eee;font-size:11px;color:#6b7280">${consumoFmt}</td>
          <td style="padding:7px 12px;text-align:right;border-bottom:1px solid #eee;font-size:12px;font-weight:600">${fmtN(it.qtdArredondada, 0)} ${it.un}</td>
          <td style="padding:7px 12px;text-align:right;border-bottom:1px solid #eee;font-size:12px;color:#6b7280">${it.preco > 0 ? fmtBRL(it.preco) : '—'} ${origemBadge}</td>
          <td style="padding:7px 12px;text-align:right;border-bottom:1px solid #eee;font-size:12px;font-weight:700;color:${it.custo > 0 ? '#1a1a1a' : '#d1d5db'}">${it.custo > 0 ? fmtBRL(it.custo) : '—'}</td>
        </tr>`;
    }).join('');

    const subtotal = (bd.itens || []).reduce((s, it) => s + it.custo, 0);

    return `
      <div style="margin-bottom:28px;break-inside:avoid">
        <!-- Cabeçalho do sistema -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:${cor};color:#fff;border-radius:8px 8px 0 0">
          <div>
            <div style="font-size:13px;font-weight:800;letter-spacing:.3px">${comp.nome}</div>
            ${comp.sistema ? `<div style="font-size:10px;opacity:.8;margin-top:2px">${comp.sistema}</div>` : ''}
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;opacity:.8">Área</div>
            <div style="font-size:16px;font-weight:800">${fmtN(bd.area, 0)} m²</div>
          </div>
        </div>
        <!-- Tabela de insumos -->
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;font-size:12px">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:7px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:700;border-bottom:1px solid #e5e7eb">Insumo</th>
              <th style="padding:7px 12px;text-align:center;font-size:11px;color:#6b7280;font-weight:700;border-bottom:1px solid #e5e7eb">Grupo</th>
              <th style="padding:7px 12px;text-align:center;font-size:11px;color:#6b7280;font-weight:700;border-bottom:1px solid #e5e7eb">Consumo/m²</th>
              <th style="padding:7px 12px;text-align:right;font-size:11px;color:#6b7280;font-weight:700;border-bottom:1px solid #e5e7eb">Qtd</th>
              <th style="padding:7px 12px;text-align:right;font-size:11px;color:#6b7280;font-weight:700;border-bottom:1px solid #e5e7eb">Unit R$</th>
              <th style="padding:7px 12px;text-align:right;font-size:11px;color:#6b7280;font-weight:700;border-bottom:1px solid #e5e7eb">Total R$</th>
            </tr>
          </thead>
          <tbody>${itensRows}</tbody>
          <tfoot>
            <tr style="background:#f3f4f6">
              <td colspan="5" style="padding:8px 12px;font-weight:700;font-size:12px">Subtotal — ${comp.nome}</td>
              <td style="padding:8px 12px;text-align:right;font-weight:800;font-size:13px;color:${cor}">${subtotal > 0 ? fmtBRL(subtotal) : '—'}</td>
            </tr>
          </tfoot>
        </table>
      </div>`;
  }).join('');

  // ── Resumo consolidado por grupo ─────────────────────────────────────────
  const grupos = {};
  (resultado.lista || []).forEach((it) => {
    if (!grupos[it.grupo]) grupos[it.grupo] = 0;
    grupos[it.grupo] += it.custo;
  });
  const resumoGruposHtml = Object.entries(grupos).map(([grp, val]) => {
    const cor = GRUPOS_COR[grp] || '#374151';
    return `<tr>
      <td style="padding:7px 12px;font-size:12px;border-bottom:1px solid #e5e7eb">${grp}</td>
      <td style="padding:7px 12px;text-align:right;font-size:12px;font-weight:700;color:${cor};border-bottom:1px solid #e5e7eb">${val > 0 ? fmtBRL(val) : '—'}</td>
    </tr>`;
  }).join('');

  // ── Sistemas selecionados (metadata) ─────────────────────────────────────
  const sistemasMetadata = (selecoes || []).map((s) =>
    `<li style="margin-bottom:3px;font-size:12px"><strong>${s.composicaoNome || s.composicaoId}</strong> — ${fmtN(s.area, 0)} m²</li>`
  ).join('');

  const numSistemas = (selecoes || []).length;
  const custoM2     = areaOrcada > 0 ? totalCusto / areaOrcada : 0;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Orçamento Steel Frame — ${tituloComercial}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; margin: 0; padding: 0; background: #fff; }
    @media print {
      @page { margin: 14mm 14mm; }
      body { padding: 0; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    table { border-collapse: collapse; width: 100%; }
  </style>
</head>
<body style="padding: 36px 44px; max-width: 900px; margin: auto;">

  <!-- ═══════════════════════════════════════════════════════════════
       PÁGINA 1 — CAPA / RESUMO EXECUTIVO
  ═══════════════════════════════════════════════════════════════ -->

  <!-- TOPO GRAFITE -->
  <div style="background:#1a191c;color:#fff;padding:8px 16px;font-size:10px;letter-spacing:.8px;text-transform:uppercase;border-radius:6px 6px 0 0">
    StickFrame &middot; StickQuote&trade; &middot; Motor de Composição Técnica Steel Frame
  </div>

  <!-- HEADER LOGO + NÚMERO -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:20px 0 16px;border-bottom:2px solid #e5e7eb">
    <div style="display:flex;align-items:center;gap:14px">
      <img src="${LOGO}" style="width:52px;height:52px;object-fit:contain;border-radius:10px">
      <div>
        <div style="font-size:10px;letter-spacing:2px;color:#6b7280;font-weight:700;text-transform:uppercase">Orçamento Steel Frame</div>
        <div style="font-size:26px;font-weight:900;color:#1a191c;letter-spacing:-0.5px;line-height:1.1">${tituloComercial}</div>
        ${subtituloLinha ? `<div style="font-size:13px;color:#6b7280;margin-top:3px">${subtituloLinha}</div>` : ''}
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:9px;color:#9ca3af;letter-spacing:1.2px;text-transform:uppercase">StickQuote™</div>
      ${versaoId ? `<div style="font-size:22px;font-weight:800;color:#981915;line-height:1">#${versaoNum || '—'}</div>` : ''}
      <div style="font-size:10px;color:#9ca3af;margin-top:6px">${dataGeracao}</div>
    </div>
  </div>

  <!-- KPIs — RESUMO EXECUTIVO -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:24px 0">
    <div style="background:#faf8f4;border:1px solid #e7e1d8;border-radius:10px;padding:14px 16px">
      <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8c847a">Área orçada</div>
      <div style="font-size:26px;font-weight:900;color:#1a191c;line-height:1.1;margin-top:4px">${fmtN(areaOrcada, 1)} <span style="font-size:13px;font-weight:600;color:#6b7280">m²</span></div>
    </div>
    <div style="background:#faf8f4;border:1px solid #e7e1d8;border-radius:10px;padding:14px 16px">
      <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8c847a">Sistemas</div>
      <div style="font-size:26px;font-weight:900;color:#1a191c;line-height:1.1;margin-top:4px">${numSistemas}</div>
    </div>
    <div style="background:#1a191c;border-radius:10px;padding:14px 16px">
      <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8c847a">Total materiais</div>
      <div style="font-size:20px;font-weight:900;color:#fff;line-height:1.1;margin-top:4px">${totalCusto > 0 ? fmtBRL(totalCusto) : 'A configurar'}</div>
    </div>
    <div style="background:#faf8f4;border:1px solid #e7e1d8;border-radius:10px;padding:14px 16px">
      <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8c847a">Custo/m²</div>
      <div style="font-size:20px;font-weight:900;color:#981915;line-height:1.1;margin-top:4px">${custoM2 > 0 ? fmtBRL(custoM2) : '—'}</div>
    </div>
  </div>

  ${mostrarAreaDivergencia ? `
  <!-- ÁREA: processada vs documento -->
  <div style="margin-bottom:20px;padding:12px 16px;background:#fefce8;border:1px solid #fde68a;border-radius:8px;font-size:12px;color:#713f12;display:flex;gap:24px;align-items:flex-start">
    <div>⚠ <strong>Nota de área:</strong></div>
    <div style="display:flex;gap:32px">
      <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;opacity:.7">Área processada no orçamento</div><div style="font-size:16px;font-weight:800">${fmtN(areaOrcada, 1)} m²</div></div>
      <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;opacity:.7">Área informada no documento</div><div style="font-size:16px;font-weight:800">${fmtN(areaDocumento, 1)} m²</div></div>
    </div>
  </div>` : ''}

  ${trustScore ? `
  <!-- STICKTRUST -->
  <div style="margin-bottom:20px;padding:10px 16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:12px;display:flex;align-items:center;gap:12px">
    <span style="font-weight:800;color:#166534">StickTrust™</span>
    <span style="background:${trustBg};color:${trustCor};padding:2px 10px;border-radius:20px;font-weight:800;font-size:13px">${trustScore}%</span>
    <span style="color:#374151">Confiança ${trustNivel} — quantitativo extraído automaticamente, validado pelo usuário</span>
  </div>` : ''}

  <!-- SISTEMAS RESUMO -->
  <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#6b7280;text-transform:uppercase;margin-bottom:10px">Sistemas incluídos</div>
  <table style="margin-bottom:28px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:12px">
    <thead><tr style="background:#f9fafb">
      <th style="padding:7px 14px;text-align:left;font-size:10px;color:#6b7280;font-weight:700;border-bottom:1px solid #e5e7eb">Sistema</th>
      <th style="padding:7px 14px;text-align:right;font-size:10px;color:#6b7280;font-weight:700;border-bottom:1px solid #e5e7eb">Área</th>
    </tr></thead>
    <tbody>${(selecoes || []).map((s, i) => `
      <tr style="border-bottom:1px solid #e5e7eb;background:${i % 2 === 0 ? '#fff' : '#fafaf9'}">
        <td style="padding:8px 14px;font-weight:600">${s.composicaoNome || s.composicaoId}</td>
        <td style="padding:8px 14px;text-align:right;color:#6b7280">${fmtN(s.area, 0)} m²</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <!-- ═══════════════════════════════════════════════════════════════
       PÁGINA 2+ — DETALHAMENTO POR SISTEMA
  ═══════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>

  <!-- SUB-HEADER no início do detalhamento -->
  <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:2px solid #e5e7eb;margin-bottom:24px">
    <div>
      <div style="font-size:10px;letter-spacing:2px;color:#6b7280;font-weight:700;text-transform:uppercase">Detalhamento técnico</div>
      <div style="font-size:18px;font-weight:800;color:#1a191c">${tituloComercial}</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#9ca3af">${versaoId ? `#${versaoNum || '—'} · ` : ''}${hoje()}</div>
  </div>

  <!-- COMPOSIÇÕES DETALHADAS -->
  <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#6b7280;text-transform:uppercase;margin-bottom:16px">Composição por Sistema</div>
  ${secoesHtml}

  <!-- RESUMO CONSOLIDADO -->
  <div style="page-break-inside:avoid;margin-top:8px">
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#6b7280;text-transform:uppercase;margin-bottom:12px">Resumo por Grupo de Material</div>
    <table style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:0;font-size:12px">
      <thead>
        <tr style="background:#f9fafb">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:700;border-bottom:1px solid #e5e7eb">Grupo</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:#6b7280;font-weight:700;border-bottom:1px solid #e5e7eb">Total</th>
        </tr>
      </thead>
      <tbody>${resumoGruposHtml}</tbody>
      <tfoot>
        <tr style="background:#1a191c">
          <td style="padding:11px 14px;color:#fff;font-weight:800;font-size:13px">TOTAL MATERIAIS</td>
          <td style="padding:11px 14px;text-align:right;color:#fff;font-weight:900;font-size:16px">${totalCusto > 0 ? fmtBRL(totalCusto) : 'Preços a configurar'}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  ${observacoes ? `
  <div style="margin-top:24px;padding:14px 16px;background:#faf8f4;border:1px solid #e7e1d8;border-radius:8px;font-size:12px;color:#57514a">
    <div style="font-weight:700;margin-bottom:4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#8c847a">Observações</div>
    ${observacoes}
  </div>` : ''}

  <!-- LEGENDA DE ORIGEM DE PREÇO -->
  <div style="margin-top:20px;padding:10px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;font-size:10px;color:#6b7280;display:flex;gap:16px;align-items:center;flex-wrap:wrap">
    <strong style="color:#374151">Origem do preço:</strong>
    <span><span style="background:#dcfce7;color:#166534;padding:1px 6px;border-radius:10px;font-weight:700">🟢 CAT</span> Catálogo confirmado</span>
    <span><span style="background:#fef9c3;color:#713f12;padding:1px 6px;border-radius:10px;font-weight:700">🟡 MKT</span> Preço de mercado (match automático)</span>
    <span><span style="background:#fee2e2;color:#991b1b;padding:1px 6px;border-radius:10px;font-weight:700">🔴 Preço pendente</span> Confirmar com fornecedor</span>
  </div>

  <!-- RASTREABILIDADE -->
  <div style="margin-top:16px;padding:12px 16px;background:#f3f4f6;border-radius:8px;font-size:10px;color:#9ca3af;line-height:1.6">
    <strong style="color:#6b7280">Rastreabilidade StickQuote&trade;</strong><br>
    Biblioteca: StickFrame v1.0 &middot; Gerado em: ${dataGeracao}
    ${versaoId ? ` &middot; ID: ${versaoId}` : ''}<br>
    ${origemIFC ? `Premissas: Quantidades calculadas automaticamente pelo modelo BIM IFC (${origemIFC}). ` : ''}Os quantitativos foram calculados pela metodologia de composição técnica Steel Frame.
    Preços sujeitos a confirmação com fornecedores. Perdas já incluídas nas quantidades.
  </div>

  <!-- RODAPÉ -->
  <div style="margin-top:24px;padding-top:14px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#9ca3af">
    <span>StickFrame &middot; StickQuote&trade; é uma metodologia proprietária</span>
    <span>${hoje()}</span>
  </div>

</body>
</html>`;

  printHtml(html, `stickquote-${nome.replace(/\s+/g, '-').toLowerCase()}`);
}
