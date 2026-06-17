import { useState, useEffect } from "react";
import { C } from "../../utils/constants";
import useAppStore from "../../store/useAppStore";
import { listarVencendoEm30Dias } from "../../services/repositories/certificacaoRepository";

export default function ComplianceNR() {
  const setActivePage = useAppStore((s) => s.setActivePage);
  const empresaId     = useAppStore((s) => s.empresaId);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!empresaId) return;
    listarVencendoEm30Dias()
      .then((certs) => {
        const hoje = new Date();
        setAlertas(
          (certs || []).map((c) => ({
            ...c,
            dias: Math.ceil((new Date(c.data_validade) - hoje) / 86400000),
          })).sort((a, b) => a.dias - b.dias)
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [empresaId]);

  if (loading) return null;

  return (
    <div className="sf-card" style={{ borderLeft: `4px solid ${alertas.length > 0 ? C.danger : C.success}` }}>
      <div className="sf-row-between" style={{ marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>Compliance NR</h3>
          <p className="sf-muted-sm">Alertas de certificação da equipe</p>
        </div>
        {alertas.length > 0 ? (
          <span className="badge badge-red">{alertas.length} Pendência{alertas.length !== 1 ? "s" : ""}</span>
        ) : (
          <span className="badge badge-green">100% Regular</span>
        )}
      </div>

      {alertas.length === 0 ? (
        <div className="empty-state" style={{ padding: "24px 0" }}>
          <div className="empty-state-icon" style={{ fontSize: 32 }}></div>
          <div className="empty-state-title" style={{ fontSize: 14 }}>Tudo certo por aqui</div>
          <p className="sf-muted-sm">Nenhuma certificação vence nos próximos 30 dias.</p>
        </div>
      ) : (
        <div className="sf-col-sm">
          {alertas.map((a) => (
            <div key={a.id} className="sf-row-between" style={{ padding: "10px 12px", background: "var(--surface-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <div className="sf-row">
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--muted)", fontSize: 13 }}>
                  {(a.colaborador?.nome || "?").charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{a.colaborador?.nome || "Colaborador"}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{a.colaborador?.cargo || ""}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ marginBottom: 4 }}>
                  <span className={`badge ${a.dias < 0 ? "badge-red" : "badge-yellow"}`} style={{ fontSize: 10, padding: "2px 8px" }}>{a.nr || "NR"}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: a.dias < 0 ? "var(--danger)" : "var(--warning)" }}>
                  {a.dias < 0 ? `Vencida há ${Math.abs(a.dias)} dias` : `Vence em ${a.dias} dias`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="sf-actions" style={{ marginTop: 16 }}>
        <button
          className="sf-btn sf-btn-ghost sf-btn-full"
          style={{ fontSize: 12 }}
          onClick={() => setActivePage("equipe")}
        >
          Ver matriz completa
        </button>
      </div>
    </div>
  );
}
