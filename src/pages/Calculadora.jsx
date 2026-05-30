import { useState } from "react";
import { C } from "../utils/constants";
import { exportarObrasExcel } from "../utils/exportExcel";
import * as XLSX from "xlsx";

// ─── Tabela de insumos por m² de área construída ─────────────────────────────
const INSUMOS = [
  // Estrutura
  { categoria: "Estrutura de Aço", nome: "Montante C 90×40×15×1,25mm", un: "pç",   base: 1.50, desc: "Espaçamento 600mm, pé-direito 2,80m" },
  { categoria: "Estrutura de Aço", nome: "Guia U 92×40×1,25mm",         un: "m",    base: 1.10, desc: "Superior e inferior" },
  { categoria: "Estrutura de Aço", nome: "Montante C 140×40×15×1,25mm", un: "pç",   base: 0.30, desc: "Vergas e contravergas" },
  // Fechamento interno
  { categoria: "Fechamento",       nome: "Chapa OSB 11,1mm (1,22×2,44)", un: "chp", base: 0.38, desc: "Contraventamento estrutural" },
  { categoria: "Fechamento",       nome: "Placa de Gesso BA 13mm (1,20×2,40)", un: "chp", base: 0.85, desc: "Faces internas das paredes" },
  { categoria: "Fechamento",       nome: "Placa Cimentícia 10mm (1,20×2,40)",  un: "chp", base: 0.18, desc: "Fachada externa" },
  // Isolamento
  { categoria: "Isolamento",       nome: "Lã de Vidro 50mm",             un: "m²",  base: 1.30, desc: "Interior das paredes e laje" },
  { categoria: "Isolamento",       nome: "Manta EPDM (fita adesiva 50mm)", un: "m", base: 1.10, desc: "Vedação de juntas" },
  { categoria: "Isolamento",       nome: "Impermeabilizante flexível",    un: "m²",  base: 0.15, desc: "Áreas molhadas (banheiros/cozinha)" },
  // Fixação
  { categoria: "Fixação",          nome: "Parafuso TEX 4,2×16mm (flangeado)", un: "pç", base: 20, desc: "Fixação de placas de gesso" },
  { categoria: "Fixação",          nome: "Parafuso TEX 4,2×38mm",        un: "pç",  base: 40, desc: "Fixação de OSB e cimentícia" },
  { categoria: "Fixação",          nome: "Parafuso TEX 6,3×19mm",        un: "pç",  base: 8,  desc: "Emenda de perfis" },
  // Fundação (radier)
  { categoria: "Fundação (Radier)", nome: "Concreto C-25",               un: "m³",  base: 0.10, desc: "Espessura 10cm" },
  { categoria: "Fundação (Radier)", nome: "Ferragem CA-50 ⌀6,3mm",       un: "kg",  base: 6.00, desc: "~6 kg/m²" },
  { categoria: "Fundação (Radier)", nome: "Tela soldada Q-92 (3×2m)",    un: "pç",  base: 0.17, desc: "1 tela = 6m²" },
  { categoria: "Fundação (Radier)", nome: "Forma lateral (tábua 3a)",    un: "m",   base: 0.40, desc: "Perímetro do radier" },
];

const PADROES = {
  "Econômico":   { fator: 0.85, label: "Econômico",   cor: C.success  },
  "Padrão":      { fator: 1.00, label: "Padrão",      cor: "#4a9eff"  },
  "Alto Padrão": { fator: 1.20, label: "Alto Padrão", cor: C.warning  },
};

const CATEGORIAS_ORDEM = ["Estrutura de Aço","Fechamento","Isolamento","Fixação","Fundação (Radier)"];

