import { useState } from "react";
import { C } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import * as XLSX from "xlsx";

// ─── Insumos por m² de área construída ───────────────────────────────────────
// grupo = chave usada pelo módulo de Orçamentos (sf_estimativo)
const INSUMOS = [
  { categoria: "Estrutura de Aço", grupo: "Estrutura",        nome: "Montante C 90×40×15×1,25mm",         un: "pç",  base: 1.50, preco: 18.50, desc: "Espaçamento 600mm, pé-direito 2,80m" },
  { categoria: "Estrutura de Aço", grupo: "Estrutura",        nome: "Guia U 92×40×1,25mm",                un: "m",   base: 1.10, preco: 12.00, desc: "Superior e inferior" },
  { categoria: "Estrutura de Aço", grupo: "Estrutura",        nome: "Montante C 140×40×15×1,25mm",        un: "pç",  base: 0.30, preco: 24.00, desc: "Vergas e contravergas" },
  { categoria: "Fechamento",       grupo: "Vedação externa",  nome: "Chapa OSB 11,1mm (1,22×2,44)",       un: "chp", base: 0.38, preco: 52.00, desc: "Contraventamento estrutural" },
  { categoria: "Fechamento",       grupo: "Vedação interna",  nome: "Placa de Gesso BA 13mm (1,20×2,40)", un: "chp", base: 0.85, preco: 17.00, desc: "Faces internas das paredes" },
  { categoria: "Fechamento",       grupo: "Vedação externa",  nome: "Placa Cimentícia 10mm (1,20×2,40)",  un: "chp", base: 0.18, preco: 65.00, desc: "Fachada externa" },
  { categoria: "Isolamento",       grupo: "Isolamento",       nome: "Lã de Vidro 50mm",                   un: "m²",  base: 1.30, preco: 16.00, desc: "Interior das paredes e laje" },
  { categoria: "Isolamento",       grupo: "Isolamento",       nome: "Manta EPDM (fita adesiva 50mm)",     un: "m",   base: 1.10, preco:  5.50, desc: "Vedação de juntas" },
  { categoria: "Isolamento",       grupo: "Impermeabilização",nome: "Impermeabilizante flexível",         un: "m²",  base: 0.15, preco: 35.00, desc: "Áreas molhadas" },
  { categoria: "Fixação",          grupo: "Fixação",          nome: "Parafuso TEX 4,2×16mm (flangeado)",  un: "cx",  base: 0.40, preco: 48.00, desc: "Caixa c/ 500 pçs — gesso" },
  { categoria: "Fixação",          grupo: "Fixação",          nome: "Parafuso TEX 4,2×38mm",              un: "cx",  base: 0.80, preco: 52.00, desc: "Caixa c/ 500 pçs — OSB/cimentícia" },
  { categoria: "Fixação",          grupo: "Fixação",          nome: "Parafuso TEX 6,3×19mm",              un: "cx",  base: 0.16, preco: 58.00, desc: "Caixa c/ 500 pçs — emenda perfis" },
  { categoria: "Fundação (Radier)", grupo: "Fundação",        nome: "Concreto C-25",                      un: "m³",  base: 0.10, preco: 420.0, desc: "Espessura 10cm" },
  { categoria: "Fundação (Radier)", grupo: "Fundação",        nome: "Ferragem CA-50 ⌀6,3mm",              un: "kg",  base: 6.00, preco:  6.50, desc: "~6 kg/m²" },
  { categoria: "Fundação (Radier)", grupo: "Fundação",        nome: "Tela soldada Q-92 (3×2m)",           un: "pç",  base: 0.17, preco: 68.00, desc: "1 tela = 6m²" },
  { categoria: "Fundação (Radier)", grupo: "Fundação",        nome: "Forma lateral (tábua 3ª)",           un: "m",   base: 0.40, preco:  8.00, desc: "Perímetro do radier" },
];

