import { useState, useEffect, useRef } from 'react';
import { sb } from '../services/supabase';
import { useModuleLoad } from '../hooks/useModuleLoad';
import useAppStore from '../store/useAppStore';

function Ic({ n, w = 15, c = 'currentColor' }) {
  const P = {
    phone:    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 5.61 5.61l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>,
    mail:     <g><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></g>,
    target:   <g><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3"/></g>,
    download: <g><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></g>,
    trash:    <g><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></g>,
    map:      <g><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></g>,
    x:        <g><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></g>,
    check:    <path d="M20 6 9 17l-5-5"/>,
    user:     <g><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></g>,
    arrow:    <g><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></g>,
    note:     <g><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></g>,
    clock:    <g><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></g>,
    wa:       <path fill="currentColor" stroke="none" d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.038z"/>,
  };
  const isFilled = n === 'wa';
  return (
    <svg viewBox="0 0 24 24" fill={isFilled ? 'currentColor' : 'none'} stroke={isFilled ? 'none' : c}
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: w, height: w, flexShrink: 0, color: c }}>
      {P[n]}
    </svg>
  );
}

function fmtData(ts) {
  if (!ts) return '—';
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return 'ontem';
  return `há ${Math.floor(diff / 86400)} dias`;
}

function fmtTel(t) {
  if (!t) return '';
  const n = t.replace(/\D/g, '');
  const d = n.startsWith('55') ? n.slice(2) : n;
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return t;
}

const ORIGENS = {
  calculadora: { label: 'Calculadora', cls: 'og-calc' },
  Calculadora: { label: 'Calculadora', cls: 'og-calc' },
  landing:     { label: 'Landing',     cls: 'og-land' },
  'google-ads':{ label: 'Google Ads',  cls: 'og-google' },
  webhook:     { label: 'Webhook',     cls: 'og-webhook' },
  manual:      { label: 'Manual',      cls: 'og-webhook' },
};

const STATUS_OPT = ['novo', 'contatado', 'qualificado', 'proposta', 'ganho', 'perdido'];
const STATUS_LBL = { novo: 'Novo contato', contatado: 'Contatado', qualificado: 'Qualificado', proposta: 'Proposta', ganho: 'Ganho', perdido: 'Perdido' };
const STATUS_CLS = { novo: 'st-novo', contatado: 'st-contatado', qualificado: 'st-qualificado', proposta: 'st-proposta', ganho: 'st-ganho', perdido: 'st-perdido' };

const FUNNEL_STEPS = [
  { k: 'novo',        t: 'Lead recebido',     s: 'Contato chegou via formulário' },
  { k: 'contatado',   t: 'Contato feito',     s: 'Primeiro retorno ao cliente' },
  { k: 'qualificado', t: 'Qualificado',       s: 'Tem terreno, verba e intenção' },
  { k: 'proposta',    t: 'Proposta enviada',  s: 'Orçamento Steel Frame enviado' },
  { k: 'ganho',       t: 'Negócio fechado',   s: 'Vira cliente e obra' },
];

const WEBHOOK_URL = 'https://gpzmglcxmbboxxogbibq.supabase.co/functions/v1/receber-lead';

