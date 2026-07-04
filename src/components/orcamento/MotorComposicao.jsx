import React, { useState, useMemo, useEffect } from 'react';
import { COMPOSICOES_SF, calcMotorComposicao } from '../../utils/composicoesSF';
import { CATALOGO_PRODUTOS } from '../../utils/insumosSF';
import { C } from '../../utils/constants';
import { sb } from '../../services/supabase';
import { gerarStickQuotePDF, salvarStickQuote, carregarHistoricoStickQuote } from '../../services/stickquoteService';

const fmtBRL = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtN   = (v, d = 2) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

const GRUPOS_COR = {
  'Estrutura':          '#3b6ea5',
  'Fechamento':         '#4f7d57',
  'Impermeabilização':  '#7a5ae0',
  'Acabamento':         '#c0892d',
  'Isolamento':         '#8c847a',
  'Fixação':            '#981915',
};

function Chip({ label, cor }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
      background: cor + '18', color: cor, border: `1px solid ${cor}40`,
      flexShrink: 0,
    }}>{label}</span>
  );
}

export default function MotorComposicao({ onEnviarOrcamento }) {
  // Composições carregadas do Supabase (globais + da empresa) com fallback estático
  const [composicoes, setComposicoes] = useState(COMPOSICOES_SF);
  const [loadingComp, setLoadingComp] = useState(true);

  useEffect(() => {
    sb.from('composicoes_sf')
      .select('*, composicao_itens(*)')
      .eq('ativo', true)
      .order('ordem')
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          // Mapear para formato do COMPOSICOES_SF
          const mapped = data.map((c) => ({
            id: c.id,
            _dbId: c.id,
            nome: c.nome,
            descricao: c.descricao,
            sistema: c.sistema,
            unidade: c.unidade || 'm²',
            cor: c.cor || '#981915',
            isGlobal: !c.empresa_id,
            itens: (c.composicao_itens || [])
              .sort((a, b) => a.ordem - b.ordem)
              .map((it) => ({
                nome: it.nome,
                un: it.un,
                consumo: Number(it.consumo),
                grupo: it.grupo,
                catBusca: it.cat_busca || [],
              })),
          }));
          setComposicoes(mapped);
        }
      })
      .finally(() => setLoadingComp(false));
  }, []);

  // Estado: lista de composições ativas com area
  const [linhas, setLinhas] = useState([]);
  const [expandido, setExpandido] = useState(null);
  const [enviado, setEnviado] = useState(false);

  // Metadados do quote
  const [nomeQuote, setNomeQuote] = useState('');
  const [obraNome,  setObraNome]  = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Histórico
  const [historico, setHistorico] = useState([]);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  useEffect(() => {
    carregarHistoricoStickQuote().then(setHistorico).catch(() => {});
  }, []);

  // Inicializa primeira linha quando composições carregarem
  useEffect(() => {
    if (composicoes.length > 0 && linhas.length === 0) {
      setLinhas([{ id: Date.now(), composicaoId: composicoes[0].id, area: '' }]);
    }
  }, [composicoes]);

  function addLinha() {
    setLinhas((prev) => [...prev, { id: Date.now(), composicaoId: composicoes[0]?.id || '', area: '' }]);
  }

  function removeLinha(id) {
    setLinhas((prev) => prev.filter((l) => l.id !== id));
  }

  function updateLinha(id, field, value) {
    setLinhas((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l));
  }

  // Selecoes válidas para cálculo
  const seloesCalc = useMemo(() =>
    linhas
      .filter((l) => l.composicaoId && parseFloat(l.area) > 0)
      .map((l) => ({ composicaoId: l.composicaoId, area: parseFloat(l.area) })),
    [linhas]
  );

  const resultado = useMemo(
    () => seloesCalc.length > 0 ? calcMotorComposicao(seloesCalc, CATALOGO_PRODUTOS) : null,
    [seloesCalc]
  );

  function handleEnviar() {
    if (!resultado || resultado.lista.length === 0) return;
    const itens = resultado.lista.map((it) => ({
      produtoId:  it.produtoCat?.id || null,
      nome:       it.nome,
      categoria:  it.grupo,
      unidade:    it.un,
      quantidade: it.qtdArredondada,
      precoUnit:  it.preco,
      preco:      it.qtdArredondada * it.preco,
    }));
    onEnviarOrcamento(itens);
    setEnviado(true);
    setTimeout(() => setEnviado(false), 3000);
  }

  function buildSelecoesMeta() {
    return seloesCalc.map((s) => ({
      ...s,
      composicaoNome: compMap[s.composicaoId]?.nome || s.composicaoId,
    }));
  }

  async function handleGerarPDF() {
    if (!resultado || resultado.lista.length === 0) return;
    setGerandoPdf(true);
    try {
      const selecoesMeta = buildSelecoesMeta();
      let versaoId = null;
      let versaoNum = null;
      try {
        const saved = await salvarStickQuote({
          nome:        nomeQuote || 'StickQuote sem título',
          obraNome,
          clienteNome,
          selecoes:    selecoesMeta,
          resultado,
          observacoes,
        });
        versaoId  = saved.id;
        versaoNum = saved.numero;
        setHistorico((h) => [saved, ...h]);
      } catch (_) { /* salvar é best-effort */ }

      gerarStickQuotePDF({
        nome:        nomeQuote || 'StickQuote',
        obraNome,
        clienteNome,
        selecoes:    selecoesMeta,
        resultado,
        observacoes,
        versaoId,
        versaoNum,
      });
    } finally {
      setGerandoPdf(false);
    }
  }

  const compMap = Object.fromEntries(composicoes.map((c) => [c.id, c]));

  const inp = {
    padding: '7px 10px', fontSize: 13, fontFamily: 'inherit',
    border: `1px solid ${C.border}`, borderRadius: 8,
    background: 'var(--surface-2,#faf8f4)', color: 'var(--ink,#26231f)', outline: 'none',
  };

  return (
    <div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>
        Selecione os sistemas construtivos e informe a área de cada um.
        O motor calcula automaticamente todos os insumos e envia para o orçamento.
      </div>

      {/* Linhas de composição */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {linhas.map((linha) => {
          const comp = compMap[linha.composicaoId];
          const isOpen = expandido === linha.id;
          return (
            <div key={linha.id} style={{
              border: `1px solid ${comp ? comp.cor + '40' : C.border}`,
              borderRadius: 10, overflow: 'hidden',
              background: comp ? comp.cor + '06' : 'transparent',
            }}>
              {/* Row principal */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px auto', gap: 8, alignItems: 'center', padding: '10px 12px' }}>
                <select
                  value={linha.composicaoId}
                  onChange={(e) => updateLinha(linha.id, 'composicaoId', e.target.value)}
                  style={{ ...inp, width: '100%' }}
                >
                  {COMPOSICOES_SF.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number" min="0" step="1" placeholder="m²"
                    value={linha.area}
                    onChange={(e) => updateLinha(linha.id, 'area', e.target.value)}
                    style={{ ...inp, width: '100%', paddingRight: 28, boxSizing: 'border-box' }}
                  />
                  <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: C.muted, pointerEvents: 'none' }}>m²</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {parseFloat(linha.area) > 0 && (
                    <button
                      onClick={() => setExpandido(isOpen ? null : linha.id)}
                      title="Ver insumos"
                      style={{ background: isOpen ? C.border : 'transparent', border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 11, color: C.muted, fontFamily: 'inherit' }}
                    >
                      {isOpen ? '▲' : '▼'} Insumos
                    </button>
                  )}
                  <button
                    onClick={() => removeLinha(linha.id)}
                    style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '2px 4px' }}
                  >×</button>
                </div>
              </div>

              {/* Insumos detalhados (expandível) */}
              {isOpen && comp && parseFloat(linha.area) > 0 && (() => {
                const area = parseFloat(linha.area);
                return (
                  <div style={{ borderTop: `1px solid ${comp.cor}30`, padding: '0 12px 12px' }}>
                    <div style={{ fontSize: 11, color: C.muted, margin: '8px 0 6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {comp.nome} — {fmtN(area, 0)} m²
                    </div>
                    <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--surface-2,#faf8f4)' }}>
                          <th style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 600, color: C.muted }}>Insumo</th>
                          <th style={{ padding: '5px 8px', textAlign: 'center', color: C.muted }}>Un</th>
                          <th style={{ padding: '5px 8px', textAlign: 'right', color: C.muted }}>Qtd</th>
                          <th style={{ padding: '5px 8px', textAlign: 'right', color: C.muted }}>Unit</th>
                          <th style={{ padding: '5px 8px', textAlign: 'right', color: C.muted }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comp.itens.map((item, i) => {
                          const qtd = item.consumo * area;
                          const qtdArr = Math.ceil(qtd);
                          const prod = CATALOGO_PRODUTOS.find((p) => {
                            if (!item.catBusca) return false;
                            return item.catBusca.some((t) => new RegExp(t, 'i').test(p.nome));
                          });
                          const preco = prod?.preco ?? 0;
                          const total = qtdArr * preco;
                          return (
                            <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                              <td style={{ padding: '5px 8px' }}>
                                <div style={{ fontWeight: 500 }}>{item.nome}</div>
                                {prod && <div style={{ fontSize: 10, color: C.steel }}>✓ {prod.nome.slice(0, 55)}</div>}
                              </td>
                              <td style={{ padding: '5px 8px', textAlign: 'center', color: C.muted }}>{item.un}</td>
                              <td style={{ padding: '5px 8px', textAlign: 'right' }}>{fmtN(qtdArr, 0)}</td>
                              <td style={{ padding: '5px 8px', textAlign: 'right', color: preco > 0 ? C.text : C.danger }}>
                                {preco > 0 ? fmtBRL(preco) : '—'}
                              </td>
                              <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600 }}>
                                {total > 0 ? fmtBRL(total) : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* Adicionar linha */}
      <button
        onClick={addLinha}
        style={{
          marginTop: 10, width: '100%', padding: '8px', fontSize: 13, fontFamily: 'inherit',
          background: 'transparent', border: `1.5px dashed ${C.border}`, borderRadius: 8,
          color: C.muted, cursor: 'pointer', transition: 'all .15s',
        }}
        onMouseEnter={(e) => e.target.style.borderColor = 'var(--brick,#981915)'}
        onMouseLeave={(e) => e.target.style.borderColor = C.border}
      >
        + Adicionar sistema
      </button>

      {/* Metadados do quote */}
      {seloesCalc.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Título do orçamento</div>
              <input value={nomeQuote} onChange={(e) => setNomeQuote(e.target.value)}
                placeholder="Ex: Casa João — Parede Externa"
                style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Cliente</div>
              <input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)}
                placeholder="Nome do cliente"
                style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Obra</div>
            <input value={obraNome} onChange={(e) => setObraNome(e.target.value)}
              placeholder="Nome da obra"
              style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Observações técnicas</div>
            <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Notas, condições, exclusões..."
              rows={2}
              style={{ ...inp, width: '100%', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5 }} />
          </div>
        </div>
      )}

      {/* Resumo consolidado */}
      {resultado && resultado.lista.length > 0 && (
        <div style={{ marginTop: 16, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
          {/* Agrupado por grupo */}
          {(() => {
            const grupos = {};
            for (const it of resultado.lista) {
              if (!grupos[it.grupo]) grupos[it.grupo] = [];
              grupos[it.grupo].push(it);
            }
            return Object.entries(grupos).map(([grp, items]) => {
              const cor = GRUPOS_COR[grp] || C.text;
              const subTotal = items.reduce((s, it) => s + it.custo, 0);
              return (
                <div key={grp}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', background: cor + '10', borderBottom: `1px solid ${cor}30` }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: cor, textTransform: 'uppercase', letterSpacing: 0.5 }}>{grp}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cor }}>{subTotal > 0 ? fmtBRL(subTotal) : '—'}</span>
                  </div>
                  {items.map((it, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto 70px 80px', gap: 8, padding: '5px 12px', borderBottom: `1px solid ${C.border}`, alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{it.nome}</div>
                        {it.produtoCat && <div style={{ fontSize: 10, color: C.steel }}>✓ catálogo</div>}
                      </div>
                      <Chip label={it.un} cor={cor} />
                      <span style={{ fontSize: 12, textAlign: 'right' }}>{fmtN(it.qtdArredondada, 0)}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, textAlign: 'right' }}>
                        {it.custo > 0 ? fmtBRL(it.custo) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              );
            });
          })()}

          {/* Total + botão */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--ink,#26231f)', borderTop: 'none' }}>
            <div>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total materiais</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
                {resultado.totalCusto > 0 ? fmtBRL(resultado.totalCusto) : 'Preços a configurar'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleGerarPDF}
                disabled={gerandoPdf}
                style={{
                  padding: '10px 16px', fontSize: 13, fontFamily: 'inherit', fontWeight: 700,
                  background: gerandoPdf ? '#374151' : '#232325', color: '#fff',
                  border: '1px solid rgba(255,255,255,.15)', borderRadius: 10, cursor: gerandoPdf ? 'wait' : 'pointer',
                }}
                title="Gerar PDF StickQuote™ e salvar no histórico"
              >
                {gerandoPdf ? '...' : '📄 PDF'}
              </button>
              <button
                onClick={handleEnviar}
                style={{
                  padding: '10px 18px', fontSize: 13, fontFamily: 'inherit', fontWeight: 700,
                  background: enviado ? '#3f7a4b' : 'var(--brick,#981915)', color: '#fff',
                  border: 'none', borderRadius: 10, cursor: 'pointer', transition: 'background .2s',
                }}
              >
                {enviado ? '✓ Adicionado!' : '→ Enviar para Orçamento'}
              </button>
            </div>
          </div>

          {/* Histórico de versões */}
          {historico.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', background: '#18181b' }}>
              <button
                onClick={() => setMostrarHistorico((v) => !v)}
                style={{ width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#9ca3af', fontSize: 11, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
              >
                {mostrarHistorico ? '▲' : '▼'} Histórico de versões ({historico.length})
              </button>
              {mostrarHistorico && (
                <div style={{ padding: '0 14px 12px', maxHeight: 200, overflowY: 'auto' }}>
                  {historico.map((h) => (
                    <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.06)', fontSize: 11 }}>
                      <div>
                        <div style={{ color: '#e5e7eb', fontWeight: 600 }}>
                          {h.nome}
                          {h.origem === 'StickFEM' && (
                            <span title="Quantitativo derivado de análise estrutural StickFEM™" style={{
                              marginLeft: 6, fontSize: 9, fontWeight: 800, background: '#6d557e',
                              color: '#fff', borderRadius: 4, padding: '1px 6px', verticalAlign: 'middle',
                            }}>🟣 ENGENHARIA</span>
                          )}
                        </div>
                        <div style={{ color: '#6b7280', marginTop: 1 }}>
                          {h.obra_nome ? `${h.obra_nome} · ` : ''}{new Date(h.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#9ca3af', fontWeight: 700 }}>
                          {h.resultado?.totalCusto > 0 ? fmtBRL(h.resultado.totalCusto) : '—'}
                        </div>
                        <button
                          onClick={() => gerarStickQuotePDF({ nome: h.nome, obraNome: h.obra_nome, clienteNome: h.cliente_nome, selecoes: h.selecoes || [], resultado: h.resultado, versaoId: h.id })}
                          style={{ fontSize: 10, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', fontFamily: 'inherit' }}
                        >
                          📄 Reimprimir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {resultado && resultado.lista.length > 0 && resultado.totalCusto === 0 && (
        <div style={{ marginTop: 8, fontSize: 11, color: C.danger }}>
          Alguns produtos não foram encontrados no catálogo. Configure os preços em Configurações → Orçamento SF ou adicione os produtos ao catálogo.
        </div>
      )}
    </div>
  );
}
