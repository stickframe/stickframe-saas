import React from 'react';

const TH = { textAlign: "left", padding: "7px 10px", fontSize: 11, color: "var(--muted)", fontWeight: 700 };
const TD = { padding: "6px 10px", fontSize: 12 };

/**
 * Tabela de Pré-Dimensionamento (Fase 7)
 * Exibe a análise preliminar dos elementos estruturais.
 */
const PreDimensionamentoUI = ({ analise }) => {
  if (!analise || analise.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700, margin: '0 0 10px 0' }}>
        Análise de Pré-Dimensionamento
      </h3>
      <div style={{ maxHeight: 400, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-2)" }}>
              {['Elemento', 'Perfil', 'Vão (m)', 'Altura (m)', 'Esbeltez (λ)', 'Peso (kg)'].map(h => <th key={h} style={TH}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {analise.map((item, i) => (
              <tr key={i} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={TD}>{item.elemento_nome}</td>
                <td style={TD}>
                  <span title={`Status: ${item.status}`}>{item.perfil}</span>
                </td>
                <td style={TD}>{item.vao}</td>
                <td style={TD}>{item.altura}</td>
                <td style={TD}>{item.esbeltez > 0 ? item.esbeltez : 'N/A'}</td>
                <td style={TD}>{item.peso}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: '8px' }}>
        * Valores de pré-dimensionamento. Não substituem a análise FEM definitiva.
      </p>
    </div>
  );
};

export default PreDimensionamentoUI;
