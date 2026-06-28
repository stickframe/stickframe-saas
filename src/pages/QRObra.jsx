import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { sb } from "../services/supabase";
import { registrarCheckin, listarCheckinsDia } from "../services/repositories/checkinRepository";
import { LOGO_STICKFRAME, storageUrl, bimUrl } from "../utils/cdn";
import { cachePlanta, getPlantaOffline, getPlantasDaObra } from "../services/offlineDB";

const C = {
  red: "#981915", border: "#e5e7eb", muted: "#6b7280",
  success: "#3f7a4b", warning: "#b07a1e", text: "#1a1a1a",
  dark: "#f5f5f7", surface: "#ffffff",
};

const FASE_COR = {
  "Projeto executivo": "#3b6ea5", "Fundação": "#b07a1e",
  "Estrutura Steel Frame": "#981915", "Fechamentos": "#7c3aed",
  "Instalações": "#0891b2", "Cobertura": "#059669",
  "Acabamento": "#ea580c", "Entrega": "#3f7a4b",
};

const FUNCOES = ["Montador Steel Frame","Eletricista","Encanador","Pedreiro","Carpinteiro","Pintor","Ajudante","Outro"];

function Tab({ label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "12px 4px", border: "none", background: "none",
      borderBottom: `3px solid ${active ? C.red : "transparent"}`,
      color: active ? C.red : C.muted, fontSize: 12, fontWeight: active ? 700 : 500,
      cursor: "pointer", fontFamily: "inherit", position: "relative",
    }}>
      {label}
      {badge > 0 && <span style={{ position: "absolute", top: 6, right: "50%", transform: "translateX(60%)", background: C.red, color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{badge}</span>}
    </button>
  );
}

