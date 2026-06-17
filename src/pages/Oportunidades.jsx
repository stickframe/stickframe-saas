import { useState, useEffect, useRef } from 'react';
import { sb } from '../services/supabase';
import { useModuleLoad } from '../hooks/useModuleLoad';

// ── Ícones inline ────────────────────────────────────────────────────────────
function Ic({ n, w = 15, c = 'currentColor' }) {
  const P = {
    user:   <g><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></g>,
    phone:  <g><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 15 19.79 19.79 0 0 1 1.61 6.53a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 11a16 16 0 0 0 6.09 6.09l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></g>,
    mail:   <g><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></g>,
    map:    <g><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></g>,
    calc:   <g><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01"/></g>,
    clock:  <g><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></g>,
    spark:  <g><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></g>,
    filter: <g><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></g>,
    wa:     <g><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></g>,
    badge:  <g><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></g>,
    check:  <polyline points="20 6 9 17 4 12"/>,
    trash:  <g><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></g>,
    refresh:<g><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></g>,
    plus:   <path d="M12 5v14M5 12h14"/>,
    export: <g><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></g>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ width: w, height: w, flexShrink: 0 }}>
      {P[n]}
    </svg>
  );
}

// ── Formatadores ─────────────────────────────────────────────────────────────
function fmtData(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const agora = new Date();
  const diff = (agora - d) / 1000;
  if (diff < 60) return 'Agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function fmtTel(t) {
  if (!t) return '';
  const n = t.replace(/\D/g, '');
  if (n.length === 11) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`;
  return t;
}

const ORIGEM_COR = {
  'Calculadora':  { bg: '#eef3f9', c: '#3b6ea5', label: 'Calculadora' },
  'landing':      { bg: '#f3e7e5', c: '#981915', label: 'Landing Page' },
  'google-ads':   { bg: '#fef5e7', c: '#c0892d', label: 'Google Ads' },
  'webhook':      { bg: '#f3e7e5', c: '#981915', label: 'Webhook' },
  'manual':       { bg: 'var(--surface-2)', c: 'var(--muted)', label: 'Manual' },
};
function OrigemPill({ origem }) {
  const o = ORIGEM_COR[origem] || { bg: 'var(--surface-2)', c: 'var(--muted)', label: origem };
  return (
    <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 800,
      padding: '3px 9px', borderRadius: 6, letterSpacing: '.3px',
      background: o.bg, color: o.c }}>
      {o.label}
    </span>
  );
}

const STATUS_OPT = ['novo', 'contatado', 'qualificado', 'proposta', 'ganho', 'perdido'];
const STATUS_COR = {
  novo:        { bg: '#e8f3eb', c: '#3f7a4b' },
  contatado:   { bg: '#eef3f9', c: '#3b6ea5' },
  qualificado: { bg: '#f3e7e5', c: '#981915' },
  proposta:    { bg: '#fef5e7', c: '#c0892d' },
  ganho:       { bg: '#e8f3eb', c: '#3f7a4b' },
  perdido:     { bg: '#fdf0ef', c: '#a33327' },
};
function StatusPill({ status, onChange }) {
  const s = STATUS_COR[status] || STATUS_COR.novo;
  return (
    <select
      value={status}
      onChange={e => onChange(e.target.value)}
      style={{ fontSize: 11, fontWeight: 800, padding: '3px 7px', borderRadius: 6,
        background: s.bg, color: s.c, border: 'none', cursor: 'pointer',
        fontFamily: 'inherit', letterSpacing: '.3px' }}>
      {STATUS_OPT.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
    </select>
  );
}

const FILTROS_ORIGEM = ['Todos', 'Calculadora', 'landing', 'google-ads', 'webhook', 'manual'];
const FILTROS_STATUS = ['Todos', ...STATUS_OPT];

// ── Componente principal ─────────────────────────────────────────────────────
export default function Oportunidades() {
  useModuleLoad('oportunidades');

  const [leads, setLeads]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [novoIds, setNovoIds]   = useState(new Set());
  const [filtroOrigem, setFO]   = useState('Todos');
  const [filtroStatus, setFS]   = useState('Todos');
  const [busca, setBusca]       = useState('');
  const [confirm, setConfirm]   = useState(null);
  const channelRef              = useRef(null);

  // Carga inicial
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

  // Realtime
  useEffect(() => {
    carregar();

    channelRef.current = sb
      .channel('leads_captacao_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads_captacao' }, payload => {
        const nl = payload.new;
        setLeads(prev => [nl, ...prev]);
        setNovoIds(prev => new Set([...prev, nl.id]));
        setTimeout(() => setNovoIds(prev => { const s = new Set(prev); s.delete(nl.id); return s; }), 4000);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads_captacao' }, payload => {
        setLeads(prev => prev.map(l => l.id === payload.new.id ? payload.new : l));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'leads_captacao' }, payload => {
        setLeads(prev => prev.filter(l => l.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      if (channelRef.current) sb.removeChannel(channelRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStatus(id, status) {
    await sb.from('leads_captacao').update({ status }).eq('id', id);
  }

  async function deletar(id) {
    await sb.from('leads_captacao').delete().eq('id', id);
    setConfirm(null);
  }

  // Filtros
  const filtrados = leads.filter(l => {
    if (filtroOrigem !== 'Todos' && l.origem !== filtroOrigem) return false;
    if (filtroStatus !== 'Todos' && l.status !== filtroStatus) return false;
    if (busca) {
      const b = busca.toLowerCase();
      if (![l.nome, l.telefone, l.email, l.cidade].some(v => v?.toLowerCase().includes(b))) return false;
    }
    return true;
  });

  // KPIs
  const total   = leads.length;
  const novos   = leads.filter(l => l.status === 'novo').length;
  const hoje    = leads.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length;
  const ganhos  = leads.filter(l => l.status === 'ganho').length;

  const kpis = [
    { l: 'Total de leads',   v: total,  ic: 'badge',  bg: 'var(--surface-2)', c: 'var(--ink-2)' },
    { l: 'Novos (pendentes)',v: novos,  ic: 'spark',  bg: '#e8f3eb',          c: '#3f7a4b' },
    { l: 'Chegaram hoje',    v: hoje,   ic: 'clock',  bg: '#eef3f9',          c: '#3b6ea5' },
    { l: 'Convertidos',      v: ganhos, ic: 'check',  bg: '#fef5e7',          c: '#c0892d' },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontFamily: 'var(--cond)', fontWeight: 700, fontSize: 28, color: 'var(--ink)', lineHeight: 1 }}>
              Oportunidades
            </h1>
            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 6,
              background: '#e8f3eb', color: '#3f7a4b', letterSpacing: '.3px' }}>
              REALTIME
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            Leads captados via Calculadora, Landing Page e Google Ads — atualizados em tempo real
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={carregar}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--surface)',
              border: '1.5px solid var(--line)', borderRadius: 8, padding: '7px 12px',
              fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)', cursor: 'pointer' }}>
            <Ic n="refresh" w={13} /> Atualizar
          </button>
          <button
            onClick={() => {
              const csv = ['Nome,Telefone,Email,Origem,Status,Cidade,Área,Data']
                .concat(filtrados.map(l =>
                  [l.nome, l.telefone, l.email, l.origem, l.status, l.cidade, l.area,
                    new Date(l.created_at).toLocaleString('pt-BR')].map(v => `"${v || ''}"`).join(',')
                )).join('\n');
              const a = document.createElement('a');
              a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
              a.download = `leads_${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--surface)',
              border: '1.5px solid var(--line)', borderRadius: 8, padding: '7px 12px',
              fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)', cursor: 'pointer' }}>
            <Ic n="export" w={13} /> CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {kpis.map(k => (
          <div key={k.l} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: k.bg,
              display: 'grid', placeItems: 'center', marginBottom: 10 }}>
              <Ic n={k.ic} w={15} c={k.c} />
            </div>
            <div style={{ fontFamily: 'var(--cond)', fontSize: 34, fontWeight: 700, lineHeight: 1, marginBottom: 3, color: k.c }}>
              {k.v}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <input
            placeholder="Buscar nome, telefone, e-mail…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ width: '100%', border: '1.5px solid var(--line)', borderRadius: 8,
              padding: '7px 12px', fontSize: 13, color: 'var(--ink)', background: 'var(--surface)',
              outline: 'none', fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 2, background: 'var(--surface-2)',
          border: '1px solid var(--line)', borderRadius: 9, padding: 3 }}>
          {FILTROS_ORIGEM.map(o => (
            <button key={o} onClick={() => setFO(o)}
              style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: filtroOrigem === o ? 'var(--surface)' : 'transparent',
                color: filtroOrigem === o ? 'var(--ink)' : 'var(--muted)',
                boxShadow: filtroOrigem === o ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>
              {o === 'landing' ? 'Landing' : o === 'google-ads' ? 'Google Ads' : o === 'webhook' ? 'Webhook' : o}
            </button>
          ))}
        </div>
        <select value={filtroStatus} onChange={e => setFS(e.target.value)}
          style={{ border: '1.5px solid var(--line)', borderRadius: 8, padding: '7px 12px',
            fontSize: 13, color: 'var(--ink)', background: 'var(--surface)',
            outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
          {FILTROS_STATUS.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>
            {filtrados.length} lead{filtrados.length !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4caf50', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Escutando novos leads…
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>Carregando…</div>
        ) : filtrados.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--surface-2)',
              border: '1px solid var(--line)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <Ic n="badge" w={24} c="var(--muted)" />
            </div>
            <div style={{ fontFamily: 'var(--cond)', fontWeight: 700, fontSize: 18, color: 'var(--ink)', marginBottom: 8 }}>
              Nenhum lead ainda
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 320, margin: '0 auto' }}>
              Configure o webhook no Zapier com a URL da Edge Function para receber leads do Google Ads.
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Nome', 'Contato', 'Origem', 'Projeto', 'Status', 'Chegou', 'Ações'].map(h => (
                  <th key={h} style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '1px',
                    color: 'var(--muted)', textTransform: 'uppercase', padding: '10px 14px',
                    textAlign: 'left', borderBottom: '1px solid var(--line)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(l => {
                const isNovo = novoIds.has(l.id);
                return (
                  <tr key={l.id} style={{
                    background: isNovo ? '#f0fff4' : undefined,
                    transition: 'background .6s',
                  }}>
                    {/* Nome */}
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%',
                          background: 'var(--brick)', color: '#fff', display: 'grid',
                          placeItems: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                          {(l.nome || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{l.nome}</div>
                          {l.cidade && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{l.cidade}</div>}
                        </div>
                        {isNovo && (
                          <span style={{ fontSize: 9, fontWeight: 800, background: '#3f7a4b', color: '#fff',
                            padding: '2px 6px', borderRadius: 4, letterSpacing: '.5px' }}>NOVO</span>
                        )}
                      </div>
                    </td>
                    {/* Contato */}
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-2)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <a href={`https://wa.me/55${l.telefone?.replace(/\D/g,'')}`}
                          target="_blank" rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                            fontSize: 12.5, color: '#3f7a4b', fontWeight: 600, textDecoration: 'none' }}>
                          <Ic n="wa" w={13} c="#3f7a4b" />
                          {fmtTel(l.telefone)}
                        </a>
                        {l.email && (
                          <a href={`mailto:${l.email}`}
                            style={{ fontSize: 11.5, color: 'var(--muted)', textDecoration: 'none' }}>
                            {l.email}
                          </a>
                        )}
                      </div>
                    </td>
                    {/* Origem */}
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-2)' }}>
                      <OrigemPill origem={l.origem} />
                    </td>
                    {/* Projeto */}
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-2)', fontSize: 12.5, color: 'var(--ink-2)' }}>
                      {l.area ? (
                        <div>
                          <div style={{ fontFamily: 'var(--cond)', fontWeight: 700 }}>{l.area}m² · {l.padrao || '—'}</div>
                          {(l.valor_min || l.valor_max) && (
                            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                              R$ {Math.round(l.valor_min||0).toLocaleString('pt-BR')} – R$ {Math.round(l.valor_max||0).toLocaleString('pt-BR')}
                            </div>
                          )}
                        </div>
                      ) : <span style={{ color: 'var(--muted)' }}>—</span>}
                    </td>
                    {/* Status */}
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-2)' }}>
                      <StatusPill status={l.status || 'novo'} onChange={v => updateStatus(l.id, v)} />
                    </td>
                    {/* Data */}
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-2)',
                      fontSize: 12.5, color: 'var(--muted)', fontFamily: 'var(--cond)', fontWeight: 600 }}>
                      {fmtData(l.created_at)}
                    </td>
                    {/* Ações */}
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-2)' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <a href={`https://wa.me/55${l.telefone?.replace(/\D/g,'')}`}
                          target="_blank" rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: '#e8f3eb', color: '#3f7a4b', border: 'none',
                            borderRadius: 6, padding: '5px 9px', fontSize: 11.5, fontWeight: 600,
                            cursor: 'pointer', textDecoration: 'none' }}>
                          <Ic n="wa" w={12} c="#3f7a4b" /> WhatsApp
                        </a>
                        <button onClick={() => setConfirm(l.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: '#fdf0ef', color: '#a33327', border: 'none',
                            borderRadius: 6, padding: '5px 9px', fontSize: 11.5, fontWeight: 600,
                            cursor: 'pointer' }}>
                          <Ic n="trash" w={12} c="#a33327" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Bloco info webhook */}
      <div style={{ marginTop: 20, background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Ic n="spark" w={14} c="var(--brick)" /> URL do Webhook (Zapier / Google Ads)
        </div>
        <code style={{ fontSize: 12.5, color: 'var(--brick)', background: 'var(--surface-2)',
          border: '1px solid var(--line)', borderRadius: 7, padding: '8px 14px', display: 'block',
          userSelect: 'all', wordBreak: 'break-all' }}>
          https://gpzmglcxmbboxxogbibq.supabase.co/functions/v1/receber-lead
        </code>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
          Cole essa URL no Zapier como destino "Webhook POST". Campos obrigatórios: <strong>nome</strong>, <strong>telefone</strong>. Opcionais: email, cidade, area, padrao, valor_min, valor_max, origem.
        </p>
      </div>

      {/* Modal de confirmação */}
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
                  background: 'var(--surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={() => deletar(confirm)}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: '#a33327', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>
    </div>
  );
}
