import { useState } from "react";

//  Design tokens via CSS vars 
// --brick:#981915  --graphite:#2b2b2e  --ink:#26231f  --ink-2:#57514a
// --muted:#8c847a  --line:#e7e1d8  --bg:#f4f1ec  --surface:#fff  --surface-2:#faf8f4

//  SVG icon helper 
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
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={c || "currentColor"}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: w, height: w, flexShrink: 0 }}
    >
      {P[n]}
    </svg>
  );
}

//  Mock data 
const MEMBROS = [
  { id: 1, nome: "AJUDANTE - 1",            cargo: "AJUDANTE",    area: "Ajudante",      salario: 150,  status: "Ativo", nrs: [],                                                              email: "",                          tel: "" },
  { id: 2, nome: "ANDRE QUEIROZ CANDIDO",   cargo: "DIRETOR",     area: "Administração", salario: 300,  status: "Ativo", nrs: ["Habilitação","NR-35","NR-12","NR-18","NR-10","NR-6","ASO"],   email: "andre@stickframe.com.br",    tel: "" },
  { id: 3, nome: "EDUARDO MORAES DO PRADO", cargo: "PCP",         area: "Montador",      salario: 350,  status: "Ativo", nrs: ["NR-5","NR-18","ASO","NR-35","Habilitação","NR-6","NR-12"],    email: "",                          tel: "",  cargo_extra: "Planejamento e Controle da Produção" },
  { id: 4, nome: "JONATHAN DE SOUZA",       cargo: "CEO",         area: "Administração", salario: 300,  status: "Ativo", nrs: [],                                                              email: "jonathan@stickframe.com.br", tel: "+1 732 862-7054" },
  { id: 5, nome: "MONTADOR 1",              cargo: "MONTADOR",    area: "Montador",      salario: 200,  status: "Ativo", nrs: [],                                                              email: "",                          tel: "" },
  { id: 6, nome: "MONTADOR 2",              cargo: "MONTADOR",    area: "Montador",      salario: 220,  status: "Ativo", nrs: [],                                                              email: "",                          tel: "" },
  { id: 7, nome: "MONTADOR 3",              cargo: "MONTADOR",    area: "Montador",      salario: 250,  status: "Ativo", nrs: [],                                                              email: "",                          tel: "" },
  { id: 8, nome: "PCP - OBRAS",             cargo: "PCP - OBRAS", area: "Outro",         salario: 350,  status: "Ativo", nrs: [],                                                              email: "",                          tel: "" },
];

const TABS = [
  { id: "equipe", label: "Equipe",       icon: "users" },
  { id: "empr",   label: "Empreiteiros", icon: "wrench" },
  { id: "aloc",   label: "Alocações",    icon: "calendar" },
  { id: "horas",  label: "Horas",        icon: "clock" },
  { id: "comp",   label: "Compliance",   icon: "shield" },
];

const FILTROS = ["Todos", "Ativo", "Férias", "Afastado", "Inativo"];

function fmtBRL(v) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

//  Sub-components 
function StatusPill({ status }) {
  const styles = {
    Ativo:    { background: "#e8f3eb", color: "#3f7a4b" },
    Férias:   { background: "#fef5e7", color: "#b07a1e" },
    Afastado: { background: "#fef5e7", color: "#b07a1e" },
    Inativo:  { background: "var(--surface-2)", color: "var(--muted)" },
  };
  const s = styles[status] || styles.Inativo;
  return (
    <span style={{ ...s, fontSize: 10.5, fontWeight: 800, padding: "3px 9px", borderRadius: 5 }}>
      {status}
    </span>
  );
}

