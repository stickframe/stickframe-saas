// ── STICK FRAME · Orçamento SF · Relatórios ─────────────────────────────
import React from 'react';
import { calcProjeto, fmtR, fmtN, SF_CATS, SF_LABELS, SF_UNIDADES } from '../../utils/sf-orcamento';
import { SFIc, SFBtn } from './SFui';

export function ViewRelatorio({ state, projetoId, navigate }) {
  var proj = (state.projetos||[]).find(function(p){ return p.id === projetoId; });
  var [tab, setTab] = React.useState('compras');

  if(!proj) return <div className="sf-orc-content"><p style={{color:'var(--muted)'}}>Projeto não encontrado.</p></div>;

  var margem = proj.margem || 30;
  var r = calcProjeto(proj, state.composicoes, state.precos, margem);
  var margemPct = r.totCusto > 0 ? ((r.totVenda - r.totCusto) / r.totVenda * 100) : 0;
  var TABS = [
    { id:'compras',   label:'Lista de Compras' },
    { id:'ambiente',  label:'Por Ambiente' },
    { id:'proposta',  label:'Proposta Cliente' },
    { id:'custo',     label:'Custo Interno' },
  ];

  return (
    <div className="sf-orc-content">
      <div className="sf-orc-page-head">
        <div className="sf-orc-page-title">
          <div className="sf-orc-tick"></div>
          <div><h1>Relatórios</h1><p>{proj.nome} · {proj.cliente}</p></div>
        </div>
        <div className="sf-orc-head-acts no-print">
          <SFBtn v="ghost" onClick={function(){ navigate('/orcamento-sf/' + projetoId); }}><SFIc n="chevL" />Voltar</SFBtn>
          <SFBtn v="primary" onClick={function(){ window.print(); }}><SFIc n="print" />Imprimir / PDF</SFBtn>
        </div>
      </div>

      <div className="sf-orc-rel-tabs no-print">
        {TABS.map(function(t){
          return <button key={t.id} className={'sf-orc-rel-tab' + (tab === t.id ? ' on' : '')} onClick={function(){ setTab(t.id); }}>{t.label}</button>;
        })}
      </div>

      {tab === 'compras'  && <TabCompras r={r} precos={state.precos} />}
      {tab === 'ambiente' && <TabAmbiente r={r} precos={state.precos} />}
      {tab === 'proposta' && <TabProposta proj={proj} r={r} />}
      {tab === 'custo'    && <TabCusto r={r} precos={state.precos} margem={margem} margemPct={margemPct} />}
    </div>
  );
}

