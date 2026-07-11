import { useState, useEffect, useCallback, useRef } from "react";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import {
  listarModelos, criarModelo, deletarModelo, uploadIFC,
  listarApontamentos, criarApontamento, atualizarApontamento, deletarApontamento,
} from "../services/repositories/bimRepository";
import StickViewBIM from "../components/bim/StickViewBIM";
import StickQuotePDFModal from "../components/bim/StickQuotePDFModal";
import StickQuoteDWGModal from "../components/bim/StickQuoteDWGModal";
import StickQuoteVisionModal from "../components/bim/StickQuoteVisionModal";
import { useToast } from "../components/ui/Toast";
import { criarOrcamento } from "../services/repositories/orcamentoRepository";
import { publishEvent } from "../hooks/useEventBus";
import { EVENT_TYPES, ORIGIN_MODULES, VISIBILITY_LEVELS } from "../utils/eventTypes";

const PATHS = {
  cube3d:  <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
  refresh: <><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>,
  pin:     <><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
  eye:     <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  home:    <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>,
  upload:  <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  plus:    <path d="M12 5v14M5 12h14"/>,
  layers:  <><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>,
  tag:     <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
  alert:   <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  clip:    <><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></>,
  trash:   <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></>,
  check:   <polyline points="20 6 9 17 4 12"/>,
  x:       <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  file:    <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></>,
};

function Ic({ n, w = 15, c }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c || "currentColor"}
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: w, height: w, flexShrink: 0 }}>
      {PATHS[n]}
    </svg>
  );
}

function BtnPrimary({ onClick, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        background: disabled ? "var(--muted)" : "var(--brick)", color: "#fff",
        border: "none", borderRadius: 8,
        padding: "9px 18px", fontFamily: "inherit", fontSize: 13, fontWeight: 700,
        cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.6 : 1,
      }}>
      {children}
    </button>
  );
}

function BtnGhost({ onClick, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        background: "var(--surface)", color: "var(--ink-2)",
        border: "1.5px solid var(--line)", borderRadius: 8,
        padding: "8px 14px", fontFamily: "inherit", fontSize: 13, fontWeight: 600,
        cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.6 : 1,
      }}>
      {children}
    </button>
  );
}

function EmptyBox({ icon, title, sub, children, style }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14,
      padding: "64px 40px", textAlign: "center", ...style,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14, background: "var(--surface-2)",
        border: "1px solid var(--line)", display: "grid", placeItems: "center", margin: "0 auto 20px",
      }}>
        <Ic n={icon} w={28} c="var(--muted)" />
      </div>
      <div style={{ fontWeight: 700, fontSize: 22, color: "var(--ink)", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--muted)", maxWidth: 340, margin: "0 auto 24px", lineHeight: 1.65 }}>{sub}</div>
      {children}
    </div>
  );
}

const PRIORIDADE_OPTS = ["baixa", "média", "alta", "crítica"];
const STATUS_OPTS     = ["aberto", "em andamento", "resolvido", "fechado"];

const PRIORIDADE_COLOR = {
  "baixa":    "var(--pos, #3f7a4b)",
  "média":    "var(--ochre, #c0892d)",
  "alta":     "var(--neg, #a33327)",
  "crítica":  "#7d1411",
};

const STATUS_COLOR = {
  "aberto":        "var(--steel, #3b6ea5)",
  "em andamento":  "var(--ochre, #c0892d)",
  "resolvido":     "var(--pos, #3f7a4b)",
  "fechado":       "var(--muted)",
};

function Pill({ label, color }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 9px", borderRadius: 99,
      fontSize: 11, fontWeight: 700, color, background: color + "18",
      textTransform: "capitalize", letterSpacing: 0.3,
    }}>{label}</span>
  );
}

