import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { sb } from "../services/supabase";

const MOCK_POSTS = [
  { id: "p1", slug: "como-calcular-preco-m2-steel-frame", titulo: "Como Calcular o Preço do m² em Obras de Steel Frame", conteudo: `O Light Steel Framing (LSF) está revolucionando a construção civil no Brasil devido à sua precisão milimétrica, ausência de desperdícios de materiais e rápida velocidade de execução. No entanto, orçar e precificar uma obra de Steel Frame exige considerações diferentes de uma alvenaria tradicional.

Neste artigo, detalhamos a composição técnica de custos para você orçar o m² de forma precisa.

## 1. Estrutura de Perfis Metálicos
A espessura de chapa mais comum varia entre **0.80mm e 1.25mm**. O consumo médio de aço estrutural galvanizado fica entre **18kg e 26kg por m²** de área construída.
* **Perfis U e Ue**: O montante principal de sustentação vertical e a guia horizontal.
* **Consumo Estimado**: Cerca de R$ 180,00 a R$ 260,00 por m² apenas em aço de perfis brutos.

## 2. Fechamento das Paredes
Diferente do tijolo cerâmico, as paredes em LSF são multicamadas:
1. **Chapa Externa (OSB/Cimentícia/EIFS)**: Proporciona estabilidade estrutural e contraventamento.
2. **Membrana Hidrófuga**: Impede a passagem de água externa, permitindo que a parede respire.
3. **Isolamento Termoacústico**: Lã de Vidro ou PET nas cavidades internas.
4. **Chapa Interna**: Gesso acartonado (Drywall) simples ou duplo.

## 3. Custos de Mão de Obra
A montagem exige equipe certificada e especializada. No entanto, por exigir muito menos dias de canteiro do que a alvenaria, a diária de montadores rende muito mais:
* **Prazo**: Residência de 150m² fica estruturada e fechada em menos de **30 dias**.

## Como otimizar estes cálculos?
A melhor ferramenta para otimizar essas simulações é o módulo **StickQuote™** dentro da plataforma StickFrame, que faz o levantamento automático de composições diretamente dos quantitativos estruturais do seu projeto DXF/BIM.`, resumo: "Entenda os principais fatores de custos no LSF e como estimar o preço de m² com precisão, considerando perfis de aço, chapas de fechamento e lã termoacústica.", categoria: "Gestão de Obras", imagem_capa: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800", autor: "Eng. André Queiroz", publicado_em: new Date().toISOString() },
  { id: "p2", slug: "vantagens-light-steel-framing-vs-alvenaria", titulo: "Vantagens do Light Steel Framing versus Alvenaria", conteudo: `A construção civil tradicional no Brasil está passando por um gargalo de mão de obra e prazos. Diante desse cenário, sistemas industrializados de construção a seco vêm despontando como o futuro viável para construtoras e incorporadoras.

Aqui estão as principais vantagens em construir utilizando Light Steel Framing (LSF):

### 1. Velocidade de Execução
Obras residenciais e comerciais em Steel Frame são entregues em até **um terço do tempo** quando comparadas ao processo tradicional de concreto armado e tijolos. Uma casa padrão de 200m² pode ser concluída integralmente em cerca de 90 a 120 dias.

### 2. Desperdício Zero (Construção Limpa)
Enquanto a alvenaria tradicional gera cerca de 20% a 30% de resíduo e entulho de canteiro, o Steel Frame é projetado milimetricamente. As guias, montantes e placas chegam nas dimensões corretas ou são cortados industrialmente, garantindo desperdício quase nulo (menos de 2%).

### 3. Conforto Térmico e Acústico Premium
O recheio de lã de vidro ou lã de rocha nas cavidades internas das divisórias metálicas confere às edificações em LSF um desempenho acústico e de isolamento térmico muito superior. É possível manter a temperatura interna amena e bloquear ruídos de trânsito ou vizinhos de forma extremamente eficiente.

### 4. Peso Aliviado da Fundação
Por ser um sistema leve (cerca de 5 a 10 vezes mais leve que a alvenaria), as cargas transmitidas à fundação são muito menores. Isso gera uma economia drástica de concreto e ferragens na execução de radiers ou vigas baldrame.`, resumo: "Compare prazos, desperdício de insumos, sustentabilidade e precisão do sistema construtivo LSF industrializado versus a alvenaria convencional.", categoria: "Tecnologia", imagem_capa: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800", autor: "Eng. André Queiroz", publicado_em: new Date().toISOString() }
];

export default function BlogPostDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPost();
  }, [slug]);

  async function carregarPost() {
    setLoading(true);
    try {
      const { data, error } = await sb
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!error && data) {
        setPost(data);
      } else {
        const m = MOCK_POSTS.find(x => x.slug === slug || x.id === slug);
        setPost(m || MOCK_POSTS[0]);
      }
    } catch (e) {
      const m = MOCK_POSTS.find(x => x.slug === slug || x.id === slug);
      setPost(m || MOCK_POSTS[0]);
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
        justifyContent: "center"
      }}>
        Carregando artigo...
      </div>
    );
  }

  if (!post) {
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
        <h2>Artigo não localizado</h2>
        <Link to="/blog" style={{ color: "#ff6b6b", textDecoration: "underline" }}>Voltar ao Blog</Link>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0a0a",
      color: "#f5f3f0",
      fontFamily: "'Inter', sans-serif",
      paddingBottom: 80
    }}>
      {/* Blog Detail Header */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "20px 24px"
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/blog" style={{
            textDecoration: "none",
            color: "#a09890",
            fontSize: 14.5,
            fontWeight: 600
          }}>
            ← Voltar para o Blog
          </Link>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#ff6b6b" }}>
            {post.categoria}
          </span>
        </div>
      </div>

      {/* Hero Cover */}
      <div style={{
        width: "100%",
        height: "clamp(250px, 45vw, 420px)",
        overflow: "hidden",
        position: "relative"
      }}>
        <img
          src={post.imagem_capa}
          alt={post.titulo}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* Shadow Overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, transparent 30%, #0d0a0a 100%)"
        }} />
      </div>

      {/* Content Container */}
      <div style={{ maxWidth: 800, margin: "-80px auto 0", padding: "0 24px", position: "relative", zIndex: 10 }}>
        {/* Title Card */}
        <div style={{
          background: "rgba(25, 20, 20, 0.75)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: 32,
          marginBottom: 32
        }}>
          <h1 style={{
            fontSize: "clamp(24px, 4vw, 34px)",
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1.25,
            marginBottom: 16
          }}>{post.titulo}</h1>

          <div style={{ display: "flex", gap: 14, alignItems: "center", fontSize: 13, color: "#a09890" }}>
            <div>Por: <strong>{post.autor || "StickFrame"}</strong></div>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#ff6b6b" }} />
            <div>{new Date(post.publicado_em).toLocaleDateString("pt-BR")}</div>
          </div>
        </div>

        {/* Article Content Rendered */}
        <div style={{
          fontSize: 15.5,
          color: "#d0c8c0",
          lineHeight: 1.8,
          whiteSpace: "pre-line"
        }} className="article-body">
          {post.conteudo}
        </div>
      </div>
    </div>
  );
}
