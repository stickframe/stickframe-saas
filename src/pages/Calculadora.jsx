import { useState, useEffect, useCallback } from "react";
import { BarChart2, ClipboardList } from "../components/ui/Icon";
import { C } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import * as XLSX from "xlsx";
import {
  listarRetalhos, registrarRetalho, marcarUsado,
} from "../services/repositories/retalhosRepository";

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

const fmtR  = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtMm = (mm) => mm >= 1000 ? `${(mm / 1000).toFixed(2).replace(".", ",")} m` : `${mm} mm`;

// ─── First Fit Decreasing ─────────────────────────────────────────────────────
function otimizarCorte(pecas, tamBarra) {
  const lista = [];
  pecas.forEach((p) => {
    for (let i = 0; i < p.quantidade; i++) lista.push({ label: p.label, tam: p.comprimento, cor: p.cor });
  });
  lista.sort((a, b) => b.tam - a.tam);
  const barras = [];
  lista.forEach((peca) => {
    let ok = false;
    for (const b of barras) {
      if (b.sobra >= peca.tam) { b.cortes.push(peca); b.sobra -= peca.tam; ok = true; break; }
    }
    if (!ok) barras.push({ id: barras.length + 1, sobra: tamBarra - peca.tam, cortes: [peca] });
  });
  return barras;
}

