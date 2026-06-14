import { useState, useEffect, useCallback } from "react";
import { BarChart2, ClipboardList } from "../components/ui/Icon";
import { C } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import { sb } from "../services/supabase";
import * as XLSX from "xlsx";
import {
  listarRetalhos, registrarRetalho, marcarUsado,
} from "../services/repositories/retalhosRepository";

// ─── Insumos por m² de área construída ───────────────────────────────────────
// fund:true = não multiplica por pavs/padrão | serv:true = mão de obra (não é material)
const INSUMOS = [
  // Estrutura
  { categoria: "Estrutura de Aço",   grupo: "Estrutura",          nome: "Montante C 90×40×15×1,25mm",          un: "pç",  base: 1.50,  preco: 18.50, desc: "Espaçamento 600mm, pé-direito 2,80m" },
  { categoria: "Estrutura de Aço",   grupo: "Estrutura",          nome: "Guia U 92×40×1,25mm",                 un: "m",   base: 1.10,  preco: 12.00, desc: "Superior e inferior" },
  { categoria: "Estrutura de Aço",   grupo: "Estrutura",          nome: "Montante C 140×40×15×1,25mm",         un: "pç",  base: 0.30,  preco: 24.00, desc: "Vergas e contravergas" },
  // Fechamento
  { categoria: "Fechamento",         grupo: "Vedação externa",    nome: "Chapa OSB 11,1mm (1,22×2,44)",        un: "chp", base: 0.38,  preco: 52.00, desc: "Contraventamento estrutural" },
  { categoria: "Fechamento",         grupo: "Vedação interna",    nome: "Placa de Gesso ST 13mm (1,20×2,40)",  un: "chp", base: 0.85,  preco: 17.00, desc: "Faces internas das paredes" },
  { categoria: "Fechamento",         grupo: "Vedação externa",    nome: "Placa Cimentícia 10mm (1,20×2,40)",   un: "chp", base: 0.18,  preco: 65.00, desc: "Fachada externa" },
  // Isolamento
  { categoria: "Isolamento",         grupo: "Isolamento",         nome: "Lã de Vidro 50mm",                    un: "m²",  base: 1.30,  preco: 16.00, desc: "Interior das paredes e laje" },
  { categoria: "Isolamento",         grupo: "Isolamento",         nome: "Manta EPDM (fita adesiva 50mm)",      un: "m",   base: 1.10,  preco:  5.50, desc: "Vedação de juntas" },
  { categoria: "Isolamento",         grupo: "Impermeabilização",  nome: "Impermeabilizante flexível",          un: "m²",  base: 0.15,  preco: 35.00, desc: "Áreas molhadas" },
  // Fixação
  { categoria: "Fixação",            grupo: "Fixação",            nome: "Parafuso TEX 4,2×16mm (flangeado)",   un: "cx",  base: 0.40,  preco: 48.00, desc: "Caixa c/ 500 pçs — gesso" },
  { categoria: "Fixação",            grupo: "Fixação",            nome: "Parafuso TEX 4,2×38mm",               un: "cx",  base: 0.80,  preco: 52.00, desc: "Caixa c/ 500 pçs — OSB/cimentícia" },
  { categoria: "Fixação",            grupo: "Fixação",            nome: "Parafuso TEX 6,3×19mm",               un: "cx",  base: 0.16,  preco: 58.00, desc: "Caixa c/ 500 pçs — emenda perfis" },
  // Fundação
  { categoria: "Fundação (Radier)",  grupo: "Fundação",           nome: "Concreto C-25",                       un: "m³",  base: 0.10,  preco: 420.0, desc: "Espessura 10cm",   fund: true },
  { categoria: "Fundação (Radier)",  grupo: "Fundação",           nome: "Ferragem CA-50 ⌀6,3mm",               un: "kg",  base: 6.00,  preco:  6.50, desc: "~6 kg/m²",         fund: true },
  { categoria: "Fundação (Radier)",  grupo: "Fundação",           nome: "Tela soldada Q-92 (3×2m)",            un: "pç",  base: 0.17,  preco: 68.00, desc: "1 tela = 6m²",     fund: true },
  { categoria: "Fundação (Radier)",  grupo: "Fundação",           nome: "Forma lateral (tábua 3ª)",            un: "m",   base: 0.40,  preco:  8.00, desc: "Perímetro do radier", fund: true },
  // Cobertura
  { categoria: "Cobertura",         grupo: "Cobertura",           nome: "Telha shingle (fardo 3m²)",           un: "fd",  base: 0.38,  preco: 185.0, desc: "Cobertura principal" },
  { categoria: "Cobertura",         grupo: "Cobertura",           nome: "Manta subcobertura 1,5m",             un: "m²",  base: 1.05,  preco:  8.50, desc: "Barreira térmica/hídrica" },
  { categoria: "Cobertura",         grupo: "Cobertura",           nome: "Perfil de cumeeira/rincão",           un: "m",   base: 0.25,  preco: 22.00, desc: "Acabamento de telhado" },
  { categoria: "Cobertura",         grupo: "Cobertura",           nome: "Calha PVC 150mm",                     un: "m",   base: 0.30,  preco: 28.00, desc: "Captação de águas pluviais" },
  { categoria: "Cobertura",         grupo: "Cobertura",           nome: "Rufo e contra-rufo em aço",           un: "m",   base: 0.20,  preco: 35.00, desc: "Vedação perimetral" },
  // Esquadrias
  { categoria: "Esquadrias",        grupo: "Esquadrias",          nome: "Janela alumínio c/ vidro (1,20×1,20)",un: "un",  base: 0.055, preco: 680.0, desc: "~1 janela a cada 18m²" },
  { categoria: "Esquadrias",        grupo: "Esquadrias",          nome: "Porta interna 0,80×2,10",             un: "un",  base: 0.08,  preco: 420.0, desc: "~1 porta a cada 12m²" },
  { categoria: "Esquadrias",        grupo: "Esquadrias",          nome: "Porta externa blindada",              un: "un",  base: 0.008, preco:2200.0, desc: "~1 porta externa a cada 120m²" },
  // Instalações
  { categoria: "Instalações Elétricas", grupo: "Elétrica",       nome: "Conduíte + fios + caixas",            un: "m²",  base: 1.00,  preco: 62.00, desc: "~R$62/m² elétrica embutida" },
  { categoria: "Instalações Elétricas", grupo: "Elétrica",       nome: "Quadro de distribuição",              un: "un",  base: 0.012, preco:1800.0, desc: "~1 QD a cada 80m²" },
  { categoria: "Inst. Hidrossanitárias", grupo: "Hidráulica",    nome: "Tubulação PVC água fria/quente",      un: "m²",  base: 1.00,  preco: 38.00, desc: "~R$38/m² hidráulica" },
  { categoria: "Inst. Hidrossanitárias", grupo: "Hidráulica",    nome: "Tubulação esgoto + ventilação",       un: "m²",  base: 1.00,  preco: 22.00, desc: "~R$22/m² esgoto" },
  // Acabamentos
  { categoria: "Acabamentos",       grupo: "Acabamentos",         nome: "Piso vinílico click 4mm",             un: "m²",  base: 0.90,  preco: 58.00, desc: "90% da área útil" },
  { categoria: "Acabamentos",       grupo: "Acabamentos",         nome: "Revestimento porcelanato banheiro",   un: "m²",  base: 0.08,  preco: 85.00, desc: "Banheiros (~8% da área)" },
  { categoria: "Acabamentos",       grupo: "Acabamentos",         nome: "Massa corrida + pintura látex",       un: "m²",  base: 2.80,  preco:  9.50, desc: "Paredes e teto interno" },
  { categoria: "Acabamentos",       grupo: "Acabamentos",         nome: "Forro drywall ST (teto)",             un: "m²",  base: 0.90,  preco: 42.00, desc: "90% da área útil" },
  { categoria: "Acabamentos",       grupo: "Acabamentos",         nome: "Rodapé MDF 10cm",                     un: "m",   base: 1.80,  preco: 12.00, desc: "Perimetral interno" },
  // Projetos
  { categoria: "Projetos e Engenharia", grupo: "Projetos",       nome: "Projeto Arquitetônico",               un: "m²",  base: 1.00,  preco: 28.00, desc: "Inclui implantação e cortes" },
  { categoria: "Projetos e Engenharia", grupo: "Projetos",       nome: "Projeto Estrutural LSF",              un: "m²",  base: 1.00,  preco: 18.00, desc: "Memorial + detalhamento" },
  { categoria: "Projetos e Engenharia", grupo: "Projetos",       nome: "Projeto Elétrico + Hidro",            un: "m²",  base: 1.00,  preco: 14.00, desc: "Aprovação em concessionária" },
  // Mão de Obra
  { categoria: "Mão de Obra",       grupo: "Mão de Obra",        nome: "Montagem estrutura LSF",              un: "m²",  base: 1.00,  preco: 400.00, desc: "Equipe especializada" },
  { categoria: "Mão de Obra",       grupo: "Mão de Obra",        nome: "Instalação vedações (OSB/gesso/cim)", un: "m²",  base: 1.00,  preco: 200.00, desc: "Fechamento interno e externo" },
  { categoria: "Mão de Obra",       grupo: "Mão de Obra",        nome: "Cobertura (telha shingle)",           un: "m²",  base: 1.00,  preco: 300.00, desc: "Montagem e impermeabilização" },
];