function fmt2(n) { return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function Calculadora() {
  const [area,      setArea]      = useState("");
  const [pavs,      setPavs]      = useState(1);
  const [padrao,    setPadrao]    = useState("Padrão");
  const [resultado, setResultado] = useState(null);

  function calcular() {
    const a = parseFloat(String(area).replace(",", "."));
    if (!a || a <= 0) return;
    const fator = PADROES[padrao].fator * pavs;
    const items = INSUMOS.map((ins) => ({
      ...ins,
      qtd: Math.ceil(ins.base * a * (ins.categoria === "Fundação (Radier)" ? 1 : fator)),
    }));
    setResultado({ area: a, pavs, padrao, items });
  }

  function exportar() {
    if (!resultado) return;
    const rows = resultado.items.map((i) => ({
      "Categoria": i.categoria,
      "Material":  i.nome,
      "Unidade":   i.un,
      "Quantidade": i.qtd,
      "Obs":       i.desc,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [20, 40, 8, 12, 36].map((w) => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Quantitativos");
    XLSX.writeFile(wb, `calc-steelframe-${resultado.area}m2.xlsx`);
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Calculadora Steel Frame</h2>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>
        Estimativa de insumos por área construída — valores de referência com 10% de perda já incluídos
      </p>

      {/* ── Formulário ─────────────────────────────────────────────────────── */}
      <div style={{
        background: "#fff", borderRadius: 12, border: `1px solid ${C.border}`,
        padding: "24px 28px", marginBottom: 24,
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
              border: `1px solid ${C.border}`, fontSize: 15, fontWeight: 700,
              fontFamily: "inherit", outline: "none",
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
        <button
          onClick={calcular}
          style={{
            padding: "10px 24px", background: C.red, color: "#fff",
            border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
          }}
        >
          Calcular
        </button>
      </div>

      {/* ── Resultado ──────────────────────────────────────────────────────── */}
      {resultado && (
        <>
          {/* Resumo */}
          <div style={{
            background: C.red, color: "#fff", borderRadius: 12,
            padding: "20px 28px", marginBottom: 20,
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 4 }}>Estimativa gerada para</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>
                {resultado.area} m² · {resultado.pavs} pav. · {resultado.padrao}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={exportar} style={{
                padding: "9px 18px", background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8,
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
                📊 Exportar Excel
              </button>
              <button onClick={() => window.print()} style={{
                padding: "9px 18px", background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8,
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
                🖨️ Imprimir
              </button>
            </div>
          </div>

          {/* Tabelas por categoria */}
          {CATEGORIAS_ORDEM.map((cat) => {
            const items = resultado.items.filter((i) => i.categoria === cat);
            if (!items.length) return null;
            return (
              <div key={cat} style={{ background: "#fff", borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 16, overflow: "hidden" }}>
                <div style={{
                  padding: "12px 20px", background: C.dark,
                  fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: C.graphite,
                  textTransform: "uppercase", borderBottom: `1px solid ${C.border}`,
                }}>
                  {cat}
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#fafafa" }}>
                      <th style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, color: C.muted, fontWeight: 600 }}>Material</th>
                      <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 11, color: C.muted, fontWeight: 600, width: 80 }}>Qtd</th>
                      <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, color: C.muted, fontWeight: 600, width: 50 }}>Un</th>
                      <th style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, color: C.muted, fontWeight: 600 }}>Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td style={{ padding: "11px 20px", fontWeight: 500 }}>{item.nome}</td>
                        <td style={{ padding: "11px 16px", textAlign: "right", fontWeight: 800, fontSize: 15, color: C.red }}>
                          {item.qtd.toLocaleString("pt-BR")}
                        </td>
                        <td style={{ padding: "11px 16px", color: C.muted }}>{item.un}</td>
                        <td style={{ padding: "11px 20px", color: C.muted, fontSize: 12 }}>{item.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          <p style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 8 }}>
            ⚠️ Valores estimativos para fins de planejamento. Elabore o projeto executivo para quantitativos precisos.
          </p>
        </>
      )}

      <style>{`@media print { button { display: none !important; } }`}</style>
    </div>
  );
}
