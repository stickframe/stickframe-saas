import { useState, useEffect } from "react";
import { Search, Trash2 } from "../components/ui/Icon";
import { useToast } from "../hooks/useToast";
import { C, FASES } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import { useObraPermission, useObrasVisiveis } from "../hooks/useObraPermission";

// ─── Checklists guiados por serviço ──────────────────────────────────────────
const FVS_TEMPLATES = {
  "Fundação":              ["Eixos e cotas conferidos com projeto","Prumo e nível verificados","Dimensões das sapatas/blocos conforme projeto","Armação/ferragem conforme projeto","Recobrimento de concreto adequado","Fôrmas niveladas e escoradas","Lançamento do concreto aprovado","Cura do concreto executada"],
  "Estrutura Steel Frame": ["Peças e perfis conforme projeto estrutural","Bitolas e espessuras corretas","Parafusamento correto (torque verificado)","Prumo das colunas verificado","Travamento lateral instalado","Contraventamento conforme projeto","Conexões e emendas verificadas","Pintura anticorrosiva aplicada","Ancoragem na fundação conforme projeto"],
  "Fechamentos":           ["Alinhamento das chapas OSB/Drywall","Fixação dos parafusos (espaçamento correto)","Juntas e emendas vedadas","Recortes de instalações executados","Prumo das paredes verificado","Cantoneiras de reforço instaladas","Fita de juntas aplicada"],
  "Elétrica":              ["Tubulação conforme projeto elétrico","Diâmetros e bitolas corretos","Fixação das eletrodutos adequada","Passagens em estrutura vedadas","Caixas de passagem instaladas","Continuidade dos circuitos testada","Aterramento executado","Quadro elétrico instalado"],
  "Hidráulica":            ["Tubulação conforme projeto hidráulico","Inclinação adequada (esgoto)","Fixação das tubulações","Teste de pressão hidrostática realizado","Vedação das conexões","Caixas d'água e reservatórios instalados","Ralos e grelhas instalados"],
  "Instalações":           ["Tubulações de gás conforme norma","Ventilação adequada","Drenos de ar-condicionado","Infraestrutura de dados/TV","Passa-fios e tampas instalados"],
  "Fechamento Externo":    ["Revestimento externo aplicado","Rufos e calhas instalados","Impermeabilização de área molhada","Pingadeiras e frisos instalados","Janelas e portas alinhadas e vedadas"],
  "Acabamento":            ["Revestimentos nivelados e alinhados","Rejuntamento correto","Pintura uniforme (2 demãos mínimo)","Instalação de esquadrias (folga correta)","Louças e metais instalados","Rodapés e soleiras instalados","Limpeza final executada"],
  "Outro":                 ["Item 1 — descreva abaixo","Item 2","Item 3"],
};

const TIPOS = ["FVS","Vistoria de Qualidade","Inspeção de Segurança","Recebimento de Material","Outro"];
const RESULTADOS = ["Em análise","Aprovado","Aprovado com ressalvas","Reprovado"];
const RES_COR = { "Aprovado": "#2e9e5b", "Aprovado com ressalvas": "#b97a00", "Reprovado": "#c0392b", "Em análise": "#4a9eff" };
const ITEM_RES = ["Conforme","Não Conforme","N/A"];
const ITEM_COR = { "Conforme": "#2e9e5b", "Não Conforme": "#c0392b", "N/A": "#888" };

function Chip({ label, cor, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: active ? 700 : 400,
      border: `1px solid ${active ? cor : C.border}`,
      background: active ? cor + "18" : "transparent",
      color: active ? cor : C.muted, cursor: "pointer", fontFamily: "inherit",
    }}>{label}</button>
  );
}

function pctConformes(itens = []) {
  const respondidos = itens.filter((i) => i.resultado !== "N/A");
  if (!respondidos.length) return null;
  const conf = respondidos.filter((i) => i.resultado === "Conforme").length;
  return Math.round((conf / respondidos.length) * 100);
}