// Modal: Novo Apontamento
function ModalApontamento({ modelos, onSalvar, onClose }) {
  const [form, setForm] = useState({
    descricao: "", tipo: "não-conformidade", prioridade: "média",
    status: "aberto", responsavel: "", prazo: "", modelo_id: modelos[0]?.id || "",
  });
  const [saving, setSaving] = useState(false);

  async function salvar() {
    if (!form.descricao.trim()) return;
    setSaving(true);
    try { await onSalvar(form); onClose(); }
    catch (e) { console.error(e); setSaving(false); }
  }

  const F = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const inp = { fontFamily: "inherit", fontSize: 13, padding: "8px 10px", borderRadius: 7, border: "1.5px solid var(--line)", width: "100%", boxSizing: "border-box", color: "var(--ink)", background: "var(--surface)" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--surface)", borderRadius: 16, padding: 28, width: 480, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--ink)" }}>Novo Apontamento</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Ic n="x" w={18} c="var(--muted)" /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.8 }}>DESCRIÇÃO *</label>
            <textarea value={form.descricao} onChange={F("descricao")} rows={3}
              placeholder="Descreva o apontamento..." style={{ ...inp, resize: "vertical", marginTop: 4 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.8 }}>TIPO</label>
              <select value={form.tipo} onChange={F("tipo")} style={{ ...inp, marginTop: 4 }}>
                {["não-conformidade","tarefa","observação","risco"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.8 }}>PRIORIDADE</label>
              <select value={form.prioridade} onChange={F("prioridade")} style={{ ...inp, marginTop: 4 }}>
                {PRIORIDADE_OPTS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.8 }}>RESPONSÁVEL</label>
              <input value={form.responsavel} onChange={F("responsavel")} placeholder="Nome" style={{ ...inp, marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.8 }}>PRAZO</label>
              <input type="date" value={form.prazo} onChange={F("prazo")} style={{ ...inp, marginTop: 4 }} />
            </div>
            {modelos.length > 0 && (
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.8 }}>MODELO VINCULADO</label>
                <select value={form.modelo_id} onChange={F("modelo_id")} style={{ ...inp, marginTop: 4 }}>
                  <option value="">— Nenhum —</option>
                  {modelos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <BtnGhost onClick={onClose}>Cancelar</BtnGhost>
          <BtnPrimary onClick={salvar} disabled={saving || !form.descricao.trim()}>
            {saving ? "Salvando…" : "Criar Apontamento"}
          </BtnPrimary>
        </div>
      </div>
    </div>
  );
}

