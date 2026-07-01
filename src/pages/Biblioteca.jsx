import { useState, useEffect } from "react";
import { sb } from "../services/supabase";
import useAppStore from "../store/useAppStore";
import { C } from "../utils/constants";
import Btn from "../components/ui/Btn";
import Modal from "../components/ui/Modal";

const MOCK_DOCS = [
  { id: "d1", titulo: "Manual CBCA — Estruturas em Light Steel Framing", descricao: "Guia oficial do Centro Brasileiro da Construção em Aço com diretrizes completas de dimensionamento e projeto de LSF.", categoria: "Manuais de Montagem", file_url: "https://www.cbca-acobrasil.org.br/site/arquivos/downloads/livro-light-steel-framing.pdf", thumbnail_url: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=200", plano_minimo: "essencial" },
  { id: "d2", titulo: "Manual de Detalhes Construtivos LSF", descricao: "Detalhamento técnico de ligações, interfaces de fundação, contraventamento e painéis.", categoria: "Especificações", file_url: "https://www.cbca-acobrasil.org.br/site/arquivos/downloads/detalhes-lsf.pdf", thumbnail_url: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=200", plano_minimo: "profissional" },
  { id: "d3", titulo: "NR-18 — Segurança e Saúde no Trabalho na Indústria da Construção", descricao: "Norma Regulamentadora completa aplicada à construção de estruturas metálicas e Steel Frame.", categoria: "Normas NR", file_url: "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/normas-regulamentadoras/nr-18.pdf", thumbnail_url: "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=200", plano_minimo: "essencial" },
  { id: "d4", titulo: "Diretrizes SINAT 003 — Sistemas Construtivos em Perfis Leves de Aço", descricao: "Diretrizes nacionais para avaliação técnica de sistemas construtivos inovadores de LSF.", categoria: "Especificações", file_url: "https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/pbqp-h/documentos-sinat/diretriz-sinat-003.pdf", thumbnail_url: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=200", plano_minimo: "construtora" },
  { id: "d5", titulo: "Treinamentos Placo Ensina — Construção Seca", descricao: "Portal de capacitação profissional e cursos de montagem de drywall e steel frame ministrados pela Placo Saint-Gobain.", categoria: "Manuais de Montagem", file_url: "https://www.placo.com.br/placo-ensina", thumbnail_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200", plano_minimo: "free" }
];

const PLAN_LEVELS = {
  free: 0,
  essencial: 1,
  pro: 2,
  profissional: 2,
  construtora: 3,
  enterprise: 3
};

function temPermissao(planoUser = "free", planoMin = "essencial") {
  const pUser = String(planoUser).toLowerCase().trim();
  const pMin = String(planoMin).toLowerCase().replace("+", "").trim();
  
  const userLvl = PLAN_LEVELS[pUser] != null ? PLAN_LEVELS[pUser] : 0;
  const minLvl = PLAN_LEVELS[pMin] != null ? PLAN_LEVELS[pMin] : 1;
  
  return userLvl >= minLvl;
}

export default function Biblioteca() {
  const user = useAppStore(s => s.user);
  const userPlano = user?.plano || "free";
  
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [catFiltro, setCatFiltro] = useState("Todos");
  const [bloqueioModal, setBloqueioModal] = useState(null);

  useEffect(() => {
    carregarDocs();
  }, []);

  async function carregarDocs() {
    setLoading(true);
    try {
      const { data, error } = await sb
        .from("biblioteca_docs")
        .select("*")
        .order("titulo");

      if (!error && data && data.length > 0) {
        setDocs(data);
      } else {
        setDocs(MOCK_DOCS);
      }
    } catch (e) {
      setDocs(MOCK_DOCS);
    } finally {
      setLoading(false);
    }
  }

  const categorias = ["Todos", ...new Set(docs.map(d => d.categoria).filter(Boolean))];

  const filtrados = docs.filter(d => {
    const matchBusca = !busca || d.titulo?.toLowerCase().includes(busca.toLowerCase()) || d.descricao?.toLowerCase().includes(busca.toLowerCase());
    const matchCat = catFiltro === "Todos" || d.categoria === catFiltro;
    return matchBusca && matchCat;
  });

  const abrirDocumento = (doc) => {
    if (temPermissao(userPlano, doc.plano_minimo)) {
      window.open(doc.file_url, "_blank");
    } else {
      setBloqueioModal(doc);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Biblioteca Técnica Integrada</h2>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Manuais CBCA, diretrizes técnicas, normas NRs e materiais de referência.</p>
        </div>
        <div style={{
          background: "var(--surface-2)",
          border: "1px solid var(--line)",
          padding: "6px 14px",
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 700
        }}>
          Plano Atual: <span style={{ color: C.red, textTransform: "uppercase" }}>{userPlano}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{
        display: "flex",
        gap: 12,
        marginBottom: 24,
        alignItems: "center",
        flexWrap: "wrap"
      }}>
        {/* Search */}
        <div style={{
          display: "flex",
          alignItems: "center",
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 10,
          padding: "8px 12px",
          flex: "1 1 280px",
          maxWidth: 360,
          gap: 8
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar manuais, NRs ou diretrizes..."
            style={{ border: "none", background: "none", outline: "none", fontFamily: "inherit", fontSize: 13.5, color: "var(--ink)", width: "100%" }}
          />
        </div>

        {/* Categories Selector */}
        {categorias.map(c => (
          <button
            key={c}
            onClick={() => setCatFiltro(c)}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 11.5,
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: catFiltro === c ? 700 : 400,
              border: `1px solid ${catFiltro === c ? C.red : C.border}`,
              background: catFiltro === c ? C.red + "18" : "transparent",
              color: catFiltro === c ? C.red : C.muted
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid of Documents */}
      {loading ? (
        <div style={{ color: C.muted, fontSize: 13, padding: "20px 0", textAlign: "center" }}>Carregando biblioteca...</div>
      ) : filtrados.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 13, padding: "20px 0", textAlign: "center" }}>Nenhum manual de referência localizado.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtrados.map(d => {
            const aceito = temPermissao(userPlano, d.plano_minimo);
            return (
              <div
                key={d.id}
                onClick={() => abrirDocumento(d)}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: 14,
                  overflow: "hidden",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  transition: "transform .15s, border-color .15s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = C.red + "40";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = "var(--line)";
                }}
              >
                {/* PDF Thumbnail */}
                <div style={{ height: 130, background: "var(--surface-2)", overflow: "hidden", position: "relative" }}>
                  <img
                    src={d.thumbnail_url || "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=200"}
                    alt={d.titulo}
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: aceito ? 1 : 0.4 }}
                  />
                  {/* Category overlay */}
                  <span style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    fontSize: 9.5,
                    fontWeight: 700,
                    background: "rgba(0,0,0,0.65)",
                    color: "#fff",
                    borderRadius: 4,
                    padding: "2px 6px"
                  }}>{d.categoria}</span>

                  {/* Lock icon overlay if not allowed */}
                  {!aceito && (
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.4)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}>
                      <div style={{ fontSize: 20 }}>🔒</div>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: C.red,
                        color: "#fff",
                        padding: "2px 8px",
                        borderRadius: 4,
                        textTransform: "uppercase"
                      }}>Bloqueado</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column" }}>
                  <h3 style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.35, marginBottom: 6 }}>{d.titulo}</h3>
                  <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.45, flex: 1 }}>{d.descricao}</p>
                  
                  <div style={{
                    borderTop: "1px solid var(--line-2)",
                    paddingTop: 10,
                    marginTop: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 11
                  }}>
                    <span style={{ color: "var(--muted)" }}>Plano mínimo: <strong style={{ textTransform: "uppercase", color: "var(--ink)" }}>{d.plano_minimo}</strong></span>
                    <span style={{ color: aceito ? C.red : "var(--muted)", fontWeight: 700 }}>
                      {aceito ? "Acessar PDF →" : "Bloqueado"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upgrade conversion modal */}
      {bloqueioModal && (
        <Modal title="Upgrade de Plano Necessário" onClose={() => setBloqueioModal(null)}>
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>Recurso Exclusivo</h3>
            <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, maxWidth: 320, margin: "0 auto 20px" }}>
              O documento <strong>{bloqueioModal.titulo}</strong> está disponível apenas para assinantes do plano <strong style={{ textTransform: "uppercase", color: C.red }}>{bloqueioModal.plano_minimo}</strong> ou superior.
            </p>

            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn variant="ghost" onClick={() => setBloqueioModal(null)}>Voltar</Btn>
              <Btn onClick={() => {
                setBloqueioModal(null);
                // Redirect or open checkout trial
                window.location.hash = "#/planos";
                // Trigger page refresh if necessary, or let route transition handle it
              }}>Fazer Upgrade de Plano</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
