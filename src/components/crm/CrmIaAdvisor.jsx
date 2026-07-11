import { useState, useEffect } from "react";
import { C } from "../../utils/constants";
import { calcularLeadScore } from "../../utils/crm";

export default function CrmIaAdvisor({ lead, timeline }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, [lead.id]);

  const scoreObj = calcularLeadScore(lead, timeline);
  
  // Cálculo heurístico de probabilidade de fechamento
  const probabilidade = Math.min(
    Math.max(
      Math.round((scoreObj.score * 0.7) + (lead.status === "Negociação" ? 20 : lead.status === "Orçamento Enviado" ? 10 : 5)),
      10
    ),
    98
  );

  // Recomendações técnicas dinâmicas baseadas nos dados do lead
  const padrao = lead.padrao || "Padrão";
  const area = Number(lead.area || lead.area_m2 || 0);

  const recomendacoes = {
    abordagem: padrao === "Alto Padrão" 
      ? "Aborde com foco em exclusividade, conforto acústico das paredes duplas e alto nível de acabamento das fachadas em EIFS. Evite focar em custo inicial; foque no valor de entrega e tecnologia."
      : "Destaque a velocidade de entrega, ausência de desperdício na fundação e o custo-benefício por m² comparado com alvenaria tradicional.",
    riscos: [
      !lead.email && "Sem e-mail cadastrado (dificulta envio de propostas formais).",
      !lead.contato && "Sem telefone de contato válido.",
      area < 45 && "Área total simulada é baixa. Verifique se o cliente compreende o custo de mobilização para obras pequenas.",
      Number(lead.valor_max) < 120000 && "Expectativa de valor abaixo do custo médio de mercado para construção a seco."
    ].filter(Boolean),
    argumentos: padrao === "Alto Padrão"
      ? [
          "Isolamento térmico superior que reduz em até 40% o gasto com ar-condicionado.",
          "Esquadrias termoacústicas que complementam o sistema Light Steel Framing.",
          "Precisão milimétrica que evita retrabalho em revestimentos nobres."
        ]
      : [
          "Construção até 3 vezes mais rápida que a alvenaria.",
          "Obra limpa e ecologicamente correta (redução de 90% no uso de água).",
          "Orçamento fechado e sem surpresas com compras adicionais de material."
        ]
  };

  if (recomendacoes.riscos.length === 0) {
    recomendacoes.riscos.push("Nenhum risco crítico de contato detectado.");
  }

  const sectionStyle = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "14px 16px",
    marginBottom: 12
  };

  const titleStyle = { fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, margin: "0 0 8px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeIn 0.25s ease-out" }}>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "20px 0", alignItems: "center", color: C.muted }}>
          <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTopColor: C.purple, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 700 }}>Inteligência StickBrain™ qualificando perfil comercial...</span>
        </div>
      ) : (
        <>
          {/* Probabilidade de Fechamento */}
          <div style={{ ...sectionStyle, background: C.purple + "08", borderColor: C.purple + "22", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ ...titleStyle, color: C.purple }}>Probabilidade de Fechamento</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.purple }}>{probabilidade}%</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>Status do Score</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: scoreObj.cor }}>⭐ {scoreObj.score} — {scoreObj.nivel}</div>
            </div>
          </div>

          {/* Resumo e Abordagem */}
          <div style={sectionStyle}>
            <h4 style={titleStyle}>🎯 Melhor Abordagem Comercial</h4>
            <p style={{ fontSize: 12, color: C.text, lineHeight: 1.5, margin: 0 }}>
              {recomendacoes.abordagem}
            </p>
          </div>

          {/* Argumentos Técnicos */}
          <div style={sectionStyle}>
            <h4 style={titleStyle}>🛠️ Argumentos Técnicos para Usar</h4>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: C.text, display: "flex", flexDirection: "column", gap: 6 }}>
              {recomendacoes.argumentos.map((arg, idx) => (
                <li key={idx} style={{ lineHeight: 1.4 }}>{arg}</li>
              ))}
            </ul>
          </div>

          {/* Riscos */}
          <div style={{ ...sectionStyle, borderColor: C.danger + "22", background: C.danger + "04" }}>
            <h4 style={{ ...titleStyle, color: C.danger }}>⚠️ Riscos Identificados</h4>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: C.text, display: "flex", flexDirection: "column", gap: 4 }}>
              {recomendacoes.riscos.map((risk, idx) => (
                <li key={idx} style={{ color: C.text, lineHeight: 1.4 }}>{risk}</li>
              ))}
            </ul>
          </div>

          {/* Checklist Pré-Ligação */}
          <div style={sectionStyle}>
            <h4 style={titleStyle}>📋 Checklist Pré-Ligação</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" defaultChecked={false} />
                <span>Confirmar se o cliente já possui terreno próprio e limpo</span>
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" defaultChecked={false} />
                <span>Validar a topografia e a cidade da obra (regras de recuo)</span>
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" defaultChecked={false} />
                <span>Oferecer envio do memorial de acabamento padrão <strong>{padrao}</strong></span>
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
