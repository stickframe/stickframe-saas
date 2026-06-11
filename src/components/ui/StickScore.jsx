import { useState, useEffect } from "react";
import { STICK_SCORE_DIMENSOES, carregarHistoricoScore, gerarInsights } from "../../utils/stickScore";
import useAppStore from "../../store/useAppStore";
import ModalUpgradePro from "./ModalUpgradePro";

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

// Mini gráfico de linha do histórico mensal
function HistoryChart({ historico, cor }) {
  if (!historico || historico.length < 2) return null;
  const W = 220, H = 52;
  const vals = historico.map(h => h.total);
  const min = Math.max(0, Math.min(...vals) - 10);
  const max = Math.min(100, Math.max(...vals) + 5);
  const range = max - min || 1;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 8);
    return { x, y, v, mes: historico[i].mes };
  });
  const polyline = pts.map(p => `${p.x},${p.y}`).join(" ");
  const area = `M ${polyline.replace(/ /g, " L ")} L ${W},${H} L 0,${H} Z`;

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
        Evolução mensal
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="ss-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={cor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#ss-grad)" />
        <polyline points={polyline} fill="none" stroke={cor} strokeWidth="1.5" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 3 : 2}
            fill={i === pts.length - 1 ? cor : "rgba(255,255,255,0.3)"} />
        ))}
      </svg>
      {/* Labels meses */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {historico.map((h, i) => (
          <span key={i} style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>
            {h.mes.slice(5)}
          </span>
        ))}
      </div>
    </div>
  );
}

