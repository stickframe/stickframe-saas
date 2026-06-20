import { useState, useEffect } from "react";
import { CalendarDays, ClipboardList, FileText, Save } from "../components/ui/Icon";
import { useToast } from "../hooks/useToast";
import { printHtml } from "../utils/printHtml";
import { CUB_ESTADOS, PADROES_SF, SISTEMAS_SF } from "../utils/insumosSF";
import { C } from "../utils/constants";
import { LOGO_STICKFRAME } from "../utils/cdn";
import useAppStore from "../store/useAppStore";
import { listarPrecosVivos } from "../services/repositories/precosRepository";
import { criarOrcamento } from "../services/repositories/orcamentoRepository";

const LS_KEY = "sf_orcamento_tecnico_v1";

const fmtBRL = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtN   = (v, d = 2) => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const parseN = (s) => parseFloat(String(s).replace(",", ".")) || 0;

//  Inline SVG icon set (Lucide-style) 
const ICON_PATHS = {
  mappin:   <g><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></g>,
  hardhat:  <g><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z" /><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" /><path d="M4 15v-3a8 8 0 0 1 16 0v3" /></g>,
  pct:      <g><line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></g>,
  sliders:  <g><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></g>,
  barchart: <g><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></g>,
  print:    <g><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></g>,
  dl:       <g><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></g>,
  save:     <g><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></g>,
  scale:    <g><path d="M16 16l3-8 3 8c-2 1.5-4 1.5-6 0z" /><path d="M2 16l3-8 3 8c-2 1.5-4 1.5-6 0z" /><path d="M7 8h10" /><path d="M12 2v18" /><path d="M5 22h14" /></g>,
  bolt:     <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  bank:     <g><line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 20 7 4 7 12 2" /></g>,
  clip:     <g><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></g>,
  refresh:  <g><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></g>,
  edit:     <g><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" /></g>,
  link:     <g><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></g>,
  cal:      <g><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></g>,
};
function Ic({ n, w = 15, c }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c || "currentColor"} strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ width: w, height: w, flexShrink: 0, verticalAlign: "middle" }}>
      {ICON_PATHS[n]}
    </svg>
  );
}

// Cores categóricas do handoff para a composição por categoria
const CAT_CORES = ["#b8624a", "#981915", "#3b6ea5", "#c0892d", "#4f7d57", "#6d557e", "#3b6ea5", "#57514a", "#7d1411"];

//  style atoms 
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
const btnPrimary = {
  display: "flex", alignItems: "center", gap: 7, padding: "9px 16px",
  background: C.red, color: "#fff", border: "none", borderRadius: 8,
  fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
};
const btnGhost = {
  display: "flex", alignItems: "center", gap: 7, padding: "9px 14px",
  background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8,
  fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
};

//  helpers 
function Card({ title, icon, iconBg, children }) {
  return (
    <div style={{ marginBottom: 0 }}>
      {title && (
        <div style={{
          display: "flex", alignItems: "center", gap: 9, padding: "10px 14px",
          background: C.surface2, border: `1px solid ${C.border}`,
          borderRadius: "10px 10px 0 0",
        }}>
          {icon && (
            <span style={{
              width: 24, height: 24, borderRadius: 6, display: "grid", placeItems: "center",
              background: iconBg || C.steel, flexShrink: 0,
            }}>
              <Ic n={icon} w={13} c="#fff" />
            </span>
          )}
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{title}</span>
        </div>
      )}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderTop: title ? "none" : `1px solid ${C.border}`,
        borderRadius: title ? "0 0 10px 10px" : 10,
        padding: 14, display: "flex", flexDirection: "column", gap: 10,
      }}>
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

function SummaryCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12,
      padding: "14px 16px",
    }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 700, color: color || "var(--ink)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

