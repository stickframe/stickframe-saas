import { useState } from "react";
import { C } from "../utils/constants";

const DOCS = [
  {
    id: "projeto",
    label: "📋 Análise do Projeto",
    desc: "Arquitetura, módulos, banco de dados e oportunidades de melhoria",
    src: "/docs/analise-projeto.html",
  },
  {
    id: "procore",
    label: "⚔️ StickFrame vs Procore",
    desc: "Comparativo técnico em 9 dimensões e roadmap para fechar o gap",
    src: "/docs/stickframe-vs-procore.html",
  },
  {
    id: "frontend",
    label: "🎨 Comparativo de Frontend",
    desc: "Análise visual e de UX dos principais produtos do mercado",
    src: "/docs/comparativo-frontend.html",
  },
];

export default function AnalisePublica() {
  const [ativo, setAtivo] = useState("projeto");
  const doc = DOCS.find((d) => d.id === ativo);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f5f6f8", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{
        background: "#fff", borderBottom: `1px solid ${C.border}`,
        padding: "14px 28px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0,
      }}>
        <img src="/logo.png" alt="StickFrame" style={{ height: 32 }} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Análise & Roadmap</div>
          <div style={{ fontSize: 11, color: C.muted }}>Documentos técnicos — StickFrame Gestão</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: "16px 28px 0", flexShrink: 0, background: "#f5f6f8" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {DOCS.map((d) => (
            <button
              key={d.id}
              onClick={() => setAtivo(d.id)}
              style={{
                padding: "8px 16px", borderRadius: 10, cursor: "pointer",
                border: `1px solid ${ativo === d.id ? C.red : C.border}`,
                background: ativo === d.id ? C.red + "12" : "#fff",
                color: ativo === d.id ? C.red : C.muted,
                fontSize: 13, fontWeight: ativo === d.id ? 700 : 400,
                fontFamily: "inherit", transition: "all .15s",
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
        {doc && (
          <div style={{ fontSize: 12, color: C.muted, marginTop: 8, marginBottom: 12 }}>{doc.desc}</div>
        )}
      </div>

      {/* iframe */}
      <div style={{ flex: 1, padding: "0 28px 20px", minHeight: 0 }}>
        <iframe
          key={ativo}
          src={doc?.src}
          style={{
            width: "100%", height: "100%",
            border: `1px solid ${C.border}`, borderRadius: 12, background: "#fff",
          }}
          title={doc?.label}
        />
      </div>
    </div>
  );
}