// ─── Calculadora Parede Drywall ───────────────────────────────────────────────
function CalcParedeDrywall() {
  const [comp,     setComp]     = useState("");
  const [alt,      setAlt]      = useState("2.80");
  const [faces,    setFaces]    = useState("2");
  const [tipo,     setTipo]     = useState("BA");
  const [esp,      setEsp]      = useState("90");
  const [desperd,  setDesperd]  = useState("10");
  const [result,   setResult]   = useState(null);

  const TIPOS = {
    BA:  { label: "ST (Standard)",         preco_placa: 17.00, massa_m2: 0.50, fita_m2: 1.20 },
    RU:  { label: "RU (Resistente Umidade)", preco_placa: 22.00, massa_m2: 0.55, fita_m2: 1.20 },
    RF:  { label: "RF (Resistente Fogo)",   preco_placa: 28.00, massa_m2: 0.55, fita_m2: 1.20 },
  };

  function calcular() {
    const c = parseFloat(String(comp).replace(",","."));
    const h = parseFloat(String(alt).replace(",","."));
    const f = parseInt(faces);
    const d = 1 + parseInt(desperd) / 100;
    if (!c || !h) return;

    const area      = c * h * f;
    const areaComp  = area * d;
    const e         = parseInt(esp);
    const PLACA     = 1.20 * 2.40; // m²
    const placas    = Math.ceil(areaComp / PLACA);
    // Montantes: espaçamento + guias
    const montantes = Math.ceil((c / (e / 1000)) + 1) * f;
    const guias     = Math.ceil(c * 2 * f);                 // metros (superior+inferior)
    // Fixação: ~15 parafusos/m²
    const parafusos = Math.ceil(areaComp * 15);
    const cxPar     = Math.ceil(parafusos / 500); // cx c/ 500
    // Massa e fita
    const t         = TIPOS[tipo];
    const massa     = Math.ceil(areaComp * t.massa_m2 * 5) / 5; // arredonda 0.2 saco (15kg)
    const fita      = Math.ceil(areaComp * t.fita_m2);

    setResult({
      area, areaComp, placas, montantes, guias, parafusos, cxPar, massa, fita,
      totalPlacas: placas * t.preco_placa,
      totalMont: montantes * 18.50,
      totalGuia: guias * 12.00,
      totalPar: cxPar * 48.00,
      totalMassa: Math.ceil(massa) * 38.00,
      totalFita: fita * 3.80,
    });
  }

  const total = result ? result.totalPlacas + result.totalMont + result.totalGuia + result.totalPar + result.totalMassa + result.totalFita : 0;

  return (
    <div>
      <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, padding: "22px 26px", marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14, marginBottom: 16 }}>
          {[
            { label: "COMPRIMENTO DA PAREDE (m)", val: comp, set: setComp, ph: "Ex: 10" },
            { label: "PÉ-DIREITO (m)", val: alt, set: setAlt, ph: "Ex: 2.80" },
          ].map(({ label, val, set, ph }) => (
            <div key={label}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>{label}</label>
              <input type="number" value={val} onChange={e => set(e.target.value)} placeholder={ph}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 15, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>FACES</label>
            <select value={faces} onChange={e => setFaces(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: "inherit", outline: "none" }}>
              <option value="1">1 face</option>
              <option value="2">2 faces (parede)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>TIPO DE PLACA</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: "inherit", outline: "none" }}>
              {Object.entries(TIPOS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>ESPAÇ. MONTANTES (mm)</label>
            <select value={esp} onChange={e => setEsp(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: "inherit", outline: "none" }}>
              <option value="400">400 mm</option>
              <option value="600">600 mm (padrão)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>DESPERDÍCIO (%)</label>
            <select value={desperd} onChange={e => setDesperd(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: "inherit", outline: "none" }}>
              <option value="5">5%</option>
              <option value="10">10% (recomendado)</option>
              <option value="15">15%</option>
            </select>
          </div>
        </div>
        <button onClick={calcular} style={{ padding: "12px 32px", background: C.red, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Calcular
        </button>
      </div>

      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Placas Drywall", qtd: `${result.placas} chp`, sub: `${TIPOS[tipo].label} · ${result.area.toFixed(1)} m²`, val: result.totalPlacas },
            { label: "Montantes (C 90)", qtd: `${result.montantes} pç`, sub: `espaç. ${esp}mm`, val: result.totalMont },
            { label: "Guias (U 92)", qtd: `${result.guias} m`, sub: "superior + inferior", val: result.totalGuia },
            { label: "Parafusos TEX", qtd: `${result.cxPar} cx`, sub: `${result.parafusos} pçs (~15/m²)`, val: result.totalPar },
            { label: "Massa para Juntas", qtd: `${Math.ceil(result.massa)} saco`, sub: `${(result.massa).toFixed(1)} × 15kg`, val: result.totalMassa },
            { label: "Fita para Juntas", qtd: `${result.fita} m`, sub: `~1,2 m/m² de placa`, val: result.totalFita },
          ].map(({ label, qtd, sub, val }) => (
            <div key={label} style={{ background: "#fff", borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px 18px" }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{qtd}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>
              <div style={{ fontSize: 13, color: C.success, fontWeight: 700, marginTop: 6 }}>{fmtR(val)}</div>
            </div>
          ))}
          <div style={{ background: C.red, borderRadius: 12, padding: "16px 18px", color: "#fff" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 6, opacity: .8 }}>TOTAL ESTIMADO</div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>{fmtR(total)}</div>
            <div style={{ fontSize: 11, opacity: .8, marginTop: 2 }}>materiais · preços de referência</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Calculadora Forro Drywall ─────────────────────────────────────────────────
function CalcForroDrywall() {
  const [compA,    setCompA]    = useState("");
  const [compB,    setCompB]    = useState("");
  const [tipo,     setTipo]     = useState("BA");
  const [modulo,   setModulo]   = useState("60x60");
  const [desperd,  setDesperd]  = useState("10");
  const [result,   setResult]   = useState(null);

  const TIPOS = {
    BA: { label: "ST (Standard)",          preco: 17.00 },
    RU: { label: "RU (Resistente Umidade)", preco: 22.00 },
    RF: { label: "RF (Resistente Fogo)",    preco: 28.00 },
  };

  const MODULOS = {
    "60x60": { label: "60×60 cm (padrão)",   placa_m2: 0.36, perfil_m_m2: 3.33 },
    "62.5x125": { label: "62,5×125 cm",      placa_m2: 0.78, perfil_m_m2: 2.40 },
  };

  function calcular() {
    const a = parseFloat(String(compA).replace(",","."));
    const b = parseFloat(String(compB).replace(",","."));
    if (!a || !b) return;
    const area  = a * b;
    const d     = 1 + parseInt(desperd) / 100;
    const mod   = MODULOS[modulo];
    const t     = TIPOS[tipo];
    const PLACA = 1.20 * 2.40;

    const placas    = Math.ceil(area * d / PLACA);
    const perfis    = Math.ceil(area * mod.perfil_m_m2 * d); // m de perfil (T47)
    // Pendurais: 1 a cada 1,2m² aprox
    const pendurais = Math.ceil(area / 1.2);
    // Parafusos: ~8/m²
    const cxPar     = Math.ceil(area * 8 / 500);
    // Massa e fita
    const massa     = Math.ceil(area * 0.4 * d);
    const fita      = Math.ceil(area * 1.0 * d);

    setResult({
      area, placas, perfis, pendurais, cxPar, massa, fita,
      totalPlacas: placas * t.preco,
      totalPerfis: perfis * 8.50,
      totalPend:   pendurais * 2.80,
      totalPar:    cxPar * 48.00,
      totalMassa:  Math.ceil(massa / 15) * 38.00,
      totalFita:   fita * 3.80,
    });
  }

  const total = result ? result.totalPlacas + result.totalPerfis + result.totalPend + result.totalPar + result.totalMassa + result.totalFita : 0;

  return (
    <div>
      <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, padding: "22px 26px", marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 16 }}>
          {[
            { label: "COMPRIMENTO (m)", val: compA, set: setCompA, ph: "Ex: 8" },
            { label: "LARGURA (m)",     val: compB, set: setCompB, ph: "Ex: 6" },
          ].map(({ label, val, set, ph }) => (
            <div key={label}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>{label}</label>
              <input type="number" value={val} onChange={e => set(e.target.value)} placeholder={ph}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 15, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>TIPO DE PLACA</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: "inherit", outline: "none" }}>
              {Object.entries(TIPOS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>MÓDULO DO FORRO</label>
            <select value={modulo} onChange={e => setModulo(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: "inherit", outline: "none" }}>
              {Object.entries(MODULOS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>DESPERDÍCIO (%)</label>
            <select value={desperd} onChange={e => setDesperd(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: "inherit", outline: "none" }}>
              <option value="5">5%</option>
              <option value="10">10% (recomendado)</option>
              <option value="15">15%</option>
            </select>
          </div>
        </div>
        <button onClick={calcular} style={{ padding: "12px 32px", background: C.red, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Calcular
        </button>
      </div>

      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Placas Drywall", qtd: `${result.placas} chp`, sub: `${TIPOS[tipo].label}`, val: result.totalPlacas },
            { label: "Perfil T47 (subestrutura)", qtd: `${result.perfis} m`, sub: `módulo ${modulo}`, val: result.totalPerfis },
            { label: "Pendurais + Tirantes", qtd: `${result.pendurais} pç`, sub: "1 a cada 1,2 m²", val: result.totalPend },
            { label: "Parafusos TEX", qtd: `${result.cxPar} cx`, sub: "~8 por m²", val: result.totalPar },
            { label: "Massa para Juntas", qtd: `${Math.ceil(result.massa / 15)} saco`, sub: `${result.massa} kg`, val: result.totalMassa },
            { label: "Fita para Juntas", qtd: `${result.fita} m`, sub: "1 m/m² de forro", val: result.totalFita },
          ].map(({ label, qtd, sub, val }) => (
            <div key={label} style={{ background: "#fff", borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px 18px" }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{qtd}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>
              <div style={{ fontSize: 13, color: C.success, fontWeight: 700, marginTop: 6 }}>{fmtR(val)}</div>
            </div>
          ))}
          <div style={{ background: C.red, borderRadius: 12, padding: "16px 18px", color: "#fff" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 6, opacity: .8 }}>TOTAL ESTIMADO</div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>{fmtR(total)}</div>
            <div style={{ fontSize: 11, opacity: .8, marginTop: 2 }}>materiais · preços de referência</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Comparativo BA × RU × RF ─────────────────────────────────────────────────
function CalcComparativo() {
  const [area, setArea] = useState("");
  const [result, setResult] = useState(null);

  function calcular() {
    const a = parseFloat(String(area).replace(",","."));
    if (!a) return;
    const PLACA = 1.20 * 2.40;
    const placas = Math.ceil(a * 1.10 / PLACA);
    setResult({
      area: a,
      sistemas: [
        { tipo: "ST — Standard", preco: 17.00, desc: "Uso geral, ambientes secos, paredes internas", cor: "#4a9eff" },
        { tipo: "RU — Resistente Umidade", preco: 22.00, desc: "Banheiros, cozinhas, áreas úmidas", cor: "#2e9e5b" },
        { tipo: "RF — Resistente Fogo", preco: 28.00, desc: "Corredores, saída de emergência, CPTEC", cor: "#e07020" },
      ].map(s => ({ ...s, placas, total: placas * s.preco, totalM2: (placas * s.preco) / a })),
    });
  }

  return (
    <div>
      <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, padding: "22px 26px", marginBottom: 24, display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 180px" }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>ÁREA DE PAREDE (m²)</label>
          <input type="number" value={area} onChange={e => setArea(e.target.value)} placeholder="Ex: 50"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 15, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
        <button onClick={calcular} style={{ padding: "12px 32px", background: C.red, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Comparar
        </button>
      </div>

      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
          {result.sistemas.map(s => (
            <div key={s.tipo} style={{ background: "#fff", borderRadius: 16, border: `2px solid ${s.cor}22`, padding: "20px 22px" }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: s.cor, marginBottom: 8 }}>{s.tipo}</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>{s.desc}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: C.darker, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>PLACAS</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{s.placas} chp</div>
                </div>
                <div style={{ background: C.darker, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>CUSTO/m²</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{fmtR(s.totalM2)}</div>
                </div>
              </div>
              <div style={{ marginTop: 12, background: s.cor + "18", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.muted }}>Total materiais</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: s.cor }}>{fmtR(s.total)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Calculadora() {
  const setActivePage = useAppStore((s) => s.setActivePage);
  const [modo, setModo] = useState("steelframe");

  const [area,      setArea]      = useState("");
  const [pavs,      setPavs]      = useState(1);
  const [padrao,    setPadrao]    = useState("Padrão");
  const [resultado, setResultado] = useState(null);

  // Otimização de corte
  const obras = useAppStore((s) => s.obras);

  const [tamBarra,      setTamBarra]      = useState(6000);
  const [tamC90,        setTamC90]        = useState(2800);
  const [tamC140,       setTamC140]       = useState(600);
  const [obraId,        setObraId]        = useState("");
  const [otimizacao,    setOtimizacao]    = useState(null);
  const [verTodas,      setVerTodas]      = useState({});
  const [cortadas,      setCortadas]      = useState({});
  const [desvioReal,    setDesvioReal]    = useState({});  // { [profNome]: barrasReais }
  const [retalhos,      setRetalhos]      = useState([]);
  const [salvandoRet,   setSalvandoRet]   = useState(null); // barraKey sendo salva

  // Persistência do progresso de corte em localStorage
  const cortesKey = resultado ? `sf_cortes_${resultado.area}_${resultado.pavs}` : null;
  useEffect(() => {
    if (!cortesKey) return;
    try { setCortadas(JSON.parse(localStorage.getItem(cortesKey) || "{}")); } catch { /* */ }
  }, [cortesKey]);

  function toggleCortada(key) {
    setCortadas((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (cortesKey) localStorage.setItem(cortesKey, JSON.stringify(next));
      return next;
    });
  }

  const recarregarRetalhos = useCallback(() => {
    listarRetalhos(["Montante C 90", "Montante C 140"])
      .then(setRetalhos)
      .catch(() => {});
  }, []);

  useEffect(() => { recarregarRetalhos(); }, [recarregarRetalhos]);

  async function handleRegistrarRetalho(barra, tipoLabel) {
    const key = `${tipoLabel}_${barra.id}`;
    setSalvandoRet(key);
    try {
      await registrarRetalho({
        tipo_perfil:    tipoLabel,
        comprimento_mm: barra.sobra,
        obra_id:        obraId || null,
        observacoes:    `Otimizador — ${resultado?.area}m² ${resultado?.padrao}`,
      });
      recarregarRetalhos();
    } finally {
      setSalvandoRet(null);
    }
  }

  async function handleUsarRetalho(id) {
    await marcarUsado(id);
    recarregarRetalhos();
  }

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
    setOtimizacao(null);
    setVerTodas({});
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

  function calcularOtimizacao() {
    if (!resultado) return;
    const c90item  = resultado.items.find((i) => i.nome.includes("C 90"));
    const c140item = resultado.items.find((i) => i.nome.includes("C 140"));
    const guiaItem = resultado.items.find((i) => i.nome.includes("Guia U"));

    // Retalhos disponíveis por tipo
    const retC90  = retalhos.filter((r) => r.tipo_perfil === "Montante C 90");
    const retC140 = retalhos.filter((r) => r.tipo_perfil === "Montante C 140");

    function pecasCobertas(tamPeca, retalhosDisponiveis) {
      // Conta quantas peças podem ser extraídas dos retalhos disponíveis
      return retalhosDisponiveis.reduce((total, r) => total + Math.floor(r.comprimento_mm / tamPeca), 0);
    }

    const grupos = [];

    if (c90item && tamC90 > 0 && tamC90 <= tamBarra) {
      const cobertas  = Math.min(pecasCobertas(tamC90, retC90), c90item.qtd);
      const qtdNova   = c90item.qtd - cobertas;
      const barras    = qtdNova > 0 ? otimizarCorte([{ label: "Montante C 90",  comprimento: tamC90,  quantidade: qtdNova,       cor: C.red     }], tamBarra) : [];
      const uso       = qtdNova * tamC90;
      const bruto     = barras.length * tamBarra || 1;
      grupos.push({ tipoLabel: "Montante C 90",  nome: c90item.nome,  cor: C.red,     barras, uso, bruto, apr: barras.length ? (uso / bruto) * 100 : 100, cobertas, qtdTotal: c90item.qtd });
    }
    if (c140item && tamC140 > 0 && tamC140 <= tamBarra) {
      const cobertas  = Math.min(pecasCobertas(tamC140, retC140), c140item.qtd);
      const qtdNova   = c140item.qtd - cobertas;
      const barras    = qtdNova > 0 ? otimizarCorte([{ label: "Montante C 140", comprimento: tamC140, quantidade: qtdNova,       cor: "#e07020" }], tamBarra) : [];
      const uso       = qtdNova * tamC140;
      const bruto     = barras.length * tamBarra || 1;
      grupos.push({ tipoLabel: "Montante C 140", nome: c140item.nome, cor: "#e07020", barras, uso, bruto, apr: barras.length ? (uso / bruto) * 100 : 100, cobertas, qtdTotal: c140item.qtd });
    }
    let guia = null;
    if (guiaItem) {
      const mm = Math.ceil(guiaItem.qtd * 1000);
      const nb = Math.ceil(mm / tamBarra);
      guia = { nome: guiaItem.nome, mm, nb, sobra: nb * tamBarra - mm, apr: (mm / (nb * tamBarra)) * 100 };
    }
    setOtimizacao({ grupos, guia });
    setVerTodas({});
    setCortadas({});
    setDesvioReal({});
  }

  const totalGeral = resultado?.items.reduce((s, i) => s + i.total, 0) || 0;

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px 16px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Calculadora de Materiais</h2>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>
        Quantitativos e custos de referência para Steel Frame e Drywall
      </p>

      {/* ── Seletor de modo ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {[
          { key: "steelframe",  label: "🏗 Steel Frame" },
          { key: "parede",      label: "🧱 Parede Drywall" },
          { key: "forro",       label: "⬜ Forro Drywall" },
          { key: "comparativo", label: "📊 Comparativo ST/RU/RF" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setModo(key)} style={{
            padding: "9px 20px", borderRadius: 10, fontSize: 13, fontWeight: modo === key ? 700 : 500,
            background: modo === key ? C.red : "transparent",
            color: modo === key ? "#fff" : C.muted,
            border: `1px solid ${modo === key ? C.red : C.border}`,
            cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
          }}>{label}</button>
        ))}
      </div>

      {modo === "parede"      && <CalcParedeDrywall />}
      {modo === "forro"       && <CalcForroDrywall />}
      {modo === "comparativo" && <CalcComparativo />}
      {modo !== "steelframe" && modo !== "parede" && modo !== "forro" && modo !== "comparativo" && null}
      {modo !== "steelframe" ? null : (<>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>
        Estimativa de insumos e custos de referência por área construída — 10% de perda já incluídos
      </p>

      {/* ── Formulário ── */}
      <div style={{
        background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`,
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
              }}><BarChart2 size={13} /> Exportar Excel</button>
              <button onClick={() => window.print()} style={{
                padding: "9px 16px", background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8,
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>🖨️ Imprimir</button>
              <button onClick={enviarParaOrcamento} style={{
                padding: "9px 18px", background: "#fff",
                border: "none", borderRadius: 8,
                color: C.red, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
              }}><ClipboardList size={13} /> Usar no Orçamento →</button>
            </div>
          </div>

          {/* Tabelas por categoria */}
          {CATS_ORDEM.map((cat) => {
            const items    = resultado.items.filter((i) => i.categoria === cat);
            const subtotal = items.reduce((s, i) => s + i.total, 0);
            if (!items.length) return null;
            return (
              <div key={cat} style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 14, overflow: "hidden" }}>
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
            background: "#fff", borderRadius: 16, border: `2px solid ${C.red}33`,
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
              <ClipboardList size={13} /> Enviar para Orçamento →
            </button>
          </div>

          <p style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>
            ⚠️ Preços de referência — sujeitos à variação regional e de mercado. Elabore o projeto executivo para quantitativos precisos.
          </p>

          {/* ── Otimizador de Corte ── */}
          <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", marginTop: 8 }}>
            {/* Header */}
            <div style={{ padding: "13px 20px", background: C.dark, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: C.graphite, textTransform: "uppercase" }}>🔧 Otimização de Corte</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                Algoritmo FFD (First Fit Decreasing) — minimize desperdício de ~10% para ~2–3%
              </div>
            </div>

            {/* Configuração */}
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, background: "#fcfcfc", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 5 }}>BARRA PADRÃO</div>
                <select value={tamBarra} onChange={(e) => { setTamBarra(Number(e.target.value)); setOtimizacao(null); }}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit", background: "#fff" }}>
                  <option value={6000}>6.000 mm (6m)</option>
                  <option value={12000}>12.000 mm (12m)</option>
                  <option value={3000}>3.000 mm (3m)</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 5 }}>MONTANTE C 90 (mm/pç)</div>
                <input type="number" value={tamC90} min={100} max={tamBarra} onChange={(e) => { setTamC90(Number(e.target.value)); setOtimizacao(null); }}
                  style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit", width: 110 }} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 5 }}>MONTANTE C 140 (mm/pç)</div>
                <input type="number" value={tamC140} min={100} max={tamBarra} onChange={(e) => { setTamC140(Number(e.target.value)); setOtimizacao(null); }}
                  style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit", width: 110 }} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 5 }}>OBRA (origem dos retalhos)</div>
                <select value={obraId} onChange={(e) => setObraId(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit", background: "#fff", maxWidth: 200 }}>
                  <option value="">Sem vínculo</option>
                  {obras.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
                </select>
              </div>
              <button onClick={calcularOtimizacao} style={{
                padding: "9px 22px", background: C.red, color: "#fff", border: "none",
                borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>🔧 Calcular</button>
            </div>

            {/* Banco de Retalhos disponíveis */}
            {retalhos.length > 0 && (
              <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, background: "#f0faf4" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.success, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
                  📦 Banco de Retalhos — {retalhos.length} peça{retalhos.length !== 1 ? "s" : ""} disponível{retalhos.length !== 1 ? "is" : ""}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {retalhos.map((r) => (
                    <div key={r.id} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "5px 10px", background: "#fff", border: `1px solid ${C.success}44`,
                      borderRadius: 8, fontSize: 12,
                    }}>
                      <span style={{ fontWeight: 700, color: C.success }}>{fmtMm(r.comprimento_mm)}</span>
                      <span style={{ color: C.muted }}>{r.tipo_perfil}</span>
                      {r.obras?.nome && <span style={{ fontSize: 10, color: C.muted }}>· {r.obras.nome}</span>}
                      <button onClick={() => handleUsarRetalho(r.id)} style={{
                        padding: "2px 8px", background: C.success, color: "#fff",
                        border: "none", borderRadius: 5, fontSize: 10, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>Usar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resultados — cards mobile-first */}
            {otimizacao && (
              <div style={{ padding: "16px 16px 20px" }}>
                {otimizacao.grupos.map((prof) => {
                  const visiveis    = verTodas[prof.nome] ? prof.barras : prof.barras.slice(0, 10);
                  const sobraTotal  = prof.barras.reduce((s, b) => s + b.sobra, 0);
                  const numCortadas = prof.barras.filter((b) => cortadas[`${prof.nome}_${b.id}`]).length;
                  const corApr      = prof.apr >= 90 ? C.success : prof.apr >= 75 ? "#d97706" : C.danger;
                  const barrasReais = Number(desvioReal[prof.nome] || 0);
                  const desvio      = barrasReais > 0 ? ((barrasReais - prof.barras.length) / prof.barras.length) * 100 : null;
                  return (
                    <div key={prof.nome} style={{ marginBottom: 28 }}>

                      {/* Cabeçalho do grupo */}
                      <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                        padding: "12px 14px", background: "#1a1a1a", borderRadius: "10px 10px 0 0",
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>{prof.nome}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>
                            {prof.barras.length} barras de {tamBarra / 1000}m · sobra total {fmtMm(sobraTotal)}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: corApr }}>{prof.apr.toFixed(1)}%</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>aproveitamento</div>
                        </div>
                      </div>

                      {/* Retalhos aproveitados */}
                      {prof.cobertas > 0 && (
                        <div style={{
                          padding: "7px 14px", background: "#f0faf4",
                          borderLeft: "1px solid #ddd", borderRight: "1px solid #ddd",
                          fontSize: 11, fontWeight: 700, color: C.success,
                        }}>
                          📦 {prof.cobertas} peça{prof.cobertas !== 1 ? "s" : ""} coberta{prof.cobertas !== 1 ? "s" : ""} por retalhos
                          &nbsp;·&nbsp;
                          <span style={{ fontWeight: 400, color: "#555" }}>
                            {prof.barras.length} barra{prof.barras.length !== 1 ? "s" : ""} novas necessárias
                            (de {prof.qtdTotal} peças, {prof.cobertas} do estoque)
                          </span>
                        </div>
                      )}

                      {/* Barra de progresso das cortadas */}
                      <div style={{
                        height: 6, background: "#e5e5e5",
                        borderLeft: "1px solid #ddd", borderRight: "1px solid #ddd",
                        position: "relative", overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%", background: C.success,
                          width: prof.barras.length ? `${(numCortadas / prof.barras.length) * 100}%` : "100%",
                          transition: "width .3s ease",
                        }} />
                      </div>

                      {/* Contador de progresso */}
                      <div style={{
                        padding: "6px 14px", background: "#f7f7f7",
                        borderLeft: "1px solid #ddd", borderRight: "1px solid #ddd",
                        fontSize: 11, color: C.muted, display: "flex", justifyContent: "space-between",
                      }}>
                        <span>{numCortadas} de {prof.barras.length} cortadas</span>
                        {numCortadas === prof.barras.length && prof.barras.length > 0 && (
                          <span style={{ fontWeight: 700, color: C.success }}>✅ Concluído!</span>
                        )}
                      </div>

                      {/* Alerta de Desvio */}
                      {numCortadas === prof.barras.length && prof.barras.length > 0 && (
                        <div style={{ padding: "10px 14px", borderLeft: "1px solid #ddd", borderRight: "1px solid #ddd", background: desvio !== null && desvio >= 15 ? "#fff1f1" : "#fff" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6 }}>
                            ⚠️ ALERTA DE DESVIO — barras efetivamente usadas na obra:
                          </div>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <input
                              type="number" min={0} placeholder={`Previsto: ${prof.barras.length}`}
                              value={desvioReal[prof.nome] || ""}
                              onChange={(e) => setDesvioReal((d) => ({ ...d, [prof.nome]: e.target.value }))}
                              style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${desvio !== null && desvio >= 15 ? C.danger : C.border}`, fontSize: 14, fontWeight: 700, width: 100, fontFamily: "inherit" }}
                            />
                            <span style={{ fontSize: 12, color: C.muted }}>barras reais</span>
                            {desvio !== null && (
                              <div style={{
                                flex: 1, padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                                background: desvio >= 15 ? C.danger + "15" : desvio >= 5 ? "#fef3c7" : C.success + "15",
                                color:      desvio >= 15 ? C.danger        : desvio >= 5 ? "#92400e"   : C.success,
                                borderLeft: `3px solid ${desvio >= 15 ? C.danger : desvio >= 5 ? "#d97706" : C.success}`,
                              }}>
                                {desvio > 0 ? `▲ +${desvio.toFixed(1)}% acima do planejado` : desvio < 0 ? `▼ ${Math.abs(desvio).toFixed(1)}% abaixo (ótimo!)` : "✅ Sem desvio"}
                                {desvio >= 15 && <div style={{ fontSize: 11, fontWeight: 400, marginTop: 3 }}>Investigar: erro de medição, retrabalho ou furto de material?</div>}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Cards de barra */}
                      <div style={{ border: "1px solid #ddd", borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                        {visiveis.map((b, idx) => {
                          const key       = `${prof.nome}_${b.id}`;
                          const isCortada = !!cortadas[key];
                          return (
                            <div key={b.id} style={{
                              padding: "14px 14px 12px",
                              background: isCortada ? "#f0faf4" : "#fff",
                              borderTop: idx > 0 ? "1px solid #e8e8e8" : "none",
                              transition: "background .2s",
                            }}>
                              {/* Linha superior */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                <span style={{
                                  fontSize: 15, fontWeight: 800, color: isCortada ? C.success : "#1a1a1a",
                                  letterSpacing: 0.3,
                                }}>
                                  {isCortada ? "✅ " : ""}BARRA {String(b.id).padStart(2, "0")}
                                </span>
                                <span style={{
                                  fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                                  background: b.sobra === 0 ? C.success + "20" : b.sobra > 500 ? C.danger + "15" : "#fef3c7",
                                  color: b.sobra === 0 ? C.success : b.sobra > 500 ? C.danger : "#92400e",
                                }}>
                                  {b.sobra === 0 ? "Sem sobra" : `Sobra ${b.sobra}mm`}
                                </span>
                              </div>

                              {/* Barra visual proporcional */}
                              <div style={{
                                display: "flex", height: 36, borderRadius: 6,
                                overflow: "hidden", border: "1px solid #d0d0d0",
                                opacity: isCortada ? 0.45 : 1,
                                transition: "opacity .2s",
                              }}>
                                {b.cortes.map((c, ci) => (
                                  <div key={ci} style={{
                                    width: `${(c.tam / tamBarra) * 100}%`,
                                    background: isCortada ? "#6b7280" : prof.cor,
                                    borderRight: "2px solid rgba(255,255,255,0.3)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 10, fontWeight: 800, color: "#fff",
                                    overflow: "hidden", whiteSpace: "nowrap", flexShrink: 0,
                                  }}>
                                    {c.tam >= 400 ? `${c.tam}` : ""}
                                  </div>
                                ))}
                                {b.sobra > 0 && (
                                  <div style={{
                                    flex: 1, background: "#e0e0e0", minWidth: 6,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 9, color: "#999", fontWeight: 600,
                                  }}>
                                    {b.sobra >= 400 ? `${b.sobra}` : ""}
                                  </div>
                                )}
                              </div>

                              {/* Legenda das peças */}
                              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                                {b.cortes.map((c, ci) => (
                                  <span key={ci} style={{ fontSize: 11, color: "#444", fontWeight: 600 }}>
                                    {ci + 1}. {c.tam}mm
                                  </span>
                                ))}
                              </div>

                              {/* Botão de marcar */}
                              <button onClick={() => toggleCortada(key)} style={{
                                marginTop: 12, width: "100%", padding: "11px 0",
                                background: isCortada ? C.success : "transparent",
                                border: `2px solid ${isCortada ? C.success : "#d0d0d0"}`,
                                borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                                fontSize: 13, fontWeight: 800,
                                color: isCortada ? "#fff" : "#555",
                                transition: "all .2s",
                              }}>
                                {isCortada ? "✅ Cortada — toque para desfazer" : "Marcar como Cortada"}
                              </button>

                              {/* Registrar retalho de sobra */}
                              {isCortada && b.sobra >= 400 && (
                                <button
                                  onClick={() => handleRegistrarRetalho(b, prof.tipoLabel)}
                                  disabled={salvandoRet === key}
                                  style={{
                                    marginTop: 6, width: "100%", padding: "9px 0",
                                    background: "transparent",
                                    border: `1px dashed ${C.success}`,
                                    borderRadius: 8, cursor: salvandoRet === key ? "default" : "pointer",
                                    fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                                    color: C.success, opacity: salvandoRet === key ? 0.6 : 1,
                                  }}>
                                  {salvandoRet === key ? "Salvando…" : `📦 Registrar retalho de ${fmtMm(b.sobra)} no banco`}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {prof.barras.length > 10 && (
                        <button onClick={() => setVerTodas((v) => ({ ...v, [prof.nome]: !v[prof.nome] }))}
                          style={{
                            marginTop: 8, width: "100%", padding: "10px 0",
                            background: "none", border: `1px solid ${C.border}`,
                            borderRadius: 8, fontSize: 12, cursor: "pointer",
                            fontFamily: "inherit", color: C.muted, fontWeight: 600,
                          }}>
                          {verTodas[prof.nome] ? "▲ Recolher" : `▼ Ver mais ${prof.barras.length - 10} barras`}
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Guia U — linear contínua */}
                {otimizacao.guia && (
                  <div style={{
                    borderRadius: 10, border: "1px solid #ddd", overflow: "hidden", marginBottom: 20,
                  }}>
                    <div style={{ padding: "12px 14px", background: "#1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{otimizacao.guia.nome}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
                          Linear contínua — sem FFD
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: otimizacao.guia.apr >= 90 ? C.success : "#d97706" }}>
                          {otimizacao.guia.apr.toFixed(1)}%
                        </div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>aproveitamento</div>
                      </div>
                    </div>
                    <div style={{ padding: "14px", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 13, color: "#333" }}>
                        <span style={{ fontWeight: 700 }}>{fmtMm(otimizacao.guia.mm)}</span>
                        <span style={{ color: C.muted }}> necessários</span>
                      </div>
                      <div style={{ fontSize: 13 }}>
                        <span style={{ fontWeight: 800, color: "#1a1a1a" }}>{otimizacao.guia.nb} barras</span>
                        <span style={{ color: C.muted, fontSize: 11 }}> de {tamBarra / 1000}m</span>
                      </div>
                      <div style={{ fontSize: 12, color: otimizacao.guia.sobra > 500 ? C.danger : C.muted }}>
                        sobra {fmtMm(otimizacao.guia.sobra)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Aviso técnico */}
                <div style={{
                  padding: "12px 14px", background: "#fffbeb",
                  border: "1px solid #fde68a", borderRadius: 8, fontSize: 12, color: "#78350f", lineHeight: 1.5,
                }}>
                  ⚠️ Comprimentos de referência. Confirme com a tabela de corte do projeto estrutural.
                  Peças de sobra ≥ 400mm devem ser catalogadas para reaproveitamento.
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`@media print { button { display: none !important; } }`}</style>
      </>)}
    </div>
  );
}