//  Composição por categoria (painel de resultados do handoff) 
function ComposicaoCategoria({ breakdown, totalGeral, incluiMO, totalMO }) {
  const cats = breakdown.map((s, i) => ({
    label: s.opcaoLabel ? `${s.label}` : s.label,
    valor: s.totalMat,
    cor: CAT_CORES[i % CAT_CORES.length],
  }));
  if (incluiMO && totalMO > 0) {
    cats.push({ label: "Mão de obra", valor: totalMO, cor: C.graphite });
  }
  cats.sort((a, b) => b.valor - a.valor);
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: C.muted, textTransform: "uppercase", marginBottom: 12 }}>
        Composição por categoria
      </div>
      {cats.map((c) => {
        const pct = totalGeral > 0 ? Math.round((c.valor / totalGeral) * 100) : 0;
        return (
          <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: c.cor, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{pct}%</span>
                  <span className="num" style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{fmtBRL(c.valor)}</span>
                </div>
              </div>
              <div style={{ height: 4, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: c.cor, borderRadius: 3, transition: "width .5s" }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SistemaRow({ s, aberto, toggle, precosEditados, onPrecoEdit }) {
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
        <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>
          {s.label}
          {s.opcaoLabel && (
            <span style={{ fontWeight: 400, color: C.muted }}> — {s.opcaoLabel}</span>
          )}
        </span>
        {s.totalMO > 0 && (
          <span style={{ fontSize: 11, color: C.steel, whiteSpace: "nowrap" }}>
            MO {fmtBRL(s.totalMO)}
          </span>
        )}
        <span style={{ fontSize: 13, fontWeight: 700, minWidth: 110, textAlign: "right" }}>
          {fmtBRL(total)}
        </span>
        <span style={{ fontSize: 11, color: C.muted, marginLeft: 6 }}>{aberto ? "−" : "+"}</span>
      </div>
      {aberto && (
        <div style={{ background: C.surface2 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thSt}>Insumo</th>
                <th style={{ ...thSt, width: 48, textAlign: "center" }}>Un</th>
                <th style={{ ...thSt, width: 80, textAlign: "right" }}>Qtd</th>
                <th style={{ ...thSt, width: 110, textAlign: "right" }}>Unit R$</th>
                <th style={{ ...thSt, width: 108, textAlign: "right" }}>Total R$</th>
              </tr>
            </thead>
            <tbody>
              {s.itensCalc.map((item, i) => {
                const key = `${s.id}_${i}`;
                const editado = precosEditados?.[key];
                const precoExib = editado ?? item.precoUsado ?? item.preco;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: editado ? C.brickSoft : item.precoVivo ? "#e8f3eb" : i % 2 ? C.surface2 : C.surface }}>
                    <td style={tdSt}>
                      {item.nome}
                      {item.precoVivo && !editado && (
                        <span style={{ marginLeft: 6, fontSize: 10, background: "#e8f3eb", color: C.success, padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>ao vivo</span>
                      )}
                      {editado && <span style={{ marginLeft: 6, fontSize: 10, background: "#f6efe0", color: C.warning, padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>ajustado</span>}
                    </td>
                    <td style={{ ...tdSt, textAlign: "center", color: C.muted }}>{item.un}</td>
                    <td style={{ ...tdSt, textAlign: "right" }}>{fmtN(item.qtd)}</td>
                    <td style={{ ...tdSt, textAlign: "right", padding: "4px 6px" }}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editado ?? (item.precoUsado ?? item.preco)}
                        onChange={(e) => onPrecoEdit?.(key, parseFloat(e.target.value) || 0)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: 80, padding: "3px 6px", border: `1px solid ${editado ? C.ochre : C.border}`, borderRadius: 4, fontSize: 12, textAlign: "right", background: editado ? C.brickSoft : C.surface }}
                      />
                      {item.precoVivo && item.preco !== item.precoUsado && !editado && (
                        <div style={{ fontSize: 10, color: C.muted, textDecoration: "line-through" }}>{fmtN(item.preco)}</div>
                      )}
                    </td>
                    <td style={{ ...tdSt, textAlign: "right", fontWeight: 600 }}>{fmtN(item.qtd * precoExib)}</td>
                  </tr>
                );
              })}
              {s.totalMO > 0 && (
                <tr style={{ background: "#eef3f9" }}>
                  <td style={{ ...tdSt, fontStyle: "italic", color: C.steel }} colSpan={4}>Mão de obra (fração CUB regional)</td>
                  <td style={{ ...tdSt, textAlign: "right", fontWeight: 700, color: C.steel }}>{fmtN(s.totalMO)}</td>
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

//  main component 
const CRM_LEAD_KEY = "sf_crm_lead";

export default function OrcamentoTecnico() {
  const setActivePage  = useAppStore((s) => s.setActivePage);
  const updateCliente  = useAppStore((s) => s.updateCliente);

  //  Restaura form do localStorage 
  const savedForm = (() => { try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; } })();
  const { toast, mostrarToast } = useToast();

  const [estado, setEstado]         = useState(savedForm.estado     ?? "SP");
  const [cubManual, setCubManual]   = useState(savedForm.cubManual  ?? "");
  const [area, setArea]             = useState(savedForm.area       ?? "");
  const [areaMolhada, setAreaMolhada] = useState(savedForm.areaMolhada ?? "");
  const [pavimentos, setPavimentos] = useState(savedForm.pavimentos ?? "1");
  const [padrao, setPadrao]         = useState(savedForm.padrao     ?? "Padrão");
  const [incluiMO, setIncluiMO]     = useState(savedForm.incluiMO  ?? true);
  const [bdi, setBdi]               = useState(savedForm.bdi        ?? 25);
  const [prazoMeses, setPrazoMeses] = useState(savedForm.prazoMeses ?? "");
  const [abertos, setAbertos]           = useState({});
  const [resultado, setResultado]       = useState(null);
  const [comparativo, setComparativo]   = useState(null);
  const [precosEditados, setPrecosEditados] = useState({});
  const [modalSalvar, setModalSalvar]   = useState(false);
  const [formSalvar, setFormSalvar]     = useState({ cliente: "", validade_dias: 30, observacoes: "" });
  const [salvando, setSalvando]         = useState(false);
  const [modalFinanc, setModalFinanc]   = useState(false);
  const [financForm, setFinancForm]     = useState({ entrada: 20, prazo: 120, taxa: 1.0 });




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

  // Lê contexto do CRM (lead selecionado) e pré-preenche
  const [crmLead, setCrmLead] = useState(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CRM_LEAD_KEY);
      if (raw) {
        const lead = JSON.parse(raw);
        setCrmLead(lead);
        setFormSalvar((f) => ({ ...f, cliente: lead.nome || f.cliente }));
        localStorage.removeItem(CRM_LEAD_KEY);
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const itensCalc = itensBase.map((item, itemIdx) => {
        const fator = item.aplicaFatorPadrao || aplicaFatorOpcao ? fatorPadrao : 1;
        const qtd   = item.base * areaUsada * fator;
        const vivo  = usarPrecosVivos && precosVivos[item.nome];
        const precoBase = vivo ? vivo.preco_atual : item.preco;
        const editKey = `${sistema.id}_${itemIdx}`;
        const precoUsado = precosEditados[editKey] ?? precoBase;
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

  // Calcula para uma opção diferente de um sistema específico (mantém todo o resto)
  const calcularParaOpcao = (sistemaId, opcaoId) => {
    const areaNum = parseN(area);
    if (areaNum <= 0) return null;
    const areaMolhadaNum = parseN(areaMolhada) || areaNum * 0.15;
    const sistemasAtivos = SISTEMAS_SF.filter((s) => habilitados[s.id]);
    let totalMat = 0, totalMO2 = 0;
    for (const sistema of sistemasAtivos) {
      const selOpcaoId = sistema.id === sistemaId ? opcaoId : selecoes[sistema.id];
      const opcaoSel = sistema.opcoes?.find((o) => o.id === selOpcaoId) || sistema.opcoes?.[0];
      const itensBase = opcaoSel ? opcaoSel.itens : sistema.itens;
      const aplicaFatorOpcao = opcaoSel?.aplicaFatorPadrao ?? false;
      const areaUsada = sistema.usaAreaMolhada ? areaMolhadaNum : areaNum;
      for (const item of itensBase) {
        const fator = item.aplicaFatorPadrao || aplicaFatorOpcao ? fatorPadrao : 1;
        const qtd = item.base * areaUsada * fator;
        const vivo = usarPrecosVivos && precosVivos[item.nome];
        const preco = vivo ? vivo.preco_atual : item.preco;
        totalMat += qtd * preco;
      }
      if (incluiMO) totalMO2 += sistema.mao_obra_cub * cubEfetivo * areaNum;
    }
    const total = totalMat + totalMO2;
    return { total, totalMat, totalMO: totalMO2, m2: total / areaNum, precoVenda: total * (1 + bdi / 100), m2Venda: total * (1 + bdi / 100) / areaNum };
  };

  const [comparativoVersoes, setComparativoVersoes] = useState(null);

  const gerarComparativoVersoes = () => {
    const estSistema = SISTEMAS_SF.find((s) => s.id === "estrutura");
    if (!estSistema?.opcoes) return;
    const base = resultado;
    const versoes = estSistema.opcoes.map((opcao) => {
      const calc = calcularParaOpcao("estrutura", opcao.id);
      if (!calc) return null;
      const diffTotal = calc.precoVenda - base.precoVenda;
      const diffPct   = (diffTotal / base.precoVenda) * 100;
      const isAtual   = selecoes["estrutura"] === opcao.id;
      return { opcaoId: opcao.id, opcaoLabel: opcao.label, ...calc, diffTotal, diffPct, isAtual };
    }).filter(Boolean);
    setComparativoVersoes(versoes);
  };

  const exportarComparativoPDF = () => {
    if (!comparativoVersoes || !resultado) return;
    const dataHoje = new Date().toLocaleDateString("pt-BR");
    const cliente = formSalvar.cliente || "—";
    const rows = comparativoVersoes.map((v) => {
      const cor = v.isAtual ? "#981915" : v.diffTotal > 0 ? "#b07a1e" : v.diffTotal < 0 ? "#3f7a4b" : "#374151";
      const diffTxt = v.isAtual ? "versão atual" : v.diffTotal > 0 ? `+${fmtBRL(v.diffTotal)} (+${v.diffPct.toFixed(1)}%)` : `${fmtBRL(v.diffTotal)} (${v.diffPct.toFixed(1)}%)`;
      return `<tr style="border-bottom:1px solid #e5e7eb;background:${v.isAtual ? "#f3e7e5" : "#fff"}">
        <td style="padding:12px 14px;font-weight:${v.isAtual ? 700 : 400};font-size:13px">${v.isAtual ? " " : ""}${v.opcaoLabel}</td>
        <td style="padding:12px 14px;text-align:right;font-size:13px">${fmtBRL(v.totalMat)}</td>
        ${resultado.incluiMO ? `<td style="padding:12px 14px;text-align:right;font-size:13px;color:#2563eb">${fmtBRL(v.totalMO)}</td>` : ""}
        <td style="padding:12px 14px;text-align:right;font-size:13px">${fmtBRL(v.total)}</td>
        <td style="padding:12px 14px;text-align:right;font-size:13px">${fmtBRL(v.m2)}</td>
        <td style="padding:12px 14px;text-align:right;font-size:14px;font-weight:700;color:#3f7a4b">${fmtBRL(v.precoVenda)}</td>
        <td style="padding:12px 14px;text-align:right;font-size:13px;color:${cor};font-weight:600">${diffTxt}</td>
      </tr>`;
    }).join("");
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>Comparativo de Versões — Stickframe</title>
    <style>*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;margin:0;padding:0}
    @media print{@page{margin:15mm 14mm}body{padding:0}}table{border-collapse:collapse;width:100%}</style>
    </head><body style="padding:36px 44px;max-width:920px;margin:auto">
    <div style="background:#1a1a1a;color:#fff;padding:8px 16px;font-size:11px;margin-bottom:0;letter-spacing:.5px">
      Stick Frame · Comparativo de Versões de Estrutura · ${cliente}
    </div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:20px 0 18px;border-bottom:2px solid #e5e7eb;margin-bottom:28px">
      <img src="${LOGO_STICKFRAME}" style="width:54px;height:54px;object-fit:contain;border-radius:8px">
      <div style="text-align:right">
        <div style="font-size:11px;letter-spacing:2px;color:#6b7280;font-weight:700">COMPARATIVO DE VERSÕES</div>
        <div style="font-size:20px;font-weight:800;color:#981915">Opções de Estrutura</div>
        <div style="font-size:10px;color:#6b7280;margin-top:2px">DATA</div>
        <div style="font-size:13px;font-weight:700">${dataHoje}</div>
      </div>
    </div>
    <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#374151;text-transform:uppercase;margin-bottom:14px">Identificação</div>
    <table style="margin-bottom:28px;font-size:13px">
      <tr><td style="padding:6px 0;color:#6b7280;width:160px">Cliente</td><td style="padding:6px 0;font-weight:600">${cliente}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Área</td><td style="padding:6px 0">${resultado.area} m²</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Padrão</td><td style="padding:6px 0">${resultado.padrao}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">CUB ${resultado.estado}</td><td style="padding:6px 0">R$ ${resultado.cub.toLocaleString("pt-BR")}/m²</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">BDI</td><td style="padding:6px 0">${bdi}%</td></tr>
    </table>
    <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#374151;text-transform:uppercase;margin-bottom:14px">Comparativo de Opções de Estrutura</div>
    <table style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
      <thead>
        <tr style="background:#1a1a1a;color:#fff">
          <th style="padding:10px 14px;text-align:left;font-size:11px">Versão</th>
          <th style="padding:10px 14px;text-align:right;font-size:11px">Materiais</th>
          ${resultado.incluiMO ? '<th style="padding:10px 14px;text-align:right;font-size:11px">MO</th>' : ""}
          <th style="padding:10px 14px;text-align:right;font-size:11px">Custo Direto</th>
          <th style="padding:10px 14px;text-align:right;font-size:11px">R$/m²</th>
          <th style="padding:10px 14px;text-align:right;font-size:11px">Preço Venda (BDI ${bdi}%)</th>
          <th style="padding:10px 14px;text-align:right;font-size:11px">Diferença</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="background:#1a1a1a;color:#fff;padding:14px 20px;border-radius:6px;font-size:11px;margin-top:40px">
      <strong>Stick Frame Sistemas Construtivos Ltda.</strong> · CNPJ 49.458.905/0001-07 · contato@stickframe.com.br
    </div>
    </body></html>`;
    printHtml(html, "comparativo-versoes");
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
      // Atualiza status do lead no CRM se veio de lá
      if (crmLead?.id) {
        try { await updateCliente(crmLead.id, { status: "Proposta enviada" }); } catch { /* non-fatal */ }
        setCrmLead(null);
      }
      setModalSalvar(false);
      mostrarToast("Orçamento salvo! Cliente atualizado no CRM.");
      setActivePage("orcamentos");
    } catch (e) {
      mostrarToast("Erro ao salvar: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const exportarPDF = () => {
    if (!resultado) return;
    const r = resultado;
    const LOGO = LOGO_STICKFRAME;
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
      ${s.totalMO > 0 ? `<tr style="background:#eef3f9"><td style="padding:6px 10px 6px 22px;font-style:italic;color:#3b6ea5;font-size:12px" colspan="4">Mão de obra (CUB-based)</td><td style="padding:6px 10px;text-align:right;font-weight:700;color:#3b6ea5;font-size:12px">${fmtBRL(s.totalMO)}</td></tr>` : ""}
    `).join("");

    const cronoRows = r.cronograma.length ? `
      <div style="page-break-before:always">
      <h3 style="margin:0 0 14px;font-size:15px"><CalendarDays size={13} /> Cronograma Financeiro Estimado</h3>
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
        <div style="border-top:3px solid #3f7a4b;background:#fff;border:1px solid #eee;border-radius:8px;padding:12px 14px">
          <div style="font-size:10px;color:#666">PREÇO DE VENDA (BDI ${r.bdi}%)</div>
          <div style="font-size:15px;font-weight:700;color:#3f7a4b">${fmtBRL(r.precoVenda)}</div>
          <div style="font-size:11px;color:#888">${fmtBRL(r.m2Venda)}/m²</div>
        </div>
      </div>

      <!-- COMPOSIÇÃO -->
      <h3 style="margin:0 0 12px;font-size:15px"><ClipboardList size={13} /> Composição por Sistema</h3>
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

    printHtml(html, "orcamento-tecnico");
  };

  const calcFinanciamento = () => {
    if (!resultado) return null;
    const total = resultado.precoVenda;
    const entrada = total * (financForm.entrada / 100);
    const financiado = total - entrada;
    const n = financForm.prazo;
    const i = financForm.taxa / 100;
    // Price (parcela fixa)
    const parcelaPrice = financiado * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    const totalPrice = entrada + parcelaPrice * n;
    const jurosPrice = totalPrice - total;
    // SAC (amortização constante)
    const amort = financiado / n;
    const primeiroSAC = amort + financiado * i;
    const ultimoSAC   = amort + (financiado / n) * i;
    const totalSAC    = entrada + (primeiroSAC + ultimoSAC) / 2 * n;
    const jurosSAC    = totalSAC - total;
    return { total, entrada, financiado, n, i, parcelaPrice, totalPrice, jurosPrice, primeiroSAC, ultimoSAC, totalSAC, jurosSAC };
  };

  const exportarPropostaCliente = () => {
    if (!resultado) return;
    const r = resultado;
    const LOGO = LOGO_STICKFRAME;
    const dataHoje = new Date().toLocaleDateString("pt-BR");
    const validadeDias = formSalvar.validade_dias || 30;
    const validadeDate = new Date(); validadeDate.setDate(validadeDate.getDate() + validadeDias);
    const numProposta  = `${new Date().getFullYear()}/${String(Date.now()).slice(-4).padStart(4,"0")}`;
    const cliente      = formSalvar.cliente || "—";
    const prazo        = r.prazoMeses ? `${r.prazoMeses} meses` : "A definir";
    const sinal        = r.precoVenda * 0.10;

    // Escopo — monta linha por sistema habilitado
    const escopoRows = r.breakdown.map((s, i) => `
      <tr style="border-bottom:1px solid #e5e7eb">
        <td style="padding:12px 14px;color:#6b7280;font-size:13px;vertical-align:top">${String(i+1).padStart(2,"0")}</td>
        <td style="padding:12px 14px;vertical-align:top">
          <div style="font-weight:700;font-size:13px">${s.label}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:2px">${s.opcaoLabel || "Padrão"}</div>
        </td>
        <td style="padding:12px 14px;font-size:13px;color:#374151;vertical-align:top">${s.descricaoEscopo || "Conforme especificação técnica do projeto."}</td>
      </tr>`).join("");

    // Composição do valor
    const totalUnid = r.precoVenda;
    const m2 = r.m2Venda;

    // Condições de pagamento
    const pgtoRows = `
      <tr style="border-bottom:1px solid #e5e7eb">
        <td style="padding:12px 14px;font-weight:700;font-size:13px">Sinal / Mobiliza&ccedil;&atilde;o</td>
        <td style="padding:12px 14px;font-weight:700;color:#981915;font-size:13px">${fmtBRL(sinal)}</td>
        <td style="padding:12px 14px;font-size:13px;color:#374151">Pagamento antes do in&iacute;cio da obra, destinado &agrave; compra de materiais e mobiliza&ccedil;&atilde;o da equipe</td>
      </tr>
      <tr style="border-bottom:1px solid #e5e7eb">
        <td style="padding:12px 14px;font-weight:700;font-size:13px">Saldo</td>
        <td style="padding:12px 14px;font-weight:700;color:#981915;font-size:13px">${fmtBRL(r.precoVenda - sinal)}</td>
        <td style="padding:12px 14px;font-size:13px;color:#374151">Conforme medi&ccedil;&otilde;es das etapas de evolu&ccedil;&atilde;o de obra</td>
      </tr>
      <tr style="background:#981915">
        <td style="padding:12px 14px;font-weight:700;color:#fff;font-size:13px">Total do Contrato</td>
        <td style="padding:12px 14px;font-weight:700;color:#fff;font-size:14px">${fmtBRL(r.precoVenda)}</td>
        <td style="padding:12px 14px;color:#fecaca;font-size:12px">Sinal de ${fmtBRL(sinal)} + saldo conforme medi&ccedil;&otilde;es</td>
      </tr>`;

    const obsCliente = formSalvar.observacoes ? `<li>${formSalvar.observacoes}</li>` : "";

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>Proposta Comercial ${numProposta} — Stickframe</title>
    <style>
      *{box-sizing:border-box}
      body{font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;margin:0;padding:0;background:#fff}
      @media print{@page{margin:15mm 14mm}body{padding:0}.no-print{display:none}}
      table{border-collapse:collapse;width:100%}
    </style></head>
    <body style="padding:36px 44px;max-width:860px;margin:auto">

      <!-- CABEÇALHO TOPO -->
      <div style="background:#1a1a1a;color:#fff;padding:8px 16px;font-size:11px;margin-bottom:0;letter-spacing:.5px">
        Stick Frame &middot; Proposta Comercial &middot; Steel Frame &middot; ${cliente}
      </div>

      <!-- HEADER LOGO + NÚMERO -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:20px 0 18px;border-bottom:2px solid #e5e7eb;margin-bottom:28px">
        <img src="${LOGO}" style="width:54px;height:54px;object-fit:contain;border-radius:8px">
        <div style="text-align:right">
          <div style="font-size:11px;letter-spacing:2px;color:#6b7280;font-weight:700">PROPOSTA COMERCIAL</div>
          <div style="font-size:22px;font-weight:800;color:#981915">N&ordm; ${numProposta}</div>
          <div style="font-size:10px;color:#6b7280;margin-top:2px">DATA DE EMISS&Atilde;O</div>
          <div style="font-size:13px;font-weight:700">${dataHoje}</div>
        </div>
      </div>

      <!-- IDENTIFICAÇÃO DO PROJETO -->
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#374151;text-transform:uppercase;margin-bottom:14px">Identifica&ccedil;&atilde;o do Projeto</div>
      <table style="margin-bottom:32px;font-size:13px">
        <tr><td style="padding:7px 0;color:#6b7280;width:160px">Cliente</td><td style="padding:7px 0;font-weight:600">${cliente}</td></tr>
        <tr><td style="padding:7px 0;color:#6b7280">Projeto</td><td style="padding:7px 0">Resid&ecirc;ncia em Sistema Steel Frame &mdash; ${r.area} m&sup2;</td></tr>
        <tr><td style="padding:7px 0;color:#6b7280">Sistema</td><td style="padding:7px 0">Steel Frame &mdash; A&ccedil;o Engenheirado (${r.padrao})</td></tr>
        <tr><td style="padding:7px 0;color:#6b7280">&Aacute;rea Total</td><td style="padding:7px 0">${r.area} m&sup2;</td></tr>
        <tr><td style="padding:7px 0;color:#6b7280">Data do Or&ccedil;amento</td><td style="padding:7px 0">${dataHoje}</td></tr>
        <tr><td style="padding:7px 0;color:#6b7280">Validade</td><td style="padding:7px 0">${validadeDias} dias</td></tr>
      </table>

      <!-- ESCOPO DOS SERVIÇOS -->
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#374151;text-transform:uppercase;margin-bottom:14px">Escopo dos Servi&ccedil;os</div>
      <table style="margin-bottom:32px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:#1a1a1a;color:#fff">
            <th style="padding:10px 14px;text-align:left;font-size:11px;width:36px">#</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;width:180px">Item</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px">Descri&ccedil;&atilde;o</th>
          </tr>
        </thead>
        <tbody>${escopoRows}</tbody>
      </table>

      <!-- COMPOSIÇÃO DO VALOR -->
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#374151;text-transform:uppercase;margin-bottom:14px">Composi&ccedil;&atilde;o do Valor</div>
      <table style="margin-bottom:8px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:#1a1a1a;color:#fff">
            <th style="padding:10px 14px;text-align:left;font-size:11px">Descri&ccedil;&atilde;o</th>
            <th style="padding:10px 14px;text-align:right;font-size:11px">Qtde</th>
            <th style="padding:10px 14px;text-align:right;font-size:11px">Unid.</th>
            <th style="padding:10px 14px;text-align:right;font-size:11px">R$/m&sup2;</th>
            <th style="padding:10px 14px;text-align:right;font-size:11px">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #e5e7eb">
            <td style="padding:14px;font-size:13px">
              <div style="font-weight:600">Sistema Steel Frame completo</div>
              <div style="font-size:11px;color:#6b7280;margin-top:2px">Estrutura + fechamentos + cobertura + instala&ccedil;&otilde;es</div>
            </td>
            <td style="padding:14px;text-align:right;font-size:13px">${r.area}</td>
            <td style="padding:14px;text-align:right;font-size:13px">m&sup2;</td>
            <td style="padding:14px;text-align:right;font-size:13px">${fmtBRL(m2)}</td>
            <td style="padding:14px;text-align:right;font-size:14px;font-weight:800;color:#981915">${fmtBRL(totalUnid)}</td>
          </tr>
        </tbody>
      </table>
      <div style="text-align:right;font-size:13px;color:#374151;margin-bottom:32px">
        <strong>Valor total do contrato: ${fmtBRL(totalUnid)}</strong>
      </div>

      <!-- CONDIÇÕES DE PAGAMENTO (página 2) -->
      <div style="page-break-before:always"></div>

      <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#374151;text-transform:uppercase;margin-bottom:14px">Condi&ccedil;&otilde;es de Pagamento</div>
      <table style="margin-bottom:32px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:#1a1a1a;color:#fff">
            <th style="padding:10px 14px;text-align:left;font-size:11px">Parcela</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px">Valor</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px">Condi&ccedil;&atilde;o</th>
          </tr>
        </thead>
        <tbody>${pgtoRows}</tbody>
      </table>

      <!-- PRAZO -->
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#374151;text-transform:uppercase;margin-bottom:14px">Prazo de Execu&ccedil;&atilde;o</div>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:32px;font-size:13px;color:#374151">
        Prazo estimado de execu&ccedil;&atilde;o: <strong>${prazo}</strong>, podendo ser prorrogado mediante aditivo contratual.
      </div>

      <!-- OBSERVAÇÕES -->
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#374151;text-transform:uppercase;margin-bottom:14px">Observa&ccedil;&otilde;es Gerais</div>
      <ul style="font-size:13px;color:#374151;line-height:2;margin:0 0 40px;padding-left:20px">
        <li>Proposta v&aacute;lida por ${validadeDias} dias a partir de ${dataHoje}.</li>
        <li>Valores baseados no CUB ${r.estado} &mdash; R$ ${r.cub.toLocaleString("pt-BR")}/m&sup2;.</li>
        <li>Valores sujeitos a confirma&ccedil;&atilde;o mediante vistoria do terreno.</li>
        <li>N&atilde;o inclui m&oacute;veis planejados e paisagismo.</li>
        ${obsCliente}
      </ul>

      <!-- ACEITE -->
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#374151;text-transform:uppercase;margin-bottom:24px">Aceite da Proposta</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-bottom:60px">
        <div style="text-align:center">
          <div style="border-top:1px solid #374151;padding-top:10px;font-size:13px;font-weight:700">${cliente}</div>
          <div style="font-size:12px;color:#6b7280">Contratante</div>
        </div>
        <div style="text-align:center">
          <div style="border-top:1px solid #374151;padding-top:10px;font-size:13px;font-weight:700">Stick Frame Sistemas Construtivos Ltda.</div>
          <div style="font-size:12px;color:#6b7280">CNPJ 49.458.905/0001-07 &mdash; Contratada</div>
        </div>
      </div>

      <!-- RODAPÉ -->
      <div style="background:#1a1a1a;color:#fff;padding:14px 20px;border-radius:6px;font-size:11px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <strong>Stick Frame Sistemas Construtivos Ltda.</strong><br>
          CNPJ 49.458.905/0001-07 &middot; Rua Trento, 52 &mdash; Santo Andr&eacute; / SP<br>
          (11) 98985-9995 &middot; contato@stickframe.com.br &middot; www.stickframe.com.br
        </div>
        <div style="text-align:right">
          <div style="color:#9ca3af">Validade desta proposta</div>
          <div style="color:#ef4444;font-size:16px;font-weight:800">${validadeDias} dias</div>
          <div style="color:#9ca3af">N&ordm; ${numProposta}</div>
        </div>
      </div>

    </body></html>`;

    printHtml(html, "proposta-comercial");
  };

  // exportarPropostaCliente_LEGADO — mantido para compatibilidade
  const exportarPropostaClienteLegado = () => {
    if (!resultado) return;
    const r = resultado;
    const LOGO = LOGO_STICKFRAME;
    const dataHoje = new Date().toLocaleDateString("pt-BR");
    const validade = new Date(); validade.setDate(validade.getDate() + 30);

    const fasesRows = r.breakdown.map((s) => {
      const total = s.totalMat + s.totalMO;
      const pct = ((total / r.totalGeral) * 100).toFixed(1);
      return `<tr style="border-bottom:1px solid #eee">
        <td style="padding:10px 14px">${s.icon} ${s.label}</td>
        <td style="padding:10px 14px;color:#666;font-size:12px">${s.opcaoLabel || "Padrão"}</td>
        <td style="padding:10px 14px;text-align:right;font-weight:600">${fmtBRL(total)}</td>
        <td style="padding:10px 14px;text-align:right;color:#888;font-size:12px">${pct}%</td>
      </tr>`;
    }).join("");

    const cronoHtml = r.cronograma.length ? `
      <h3 style="margin:32px 0 14px;font-size:15px;color:#1a1a1a"><CalendarDays size={13} /> Plano de Desembolso Estimado</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr style="background:#981915;color:#fff">
          <th style="padding:8px 12px;text-align:left">Mês</th>
          <th style="padding:8px 12px;text-align:right">Valor Previsto</th>
          <th style="padding:8px 12px;text-align:right">% do Total</th>
        </tr></thead>
        <tbody>
          ${r.cronograma.map((m, i) => `<tr style="background:${i%2?"#f9f9f9":"#fff"};border-bottom:1px solid #eee">
            <td style="padding:8px 12px">Mês ${m.mes}</td>
            <td style="padding:8px 12px;text-align:right;font-weight:600">${fmtBRL(m.valor)}</td>
            <td style="padding:8px 12px;text-align:right;color:#666">${(m.pct*100).toFixed(1)}%</td>
          </tr>`).join("")}
        </tbody>
      </table>` : "";

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>Proposta Comercial — Stickframe</title>
    <style>
      body{font-family:Arial,sans-serif;color:#1a1a1a;margin:0;padding:0;background:#fff}
      @media print{@page{margin:20mm 18mm}.no-print{display:none}}
      h3{color:#981915}
    </style></head>
    <body style="padding:40px 48px;max-width:820px;margin:auto">

      <!-- CABEÇALHO -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:20px;border-bottom:3px solid #981915;margin-bottom:32px">
        <div style="display:flex;align-items:center;gap:14px">
          <img src="${LOGO}" style="width:56px;height:56px;border-radius:12px;object-fit:contain">
          <div>
            <div style="font-size:24px;font-weight:800;letter-spacing:1px">STICK<span style="color:#981915">FRAME</span></div>
            <div style="font-size:10px;color:#888;letter-spacing:2px;margin-top:2px">SISTEMAS CONSTRUTIVOS</div>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:20px;font-weight:700;color:#981915">PROPOSTA COMERCIAL</div>
          <div style="font-size:12px;color:#666;margin-top:4px">Data: ${dataHoje}</div>
          <div style="font-size:12px;color:#666">Validade: ${validade.toLocaleDateString("pt-BR")}</div>
        </div>
      </div>

      <!-- DESTAQUE DO VALOR -->
      <div style="background:linear-gradient(135deg,#981915,#a33327);color:#fff;border-radius:12px;padding:28px 32px;margin-bottom:28px;text-align:center">
        <div style="font-size:13px;letter-spacing:2px;opacity:0.85;margin-bottom:8px">INVESTIMENTO TOTAL</div>
        <div style="font-size:42px;font-weight:800;letter-spacing:-1px">${fmtBRL(r.precoVenda)}</div>
        <div style="font-size:14px;opacity:0.85;margin-top:6px">${fmtBRL(r.m2Venda)}/m² · ${r.area} m² · Padrão ${r.padrao}</div>
      </div>

      <!-- DADOS DA OBRA -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:28px">
        <div style="border:1px solid #eee;border-radius:8px;padding:14px">
          <div style="font-size:10px;color:#888;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px">Área Total</div>
          <div style="font-size:18px;font-weight:700">${r.area} m²</div>
        </div>
        <div style="border:1px solid #eee;border-radius:8px;padding:14px">
          <div style="font-size:10px;color:#888;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px">Padrão Construtivo</div>
          <div style="font-size:18px;font-weight:700">${r.padrao}</div>
        </div>
        <div style="border:1px solid #eee;border-radius:8px;padding:14px">
          <div style="font-size:10px;color:#888;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px">Prazo Estimado</div>
          <div style="font-size:18px;font-weight:700">${r.prazoMeses ? r.prazoMeses + " meses" : "A definir"}</div>
        </div>
      </div>

      <!-- COMPOSIÇÃO POR FASE -->
      <h3 style="margin:0 0 14px;font-size:16px"><HardHat size={13} /> Composição por Sistema Construtivo</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:28px">
        <thead><tr style="background:#1a1a1a;color:#fff">
          <th style="padding:10px 14px;text-align:left">Sistema</th>
          <th style="padding:10px 14px;text-align:left">Especificação</th>
          <th style="padding:10px 14px;text-align:right">Valor</th>
          <th style="padding:10px 14px;text-align:right">%</th>
        </tr></thead>
        <tbody>${fasesRows}</tbody>
        <tfoot>
          <tr style="background:#f4f4f4;font-weight:700">
            <td colspan="2" style="padding:12px 14px">Custo Direto de Obra</td>
            <td style="padding:12px 14px;text-align:right">${fmtBRL(r.totalGeral)}</td>
            <td style="padding:12px 14px;text-align:right">100%</td>
          </tr>
          <tr style="background:#981915;color:#fff;font-weight:700;font-size:15px">
            <td colspan="2" style="padding:14px">Preço de Venda (inclui BDI ${r.bdi}%)</td>
            <td colspan="2" style="padding:14px;text-align:right">${fmtBRL(r.precoVenda)}</td>
          </tr>
        </tfoot>
      </table>

      ${cronoHtml}

      <!-- CONDIÇÕES -->
      <div style="margin-top:32px;border:1px solid #eee;border-radius:8px;padding:20px">
        <h4 style="margin:0 0 12px;font-size:14px;color:#981915"><ClipboardList size={13} /> Condições Comerciais</h4>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:#444;line-height:1.8">
          <li>Proposta válida por 30 dias a partir de ${dataHoje}</li>
          <li>Valores sujeitos a confirmação mediante vistoria do terreno</li>
          <li>Forma de pagamento a definir em contrato</li>
          <li>Inclui projeto, materiais Steel Frame, mão de obra e instalações conforme escopo</li>
          <li>Preços baseados no CUB ${r.estado} — R$ ${r.cub.toLocaleString("pt-BR")}/m²</li>
        </ul>
      </div>

      <!-- ASSINATURA -->
      <div style="margin-top:48px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
        <div style="border-top:1px solid #ccc;padding-top:12px;text-align:center;font-size:12px;color:#666">
          Stickframe Sistemas Construtivos<br>Responsável Técnico
        </div>
        <div style="border-top:1px solid #ccc;padding-top:12px;text-align:center;font-size:12px;color:#666">
          Cliente<br>Data: ___/___/______
        </div>
      </div>

      <div style="margin-top:24px;font-size:10px;color:#bbb;text-align:center">
        Stickframe Sistemas Construtivos · Santo André/SP · Gerado em ${dataHoje}
      </div>
    </body></html>`;

    printHtml(html, "orcamento-tecnico");
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
      mostrarToast("Erro ao exportar Excel");
    }
  };


  return (
    <div style={{ display: "flex", gap: 20, padding: "20px 24px", minHeight: "100vh",
      background: C.bg, alignItems: "flex-start", flexWrap: "wrap" }}>

      {/*  LEFT: configuração  */}
      <div style={{ width: 400, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ width: 4, height: 42, borderRadius: 3, background: "var(--brick)", flexShrink: 0, marginTop: 2 }} />
          <div>
            <h2 style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, color: "var(--ink)", lineHeight: 1.1 }}>Orçamento Técnico</h2>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 12.5 }}>
              Composição completa de insumos Steel Frame — preços regionais via CUB
            </p>
          </div>
        </div>

        {/* Summary bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}>
          <span style={{ flex: 1, color: "var(--muted)", fontWeight: 500 }}>
            {area ? `Residencial · ${area} m²` : "Configure a obra"}
          </span>
          <span style={{ color: "var(--muted)", fontSize: 11 }}>
            {SISTEMAS_SF.filter(s => s.obrigatorio && habilitados[s.id]).length}/{SISTEMAS_SF.filter(s => s.obrigatorio).length} obrigatórios
          </span>
          <button
            onClick={calcular}
            disabled={!area}
            style={{ padding: "4px 12px", background: "var(--brick)", color: "#fff", border: "none", borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: area ? "pointer" : "not-allowed", opacity: area ? 1 : 0.5, fontFamily: "inherit" }}
          >
            Calcular
          </button>
        </div>

        <button
          onClick={calcular}
          disabled={!area}
          style={{
            padding: "13px 0", background: "var(--brick)", color: "#fff", border: "none",
            borderRadius: 11, fontSize: 14.5, fontWeight: 700,
            cursor: area ? "pointer" : "not-allowed", opacity: area ? 1 : 0.5,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            fontFamily: "inherit", letterSpacing: .3, width: "100%",
          }}
        >
          <Ic n="barchart" w={16} c="#fff" /> Calcular Orçamento
        </button>

        {crmLead && (
          <div style={{ background: C.brickSoft, border: `1px solid ${C.red}44`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: C.red }}><Ic n="link" w={16} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.red, fontWeight: 700 }}>VIA CRM</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{crmLead.nome}</div>
            </div>
            <button onClick={() => setCrmLead(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>×</button>
          </div>
        )}

        {/* Localização */}
        <Card title="Localização e CUB" icon="mappin" iconBg={C.steel}>
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
        <Card title="Dados da Obra" icon="hardhat" iconBg={C.ochre}>
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
                  ? <span style={{ color: C.success, fontWeight: 700 }}> {qtdPrecosVivos} monitorados</span>
                  : <span style={{ color: C.muted }}> (nenhum monitorado)</span>
              }
            </span>
          </label>
        </Card>

        {/* BDI */}
        <Card title="BDI e Preço de Venda" icon="pct" iconBg={C.sage}>
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
        <Card title="Sistemas Construtivos" icon="sliders" iconBg={C.plum}>
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
                    {s.label}
                  </span>
                </label>
                {s.obrigatorio && (
                  <span style={{ fontSize: 10, background: C.red, color: "#fff",
                    borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>obrigatório</span>
                )}
              </div>
              {habilitados[s.id] && s.opcoes && (
                s.opcoes.length <= 2 ? (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                    {s.opcoes.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => setSelecoes((p) => ({ ...p, [s.id]: o.id }))}
                        style={{
                          border: `1px solid ${selecoes[s.id] === o.id ? "var(--brick)" : "var(--line)"}`,
                          borderRadius: 8,
                          padding: "8px 14px",
                          fontSize: 13,
                          background: selecoes[s.id] === o.id ? "var(--brick)" : "transparent",
                          color: selecoes[s.id] === o.id ? "#fff" : "var(--ink)",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          fontWeight: selecoes[s.id] === o.id ? 700 : 400,
                          transition: "all 0.15s",
                        }}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <select
                    value={selecoes[s.id]}
                    onChange={(e) => setSelecoes((p) => ({ ...p, [s.id]: e.target.value }))}
                    style={{ ...selectSt, fontSize: 12 }}
                  >
                    {s.opcoes.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                )
              )}
              {habilitados[s.id] && s.opcoes && (
                <p style={{ margin: "4px 0 0", fontSize: 11, color: C.muted, lineHeight: 1.4 }}>
                  {s.opcoes.find((o) => o.id === selecoes[s.id])?.desc}
                </p>
              )}
            </div>
          ))}
        </Card>

        <div style={{ position: "sticky", bottom: 0, background: "var(--bg)", paddingTop: 10, paddingBottom: 10, marginTop: 4 }}>
          <button
            onClick={calcular}
            disabled={!area}
            style={{
              padding: "14px 0", background: "var(--brick)", color: "#fff", border: "none",
              borderRadius: 11, fontSize: 14.5, fontWeight: 700,
              cursor: area ? "pointer" : "not-allowed", opacity: area ? 1 : 0.5,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              fontFamily: "inherit", letterSpacing: .3, width: "100%",
            }}
          >
            <Ic n="barchart" w={16} c="#fff" /> Calcular Orçamento
          </button>
        </div>
      </div>

      {/*  RIGHT: resultado  */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!resultado ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            textAlign: "center", padding: "80px 40px",
            background: "var(--surface)", borderRadius: 16, border: "1px solid var(--line)" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--brick-soft)", color: "var(--brick)", display: "grid", placeItems: "center", marginBottom: 18 }}>
              <Ic n="barchart" w={26} c="var(--brick)" />
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 24, color: "var(--ink)", marginBottom: 8 }}>Configure e calcule</div>
            <p style={{ fontSize: 13.5, margin: 0, maxWidth: 320, lineHeight: 1.6, color: "var(--muted)" }}>
              Preencha os parâmetros ao lado e clique em <strong style={{ color: "var(--ink)" }}>Calcular Orçamento</strong>.
              Gera composição detalhada de todos os insumos com preços regionais calibrados por CUB.
            </p>
            <button
              onClick={calcular}
              disabled={!area}
              style={{
                marginTop: 20, padding: "11px 28px", background: "var(--brick)", color: "#fff",
                border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: area ? "pointer" : "not-allowed", opacity: area ? 1 : 0.5,
                fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <Ic n="barchart" w={16} c="#fff" /> Calcular Orçamento
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* título do painel de resultados */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 4, height: 36, borderRadius: 3, background: "var(--brick)", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 24, color: "var(--ink)", lineHeight: 1.1, marginBottom: 3 }}>Composição calculada</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                  Preços calibrados por CUB · {CUB_ESTADOS[resultado.estado]?.nome} ({resultado.estado}) · {resultado.area} m² · {resultado.padrao} (×{resultado.fatorPadrao})
                </div>
              </div>
            </div>

            {/* KPI grid 2×2 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              <SummaryCard label="Total Materiais" value={fmtBRL(resultado.totalMateriais)}
                sub={fmtBRL(resultado.m2Mat) + "/m²"} color={C.text} />
              {resultado.incluiMO && (
                <SummaryCard label="Mão de Obra" value={fmtBRL(resultado.totalMO)}
                  sub={fmtBRL(resultado.m2MO) + "/m²"} color={C.steel} />
              )}
              <SummaryCard label="Custo Direto" value={fmtBRL(resultado.totalGeral)}
                sub={fmtBRL(resultado.m2) + "/m²"} color={C.red} />
              <SummaryCard label={`Preço de Venda · BDI ${resultado.bdi}%`}
                value={fmtBRL(resultado.precoVenda)}
                sub={fmtBRL(resultado.m2Venda) + "/m²"} color={C.success} />
            </div>

            {/* lista compacta de grupos */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Resumo por sistema</div>
              {resultado.breakdown.map((s) => {
                const total = s.totalMat + s.totalMO;
                const pct = resultado.totalGeral > 0 ? ((total / resultado.totalGeral) * 100).toFixed(0) : 0;
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--line)", fontSize: 12 }}>
                    <span style={{ flex: 1, color: "var(--ink)" }}>{s.label}{s.opcaoLabel ? ` — ${s.opcaoLabel}` : ""}</span>
                    <span style={{ color: "var(--muted)", fontSize: 11, minWidth: 32, textAlign: "right" }}>{pct}%</span>
                    <span style={{ fontWeight: 700, minWidth: 110, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14 }}>{fmtBRL(total)}</span>
                  </div>
                );
              })}
            </div>

            {/* composição por categoria */}
            <ComposicaoCategoria
              breakdown={resultado.breakdown}
              totalGeral={resultado.totalGeral}
              incluiMO={resultado.incluiMO}
              totalMO={resultado.totalMO}
            />

            {/* action buttons — primários em destaque */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button onClick={exportarExcel} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", background: "var(--surface)", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                <Ic n="dl" w={14} /> Exportar Excel
              </button>
              <button onClick={exportarPDF} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", background: "var(--surface)", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                <Ic n="print" w={14} /> Imprimir
              </button>
              <button onClick={exportarPropostaCliente} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", background: "var(--brick)", color: "#fff", border: "1px solid var(--brick)", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                <Ic n="clip" w={14} c="#fff" /> Virar proposta
              </button>
            </div>
            {/* ações secundárias */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <button onClick={() => setModalSalvar(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 13px", background: "var(--surface)", color: "var(--ink-2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                <Ic n="save" w={12} /> Salvar
              </button>
              <button onClick={gerarComparativo} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 13px", background: "var(--surface)", color: "var(--ink-2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                <Ic n="scale" w={12} /> Comparar Padrões
              </button>
              <button onClick={gerarComparativoVersoes} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 13px", background: "var(--surface)", color: "var(--ink-2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                <Ic n="sliders" w={12} /> Espessuras
              </button>
              <button onClick={() => setModalFinanc(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 13px", background: "var(--surface)", color: "var(--ink-2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                <Ic n="bank" w={12} /> Financiamento
              </button>
              {Object.keys(precosEditados).length > 0 && (
                <button onClick={() => { setPrecosEditados({}); calcular(); }} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 13px", background: "var(--surface)", color: "var(--ink-2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  <Ic n="refresh" w={12} /> Limpar ajustes
                </button>
              )}
              <button onClick={() => setResultado(null)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 13px", background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                <Ic n="refresh" w={12} /> Recalcular
              </button>
            </div>

            {/* aviso ajuste de preços */}
            {Object.keys(precosEditados).length > 0 && (
              <div style={{ background: "#fefce8", border: "1px solid #eab308", borderRadius: 8, padding: "9px 14px", fontSize: 12, color: "#713f12", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Ic n="edit" w={13} /> {Object.keys(precosEditados).length} preço(s) ajustado(s) manualmente. Clique em <strong>Calcular Orçamento</strong> para atualizar os totais.</span>
              </div>
            )}



            {/* comparativo de padrões */}
            {comparativo && (
              <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Ic n="scale" w={15} /> Comparativo de Padrões</span>
                  <button onClick={() => setComparativo(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12 }}> fechar</button>
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
                            {c.padrao === resultado.padrao && <span style={{ color: C.red, marginRight: 4 }}></span>}
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

            {/* comparativo de versões de estrutura */}
            {comparativoVersoes && (
              <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Ic n="sliders" w={15} /> Comparativo de Espessuras de Estrutura</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={exportarComparativoPDF} style={{ background: "#0f766e", color: "#fff", border: "none", borderRadius: 5, padding: "4px 12px", fontSize: 12, cursor: "pointer" }}><FileText size={13} /> PDF</button>
                    <button onClick={() => setComparativoVersoes(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12 }}> fechar</button>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C.darker }}>
                        <th style={thSt}>Versão</th>
                        <th style={{ ...thSt, textAlign: "right" }}>Materiais</th>
                        {resultado.incluiMO && <th style={{ ...thSt, textAlign: "right" }}>MO</th>}
                        <th style={{ ...thSt, textAlign: "right" }}>Custo Direto</th>
                        <th style={{ ...thSt, textAlign: "right" }}>R$/m²</th>
                        <th style={{ ...thSt, textAlign: "right" }}>Preço Venda (BDI {bdi}%)</th>
                        <th style={{ ...thSt, textAlign: "right" }}>Diferença</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparativoVersoes.map((v) => {
                        const corDiff = v.isAtual ? C.red : v.diffTotal > 0 ? "#b45309" : v.diffTotal < 0 ? "#166534" : C.muted;
                        const diffTxt = v.isAtual
                          ? "versão atual"
                          : v.diffTotal > 0
                            ? `+${fmtBRL(v.diffTotal)} (+${v.diffPct.toFixed(1)}%)`
                            : `${fmtBRL(v.diffTotal)} (${v.diffPct.toFixed(1)}%)`;
                        return (
                          <tr key={v.opcaoId} style={{ background: v.isAtual ? C.red + "12" : "transparent", fontWeight: v.isAtual ? 700 : 400 }}>
                            <td style={tdSt}>
                              {v.isAtual && <span style={{ color: C.red, marginRight: 4 }}></span>}
                              {v.opcaoLabel}
                            </td>
                            <td style={{ ...tdSt, textAlign: "right" }}>{fmtBRL(v.totalMat)}</td>
                            {resultado.incluiMO && <td style={{ ...tdSt, textAlign: "right", color: "#2563eb" }}>{fmtBRL(v.totalMO)}</td>}
                            <td style={{ ...tdSt, textAlign: "right" }}>{fmtBRL(v.total)}</td>
                            <td style={{ ...tdSt, textAlign: "right" }}>{fmtBRL(v.m2)}</td>
                            <td style={{ ...tdSt, textAlign: "right", color: C.success, fontWeight: 700 }}>{fmtBRL(v.precoVenda)}</td>
                            <td style={{ ...tdSt, textAlign: "right", color: corDiff, fontWeight: 600 }}>{diffTxt}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* cronograma financeiro */}
            {resultado.cronograma?.length > 0 && (
              <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 14 }}>
                  <CalendarDays size={13} /> Cronograma Financeiro Estimado — {resultado.prazoMeses} meses
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
            <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
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
                  precosEditados={precosEditados}
                  onPrecoEdit={(key, val) => setPrecosEditados((p) => ({ ...p, [key]: val }))}
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
          <div style={{ background: "#fff", borderRadius: 16, width: "min(460px, 94vw)",
            padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}><Save size={13} /> Salvar como Orçamento</div>
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

      {/* Modal: Simulador de Financiamento */}
      {modalFinanc && resultado && (() => {
        const fin = calcFinanciamento();
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#fff", borderRadius: 14, width: "min(520px, 95vw)", padding: 28, boxShadow: "0 12px 40px rgba(0,0,0,0.3)", maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}><Ic n="bank" w={18} /> Simulador de Financiamento</div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 20 }}>Preço de venda: <strong>{fmtBRL(resultado.precoVenda)}</strong></div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#666", display: "block", marginBottom: 5 }}>ENTRADA (%)</label>
                  <input type="number" min="0" max="100" value={financForm.entrada}
                    onChange={(e) => setFinancForm((p) => ({ ...p, entrada: Number(e.target.value) }))}
                    style={inputSt} />
                  <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>{fmtBRL(fin.entrada)}</div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#666", display: "block", marginBottom: 5 }}>PRAZO (meses)</label>
                  <input type="number" min="12" max="420" step="12" value={financForm.prazo}
                    onChange={(e) => setFinancForm((p) => ({ ...p, prazo: Number(e.target.value) }))}
                    style={inputSt} />
                  <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>{(financForm.prazo / 12).toFixed(0)} anos</div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#666", display: "block", marginBottom: 5 }}>TAXA a.m. (%)</label>
                  <input type="number" min="0.1" max="5" step="0.1" value={financForm.taxa}
                    onChange={(e) => setFinancForm((p) => ({ ...p, taxa: Number(e.target.value) }))}
                    style={inputSt} />
                  <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>{(Math.pow(1 + financForm.taxa / 100, 12) - 1).toFixed(2)}% a.a.</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {/* Price */}
                <div style={{ border: "2px solid #2563eb", borderRadius: 10, padding: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#2563eb", marginBottom: 10 }}>Sistema PRICE (parcela fixa)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666" }}>Entrada</span><strong>{fmtBRL(fin.entrada)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666" }}>Financiado</span><strong>{fmtBRL(fin.financiado)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, borderTop: "1px solid #eee", paddingTop: 8, marginTop: 4 }}>
                      <span style={{ color: "#2563eb", fontWeight: 700 }}>Parcela fixa</span>
                      <strong style={{ color: "#2563eb", fontSize: 16 }}>{fmtBRL(fin.parcelaPrice)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666" }}>Total pago</span><strong>{fmtBRL(fin.totalPrice)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#e11d48" }}>
                      <span>Juros totais</span><strong>{fmtBRL(fin.jurosPrice)}</strong>
                    </div>
                  </div>
                </div>
                {/* SAC */}
                <div style={{ border: "2px solid #3f7a4b", borderRadius: 10, padding: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#3f7a4b", marginBottom: 10 }}>Sistema SAC (parcela decrescente)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666" }}>Entrada</span><strong>{fmtBRL(fin.entrada)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666" }}>Financiado</span><strong>{fmtBRL(fin.financiado)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, borderTop: "1px solid #eee", paddingTop: 8, marginTop: 4 }}>
                      <span style={{ color: "#3f7a4b", fontWeight: 700 }}>1ª parcela</span>
                      <strong style={{ color: "#3f7a4b", fontSize: 16 }}>{fmtBRL(fin.primeiroSAC)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666" }}>Última parcela</span><strong>{fmtBRL(fin.ultimoSAC)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666" }}>Total pago</span><strong>{fmtBRL(fin.totalSAC)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#e11d48" }}>
                      <span>Juros totais</span><strong>{fmtBRL(fin.jurosSAC)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#166534" }}>
O SAC gera juros totais {fmtBRL(fin.jurosPrice - fin.jurosSAC)} menores que o Price, mas a primeira parcela é maior.
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <button onClick={() => setModalFinanc(false)} style={{ padding: "9px 24px", background: C.red, color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Fechar</button>
              </div>
            </div>
          </div>
        );
      })()}

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
