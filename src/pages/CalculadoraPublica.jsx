import { useState, useEffect, useRef } from "react";
import { sb } from "../services/supabase";

// ─── Icon component ──────────────────────────────────────────────────────────
function Ic({ p, s = 17 }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: p }}
    />
  );
}

const ICONS = {
  zap:     '<path d="M13 2 3 14h7l-1 8 10-12h-7z"/>',
  grid:    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  home:    '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  layers:  '<path d="M12 2 2 7l10 5 10-5z"/><path d="m2 12 10 5 10-5M2 17l10 5 10-5"/>',
  shield:  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  check:   '<path d="M20 6 9 17l-5-5"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
  arrow:   '<path d="M5 12h14M13 6l6 6-6 6"/>',
  maximize:'<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>',
  bed:     '<path d="M2 9v11M2 13h20v7M22 13v-2a3 3 0 0 0-3-3h-5v5M2 13V8a2 2 0 0 1 2-2h6"/>',
  bath:    '<path d="M4 12V5a2 2 0 0 1 4 0M2 12h20v3a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4zM6 19l-1 2M19 19l-1 2"/>',
};

// ─── Kit data ─────────────────────────────────────────────────────────────────
const INSUMOS_KIT = [
  { categoria: "Estrutura de Aço",      nome: "Montante C 90×40×15×1,25mm",         un: "pç",  base: 1.50,  preco: 18.50 },
  { categoria: "Estrutura de Aço",      nome: "Guia U 92×40×1,25mm",                un: "m",   base: 1.10,  preco: 12.00 },
  { categoria: "Estrutura de Aço",      nome: "Montante C 140×40×15×1,25mm",        un: "pç",  base: 0.30,  preco: 24.00 },
  { categoria: "Fechamento",            nome: "Chapa OSB 11,1mm (1,22×2,44)",       un: "chp", base: 0.38,  preco: 52.00 },
  { categoria: "Fechamento",            nome: "Placa de Gesso ST 13mm (1,20×2,40)", un: "chp", base: 0.85,  preco: 17.00 },
  { categoria: "Fechamento",            nome: "Placa Cimentícia 10mm (1,20×2,40)",  un: "chp", base: 0.18,  preco: 65.00 },
  { categoria: "Isolamento",            nome: "Lã de Vidro 50mm",                   un: "m²",  base: 1.30,  preco: 16.00 },
  { categoria: "Isolamento",            nome: "Impermeabilizante flexível",          un: "m²",  base: 0.15,  preco: 35.00 },
  { categoria: "Fixação",               nome: "Parafuso TEX 4,2×16mm (flangeado)",  un: "cx",  base: 0.40,  preco: 48.00 },
  { categoria: "Fixação",               nome: "Parafuso TEX 4,2×38mm",              un: "cx",  base: 0.80,  preco: 52.00 },
  { categoria: "Fundação (Radier)",     nome: "Concreto C-25",                      un: "m³",  base: 0.10,  preco: 420.0, fund: true },
  { categoria: "Fundação (Radier)",     nome: "Ferragem CA-50 ⌀6,3mm",              un: "kg",  base: 6.00,  preco:  6.50, fund: true },
  { categoria: "Fundação (Radier)",     nome: "Tela soldada Q-92 (3×2m)",           un: "pç",  base: 0.17,  preco: 68.00, fund: true },
  { categoria: "Cobertura",             nome: "Telha shingle (fardo 3m²)",          un: "fd",  base: 0.38,  preco: 185.0 },
  { categoria: "Cobertura",             nome: "Manta subcobertura 1,5m",            un: "m²",  base: 1.05,  preco:  8.50 },
  { categoria: "Cobertura",             nome: "Calha PVC 150mm",                    un: "m",   base: 0.30,  preco: 28.00 },
  { categoria: "Esquadrias",            nome: "Janela alumínio c/ vidro (1,20×1,20)",un:"un",  base: 0.055, preco: 680.0 },
  { categoria: "Esquadrias",            nome: "Porta interna 0,80×2,10",            un: "un",  base: 0.08,  preco: 420.0 },
  { categoria: "Instalações Elétricas", nome: "Conduíte + fios + caixas",           un: "m²",  base: 1.00,  preco: 62.00 },
  { categoria: "Inst. Hidrossanitárias",nome: "Tubulação PVC água fria/quente",     un: "m²",  base: 1.00,  preco: 60.00 },
  { categoria: "Acabamentos",           nome: "Piso vinílico click 4mm",            un: "m²",  base: 0.90,  preco: 58.00 },
  { categoria: "Acabamentos",           nome: "Massa corrida + pintura látex",      un: "m²",  base: 2.80,  preco:  9.50 },
  { categoria: "Acabamentos",           nome: "Forro drywall ST (teto)",            un: "m²",  base: 0.90,  preco: 42.00 },
  { categoria: "Projetos e Engenharia", nome: "Projeto Arquitetônico",              un: "m²",  base: 1.00,  preco: 46.00 },
  { categoria: "Projetos e Engenharia", nome: "Projeto Estrutural LSF",             un: "m²",  base: 1.00,  preco: 14.00 },
  { categoria: "Mão de Obra",           nome: "Montagem estrutura LSF",             un: "m²",  base: 1.00,  preco: 400.00 },
  { categoria: "Mão de Obra",           nome: "Instalação vedações (OSB/gesso/cim)",un: "m²",  base: 1.00,  preco: 200.00 },
  { categoria: "Mão de Obra",           nome: "Cobertura (telha shingle)",          un: "m²",  base: 1.00,  preco: 300.00 },
];

const CATS_ORDEM_KIT = [
  "Estrutura de Aço","Fechamento","Isolamento","Fixação","Fundação (Radier)",
  "Cobertura","Esquadrias","Instalações Elétricas","Inst. Hidrossanitárias",
  "Acabamentos","Projetos e Engenharia","Mão de Obra",
];
const CATS_OPCIONAIS_KIT = ["Projetos e Engenharia", "Mão de Obra"];

const PADROES_KIT = {
  "Econômico":   { fator: 0.85 },
  "Padrão":      { fator: 1.00 },
  "Alto Padrão": { fator: 1.20 },
};

