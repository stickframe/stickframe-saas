import { useState } from "react";
import { C } from "../utils/constants";
import useAppStore from "../store/useAppStore";

const DOCS = [
  {
    id: "projeto",
    label: " Análise do Projeto",
    desc: "Arquitetura, módulos, banco de dados e oportunidades de melhoria",
    src: "/docs/analise-projeto.html",
  },
  {
    id: "procore",
    label: " StickFrame vs Procore",
    desc: "Comparativo técnico em 9 dimensões e roadmap para fechar o gap",
    src: "/docs/stickframe-vs-procore.html",
  },
  {
    id: "frontend",
    label: " Comparativo de Frontend",
    desc: "Análise visual e de UX dos principais produtos do mercado",
    src: "/docs/comparativo-frontend.html",
  },
];

export default function Analise() {
  const [ativo, setAtivo] = useState("projeto");
  const user = useAppStore((s) => s.user);

  if (user?.perfil !== "diretor") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 40 }}></div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Acesso restrito</div>
        <div style={{ fontSize: 13, color: C.muted }}>Esta área é exclusiva para o perfil Diretor.</div>
      </div>
    );
  }

  const doc = DOCS.find((d) => d.id === ativo);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)", gap: 0 }}>
      {/* Header */}
      <div style={{ padding: "20px 28px 0", flexShrink: 0 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>Análise & Roadmap</h1>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 16px" }}>Documentos internos de estratégia e análise técnica do produto.</p>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {DOCS.map((d) => (
            <button
              key={d.id}
              onClick={() => setAtivo(d.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: `1px solid ${ativo === d.id ? C.red : C.border}`,
                background: ativo === d.id ? C.red + "12" : "transparent",
                color: ativo === d.id ? C.red : C.muted,
                fontSize: 13,
                fontWeight: ativo === d.id ? 700 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all .15s",
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        {doc && (
          <div style={{ fontSize: 12, color: C.muted, marginTop: 8, marginBottom: 12 }}>
            {doc.desc}
          </div>
        )}
      </div>

      {/* iframe */}
      <div style={{ flex: 1, padding: "0 28px 20px", minHeight: 0 }}>
        <iframe
          key={ativo}
          src={doc?.src}
          style={{
            width: "100%",
            height: "100%",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            background: "#fff",
          }}
          title={doc?.label}
        />
      </div>
    </div>
  );
}