function StatusBadge({ status }) {
  const CORES = { "Em andamento": C.success, "Pausada": C.warning, "Concluída": "#2563eb", "Planejamento": C.muted };
  const cor = CORES[status] || C.muted;
  return <span style={{ background: cor + "22", color: cor, border: `1px solid ${cor}44`, borderRadius: 10, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{status}</span>;
}

//  Aba Status 
function AbaStatus({ obra }) {
  const progresso = Number(obra.progresso || 0);
  const prazoFim = obra.prazo_fim ? new Date(obra.prazo_fim + "T00:00") : null;
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const diasRestantes = prazoFim ? Math.ceil((prazoFim - hoje) / (1000*60*60*24)) : null;
  const faseCor = FASE_COR[obra.fase] || C.red;

  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Progresso */}
      <div style={{ background: C.surface, borderRadius: 14, padding: "18px 16px", border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Progresso físico</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: progresso >= 80 ? C.success : C.text }}>{progresso}%</div>
        </div>
        <div style={{ height: 10, borderRadius: 5, background: C.border, overflow: "hidden" }}>
          <div style={{ width: `${progresso}%`, height: "100%", background: progresso >= 80 ? C.success : C.red, borderRadius: 5, transition: "width .5s" }} />
        </div>
        {obra.fase && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: faseCor, display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: faseCor }}>Fase atual: {obra.fase}</span>
          </div>
        )}
      </div>

      {/* Prazo */}
      {prazoFim && (
        <div style={{ background: diasRestantes < 0 ? C.red + "15" : diasRestantes <= 14 ? "#fffbeb" : "#f0fdf4", borderRadius: 14, padding: "14px 16px", border: `1px solid ${diasRestantes < 0 ? C.red + "33" : diasRestantes <= 14 ? "#fde68a" : "#bbf7d0"}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>PRAZO DE ENTREGA</div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{prazoFim.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: diasRestantes < 0 ? C.red : diasRestantes <= 14 ? C.warning : C.success }}>
            {diasRestantes < 0 ? ` ${Math.abs(diasRestantes)} dias de atraso` : diasRestantes === 0 ? " Entrega hoje!" : ` ${diasRestantes} dias restantes`}
          </div>
        </div>
      )}

      {/* Info */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {[
          obra.cliente && ["Cliente", obra.cliente],
          obra.endereco && ["Endereço", obra.endereco],
          obra.area && ["Área", `${obra.area} m²`],
          obra.status && ["Status", <StatusBadge key="st" status={obra.status} />],
        ].filter(Boolean).map(([label, value], i, arr) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

//  Aba Projetos 
function AbaProjetos({ arquivos, obraId }) {
  const DISC_ICONE = { "Arquitetônico": "", "Estrutural": "", "Steel Frame": "", "Elétrico": "", "Hidráulico": "", "AVAC": "", "Fundação": "" };

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheStatus, setCacheStatus] = useState({});

  useEffect(() => {
    function handleOnline() { setIsOnline(true); }
    function handleOffline() { setIsOnline(false); }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!arquivos.length) return;
    // Check which are already cached
    getPlantasDaObra(obraId).then((cached) => {
      const cachedIds = new Set(cached.map((c) => c.id));
      const initial = {};
      arquivos.forEach((a) => {
        initial[a.id] = cachedIds.has(a.id) ? "cached" : "unavailable";
      });
      setCacheStatus(initial);
    }).catch(e => console.warn("[QRObra] cacheStatus:", e));
  }, [arquivos, obraId]);

  useEffect(() => {
    if (!isOnline || !arquivos.length) return;
    arquivos.forEach((a) => {
      const url = storageUrl(a.storage_path);
      setCacheStatus((prev) => ({ ...prev, [a.id]: prev[a.id] === "cached" ? "cached" : "caching" }));
      cachePlanta({ id: a.id, obraId, nome: a.nome, revisao: a.revisao, url, storagePath: a.storage_path })
        .then((ok) => setCacheStatus((prev) => ({ ...prev, [a.id]: ok ? "cached" : "unavailable" })))
        .catch(() => setCacheStatus((prev) => ({ ...prev, [a.id]: "unavailable" })));
    });
  }, [isOnline, arquivos, obraId]);

  async function abrirPlanta(arquivo) {
    const url = storageUrl(arquivo.storage_path);
    if (navigator.onLine) {
      window.open(url, "_blank");
    } else {
      const blobUrl = await getPlantaOffline(arquivo.id);
      if (blobUrl) window.open(blobUrl, "_blank");
      else console.warn("Planta não disponível offline");
    }
  }

  if (arquivos.length === 0) {
    return (
      <div style={{ padding: "48px 20px", textAlign: "center", color: C.muted }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}></div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Nenhum projeto disponível</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>Os documentos técnicos aparecerão aqui quando forem publicados.</div>
      </div>
    );
  }

  // Agrupar por disciplina
  const grupos = arquivos.reduce((acc, a) => {
    const disc = a.disciplina || "Geral";
    if (!acc[disc]) acc[disc] = [];
    acc[disc].push(a);
    return acc;
  }, {});

  const STATUS_ICON = { caching: "", cached: "", unavailable: "" };

  return (
    <div style={{ padding: "16px" }}>
      {!isOnline && (
        <div style={{ background: "#1e293b", color: "#94a3b8", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <span></span> Modo offline — exibindo arquivos em cache
        </div>
      )}
      {Object.entries(grupos).map(([disc, arqs]) => (
        <div key={disc} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span>{DISC_ICONE[disc] || ""}</span> {disc}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {arqs.map((a) => {
              const isPdf = a.tipo === "pdf" || a.nome?.toLowerCase().endsWith(".pdf");
              const status = cacheStatus[a.id];
              return (
                <button key={a.id} onClick={() => abrirPlanta(a)} style={{ display: "flex", alignItems: "center", gap: 12, background: C.surface, borderRadius: 12, padding: "12px 14px", border: `1px solid ${C.border}`, textDecoration: "none", color: C.text, cursor: "pointer", fontFamily: "inherit", textAlign: "left", width: "100%" }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{isPdf ? "" : ""}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {a.revisao && <span style={{ background: "#3b6ea518", color: "#3b6ea5", borderRadius: 4, padding: "1px 6px", fontWeight: 700, marginRight: 6 }}>{a.revisao}</span>}
                      {a.tamanho} · {a.data}
                    </div>
                  </div>
                  <span style={{ fontSize: 16, flexShrink: 0 }} title={status}>{STATUS_ICON[status] || ""}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

//  Aba BIM 
function AbaBIM({ modelos }) {
  if (modelos.length === 0) {
    return (
      <div style={{ padding: "48px 20px", textAlign: "center", color: C.muted }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}></div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Nenhum modelo 3D disponível</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>Os modelos BIM aparecerão aqui quando forem importados.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "#1a1a2e", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 20 }}></span>
        <div style={{ fontSize: 12, color: "#a5b4fc", lineHeight: 1.5 }}>Para visualização 3D completa, acesse o sistema no computador. Aqui você pode baixar os arquivos IFC.</div>
      </div>
      {modelos.map((m) => (
        <a key={m.id} href={bimUrl(m.storage_path)} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, background: C.surface, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.border}`, textDecoration: "none", color: C.text }}>
          <span style={{ fontSize: 28 }}></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{m.nome}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Arquivo IFC · {new Date(m.created_at).toLocaleDateString("pt-BR")}</div>
          </div>
          <span style={{ fontSize: 18, color: C.red }}>↓</span>
        </a>
      ))}
    </div>
  );
}

