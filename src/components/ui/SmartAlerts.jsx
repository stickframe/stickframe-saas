import { useEffect, useState } from "react";
import { gerarAlertas } from "../../services/smartNotifications";
import useAppStore from "../../store/useAppStore";

const URGENCIA_COLOR = {
  alta:  { bg: "#fde8e8", text: "#8b1515", border: "#a33327" },
  media: { bg: "#fff8e1", text: "#7a5400", border: "#b07a1e" },
  baixa: { bg: "#f0f4ff", text: "#2c4a9e", border: "#4a7af8" },
};

export default function SmartAlerts({ onNavigate }) {
  const [alertas, setAlertas] = useState([]);
  const [dismissed, setDismissed] = useState([]);
  const [loading, setLoading] = useState(true);
  const empresaId = useAppStore((s) => s.empresaId);

  useEffect(() => {
    if (!empresaId) return;
    const dismissed_key = `sf_dismissed_${empresaId}`;
    const prev = JSON.parse(localStorage.getItem(dismissed_key) || "[]");
    setDismissed(prev);

    gerarAlertas(empresaId)
      .then((result) => setAlertas(result.filter((a) => !prev.includes(`${a.tipo}:${a.obraId || a.clienteId || ""}`))))
      .finally(() => setLoading(false));
  }, [empresaId]);

  const dismiss = (alerta) => {
    const key = `${alerta.tipo}:${alerta.obraId || alerta.clienteId || ""}`;
    const next = [...dismissed, key];
    setDismissed(next);
    localStorage.setItem(`sf_dismissed_${empresaId}`, JSON.stringify(next));
    setAlertas((prev) => prev.filter((a) => `${a.tipo}:${a.obraId || a.clienteId || ""}` !== key));
  };

  if (loading || !alertas.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
      {alertas.slice(0, 5).map((alerta, i) => {
        const colors = URGENCIA_COLOR[alerta.urgencia] || URGENCIA_COLOR.media;
        return (
          <div
            key={i}
            style={{
              background: colors.bg, color: colors.text,
              borderLeft: `3px solid ${colors.border}`,
              borderRadius: 8, padding: "10px 14px",
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{alerta.titulo}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>{alerta.mensagem}</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              {onNavigate && alerta.link && (
                <button
                  onClick={() => onNavigate(alerta.link)}
                  style={{
                    background: colors.border, color: "#fff",
                    border: "none", borderRadius: 5, padding: "3px 10px",
                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Ver
                </button>
              )}
              <button
                onClick={() => dismiss(alerta)}
                style={{
                  background: "none", border: "none",
                  color: colors.text, cursor: "pointer",
                  fontSize: 16, lineHeight: 1, opacity: 0.6,
                  padding: "2px 4px",
                }}
                title="Dispensar"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
