import { useState } from "react";
import { C, CATEGORIAS_RECEITA, CATEGORIAS_DESPESA } from "../utils/constants";
import { fmt, fmtPct } from "../utils/format";
import { gerarRelatorioFinanceiro } from "../services/pdfService";
import useAppStore from "../store/useAppStore";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";

// ─── MINI GRÁFICO DE BARRAS ───────────────────────────────────────────────────
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
          <span style={{ fontSize: 9, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", textAlign: "center" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── COMPONENTE ──────────────────────────────────────────────────────────────
export default function Financeiro() {
  const obras          = useAppStore((s) => s.obras);
  const financeiro     = useAppStore((s) => s.financeiro);
  const addLancamento  = useAppStore((s) => s.addLancamento);

  const [obraId, setObraId] = useState(obras[0]?.id);
  const [modal,  setModal]  = useState(null); // "receita" | "despesa"
  const FORM_VAZIO = { tipo: "despesa", categoria: "Materiais", valor: "", data: "", descricao: "" };
  const [form, setForm] = useState(FORM_VAZIO);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const obra = obras.find((o) => o.id === obraId) || obras[0];
  const fin  = financeiro[obraId] || { contrato: 0, lancamentos: [] };

  const receitas = fin.lancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + l.valor, 0);
  const despesas = fin.lancamentos.filter((l) => l.tipo === "despesa").reduce((a, l) => a + l.valor, 0);
  const saldo    = receitas - despesas;
  const margem   = receitas > 0 ? saldo / receitas : 0;
  const aReceber = fin.contrato - receitas;
  const pctRec   = fin.contrato > 0 ? receitas / fin.contrato : 0;

  const porCategoria = CATEGORIAS_DESPESA.map((cat) => {
    const total = fin.lancamentos.filter((l) => l.tipo === "despesa" && l.categoria === cat).reduce((a, l) => a + l.valor, 0);
    return { label: cat.split(" ")[0], value: total, color: C.red };
  }).filter((d) => d.value > 0);

  const salvar = () => {
    const valor = parseFloat(String(form.valor).replace(",", "."));
    if (!valor || !form.data || !form.descricao) return;
    addLancamento(obraId, { ...form, valor });
    setModal(null);
    setForm(FORM_VAZIO);
  };

  const ok = form.valor && form.data && form.descricao;

  return (
    <>
      {modal && (
        <Modal title={modal === "receita" ? "Nova receita" : "Nova despesa"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>CATEGORIA</div>
              <Select
                value={form.categoria}
                onChange={(v) => setForm((f) => ({ ...f, categoria: v, tipo: modal }))}
                options={(modal === "receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map((c) => ({ value: c, label: c }))}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>VALOR (R$)</div>
                <Input value={form.valor} onChange={set("valor")} placeholder="Ex: 15000" type="number" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>DATA</div>
                <Input value={form.data} onChange={set("data")} placeholder="DD/MM/AAAA" />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>DESCRIÇÃO</div>
              <Input value={form.descricao} onChange={set("descricao")} placeholder="Detalhe do lançamento" />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn variant={modal === "receita" ? "success" : "primary"} disabled={!ok} onClick={salvar}>
                {modal === "receita" ? "+ Registrar receita" : "+ Registrar despesa"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      <div>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Controle Financeiro</h2>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Receitas, despesas e margem por obra</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => gerarRelatorioFinanceiro(obras, financeiro)} style={{
              padding: "10px 18px", background: "transparent", border: `1px solid ${C.success}`,
              borderRadius: 6, color: C.success, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>📄 Gerar Relatório</button>
            <Btn variant="success" onClick={() => { setForm((f) => ({ ...f, tipo: "receita", categoria: "Entrada contrato" })); setModal("receita"); }}>+ Receita</Btn>
            <Btn onClick={() => { setForm((f) => ({ ...f, tipo: "despesa", categoria: "Materiais" })); setModal("despesa"); }}>+ Despesa</Btn>
          </div>
        </div>

        {/* Seletor de obra */}
        <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
          {obras.map((o) => (
            <button key={o.id} onClick={() => setObraId(o.id)} style={{
              padding: "8px 16px", borderRadius: 8,
              border: `1px solid ${obraId === o.id ? C.red : C.border}`,
              background: obraId === o.id ? C.red + "18" : "transparent",
              color: obraId === o.id ? C.text : C.muted,
              fontSize: 12, fontWeight: obraId === o.id ? 700 : 400, cursor: "pointer",
            }}>{o.nome.split("—")[0].trim()}</button>
          ))}
        </div>

        {/* KPIs */}
        <div className="kpi-grid-5">
          {[
            { label: "Contrato",    value: fmt(fin.contrato),  color: C.border,                        sub: "valor total" },
            { label: "Recebido",    value: fmt(receitas),      color: C.success,                       sub: fmtPct(pctRec) + " do contrato" },
            { label: "A receber",   value: fmt(aReceber),      color: C.warning,                       sub: "saldo em aberto" },
            { label: "Despesas",    value: fmt(despesas),      color: C.red,                           sub: `${fin.lancamentos.filter((l) => l.tipo === "despesa").length} lançamentos` },
            { label: "Margem real", value: fmtPct(margem),     color: margem > 0 ? C.success : C.danger, sub: saldo >= 0 ? "saldo positivo" : "saldo negativo" },
          ].map((k, i) => (
            <div key={i} style={{ background: C.surface, borderRadius: 10, padding: "16px 18px", border: `1px solid ${C.border}`, borderTop: `3px solid ${k.color}` }}>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: k.color === C.border ? C.text : k.color }}>{k.value}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Barra de recebimento */}
        <div style={{ background: C.surface, borderRadius: 10, padding: "18px 20px", border: `1px solid ${C.border}`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 10 }}>
            <span style={{ color: C.muted }}>Progresso de recebimento</span>
            <span style={{ fontWeight: 700 }}>{fmt(receitas)} <span style={{ color: C.muted, fontWeight: 400 }}>de {fmt(fin.contrato)}</span></span>
          </div>
          <div style={{ height: 10, background: C.dark, borderRadius: 5, overflow: "hidden" }}>
            <div style={{ height: 10, width: `${Math.min(pctRec * 100, 100)}%`, background: `linear-gradient(90deg,${C.success},#1a7a40)`, borderRadius: 5, transition: "width .5s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 6 }}>
            <span>{fmtPct(pctRec)} recebido</span>
            <span>{fmtPct(1 - pctRec)} a receber</span>
          </div>
        </div>

        {/* Grid: gráfico + extrato */}
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 18 }}>

          {/* Despesas por categoria */}
          <div style={{ background: C.surface, borderRadius: 10, padding: 20, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 16 }}>DESPESAS POR CATEGORIA</div>
            {porCategoria.length > 0 ? (
              <>
                <BarChart data={porCategoria} height={110} />
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  {porCategoria.map((d) => (
                    <div key={d.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                      <span style={{ color: C.muted }}>{d.label}</span>
                      <span style={{ color: C.text, fontWeight: 600 }}>{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "24px 0" }}>Nenhuma despesa lançada</div>
            )}
          </div>

          {/* Extrato */}
          <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted }}>EXTRATO DE LANÇAMENTOS</div>
              <span style={{ fontSize: 11, color: C.muted }}>{fin.lancamentos.length} registros</span>
            </div>
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {fin.lancamentos.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: C.muted, fontSize: 13 }}>Nenhum lançamento registrado.</div>
              ) : (
                [...fin.lancamentos].reverse().map((l) => (
                  <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 20px", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: l.tipo === "receita" ? C.success : C.red }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{l.descricao}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{l.categoria} · {l.data}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: l.tipo === "receita" ? C.success : C.red, flexShrink: 0 }}>
                      {l.tipo === "receita" ? "+" : "-"} {fmt(l.valor)}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ padding: "12px 20px", borderTop: `2px solid ${C.border}`, display: "flex", justifyContent: "space-between", background: C.darker }}>
              <div style={{ fontSize: 12 }}>
                <span style={{ color: C.muted }}>Receitas </span>
                <span style={{ color: C.success, fontWeight: 700 }}>{fmt(receitas)}</span>
                <span style={{ color: C.muted, margin: "0 10px" }}>·</span>
                <span style={{ color: C.muted }}>Despesas </span>
                <span style={{ color: C.red, fontWeight: 700 }}>{fmt(despesas)}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: saldo >= 0 ? C.success : C.danger }}>
                Saldo: {saldo >= 0 ? "+" : ""}{fmt(saldo)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
