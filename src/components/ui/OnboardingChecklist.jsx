import { C } from "../../utils/constants";
import { getStepsForPerfil } from "../../store/slices/onboardingSlice";
import useAppStore from "../../store/useAppStore";

const TAG_MAP = {
  empresa: "configuracoes", cliente: "crm", orcamento: "orcamentos",
  obra: "obras", brain: "inteligencia", inteligencia: "inteligencia",
  crm: "crm", orcamentos: "orcamentos", financeiro: "financeiro",
  contratos: "contratos", orcamento_tecnico: "orcamento_tecnico",
  obras: "obras",
};

export default function OnboardingChecklist({ setActivePage }) {
  const progress = useAppStore((s) => s.onboardingProgress);
  const perfil = useAppStore((s) => s.user?.perfil);
  const steps = getStepsForPerfil(perfil);

  if (!progress || steps.every((s) => progress[s.key])) return null;

  const goToPage = (tag) => {
    const page = TAG_MAP[tag] || "dashboard";
    setActivePage?.(page);
  };

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
      padding: "20px 24px", boxShadow: "0 2px 8px rgba(40,30,20,0.08)",
      marginBottom: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Primeiros passos</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
            Complete os passos abaixo para configurar seu StickFrame
          </div>
        </div>
        <div style={{
          background: C.red, color: "#fff", fontSize: 11, fontWeight: 700,
          padding: "3px 10px", borderRadius: 10,
        }}>
          {steps.filter((s) => progress[s.key]).length}/{steps.length}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {steps.map((step) => {
          const done = progress[step.key];
          return (
            <div
              key={step.key}
              onClick={() => !done && goToPage(step.tag)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                background: done ? "#3f7a4b08" : "transparent",
                border: `1px solid ${done ? "#3f7a4b20" : C.border}`,
                cursor: done ? "default" : "pointer",
                transition: "all .15s",
                opacity: done ? 0.7 : 1,
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? C.success : C.border,
                color: done ? "#fff" : C.muted,
                fontSize: 11, fontWeight: 700,
              }}>
                {done ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <span>{steps.indexOf(step) + 1}</span>
                )}
              </div>
              <span style={{
                fontSize: 13, fontWeight: done ? 400 : 500, color: done ? C.success : C.text,
                textDecoration: done ? "line-through" : "none",
              }}>
                {step.label}
              </span>
              {!done && (
                <span style={{ marginLeft: "auto", fontSize: 11, color: C.steel, fontWeight: 600 }}>
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
