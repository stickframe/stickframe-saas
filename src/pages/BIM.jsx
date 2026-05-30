import { useState, useEffect, useRef } from "react";
import { C, FASES } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";

const DISCIPLINAS_BIM = ["Arquitetônico","Estrutural","Hidrossanitário","Elétrico","HVAC","Fundação","Paisagismo","Outro"];
const TIPOS_APT = ["Clash","Inconsistência","Pendência","Melhoria","Outro"];
const STATUS_APT = ["Aberto","Em andamento","Resolvido","Descartado"];
const PRIORIDADES = ["Alta","Média","Baixa"];
const STATUS_COR = { "Aberto": "#c0392b", "Em andamento": "#b97a00", "Resolvido": "#2e9e5b", "Descartado": C.muted };
const PRIO_COR   = { "Alta": "#c0392b", "Média": "#b97a00", "Baixa": "#2e9e5b" };

// ─── Viewer IFC (Three.js + @thatopen/components) ────────────────────────────
function IFCViewer({ url, onElementClick }) {
  const containerRef = useRef(null);
  const viewerRef    = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | loading | loaded | error
  const [msg,    setMsg]    = useState("");

  useEffect(() => {
    if (!url || !containerRef.current) return;
    let destroyed = false;
    setStatus("loading");
    setMsg("Carregando biblioteca IFC...");

    (async () => {
      try {
        const THREE = await import("three");
        const OBC   = await import("@thatopen/components");

        if (destroyed) return;

        const components = new OBC.Components();
        const worlds     = components.get(OBC.Worlds);
        const world      = worlds.create();

        world.scene     = new OBC.SimpleScene(components);
        world.renderer  = new OBC.SimpleRenderer(components, containerRef.current);
        world.camera    = new OBC.SimpleCamera(components);

        components.init();

        world.scene.setup();
        world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);

        const grids = components.get(OBC.Grids);
        grids.create(world);

        // FragmentsManager deve ser inicializado antes do IfcLoader (API v3)
        setMsg("Inicializando motor de fragmentos...");
        const fragments = components.get(OBC.FragmentsManager);
        const workerUrl = await OBC.FragmentsManager.getWorker();
        fragments.init(workerUrl);

        const ifcLoader = components.get(OBC.IfcLoader);
        await ifcLoader.setup();

        setMsg("Carregando modelo IFC...");

        const resp  = await fetch(url);
        const buff  = await resp.arrayBuffer();
        const model = await ifcLoader.load(new Uint8Array(buff));
        world.scene.three.add(model);

        if (destroyed) { components.dispose(); return; }
        setStatus("loaded");
        setMsg("");

        viewerRef.current = { components, world };
      } catch (e) {
        if (!destroyed) { setStatus("error"); setMsg(String(e?.message || e)); }
      }
    })();

    return () => {
      destroyed = true;
      if (viewerRef.current) {
        try { viewerRef.current.components.dispose(); } catch (_) {}
        viewerRef.current = null;
      }
    };
  }, [url]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#1a1a1a", borderRadius: 10, overflow: "hidden" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {status !== "loaded" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
          {status === "loading" && (
            <>
              <div style={{ width: 36, height: 36, border: "3px solid #333", borderTop: "3px solid #981915", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 12, color: "#666" }}>{msg}</div>
            </>
          )}
          {status === "idle" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🧊</div>
              <div style={{ fontSize: 13, color: "#555" }}>Selecione um modelo IFC para visualizar</div>
            </div>
          )}
          {status === "error" && (
            <div style={{ textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
              <div style={{ fontSize: 13, color: "#c0392b", marginBottom: 6 }}>Erro ao carregar modelo</div>
              <div style={{ fontSize: 11, color: "#888", maxWidth: 300, lineHeight: 1.5 }}>{msg}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Modal de apontamento ─────────────────────────────────────────────────────
function ModalApontamento({ modelos, onSave, onClose }) {
  const [form, setForm] = useState({ titulo: "", descricao: "", disciplina: "Arquitetônico", tipo: "Clash", status: "Aberto", prioridade: "Alta", responsavel: "", prazo: "", modelo_id: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: typeof e === "string" ? e : e.target.value }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Novo Apontamento</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Título *">
            <input value={form.titulo} onChange={set("titulo")} placeholder="Descreva o problema ou apontamento" style={inp} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Tipo">
              <select value={form.tipo} onChange={set("tipo")} style={inp}>
                {TIPOS_APT.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Disciplina">
              <select value={form.disciplina} onChange={set("disciplina")} style={inp}>
                {DISCIPLINAS_BIM.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Prioridade">
              <select value={form.prioridade} onChange={set("prioridade")} style={inp}>
                {PRIORIDADES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Prazo">
              <input type="date" value={form.prazo} onChange={set("prazo")} style={inp} />
            </Field>
          </div>
          <Field label="Responsável">
            <input value={form.responsavel} onChange={set("responsavel")} placeholder="Nome do responsável pela correção" style={inp} />
          </Field>
          {modelos.length > 0 && (
            <Field label="Modelo relacionado">
              <select value={form.modelo_id} onChange={set("modelo_id")} style={inp}>
                <option value="">— Nenhum —</option>
                {modelos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </Field>
          )}
          <Field label="Descrição">
            <textarea value={form.descricao} onChange={set("descricao")} placeholder="Detalhes, localização no modelo, elementos envolvidos..." rows={3} style={{ ...inp, resize: "vertical" }} />
          </Field>
        </div>
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btnGhost}>Cancelar</button>
          <button onClick={() => form.titulo.trim() && onSave(form)} disabled={!form.titulo.trim()} style={{ ...btnPrimary, opacity: form.titulo.trim() ? 1 : .4, cursor: form.titulo.trim() ? "pointer" : "not-allowed" }}>Criar apontamento</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal upload IFC ─────────────────────────────────────────────────────────
function ModalUpload({ onSave, onClose }) {
  const [file, setFile]   = useState(null);
  const [nome, setNome]   = useState("");
  const [disc, setDisc]   = useState("Arquitetônico");
  const [versao, setVer]  = useState("1");
  const [saving, setSaving] = useState(false);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, width: "100%", maxWidth: 420 }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Importar modelo IFC</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "block", border: `2px dashed ${file ? C.red : C.border}`, borderRadius: 10, padding: "20px", textAlign: "center", cursor: "pointer", background: file ? C.red + "08" : C.darker }}>
            <input type="file" accept=".ifc" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (f) { setFile(f); if (!nome) setNome(f.name.replace(".ifc", "")); } }} />
            <div style={{ fontSize: 28, marginBottom: 6 }}>🧊</div>
            {file ? (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.red }}>{file.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Clique ou arraste o arquivo .IFC</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Tamanho máximo: 100 MB</div>
              </div>
            )}
          </label>
          <Field label="Nome do modelo *">
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Arquitetônico — Rev A" style={inp} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Disciplina">
              <select value={disc} onChange={(e) => setDisc(e.target.value)} style={inp}>
                {DISCIPLINAS_BIM.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Versão / Revisão">
              <input value={versao} onChange={(e) => setVer(e.target.value)} placeholder="Ex: A, 1, Rev02" style={inp} />
            </Field>
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btnGhost}>Cancelar</button>
          <button onClick={async () => { setSaving(true); await onSave(file, { nome, disciplina: disc, versao }); }} disabled={!file || !nome.trim() || saving} style={{ ...btnPrimary, opacity: (!file || !nome.trim() || saving) ? .4 : 1 }}>
            {saving ? "Enviando..." : "⬆ Enviar modelo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers de estilo ────────────────────────────────────────────────────────
const inp      = { width: "100%", padding: "9px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
const btnPrimary = { padding: "9px 20px", borderRadius: 6, border: "none", background: C.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };
const btnGhost   = { padding: "9px 18px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>{label.toUpperCase()}</div>
      {children}
    </div>
  );
}

// ─── Página BIM ───────────────────────────────────────────────────────────────
export default function BIM() {
  useModuleLoad("obras");
  const obras             = useAppStore((s) => s.obras);
  const bimModelos        = useAppStore((s) => s.bimModelos);
  const bimApontamentos   = useAppStore((s) => s.bimApontamentos);
  const loadBimModelos    = useAppStore((s) => s.loadBimModelos);
  const addBimModelo      = useAppStore((s) => s.addBimModelo);
  const deleteBimModelo   = useAppStore((s) => s.deleteBimModelo);
  const loadBimApontamentos  = useAppStore((s) => s.loadBimApontamentos);
  const addBimApontamento    = useAppStore((s) => s.addBimApontamento);
  const updateBimApontamento = useAppStore((s) => s.updateBimApontamento);
  const deleteBimApontamento = useAppStore((s) => s.deleteBimApontamento);

  const [obraId,    setObraId]    = useState(null);
  const [aba,       setAba]       = useState("modelos");
  const [modeloUrl, setModeloUrl] = useState(null);
  const [modeloNome,setModeloNome]= useState("");
  const [modalUpload, setModalUpload] = useState(false);
  const [modalApt,    setModalApt]    = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroPrio,   setFiltroPrio]   = useState("Todos");
  const [toast, setToast] = useState(null);

  useEffect(() => { if (!obraId && obras.length > 0) setObraId(obras[0].id); }, [obras, obraId]);
  useEffect(() => {
    if (obraId) { loadBimModelos(obraId); loadBimApontamentos(obraId); }
  }, [obraId]);

  function mostrarToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3500); }

  const modelos = bimModelos[obraId] || [];
  const apts    = (bimApontamentos[obraId] || []).filter((a) =>
    (filtroStatus === "Todos" || a.status === filtroStatus) &&
    (filtroPrio   === "Todos" || a.prioridade === filtroPrio)
  );

  const stats = {
    total:     (bimApontamentos[obraId] || []).length,
    abertos:   (bimApontamentos[obraId] || []).filter((a) => a.status === "Aberto").length,
    resolvidos:(bimApontamentos[obraId] || []).filter((a) => a.status === "Resolvido").length,
  };

  function abrirModelo(m) {
    const url = `https://gpzmglcxmbboxxogbibq.supabase.co/storage/v1/object/public/bim/${m.storage_path}`;
    setModeloUrl(url);
    setModeloNome(m.nome);
    setAba("viewer");
  }

  if (obras.length === 0) return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🧊</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Nenhuma obra cadastrada</div>
      <div style={{ fontSize: 13, color: C.muted }}>Cadastre uma obra em <strong>Gestão de Obras</strong> para começar.</div>
    </div>
  );

  return (
    <>
      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 999, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 32px #0006" }}>{toast}</div>
      )}
      {modalUpload && (
        <ModalUpload onClose={() => setModalUpload(false)} onSave={async (file, meta) => {
          try {
            await addBimModelo(obraId, file, meta);
            setModalUpload(false);
            mostrarToast("✅ Modelo IFC enviado!");
          } catch (e) {
            setModalUpload(false);
            mostrarToast("❌ Erro ao enviar: " + (e?.message || e));
          }
        }} />
      )}
      {modalApt && (
        <ModalApontamento modelos={modelos} onClose={() => setModalApt(false)} onSave={async (form) => {
          await addBimApontamento(obraId, form);
          setModalApt(false);
          mostrarToast("✅ Apontamento registrado!");
        }} />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>BIM</h2>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Modelos IFC · Visualização 3D · Apontamentos</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setModalApt(true)} style={btnGhost}>+ Apontamento</button>
          <button onClick={() => setModalUpload(true)} style={btnPrimary}>⬆ Importar IFC</button>
        </div>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          ["Modelos IFC", modelos.length, "#4a9eff"],
          ["Apontamentos", stats.total, C.muted],
          ["Abertos",      stats.abertos, "#c0392b"],
          ["Resolvidos",   stats.resolvidos, "#2e9e5b"],
        ].map(([l, v, cor]) => (
          <div key={l} style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, padding: "14px 18px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: cor }}>{v}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 0 }}>
        {[["modelos","🧊 Modelos"],["apontamentos","📌 Apontamentos"],["viewer","🖥 Viewer 3D"]].map(([k, l]) => (
          <button key={k} onClick={() => setAba(k)} style={{
            padding: "10px 20px", background: "transparent", border: "none",
            borderBottom: `2px solid ${aba === k ? C.red : "transparent"}`,
            color: aba === k ? C.text : C.muted,
            fontSize: 13, fontWeight: aba === k ? 700 : 400,
            cursor: "pointer", fontFamily: "inherit",
          }}>{l}{k === "viewer" && modeloNome ? ` — ${modeloNome}` : ""}</button>
        ))}
      </div>

      {/* ABA MODELOS */}
      {aba === "modelos" && (
        <div style={{ background: C.surface, borderRadius: "0 0 12px 12px", border: `1px solid ${C.border}`, borderTop: "none", padding: 22 }}>
          {modelos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🧊</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Nenhum modelo importado</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Importe arquivos .IFC para visualizar em 3D.</div>
              <button onClick={() => setModalUpload(true)} style={btnPrimary}>⬆ Importar primeiro modelo</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {modelos.map((m) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: C.darker, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <div style={{ width: 42, height: 42, borderRadius: 8, background: "#4a9eff20", border: "2px solid #4a9eff44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🧊</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{m.nome}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {m.disciplina} · Rev {m.versao} · {m.tamanho} · {new Date(m.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => abrirModelo(m)} style={{ padding: "7px 16px", borderRadius: 6, border: `1px solid #4a9eff44`, background: "#4a9eff18", color: "#4a9eff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      🖥 Visualizar 3D
                    </button>
                    <button onClick={async () => { await deleteBimModelo(obraId, m.id, m.storage_path); mostrarToast("🗑 Modelo removido."); }} style={{ padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.danger}44`, background: C.danger + "18", color: C.danger, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA APONTAMENTOS */}
      {aba === "apontamentos" && (
        <div style={{ background: C.surface, borderRadius: "0 0 12px 12px", border: `1px solid ${C.border}`, borderTop: "none", padding: 22 }}>
          {/* Filtros */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: .5, marginRight: 4 }}>STATUS</span>
            {["Todos", ...STATUS_APT].map((s) => (
              <button key={s} onClick={() => setFiltroStatus(s)} style={{ padding: "3px 10px", borderRadius: 5, fontSize: 11, fontWeight: filtroStatus === s ? 700 : 400, border: `1px solid ${filtroStatus === s ? (STATUS_COR[s] || C.red) : C.border}`, background: filtroStatus === s ? (STATUS_COR[s] || C.red) + "18" : "transparent", color: filtroStatus === s ? (STATUS_COR[s] || C.text) : C.muted, cursor: "pointer", fontFamily: "inherit" }}>{s}</button>
            ))}
            <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: .5, marginLeft: 12, marginRight: 4 }}>PRIO</span>
            {["Todos", ...PRIORIDADES].map((p) => (
              <button key={p} onClick={() => setFiltroPrio(p)} style={{ padding: "3px 10px", borderRadius: 5, fontSize: 11, fontWeight: filtroPrio === p ? 700 : 400, border: `1px solid ${filtroPrio === p ? (PRIO_COR[p] || C.muted) : C.border}`, background: filtroPrio === p ? (PRIO_COR[p] || C.muted) + "18" : "transparent", color: filtroPrio === p ? (PRIO_COR[p] || C.text) : C.muted, cursor: "pointer", fontFamily: "inherit" }}>{p}</button>
            ))}
          </div>

          {apts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📌</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Nenhum apontamento</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Registre clashes, inconsistências e pendências dos modelos.</div>
              <button onClick={() => setModalApt(true)} style={btnPrimary}>+ Criar apontamento</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {apts.map((a) => {
                const scorCor  = STATUS_COR[a.status] || C.muted;
                const prioCor  = PRIO_COR[a.prioridade] || C.muted;
                return (
                  <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", background: C.darker, borderRadius: 10, border: `1px solid ${a.status === "Aberto" ? "#f5c6c644" : C.border}` }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: prioCor, marginTop: 4, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{a.titulo}</span>
                        <span style={{ background: scorCor + "18", color: scorCor, border: `1px solid ${scorCor}33`, borderRadius: 4, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>{a.status}</span>
                        <span style={{ background: prioCor + "18", color: prioCor, borderRadius: 4, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>{a.prioridade}</span>
                        <span style={{ background: "#41414122", color: C.muted, borderRadius: 4, padding: "1px 8px", fontSize: 10 }}>{a.tipo}</span>
                        <span style={{ background: "#4a9eff18", color: "#4a9eff", borderRadius: 4, padding: "1px 8px", fontSize: 10 }}>{a.disciplina}</span>
                      </div>
                      {a.descricao && <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 4 }}>{a.descricao}</div>}
                      <div style={{ fontSize: 11, color: C.muted }}>
                        {a.responsavel && <><strong style={{ color: C.text }}>{a.responsavel}</strong> · </>}
                        {a.prazo && <>Prazo: {new Date(a.prazo + "T00:00").toLocaleDateString("pt-BR")} · </>}
                        {new Date(a.created_at).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {a.status !== "Resolvido" && (
                        <button onClick={() => updateBimApontamento(obraId, a.id, { status: "Resolvido" })} style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid #2e9e5b44", background: "#2e9e5b18", color: "#2e9e5b", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✓ Resolver</button>
                      )}
                      {a.status !== "Em andamento" && a.status !== "Resolvido" && (
                        <button onClick={() => updateBimApontamento(obraId, a.id, { status: "Em andamento" })} style={{ padding: "5px 10px", borderRadius: 5, border: `1px solid #b97a0044`, background: "#b97a0018", color: "#b97a00", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>→ Iniciar</button>
                      )}
                      <button onClick={async () => { await deleteBimApontamento(obraId, a.id); mostrarToast("🗑 Apontamento removido."); }} style={{ padding: "5px 8px", borderRadius: 5, border: `1px solid ${C.danger}44`, background: C.danger + "18", color: C.danger, fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>🗑</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA VIEWER */}
      {aba === "viewer" && (
        <div style={{ background: "#1a1a1a", borderRadius: "0 0 12px 12px", border: `1px solid ${C.border}`, borderTop: "none", height: 580 }}>
          <IFCViewer url={modeloUrl} />
        </div>
      )}
    </>
  );
}
