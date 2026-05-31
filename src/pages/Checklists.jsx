import { useState, useEffect, useCallback } from "react";
import { useToast } from "../hooks/useToast";
import { C, FASES } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import Select from "../components/ui/Select";

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

const STATUS_ITEM = ["pendente", "ok", "nao_ok"];
const STATUS_LABEL = { pendente: "Pendente", ok: "OK", nao_ok: "Não OK" };
const STATUS_COR   = { pendente: C.muted, ok: "#2e9e5b", nao_ok: C.danger };
const STATUS_BG    = { pendente: C.dark, ok: "#e8f7ef", nao_ok: "#fdecea" };

function ProgressBar({ valor, total }) {
  const pct = total === 0 ? 0 : Math.round((valor / total) * 100);
  const cor  = pct === 100 ? "#2e9e5b" : pct >= 50 ? "#c88a00" : C.red;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: C.darker, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: cor, borderRadius: 3, transition: "width .3s" }} />
      </div>
      <span style={{ fontSize: 11, color: cor, fontWeight: 700, minWidth: 34 }}>{pct}%</span>
    </div>
  );
}

export default function Checklists() {
  useModuleLoad("obras");
  const obras = useAppStore((s) => s.obras);

  const [obraId,   setObraId]   = useState("");
  const [etapa,    setEtapa]    = useState(FASES[0]);
  const [itens,    setItens]    = useState({}); // { "etapa|item": { status, obs } }
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(null); // item key being saved
  const { toast, mostrarToast } = useToast();

  const obraOpts = [
    { value: "", label: "— Selecione a obra —" },
    ...obras.map((o) => ({ value: o.id, label: o.nome })),
  ];

  useEffect(() => {
    if (obras.length > 0 && !obraId) setObraId(obras[0].id);
  }, [obras]);

  useEffect(() => {
    if (obraId) carregarChecklist(obraId);
  }, [obraId]);

  async function carregarChecklist(id) {
    setLoading(true);
    try {
      const { listarChecklistObra } = await import("../services/repositories/checklistSfRepository");
      const data = await listarChecklistObra(id);
      const map = {};
      data.forEach((r) => { map[`${r.etapa}|${r.item}`] = { status: r.status, obs: r.obs || "" }; });
      setItens(map);
    } catch (e) {
      mostrarToast("❌ " + e.message);
    } finally {
      setLoading(false);
    }
  }

  const getItem = (etapa, item) => itens[`${etapa}|${item}`] || { status: "pendente", obs: "" };

  async function toggleStatus(item) {
    if (!obraId) return;
    const key    = `${etapa}|${item}`;
    const atual  = itens[key]?.status || "pendente";
    const proximo = atual === "pendente" ? "ok" : atual === "ok" ? "nao_ok" : "pendente";

    setItens((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), status: proximo } }));
    setSaving(key);
    try {
      const { salvarItemChecklist } = await import("../services/repositories/checklistSfRepository");
      await salvarItemChecklist({ obra_id: obraId, etapa, item, status: proximo, obs: itens[key]?.obs || "" });
    } catch (e) {
      mostrarToast("❌ " + e.message);
      setItens((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), status: atual } }));
    } finally {
      setSaving(null);
    }
  }

  // Progresso total por etapa
  const progressoEtapa = useCallback((e) => {
    const lista = CHECKLIST_ITEMS[e] || [];
    const ok    = lista.filter((i) => getItem(e, i).status === "ok").length;
    return { ok, total: lista.length };
  }, [itens]);

  const progressoGeral = FASES.reduce(
    (acc, e) => { const p = progressoEtapa(e); return { ok: acc.ok + p.ok, total: acc.total + p.total }; },
    { ok: 0, total: 0 }
  );

  const obraSel = obras.find((o) => o.id === obraId);
  const itemsEtapa = CHECKLIST_ITEMS[etapa] || [];

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1000, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Checklist de Qualidade</h1>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Inspeção por etapa — Steel Frame</div>
        </div>
        <div style={{ minWidth: 280 }}>
          <Select value={obraId} onChange={setObraId} options={obraOpts} />
        </div>
      </div>

      {!obraId ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted }}>Selecione uma obra para carregar o checklist.</div>
      ) : loading ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted }}>Carregando...</div>
      ) : (
        <>
          {/* Progresso geral */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: "16px 20px", marginBottom: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                {obraSel?.nome || "Obra"} — Progresso Geral
              </span>
              <span style={{ fontSize: 13, color: C.muted }}>
                {progressoGeral.ok} / {progressoGeral.total} itens OK
              </span>
            </div>
            <ProgressBar valor={progressoGeral.ok} total={progressoGeral.total} />
          </div>

          {/* Tabs de etapa */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 16 }}>
            {FASES.map((f) => {
              const p = progressoEtapa(f);
              const ativa = etapa === f;
              const cor   = p.ok === p.total && p.total > 0 ? "#2e9e5b" : p.ok > 0 ? "#c88a00" : C.muted;
              return (
                <button
                  key={f}
                  onClick={() => setEtapa(f)}
                  style={{
                    padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: `1px solid ${ativa ? C.red : C.border}`,
                    background: ativa ? C.red : "transparent",
                    color: ativa ? "#fff" : C.text,
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  {f}
                  <span style={{
                    background: ativa ? "rgba(255,255,255,0.3)" : cor + "22",
                    color: ativa ? "#fff" : cor,
                    borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700,
                  }}>
                    {p.ok}/{p.total}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Progresso da etapa */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "12px 20px", background: C.dark, borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{etapa}</span>
              <div style={{ width: 200 }}>
                <ProgressBar valor={progressoEtapa(etapa).ok} total={progressoEtapa(etapa).total} />
              </div>
            </div>

            {itemsEtapa.map((item) => {
              const key   = `${etapa}|${item}`;
              const dado  = getItem(etapa, item);
              const st    = dado.status;
              return (
                <div
                  key={item}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "13px 20px", borderBottom: `1px solid ${C.border}`,
                    background: STATUS_BG[st],
                    transition: "background .2s",
                  }}
                >
                  {/* Toggle button */}
                  <button
                    onClick={() => toggleStatus(item)}
                    disabled={saving === key}
                    style={{
                      width: 32, height: 32, borderRadius: "50%", border: "none",
                      background: STATUS_COR[st] + "22", color: STATUS_COR[st],
                      fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all .15s", flexShrink: 0,
                    }}
                    title={`Status: ${STATUS_LABEL[st]} — clique para alternar`}
                  >
                    {st === "ok" ? "✓" : st === "nao_ok" ? "✗" : "○"}
                  </button>

                  {/* Descrição */}
                  <div style={{ flex: 1, fontSize: 13, color: st === "nao_ok" ? C.danger : C.text }}>
                    {item}
                  </div>

                  {/* Badge status */}
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                    background: STATUS_COR[st] + "22", color: STATUS_COR[st], whiteSpace: "nowrap",
                  }}>
                    {STATUS_LABEL[st]}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: C.muted }}>
            Clique no círculo para alternar: ○ Pendente → ✓ OK → ✗ Não OK. Salvo automaticamente.
          </div>
        </>
      )}

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, background: C.surface,
          border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 20px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)", fontSize: 14, zIndex: 9999,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