// ── Drawer (painel lateral de detalhe) ───────────────────────────────────────
function LeadDrawer({ lead, onClose, onStatus, onConvert, converting, notes, onNote }) {
  const og = ORIGENS[lead.origem] || ORIGENS.webhook;
  const stepIdx = STATUS_OPT.indexOf(lead.status);
  const isGanho = lead.status === 'ganho';
  const tel = (lead.telefone || '').replace(/\D/g, '');
  const waNum = tel.startsWith('55') ? tel : `55${tel}`;

  return (
    <>
      <div className="opp-scrim" onClick={onClose} />
      <aside className="opp-drawer">
        <div className="dr-head">
          <button className="dr-close" onClick={onClose}><Ic n="x" w={15} /></button>
          <div style={{ display: 'flex', gap: 8, marginBottom: 9, flexWrap: 'wrap' }}>
            <span className={`origem-badge ${og.cls}`}>{og.label}</span>
            {isGanho
              ? <span className="conv-tag"><Ic n="check" w={11} c="#3f7a4b" />CLIENTE</span>
              : lead.status === 'novo' && <span className="badge-novo"><span className="nd" />NOVO</span>}
          </div>
          <div className="dr-name">{lead.nome}</div>
        </div>

        <div className="dr-body">
          {/* Contato */}
          <div className="dr-sec">Contato</div>
          <div className="dr-field">
            <Ic n="phone" w={14} c="var(--muted)" />
            <span className="dr-val">{fmtTel(lead.telefone)}</span>
            <a className="btn-wa-sm" href={`https://wa.me/${waNum}`} target="_blank" rel="noopener noreferrer">
              <Ic n="wa" w={12} c="#fff" />WhatsApp
            </a>
          </div>
          {lead.email && (
            <div className="dr-field">
              <Ic n="mail" w={14} c="var(--muted)" />
              <span className="dr-val">{lead.email}</span>
            </div>
          )}
          {lead.cidade && (
            <div className="dr-field">
              <Ic n="map" w={14} c="var(--muted)" />
              <span className="dr-val">{lead.cidade}</span>
            </div>
          )}

          {/* Projeto */}
          {(lead.area || lead.padrao) && (
            <>
              <div className="dr-sec">Projeto</div>
              <div className="dr-field">
                <span className="dr-val">
                  {lead.area && `${lead.area} m²`}{lead.padrao && ` · ${lead.padrao}`}
                  {(lead.valor_min || lead.valor_max) && (
                    <span style={{ color: 'var(--muted)', marginLeft: 8 }}>
                      R$ {Math.round(lead.valor_min || 0).toLocaleString('pt-BR')}–{Math.round(lead.valor_max || 0).toLocaleString('pt-BR')}
                    </span>
                  )}
                </span>
              </div>
            </>
          )}

          {/* Status */}
          <div className="dr-sec">Status</div>
          <select
            className={`status-sel ${STATUS_CLS[lead.status] || 'st-novo'}`}
            style={{ width: '100%', padding: '10px 12px', fontSize: 13 }}
            value={lead.status}
            onChange={e => onStatus(lead.id, e.target.value)}>
            {STATUS_OPT.map(s => <option key={s} value={s}>{STATUS_LBL[s]}</option>)}
          </select>

          {/* Linha do tempo do funil */}
          <div className="dr-sec">Linha do tempo</div>
          <div className="tl">
            {FUNNEL_STEPS.map((st, i) => {
              const done = i <= stepIdx && lead.status !== 'perdido';
              return (
                <div key={st.k} className="tl-item">
                  <div className={`tl-dot${done ? ' tl-dot-on' : ''}`} />
                  <div className="tl-t">{st.t}</div>
                  <div className="tl-s">
                    {i === 0 ? `${fmtData(lead.created_at)} · via ${og.label}` : st.s}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Anotações */}
          <div className="dr-sec">Anotações</div>
          <textarea
            className="dr-notes"
            placeholder="Ex: cliente quer sobrado de 180m² em Santo André, terreno já comprado…"
            value={notes || ''}
            onChange={e => onNote(lead.id, e.target.value)}
          />
        </div>

        <div className="dr-foot">
          {isGanho ? (
            <button className="btn-convert btn-convert-done" disabled>
              <Ic n="check" w={16} c="#fff" /> Convertido em cliente
            </button>
          ) : (
            <button className="btn-convert" onClick={() => onConvert(lead)} disabled={converting}>
              <Ic n="user" w={16} c="#fff" />
              {converting ? 'Convertendo…' : 'Converter em cliente'}
              <Ic n="arrow" w={15} c="#fff" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

// ── Card do lead ─────────────────────────────────────────────────────────────
function LeadCard({ lead, onStatus, onDelete, onOpen, isNew }) {
  const og = ORIGENS[lead.origem] || ORIGENS.webhook;
  const tel = (lead.telefone || '').replace(/\D/g, '');
  const waNum = tel.startsWith('55') ? tel : `55${tel}`;
  return (
    <div className={`sf-lead-card${isNew ? ' sf-lead-new' : ''}`} onClick={() => onOpen(lead)} style={{ cursor: 'pointer' }}>
      <div className="lc-top">
        <div>
          <div className="lc-name">{lead.nome}</div>
          <div className="lc-time">{fmtData(lead.created_at)}</div>
        </div>
        {lead.status === 'novo' && <span className="badge-novo"><span className="nd" />NOVO</span>}
        {lead.status === 'ganho' && <span className="conv-tag" style={{ fontSize: 10, padding: '3px 8px' }}><Ic n="check" w={10} c="#3f7a4b" />CLIENTE</span>}
      </div>
      <div className="lc-row"><Ic n="phone" w={13} c="var(--muted)" />{fmtTel(lead.telefone)}</div>
      {lead.email && <div className="lc-row"><Ic n="mail" w={13} c="var(--muted)" />{lead.email}</div>}
      <div className="lc-foot" onClick={e => e.stopPropagation()}>
        <span className={`origem-badge ${og.cls}`}>{og.label}</span>
        <select
          className={`status-sel ${STATUS_CLS[lead.status] || 'st-novo'}`}
          value={lead.status || 'novo'}
          onChange={e => onStatus(lead.id, e.target.value)}>
          {STATUS_OPT.map(s => <option key={s} value={s}>{STATUS_LBL[s]}</option>)}
        </select>
        <a className="btn-wa" href={`https://wa.me/${waNum}`} target="_blank" rel="noopener noreferrer">
          <Ic n="wa" w={14} c="#fff" />WhatsApp
        </a>
        <button className="btn-del" onClick={() => onDelete(lead.id)} title="Excluir">
          <Ic n="trash" w={13} c="#a33327" />
        </button>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Oportunidades() {
  useModuleLoad('oportunidades');
  const setActivePage = useAppStore(s => s.setActivePage);

  const [leads, setLeads]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [novoIds, setNovoIds]     = useState(new Set());
  const [fOrigem, setFO]          = useState('todos');
  const [fStatus, setFS]          = useState('todos');
  const [busca, setBusca]         = useState('');
  const [confirm, setConfirm]     = useState(null);
  const [copied, setCopied]       = useState(false);
  const [sel, setSel]             = useState(null);       // lead aberto no drawer
  const [notes, setNotes]         = useState({});          // { [leadId]: string }
  const [converting, setConverting] = useState(false);
  const [toast, setToast]         = useState(null);
  const channelRef                = useRef(null);

  async function carregar() {
    setLoading(true);
    const { data } = await sb
      .from('leads_captacao')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    setLeads(data || []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
    channelRef.current = sb
      .channel('leads_captacao_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads_captacao' }, payload => {
        const nl = payload.new;
        setLeads(prev => [nl, ...prev]);
        setNovoIds(prev => new Set([...prev, nl.id]));
        setTimeout(() => setNovoIds(prev => { const s = new Set(prev); s.delete(nl.id); return s; }), 5000);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads_captacao' }, payload => {
        setLeads(prev => prev.map(l => l.id === payload.new.id ? payload.new : l));
        setSel(s => s?.id === payload.new.id ? { ...s, ...payload.new } : s);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'leads_captacao' }, payload => {
        setLeads(prev => prev.filter(l => l.id !== payload.old.id));
        setSel(s => s?.id === payload.old.id ? null : s);
      })
      .subscribe();
    return () => { if (channelRef.current) sb.removeChannel(channelRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStatus(id, status) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    setSel(s => s?.id === id ? { ...s, status } : s);
    await sb.from('leads_captacao').update({ status }).eq('id', id);
  }

  async function deletar(id) {
    await sb.from('leads_captacao').delete().eq('id', id);
    setConfirm(null);
  }

  async function converterEmCliente(lead) {
    setConverting(true);
    try {
      const { data, error } = await sb
        .from('clientes')
        .insert({
          nome: lead.nome,
          telefone: lead.telefone,
          email: lead.email,
          origem: lead.origem || 'lead',
          lead_id: lead.id,
        })
        .select('id')
        .single();

      if (error) throw error;

      await sb
        .from('leads_captacao')
        .update({ status: 'ganho', cliente_id: data.id })
        .eq('id', lead.id);

      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'ganho', cliente_id: data.id } : l));
      setSel(s => s?.id === lead.id ? { ...s, status: 'ganho', cliente_id: data.id } : s);

      showToast(`${lead.nome} → enviado ao CRM como cliente`);
    } catch (err) {
      showToast(`Erro: ${err.message}`, true);
    } finally {
      setConverting(false);
    }
  }

  function showToast(msg, isError = false) {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  }

  function copyWebhook() {
    navigator.clipboard?.writeText(WEBHOOK_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function exportCSV() {
    const head = 'Nome,Telefone,Email,Origem,Status,Cidade,Área,Data\n';
    const rows = filtrados.map(l =>
      [l.nome, l.telefone, l.email, l.origem, l.status, l.cidade, l.area,
        new Date(l.created_at).toLocaleString('pt-BR')].map(v => `"${v || ''}"`).join(',')
    ).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([head + rows], { type: 'text/csv' }));
    a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const filtrados = leads.filter(l => {
    if (fOrigem !== 'todos' && l.origem !== fOrigem) return false;
    if (fStatus !== 'todos' && l.status !== fStatus) return false;
    if (busca) {
      const b = busca.toLowerCase();
      if (![l.nome, l.telefone, l.email, l.cidade].some(v => v?.toLowerCase().includes(b))) return false;
    }
    return true;
  });

  const total  = leads.length;
  const novos  = leads.filter(l => l.status === 'novo').length;
  const hoje   = leads.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length;
  const ganhos = leads.filter(l => l.status === 'ganho').length;

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--cond)', fontWeight: 700, fontSize: 28, color: 'var(--ink)', lineHeight: 1 }}>
            Oportunidades
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            Leads de alta intenção · atualiza em tempo real conforme chegam do Google, Landing e Calculadora
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#e8f3eb', border: '1px solid #c4e3cd', borderRadius: 8, padding: '5px 11px' }}>
            <span className="rt-dot" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#3f7a4b' }}>Realtime ativo</span>
          </div>
          <button onClick={exportCSV}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--surface)',
              border: '1.5px solid var(--line)', borderRadius: 8, padding: '8px 14px',
              fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Ic n="download" w={14} /> CSV
          </button>
        </div>
      </div>

      {/* Webhook bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1a191c',
        borderRadius: 11, padding: '11px 14px', marginBottom: 20 }}>
        <Ic n="target" w={16} c="#cdeedb" />
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: .5, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', flexShrink: 0 }}>Webhook</span>
        <span style={{ flex: 1, fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 12, color: '#cdeedb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {WEBHOOK_URL}
        </span>
        <button onClick={copyWebhook}
          style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, padding: '6px 12px', borderRadius: 7, cursor: 'pointer', flexShrink: 0 }}>
          {copied ? 'Copiado ✓' : 'Copiar URL'}
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Total de leads',  v: total,  c: 'var(--ink)' },
          { l: 'Novos contatos',  v: novos,  c: '#3f7a4b' },
          { l: 'Chegaram hoje',   v: hoje,   c: '#3b6ea5' },
          { l: 'Convertidos',     v: ganhos, c: '#c0892d' },
        ].map(k => (
          <div key={k.l} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontFamily: 'var(--cond)', fontSize: 34, fontWeight: 700, lineHeight: 1, marginBottom: 3, color: k.c }}>{k.v}</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar nome, tel, e-mail…"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ border: '1.5px solid var(--line)', borderRadius: 8, padding: '7px 12px',
            fontSize: 13, color: 'var(--ink)', background: 'var(--surface)',
            outline: 'none', fontFamily: 'inherit', width: 220 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--muted)' }}>Origem</span>
          {['todos', 'calculadora', 'landing', 'google-ads', 'webhook'].map(o => (
            <button key={o} onClick={() => setFO(o)} className={`chip${fOrigem === o ? ' chip-on' : ''}`}>
              {o === 'todos' ? 'Todas' : ORIGENS[o]?.label || o}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--muted)' }}>Status</span>
          {['todos', ...STATUS_OPT].map(s => (
            <button key={s} onClick={() => setFS(s)} className={`chip${fStatus === s ? ' chip-on' : ''}`}>
              {s === 'todos' ? 'Todos' : STATUS_LBL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de cards */}
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>Carregando…</div>
      ) : filtrados.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14,
          padding: '56px 40px', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--surface-2)',
            border: '1px solid var(--line)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
            <Ic n="target" w={26} c="var(--muted)" />
          </div>
          <div style={{ fontFamily: 'var(--cond)', fontWeight: 700, fontSize: 20, color: 'var(--ink)', marginBottom: 8 }}>
            Nenhum lead com esse filtro
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            Ajuste os filtros acima ou aguarde novos contatos chegarem.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(310px,1fr))', gap: 14 }}>
          {filtrados.map(l => (
            <LeadCard
              key={l.id}
              lead={l}
              onStatus={updateStatus}
              onDelete={setConfirm}
              onOpen={setSel}
              isNew={novoIds.has(l.id)}
            />
          ))}
        </div>
      )}

      {/* Drawer de detalhe */}
      {sel && (
        <LeadDrawer
          lead={sel}
          onClose={() => setSel(null)}
          onStatus={updateStatus}
          onConvert={converterEmCliente}
          converting={converting}
          notes={notes[sel.id] || ''}
          onNote={(id, v) => setNotes(n => ({ ...n, [id]: v }))}
        />
      )}

      {/* Modal confirmação exclusão */}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={() => setConfirm(null)}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, maxWidth: 360, width: '90%', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Excluir lead?</div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Essa ação não pode ser desfeita.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirm(null)}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid var(--line)',
                  background: 'var(--surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancelar
              </button>
              <button onClick={() => deletar(confirm)}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: '#a33327', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`opp-toast${toast.isError ? ' opp-toast-err' : ''}`}>
          {!toast.isError && <Ic n="check" w={15} c="#fff" />}
          {toast.msg}
        </div>
      )}

      <style>{`
        .sf-lead-card {
          background: var(--surface);
          border: 1.5px solid var(--line);
          border-radius: 14px;
          padding: 17px 18px;
          transition: box-shadow .14s;
          position: relative;
          overflow: hidden;
        }
        .sf-lead-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.07); }
        .sf-lead-new { animation: sf-flashin .9s ease-out; }
        @keyframes sf-flashin {
          0%   { opacity:0; transform:translateY(-12px); border-color:#3f7a4b; box-shadow:0 0 0 4px #e8f3eb; }
          55%  { opacity:1; transform:translateY(0);     border-color:#3f7a4b; box-shadow:0 0 0 4px #e8f3eb; }
          100% { border-color:var(--line); box-shadow:none; }
        }
        .lc-top  { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:11px; }
        .lc-name { font-family:var(--cond); font-weight:700; font-size:19px; color:var(--ink); line-height:1.15; }
        .lc-time { font-size:11px; color:var(--muted); margin-top:2px; }
        .lc-row  { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--ink-2); margin-bottom:6px; }
        .lc-foot { display:flex; align-items:center; gap:8px; margin-top:14px; flex-wrap:wrap; }
        .badge-novo { background:#3f7a4b; color:#fff; font-size:10px; font-weight:800; padding:3px 9px; border-radius:5px; letter-spacing:.6px; flex-shrink:0; display:inline-flex; align-items:center; gap:4px; }
        .badge-novo .nd { width:5px; height:5px; border-radius:50%; background:#fff; }
        .conv-tag { display:inline-flex; align-items:center; gap:5px; background:#e8f3eb; color:#3f7a4b; font-size:11px; font-weight:800; padding:3px 9px; border-radius:5px; letter-spacing:.4px; }
        .origem-badge { font-size:10.5px; font-weight:800; padding:3px 9px; border-radius:5px; letter-spacing:.3px; }
        .og-calc    { background:#eef3f9; color:#3b6ea5; }
        .og-land    { background:#f3eef7; color:#6d557e; }
        .og-google  { background:#fdf3e3; color:#c0892d; }
        .og-webhook { background:var(--surface-2); color:var(--ink-2); }
        .status-sel { font-family:inherit; font-size:11.5px; font-weight:700; border-radius:6px; padding:4px 8px; cursor:pointer; outline:none; }
        .st-novo        { border:1.5px solid #bfe0c9; background:#e8f3eb; color:#3f7a4b; }
        .st-contatado   { border:1.5px solid #cfe0ef; background:#eef3f9; color:#3b6ea5; }
        .st-qualificado { border:1.5px solid #e7d3ef; background:#f3eef7; color:#6d557e; }
        .st-proposta    { border:1.5px solid #f0ddb8; background:#fdf3e3; color:#c0892d; }
        .st-ganho       { border:1.5px solid #bfe0c9; background:#3f7a4b; color:#fff; }
        .st-perdido     { border:1.5px solid #eccac4; background:#fdf0ef; color:#a33327; }
        .btn-wa { margin-left:auto; display:inline-flex; align-items:center; gap:6px; background:#1faa59; color:#fff; border:none; border-radius:8px; padding:7px 13px; font-family:inherit; font-size:12.5px; font-weight:700; cursor:pointer; text-decoration:none; transition:.12s; }
        .btn-wa:hover { background:#178a47; }
        .btn-del { display:inline-flex; align-items:center; background:#fdf0ef; border:none; border-radius:6px; padding:6px 8px; cursor:pointer; }
        .chip { padding:5px 13px; border-radius:20px; font-size:12px; font-weight:600; cursor:pointer; border:1.5px solid var(--line); background:var(--surface); color:var(--muted); font-family:inherit; transition:.12s; }
        .chip:hover { border-color:var(--ink); color:var(--ink); }
        .chip-on { background:var(--ink); color:#fff; border-color:var(--ink); }
        .rt-dot { width:8px; height:8px; border-radius:50%; background:#3f7a4b; display:inline-block; animation:rtpulse 1.8s ease-in-out infinite; }
        @keyframes rtpulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(.82)} }

        /* Drawer */
        .opp-scrim { position:fixed; inset:0; background:rgba(26,25,28,.42); z-index:40; animation:oppfade .18s ease forwards; }
        @keyframes oppfade { from{opacity:0} to{opacity:1} }
        .opp-drawer { position:fixed; top:0; right:0; height:100vh; width:430px; max-width:92vw; background:var(--surface); z-index:41; box-shadow:-12px 0 40px rgba(0,0,0,.18); display:flex; flex-direction:column; animation:oppdrawin .26s cubic-bezier(.22,1,.36,1) forwards; }
        @keyframes oppdrawin { from{transform:translateX(100%)} to{transform:translateX(0)} }
        .dr-head { padding:20px 22px 18px; border-bottom:1px solid var(--line); position:relative; flex-shrink:0; }
        .dr-close { position:absolute; top:16px; right:16px; width:30px; height:30px; border-radius:8px; border:1px solid var(--line); background:var(--surface-2); display:grid; place-items:center; cursor:pointer; color:var(--muted); }
        .dr-close:hover { color:var(--ink); border-color:var(--ink); }
        .dr-name { font-family:var(--cond); font-weight:700; font-size:26px; color:var(--ink); line-height:1.1; padding-right:36px; }
        .dr-body { flex:1; overflow-y:auto; padding:20px 22px; }
        .dr-body::-webkit-scrollbar { width:4px; } .dr-body::-webkit-scrollbar-thumb { background:var(--line); border-radius:4px; }
        .dr-sec { font-size:10.5px; font-weight:800; letter-spacing:1.2px; text-transform:uppercase; color:var(--muted); margin:22px 0 10px; }
        .dr-sec:first-child { margin-top:0; }
        .dr-field { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid var(--line-2); }
        .dr-val { font-size:13.5px; color:var(--ink); font-weight:600; }
        .btn-wa-sm { margin-left:auto; display:inline-flex; align-items:center; gap:5px; background:#1faa59; color:#fff; border-radius:7px; padding:5px 10px; font-size:11.5px; font-weight:700; text-decoration:none; }
        .btn-wa-sm:hover { background:#178a47; }
        .tl { position:relative; padding-left:20px; }
        .tl::before { content:''; position:absolute; left:5px; top:4px; bottom:4px; width:2px; background:var(--line); }
        .tl-item { position:relative; padding:0 0 16px; }
        .tl-item:last-child { padding-bottom:0; }
        .tl-dot { position:absolute; left:-18px; top:3px; width:11px; height:11px; border-radius:50%; background:var(--surface); border:2.5px solid var(--muted); }
        .tl-dot-on { border-color:#3f7a4b; background:#3f7a4b; }
        .tl-t { font-size:13px; font-weight:700; color:var(--ink); }
        .tl-s { font-size:11.5px; color:var(--muted); margin-top:1px; }
        .dr-notes { width:100%; border:1.5px solid var(--line); border-radius:10px; padding:11px 12px; font-family:inherit; font-size:13px; color:var(--ink); outline:none; resize:vertical; min-height:74px; background:var(--surface-2); }
        .dr-notes:focus { border-color:var(--brick); background:var(--surface); }
        .dr-foot { padding:16px 22px; border-top:1px solid var(--line); display:flex; gap:10px; flex-shrink:0; }
        .btn-convert { flex:1; display:inline-flex; align-items:center; justify-content:center; gap:8px; background:var(--brick); color:#fff; border:none; border-radius:10px; padding:13px; font-family:inherit; font-size:14px; font-weight:700; cursor:pointer; transition:.14s; }
        .btn-convert:hover:not(:disabled) { background:#7d1411; }
        .btn-convert:disabled { opacity:.7; cursor:default; }
        .btn-convert-done { background:#3f7a4b; cursor:default; }

        /* Toast */
        .opp-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#1a191c; color:#fff; padding:12px 20px; border-radius:11px; font-size:13px; font-weight:600; z-index:50; display:flex; align-items:center; gap:9px; box-shadow:0 8px 30px rgba(0,0,0,.25); animation:toastin .3s ease; }
        .opp-toast-err { background:#a33327; }
        @keyframes toastin { from{opacity:0;transform:translate(-50%,12px)} to{opacity:1;transform:translate(-50%,0)} }
      `}</style>
    </div>
  );
}
