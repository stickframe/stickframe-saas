import { useMemo } from "react";
import { calcularStickScore } from "../../utils/stickScore";
import useAppStore from "../../store/useAppStore";

const DIMS = [
  { key: "cronograma", label: "Crono",   cor: "#3b6ea5" },
  { key: "financeiro", label: "Finan",   cor: "#059669" },
  { key: "compras",    label: "Compras", cor: "#b07a1e" },
  { key: "equipe",     label: "Equipe",  cor: "#7c3aed" },
  { key: "qualidade",  label: "Qual",    cor: "#db2777" },
];

function MiniRing({ total, cor, size = 44 }) {
  const r = (size / 2) - 4;
  const circ = 2 * Math.PI * r;
  const dash = (total / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={cor} strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

export default function StickScoreBenchmark({ obras, financeiroPorObra = {}, medicoesPorObra = {}, alocacoesPorObra = {}, diarioPorObra = {} }) {
  const plano      = useAppStore((s) => s.user?.plano);
  const setActivePage = useAppStore((s) => s.setActivePage);

  const scored = useMemo(() => {
    const ativos = obras.filter(o => o.status === "Em andamento" || o.status === "Pausada");
    return ativos.map(o => {
      const score = calcularStickScore(o, {
        financeiro: financeiroPorObra[o.id]?.lancamentos || [],
        medicoes:   medicoesPorObra[o.id] || [],
        membros:    alocacoesPorObra[o.id] || [],
        diario:     diarioPorObra[o.id] || [],
      });
      return { ...o, score };
    }).sort((a, b) => b.score.total - a.score.total);
  }, [obras, financeiroPorObra, medicoesPorObra, alocacoesPorObra, diarioPorObra]);

  if (scored.length < 2) return null;

  const isLocked = plano === "free";
  const mediaTotal = Math.round(scored.reduce((s, o) => s + o.score.total, 0) / scored.length);
  const melhor = scored[0];
  const pior   = scored[scored.length - 1];

  return (
    <div className="sf-card" style={{ position: "relative", overflow: isLocked ? "hidden" : "visible" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 2 }}>
            Benchmark de Obras
          </h3>
          <p className="sf-muted-sm">Comparativo StickScore™ — obras ativas</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--muted)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 20, padding: "2px 10px" }}>
            Média <strong style={{ color: "var(--text)" }}>{mediaTotal}</strong>
          </span>
        </div>
      </div>

      {/* Ranking */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {scored.map((o, i) => {
          const medal = i === 0 ? "" : i === 1 ? "" : i === 2 ? "" : null;
          const isFirst = i === 0;
          const isLast  = i === scored.length - 1;
          const barPct  = (o.score.total / 100) * 100;

          return (
            <div key={o.id}
              style={{
                background: isFirst ? `${o.score.cor}12` : "var(--surface-2)",
                border: `1px solid ${isFirst ? o.score.cor + "33" : "var(--border)"}`,
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
              }}
              onClick={() => setActivePage("obras")}
            >
              {/* Posição */}
              <div style={{ fontSize: 16, width: 22, textAlign: "center", flexShrink: 0 }}>
                {medal || <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>{i + 1}</span>}
              </div>

              {/* Ring */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <MiniRing total={o.score.total} cor={o.score.cor} />
                <span style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)",
                  fontSize: 11, fontWeight: 900, color: o.score.cor,
                }}>
                  {o.score.total}
                </span>
              </div>

              {/* Nome + barra */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {o.nome}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20,
                    background: o.score.cor + "22", color: o.score.cor, border: `1px solid ${o.score.cor}44`,
                    flexShrink: 0,
                  }}>
                    {o.score.nivel}
                  </span>
                  {isLast && scored.length > 2 && (
                    <span style={{ fontSize: 9, color: "var(--danger)", fontWeight: 700, flexShrink: 0 }}>MENOR</span>
                  )}
                </div>
                {/* Barra de progresso */}
                <div style={{ height: 4, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${barPct}%`, background: o.score.cor, borderRadius: 4, transition: "width 0.8s ease" }} />
                </div>
              </div>

              {/* Mini dim scores */}
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                {DIMS.map(d => (
                  <div key={d.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <div style={{
                      width: 6, height: Math.max(4, ((o.score.scores[d.key] || 0) / 100) * 24),
                      background: (o.score.scores[d.key] || 0) < 50 ? "var(--danger)" : d.cor,
                      borderRadius: 2, transition: "height 0.5s ease",
                    }} />
                    <span style={{ fontSize: 7, color: "var(--muted)" }}>{d.label.slice(0, 3)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight rápido */}
      {melhor && pior && melhor.id !== pior.id && (
        <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--surface-2)", borderRadius: "var(--radius-md)", fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
          {pior.score.total < 60
            ? ` ${pior.nome} está em nível ${pior.score.nivel} — requer atenção nas dimensões mais baixas.`
            : ` ${melhor.nome} lidera com ${melhor.score.total} pts. Diferença de ${melhor.score.total - pior.score.total} pts para a última posição.`
          }
        </div>
      )}

      {/* Lock overlay */}
      {isLocked && (
        <div style={{
          position: "absolute", inset: 0, backdropFilter: "blur(6px)",
          background: "rgba(0,0,0,0.45)", borderRadius: "var(--radius-lg)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, zIndex: 10,
        }}>
          <span style={{ fontSize: 28 }}></span>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>Benchmark disponível no plano PRO</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: 0 }}>Compare o desempenho entre todas as suas obras</p>
        </div>
      )}
    </div>
  );
}
