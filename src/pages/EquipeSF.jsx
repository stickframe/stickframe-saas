import { useState, useEffect, useCallback } from "react";
import {
  listarColaboradores, criarColaborador, atualizarColaborador, deletarColaborador,
  listarAlocacoes, listarHoras,
} from "../services/repositories/colaboradorRepository";
import { listarCertificacoes } from "../services/repositories/certificacaoRepository";

// SVG icon helper
function Ic({ n, w = 15, c }) {
  const P = {
    users:    <g><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></g>,
    wrench:   <g><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></g>,
    calendar: <g><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></g>,
    clock:    <g><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></g>,
    shield:   <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    search:   <g><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></g>,
    plus:     <path d="M12 5v14M5 12h14"/>,
    pencil:   <g><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></g>,
    badge:    <g><rect x="3" y="8" width="18" height="14" rx="2"/><path d="M16 8V6a4 4 0 0 0-8 0v2"/><line x1="12" y1="13" x2="12" y2="17"/><circle cx="12" cy="13" r="1"/></g>,
    globe:    <g><circle cx="12" cy="12" r="9"/><path d="M12 2a14.5 14.5 0 0 0 0 20"/><path d="M12 2a14.5 14.5 0 0 1 0 20"/><line x1="2" y1="12" x2="22" y2="12"/></g>,
    trash:    <g><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></g>,
    dollar:   <g><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></g>,
    mail:     <g><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></g>,
    phone:    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 5.61 5.61l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>,
    x:        <g><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></g>,
    print:    <g><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></g>,
    user:     <g><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></g>,
    alert:    <g><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></g>,
    check:    <polyline points="20 6 9 17 4 12"/>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c || "currentColor"}
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: w, height: w, flexShrink: 0 }}>
      {P[n]}
    </svg>
  );
}

// de-para: campo frontend ↔ coluna DB
function toDb(form) {
  return { ...form, especialidade: form.area };
}
function fromDb(row) {
  return { ...row, area: row.especialidade || row.area || "" };
}

const TABS = [
  { id: "equipe", label: "Equipe",       icon: "users" },
  { id: "empr",   label: "Empreiteiros", icon: "wrench" },
  { id: "aloc",   label: "Alocações",    icon: "calendar" },
  { id: "horas",  label: "Horas",        icon: "clock" },
  { id: "comp",   label: "Compliance",   icon: "shield" },
];

const FILTROS  = ["Todos", "Ativo", "Férias", "Afastado", "Inativo"];
const AREAS    = ["Administração", "Montador", "Ajudante", "Elétrica", "Hidráulica", "Outro"];
const STATUS_L = ["Ativo", "Férias", "Afastado", "Inativo"];
const NRS_L    = ["NR-5","NR-6","NR-10","NR-12","NR-18","NR-35","ASO","Habilitação","CREA","CAU"];

