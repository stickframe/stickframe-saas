import { useState } from "react";
import { C } from "../../utils/constants";

// ─── Pricing constants (same as CalculadoraPublica) ──────────────────────────
const STEEL_FRAME = { "Econômico": 2800, "Padrão": 3500, "Alto Padrão": 5200 };
const ALVENARIA   = { "Econômico": 2200, "Padrão": 2900, "Alto Padrão": 4200 };

const PADROES = ["Econômico", "Padrão", "Alto Padrão"];

function fmtBRL(v) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function CalculadoraRapida() {
  const [area, setArea]     = useState(120);
  const [padrao, setPadrao] = useState("Padrão");
  const [resultado, setResultado] = useState(null);

  function calcular(e) {
    e.preventDefault();
    const sfValor = area * STEEL_FRAME[padrao];
    const alValor = area * ALVENARIA[padrao];
    setResultado({ sf: sfValor, al: alValor });
  }

  return (
    <div style={{
      background: C.surface,
      borderRadius: 16,
      border: `1px solid ${C.border}`,
      borderTop: `3px solid ${C.red}`,
      padding: 20,
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    }}>
      {/* Título */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: C.muted, marginBottom: 14 }}>
        SIMULACAO RAPIDA
      </div>

      <form onSubmit={calcular}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* Área */}
          <div style={{ flex: "1 1 100px", minWidth: 90 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 6, letterSpacing: 0.5 }}>
              AREA (m²)
            </label>
            <input
              type="number"
              min={20}
              max={2000}
              value={area}
              onChange={(e) => { setArea(Number(e.target.value)); setResultado(null); }}
              required
              style={{
                width: "100%",
                border: `1.5px solid ${C.border}`,
                borderRadius: 8,
                padding: "9px 12px",
                fontSize: 14,
                fontFamily: "inherit",
                color: C.text,
                background: C.surface,
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = C.red)}
              onBlur={(e)  => (e.target.style.borderColor = C.border)}
            />
          </div>

          {/* Padrão */}
          <div style={{ flex: "1 1 130px", minWidth: 120 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 6, letterSpacing: 0.5 }}>
              PADRAO
            </label>
            <select
              value={padrao}
              onChange={(e) => { setPadrao(e.target.value); setResultado(null); }}
              style={{
                width: "100%",
                border: `1.5px solid ${C.border}`,
                borderRadius: 8,
                padding: "9px 12px",
                fontSize: 14,
                fontFamily: "inherit",
                color: C.text,
                background: C.surface,
                outline: "none",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              {PADROES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>

          {/* Botão */}
          <div style={{ flex: "0 0 auto" }}>
            <button
              type="submit"
              style={{
                background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 800,
                fontFamily: "inherit",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 3px 12px rgba(152,25,21,0.35)",
                transition: "opacity .15s",
              }}
              onMouseEnter={(e) => (e.target.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.target.style.opacity = "1")}
            >
              Calcular
            </button>
          </div>
        </div>
      </form>

      {/* Resultado */}
      {resultado && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginTop: 16,
        }}>
          {/* Steel Frame */}
          <div style={{
            borderRadius: 12,
            padding: "14px 16px",
            border: `2px solid ${C.red}`,
            background: `rgba(152,25,21,0.04)`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.red, letterSpacing: 1, marginBottom: 6 }}>
              STEEL FRAME
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text, lineHeight: 1.1 }}>
              {fmtBRL(resultado.sf)}
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
              ≈ {fmtBRL(STEEL_FRAME[padrao])}/m²
            </div>
            <div style={{
              display: "inline-block",
              marginTop: 8,
              fontSize: 10,
              fontWeight: 700,
              background: C.red,
              color: "#fff",
              borderRadius: 20,
              padding: "2px 8px",
            }}>
              Recomendado
            </div>
          </div>

          {/* Alvenaria */}
          <div style={{
            borderRadius: 12,
            padding: "14px 16px",
            border: `1.5px solid ${C.border}`,
            background: C.surface,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>
              ALVENARIA
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text, lineHeight: 1.1 }}>
              {fmtBRL(resultado.al)}
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
              ≈ {fmtBRL(ALVENARIA[padrao])}/m²
            </div>
            {resultado.sf < resultado.al ? (
              <div style={{ fontSize: 10, color: C.success, fontWeight: 700, marginTop: 8 }}>
                SF {Math.round(((resultado.al - resultado.sf) / resultado.al) * 100)}% mais econômico
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
