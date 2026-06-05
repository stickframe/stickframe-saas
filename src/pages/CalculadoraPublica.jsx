import { useState } from "react";
import { CheckCircle, Zap } from "../components/ui/Icon";
import { sb } from "../services/supabase";

// ─── Kit data (shared with internal Calculadora) ─────────────────────────────
const INSUMOS_KIT = [
  { categoria: "Estrutura de Aço",      nome: "Montante C 90×40×15×1,25mm",         un: "pç",  base: 1.50,  preco: 18.50 },
  { categoria: "Estrutura de Aço",      nome: "Guia U 92×40×1,25mm",                un: "m",   base: 1.10,  preco: 12.00 },
  { categoria: "Estrutura de Aço",      nome: "Montante C 140×40×15×1,25mm",        un: "pç",  base: 0.30,  preco: 24.00 },
  { categoria: "Fechamento",            nome: "Chapa OSB 11,1mm",                   un: "chp", base: 0.38,  preco: 52.00 },
  { categoria: "Fechamento",            nome: "Placa de Gesso ST 13mm",             un: "chp", base: 0.85,  preco: 17.00 },
  { categoria: "Fechamento",            nome: "Placa Cimentícia 10mm",              un: "chp", base: 0.18,  preco: 65.00 },
  { categoria: "Isolamento",            nome: "Lã de Vidro 50mm",                   un: "m²",  base: 1.30,  preco: 16.00 },
  { categoria: "Isolamento",            nome: "Impermeabilizante flexível",         un: "m²",  base: 0.15,  preco: 35.00 },
  { categoria: "Fixação",               nome: "Parafuso TEX 4,2×16mm",              un: "cx",  base: 0.40,  preco: 48.00 },
  { categoria: "Fixação",               nome: "Parafuso TEX 4,2×38mm",              un: "cx",  base: 0.80,  preco: 52.00 },
  { categoria: "Fundação (Radier)",     nome: "Concreto C-25",                      un: "m³",  base: 0.10,  preco: 420.0, fund: true },
  { categoria: "Fundação (Radier)",     nome: "Ferragem CA-50",                     un: "kg",  base: 6.00,  preco:  6.50, fund: true },
  { categoria: "Fundação (Radier)",     nome: "Tela soldada Q-92",                  un: "pç",  base: 0.17,  preco: 68.00, fund: true },
  { categoria: "Cobertura",             nome: "Telha shingle (fardo 3m²)",          un: "fd",  base: 0.38,  preco: 185.0 },
  { categoria: "Cobertura",             nome: "Manta subcobertura",                 un: "m²",  base: 1.05,  preco:  8.50 },
  { categoria: "Cobertura",             nome: "Calha PVC 150mm",                    un: "m",   base: 0.30,  preco: 28.00 },
  { categoria: "Esquadrias",            nome: "Janela alumínio 1,20×1,20",          un: "un",  base: 0.055, preco: 680.0 },
  { categoria: "Esquadrias",            nome: "Porta interna 0,80×2,10",            un: "un",  base: 0.08,  preco: 420.0 },
  { categoria: "Instalações Elétricas", nome: "Conduíte + fios + caixas",           un: "m²",  base: 1.00,  preco: 62.00 },
  { categoria: "Inst. Hidrossanitárias",nome: "Tubulação PVC + esgoto",             un: "m²",  base: 1.00,  preco: 60.00 },
  { categoria: "Acabamentos",           nome: "Piso vinílico + revestimento",       un: "m²",  base: 0.90,  preco: 58.00 },
  { categoria: "Acabamentos",           nome: "Massa corrida + pintura",            un: "m²",  base: 2.80,  preco:  9.50 },
  { categoria: "Acabamentos",           nome: "Forro drywall ST",                   un: "m²",  base: 0.90,  preco: 42.00 },
  { categoria: "Projetos e Engenharia", nome: "Proj. Arquitetônico + Estrutural",   un: "m²",  base: 1.00,  preco: 46.00 },
  { categoria: "Projetos e Engenharia", nome: "Proj. Elétrico + Hidrossanitário",   un: "m²",  base: 1.00,  preco: 14.00 },
  { categoria: "Mão de Obra",           nome: "Montagem estrutura LSF",             un: "m²",  base: 1.00,  preco: 85.00 },
  { categoria: "Mão de Obra",           nome: "Instalação vedações",                un: "m²",  base: 1.00,  preco: 45.00 },
  { categoria: "Mão de Obra",           nome: "Cobertura + acabamentos",            un: "m²",  base: 1.00,  preco: 110.0 },
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
  // "metro" | "kits"
  const [modo, setModo] = useState("metro");

  // Kit states
  const [kitSel, setKitSel] = useState(null);
  const [kitItems, setKitItems] = useState(null);
  const [catsAtivas, setCatsAtivas] = useState(Object.fromEntries(CATS_ORDEM_KIT.map(c => [c, true])));
  const [kitStep, setKitStep] = useState("lista"); // "lista" | "result" | "contact" | "success"

  function selecionarKit(kit) {
    setKitSel(kit);
    setKitItems(calcKit(kit));
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
    const areaTotal = area * PAVIMENTOS[pavimentos];
    const sfValor = areaTotal * STEEL_FRAME[padrao];
    const alValor = areaTotal * ALVENARIA[padrao];
    setSfMin(Math.round(sfValor * 0.92));
    setSfMax(Math.round(sfValor * 1.12));
    setAlMin(Math.round(alValor * 0.92));
    setAlMax(Math.round(alValor * 1.12));
    setSfMidValue(Math.round(sfValor));
    setStep("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleContact(e) {
    e.preventDefault();
    setSendError("");
    setSending(true);
    try {
      const sfValor = area * PAVIMENTOS[pavimentos] * STEEL_FRAME[padrao];
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

      // Open WhatsApp notification to empresa owner
      try {
        const msg = `<Bell size={13} /> *Novo lead via Calculadora!*\n\n👤 *${nome}*\n📱 ${whatsapp}\n📍 ${cidade || "—"}\n\n<HardHat size={13} /> *Projeto:*\n• Área: ${area}m² · ${pavimentos}\n• Padrão: ${padrao}\n• Estimativa: R$ ${Math.round(sfValor * 0.92).toLocaleString("pt-BR")} – R$ ${Math.round(sfValor * 1.12).toLocaleString("pt-BR")}\n\nAcesse o sistema para responder: https://stickframe.com.br`;
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
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .calc-root *, .calc-root *::before, .calc-root *::after { box-sizing: border-box; }
        .calc-root {
          font-family: 'DM Sans', sans-serif;
          background: #f4f4f4;
          min-height: 100vh;
          color: #1A1A1A;
        }
        .calc-body {
          max-width: 560px;
          margin: 0 auto;
          padding: 24px 16px 48px;
        }
        .calc-card {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          margin-bottom: 16px;
        }
        .calc-title {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 4px;
        }
        .calc-subtitle {
          font-size: 14px;
          color: #666;
          margin: 0 0 24px;
        }
        .calc-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 6px;
          color: #333;
        }
        .calc-input {
          width: 100%;
          border: 1.5px solid #ddd;
          border-radius: 8px;
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
          border: 1.5px solid #ddd;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 15px;
          font-family: inherit;
          outline: none;
          background: #fff;
          cursor: pointer;
          transition: border-color .15s;
          margin-bottom: 16px;
        }
        .calc-select:focus { border-color: #981915; }
        .padrao-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 16px;
        }
        .padrao-card {
          border: 2px solid #ddd;
          border-radius: 10px;
          padding: 10px 8px;
          cursor: pointer;
          text-align: center;
          transition: border-color .15s, background .15s;
          user-select: none;
        }
        .padrao-card.selected {
          border-color: #981915;
          background: #fff5f5;
        }
        .padrao-card-title {
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .padrao-card-desc {
          font-size: 11px;
          color: #666;
          line-height: 1.4;
        }
        .calc-btn {
          width: 100%;
          background: #981915;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 14px;
          font-size: 16px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: background .15s;
        }
        .calc-btn:hover { background: #7a1210; }
        .calc-btn:disabled { background: #ccc; cursor: not-allowed; }
        .result-headline {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 20px;
          text-align: center;
        }
        .result-card {
          border-radius: 10px;
          padding: 18px;
          margin-bottom: 12px;
        }
        .result-card.sf {
          border: 2px solid #981915;
          background: #fff;
        }
        .result-card.al {
          border: 2px solid #ddd;
          background: #fafafa;
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
          color: #888;
          margin-bottom: 2px;
        }
        .result-faixa {
          font-size: 20px;
          font-weight: 700;
          color: #1A1A1A;
          margin-bottom: 8px;
        }
        .result-prazo {
          font-size: 13px;
          color: #555;
          margin-bottom: 10px;
        }
        .result-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .result-tag {
          background: #f0f0f0;
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 500;
          color: #444;
        }
        .result-tag.green { background: #e8f5e9; color: #2e7d32; }
        .comparison-note {
          text-align: center;
          font-size: 13px;
          color: #666;
          margin: 4px 0 20px;
          padding: 10px;
          background: #fff8e1;
          border-radius: 8px;
        }
        .cta-heading {
          font-size: 17px;
          font-weight: 700;
          margin: 0 0 6px;
        }
        .cta-sub {
          font-size: 13px;
          color: #666;
          margin: 0 0 20px;
        }
        .error-msg {
          color: #c0392b;
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
        }
        .success-msg {
          font-size: 15px;
          color: #555;
          text-align: center;
          margin-bottom: 28px;
          line-height: 1.6;
        }
        .btn-outline {
          width: 100%;
          background: transparent;
          color: #981915;
          border: 2px solid #981915;
          border-radius: 8px;
          padding: 13px;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: background .15s, color .15s;
        }
        .btn-outline:hover { background: #981915; color: #fff; }
        .divider { height: 1px; background: #eee; margin: 20px 0; }
        .mode-tabs { display: flex; gap: 0; margin-bottom: 20px; border-radius: 10px; overflow: hidden; border: 1.5px solid #ddd; }
        .mode-tab { flex: 1; padding: 11px 8px; font-size: 14px; font-weight: 700; font-family: inherit; cursor: pointer; border: none; background: #fff; color: #666; transition: background .15s, color .15s; }
        .mode-tab.active { background: #981915; color: #fff; }
        .kit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px; }
        @media (max-width: 400px) { .kit-grid { grid-template-columns: 1fr; } }
        .kit-card { border: 2px solid #e5e5e5; border-radius: 12px; padding: 16px 14px; cursor: pointer; background: #fff; transition: border-color .15s, box-shadow .15s; }
        .kit-card:hover { border-color: #981915; box-shadow: 0 2px 12px rgba(152,25,21,.12); }
        .kit-tag { display: inline-block; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 20px; color: #fff; margin-bottom: 8px; letter-spacing: .5px; }
        .kit-emoji { font-size: 28px; margin-bottom: 6px; }
        .kit-name { font-size: 14px; font-weight: 800; margin-bottom: 4px; }
        .kit-desc { font-size: 11px; color: #666; line-height: 1.4; margin-bottom: 10px; }
        .kit-meta { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
        .kit-chip { background: #f4f4f4; border-radius: 20px; padding: 3px 8px; font-size: 11px; color: #555; font-weight: 600; }
        .kit-price-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: .5px; }
        .kit-price { font-size: 17px; font-weight: 900; color: #981915; }
        .kit-btn { width: 100%; background: #981915; color: #fff; border: none; border-radius: 7px; padding: 9px; font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer; margin-top: 8px; }
        .kit-result-banner { background: linear-gradient(135deg,#1a0a0a,#981915); border-radius: 12px; padding: 20px; color: #fff; margin-bottom: 16px; }
        .kit-toggles { border-top: 1px solid rgba(255,255,255,.15); padding-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; }
        .kit-toggle-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 700; transition: all .2s; }
        .kit-breakdown { border-top: 1px solid rgba(255,255,255,.1); margin-top: 12px; padding-top: 12px; display: flex; flex-wrap: wrap; gap: 16px; }
        .kit-breakdown-item { }
        .kit-breakdown-label { font-size: 10px; opacity: .5; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
        .kit-breakdown-val { font-size: 14px; font-weight: 800; }
        .kit-cat-block { background: #fff; border-radius: 10px; border: 1px solid #e5e5e5; margin-bottom: 10px; overflow: hidden; transition: opacity .2s; }
        .kit-cat-header { background: #f9f9f9; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; }
        .kit-cat-row { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; padding: 8px 14px; border-top: 1px solid #f0f0f0; align-items: center; font-size: 12px; }
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
          background: #111;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          border-bottom: 1px solid rgba(255,255,255,.06);
          position: sticky; top: 0; z-index: 100;
        }
        .calc-header-logo {
          display: flex; align-items: center; gap: 10px;
        }
        .calc-header-logo img { height: 36px; width: auto; }
        .calc-header-badge {
          background: #981915; color: #fff; font-size: 10px;
          font-weight: 800; padding: 2px 8px; border-radius: 20px;
          letter-spacing: .5px; text-transform: uppercase;
        }
        .calc-hero {
          background: linear-gradient(160deg, #111 0%, #1a0505 50%, #981915 100%);
          padding: 52px 20px 48px;
          text-align: center;
          color: #fff;
        }
        .calc-hero-tag {
          display: inline-block; background: rgba(255,255,255,.12);
          border: 1px solid rgba(255,255,255,.2); border-radius: 20px;
          font-size: 11px; font-weight: 700; padding: 4px 14px;
          letter-spacing: 1px; text-transform: uppercase; margin-bottom: 18px;
          color: rgba(255,255,255,.85);
        }
        .calc-hero h1 {
          font-size: clamp(26px, 6vw, 42px); font-weight: 900;
          line-height: 1.15; margin: 0 0 14px; letter-spacing: -1px;
        }
        .calc-hero h1 span { color: #ff6b6b; }
        .calc-hero p {
          font-size: 15px; opacity: .75; margin: 0 auto 28px;
          max-width: 440px; line-height: 1.6;
        }
        .calc-hero-stats {
          display: flex; justify-content: center; gap: 32px; flex-wrap: wrap;
        }
        .calc-hero-stat { text-align: center; }
        .calc-hero-stat-val { font-size: 22px; font-weight: 900; }
        .calc-hero-stat-lbl { font-size: 11px; opacity: .55; margin-top: 2px; }
      `}</style>

      <div className="calc-root">
        <header className="calc-header">
          <div className="calc-header-logo">
            <img src="/logo-transparente-122x122.png" alt="Stick Frame" />
          </div>
          <span className="calc-header-badge">Steel Frame</span>
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
                  const items = calcKit(kit);
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
      </div>
    </>
  );
}
