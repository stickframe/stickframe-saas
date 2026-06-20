import { useMemo } from "react";
import { calcularStickScore } from "../../utils/stickScore";

export default function AtencaoHoje({ obras, financeiro, medicoes, kpis, setActivePage }) {
  const alertas = useMemo(() => {
    const list = [];
    const hoje = new Date().toISOString().slice(0, 10);

    // 1. Obras atrasadas
    const atrasadas = obras.filter(
      (o) =>
        o.prazo_fim &&
        o.prazo_fim < hoje &&
        o.status !== "Concluída" &&
        o.status !== "Pausada"
    );
    if (atrasadas.length > 0) {
      list.push({
        tipo: "error",
        titulo: `${atrasadas.length} obra${atrasadas.length > 1 ? "s" : ""} com prazo vencido`,
        sub: atrasadas.map((o) => o.nome?.split("—")[0]?.trim()).join(", "),
        acao: "Ver obras",
        page: "obras",
      });
    }

    // 2. Obras com StickScore crítico (< 70), not already in atrasadas
    const emAndamento = obras.filter(
      (o) => o.status === "Em andamento" && !atrasadas.find((a) => a.id === o.id)
    );
    const criticas = emAndamento.filter((o) => {
      const fins = financeiro[o.id]?.lancamentos || [];
      const meds = medicoes[o.id] || [];
      const score = calcularStickScore(o, { financeiro: fins, medicoes: meds });
      return score.total < 70;
    });
    if (criticas.length > 0) {
      list.push({
        tipo: "warning",
        titulo: `${criticas.length} obra${criticas.length > 1 ? "s" : ""} com StickScore crítico`,
        sub: `Score < 70: ${criticas.map((o) => o.nome?.split("—")[0]?.trim()).join(", ")}`,
        acao: "Ver obras",
        page: "obras",
      });
    }

    // 3. Suprimentos
    const supCrit = (kpis?.pedCriticos || 0) + (kpis?.estoqueAbaixo || 0);
    if (supCrit > 0) {
      const partes = [];
      if (kpis?.pedCriticos > 0)
        partes.push(
          `${kpis.pedCriticos} pedido${kpis.pedCriticos > 1 ? "s" : ""} crítico${kpis.pedCriticos > 1 ? "s" : ""}`
        );
      if (kpis?.estoqueAbaixo > 0)
        partes.push(
          `${kpis.estoqueAbaixo} item${kpis.estoqueAbaixo > 1 ? "s" : ""} abaixo do mínimo`
        );
      list.push({
        tipo: "warning",
        titulo: "Suprimentos precisam de atenção",
        sub: partes.join(" · "),
        acao: "Ver suprimentos",
        page: "suprimentos",
      });
    }

    // 4. Previsão de caixa
    const allLanc = Object.values(financeiro).flatMap((f) => f.lancamentos || []);
    const totalRec = allLanc
      .filter((l) => l.tipo === "receita")
      .reduce((s, l) => s + (l.valor || 0), 0);
    const totalDesp = allLanc
      .filter((l) => l.tipo === "despesa")
      .reduce((s, l) => s + (l.valor || 0), 0);
    const saldoAtual = totalRec - totalDesp;
    const limite30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const despUlt30 = allLanc
      .filter((l) => l.tipo === "despesa" && l.data >= limite30)
      .reduce((s, l) => s + (l.valor || 0), 0);
    const mediaDiaria = despUlt30 / 30;

    if (saldoAtual < 0) {
      list.push({
        tipo: "error",
        titulo: "Saldo negativo acumulado",
        sub: `Resultado consolidado: R$ ${saldoAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        acao: "Ver financeiro",
        page: "financeiro",
      });
    } else if (mediaDiaria > 0) {
      const dias = Math.floor(saldoAtual / mediaDiaria);
      if (dias < 30) {
        list.push({
          tipo: "warning",
          titulo: `Caixa previsto negativo em ~${dias} dias`,
          sub: "Com base no ritmo de despesas dos últimos 30 dias",
          acao: "Ver financeiro",
          page: "financeiro",
        });
      }
    }

    return list;
  }, [obras, financeiro, medicoes, kpis]);

  if (alertas.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(63,122,75,0.08)",
          border: "1px solid rgba(63,122,75,0.25)",
          borderRadius: 12,
          padding: "12px 18px",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#3f7a4b",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#3f7a4b" }}>
          Tudo em ordem hoje — sem alertas operacionais
        </span>
      </div>
    );
  }

  const COR = { error: "#a33327", warning: "#b07a1e", info: "#3b6ea5" };

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(26,24,21,0.97) 0%, rgba(38,35,31,0.95) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "20px 24px",
        marginBottom: 20,
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 2,
          color: "rgba(255,255,255,0.35)",
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        ⚡ Atenção Hoje · {alertas.length} alerta{alertas.length > 1 ? "s" : ""}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {alertas.map((a, i) => {
          const cor = COR[a.tipo];
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: cor + "12",
                border: `1px solid ${cor}30`,
                borderLeft: `3px solid ${cor}`,
                borderRadius: "0 10px 10px 0",
                padding: "12px 16px",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: cor,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  {a.titulo}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "rgba(255,255,255,0.4)",
                    marginTop: 2,
                  }}
                >
                  {a.sub}
                </div>
              </div>
              <button
                onClick={() => setActivePage(a.page)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 7,
                  border: `1px solid ${cor}55`,
                  background: cor + "20",
                  color: cor,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {a.acao} →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