// Tab: Modelos
function TabModelos({ obraId, empresaId, modelos, carregarModelos, deletando, setDeletando }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [erroUpload, setErroUpload] = useState(null);

  // Fase 3: Obter a obra para achar o stickflow_id
  const obras = useAppStore((s) => s.obras);
  const obra = obras?.find((o) => o.id === obraId);
  const stickflowId = obra?.stickflow_id;

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setErroUpload(null);
    try {
      const { path, publicUrl } = await uploadIFC(obraId, empresaId, file);
      const data = await criarModelo({ obra_id: obraId, nome: file.name, storage_path: path, url: publicUrl });
      await carregarModelos();

      // Fase 3: Publicar evento de IFC importado
      if (stickflowId) {
        await publishEvent({
          type: EVENT_TYPES.IFC_IMPORTADO,
          stickflowId: stickflowId,
          payload: { model_id: data.id, model_name: file.name, size: file.size || 0 },
          originModule: ORIGIN_MODULES.BIM,
          visibility: VISIBILITY_LEVELS.INTERNO,
          descricao: `Modelo BIM IFC "${file.name}" importado com sucesso`
        });
      }
    } catch (err) {
      console.error(err);
      setErroUpload(err?.message || String(err));
    }
    finally { setUploading(false); e.target.value = ""; }
  }

  async function handleDeletar(m) {
    if (!confirm(`Excluir modelo "${m.nome}"?`)) return;
    setDeletando(m.id);
    try { await deletarModelo(m.id, m.storage_path); await carregarModelos(); }
    catch (err) { console.error(err); }
    finally { setDeletando(null); }
  }

  if (modelos.length === 0) {
    return (
      <EmptyBox icon="cube3d" title="Nenhum modelo importado"
        sub="Importe arquivos .IFC ou .DAE para visualizar em 3D e vincular às fases da obra.">
        <input ref={fileRef} type="file" accept=".ifc,.dae,.obj" style={{ display: "none" }} onChange={handleFile} />
        <BtnPrimary onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Ic n="upload" w={14} c="#fff" /> {uploading ? "Importando…" : "Importar primeiro modelo"}
        </BtnPrimary>
        {erroUpload && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 12, color: "#991b1b", maxWidth: 420, textAlign: "left" }}>
            <strong>Erro ao importar:</strong> {erroUpload}
          </div>
        )}
      </EmptyBox>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <input ref={fileRef} type="file" accept=".ifc,.dae,.obj" style={{ display: "none" }} onChange={handleFile} />
        <BtnPrimary onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Ic n="upload" w={14} c="#fff" /> {uploading ? "Importando…" : "Importar modelo"}
        </BtnPrimary>
      </div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-2)" }}>
              {["Modelo", "Tipo", "Importado em", ""].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.8, borderBottom: "1px solid var(--line)" }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modelos.map((m) => (
              <tr key={m.id} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--surface-2)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Ic n="file" w={15} c="var(--steel, #3b6ea5)" />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{m.nome}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <Pill label={m.tipo || "IFC"} color="var(--steel, #3b6ea5)" />
                </td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--muted)" }}>
                  {new Date(m.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td style={{ padding: "12px 14px", textAlign: "right" }}>
                  <button onClick={() => handleDeletar(m)} disabled={deletando === m.id}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, opacity: deletando === m.id ? 0.4 : 1 }}>
                    <Ic n="trash" w={14} c="var(--neg, #a33327)" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Tab: Apontamentos