// ─── Modal de criação/edição ──────────────────────────────────────────────────
function ModalVistoria({ obra, onSave, onClose }) {
  const [step, setStep]   = useState(1);
  const [tipo, setTipo]   = useState("FVS");
  const [servico, setServico] = useState("Fundação");
  const [fase, setFase]   = useState(obra?.fase || FASES[0]);
  const [data, setData]   = useState(new Date().toISOString().slice(0, 10));
  const [resp, setResp]   = useState("");
  const [obs, setObs]     = useState("");
  const [resultado, setResultado] = useState("Em análise");
  const [itens, setItens] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const template = FVS_TEMPLATES[servico] || FVS_TEMPLATES["Outro"];
    setItens(template.map((desc) => ({ desc, resultado: "Conforme", obs: "" })));
  }, [servico]);

  function setItemRes(idx, val) {
    setItens((prev) => prev.map((it, i) => i === idx ? { ...it, resultado: val } : it));
  }
  function setItemObs(idx, val) {
    setItens((prev) => prev.map((it, i) => i === idx ? { ...it, obs: val } : it));
  }

  async function salvar() {
    setSaving(true);
    try {
      await onSave({ tipo, servico, fase, data, responsavel: resp, resultado, observacoes: obs, itens });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const nc = itens.filter((i) => i.resultado === "Não Conforme").length;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, width: "100%", maxWidth: 620, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 0", borderBottom: `1px solid ${C.border}`, paddingBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{step === 1 ? "Nova Vistoria / FVS" : `Checklist — ${servico}`}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{obra?.nome?.split("—")[0]?.trim()} · Passo {step} de 2</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
          </div>
          {/* Steps */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {["Identificação","Checklist"].map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: step === i + 1 ? 700 : 400, color: step === i + 1 ? C.red : C.muted }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: step > i ? C.red : step === i + 1 ? C.red : C.border, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{i + 1}</div>
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Row label="Tipo">
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={sel}>
                  {TIPOS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Row>
              <Row label="Serviço / Checklist">
                <select value={servico} onChange={(e) => setServico(e.target.value)} style={sel}>
                  {Object.keys(FVS_TEMPLATES).map((s) => <option key={s}>{s}</option>)}
                </select>
              </Row>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Row label="Fase da obra">
                  <select value={fase} onChange={(e) => setFase(e.target.value)} style={sel}>
                    {FASES.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </Row>
                <Row label="Data">
                  <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={sel} />
                </Row>
              </div>
              <Row label="Responsável *">
                <input value={resp} onChange={(e) => setResp(e.target.value)} placeholder="Nome do engenheiro/vistoriador" style={sel} />
              </Row>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {nc > 0 && (
                <div style={{ background: "#fff5f5", border: "1px solid #f5c6c6", borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#c0392b", fontWeight: 700, marginBottom: 8 }}>
                  ⚠️ {nc} item(ns) Não Conforme(s) detectado(s)
                </div>
              )}
              {itens.map((it, idx) => (
                <div key={idx} style={{ background: C.darker, borderRadius: 8, padding: "12px 14px", border: `1px solid ${it.resultado === "Não Conforme" ? "#f5c6c6" : C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: it.resultado === "Não Conforme" ? 8 : 0 }}>
                    <span style={{ fontSize: 13, flex: 1 }}>{idx + 1}. {it.desc}</span>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      {ITEM_RES.map((r) => (
                        <button key={r} onClick={() => setItemRes(idx, r)} style={{
                          padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: it.resultado === r ? 700 : 400,
                          border: `1px solid ${it.resultado === r ? ITEM_COR[r] : C.border}`,
                          background: it.resultado === r ? ITEM_COR[r] + "20" : "transparent",
                          color: it.resultado === r ? ITEM_COR[r] : C.muted,
                          cursor: "pointer", fontFamily: "inherit",
                        }}>{r}</button>
                      ))}
                    </div>
                  </div>
                  {it.resultado === "Não Conforme" && (
                    <input
                      value={it.obs}
                      onChange={(e) => setItemObs(idx, e.target.value)}
                      placeholder="Descreva a não conformidade..."
                      style={{ ...sel, fontSize: 12, marginTop: 4 }}
                    />
                  )}
                </div>
              ))}

              <div style={{ marginTop: 16, padding: "14px", background: C.dark, borderRadius: 8 }}>
                <Row label="Resultado final">
                  <select value={resultado} onChange={(e) => setResultado(e.target.value)} style={sel}>
                    {RESULTADOS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </Row>
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, letterSpacing: 1 }}>OBSERVAÇÕES GERAIS</div>
                  <textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Anotações adicionais, pendências, prazo para correção..." rows={3}
                    style={{ ...sel, resize: "vertical" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
          <button onClick={step === 1 ? onClose : () => setStep(1)} style={{ padding: "9px 18px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            {step === 1 ? "Cancelar" : "← Voltar"}
          </button>
          {step === 1 ? (
            <button onClick={() => setStep(2)} disabled={!resp.trim()} style={{ padding: "9px 18px", borderRadius: 6, border: "none", background: !resp.trim() ? C.border : C.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: resp.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
              Próximo: Checklist →
            </button>
          ) : (
            <button onClick={salvar} disabled={saving} style={{ padding: "9px 18px", borderRadius: 6, border: "none", background: saving ? C.border : C.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {saving ? "Salvando..." : "💾 Salvar vistoria"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal de visualização ────────────────────────────────────────────────────
function ModalVer({ v, onClose }) {
  const pct = pctConformes(v.itens || []);
  const nc  = (v.itens || []).filter((i) => i.resultado === "Não Conforme");
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, width: "100%", maxWidth: 600, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{v.tipo} — {v.servico}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{v.fase} · {v.data} · {v.responsavel}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ background: (RES_COR[v.resultado] || C.muted) + "20", color: RES_COR[v.resultado] || C.muted, border: `1px solid ${(RES_COR[v.resultado] || C.muted)}44`, borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>{v.resultado}</span>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {pct !== null && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: C.muted }}>Conformidade</span>
                <span style={{ fontWeight: 800, color: pct >= 80 ? "#2e9e5b" : pct >= 60 ? "#b97a00" : "#c0392b" }}>{pct}%</span>
              </div>
              <div style={{ height: 8, background: C.darker, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: 8, width: `${pct}%`, background: pct >= 80 ? "#2e9e5b" : pct >= 60 ? "#b97a00" : "#c0392b", borderRadius: 4 }} />
              </div>
            </div>
          )}
          {nc.length > 0 && (
            <div style={{ background: "#fff5f5", border: "1px solid #f5c6c6", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#c0392b", marginBottom: 6 }}>NÃO CONFORMIDADES ({nc.length})</div>
              {nc.map((it, i) => (
                <div key={i} style={{ fontSize: 12, marginBottom: 4 }}>• {it.desc}{it.obs ? ` — ${it.obs}` : ""}</div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {(v.itens || []).map((it, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: ITEM_COR[it.resultado] || C.muted, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12 }}>{it.desc}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: ITEM_COR[it.resultado] || C.muted }}>{it.resultado}</span>
              </div>
            ))}
          </div>
          {v.observacoes && (
            <div style={{ marginTop: 14, background: C.darker, borderRadius: 8, padding: "12px 14px", fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
              <strong style={{ color: C.text }}>Obs: </strong>{v.observacoes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Row({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>{label.toUpperCase()}</div>
      {children}
    </div>
  );
}
const sel = { width: "100%", padding: "9px 12px", borderRadius: 7, border: `1px solid #dcdce4`, background: "#fff", color: "#1a1a1a", fontSize: 13, fontFamily: "inherit", outline: "none" };

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Vistorias() {
  useModuleLoad("obras");
  const _obras        = useAppStore((s) => s.obras);
  const obras         = useObrasVisiveis(_obras);
  const vistorias     = useAppStore((s) => s.vistorias);
  const loadVistorias = useAppStore((s) => s.loadVistorias);
  const addVistoria   = useAppStore((s) => s.addVistoria);
  const deleteVistoria = useAppStore((s) => s.deleteVistoria);

    const { toast, mostrarToast } = useToast();

  const [obraId,  setObraId]  = useState(null);
  const { podeEditar } = useObraPermission(obraId);
  const [modal,   setModal]   = useState(false);
  const [verV,    setVerV]    = useState(null);
  const [filtroR, setFiltroR] = useState("Todos");
  const [filtroF, setFiltroF] = useState("Todos");

  useEffect(() => { if (!obraId && obras.length > 0) setObraId(obras[0].id); }, [obras, obraId]);
  useEffect(() => { if (obraId) loadVistorias(obraId); }, [obraId]);

  const lista = (vistorias[obraId] || []).filter((v) =>
    (filtroR === "Todos" || v.resultado === filtroR) &&
    (filtroF === "Todos" || v.fase === filtroF)
  );

  const obra = obras.find((o) => o.id === obraId);

  const stats = {
    total:     (vistorias[obraId] || []).length,
    aprovados: (vistorias[obraId] || []).filter((v) => v.resultado === "Aprovado").length,
    nc:        (vistorias[obraId] || []).filter((v) => v.resultado === "Reprovado").length,
  };

  if (obras.length === 0) return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}><Search size={36} /></div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Nenhuma obra cadastrada</div>
      <div style={{ fontSize: 13, color: C.muted }}>Cadastre uma obra em <strong>Gestão de Obras</strong> para iniciar vistorias.</div>
    </div>
  );

  return (
    <>
      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 999, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 32px #0006" }}>{toast}</div>
      )}
      {modal && <ModalVistoria obra={obra} onClose={() => setModal(false)} onSave={async (v) => { await addVistoria(obraId, v); mostrarToast("✅ Vistoria registrada!"); }} />}
      {verV  && <ModalVer v={verV} onClose={() => setVerV(null)} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Vistorias & FVS</h2>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Fichas de Verificação de Serviço e inspeções guiadas</p>
        </div>
        {podeEditar() && <button onClick={() => setModal(true)} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: C.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          + Nova vistoria
        </button>}
      </div>

      {/* Seletor de obra */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {obras.map((o) => (
          <button key={o.id} onClick={() => setObraId(o.id)} style={{
            padding: "8px 16px", borderRadius: 8,
            border: `1px solid ${obraId === o.id ? C.red : C.border}`,
            background: obraId === o.id ? C.red + "18" : "transparent",
            color: obraId === o.id ? C.text : C.muted,
            fontSize: 12, fontWeight: obraId === o.id ? 700 : 400,
            cursor: "pointer", fontFamily: "inherit",
          }}>{o.nome?.split("—")[0]?.trim()}</button>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          ["Total de vistorias", stats.total, C.muted],
          ["Aprovadas",          stats.aprovados, "#2e9e5b"],
          ["Reprovadas",         stats.nc, "#c0392b"],
        ].map(([l, v, cor]) => (
          <div key={l} style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: "14px 18px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: cor }}>{v}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: .5, marginRight: 4 }}>RESULTADO</span>
        {["Todos", ...RESULTADOS].map((r) => (
          <Chip key={r} label={r} cor={RES_COR[r] || C.muted} active={filtroR === r} onClick={() => setFiltroR(r)} />
        ))}
        <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: .5, marginLeft: 12, marginRight: 4 }}>FASE</span>
        <Chip label="Todos" cor={C.muted} active={filtroF === "Todos"} onClick={() => setFiltroF("Todos")} />
        {FASES.map((f) => <Chip key={f} label={f.split(" ")[0]} cor={C.red} active={filtroF === f} onClick={() => setFiltroF(f)} />)}
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: "56px 0", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}><Search size={36} /></div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Nenhuma vistoria registrada</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Inicie uma FVS guiada para registrar a conformidade dos serviços.</div>
          {podeEditar() && <button onClick={() => setModal(true)} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: C.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Criar primeira vistoria</button>}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {lista.map((v) => {
            const pct = pctConformes(v.itens || []);
            const ncCount = (v.itens || []).filter((i) => i.resultado === "Não Conforme").length;
            const cor = RES_COR[v.resultado] || C.muted;
            return (
              <div key={v.id} style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `1px solid ${v.resultado === "Reprovado" ? "#f5c6c6" : C.border}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: cor + "20", border: `2px solid ${cor}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {v.resultado === "Aprovado" ? "✓" : v.resultado === "Reprovado" ? "✕" : v.resultado === "Aprovado com ressalvas" ? "⚠" : "⏳"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{v.tipo} — {v.servico}</span>
                    <span style={{ background: cor + "18", color: cor, border: `1px solid ${cor}33`, borderRadius: 4, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>{v.resultado}</span>
                    {ncCount > 0 && <span style={{ background: "#fff0f0", color: "#c0392b", border: "1px solid #f5c6c6", borderRadius: 4, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>{ncCount} NC</span>}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {v.fase} · {v.data} · <strong style={{ color: C.text }}>{v.responsavel}</strong>
                  </div>
                  {pct !== null && (
                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: C.darker, borderRadius: 2, overflow: "hidden", maxWidth: 120 }}>
                        <div style={{ height: 4, width: `${pct}%`, background: pct >= 80 ? "#2e9e5b" : pct >= 60 ? "#b97a00" : "#c0392b", borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>{pct}% conforme</span>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setVerV(v)} style={{ padding: "7px 14px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Ver</button>
                  <button onClick={async () => { await deleteVistoria(obraId, v.id); mostrarToast("🗑 Vistoria removida."); }} style={{ padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.danger}44`, background: C.danger + "18", color: C.danger, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
