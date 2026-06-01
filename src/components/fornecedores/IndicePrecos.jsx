import { useState, useEffect } from "react";
import { C } from "../../utils/constants";
import { fmtBRL, fmtMes } from "../../utils/format";
import { listarTodasCotacoes } from "../../services/repositories/fornecedoresRepository";

export default function IndicePrecos() {
  const [todas,   setTodas]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listarTodasCotacoes().then(setTodas).catch(() => setTodas([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Carregando cotações…</div>;
  if (!todas?.length) return (
    <div style={{ padding: 60, textAlign: "center", color: C.muted }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📈</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Nenhuma cotação registrada</div>
      <div style={{ fontSize: 13 }}>Cadastre fornecedores e registre cotações para construir o índice de preços.</div>
    </div>
  );

  const porEsp = {};
  todas.forEach((c) => {
    if (!c.valor) return;
    const key = c.fornecedores?.nome || "Outros";
    if (!porEsp[key]) porEsp[key] = { nome: key, cotacoes: [] };
    porEsp[key].cotacoes.push(c);
  });

  const porMes = {};
  todas.filter((c) => c.valor).forEach((c) => {
    const mes = c.created_at?.slice(0, 7) || "—";
    if (!porMes[mes]) porMes[mes] = [];
    porMes[mes].push(Number(c.valor));
  });
  const meses = Object.keys(porMes).sort();
  const mediaPorMes = meses.map((m) => {
    const vals = porMes[m];
    return { mes: m, media: vals.reduce((a, v) => a + v, 0) / vals.length, qtd: vals.length };
  });

  const ranking = Object.values(porEsp).map((f) => {
    const aprovadas = f.cotacoes.filter((c) => c.status === "Aprovada");
    const mediaAll  = f.cotacoes.reduce((a, c) => a + Number(c.valor || 0), 0) / f.cotacoes.length;
    const mediaApr  = aprovadas.length ? aprovadas.reduce((a, c) => a + Number(c.valor || 0), 0) / aprovadas.length : null;
    return { nome: f.nome, total: f.cotacoes.length, aprovadas: aprovadas.length, mediaAll, mediaApr };
  }).sort((a, b) => b.total - a.total);

  const maxMedia = Math.max(...mediaPorMes.map((m) => m.media), 1);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 860 }}>
      <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Índice de Preços StickFrame</h3>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Evolução e comparativo de preços baseado no histórico de cotações da empresa</p>

      {mediaPorMes.length > 0 && (
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase", marginBottom: 16 }}>
            Valor médio das cotações por mês
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
            {mediaPorMes.map((m, i) => {
              const h   = Math.max((m.media / maxMedia) * 100, 4);
              const ant = mediaPorMes[i - 1]?.media;
              const var_ = ant ? ((m.media - ant) / ant * 100) : null;
              return (
                <div key={m.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  {var_ !== null && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: var_ > 0 ? C.danger : C.success }}>
                      {var_ > 0 ? "▲" : "▼"}{Math.abs(var_).toFixed(0)}%
                    </span>
                  )}
                  <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                    <div style={{ width: "100%", height: `${h}%`, background: C.red, borderRadius: "4px 4px 0 0", opacity: 0.8, minHeight: 4 }} />
                  </div>
                  <span style={{ fontSize: 9, color: C.muted, whiteSpace: "nowrap" }}>{fmtMes(m.mes)}</span>
                  <span style={{ fontSize: 9, color: C.text, fontWeight: 700, whiteSpace: "nowrap" }}>{fmtBRL(m.media)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total de cotações",    value: todas.length,                                     cor: C.red    },
          { label: "Com valor registrado",  value: todas.filter((c) => c.valor).length,             cor: "#4a9eff" },
          { label: "Aprovadas",            value: todas.filter((c) => c.status === "Aprovada").length, cor: C.success },
        ].map((k) => (
          <div key={k.label} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.cor }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", background: C.dark, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: C.graphite, textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>
          Histórico por fornecedor
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th style={{ padding: "10px 20px", textAlign: "left",  fontSize: 11, color: C.muted, fontWeight: 600 }}>Fornecedor</th>
              <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, color: C.muted, fontWeight: 600 }}>Cotações</th>
              <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, color: C.muted, fontWeight: 600 }}>Aprovadas</th>
              <th style={{ padding: "10px 20px", textAlign: "right", fontSize: 11, color: C.muted, fontWeight: 600 }}>Média geral</th>
              <th style={{ padding: "10px 20px", textAlign: "right", fontSize: 11, color: C.muted, fontWeight: 600 }}>Média aprovadas</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((f, i) => (
              <tr key={f.nome} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 ? "#fafafa" : "#fff" }}>
                <td style={{ padding: "11px 20px", fontWeight: 600 }}>{f.nome}</td>
                <td style={{ padding: "11px 14px", textAlign: "right", color: C.muted }}>{f.total}</td>
                <td style={{ padding: "11px 14px", textAlign: "right", color: C.success, fontWeight: 600 }}>{f.aprovadas}</td>
                <td style={{ padding: "11px 20px", textAlign: "right", fontWeight: 700 }}>{fmtBRL(f.mediaAll)}</td>
                <td style={{ padding: "11px 20px", textAlign: "right", fontWeight: 700, color: f.mediaApr ? C.success : C.muted }}>
                  {f.mediaApr ? fmtBRL(f.mediaApr) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
