import { useState } from "react";
import { C } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";

const TIPO_CONFIG = {
  cliente:    { cor: "#2e9e5b", icone: "◈", label: "Cliente"    },
  orcamento:  { cor: "#981915", icone: "◻", label: "Orçamento"  },
  contrato:   { cor: "#c88a00", icone: "◑", label: "Contrato"   },
  financeiro: { cor: "#4a9eff", icone: "◉", label: "Financeiro" },
  obra:       { cor: "#414141", icone: "◆", label: "Obra"       },
};

const ACAO_CONFIG = {
  criado:   { cor: "#2e9e5b", label: "Criado"   },
  editado:  { cor: "#c88a00", label: "Editado"  },
  deletado: { cor: "#c0392b", label: "Deletado" },
  receita:  { cor: "#2e9e5b", label: "Receita"  },
  despesa:  { cor: "#981915", label: "Despesa"  },
  fase:     { cor: "#4a9eff", label: "Fase"     },
  aprovado: { cor: "#2e9e5b", label: "Aprovado" },
};

// Tipos visíveis por perfil — diretor vê tudo
const TIPOS_PERFIL = {
  engenheiro: ["obra"],
  comercial:  ["cliente", "orcamento"],
  financeiro: ["financeiro", "contrato"],
};

export default function Historico() {
  useModuleLoad("historico");
  const historico = useAppStore((s) => s.historico);
  const perfil    = useAppStore((s) => s.user?.perfil);

  const tiposPermitidos = TIPOS_PERFIL[perfil] || null; // null = todos (diretor)

  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busca,      setBusca]      = useState("");

  const itens = historico
    .filter((h) => !tiposPermitidos || tiposPermitidos.includes(h.tipo))
    .filter((h) => filtroTipo === "todos" || h.tipo === filtroTipo)
    .filter((h) => !busca || (h.descricao || h.desc || "").toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => b.id - a.id);

  const tipos = ["todos", ...(tiposPermitidos || ["cliente", "orcamento", "contrato", "financeiro", "obra"])];

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Histórico de Atividades</h2>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 22 }}>{historico.length} registros no sistema</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar no histórico..."
            style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tipos.map((t) => (
            <button key={t} onClick={() => setFiltroTipo(t)} style={{
              padding: "8px 14px", borderRadius: 8,
              border: `1px solid ${filtroTipo === t ? (TIPO_CONFIG[t]?.cor || C.red) : C.border}`,
              background: filtroTipo === t ? (TIPO_CONFIG[t]?.cor || C.red) + "18" : "transparent",
              color: filtroTipo === t ? (TIPO_CONFIG[t]?.cor || C.text) : C.muted,
              fontSize: 12, fontWeight: filtroTipo === t ? 700 : 400, cursor: "pointer", fontFamily: "inherit",
            }}>{t === "todos" ? "Todos" : TIPO_CONFIG[t]?.label || t}</button>
          ))}
        </div>
      </div>

      <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {itens.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: C.muted, fontSize: 13 }}>Nenhuma atividade encontrada.</div>
        ) : itens.map((h, i) => {
          const tc = TIPO_CONFIG[h.tipo] || { cor: C.muted, icone: "●", label: h.tipo };
          const ac = ACAO_CONFIG[h.acao] || { cor: C.muted, label: h.acao };
          return (
            <div key={h.id} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "14px 20px", borderBottom: i < itens.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: tc.cor + "22", border: `2px solid ${tc.cor}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: tc.cor, marginTop: 2 }}>{tc.icone}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ background: tc.cor + "22", color: tc.cor, border: `1px solid ${tc.cor}44`, borderRadius: 4, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>{tc.label}</span>
                  <span style={{ background: ac.cor + "22", color: ac.cor, border: `1px solid ${ac.cor}44`, borderRadius: 4, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>{ac.label}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{h.descricao || h.desc}</div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: h.detalhes?.campos?.length ? 8 : 0 }}>Por <strong style={{ color: C.text }}>{h.usuario}</strong> · {h.data} às {h.hora}</div>
                {h.detalhes?.campos?.map((c, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, marginTop: 4 }}>
                    <span style={{ color: C.muted, minWidth: 90 }}>{c.campo}</span>
                    <span style={{ background: "#f5e6e6", color: "#c0392b", borderRadius: 4, padding: "1px 8px", fontFamily: "monospace", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.de}</span>
                    <span style={{ color: C.muted }}>→</span>
                    <span style={{ background: "#e6f5ec", color: "#2e9e5b", borderRadius: 4, padding: "1px 8px", fontFamily: "monospace", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.para}</span>
                  </div>
                ))}
              </div>
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                <div style={{ fontSize: 11, color: C.muted }}>{h.data}</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{h.hora}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