function CardMembro({ m }) {
  const initials = m.nome.split(" ").slice(0, 2).map(w => w[0]).join("");
  return (
    <div
      style={{
        background: "var(--surface)", border: "1.5px solid var(--line)", borderRadius: 14,
        padding: 18, display: "flex", flexDirection: "column", transition: "box-shadow .12s",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 3px 14px rgba(0,0,0,.07)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: "#f3e7e5",
            display: "grid", placeItems: "center",
            fontFamily: "'Barlow Condensed', var(--cond, sans-serif)",
            fontWeight: 700, fontSize: 16, color: "var(--brick, #981915)",
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{
              fontFamily: "'Barlow Condensed', var(--cond, sans-serif)",
              fontWeight: 700, fontSize: 17, color: "var(--ink)",
              letterSpacing: .3, lineHeight: 1.2, marginBottom: 2,
            }}>{m.nome}</div>
            <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{m.cargo} · {m.area}</div>
          </div>
        </div>
        <StatusPill status={m.status} />
      </div>

      {/* Contact */}
      {(m.email || m.tel) && (
        <div style={{ marginBottom: 8 }}>
          {m.email && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <Ic n="mail" w={12} c="var(--muted)" />
              <span style={{ fontSize: 11.5, color: "var(--ink-2, #57514a)" }}>{m.email}</span>
            </div>
          )}
          {m.tel && (
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Ic n="phone" w={12} c="var(--muted)" />
              <span style={{ fontSize: 12, color: "var(--ink-2, #57514a)" }}>{m.tel}</span>
            </div>
          )}
        </div>
      )}

      {/* Salary */}
      <div style={{
        fontFamily: "'Barlow Condensed', var(--cond, sans-serif)",
        fontSize: 20, fontWeight: 700, color: "var(--ink)", margin: "10px 0",
      }}>
        {fmtBRL(m.salario)}
      </div>

      {/* NR badges */}
      {m.nrs.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
          {m.nrs.map(nr => (
            <span key={nr} style={{
              fontSize: 9.5, fontWeight: 800, padding: "3px 7px", borderRadius: 5,
              background: "#eef3f9", color: "#3b6ea5", letterSpacing: .4,
            }}>{nr}</span>
          ))}
        </div>
      )}

      {/* Cargo extra */}
      {m.cargo_extra && (
        <div style={{ marginBottom: 8 }}>
          <span style={{
            fontSize: 10.5, fontWeight: 600, padding: "4px 10px", borderRadius: 6,
            background: "var(--surface-2)", color: "var(--ink-2, #57514a)",
            border: "1px solid var(--line)", display: "inline-block",
          }}>{m.cargo_extra}</span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
        {[
          { icon: "pencil", label: "Editar" },
          { icon: "badge",  label: "Crachá" },
          { icon: "globe",  label: "Portal" },
        ].map(a => (
          <button
            key={a.label}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "6px 10px", borderRadius: 7, fontFamily: "inherit",
              fontSize: 11.5, fontWeight: 700, cursor: "pointer",
              border: "1.5px solid var(--line)", background: "var(--surface)",
              color: "var(--ink-2, #57514a)", transition: "all .12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--brick, #981915)"; e.currentTarget.style.color = "var(--brick, #981915)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink-2, #57514a)"; }}
          >
            <Ic n={a.icon} w={11} />
            {a.label}
          </button>
        ))}
        <button
          style={{
            background: "var(--surface)", border: "1.5px solid var(--line)",
            color: "#a33327", borderRadius: 7, width: 30, height: 30,
            display: "grid", placeItems: "center", cursor: "pointer",
            transition: "all .12s", marginLeft: "auto",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fdf0ef"; e.currentTarget.style.borderColor = "#a33327"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--line)"; }}
        >
          <Ic n="trash" w={12} c="#a33327" />
        </button>
      </div>
    </div>
  );
}

function TabEquipe({ filtro, busca }) {
  const lista = MEMBROS.filter(m => {
    const matchFiltro = filtro === "Todos" || m.status === filtro;
    const q = busca.toLowerCase();
    const matchBusca  = !busca || m.nome.toLowerCase().includes(q) || m.cargo.toLowerCase().includes(q);
    return matchFiltro && matchBusca;
  });

  if (lista.length === 0) {
    return (
      <EmptyState
        icon="users"
        title="Nenhum colaborador"
        text={`Nenhum colaborador encontrado com os filtros selecionados.`}
      />
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
      {lista.map(m => <CardMembro key={m.id} m={m} />)}
    </div>
  );
}

function EmptyState({ icon, title, text, action }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14,
      padding: "56px 40px", textAlign: "center",
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, background: "var(--surface-2)",
        border: "1px solid var(--line)", display: "grid", placeItems: "center",
        margin: "0 auto 18px",
      }}>
        <Ic n={icon} w={28} c="var(--muted)" />
      </div>
      <div style={{
        fontFamily: "'Barlow Condensed', var(--cond, sans-serif)",
        fontWeight: 700, fontSize: 20, color: "var(--ink)", marginBottom: 8,
      }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--muted)", maxWidth: 340, margin: "0 auto 20px" }}>{text}</div>
      {action && (
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          background: "var(--brick, #981915)", color: "#fff", border: "none", borderRadius: 8,
          padding: "9px 18px", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>
          <Ic n="plus" w={14} c="#fff" /> {action}
        </button>
      )}
    </div>
  );
}

