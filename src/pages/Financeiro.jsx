import { useState, useEffect, useMemo } from "react";
import { BarChart2, Pencil } from "../components/ui/Icon";
import { useToast } from "../hooks/useToast";
import { C, CATEGORIAS_RECEITA, CATEGORIAS_DESPESA } from "../utils/constants";
import { fmt, fmtPct } from "../utils/format";
import { exportarFinanceiroExcel } from "../utils/exportExcel";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import { DRE } from "../components/financeiro/DRE";
import { FluxoCaixa as FluxoCaixaMensal } from "../components/financeiro/FluxoCaixa";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import { ImportCSV } from "../components/ui/ImportCSV";
import { sb, getEmpresaId } from "../services/supabase";

// ─── Fluxo de Caixa Dinâmico ─────────────────────────────────────────────────
function FluxoCaixa({ lancamentos }) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const DIAS = 60;

  const dias = useMemo(() => {
    const arr = [];
    for (let i = -7; i < DIAS; i++) {
      const d = new Date(hoje);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      let entrada = 0, saida = 0;
      lancamentos.forEach((l) => {
        const ref = l.data_vencimento || l.data;
        if (ref === iso) {
          if (l.tipo === "receita") entrada += l.valor || 0;
          else saida += l.valor || 0;
        }
      });
      arr.push({ iso, d, entrada, saida, passado: i < 0 });
    }
    // Calcula saldo corrente acumulado
    let saldo = 0;
    return arr.map((dia) => {
      saldo += dia.entrada - dia.saida;
      return { ...dia, saldo };
    });
  }, [lancamentos]);

  const maxAbs = Math.max(1, ...dias.map((d) => Math.max(d.entrada, d.saida, Math.abs(d.saldo))));
  const negativo = dias.filter((d) => d.saldo < 0);
  const hoje7 = dias.filter((d) => !d.passado && d.d <= new Date(hoje.getTime() + 7 * 86400000));
  const totalEntrada7 = hoje7.reduce((a, d) => a + d.entrada, 0);
  const totalSaida7   = hoje7.reduce((a, d) => a + d.saida, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPIs de projeção */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Entradas próx. 7 dias", value: fmt(totalEntrada7), color: C.success },
          { label: "Saídas próx. 7 dias",   value: fmt(totalSaida7),   color: C.red },
          { label: "Dias c/ saldo negativo", value: String(negativo.length), color: negativo.length > 0 ? C.danger : C.success },
        ].map((k, i) => (
          <div key={i} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, borderTop: `3px solid ${k.color}`, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>{k.label.toUpperCase()}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {negativo.length > 0 && (
        <div style={{ background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: 12, padding: "14px 18px" }}>
          <div style={{ fontWeight: 700, color: "#991b1b", fontSize: 13, marginBottom: 6 }}>⚠️ Atenção: saldo projetado negativo em {negativo.length} dia(s)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {negativo.slice(0, 5).map((d) => (
              <span key={d.iso} style={{ background: "#fee2e2", color: "#991b1b", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
                {d.d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {fmt(d.saldo)}
              </span>
            ))}
            {negativo.length > 5 && <span style={{ fontSize: 12, color: C.muted }}>+{negativo.length - 5} dias</span>}
          </div>
        </div>
      )}

      {/* Gráfico de barras dia a dia */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: "18px 20px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 4 }}>FLUXO DE CAIXA — PROJEÇÃO 60 DIAS</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Barras: entradas (verde) e saídas (vermelho) por data de vencimento · Linha: saldo acumulado</div>
        <div style={{ overflowX: "auto" }}>
          <svg width={Math.max(dias.length * 18, 400)} height={180} style={{ display: "block" }}>
            {dias.map((d, i) => {
              const x   = i * 18 + 2;
              const h   = 100;
              const entH = (d.entrada / maxAbs) * h;
              const saiH = (d.saida   / maxAbs) * h;
              const isHoje = d.iso === hoje.toISOString().slice(0, 10);
              return (
                <g key={d.iso}>
                  {isHoje && <rect x={x} y={0} width={16} height={180} fill="#f0f0ff" opacity={0.5} />}
                  {/* entrada */}
                  <rect x={x + 1} y={130 - entH} width={6} height={entH} fill={C.success} opacity={d.passado ? 0.4 : 0.85} rx={1} />
                  {/* saída */}
                  <rect x={x + 9} y={130 - saiH} width={6} height={saiH} fill={C.red} opacity={d.passado ? 0.4 : 0.85} rx={1} />
                  {/* label semana */}
                  {(i % 7 === 0) && (
                    <text x={x + 8} y={148} textAnchor="middle" fontSize={8} fill={C.muted}>
                      {d.d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    </text>
                  )}
                </g>
              );
            })}
            {/* Linha de saldo acumulado */}
            <polyline
              fill="none" stroke="#4a9eff" strokeWidth={1.5} opacity={0.8}
              points={dias.map((d, i) => {
                const x = i * 18 + 10;
                const y = 130 - (d.saldo / maxAbs) * 90;
                return `${x},${Math.max(5, Math.min(155, y))}`;
              }).join(" ")}
            />
            {/* Linha zero */}
            <line x1={0} y1={130} x2={dias.length * 18} y2={130} stroke={C.border} strokeWidth={1} />
            {/* Legenda */}
            <rect x={4}  y={160} width={8} height={8} fill={C.success} rx={1} />
            <text x={15} y={168} fontSize={9} fill={C.muted}>Entradas</text>
            <rect x={60} y={160} width={8} height={8} fill={C.red} rx={1} />
            <text x={71} y={168} fontSize={9} fill={C.muted}>Saídas</text>
            <line x1={116} y1={164} x2={128} y2={164} stroke="#4a9eff" strokeWidth={2} />
            <text x={131} y={168} fontSize={9} fill={C.muted}>Saldo acum.</text>
          </svg>
        </div>
      </div>

      {/* Timeline detalhada */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted }}>
          AGENDA DE VENCIMENTOS
        </div>
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {dias.filter((d) => d.entrada > 0 || d.saida > 0).slice(0, 30).map((d) => (
            <div key={d.iso} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "11px 20px",
              borderBottom: `1px solid ${C.border}`,
              background: d.saldo < 0 ? "#fff5f5" : "transparent",
            }}>
              <div style={{ width: 56, fontSize: 12, fontWeight: 700, color: d.passado ? C.muted : C.text, flexShrink: 0 }}>
                {d.d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </div>
              <div style={{ flex: 1, display: "flex", gap: 12 }}>
                {d.entrada > 0 && <span style={{ fontSize: 12, color: C.success, fontWeight: 600 }}>↑ {fmt(d.entrada)}</span>}
                {d.saida > 0   && <span style={{ fontSize: 12, color: C.red,     fontWeight: 600 }}>↓ {fmt(d.saida)}</span>}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: d.saldo < 0 ? C.danger : C.success, flexShrink: 0 }}>
                {d.saldo >= 0 ? "+" : ""}{fmt(d.saldo)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Mini gráfico ─────────────────────────────────────────────────────────────
function BarChart({ data, height = 100 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height, padding: "0 4px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: "100%",
            height: Math.max((d.value / max) * height * 0.85, 4),
            background: d.color || C.red,
            borderRadius: "3px 3px 0 0",
            transition: "height .4s",
            opacity: .85,
          }} />
          <span style={{ fontSize: 9, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", textAlign: "center" }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Label ───────────────────────────────────────────────────────────────────
function Label({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>
      {String(children).toUpperCase()}
    </div>
  );
}

// ─── Formulário de lançamento (fora do componente) ───────────────────────────
function FormLancamento({ tipo, form, setForm, onSave, onCancel }) {
  const categorias = tipo === "receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const ok  = form.valor && form.data && form.descricao;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <Label>Categoria</Label>
        <Select
          value={form.categoria}
          onChange={set("categoria")}
          options={categorias.map((c) => ({ value: c, label: c }))}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label>Valor (R$) *</Label>
          <Input
            value={form.valor}
            onChange={set("valor")}
            placeholder="Ex: 15000"
            type="number"
            min="0"
          />
        </div>
        <div>
          <Label>Data *</Label>
          <Input
            value={form.data}
            onChange={set("data")}
            type="date"
          />
        </div>
      </div>

      <div>
        <Label>Descrição *</Label>
        <Input
          value={form.descricao}
          onChange={set("descricao")}
          placeholder={tipo === "receita" ? "Ex: Medição 1 — contrato" : "Ex: Compra de aço galvanizado"}
        />
      </div>

      <div>
        <Label>Data de vencimento</Label>
        <Input
          value={form.data_vencimento || ""}
          onChange={set("data_vencimento")}
          type="date"
        />
      </div>

      <div style={{
        display: "flex", gap: 10, justifyContent: "flex-end",
        marginTop: 4, paddingTop: 12, borderTop: `1px solid ${C.border}`,
      }}>
        <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
        <Btn disabled={!ok} onClick={onSave}>
          {tipo === "receita" ? "✅ Registrar receita" : "⬇️ Registrar despesa"}
        </Btn>
      </div>
    </div>
  );
}

// ─── Financeiro ───────────────────────────────────────────────────────────────
const FORM_VAZIO = { categoria: "Materiais", valor: "", data: "", descricao: "", data_vencimento: "" };

export default function Financeiro() {
  useModuleLoad("obras");
  useModuleLoad("financeiro");
  useModuleLoad("colaboradores");

  const obras         = useAppStore((s) => s.obras);
  const financeiro    = useAppStore((s) => s.financeiro);
  const colaboradores = useAppStore((s) => s.colaboradores);
  const addLancamento = useAppStore((s) => s.addLancamento);
  const updateObra    = useAppStore((s) => s.updateObra);

  const [obraId,      setObraId]      = useState(null);
  const [finTab,      setFinTab]      = useState("lancamentos"); // "lancamentos" | "fluxo" | "dre" | "fluxo-mensal" | "folha"
  const [modal,       setModal]       = useState(null); // "receita" | "despesa"
  const [form,        setForm]        = useState(FORM_VAZIO);
  const { toast, mostrarToast } = useToast();
  const [editOrc,     setEditOrc]     = useState(false); // editar orçamento por categoria
  const [orcForm,     setOrcForm]     = useState({});    // { [categoria]: valor }
  const [showImportFinanceiro, setShowImportFinanceiro] = useState(false);

  // ── Folha de Pagamento ──────────────────────────────────────────────────────
  const [folhaMes, setFolhaMes] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  });
  const [folhaDados,   setFolhaDados]   = useState([]);
  const [folhaLoading, setFolhaLoading] = useState(false);
  const [folhaPagos,   setFolhaPagos]   = useState({}); // { colaboradorId: true }

  useEffect(() => {
    if (finTab !== "folha") return;
    setFolhaLoading(true);
    const [ano, mes] = folhaMes.split("-").map(Number);
    const inicio = new Date(ano, mes-1, 1).toISOString();
    const fim    = new Date(ano, mes,   1).toISOString();
    sb.from("pontos")
      .select("colaborador_id, nome, tipo, created_at, obra_id")
      .gte("created_at", inicio)
      .lt("created_at", fim)
      .order("created_at")
      .then(({ data }) => {
        const byColab = {};
        (data || []).forEach(p => {
          if (!byColab[p.colaborador_id]) byColab[p.colaborador_id] = { id: p.colaborador_id, nome: p.nome, pontos: [] };
          byColab[p.colaborador_id].pontos.push(p);
        });
        setFolhaDados(Object.values(byColab).map(c => {
          const days = {};
          c.pontos.forEach(p => {
            const d = new Date(p.created_at).toLocaleDateString("pt-BR");
            if (!days[d]) days[d] = [];
            days[d].push(p);
          });
          let totalHoras = 0, diasTrabalhados = 0;
          Object.values(days).forEach(dayPontos => {
            const sorted = dayPontos.sort((a,b) => new Date(a.created_at)-new Date(b.created_at));
            let last = null, dayHoras = 0;
            sorted.forEach(p => {
              if (p.tipo === "entrada") last = new Date(p.created_at);
              else if (p.tipo === "saida" && last) { dayHoras += (new Date(p.created_at)-last)/3600000; last=null; }
            });
            if (dayHoras > 0) { totalHoras += dayHoras; diasTrabalhados++; }
          });
          return { ...c, totalHoras, diasTrabalhados };
        }));
        setFolhaLoading(false);
      });
  }, [finTab, folhaMes]);

  function exportarRelatorio() {
    const o   = obras.find((x) => x.id === obraId);
    const fin = (obraId && financeiro[obraId]) || { lancamentos: [] };
    const rec = fin.lancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
    const dep = fin.lancamentos.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
    const rows = fin.lancamentos.map((l) => `
      <tr>
        <td>${l.data || "—"}</td>
        <td>${l.tipo === "receita" ? "Receita" : "Despesa"}</td>
        <td>${l.categoria || "—"}</td>
        <td>${l.descricao || "—"}</td>
        <td style="text-align:right;color:${l.tipo === "receita" ? "#2e9e5b" : "#c0392b"};font-weight:700">
          ${l.tipo === "receita" ? "+" : "-"}R$ ${(l.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </td>
      </tr>`).join("");
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>Relatório Financeiro — ${o?.nome || "Obra"}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 32px; color: #1a1a1a; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 3px solid #981915; }
      .logo { font-size: 22px; font-weight: 900; letter-spacing: 3px; }
      .logo span { color: #981915; }
      .kpis { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 28px; }
      .kpi { background: #f0f0f3; border-radius: 8px; padding: 16px; }
      .kpi .label { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
      .kpi .value { font-size: 20px; font-weight: 900; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th { background: #f0f0f3; padding: 10px 12px; text-align: left; font-size: 11px; letter-spacing: 1px; color: #6b7280; }
      td { padding: 10px 12px; border-bottom: 1px solid #e4e4ea; }
      .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #6b7280; }
      @media print { body { padding: 16px; } }
    </style></head><body>
    <div class="header">
      <div>
        <div class="logo">STICK<span>FRAME</span></div>
        <div style="font-size:11px;color:#6b7280;margin-top:3px">RELATÓRIO FINANCEIRO</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:15px;font-weight:800">${o?.nome?.split("—")[0]?.trim() || "—"}</div>
        <div style="font-size:11px;color:#6b7280">${new Date().toLocaleDateString("pt-BR")}</div>
      </div>
    </div>
    <div class="kpis">
      <div class="kpi"><div class="label">RECEITAS</div><div class="value" style="color:#2e9e5b">R$ ${rec.toLocaleString("pt-BR",{minimumFractionDigits:2})}</div></div>
      <div class="kpi"><div class="label">DESPESAS</div><div class="value" style="color:#c0392b">R$ ${dep.toLocaleString("pt-BR",{minimumFractionDigits:2})}</div></div>
      <div class="kpi"><div class="label">SALDO</div><div class="value" style="color:${rec-dep>=0?"#2e9e5b":"#c0392b"}">R$ ${(rec-dep).toLocaleString("pt-BR",{minimumFractionDigits:2})}</div></div>
    </div>
    <table><thead><tr><th>DATA</th><th>TIPO</th><th>CATEGORIA</th><th>DESCRIÇÃO</th><th style="text-align:right">VALOR</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#6b7280;padding:24px">Nenhum lançamento</td></tr>'}</tbody></table>
    <div class="footer"><p>Stick Frame Sistemas Construtivos · stickframe.com.br</p></div>
    </body></html>`;
    printHtml(html, "lancamentos-financeiros");
  }

  // Inicializa obraId quando obras carregarem (corrige race condition)
  useEffect(() => {
    if (!obraId && obras.length > 0) setObraId(obras[0].id);
  }, [obras, obraId]);



  function abrirModal(tipo) {
    const catPadrao = tipo === "receita" ? "Entrada contrato" : "Materiais";
    setForm({ ...FORM_VAZIO, categoria: catPadrao });
    setModal(tipo);
  }

  function salvar() {
    const valor = parseFloat(String(form.valor).replace(",", "."));
    if (!valor || !form.data || !form.descricao || !obraId) return;
    addLancamento(obraId, { ...form, tipo: modal, valor });
    setModal(null);
    setForm(FORM_VAZIO);
    mostrarToast(modal === "receita" ? "✅ Receita registrada!" : "✅ Despesa registrada!");
  }

  // ── Dados da obra selecionada ───────────────────────────────────────────────
  const obra = obras.find((o) => o.id === obraId) || null;
  const fin  = (obraId && financeiro[obraId]) || { contrato: 0, lancamentos: [] };

  const {
    receitas, despesas, saldo, margem, aReceber, pctRec, porCategoria, desvioCategoria,
  } = useMemo(() => {
    const lancamentos = fin.lancamentos;
    const rec = lancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
    const desp = lancamentos.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
    const sld = rec - desp;
    const orcCats = obra?.orcamento_categorias || {};

    const despPorCat = {};
    lancamentos.filter((l) => l.tipo === "despesa").forEach((l) => {
      despPorCat[l.categoria] = (despPorCat[l.categoria] || 0) + (l.valor || 0);
    });

    return {
      receitas: rec,
      despesas: desp,
      saldo: sld,
      margem: rec > 0 ? sld / rec : 0,
      aReceber: Math.max((fin.contrato || 0) - rec, 0),
      pctRec: fin.contrato > 0 ? Math.min(rec / fin.contrato, 1) : 0,
      porCategoria: CATEGORIAS_DESPESA
        .map((cat) => ({ label: cat.split(" ")[0], value: despPorCat[cat] || 0, color: C.red }))
        .filter((d) => d.value > 0),
      desvioCategoria: CATEGORIAS_DESPESA.map((cat) => {
        const realizado = despPorCat[cat] || 0;
        const previsto  = Number(orcCats[cat] || 0);
        const desvio    = realizado - previsto;
        return { cat, realizado, previsto, desvio, pct: previsto > 0 ? (desvio / previsto) * 100 : null };
      }).filter((d) => d.realizado > 0 || d.previsto > 0),
    };
  }, [fin.lancamentos, fin.contrato, obra?.orcamento_categorias]);

  // ── Orçamento por categoria ────────────────────────────────────────────────
  const orcCats = obra?.orcamento_categorias || {};
  const temOrcCats = Object.values(orcCats).some((v) => Number(v) > 0);

  async function salvarOrcCats() {
    const parsed = {};
    Object.entries(orcForm).forEach(([k, v]) => { parsed[k] = Number(v) || 0; });
    await updateObra(obraId, { orcamento_categorias: parsed });
    setEditOrc(false);
    mostrarToast("✅ Orçamento por categoria salvo!");
  }

  function abrirEditOrc() {
    const init = {};
    CATEGORIAS_DESPESA.forEach((cat) => { init[cat] = orcCats[cat] || ""; });
    setOrcForm(init);
    setEditOrc(true);
  }

  // ── Empty state: sem obras ──────────────────────────────────────────────────
  if (obras.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>◉</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Nenhuma obra cadastrada</div>
        <div style={{ fontSize: 13, color: C.muted }}>
          Cadastre uma obra em <strong>Gestão de Obras</strong> para começar a registrar lançamentos financeiros.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 999,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "12px 20px",
          fontSize: 13, fontWeight: 600, boxShadow: "0 8px 32px #0006",
        }}>
          {toast}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal
          title={modal === "receita" ? "📈 Nova receita" : "📉 Nova despesa"}
          onClose={() => setModal(null)}
        >
          <FormLancamento
            tipo={modal} form={form} setForm={setForm}
            onSave={salvar} onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {showImportFinanceiro && (
        <ImportCSV
          titulo="Lançamentos"
          campos={[
            { key: "descricao", label: "Descrição", required: true },
            { key: "valor", label: "Valor", required: true, aliases: ["value", "amount"] },
            { key: "tipo", label: "Tipo (receita/despesa)", aliases: ["type"] },
            { key: "data", label: "Data", aliases: ["date", "vencimento"] },
            { key: "categoria", label: "Categoria" },
          ]}
          onImportar={async (rows) => {
            let ok = 0, erro = 0;
            for (const row of rows) {
              const valor = parseFloat(String(row.valor || "0").replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
              const { error } = await sb.from("financeiro").insert({
                descricao: row.descricao,
                valor,
                tipo: row.tipo?.toLowerCase().includes("receita") ? "receita" : "despesa",
                data: row.data || new Date().toISOString().split("T")[0],
                categoria: row.categoria || "Outros",
                empresa_id: getEmpresaId(),
              });
              if (error) erro++; else ok++;
            }
            return { ok, erro };
          }}
          onClose={() => setShowImportFinanceiro(false)}
        />
      )}

      <div>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Controle Financeiro</h2>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Receitas, despesas e margem por obra</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => exportarFinanceiroExcel(obras, financeiro)} style={{
              padding: "8px 16px", background: "#2e9e5b22",
              border: "1px solid #2e9e5b44", borderRadius: 8,
              color: "#2e9e5b", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}><BarChart2 size={13} /> Exportar Excel</button>
            <button onClick={exportarRelatorio} style={{
              padding: "8px 16px", background: "#4a9eff22",
              border: "1px solid #4a9eff44", borderRadius: 8,
              color: "#4a9eff", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>📄 Exportar PDF</button>
            <button onClick={() => setShowImportFinanceiro(true)} style={{
              padding: "8px 16px", background: "#8b5cf622",
              border: "1px solid #8b5cf644", borderRadius: 8,
              color: "#8b5cf6", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>⬆️ Importar CSV</button>
            <Btn
              onClick={() => abrirModal("receita")}
              style={{ background: C.success + "22", border: `1px solid ${C.success}44`, color: C.success }}
            >
              + Receita
            </Btn>
            <Btn onClick={() => abrirModal("despesa")}>+ Despesa</Btn>
          </div>
        </div>

        {/* Seletor de obra */}
        <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
          {obras.map((o) => (
            <button
              key={o.id}
              onClick={() => setObraId(o.id)}
              style={{
                padding: "8px 16px", borderRadius: 8,
                border: `1px solid ${obraId === o.id ? C.red : C.border}`,
                background: obraId === o.id ? C.red + "18" : "transparent",
                color: obraId === o.id ? C.text : C.muted,
                fontSize: 12, fontWeight: obraId === o.id ? 700 : 400,
                cursor: "pointer", fontFamily: "inherit",
                transition: "all .15s",
              }}
            >
              {o.nome?.split("—")[0]?.trim()}
            </button>
          ))}
        </div>

        {/* Obra selecionada — nome completo */}
        {obra && (
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>
            <span style={{ color: C.text, fontWeight: 600 }}>{obra.nome}</span>
            {obra.fase && <span> · {obra.fase}</span>}
            {obra.status && (
              <span style={{
                marginLeft: 10, padding: "2px 8px", borderRadius: 4,
                background: obra.status === "Em andamento" ? C.success + "22" : C.border,
                color: obra.status === "Em andamento" ? C.success : C.muted,
                fontSize: 11, fontWeight: 600,
              }}>
                {obra.status}
              </span>
            )}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["lancamentos", "📊 Análise"], ["fluxo", "📅 Fluxo de Caixa"], ["dre", "📊 DRE"], ["fluxo-mensal", "💸 Fluxo Mensal"], ["folha", "💰 Folha"]].map(([k, label]) => (
            <button key={k} onClick={() => setFinTab(k)} style={{
              padding: "7px 16px", borderRadius: 8, border: `1px solid ${finTab === k ? C.red : C.border}`,
              background: finTab === k ? C.red + "18" : "transparent",
              color: finTab === k ? C.text : C.muted, fontSize: 12, fontWeight: finTab === k ? 700 : 400,
              cursor: "pointer", fontFamily: "inherit",
            }}>{label}</button>
          ))}
        </div>

        {finTab === "dre" ? (
          <DRE obraId={obraId} />
        ) : finTab === "fluxo-mensal" ? (
          <FluxoCaixaMensal obraId={obraId} />
        ) : finTab === "fluxo" ? (
          <FluxoCaixa lancamentos={Object.values(financeiro).flatMap((f) => f.lancamentos || [])} />
        ) : (<>

        {/* KPIs */}
        <div className="kpi-grid-5" style={{ marginBottom: 18 }}>
          {[
            { label: "Contrato",    value: fmt(fin.contrato),  color: C.border,                           sub: "valor total" },
            { label: "Recebido",    value: fmt(receitas),      color: C.success,                          sub: `${fmtPct(pctRec)} do contrato` },
            { label: "A receber",   value: fmt(aReceber),      color: C.warning,                          sub: "saldo em aberto" },
            { label: "Despesas",    value: fmt(despesas),      color: C.red,                              sub: `${fin.lancamentos.filter(l => l.tipo === "despesa").length} lançamentos` },
            { label: "Margem real", value: fmtPct(margem * 100), color: margem > 0 ? C.success : C.danger, sub: saldo >= 0 ? `saldo +${fmt(saldo)}` : `saldo ${fmt(saldo)}` },
          ].map((k, i) => (
            <div key={i} style={{
              background: C.surface, borderRadius: 14, padding: "16px 18px",
              border: `1px solid ${C.border}`, borderTop: `3px solid ${k.color}`,
            }}>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: k.color === C.border ? C.text : k.color }}>{k.value}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Barra de recebimento */}
        <div style={{ background: C.surface, borderRadius: 14, padding: "18px 20px", border: `1px solid ${C.border}`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 10 }}>
            <span style={{ color: C.muted }}>Progresso de recebimento</span>
            <span style={{ fontWeight: 700 }}>{fmt(receitas)} <span style={{ color: C.muted, fontWeight: 400 }}>de {fmt(fin.contrato)}</span></span>
          </div>
          <div style={{ height: 10, background: C.dark, borderRadius: 5, overflow: "hidden" }}>
            <div style={{
              height: 10,
              width: `${Math.min(pctRec * 100, 100)}%`,
              background: `linear-gradient(90deg,${C.success},#1a7a40)`,
              borderRadius: 5, transition: "width .5s",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 6 }}>
            <span>{fmtPct(pctRec * 100)} recebido</span>
            <span>{fmtPct((1 - pctRec) * 100)} a receber</span>
          </div>
        </div>

        {/* Análise de Desvio */}
        {fin.contrato > 0 && (
          <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: "20px 24px", border: `1px solid ${C.border}`, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 16 }}>ANÁLISE DE DESVIO</div>

            {/* Dupla barra: progresso físico vs financeiro */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: C.muted }}>Progresso físico</span>
                  <span style={{ fontWeight: 700, color: C.red }}>{obra?.progresso || 0}%</span>
                </div>
                <div style={{ height: 10, background: C.dark, borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ height: 10, width: `${Math.min(obra?.progresso || 0, 100)}%`, background: `linear-gradient(90deg,${C.red},#6e1210)`, borderRadius: 5, transition: "width .5s" }} />
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: C.muted }}>Custo consumido</span>
                  <span style={{ fontWeight: 700, color: fin.contrato > 0 && despesas / fin.contrato > (obra?.progresso || 0) / 100 + 0.05 ? C.danger : C.success }}>
                    {fin.contrato > 0 ? fmtPct((despesas / fin.contrato) * 100) : "—"}
                  </span>
                </div>
                <div style={{ height: 10, background: C.dark, borderRadius: 5, overflow: "hidden" }}>
                  <div style={{
                    height: 10,
                    width: `${fin.contrato > 0 ? Math.min((despesas / fin.contrato) * 100, 100) : 0}%`,
                    background: fin.contrato > 0 && despesas / fin.contrato > (obra?.progresso || 0) / 100 + 0.05
                      ? `linear-gradient(90deg,${C.danger},#8b0000)`
                      : `linear-gradient(90deg,${C.success},#1a7a40)`,
                    borderRadius: 5, transition: "width .5s",
                  }} />
                </div>
              </div>
            </div>

            {/* Cards de desvio */}
            {(() => {
              const progFisico   = (obra?.progresso || 0) / 100;
              const custoPrevisto = fin.contrato * progFisico;
              const desvio       = despesas - custoPrevisto;
              const pctDesvio    = custoPrevisto > 0 ? (desvio / custoPrevisto) * 100 : 0;
              const margemPrevista = fin.contrato - despesas;
              const pctMargem    = fin.contrato > 0 ? (margemPrevista / fin.contrato) * 100 : 0;
              const emDesvio     = desvio > 0 && Math.abs(pctDesvio) > 5;

              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {[
                    {
                      label: "Custo previsto",
                      sublabel: `para ${obra?.progresso || 0}% físico`,
                      value: fmt(custoPrevisto),
                      color: C.muted,
                    },
                    {
                      label: "Custo realizado",
                      sublabel: "despesas lançadas",
                      value: fmt(despesas),
                      color: C.red,
                    },
                    {
                      label: "Desvio",
                      sublabel: desvio === 0 ? "dentro do orçamento" : desvio > 0 ? "acima do previsto" : "abaixo do previsto",
                      value: `${desvio >= 0 ? "+" : ""}${fmt(desvio)}`,
                      color: emDesvio ? C.danger : desvio < 0 ? C.success : C.muted,
                    },
                    {
                      label: "Margem prevista",
                      sublabel: "contrato − despesas",
                      value: `${pctMargem.toFixed(1)}%`,
                      color: pctMargem >= 20 ? C.success : pctMargem >= 10 ? C.warning : C.danger,
                    },
                  ].map((k, i) => (
                    <div key={i} style={{
                      background: C.darker, borderRadius: 8, padding: "12px 14px",
                      borderLeft: `3px solid ${k.color}`,
                    }}>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, letterSpacing: .5 }}>{k.label.toUpperCase()}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: k.color === C.muted ? C.text : k.color }}>{k.value}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{k.sublabel}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Alerta de desvio */}
            {(() => {
              const progFisico    = (obra?.progresso || 0) / 100;
              const custoPrevisto = fin.contrato * progFisico;
              const desvio        = despesas - custoPrevisto;
              const pctDesvio     = custoPrevisto > 0 ? (desvio / custoPrevisto) * 100 : 0;
              if (Math.abs(pctDesvio) <= 5 || custoPrevisto === 0) return null;
              return (
                <div style={{
                  marginTop: 14, borderRadius: 8, padding: "10px 16px",
                  background: desvio > 0 ? C.danger + "12" : C.success + "12",
                  border: `1px solid ${desvio > 0 ? C.danger : C.success}33`,
                  fontSize: 12, color: desvio > 0 ? C.danger : C.success, fontWeight: 600,
                }}>
                  {desvio > 0
                    ? `⚠ Custo ${pctDesvio.toFixed(1)}% acima do previsto para o progresso atual (${obra?.progresso || 0}% físico). Revise os lançamentos de despesa.`
                    : `✓ Custo ${Math.abs(pctDesvio).toFixed(1)}% abaixo do previsto — obra dentro do orçamento.`
                  }
                </div>
              );
            })()}
          </div>
        )}

        {/* Modal orçamento por categoria */}
        {editOrc && (
          <Modal title="Orçamento de custo por categoria" onClose={() => setEditOrc(false)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12, color: C.muted }}>
                Defina o valor previsto para cada categoria de despesa desta obra. O sistema vai mostrar o desvio em tempo real.
              </div>
              {CATEGORIAS_DESPESA.map((cat) => (
                <div key={cat} style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 10, alignItems: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{cat}</div>
                  <Input
                    type="number" min="0"
                    value={orcForm[cat] || ""}
                    onChange={(v) => setOrcForm((f) => ({ ...f, [cat]: v }))}
                    placeholder="R$ 0"
                  />
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 12, color: C.muted }}>
                  Total previsto:{" "}
                  <strong style={{ color: C.text }}>
                    {fmt(Object.values(orcForm).reduce((a, v) => a + (Number(v) || 0), 0))}
                  </strong>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="ghost" onClick={() => setEditOrc(false)}>Cancelar</Btn>
                  <Btn onClick={salvarOrcCats}>Salvar</Btn>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Grid: gráfico + extrato */}
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18 }}>

          {/* Desvio por categoria */}
          <div style={{ background: C.surface, borderRadius: 14, padding: 20, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted }}>DESVIO POR CATEGORIA</div>
              <button onClick={abrirEditOrc} style={{
                fontSize: 10, color: C.red, background: "none", border: `1px solid ${C.border}`,
                borderRadius: 5, padding: "3px 8px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
              }}>
                {temOrcCats ? "<Pencil size={13} /> Editar" : "+ Definir orçamento"}
              </button>
            </div>

            {desvioCategoria.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 28, opacity: .4, marginBottom: 8 }}>◉</div>
                <div style={{ fontSize: 12, color: C.muted }}>Nenhuma despesa lançada</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {desvioCategoria.map(({ cat, realizado, previsto, desvio, pct }) => {
                  const semOrc  = previsto === 0;
                  const acima   = !semOrc && desvio > 0;
                  const cor     = semOrc ? C.muted : acima ? C.danger : C.success;
                  const barPct  = previsto > 0
                    ? Math.min((realizado / previsto) * 100, 150)
                    : 100;
                  return (
                    <div key={cat}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: C.text, fontWeight: 600 }}>{cat}</span>
                        <span style={{ color: cor, fontWeight: 700 }}>
                          {fmt(realizado)}
                          {!semOrc && (
                            <span style={{ fontSize: 10, fontWeight: 400, color: C.muted }}> / {fmt(previsto)}</span>
                          )}
                        </span>
                      </div>
                      <div style={{ height: 6, background: C.dark, borderRadius: 3, overflow: "hidden", marginBottom: semOrc ? 0 : 3 }}>
                        <div style={{
                          height: 6,
                          width: `${Math.min(barPct, 100)}%`,
                          background: semOrc ? C.muted : acima ? C.danger : C.success,
                          borderRadius: 3, transition: "width .4s",
                        }} />
                      </div>
                      {!semOrc && (
                        <div style={{ fontSize: 10, color: cor, textAlign: "right" }}>
                          {acima
                            ? `⚠ +${fmt(desvio)} (${pct?.toFixed(0)}% acima)`
                            : `✓ ${fmt(Math.abs(desvio))} dentro do previsto`}
                        </div>
                      )}
                    </div>
                  );
                })}
                {!temOrcCats && (
                  <div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 8, padding: "8px", background: C.darker, borderRadius: 6 }}>
                    Defina o orçamento por categoria para ver o desvio
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Extrato */}
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted }}>EXTRATO DE LANÇAMENTOS</div>
              <span style={{ fontSize: 11, color: C.muted }}>{fin.lancamentos.length} registro{fin.lancamentos.length !== 1 ? "s" : ""}</span>
            </div>

            <div style={{ maxHeight: 380, overflowY: "auto" }}>
              {fin.lancamentos.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <div style={{ fontSize: 28, opacity: .4, marginBottom: 8 }}>◎</div>
                  <div style={{ fontSize: 13, color: C.muted }}>Nenhum lançamento registrado</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Use "+ Receita" ou "+ Despesa" para começar</div>
                </div>
              ) : (
                [...fin.lancamentos].reverse().map((l) => (
                  <div key={l.id} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "13px 20px", borderBottom: `1px solid ${C.border}`,
                    transition: "background .1s",
                  }}>
                    {/* Indicador */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, display: "flex",
                      alignItems: "center", justifyContent: "center", flexShrink: 0,
                      background: l.tipo === "receita" ? C.success + "22" : C.red + "22",
                      fontSize: 14,
                    }}>
                      {l.tipo === "receita" ? "↑" : "↓"}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{l.descricao}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                        {l.categoria} · {l.data}
                      </div>
                    </div>
                    {/* Valor */}
                    <div style={{
                      fontSize: 14, fontWeight: 700, flexShrink: 0,
                      color: l.tipo === "receita" ? C.success : C.red,
                    }}>
                      {l.tipo === "receita" ? "+" : "−"} {fmt(l.valor)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Rodapé do extrato */}
            <div style={{
              padding: "12px 20px", borderTop: `2px solid ${C.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: C.darker,
            }}>
              <div style={{ fontSize: 12 }}>
                <span style={{ color: C.muted }}>Receitas </span>
                <span style={{ color: C.success, fontWeight: 700 }}>{fmt(receitas)}</span>
                <span style={{ color: C.muted, margin: "0 10px" }}>·</span>
                <span style={{ color: C.muted }}>Despesas </span>
                <span style={{ color: C.red, fontWeight: 700 }}>{fmt(despesas)}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: saldo >= 0 ? C.success : C.danger }}>
                Saldo: {saldo >= 0 ? "+" : ""}{fmt(saldo)}
              </div>
            </div>
          </div>
        </div>
      </>)} {/* end finTab === "lancamentos" */}

      {/* ── Folha de Pagamento ─────────────────────────────────────────────── */}
      {finTab === "folha" && (() => {
        const totalColabs = folhaDados.length;
        const totalHoras  = folhaDados.reduce((a, c) => a + c.totalHoras, 0);
        const totalPagar  = folhaDados.reduce((a, c) => {
          const col = (colaboradores || []).find(x => x.id === c.id || x.nome === c.nome);
          const sal = col?.salario || 0;
          return a + (sal ? (sal / 26) * c.diasTrabalhados : 0);
        }, 0);

        function imprimirHolerite(c) {
          const col = (colaboradores || []).find(x => x.id === c.id || x.nome === c.nome);
          const sal = col?.salario || 0;
          const valor = sal ? (sal / 26) * c.diasTrabalhados : 0;
          const w = window.open("", "_blank", "width=600,height=700");
          w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
            <title>Holerite — ${c.nome}</title>
            <style>
              body{font-family:Arial,sans-serif;margin:0;padding:32px;color:#1a1a1a}
              .logo{font-size:20px;font-weight:900;letter-spacing:3px;margin-bottom:4px}
              .logo span{color:#981915}
              h2{margin:24px 0 4px}
              table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
              th{background:#f0f0f3;padding:8px 12px;text-align:left;font-size:11px;color:#6b7280}
              td{padding:8px 12px;border-bottom:1px solid #e4e4ea}
              .total{font-size:18px;font-weight:800;color:#2e9e5b;margin-top:24px}
              @media print{button{display:none}}
            </style></head><body>
            <div class="logo">STICK<span>FRAME</span></div>
            <div style="font-size:11px;color:#6b7280">HOLERITE</div>
            <h2>${c.nome}</h2>
            <div style="font-size:13px;color:#6b7280">Competência: ${folhaMes}</div>
            <table>
              <thead><tr><th>ITEM</th><th style="text-align:right">VALOR</th></tr></thead>
              <tbody>
                <tr><td>Dias trabalhados</td><td style="text-align:right">${c.diasTrabalhados}</td></tr>
                <tr><td>Horas totais</td><td style="text-align:right">${c.totalHoras.toFixed(1)}h</td></tr>
                <tr><td>Salário base</td><td style="text-align:right">R$ ${sal.toLocaleString("pt-BR",{minimumFractionDigits:2})}</td></tr>
              </tbody>
            </table>
            <div class="total">Valor a pagar: R$ ${valor.toLocaleString("pt-BR",{minimumFractionDigits:2})}</div>
            <div style="margin-top:40px;font-size:11px;color:#6b7280">Gerado em ${new Date().toLocaleDateString("pt-BR")} · StickFrame</div>
            <br><button onclick="window.print()">🖨️ Imprimir</button>
          </body></html>`);
          w.document.close();
        }

        return (
          <div>
            {/* Seletor de mês */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 12, color: C.muted }}>Competência:</span>
              <input
                type="month"
                value={folhaMes}
                onChange={e => setFolhaMes(e.target.value)}
                style={{
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
                  color: C.text, fontSize: 13, padding: "6px 12px", fontFamily: "inherit",
                }}
              />
            </div>

            {/* KPI summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Colaboradores", value: totalColabs, color: C.border },
                { label: "Horas Totais",  value: `${totalHoras.toFixed(1)}h`, color: C.warning },
                { label: "Total a Pagar", value: `R$ ${totalPagar.toLocaleString("pt-BR",{minimumFractionDigits:2})}`, color: C.success },
              ].map((k, i) => (
                <div key={i} style={{
                  background: C.surface, borderRadius: 14, padding: "16px 18px",
                  border: `1px solid ${C.border}`, borderTop: `3px solid ${k.color}`,
                }}>
                  <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>{k.label.toUpperCase()}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: k.color === C.border ? C.text : k.color }}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              {folhaLoading ? (
                <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Carregando pontos…</div>
              ) : folhaDados.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Nenhum ponto registrado neste período.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["Nome", "Dias Trabalhados", "Horas Totais", "Salário Base", "Valor a Pagar", "Status", "Ações"].map(h => (
                        <th key={h} style={{
                          padding: "10px 14px", textAlign: "left",
                          fontSize: 10, color: C.muted, letterSpacing: 1,
                          background: C.darker, borderBottom: `1px solid ${C.border}`,
                        }}>{h.toUpperCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {folhaDados.map(c => {
                      const col   = (colaboradores || []).find(x => x.id === c.id || x.nome === c.nome);
                      const sal   = col?.salario || 0;
                      const valor = sal ? (sal / 26) * c.diasTrabalhados : 0;
                      const pago  = !!folhaPagos[c.id];
                      return (
                        <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}`, opacity: pago ? 0.7 : 1 }}>
                          <td style={{ padding: "10px 14px", fontWeight: 600 }}>{c.nome || c.id}</td>
                          <td style={{ padding: "10px 14px", color: C.muted }}>{c.diasTrabalhados}</td>
                          <td style={{ padding: "10px 14px", color: C.muted }}>{c.totalHoras.toFixed(1)}h</td>
                          <td style={{ padding: "10px 14px", color: C.muted }}>
                            {sal ? `R$ ${sal.toLocaleString("pt-BR",{minimumFractionDigits:2})}` : "—"}
                          </td>
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: C.success }}>
                            {valor ? `R$ ${valor.toLocaleString("pt-BR",{minimumFractionDigits:2})}` : "—"}
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            {pago
                              ? <span style={{ background: C.success+"22", color: C.success, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>✅ Pago</span>
                              : <span style={{ background: C.warning+"22", color: C.warning, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Pendente</span>
                            }
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              {!pago && (
                                <button onClick={() => setFolhaPagos(p => ({ ...p, [c.id]: true }))} style={{
                                  padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.success}`,
                                  background: C.success+"18", color: C.success, fontSize: 11,
                                  fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                                }}>Marcar pago</button>
                              )}
                              <button onClick={() => imprimirHolerite(c)} style={{
                                padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.border}`,
                                background: "transparent", color: C.muted, fontSize: 11,
                                fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                              }}>🖨️ Holerite</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      })()}

      </div>
    </>
  );
}
