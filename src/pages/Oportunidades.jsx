import { useState, useEffect, useRef } from 'react';
import { sb } from '../services/supabase';
import { useModuleLoad } from '../hooks/useModuleLoad';

function Ic({ n, w = 15, c = 'currentColor' }) {
  const P = {
    phone:    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 5.61 5.61l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>,
    mail:     <g><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></g>,
    target:   <g><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3"/></g>,
    bolt:     <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    download: <g><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></g>,
    refresh:  <g><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></g>,
    trash:    <g><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></g>,
    map:      <g><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></g>,
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
  const d = new Date(ts);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return 'ontem';
  return `há ${Math.floor(diff / 86400)} dias`;
}

const ORIGENS = {
  'Calculadora': { label: 'Calculadora', cls: 'og-calc' },
  'calculadora': { label: 'Calculadora', cls: 'og-calc' },
  'landing':     { label: 'Landing',     cls: 'og-land' },
  'google-ads':  { label: 'Google Ads',  cls: 'og-google' },
  'webhook':     { label: 'Webhook',     cls: 'og-webhook' },
  'manual':      { label: 'Manual',      cls: 'og-webhook' },
};

const STATUS_OPT = ['novo', 'contatado', 'qualificado', 'proposta', 'ganho', 'perdido'];
const STATUS_LBL = { novo: 'Novo contato', contatado: 'Contatado', qualificado: 'Qualificado', proposta: 'Proposta', ganho: 'Ganho', perdido: 'Perdido' };
const STATUS_CLS = { novo: 'st-novo', contatado: 'st-contatado', qualificado: 'st-qualificado', proposta: 'st-proposta', ganho: 'st-ganho', perdido: 'st-perdido' };

function LeadCard({ lead, onStatus, onDelete, isNew }) {
  const og = ORIGENS[lead.origem] || ORIGENS.webhook;
  const tel = (lead.telefone || '').replace(/\D/g, '');
  const waNum = tel.startsWith('55') ? tel : `55${tel}`;
  return (
    <div className={`sf-lead-card${isNew ? ' sf-lead-new' : ''}`}>
      <div className="lc-top">
        <div>
          <div className="lc-name">{lead.nome}</div>
          <div className="lc-time">{fmtData(lead.created_at)}</div>
        </div>
        {lead.status === 'novo' && (
          <span className="badge-novo">
            <span className="nd" />NOVO
          </span>
        )}
      </div>
      <div className="lc-row"><Ic n="phone" w={13} c="var(--muted)" />{lead.telefone || '—'}</div>
      {lead.email && <div className="lc-row"><Ic n="mail" w={13} c="var(--muted)" />{lead.email}</div>}
      {lead.cidade && <div className="lc-row"><Ic n="map" w={13} c="var(--muted)" />{lead.cidade}</div>}
      {lead.area && (
        <div className="lc-row" style={{ fontSize: 12, color: 'var(--muted)' }}>
          {lead.area}m² · {lead.padrao || '—'}
          {(lead.valor_min || lead.valor_max) && (
            <span style={{ marginLeft: 6 }}>
              R$ {Math.round(lead.valor_min || 0).toLocaleString('pt-BR')}–{Math.round(lead.valor_max || 0).toLocaleString('pt-BR')}
            </span>
          )}
        </div>
      )}
      <div className="lc-foot">
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
        <button className="btn-del" onClick={() => onDelete(lead.id)} title="Excluir lead">
          <Ic n="trash" w={13} c="#a33327" />
        </button>
      </div>
    </div>
  );
}

const WEBHOOK_URL = 'https://gpzmglcxmbboxxogbibq.supabase.co/functions/v1/receber-lead';

export default function Oportunidades() {
  useModuleLoad('oportunidades');

  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [novoIds, setNovoIds] = useState(new Set());
  const [fOrigem, setFO]      = useState('todos');
  const [fStatus, setFS]      = useState('todos');
  const [busca, setBusca]     = useState('');
  const [confirm, setConfirm] = useState(null);
  const [copied, setCopied]   = useState(false);
  const channelRef            = useRef(null);

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
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'leads_captacao' }, payload => {
        setLeads(prev => prev.filter(l => l.id !== payload.old.id));
      })
      .subscribe();
    return () => { if (channelRef.current) sb.removeChannel(channelRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStatus(id, status) {
    await sb.from('leads_captacao').update({ status }).eq('id', id);
  }

  async function deletar(id) {
    await sb.from('leads_captacao').delete().eq('id', id);
    setConfirm(null);
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

  function copyWebhook() {
    navigator.clipboard?.writeText(WEBHOOK_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
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

  const origensDisponiveis = ['todos', ...Object.keys(ORIGENS).filter(k => leads.some(l => l.origem === k))];

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
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3f7a4b', animation: 'rtpulse 1.8s ease-in-out infinite', display: 'inline-block' }} />
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
          { l: 'Total de leads',    v: total,  c: 'var(--ink)' },
          { l: 'Novos contatos',    v: novos,  c: '#3f7a4b' },
          { l: 'Chegaram hoje',     v: hoje,   c: '#3b6ea5' },
          { l: 'Convertidos',       v: ganhos, c: '#c0892d' },
        ].map(k => (
          <div key={k.l} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontFamily: 'var(--cond)', fontSize: 34, fontWeight: 700, lineHeight: 1, marginBottom: 3, color: k.c }}>{k.v}</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <input
            placeholder="Buscar nome, tel, e-mail…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ border: '1.5px solid var(--line)', borderRadius: 8, padding: '7px 12px',
              fontSize: 13, color: 'var(--ink)', background: 'var(--surface)',
              outline: 'none', fontFamily: 'inherit', width: 220 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--muted)', alignSelf: 'center' }}>Origem</span>
          {['todos', 'calculadora', 'landing', 'google-ads', 'webhook'].map(o => {
            const lbl = o === 'todos' ? 'Todas' : ORIGENS[o]?.label || o;
            return (
              <button key={o} onClick={() => setFO(o)}
                style={{ padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', border: '1.5px solid', fontFamily: 'inherit',
                  borderColor: fOrigem === o ? 'var(--ink)' : 'var(--line)',
                  background: fOrigem === o ? 'var(--ink)' : 'var(--surface)',
                  color: fOrigem === o ? '#fff' : 'var(--muted)' }}>
                {lbl}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--muted)', alignSelf: 'center' }}>Status</span>
          {['todos', ...STATUS_OPT].map(s => (
            <button key={s} onClick={() => setFS(s)}
              style={{ padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', border: '1.5px solid', fontFamily: 'inherit',
                borderColor: fStatus === s ? 'var(--ink)' : 'var(--line)',
                background: fStatus === s ? 'var(--ink)' : 'var(--surface)',
                color: fStatus === s ? '#fff' : 'var(--muted)' }}>
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
            <LeadCard key={l.id} lead={l} onStatus={updateStatus} onDelete={setConfirm} isNew={novoIds.has(l.id)} />
          ))}
        </div>
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
        .sf-lead-new {
          animation: sf-flashin .9s ease-out;
        }
        @keyframes sf-flashin {
          0%   { opacity:0; transform:translateY(-12px); border-color:#3f7a4b; box-shadow:0 0 0 4px #e8f3eb; }
          55%  { opacity:1; transform:translateY(0);     border-color:#3f7a4b; box-shadow:0 0 0 4px #e8f3eb; }
          100% { border-color:var(--line); box-shadow:none; }
        }
        .lc-top  { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:11px; }
        .lc-name { font-family:var(--cond); font-weight:700; font-size:19px; color:var(--ink); line-height:1.15; letter-spacing:.2px; }
        .lc-time { font-size:11px; color:var(--muted); margin-top:2px; }
        .lc-row  { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--ink-2); margin-bottom:6px; }
        .lc-foot { display:flex; align-items:center; gap:8px; margin-top:14px; flex-wrap:wrap; }
        .badge-novo { background:#3f7a4b; color:#fff; font-size:10px; font-weight:800; padding:3px 9px; border-radius:5px; letter-spacing:.6px; flex-shrink:0; display:inline-flex; align-items:center; gap:4px; }
        .badge-novo .nd { width:5px; height:5px; border-radius:50%; background:#fff; }
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
        @keyframes rtpulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(.82)} }
      `}</style>
    </div>
  );
}
