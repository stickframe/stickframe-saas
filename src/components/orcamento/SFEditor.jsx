//  STICK FRAME · Orçamento SF · Telas de Edição 
import React from 'react';
import { gerarId, fmtR, fmtN, calcProjeto, calcAmbiente } from '../../utils/sf-orcamento';
import { SFIc, SFBtn, SFBadge, SFModal, SFConfirmModal, SFEmptyState } from './SFui';

/*  Lista de Projetos  */
export function ViewProjetos({ state, dispatch, navigate }) {
  var [confirmId, setConfirmId] = React.useState(null);
  var [showModal, setShowModal] = React.useState(false);
  var [form, setForm] = React.useState({ nome:'', cliente:'' });

  function novoProj() {
    if(!form.nome.trim()) return;
    var p = { id:gerarId(), nome:form.nome.trim(), cliente:form.cliente.trim(),
      data: new Date().toLocaleDateString('pt-BR'), margem: 30, ambientes:[] };
    dispatch({ type:'ADD_PROJ', proj:p });
    setForm({ nome:'', cliente:'' });
    setShowModal(false);
    navigate('/orcamento-sf/' + p.id);
  }

  return (
    <div className="sf-orc-content">
      <div className="sf-orc-page-head">
        <div className="sf-orc-page-title">
          <div className="sf-orc-tick"></div>
          <div><h1>Orçamento SF</h1><p>Projetos de Steel Frame</p></div>
        </div>
        <div className="sf-orc-head-acts">
          <SFBtn v="primary" onClick={function(){ setShowModal(true); }}>
            <SFIc n="plus" />Novo projeto
          </SFBtn>
        </div>
      </div>

      {state.projetos.length === 0
        ? <SFEmptyState icon="doc" title="Nenhum projeto ainda"
            desc="Crie o primeiro projeto para começar a calcular materiais e gerar orçamentos."
            cta="Novo projeto" onCta={function(){ setShowModal(true); }} />
        : <div className="sf-orc-proj-grid">
            {state.projetos.map(function(p) {
              var r = calcProjeto(p, state.composicoes, state.precos, p.margem||30);
              var nAmb = (p.ambientes||[]).length;
              var nPain = (p.ambientes||[]).reduce(function(a,b){ return a + (b.paineis||[]).length; }, 0);
              return (
                <div className="sf-orc-proj-card" key={p.id} onClick={function(){ navigate('/orcamento-sf/' + p.id); }}>
                  <div className="sf-orc-pc-bar"></div>
                  <div className="sf-orc-pc-body">
                    <div className="sf-orc-pc-nm">{p.nome}</div>
                    <div className="sf-orc-pc-cl">{p.cliente || <span style={{color:'var(--line)'}}>—</span>}</div>
                    <div className="sf-orc-pc-meta">
                      <div className="sf-orc-pc-m"><span>Ambientes</span><b className="num">{nAmb}</b></div>
                      <div className="sf-orc-pc-m"><span>Painéis</span><b className="num">{nPain}</b></div>
                      <div className="sf-orc-pc-m"><span>Área total</span><b className="num">{fmtN(r.totalArea,1)} m²</b></div>
                    </div>
                  </div>
                  <div className="sf-orc-pc-ft">
                    <span className="sf-orc-pc-dt">{p.data}</span>
                    <div onClick={function(e){ e.stopPropagation(); }}>
                      <SFBtn className="sf-orc-btn sf-orc-btn-sm sf-orc-btn-danger sf-orc-pc-del" v="danger" sm onClick={function(){ setConfirmId(p.id); }}>
                        <SFIc n="trash" />
                      </SFBtn>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
      }

      {showModal && (
        <SFModal title="Novo projeto" onClose={function(){ setShowModal(false); }}
          footer={<>
            <SFBtn v="ghost" sm onClick={function(){ setShowModal(false); }}>Cancelar</SFBtn>
            <SFBtn v="primary" sm onClick={novoProj}><SFIc n="plus" />Criar projeto</SFBtn>
          </>}>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div className="sf-orc-field">
              <label>Nome do projeto *</label>
              <div className="sf-orc-input-w"><input autoFocus placeholder="Ex: Casa Silva — 120m²" value={form.nome} onChange={function(e){ setForm(function(f){ return {...f,nome:e.target.value}; }); }} /></div>
            </div>
            <div className="sf-orc-field">
              <label>Cliente</label>
              <div className="sf-orc-input-w"><input placeholder="Nome do cliente" value={form.cliente} onChange={function(e){ setForm(function(f){ return {...f,cliente:e.target.value}; }); }} /></div>
            </div>
          </div>
        </SFModal>
      )}
      {confirmId && (
        <SFConfirmModal msg="Excluir este projeto permanentemente? Todos os ambientes e painéis serão perdidos."
          onConfirm={function(){ dispatch({type:'DEL_PROJ',id:confirmId}); setConfirmId(null); }}
          onCancel={function(){ setConfirmId(null); }} />
      )}
    </div>
  );
}

/*  Detalhe do Projeto  */
export function ViewProjeto({ state, dispatch, projetoId, navigate }) {
  var proj = (state.projetos||[]).find(function(p){ return p.id === projetoId; });
  var [confirmId, setConfirmId] = React.useState(null);
  var [showModal, setShowModal] = React.useState(false);
  var [ambNome, setAmbNome] = React.useState('');
  var [editMargem, setEditMargem] = React.useState(false);
  var [margemVal, setMargemVal] = React.useState('');

  if(!proj) return <div className="sf-orc-content"><p style={{color:'var(--muted)'}}>Projeto não encontrado.</p></div>;

  var r = calcProjeto(proj, state.composicoes, state.precos, proj.margem||30);

  function novoAmb() {
    if(!ambNome.trim()) return;
    var a = { id:gerarId(), nome:ambNome.trim(), paineis:[] };
    dispatch({ type:'ADD_AMB', projetoId:projetoId, amb:a });
    setAmbNome(''); setShowModal(false);
  }

  function saveMargem() {
    var v = parseFloat(margemVal.replace(',','.'));
    if(isNaN(v) || v < 0 || v >= 100) return;
    dispatch({ type:'UPD_PROJ', projetoId:projetoId, upd:{ margem:v } });
    setEditMargem(false);
  }

  return (
    <div className="sf-orc-content">
      <div className="sf-orc-page-head">
        <div className="sf-orc-page-title">
          <div className="sf-orc-tick"></div>
          <div>
            <h1>{proj.nome}</h1>
            <p>{proj.cliente || 'Sem cliente'} · {(proj.ambientes||[]).length} ambiente(s) · {fmtN(r.totalArea,1)} m² total</p>
          </div>
        </div>
        <div className="sf-orc-head-acts">
          <SFBtn v="ghost" onClick={function(){ navigate('/orcamento-sf/' + projetoId + '/relatorio'); }}><SFIc n="doc" />Relatórios</SFBtn>
          <SFBtn v="ghost" onClick={function(){ navigate('/orcamento-sf'); }}><SFIc n="chevL" />Projetos</SFBtn>
          <SFBtn v="primary" onClick={function(){ setShowModal(true); }}><SFIc n="plus" />Novo ambiente</SFBtn>
        </div>
      </div>

      {/* Config rápida de margem */}
      <div className="sf-orc-card sf-orc-card-pad" style={{marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:28,flexWrap:'wrap'}}>
          <div><div style={{fontSize:11,fontWeight:800,letterSpacing:1.2,color:'var(--muted)',textTransform:'uppercase',marginBottom:4}}>Valor estimado</div>
            <div className="num" style={{fontSize:28,fontWeight:700,color:'var(--ink)'}}>{fmtR(r.totVenda)}</div></div>
          <div><div style={{fontSize:11,fontWeight:800,letterSpacing:1.2,color:'var(--muted)',textTransform:'uppercase',marginBottom:4}}>Custo</div>
            <div className="num" style={{fontSize:22,fontWeight:700,color:'var(--ink-2)'}}>{fmtR(r.totCusto)}</div></div>
          <div><div style={{fontSize:11,fontWeight:800,letterSpacing:1.2,color:'var(--muted)',textTransform:'uppercase',marginBottom:4}}>Margem</div>
            {editMargem
              ? <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <div className="sf-orc-input-w" style={{maxWidth:100}}><input type="number" autoFocus min="0" max="99" value={margemVal} onChange={function(e){ setMargemVal(e.target.value); }} /><span className="sf-orc-suf">%</span></div>
                  <SFBtn v="primary" sm onClick={saveMargem}>OK</SFBtn>
                  <SFBtn v="ghost" sm onClick={function(){ setEditMargem(false); }}></SFBtn>
                </div>
              : <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div className="num" style={{fontSize:22,fontWeight:700,color:'var(--pos)'}}>{fmtN(proj.margem||30,0)}%</div>
                  <SFBtn v="ghost" sm style={{padding:'4px 8px'}} onClick={function(){ setMargemVal(String(proj.margem||30)); setEditMargem(true); }}>
                    <SFIc n="edit" style={{width:13,height:13}} />
                  </SFBtn>
                </div>
            }
          </div>
        </div>
        <SFBtn v="ghost" sm onClick={function(){ navigate('/orcamento-sf/' + projetoId + '/relatorio'); }}><SFIc n="doc" />Ver relatórios</SFBtn>
      </div>

      {(proj.ambientes||[]).length === 0
        ? <SFEmptyState icon="home" title="Nenhum ambiente"
            desc="Adicione ambientes (sala, quarto, banheiro…) para começar a inserir painéis."
            cta="Novo ambiente" onCta={function(){ setShowModal(true); }} />
        : <div className="sf-orc-amb-list">
            {proj.ambientes.map(function(amb) {
              var compMap = {};
              state.composicoes.forEach(function(c){ compMap[c.id] = c; });
              var ra = calcAmbiente(amb, compMap);
              return (
                <div className="sf-orc-amb-row" key={amb.id} onClick={function(){ navigate('/orcamento-sf/' + projetoId + '/' + amb.id); }}>
                  <div className="sf-orc-amb-ic"><SFIc n="home" /></div>
                  <div style={{flex:1}}>
                    <div className="sf-orc-amb-nm">{amb.nome}</div>
                    <div className="sf-orc-amb-meta">{(amb.paineis||[]).length} painel(is)</div>
                  </div>
                  <div className="sf-orc-amb-area num">{fmtN(ra.area,2)} m²</div>
                  <div className="sf-orc-amb-del" onClick={function(e){ e.stopPropagation(); setConfirmId(amb.id); }}>
                    <SFBtn v="danger" sm style={{padding:'6px 8px'}}><SFIc n="trash" style={{width:13,height:13}} /></SFBtn>
                  </div>
                  <SFIc n="chevR" style={{width:16,height:16,color:'var(--muted)',flexShrink:0}} />
                </div>
              );
            })}
          </div>
      }

      {showModal && (
        <SFModal title="Novo ambiente" onClose={function(){ setShowModal(false); }}
          footer={<>
            <SFBtn v="ghost" sm onClick={function(){ setShowModal(false); }}>Cancelar</SFBtn>
            <SFBtn v="primary" sm onClick={novoAmb}><SFIc n="plus" />Criar</SFBtn>
          </>}>
          <div className="sf-orc-field">
            <label>Nome do ambiente *</label>
            <div className="sf-orc-input-w"><input autoFocus placeholder="Ex: Sala de Estar" value={ambNome} onChange={function(e){ setAmbNome(e.target.value); }} onKeyDown={function(e){ if(e.key==='Enter') novoAmb(); }} /></div>
          </div>
        </SFModal>
      )}
      {confirmId && (
        <SFConfirmModal msg="Excluir este ambiente e todos os seus painéis?"
          onConfirm={function(){ dispatch({type:'DEL_AMB',projetoId:projetoId,ambId:confirmId}); setConfirmId(null); }}
          onCancel={function(){ setConfirmId(null); }} />
      )}
    </div>
  );
}

/*  Ambiente + Editor de Painéis  */
export function ViewAmbiente({ state, dispatch, projetoId, ambienteId, navigate }) {
  var proj = (state.projetos||[]).find(function(p){ return p.id === projetoId; });
  var amb  = proj && (proj.ambientes||[]).find(function(a){ return a.id === ambienteId; });
  var [modal, setModal] = React.useState(null);
  var [confirmId, setConfirmId] = React.useState(null);

  if(!proj || !amb) return <div className="sf-orc-content"><p style={{color:'var(--muted)'}}>Ambiente não encontrado.</p></div>;

  var compMap = {};
  state.composicoes.forEach(function(c){ compMap[c.id] = c; });
  var ra = calcAmbiente(amb, compMap);

  function saveModal(painel) {
    if(painel.id) {
      dispatch({ type:'UPD_PAINEL', projetoId:projetoId, ambienteId:ambienteId, painel:painel });
    } else {
      dispatch({ type:'ADD_PAINEL', projetoId:projetoId, ambienteId:ambienteId, painel:{...painel, id:gerarId()} });
    }
    setModal(null);
  }

  return (
    <div className="sf-orc-content">
      <div className="sf-orc-page-head">
        <div className="sf-orc-page-title">
          <div className="sf-orc-tick"></div>
          <div>
            <h1>{amb.nome}</h1>
            <p>{proj.nome} · {(amb.paineis||[]).length} painel(is) · {fmtN(ra.area,2)} m²</p>
          </div>
        </div>
        <div className="sf-orc-head-acts">
          <SFBtn v="ghost" onClick={function(){ navigate('/orcamento-sf/' + projetoId); }}><SFIc n="chevL" />Voltar</SFBtn>
          <SFBtn v="primary" onClick={function(){ setModal({ nome:'', composicaoId: state.composicoes[0].id, largura:'', altura:'' }); }}>
            <SFIc n="plus" />Novo painel
          </SFBtn>
        </div>
      </div>

      {(amb.paineis||[]).length === 0
        ? <SFEmptyState icon="cube" title="Nenhum painel"
            desc="Adicione os painéis deste ambiente com suas dimensões e composição."
            cta="Novo painel" onCta={function(){ setModal({ nome:'', composicaoId: state.composicoes[0].id, largura:'', altura:'' }); }} />
        : <div className="sf-orc-card" style={{overflow:'hidden'}}>
            <table className="sf-orc-tbl">
              <thead>
                <tr>
                  <th>Painel</th>
                  <th>Composição</th>
                  <th>L (m)</th>
                  <th>A (m)</th>
                  <th>Área</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {amb.paineis.map(function(p) {
                  var area = (+p.largura||0) * (+p.altura||0);
                  return (
                    <tr key={p.id}>
                      <td className="sf-orc-td-nm">{p.nome || <span style={{color:'var(--muted)'}}>—</span>}</td>
                      <td><SFBadge compId={p.composicaoId} /></td>
                      <td className="sf-orc-td-num">{fmtN(+p.largura,2)}</td>
                      <td className="sf-orc-td-num">{fmtN(+p.altura,2)}</td>
                      <td className="sf-orc-td-num">{fmtN(area,2)} <span style={{fontSize:11,color:'var(--muted)'}}>m²</span></td>
                      <td className="sf-orc-td-acts">
                        <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                          <SFBtn v="ghost" sm onClick={function(){ setModal({...p}); }}><SFIc n="edit" /></SFBtn>
                          <SFBtn v="danger" sm onClick={function(){ setConfirmId(p.id); }}><SFIc n="trash" /></SFBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
      }

      {modal && (
        <PainelModal painel={modal} composicoes={state.composicoes}
          onSave={saveModal} onClose={function(){ setModal(null); }} />
      )}
      {confirmId && (
        <SFConfirmModal msg="Excluir este painel?"
          onConfirm={function(){ dispatch({type:'DEL_PAINEL',projetoId:projetoId,ambienteId:ambienteId,painelId:confirmId}); setConfirmId(null); }}
          onCancel={function(){ setConfirmId(null); }} />
      )}
    </div>
  );
}

/*  Modal de Painel  */
export function PainelModal({ painel, composicoes, onSave, onClose }) {
  var [form, setForm] = React.useState(painel);
  function upd(k, v){ setForm(function(f){ return {...f, [k]:v}; }); }
  var comp = composicoes.find(function(c){ return c.id === form.composicaoId; });
  var area = (+form.largura||0) * (+form.altura||0);

  return (
    <SFModal title={form.id ? 'Editar painel' : 'Novo painel'} onClose={onClose}
      footer={<>
        <SFBtn v="ghost" sm onClick={onClose}>Cancelar</SFBtn>
        <SFBtn v="primary" sm onClick={function(){ onSave(form); }}>
          <SFIc n="check" />{form.id ? 'Salvar' : 'Adicionar'}
        </SFBtn>
      </>}>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="sf-orc-field">
          <label>Nome do painel</label>
          <div className="sf-orc-input-w"><input autoFocus placeholder="Ex: Parede Norte" value={form.nome||''} onChange={function(e){ upd('nome',e.target.value); }} /></div>
        </div>
        <div className="sf-orc-field">
          <label>Composição</label>
          <div className="sf-orc-input-w">
            <select value={form.composicaoId} onChange={function(e){ upd('composicaoId',e.target.value); }} style={{padding:'10px 14px'}}>
              {composicoes.map(function(c){ return <option key={c.id} value={c.id}>{c.nome}</option>; })}
            </select>
          </div>
        </div>
        <div className="sf-orc-frow">
          <div className="sf-orc-field">
            <label>Largura (m)</label>
            <div className="sf-orc-input-w"><input type="number" min="0.1" step="0.01" placeholder="3,50" value={form.largura||''} onChange={function(e){ upd('largura',e.target.value); }} /><span className="sf-orc-suf">m</span></div>
          </div>
          <div className="sf-orc-field">
            <label>Altura (m)</label>
            <div className="sf-orc-input-w"><input type="number" min="0.1" step="0.01" placeholder="2,80" value={form.altura||''} onChange={function(e){ upd('altura',e.target.value); }} /><span className="sf-orc-suf">m</span></div>
          </div>
        </div>
        {area > 0 && comp && (
          <div style={{background:'var(--surface-2)',border:'1px solid var(--line-2)',borderRadius:10,padding:'12px 14px',fontSize:13,color:'var(--ink-2)'}}>
            <span style={{fontWeight:700,color:'var(--ink)'}}>{fmtN(area,2)} m²</span> · {comp.nome} · espaçamento {comp.esp}mm
          </div>
        )}
      </div>
    </SFModal>
  );
}
