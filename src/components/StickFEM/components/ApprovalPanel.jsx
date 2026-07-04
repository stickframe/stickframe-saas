import { useState } from "react";
import { registrarAprovacao, atualizarStatusProjeto } from "../../../services/stickfem/repository";
import { CARD, INPUT, BTN_PRIMARY, BTN_GHOST } from "../utils/styles";

// ── 7 · Aprovação técnica (Fase 10) ──────────────────────────────────────────
export default function ApprovalPanel({ projeto, aprovacoes, onReload, onGerarMemorial }) {
  const [nome, setNome] = useState("");
  const [crea, setCrea] = useState("");
  const [obs, setObs] = useState("");
  const [busy, setBusy] = useState(false);

  async function registrar(status) {
    if (!nome) return;
    setBusy(true);
    try {
      await registrarAprovacao(projeto.id, { engenheiroNome: nome, engenheiroCrea: crea, status, observacoes: obs });
      if (status === "aprovado") await atualizarStatusProjeto(projeto.id, "aprovado");
      onReload();
      setNome(""); setCrea(""); setObs("");
    } finally { setBusy(false); }
  }

  return (
    <div style={{ ...CARD, marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted, #57514a)" }}>
          7 · Aprovação técnica <span style={{ fontWeight: 400, color: "var(--muted)" }}>(engenheiro revisa → aprova → emite documento)</span>
        </div>
        {onGerarMemorial && (
          <button onClick={onGerarMemorial} style={{ ...BTN_PRIMARY, background: "#6d557e" }}>📄 Gerar Memorial</button>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <input placeholder="Engenheiro responsável" value={nome} onChange={(e) => setNome(e.target.value)} style={INPUT} />
        <input placeholder="CREA / RRT" value={crea} onChange={(e) => setCrea(e.target.value)} style={{ ...INPUT, maxWidth: 160 }} />
        <input placeholder="Observações" value={obs} onChange={(e) => setObs(e.target.value)} style={{ ...INPUT, flex: 1, minWidth: 200 }} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => registrar("aprovado")} disabled={busy || !nome} style={{ ...BTN_PRIMARY, background: "#3f7a4b" }}>Aprovar</button>
        <button onClick={() => registrar("reprovado")} disabled={busy || !nome} style={{ ...BTN_GHOST, color: "#981915", borderColor: "#981915" }}>Reprovar</button>
      </div>
      {aprovacoes?.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12 }}>
          {aprovacoes.map((a) => (
            <div key={a.id} style={{ padding: "6px 0", borderTop: "1px solid var(--line)", color: "var(--text-muted, #57514a)" }}>
              <b style={{ color: a.status === "aprovado" ? "#3f7a4b" : "#981915" }}>{a.status}</b> — {a.engenheiro_nome}
              {a.engenheiro_crea ? ` (${a.engenheiro_crea})` : ""} {a.observacoes ? `· ${a.observacoes}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
