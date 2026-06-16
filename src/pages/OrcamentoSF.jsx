// ── STICK FRAME · Orçamento SF · Página Principal ───────────────────────
import React, { useReducer, useEffect, useRef, useState } from 'react';
import { sb, getEmpresaId } from '../services/supabase';
import { SF_COMP, SF_PRECOS } from '../utils/sf-orcamento';
import { ViewProjetos, ViewProjeto, ViewAmbiente } from '../components/orcamento/SFEditor';
import { ViewRelatorio } from '../components/orcamento/SFRelatorio';
import '../styles/sf-orcamento.css';

// ── Estado inicial ──────────────────────────────────────────────────────
var INITIAL_STATE = {
  projetos: [],
  composicoes: SF_COMP,
  precos: { ...SF_PRECOS },
};

// ── Reducer ─────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch(action.type) {

    case 'LOAD':
      return { ...state, projetos: action.projetos || [] };

    case 'ADD_PROJ':
      return { ...state, projetos: [...state.projetos, action.proj] };

    case 'DEL_PROJ':
      return { ...state, projetos: state.projetos.filter(function(p){ return p.id !== action.id; }) };

    case 'UPD_PROJ':
      return { ...state, projetos: state.projetos.map(function(p){
        if(p.id !== action.projetoId) return p;
        return { ...p, ...action.upd };
      }) };

    case 'ADD_AMB':
      return { ...state, projetos: state.projetos.map(function(p){
        if(p.id !== action.projetoId) return p;
        return { ...p, ambientes: [...(p.ambientes||[]), action.amb] };
      }) };

    case 'DEL_AMB':
      return { ...state, projetos: state.projetos.map(function(p){
        if(p.id !== action.projetoId) return p;
        return { ...p, ambientes: (p.ambientes||[]).filter(function(a){ return a.id !== action.ambId; }) };
      }) };

    case 'ADD_PAINEL':
      return { ...state, projetos: state.projetos.map(function(p){
        if(p.id !== action.projetoId) return p;
        return { ...p, ambientes: (p.ambientes||[]).map(function(a){
          if(a.id !== action.ambienteId) return a;
          return { ...a, paineis: [...(a.paineis||[]), action.painel] };
        }) };
      }) };

    case 'UPD_PAINEL':
      return { ...state, projetos: state.projetos.map(function(p){
        if(p.id !== action.projetoId) return p;
        return { ...p, ambientes: (p.ambientes||[]).map(function(a){
          if(a.id !== action.ambienteId) return a;
          return { ...a, paineis: (a.paineis||[]).map(function(pan){
            return pan.id === action.painel.id ? action.painel : pan;
          }) };
        }) };
      }) };

    case 'DEL_PAINEL':
      return { ...state, projetos: state.projetos.map(function(p){
        if(p.id !== action.projetoId) return p;
        return { ...p, ambientes: (p.ambientes||[]).map(function(a){
          if(a.id !== action.ambienteId) return a;
          return { ...a, paineis: (a.paineis||[]).filter(function(pan){ return pan.id !== action.painelId; }) };
        }) };
      }) };

    case 'UPD_PRECOS':
      return { ...state, precos: { ...state.precos, ...action.precos } };

    default:
      return state;
  }
}

// ── Parse de rota interna ────────────────────────────────────────────────
// Rota esperada: /orcamento-sf, /orcamento-sf/:id, /orcamento-sf/:id/:ambId, /orcamento-sf/:id/relatorio
function parseRota(path) {
  var stripped = (path || '').replace(/^\/(orcamento[_-]sf)\/?/, '');
  if(stripped === path) return { view: 'projetos' };
  var parts = stripped.split('/').filter(Boolean);
  if(!parts.length) return { view: 'projetos' };
  var projetoId = parts[0];
  if(!parts[1]) return { view: 'projeto', projetoId };
  if(parts[1] === 'relatorio') return { view: 'relatorio', projetoId };
  return { view: 'ambiente', projetoId, ambienteId: parts[1] };
}