// Painel de insights automáticos
function InsightsPanel({ insights }) {
  if (!insights || insights.length === 0) return null;
  const style = {
    positivo: { bg: "#2e9e5b20", border: "#2e9e5b40", color: "#6ee7b7", icon: "↑" },
    negativo:  { bg: "#98191520", border: "#98191540", color: "#fca5a5", icon: "↓" },
    alerta:    { bg: "#b07a1e20", border: "#b07a1e40", color: "#fcd34d", icon: "⚠" },
    dica:      { bg: "#3b6ea520", border: "#3b6ea540", color: "#93c5fd", icon: "💡" },
  };
  return (
    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
      {insights.map((ins, i) => {
        const s = style[ins.tipo] || style.dica;
        return (
          <div key={i} style={{
            padding: "8px 10px", borderRadius: 8,
            background: s.bg, border: `1px solid ${s.border}`,
            fontSize: 11, color: s.color, lineHeight: 1.45,
            display: "flex", gap: 6, alignItems: "flex-start",
          }}>
            <span style={{ flexShrink: 0, fontSize: 12 }}>{s.icon}</span>
            <span>{ins.texto}</span>
          </div>
        );
      })}
    </div>
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
  const plano = useAppStore(s => s.user?.plano);
  const empresaId = useAppStore(s => s.empresaId);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    if (empresaId && obra?.id) {
      setHistorico(carregarHistoricoScore(empresaId, obra.id));
    }
  }, [empresaId, obra?.id]);

  if (!score) return null;

  if (plano === "free") {
    return (
      <>
        {showUpgrade && <ModalUpgradePro onClose={() => setShowUpgrade(false)} />}
        <div style={{
          background: "linear-gradient(135deg, #0f0f14, #1a1a2e)",
          borderRadius: 20, padding: "24px", border: "1px solid #981915" + "40",
          boxShadow: "0 8px 32px rgba(152,25,21,0.15)", color: "#fff",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ filter: "blur(6px)", opacity: 0.3, pointerEvents: "none" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#981915", textTransform: "uppercase", marginBottom: 8 }}>StickScore™</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: "#981915" }}>??</div>
          </div>
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 12, padding: 24,
          }}>
            <div style={{ fontSize: 28 }}>🔒</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 4 }}>StickScore™ exclusivo PRO</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                Monitore a saúde de cada obra com pontuação em tempo real
              </div>
            </div>
            <button onClick={() => setShowUpgrade(true)} style={{
              padding: "10px 20px", background: "#981915", border: "none",
              borderRadius: 10, color: "#fff", fontWeight: 800, fontSize: 13,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 4px 16px rgba(152,25,21,0.4)",
            }}>
              Upgrade para PRO →
            </button>
          </div>
        </div>
      </>
    );
  }

  const { total, scores, cor, nivel } = score;
  const insights = gerarInsights(score, historico);

  // Delta em relação ao mês anterior
  const delta = historico.length >= 2
    ? total - historico[historico.length - 2].total
    : null;

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

      {/* Nivel pill + delta */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: cor + "20", border: `1px solid ${cor}40`,
          borderRadius: 20, padding: "4px 12px",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: cor }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: cor }}>{nivel}</span>
        </div>
        {delta !== null && (
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: delta >= 0 ? "#6ee7b7" : "#fca5a5",
            display: "flex", alignItems: "center", gap: 3,
          }}>
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)} pts vs mês anterior
          </div>
        )}
      </div>

      {/* Dimensões */}
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

      {/* Gráfico de evolução */}
      <HistoryChart historico={historico} cor={cor} />

      {/* Insights automáticos */}
      <InsightsPanel insights={insights} />

      {total < 70 && insights.length === 0 && (
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

// Hero para o Dashboard — score consolidado da empresa
export function StickScoreHero({ obras, financeiroPorObra = {} }) {
  const empresaId = useAppStore(s => s.empresaId);
  const plano = useAppStore(s => s.user?.plano);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const obrasAtivas = obras.filter(o => o.status === "Em andamento");
  if (obrasAtivas.length === 0) return null;

  // Score médio ponderado pelo valor do contrato
  const scores = obrasAtivas.map(o => {
    const fins = Object.values(financeiroPorObra[o.id] || {}).flat?.() ||
                 (financeiroPorObra[o.id]?.lancamentos || []);
    return calcularStickScoreLocal(o, fins);
  });

  const totalPeso = obrasAtivas.reduce((s, o) => s + (o.contrato || 1), 0);
  const scoreGlobal = Math.round(
    scores.reduce((s, sc, i) => s + sc.total * ((obrasAtivas[i].contrato || 1) / totalPeso), 0)
  );

  // Delta: compara com histórico de cada obra
  const deltas = obrasAtivas.map((o, i) => {
    const hist = carregarHistoricoScore(empresaId, o.id);
    if (hist.length < 2) return null;
    return hist[hist.length - 1].total - hist[hist.length - 2].total;
  }).filter(d => d !== null);
  const deltaGlobal = deltas.length > 0
    ? Math.round(deltas.reduce((s, d) => s + d, 0) / deltas.length)
    : null;

  const { nivel, cor } = classGlobal(scoreGlobal);

  if (plano === "free") {
    return (
      <>
        {showUpgrade && <ModalUpgradePro onClose={() => setShowUpgrade(false)} />}
        <div
          onClick={() => setShowUpgrade(true)}
          style={{
            background: "linear-gradient(135deg, #0f0f14, #1a1a2e)",
            borderRadius: 16, padding: "20px 24px", marginBottom: 20, cursor: "pointer",
            border: "1px solid #981915" + "30", display: "flex", alignItems: "center", gap: 16,
          }}
        >
          <div style={{ fontSize: 28 }}>🔒</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#981915", textTransform: "uppercase" }}>StickScore™</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Índice de performance — exclusivo PRO</div>
          </div>
          <div style={{ marginLeft: "auto", padding: "6px 14px", background: "#981915", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700 }}>
            Desbloquear
          </div>
        </div>
      </>
    );
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, #0f0f14 0%, #1a1a2e 100%)",
      borderRadius: 16, padding: "20px 24px", marginBottom: 20,
      border: `1px solid ${cor}30`, boxShadow: `0 4px 24px ${cor}15`,
      display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
    }}>
      {/* Anel */}
      <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <ScoreRing total={scoreGlobal} cor={cor} size={72} />
        <div style={{ position: "absolute", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: cor, lineHeight: 1 }}>{scoreGlobal}</div>
          <div style={{ fontSize: 7, color: "rgba(255,255,255,0.35)" }}>/ 100</div>
        </div>
      </div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: cor, textTransform: "uppercase", marginBottom: 2 }}>
          StickScore™
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{nivel}</span>
          {deltaGlobal !== null && (
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: deltaGlobal >= 0 ? "#6ee7b7" : "#fca5a5",
            }}>
              {deltaGlobal >= 0 ? "↑ +" : "↓ "}{deltaGlobal} pts nos últimos 30 dias
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
          Média ponderada de {obrasAtivas.length} obra{obrasAtivas.length !== 1 ? "s" : ""} ativas
        </div>
      </div>

      {/* Mini score por obra */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {obrasAtivas.slice(0, 4).map((o, i) => {
          const sc = scores[i];
          return (
            <div key={o.id} style={{
              background: sc.cor + "18", border: `1px solid ${sc.cor}30`,
              borderRadius: 10, padding: "8px 12px", textAlign: "center", minWidth: 56,
            }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: sc.cor }}>{sc.total}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 2, maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {o.nome}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function calcularStickScoreLocal(obra, fins) {
  // Re-importar seria circular, então inline o cálculo de total ponderado simplificado
  const receitas = fins.filter(f => f.tipo === "receita").reduce((s, f) => s + (Number(f.valor) || 0), 0);
  const despesas = fins.filter(f => f.tipo === "despesa").reduce((s, f) => s + (Number(f.valor) || 0), 0);
  const contrato = Number(obra.contrato) || 0;
  let finScore = 72;
  if (contrato > 0 && despesas > 0) {
    const m = (receitas - despesas) / contrato;
    finScore = m > 0.25 ? 100 : m > 0.15 ? 90 : m > 0.05 ? 76 : m > 0 ? 60 : m > -0.1 ? 40 : 20;
  }
  let cronScore = 70;
  if (obra.prazo_inicio && obra.prazo_fim) {
    const hoje = new Date();
    const totalDias = Math.max(1, (new Date(obra.prazo_fim) - new Date(obra.prazo_inicio)) / 86400000);
    const diasPassados = Math.max(0, (hoje - new Date(obra.prazo_inicio)) / 86400000);
    const esperado = Math.min(100, (diasPassados / totalDias) * 100);
    const delta = (obra.progresso ?? 0) - esperado;
    cronScore = delta >= 10 ? 100 : delta >= 0 ? 85 + (delta / 10) * 15 : delta >= -15 ? 65 + ((delta + 15) / 15) * 20 : 40;
  } else if (obra.progresso != null) {
    cronScore = Math.min(95, 55 + obra.progresso * 0.4);
  }
  const total = Math.round(cronScore * 0.25 + finScore * 0.30 + 68 * 0.20 + 68 * 0.15 + 68 * 0.10);
  return { total: Math.min(100, Math.max(0, total)), ...classGlobal(total) };
}

function classGlobal(total) {
  if (total >= 90) return { nivel: "Elite",     cor: "#059669" };
  if (total >= 80) return { nivel: "Excelente", cor: "#2e9e5b" };
  if (total >= 70) return { nivel: "Bom",       cor: "#3b6ea5" };
  if (total >= 60) return { nivel: "Atenção",   cor: "#b07a1e" };
  return             { nivel: "Crítico",         cor: "#981915" };
}
