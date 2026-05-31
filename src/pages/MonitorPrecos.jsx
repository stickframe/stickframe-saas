import { C } from "../utils/constants";

const materiais = [
  {
    nome: "Montante 90",
    atual: "R$ 42,00",
    anterior: "R$ 38,00",
    variacao: "+10,5%",
    status: "Alta",
  },
  {
    nome: "Guia 90",
    atual: "R$ 39,00",
    anterior: "R$ 39,00",
    variacao: "0%",
    status: "Estável",
  },
  {
    nome: "OSB 11mm",
    atual: "R$ 108,00",
    anterior: "R$ 115,00",
    variacao: "-6,1%",
    status: "Baixa",
  },
];

export default function MonitorPrecos() {
  return (
    <div style={{ padding: 24, background: "#f5f6f8", minHeight: "100vh" }}>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 800,
            color: C.text,
          }}
        >
          Monitor de Preços
        </h1>

        <p
          style={{
            marginTop: 8,
            color: C.muted,
          }}
        >
          Acompanhe a evolução dos materiais utilizados nas obras.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Card titulo="Variação Média" valor="+3,2%" />
        <Card titulo="Itens Monitorados" valor="127" />
        <Card titulo="Alertas Ativos" valor="18" />
        <Card titulo="Economia Potencial" valor="R$ 12.450" />
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,.05)",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 20,
            color: C.text,
          }}
        >
          Materiais Monitorados
        </h3>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={th}>Material</th>
              <th style={th}>Preço Atual</th>
              <th style={th}>30 Dias</th>
              <th style={th}>Variação</th>
              <th style={th}>Status</th>
            </tr>
          </thead>

          <tbody>
            {materiais.map((item) => (
              <tr key={item.nome}>
                <td style={td}>{item.nome}</td>
                <td style={td}>{item.atual}</td>
                <td style={td}>{item.anterior}</td>

                <td
                  style={{
                    ...td,
                    fontWeight: 700,
                    color:
                      item.variacao.includes("-")
                        ? "#16a34a"
                        : "#dc2626",
                  }}
                >
                  {item.variacao}
                </td>

                <td style={td}>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ titulo, valor }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 2px 8px rgba(0,0,0,.05)",
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: 14,
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 28,
          fontWeight: 800,
          color: "#981915",
        }}
      >
        {valor}
      </div>
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: 12,
  background: "#fafafa",
};

const td = {
  padding: 12,
  borderTop: "1px solid #eee",
};