// ── Componente principal ─────────────────────────────────────────────────
export default function OrcamentoSF() {
  var [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  var [rota, setRota] = useState(function(){
    return parseRota(window.location.pathname);
  });
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var saveTimer = useRef(null);
  var recordId = useRef(null);
  var latestProjetos = useRef(state.projetos);
  var isDirty = useRef(false);

  // Navegação interna
  function navigate(path) {
    window.history.pushState(null, '', path);
    setRota(parseRota(path));
  }

  // Escuta popstate (botão voltar do browser)
  useEffect(function(){
    function onPop() {
      setRota(parseRota(window.location.pathname));
    }
    window.addEventListener('popstate', onPop);
    return function(){ window.removeEventListener('popstate', onPop); };
  }, []);

  // Carrega dados do Supabase na montagem
  useEffect(function(){
    var empId = getEmpresaId();
    if(!empId) { setLoading(false); return; }
    sb.from('sf_orcamentos')
      .select('*')
      .eq('empresa_id', empId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .then(function(res){
        if(res.data && res.data.length > 0) {
          var row = res.data[0];
          recordId.current = row.id;
          var data = row.data || { projetos: [] };
          dispatch({ type:'LOAD', projetos: data.projetos || [] });
        }
        setLoading(false);
      })
      .catch(function(){
        setLoading(false);
      });
  }, []);

  // Mantém ref sempre atualizada para poder salvar no unmount
  useEffect(function(){
    latestProjetos.current = state.projetos;
  }, [state.projetos]);

  // Função de save reutilizável
  function doSave(projetos) {
    var empId = getEmpresaId();
    if(!empId) return;
    var payload = { empresa_id: empId, data: { projetos: projetos }, updated_at: new Date().toISOString() };
    var promise;
    if(recordId.current) {
      promise = sb.from('sf_orcamentos').update(payload).eq('id', recordId.current);
    } else {
      promise = sb.from('sf_orcamentos').insert(payload).select().single();
    }
    return promise.then(function(res){
      if(!recordId.current && res.data) recordId.current = res.data.id;
    });
  }

  // Auto-salva com debounce enquanto o componente está montado
  useEffect(function(){
    if(loading) return;
    isDirty.current = true;
    if(saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = setTimeout(function(){
      doSave(latestProjetos.current).finally(function(){ setSaving(false); });
      isDirty.current = false;
    }, 800);
    // NÃO cancela o timer no cleanup — o save deve acontecer mesmo após navegar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.projetos, loading]);

  // Flush imediato ao desmontar se ainda houver save pendente
  useEffect(function(){
    return function(){
      if(isDirty.current && saveTimer.current) {
        clearTimeout(saveTimer.current);
        doSave(latestProjetos.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if(loading) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:'var(--muted)',fontSize:14}}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{position:'relative'}}>
      {saving && (
        <div style={{position:'fixed',top:12,right:20,fontSize:11,color:'var(--muted)',zIndex:50,background:'var(--surface)',border:'1px solid var(--line)',borderRadius:6,padding:'4px 10px'}}>
          Salvando…
        </div>
      )}

      {rota.view === 'projetos' && (
        <ViewProjetos state={state} dispatch={dispatch} navigate={navigate} />
      )}
      {rota.view === 'projeto' && (
        <ViewProjeto state={state} dispatch={dispatch} projetoId={rota.projetoId} navigate={navigate} />
      )}
      {rota.view === 'ambiente' && (
        <ViewAmbiente state={state} dispatch={dispatch} projetoId={rota.projetoId} ambienteId={rota.ambienteId} navigate={navigate} />
      )}
      {rota.view === 'relatorio' && (
        <ViewRelatorio state={state} projetoId={rota.projetoId} navigate={navigate} />
      )}
    </div>
  );
}