const KITS = [
  { id: "studio",     nome: "Studio Compact",       area: 42,  pavs: 1, padrao: "Padrão",      tag: "MAIS VENDIDO", tagCor: "#3f7a4b", quartos: 1, banheiros: 1, descricao: "Ideal para uso individual, home office ou kitnet. Layout inteligente e construção rápida." },
  { id: "vila",       nome: "Vila 78m²",             area: 78,  pavs: 1, padrao: "Padrão",      tag: "POPULAR",      tagCor: "#3b6ea5", quartos: 2, banheiros: 1, descricao: "Casa térrea completa para família pequena. Conforto e economia em um só projeto." },
  { id: "casa120",    nome: "Casa Serena 120m²",     area: 120, pavs: 1, padrao: "Padrão",      tag: "RECOMENDADO",  tagCor: "#981915", quartos: 3, banheiros: 2, descricao: "O modelo mais completo para família de 4 pessoas. Suíte master, sala ampla e área gourmet." },
  { id: "sobrado160", nome: "Sobrado Vivo 160m²",    area: 160, pavs: 2, padrao: "Padrão",      tag: "2 PAVIMENTOS", tagCor: "#8b5cf6", quartos: 3, banheiros: 3, descricao: "Sobrado moderno com térreo social e pavimento superior privativo." },
  { id: "alto200",    nome: "Residência Alto 200m²", area: 200, pavs: 1, padrao: "Alto Padrão", tag: "ALTO PADRÃO",  tagCor: "#e07020", quartos: 4, banheiros: 3, descricao: "Para quem não abre mão do melhor. Acabamentos superiores e projeto exclusivo." },
  { id: "vigo273",    nome: "Casa Vigo 273m²",       area: 273, pavs: 2, padrao: "Alto Padrão", tag: "PREMIUM",      tagCor: "#a33327", quartos: 4, banheiros: 4, descricao: "Nossa flagship — o lar dos sonhos em Steel Frame. Projeto inspirado em casas europeias." },
];

const fmtR = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

function calcKit(kit) {
  const fator = PADROES_KIT[kit.padrao].fator;
  return INSUMOS_KIT.map((ins) => {
    const f = ins.fund ? 1 : fator * kit.pavs;
    const qtd = Math.ceil(ins.base * kit.area * f);
    return { ...ins, qtd, total: qtd * ins.preco };
  });
}

// Legacy constants kept for handleContact/handleCalculate
const STEEL_FRAME = { "Econômico": 2800, "Padrão": 3500, "Alto Padrão": 5200 };
const ALVENARIA   = { "Econômico": 2200, "Padrão": 2900, "Alto Padrão": 4200 };
const PAVIMENTOS  = { "Térreo": 1, "2 pavimentos": 1.85, "3 pavimentos": 2.65 };
const PRAZOS_SF   = { "Econômico": "4–6 meses", "Padrão": "5–7 meses", "Alto Padrão": "6–9 meses" };

// ─── Simulator constants ──────────────────────────────────────────────────────
const PADROES_SIM = [
  { id: "eco",  nm: "Econômico",   m2: 2800, dot: "#4f7d57" },
  { id: "pad",  nm: "Padrão",      m2: 3500, dot: "#3b6ea5" },
  { id: "alto", nm: "Alto Padrão", m2: 4800, dot: "#c0892d" },
];

function estimateSim(area, padrao, pav) {
  const factor = 1 + (pav - 1) * 0.05;
  const total = area * padrao.m2 * factor;
  const perM2 = total / area;
  const prazo = Math.max(4, Math.round(area / 22) + (pav - 1));
  return { total, perM2, prazo };
}

function applyPhoneMask(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  return value;
}

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target, duration = 420) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = target;
    if (from === to) return;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * ease));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
}

