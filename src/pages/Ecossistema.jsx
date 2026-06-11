import { C } from "../utils/constants";
import useAppStore from "../store/useAppStore";

const ECOSYSTEM = [
  {
    brand: "StickScore™",
    label: "Saúde da Obra",
    icon: "🟢",
    desc: "Índice proprietário que mede a performance de cada obra em tempo real — cronograma, financeiro, compras, equipe e qualidade num único número de 0 a 100.",
    key: "obras",
    destaque: true,
  },
  {
    brand: "StickBrain™",
    label: "Inteligência Artificial",
    icon: "🧠",
    desc: "Motor de IA do StickFrame. Detecta riscos, sugere ações e gera análises automáticas baseadas nos dados reais da obra.",
    key: "inteligencia",
    destaque: true,
  },
  {
    brand: "StickView™",
    label: "Portal do Cliente",
    icon: "🏠",
    desc: "Espaço exclusivo para o cliente acompanhar o progresso da obra, aprovar documentos e receber atualizações — sem acesso ao sistema interno.",
    key: null,
    destaque: true,
  },
  {
    brand: "StickCash™",
    label: "Financeiro",
    icon: "💰",
    desc: "Controle completo de receitas e despesas por obra. Fluxo de caixa, margem real e alertas de desvio orçamentário.",
    key: "financeiro",
  },
  {
    brand: "StickLead™",
    label: "CRM / Clientes",
    icon: "🎯",
    desc: "Gestão de leads, pipeline comercial e relacionamento com clientes desde a prospecção até a obra concluída.",
    key: "crm",
  },
  {
    brand: "StickPlan™",
    label: "Cronograma",
    icon: "📋",
    desc: "Planejamento e acompanhamento do cronograma da obra. Marcos, fases e alertas de atraso em tempo real.",
    key: "cronograma",
  },
  {
    brand: "StickSupply™",
    label: "Almoxarifado",
    icon: "📦",
    desc: "Controle de compras, suprimentos e estoque. Gestão de pedidos, fornecedores e movimentação de materiais.",
    key: "suprimentos",
  },
  {
    brand: "StickInspect™",
    label: "Qualidade / FVS",
    icon: "🔍",
    desc: "Vistorias, Fichas de Verificação de Serviço e registro de não-conformidades. Rastreabilidade completa da qualidade executada.",
    key: "vistorias",
  },
  {
    brand: "StickTeam™",
    label: "Equipe",
    icon: "👥",
    desc: "Gestão de colaboradores, apontamentos de ponto, check-ins em obra e controle de escala e produtividade.",
    key: "equipe",
  },
  {
    brand: "StickPulse™",
    label: "Analytics",
    icon: "📊",
    desc: "Dashboard executivo com indicadores consolidados de toda a empresa — VGV, margens, performance e tendências.",
    key: "bi",
  },
];

export default function Ecossistema() {
  const setActivePage = useAppStore((s) => s.setActivePage);

  const destaques = ECOSYSTEM.filter(p => p.destaque);
  const demais    = ECOSYSTEM.filter(p => !p.destaque);

  return (
    <div style={{ padding: "20px 16px", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>
          StickFrame
        </div>
        <h1 style={{
          fontSize: 28, fontWeight: 900, margin: "0 0 8px",
          background: "linear-gradient(135deg, #981915 0%, #c0392b 40%, #4a9eff 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Ecossistema Stick™
        </h1>
        <p style={{ color: C.muted, fontSize: 13, maxWidth: 520, margin: "0 auto" }}>
          Uma suíte de ferramentas proprietárias projetada para a gestão completa de obras Steel Frame.
          Cada módulo tem identidade, metodologia e propósito próprios.
        </p>
      </div>

      {/* Destaques */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>
          Diferenciais proprietários
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {destaques.map((p) => (
            <ProductCard key={p.brand} p={p} onNavigate={p.key ? () => setActivePage(p.key) : null} highlight />
          ))}
        </div>
      </div>

      {/* Divisor */}
      <div style={{ height: 1, background: C.border, margin: "28px 0 20px" }} />

      {/* Restante */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>
          Módulos do ecossistema
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {demais.map((p) => (
            <ProductCard key={p.brand} p={p} onNavigate={p.key ? () => setActivePage(p.key) : null} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 40, padding: "20px 24px", borderRadius: 14,
        background: "linear-gradient(135deg, rgba(152,25,21,0.04), transparent)",
        border: `1px solid ${C.border}`, textAlign: "center",
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>
          Quanto maior o StickScore™, maior a previsibilidade e o controle da obra.
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>
          Metodologia proprietária StickFrame · Todos os módulos integrados em tempo real
        </div>
      </div>
    </div>
  );
}

function ProductCard({ p, onNavigate, highlight }) {
  return (
    <div
      onClick={onNavigate || undefined}
      style={{
        background: highlight
          ? "linear-gradient(135deg, #0f0f14 0%, #1a1a2e 100%)"
          : "#fff",
        border: `1px solid ${highlight ? "#98191530" : C.border}`,
        borderRadius: 14,
        padding: highlight ? "20px" : "16px",
        cursor: onNavigate ? "pointer" : "default",
        transition: "box-shadow .15s, transform .15s",
        boxShadow: highlight ? "0 4px 20px rgba(152,25,21,0.10)" : "none",
      }}
      onMouseEnter={e => {
        if (onNavigate) {
          e.currentTarget.style.boxShadow = highlight
            ? "0 8px 32px rgba(152,25,21,0.2)"
            : "0 4px 16px rgba(0,0,0,0.08)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = highlight ? "0 4px 20px rgba(152,25,21,0.10)" : "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ fontSize: highlight ? 28 : 22, flexShrink: 0, lineHeight: 1 }}>{p.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: highlight ? 14 : 12, fontWeight: 900,
            color: highlight ? "#fff" : C.text,
            marginBottom: 2,
          }}>
            {p.brand}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 600,
            color: highlight ? "rgba(255,255,255,0.45)" : C.muted,
            textTransform: "uppercase", letterSpacing: 0.5, marginBottom: highlight ? 10 : 6,
          }}>
            {p.label}
          </div>
          <div style={{
            fontSize: 11,
            color: highlight ? "rgba(255,255,255,0.55)" : C.muted,
            lineHeight: 1.55,
          }}>
            {p.desc}
          </div>
          {onNavigate && (
            <div style={{
              marginTop: 12, fontSize: 10, fontWeight: 700,
              color: highlight ? "rgba(255,255,255,0.3)" : C.muted,
            }}>
              Abrir →
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
