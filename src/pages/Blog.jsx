import { useState, useEffect } from "react";
import { sb } from "../services/supabase";
import { Link } from "react-router-dom";
import { C } from "../utils/constants";

const MOCK_POSTS = [
  { id: "p1", slug: "como-calcular-preco-m2-steel-frame", titulo: "Como Calcular o Preço do m² em Obras de Steel Frame", resumo: "Entenda os principais fatores de custos no LSF e como estimar o preço de m² com precisão, considerando perfis de aço, chapas de fechamento e lã termoacústica.", categoria: "Gestão de Obras", imagem_capa: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800", autor: "Eng. André Queiroz", publicado_em: new Date().toISOString() },
  { id: "p2", slug: "vantagens-light-steel-framing-vs-alvenaria", titulo: "Vantagens do Light Steel Framing versus Alvenaria", resumo: "Compare prazos, desperdício de insumos, sustentabilidade e precisão do sistema construtivo LSF industrializado versus a alvenaria convencional.", categoria: "Tecnologia", imagem_capa: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800", autor: "Eng. André Queiroz", publicado_em: new Date().toISOString() },
  { id: "p3", slug: "normas-regulamentadoras-na-construcao-a-seco", titulo: "Normas Regulamentadoras e a Conformidade no Steel Frame", resumo: "Tudo sobre as exigências de segurança (NR-18, NR-35), qualidade do aço e testes em painéis em canteiros de obra a seco de acordo com o CBCA.", categoria: "Normas e NRs", imagem_capa: "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=800", autor: "Eng. André Queiroz", publicado_em: new Date().toISOString() }
];

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catFiltro, setCatFiltro] = useState("Todos");

  useEffect(() => {
    carregarPosts();
  }, []);

  async function carregarPosts() {
    setLoading(true);
    try {
      const { data, error } = await sb
        .from("blog_posts")
        .select("*")
        .order("publicado_em", { ascending: false });

      if (!error && data && data.length > 0) {
        setPosts(data);
      } else {
        setPosts(MOCK_POSTS);
      }
    } catch (e) {
      setPosts(MOCK_POSTS);
    } finally {
      setLoading(false);
    }
  }

  const categorias = ["Todos", ...new Set(posts.map(p => p.categoria).filter(Boolean))];

  const filtrados = catFiltro === "Todos"
    ? posts
    : posts.filter(p => p.categoria === catFiltro);

  const destaque = filtrados[0];
  const restantes = filtrados.slice(1);

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top, #1a1616 0%, #0c0a0a 100%)",
      color: "#f5f3f0",
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Blog Hero Header */}
      <div style={{
        padding: "70px 24px 45px",
        textAlign: "center",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "relative"
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <span style={{
            background: "rgba(152, 25, 21, 0.15)",
            border: "1px solid rgba(152, 25, 21, 0.35)",
            color: "#ff6b6b",
            fontSize: 10.5,
            fontWeight: 800,
            padding: "4px 12px",
            borderRadius: 20,
            letterSpacing: 1.5,
            textTransform: "uppercase"
          }}>Biblioteca Técnica do Construtor</span>
          <h1 style={{
            fontSize: "clamp(30px, 4.5vw, 44px)",
            fontWeight: 900,
            color: "#fff",
            margin: "12px 0 10px",
            letterSpacing: "-0.5px"
          }}>Canal de Conteúdo Técnico</h1>
          <p style={{ color: "#b0a8a0", fontSize: 15.5, maxW: 550, margin: "0 auto", lineHeight: 1.5 }}>
            Artigos, boas práticas construtivas, dicas de orçamento e novidades tecnológicas do Light Steel Framing.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>
        
        {/* Category Chips */}
        <div style={{
          display: "flex",
          gap: 10,
          marginBottom: 36,
          flexWrap: "wrap",
          justifyContent: "center",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          paddingBottom: 20
        }}>
          {categorias.map(c => (
            <button
              key={c}
              onClick={() => setCatFiltro(c)}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: catFiltro === c ? 700 : 500,
                border: `1.5px solid ${catFiltro === c ? "#ff6b6b" : "rgba(255,255,255,0.08)"}`,
                background: catFiltro === c ? "rgba(152, 25, 21, 0.18)" : "transparent",
                color: catFiltro === c ? "#ff6b6b" : "#a09890"
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#8c847a" }}>Carregando artigos...</div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#8c847a" }}>Nenhum artigo encontrado nesta categoria.</div>
        ) : (
          <div>
            {/* Featured Post Card */}
            {destaque && catFiltro === "Todos" && (
              <Link
                to={`/blog/${destaque.slug}`}
                style={{
                  textDecoration: "none",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 20,
                  overflow: "hidden",
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr",
                  gap: 0,
                  marginBottom: 40,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  cursor: "pointer",
                  transition: "border-color .2s"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(152, 25, 21, 0.4)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}
              >
                <div style={{ height: "clamp(250px, 35vw, 380px)" }}>
                  <img
                    src={destaque.imagem_capa}
                    alt={destaque.titulo}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div style={{ padding: 32, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#ff6b6b", textTransform: "uppercase", letterSpacing: 0.5 }}>🔥 Artigo em Destaque · {destaque.categoria}</span>
                  <h2 style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 900, color: "#fff", margin: "10px 0 14px", lineHeight: 1.25 }}>
                    {destaque.titulo}
                  </h2>
                  <p style={{ fontSize: 14.5, color: "#a09890", lineHeight: 1.6, marginBottom: 20 }}>
                    {destaque.resumo}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 12.5, color: "#8c847a" }}>
                      Por <strong>{destaque.autor || "StickFrame"}</strong> · {new Date(destaque.publicado_em).toLocaleDateString("pt-BR")}
                    </div>
                    <span style={{ color: "#ff6b6b", fontWeight: 700, fontSize: 13.5 }}>Ler Artigo →</span>
                  </div>
                </div>
              </Link>
            )}

            {/* Articles Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 28 }}>
              {(catFiltro === "Todos" ? restantes : filtrados).map(p => (
                <Link
                  key={p.id}
                  to={`/blog/${p.slug}`}
                  style={{
                    textDecoration: "none",
                    background: "rgba(255,255,255,0.015)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 16,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
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
                  <div style={{ height: 180, overflow: "hidden" }}>
                    <img src={p.imagem_capa} alt={p.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: "#ff6b6b", textTransform: "uppercase" }}>{p.categoria}</span>
                    <h3 style={{ fontSize: 16.5, fontWeight: 800, color: "#fff", margin: "6px 0 10px", lineHeight: 1.35 }}>{p.titulo}</h3>
                    <p style={{ fontSize: 13.5, color: "#a09890", lineHeight: 1.5, marginBottom: 16, flex: 1 }}>{p.resumo}</p>
                    
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      paddingTop: 12,
                      fontSize: 12,
                      color: "#8c847a"
                    }}>
                      <span>{new Date(p.publicado_em).toLocaleDateString("pt-BR")}</span>
                      <span style={{ color: "#ff6b6b", fontWeight: 700 }}>Ler Mais →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
