import { useState } from "react";
import useAppStore from "../store/useAppStore";

//  Inline SVG Icon helper 
const PATHS = {
  cube3d:  <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
  refresh: <><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>,
  pin:     <><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
  eye:     <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  home:    <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>,
  upload:  <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  plus:    <path d="M12 5v14M5 12h14"/>,
  layers:  <><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>,
  tag:     <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
  alert:   <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  clip:    <><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></>,
};

function Ic({ n, w = 15, c }) {
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
      {PATHS[n]}
    </svg>
  );
}

//  KPI data 
const KPIS_INIT = [
  { v: 0, l: "Modelos 3D",       c: "var(--steel, #3b6ea5)" },
  { v: 0, l: "Apontamentos",     c: "var(--ink-2, #57514a)" },
  { v: 0, l: "Alta prioridade",  c: "var(--neg, #a33327)" },
  { v: 0, l: "Resolvidos",       c: "var(--pos, #3f7a4b)" },
];

//  Shared button components 
function BtnPrimary({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        background: "var(--brick)", color: "#fff", border: "none", borderRadius: 8,
        padding: "9px 18px", fontFamily: "inherit", fontSize: 13, fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function BtnGhost({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        background: "var(--surface)", color: "var(--ink-2)",
        border: "1.5px solid var(--line)", borderRadius: 8,
        padding: "8px 14px", fontFamily: "inherit", fontSize: 13, fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

//  Empty state card 
function EmptyBox({ icon, title, sub, children, style }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--line)",
      borderRadius: 14,
      padding: "64px 40px",
      textAlign: "center",
      ...style,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: "var(--surface-2)", border: "1px solid var(--line)",
        display: "grid", placeItems: "center", margin: "0 auto 20px",
      }}>
        <Ic n={icon} w={28} c="var(--muted)" />
      </div>
      <div style={{ fontWeight: 700, fontSize: 22, color: "var(--ink)", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--muted)", maxWidth: 340, margin: "0 auto 24px", lineHeight: 1.65 }}>{sub}</div>
      {children}
    </div>
  );
}

//  Sub-tab: Modelos 
function TabModelos() {
  return (
    <EmptyBox
      icon="cube3d"
      title="Nenhum modelo importado"
      sub="Importe arquivos .IFC ou .DAE para visualizar em 3D e vincular às fases da obra."
    >
      <BtnPrimary>
        <Ic n="upload" w={14} c="#fff" /> Importar primeiro modelo
      </BtnPrimary>
    </EmptyBox>
  );
}

//  Sub-tab: Revisões 
function TabRevisoes() {
  return (
    <EmptyBox
      icon="refresh"
      title="Nenhuma revisão registrada"
      sub="Revisões de projeto aparecem aqui após a importação do primeiro modelo IFC."
    >
      <BtnGhost>
        <Ic n="upload" w={14} /> Importar modelo
      </BtnGhost>
    </EmptyBox>
  );
}

//  Sub-tab: Apontamentos 
function TabApontamentos() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>Nenhum apontamento criado</div>
        <BtnPrimary>
          <Ic n="plus" w={14} c="#fff" /> Novo apontamento
        </BtnPrimary>
      </div>
      <EmptyBox
        icon="pin"
        title="Sem apontamentos"
        sub="Apontamentos são marcações de não-conformidade, tarefas ou observações vinculadas ao modelo 3D."
        style={{ padding: "48px 40px" }}
      >
        <BtnGhost>
          <Ic n="alert" w={14} /> Ver como vincular ao modelo
        </BtnGhost>
      </EmptyBox>
    </div>
  );
}

