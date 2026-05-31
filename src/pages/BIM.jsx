import { useState, useEffect, useRef } from "react";
import { useToast } from "../hooks/useToast";
import { C, FASES } from "../utils/constants";
import { bimUrl } from "../utils/cdn";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";

const DISCIPLINAS_BIM = ["Arquitetônico","Estrutural","Hidrossanitário","Elétrico","HVAC","Fundação","Paisagismo","Outro"];
const TIPOS_APT = ["Clash","Inconsistência","Pendência","Melhoria","Outro"];
const STATUS_APT = ["Aberto","Em andamento","Resolvido","Descartado"];
const PRIORIDADES = ["Alta","Média","Baixa"];
const STATUS_COR = { "Aberto": "#c0392b", "Em andamento": "#b97a00", "Resolvido": "#2e9e5b", "Descartado": C.muted };
const PRIO_COR   = { "Alta": "#c0392b", "Média": "#b97a00", "Baixa": "#2e9e5b" };

// ─── Exportar PDF de apontamentos ────────────────────────────────────────────
function exportarRelatorioApontamentos(apts, obraNome) {
  const hoje = new Date().toLocaleDateString("pt-BR");
  const total = apts.length;
  const abertos = apts.filter(a => a.status === "Aberto").length;
  const emAndamento = apts.filter(a => a.status === "Em andamento").length;
  const resolvidos = apts.filter(a => a.status === "Resolvido").length;

  const linhas = apts.map((a, i) => {
    const corStatus = STATUS_COR[a.status] || "#888";
    const corPrio   = PRIO_COR[a.prioridade] || "#888";
    return `
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="padding:10px 8px;font-size:11px;color:#888">${i + 1}</td>
        <td style="padding:10px 8px;font-size:12px;font-weight:600">${a.titulo}</td>
        <td style="padding:10px 8px;font-size:11px"><span style="background:${corStatus}18;color:${corStatus};border-radius:4px;padding:2px 8px;font-weight:700">${a.status}</span></td>
        <td style="padding:10px 8px;font-size:11px"><span style="background:${corPrio}18;color:${corPrio};border-radius:4px;padding:2px 8px;font-weight:700">${a.prioridade}</span></td>
        <td style="padding:10px 8px;font-size:11px;color:#888">${a.tipo}</td>
        <td style="padding:10px 8px;font-size:11px;color:#4a9eff">${a.disciplina}</td>
        <td style="padding:10px 8px;font-size:11px">${a.responsavel || "—"}</td>
        <td style="padding:10px 8px;font-size:11px;color:#888">${a.prazo ? new Date(a.prazo + "T00:00").toLocaleDateString("pt-BR") : "—"}</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',Arial,sans-serif;background:#fff;color:#1a1a1a;font-size:13px}
    .header{background:#1a1a1a;padding:18px 32px;display:flex;justify-content:space-between;align-items:center}
    .body{padding:24px 32px}
    table{width:100%;border-collapse:collapse}
    th{text-align:left;padding:8px 8px;font-size:10px;font-weight:700;color:#888;letter-spacing:.5px;border-bottom:2px solid #f0f0f0;text-transform:uppercase}
    .footer{background:#f9f9f9;border-top:1px solid #eee;padding:14px 32px;font-size:10px;color:#888;text-align:center}
    @media print{@page{margin:0;size:A4 landscape}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  <div class="header">
    <div>
      <div style="font-size:16px;font-weight:800;letter-spacing:2px"><span style="color:#555">STICK</span><span style="color:#981915">FRAME</span></div>
      <div style="font-size:8px;color:#444;letter-spacing:1.5px;margin-top:2px">SISTEMAS CONSTRUTIVOS</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#555">
      <div style="font-weight:700;color:#fff">Relatório BIM — Apontamentos</div>
      <div>${obraNome} · ${hoje}</div>
    </div>
  </div>
  <div class="body">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
      ${[["Total",total,"#888"],["Abertos",abertos,"#c0392b"],["Em andamento",emAndamento,"#b97a00"],["Resolvidos",resolvidos,"#2e9e5b"]].map(([l,v,c])=>`
        <div style="border:1px solid #e8e8e8;border-top:3px solid ${c};border-radius:8px;padding:12px 16px">
          <div style="font-size:22px;font-weight:800;color:${c}">${v}</div>
          <div style="font-size:10px;color:#888;margin-top:2px;text-transform:uppercase;letter-spacing:.5px">${l}</div>
        </div>`).join("")}
    </div>
    <table>
      <thead><tr>
        <th style="width:30px">#</th>
        <th>Título</th><th>Status</th><th>Prioridade</th>
        <th>Tipo</th><th>Disciplina</th><th>Responsável</th><th>Prazo</th>
      </tr></thead>
      <tbody>${linhas}</tbody>
    </table>
  </div>
  <div class="footer">Stick Frame Sistemas Construtivos · Relatório gerado em ${hoje}</div>
  <script>window.onload=()=>window.print()</script>
  </body></html>`;

  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

// ─── Viewer IFC ───────────────────────────────────────────────────────────────
function IFCViewer({ url, onElementClick }) {
  const containerRef = useRef(null);
  const viewerRef    = useRef(null);
  const [status, setStatus] = useState("idle");
  const [msg,    setMsg]    = useState("");

  // Controles de câmera
  function setCameraView(view) {
    const world = viewerRef.current?.world;
    if (!world) return;
    const ctrl = world.camera.controls;
    if (view === "top")     ctrl.setLookAt(0, 20, 0,   0, 0, 0, true);
    if (view === "front")   ctrl.setLookAt(0, 5,  20,  0, 5, 0, true);
    if (view === "side")    ctrl.setLookAt(20, 5,  0,  0, 5, 0, true);
    if (view === "fit")     ctrl.setLookAt(12, 6,  8,  0, 0, -10, true);
  }

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

        setMsg("Inicializando motor de fragmentos...");
        const fragments = components.get(OBC.FragmentsManager);
        fragments.init(`${window.location.origin}/fragments-worker.mjs`);

        const ifcLoader = components.get(OBC.IfcLoader);
        await ifcLoader.setup();

        setMsg("Carregando modelo IFC...");
        const controller = new AbortController();
        const resp  = await fetch(url, { signal: controller.signal });
        if (destroyed) { controller.abort(); components.dispose(); return; }
        const buff  = await resp.arrayBuffer();
        const model = await ifcLoader.load(new Uint8Array(buff));
        world.scene.three.add(model);

        // Clique em elemento → notifica pai
        if (onElementClick) {
          world.renderer.onClicked.add(async ({ hits }) => {
            if (!hits?.length) return;
            const hit = hits[0];
            onElementClick({ expressId: hit.id, modelId: model.uuid });
          });
        }

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

      {/* Toolbar de câmera */}
      {status === "loaded" && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          display: "flex", flexDirection: "column", gap: 4,
          background: "rgba(0,0,0,.6)", borderRadius: 8, padding: 6,
          backdropFilter: "blur(6px)",
        }}>
          {[
            { icon: "⊙", label: "Ajustar", view: "fit" },
            { icon: "⬆", label: "Topo",   view: "top" },
            { icon: "▣",  label: "Frente", view: "front" },
            { icon: "◧",  label: "Lateral",view: "side" },
          ].map(({ icon, label, view }) => (
            <button key={view} onClick={() => setCameraView(view)} title={label} style={{
              width: 32, height: 32, borderRadius: 6, border: "1px solid #ffffff22",
              background: "#ffffff11", color: "#fff", fontSize: 14,
              cursor: "pointer", fontFamily: "inherit", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>{icon}</button>
          ))}
        </div>
      )}

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
function ModalApontamento({ modelos, elementoSelecionado, onSave, onClose }) {
  const [form, setForm] = useState({
    titulo: elementoSelecionado ? `Elemento #${elementoSelecionado.expressId}` : "",
    descricao: elementoSelecionado ? `Express ID: ${elementoSelecionado.expressId}` : "",
    disciplina: "Arquitetônico", tipo: "Clash", status: "Aberto",
    prioridade: "Alta", responsavel: "", prazo: "", modelo_id: "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: typeof e === "string" ? e : e.target.value }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>
            {elementoSelecionado ? "📌 Apontamento no elemento" : "Novo Apontamento"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
        </div>

        {elementoSelecionado && (
          <div style={{ margin: "14px 24px 0", background: "#4a9eff18", border: "1px solid #4a9eff33", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#4a9eff" }}>
            🧊 Elemento selecionado no modelo · Express ID: <strong>{elementoSelecionado.expressId}</strong>
          </div>
        )}

        <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
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
const inp        = { width: "100%", padding: "9px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
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
  const obras                = useAppStore((s) => s.obras);
  const bimModelos           = useAppStore((s) => s.bimModelos);
  const bimApontamentos      = useAppStore((s) => s.bimApontamentos);
  const loadBimModelos       = useAppStore((s) => s.loadBimModelos);
  const addBimModelo         = useAppStore((s) => s.addBimModelo);
  const deleteBimModelo      = useAppStore((s) => s.deleteBimModelo);
  const loadBimApontamentos  = useAppStore((s) => s.loadBimApontamentos);
  const addBimApontamento    = useAppStore((s) => s.addBimApontamento);
  const updateBimApontamento = useAppStore((s) => s.updateBimApontamento);
  const deleteBimApontamento = useAppStore((s) => s.deleteBimApontamento);

  const [obraId,     setObraId]     = useState(null);
  const [aba,        setAba]        = useState("modelos");
  const [modeloUrl,  setModeloUrl]  = useState(null);
  const [modeloNome, setModeloNome] = useState("");
  const [modalUpload,  setModalUpload]  = useState(false);
  const [modalApt,     setModalApt]     = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroPrio,   setFiltroPrio]   = useState("Todos");
  const [filtroDisciplina, setFiltroDisciplina] = useState("Todas");
  const [elementoSelecionado, setElementoSelecionado] = useState(null);

  useEffect(() => { if (!obraId && obras.length > 0) setObraId(obras[0].id); }, [obras, obraId]);
  useEffect(() => {
    if (obraId) { loadBimModelos(obraId); loadBimApontamentos(obraId); }
  }, [obraId]);

  const modelos  = bimModelos[obraId] || [];
  const todosApt = bimApontamentos[obraId] || [];
  const apts = todosApt.filter((a) =>
    (filtroStatus === "Todos" || a.status === filtroStatus) &&
    (filtroPrio   === "Todos" || a.prioridade === filtroPrio) &&
    (filtroDisciplina === "Todas" || a.disciplina === filtroDisciplina)
  );

  // Histórico de revisões: agrupa modelos pelo nome base (antes de " — ")
  const revisoes = modelos.reduce((acc, m) => {
    const base = m.nome?.split("—")[0]?.trim() || m.nome;
    if (!acc[base]) acc[base] = [];
    acc[base].push(m);
    return acc;
  }, {});

  const stats = {
    total:      todosApt.length,
    abertos:    todosApt.filter((a) => a.status === "Aberto").length,
    resolvidos: todosApt.filter((a) => a.status === "Resolvido").length,
    alta:       todosApt.filter((a) => a.prioridade === "Alta" && a.status === "Aberto").length,
  };

  const obraAtual = obras.find((o) => o.id === obraId);

  function abrirModelo(m) {
    const url = bimUrl(m.storage_path);
    setModeloUrl(url);
    setModeloNome(m.nome);
    setAba("viewer");
  }

  function handleElementClick(info) {
    setElementoSelecionado(info);
    setModalApt(true);
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
        <ModalApontamento
          modelos={modelos}
          elementoSelecionado={elementoSelecionado}
          onClose={() => { setModalApt(false); setElementoSelecionado(null); }}
          onSave={async (form) => {
            await addBimApontamento(obraId, form);
            setModalApt(false);
            setElementoSelecionado(null);
            mostrarToast("✅ Apontamento registrado!");
          }}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>BIM</h2>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Modelos IFC · Visualização 3D · Apontamentos</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {todosApt.length > 0 && (
            <button onClick={() => exportarRelatorioApontamentos(todosApt, obraAtual?.nome || "Obra")} style={btnGhost}>
              📄 Exportar relatório
            </button>
          )}
          <button onClick={() => { setElementoSelecionado(null); setModalApt(true); }} style={btnGhost}>+ Apontamento</button>
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
          ["Modelos IFC",   modelos.length,  "#4a9eff"],
          ["Apontamentos",  stats.total,     C.muted],
          ["Alta prioridade", stats.alta,    "#c0392b"],
          ["Resolvidos",    stats.resolvidos,"#2e9e5b"],
        ].map(([l, v, cor]) => (
          <div key={l} style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, padding: "14px 18px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: cor }}>{v}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 0 }}>
        {[
          ["modelos",      "🧊 Modelos"],
          ["revisoes",     "🔄 Revisões"],
          ["apontamentos", "📌 Apontamentos"],
          ["viewer",       "🖥 Viewer 3D"],
        ].map(([k, l]) => (
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
                    <button onClick={() => abrirModelo(m)} style={{ padding: "7px 16px", borderRadius: 6, border: "1px solid #4a9eff44", background: "#4a9eff18", color: "#4a9eff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
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

      {/* ABA REVISÕES */}
      {aba === "revisoes" && (
        <div style={{ background: C.surface, borderRadius: "0 0 12px 12px", border: `1px solid ${C.border}`, borderTop: "none", padding: 22 }}>
          {modelos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔄</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Nenhum modelo para comparar</div>
              <div style={{ fontSize: 13, color: C.muted }}>Importe modelos com o mesmo nome base para ver o histórico de revisões.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {Object.entries(revisoes).map(([base, revs]) => (
                <div key={base} style={{ background: C.darker, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                  <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{base}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{revs.length} revisão(ões)</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {[...revs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((m, i) => (
                      <div key={m.id} style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "12px 18px",
                        borderBottom: i < revs.length - 1 ? `1px solid ${C.border}` : "none",
                        background: i === 0 ? C.red + "08" : "transparent",
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: i === 0 ? C.red : "#41414144",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 800, color: i === 0 ? "#fff" : C.muted, flexShrink: 0,
                        }}>
                          {i === 0 ? "✓" : `R${revs.length - i}`}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? C.text : C.muted }}>
                            Rev {m.versao} {i === 0 && <span style={{ fontSize: 10, background: C.red + "22", color: C.red, borderRadius: 4, padding: "1px 6px", marginLeft: 6 }}>ATUAL</span>}
                          </div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                            {m.disciplina} · {m.tamanho} · {new Date(m.created_at).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                        <button onClick={() => abrirModelo(m)} style={{ padding: "5px 12px", borderRadius: 5, border: "1px solid #4a9eff44", background: "#4a9eff18", color: "#4a9eff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                          🖥 Abrir
                        </button>
                      </div>
                    ))}
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
            <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: .5, marginLeft: 12, marginRight: 4 }}>DISC.</span>
            {["Todas", ...DISCIPLINAS_BIM].map((d) => (
              <button key={d} onClick={() => setFiltroDisciplina(d)} style={{ padding: "3px 10px", borderRadius: 5, fontSize: 11, fontWeight: filtroDisciplina === d ? 700 : 400, border: `1px solid ${filtroDisciplina === d ? "#4a9eff" : C.border}`, background: filtroDisciplina === d ? "#4a9eff18" : "transparent", color: filtroDisciplina === d ? "#4a9eff" : C.muted, cursor: "pointer", fontFamily: "inherit" }}>{d}</button>
            ))}
            {todosApt.length > 0 && (
              <button onClick={() => exportarRelatorioApontamentos(apts, obraAtual?.nome || "Obra")} style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 5, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                📄 PDF
              </button>
            )}
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
                const scorCor = STATUS_COR[a.status] || C.muted;
                const prioCor = PRIO_COR[a.prioridade] || C.muted;
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
                        <button onClick={() => updateBimApontamento(obraId, a.id, { status: "Em andamento" })} style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid #b97a0044", background: "#b97a0018", color: "#b97a00", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>→ Iniciar</button>
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
        <div style={{ background: "#1a1a1a", borderRadius: "0 0 12px 12px", border: `1px solid ${C.border}`, borderTop: "none" }}>
          {modeloUrl ? (
            <div style={{ height: 600 }}>
              <IFCViewer url={modeloUrl} onElementClick={handleElementClick} />
              <div style={{ padding: "8px 14px", background: "#111", fontSize: 11, color: "#555", borderTop: "1px solid #222", display: "flex", gap: 20 }}>
                <span>🖱 Arrastar: orbitar · Scroll: zoom · Shift+arrastar: pan</span>
                <span>· Clique em elemento para criar apontamento</span>
              </div>
            </div>
          ) : (
            <div style={{ height: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
              <div style={{ fontSize: 36 }}>🖥</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#555" }}>Nenhum modelo aberto</div>
              <div style={{ fontSize: 12, color: "#444", marginBottom: 8 }}>Vá para "Modelos" e clique em "Visualizar 3D"</div>
              <button onClick={() => setAba("modelos")} style={{ ...btnPrimary, fontSize: 12 }}>🧊 Ver modelos</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