const CATS_ORDEM = [
  "Estrutura de Aço","Fechamento","Isolamento","Fixação","Fundação (Radier)",
  "Cobertura","Esquadrias","Instalações Elétricas","Inst. Hidrossanitárias",
  "Acabamentos","Projetos e Engenharia","Mão de Obra",
];

const PADROES = {
  "Econômico":   { fator: 0.85 },
  "Padrão":      { fator: 1.00 },
  "Alto Padrão": { fator: 1.20 },
};

// ─── Kits de modelos de casa ──────────────────────────────────────────────────
const KITS = [
  {
    id: "studio",
    nome: "Studio Compact",
    area: 42, pavs: 1, padrao: "Padrão",
    tag: "MAIS VENDIDO",
    tagCor: "#2e9e5b",
    descricao: "Ideal para uso individual, home office ou kitnet. Layout inteligente e construção rápida.",
    quartos: 1, banheiros: 1, salas: 1,
    emoji: "🏠",
    destaques: ["Entrega em 45 dias", "Kit completo estrutural", "Perfeito para kitnet"],
  },
  {
    id: "vila",
    nome: "Vila 78m²",
    area: 78, pavs: 1, padrao: "Padrão",
    tag: "POPULAR",
    tagCor: "#4a9eff",
    descricao: "Casa térrea completa para família pequena. Conforto e economia em um só projeto.",
    quartos: 2, banheiros: 1, salas: 1,
    emoji: "🏡",
    destaques: ["2 quartos confortáveis", "Varanda integrada", "Custo-benefício ótimo"],
  },
  {
    id: "casa120",
    nome: "Casa Serena 120m²",
    area: 120, pavs: 1, padrao: "Padrão",
    tag: "RECOMENDADO",
    tagCor: "#981915",
    descricao: "O modelo mais completo para família de 4 pessoas. Suíte master, sala ampla e área gourmet.",
    quartos: 3, banheiros: 2, salas: 2,
    emoji: "🏘",
    destaques: ["Suíte master com closet", "Área gourmet", "Sala de TV + jantar"],
  },
  {
    id: "sobrado160",
    nome: "Sobrado Vivo 160m²",
    area: 160, pavs: 2, padrao: "Padrão",
    tag: "2 PAVIMENTOS",
    tagCor: "#8b5cf6",
    descricao: "Sobrado moderno com térreo social e pavimento superior privativo. Máxima privacidade.",
    quartos: 3, banheiros: 3, salas: 2,
    emoji: "🏗",
    destaques: ["Térreo social separado", "3 suítes no andar", "Sacada com guarda-corpo"],
  },
  {
    id: "alto200",
    nome: "Residência Alto 200m²",
    area: 200, pavs: 1, padrao: "Alto Padrão",
    tag: "ALTO PADRÃO",
    tagCor: "#e07020",
    descricao: "Para quem não abre mão do melhor. Acabamentos superiores, ambientes generosos e projeto exclusivo.",
    quartos: 4, banheiros: 3, salas: 3,
    emoji: "🏛",
    destaques: ["4 suítes amplas", "Home theater", "Piscina prevista"],
  },
  {
    id: "vigo273",
    nome: "Casa Vigo 273m²",
    area: 273, pavs: 2, padrao: "Alto Padrão",
    tag: "PREMIUM",
    tagCor: "#c0392b",
    descricao: "Nossa flagship — o lar dos sonhos em Steel Frame. Projeto inspirado em casas européias modernas.",
    quartos: 4, banheiros: 4, salas: 3,
    emoji: "🏰",
    destaques: ["Estilo europeu moderno", "Pé-direito duplo na sala", "Área total de lazer"],
  },
];


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
function CalcParedeDrywall({ listaInsumos = INSUMOS }) {
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

    const precoMontante = listaInsumos.find(i => i.nome.includes("C 90"))?.preco || 18.50;
    const precoGuia = listaInsumos.find(i => i.nome.includes("Guia U"))?.preco || 12.00;
    const precoPlaca = listaInsumos.find(i => i.nome.includes("Gesso ST"))?.preco || t.preco_placa;

    setResult({
      area, areaComp, placas, montantes, guias, parafusos, cxPar, massa, fita,
      totalPlacas: placas * precoPlaca,
      totalMont: montantes * precoMontante,
      totalGuia: guias * precoGuia,
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
        <div style={{ animation: "fadeUp .35s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ height: 3, flex: 1, background: "linear-gradient(90deg,#981915,transparent)", borderRadius: 2 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>Resultado</span>
            <div style={{ height: 3, flex: 1, background: "linear-gradient(270deg,#981915,transparent)", borderRadius: 2 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12, marginBottom: 16 }}>
            {[
              { icon: "⬜", label: "Placas Drywall",    qtd: `${result.placas} chp`,    sub: `${TIPOS[tipo].label} · ${result.area.toFixed(1)} m²`, val: result.totalPlacas },
              { icon: "⠿",  label: "Montantes (C 90)",  qtd: `${result.montantes} pç`,  sub: `espaç. ${esp}mm`,                                      val: result.totalMont },
              { icon: "—",  label: "Guias (U 92)",       qtd: `${result.guias} m`,       sub: "superior + inferior",                                  val: result.totalGuia },
              { icon: "⬡",  label: "Parafusos TEX",     qtd: `${result.cxPar} cx`,      sub: `${result.parafusos} pçs (~15/m²)`,                     val: result.totalPar },
              { icon: "◎",  label: "Massa p/ Juntas",   qtd: `${Math.ceil(result.massa)} saco`, sub: `${(result.massa).toFixed(1)} × 15kg`,          val: result.totalMassa },
              { icon: "〜", label: "Fita p/ Juntas",    qtd: `${result.fita} m`,         sub: `~1,2 m/m² de placa`,                                  val: result.totalFita },
            ].map(({ icon, label, qtd, sub, val }) => (
              <div key={label} style={{
                background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`,
                padding: "16px 18px", transition: "transform .15s, box-shadow .15s",
                boxShadow: "0 2px 8px rgba(0,0,0,.04)",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.04)"; }}
              >
                <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: C.text, lineHeight: 1 }}>{qtd}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{sub}</div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}`, fontSize: 13, color: "#2e9e5b", fontWeight: 700 }}>{fmtR(val)}</div>
              </div>
            ))}
          </div>
          <div style={{
            background: "linear-gradient(135deg,#981915,#c0392b)",
            borderRadius: 16, padding: "20px 28px", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
            boxShadow: "0 8px 32px rgba(152,25,21,.35)",
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", opacity: .7, marginBottom: 4 }}>Total estimado de materiais</div>
              <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1 }}>{fmtR(total)}</div>
              <div style={{ fontSize: 12, opacity: .6, marginTop: 2 }}>preços de referência · desperdício incluso</div>
            </div>
            <div style={{ fontSize: 48 }}>🏗</div>
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
        <div style={{ animation: "fadeUp .35s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ height: 3, flex: 1, background: "linear-gradient(90deg,#981915,transparent)", borderRadius: 2 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>Resultado</span>
            <div style={{ height: 3, flex: 1, background: "linear-gradient(270deg,#981915,transparent)", borderRadius: 2 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 16 }}>
            {[
              { icon: "⬜", label: "Placas Drywall",       qtd: `${result.placas} chp`,                   sub: TIPOS[tipo].label,             val: result.totalPlacas },
              { icon: "⠿",  label: "Perfil T47",            qtd: `${result.perfis} m`,                     sub: `módulo ${modulo}`,             val: result.totalPerfis },
              { icon: "⬇",  label: "Pendurais + Tirantes",  qtd: `${result.pendurais} pç`,                 sub: "1 a cada 1,2 m²",             val: result.totalPend },
              { icon: "⬡",  label: "Parafusos TEX",        qtd: `${result.cxPar} cx`,                     sub: "~8 por m²",                   val: result.totalPar },
              { icon: "◎",  label: "Massa p/ Juntas",      qtd: `${Math.ceil(result.massa/15)} saco`,     sub: `${result.massa} kg`,          val: result.totalMassa },
              { icon: "〜", label: "Fita p/ Juntas",       qtd: `${result.fita} m`,                       sub: "1 m/m² de forro",             val: result.totalFita },
            ].map(({ icon, label, qtd, sub, val }) => (
              <div key={label} style={{
                background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`, padding: "16px 18px",
                boxShadow: "0 2px 8px rgba(0,0,0,.04)", transition: "transform .15s,box-shadow .15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.04)"; }}
              >
                <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: C.text, lineHeight: 1 }}>{qtd}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{sub}</div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}`, fontSize: 13, color: "#2e9e5b", fontWeight: 700 }}>{fmtR(val)}</div>
              </div>
            ))}
          </div>
          <div style={{
            background: "linear-gradient(135deg,#981915,#c0392b)",
            borderRadius: 16, padding: "20px 28px", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
            boxShadow: "0 8px 32px rgba(152,25,21,.35)",
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", opacity: .7, marginBottom: 4 }}>Total estimado de materiais</div>
              <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1 }}>{fmtR(total)}</div>
              <div style={{ fontSize: 12, opacity: .6, marginTop: 2 }}>preços de referência · desperdício incluso</div>
            </div>
            <div style={{ fontSize: 48 }}>⬜</div>
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
        <div style={{ animation: "fadeUp .35s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ height: 3, flex: 1, background: "linear-gradient(90deg,#981915,transparent)", borderRadius: 2 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>Comparativo de sistemas</span>
            <div style={{ height: 3, flex: 1, background: "linear-gradient(270deg,#981915,transparent)", borderRadius: 2 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            {result.sistemas.map((s, i) => {
              const maxTotal = Math.max(...result.sistemas.map(x => x.total));
              const pct = (s.total / maxTotal) * 100;
              return (
                <div key={s.tipo} style={{
                  background: "#fff", borderRadius: 16,
                  border: `2px solid ${s.cor}33`, padding: "22px",
                  boxShadow: `0 4px 20px ${s.cor}18`,
                  transition: "transform .2s,box-shadow .2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow=`0 12px 32px ${s.cor}30`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow=`0 4px 20px ${s.cor}18`; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.cor, flexShrink: 0 }} />
                    <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>{s.tipo}</div>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>{s.desc}</div>

                  {/* barra de custo relativo */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, fontWeight: 700, letterSpacing: .5 }}>CUSTO RELATIVO</div>
                    <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${s.cor}88,${s.cor})`, borderRadius: 4, transition: "width .6s ease" }} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    <div style={{ background: C.darker, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 9, color: C.muted, marginBottom: 2, fontWeight: 700, letterSpacing: .5 }}>PLACAS</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: C.text }}>{s.placas}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>chapas</div>
                    </div>
                    <div style={{ background: C.darker, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 9, color: C.muted, marginBottom: 2, fontWeight: 700, letterSpacing: .5 }}>CUSTO/m²</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: C.text }}>{fmtR(s.totalM2)}</div>
                    </div>
                  </div>
                  <div style={{ background: `linear-gradient(135deg,${s.cor}18,${s.cor}08)`, borderRadius: 10, padding: "12px 14px", textAlign: "center", border: `1px solid ${s.cor}22` }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>TOTAL MATERIAIS</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: s.cor }}>{fmtR(s.total)}</div>
                  </div>
                  {i === 0 && <div style={{ marginTop: 8, textAlign: "center", fontSize: 10, fontWeight: 700, color: s.cor, letterSpacing: .5 }}>✓ MAIS ECONÔMICO</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Calculadora Kits ─────────────────────────────────────────────────────────
const CATS_OPCIONAIS = ["Projetos e Engenharia", "Mão de Obra"];

function CalcKits({ onEnviarOrcamento, listaInsumos = INSUMOS }) {
  const [kitSel, setKitSel] = useState(null);
  const [result, setResult] = useState(null);
  const [catsAtivas, setCatsAtivas] = useState(
    Object.fromEntries(CATS_ORDEM.map(c => [c, true]))
  );

  // Pré-seleciona kit vindo do lead (Orcamentos.jsx seta sf_kit_lead)
  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem("sf_kit_lead") || "null");
      if (!salvo) return;
      localStorage.removeItem("sf_kit_lead");
      const kit = KITS.find(k => k.id === salvo.kitId);
      if (kit) {
        const k = salvo.padrao ? { ...kit, padrao: salvo.padrao } : kit;
        calcularKit(k);
        setTimeout(() => document.getElementById("kit-result-scroll")?.scrollIntoView({ behavior: "smooth" }), 200);
      }
    } catch (_) {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleCat(cat) {
    setCatsAtivas(prev => ({ ...prev, [cat]: !prev[cat] }));
  }

  function calcularKit(kit) {
    setKitSel(kit);
    const fatorPadrao = PADROES[kit.padrao].fator;
    const items = listaInsumos.map((ins) => {
      const fator = ins.fund ? 1 : fatorPadrao * kit.pavs;
      const qtd = Math.ceil(ins.base * kit.area * fator);
      return { ...ins, qtd, total: qtd * ins.preco };
    });
    setResult({ ...kit, items });
  }

  const totalAtivo = result
    ? result.items.filter(i => catsAtivas[i.categoria]).reduce((s, i) => s + i.total, 0)
    : 0;
  const totalSoMateriais = result
    ? result.items.filter(i => !["Projetos e Engenharia","Mão de Obra"].includes(i.categoria)).reduce((s, i) => s + i.total, 0)
    : 0;

  return (
    <div>
      {/* Grid de kits */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20, marginBottom: 32 }}>
        {KITS.map((kit) => {
          const sel = kitSel?.id === kit.id;
          const totalRef = listaInsumos.reduce((s, ins) => {
            const f = ins.fund ? 1 : PADROES[kit.padrao].fator * kit.pavs;
            return s + Math.ceil(ins.base * kit.area * f) * ins.preco;
          }, 0);
          return (
            <div key={kit.id} onClick={() => calcularKit(kit)} style={{
              background: sel ? "linear-gradient(135deg,#1a0a0a,#2d0f0f)" : "#fff",
              border: `2px solid ${sel ? "#981915" : C.border}`,
              borderRadius: 20, padding: "22px", cursor: "pointer",
              transition: "all .2s", position: "relative", overflow: "hidden",
              boxShadow: sel ? "0 12px 40px rgba(152,25,21,.3)" : "0 2px 12px rgba(0,0,0,.06)",
              transform: sel ? "translateY(-3px)" : "none",
            }}
              onMouseEnter={e => { if (!sel) { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 28px rgba(0,0,0,.12)"; }}}
              onMouseLeave={e => { if (!sel) { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.06)"; }}}
            >
              {/* tag */}
              <div style={{ position: "absolute", top: 14, right: 14, background: kit.tagCor, color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20, letterSpacing: .8 }}>
                {kit.tag}
              </div>

              <div style={{ fontSize: 40, marginBottom: 12 }}>{kit.emoji}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: sel ? "#fff" : C.text, marginBottom: 4 }}>{kit.nome}</div>
              <div style={{ fontSize: 12, color: sel ? "rgba(255,255,255,.6)" : C.muted, marginBottom: 14, lineHeight: 1.5 }}>{kit.descricao}</div>

              {/* specs */}
              <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                {[
                  { icon: "📐", val: `${kit.area} m²` },
                  { icon: "🛏", val: `${kit.quartos} qts` },
                  { icon: "🚿", val: `${kit.banheiros} ban` },
                  { icon: "🏠", val: `${kit.pavs}P` },
                ].map(({ icon, val }) => (
                  <div key={val} style={{ display: "flex", alignItems: "center", gap: 4, background: sel ? "rgba(255,255,255,.1)" : C.darker, borderRadius: 8, padding: "4px 10px" }}>
                    <span style={{ fontSize: 12 }}>{icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: sel ? "#fff" : C.text }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* destaques */}
              <div style={{ marginBottom: 16 }}>
                {kit.destaques.map(d => (
                  <div key={d} style={{ fontSize: 11, color: sel ? "rgba(255,255,255,.7)" : C.muted, marginBottom: 3 }}>✓ {d}</div>
                ))}
              </div>

              {/* preço ref */}
              <div style={{ borderTop: `1px solid ${sel ? "rgba(255,255,255,.15)" : C.border}`, paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 9, color: sel ? "rgba(255,255,255,.5)" : C.muted, letterSpacing: .8, marginBottom: 2 }}>MATERIAIS A PARTIR DE</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: sel ? "#ffb3b0" : "#981915" }}>{fmtR(totalRef)}</div>
                </div>
                <div style={{ background: sel ? "rgba(255,255,255,.15)" : "#981915", color: "#fff", fontSize: 11, fontWeight: 700, padding: "8px 16px", borderRadius: 10 }}>
                  {sel ? "✓ Selecionado" : "Calcular"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resultado do kit selecionado */}
      {result && (() => {
        const totalCompleto = result.items.reduce((s, i) => s + i.total, 0);
        const totalComProjetos = result.items
          .filter(i => i.categoria !== "Mão de Obra")
          .reduce((s, i) => s + i.total, 0);
        return (
        <div id="kit-result-scroll" style={{ animation: "fadeUp .4s ease" }}>
          <div style={{
            background: "linear-gradient(135deg,#1a0a0a,#981915)",
            borderRadius: 20, padding: "28px 32px", marginBottom: 16, color: "#fff",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, opacity: .6, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Kit selecionado</div>
                <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>{result.nome}</div>
                <div style={{ fontSize: 14, opacity: .7 }}>{result.area} m² · {result.pavs} pav. · Padrão {result.padrao}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, opacity: .6, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Total incluído</div>
                <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: -1 }}>{fmtR(totalAtivo)}</div>
              </div>
            </div>
            {/* toggles de categorias opcionais */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,.15)", paddingTop: 16, display: "flex", flexWrap: "wrap", gap: 10 }}>
              {CATS_OPCIONAIS.map(cat => {
                const sub = result.items.filter(i => i.categoria === cat).reduce((s, i) => s + i.total, 0);
                const ativo = catsAtivas[cat];
                return (
                  <button key={cat} onClick={() => toggleCat(cat)} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                    border: `1px solid ${ativo ? "rgba(255,255,255,.4)" : "rgba(255,255,255,.15)"}`,
                    background: ativo ? "rgba(255,255,255,.15)" : "rgba(0,0,0,.2)",
                    color: ativo ? "#fff" : "rgba(255,255,255,.45)",
                    fontSize: 12, fontWeight: 700, transition: "all .2s",
                  }}>
                    <span style={{ fontSize: 14 }}>{ativo ? "☑" : "☐"}</span>
                    <span>{cat}</span>
                    <span style={{ opacity: .7 }}>{fmtR(sub)}</span>
                  </button>
                );
              })}
            </div>
            {/* breakdown referência */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", marginTop: 14, paddingTop: 14, display: "flex", flexWrap: "wrap", gap: 20 }}>
              <div>
                <div style={{ fontSize: 10, opacity: .5, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Só materiais</div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{fmtR(totalSoMateriais)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, opacity: .5, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>+ Projetos</div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{fmtR(totalComProjetos)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, opacity: .5, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Obra completa</div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{fmtR(totalCompleto)}</div>
              </div>
            </div>
          </div>

          {/* tabela de insumos por categoria */}
          {CATS_ORDEM.map(cat => {
            const itens = result.items.filter(i => i.categoria === cat);
            if (!itens.length) return null;
            const subtotal = itens.reduce((s, i) => s + i.total, 0);
            const ativa = catsAtivas[cat];
            return (
              <div key={cat} style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 12, overflow: "hidden", opacity: ativa ? 1 : 0.35, transition: "opacity .2s" }}>
                <div style={{ background: C.darker, padding: "10px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.text, letterSpacing: .5 }}>{cat}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#981915" }}>{fmtR(subtotal)}{!ativa && <span style={{ marginLeft: 8, fontSize: 10, color: C.muted }}>(excluído)</span>}</span>
                </div>
                {itens.map(i => (
                  <div key={i.nome} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 12, padding: "10px 18px", borderTop: `1px solid ${C.border}`, alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{i.nome}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{i.desc}</div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: C.text }}>{i.qtd} {i.un}</div>
                    <div style={{ textAlign: "right", fontSize: 11, color: C.muted }}>{fmtR(i.preco)}/{i.un}</div>
                    <div style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: "#2e9e5b" }}>{fmtR(i.total)}</div>
                  </div>
                ))}
              </div>
            );
          })}

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => {
              const rows = result.items.map(i => ({ Categoria: i.categoria, Material: i.nome, Un: i.un, Qtd: i.qtd, "Preço Ref": i.preco, Total: i.total }));
              const ws = XLSX.utils.json_to_sheet(rows);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Kit");
              XLSX.writeFile(wb, `kit-${result.id}-${result.area}m2.xlsx`);
            }} style={{ padding: "12px 22px", background: C.darker, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: C.text }}>
              📥 Exportar Excel
            </button>
            <button onClick={() => onEnviarOrcamento(result)} style={{ padding: "12px 28px", background: "linear-gradient(135deg,#981915,#c0392b)", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(152,25,21,.3)" }}>
              📋 Enviar para Orçamento
            </button>
          </div>
        </div>
        );
      })()}
    </div>
  );
}

export default function Calculadora() {
  const setActivePage = useAppStore((s) => s.setActivePage);
  const [modo, setModo] = useState(() =>
    localStorage.getItem("sf_kit_lead") ? "kits" : "steelframe"
  );

  const [listaInsumos, setListaInsumos] = useState(INSUMOS);
  const [carregandoInsumos, setCarregandoInsumos] = useState(true);

  useEffect(() => {
    async function carregarInsumosDoBanco() {
      try {
        const { data, error } = await sb
          .from("insumos_sistema")
          .select("*");

        if (error) throw error;

        if (data && data.length > 0) {
          const insumosDinamicos = INSUMOS.map(ins => {
            const itemBanco = data.find(d => d.nome === ins.nome);
            if (itemBanco) {
              return {
                ...ins,
                preco: Number(itemBanco.preco),
                desc: itemBanco.desc_tecnica || ins.desc
              };
            }
            return ins;
          });
          setListaInsumos(insumosDinamicos);
        }
      } catch (err) {
        console.error("Erro ao carregar insumos do Supabase, usando fallback local:", err);
      } finally {
        setCarregandoInsumos(false);
      }
    }

    carregarInsumosDoBanco();
  }, []);

  const [cubValor,      setCubValor]      = useState(null);
  const [cubCarregando, setCubCarregando] = useState(false);

  async function atualizarCub() {
    setCubCarregando(true);
    try {
      const { data, error } = await sb.functions.invoke("atualizar-cub");
      if (error) throw error;
      if (data?.cub) setCubValor(data.cub);
    } catch (e) {
      alert("Erro ao atualizar CUB: " + (e?.message || String(e)));
    } finally {
      setCubCarregando(false);
    }
  }

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

  // Real-time calculation
  useEffect(() => {
    const a = parseFloat(String(area).replace(",", "."));
    if (!a || a <= 0) { setResultado(null); return; }
    const fatorPadrao = PADROES[padrao].fator;
    const items = listaInsumos.map((ins) => {
      const fator = ins.fund ? 1 : fatorPadrao * pavs;
      const qtd   = Math.ceil(ins.base * a * fator);
      return { ...ins, qtd, total: qtd * ins.preco };
    });
    setResultado({ area: a, pavs, padrao, items });
    setOtimizacao(null);
  }, [area, pavs, padrao, listaInsumos]);

  const [extrasAtivos, setExtrasAtivos] = useState({
    "Projetos e Engenharia": true,
    "Mão de Obra":           true,
  });

  function toggleExtra(cat) {
    setExtrasAtivos(prev => ({ ...prev, [cat]: !prev[cat] }));
  }

  const totalGeral = resultado
    ? resultado.items
        .filter(i => !["Projetos e Engenharia", "Mão de Obra"].includes(i.categoria) || extrasAtivos[i.categoria])
        .reduce((s, i) => s + i.total, 0)
    : 0;

  // Category totals for result panel bars
  const catTotais = resultado
    ? CATS_ORDEM.map(cat => ({
        cat,
        total: resultado.items.filter(i => i.categoria === cat &&
          (!["Projetos e Engenharia","Mão de Obra"].includes(cat) || extrasAtivos[cat])
        ).reduce((s, i) => s + i.total, 0),
      })).filter(x => x.total > 0)
    : [];
  const maxCatTotal = catTotais.length ? Math.max(...catTotais.map(x => x.total)) : 1;

  const CAT_CORES = {
    "Estrutura de Aço":          "#981915",
    "Fechamento":                "#b07a1e",
    "Isolamento":                "#3b6ea5",
    "Fixação":                   "#6d557e",
    "Fundação (Radier)":         "#5c4a2a",
    "Cobertura":                 "#2e6b4a",
    "Esquadrias":                "#2e7a8a",
    "Instalações Elétricas":     "#c05020",
    "Inst. Hidrossanitárias":    "#1a6ea0",
    "Acabamentos":               "#7a5a9a",
    "Projetos e Engenharia":     "#3f7a4b",
    "Mão de Obra":               "#c04030",
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 0 40px" }}>

      {/* ── HERO ── */}
      <div style={{
        background: "linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 40%, #981915 100%)",
        borderRadius: 24, padding: "48px 40px 40px", marginBottom: 32,
        position: "relative", overflow: "hidden",
      }}>
        {/* grade decorativa */}
        <div style={{
          position: "absolute", inset: 0, opacity: .07,
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        {/* círculo brilho */}
        <div style={{
          position: "absolute", right: -60, top: -60,
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,.12) 0%, transparent 70%)",
        }} />

        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.12)", borderRadius: 20, padding: "4px 14px", marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: 1.5, textTransform: "uppercase" }}>✦ Calculadora Profissional</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 12, letterSpacing: -.5 }}>
            Calcule seus materiais<br />
            <span style={{ color: "#ffb3b0" }}>em segundos.</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,.65)", fontSize: 15, maxWidth: 480, lineHeight: 1.6, marginBottom: 28 }}>
            Steel Frame, Parede Drywall, Forro — quantitativos precisos com fator de desperdício configurável e export direto para orçamento.
          </p>
          {/* Stats */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
            {[
              { val: "16+", label: "insumos SF" },
              { val: "3",   label: "tipos de placa" },
              { val: "0%",  label: "erro de cálculo" },
            ].map(({ val, label }) => (
              <div key={label}>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>{val}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
              </div>
            ))}
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#ffb3b0" }}>
                {cubValor ? `R$ ${cubValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: 1 }}>CUB-R1B/m²</div>
            </div>
            <button
              onClick={atualizarCub}
              disabled={cubCarregando}
              style={{
                padding: "7px 14px",
                background: "rgba(255,255,255,.15)",
                border: "1px solid rgba(255,255,255,.3)",
                borderRadius: 8,
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: cubCarregando ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: cubCarregando ? 0.7 : 1,
              }}
            >
              {cubCarregando ? "..." : "🔄 Atualizar CUB"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Seletor de modo — cards grandes ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 32 }}>
        {[
          { key: "kits",        icon: "🏠", title: "Kits de Casa",       sub: "Modelos prontos p/ orçar" },
          { key: "steelframe",  icon: "🏗", title: "Steel Frame",        sub: "Obra completa por m²" },
          { key: "parede",      icon: "🧱", title: "Parede Drywall",     sub: "Placas, perfis e fixação" },
          { key: "forro",       icon: "⬜", title: "Forro Drywall",      sub: "T47, pendurais e placas" },
          { key: "comparativo", icon: "📊", title: "Comparativo",        sub: "ST vs RU vs RF" },
        ].map(({ key, icon, title, sub }) => {
          const active = modo === key;
          return (
            <button key={key} onClick={() => setModo(key)} style={{
              background: active ? "linear-gradient(135deg,#981915,#c0392b)" : "#fff",
              border: `2px solid ${active ? "#981915" : C.border}`,
              borderRadius: 16, padding: "18px 20px", textAlign: "left",
              cursor: "pointer", fontFamily: "inherit", transition: "all .2s",
              boxShadow: active ? "0 8px 24px rgba(152,25,21,.3)" : "0 2px 8px rgba(0,0,0,.05)",
              transform: active ? "translateY(-2px)" : "none",
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: active ? "#fff" : C.text, marginBottom: 2 }}>{title}</div>
              <div style={{ fontSize: 11, color: active ? "rgba(255,255,255,.7)" : C.muted }}>{sub}</div>
            </button>
          );
        })}
      </div>

      {modo === "kits"        && <CalcKits listaInsumos={listaInsumos} onEnviarOrcamento={(res) => {
        const itens = res.items.map(i => ({ grupo: i.grupo, item: i.nome, un: i.un, qtd: i.qtd, precoUnit: i.preco }));
        const totalGeral = res.items.reduce((s, i) => s + i.total, 0);
        localStorage.setItem("sf_estimativo", JSON.stringify({ itens, totalGeral, area: res.area, tipo: res.padrao }));
        setActivePage("orcamentos");
      }} />}
      {modo === "parede"      && <CalcParedeDrywall listaInsumos={listaInsumos} />}
      {modo === "forro"       && <CalcForroDrywall />}
      {modo === "comparativo" && <CalcComparativo />}
      {modo !== "steelframe" && modo !== "parede" && modo !== "forro" && modo !== "comparativo" && modo !== "kits" && null}
      {modo !== "steelframe" ? null : (<>

      {/* ── 2-column layout: Form + Sticky Result ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 16, alignItems: "start" }}>

        {/* ── LEFT: Form panel ── */}
        <div>
          {/* ── Fieldset: Projeto (Área + Pavimentos) ── */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 12 }}>
            <div style={{ padding: "20px 22px", borderBottom: "1px solid var(--line,#efeae2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.1px", color: "var(--muted)", textTransform: "uppercase" }}>Projeto</span>
                <span style={{ fontSize: 11.5, color: "var(--muted)" }}>Dados básicos da edificação</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {/* Área input-wrap */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted,#57514a)", marginBottom: 6 }}>Área construída</label>
                  <div style={{
                    display: "flex", alignItems: "center",
                    background: "var(--surface-2)", border: `1.5px solid ${area ? "var(--red)" : "var(--border)"}`,
                    borderRadius: 10, transition: "border-color .12s",
                  }}>
                    <input type="number" min="10" value={area} onChange={(e) => setArea(e.target.value)} placeholder="120"
                      style={{
                        flex: 1, border: "none", background: "none", outline: "none",
                        fontFamily: "var(--cond,'Barlow Condensed',sans-serif)", fontWeight: 600, fontSize: 19,
                        color: "var(--text)", padding: "10px 0 10px 14px", width: "100%", minWidth: 0,
                      }} />
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--muted)", padding: "0 13px", letterSpacing: ".5px" }}>M²</span>
                  </div>
                </div>
                {/* Pavimentos stepper */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted,#57514a)", marginBottom: 6 }}>Pavimentos</label>
                  <div style={{
                    display: "flex", alignItems: "center",
                    background: "var(--surface-2)", border: "1.5px solid var(--border)",
                    borderRadius: 10, overflow: "hidden",
                  }}>
                    <button type="button" onClick={() => setPavs(Math.max(1, pavs - 1))}
                      style={{ width: 42, height: 42, border: "none", background: "none", color: "var(--text-muted,#57514a)", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>−</button>
                    <div style={{ flex: 1, textAlign: "center", fontFamily: "var(--cond,'Barlow Condensed',sans-serif)", fontWeight: 700, fontSize: 19, color: "var(--text)" }}>{pavs}</div>
                    <button type="button" onClick={() => setPavs(Math.min(4, pavs + 1))}
                      style={{ width: 42, height: 42, border: "none", background: "none", color: "var(--text-muted,#57514a)", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Padrão de acabamento — opt-cards ── */}
            <div style={{ padding: "20px 22px", borderBottom: "1px solid var(--line,#efeae2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.1px", color: "var(--muted)", textTransform: "uppercase" }}>Padrão de acabamento</span>
                <span style={{ fontSize: 11.5, color: "var(--muted)" }}>Valores de referência por m²</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {[
                  { key: "Econômico",   m2: "2.800", ds: "Acabamentos padrão de mercado, esquadrias linha leve" },
                  { key: "Padrão",      m2: "3.500", ds: "Porcelanato, esquadrias linha suprema, louças intermediárias" },
                  { key: "Alto Padrão", m2: "4.800", ds: "Acabamentos premium, automação, esquadrias especiais" },
                ].map(({ key, m2, ds }) => {
                  const sel = padrao === key;
                  return (
                    <button key={key} onClick={() => setPadrao(key)} style={{
                      position: "relative", border: `1.5px solid ${sel ? "var(--red)" : "var(--border)"}`,
                      borderRadius: 12, background: "var(--surface)",
                      padding: "13px 14px 12px", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                      boxShadow: sel ? "0 0 0 3px var(--brick-soft,#f3e7e5)" : "none",
                      transition: "border-color .13s, box-shadow .13s",
                    }}>
                      <div style={{
                        position: "absolute", top: 10, right: 10, width: 17, height: 17, borderRadius: "50%",
                        border: `1.5px solid ${sel ? "var(--red)" : "var(--border)"}`,
                        background: sel ? "var(--red)" : "var(--surface)",
                        display: "grid", placeItems: "center",
                      }}>
                        {sel && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{key}</div>
                      <div style={{ fontFamily: "var(--cond,'Barlow Condensed',sans-serif)", fontWeight: 700, fontSize: 20, color: "var(--text)", marginTop: 6 }}>
                        R$ {m2}<small style={{ fontSize: 11, fontFamily: "inherit", fontWeight: 600, color: "var(--muted)", letterSpacing: ".3px" }}>/m²</small>
                      </div>
                      <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 4, lineHeight: 1.35 }}>{ds}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Itens adicionais — extras ── */}
            <div style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.1px", color: "var(--muted)", textTransform: "uppercase" }}>Itens adicionais</span>
                <span style={{ fontSize: 11.5, color: "var(--muted)" }}>Somados ao valor estimado</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { cat: "Projetos e Engenharia", label: "Projetos (Arq. + Estrutural + Elétrico/Hidro)" },
                  { cat: "Mão de Obra",           label: "Mão de obra (montagem, vedações, cobertura)" },
                ].map(({ cat, label }) => {
                  const ativo = extrasAtivos[cat];
                  const sub   = resultado
                    ? resultado.items.filter(i => i.categoria === cat).reduce((s, i) => s + i.total, 0)
                    : 0;
                  return (
                    <label key={cat} onClick={() => toggleExtra(cat)} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                      border: `1.5px solid ${ativo ? "var(--red)" : "var(--border)"}`,
                      borderRadius: 11, cursor: "pointer", transition: "border-color .13s",
                      background: ativo ? "linear-gradient(0deg,rgba(152,25,21,.025),rgba(152,25,21,.025)),var(--surface)" : "var(--surface)",
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        border: `1.5px solid ${ativo ? "var(--red)" : "var(--border)"}`,
                        background: ativo ? "var(--red)" : "var(--surface)",
                        display: "grid", placeItems: "center",
                      }}>
                        {ativo && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", flex: 1 }}>{label}</span>
                      {sub > 0 && <span style={{ fontFamily: "var(--cond,'Barlow Condensed',sans-serif)", fontWeight: 600, fontSize: 14, color: "var(--muted)", whiteSpace: "nowrap" }}>+ {fmtR(sub)}</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tabelas detalhadas por categoria */}
          {resultado && CATS_ORDEM.map((cat) => {
            const items    = resultado.items.filter((i) => i.categoria === cat);
            const subtotal = items.reduce((s, i) => s + i.total, 0);
            if (!items.length) return null;
            const excluida = ["Projetos e Engenharia","Mão de Obra"].includes(cat) && !extrasAtivos[cat];
            return (
              <div key={cat} style={{
                background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`,
                marginBottom: 10, overflow: "hidden",
                opacity: excluida ? 0.4 : 1, transition: "opacity .2s",
              }}>
                <div style={{
                  padding: "10px 18px", background: "#f8f8f8",
                  borderBottom: `1px solid ${C.border}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: CAT_CORES[cat] || C.red, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.graphite, textTransform: "uppercase" }}>{cat}</span>
                    {excluida && <span style={{ fontSize: 10, color: C.muted, fontStyle: "italic" }}>(excluído)</span>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: excluida ? C.muted : C.graphite }}>{fmtR(subtotal)}</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#fafafa" }}>
                      <th style={{ padding: "8px 18px", textAlign: "left",  fontSize: 10, color: C.muted, fontWeight: 600 }}>Material</th>
                      <th style={{ padding: "8px 10px", textAlign: "right", fontSize: 10, color: C.muted, fontWeight: 600, width: 70 }}>Qtd</th>
                      <th style={{ padding: "8px 10px", textAlign: "left",  fontSize: 10, color: C.muted, fontWeight: 600, width: 45 }}>Un</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, color: C.muted, fontWeight: 600, width: 95 }}>Preço ref.</th>
                      <th style={{ padding: "8px 18px", textAlign: "right", fontSize: 10, color: C.muted, fontWeight: 600, width: 100 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td style={{ padding: "10px 18px", fontWeight: 500 }}>{item.nome}</td>
                        <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 800, color: CAT_CORES[cat] || C.red }}>
                          {item.qtd.toLocaleString("pt-BR")}
                        </td>
                        <td style={{ padding: "10px 10px", color: C.muted }}>{item.un}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", color: C.muted, fontSize: 11 }}>{fmtR(item.preco)}</td>
                        <td style={{ padding: "10px 18px", textAlign: "right", fontWeight: 700 }}>{fmtR(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          <p style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 8 }}>
            ⚠️ Preços de referência — sujeitos à variação regional e de mercado.
          </p>
        </div>

        {/* ── RIGHT: Sticky result panel ── */}
        <div style={{ position: "sticky", top: 20 }}>
          {/* res-hero */}
          <div style={{
            position: "relative", background: "#2b2b2e",
            borderRadius: "12px 12px 0 0", padding: "24px 24px 20px 28px",
            color: "#fff", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
              background: "var(--red, #981915)",
            }} />
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(255,255,255,.45)", marginBottom: 10 }}>
              Investimento estimado
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 44, fontWeight: 700, lineHeight: 1, letterSpacing: -1, marginBottom: 6 }}>
              {resultado ? fmtR(totalGeral) : "—"}
            </div>
            {resultado && resultado.area > 0 && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span>{fmtR(totalGeral / resultado.area)}/m² efetivo</span>
                <span>~{Math.round(resultado.area * 0.055 + resultado.pavs * 2 + 8)} meses</span>
              </div>
            )}
          </div>

          {/* res-body */}
          <div style={{
            background: "#fff", border: `1px solid ${C.border}`, borderTop: "none",
            borderRadius: "0 0 12px 12px", padding: "20px 20px 16px",
          }}>
            {/* 7-phase breakdown */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.muted, marginBottom: 10 }}>
                Composição por etapa
              </div>
              {[
                { label: "Projeto executivo", pct: 5,  color: C.plum },
                { label: "Fundação",          pct: 10, color: C.clay },
                { label: "Estrutura SF",      pct: 28, color: C.red },
                { label: "Fechamentos",       pct: 22, color: C.steel },
                { label: "Instalações",       pct: 15, color: C.ochre },
                { label: "Acabamento",        pct: 17, color: C.sage },
                { label: "Entrega",           pct: 3,  color: C.muted },
              ].map(({ label, pct, color }) => (
                <div key={label} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: C.text, fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color }}>
                      {resultado ? fmtR(totalGeral * pct / 100) : `${pct}%`}
                    </span>
                  </div>
                  <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width .4s ease" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Breakdown summary */}
            {resultado && (
              <div style={{
                background: C.bg, borderRadius: 8, padding: "12px 14px",
                marginBottom: 16, display: "flex", flexDirection: "column", gap: 5,
              }}>
                {[
                  { label: "Só materiais",  cats: CATS_ORDEM.filter(c => !["Projetos e Engenharia","Mão de Obra"].includes(c)) },
                  { label: "+ Projetos",    cats: CATS_ORDEM.filter(c => c !== "Mão de Obra") },
                  { label: "Obra completa", cats: CATS_ORDEM },
                ].map(({ label, cats }) => {
                  const val = resultado.items.filter(i => cats.includes(i.categoria)).reduce((s, i) => s + i.total, 0);
                  return (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{fmtR(val)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CTAs */}
            <button
              onClick={enviarParaOrcamento}
              disabled={!resultado}
              style={{
                width: "100%", padding: "13px 0",
                background: resultado ? "var(--red, #981915)" : C.border,
                border: "none", borderRadius: 8, color: "#fff",
                fontSize: 14, fontWeight: 700, cursor: resultado ? "pointer" : "not-allowed",
                fontFamily: "inherit", marginBottom: 8,
                transition: "background .2s",
              }}>
              Gerar Orçamento →
            </button>

            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button onClick={exportarExcel} disabled={!resultado} style={{
                flex: 1, padding: "9px 0",
                background: C.surface2, border: `1px solid ${C.border}`,
                borderRadius: 8, color: C.text, fontSize: 12, fontWeight: 700,
                cursor: resultado ? "pointer" : "not-allowed", fontFamily: "inherit",
                opacity: resultado ? 1 : .4,
              }}>
                📥 Excel
              </button>
              <button onClick={() => window.print()} disabled={!resultado} style={{
                flex: 1, padding: "9px 0",
                background: C.surface2, border: `1px solid ${C.border}`,
                borderRadius: 8, color: C.text, fontSize: 12, fontWeight: 700,
                cursor: resultado ? "pointer" : "not-allowed", fontFamily: "inherit",
                opacity: resultado ? 1 : .4,
              }}>
                🖨️ Imprimir
              </button>
            </div>

            {/* CUB indicator */}
            <div style={{
              paddingTop: 12, borderTop: `1px solid ${C.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: .5 }}>CUB-R1B/m²</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                  {cubValor ? `R$ ${cubValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                </div>
              </div>
              <button onClick={atualizarCub} disabled={cubCarregando} style={{
                padding: "6px 10px", background: C.surface2,
                border: `1px solid ${C.border}`, borderRadius: 6,
                color: C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", opacity: cubCarregando ? .6 : 1,
              }}>
                {cubCarregando ? "..." : "🔄"}
              </button>
            </div>

            <p style={{ fontSize: 10, color: C.muted, marginTop: 12, marginBottom: 0, lineHeight: 1.5 }}>
              Valores de referência — sujeitos a variação regional e de mercado.
            </p>
          </div>
        </div>
      </div>

      {/* ── Otimizador de Corte (below 2-col layout) ── */}
      {resultado && (<>

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

      <style>{`
        @media print { button { display: none !important; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes countUp { from { opacity:0; } to { opacity:1; } }
      `}</style>
      </>)}
    </div>
  );
}