// ─── FAQ data ─────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "Quanto custa construir uma casa em Steel Frame?",
    a: "O custo varia entre R$ 3.000 e R$ 6.000 por m², dependendo do padrão. Uma residência de 120 m² no padrão médio fica em torno de R$ 420.000 a R$ 480.000 completa — estrutura LSF, fechamentos, cobertura, instalações e mão de obra especializada.",
  },
  {
    q: "Steel Frame vs Alvenaria: qual é mais barato?",
    a: "O Steel Frame costuma ter custo de materiais 10 a 20% superior à alvenaria, mas o prazo de obra é até 40% menor — reduzindo custo financeiro. Obras de 120 m² em alvenaria levam 12–18 meses; em Steel Frame, 5–8 meses.",
  },
  {
    q: "O que está incluído no orçamento?",
    a: "Estrutura metálica LSF, painéis OSB/drywall, manta impermeabilizante, fechamentos, cobertura, esquadrias, instalações hidráulicas e elétricas, e mão de obra especializada.",
  },
  {
    q: "Steel Frame é seguro e resistente?",
    a: "Sim. Aço galvanizado com vida útil superior a 50 anos, resistente a ventos fortes e antissísmico. É o sistema mais usado nos EUA, Canadá e Austrália.",
  },
  {
    q: "Posso financiar uma casa em Steel Frame?",
    a: "Sim. Aceito pela Caixa Econômica Federal e principais bancos, incluindo MCMV e crédito imobiliário convencional.",
  },
  {
    q: "Como receber um orçamento personalizado?",
    a: "Preencha o simulador acima. Nossa equipe entra em contato em até 24h com proposta detalhada, sem compromisso.",
  },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function CalculadoraPublica() {
  // White-label
  const [empresaBranding, setEmpresaBranding] = useState(null);
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("e");
    if (!token) return;
    sb.from("empresas")
      .select("nome, logo_url, cor_primaria")
      .eq("calc_token", token)
      .maybeSingle()
      .then(({ data }) => { if (data) setEmpresaBranding(data); });
  }, []);

  // Dynamic insumos
  const [listaInsumos, setListaInsumos] = useState(INSUMOS_KIT);
  useEffect(() => {
    sb.from("insumos_sistema").select("*").then(({ data }) => {
      if (data && data.length > 0) {
        setListaInsumos(INSUMOS_KIT.map(ins => {
          const item = data.find(d => d.nome === ins.nome);
          return item ? { ...ins, preco: Number(item.preco) } : ins;
        }));
      }
    }).catch(() => {});
  }, []);

  function calcKitDinamico(kit) {
    const fator = PADROES_KIT[kit.padrao].fator;
    return listaInsumos.map((ins) => {
      const f = ins.fund ? 1 : fator * kit.pavs;
      const qtd = Math.ceil(ins.base * kit.area * f);
      return { ...ins, qtd, total: qtd * ins.preco };
    });
  }

  // Tab: "simular" | "kits"
  const [tab, setTab] = useState("simular");

  // ── Simulator state ──────────────────────────────────────────────────────
  const [simArea, setSimArea]   = useState(120);
  const [simPad,  setSimPad]    = useState(PADROES_SIM[1]);
  const [simPav,  setSimPav]    = useState(1);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);
  const sliderRef = useRef(null);
  const formRef = useRef(null);

  const est = estimateSim(simArea, simPad, simPav);
  const countUpVal = useCountUp(Math.round(est.total));

  // Close dropdown on outside click
  useEffect(() => {
    function onMouseDown(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // Slider filled track
  function sliderBg(val, min, max) {
    const pct = ((val - min) / (max - min)) * 100;
    return `linear-gradient(to right, #981915 ${pct}%, #e7e1d8 ${pct}%)`;
  }

  function handleSimCTA() {
    if (formRef.current) formRef.current.scrollIntoView({ behavior: "smooth" });
  }

  function resetSim() {
    setSimArea(120);
    setSimPad(PADROES_SIM[1]);
    setSimPav(1);
  }

  // ── Kits state ────────────────────────────────────────────────────────────
  const [kitSel,  setKitSel]  = useState(null);
  const [kitItems, setKitItems] = useState(null);
  const [catsAtivas, setCatsAtivas] = useState(Object.fromEntries(CATS_ORDEM_KIT.map(c => [c, true])));
  const [kitStep, setKitStep] = useState("lista");

  function selecionarKit(kit) {
    setTab("simular");
    setSimArea(kit.area);
    setSimPav(kit.pavs);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── FAQ state ─────────────────────────────────────────────────────────────
  const [faqOpen, setFaqOpen] = useState(0);

  // ── Lead form (pre_orcamentos) ─────────────────────────────────────────────
  const [nome,      setNome]      = useState("");
  const [whatsapp,  setWhatsapp]  = useState("");
  const [cidade,    setCidade]    = useState("");
  const [email,     setEmail]     = useState("");
  const [sending,   setSending]   = useState(false);
  const [sendError, setSendError] = useState("");
  const [formSent,  setFormSent]  = useState(false);

  async function handleFormSubmit(e) {
    e.preventDefault();
    setSendError("");
    setSending(true);
    try {
      const custoInsumosM2Base = listaInsumos.reduce((s, ins) => s + ins.base * ins.preco, 0);
      const sfValorM2 = custoInsumosM2Base * (PADROES_KIT[simPad.nm]?.fator ?? 1);
      const sfValor = simArea * (simPav === 2 ? 1.85 : 1) * sfValorM2;

      const { error } = await sb.rpc("inserir_lead_publico", {
        p_nome:       nome,
        p_contato:    whatsapp,
        p_email:      email || null,
        p_cidade:     cidade || null,
        p_area:       simArea,
        p_padrao:     simPad.nm,
        p_valor_min:  Math.round(est.total),
        p_pavimentos: simPav === 1 ? "Térreo" : "2 pavimentos",
        p_origem:     "CalculadoraPublica-v2",
      });
      if (error) throw error;

      // WhatsApp automático para o lead
      sb.functions.invoke("whatsapp-lead", {
        body: {
          nome, whatsapp,
          area: simArea, padrao: simPad.nm,
          valorSF: Math.round(est.total),
          valorAlv: Math.round(ALVENARIA[simPad.nm] * simArea),
          prazo: `${est.prazo} meses`,
        },
      }).catch(() => {});

      try { window.dataLayer?.push({ event: "lead_gerado", value: Math.round(est.total), currency: "BRL", padrao: simPad.nm, area: simArea, cidade }); } catch (_) {}

      try {
        const msg = `🏠 *Novo lead via Calculadora!*\n\n👤 *${nome}*\n📱 ${whatsapp}\n📍 ${cidade || "—"}\n\n📐 *Projeto:*\n• Área: ${simArea}m² · ${simPav === 1 ? "Térrea" : "Sobrado"}\n• Padrão: ${simPad.nm}\n• Estimativa: ${fmtR(est.total)}\n\nAcesse o sistema: https://stickframe.com.br`;
        const { data: waNum } = await sb.rpc("get_empresa_whatsapp_alertas");
        const numLimpo = (waNum || "").replace(/\D/g, "");
        if (numLimpo) {
          window.open(`https://wa.me/${numLimpo.startsWith("55") ? numLimpo : "55" + numLimpo}?text=${encodeURIComponent(msg)}`, "_blank");
        }
      } catch (_) {}

      setFormSent(true);
    } catch (err) {
      setSendError("Erro ao enviar. Tente novamente.");
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap');
        :root {
          --brick: #981915; --brick-dk: #7d1411; --brick-soft: #f3e7e5;
          --ink: #26231f; --ink-2: #57514a; --muted: #8c847a;
          --line: #e7e1d8; --line-2: #efeae2;
          --bg: #f4f1ec; --surface: #fff; --surface-2: #faf8f4;
          --pos: #3f7a4b;
        }
        .cp-root *, .cp-root *::before, .cp-root *::after { box-sizing: border-box; }
        .cp-root {
          font-family: 'Hanken Grotesk', sans-serif;
          background: var(--bg);
          min-height: 100vh;
          color: var(--ink);
        }
        .bc { font-family: 'Barlow Condensed', sans-serif; }

        /* NAV */
        .cp-nav {
          padding: 26px 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .cp-nav-logo { display: flex; align-items: center; gap: 13px; text-decoration: none; }
        .cp-nav-wordmark { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 28px; letter-spacing: 1.4px; line-height: 1; }
        .cp-nav-wordmark .w-stick { color: var(--ink); }
        .cp-nav-wordmark .w-frame { color: var(--brick); }
        .cp-nav-cta {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--brick); color: #fff;
          border: none; border-radius: 9px; padding: 9px 16px;
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 13px; font-weight: 700; cursor: pointer;
          transition: background .15s;
          position: absolute; right: 28px; top: 50%; transform: translateY(-50%);
        }
        .cp-nav-cta:hover { background: var(--brick-dk); }
        @media (max-width: 560px) {
          .cp-nav { flex-direction: column; gap: 14px; }
          .cp-nav-cta { position: static; transform: none; }
        }

        /* HERO */
        .cp-hero {
          background: radial-gradient(ellipse at 70% 40%, rgba(152,25,21,.07) 0%, transparent 60%), #fff;
          border-bottom: 1px solid var(--line);
          padding: 72px 20px 60px;
          text-align: center;
        }
        .cp-hero-inner { max-width: 760px; margin: 0 auto; }
        .cp-chip {
          display: inline-flex; align-items: center; gap: 5px;
          background: var(--brick-soft); color: var(--brick);
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
          padding: 6px 16px; border-radius: 30px; margin-bottom: 24px;
        }
        .cp-h1 {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: clamp(44px, 6.2vw, 76px);
          line-height: 1.02;
          margin: 0 0 18px;
          color: var(--ink);
        }
        .cp-h1 .red { color: var(--brick); }
        .cp-lede { font-size: 16px; color: var(--ink-2); max-width: 480px; margin: 0 auto 36px; line-height: 1.65; }
        .cp-stats {
          display: grid; grid-template-columns: repeat(3,1fr);
          background: var(--surface); border: 1px solid var(--line);
          border-radius: 16px; overflow: hidden; max-width: 480px; margin: 0 auto;
          box-shadow: 0 2px 8px rgba(0,0,0,.04);
        }
        .cp-stat { padding: 18px 12px; text-align: center; border-right: 1px solid var(--line); }
        .cp-stat:last-child { border-right: none; }
        .cp-stat-val { font-family: 'Barlow Condensed', sans-serif; font-size: 30px; font-weight: 700; color: var(--brick); }
        .cp-stat-lbl { font-size: 11px; color: var(--muted); margin-top: 2px; }

        /* TABS */
        .cp-tabs-wrap { max-width: 1180px; margin: 0 auto; padding: 40px 20px 0; }
        .cp-tabs {
          display: inline-flex; align-items: center; gap: 4px;
          background: var(--brick-soft); border-radius: 14px; padding: 4px;
        }
        .cp-tab-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 18px; border-radius: 11px; border: none; cursor: pointer;
          font-family: 'Hanken Grotesk', sans-serif; font-size: 14px; font-weight: 700;
          transition: background .18s, color .18s;
          background: transparent; color: var(--brick);
        }
        .cp-tab-btn.active { background: var(--brick); color: #fff; }

        /* SIMULATOR SECTION */
        .cp-sim-section { max-width: 1180px; margin: 0 auto; padding: 32px 20px 56px; }
        .cp-sim-grid {
          display: grid; grid-template-columns: 1fr 430px; gap: 40px; align-items: start;
        }
        @media (max-width: 920px) { .cp-sim-grid { grid-template-columns: 1fr; } }

        /* SIM INTRO */
        .cp-sim-eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--brick); margin-bottom: 10px; }
        .cp-sim-h2 {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 36px; font-weight: 700; color: var(--ink);
          margin: 0 0 14px; line-height: 1.08;
        }
        .cp-sim-desc { font-size: 15px; color: var(--ink-2); line-height: 1.65; margin-bottom: 28px; }
        .cp-bullets { display: flex; flex-direction: column; gap: 14px; }
        .cp-bullet { display: flex; align-items: center; gap: 14px; }
        .cp-bullet-icon {
          width: 36px; height: 36px; flex-shrink: 0;
          background: var(--brick-soft); border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          color: var(--brick);
        }
        .cp-bullet-text { font-size: 14px; color: var(--ink-2); font-weight: 500; }

        /* SIM CARD */
        .cp-sim-card {
          background: var(--surface); border-radius: 26px;
          box-shadow: 0 8px 40px rgba(0,0,0,.08);
          padding: 28px;
        }
        .cp-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
        .cp-card-title { font-size: 15px; font-weight: 700; color: var(--ink); margin: 0 0 3px; }
        .cp-card-sub   { font-size: 12px; color: var(--muted); margin: 0; }
        .cp-reset-btn {
          width: 32px; height: 32px; flex-shrink: 0;
          border: 1px solid var(--line); border-radius: 50%;
          background: var(--surface); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--muted); transition: transform .25s, color .15s;
        }
        .cp-reset-btn:hover { transform: rotate(-180deg); color: var(--brick); }

        /* AREA SLIDER */
        .cp-field { margin-bottom: 20px; }
        .cp-field-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: var(--ink-2); margin-bottom: 6px; display: block; }
        .cp-area-val { display: flex; align-items: baseline; gap: 5px; margin-bottom: 10px; }
        .cp-area-num { font-family: 'Barlow Condensed', sans-serif; font-size: 52px; font-weight: 700; color: var(--ink); line-height: 1; }
        .cp-area-unit { font-size: 18px; color: var(--muted); }
        .cp-slider {
          width: 100%; -webkit-appearance: none; appearance: none;
          height: 5px; border-radius: 3px; outline: none; cursor: pointer;
          border: none; margin-bottom: 6px;
        }
        .cp-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 20px; height: 20px; border-radius: 50%;
          background: var(--brick); border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,.2); cursor: pointer;
        }
        .cp-slider::-moz-range-thumb {
          width: 20px; height: 20px; border-radius: 50%;
          background: var(--brick); border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,.2); cursor: pointer;
        }
        .cp-slider-labels { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); }

        /* DROPDOWN */
        .cp-drop { position: relative; margin-bottom: 20px; }
        .cp-drop-trigger {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 12px 14px; border: 1.5px solid var(--line); border-radius: 13px;
          background: var(--surface); cursor: pointer; font-family: inherit;
          transition: border-color .15s;
        }
        .cp-drop-trigger:hover { border-color: var(--brick); }
        .cp-drop-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .cp-drop-nm  { font-size: 14px; font-weight: 600; color: var(--ink); flex: 1; text-align: left; }
        .cp-drop-m2  { font-size: 12px; color: var(--muted); }
        .cp-drop-chev { color: var(--muted); transition: transform .18s; }
        .cp-drop-chev.open { transform: rotate(180deg); }
        .cp-drop-menu {
          position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 50;
          background: var(--surface); border: 1px solid var(--line);
          border-radius: 13px; box-shadow: 0 8px 28px rgba(0,0,0,.1);
          overflow: hidden;
          animation: dropIn .18s ease;
        }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        .cp-drop-opt {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 14px; cursor: pointer; transition: background .12s;
        }
        .cp-drop-opt:hover { background: var(--brick-soft); }
        .cp-drop-opt.sel  { background: var(--brick-soft); }
        .cp-drop-opt-nm   { font-size: 14px; font-weight: 600; color: var(--ink); flex: 1; }
        .cp-drop-opt-m2   { font-size: 12px; color: var(--muted); }
        .cp-drop-check    { color: var(--brick); }

        /* PAV SEGMENTS */
        .cp-pav { display: flex; gap: 8px; margin-bottom: 20px; }
        .cp-pav-btn {
          flex: 1; padding: 10px; border-radius: 10px;
          border: 1.5px solid var(--line); background: var(--surface);
          font-family: inherit; font-size: 13px; font-weight: 600;
          color: var(--ink-2); cursor: pointer; transition: all .15s;
        }
        .cp-pav-btn.active { border-color: var(--brick); background: var(--brick-soft); color: var(--brick); }

        /* RESUMO */
        .cp-resumo {
          background: var(--surface-2); border: 1px solid var(--line);
          border-radius: 13px; display: grid; grid-template-columns: repeat(3,1fr);
          margin-bottom: 20px; overflow: hidden;
        }
        .cp-resumo-col { padding: 12px 10px; text-align: center; border-right: 1px solid var(--line); }
        .cp-resumo-col:last-child { border-right: none; }
        .cp-resumo-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 3px; }
        .cp-resumo-val { font-family: 'Barlow Condensed', sans-serif; font-size: 17px; font-weight: 700; color: var(--ink); }

        /* PRICE */
        .cp-price-block { margin-bottom: 18px; }
        .cp-price-eyebrow { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 4px; }
        .cp-price-row { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
        .cp-price-val { font-family: 'Barlow Condensed', sans-serif; font-size: 42px; font-weight: 700; color: var(--ink); line-height: 1; }
        .cp-price-sub { font-size: 12px; color: var(--muted); }

        /* CTA */
        .cp-cta-btn {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
          background: var(--brick); color: #fff; border: none;
          border-radius: 13px; padding: 16px;
          font-family: 'Hanken Grotesk', sans-serif; font-size: 15px; font-weight: 700;
          cursor: pointer; margin-bottom: 12px;
          box-shadow: 0 8px 22px -10px rgba(152,25,21,.7);
          transition: background .15s, transform .12s;
        }
        .cp-cta-btn:hover { background: var(--brick-dk); transform: translateY(-1px); }
        .cp-trust { display: flex; justify-content: center; gap: 16px; }
        .cp-trust-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--muted); }
        .cp-trust-check { color: var(--pos); }

        /* KITS */
        .cp-kits-section { max-width: 1180px; margin: 0 auto; padding: 32px 20px 56px; }
        .cp-kit-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
        }
        @media (max-width: 920px) { .cp-kit-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 680px) { .cp-kit-grid { grid-template-columns: 1fr; } }
        .cp-kit-card {
          background: var(--surface); border: 1px solid var(--line);
          border-radius: 20px; padding: 22px; position: relative;
          transition: transform .2s, box-shadow .2s;
          cursor: default;
        }
        .cp-kit-card:hover { transform: translateY(-4px); box-shadow: 0 14px 40px rgba(0,0,0,.1); }
        .cp-kit-badge {
          display: inline-block; font-size: 10px; font-weight: 800;
          padding: 3px 9px; border-radius: 20px; color: #fff;
          text-transform: uppercase; letter-spacing: .6px; margin-bottom: 14px;
        }
        .cp-kit-icon {
          width: 48px; height: 48px; background: var(--brick-soft);
          border-radius: 13px; display: flex; align-items: center; justify-content: center;
          color: var(--brick); margin-bottom: 14px;
        }
        .cp-kit-name { font-family: 'Barlow Condensed', sans-serif; font-size: 24px; font-weight: 700; color: var(--ink); margin: 0 0 6px; }
        .cp-kit-desc { font-size: 13px; color: var(--ink-2); line-height: 1.5; margin-bottom: 14px; }
        .cp-kit-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
        .cp-kit-chip {
          display: inline-flex; align-items: center; gap: 4px;
          background: var(--surface-2); border-radius: 8px;
          padding: 4px 8px; font-size: 12px; color: var(--ink-2); font-weight: 600;
        }
        .cp-kit-price-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: var(--muted); margin-bottom: 3px; }
        .cp-kit-price { font-family: 'Barlow Condensed', sans-serif; font-size: 30px; font-weight: 700; color: var(--brick); margin-bottom: 14px; }
        .cp-kit-btn {
          width: 100%; padding: 10px; border-radius: 10px;
          border: 1.5px solid var(--brick); color: var(--brick);
          background: transparent; font-family: 'Hanken Grotesk', sans-serif;
          font-size: 14px; font-weight: 700; cursor: pointer;
          transition: background .15s, color .15s;
        }
        .cp-kit-btn:hover { background: var(--brick); color: #fff; }

        /* FAQ */
        .cp-faq-section { max-width: 1100px; margin: 0 auto; padding: 56px 20px; }
        .cp-faq-head { text-align: center; margin-bottom: 32px; }
        .cp-acc-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
        @media (max-width: 760px) { .cp-acc-cols { grid-template-columns: 1fr; } }
        .cp-acc-col { display: flex; flex-direction: column; gap: 12px; }
        .cp-faq-eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--brick); text-align: center; margin-bottom: 8px; }
        .cp-faq-h2 { font-family: 'Barlow Condensed', sans-serif; font-size: 36px; font-weight: 700; color: var(--ink); text-align: center; margin: 0 0 32px; }
        .cp-faq-item {
          background: var(--surface); border: 1px solid var(--line);
          border-radius: 16px; margin-bottom: 10px; overflow: hidden;
          transition: border-color .2s, box-shadow .2s;
        }
        .cp-faq-item.open { border-color: var(--brick); box-shadow: 0 4px 16px rgba(152,25,21,.1); }
        .cp-faq-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 22px; cursor: pointer; gap: 14px;
        }
        .cp-faq-q { font-family: 'Barlow Condensed', sans-serif; font-size: 21px; font-weight: 700; color: var(--ink); flex: 1; }
        .cp-faq-toggle {
          width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%;
          border: 1px solid var(--line); background: var(--surface);
          display: flex; align-items: center; justify-content: center;
          color: var(--muted); transition: background .18s, color .18s, transform .25s;
        }
        .cp-faq-item.open .cp-faq-toggle { background: var(--brick); color: #fff; border-color: var(--brick); transform: rotate(180deg); }
        .cp-faq-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .28s ease; }
        .cp-faq-item.open .cp-faq-body { grid-template-rows: 1fr; }
        .cp-faq-inner { overflow: hidden; }
        .cp-faq-a { padding: 0 22px 20px; font-size: 14.5px; color: var(--ink-2); line-height: 1.7; }

        /* FORM SECTION */
        .cp-form-section { padding: 56px 20px; background: var(--bg); }
        .cp-form-card {
          max-width: 560px; margin: 0 auto;
          background: var(--surface); border: 1px solid var(--line);
          border-radius: 20px; padding: 32px;
          box-shadow: 0 4px 20px rgba(0,0,0,.05);
        }
        .cp-form-eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--brick); text-align: center; margin-bottom: 8px; }
        .cp-form-h2 { font-family: 'Barlow Condensed', sans-serif; font-size: 30px; font-weight: 700; color: var(--ink); text-align: center; margin: 0 0 6px; }
        .cp-form-sub { font-size: 14px; color: var(--muted); text-align: center; margin: 0 0 24px; }
        .cp-f-label { display: block; font-size: 12px; font-weight: 700; color: var(--ink-2); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
        .cp-f-input {
          width: 100%; border: 1.5px solid var(--line); border-radius: 10px;
          background: var(--surface); color: var(--ink); padding: 12px 14px;
          font-size: 15px; font-family: inherit; outline: none;
          transition: border-color .15s; margin-bottom: 14px;
        }
        .cp-f-input:focus { border-color: var(--brick); }
        .cp-f-submit {
          width: 100%; background: var(--brick); color: #fff;
          border: none; border-radius: 12px; padding: 15px;
          font-size: 16px; font-weight: 800; font-family: inherit;
          cursor: pointer; transition: background .15s, transform .12s;
          box-shadow: 0 6px 22px rgba(152,25,21,.35);
          margin-top: 4px;
        }
        .cp-f-submit:hover { background: var(--brick-dk); transform: translateY(-1px); }
        .cp-f-submit:disabled { background: #ccc; color: #888; cursor: not-allowed; box-shadow: none; }
        .cp-f-error { color: var(--brick); font-size: 13px; margin-bottom: 10px; }
        .cp-success-icon { text-align: center; margin-bottom: 12px; color: var(--pos); }
        .cp-success-title { font-family: 'Barlow Condensed', sans-serif; font-size: 30px; font-weight: 700; text-align: center; color: var(--ink); margin: 0 0 10px; }
        .cp-success-msg { font-size: 15px; color: var(--muted); text-align: center; line-height: 1.65; }

        /* FOOTER */
        /* CTA BAND */
        .cp-cta-wrap { padding: 8px 20px 56px; max-width: 1100px; margin: 0 auto; }
        .cp-cta-band {
          position: relative; overflow: hidden;
          border-radius: 24px; padding: 46px 54px;
          background: #232225; color: #fff;
          display: flex; align-items: center; justify-content: space-between;
          gap: 36px; flex-wrap: wrap;
        }
        .cp-cta-band::before {
          content: ""; position: absolute; inset: 0;
          background: radial-gradient(680px 320px at 88% -20%, rgba(152,25,21,.42), transparent 62%);
          pointer-events: none;
        }
        .cp-cta-band > * { position: relative; z-index: 1; }
        .cp-ct-eyebrow { font-size: 11.5px; font-weight: 800; letter-spacing: 1.4px; text-transform: uppercase; color: #e0726d; }
        .cp-cta-band h2 { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: clamp(30px,3.2vw,42px); line-height: 1.02; margin-top: 10px; max-width: 16em; }
        .cp-cta-band p { font-size: 14.5px; color: rgba(255,255,255,.6); margin-top: 10px; max-width: 30em; line-height: 1.55; }
        .cp-ct-act { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; flex-shrink: 0; }
        .cp-btn-white { background: #fff; color: var(--brick); height: 56px; padding: 0 30px; border-radius: 14px; font-family: 'Hanken Grotesk', sans-serif; font-weight: 700; font-size: 16.5px; display: inline-flex; align-items: center; gap: 10px; border: none; cursor: pointer; transition: .16s; box-shadow: 0 12px 30px -12px rgba(0,0,0,.5); }
        .cp-btn-white:hover { background: #f0ece6; transform: translateY(-1px); }
        .cp-ct-note { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 600; color: rgba(255,255,255,.5); }
        @media (max-width: 680px) { .cp-cta-band { padding: 34px 28px; flex-direction: column; align-items: flex-start; } }

        .cp-footer { padding: 28px 20px; text-align: center; font-size: 12px; color: var(--muted); border-top: 1px solid var(--line); background: var(--surface); }

        /* Misc */
        .cp-divider { height: 1px; background: var(--line); margin: 0; }
      `}</style>

      <div className="cp-root">

        {/* ── NAV ──────────────────────────────────────────────────────────── */}
        <nav className="cp-nav">
          <a className="cp-nav-logo" href="#">
            <img
              src={empresaBranding?.logo_url || "/logo-transparente-122x122.png"}
              alt="Stick Frame"
              width={42}
              height={42}
              style={{ objectFit: "contain" }}
            />
            {!empresaBranding && (
              <span className="cp-nav-wordmark">
                <span className="w-stick">STICK</span><span className="w-frame">FRAME</span>
              </span>
            )}
            {empresaBranding && (
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: 1, color: empresaBranding.cor_primaria || "#981915" }}>
                {empresaBranding.nome}
              </span>
            )}
          </a>
          <button className="cp-nav-cta" onClick={handleSimCTA}>
            <Ic p={ICONS.zap} s={14} /> Simular agora
          </button>
        </nav>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="cp-hero">
          <div className="cp-hero-inner">
            <div className="cp-chip">
              <Ic p={ICONS.zap} s={12} /> Calculadora gratuita
            </div>
            <h1 className="cp-h1">
              Quanto custa sua<br />
              <span className="red">casa em Steel Frame?</span>
            </h1>
            <p className="cp-lede">Simule o custo completo em segundos — materiais, projetos e mão de obra. Sem compromisso.</p>
            <div className="cp-stats">
              <div className="cp-stat">
                <div className="cp-stat-val">6</div>
                <div className="cp-stat-lbl">Modelos prontos</div>
              </div>
              <div className="cp-stat">
                <div className="cp-stat-val">40%</div>
                <div className="cp-stat-lbl">Mais rápido</div>
              </div>
              <div className="cp-stat">
                <div className="cp-stat-val">24h</div>
                <div className="cp-stat-lbl">Retorno garantido</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TABS ─────────────────────────────────────────────────────────── */}
        <div className="cp-tabs-wrap">
          <div className="cp-tabs">
            <button
              className={`cp-tab-btn${tab === "simular" ? " active" : ""}`}
              onClick={() => setTab("simular")}
            >
              <Ic p={ICONS.grid} s={15} /> Simular por m²
            </button>
            <button
              className={`cp-tab-btn${tab === "kits" ? " active" : ""}`}
              onClick={() => setTab("kits")}
            >
              <Ic p={ICONS.home} s={15} /> Kits de Casa
            </button>
          </div>
        </div>

        {/* ── SIMULATOR ────────────────────────────────────────────────────── */}
        {tab === "simular" && (
          <section className="cp-sim-section">
            <div className="cp-sim-grid">
              {/* Left intro */}
              <div className="cp-sim-intro">
                <div className="cp-sim-eyebrow">Simulador inteligente</div>
                <h2 className="cp-sim-h2">Monte sua obra e veja o custo em tempo real</h2>
                <p className="cp-sim-desc">
                  Ajuste a área, o padrão e os pavimentos — o valor é atualizado instantaneamente com base em insumos reais do mercado.
                </p>
                <div className="cp-bullets">
                  <div className="cp-bullet">
                    <div className="cp-bullet-icon"><Ic p={ICONS.zap} s={18} /></div>
                    <span className="cp-bullet-text">Resultado instantâneo, sem compromisso</span>
                  </div>
                  <div className="cp-bullet">
                    <div className="cp-bullet-icon"><Ic p={ICONS.layers} s={18} /></div>
                    <span className="cp-bullet-text">Estrutura, fechamentos, instalações e acabamento</span>
                  </div>
                  <div className="cp-bullet">
                    <div className="cp-bullet-icon"><Ic p={ICONS.shield} s={18} /></div>
                    <span className="cp-bullet-text">Valores médios praticados pela Stick Frame</span>
                  </div>
                </div>
              </div>

              {/* Right card */}
              <div className="cp-sim-card">
                {/* Header */}
                <div className="cp-card-header">
                  <div>
                    <p className="cp-card-title">Sua casa em Steel Frame</p>
                    <p className="cp-card-sub">Estimativa de obra completa</p>
                  </div>
                  <button className="cp-reset-btn" onClick={resetSim} title="Resetar">
                    <Ic p={ICONS.refresh} s={15} />
                  </button>
                </div>

                {/* Area slider */}
                <div className="cp-field">
                  <span className="cp-field-label">Área construída</span>
                  <div className="cp-area-val">
                    <span className="cp-area-num bc">{simArea}</span>
                    <span className="cp-area-unit">m²</span>
                  </div>
                  <input
                    type="range" min={20} max={600} value={simArea}
                    className="cp-slider"
                    style={{ background: sliderBg(simArea, 20, 600) }}
                    onChange={e => setSimArea(Number(e.target.value))}
                  />
                  <div className="cp-slider-labels"><span>20 m²</span><span>600 m²</span></div>
                </div>

                {/* Padrão dropdown */}
                <div className="cp-field">
                  <span className="cp-field-label">Padrão de acabamento</span>
                  <div className="cp-drop" ref={dropRef}>
                    <button
                      className="cp-drop-trigger"
                      type="button"
                      onClick={() => setDropOpen(o => !o)}
                    >
                      <span className="cp-drop-dot" style={{ background: simPad.dot }} />
                      <span className="cp-drop-nm">{simPad.nm}</span>
                      <span className="cp-drop-m2">R$ {simPad.m2.toLocaleString("pt-BR")}/m²</span>
                      <span className={`cp-drop-chev${dropOpen ? " open" : ""}`}>
                        <Ic p={ICONS.chevron} s={16} />
                      </span>
                    </button>
                    {dropOpen && (
                      <div className="cp-drop-menu">
                        {PADROES_SIM.map(p => (
                          <div
                            key={p.id}
                            className={`cp-drop-opt${p.id === simPad.id ? " sel" : ""}`}
                            onClick={() => { setSimPad(p); setDropOpen(false); }}
                          >
                            <span className="cp-drop-dot" style={{ background: p.dot, width: 9, height: 9, borderRadius: "50%", flexShrink: 0 }} />
                            <span className="cp-drop-opt-nm">{p.nm}</span>
                            <span className="cp-drop-opt-m2">R$ {p.m2.toLocaleString("pt-BR")}/m²</span>
                            {p.id === simPad.id && (
                              <span className="cp-drop-check"><Ic p={ICONS.check} s={15} /></span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pavimentos */}
                <div className="cp-field">
                  <span className="cp-field-label">Pavimentos</span>
                  <div className="cp-pav">
                    <button
                      className={`cp-pav-btn${simPav === 1 ? " active" : ""}`}
                      onClick={() => setSimPav(1)}
                    >
                      1 Térrea
                    </button>
                    <button
                      className={`cp-pav-btn${simPav === 2 ? " active" : ""}`}
                      onClick={() => setSimPav(2)}
                    >
                      2 Sobrado
                    </button>
                  </div>
                </div>

                {/* Resumo */}
                <div className="cp-resumo">
                  <div className="cp-resumo-col">
                    <div className="cp-resumo-label">Por m²</div>
                    <div className="cp-resumo-val bc">{fmtR(est.perM2)}</div>
                  </div>
                  <div className="cp-resumo-col">
                    <div className="cp-resumo-label">Prazo</div>
                    <div className="cp-resumo-val bc">{est.prazo} meses</div>
                  </div>
                  <div className="cp-resumo-col">
                    <div className="cp-resumo-label">Proposta</div>
                    <div className="cp-resumo-val bc">24h</div>
                  </div>
                </div>

                {/* Price */}
                <div className="cp-price-block">
                  <div className="cp-price-eyebrow">Investimento estimado</div>
                  <div className="cp-price-row">
                    <span className="cp-price-val bc">
                      {fmtR(countUpVal)}
                    </span>
                    <span className="cp-price-sub">{simArea} m² / {simPad.nm}</span>
                  </div>
                </div>

                {/* CTA */}
                <button className="cp-cta-btn" onClick={handleSimCTA}>
                  Ver estimativa completa <Ic p={ICONS.arrow} s={16} />
                </button>

                {/* Trust */}
                <div className="cp-trust">
                  <span className="cp-trust-item">
                    <span className="cp-trust-check"><Ic p={ICONS.check} s={13} /></span> Resultado na hora
                  </span>
                  <span className="cp-trust-item">
                    <span className="cp-trust-check"><Ic p={ICONS.check} s={13} /></span> Dados protegidos
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── KITS ─────────────────────────────────────────────────────────── */}
        {tab === "kits" && (
          <section className="cp-kits-section">
            <div className="cp-kit-grid">
              {KITS.map(kit => {
                const items = calcKitDinamico(kit);
                const totalMat = items
                  .filter(i => !["Projetos e Engenharia", "Mão de Obra"].includes(i.categoria))
                  .reduce((s, i) => s + i.total, 0);
                return (
                  <div key={kit.id} className="cp-kit-card">
                    <div className="cp-kit-badge" style={{ background: kit.tagCor }}>{kit.tag}</div>
                    <div className="cp-kit-icon"><Ic p={ICONS.home} s={24} /></div>
                    <h3 className="cp-kit-name">{kit.nome}</h3>
                    <p className="cp-kit-desc">{kit.descricao}</p>
                    <div className="cp-kit-chips">
                      <span className="cp-kit-chip">
                        <Ic p={ICONS.maximize} s={12} /> {kit.area} m²
                      </span>
                      <span className="cp-kit-chip">
                        <Ic p={ICONS.bed} s={12} /> {kit.quartos} qts
                      </span>
                      <span className="cp-kit-chip">
                        <Ic p={ICONS.bath} s={12} /> {kit.banheiros} ban
                      </span>
                      <span className="cp-kit-chip">
                        <Ic p={ICONS.layers} s={12} /> {kit.pavs} pav.
                      </span>
                    </div>
                    <div className="cp-kit-price-label">Materiais a partir de</div>
                    <div className="cp-kit-price">{fmtR(totalMat)}</div>
                    <button className="cp-kit-btn" onClick={() => selecionarKit(kit)}>
                      Calcular →
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="cp-divider" />

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section className="cp-faq-section">
          <div className="cp-faq-head">
            <div className="cp-faq-eyebrow">Tire suas dúvidas</div>
            <h2 className="cp-faq-h2">Perguntas frequentes sobre Steel Frame</h2>
          </div>
          <div className="cp-acc-cols">
            {[[0,1,2],[3,4,5]].map((col, ci) => (
              <div className="cp-acc-col" key={ci}>
                {col.map((i) => {
                  const item = FAQ_ITEMS[i];
                  return (
                    <div key={i} className={`cp-faq-item${faqOpen === i ? " open" : ""}`}>
                      <div className="cp-faq-header" onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}>
                        <span className="cp-faq-q">{item.q}</span>
                        <span className="cp-faq-toggle">
                          <Ic p={ICONS.chevron} s={16} />
                        </span>
                      </div>
                      <div className="cp-faq-body">
                        <div className="cp-faq-inner">
                          <p className="cp-faq-a">{item.a}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <div className="cp-divider" />

        {/* ── PRÉ-ORÇAMENTO FORM ────────────────────────────────────────────── */}
        <section className="cp-form-section" ref={formRef}>
          <div className="cp-form-card">
            {formSent ? (
              <>
                <div className="cp-success-icon"><Ic p={ICONS.check} s={48} /></div>
                <h3 className="cp-success-title">Recebemos seu contato!</h3>
                <p className="cp-success-msg">
                  Nossa equipe vai entrar em contato em até 24h pelo WhatsApp <strong>{whatsapp}</strong> com a proposta personalizada.
                </p>
              </>
            ) : (
              <>
                <div className="cp-form-eyebrow">Pré-orçamento gratuito</div>
                <h2 className="cp-form-h2">Receba sua estimativa completa</h2>
                <p className="cp-form-sub">Nossa equipe retorna em até 24h com proposta detalhada, sem compromisso.</p>
                <form onSubmit={handleFormSubmit}>
                  <label className="cp-f-label">Nome completo</label>
                  <input
                    className="cp-f-input" type="text" placeholder="Seu nome"
                    value={nome} onChange={e => setNome(e.target.value)} required
                  />
                  <label className="cp-f-label">WhatsApp</label>
                  <input
                    className="cp-f-input" type="tel" placeholder="(11) 99999-9999"
                    value={whatsapp} onChange={e => setWhatsapp(applyPhoneMask(e.target.value))} required
                  />
                  <label className="cp-f-label">Cidade</label>
                  <input
                    className="cp-f-input" type="text" placeholder="Ex: São Paulo – SP"
                    value={cidade} onChange={e => setCidade(e.target.value)}
                  />
                  <label className="cp-f-label">
                    E-mail <span style={{ color: "#888", fontWeight: 400, textTransform: "none", fontSize: 12 }}>(opcional)</span>
                  </label>
                  <input
                    className="cp-f-input" type="email" placeholder="seu@email.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                  />
                  {sendError && <p className="cp-f-error">{sendError}</p>}
                  <button className="cp-f-submit" type="submit" disabled={sending}>
                    {sending ? "Enviando..." : "Solicitar orçamento grátis →"}
                  </button>
                </form>
              </>
            )}
          </div>
        </section>

        {/* ── BANDA CTA ────────────────────────────────────────────────────── */}
        <div className="cp-cta-wrap">
          <div className="cp-cta-band">
            <div>
              <span className="cp-ct-eyebrow">Comece agora · grátis</span>
              <h2>Pronto para descobrir o custo da sua casa?</h2>
              <p>Simule em segundos e receba uma proposta detalhada da nossa equipe em até 24h. Sem cartão, sem compromisso.</p>
            </div>
            <div className="cp-ct-act">
              <button className="cp-btn-white" onClick={handleSimCTA}>
                <Ic p={ICONS.zap} s={18} /> Simular agora
              </button>
              <span className="cp-ct-note">
                <Ic p={ICONS.check} s={14} /> Retorno garantido em 24h
              </span>
            </div>
          </div>
        </div>

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <footer className="cp-footer">
          © 2026 Stick Frame Sistemas Construtivos · Santo André/SP · Política de privacidade
        </footer>

      </div>
    </>
  );
}
