//  STICK FRAME · Orçamento SF · UI Compartilhado 
import React from 'react';
import { SF_COMP, SF_COMP_COR } from '../../utils/sf-orcamento';

export function SFIc({ n, ...p }) {
  var paths = {
    plus:     <path d="M12 5v14M5 12h14" />,
    trash:    <g><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></g>,
    edit:     <g><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" /></g>,
    chevR:    <path d="M9 18l6-6-6-6" />,
    chevL:    <path d="M15 18l-6-6 6-6" />,
    x:        <path d="M18 6 6 18M6 6l12 12" />,
    doc:      <g><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v4h4M9 13h6M9 17h6" /></g>,
    home:     <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
    print:    <g><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></g>,
    warn:     <g><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></g>,
    check:    <path d="M20 6 9 17l-5-5" />,
    calc:     <g><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" /></g>,
    obra:     <g><path d="M3 21h18M6 21V9M10 21V9" /><path d="M4 9h16l-2-5H8z" /></g>,
    cube:     <g><path d="M3 7l9-4 9 4-9 4z" /><path d="M3 7v10l9 4 9-4V7" /></g>,
    dash:     <g><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></g>,
    cfg:      <g><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.2a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 0 1 0-4h.2A1.6 1.6 0 0 0 4.3 9" /></g>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.sw||"1.9"} strokeLinecap="round" strokeLinejoin="round" {...p}>
      {paths[n]}
    </svg>
  );
}

export function SFBtn({ v, sm, full, children, ...rest }) {
  var cls = ['sf-orc-btn',
    v === 'primary' ? 'sf-orc-btn-primary' : v === 'danger' ? 'sf-orc-btn-danger' : 'sf-orc-btn-ghost',
    sm ? 'sf-orc-btn-sm' : '',
    full ? 'sf-orc-btn-full' : '',
  ].filter(Boolean).join(' ');
  return <button className={cls} {...rest}>{children}</button>;
}

export function SFBadge({ compId }) {
  var comp = SF_COMP.find(function(c){ return c.id === compId; });
  var cor = SF_COMP_COR[compId] || '#8c847a';
  return (
    <span className="sf-orc-badge" style={{ background: cor + '1a', color: cor, border: '1px solid ' + cor + '44' }}>
      {comp ? comp.nome : compId}
    </span>
  );
}

export function SFModal({ title, onClose, footer, children }) {
  return (
    <div className="sf-orc-modal-dim" onClick={function(e){ if(e.target === e.currentTarget) onClose(); }}>
      <div className="sf-orc-modal">
        <div className="sf-orc-modal-head">
          <h3>{title}</h3>
          <SFBtn v="ghost" sm onClick={onClose} style={{padding:'6px'}}><SFIc n="x" style={{width:16,height:16}} /></SFBtn>
        </div>
        <div className="sf-orc-modal-body">{children}</div>
        {footer && <div className="sf-orc-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function SFConfirmModal({ msg, onConfirm, onCancel }) {
  return (
    <SFModal title="Confirmar exclusão" onClose={onCancel}
      footer={<>
        <SFBtn v="ghost" sm onClick={onCancel}>Cancelar</SFBtn>
        <SFBtn v="danger" sm onClick={onConfirm}><SFIc n="trash" />Excluir</SFBtn>
      </>}>
      <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>{msg}</p>
    </SFModal>
  );
}

export function SFEmptyState({ icon, title, desc, cta, onCta }) {
  return (
    <div className="sf-orc-empty">
      <div className="sf-orc-e-ic"><SFIc n={icon||'doc'} /></div>
      <h3>{title}</h3>
      <p>{desc}</p>
      {cta && <SFBtn v="primary" onClick={onCta}><SFIc n="plus" />{cta}</SFBtn>}
    </div>
  );
}