//  Sub-tab: Viewer 3D 
function TabViewer() {
  const tools = [
    { ic: "layers", l: "Plantas por pavimento", s: "Separar modelo por andar" },
    { ic: "tag",    l: "Elementos marcados",     s: "Apontamentos no modelo" },
    { ic: "eye",    l: "Visibilidade",           s: "Ocultar camadas por tipo" },
  ];

  return (
    <div>
      {/* viewer placeholder */}
      <div style={{
        background: "var(--graphite, #2b2b2e)",
        borderRadius: 14, height: 420,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 14, position: "relative", overflow: "hidden",
      }}>
        {/* grid overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)",
            display: "grid", placeItems: "center",
          }}>
            <Ic n="cube3d" w={28} c="rgba(255,255,255,.4)" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, color: "rgba(255,255,255,.6)", letterSpacing: 0.5 }}>Viewer 3D</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.35)", textAlign: "center", maxWidth: 300, lineHeight: 1.6 }}>
            Importe um modelo .IFC ou .DAE para visualizar a estrutura em 3D e vincular apontamentos.
          </div>
          <BtnPrimary>
            <Ic n="upload" w={14} c="#fff" /> Importar modelo
          </BtnPrimary>
        </div>
      </div>

      {/* tool cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 14 }}>
        {tools.map((t) => (
          <div key={t.l} style={{
            background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10,
            padding: "14px 16px", display: "flex", gap: 12, alignItems: "center",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: "var(--surface-2)",
              display: "grid", placeItems: "center", flexShrink: 0,
            }}>
              <Ic n={t.ic} w={15} c="var(--steel, #3b6ea5)" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{t.l}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{t.s}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

//  Sub-tab: Preview Kit 
function TabPreviewKit() {
  return (
    <div>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14,
        padding: "22px 24px", marginBottom: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: "var(--brick-soft, #f3e7e5)", display: "grid", placeItems: "center",
          }}>
            <Ic n="home" w={18} c="var(--brick)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "var(--ink)" }}>Preview Kit — Steel Frame</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Visualização prévia da estrutura modular por ambiente</div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.7, maxWidth: 580 }}>
          O Preview Kit gera uma visualização esquemática dos painéis e composições Steel Frame com base nos dados do Orçamento SF.
          Disponível após vincular um projeto de orçamento.
        </p>
      </div>
      <EmptyBox
        icon="home"
        title="Nenhum projeto vinculado"
        sub="Vincule um projeto do Orçamento SF para gerar o Preview Kit automaticamente."
        style={{ padding: "48px 40px" }}
      >
        <BtnGhost>
          <Ic n="clip" w={14} /> Ir para Orçamento SF
        </BtnGhost>
      </EmptyBox>
    </div>
  );
}

//  Tab config 
const TABS = [
  { id: "modelos",      l: "Modelos",      icon: "cube3d"   },
  { id: "revisoes",     l: "Revisões",     icon: "refresh"  },
  { id: "apontamentos", l: "Apontamentos", icon: "pin"      },
  { id: "viewer",       l: "Viewer 3D",    icon: "eye"      },
  { id: "preview",      l: "Preview Kit",  icon: "home"     },
];

//  Main export 
export default function BimSF() {
  const [tab, setTab] = useState("modelos");
  const obras = useAppStore((s) => s.obras);
  const obraAtual = obras[0];

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20,
      }}>
        <div>
          <h1 style={{ fontWeight: 700, fontSize: 28, color: "var(--ink)", lineHeight: 1, margin: 0 }}>BIM</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Modelos IFC · Visualização 3D · Apontamentos</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <BtnGhost>
            <Ic n="plus" w={14} /> Apontamento
          </BtnGhost>
          <BtnPrimary>
            <Ic n="upload" w={14} c="#fff" /> Importar modelo
          </BtnPrimary>
        </div>
      </div>

      {/* Obra chip */}
      {obraAtual && (
        <div style={{
          display: "inline-flex", alignItems: "center",
          background: "var(--brick-soft, #f3e7e5)", border: "1.5px solid var(--brick)",
          borderRadius: 8, padding: "5px 12px",
          fontSize: 12.5, fontWeight: 800, color: "var(--brick)",
          marginBottom: 20, letterSpacing: 0.3,
        }}>
          {obraAtual.nome?.toUpperCase()}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {KPIS_INIT.map((k) => (
          <div key={k.l} style={{
            background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "18px 20px",
          }}>
            <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1, marginBottom: 4, color: k.c }}>{k.v}</div>
            <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--line)", marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "14px 18px 13px",
              fontSize: 13, fontWeight: 600,
              color: tab === t.id ? "var(--brick)" : "var(--muted)",
              background: "none", border: "none",
              borderBottom: tab === t.id ? "2.5px solid var(--brick)" : "2.5px solid transparent",
              cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
              marginBottom: -2,
            }}
          >
            <Ic n={t.icon} w={13} c={tab === t.id ? "var(--brick)" : "var(--muted)"} />
            {t.l}
          </button>
        ))}
      </div>

      {tab === "modelos"      && <TabModelos />}
      {tab === "revisoes"     && <TabRevisoes />}
      {tab === "apontamentos" && <TabApontamentos />}
      {tab === "viewer"       && <TabViewer />}
      {tab === "preview"      && <TabPreviewKit />}
    </div>
  );
}
