import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { sb } from "../services/supabase";
import { C } from "../utils/constants";

const MOCK_OBRAS_PUBLICAS = [
  { id: "op1", slug: "residencia-alto-da-serra", nome: "Residência Alto da Serra", tipologia: "Residencial Alto Padrão", cidade_publica: "Santo André", uf_publica: "SP", prazo_dias: 180, area_m2: 245, contrato: 735000, descricao_publica: "Construção de residência de 245m² em dois pavimentos, utilizando perfis leves de aço zincado (Light Steel Framing) com fechamento em placas cimentícias e sistema EIFS para isolamento térmico.", fotos_publicas: ["https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800", "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800"] },
  { id: "op2", slug: "clinica-medica-bem-estar", nome: "Clínica Médica Bem Estar", tipologia: "Comercial / Saúde", cidade_publica: "Curitiba", uf_publica: "PR", prazo_dias: 120, area_m2: 180, contrato: 540000, descricao_publica: "Reforma e ampliação estrutural em Steel Frame para fins de clínica médica. Excelente desempenho acústico entre salas obtido por fechamento duplo em gesso acartonado estruturado e lã de vidro.", fotos_publicas: ["https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800"] },
  { id: "op3", slug: "pavilhao-industrial-sao-carlos", nome: "Pavilhão Logístico São Carlos", tipologia: "Industrial / Galpão", cidade_publica: "São Carlos", uf_publica: "SP", prazo_dias: 240, area_m2: 1200, contrato: 2400000, descricao_publica: "Estrutura híbrida com pórticos principais em aço pesado e fechamentos/divisões internas em Light Steel Frame para escritórios suspensos. Rápido tempo de montagem e alta durabilidade.", fotos_publicas: ["https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=800"] }
];

export default function PublicObraDetail() {
  const { slug } = useParams();
  const [obra, setObra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    carregarObra();
  }, [slug]);

  async function carregarObra() {
    setLoading(true);
    try {
      const { data, error } = await sb
        .from("obras")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!error && data) {
        setObra(data);
      } else {
        // Tentar por ID se não achar por slug
        const { data: dataId, error: errorId } = await sb
          .from("obras")
          .select("*")
          .eq("id", slug)
          .single();
        if (!errorId && dataId) {
          setObra(dataId);
        } else {
          // Fallback para mock
          const m = MOCK_OBRAS_PUBLICAS.find(x => x.slug === slug || x.id === slug);
          setObra(m || MOCK_OBRAS_PUBLICAS[0]);
        }
      }
    } catch (e) {
      const m = MOCK_OBRAS_PUBLICAS.find(x => x.slug === slug || x.id === slug);
      setObra(m || MOCK_OBRAS_PUBLICAS[0]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0d0a0a",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "inherit"
      }}>
        Carregando detalhes do projeto...
      </div>
    );
  }

  if (!obra) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0d0a0a",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16
      }}>
        <h2>Projeto não encontrado</h2>
        <Link to="/obras" style={{ color: "#ff6b6b", textDecoration: "underline" }}>Voltar para a Galeria</Link>
      </div>
    );
  }

  const listFotos = Array.isArray(obra.fotos_publicas) && obra.fotos_publicas.length > 0
    ? obra.fotos_publicas
    : [obra.fotos_publicas || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800"];

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top, #1c1515 0%, #0d0a0a 100%)",
      color: "#f5f3f0",
      fontFamily: "'Inter', sans-serif",
      paddingBottom: 80
    }}>
      {/* Header bar */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "20px 24px"
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/obras" style={{
            textDecoration: "none",
            color: "#a09890",
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 6
          }}>
            ← Voltar para Galeria
          </Link>
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#ff6b6b",
            background: "rgba(152,25,21,0.15)",
            padding: "4px 10px",
            borderRadius: 6
          }}>
            Case Concluído · StickFrame
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "40px auto 0", padding: "0 24px" }}>
        {/* Title */}
        <div style={{ marginBottom: 28 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#ff6b6b", textTransform: "uppercase" }}>{obra.tipologia}</span>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 900, color: "#fff", margin: "6px 0 8px" }}>{obra.nome}</h1>
          <div style={{ fontSize: 14, color: "#a09890" }}>📍 Localização: {obra.cidade_publica} — {obra.uf_publica}</div>
        </div>

        {/* Layout Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 32, alignItems: "flex-start" }}>
          
          {/* Col 1: Galeria + Detalhes */}
          <div>
            {/* Main Picture */}
            <div style={{
              height: "clamp(250px, 40vw, 480px)",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(0,0,0,0.25)"
            }}>
              <img
                src={listFotos[activePhoto]}
                alt={obra.nome}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            {/* Selector Thumbnails */}
            {listFotos.length > 1 && (
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                {listFotos.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    style={{
                      width: 80,
                      height: 60,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: activePhoto === i ? "2px solid #ff6b6b" : "1.5px solid rgba(255,255,255,0.1)",
                      background: "transparent",
                      cursor: "pointer",
                      padding: 0
                    }}
                  >
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
              padding: 24,
              marginTop: 24
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Sobre o Projeto</h2>
              <p style={{ fontSize: 14.5, color: "#b0a8a0", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                {obra.descricao_publica}
              </p>
            </div>
          </div>

          {/* Col 2: Info Card & CTA */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Fact Sheet */}
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
              padding: 24
            }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Ficha Técnica</h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "Área de Construção", value: `${obra.area_m2 || "—"} m²` },
                  { label: "Prazo de Montagem", value: `${obra.prazo_dias || "—"} dias` },
                  { label: "Consumo Médio de Aço", value: `${Math.round((obra.area_m2 || 0) * 22)} kg (Est. 22kg/m²)` },
                  { label: "Tipologia Construtiva", value: "Light Steel Framing (LSF)" },
                  { label: "Isolamento Acústico", value: "Lã de Vidro 50mm / PET" },
                  { label: "Fundação Utilizada", value: "Radier Concretado Plano" }
                ].map((f, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: 8 }}>
                    <span style={{ fontSize: 12.5, color: "#8c847a" }}>{f.label}</span>
                    <strong style={{ fontSize: 13, color: "#fff" }}>{f.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* High-Converting CTA Box */}
            <div style={{
              background: "linear-gradient(135deg, #260a0a 0%, #170404 100%)",
              border: "1px solid rgba(152, 25, 21, 0.4)",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 8px 32px rgba(152, 25, 21, 0.15)",
              textAlign: "center"
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🧮</div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Custo Estimado da Obra</h2>
              <p style={{ fontSize: 12.5, color: "#b0a8a0", lineHeight: 1.5, marginBottom: 20 }}>
                Quer simular o orçamento estrutural completo para uma obra parecida com esta no seu terreno?
              </p>

              <Link
                to="/calcular"
                style={{
                  display: "block",
                  padding: "12px 20px",
                  background: C.red,
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 700,
                  boxShadow: "0 4px 15px rgba(152, 25, 21, 0.45)",
                  transition: "background .15s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#b41e1e"}
                onMouseLeave={e => e.currentTarget.style.background = C.red}
              >
                Calcular Custo Steel Frame
              </Link>
              <div style={{ fontSize: 10.5, color: "#8c847a", marginTop: 8 }}>
                Simulação gratuita baseada nos preços atuais de m².
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
