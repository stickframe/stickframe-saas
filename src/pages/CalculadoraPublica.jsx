import { useState, useEffect } from "react";
import { CheckCircle, Zap } from "../components/ui/Icon";
import { sb } from "../services/supabase";

// ─── Kit data (shared with internal Calculadora) ─────────────────────────────
const INSUMOS_KIT = [
  { categoria: "Estrutura de Aço",      nome: "Montante C 90×40×15×1,25mm",         un: "pç",  base: 1.50,  preco: 18.50 },
  { categoria: "Estrutura de Aço",      nome: "Guia U 92×40×1,25mm",                un: "m",   base: 1.10,  preco: 12.00 },
  { categoria: "Estrutura de Aço",      nome: "Montante C 140×40×15×1,25mm",        un: "pç",  base: 0.30,  preco: 24.00 },
  { categoria: "Fechamento",            nome: "Chapa OSB 11,1mm (1,22×2,44)",       un: "chp", base: 0.38,  preco: 52.00 },
  { categoria: "Fechamento",            nome: "Placa de Gesso ST 13mm (1,20×2,40)", un: "chp", base: 0.85,  preco: 17.00 },
  { categoria: "Fechamento",            nome: "Placa Cimentícia 10mm (1,20×2,40)",  un: "chp", base: 0.18,  preco: 65.00 },
  { categoria: "Isolamento",            nome: "Lã de Vidro 50mm",                   un: "m²",  base: 1.30,  preco: 16.00 },
  { categoria: "Isolamento",            nome: "Impermeabilizante flexível",         un: "m²",  base: 0.15,  preco: 35.00 },
  { categoria: "Fixação",               nome: "Parafuso TEX 4,2×16mm (flangeado)",  un: "cx",  base: 0.40,  preco: 48.00 },
  { categoria: "Fixação",               nome: "Parafuso TEX 4,2×38mm",              un: "cx",  base: 0.80,  preco: 52.00 },
  { categoria: "Fundação (Radier)",     nome: "Concreto C-25",                      un: "m³",  base: 0.10,  preco: 420.0, fund: true },
  { categoria: "Fundação (Radier)",     nome: "Ferragem CA-50 ⌀6,3mm",              un: "kg",  base: 6.00,  preco:  6.50, fund: true },
  { categoria: "Fundação (Radier)",     nome: "Tela soldada Q-92 (3×2m)",           un: "pç",  base: 0.17,  preco: 68.00, fund: true },
  { categoria: "Cobertura",             nome: "Telha shingle (fardo 3m²)",          un: "fd",  base: 0.38,  preco: 185.0 },
  { categoria: "Cobertura",             nome: "Manta subcobertura 1,5m",            un: "m²",  base: 1.05,  preco:  8.50 },
  { categoria: "Cobertura",             nome: "Calha PVC 150mm",                    un: "m",   base: 0.30,  preco: 28.00 },
  { categoria: "Esquadrias",            nome: "Janela alumínio c/ vidro (1,20×1,20)", un: "un", base: 0.055, preco: 680.0 },
  { categoria: "Esquadrias",            nome: "Porta interna 0,80×2,10",            un: "un",  base: 0.08,  preco: 420.0 },
  { categoria: "Instalações Elétricas", nome: "Conduíte + fios + caixas",           un: "m²",  base: 1.00,  preco: 62.00 },
  { categoria: "Inst. Hidrossanitárias",nome: "Tubulação PVC água fria/quente",     un: "m²",  base: 1.00,  preco: 60.00 },
  { categoria: "Acabamentos",           nome: "Piso vinílico click 4mm",            un: "m²",  base: 0.90,  preco: 58.00 },
  { categoria: "Acabamentos",           nome: "Massa corrida + pintura látex",      un: "m²",  base: 2.80,  preco:  9.50 },
  { categoria: "Acabamentos",           nome: "Forro drywall ST (teto)",            un: "m²",  base: 0.90,  preco: 42.00 },
  { categoria: "Projetos e Engenharia", nome: "Projeto Arquitetônico",              un: "m²",  base: 1.00,  preco: 46.00 },
  { categoria: "Projetos e Engenharia", nome: "Projeto Estrutural LSF",             un: "m²",  base: 1.00,  preco: 14.00 },
  { categoria: "Mão de Obra",           nome: "Montagem estrutura LSF",             un: "m²",  base: 1.00,  preco: 400.00 },
  { categoria: "Mão de Obra",           nome: "Instalação vedações (OSB/gesso/cim)", un: "m²", base: 1.00,  preco: 200.00 },
  { categoria: "Mão de Obra",           nome: "Cobertura (telha shingle)",          un: "m²",  base: 1.00,  preco: 300.00 },
];

const CATS_ORDEM_KIT = [
  "Estrutura de Aço","Fechamento","Isolamento","Fixação","Fundação (Radier)",
  "Cobertura","Esquadrias","Instalações Elétricas","Inst. Hidrossanitárias",
  "Acabamentos","Projetos e Engenharia","Mão de Obra",
];
const CATS_OPCIONAIS_KIT = ["Projetos e Engenharia", "Mão de Obra"];

const PADROES_KIT = { "Econômico": { fator: 0.85 }, "Padrão": { fator: 1.00 }, "Alto Padrão": { fator: 1.20 } };

