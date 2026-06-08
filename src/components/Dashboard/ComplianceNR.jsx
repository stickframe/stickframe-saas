import React from "react";
import { diffDias } from "../../utils/date";
import { C } from "../../utils/constants";

// Mock de dados (normalmente viria do backend Supabase)
const mockEquipe = [
  {
    id: 1,
    nome: "Marcos Paulo",
    cargo: "Montador de Estrutura",
    nrs: [
      { norma: "NR-35", validade: "20/05/2026" }, // Vencida
      { norma: "NR-18", validade: "15/12/2026" }  // Vigente
    ]
  },
  {
    id: 2,
    nome: "João Souza",
    cargo: "Eletricista",
    nrs: [
      { norma: "NR-10", validade: "15/06/2026" }  // Vencendo (hoje é 08/06/2026)
    ]
  },
  {
    id: 3,
    nome: "Carlos Silva",
    cargo: "Supervisor",
    nrs: [
      { norma: "NR-18", validade: "10/11/2026" }, // Vigente
      { norma: "NR-33", validade: "05/01/2027" }  // Vigente
    ]
  }
];

function getStatusNR(dataValidadeBR) {
  const dias = diffDias(dataValidadeBR);
  if (dias === null) return { class: "badge-gray", label: "Sem data", dias };
  if (dias < 0) return { class: "badge-red", label: "Vencida", dias };
  if (dias <= 30) return { class: "badge-yellow", label: "Vencendo", dias };
  return { class: "badge-green", label: "Vigente", dias };
}

export default function ComplianceNR() {
  // Filtrar apenas NRs vencidas ou vencendo (<= 30 dias) para o alerta
  const alertas = [];
  mockEquipe.forEach(colab => {
    colab.nrs.forEach(nr => {
      const status = getStatusNR(nr.validade);
      if (status.dias !== null && status.dias <= 30) {
        alertas.push({ colab, nr, status });
      }
    });
  });

  // Ordenar: Vencidas primeiro (menor número de 'dias')
  alertas.sort((a, b) => a.status.dias - b.status.dias);

  return (
    <div className="sf-card" style={{ borderLeft: `4px solid ${alertas.length > 0 ? C.danger : C.success}` }}>
      <div className="sf-row-between" style={{ marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>Compliance NR</h3>
          <p className="sf-muted-sm">Alertas de certificação da equipe</p>
        </div>
        {alertas.length > 0 ? (
          <span className="badge badge-red">{alertas.length} Pendências</span>
        ) : (
          <span className="badge badge-green">100% Regular</span>
        )}
      </div>

      {alertas.length === 0 ? (
        <div className="empty-state" style={{ padding: "24px 0" }}>
          <div className="empty-state-icon" style={{ fontSize: 32 }}>🛡️</div>
          <div className="empty-state-title" style={{ fontSize: 14 }}>Tudo certo por aqui</div>
          <p className="sf-muted-sm">Nenhuma certificação vence nos próximos 30 dias.</p>
        </div>
      ) : (
        <div className="sf-col-sm">
          {alertas.map((alerta, idx) => (
            <div key={idx} className="sf-row-between" style={{ padding: "10px 12px", background: "var(--surface-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <div className="sf-row">
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--muted)", fontSize: 13 }}>
                  {alerta.colab.nome.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{alerta.colab.nome}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{alerta.colab.cargo}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ marginBottom: 4 }}>
                  <span className={`badge ${alerta.status.class}`} style={{ fontSize: 10, padding: "2px 8px" }}>{alerta.nr.norma}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: alerta.status.dias < 0 ? "var(--danger)" : "var(--warning)" }}>
                  {alerta.status.dias < 0 ? `Vencida há ${Math.abs(alerta.status.dias)} dias` : `Vence em ${alerta.status.dias} dias`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="sf-actions" style={{ marginTop: 16 }}>
        <button className="sf-btn sf-btn-ghost sf-btn-full" style={{ fontSize: 12 }}>
          Ver matriz completa
        </button>
      </div>
    </div>
  );
}
