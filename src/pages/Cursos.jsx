import { useState, useEffect } from "react";
import { sb } from "../services/supabase";
import useAppStore from "../store/useAppStore";
import { C } from "../utils/constants";
import Btn from "../components/ui/Btn";
import { printHtml } from "../utils/printHtml";

const MOCK_CURSOS = [
  { id: "c1", titulo: "Introdução ao Light Steel Framing", descricao_curta: "Entenda o básico do sistema construtivo a seco: montagem, perfis e materiais.", descricao_longa: "O Light Steel Framing (LSF) é um sistema construtivo de concepção estrutural (autoportante), composto por perfis formados a frio de aço galvanizado. Neste curso gratuito, você aprenderá as bases técnicas necessárias para começar a atuar e gerenciar obras em LSF.", imagem_capa: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600", preco: 0, plano_incluso: "essencial", gratuito: true, carga_horaria: 8 },
  { id: "c2", titulo: "Orçamento e Planejamento de Steel Frame", descricao_curta: "Aprenda a levantar quantitativos, calcular custos de insumos e margens de lucro.", descricao_longa: "Dominar o orçamento de LSF é essencial para garantir a rentabilidade da sua construtora. Este treinamento abordará o cálculo de perfis de aço por m², fechamento em placas OSB/gesso, modulação e estimativa de mão de obra usando o StickQuote™.", imagem_capa: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600", preco: 297, plano_incluso: "profissional", gratuito: false, carga_horaria: 16 }
];

const MOCK_MODULOS = [
  { id: "m1", curso_id: "c1", titulo: "Módulo 1: Fundamentos do Aço", ordem: 1 },
  { id: "m2", curso_id: "c1", titulo: "Módulo 2: Fechamentos e Isolamento", ordem: 2 },
  { id: "m3", curso_id: "c2", titulo: "Módulo 1: Levantamento de Aço (StickQuote)", ordem: 1 }
];

const MOCK_AULAS = [
  { id: "a1", modulo_id: "m1", titulo: "Aula 1.1 — O que é LSF e histórico", video_url: null, material_url: "https://pdfobject.com/pdf/sample.pdf", duracao_min: 12, ordem: 1 },
  { id: "a2", modulo_id: "m1", titulo: "Aula 1.2 — Tipos de perfis (U e Ue) e normatização", video_url: null, material_url: "https://pdfobject.com/pdf/sample.pdf", duracao_min: 15, ordem: 2 },
  { id: "a3", modulo_id: "m2", titulo: "Aula 2.1 — Placas OSB e Gesso Acartonado", video_url: null, material_url: "https://pdfobject.com/pdf/sample.pdf", duracao_min: 20, ordem: 1 },
  { id: "a4", modulo_id: "m3", titulo: "Aula 1.1 — Integração de projetos BIM", video_url: null, material_url: "https://pdfobject.com/pdf/sample.pdf", duracao_min: 25, ordem: 1 }
];

export default function Cursos() {
  const user = useAppStore(s => s.user);
  const [loading, setLoading] = useState(true);
  const [cursos, setCursos] = useState([]);
  const [cursoAtivo, setCursoAtivo] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [aulaAtiva, setAulaAtiva] = useState(null);
  const [progresso, setProgresso] = useState({});

  useEffect(() => {
    carregarCursos();
  }, []);

  async function carregarCursos() {
    setLoading(true);
    try {
      const { data, error } = await sb.from("cursos").select("*").eq("ativo", true);
      if (!error && data && data.length > 0) {
        setCursos(data);
      } else {
        setCursos(MOCK_CURSOS);
      }
    } catch (e) {
      setCursos(MOCK_CURSOS);
    } finally {
      setLoading(false);
    }
  }

  const iniciarCurso = async (curso) => {
    setLoading(true);
    setCursoAtivo(curso);
    try {
      // 1. Carregar módulos do curso
      let mods = MOCK_MODULOS.filter(m => m.curso_id === curso.id);
      try {
        const { data } = await sb.from("curso_modulos").select("*").eq("curso_id", curso.id).order("ordem");
        if (data && data.length > 0) mods = data;
      } catch (err) {}
      setModulos(mods);

      // 2. Carregar aulas
      const modIds = mods.map(m => m.id);
      let listAulas = MOCK_AULAS.filter(a => modIds.includes(a.modulo_id));
      try {
        const { data } = await sb.from("curso_aulas").select("*").in("modulo_id", modIds).order("ordem");
        if (data && data.length > 0) listAulas = data;
      } catch (err) {}
      setAulas(listAulas);

      // 3. Selecionar primeira aula
      if (listAulas.length > 0) {
        setAulaAtiva(listAulas[0]);
      }

      // 4. Carregar Progresso
      let progMap = {};
      try {
        const { data } = await sb.from("curso_progresso").select("*").eq("usuario_id", user?.uid);
        if (data) {
          data.forEach(p => {
            if (p.concluido) progMap[p.aula_id] = true;
          });
        }
      } catch (err) {
        // Fallback localstorage
        const local = localStorage.getItem(`curso_prog_${curso.id}_${user?.uid}`);
        if (local) progMap = JSON.parse(local);
      }
      setProgresso(progMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleConclusao = async (aulaId) => {
    const updated = { ...progresso };
    const checked = !updated[aulaId];
    
    if (checked) updated[aulaId] = true;
    else delete updated[aulaId];

    setProgresso(updated);
    localStorage.setItem(`curso_prog_${cursoAtivo.id}_${user?.uid}`, JSON.stringify(updated));

    // Salvar no banco
    try {
      if (checked) {
        await sb.from("curso_progresso").upsert({
          usuario_id: user?.uid,
          aula_id: aulaId,
          concluido: true
        });
      } else {
        await sb.from("curso_progresso").delete().eq("usuario_id", user?.uid).eq("aula_id", aulaId);
      }
    } catch (e) {
      console.warn("[LMS] Erro ao salvar progresso.");
    }
  };

  // Estatísticas de progresso
  const totalAulasCurso = aulas.length;
  const concluidasCurso = aulas.filter(a => progresso[a.id]).length;
  const cursoConcluido = totalAulasCurso > 0 && concluidasCurso === totalAulasCurso;
  const pctCurso = totalAulasCurso > 0 ? Math.round((concluidasCurso / totalAulasCurso) * 100) : 0;

  const emitirCertificado = () => {
    const hash = Math.random().toString(36).substring(2, 10).toUpperCase();
    const dataEmissao = new Date().toLocaleDateString("pt-BR");
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Certificado — Conclusão de Treinamento</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Hanken+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Hanken Grotesk',sans-serif;color:#1e1e1e;background:#faf9f6;padding:40px}
  .cert-border{border:20px double #981915;padding:40px;height:520px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;background:#fff;box-shadow:0 8px 30px rgba(0,0,0,0.05)}
  .logo{font-family:'Cinzel',serif;font-weight:700;font-size:24px;color:#981915;letter-spacing:2px;margin-bottom:24px}
  h1{font-family:'Cinzel',serif;font-size:38px;font-weight:700;letter-spacing:1px;color:#26231f;margin-bottom:14px;text-transform:uppercase}
  .lbl{font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#7c7267;margin-bottom:18px}
  .name{font-size:26px;font-weight:800;color:#981915;margin-bottom:14px;border-bottom:1.5px solid #e7e1d8;padding-bottom:6px;min-width:320px;text-align:center}
  .text{font-size:14.5px;color:#57514a;max-width:580px;text-align:center;line-height:1.65;margin-bottom:32px}
  .foot{width:100%;display:flex;justify-content:space-between;margin-top:20px;font-size:11px;color:#8c847a;border-top:1.5px solid #efeae2;padding-top:14px}
  @page{size:landscape A4;margin:0}
</style></head><body>
  <div class="cert-border">
    <div class="logo">STICKFRAME academy</div>
    <div class="lbl">Certificado de Conclusão</div>
    <h1>Concedido a</h1>
    <div class="name">${user?.nome || "Nome do Aluno"}</div>
    <div class="text">
      Por ter concluído com aproveitamento e dedicação o treinamento técnico de <strong>${cursoAtivo.titulo}</strong> com carga horária total de <strong>${cursoAtivo.carga_horaria} horas</strong> em conformidade com as boas práticas recomendadas pelo CBCA (Centro Brasileiro da Construção em Aço).
    </div>
    
    <div class="foot">
      <span>Código de Autenticidade: <b>SF-${hash}</b></span>
      <span>Data de Emissão: <b>${dataEmissao}</b></span>
      <span>Instrutor Responsável: <b>Eng. André Queiroz</b></span>
    </div>
  </div>
</body></html>`;

    printHtml(html, `certificado-${cursoAtivo.id}`);
  };

  return (
    <div>
      {/* List Page */}
      {!cursoAtivo ? (
        <div>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Treinamentos e Cursos Acadêmicos</h2>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Aprimore seus conhecimentos e capacite seus montadores e engenheiros em LSF.</p>
          </div>

          {loading ? (
            <div style={{ color: C.muted, fontSize: 13, padding: "20px 0", textAlign: "center" }}>Carregando treinamentos...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              {cursos.map(c => (
                <div
                  key={c.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    borderRadius: 14,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column"
                  }}
                >
                  <div style={{ height: 160, overflow: "hidden" }}>
                    <img src={c.imagem_capa} alt={c.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: 18, flex: 1, display: "flex", flexDirection: "column" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>{c.titulo}</h3>
                    <p style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.45, flex: 1, marginBottom: 18 }}>{c.descricao_curta}</p>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line-2)", paddingTop: 12 }}>
                      <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                        🕒 <strong>{c.carga_horaria}h</strong> aula
                        {c.gratuito ? (
                          <span style={{ marginLeft: 8, color: "#3f7a4b", fontWeight: 700 }}>Gratuito</span>
                        ) : (
                          <span style={{ marginLeft: 8, color: C.red, fontWeight: 700 }}>Profissional</span>
                        )}
                      </div>
                      <Btn onClick={() => iniciarCurso(c)}>Iniciar Curso</Btn>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Lesson View Page */
        <div>
          {/* Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 14,
            borderBottom: "1px solid var(--line)",
            marginBottom: 20
          }}>
            <button
              onClick={() => { setCursoAtivo(null); setAulaAtiva(null); }}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                color: C.muted,
                cursor: "pointer",
                fontFamily: "inherit"
              }}
            >
              ← Voltar aos Cursos
            </button>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{cursoAtivo.titulo}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Progresso: {concluidasCurso} de {totalAulasCurso} aulas ({pctCurso}%)</div>
            </div>
          </div>

          {/* Grid Layout: Lecture Video + Sidebar */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "flex-start" }}>
            
            {/* Video & Lesson Content */}
            <div>
              {aulaAtiva ? (
                <div>
                  {/* YouTube Iframe Container */}
                  {aulaAtiva.video_url ? (
                    <div style={{
                      position: "relative",
                      paddingBottom: "56.25%",
                      height: 0,
                      borderRadius: 14,
                      overflow: "hidden",
                      background: "#000",
                      border: "1px solid var(--line)"
                    }}>
                      <iframe
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                        src={aulaAtiva.video_url}
                        title={aulaAtiva.titulo}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    <div style={{
                      height: 280,
                      borderRadius: 14,
                      background: "var(--surface)",
                      border: "1.5px dashed var(--line)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                      padding: 24,
                      textAlign: "center"
                    }}>
                      <div style={{ fontSize: 44 }}>📖</div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>Material de Leitura Construtiva</h3>
                      <p style={{ fontSize: 13, color: "var(--muted)", maxWidth: 380, lineHeight: 1.5 }}>
                        Esta aula não possui vídeo gravado. Estude o conteúdo por meio do material de apoio e da apostila técnica recomendada para este módulo no anexo abaixo.
                      </p>
                    </div>
                  )}

                  {/* Lesson Metadata */}
                  <div style={{ marginTop: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h2 style={{ fontSize: 18, fontWeight: 800 }}>{aulaAtiva.titulo}</h2>
                      
                      {/* Checkbox Complete */}
                      <button
                        onClick={() => toggleConclusao(aulaAtiva.id)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: `1.5px solid ${progresso[aulaAtiva.id] ? "#3f7a4b" : C.border}`,
                          background: progresso[aulaAtiva.id] ? "#3f7a4b20" : "transparent",
                          color: progresso[aulaAtiva.id] ? "#3f7a4b" : C.muted,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "inherit"
                        }}
                      >
                        {progresso[aulaAtiva.id] ? "✓ Concluída" : "Marcar como Concluída"}
                      </button>
                    </div>

                    <p style={{ fontSize: 13.5, color: C.muted, marginTop: 10, lineHeight: 1.5 }}>
                      Duração recomendada de {aulaAtiva.duracao_min} minutos. Certifique-se de baixar o material complementar em anexo antes de realizar as atividades de montagem.
                    </p>

                    {/* Material complementar link */}
                    {aulaAtiva.material_url && (
                      <div style={{ marginTop: 14, background: "var(--surface-2)", border: "1px dashed var(--line)", padding: "12px 16px", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>📄 Material de Apoio (Apostila Técnica PDF)</span>
                        <a href={aulaAtiva.material_url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                          <Btn variant="ghost" style={{ fontSize: 11.5, padding: "5px 12px" }}>Download</Btn>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Nenhuma aula ativa.</div>
              )}
            </div>

            {/* Sidebar Lessons Checklist */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              
              {/* Certificate widget if completed */}
              {cursoConcluido && (
                <div style={{
                  background: "linear-gradient(135deg, #1c3d25 0%, #0e2013 100%)",
                  border: "1.5px solid #22c55e40",
                  borderRadius: 14,
                  padding: 16,
                  color: "#fff",
                  textAlign: "center",
                  boxShadow: "0 6px 20px rgba(34,197,94,0.15)"
                }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>🎓</div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 4 }}>Treinamento Concluído!</h3>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 12 }}>Você atingiu 100% de aproveitamento das aulas.</p>
                  <button
                    onClick={emitirCertificado}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "#22c55e",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      boxShadow: "0 4px 10px rgba(34,197,94,0.4)"
                    }}
                  >
                    Imprimir Certificado
                  </button>
                </div>
              )}

              {/* Module and lessons tree */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Grade de Aulas</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {modulos.map(mod => {
                    const modAulas = aulas.filter(a => a.modulo_id === mod.id);
                    return (
                      <div key={mod.id}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>{mod.titulo}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {modAulas.map(aula => {
                            const ativa = aulaAtiva?.id === aula.id;
                            const done = !!progresso[aula.id];
                            return (
                              <div
                                key={aula.id}
                                onClick={() => setAulaAtiva(aula)}
                                style={{
                                  padding: "8px 10px",
                                  borderRadius: 8,
                                  background: ativa ? "rgba(152,25,21,0.06)" : "transparent",
                                  border: `1.5px solid ${ativa ? C.red + "25" : "transparent"}`,
                                  cursor: "pointer",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center"
                                }}
                              >
                                <span style={{
                                  fontSize: 12,
                                  fontWeight: ativa ? 700 : 400,
                                  color: ativa ? C.red : "var(--ink)"
                                }}>{aula.titulo}</span>
                                <span style={{
                                  fontSize: 10,
                                  color: done ? "#3f7a4b" : "var(--muted)",
                                  fontWeight: done ? 700 : 400
                                }}>
                                  {done ? "✓ Feito" : `⏱ ${aula.duracao_min}m`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