function TabApontamentos({ obraId, modelos, apontamentos, carregarApontamentos }) {
  const [modal, setModal] = useState(false);
  const [atualizando, setAtualizando] = useState(null);

  async function handleCriar(form) {
    await criarApontamento({ ...form, obra_id: obraId });
    await carregarApontamentos();
  }

  async function toggleStatus(apt) {
    const next = apt.status === "resolvido" ? "aberto" : "resolvido";
    setAtualizando(apt.id);
    try { await atualizarApontamento(apt.id, { status: next }); await carregarApontamentos(); }
    catch (err) { console.error(err); }
    finally { setAtualizando(null); }
  }

  async function handleDeletar(apt) {
    if (!confirm("Excluir apontamento?")) return;
    setAtualizando(apt.id);
    try { await deletarApontamento(apt.id); await carregarApontamentos(); }
    catch (err) { console.error(err); }
    finally { setAtualizando(null); }
  }

  return (
    <div>
      {modal && (
        <ModalApontamento modelos={modelos} onSalvar={handleCriar} onClose={() => setModal(false)} />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          {apontamentos.length} apontamento{apontamentos.length !== 1 ? "s" : ""}
        </div>
        <BtnPrimary onClick={() => setModal(true)}>
          <Ic n="plus" w={14} c="#fff" /> Novo apontamento
        </BtnPrimary>
      </div>

      {apontamentos.length === 0 ? (
        <EmptyBox icon="pin" title="Sem apontamentos"
          sub="Apontamentos são marcações de não-conformidade, tarefas ou observações vinculadas ao modelo 3D."
          style={{ padding: "48px 40px" }}>
          <BtnGhost onClick={() => setModal(true)}><Ic n="plus" w={14} /> Criar apontamento</BtnGhost>
        </EmptyBox>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {apontamentos.map((apt) => (
            <div key={apt.id} style={{
              background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12,
              padding: "14px 18px", display: "flex", gap: 14, alignItems: "flex-start",
              opacity: atualizando === apt.id ? 0.5 : 1,
            }}>
              <button onClick={() => toggleStatus(apt)} disabled={atualizando === apt.id}
                style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0, cursor: "pointer",
                  border: `2px solid ${apt.status === "resolvido" ? "var(--pos, #3f7a4b)" : "var(--line)"}`,
                  background: apt.status === "resolvido" ? "var(--pos, #3f7a4b)" : "transparent",
                  display: "grid", placeItems: "center", marginTop: 1,
                }}>
                {apt.status === "resolvido" && <Ic n="check" w={11} c="#fff" />}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: apt.status === "resolvido" ? "var(--muted)" : "var(--ink)", textDecoration: apt.status === "resolvido" ? "line-through" : "none" }}>
                    {apt.descricao}
                  </span>
                  <Pill label={apt.prioridade} color={PRIORIDADE_COLOR[apt.prioridade] || "var(--muted)"} />
                  <Pill label={apt.status} color={STATUS_COLOR[apt.status] || "var(--muted)"} />
                </div>
                <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: "var(--muted)" }}>
                  {apt.tipo && <span style={{ textTransform: "capitalize" }}>{apt.tipo}</span>}
                  {apt.responsavel && <span>Resp: {apt.responsavel}</span>}
                  {apt.prazo && <span>Prazo: {new Date(apt.prazo).toLocaleDateString("pt-BR")}</span>}
                  <span>{new Date(apt.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
              <button onClick={() => handleDeletar(apt)} disabled={atualizando === apt.id}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}>
                <Ic n="trash" w={13} c="var(--neg, #a33327)" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabRevisoes({ onGoToModelos }) {
  return (
    <EmptyBox icon="refresh" title="Nenhuma revisão registrada"
      sub="Revisões de projeto aparecem aqui após a importação do primeiro modelo IFC.">
      <BtnPrimary onClick={onGoToModelos}><Ic n="upload" w={14} c="#fff" /> Ir para Modelos</BtnPrimary>
    </EmptyBox>
  );
}

function TabStickView({ obraId, empresaId, user, onAddToOrcamento, modelos }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          background: "var(--brick-soft, #f3e7e5)", border: "1.5px solid var(--brick)",
          borderRadius: 8, padding: "5px 12px",
          fontSize: 12, fontWeight: 800, color: "var(--brick)", letterSpacing: 0.3,
        }}>
          StickView™ — Gêmeo Digital
        </div>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          Clique nos elementos para atualizar execução · {modelos?.length > 0 ? "Selecione um modelo salvo ou importe um IFC" : "Importe um IFC para atualizar quantidades"} · Gere orçamento pelo modelo
        </span>
      </div>
      <StickViewBIM obraId={obraId} empresaId={empresaId} user={user} onAddToOrcamento={onAddToOrcamento} modelos={modelos} />
    </div>
  );
}

function TabPreviewKit() {
  return (
    <div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "22px 24px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--brick-soft, #f3e7e5)", display: "grid", placeItems: "center" }}>
            <Ic n="home" w={18} c="var(--brick)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "var(--ink)" }}>Preview Kit — Steel Frame</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Visualização prévia da estrutura modular por ambiente</div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.7, maxWidth: 580 }}>
          O Preview Kit gera uma visualização esquemática dos painéis e composições Steel Frame com base nos dados do Orçamento SF.
          Disponível após vincular um projeto de orçamento.
        </p>
      </div>
      <EmptyBox icon="home" title="Nenhum projeto vinculado"
        sub="Vincule um projeto do Orçamento SF para gerar o Preview Kit automaticamente."
        style={{ padding: "48px 40px" }}>
        <BtnGhost><Ic n="clip" w={14} /> Ir para Orçamento SF</BtnGhost>
      </EmptyBox>
    </div>
  );
}

const TABS = [
  { id: "stickview",    l: "StickView™",   icon: "cube3d"   },
  { id: "modelos",      l: "Modelos",      icon: "file"     },
  { id: "revisoes",     l: "Revisões",     icon: "refresh"  },
  { id: "apontamentos", l: "Apontamentos", icon: "pin"      },
];