const KITS = [
  { id: "studio",    nome: "Studio Compact",       area: 42,  pavs: 1, padrao: "Padrão",      tag: "MAIS VENDIDO",  tagCor: "#2e9e5b", emoji: "🏠", quartos: 1, banheiros: 1, descricao: "Ideal para uso individual, home office ou kitnet. Layout inteligente e construção rápida.", destaques: ["Entrega em 45 dias","Kit completo estrutural","Perfeito para kitnet"] },
  { id: "vila",      nome: "Vila 78m²",             area: 78,  pavs: 1, padrao: "Padrão",      tag: "POPULAR",       tagCor: "#4a9eff", emoji: "🏡", quartos: 2, banheiros: 1, descricao: "Casa térrea completa para família pequena. Conforto e economia em um só projeto.", destaques: ["2 quartos confortáveis","Varanda integrada","Custo-benefício ótimo"] },
  { id: "casa120",   nome: "Casa Serena 120m²",     area: 120, pavs: 1, padrao: "Padrão",      tag: "RECOMENDADO",   tagCor: "#981915", emoji: "🏘", quartos: 3, banheiros: 2, descricao: "O modelo mais completo para família de 4 pessoas. Suíte master, sala ampla e área gourmet.", destaques: ["Suíte master com closet","Área gourmet","Sala de TV + jantar"] },
  { id: "sobrado160",nome: "Sobrado Vivo 160m²",    area: 160, pavs: 2, padrao: "Padrão",      tag: "2 PAVIMENTOS",  tagCor: "#8b5cf6", emoji: "🏗", quartos: 3, banheiros: 3, descricao: "Sobrado moderno com térreo social e pavimento superior privativo.", destaques: ["Térreo social separado","3 suítes no andar","Sacada com guarda-corpo"] },
  { id: "alto200",   nome: "Residência Alto 200m²", area: 200, pavs: 1, padrao: "Alto Padrão", tag: "ALTO PADRÃO",   tagCor: "#e07020", emoji: "🏛", quartos: 4, banheiros: 3, descricao: "Para quem não abre mão do melhor. Acabamentos superiores e projeto exclusivo.", destaques: ["4 suítes amplas","Home theater","Piscina prevista"] },
  { id: "vigo273",   nome: "Casa Vigo 273m²",       area: 273, pavs: 2, padrao: "Alto Padrão", tag: "PREMIUM",       tagCor: "#c0392b", emoji: "🏰", quartos: 4, banheiros: 4, descricao: "Nossa flagship — o lar dos sonhos em Steel Frame. Projeto inspirado em casas europeias.", destaques: ["Estilo europeu moderno","Pé-direito duplo na sala","Área total de lazer"] },
];

const fmtR = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

function calcKit(kit) {
  const fator = PADROES_KIT[kit.padrao].fator;
  return INSUMOS_KIT.map((ins) => {
    const f = ins.fund ? 1 : fator * kit.pavs;
    const qtd = Math.ceil(ins.base * kit.area * f);
    return { ...ins, qtd, total: qtd * ins.preco };
  });
}

// Pricing constants
const STEEL_FRAME = { "Econômico": 2800, "Padrão": 3500, "Alto Padrão": 5200 };
const ALVENARIA   = { "Econômico": 2200, "Padrão": 2900, "Alto Padrão": 4200 };
const PAVIMENTOS  = { "Térreo": 1, "2 pavimentos": 1.85, "3 pavimentos": 2.65 };

const PRAZOS_SF = { "Econômico": "4–6 meses", "Padrão": "5–7 meses", "Alto Padrão": "6–9 meses" };

const PADROES = [
  {
    key: "Econômico",
    title: "Econômico",
    desc: "Acabamentos básicos, funcional e acessível",
  },
  {
    key: "Padrão",
    title: "Padrão",
    desc: "Bom acabamento, equilíbrio custo-benefício",
  },
  {
    key: "Alto Padrão",
    title: "Alto Padrão",
    desc: "Acabamentos premium, materiais superiores",
  },
];

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function applyPhoneMask(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  return value;
}

