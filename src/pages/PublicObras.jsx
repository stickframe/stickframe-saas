import { useState, useEffect } from "react";
import { sb } from "../services/supabase";
import { Link } from "react-router-dom";
import { C } from "../utils/constants";
import useAppStore from "../store/useAppStore";

const MOCK_OBRAS_PUBLICAS = [
  { id: "op1", slug: "residencia-alto-da-serra", nome: "Residência Alto da Serra", tipologia: "Residencial Alto Padrão", cidade_publica: "Santo André", uf_publica: "SP", prazo_dias: 180, area_m2: 245, contrato: 735000, descricao_publica: "Construção de residência de 245m² em dois pavimentos, utilizando perfis leves de aço zincado (Light Steel Framing) com fechamento em placas cimentícias e sistema EIFS para isolamento térmico.", fotos_publicas: ["https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800"] },
  { id: "op2", slug: "clinica-medica-bem-estar", nome: "Clínica Médica Bem Estar", tipologia: "Comercial / Saúde", cidade_publica: "Curitiba", uf_publica: "PR", prazo_dias: 120, area_m2: 180, contrato: 540000, descricao_publica: "Reforma e ampliação estrutural em Steel Frame para fins de clínica médica. Excelente desempenho acústico entre salas obtido por fechamento duplo em gesso acartonado estruturado e lã de vidro.", fotos_publicas: ["https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800"] },
  { id: "op3", slug: "pavilhao-industrial-sao-carlos", nome: "Pavilhão Logístico São Carlos", tipologia: "Industrial / Galpão", cidade_publica: "São Carlos", uf_publica: "SP", prazo_dias: 240, area_m2: 1200, contrato: 2400000, descricao_publica: "Estrutura híbrida com pórticos principais em aço pesado e fechamentos/divisões internas em Light Steel Frame para escritórios suspensos. Rápido tempo de montagem e alta durabilidade.", fotos_publicas: ["https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=800"] }
];

