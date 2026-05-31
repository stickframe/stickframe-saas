import { useState, useEffect } from "react";
import { CUB_ESTADOS, PADROES_SF, SISTEMAS_SF } from "../utils/insumosSF";
import { C } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import { listarPrecosVivos } from "../services/repositories/precosRepository";
import { criarOrcamento } from "../services/repositories/orcamentoRepository";

const LS_KEY = "sf_orcamento_tecnico_v1";

const fmtBRL = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtN   = (v, d = 2) => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const parseN = (s) => parseFloat(String(s).replace(",", ".")) || 0;

// ─── style atoms ─────────────────────────────────────────────────────────────
const inputSt = {
  width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`,
  borderRadius: 6, fontSize: 13, background: "#fff", boxSizing: "border-box",
};
const selectSt = {
  ...inputSt, cursor: "pointer",
};
const thSt = {
  padding: "8px 10px", textAlign: "left", fontWeight: 600,
  background: C.darker, borderBottom: `1px solid ${C.border}`, fontSize: 11,
};
const tdSt = { padding: "7px 10px", fontSize: 12, verticalAlign: "middle" };

// ─── helpers ─────────────────────────────────────────────────────────────────
function Card({ title, children }) {
  return (
    <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      {title && (
        <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 13, background: C.darker }}>
          {title}
        </div>
      )}
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.graphite }}>{label}</label>
      {children}
    </div>
  );
}

function SummaryCard({ label, value, sub, color, large }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: large ? "16px 18px" : "12px 16px",
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: large ? 20 : 16, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SistemaRow({ s, aberto, toggle }) {
  const total = s.totalMat + s.totalMO;
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <div
        onClick={toggle}
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "11px 18px",
          cursor: "pointer", background: aberto ? C.darker : "transparent",
          transition: "background 0.15s",
        }}
      >
        <span style={{ fontSize: 15 }}>{s.icon}</span>
        <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>
          {s.label}
          {s.opcaoLabel && (
            <span style={{ fontWeight: 400, color: C.muted }}> — {s.opcaoLabel}</span>
          )}
        </span>
        {s.totalMO > 0 && (
          <span style={{ fontSize: 11, color: "#4a9eff", whiteSpace: "nowrap" }}>
            MO {fmtBRL(s.totalMO)}
          </span>
        )}
        <span style={{ fontSize: 13, fontWeight: 700, minWidth: 110, textAlign: "right" }}>
          {fmtBRL(total)}
        </span>
        <span style={{ fontSize: 11, color: C.muted, marginLeft: 6 }}>{aberto ? "▲" : "▼"}</span>
      </div>
      {aberto && (
        <div style={{ background: "#f9f9fc" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thSt}>Insumo</th>
                <th style={{ ...thSt, width: 48, textAlign: "center" }}>Un</th>
                <th style={{ ...thSt, width: 80, textAlign: "right" }}>Qtd</th>
                <th style={{ ...thSt, width: 88, textAlign: "right" }}>Unit R$</th>
                <th style={{ ...thSt, width: 108, textAlign: "right" }}>Total R$</th>
              </tr>
            </thead>
            <tbody>
              {s.itensCalc.map((item, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: item.precoVivo ? "#f0fdf4" : i % 2 ? "#f4f4f8" : "#fff" }}>
                  <td style={tdSt}>
                    {item.nome}
                    {item.precoVivo && (
                      <span title={`Preço ao vivo: ${item.lojaVivo || "monitorado"}`}
                        style={{ marginLeft: 6, fontSize: 10, background: "#dcfce7", color: "#166534",
                          padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>
                        🔴 ao vivo
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdSt, textAlign: "center", color: C.muted }}>{item.un}</td>
                  <td style={{ ...tdSt, textAlign: "right" }}>{fmtN(item.qtd)}</td>
                  <td style={{ ...tdSt, textAlign: "right" }}>
                    {fmtN(item.precoUsado ?? item.preco)}
                    {item.precoVivo && item.preco !== item.precoUsado && (
                      <div style={{ fontSize: 10, color: C.muted, textDecoration: "line-through" }}>{fmtN(item.preco)}</div>
                    )}
                  </td>
                  <td style={{ ...tdSt, textAlign: "right", fontWeight: 600 }}>{fmtN(item.total)}</td>
                </tr>
              ))}
              {s.totalMO > 0 && (
                <tr style={{ background: "#dbeafe" }}>
                  <td style={{ ...tdSt, fontStyle: "italic", color: "#1d4ed8" }} colSpan={4}>
                    Mão de obra (fração CUB regional)
                  </td>
                  <td style={{ ...tdSt, textAlign: "right", fontWeight: 700, color: "#1d4ed8" }}>
                    {fmtN(s.totalMO)}
                  </td>
                </tr>
              )}
              <tr style={{ background: C.darker, fontWeight: 700 }}>
                <td style={{ ...tdSt, fontSize: 12 }} colSpan={4}>Subtotal {s.label}</td>
                <td style={{ ...tdSt, textAlign: "right", fontSize: 13 }}>{fmtBRL(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function OrcamentoTecnico() {
  const setActivePage = useAppStore((s) => s.setActivePage);

  // ── Restaura form do localStorage ──────────────────────────────────────────
  const savedForm = (() => { try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; } })();

  const [estado, setEstado]         = useState(savedForm.estado     ?? "SP");
  const [cubManual, setCubManual]   = useState(savedForm.cubManual  ?? "");
  const [area, setArea]             = useState(savedForm.area       ?? "");
  const [areaMolhada, setAreaMolhada] = useState(savedForm.areaMolhada ?? "");
  const [pavimentos, setPavimentos] = useState(savedForm.pavimentos ?? "1");
  const [padrao, setPadrao]         = useState(savedForm.padrao     ?? "Padrão");
  const [incluiMO, setIncluiMO]     = useState(savedForm.incluiMO  ?? true);
  const [bdi, setBdi]               = useState(savedForm.bdi        ?? 25);
  const [prazoMeses, setPrazoMeses] = useState(savedForm.prazoMeses ?? "");
  const [abertos, setAbertos]       = useState({});
  const [resultado, setResultado]   = useState(null);
  const [comparativo, setComparativo] = useState(null);
  const [toast, setToast]           = useState(null);
  const [modalSalvar, setModalSalvar] = useState(false);
  const [formSalvar, setFormSalvar]   = useState({ cliente: "", validade_dias: 30, observacoes: "" });
  const [salvando, setSalvando]       = useState(false);

  const [selecoes, setSelecoes] = useState(() => {
    const saved = savedForm.selecoes || {};
    const d = {};
    SISTEMAS_SF.forEach((s) => { if (s.opcoes) d[s.id] = saved[s.id] || s.opcoes[0].id; });
    return d;
  });

  const [habilitados, setHabilitados] = useState(() => {
    const saved = savedForm.habilitados || {};
    const d = {};
    SISTEMAS_SF.forEach((s) => {
      if (s.id in saved) d[s.id] = saved[s.id];
      else d[s.id] = s.obrigatorio ||
        ["impermeabilizacao","eletrica","hidraulica","esquadrias","revestimentos"].includes(s.id);
    });
    return d;
  });

  // Persiste form no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        estado, cubManual, area, areaMolhada, pavimentos, padrao, incluiMO, bdi, prazoMeses, selecoes, habilitados,
      }));
    } catch { /* storage cheia */ }
  }, [estado, cubManual, area, areaMolhada, pavimentos, padrao, incluiMO, bdi, prazoMeses, selecoes, habilitados]);

  const [usarPrecosVivos, setUsarPrecosVivos] = useState(true);
  const [precosVivos, setPrecosVivos]         = useState({});
  const [loadingPrecos, setLoadingPrecos]     = useState(false);

  useEffect(() => {
    setLoadingPrecos(true);
    listarPrecosVivos()
      .then(setPrecosVivos)
      .catch(() => {})
      .finally(() => setLoadingPrecos(false));
  }, []);

  const cubEfetivo = parseN(cubManual) || CUB_ESTADOS[estado]?.cub || 2340;
  const fatorPadrao = PADROES_SF[padrao]?.fator || 1;
  const qtdPrecosVivos = Object.keys(precosVivos).length;

  const calcular = () => {
    const areaNum = parseN(area);
    if (areaNum <= 0) return;
    const areaMolhadaNum = parseN(areaMolhada) || areaNum * 0.15;

    const sistemasAtivos = SISTEMAS_SF.filter((s) => habilitados[s.id]);
    let totalMateriais = 0;
    let totalMO = 0;
    const breakdown = [];

    for (const sistema of sistemasAtivos) {
      const opcaoSel =
        sistema.opcoes?.find((o) => o.id === selecoes[sistema.id]) || sistema.opcoes?.[0];
      const itensBase = opcaoSel ? opcaoSel.itens : sistema.itens;
      const aplicaFatorOpcao = opcaoSel?.aplicaFatorPadrao ?? false;
      const areaUsada = sistema.usaAreaMolhada ? areaMolhadaNum : areaNum;

      let totalSistema = 0;
      const itensCalc = itensBase.map((item) => {
        const fator = item.aplicaFatorPadrao || aplicaFatorOpcao ? fatorPadrao : 1;
        const qtd   = item.base * areaUsada * fator;
        const vivo  = usarPrecosVivos && precosVivos[item.nome];
        const precoUsado = vivo ? vivo.preco_atual : item.preco;
        const total = qtd * precoUsado;
        totalSistema += total;
        return { ...item, qtd, total, precoUsado, precoVivo: vivo ? vivo.preco_atual : null, lojaVivo: vivo?.loja };
      });

      const mo = sistema.mao_obra_cub * cubEfetivo * areaNum;
      totalMateriais += totalSistema;
      if (incluiMO) totalMO += mo;

      breakdown.push({
        id: sistema.id,
        label: sistema.label,
        icon: sistema.icon,
        opcaoLabel: opcaoSel?.label,
        itensCalc,
        totalMat: totalSistema,
        totalMO: incluiMO ? mo : 0,
      });
    }

    const totalGeral = totalMateriais + totalMO;
    const bdiVal     = bdi / 100;
    const precoVenda = totalGeral * (1 + bdiVal);

    // Cronograma — distribuição S-curve típica Steel Frame
    const prazoNum = parseInt(prazoMeses) || 0;
    let cronograma = [];
    if (prazoNum >= 2) {
      // pesos por fase (somam 1)
      const fases = [
        { nome: "Fundação",     peso: 0.15 },
        { nome: "Estrutura",    peso: 0.25 },
        { nome: "Fechamentos",  peso: 0.20 },
        { nome: "Instalações",  peso: 0.18 },
        { nome: "Acabamentos",  peso: 0.17 },
        { nome: "Entrega",      peso: 0.05 },
      ];
      // distribuir fases ao longo dos meses
      let acum = 0;
      const meses = Array.from({ length: prazoNum }, (_, i) => {
        let pct = 0;
        let pos = (i + 0.5) / prazoNum; // posição normalizada 0-1
        fases.forEach((f, fi) => {
          const start = fases.slice(0, fi).reduce((a, x) => a + x.peso, 0);
          const end   = start + f.peso;
          const overlap = Math.max(0, Math.min(end, (i + 1) / prazoNum) - Math.max(start, i / prazoNum));
          pct += overlap * f.peso / f.peso; // each phase contributes proportionally
        });
        // Simplified: distribute precoVenda evenly weighted by S-curve
        const sCurve = fases.reduce((sum, f, fi) => {
          const start = fases.slice(0, fi).reduce((a, x) => a + x.peso, 0);
          const end   = start + f.peso;
          const overlap = Math.max(0, Math.min(end, (i + 1) / prazoNum) - Math.max(start, i / prazoNum));
          return sum + (overlap / f.peso) * f.peso;
        }, 0);
        acum += sCurve;
        return { mes: i + 1, pct: sCurve, valor: sCurve * precoVenda, acum };
      });
      // normalize
      const totalPct = meses.reduce((s, m) => s + m.pct, 0);
      let cumul = 0;
      cronograma = meses.map((m) => {
        const pctNorm = m.pct / totalPct;
        cumul += pctNorm;
        return { mes: m.mes, pct: pctNorm, valor: pctNorm * precoVenda, cumul };
      });
    }

    setResultado({
      area: areaNum,
      areaMolhada: areaMolhadaNum,
      estado,
      cub: cubEfetivo,
      padrao,
      fatorPadrao,
      totalMateriais,
      totalMO,
      totalGeral,
      bdi,
      bdiValor: totalGeral * bdiVal,
      precoVenda,
      m2: totalGeral / areaNum,
      m2Mat: totalMateriais / areaNum,
      m2MO: totalMO / areaNum,
      m2Venda: precoVenda / areaNum,
      breakdown,
      incluiMO,
      prazoMeses: prazoNum,
      cronograma,
    });
    setAbertos({});
    setComparativo(null);
  };

  // Calcula um padrão específico (para comparativo)
  const calcularPara = (padraoKey) => {
    const areaNum = parseN(area);
    if (areaNum <= 0) return null;
    const areaMolhadaNum = parseN(areaMolhada) || areaNum * 0.15;
    const fP = PADROES_SF[padraoKey]?.fator || 1;
    const sistemasAtivos = SISTEMAS_SF.filter((s) => habilitados[s.id]);
    let totalMat = 0, totalMO2 = 0;
    for (const sistema of sistemasAtivos) {
      const opcaoSel = sistema.opcoes?.find((o) => o.id === selecoes[sistema.id]) || sistema.opcoes?.[0];
      const itensBase = opcaoSel ? opcaoSel.itens : sistema.itens;
      const aplicaFatorOpcao = opcaoSel?.aplicaFatorPadrao ?? false;
      const areaUsada = sistema.usaAreaMolhada ? areaMolhadaNum : areaNum;
      for (const item of itensBase) {
        const fator = item.aplicaFatorPadrao || aplicaFatorOpcao ? fP : 1;
        const qtd = item.base * areaUsada * fator;
        const vivo = usarPrecosVivos && precosVivos[item.nome];
        const preco = vivo ? vivo.preco_atual : item.preco;
        totalMat += qtd * preco;
      }
      if (incluiMO) totalMO2 += sistema.mao_obra_cub * cubEfetivo * areaNum;
    }
    const total = totalMat + totalMO2;
    return { padrao: padraoKey, totalMat, totalMO: totalMO2, total, m2: total / areaNum, precoVenda: total * (1 + bdi / 100), m2Venda: total * (1 + bdi / 100) / areaNum };
  };

  const gerarComparativo = () => {
    const cenarios = Object.keys(PADROES_SF).map(calcularPara).filter(Boolean);
    setComparativo(cenarios);
  };

  const salvarComoOrcamento = async () => {
    if (!resultado) return;
    setSalvando(true);
    try {
      const ref = `OT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      await criarOrcamento({
        ref,
        cliente: formSalvar.cliente || "—",
        area: resultado.area,
        padrao: resultado.padrao,
        valor: Math.round(resultado.totalGeral * 100) / 100,
        status: "Em elaboração",
        criado: new Date().toLocaleDateString("pt-BR"),
        validade_dias: formSalvar.validade_dias || 30,
        observacoes_proposta: formSalvar.observacoes || null,
        // campos novos
        estado: resultado.estado,
        cub: resultado.cub,
        area_molhada: resultado.areaMolhada,
        inclui_mo: resultado.incluiMO,
        total_materiais: Math.round(resultado.totalMateriais * 100) / 100,
        total_mo: Math.round(resultado.totalMO * 100) / 100,
        origem: "orcamento_tecnico",
        composicao_tecnica: resultado.breakdown.map((s) => ({
          sistema: s.label,
          opcao: s.opcaoLabel,
          totalMat: s.totalMat,
          totalMO: s.totalMO,
          itens: s.itensCalc.map((i) => ({
            nome: i.nome, un: i.un,
            qtd: parseFloat(i.qtd.toFixed(3)),
            preco: i.precoUsado ?? i.preco,
            total: parseFloat(i.total.toFixed(2)),
            aoVivo: !!i.precoVivo,
          })),
        })),
      });
      setModalSalvar(false);
      setToast("Orçamento salvo com sucesso!");
      setTimeout(() => setToast(null), 3000);
      setActivePage("orcamentos");
    } catch (e) {
      setToast("Erro ao salvar: " + e.message);
      setTimeout(() => setToast(null), 4000);
    } finally {
      setSalvando(false);
    }
  };

  const exportarPDF = () => {
    if (!resultado) return;
    const r = resultado;
    const LOGO = "https://gpzmglcxmbboxxogbibq.supabase.co/storage/v1/object/public/arquivos/logos/34ec14d3-02fc-4b0a-8040-67f7a739394d/logo.jpg?t=1780161932174";
    const dataHoje = new Date().toLocaleDateString("pt-BR");

    const sistemasRows = r.breakdown.map((s) => `
      <tr style="background:#f4f4f8;font-weight:700">
        <td colspan="4" style="padding:8px 10px;border-bottom:1px solid #ddd">${s.icon} ${s.label}${s.opcaoLabel ? ` — ${s.opcaoLabel}` : ""}</td>
        <td style="padding:8px 10px;text-align:right;border-bottom:1px solid #ddd">${fmtBRL(s.totalMat + s.totalMO)}</td>
      </tr>
      ${s.itensCalc.map((it, i) => `
        <tr style="background:${i%2?"#fafafa":"#fff"}">
          <td style="padding:6px 10px 6px 22px;border-bottom:1px solid #eee;font-size:12px">${it.nome}</td>
          <td style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;font-size:12px;color:#666">${it.un}</td>
          <td style="padding:6px 10px;text-align:right;border-bottom:1px solid #eee;font-size:12px">${fmtN(it.qtd)}</td>
          <td style="padding:6px 10px;text-align:right;border-bottom:1px solid #eee;font-size:12px">${fmtN(it.precoUsado ?? it.preco)}</td>
          <td style="padding:6px 10px;text-align:right;border-bottom:1px solid #eee;font-size:12px;font-weight:600">${fmtN(it.total)}</td>
        </tr>`).join("")}
      ${s.totalMO > 0 ? `<tr style="background:#dbeafe"><td style="padding:6px 10px 6px 22px;font-style:italic;color:#1d4ed8;font-size:12px" colspan="4">Mão de obra (CUB-based)</td><td style="padding:6px 10px;text-align:right;font-weight:700;color:#1d4ed8;font-size:12px">${fmtBRL(s.totalMO)}</td></tr>` : ""}
    `).join("");

    const cronoRows = r.cronograma.length ? `
      <div style="page-break-before:always">
      <h3 style="margin:0 0 14px;font-size:15px">📅 Cronograma Financeiro Estimado</h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="background:#1a1a2e;color:#fff">
          <th style="padding:8px 10px;text-align:left">Mês</th>
          <th style="padding:8px 10px;text-align:right">Desembolso</th>
          <th style="padding:8px 10px;text-align:right">% mensal</th>
          <th style="padding:8px 10px;text-align:right">Acumulado</th>
          <th style="padding:8px 10px">Progresso</th>
        </tr></thead>
        <tbody>
          ${r.cronograma.map((m, i) => `<tr style="background:${i%2?"#f4f4f8":"#fff"}">
            <td style="padding:7px 10px;border-bottom:1px solid #eee">Mês ${m.mes}</td>
            <td style="padding:7px 10px;text-align:right;border-bottom:1px solid #eee;font-weight:600">${fmtBRL(m.valor)}</td>
            <td style="padding:7px 10px;text-align:right;border-bottom:1px solid #eee">${(m.pct*100).toFixed(1)}%</td>
            <td style="padding:7px 10px;text-align:right;border-bottom:1px solid #eee">${(m.cumul*100).toFixed(0)}%</td>
            <td style="padding:7px 10px;border-bottom:1px solid #eee">
              <div style="background:#eee;border-radius:4px;height:8px;width:100%">
                <div style="background:#981915;border-radius:4px;height:8px;width:${(m.cumul*100).toFixed(0)}%"></div>
              </div>
            </td>
          </tr>`).join("")}
        </tbody>
      </table></div>` : "";

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>Orçamento Técnico — ${r.area}m² ${r.padrao}</title>
    <style>body{font-family:'DM Sans',Arial,sans-serif;color:#1a1a1a;margin:0;padding:0}
    @media print{.no-print{display:none}@page{margin:18mm 16mm}}
    table{border-collapse:collapse;width:100%}h3{margin:20px 0 12px}</style></head>
    <body style="padding:32px 40px">
      <!-- CAPA -->
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:28px;padding-bottom:18px;border-bottom:3px solid #981915">
        <img src="${LOGO}" style="width:52px;height:52px;border-radius:10px;object-fit:contain">
        <div>
          <div style="font-size:22px;font-weight:800;letter-spacing:1px">STICK<span style="color:#981915">FRAME</span></div>
          <div style="font-size:10px;color:#666;letter-spacing:2px">SISTEMAS CONSTRUTIVOS</div>
        </div>
        <div style="margin-left:auto;text-align:right">
          <div style="font-size:18px;font-weight:700">Orçamento Técnico</div>
          <div style="font-size:11px;color:#666">Emitido em ${dataHoje}</div>
        </div>
      </div>

      <!-- DADOS -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:22px">
        <div style="background:#f4f4f8;border-radius:8px;padding:12px 14px">
          <div style="font-size:10px;color:#666;margin-bottom:3px">ESTADO / CUB</div>
          <div style="font-weight:700">${CUB_ESTADOS[r.estado]?.nome} (${r.estado})</div>
          <div style="font-size:12px;color:#444">CUB R1-N: R$ ${r.cub.toLocaleString("pt-BR")}/m²</div>
        </div>
        <div style="background:#f4f4f8;border-radius:8px;padding:12px 14px">
          <div style="font-size:10px;color:#666;margin-bottom:3px">ÁREA / PADRÃO</div>
          <div style="font-weight:700">${r.area} m² — ${r.padrao}</div>
          <div style="font-size:12px;color:#444">Fator ×${r.fatorPadrao} · Área molhada ${fmtN(r.areaMolhada)} m²</div>
        </div>
        <div style="background:#f4f4f8;border-radius:8px;padding:12px 14px">
          <div style="font-size:10px;color:#666;margin-bottom:3px">BDI / PRAZO</div>
          <div style="font-weight:700">BDI ${r.bdi}% — ${fmtBRL(r.bdiValor)}</div>
          <div style="font-size:12px;color:#444">${r.prazoMeses ? `Prazo estimado: ${r.prazoMeses} meses` : "Prazo não informado"}</div>
        </div>
      </div>

      <!-- KPIs -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:24px">
        <div style="border-top:3px solid #666;background:#fff;border:1px solid #eee;border-top:3px solid #666;border-radius:8px;padding:12px 14px">
          <div style="font-size:10px;color:#666">TOTAL MATERIAIS</div>
          <div style="font-size:15px;font-weight:700">${fmtBRL(r.totalMateriais)}</div>
          <div style="font-size:11px;color:#888">${fmtBRL(r.m2Mat)}/m²</div>
        </div>
        ${r.incluiMO ? `<div style="border-top:3px solid #2563eb;background:#fff;border:1px solid #eee;border-radius:8px;padding:12px 14px">
          <div style="font-size:10px;color:#666">MÃO DE OBRA</div>
          <div style="font-size:15px;font-weight:700;color:#2563eb">${fmtBRL(r.totalMO)}</div>
          <div style="font-size:11px;color:#888">${fmtBRL(r.m2MO)}/m²</div>
        </div>` : ""}
        <div style="border-top:3px solid #981915;background:#fff;border:1px solid #eee;border-radius:8px;padding:12px 14px">
          <div style="font-size:10px;color:#666">CUSTO DIRETO</div>
          <div style="font-size:15px;font-weight:700;color:#981915">${fmtBRL(r.totalGeral)}</div>
          <div style="font-size:11px;color:#888">${fmtBRL(r.m2)}/m²</div>
        </div>
        <div style="border-top:3px solid #2e9e5b;background:#fff;border:1px solid #eee;border-radius:8px;padding:12px 14px">
          <div style="font-size:10px;color:#666">PREÇO DE VENDA (BDI ${r.bdi}%)</div>
          <div style="font-size:15px;font-weight:700;color:#2e9e5b">${fmtBRL(r.precoVenda)}</div>
          <div style="font-size:11px;color:#888">${fmtBRL(r.m2Venda)}/m²</div>
        </div>
      </div>

      <!-- COMPOSIÇÃO -->
      <h3 style="margin:0 0 12px;font-size:15px">📋 Composição por Sistema</h3>
      <table>
        <thead><tr style="background:#1a1a2e;color:#fff">
          <th style="padding:8px 10px;text-align:left">Insumo</th>
          <th style="padding:8px 10px;text-align:center">Un</th>
          <th style="padding:8px 10px;text-align:right">Qtd</th>
          <th style="padding:8px 10px;text-align:right">Unit R$</th>
          <th style="padding:8px 10px;text-align:right">Total R$</th>
        </tr></thead>
        <tbody>${sistemasRows}</tbody>
        <tfoot>
          <tr style="background:#1a1a2e;color:#fff;font-weight:700">
            <td colspan="4" style="padding:10px 14px">TOTAL GERAL (custo direto)</td>
            <td style="padding:10px 14px;text-align:right">${fmtBRL(r.totalGeral)}</td>
          </tr>
          <tr style="background:#981915;color:#fff;font-weight:700">
            <td colspan="4" style="padding:10px 14px">PREÇO DE VENDA — BDI ${r.bdi}%</td>
            <td style="padding:10px 14px;text-align:right">${fmtBRL(r.precoVenda)}</td>
          </tr>
        </tfoot>
      </table>

      ${cronoRows}

      <div style="margin-top:32px;font-size:10px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:12px">
        Stickframe Sistemas Construtivos · Gerado em ${dataHoje} · Valores de referência — sujeitos a cotação local
      </div>
    </body></html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 600);
  };

  const exportarExcel = async () => {
    if (!resultado) return;
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      // Sheet 1: resumo
      const resumo = [
        ["Orçamento Técnico Steel Frame — Stickframe"],
        [],
        ["Estado:", CUB_ESTADOS[resultado.estado]?.nome, "CUB R1-N:", resultado.cub],
        ["Padrão:", resultado.padrao, "Fator:", resultado.fatorPadrao],
        ["Área:", resultado.area + " m²", "Área molhada:", resultado.areaMolhada + " m²"],
        [],
        ["TOTAIS"],
        ["Total Materiais", fmtBRL(resultado.totalMateriais), fmtBRL(resultado.m2Mat) + "/m²"],
        resultado.incluiMO
          ? ["Total Mão de Obra", fmtBRL(resultado.totalMO), fmtBRL(resultado.m2MO) + "/m²"]
          : null,
        ["TOTAL GERAL", fmtBRL(resultado.totalGeral), fmtBRL(resultado.m2) + "/m²"],
      ].filter(Boolean);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumo), "Resumo");

      // Sheet 2: composição detalhada
      const linhas = [
        ["Sistema", "Opção", "Insumo", "Un", "Qtd", "Unit R$", "Total R$", "Tipo"],
      ];
      for (const s of resultado.breakdown) {
        for (const item of s.itensCalc) {
          linhas.push([s.label, s.opcaoLabel || "", item.nome, item.un,
            Number(item.qtd.toFixed(2)), item.preco, Number(item.total.toFixed(2)), "Material"]);
        }
        if (s.totalMO > 0) {
          linhas.push([s.label, s.opcaoLabel || "", "Mão de obra (CUB-based)", "vb",
            1, Number(s.totalMO.toFixed(2)), Number(s.totalMO.toFixed(2)), "Serviço"]);
        }
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(linhas), "Composição");

      XLSX.writeFile(wb, `orcamento_tecnico_${resultado.area}m2_${resultado.estado}.xlsx`);
    } catch {
      showToast("Erro ao exportar Excel");
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div style={{ display: "flex", gap: 20, padding: "20px 24px", minHeight: "100vh",
      background: C.dark, alignItems: "flex-start", flexWrap: "wrap" }}>

      {/* ── LEFT: configuração ─────────────────────────────────── */}
      <div style={{ width: 370, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>Orçamento Técnico</h2>
          <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 12 }}>
            Composição completa de insumos Steel Frame — preços regionais via CUB
          </p>
        </div>

        {/* Localização */}
        <Card title="📍 Localização e CUB">
          <Row label="Estado">
            <select value={estado} onChange={(e) => setEstado(e.target.value)} style={selectSt}>
              {Object.entries(CUB_ESTADOS).map(([k, v]) => (
                <option key={k} value={k}>{v.nome} ({k})</option>
              ))}
            </select>
          </Row>
          <Row label={`CUB R1-N vigente — ref. SINDUSCON ${CUB_ESTADOS[estado]?.nome}`}>
            <input
              type="number"
              placeholder={String(CUB_ESTADOS[estado]?.cub)}
              value={cubManual}
              onChange={(e) => setCubManual(e.target.value)}
              style={inputSt}
            />
            <span style={{ fontSize: 11, color: C.muted }}>
              Deixe em branco para usar referência: R$ {CUB_ESTADOS[estado]?.cub?.toLocaleString("pt-BR")}/m²
            </span>
          </Row>
        </Card>

        {/* Dados da obra */}
        <Card title="🏗 Dados da Obra">
          <Row label="Área construída total (m²) *">
            <input type="text" value={area} onChange={(e) => setArea(e.target.value)}
              placeholder="ex: 120" style={inputSt} />
          </Row>
          <Row label="Área molhada — banheiros + cozinha (m²)">
            <input type="text" value={areaMolhada} onChange={(e) => setAreaMolhada(e.target.value)}
              placeholder="ex: 18  (padrão: 15% da área total)" style={inputSt} />
          </Row>
          <Row label="Pavimentos">
            <select value={pavimentos} onChange={(e) => setPavimentos(e.target.value)} style={selectSt}>
              <option value="1">Térrea — 1 pavimento</option>
              <option value="2">Sobrado — 2 pavimentos</option>
              <option value="3">3 pavimentos</option>
            </select>
          </Row>
          <Row label="Padrão construtivo">
            <select value={padrao} onChange={(e) => setPadrao(e.target.value)} style={selectSt}>
              {Object.entries(PADROES_SF).map(([k, v]) => (
                <option key={k} value={k}>{k} (×{v.fator}) — {v.desc}</option>
              ))}
            </select>
          </Row>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", marginTop: 4 }}>
            <input type="checkbox" checked={incluiMO} onChange={(e) => setIncluiMO(e.target.checked)} />
            Incluir mão de obra (baseada no CUB regional)
          </label>
          <Row label="Prazo estimado (meses)">
            <input type="number" min="1" max="36" value={prazoMeses}
              onChange={(e) => setPrazoMeses(e.target.value)}
              placeholder="ex: 6  (gera cronograma financeiro)" style={inputSt} />
          </Row>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={usarPrecosVivos} onChange={(e) => setUsarPrecosVivos(e.target.checked)} />
            <span>
              Usar preços de mercado ao vivo
              {loadingPrecos
                ? <span style={{ color: C.muted }}> (carregando…)</span>
                : qtdPrecosVivos > 0
                  ? <span style={{ color: C.success, fontWeight: 700 }}> ✓ {qtdPrecosVivos} monitorados</span>
                  : <span style={{ color: C.muted }}> (nenhum monitorado)</span>
              }
            </span>
          </label>
        </Card>

        {/* BDI */}
        <Card title="💼 BDI e Preço de Venda">
          <Row label="BDI — Benefícios e Despesas Indiretas (%)">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="number" min="0" max="100" value={bdi}
                onChange={(e) => setBdi(Number(e.target.value))}
                style={{ ...inputSt, width: 80 }} />
              <div style={{ display: "flex", gap: 6 }}>
                {[20, 25, 30, 35].map((v) => (
                  <button key={v} onClick={() => setBdi(v)} style={{
                    padding: "4px 10px", fontSize: 11, borderRadius: 5, cursor: "pointer",
                    background: bdi === v ? C.red : C.darker,
                    color: bdi === v ? "#fff" : C.muted,
                    border: `1px solid ${bdi === v ? C.red : C.border}`,
                  }}>{v}%</button>
                ))}
              </div>
            </div>
          </Row>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
            Inclui: adm. central (~4%), risco (~2%), lucro (~8%), desp. financeiras (~2%), ISS+PIS+COFINS (~9%).<br />
            Preço de venda = Custo Direto × (1 + BDI)
          </div>
        </Card>

        {/* Sistemas */}
        <Card title="⚙️ Sistemas Construtivos">
          {SISTEMAS_SF.map((s) => (
            <div key={s.id} style={{ paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13,
                  fontWeight: 600, cursor: s.obrigatorio ? "default" : "pointer" }}>
                  {!s.obrigatorio && (
                    <input
                      type="checkbox"
                      checked={habilitados[s.id]}
                      onChange={(e) => setHabilitados((p) => ({ ...p, [s.id]: e.target.checked }))}
                    />
                  )}
                  <span style={{ opacity: habilitados[s.id] ? 1 : 0.4 }}>
                    {s.icon} {s.label}
                  </span>
                </label>
                {s.obrigatorio && (
                  <span style={{ fontSize: 10, background: C.red, color: "#fff",
                    borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>obrigatório</span>
                )}
              </div>
              {habilitados[s.id] && s.opcoes && (
                <select
                  value={selecoes[s.id]}
                  onChange={(e) => setSelecoes((p) => ({ ...p, [s.id]: e.target.value }))}
                  style={{ ...selectSt, fontSize: 12 }}
                >
                  {s.opcoes.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              )}
              {habilitados[s.id] && s.opcoes && (
                <p style={{ margin: "4px 0 0", fontSize: 11, color: C.muted, lineHeight: 1.4 }}>
                  {s.opcoes.find((o) => o.id === selecoes[s.id])?.desc}
                </p>
              )}
            </div>
          ))}
        </Card>

        <button
          onClick={calcular}
          disabled={!area}
          style={{
            padding: "13px 0", background: C.red, color: "#fff", border: "none",
            borderRadius: 8, fontSize: 15, fontWeight: 700,
            cursor: area ? "pointer" : "not-allowed", opacity: area ? 1 : 0.5,
          }}
        >
          Calcular Orçamento
        </button>
      </div>

      {/* ── RIGHT: resultado ─────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!resultado ? (
          <div style={{ textAlign: "center", padding: "80px 24px", color: C.muted,
            background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📊</div>
            <p style={{ fontSize: 15, margin: 0 }}>Configure os parâmetros ao lado e clique em <strong>Calcular Orçamento</strong></p>
            <p style={{ fontSize: 12, marginTop: 8 }}>Gera composição detalhada de todos os insumos com preços regionais calibrados por CUB</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))", gap: 10 }}>
              <SummaryCard label="Total Materiais" value={fmtBRL(resultado.totalMateriais)}
                sub={fmtBRL(resultado.m2Mat) + "/m²"} color={C.graphite} />
              {resultado.incluiMO && (
                <SummaryCard label="Mão de Obra (MO)" value={fmtBRL(resultado.totalMO)}
                  sub={fmtBRL(resultado.m2MO) + "/m²"} color="#2563eb" />
              )}
              <SummaryCard label="Custo Direto" value={fmtBRL(resultado.totalGeral)}
                sub={fmtBRL(resultado.m2) + "/m²"} color={C.red} large />
              <SummaryCard label={`Preço de Venda (BDI ${resultado.bdi}%)`}
                value={fmtBRL(resultado.precoVenda)}
                sub={fmtBRL(resultado.m2Venda) + "/m²"} color={C.success} large />
              <SummaryCard
                label={`${resultado.area} m² · ${resultado.padrao}`}
                value={`CUB ${resultado.estado}: R$${resultado.cub.toLocaleString("pt-BR")}`}
                sub={`Fator padrão: ×${resultado.fatorPadrao}`}
                color="#c88a00"
              />
            </div>

            {/* action buttons */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => setModalSalvar(true)} style={{
                padding: "9px 18px", background: C.red, color: "#fff",
                border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>
                💾 Salvar como Orçamento
              </button>
              <button onClick={exportarPDF} style={{
                padding: "9px 18px", background: "#2563eb", color: "#fff",
                border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                📄 Exportar PDF
              </button>
              <button onClick={exportarExcel} style={{
                padding: "9px 18px", background: C.success, color: "#fff",
                border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                📥 Exportar Excel
              </button>
              <button onClick={gerarComparativo} style={{
                padding: "9px 18px", background: "#7c3aed", color: "#fff",
                border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                ⚖️ Comparar Padrões
              </button>
              <button onClick={() => setResultado(null)} style={{
                padding: "9px 18px", background: C.surface, color: C.muted,
                border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, cursor: "pointer",
              }}>
                ↺ Recalcular
              </button>
            </div>

            {/* comparativo de padrões */}
            {comparativo && (
              <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>⚖️ Comparativo de Padrões</span>
                  <button onClick={() => setComparativo(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12 }}>✕ fechar</button>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C.darker }}>
                        <th style={thSt}>Padrão</th>
                        <th style={{ ...thSt, textAlign: "right" }}>Materiais</th>
                        {resultado.incluiMO && <th style={{ ...thSt, textAlign: "right" }}>MO</th>}
                        <th style={{ ...thSt, textAlign: "right" }}>Custo Direto</th>
                        <th style={{ ...thSt, textAlign: "right" }}>Custo/m²</th>
                        <th style={{ ...thSt, textAlign: "right" }}>Preço Venda (BDI {bdi}%)</th>
                        <th style={{ ...thSt, textAlign: "right" }}>Venda/m²</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparativo.map((c, i) => (
                        <tr key={c.padrao} style={{ background: c.padrao === resultado.padrao ? C.red + "12" : i % 2 ? "#f9f9fc" : "#fff", fontWeight: c.padrao === resultado.padrao ? 700 : 400 }}>
                          <td style={{ ...tdSt }}>
                            {c.padrao === resultado.padrao && <span style={{ color: C.red, marginRight: 4 }}>►</span>}
                            {c.padrao}
                            <span style={{ marginLeft: 6, fontSize: 10, color: C.muted }}>×{PADROES_SF[c.padrao]?.fator}</span>
                          </td>
                          <td style={{ ...tdSt, textAlign: "right" }}>{fmtBRL(c.totalMat)}</td>
                          {resultado.incluiMO && <td style={{ ...tdSt, textAlign: "right", color: "#2563eb" }}>{fmtBRL(c.totalMO)}</td>}
                          <td style={{ ...tdSt, textAlign: "right" }}>{fmtBRL(c.total)}</td>
                          <td style={{ ...tdSt, textAlign: "right" }}>{fmtBRL(c.m2)}</td>
                          <td style={{ ...tdSt, textAlign: "right", color: C.success, fontWeight: 700 }}>{fmtBRL(c.precoVenda)}</td>
                          <td style={{ ...tdSt, textAlign: "right" }}>{fmtBRL(c.m2Venda)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* cronograma financeiro */}
            {resultado.cronograma?.length > 0 && (
              <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 14 }}>
                  📅 Cronograma Financeiro Estimado — {resultado.prazoMeses} meses
                </div>
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  {resultado.cronograma.map((m) => (
                    <div key={m.mes} style={{ display: "grid", gridTemplateColumns: "44px 1fr 100px 72px", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>Mês {m.mes}</span>
                      <div style={{ background: C.border, borderRadius: 4, height: 12, position: "relative", overflow: "hidden" }}>
                        <div style={{ width: `${(m.pct * 100 * 5).toFixed(0)}%`, maxWidth: "100%", background: C.red, height: "100%", borderRadius: 4, transition: "width 0.4s" }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, textAlign: "right" }}>{fmtBRL(m.valor)}</span>
                      <span style={{ fontSize: 11, color: C.muted, textAlign: "right" }}>acum. {(m.cumul * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "10px 18px", borderTop: `1px solid ${C.border}`, background: C.darker, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: C.muted }}>Total a desembolsar (preço de venda)</span>
                  <span style={{ fontWeight: 700, color: C.success }}>{fmtBRL(resultado.precoVenda)}</span>
                </div>
              </div>
            )}

            {/* aviso materiais */}
            <div style={{ background: "#fffbeb", border: "1px solid #f59e0b", borderRadius: 8,
              padding: "10px 14px", fontSize: 12, color: "#92400e" }}>
              <strong>Nota:</strong> Preços de materiais são referências médias nacionais (Mai/2025).
              Ajuste conforme cotação local do fornecedor. Padrão SP: ~R$1.400/m² materiais + R$1.000/m² MO.
            </div>

            {/* breakdown por sistema */}
            <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ padding: "13px 18px", borderBottom: `1px solid ${C.border}`,
                fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Composição por Sistema</span>
                <button
                  onClick={() => {
                    const allIds = resultado.breakdown.map((s) => s.id);
                    const anyOpen = allIds.some((id) => abertos[id]);
                    const next = {};
                    allIds.forEach((id) => { next[id] = !anyOpen; });
                    setAbertos(next);
                  }}
                  style={{ fontSize: 12, color: C.muted, background: "none", border: "none",
                    cursor: "pointer", textDecoration: "underline" }}
                >
                  {Object.values(abertos).some(Boolean) ? "Recolher todos" : "Expandir todos"}
                </button>
              </div>
              {resultado.breakdown.map((s) => (
                <SistemaRow
                  key={s.id}
                  s={s}
                  aberto={!!abertos[s.id]}
                  toggle={() => setAbertos((p) => ({ ...p, [s.id]: !p[s.id] }))}
                />
              ))}
              {/* rodapé total */}
              <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 18px",
                gap: 20, background: C.darker, fontWeight: 700 }}>
                {resultado.incluiMO && (
                  <span style={{ fontSize: 13, color: "#2563eb" }}>MO: {fmtBRL(resultado.totalMO)}</span>
                )}
                <span style={{ fontSize: 13, color: C.graphite }}>Mat: {fmtBRL(resultado.totalMateriais)}</span>
                <span style={{ fontSize: 15, color: C.red }}>TOTAL: {fmtBRL(resultado.totalGeral)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Salvar como Orçamento */}
      {modalSalvar && resultado && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "min(460px, 94vw)",
            padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>💾 Salvar como Orçamento</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>
              {resultado.area} m² · {resultado.padrao} · {fmtBRL(resultado.totalGeral)}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.graphite, marginBottom: 5 }}>
                  Cliente / Nome do orçamento
                </label>
                <input
                  type="text"
                  placeholder="ex: João Silva — Residência 48m²"
                  value={formSalvar.cliente}
                  onChange={(e) => setFormSalvar((p) => ({ ...p, cliente: e.target.value }))}
                  style={{ ...inputSt, fontSize: 14 }}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.graphite, marginBottom: 5 }}>
                  Validade (dias)
                </label>
                <input
                  type="number"
                  value={formSalvar.validade_dias}
                  onChange={(e) => setFormSalvar((p) => ({ ...p, validade_dias: Number(e.target.value) }))}
                  style={inputSt}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.graphite, marginBottom: 5 }}>
                  Observações (opcional)
                </label>
                <textarea
                  rows={3}
                  value={formSalvar.observacoes}
                  onChange={(e) => setFormSalvar((p) => ({ ...p, observacoes: e.target.value }))}
                  placeholder="Condições comerciais, escopo, etc."
                  style={{ ...inputSt, resize: "vertical" }}
                />
              </div>

              {/* Resumo */}
              <div style={{ background: C.dark, borderRadius: 8, padding: "12px 14px", fontSize: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <span style={{ color: C.muted }}>Materiais</span>
                  <span style={{ fontWeight: 700, textAlign: "right" }}>{fmtBRL(resultado.totalMateriais)}</span>
                  {resultado.incluiMO && <>
                    <span style={{ color: C.muted }}>Mão de obra</span>
                    <span style={{ fontWeight: 700, textAlign: "right", color: "#2563eb" }}>{fmtBRL(resultado.totalMO)}</span>
                  </>}
                  <span style={{ color: C.text, fontWeight: 700 }}>Total geral</span>
                  <span style={{ fontWeight: 800, textAlign: "right", color: C.red, fontSize: 14 }}>{fmtBRL(resultado.totalGeral)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setModalSalvar(false)} style={{
                padding: "9px 20px", background: "none", border: `1px solid ${C.border}`,
                borderRadius: 7, cursor: "pointer", fontSize: 13,
              }}>Cancelar</button>
              <button onClick={salvarComoOrcamento} disabled={salvando} style={{
                padding: "9px 24px", background: C.red, color: "#fff",
                border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700,
                cursor: salvando ? "wait" : "pointer", opacity: salvando ? 0.7 : 1,
              }}>
                {salvando ? "Salvando…" : "Salvar e abrir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: C.graphite,
          color: "#fff", padding: "10px 20px", borderRadius: 8, zIndex: 9999, fontSize: 13 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