export default function CalculadoraPublica() {
  // White-label branding
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

  const [listaInsumos, setListaInsumos] = useState(INSUMOS_KIT);
  const [carregandoInsumos, setCarregandoInsumos] = useState(true);

  useEffect(() => {
    async function carregarInsumosPublicos() {
      try {
        const { data, error } = await sb
          .from("insumos_sistema")
          .select("*");

        if (error) throw error;

        if (data && data.length > 0) {
          const insumosMesclados = INSUMOS_KIT.map(ins => {
            const itemBanco = data.find(d => d.nome === ins.nome);
            return itemBanco ? { ...ins, preco: Number(itemBanco.preco) } : ins;
          });
          setListaInsumos(insumosMesclados);
        }
      } catch (err) {
        console.error("Erro ao carregar insumos públicos, usando fallback:", err);
      } finally {
        setCarregandoInsumos(false);
      }
    }

    carregarInsumosPublicos();
  }, []);

  function calcKitDinamico(kit) {
    const fator = PADROES_KIT[kit.padrao].fator;
    return listaInsumos.map((ins) => {
      const f = ins.fund ? 1 : fator * kit.pavs;
      const qtd = Math.ceil(ins.base * kit.area * f);
      return { ...ins, qtd, total: qtd * ins.preco };
    });
  }

  // "metro" | "kits"
  const [modo, setModo] = useState("metro");

  // Kit states
  const [kitSel, setKitSel] = useState(null);
  const [kitItems, setKitItems] = useState(null);
  const [catsAtivas, setCatsAtivas] = useState(Object.fromEntries(CATS_ORDEM_KIT.map(c => [c, true])));
  const [kitStep, setKitStep] = useState("lista"); // "lista" | "result" | "contact" | "success"

  function selecionarKit(kit) {
    setKitSel(kit);
    setKitItems(calcKitDinamico(kit));
    setCatsAtivas(Object.fromEntries(CATS_ORDEM_KIT.map(c => [c, true])));
    setKitStep("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function toggleCatKit(cat) { setCatsAtivas(prev => ({ ...prev, [cat]: !prev[cat] })); }

  const totalAtivo = kitItems ? kitItems.filter(i => catsAtivas[i.categoria]).reduce((s, i) => s + i.total, 0) : 0;
  const totalSoMateriais = kitItems ? kitItems.filter(i => !CATS_OPCIONAIS_KIT.includes(i.categoria)).reduce((s, i) => s + i.total, 0) : 0;
  const totalCompleto = kitItems ? kitItems.reduce((s, i) => s + i.total, 0) : 0;
  const totalComProjetos = kitItems ? kitItems.filter(i => i.categoria !== "Mão de Obra").reduce((s, i) => s + i.total, 0) : 0;

  // Step: "form" | "result" | "success"
  const [step, setStep] = useState("form");

  // Form values
  const [area, setArea] = useState(120);
  const [pavimentos, setPavimentos] = useState("Térreo");
  const [padrao, setPadrao] = useState("Padrão");
  const [cidade, setCidade] = useState("");

  // Results
  const [sfMin, setSfMin] = useState(0);
  const [sfMax, setSfMax] = useState(0);
  const [alMin, setAlMin] = useState(0);
  const [alMax, setAlMax] = useState(0);
  const [sfMidValue, setSfMidValue] = useState(0);

  // Contact (shared for both flows)
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  async function handleKitContact(e) {
    e.preventDefault();
    setSendError(""); setSending(true);
    try {
      const { error } = await sb.rpc("captar_lead_publico", {
        p_nome: nome, p_contato: whatsapp, p_email: email || null,
        p_cidade: null, p_area: kitSel.area, p_padrao: kitSel.padrao,
        p_valor_estimado: Math.round(totalAtivo),
        p_origem: `Kit-${kitSel.id}`,
        p_pavimentos: `${kitSel.pavs} pav.`,
        p_valor_min: Math.round(totalSoMateriais),
        p_valor_max: Math.round(totalCompleto),
      });
      if (error) throw error;
      try {
        const { data: waNum } = await sb.rpc("get_empresa_whatsapp_alertas");
        const numLimpo = (waNum || "").replace(/\D/g, "");
        if (numLimpo) {
          const msg = `🏠 *Novo lead — Kit ${kitSel.nome}*\n\n👤 *${nome}*\n📱 ${whatsapp}\n\n💰 Estimativa: ${fmtR(totalAtivo)}\n🏗 ${kitSel.area}m² · ${kitSel.pavs} pav. · ${kitSel.padrao}\n\nAcesse: https://stickframe.com.br`;
          window.open(`https://wa.me/${numLimpo.startsWith("55") ? numLimpo : "55" + numLimpo}?text=${encodeURIComponent(msg)}`, "_blank");
        }
      } catch (_) {}
      setKitStep("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSendError("Erro ao enviar. Tente novamente.");
    } finally { setSending(false); }
  }

  function handleCalculate(e) {
    e.preventDefault();

    const custoInsumosM2Base = listaInsumos.reduce((s, ins) => s + (ins.base * ins.preco), 0);
    const fatorPadrao = PADROES_KIT[padrao].fator;
    const sfValorM2 = custoInsumosM2Base * fatorPadrao;
    const alValorM2 = sfValorM2 * 0.82;

    const areaTotal = area * PAVIMENTOS[pavimentos];
    const sfValor = areaTotal * sfValorM2;
    const alValor = areaTotal * alValorM2;

    setSfMin(Math.round(sfValor * 0.92));
    setSfMax(Math.round(sfValor * 1.12));
    setAlMin(Math.round(alValor * 0.92));
    setAlMax(Math.round(alValor * 1.12));
    setSfMidValue(Math.round(sfValor));
    setStep("result");
    window.scrollTo({ top: 0, behavior: "smooth" });

    try { window.dataLayer?.push({ event: "view_simulacao", value: Math.round(sfValor), padrao, area }); } catch (_) {}
  }

  async function handleContact(e) {
    e.preventDefault();
    setSendError("");
    setSending(true);
    try {
      const custoInsumosM2Base = listaInsumos.reduce((s, ins) => s + (ins.base * ins.preco), 0);
      const sfValorM2 = custoInsumosM2Base * PADROES_KIT[padrao].fator;

      const sfValor = area * PAVIMENTOS[pavimentos] * sfValorM2;
      const { error } = await sb.rpc("captar_lead_publico", {
        p_nome: nome,
        p_contato: whatsapp,
        p_email: email || null,
        p_cidade: cidade || null,
        p_area: area,
        p_padrao: padrao,
        p_valor_estimado: sfMidValue,
        p_origem: "Calculadora",
        p_pavimentos: pavimentos,
        p_valor_min: Math.round(sfValor * 0.92),
        p_valor_max: Math.round(sfValor * 1.12),
      });
      if (error) throw error;

      // Email de confirmação para o lead
      if (email) {
        import("../services/emailService").then(({ emailNovoLead }) => {
          emailNovoLead({
            email,
            nome,
            padrao,
            area,
            valorMin: Math.round(sfValor * 0.92),
            valorMax: Math.round(sfValor * 1.12),
            cidade,
          }).catch(() => {});
        });
      }

      // WhatsApp automático para o LEAD com resultado da simulação
      sb.functions.invoke("whatsapp-lead", {
        body: {
          nome, whatsapp,
          area, padrao,
          valorSF:  Math.round(sfValor),
          valorAlv: Math.round(ALVENARIA[padrao] * area),
          prazo:    PRAZOS_SF[padrao] || "5–8 meses",
        },
      }).catch(() => {});

      // Tracking via GTM dataLayer — configure as tags no painel GTM
      try { window.dataLayer?.push({ event: "lead_gerado", value: Math.round(sfValor), currency: "BRL", padrao, area, cidade }); } catch (_) {}

      // Open WhatsApp notification to empresa owner
      try {
        const msg = `🔔 *Novo lead via Calculadora!*\n\n👤 *${nome}*\n📱 ${whatsapp}\n📍 ${cidade || "—"}\n\n🏗 *Projeto:*\n• Área: ${area}m² · ${pavimentos}\n• Padrão: ${padrao}\n• Estimativa: R$ ${Math.round(sfValor * 0.92).toLocaleString("pt-BR")} – R$ ${Math.round(sfValor * 1.12).toLocaleString("pt-BR")}\n\nAcesse o sistema para responder: https://stickframe.com.br`;
        const { data: waNum } = await sb.rpc("get_empresa_whatsapp_alertas");
        const numLimpo = (waNum || "").replace(/\D/g, "");
        if (numLimpo) {
          window.open(`https://wa.me/${numLimpo.startsWith("55") ? numLimpo : "55" + numLimpo}?text=${encodeURIComponent(msg)}`, "_blank");
        }
      } catch (_) { /* WhatsApp notification is non-critical */ }

      setStep("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSendError("Erro ao enviar. Tente novamente.");
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  function handleReset() {
    setArea(120);
    setPavimentos("Térreo");
    setPadrao("Padrão");
    setCidade("");
    setNome("");
    setWhatsapp("");
    setSendError("");
    setStep("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Speedup comparison
  const alMid = (alMin + alMax) / 2;
  const sfMid = (sfMin + sfMax) / 2;
  const speedPct = alMid > 0 ? Math.round(((alMid - sfMid) / alMid) * 100) : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Hanken+Grotesk:wght@400;500;600;700;800;900&display=swap');
        .calc-root *, .calc-root *::before, .calc-root *::after { box-sizing: border-box; }
        .calc-root {
          font-family: 'Hanken Grotesk', sans-serif;
          background: #f4f1ec;
          min-height: 100vh;
          color: #26231f;
        }
        .calc-body {
          max-width: 560px;
          margin: 0 auto;
          padding: 24px 16px 64px;
        }
        .calc-card {
          background: #ffffff;
          border: 1px solid #e7e1d8;
          border-radius: 14px;
          padding: 24px;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .calc-title {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 4px;
          color: #26231f;
        }
        .calc-subtitle {
          font-size: 14px;
          color: #8c847a;
          margin: 0 0 24px;
        }
        .calc-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 6px;
          color: #5c5750;
        }
        .calc-input {
          width: 100%;
          border: 1.5px solid #e7e1d8;
          border-radius: 8px;
          background: #ffffff;
          color: #26231f;
          padding: 10px 12px;
          font-size: 15px;
          font-family: inherit;
          outline: none;
          transition: border-color .15s;
          margin-bottom: 16px;
        }
        .calc-input:focus { border-color: #981915; }
        .calc-select {
          width: 100%;
          border: 1.5px solid #e7e1d8;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 15px;
          font-family: inherit;
          outline: none;
          background: #ffffff;
          color: #26231f;
          cursor: pointer;
          transition: border-color .15s;
          margin-bottom: 16px;
        }
        .calc-select option { background: #ffffff; color: #26231f; }
        .calc-select:focus { border-color: #981915; }
        .padrao-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 16px;
        }
        .padrao-card {
          border: 2px solid #e7e1d8;
          border-radius: 10px;
          padding: 10px 8px;
          cursor: pointer;
          text-align: center;
          transition: border-color .15s, background .15s;
          user-select: none;
          background: #ffffff;
        }
        .padrao-card.selected {
          border-color: #981915;
          background: rgba(152,25,21,.08);
          color: #981915;
        }
        .padrao-card-title {
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 4px;
          color: #26231f;
        }
        .padrao-card.selected .padrao-card-title {
          color: #981915;
        }
        .padrao-card-desc {
          font-size: 11px;
          color: #8c847a;
          line-height: 1.4;
        }
        .calc-btn {
          width: 100%;
          background: linear-gradient(135deg, #981915, #7d1411);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 15px;
          font-size: 16px;
          font-weight: 800;
          font-family: inherit;
          cursor: pointer;
          transition: opacity .15s, transform .1s;
          box-shadow: 0 4px 20px rgba(152,25,21,.4);
        }
        .calc-btn:hover { opacity: .9; transform: translateY(-1px); }
        .calc-btn:disabled { background: #ccc; color: #888; cursor: not-allowed; box-shadow: none; }
        .result-headline {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 20px;
          text-align: center;
          color: #26231f;
        }
        .result-card {
          border-radius: 12px;
          padding: 18px;
          margin-bottom: 12px;
        }
        .result-card.sf {
          border: 2px solid #981915;
          background: rgba(152,25,21,.04);
        }
        .result-card.al {
          border: 2px solid #e7e1d8;
          background: #ffffff;
        }
        .result-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .result-card-name {
          font-size: 15px;
          font-weight: 700;
          color: #26231f;
        }
        .result-badge {
          background: #981915;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
        }
        .result-faixa-label {
          font-size: 12px;
          color: #8c847a;
          margin-bottom: 2px;
        }
        .result-faixa {
          font-size: 20px;
          font-weight: 700;
          color: #26231f;
          margin-bottom: 8px;
          font-family: 'Barlow Condensed', sans-serif;
        }
        .result-prazo {
          font-size: 13px;
          color: #8c847a;
          margin-bottom: 10px;
        }
        .result-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .result-tag {
          background: #f4f1ec;
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 500;
          color: #26231f;
        }
        .result-tag.green { background: rgba(63,122,75,.1); color: #3f7a4b; }
        .comparison-note {
          text-align: center;
          font-size: 13px;
          color: #b07a1e;
          margin: 4px 0 20px;
          padding: 10px;
          background: rgba(176,122,30,.08);
          border: 1px solid rgba(176,122,30,.2);
          border-radius: 8px;
        }
        .cta-heading {
          font-size: 17px;
          font-weight: 700;
          margin: 0 0 6px;
          color: #26231f;
        }
        .cta-sub {
          font-size: 13px;
          color: #8c847a;
          margin: 0 0 20px;
        }
        .error-msg {
          color: #a33327;
          font-size: 13px;
          margin-bottom: 10px;
        }
        .success-icon {
          font-size: 48px;
          text-align: center;
          margin-bottom: 12px;
        }
        .success-title {
          font-size: 22px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 8px;
          color: #26231f;
        }
        .success-msg {
          font-size: 15px;
          color: #8c847a;
          text-align: center;
          margin-bottom: 28px;
          line-height: 1.6;
        }
        .btn-outline {
          width: 100%;
          background: #f4f1ec;
          border: 1.5px solid #e7e1d8;
          color: #26231f;
          border-radius: 8px;
          padding: 13px;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: background .15s, color .15s;
        }
        .btn-outline:hover { background: #981915; border-color: #981915; color: #fff; }
        .divider { height: 1px; background: #e7e1d8; margin: 20px 0; }
        .mode-tabs { display: flex; gap: 0; margin-bottom: 20px; border-radius: 10px; overflow: hidden; border: 1.5px solid #e7e1d8; background: #ffffff; }
        .mode-tab { flex: 1; padding: 11px 8px; font-size: 14px; font-weight: 700; font-family: inherit; cursor: pointer; border: none; background: transparent; color: #8c847a; transition: background .15s, color .15s; }
        .mode-tab.active { background: #981915; color: #fff; }
        .kit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px; }
        @media (max-width: 400px) { .kit-grid { grid-template-columns: 1fr; } }
        .kit-card { border: 1.5px solid #e7e1d8; border-radius: 14px; padding: 18px 14px; cursor: pointer; background: #ffffff; transition: border-color .2s, background .2s, transform .15s; box-shadow: 0 2px 6px rgba(0,0,0,0.02); }
        .kit-card:hover { border-color: #981915; background: rgba(152,25,21,.04); transform: translateY(-2px); }
        .kit-tag { display: inline-block; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 20px; color: #fff; margin-bottom: 8px; letter-spacing: .5px; }
        .kit-emoji { font-size: 30px; margin-bottom: 8px; }
        .kit-name { font-size: 15px; font-weight: 800; margin-bottom: 4px; color: #26231f; }
        .kit-desc { font-size: 11px; color: #8c847a; line-height: 1.4; margin-bottom: 10px; }
        .kit-meta { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
        .kit-chip { background: #f4f1ec; border-radius: 20px; padding: 3px 8px; font-size: 11px; color: #26231f; font-weight: 600; }
        .kit-price-label { font-size: 10px; color: #8c847a; text-transform: uppercase; letter-spacing: .5px; }
        .kit-price { font-size: 18px; font-weight: 900; color: #981915; font-family: 'Barlow Condensed', sans-serif; }
        .kit-btn { width: 100%; background: linear-gradient(135deg,#981915,#7d1411); color: #fff; border: none; border-radius: 8px; padding: 10px; font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer; margin-top: 10px; box-shadow: 0 3px 12px rgba(152,25,21,.35); transition: opacity .15s; }
        .kit-btn:hover { opacity: .85; }
        .kit-result-banner { background: linear-gradient(135deg,#7d1411,#981915); border-radius: 12px; padding: 20px; color: #fff; margin-bottom: 16px; }
        .kit-toggles { border-top: 1px solid rgba(255,255,255,.15); padding-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; }
        .kit-toggle-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 700; transition: all .2s; }
        .kit-breakdown { border-top: 1px solid #e7e1d8; margin-top: 12px; padding-top: 12px; display: flex; flex-wrap: wrap; gap: 16px; }
        .kit-breakdown-item { }
        .kit-breakdown-label { font-size: 10px; opacity: .5; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
        .kit-breakdown-val { font-size: 14px; font-weight: 800; color: #26231f; }
        .kit-cat-block { background: #ffffff; border-radius: 10px; border: 1px solid #e7e1d8; margin-bottom: 10px; overflow: hidden; transition: opacity .2s; }
        .kit-cat-header { background: #f4f1ec; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; color: #26231f; font-weight: 700; }
        .kit-cat-row { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; padding: 8px 14px; border-top: 1px solid #e7e1d8; align-items: center; font-size: 12px; color: #5c5750; }
        .back-link {
          display: inline-block;
          font-size: 13px;
          color: #981915;
          cursor: pointer;
          margin-bottom: 16px;
          text-decoration: none;
          font-weight: 500;
        }
        .back-link:hover { text-decoration: underline; }
        .calc-header {
          background: rgba(244,241,236,.85);
          backdrop-filter: blur(12px);
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          border-bottom: 1px solid #e7e1d8;
          position: sticky; top: 0; z-index: 100;
        }
        .calc-header-logo {
          display: flex; align-items: center; gap: 10px;
        }
        .calc-header-logo img { height: 36px; width: auto; }
        .calc-header-brand { font-size: 15px; font-weight: 900; letter-spacing: 2px; }
        .calc-header-brand span:first-child { color: #26231f; }
        .calc-header-brand span:last-child { color: #981915; }
        .calc-header-nav { display: flex; align-items: center; gap: 20px; }
        .calc-header-nav a { color: #8c847a; font-size: 13px; font-weight: 600; text-decoration: none; transition: color .15s; }
        .calc-header-nav a:hover { color: #26231f; }
        .calc-header-cta { background: #981915; color: #fff; border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer; transition: background .15s; white-space: nowrap; }
        .calc-header-cta:hover { background: #7a1210; }
        @media (max-width: 480px) { .calc-header-nav { display: none; } }
        .calc-hero {
          background: radial-gradient(ellipse at 70% 50%, rgba(152,25,21,.08) 0%, transparent 65%),
                      radial-gradient(ellipse at 20% 80%, rgba(244,241,236,.6) 0%, transparent 60%),
                      #ffffff;
          padding: 64px 20px 56px;
          text-align: center;
          color: #26231f;
          position: relative;
          overflow: hidden;
          border-bottom: 1px solid #e7e1d8;
        }
        .calc-hero::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(152,25,21,.03) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }
        .calc-hero-tag {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(152,25,21,.1);
          border: 1px solid rgba(152,25,21,.2); border-radius: 20px;
          font-size: 11px; font-weight: 700; padding: 5px 16px;
          letter-spacing: 1px; text-transform: uppercase; margin-bottom: 22px;
          color: #981915;
        }
        .calc-hero h1 {
          font-size: clamp(28px, 7vw, 48px); font-weight: 900;
          line-height: 1.1; margin: 0 0 16px; letter-spacing: -1.5px;
          color: #26231f;
        }
        .calc-hero h1 span { color: #981915; }
        .calc-hero p {
          font-size: 16px; color: #8c847a; margin: 0 auto 36px;
          max-width: 420px; line-height: 1.65;
        }
        .calc-hero-stats {
          display: flex; justify-content: center; gap: 0; flex-wrap: wrap;
          border: 1px solid #e7e1d8; border-radius: 14px;
          max-width: 380px; margin: 0 auto; overflow: hidden;
          background: #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
        }
        .calc-hero-stat {
          flex: 1; text-align: center; padding: 16px 12px;
          border-right: 1px solid #e7e1d8;
        }
        .calc-hero-stat:last-child { border-right: none; }
        .calc-hero-stat-val { font-size: 24px; font-weight: 900; color: #981915; font-family: 'Barlow Condensed', sans-serif; }
        .calc-hero-stat-lbl { font-size: 10px; color: #8c847a; margin-top: 3px; letter-spacing: .5px; text-transform: uppercase; }
      `}</style>

      <div className="calc-root">
        <header className="calc-header">
          <div className="calc-header-logo">
            {empresaBranding ? (
              <>
                {empresaBranding.logo_url && <img src={empresaBranding.logo_url} alt={empresaBranding.nome} style={{ height: 36, width: "auto", objectFit: "contain" }} />}
                <div className="calc-header-brand" style={{ color: empresaBranding.cor_primaria || "#981915" }}>
                  <span style={{ color: "rgba(255,255,255,.85)", letterSpacing: 1, fontSize: 14, fontWeight: 900 }}>{empresaBranding.nome}</span>
                </div>
              </>
            ) : (
              <>
                <img src="/logo-transparente-122x122.png" alt="Stick Frame" />
                <div className="calc-header-brand"><span>STICK</span><span>FRAME</span></div>
              </>
            )}
          </div>
          <nav className="calc-header-nav">
            <button className="calc-header-cta" onClick={() => document.querySelector('.calc-body')?.scrollIntoView({ behavior: 'smooth' })}>Simular agora</button>
          </nav>
        </header>

        <div className="calc-hero">
          <div className="calc-hero-tag">🏗 Calculadora Gratuita</div>
          <h1>Quanto custa sua<br /><span>casa em Steel Frame?</span></h1>
          <p>Simule o custo completo em segundos — materiais, projetos e mão de obra. Sem compromisso.</p>
          <div className="calc-hero-stats">
            <div className="calc-hero-stat">
              <div className="calc-hero-stat-val">6</div>
              <div className="calc-hero-stat-lbl">modelos prontos</div>
            </div>
            <div className="calc-hero-stat">
              <div className="calc-hero-stat-val">40%</div>
              <div className="calc-hero-stat-lbl">mais rápido</div>
            </div>
            <div className="calc-hero-stat">
              <div className="calc-hero-stat-val">24h</div>
              <div className="calc-hero-stat-lbl">retorno garantido</div>
            </div>
          </div>
        </div>

        <div className="calc-body">

          {/* ============ MODO TABS ============ */}
          {(step === "form" || modo === "kits") && (
            <div className="mode-tabs">
              <button className={`mode-tab${modo === "metro" ? " active" : ""}`} onClick={() => { setModo("metro"); setStep("form"); }}>📐 Simular por m²</button>
              <button className={`mode-tab${modo === "kits" ? " active" : ""}`} onClick={() => { setModo("kits"); setKitStep("lista"); }}>🏠 Kits de Casa</button>
            </div>
          )}

          {/* ============ MODO KITS ============ */}
          {modo === "kits" && kitStep === "lista" && (
            <div>
              <div className="calc-card" style={{ paddingBottom: 8 }}>
                <h1 className="calc-title">Kits de Casa prontos</h1>
                <p className="calc-subtitle">Escolha um modelo e veja o orçamento completo de materiais em segundos</p>
              </div>
              <div className="kit-grid">
                {KITS.map(kit => {
                  const items = calcKitDinamico(kit);
                  const total = items.reduce((s, i) => s + i.total, 0);
                  return (
                    <div key={kit.id} className="kit-card">
                      <div className="kit-tag" style={{ background: kit.tagCor }}>{kit.tag}</div>
                      <div className="kit-emoji">{kit.emoji}</div>
                      <div className="kit-name">{kit.nome}</div>
                      <div className="kit-desc">{kit.descricao}</div>
                      <div className="kit-meta">
                        <span className="kit-chip">📐 {kit.area} m²</span>
                        <span className="kit-chip">🛏 {kit.quartos} qts</span>
                        <span className="kit-chip">🚿 {kit.banheiros} ban</span>
                        <span className="kit-chip">🏠 {kit.pavs}P</span>
                      </div>
                      <div className="kit-price-label">Materiais a partir de</div>
                      <div className="kit-price">{fmtR(items.filter(i => !["Projetos e Engenharia","Mão de Obra"].includes(i.categoria)).reduce((s,i)=>s+i.total,0))}</div>
                      <button className="kit-btn" onClick={() => selecionarKit(kit)}>Calcular →</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {modo === "kits" && kitStep === "result" && kitSel && (
            <div>
              <span className="back-link" onClick={() => setKitStep("lista")}>← Voltar aos modelos</span>
              <div className="kit-result-banner">
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, opacity: .6, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Kit selecionado</div>
                    <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 2 }}>{kitSel.nome}</div>
                    <div style={{ fontSize: 13, opacity: .7 }}>{kitSel.area} m² · {kitSel.pavs} pav. · {kitSel.padrao}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, opacity: .6, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>Total incluído</div>
                    <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>{fmtR(totalAtivo)}</div>
                  </div>
                </div>
                <div className="kit-toggles">
                  {CATS_OPCIONAIS_KIT.map(cat => {
                    const sub = kitItems.filter(i => i.categoria === cat).reduce((s,i) => s+i.total, 0);
                    const ativo = catsAtivas[cat];
                    return (
                      <button key={cat} onClick={() => toggleCatKit(cat)} className="kit-toggle-btn" style={{
                        border: `1px solid ${ativo ? "rgba(255,255,255,.4)" : "rgba(255,255,255,.15)"}`,
                        background: ativo ? "rgba(255,255,255,.15)" : "rgba(0,0,0,.2)",
                        color: ativo ? "#fff" : "rgba(255,255,255,.45)",
                      }}>
                        <span>{ativo ? "☑" : "☐"}</span>
                        <span>{cat}</span>
                        <span style={{ opacity: .7, fontSize: 11 }}>{fmtR(sub)}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="kit-breakdown">
                  {[["Só materiais", totalSoMateriais],["+Projetos", totalComProjetos],["Obra completa", totalCompleto]].map(([label, val]) => (
                    <div key={label} className="kit-breakdown-item">
                      <div className="kit-breakdown-label">{label}</div>
                      <div className="kit-breakdown-val">{fmtR(val)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="calc-btn" style={{ marginTop: 4 }} onClick={() => { setNome(""); setWhatsapp(""); setEmail(""); setKitStep("contact"); window.scrollTo({top:0,behavior:"smooth"}); }}>
                📋 Solicitar orçamento completo
              </button>
            </div>
          )}

          {modo === "kits" && kitStep === "contact" && (
            <div>
              <span className="back-link" onClick={() => setKitStep("result")}>← Voltar ao resultado</span>
              <div className="calc-card">
                <div className="cta-heading">Solicitar orçamento — {kitSel?.nome}</div>
                <p className="cta-sub">Preencha abaixo e nossa equipe entra em contato em até 24h com proposta detalhada.</p>
                <form onSubmit={handleKitContact}>
                  <label className="calc-label">Nome completo</label>
                  <input className="calc-input" type="text" placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} required />
                  <label className="calc-label">WhatsApp</label>
                  <input className="calc-input" type="tel" placeholder="(11) 99999-9999" value={whatsapp} onChange={e => setWhatsapp(applyPhoneMask(e.target.value))} required />
                  <label className="calc-label">E-mail <span style={{ color: "#888", fontWeight: 400 }}>(opcional)</span></label>
                  <input className="calc-input" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                  {sendError && <p className="error-msg">{sendError}</p>}
                  <button className="calc-btn" type="submit" disabled={sending}>{sending ? "Enviando..." : "Receber proposta grátis"}</button>
                </form>
              </div>
            </div>
          )}

          {modo === "kits" && kitStep === "success" && (
            <div className="calc-card">
              <div className="success-icon">✅</div>
              <div className="success-title">Recebemos seu contato!</div>
              <p className="success-msg">Nossa equipe vai entrar em contato em até 24h pelo WhatsApp <strong>{whatsapp}</strong> com a proposta do kit <strong>{kitSel?.nome}</strong>.</p>
              <button className="btn-outline" onClick={() => { setModo("kits"); setKitStep("lista"); setKitSel(null); setKitItems(null); }}>Ver outros modelos</button>
            </div>
          )}

          {/* ============ STEP: FORM ============ */}
          {modo === "metro" && step === "form" && (
            <div className="calc-card">
              <h1 className="calc-title">Calcule o custo da sua obra</h1>
              <p className="calc-subtitle">Compare Steel Frame vs Alvenaria em segundos</p>

              <form onSubmit={handleCalculate}>
                <label className="calc-label">Área construída (m²)</label>
                <input
                  className="calc-input"
                  type="number"
                  min={40}
                  max={2000}
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
                  required
                />

                <label className="calc-label">Pavimentos</label>
                <select
                  className="calc-select"
                  value={pavimentos}
                  onChange={(e) => setPavimentos(e.target.value)}
                >
                  <option>Térreo</option>
                  <option>2 pavimentos</option>
                  <option>3 pavimentos</option>
                </select>

                <label className="calc-label">Padrão de acabamento</label>
                <div className="padrao-grid">
                  {PADROES.map((p) => (
                    <div
                      key={p.key}
                      className={`padrao-card${padrao === p.key ? " selected" : ""}`}
                      onClick={() => setPadrao(p.key)}
                    >
                      <div className="padrao-card-title">{p.title}</div>
                      <div className="padrao-card-desc">{p.desc}</div>
                    </div>
                  ))}
                </div>

                <label className="calc-label">Cidade</label>
                <input
                  className="calc-input"
                  type="text"
                  placeholder="Ex: São Paulo – SP"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                />

                <button className="calc-btn" type="submit">
                  Calcular agora →
                </button>
              </form>
            </div>
          )}

          {/* ============ STEP: RESULT ============ */}
          {modo === "metro" && step === "result" && (
            <>
              <span className="back-link" onClick={handleReset}>← Nova simulação</span>

              <div className="calc-card">
                <p className="result-headline">Sua estimativa está pronta!</p>

                {/* Steel Frame */}
                <div className="result-card sf">
                  <div className="result-card-header">
                    <span className="result-card-name">Steel Frame</span>
                    <span className="result-badge">Recomendado</span>
                  </div>
                  <div className="result-faixa-label">Faixa de investimento</div>
                  <div className="result-faixa">{formatBRL(sfMin)} – {formatBRL(sfMax)}</div>
                  <div className="result-prazo">Prazo médio: {PRAZOS_SF[padrao]}</div>
                  <div className="result-tags">
                    <span className="result-tag green">✓ Mais leve</span>
                    <span className="result-tag green">✓ Menos resíduos</span>
                    <span className="result-tag green">✓ Alta precisão</span>
                  </div>
                </div>

                {/* Alvenaria */}
                <div className="result-card al">
                  <div className="result-card-header">
                    <span className="result-card-name">Alvenaria Convencional</span>
                  </div>
                  <div className="result-faixa-label">Faixa de investimento</div>
                  <div className="result-faixa">{formatBRL(alMin)} – {formatBRL(alMax)}</div>
                  <div className="result-prazo">Prazo médio: 8–14 meses</div>
                  <div className="result-tags">
                    <span className="result-tag">• Método convencional</span>
                  </div>
                </div>

                {speedPct > 0 && (
                  <div className="comparison-note">
                    <Zap size={13} /> Steel Frame pode ser até <strong>{speedPct}% mais rápido</strong> que a alvenaria convencional
                  </div>
                )}

                <div className="divider" />

                <div className="cta-heading">Quer uma proposta detalhada e sem compromisso?</div>
                <p className="cta-sub">Preencha abaixo e nossa equipe entra em contato em até 24h.</p>

                <form onSubmit={handleContact}>
                  <label className="calc-label">Nome completo</label>
                  <input
                    className="calc-input"
                    type="text"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />

                  <label className="calc-label">WhatsApp</label>
                  <input
                    className="calc-input"
                    type="tel"
                    placeholder="Ex: (11) 99999-9999 ou +1 555 000-0000"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    required
                  />

                  <label className="calc-label">E-mail <span style={{color:"#888",fontWeight:400}}>(opcional)</span></label>
                  <input
                    className="calc-input"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  {sendError && <p className="error-msg">{sendError}</p>}

                  <button className="calc-btn" type="submit" disabled={sending}>
                    {sending ? "Enviando..." : "Receber proposta grátis"}
                  </button>
                </form>
              </div>
            </>
          )}

          {/* ============ STEP: SUCCESS ============ */}
          {modo === "metro" && step === "success" && (
            <div className="calc-card">
              <div className="success-icon"><CheckCircle size={14} /></div>
              <div className="success-title">Recebemos seu contato!</div>
              <p className="success-msg">
                Nossa equipe vai entrar em contato em até 24h pelo WhatsApp <strong>{whatsapp}</strong>.
              </p>
              <button className="btn-outline" onClick={handleReset}>
                Fazer outra simulação
              </button>
            </div>
          )}

        </div>

        {/* SEO content — visível para crawlers, discreto visualmente */}
        <section style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 64px", color: "#8c847a", fontSize: 14, lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#26231f", marginBottom: 16 }}>Quanto custa construir uma casa em Steel Frame?</h2>
          <p>O custo de construção em <strong>Steel Frame</strong> varia entre <strong>R$ 3.000 e R$ 6.000 por m²</strong>, dependendo do padrão de acabamento escolhido. Uma residência de <strong>120 m² no padrão médio</strong> fica em torno de R$ 420.000 a R$ 480.000 completa — incluindo estrutura LSF, fechamentos, cobertura, instalações e mão de obra especializada.</p>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#26231f", margin: "24px 0 8px" }}>Steel Frame vs Alvenaria: qual é mais barato?</h3>
          <p>O Steel Frame costuma ter custo de materiais <strong>10 a 20% superior</strong> à alvenaria convencional, porém o prazo de obra é até <strong>40% menor</strong> — o que reduz o custo financeiro e libera a família para morar mais cedo. Obras em alvenaria de 120 m² levam de 12 a 18 meses; em Steel Frame, de <strong>5 a 8 meses</strong>.</p>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#26231f", margin: "24px 0 8px" }}>O que está incluído no orçamento de Steel Frame?</h3>
          <p>Um orçamento completo contempla: <strong>estrutura metálica LSF</strong> (Light Steel Framing), painéis de OSB ou drywall, manta impermeabilizante, fechamentos internos e externos, cobertura com telha shingle ou metálica, esquadrias, instalações hidráulicas e elétricas, e mão de obra especializada. Use nossa calculadora acima para obter uma estimativa personalizada gratuitamente.</p>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#26231f", margin: "24px 0 8px" }}>Perguntas frequentes sobre Steel Frame</h3>
          <p><strong>Steel Frame é seguro e resistente?</strong> Sim. A estrutura de aço galvanizado tem vida útil superior a 50 anos, suporta ventos fortes e é antissísmica. É o sistema construtivo mais usado nos EUA, Canadá e Austrália.</p>
          <p style={{ marginTop: 12 }}><strong>Posso financiar uma casa em Steel Frame?</strong> Sim. O sistema é aceito pela Caixa Econômica Federal e pelos principais bancos, incluindo financiamento MCMV e crédito imobiliário convencional.</p>
          <p style={{ marginTop: 12 }}><strong>Como receber um orçamento personalizado?</strong> Preencha o simulador acima com a área e o padrão desejado. Nossa equipe entra em contato em até 24h com uma proposta detalhada, sem compromisso.</p>
        </section>

      </div>
    </>
  );
}
