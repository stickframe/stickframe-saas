import { C } from "../../utils/constants";
import useAppStore from "../../store/useAppStore";
import { getStepsForPerfil } from "../../store/slices/onboardingSlice";

const ACHIEVEMENTS = [
  { key: "primeiro_orcamento", icon: "💰", label: "Primeiro orçamento criado", check: (p, o) => o?.length > 0 },
  { key: "primeira_obra", icon: "🏗", label: "Primeira obra iniciada", check: (p, o) => o?.length > 0 },
  { key: "usou_stickquote", icon: "📐", label: "StickQuote utilizado", check: (p, o) => false },
  { key: "conheceu_stickbrain", icon: "🧠", label: "StickBrain ativado", check: (p, o) => false },
  { key: "aprovou_medicao", icon: "✅", label: "Medição aprovada", check: (p, o) => false },
  { key: "assinou_contrato", icon: "📝", label: "Contrato assinado", check: (p, o) => false },
];

export default function SeuProgresso({ setActivePage, clientes, orcamentos, obras }) {
  const progress = useAppStore((s) => s.onboardingProgress);
  const perfil = useAppStore((s) => s.user?.perfil);
  const steps = getStepsForPerfil(perfil);

  const doneSteps = steps.filter((s) => progress[s.key]).length;
  const totalSteps = steps.length;
  const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;
  const allDone = doneSteps === totalSteps && totalSteps > 0;

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--line)",
      borderRadius: "var(--radius-lg,16px)",
      padding: "18px 20px", marginBottom: 16,
      boxShadow: "0 1px 2px rgba(40,30,20,.04), 0 6px 16px rgba(40,30,20,.06)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 5, height: 28, borderRadius: 3, background: "#981915", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink,#26231f)" }}>
              {allDone ? "StickFrame completo!" : "Seu progresso"}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>
              {allDone
                ? "Você já explorou todos os passos principais"
                : `${doneSteps} de ${totalSteps} passos concluídos`
              }
            </div>
          </div>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: pct >= 100 ? C.success + "1a" : C.brickSoft,
          color: pct >= 100 ? C.success : C.red,
          fontSize: 16, fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif",
          position: "relative",
        }}>
          {pct}%
        </div>
      </div>

      <div style={{ height: 6, background: "var(--line)", borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
        <div style={{
          height: 6, width: `${pct}%`,
          background: pct >= 100 ? C.success : "linear-gradient(90deg, #c0892d, #981915)",
          borderRadius: 3, transition: "width .5s ease",
        }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {steps.map((step) => {
          const done = progress[step.key];
          return (
            <div key={step.key} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 8,
              background: done ? "rgba(63,122,75,.06)" : "transparent",
              border: `1px solid ${done ? "rgba(63,122,75,.15)" : "var(--line)"}`,
              cursor: done ? "default" : "pointer",
              opacity: done ? 0.75 : 1,
              transition: "all .12s",
            }}
              onClick={() => { if (!done) setActivePage?.(step.tag); }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? C.success : "var(--line)",
                color: done ? "#fff" : "var(--muted)",
                fontSize: 10, fontWeight: 700,
              }}>
                {done ? "✓" : steps.indexOf(step) + 1}
              </div>
              <span style={{
                fontSize: 12.5, fontWeight: done ? 400 : 500,
                color: done ? C.success : "var(--ink,#26231f)",
                textDecoration: done ? "line-through" : "none",
              }}>
                {step.label}
              </span>
              {!done && (
                <span style={{ marginLeft: "auto", fontSize: 10.5, color: C.steel, fontWeight: 600 }}>
                  Ir →
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