export default function BimSF() {
  useModuleLoad("obras");
  const [tab, setTab] = useState("stickview");
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [dwgModalOpen, setDwgModalOpen] = useState(false);
  const [visionModalOpen, setVisionModalOpen] = useState(false);
  const toast = useToast();
  const obras     = useAppStore((s) => s.obras);
  const user      = useAppStore((s) => s.user);
  const empresaId = useAppStore((s) => s.empresaId);
  const [obraIdx, setObraIdx] = useState(0);
  const obraAtual = obras[obraIdx] || obras[0];
  const obraId    = obraAtual?.id;
  const usuario   = user;

  // Sincroniza com a obra ativa global (mesma regra do topo: "Em andamento"
  // → senão a 1ª). Roda só na 1ª carga das obras; não sobrescreve a escolha
  // manual do usuário no dropdown.
  const obraInit = useRef(false);
  useEffect(() => {
    if (obraInit.current || obras.length === 0) return;
    const idx = obras.findIndex((o) => o.status === "Em andamento");
    setObraIdx(idx >= 0 ? idx : 0);
    obraInit.current = true;
  }, [obras]);

  const [modelos, setModelos]         = useState([]);
  const [apontamentos, setApontamentos] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [deletando, setDeletando]     = useState(null);

  const carregarModelos = useCallback(async () => {
    if (!obraId) return;
    try {
      const lista = await listarModelos(obraId);
      setModelos(lista);
      // Se não há modelos e o usuário está na tab StickView, redireciona para Modelos
      if (lista.length === 0) setTab((t) => t === "stickview" ? "modelos" : t);
    }
    catch { /* silently skip */ }
  }, [obraId]);

  const carregarApontamentos = useCallback(async () => {
    if (!obraId) return;
    try { setApontamentos(await listarApontamentos(obraId)); }
    catch { /* silently skip */ }
  }, [obraId]);

  useEffect(() => {
    if (!obraId) return;
    setLoading(true);
    Promise.all([carregarModelos(), carregarApontamentos()]).finally(() => setLoading(false));
  }, [obraId, carregarModelos, carregarApontamentos]);

  // computed KPIs
  const kpis = [
    { v: modelos.length,                                                              l: "Modelos 3D",      c: "var(--steel, #3b6ea5)" },
    { v: apontamentos.length,                                                         l: "Apontamentos",    c: "var(--ink-2, #57514a)" },
    { v: apontamentos.filter(a => a.prioridade === "alta" || a.prioridade === "crítica").length, l: "Alta prioridade", c: "var(--neg, #a33327)" },
    { v: apontamentos.filter(a => a.status === "resolvido" || a.status === "fechado").length,    l: "Resolvidos",      c: "var(--pos, #3f7a4b)" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
        <div style={{ width: 4, height: 42, borderRadius: 3, background: "var(--brick, #981915)", flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontWeight: 700, fontSize: 28, color: "var(--ink)", lineHeight: 1, margin: 0 }}>BIM</h1>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Modelos IFC · Visualização 3D · Apontamentos</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <BtnGhost onClick={() => setPdfModalOpen(true)} style={{ borderColor: "rgba(192,36,28,.3)", color: "#e0463c" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/>
                </svg>
                Analisar PDF
              </BtnGhost>
              <BtnGhost onClick={() => setDwgModalOpen(true)} style={{ borderColor: "rgba(59,130,246,.3)", color: "#3b82f6" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
                  <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
                </svg>
                Analisar DWG
              </BtnGhost>
              <BtnGhost onClick={() => setVisionModalOpen(true)} style={{ borderColor: "rgba(139,92,246,.3)", color: "#a78bfa" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                AI Vision
              </BtnGhost>
              <BtnGhost onClick={() => { setTab("apontamentos"); }}>
                <Ic n="plus" w={14} /> Apontamento
              </BtnGhost>
            </div>
          </div>
        </div>
      </div>

      {/* Seletor de obra (único — sincronizado com a obra ativa global) */}
      {obraAtual ? (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: "var(--muted)",
            textTransform: "uppercase", letterSpacing: 0.5,
          }}>
            Obra
          </span>
          <select
            value={obraIdx}
            onChange={e => setObraIdx(Number(e.target.value))}
            style={{
              background: "var(--surface)", color: "var(--brick)",
              border: "1.5px solid var(--brick)", borderRadius: 8,
              padding: "6px 12px", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700,
              cursor: "pointer", outline: "none", letterSpacing: 0.3,
            }}
          >
            {obras.map((o, i) => (
              <option key={o.id || i} value={i}>{o.nome}</option>
            ))}
          </select>
        </div>
      ) : (
        <div style={{
          background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 10,
          padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "var(--muted)",
        }}>
          Nenhuma obra selecionada. Crie uma obra em Gestão de Obras para usar o BIM.
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {kpis.map((k) => (
          <div key={k.l} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ height: 3, width: 28, borderRadius: 2, marginBottom: 10, background: k.c }} />
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 700, lineHeight: 1, marginBottom: 4, color: k.c }}>{loading ? "–" : k.v}</div>
            <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--line)", marginBottom: 20 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "14px 18px 13px",
            fontSize: 13, fontWeight: 600,
            color: tab === t.id ? "var(--brick)" : "var(--muted)",
            background: "none", border: "none",
            borderBottom: tab === t.id ? "2.5px solid var(--brick)" : "2.5px solid transparent",
            cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", marginBottom: -2,
          }}>
            <Ic n={t.icon} w={13} c={tab === t.id ? "var(--brick)" : "var(--muted)"} />
            {t.l}
          </button>
        ))}
      </div>

      {tab === "stickview"    && <TabStickView obraId={obraId} empresaId={empresaId} user={usuario} modelos={modelos} onAddToOrcamento={async (lista, total) => {
        try {
          const ref = `BIM-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
          await criarOrcamento({
            ref,
            cliente: obraAtual?.cliente || "—",
            valor: Math.round((total || 0) * 100) / 100,
            status: "Em elaboração",
            criado: new Date().toLocaleDateString("pt-BR"),
            validade_dias: 30,
            origem: "bim_stickview",
            composicao_tecnica: lista.map(i => ({
              sistema: i.categoria,
              itens: [{ nome: i.nome, un: i.unidade, qtd: i.quantidade, preco: i.precoUnit, total: i.preco }],
            })),
          });
          toast.success(`✓ Orçamento ${ref} criado com ${lista.length} ${lista.length === 1 ? "item" : "itens"} — R$ ${total?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
        } catch (e) {
          toast.error?.(`Erro ao criar orçamento: ${e.message}`);
        }
      }} />}
      {tab === "modelos"      && <TabModelos obraId={obraId} empresaId={empresaId} modelos={modelos} carregarModelos={carregarModelos} deletando={deletando} setDeletando={setDeletando} />}
      {tab === "revisoes"     && <TabRevisoes onGoToModelos={() => setTab("modelos")} />}
      {tab === "apontamentos" && <TabApontamentos obraId={obraId} modelos={modelos} apontamentos={apontamentos} carregarApontamentos={carregarApontamentos} />}
      {pdfModalOpen && (
        <StickQuotePDFModal
          onClose={() => setPdfModalOpen(false)}
          obraNome={obras[obraIdx]?.nome || ""}
          empresaId={empresaId}
        />
      )}
      {dwgModalOpen && (
        <StickQuoteDWGModal
          onClose={() => setDwgModalOpen(false)}
          obraNome={obras[obraIdx]?.nome || ""}
          empresaId={empresaId}
        />
      )}
      {visionModalOpen && (
        <StickQuoteVisionModal
          onClose={() => setVisionModalOpen(false)}
          obraNome={obras[obraIdx]?.nome || ""}
          empresaId={empresaId}
        />
      )}
    </div>
  );
}