function fmtBRL(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function StatusPill({ status }) {
  const s = {
    Ativo:    { background: "#e8f3eb", color: "#3f7a4b" },
    Férias:   { background: "#fef5e7", color: "#b07a1e" },
    Afastado: { background: "#fef5e7", color: "#b07a1e" },
    Inativo:  { background: "var(--surface-2)", color: "var(--muted)" },
  }[status] || {};
  return <span style={{ ...s, fontSize: 10.5, fontWeight: 800, padding: "3px 9px", borderRadius: 5 }}>{status}</span>;
}

function imprimirCracha(m) {
  const initials = m.nome.split(" ").slice(0, 2).map(w => w[0]).join("");
  const win = window.open("", "_blank", "width=400,height=560");
  win.document.write(`<!DOCTYPE html><html><head><title>Crachá — ${m.nome}</title>
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Hanken+Grotesk:wght@500;700&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Hanken Grotesk',sans-serif;background:#f4f1ec;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
    .card{background:#fff;border-radius:16px;width:280px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.12)}
    .top{background:#981915;padding:24px 20px 28px;text-align:center}
    .logo{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:18px;letter-spacing:2px;color:#fff;margin-bottom:16px}
    .avatar{width:72px;height:72px;border-radius:50%;background:#fff;color:#981915;font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:700;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;border:3px solid rgba(255,255,255,.3)}
    .nome{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:20px;color:#fff;letter-spacing:.5px;margin-bottom:4px}
    .cargo{font-size:12px;color:rgba(255,255,255,.75);font-weight:600;letter-spacing:1px;text-transform:uppercase}
    .body{padding:20px}
    .row{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#57514a;margin-bottom:10px}
    .nrs{display:flex;flex-wrap:wrap;gap:5px;margin-top:14px}
    .nr{background:#f3e7e5;color:#981915;font-size:10px;font-weight:800;padding:3px 8px;border-radius:5px}
    .ft{background:#2b2b2e;padding:10px 20px;text-align:center;font-size:10px;color:rgba(255,255,255,.4);letter-spacing:1px}
    @media print{body{background:#fff}.card{box-shadow:none}}
  </style></head><body>
  <div class="card">
    <div class="top">
      <div class="logo">STICKFRAME</div>
      <div class="avatar">${initials}</div>
      <div class="nome">${m.nome}</div>
      <div class="cargo">${m.cargo}${m.area ? " · " + m.area : ""}</div>
    </div>
    <div class="body">
      ${m.email ? `<div class="row">${m.email}</div>` : ""}
      ${m.tel ? `<div class="row">${m.tel}</div>` : ""}
      ${m.cargo_extra ? `<div class="row" style="font-style:italic;color:#8c847a">${m.cargo_extra}</div>` : ""}
      ${m.nrs?.length ? `<div class="nrs">${m.nrs.map(n => `<span class="nr">${n}</span>`).join("")}</div>` : ""}
    </div>
    <div class="ft">SISTEMAS CONSTRUTIVOS · STEEL FRAME</div>
  </div>
  <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`);
  win.document.close();
}

function ModalMembro({ membro, onSave, onClose, saving }) {
  const novo = !membro.id;
  const [form, setForm] = useState({
    nome:        membro.nome        || "",
    cargo:       membro.cargo       || "",
    area:        membro.area        || "Montador",
    cargo_extra: membro.cargo_extra || "",
    salario:     membro.salario     || "",
    status:      membro.status      || "Ativo",
    email:       membro.email       || "",
    tel:         membro.tel         || "",
    nrs:         membro.nrs         || [],
  });

  function toggle(nr) {
    setForm(f => ({ ...f, nrs: f.nrs.includes(nr) ? f.nrs.filter(x => x !== nr) : [...f.nrs, nr] }));
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 520,
        maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontFamily: "var(--cond,'Barlow Condensed',sans-serif)", fontWeight: 700, fontSize: 20, color: "var(--ink)" }}>
            {novo ? "Novo colaborador" : "Editar colaborador"}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Ic n="x" w={18} c="var(--muted)" />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { label: "Nome completo", key: "nome",        span: 2 },
            { label: "Cargo",         key: "cargo" },
            { label: "Área",          key: "area",        type: "select", opts: AREAS },
            { label: "Cargo extra",   key: "cargo_extra", span: 2 },
            { label: "Salário (R$)",  key: "salario",     type: "number" },
            { label: "Status",        key: "status",      type: "select", opts: STATUS_L },
            { label: "E-mail",        key: "email" },
            { label: "Telefone",      key: "tel" },
          ].map(f => (
            <div key={f.key} style={{ gridColumn: f.span === 2 ? "1 / -1" : undefined }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)",
                textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 5 }}>
                {f.label}
              </label>
              {f.type === "select" ? (
                <select value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: "100%", border: "1.5px solid var(--line)", borderRadius: 8, padding: "8px 12px",
                    fontFamily: "inherit", fontSize: 13, background: "var(--surface-2)", outline: "none" }}>
                  {f.opts.map(o => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type || "text"} value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: "100%", border: "1.5px solid var(--line)", borderRadius: 8, padding: "8px 12px",
                    fontFamily: "inherit", fontSize: 13, background: "var(--surface-2)", outline: "none" }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)",
            textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>
            Habilitações / NRs
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {NRS_L.map(nr => (
              <button key={nr} type="button" onClick={() => toggle(nr)}
                style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
                  cursor: "pointer", border: "1.5px solid",
                  borderColor: form.nrs.includes(nr) ? "var(--brick,#981915)" : "var(--line)",
                  background: form.nrs.includes(nr) ? "#f3e7e5" : "var(--surface)",
                  color: form.nrs.includes(nr) ? "var(--brick,#981915)" : "var(--muted)" }}>
                {nr}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
          <button onClick={onClose}
            style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid var(--line)",
              background: "var(--surface)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Cancelar
          </button>
          <button disabled={saving} onClick={() => onSave({ ...membro, ...form, salario: Number(form.salario) || 0 })}
            style={{ padding: "8px 22px", borderRadius: 8, border: "none", opacity: saving ? .7 : 1,
              background: "var(--brick,#981915)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Salvando…" : novo ? "Adicionar" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CardMembro({ m, onEdit, onCracha, onDelete }) {
  const initials = m.nome.split(" ").slice(0, 2).map(w => w[0]).join("");
  return (
    <div style={{ background: "var(--surface)", border: "1.5px solid var(--line)", borderRadius: 14,
      padding: 18, display: "flex", flexDirection: "column", transition: "box-shadow .12s" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 3px 14px rgba(0,0,0,.07)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f3e7e5",
            display: "grid", placeItems: "center",
            fontFamily: "var(--cond,'Barlow Condensed',sans-serif)",
            fontWeight: 700, fontSize: 16, color: "var(--brick,#981915)", flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontFamily: "var(--cond,'Barlow Condensed',sans-serif)", fontWeight: 700,
              fontSize: 17, color: "var(--ink)", letterSpacing: .3, lineHeight: 1.2, marginBottom: 2 }}>
              {m.nome}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, letterSpacing: .5 }}>
              {m.cargo}{m.area ? ` · ${m.area}` : ""}
            </div>
          </div>
        </div>
        <StatusPill status={m.status} />
      </div>

      {m.email && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
          <Ic n="mail" w={12} c="var(--muted)" />{m.email}
        </div>
      )}
      {m.tel && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
          <Ic n="phone" w={12} c="var(--muted)" />{m.tel}
        </div>
      )}

      <div style={{ fontFamily: "var(--cond,'Barlow Condensed',sans-serif)", fontWeight: 700,
        fontSize: 22, color: "var(--ink)", margin: "8px 0" }}>
        {fmtBRL(m.salario)}
      </div>

      {m.nrs?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
          {m.nrs.map(nr => (
            <span key={nr} style={{ fontSize: 10.5, fontWeight: 800, padding: "2px 7px", borderRadius: 5,
              background: "#f3e7e5", color: "var(--brick,#981915)" }}>{nr}</span>
          ))}
        </div>
      )}

      {m.cargo_extra && (
        <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, marginBottom: 8,
          background: "var(--surface-2)", color: "var(--ink-2,#57514a)",
          border: "1px solid var(--line)", display: "inline-block" }}>{m.cargo_extra}</span>
      )}

      <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
        {[
          { icon: "pencil", label: "Editar", action: onEdit },
          { icon: "badge",  label: "Crachá", action: onCracha },
        ].map(a => (
          <button key={a.label} onClick={a.action}
            style={{ display: "inline-flex", alignItems: "center", gap: 5,
              padding: "6px 10px", borderRadius: 7, fontFamily: "inherit",
              fontSize: 11.5, fontWeight: 700, cursor: "pointer",
              border: "1.5px solid var(--line)", background: "var(--surface)",
              color: "var(--ink-2,#57514a)", transition: "all .12s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--brick,#981915)"; e.currentTarget.style.color = "var(--brick,#981915)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink-2,#57514a)"; }}>
            <Ic n={a.icon} w={11} />
            {a.label}
          </button>
        ))}
        <button onClick={onDelete}
          style={{ background: "var(--surface)", border: "1.5px solid var(--line)",
            color: "#a33327", borderRadius: 7, width: 30, height: 30,
            display: "grid", placeItems: "center", cursor: "pointer",
            transition: "all .12s", marginLeft: "auto" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fdf0ef"; e.currentTarget.style.borderColor = "#a33327"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--line)"; }}>
          <Ic n="trash" w={12} c="#a33327" />
        </button>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, text, action, onAction }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14,
      padding: "56px 40px", textAlign: "center" }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--surface-2)",
        border: "1px solid var(--line)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}>
        <Ic n={icon} w={28} c="var(--muted)" />
      </div>
      <div style={{ fontFamily: "var(--cond,'Barlow Condensed',sans-serif)", fontWeight: 700,
        fontSize: 20, color: "var(--ink)", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--muted)", maxWidth: 340, margin: "0 auto 20px" }}>{text}</div>
      {action && (
        <button onClick={onAction} style={{ display: "inline-flex", alignItems: "center", gap: 7,
          background: "var(--brick,#981915)", color: "#fff", border: "none", borderRadius: 8,
          padding: "9px 18px", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <Ic n="plus" w={14} c="#fff" /> {action}
        </button>
      )}
    </div>
  );
}

// ── Aba Compliance ────────────────────────────────────────────────────────────
function TabCompliance({ certs, loading }) {
  if (loading) return <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>Carregando…</div>;
  if (!certs.length) return (
    <EmptyState icon="shield" title="Compliance em dia"
      text="Vencimentos de NRs, ASO e habilitações serão exibidos conforme os dados dos colaboradores." />
  );

  const COR = { Vigente: "#3f7a4b", Vencendo: "#b07a1e", Vencida: "#a33327" };
  const BG  = { Vigente: "#e8f3eb", Vencendo: "#fef5e7", Vencida: "#fdf0ef" };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
            {["Colaborador", "Tipo / NR", "Validade", "Dias Restantes", "Status"].map(h => (
              <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5,
                fontWeight: 800, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {certs.map((c, i) => (
            <tr key={c.id} style={{ borderBottom: i < certs.length - 1 ? "1px solid var(--line-2,#efeae2)" : "none" }}>
              <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--ink)" }}>
                {c.colaborador?.nome || "—"}
              </td>
              <td style={{ padding: "10px 14px", color: "var(--ink-2)" }}>{c.tipo}</td>
              <td style={{ padding: "10px 14px", color: "var(--muted)" }}>
                {c.data_validade ? new Date(c.data_validade).toLocaleDateString("pt-BR") : "—"}
              </td>
              <td style={{ padding: "10px 14px", fontFamily: "'Barlow Condensed',sans-serif",
                fontSize: 16, fontWeight: 700, color: COR[c.status] || "var(--ink)" }}>
                {c.diasRestantes != null ? `${c.diasRestantes}d` : "—"}
              </td>
              <td style={{ padding: "10px 14px" }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 9px", borderRadius: 5,
                  background: BG[c.status] || "var(--surface-2)", color: COR[c.status] || "var(--muted)" }}>
                  {c.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Aba Alocações ─────────────────────────────────────────────────────────────
function TabAlocacoes({ alocacoes, loading }) {
  if (loading) return <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>Carregando…</div>;
  if (!alocacoes.length) return (
    <EmptyState icon="calendar" title="Sem alocações registradas"
      text="Aloque colaboradores a fases da obra para controlar presença e produtividade." />
  );
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
            {["Colaborador", "Obra", "Início", "Fim", "Função"].map(h => (
              <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5,
                fontWeight: 800, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {alocacoes.map((a, i) => (
            <tr key={a.id} style={{ borderBottom: i < alocacoes.length - 1 ? "1px solid var(--line-2,#efeae2)" : "none" }}>
              <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--ink)" }}>{a.colaborador_nome || a.colaborador_id}</td>
              <td style={{ padding: "10px 14px", color: "var(--ink-2)" }}>{a.obra_nome || a.obra_id || "—"}</td>
              <td style={{ padding: "10px 14px", color: "var(--muted)" }}>{a.data_inicio ? new Date(a.data_inicio).toLocaleDateString("pt-BR") : "—"}</td>
              <td style={{ padding: "10px 14px", color: "var(--muted)" }}>{a.data_fim ? new Date(a.data_fim).toLocaleDateString("pt-BR") : "Em curso"}</td>
              <td style={{ padding: "10px 14px", color: "var(--ink-2)" }}>{a.funcao || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Aba Horas ─────────────────────────────────────────────────────────────────
function TabHoras({ horas, loading }) {
  if (loading) return <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>Carregando…</div>;
  if (!horas.length) return (
    <EmptyState icon="clock" title="Nenhuma hora lançada"
      text="Lançamentos de horas extras, banco de horas e apuração de ponto aparecem aqui." />
  );

  const totalHoras = horas.reduce((s, h) => s + (h.horas || 0), 0);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Total de lançamentos", value: horas.length, color: "var(--steel,#3b6ea5)" },
          { label: "Total de horas",        value: `${totalHoras.toFixed(1)}h`, color: "var(--ink)" },
        ].map(k => (
          <div key={k.label} style={{ background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ height: 3, width: 28, borderRadius: 2, marginBottom: 10, background: k.color }} />
            <div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", letterSpacing: 1.2, marginBottom: 6 }}>
              {k.label.toUpperCase()}
            </div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 26, fontWeight: 700,
              color: "var(--ink)", lineHeight: 1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
              {["Colaborador", "Obra", "Data", "Horas", "Tipo"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5,
                  fontWeight: 800, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horas.map((h, i) => (
              <tr key={h.id} style={{ borderBottom: i < horas.length - 1 ? "1px solid var(--line-2,#efeae2)" : "none" }}>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--ink)" }}>{h.colaborador_nome || h.colaborador_id}</td>
                <td style={{ padding: "10px 14px", color: "var(--ink-2)" }}>{h.obra_nome || h.obra_id || "—"}</td>
                <td style={{ padding: "10px 14px", color: "var(--muted)" }}>{h.data ? new Date(h.data).toLocaleDateString("pt-BR") : "—"}</td>
                <td style={{ padding: "10px 14px", fontFamily: "'Barlow Condensed',sans-serif",
                  fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{h.horas}h</td>
                <td style={{ padding: "10px 14px", color: "var(--ink-2)" }}>{h.tipo || "Normal"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function EquipeSF() {
  const [membros,    setMembros]    = useState([]);
  const [alocacoes,  setAlocacoes]  = useState([]);
  const [horas,      setHoras]      = useState([]);
  const [certs,      setCerts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [loadAloc,   setLoadAloc]   = useState(false);
  const [loadHoras,  setLoadHoras]  = useState(false);
  const [loadComp,   setLoadComp]   = useState(false);
  const [tab,        setTab]        = useState("equipe");
  const [filtro,     setFiltro]     = useState("Todos");
  const [busca,      setBusca]      = useState("");
  const [editando,   setEditando]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [erro,       setErro]       = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarColaboradores();
      setMembros(data.map(fromDb));
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // Carrega dados das abas sob demanda
  useEffect(() => {
    if (tab === "aloc" && !alocacoes.length) {
      setLoadAloc(true);
      listarAlocacoes().then(d => setAlocacoes(d)).catch(() => {}).finally(() => setLoadAloc(false));
    }
    if (tab === "horas" && !horas.length) {
      setLoadHoras(true);
      listarHoras().then(d => setHoras(d)).catch(() => {}).finally(() => setLoadHoras(false));
    }
    if (tab === "comp" && !certs.length) {
      setLoadComp(true);
      listarCertificacoes().then(d => setCerts(d)).catch(() => {}).finally(() => setLoadComp(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function salvar(m) {
    setSaving(true);
    setErro("");
    try {
      const payload = toDb({ ...m });
      if (m.id && !String(m.id).startsWith("tmp_")) {
        const updated = await atualizarColaborador(m.id, payload);
        setMembros(prev => prev.map(x => x.id === m.id ? fromDb(updated) : x));
      } else {
        const { id: _id, ...rest } = payload;
        const created = await criarColaborador(rest);
        setMembros(prev => [...prev, fromDb(created)]);
      }
      setEditando(null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deletar(id) {
    try {
      await deletarColaborador(id);
      setMembros(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      setErro(e.message);
    }
    setConfirmDel(null);
  }

  const ativos = membros.filter(m => m.status === "Ativo").length;
  const folha  = membros.reduce((s, m) => s + (m.salario || 0), 0);

  const lista = membros.filter(m => {
    if (filtro !== "Todos" && m.status !== filtro) return false;
    const q = busca.toLowerCase();
    if (busca && !m.nome.toLowerCase().includes(q) && !(m.cargo || "").toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 4, height: 42, borderRadius: 3, background: "var(--brick,#981915)", flexShrink: 0, marginTop: 2 }} />
          <div>
            <h1 style={{ fontFamily: "var(--cond,'Barlow Condensed',sans-serif)", fontWeight: 700, fontSize: 28, color: "var(--ink)", lineHeight: 1 }}>
              Equipe SF
            </h1>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: "#3f7a4b" }}>{ativos} ativos</span>
              <span>·</span>
              <span>Folha: <strong style={{ color: "var(--ink)" }}>{fmtBRL(folha)}</strong></span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setEditando({})}
            style={{ display: "inline-flex", alignItems: "center", gap: 7,
              background: "var(--brick,#981915)", color: "#fff", border: "none", borderRadius: 8,
              padding: "9px 18px", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <Ic n="plus" w={14} c="#fff" />
            Novo colaborador
          </button>
        </div>
      </div>

      {erro && (
        <div style={{ background: "#fdf0ef", border: "1px solid #f5c9c7", color: "#a33327",
          fontSize: 13, padding: "10px 14px", borderRadius: 9, marginBottom: 16 }}>{erro}</div>
      )}

      {/* Subtabs */}
      <div style={{ display: "flex", gap: 2, background: "var(--surface-2)", border: "1px solid var(--line)",
        borderRadius: 9, padding: 3, marginBottom: 18, flexWrap: "wrap", width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "6px 16px", borderRadius: 7, fontSize: 12.5, fontWeight: 600,
              color: tab === t.id ? "var(--ink)" : "var(--muted)",
              cursor: "pointer", border: "none", fontFamily: "inherit",
              background: tab === t.id ? "var(--surface)" : "transparent",
              boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,.08)" : "none",
              display: "flex", alignItems: "center", gap: 6, transition: "all .12s" }}>
            <Ic n={t.icon} w={13} c={tab === t.id ? "var(--ink)" : "var(--muted)"} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Equipe tab */}
      {tab === "equipe" && (
        <>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <Ic n="search" w={13} c="var(--muted)" />
            </span>
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome ou cargo…"
              style={{ width: "100%", background: "var(--surface)", border: "1.5px solid var(--line)",
                borderRadius: 9, padding: "10px 12px 10px 34px", fontFamily: "inherit", fontSize: 13,
                color: "var(--ink)", outline: "none" }}
              onFocus={e => { e.target.style.borderColor = "var(--brick,#981915)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--line)"; }} />
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {FILTROS.map(f => (
              <div key={f} onClick={() => setFiltro(f)}
                style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12.5, fontWeight: 600,
                  cursor: "pointer", border: `1.5px solid ${filtro === f ? "var(--ink)" : "var(--line)"}`,
                  background: filtro === f ? "var(--ink)" : "var(--surface)",
                  color: filtro === f ? "#fff" : "var(--muted)" }}>
                {f}
              </div>
            ))}
          </div>
          {loading ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>Carregando colaboradores…</div>
          ) : lista.length === 0 ? (
            <EmptyState icon="users" title="Nenhum colaborador"
              text="Clique em «Novo colaborador» para adicionar o primeiro membro da equipe."
              action="Novo colaborador" onAction={() => setEditando({})} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14 }}>
              {lista.map(m => (
                <CardMembro key={m.id} m={m}
                  onEdit={() => setEditando(m)}
                  onCracha={() => imprimirCracha(m)}
                  onDelete={() => setConfirmDel(m.id)} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "empr" && <EmptyState icon="wrench" title="Nenhum empreiteiro cadastrado"
        text="Cadastre empreiteiros e subempreiteiros para vincular às etapas da obra."
        action="Novo empreiteiro" onAction={() => {}} />}

      {tab === "aloc" && <TabAlocacoes alocacoes={alocacoes} loading={loadAloc} />}
      {tab === "horas" && <TabHoras horas={horas} loading={loadHoras} />}
      {tab === "comp"  && <TabCompliance certs={certs} loading={loadComp} />}

      {/* Modal */}
      {editando !== null && (
        <ModalMembro membro={editando} onSave={salvar} onClose={() => setEditando(null)} saving={saving} />
      )}

      {/* Confirm delete */}
      {confirmDel && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}
          onClick={() => setConfirmDel(null)}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, maxWidth: 360, width: "90%", textAlign: "center" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Remover colaborador?</div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>Essa ação não pode ser desfeita.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setConfirmDel(null)}
                style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid var(--line)",
                  background: "var(--surface)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={() => deletar(confirmDel)}
                style={{ padding: "8px 20px", borderRadius: 8, border: "none",
                  background: "#a33327", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
