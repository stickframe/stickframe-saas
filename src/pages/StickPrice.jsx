import { useState, useEffect } from "react";
import { sb, getEmpresaId } from "../services/supabase";

const C = {
  red: "#981915", bg: "#f4f1ec", surface: "#fff", surface2: "#faf8f4",
  ink: "#26231f", ink2: "#57514a", muted: "#8c847a", line: "#e7e1d8",
  green: "#3f7a4b", amber: "#b07a1e", blue: "#3b6ea5",
};

const fmtBRL = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v) => (v >= 0 ? "+" : "") + Number(v).toFixed(1) + "%";

const ORIGEM_BADGE = {
  catalogo: { label: "🟢 Catálogo", bg: "#dcfce7", color: "#166534" },
  mercado:  { label: "🟡 Mercado",  bg: "#fef9c3", color: "#713f12" },
  fallback: { label: "🔴 Fallback", bg: "#fee2e2", color: "#991b1b" },
};

function Badge({ origem }) {
  const b = ORIGEM_BADGE[origem] || ORIGEM_BADGE.fallback;
  return (
    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: b.bg, color: b.color, fontWeight: 700 }}>
      {b.label}
    </span>
  );
}

export default function StickPrice() {
  const [insumos, setInsumos]     = useState([]);
  const [monitor, setMonitor]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [busca, setBusca]         = useState("");
  const [catFiltro, setCatFiltro] = useState("Todos");
  const [alertas, setAlertas]     = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const empresaId = getEmpresaId();
      const [insRes, monRes] = await Promise.all([
        sb.from("insumos_sistema").select("id, nome, preco, un, categoria, grupo, fonte, data_ref, base").order("categoria"),
        empresaId
          ? sb.from("monitoramento_precos").select("*").eq("empresa_id", empresaId).order("data_captura", { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);
      const ins = insRes.data || [];
      const mon = monRes.data || [];
      setInsumos(ins);
      setMonitor(mon);

      // Gera alertas: compara monitoramento vs insumos_sistema
      const al = [];
      mon.forEach((m) => {
        const ref = ins.find((i) => i.id === m.insumo_ref || i.nome === m.nome_produto);
        if (!ref) return;
        const pctDiff = ((m.preco_atual - ref.preco) / ref.preco) * 100;
        if (Math.abs(pctDiff) >= 5) {
          al.push({ nome: m.nome_produto, loja: m.loja, precoRef: ref.preco, precoMon: m.preco_atual, pct: pctDiff, data: m.data_captura });
        }
      });
      setAlertas(al.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)));
      setLoading(false);
    }
    load();
  }, []);

  const categorias = ["Todos", ...new Set(insumos.map((i) => i.categoria || i.grupo || "Outros").filter(Boolean))];

  const insumosFiltrados = insumos.filter((i) => {
    const matchBusca = !busca || i.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCat = catFiltro === "Todos" || (i.categoria || i.grupo) === catFiltro;
    return matchBusca && matchCat;
  });

  // Agrupamento de monitoramento por insumo_ref para histórico
  const monPorInsumo = {};
  monitor.forEach((m) => {
    const k = m.insumo_ref || m.nome_produto;
    if (!monPorInsumo[k]) monPorInsumo[k] = [];
    monPorInsumo[k].push(m);
  });

  if (loading) return (
    <div style={{ padding: 40, color: C.muted, fontFamily: "inherit" }}>Carregando StickPrice™…</div>
  );

  return (
    <div style={{ padding: "28px 32px", fontFamily: "inherit", background: C.bg, minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.red, textTransform: "uppercase", marginBottom: 4 }}>
          Módulo de Preços
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: C.ink, letterSpacing: -0.5 }}>
          StickPrice™
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
          Catálogo de insumos com origem do preço, histórico de mercado e alertas de variação
        </div>
      </div>

      {/* Cards de resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Insumos cadastrados", value: insumos.length, color: C.blue },
          { label: "Monitoramentos ativos", value: monitor.length, color: C.green },
          { label: "Alertas de variação ≥5%", value: alertas.length, color: alertas.length > 0 ? C.red : C.green },
          { label: "Categorias", value: categorias.length - 1, color: C.amber },
        ].map((c, i) => (
          <div key={i} style={{ background: C.surface, borderRadius: 14, padding: "18px 20px", border: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Alertas de variação */}
      {alertas.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 14, padding: "16px 20px", marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 12 }}>
            ⚠️ Alertas de variação de preço (≥5% em relação ao catálogo)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {alertas.slice(0, 5).map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, background: "#fff", borderRadius: 8, padding: "8px 12px", border: "1px solid #fde68a" }}>
                <span style={{ flex: 1, fontWeight: 600 }}>{a.nome}</span>
                <span style={{ color: C.muted }}>{a.loja}</span>
                <span style={{ color: C.muted }}>{fmtBRL(a.precoRef)} → {fmtBRL(a.precoMon)}</span>
                <span style={{ fontWeight: 700, color: a.pct > 0 ? C.red : C.green, minWidth: 50, textAlign: "right" }}>
                  {fmtPct(a.pct)}
                </span>
                <span style={{ color: C.muted, fontSize: 10 }}>{a.data ? new Date(a.data).toLocaleDateString("pt-BR") : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar insumo…"
          style={{ padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: "inherit", outline: "none", minWidth: 220 }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {categorias.slice(0, 8).map((c) => (
            <button key={c} onClick={() => setCatFiltro(c)}
              style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${catFiltro === c ? C.red : C.line}`, background: catFiltro === c ? C.red : C.surface, color: catFiltro === c ? "#fff" : C.ink2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de insumos */}
      <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.line}`, overflow: "hidden", marginBottom: 32 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.surface2 }}>
              {["Insumo", "Categoria", "Un", "Preço", "Origem", "Fonte", "Ref.", "Monitoramentos"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, fontSize: 11, color: C.muted, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {insumosFiltrados.map((ins, i) => {
              const mList = monPorInsumo[ins.id] || monPorInsumo[ins.nome] || [];
              const melhorMon = mList[0];
              const pctDiff = melhorMon ? ((melhorMon.preco_atual - ins.preco) / ins.preco) * 100 : null;
              const origem = ins.fonte ? "catalogo" : "fallback";
              return (
                <tr key={ins.id} style={{ background: i % 2 === 0 ? C.surface : C.surface2, borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "9px 14px", fontWeight: 600, color: C.ink }}>{ins.nome}</td>
                  <td style={{ padding: "9px 14px", color: C.muted, fontSize: 11 }}>{ins.categoria || ins.grupo || "—"}</td>
                  <td style={{ padding: "9px 14px", color: C.muted }}>{ins.un}</td>
                  <td style={{ padding: "9px 14px", fontWeight: 700, fontFamily: "monospace" }}>{fmtBRL(ins.preco)}</td>
                  <td style={{ padding: "9px 14px" }}><Badge origem={origem} /></td>
                  <td style={{ padding: "9px 14px", fontSize: 11, color: C.muted }}>{ins.fonte || "—"}</td>
                  <td style={{ padding: "9px 14px", fontSize: 11, color: C.muted }}>{ins.data_ref || "—"}</td>
                  <td style={{ padding: "9px 14px" }}>
                    {mList.length > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: C.muted }}>{mList.length}×</span>
                        {pctDiff !== null && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: pctDiff > 5 ? C.red : pctDiff < -5 ? C.green : C.muted }}>
                            {fmtPct(pctDiff)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: C.line }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {insumosFiltrados.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: C.muted, fontSize: 13 }}>Nenhum insumo encontrado</div>
        )}
      </div>

      {/* Histórico de monitoramento */}
      {monitor.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 14, letterSpacing: 1, textTransform: "uppercase" }}>
            Histórico de monitoramento de mercado
          </div>
          <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.line}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: C.surface2 }}>
                  {["Produto", "Loja", "Preço capturado", "Data", "Insumo ref."].map((h) => (
                    <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 11, color: C.muted, fontWeight: 700, borderBottom: `1px solid ${C.line}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monitor.slice(0, 50).map((m, i) => {
                  const ref = insumos.find((ins) => ins.id === m.insumo_ref || ins.nome === m.nome_produto);
                  const pct = ref ? ((m.preco_atual - ref.preco) / ref.preco) * 100 : null;
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.surface : C.surface2, borderBottom: `1px solid ${C.line}` }}>
                      <td style={{ padding: "8px 14px", fontWeight: 500 }}>{m.nome_produto}</td>
                      <td style={{ padding: "8px 14px", color: C.muted }}>{m.loja}</td>
                      <td style={{ padding: "8px 14px", fontFamily: "monospace", fontWeight: 600 }}>
                        {fmtBRL(m.preco_atual)}
                        {pct !== null && (
                          <span style={{ marginLeft: 6, fontSize: 10, color: pct > 5 ? C.red : pct < -5 ? C.green : C.muted }}>
                            {fmtPct(pct)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "8px 14px", color: C.muted, fontSize: 11 }}>
                        {m.data_captura ? new Date(m.data_captura).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td style={{ padding: "8px 14px", fontSize: 11, color: C.muted }}>{ref?.nome || m.insumo_ref || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legenda */}
      <div style={{ marginTop: 24, display: "flex", gap: 16, fontSize: 11, color: C.muted, flexWrap: "wrap" }}>
        <span><span style={{ background: "#dcfce7", color: "#166534", padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>🟢 Catálogo</span> Preço confirmado por produto_id</span>
        <span><span style={{ background: "#fef9c3", color: "#713f12", padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>🟡 Mercado</span> Match automático (cat_busca ou nome)</span>
        <span><span style={{ background: "#fee2e2", color: "#991b1b", padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>🔴 Fallback</span> Estimado — confirmar com fornecedor</span>
      </div>
    </div>
  );
}