//  Main page 
export default function EquipeSF() {
  const [tab, setTab]     = useState("equipe");
  const [filtro, setFiltro] = useState("Todos");
  const [busca, setBusca]   = useState("");

  const ativos = MEMBROS.filter(m => m.status === "Ativo").length;
  const folha  = MEMBROS.reduce((s, m) => s + m.salario, 0);

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', var(--cond, sans-serif)",
            fontWeight: 700, fontSize: 28, color: "var(--ink)", lineHeight: 1,
          }}>Equipe SF</h1>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontWeight: 700, color: "#3f7a4b" }}>{ativos} ativos</span>
            <span>·</span>
            <span>Folha: <strong style={{ color: "var(--ink)" }}>{fmtBRL(folha)}</strong></span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "var(--surface)", color: "#3f7a4b",
              border: "1.5px solid #b8dfc2", borderRadius: 8,
              padding: "8px 14px", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer",
              transition: "background .14s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#e8f3eb"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--surface)"; }}
          >
            <Ic n="dollar" w={14} c="#3f7a4b" />
            Lançar folha ({fmtBRL(folha)})
          </button>
          <button
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "var(--brick, #981915)", color: "#fff", border: "none", borderRadius: 8,
              padding: "9px 18px", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer",
              transition: "background .14s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#7d1411"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--brick, #981915)"; }}
          >
            <Ic n="plus" w={14} c="#fff" />
            Novo colaborador
          </button>
        </div>
      </div>

      {/* Subtabs pill-style */}
      <div style={{
        display: "flex", gap: 2, background: "var(--surface-2)",
        border: "1px solid var(--line)", borderRadius: 9, padding: 3,
        marginBottom: 18, flexWrap: "wrap", width: "fit-content",
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "6px 16px", borderRadius: 7,
              fontSize: 12.5, fontWeight: 600,
              color: tab === t.id ? "var(--ink)" : "var(--muted)",
              cursor: "pointer", border: "none", fontFamily: "inherit",
              background: tab === t.id ? "var(--surface)" : "transparent",
              boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,.08)" : "none",
              display: "flex", alignItems: "center", gap: 6,
              transition: "all .12s",
            }}
          >
            <Ic n={t.icon} w={13} c={tab === t.id ? "var(--ink)" : "var(--muted)"} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Search + filter chips (equipe tab only) */}
      {tab === "equipe" && (
        <>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <Ic n="search" w={13} c="var(--muted)" />
            </span>
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome ou cargo…"
              style={{
                width: "100%", background: "var(--surface)", border: "1.5px solid var(--line)",
                borderRadius: 9, padding: "10px 12px 10px 34px",
                fontFamily: "inherit", fontSize: 13, color: "var(--ink)", outline: "none",
                transition: "border-color .12s",
              }}
              onFocus={e => { e.target.style.borderColor = "var(--brick, #981915)"; }}
              onBlur={e =>  { e.target.style.borderColor = "var(--line)"; }}
            />
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {FILTROS.map(f => (
              <div
                key={f}
                onClick={() => setFiltro(f)}
                style={{
                  padding: "5px 14px", borderRadius: 20, fontSize: 12.5, fontWeight: 600,
                  cursor: "pointer", transition: "all .12s",
                  border: `1.5px solid ${filtro === f ? "var(--ink)" : "var(--line)"}`,
                  background: filtro === f ? "var(--ink)" : "var(--surface)",
                  color: filtro === f ? "#fff" : "var(--muted)",
                }}
              >
                {f}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tab content */}
      {tab === "equipe" && <TabEquipe filtro={filtro} busca={busca} />}
      {tab === "empr" && (
        <EmptyState
          icon="wrench"
          title="Nenhum empreiteiro cadastrado"
          text="Cadastre empreiteiros e subempreiteiros para vincular às etapas da obra."
          action="Novo empreiteiro"
        />
      )}
      {tab === "aloc" && (
        <EmptyState
          icon="calendar"
          title="Sem alocações registradas"
          text="Aloque colaboradores e empreiteiros a fases da obra para controlar presença e produtividade."
        />
      )}
      {tab === "horas" && (
        <EmptyState
          icon="clock"
          title="Nenhuma hora lançada"
          text="Lançamentos de horas extras, banco de horas e apuração de ponto aparecem aqui."
        />
      )}
      {tab === "comp" && (
        <EmptyState
          icon="shield"
          title="Compliance em dia"
          text="Vencimentos de NRs, ASO, habilitações e outros documentos serão exibidos aqui conforme os dados dos colaboradores."
        />
      )}
    </div>
  );
}
