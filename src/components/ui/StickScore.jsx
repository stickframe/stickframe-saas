import { STICK_SCORE_DIMENSOES } from "../../utils/stickScore";

function ScoreRing({ total, cor, size = 80 }) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const dash = (total / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={cor} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
    </svg>
  );
}

export function StickScoreBadge({ score, size = "md" }) {
  if (!score) return null;
  const { total, cor, nivel } = score;
  const sm = size === "sm";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: sm ? 6 : 8,
      background: cor + "12", border: `1px solid ${cor}30`,
      borderRadius: sm ? 8 : 10, padding: sm ? "4px 8px" : "6px 12px",
    }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ScoreRing total={total} cor={cor} size={sm ? 36 : 48} />
        <div style={{ position: "absolute", textAlign: "center" }}>
          <div style={{ fontSize: sm ? 9 : 11, fontWeight: 900, color: cor, lineHeight: 1 }}>{total}</div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: sm ? 8 : 9, fontWeight: 700, color: cor, letterSpacing: 1, textTransform: "uppercase" }}>StickScore™</div>
        <div style={{ fontSize: sm ? 10 : 12, fontWeight: 700, color: "#1a1a2e" }}>{nivel}</div>
      </div>
    </div>
  );
}

export function StickScoreCard({ score, obra }) {
  if (!score) return null;
  const { total, scores, cor, nivel } = score;

  return (
    <div style={{
      background: `linear-gradient(135deg, #0f0f14 0%, #1a1a2e 100%)`,
      borderRadius: 20, padding: "24px",
      border: `1px solid ${cor}30`,
      boxShadow: `0 8px 32px ${cor}20`,
      color: "#fff",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: cor, textTransform: "uppercase", marginBottom: 4 }}>
            StickScore™
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{obra?.nome}</div>
        </div>
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <ScoreRing total={total} cor={cor} size={80} />
          <div style={{ position: "absolute", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: cor, lineHeight: 1 }}>{total}</div>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", letterSpacing: 0.5 }}>/ 100</div>
          </div>
        </div>
      </div>

      {/* Nivel pill */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: cor + "20", border: `1px solid ${cor}40`,
        borderRadius: 20, padding: "4px 12px", marginBottom: 20,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: cor }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: cor }}>{nivel}</span>
      </div>

      {/* Dimensões com barras */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {STICK_SCORE_DIMENSOES.map(({ key, label, peso }) => {
          const val = scores[key] ?? 0;
          const barCor =
            val >= 90 ? "#2e9e5b" :
            val >= 75 ? "#3b6ea5" :
            val >= 60 ? "#b07a1e" : "#981915";
          return (
            <div key={key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
                  {label}
                  <span style={{ marginLeft: 6, fontSize: 9, opacity: 0.4 }}>{peso}</span>
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, color: barCor }}>{val}</span>
              </div>
              <div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${val}%`,
                  background: `linear-gradient(90deg, ${barCor}99, ${barCor})`,
                  borderRadius: 3, transition: "width 0.7s ease",
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerta se baixo */}
      {total < 70 && (
        <div style={{
          marginTop: 16, padding: "10px 12px", borderRadius: 10,
          background: "#981915" + "20", border: "1px solid #981915" + "40",
          fontSize: 11, color: "#ffb3b0", lineHeight: 1.5,
        }}>
          ⚠️ StickScore abaixo de 70 — verifique cronograma e financeiro desta obra.
        </div>
      )}
    </div>
  );
}

export function StickScoreInline({ score }) {
  if (!score) return null;
  const { total, cor, nivel } = score;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 38, height: 38, borderRadius: "50%",
        background: cor + "18", border: `2px solid ${cor}50`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: cor }}>{total}</span>
      </div>
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color: cor, letterSpacing: 1, textTransform: "uppercase" }}>StickScore™</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#444" }}>{nivel}</div>
      </div>
    </div>
  );
}