const PADROES = {
  "Econômico":   { fator: 0.85 },
  "Padrão":      { fator: 1.00 },
  "Alto Padrão": { fator: 1.20 },
};

const CATS_ORDEM = ["Estrutura de Aço","Fechamento","Isolamento","Fixação","Fundação (Radier)"];

const fmtR = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Calculadora() {
  const setActivePage = useAppStore((s) => s.setActivePage);

  const [area,      setArea]      = useState("");
  const [pavs,      setPavs]      = useState(1);
  const [padrao,    setPadrao]    = useState("Padrão");
  const [resultado, setResultado] = useState(null);

  function calcular() {
    const a = parseFloat(String(area).replace(",", "."));
    if (!a || a <= 0) return;
    const fatorPadrao = PADROES[padrao].fator;
    const items = INSUMOS.map((ins) => {
      const ehFundacao = ins.categoria === "Fundação (Radier)";
      const fator      = ehFundacao ? 1 : fatorPadrao * pavs;
      const qtd        = Math.ceil(ins.base * a * fator);
      return { ...ins, qtd, total: qtd * ins.preco };
    });
    setResultado({ area: a, pavs, padrao, items });
  }

  function exportarExcel() {
    if (!resultado) return;
    const rows = resultado.items.map((i) => ({
      "Categoria":        i.categoria,
      "Material":         i.nome,
      "Unidade":          i.un,
      "Quantidade":       i.qtd,
      "Preço Ref. (R$)":  i.preco,
      "Total Ref. (R$)":  i.total,
      "Obs":              i.desc,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [20, 42, 8, 12, 16, 16, 36].map((w) => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Quantitativos");
    XLSX.writeFile(wb, `calc-steelframe-${resultado.area}m2.xlsx`);
  }

  function enviarParaOrcamento() {
    if (!resultado) return;
    // Monta o formato que Orçamentos.jsx lê de localStorage (sf_estimativo)
    const itens = resultado.items.map((i) => ({
      grupo:    i.grupo,
      item:     i.nome,
      un:       i.un,
      qtd:      i.qtd,
      precoUnit: i.preco,
    }));
    const totalGeral = resultado.items.reduce((s, i) => s + i.total, 0);
    localStorage.setItem("sf_estimativo", JSON.stringify({
      itens,
      totalGeral,
      area:   resultado.area,
      tipo:   resultado.padrao,
    }));
    setActivePage("orcamentos");
  }

  const totalGeral = resultado?.items.reduce((s, i) => s + i.total, 0) || 0;

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px 16px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Calculadora Steel Frame</h2>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>
        Estimativa de insumos e custos de referência por área construída — 10% de perda já incluídos
      </p>

      {/* ── Formulário ── */}
      <div style={{
        background: "#fff", borderRadius: 12, border: `1px solid ${C.border}`,
        padding: "22px 26px", marginBottom: 24,
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 16, alignItems: "flex-end",
      }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>
            ÁREA CONSTRUÍDA (m²)
          </label>
          <input
            type="number" min="10" value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Ex: 120"
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: `1px solid ${C.border}`, fontSize: 16, fontWeight: 700,
              fontFamily: "inherit", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>
            PAVIMENTOS
          </label>
          <select
            value={pavs} onChange={(e) => setPavs(Number(e.target.value))}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: `1px solid ${C.border}`, fontSize: 14, fontFamily: "inherit",
              background: "#fff", outline: "none",
            }}
          >
            <option value={1}>Térreo (1 pav.)</option>
            <option value={2}>Sobrado (2 pav.)</option>
            <option value={3}>3 pavimentos</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>
            PADRÃO CONSTRUTIVO
          </label>
          <select
            value={padrao} onChange={(e) => setPadrao(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: `1px solid ${C.border}`, fontSize: 14, fontFamily: "inherit",
              background: "#fff", outline: "none",
            }}
          >
            {Object.keys(PADROES).map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <button onClick={calcular} style={{
          padding: "10px 24px", background: C.red, color: "#fff",
          border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
        }}>
          Calcular
        </button>
      </div>

      {/* ── Resultado ── */}
      {resultado && (
        <>
          {/* Barra de resumo */}
          <div style={{
            background: C.red, color: "#fff", borderRadius: 12,
            padding: "18px 26px", marginBottom: 20,
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 4 }}>
                {resultado.area} m² · {resultado.pavs} pav. · {resultado.padrao}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>
                {fmtR(totalGeral)} <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.8 }}>estimativa total de insumos</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={exportarExcel} style={{
                padding: "9px 16px", background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8,
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>📊 Exportar Excel</button>
              <button onClick={() => window.print()} style={{
                padding: "9px 16px", background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8,
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>🖨️ Imprimir</button>
              <button onClick={enviarParaOrcamento} style={{
                padding: "9px 18px", background: "#fff",
                border: "none", borderRadius: 8,
                color: C.red, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
              }}>📋 Usar no Orçamento →</button>
            </div>
          </div>

          {/* Tabelas por categoria */}
          {CATS_ORDEM.map((cat) => {
            const items    = resultado.items.filter((i) => i.categoria === cat);
            const subtotal = items.reduce((s, i) => s + i.total, 0);
            if (!items.length) return null;
            return (
              <div key={cat} style={{ background: "#fff", borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 14, overflow: "hidden" }}>
                <div style={{
                  padding: "11px 20px", background: C.dark,
                  borderBottom: `1px solid ${C.border}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: C.graphite, textTransform: "uppercase" }}>{cat}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.graphite }}>{fmtR(subtotal)}</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#fafafa" }}>
                      <th style={{ padding: "9px 20px", textAlign: "left",   fontSize: 11, color: C.muted, fontWeight: 600 }}>Material</th>
                      <th style={{ padding: "9px 12px", textAlign: "right",  fontSize: 11, color: C.muted, fontWeight: 600, width: 80 }}>Qtd</th>
                      <th style={{ padding: "9px 12px", textAlign: "left",   fontSize: 11, color: C.muted, fontWeight: 600, width: 50 }}>Un</th>
                      <th style={{ padding: "9px 14px", textAlign: "right",  fontSize: 11, color: C.muted, fontWeight: 600, width: 100 }}>Preço ref.</th>
                      <th style={{ padding: "9px 20px", textAlign: "right",  fontSize: 11, color: C.muted, fontWeight: 600, width: 110 }}>Total ref.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td style={{ padding: "11px 20px", fontWeight: 500 }}>{item.nome}</td>
                        <td style={{ padding: "11px 12px", textAlign: "right", fontWeight: 800, color: C.red }}>
                          {item.qtd.toLocaleString("pt-BR")}
                        </td>
                        <td style={{ padding: "11px 12px", color: C.muted }}>{item.un}</td>
                        <td style={{ padding: "11px 14px", textAlign: "right", color: C.muted, fontSize: 12 }}>{fmtR(item.preco)}</td>
                        <td style={{ padding: "11px 20px", textAlign: "right", fontWeight: 700 }}>{fmtR(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          <div style={{
            background: "#fff", borderRadius: 12, border: `2px solid ${C.red}33`,
            padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>TOTAL ESTIMADO DE INSUMOS</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.red }}>{fmtR(totalGeral)}</div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <button onClick={enviarParaOrcamento} style={{
              padding: "13px 32px", background: C.red, color: "#fff",
              border: "none", borderRadius: 10, fontSize: 15, fontWeight: 800,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 4px 16px rgba(152,25,21,0.3)",
            }}>
              📋 Enviar para Orçamento →
            </button>
          </div>

          <p style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>
            ⚠️ Preços de referência — sujeitos à variação regional e de mercado. Elabore o projeto executivo para quantitativos precisos.
          </p>
        </>
      )}

      <style>{`@media print { button { display: none !important; } }`}</style>
    </div>
  );
}