//  Aba Check-in 
function AbaCheckin({ obraId }) {
  const [checkins, setCheckins] = useState([]);
  const [nome,     setNome]     = useState("");
  const [funcao,   setFuncao]   = useState("Montador Steel Frame");
  const [enviando, setEnviando] = useState(false);
  const [sucesso,  setSucesso]  = useState(false);
  const [erro,     setErro]     = useState(null);

  useEffect(() => {
    listarCheckinsDia(obraId).then(setCheckins).catch(e => console.warn("[QRObra] checkins:", e));
  }, [obraId]);

  async function registrar() {
    if (!nome.trim()) return;
    setEnviando(true); setErro(null);
    try {
      const novo = await registrarCheckin({ obra_id: obraId, nome_operario: nome.trim(), funcao });
      setCheckins((p) => [novo, ...p]);
      setSucesso(true); setNome("");
      setTimeout(() => setSucesso(false), 4000);
    } catch (e) { setErro("Erro: " + e.message); }
    finally { setEnviando(false); }
  }

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: C.surface, borderRadius: 14, padding: 20, border: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Registrar Presença</div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>SEU NOME *</div>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João da Silva" onKeyDown={(e) => e.key === "Enter" && registrar()}
            style={{ width: "100%", padding: "13px 14px", borderRadius: 10, fontSize: 16, border: `1px solid ${C.border}`, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>FUNÇÃO</div>
          <select value={funcao} onChange={(e) => setFuncao(e.target.value)}
            style={{ width: "100%", padding: "13px 14px", borderRadius: 10, fontSize: 15, border: `1px solid ${C.border}`, outline: "none", background: C.surface, fontFamily: "inherit" }}>
            {FUNCOES.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
        {erro && <div style={{ background: C.red + "15", color: C.red, border: `1px solid ${C.red}33`, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>{erro}</div>}
        {sucesso && <div style={{ background: "#f0fdf4", color: C.success, borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600, marginBottom: 12 }}> Presença registrada!</div>}
        <button onClick={registrar} disabled={enviando || !nome.trim()}
          style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: !nome.trim() || enviando ? "#ccc" : C.red, color: "#fff", fontSize: 15, fontWeight: 700, cursor: nome.trim() && !enviando ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
          {enviando ? "Registrando..." : " Registrar Entrada"}
        </button>
      </div>

      {checkins.length > 0 && (
        <div style={{ background: C.surface, borderRadius: 14, padding: 18, border: `1px solid ${C.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
            <span>Presenças hoje</span>
            <span style={{ background: C.red + "22", color: C.red, borderRadius: 12, padding: "2px 10px", fontSize: 12 }}>{checkins.length}</span>
          </div>
          {checkins.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.dark, borderRadius: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.red, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                {c.nome_operario[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.nome_operario}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{c.funcao}</div>
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>{new Date(c.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Itens de qualidade por etapa Steel Frame
const CHECKLIST_ITEMS = {
  "Projeto executivo": [
    "Projeto arquitetônico aprovado pela prefeitura",
    "ART/RRT emitida e assinada pelo responsável técnico",
    "Memorial descritivo entregue ao cliente",
    "Projeto estrutural Steel Frame compatibilizado",
    "Projetos complementares (elétrico, hidráulico) entregues",
    "Sondagem do terreno realizada",
  ],
  "Fundação": [
    "Locação da obra executada e conferida",
    "Radier/sapatas executados conforme projeto",
    "Cura do concreto realizada (mínimo 7 dias)",
    "Nivelamento e prumo dos chumbadores verificados",
    "Impermeabilização da fundação aplicada",
    "Aterro e compactação do entorno executados",
  ],
  "Estrutura Steel Frame": [
    "Perfis guia (U enrijecido) fixados conforme projeto",
    "Espaçamento dos montantes (600mm ou conforme projeto)",
    "Prumo e nível de todos os montantes verificados",
    "Contraventamentos (fitas diagonais) instalados",
    "Fixações com parafusos e torque corretos",
    "Aberturas de portas e janelas com vergas duplas",
    "Vistoria estrutural realizada pelo responsável técnico",
    "Laje seca (dry floor) assentada e nivelada",
  ],
  "Fechamentos": [
    "Placas OSB externas instaladas e fixadas",
    "Barreiras de vapor aplicadas corretamente",
    "Lã de rocha/vidro nos painéis isolados",
    "Placas de gesso (drywall) internas instaladas",
    "Esquadrias fixadas, niveladas e vedadas",
    "Impermeabilização de fachada aplicada",
    "Cobertura executada (estrutura + telha)",
    "Calhas e rufos instalados",
  ],
  "Instalações": [
    "Eletrodutos e eletrofitas posicionados nos montantes",
    "Instalação elétrica aprovada pelo eletricista",
    "Pontos hidráulicos PEX/CPVC embutidos",
    "Instalação hidráulica testada (pressão 24h)",
    "Passagens de dutos de AVAC executadas",
    "Caixas de inspeção e registros instalados",
    "Aterramento elétrico executado",
  ],
  "Acabamento": [
    "Massa e pintura interna concluídos",
    "Pintura externa e textura aplicados",
    "Pisos e revestimentos assentados e rejuntados",
    "Rodapés, soleiras e peitoris instalados",
    "Louças e metais sanitários instalados",
    "Tomadas, interruptores e luminárias instalados",
    "Portas e janelas reguladas e com ferragens",
    "Limpeza final executada",
  ],
  "Entrega": [
    "Vistoria final realizada e aprovada",
    "Manual do proprietário entregue",
    "Chaves, senhas e documentação técnica entregues",
    "Termo de entrega assinado pelo cliente",
    "Habite-se ou CND emitidos (quando aplicável)",
    "Fotos do estado final arquivadas",
  ],
};

const FASES = [
  "Projeto executivo",
  "Fundação",
  "Estrutura Steel Frame",
  "Fechamentos",
  "Instalações",
  "Acabamento",
  "Entrega"
];

const STATUS_LABEL = { pendente: "Pendente", ok: "OK", nao_ok: "Não OK" };
const STATUS_COR   = { pendente: C.muted, ok: "#3f7a4b", nao_ok: C.red };
const STATUS_BG    = { pendente: C.dark, ok: "#e8f7ef", nao_ok: "#fdecea" };

function AbaChecklist({ obraId, initialEtapa }) {
  const [etapa, setEtapa] = useState(FASES[0]);
  const [itens, setItens] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (initialEtapa && FASES.includes(initialEtapa)) {
      setEtapa(initialEtapa);
    }
  }, [initialEtapa]);

  useEffect(() => {
    if (obraId) {
      setLoading(true);
      sb.rpc("qr_get_checklist", { p_obra_id: obraId })
        .then(({ data, error }) => {
          if (!error && data) {
            const map = {};
            data.forEach((r) => {
              map[`${r.etapa}|${r.item}`] = { status: r.status, obs: r.obs || "" };
            });
            setItens(map);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [obraId]);

  const getItem = (etapa, item) => itens[`${etapa}|${item}`] || { status: "pendente", obs: "" };

  async function toggleStatus(item) {
    if (!obraId) return;
    const key = `${etapa}|${item}`;
    const atual = itens[key]?.status || "pendente";
    const proximo = atual === "pendente" ? "ok" : atual === "ok" ? "nao_ok" : "pendente";

    setItens((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), status: proximo } }));
    setSaving(key);
    try {
      const { error } = await sb.rpc("qr_save_checklist_item", {
        p_obra_id: obraId,
        p_etapa: etapa,
        p_item: item,
        p_status: proximo,
        p_obs: itens[key]?.obs || ""
      });
      if (error) throw error;
    } catch (e) {
      console.error(e);
      console.error("Erro ao salvar:", e.message);
      setItens((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), status: atual } }));
    } finally {
      setSaving(null);
    }
  }

  const itemsEtapa = CHECKLIST_ITEMS[etapa] || [];

  if (loading) return <div style={{ padding: 24, textAlign: "center", color: C.muted }}>Carregando checklist...</div>;

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Seletor de Etapas */}
      <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 8, marginBottom: 4 }}>
        {FASES.map((f) => {
          const ativa = etapa === f;
          return (
            <button
              key={f}
              onClick={() => setEtapa(f)}
              style={{
                padding: "6px 12px", borderRadius: 16, fontSize: 11, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${ativa ? C.red : C.border}`,
                background: ativa ? C.red : C.surface,
                color: ativa ? "#fff" : C.text,
                whiteSpace: "nowrap", fontFamily: "inherit"
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Lista de itens */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", background: C.dark, borderBottom: `1px solid ${C.border}`, fontSize: 13, fontWeight: 700 }}>
          {etapa}
        </div>
        {itemsEtapa.map((item) => {
          const key = `${etapa}|${item}`;
          const dado = getItem(etapa, item);
          const st = dado.status;
          return (
            <div
              key={item}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderBottom: "1px solid " + C.border,
                background: STATUS_BG[st],
                transition: "background .2s",
              }}
            >
              {/* Botão de Toggle */}
              <button
                onClick={() => toggleStatus(item)}
                disabled={saving === key}
                style={{
                  width: 28, height: 28, borderRadius: "50%", border: "none",
                  background: STATUS_COR[st] + "22", color: STATUS_COR[st],
                  fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontWeight: 700, fontFamily: "inherit"
                }}
              >
                {st === "ok" ? "" : st === "nao_ok" ? "" : ""}
              </button>
              
              <div style={{ flex: 1, fontSize: 12.5, color: st === "nao_ok" ? C.red : C.text }}>
                {item}
              </div>

              <span style={{
                fontSize: 9.5, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                background: STATUS_COR[st] + "22", color: STATUS_COR[st], whiteSpace: "nowrap",
              }}>
                {STATUS_LABEL[st]}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 4 }}>
        Toque no círculo para alternar:  Pendente   OK   Não OK
      </div>
    </div>
  );
}

//  Principal 
export default function QRObra() {
  const { obraId } = useParams();
  const [dados,   setDados]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro,    setErro]    = useState(null);
  const [tab,     setTab]     = useState("status");
  const [initialEtapa, setInitialEtapa] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const etapaParam = params.get("etapa");
    if (tabParam && ["status", "projetos", "bim", "checkin", "checklist"].includes(tabParam)) {
      setTab(tabParam);
    }
    if (etapaParam) {
      setInitialEtapa(etapaParam);
    }
  }, []);

  useEffect(() => {
    if (!obraId) { setErro("ID de obra inválido."); setLoading(false); return; }
    sb.rpc("qr_get_obra_dados", { p_obra_id: obraId })
      .then(({ data, error }) => {
        if (error || !data) { setErro("Obra não encontrada."); return; }
        setDados(data);
      })
      .catch(() => setErro("Erro ao carregar."))
      .finally(() => setLoading(false));
  }, [obraId]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${C.red}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ color: C.muted, fontSize: 13 }}>Carregando...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (erro || !dados) return (
    <div style={{ minHeight: "100vh", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}></div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{erro || "Obra não encontrada"}</div>
        <div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>Verifique o QR code e tente novamente.</div>
      </div>
    </div>
  );

  const { obra, arquivos, bim_modelos } = dados;

  return (
    <div style={{ minHeight: "100vh", background: C.dark, fontFamily: "Inter, system-ui, sans-serif", paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ background: C.red, padding: "20px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <img src={LOGO_STICKFRAME} alt="Stick Frame" style={{ height: 28, filter: "brightness(0) invert(1)", borderRadius: 4 }} onError={(e) => { e.target.style.display = "none"; }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#ffffff99", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>STICKFRAME · OBRA</div>
            <div style={{ color: "#fff", fontSize: 17, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{obra.nome}</div>
          </div>
          <StatusBadge status={obra.status} />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "rgba(0,0,0,0.15)", borderRadius: "10px 10px 0 0", overflow: "hidden", overflowX: "auto" }}>
          <Tab label=" Status"   active={tab === "status"}   onClick={() => setTab("status")} />
          <Tab label=" Projetos" active={tab === "projetos"} onClick={() => setTab("projetos")} badge={arquivos.length} />
          <Tab label=" BIM"      active={tab === "bim"}      onClick={() => setTab("bim")} badge={bim_modelos.length} />
          <Tab label=" Check-in"  active={tab === "checkin"}  onClick={() => setTab("checkin")} />
          <Tab label=" Checklist" active={tab === "checklist"} onClick={() => setTab("checklist")} />
        </div>
      </div>

      {/* Conteúdo da aba */}
      <div style={{ maxWidth: 540, margin: "0 auto" }}>
        {tab === "status"   && <AbaStatus obra={obra} />}
        {tab === "projetos" && <AbaProjetos arquivos={arquivos} obraId={obraId} />}
        {tab === "bim"      && <AbaBIM modelos={bim_modelos} />}
        {tab === "checkin"  && <AbaCheckin obraId={obraId} />}
        {tab === "checklist" && <AbaChecklist obraId={obraId} initialEtapa={initialEtapa} />}
      </div>

      <div style={{ textAlign: "center", color: C.muted, fontSize: 10, letterSpacing: 1, marginTop: 24, textTransform: "uppercase" }}>
        Powered by Stickframe · {new Date().toLocaleDateString("pt-BR")}
      </div>
    </div>
  );
}
