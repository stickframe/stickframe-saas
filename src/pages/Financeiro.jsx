import { useState, useEffect } from "react";
import { C, CATEGORIAS_RECEITA, CATEGORIAS_DESPESA } from "../utils/constants";
import { fmt, fmtPct } from "../utils/format";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";

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
const FORM_VAZIO = { categoria: "Materiais", valor: "", data: "", descricao: "" };

export default function Financeiro() {
  useModuleLoad("obras");
  useModuleLoad("financeiro");

  const obras         = useAppStore((s) => s.obras);
  const financeiro    = useAppStore((s) => s.financeiro);
  const addLancamento = useAppStore((s) => s.addLancamento);

  const [obraId, setObraId] = useState(null);
  const [modal,  setModal]  = useState(null); // "receita" | "despesa"
  const [form,   setForm]   = useState(FORM_VAZIO);
  const [toast,  setToast]  = useState(null);

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
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }

  // Inicializa obraId quando obras carregarem (corrige race condition)
  useEffect(() => {
    if (!obraId && obras.length > 0) setObraId(obras[0].id);
  }, [obras, obraId]);

  function mostrarToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

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

  const receitas = fin.lancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
  const despesas = fin.lancamentos.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
  const saldo    = receitas - despesas;
  const margem   = receitas > 0 ? saldo / receitas : 0;
  const aReceber = Math.max((fin.contrato || 0) - receitas, 0);
  const pctRec   = fin.contrato > 0 ? Math.min(receitas / fin.contrato, 1) : 0;

  const porCategoria = CATEGORIAS_DESPESA.map((cat) => ({
    label: cat.split(" ")[0],
    value: fin.lancamentos.filter((l) => l.tipo === "despesa" && l.categoria === cat).reduce((a, l) => a + (l.valor || 0), 0),
    color: C.red,
  })).filter((d) => d.value > 0);

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

      <div>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Controle Financeiro</h2>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Receitas, despesas e margem por obra</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={exportarRelatorio} style={{
              padding: "8px 16px", background: "#4a9eff22",
              border: "1px solid #4a9eff44", borderRadius: 8,
              color: "#4a9eff", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>📄 Exportar PDF</button>
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
              background: C.surface, borderRadius: 10, padding: "16px 18px",
              border: `1px solid ${C.border}`, borderTop: `3px solid ${k.color}`,
            }}>
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
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 28, opacity: .4, marginBottom: 8 }}>◉</div>
                <div style={{ fontSize: 12, color: C.muted }}>Nenhuma despesa lançada</div>
              </div>
            )}
          </div>

          {/* Extrato */}
          <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
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
      </div>
    </>
  );
}