export default function PublicObras() {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("Todos");
  const [ufFiltro, setUfFiltro] = useState("Todos");

  useEffect(() => {
    carregarObras();
  }, []);

  async function carregarObras() {
    setLoading(true);
    try {
      const { data, error } = await sb
        .from("obras")
        .select("*")
        .eq("publicada", true)
        .order("destaque", { ascending: false });
      if (!error && data && data.length > 0) {
        // Map slug to rows if not present
        const withSlug = data.map(o => ({
          ...o,
          slug: o.slug || (o.nome || "obra").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
        }));
        setObras(withSlug);
      } else {
        setObras(MOCK_OBRAS_PUBLICAS);
      }
    } catch (e) {
      setObras(MOCK_OBRAS_PUBLICAS);
    } finally {
      setLoading(false);
    }
  }

  // Obter filtros únicos
  const tipologias = ["Todos", ...new Set(obras.map(o => o.tipologia).filter(Boolean))];
  const ufs = ["Todos", ...new Set(obras.map(o => o.uf_publica).filter(Boolean))];

  const filtradas = obras.filter(o => {
    const matchBusca = !busca || o.nome?.toLowerCase().includes(busca.toLowerCase()) || o.cidade_publica?.toLowerCase().includes(busca.toLowerCase());
    const matchTipo = tipoFiltro === "Todos" || o.tipologia === tipoFiltro;
    const matchUf = ufFiltro === "Todos" || o.uf_publica === ufFiltro;
    return matchBusca && matchTipo && matchUf;
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top, #1c1515 0%, #0d0a0a 100%)",
      color: "#f5f3f0",
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Top Banner */}
      <div style={{
        padding: "80px 24px 60px",
        textAlign: "center",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Glow effect */}
        <div style={{
          position: "absolute",
          top: "-50%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 300,
          background: "radial-gradient(circle, rgba(152, 25, 21, 0.25) 0%, transparent 70%)",
          zIndex: 0,
          pointerEvents: "none"
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto" }}>
          <span style={{
            background: "rgba(152, 25, 21, 0.15)",
            border: "1px solid rgba(152, 25, 21, 0.35)",
            color: "#ff6b6b",
            fontSize: 11,
            fontWeight: 800,
            padding: "4px 12px",
            borderRadius: 20,
            letterSpacing: 1.5,
            textTransform: "uppercase"
          }}>Portfólio Nacional de Obras</span>
          <h1 style={{
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 900,
            color: "#ffffff",
            margin: "16px 0 12px",
            lineHeight: 1.1,
            letterSpacing: "-0.5px"
          }}>Galeria Pública de Steel Frame</h1>
          <p style={{
            color: "#b0a8a0",
            fontSize: 16,
            lineHeight: 1.6,
            maxWidth: 600,
            margin: "0 auto"
          }}>
            Explore projetos executados de alta performance e sustentabilidade em Light Steel Framing de todo o Brasil.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Filters */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          padding: 20,
          marginBottom: 32,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center"
        }}>
          {/* Busca */}
          <div style={{
            flex: "1 1 300px",
            background: "rgba(0,0,0,0.25)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8c847a" strokeWidth="2.5"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar obra por nome ou localização..."
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "#fff",
                fontSize: 14,
                width: "100%",
                fontFamily: "inherit"
              }}
            />
          </div>

          {/* Tipo Selector */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#8c847a", textTransform: "uppercase" }}>Tipologia:</span>
            <select
              value={tipoFiltro}
              onChange={e => setTipoFiltro(e.target.value)}
              style={{
                background: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "8px 12px",
                color: "#fff",
                fontSize: 13,
                outline: "none"
              }}
            >
              {tipologias.map(t => <option key={t} value={t} style={{ background: "#0d0a0a" }}>{t}</option>)}
            </select>
          </div>

          {/* UF Selector */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#8c847a", textTransform: "uppercase" }}>UF:</span>
            <select
              value={ufFiltro}
              onChange={e => setUfFiltro(e.target.value)}
              style={{
                background: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "8px 12px",
                color: "#fff",
                fontSize: 13,
                outline: "none"
              }}
            >
              {ufs.map(u => <option key={u} value={u} style={{ background: "#0d0a0a" }}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Works Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#8c847a" }}>Carregando portfólio...</div>
        ) : filtradas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#8c847a", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 16 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Nenhuma obra localizada</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Tente alterar os termos da busca ou os filtros aplicados.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
            {filtradas.map(o => {
              const coverImg = o.fotos_publicas?.[0] || o.fotos_publicas || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800";
              return (
                <Link
                  key={o.id}
                  to={`/obra/${o.slug || o.id}`}
                  style={{
                    textDecoration: "none",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 16,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                    transition: "transform .2s, border-color .2s",
                    cursor: "pointer"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.borderColor = "rgba(152, 25, 21, 0.4)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                  }}
                >
                  <div style={{ height: 200, overflow: "hidden", position: "relative" }}>
                    <img
                      src={coverImg}
                      alt={o.nome}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div style={{
                      position: "absolute",
                      bottom: 12,
                      left: 12,
                      background: "rgba(0,0,0,0.65)",
                      backdropFilter: "blur(4px)",
                      borderRadius: 6,
                      padding: "4px 8px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#fff"
                    }}>
                      📍 {o.cidade_publica} — {o.uf_publica}
                    </div>
                  </div>

                  <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#ff6b6b", textTransform: "uppercase", letterSpacing: 0.5 }}>{o.tipologia}</span>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "6px 0 10px" }}>{o.nome}</h3>
                    <p style={{ fontSize: 13, color: "#a09890", lineHeight: 1.5, marginBottom: 18, flex: 1, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {o.descricao_publica}
                    </p>

                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      paddingTop: 14,
                      fontSize: 13
                    }}>
                      <div>
                        <span style={{ color: "#8c847a", display: "block", fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>Área m²</span>
                        <strong style={{ color: "#fff", fontSize: 14 }}>{o.area_m2 || "—"} m²</strong>
                      </div>
                      <div>
                        <span style={{ color: "#8c847a", display: "block", fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>Prazo Execução</span>
                        <strong style={{ color: "#fff", fontSize: 14 }}>{o.prazo_dias || "—"} dias</strong>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ color: "#ff6b6b", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                          Ver Detalhes →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