/* ── 1 · Lista de Compras ── */
function TabCompras({ r, precos }) {
  var cats = Object.keys(SF_CATS);
  var total = 0;
  return (
    <div>
      <div className="sf-orc-rel-total" style={{marginBottom:20}}>
        <div><div className="sf-orc-rt-lbl">Total de materiais</div><div className="sf-orc-rt-val">{fmtN(r.totalArea,1)} m²</div></div>
        <div><div className="sf-orc-rt-lbl">Para cotação</div><div style={{fontSize:12,color:'#9a948a',marginTop:6,lineHeight:1.5}}>Adicione os preços do<br/>fornecedor para totalizar</div></div>
      </div>
      {cats.map(function(cat) {
        var itens = SF_CATS[cat].filter(function(k){ return (r.totalMats[k]||0) > 0; });
        if(!itens.length) return null;
        return (
          <div className="sf-orc-card" key={cat} style={{marginBottom:12,overflow:'hidden'}}>
            <div style={{padding:'12px 16px 10px',background:'var(--surface-2)',borderBottom:'1px solid var(--line-2)',fontSize:11,fontWeight:800,letterSpacing:1.2,color:'var(--muted)',textTransform:'uppercase'}}>{cat}</div>
            <table className="sf-orc-tbl">
              <thead>
                <tr><th>Material</th><th style={{textAlign:'right'}}>Qtd</th><th style={{textAlign:'right'}}>Unidade</th><th style={{textAlign:'right'}}>Preço ref.</th><th style={{textAlign:'right'}}>Subtotal ref.</th></tr>
              </thead>
              <tbody>
                {itens.map(function(k) {
                  var q = r.totalMats[k]||0;
                  var p = precos[k]||0;
                  var sub = q * p;
                  total += sub;
                  return (
                    <tr key={k}>
                      <td className="sf-orc-td-nm" style={{fontWeight:500,color:'var(--ink-2)'}}>{SF_LABELS[k]}</td>
                      <td className="sf-orc-td-num" style={{textAlign:'right'}}>{fmtN(q,0)}</td>
                      <td style={{textAlign:'right',color:'var(--muted)',fontSize:12}}>{SF_UNIDADES[k]}</td>
                      <td style={{textAlign:'right',color:'var(--muted)',fontSize:12}}>{fmtR(p)}</td>
                      <td className="sf-orc-td-num" style={{textAlign:'right'}}>{fmtR(sub)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
      <div style={{textAlign:'right',padding:'12px 4px',fontSize:13,color:'var(--muted)'}}>
        Total de referência (materiais + M.O.): <strong style={{color:'var(--ink)',fontFamily:'var(--sf-cond)',fontSize:18}}>{fmtR(r.totCusto)}</strong>
      </div>
    </div>
  );
}

/* ── 2 · Por Ambiente ── */
function TabAmbiente({ r, precos }) {
  return (
    <div>
      {r.porAmbiente.length === 0 && (
        <div style={{color:'var(--muted)',fontSize:14,padding:32,textAlign:'center'}}>Nenhum ambiente com painéis calculados.</div>
      )}
      {r.porAmbiente.map(function(a) {
        return (
          <div className="sf-orc-card" key={a.id} style={{marginBottom:14,overflow:'hidden'}}>
            <div style={{padding:'16px 20px 14px',background:'var(--graphite)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{fontFamily:'var(--sf-cond)',fontWeight:700,fontSize:22,color:'#fff'}}>{a.nome}</div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:1.4,color:'#9a948a',textTransform:'uppercase'}}>Área</div>
                <div style={{fontFamily:'var(--sf-cond)',fontWeight:700,fontSize:20,color:'#fff'}}>{fmtN(a.area,2)} m²</div>
              </div>
            </div>
            <table className="sf-orc-tbl">
              <thead><tr><th>Material</th><th style={{textAlign:'right'}}>Qtd</th><th style={{textAlign:'right'}}>Un.</th><th style={{textAlign:'right'}}>Subtotal</th></tr></thead>
              <tbody>
                {Object.keys(a.mats).filter(function(k){ return (a.mats[k]||0) > 0; }).map(function(k) {
                  return (
                    <tr key={k}>
                      <td style={{color:'var(--ink-2)',fontSize:13}}>{SF_LABELS[k]}</td>
                      <td className="sf-orc-td-num" style={{textAlign:'right'}}>{fmtN(a.mats[k],0)}</td>
                      <td style={{textAlign:'right',color:'var(--muted)',fontSize:12}}>{SF_UNIDADES[k]}</td>
                      <td className="sf-orc-td-num" style={{textAlign:'right'}}>{fmtR((a.mats[k]||0)*(precos[k]||0))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{padding:'12px 20px',borderTop:'1px solid var(--line-2)',display:'flex',justifyContent:'space-between',fontSize:13}}>
              <span style={{color:'var(--muted)'}}>Custo estimado</span>
              <span style={{fontFamily:'var(--sf-cond)',fontWeight:700,fontSize:16,color:'var(--ink)'}}>{fmtR(a.custo)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── 3 · Proposta do Cliente ── */
function TabProposta({ proj, r }) {
  var hoje = new Date();
  var validade = new Date(hoje.getTime() + 30*24*3600*1000);
  function dtFmt(d){ return d.toLocaleDateString('pt-BR'); }

  return (
    <div style={{maxWidth:740}}>
      <div className="sf-orc-prop-head">
        <div className="sf-orc-eyebrow">Proposta Comercial</div>
        <h2>{proj.nome}</h2>
        <div style={{marginTop:14,display:'flex',gap:24,flexWrap:'wrap'}}>
          <div><div style={{fontSize:10.5,color:'#9a948a',fontWeight:600}}>CLIENTE</div><div style={{fontSize:14,color:'#fff',fontWeight:700,marginTop:2}}>{proj.cliente||'—'}</div></div>
          <div><div style={{fontSize:10.5,color:'#9a948a',fontWeight:600}}>DATA</div><div style={{fontSize:14,color:'#fff',fontWeight:700,marginTop:2}}>{dtFmt(hoje)}</div></div>
          <div><div style={{fontSize:10.5,color:'#9a948a',fontWeight:600}}>VALIDADE</div><div style={{fontSize:14,color:'#fff',fontWeight:700,marginTop:2}}>{dtFmt(validade)}</div></div>
        </div>
      </div>
      <div className="sf-orc-prop-body">
        <div style={{marginBottom:20}}>
          <div className="sf-orc-rel-sec" style={{marginBottom:0}}>
            <h4>Descrição dos serviços por ambiente</h4>
            {r.porAmbiente.map(function(a) {
              return (
                <div className="sf-orc-prop-amb" key={a.id}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                    <h5>{a.nome}</h5>
                    <span style={{fontFamily:'var(--sf-cond)',fontWeight:700,fontSize:16,color:'var(--ink)'}}>{fmtR(a.venda)}</span>
                  </div>
                  <p>Fornecimento e instalação de sistema Steel Frame — {fmtN(a.area,2)} m² de painéis, materiais e mão de obra conforme projeto.</p>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{background:'var(--brick-soft)',border:'1px solid #e0b8b5',borderRadius:12,padding:'18px 22px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:11,fontWeight:800,letterSpacing:1.3,color:'var(--brick)',textTransform:'uppercase',marginBottom:4}}>Valor total da proposta</div>
            <div style={{fontFamily:'var(--sf-cond)',fontWeight:700,fontSize:36,color:'var(--brick)'}}>{fmtR(r.totVenda)}</div>
            <div style={{fontSize:12.5,color:'var(--ink-2)',marginTop:4}}>{fmtN(r.totalArea,1)} m² · válido até {dtFmt(validade)}</div>
          </div>
        </div>
        <p style={{fontSize:11.5,color:'var(--muted)',marginTop:16,lineHeight:1.6}}>
          Esta proposta não inclui fundação, terraplanagem e infraestrutura de acesso. Valores sujeitos a confirmação após vistoria técnica do terreno.
        </p>
      </div>
    </div>
  );
}

/* ── 4 · Custo Interno ── */
function TabCusto({ r, precos, margem, margemPct }) {
  var margem_min = 20;
  var low = margemPct < margem_min;
  return (
    <div style={{maxWidth:640}}>
      {low && (
        <div className={'sf-orc-alert sf-orc-alert-' + (margemPct < 10 ? 'neg' : 'warn')}>
          <SFIc n="warn" />
          Margem atual de {fmtN(margemPct,1)}% está abaixo do mínimo recomendado de {margem_min}%.
        </div>
      )}

      <div className="sf-orc-card sf-orc-card-pad" style={{marginBottom:16}}>
        <div className="sf-orc-rel-sec">
          <h4>Composição do custo</h4>
          <div className="sf-orc-kv-row"><span className="sf-orc-kv-k">Material</span><span className="sf-orc-kv-v num">{fmtR(r.totCMat)}</span></div>
          <div className="sf-orc-kv-row"><span className="sf-orc-kv-k">Mão de obra ({fmtN(r.totalArea,1)} m²)</span><span className="sf-orc-kv-v num">{fmtR(r.totCMO)}</span></div>
          <div className="sf-orc-kv-row" style={{fontWeight:700}}><span className="sf-orc-kv-k" style={{color:'var(--ink)',fontWeight:700}}>Custo total</span><span className="sf-orc-kv-v num">{fmtR(r.totCusto)}</span></div>
        </div>
        <div className="sf-orc-rel-sec" style={{marginBottom:0}}>
          <h4>Precificação</h4>
          <div className="sf-orc-kv-row"><span className="sf-orc-kv-k">Margem aplicada</span><span className="sf-orc-kv-v num" style={{color: low ? 'var(--neg)' : 'var(--pos)'}}>{fmtN(margem,1)}%</span></div>
          <div className="sf-orc-kv-row"><span className="sf-orc-kv-k">Valor de venda</span><span className="sf-orc-kv-v num">{fmtR(r.totVenda)}</span></div>
          <div className="sf-orc-kv-row"><span className="sf-orc-kv-k">Resultado (margem sobre venda)</span>
            <span>
              <span className="sf-orc-kv-v num" style={{color: low ? 'var(--neg)' : 'var(--pos)'}}>{fmtN(margemPct,1)}%</span>
              <span style={{fontSize:11.5,color:'var(--muted)',marginLeft:8}}>{fmtR(r.totVenda - r.totCusto)}</span>
            </span>
          </div>
          <div className="sf-orc-margem-bar" style={{marginTop:10}}>
            <i style={{width: Math.min(100, margemPct) + '%', background: low ? 'var(--neg)' : margemPct < margem_min * 1.4 ? 'var(--warn)' : 'var(--pos)'}}></i>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--muted)',marginTop:4}}>
            <span>0%</span><span>Mínimo {margem_min}%</span><span>50%</span>
          </div>
        </div>
      </div>

      <div className="sf-orc-card sf-orc-card-pad">
        <div className="sf-orc-rel-sec">
          <h4>Por ambiente</h4>
          {r.porAmbiente.map(function(a) {
            var mpct = a.custo > 0 ? ((a.venda - a.custo) / a.venda * 100) : 0;
            return (
              <div className="sf-orc-kv-row" key={a.id}>
                <div>
                  <div className="sf-orc-kv-k">{a.nome}</div>
                  <div className="sf-orc-kv-sub">{fmtN(a.area,2)} m² · custo {fmtR(a.custo)}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className="sf-orc-kv-v num">{fmtR(a.venda)}</div>
                  <div style={{fontSize:11,color: mpct < margem_min ? 'var(--neg)' : 'var(--pos)',fontWeight:700}}>{fmtN(mpct,1)}% margem</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
