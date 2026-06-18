import * as Sentry from "@sentry/react";
import { AlertTriangle, Box, FileText, Trash2 } from "../components/ui/Icon";
import { useState, useEffect, useRef } from "react";
import { useToast } from "../hooks/useToast";
import { C, FASES } from "../utils/constants";
import { bimUrl } from "../utils/cdn";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import { useSearchParams } from "react-router-dom";

const DISCIPLINAS_BIM = ["Arquitetônico","Estrutural","Hidrossanitário","Elétrico","HVAC","Fundação","Paisagismo","Outro"];
const TIPOS_APT = ["Clash","Inconsistência","Pendência","Melhoria","Outro"];
const STATUS_APT = ["Aberto","Em andamento","Resolvido","Descartado"];
const PRIORIDADES = ["Alta","Média","Baixa"];
const STATUS_COR = { "Aberto": "#c0392b", "Em andamento": "#b97a00", "Resolvido": "#2e9e5b", "Descartado": C.muted };
const PRIO_COR   = { "Alta": "#c0392b", "Média": "#b97a00", "Baixa": "#2e9e5b" };

//  Exportar PDF de apontamentos 
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
        <td style="padding:10px 8px;font-size:11px;color:var(--steel)">${a.disciplina}</td>
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

  printHtml(html, `bim-apontamentos-${obraNome.replace(/\s+/g, "-").toLowerCase()}`);
}

//  Viewer DAE (Collada) 
function DAEViewer({ url }) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [msg,    setMsg]    = useState("Carregando modelo DAE...");

  useEffect(() => {
    if (!url || !containerRef.current) return;
    let destroyed = false;
    let animId;
    let renderer;

    (async () => {
      try {
        const THREE = await import("three");
        const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
        const { ColladaLoader } = await import("three/addons/loaders/ColladaLoader.js");
        if (destroyed) return;

        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;

        const scene    = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a);

        const ambLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(10, 20, 10);
        scene.add(dirLight);

        // Grid
        const grid = new THREE.GridHelper(100, 50, 0x333333, 0x222222);
        scene.add(grid);

        const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 10000);
        camera.position.set(10, 8, 10);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        const loader = new ColladaLoader();
        loader.load(url, (collada) => {
          if (destroyed) return;
          const model = collada.scene;

          // Centraliza e escala automaticamente
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size   = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale  = maxDim > 0 ? 10 / maxDim : 1;
          model.scale.setScalar(scale);
          model.position.sub(center.multiplyScalar(scale));

          scene.add(model);
          const dist = maxDim * scale * 1.5;
          camera.position.set(dist, dist * 0.6, dist);
          controls.target.set(0, 0, 0);
          controls.update();

          setStatus("loaded");
        }, undefined, (e) => {
          if (!destroyed) { setStatus("error"); setMsg(String(e?.message || "Erro ao carregar DAE")); }
        });

        const animate = () => {
          if (destroyed) return;
          animId = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
          if (!containerRef.current || destroyed) return;
          const w2 = containerRef.current.clientWidth;
          const h2 = containerRef.current.clientHeight;
          camera.aspect = w2 / h2;
          camera.updateProjectionMatrix();
          renderer.setSize(w2, h2);
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
      } catch (e) {
        if (!destroyed) { setStatus("error"); setMsg(String(e?.message || e)); }
      }
    })();

    return () => {
      destroyed = true;
      cancelAnimationFrame(animId);
      if (renderer) { renderer.dispose(); renderer.domElement?.remove(); }
    };
  }, [url]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#1a1a1a", borderRadius: 10, overflow: "hidden" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {status !== "loaded" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, pointerEvents: "none" }}>
          {status === "loading" && (
            <>
              <div style={{ width: 36, height: 36, border: "3px solid #333", borderTop: "3px solid #981915", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
              <div style={{ fontSize: 12, color: "#666" }}>{msg}</div>
            </>
          )}
          {status === "error" && (
            <div style={{ textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}></div>
              <div style={{ fontSize: 13, color: "#c0392b", marginBottom: 6 }}>Erro ao carregar modelo</div>
              <div style={{ fontSize: 11, color: "#888", maxWidth: 300, lineHeight: 1.5 }}>{msg}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

//  Smart Viewer (IFC ou DAE) 
function ModelViewer({ url, onElementClick, highlightElementId }) {
  if (!url) return null;
  const ext = url.split("?")[0].split(".").pop().toLowerCase();
  if (ext === "dae") return <DAEViewer url={url} />;
  return <IFCViewer url={url} onElementClick={onElementClick} highlightElementId={highlightElementId} />;
}

//  Viewer IFC 
function IFCViewer({ url, onElementClick, highlightElementId }) {
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

        // Highlight de elemento específico (ex: painel vindo do QR Code)
        if (highlightElementId) {
          try {
            const THREE = await import("three");
            const targetId = Number(highlightElementId);
            const highlightMat = new THREE.MeshStandardMaterial({ color: 0xcc2200, emissive: 0x661100, transparent: true, opacity: 0.92 });
            const ghostMat     = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.15, depthWrite: false });

            model.traverse((child) => {
              if (!child.isMesh) return;
              const geom = child.geometry;
              if (!geom?.groups?.length) {
                // Sem grupos: tenta pelo userData
                const eid = child.userData?.expressID ?? child.userData?.id;
                if (eid === targetId) {
                  child.material = highlightMat;
                } else {
                  child.material = ghostMat;
                }
                return;
              }
              // Com grupos (fragmentos mesclados): colore grupo pelo expressId
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              const newMats = mats.map((m, i) => {
                const gIds = geom.groups[i]?.expressIDs || geom.groups[i]?.ids;
                if (gIds && (gIds.has ? gIds.has(targetId) : gIds.includes(targetId))) return highlightMat;
                return ghostMat;
              });
              child.material = newMats;
            });

            // Centraliza câmera no elemento destacado
            const box = new THREE.Box3();
            model.traverse((c) => { if (c.isMesh && c.material === highlightMat) box.expandByObject(c); });
            if (!box.isEmpty()) {
              const center = box.getCenter(new THREE.Vector3());
              const size   = box.getSize(new THREE.Vector3());
              const dist   = Math.max(size.length() * 2, 8);
              world.camera.controls.setLookAt(center.x + dist, center.y + dist * 0.5, center.z + dist, center.x, center.y, center.z, true);
            }
          } catch (_) { /* highlight opcional, não bloqueia viewer */ }
        }

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
        try { viewerRef.current.components.dispose(); } catch (disposeErr) { Sentry.captureException(disposeErr); }
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
            { icon: "", label: "Topo",   view: "top" },
            { icon: "",  label: "Frente", view: "front" },
            { icon: "",  label: "Lateral",view: "side" },
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
              <div style={{ fontSize: 40, marginBottom: 10 }}><Box size={36} /></div>
              <div style={{ fontSize: 13, color: "#555" }}>Selecione um modelo IFC para visualizar</div>
            </div>
          )}
          {status === "error" && (
            <div style={{ textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}><AlertTriangle size={14} /></div>
              <div style={{ fontSize: 13, color: "#c0392b", marginBottom: 6 }}>Erro ao carregar modelo</div>
              <div style={{ fontSize: 11, color: "#888", maxWidth: 300, lineHeight: 1.5 }}>{msg}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

//  Modal de apontamento 
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
            {elementoSelecionado ? " Apontamento no elemento" : "Novo Apontamento"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
        </div>

        {elementoSelecionado && (
          <div style={{ margin: "14px 24px 0", background: "#3b6ea518", border: "1px solid #3b6ea533", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--steel)" }}>
             Elemento selecionado no modelo · Express ID: <strong>{elementoSelecionado.expressId}</strong>
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

//  Modal upload IFC / DAE 
function ModalUpload({ onSave, onClose }) {
  const [file, setFile]   = useState(null);
  const [nome, setNome]   = useState("");
  const [disc, setDisc]   = useState("Arquitetônico");
  const [versao, setVer]  = useState("1");
  const [saving, setSaving] = useState(false);

  const fileExt = file ? file.name.split(".").pop().toLowerCase() : null;
  const isDAE   = fileExt === "dae";

  function handleFile(f) {
    if (!f) return;
    setFile(f);
    if (!nome) setNome(f.name.replace(/\.(ifc|dae)$/i, ""));
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, width: "100%", maxWidth: 420 }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Importar modelo 3D</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <label
            style={{ display: "block", border: `2px dashed ${file ? C.red : C.border}`, borderRadius: 10, padding: "20px", textAlign: "center", cursor: "pointer", background: file ? C.red + "08" : C.darker }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          >
            <input type="file" accept=".ifc,.dae" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
            <div style={{ fontSize: 28, marginBottom: 6 }}><Box size={36} /></div>
            {file ? (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.red }}>{file.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB · {isDAE ? "Collada DAE" : "IFC BIM"}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Clique ou arraste o arquivo</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                  <span style={{ background: "#3b6ea522", color: "var(--steel)", borderRadius: 4, padding: "2px 8px", marginRight: 6 }}>.IFC</span>
                  <span style={{ background: "#2e9e5b22", color: "#2e9e5b", borderRadius: 4, padding: "2px 8px" }}>.DAE</span>
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>Tamanho máximo: 100 MB</div>
              </div>
            )}
          </label>
          {isDAE && (
            <div style={{ background: "#2e9e5b18", border: "1px solid #2e9e5b33", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#2e9e5b" }}>
               Collada DAE · Visualização via Three.js — compatível com Blender, SketchUp e Revit exportados
            </div>
          )}
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
            {saving ? "Enviando..." : " Enviar modelo"}
          </button>
        </div>
      </div>
    </div>
  );
}

//  Helpers de estilo 
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

//  Página BIM 
//  Kits para o preview 3D 
const KITS_3D = [
  { id: "studio",    nome: "Studio 42m²",         area: 42,  larg: 7,  comp: 6,  pavs: 1, quartos: 1, cor: "#3b6ea5" },
  { id: "vila",      nome: "Vila 78m²",            area: 78,  larg: 9,  comp: 8.5,pavs: 1, quartos: 2, cor: "#2e9e5b" },
  { id: "casa120",   nome: "Casa Serena 120m²",    area: 120, larg: 12, comp: 10, pavs: 1, quartos: 3, cor: "#981915" },
  { id: "sobrado",   nome: "Sobrado 160m²",        area: 160, larg: 10, comp: 8,  pavs: 2, quartos: 3, cor: "#8b5cf6" },
  { id: "alto200",   nome: "Residência Alto 200m²",area: 200, larg: 14, comp: 14, pavs: 1, quartos: 4, cor: "#e07020" },
  { id: "vigo273",   nome: "Casa Vigo 273m²",      area: 273, larg: 16, comp: 17, pavs: 2, quartos: 4, cor: "#c0392b" },
];

function KitPreview3D() {
  const canvasRef = useRef(null);
  const [kitSel, setKitSel] = useState(KITS_3D[2]);
  const [loading, setLoading] = useState(false);
  const rendererRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !kitSel) return;
    setLoading(true);
    let renderer, animId;

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");

      // Limpa anterior
      if (rendererRef.current) { rendererRef.current.dispose(); canvasRef.current.innerHTML = ""; }

      const w = canvasRef.current.clientWidth || 800;
      const h = canvasRef.current.clientHeight || 500;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f0f14);

      // Grid
      const grid = new THREE.GridHelper(60, 30, 0x222233, 0x111122);
      scene.add(grid);

      // Luz
      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const dir = new THREE.DirectionalLight(0xffffff, 1.2);
      dir.position.set(20, 40, 20);
      dir.castShadow = true;
      scene.add(dir);
      const dir2 = new THREE.DirectionalLight(0x8888ff, 0.3);
      dir2.position.set(-20, 10, -10);
      scene.add(dir2);

      const kit = kitSel;
      const PAV_H = 3.0;
      const W = kit.larg, D = kit.comp;

      // Função para criar parede com janelas
      function addWall(x, y, z, wx, wy, wz, cor) {
        const geo = new THREE.BoxGeometry(wx, wy, wz);
        const mat = new THREE.MeshLambertMaterial({ color: cor });
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        scene.add(m);
        // linha de wireframe
        const edge = new THREE.LineSegments(
          new THREE.EdgesGeometry(geo),
          new THREE.LineBasicMaterial({ color: 0x333344, linewidth: 1 })
        );
        edge.position.set(x, y, z);
        scene.add(edge);
      }

      for (let pav = 0; pav < kit.pavs; pav++) {
        const yBase = pav * PAV_H;
        const wallColor = pav === 0 ? 0xd4c9b8 : 0xcfc6b5;

        // Piso
        addWall(0, yBase - 0.05, 0, W, 0.1, D, 0x888877);

        // Paredes externas
        const wt = 0.2;
        addWall(0,          yBase + PAV_H/2, -D/2,      W, PAV_H, wt,  wallColor); // frente
        addWall(0,          yBase + PAV_H/2,  D/2,      W, PAV_H, wt,  wallColor); // fundo
        addWall(-W/2,       yBase + PAV_H/2,  0,        wt, PAV_H, D, wallColor); // esq
        addWall( W/2,       yBase + PAV_H/2,  0,        wt, PAV_H, D, wallColor); // dir

        // Paredes internas — divisões de cômodos
        if (kit.quartos >= 2) {
          addWall(W * 0.1, yBase + PAV_H/2, D * 0.1, wt, PAV_H, D * 0.6, 0xc8bfae);
        }
        if (kit.quartos >= 3) {
          addWall(-W * 0.2, yBase + PAV_H/2, D * 0.05, wt, PAV_H, D * 0.5, 0xc8bfae);
        }

        // Janelas (aberturas em cor azul claro)
        const janelaH = 1.2, janelaW = 1.5, janelaY = yBase + 1.6;
        [[0, janelaY, -D/2], [W*0.25, janelaY, -D/2], [-W*0.25, janelaY, -D/2]].forEach(([x,y,z]) => {
          const jGeo = new THREE.BoxGeometry(janelaW, janelaH, 0.05);
          const jMat = new THREE.MeshLambertMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.6 });
          const j = new THREE.Mesh(jGeo, jMat);
          j.position.set(x, y, z);
          scene.add(j);
        });

        // Porta
        const pGeo = new THREE.BoxGeometry(0.9, 2.2, 0.05);
        const pMat = new THREE.MeshLambertMaterial({ color: 0x6b4c2a });
        const porta = new THREE.Mesh(pGeo, pMat);
        porta.position.set(W * 0.15, yBase + 1.1, -D/2);
        scene.add(porta);
      }

      // Telhado — pirâmide/cume
      const roofY = kit.pavs * PAV_H;
      if (kit.pavs === 1) {
        // Telhado duas águas simples
        const shape = new THREE.Shape();
        shape.moveTo(-W/2 - 0.5, 0);
        shape.lineTo(0, 2.8);
        shape.lineTo(W/2 + 0.5, 0);
        shape.lineTo(-W/2 - 0.5, 0);
        const extSettings = { depth: D + 1, bevelEnabled: false };
        const roofGeo = new THREE.ExtrudeGeometry(shape, extSettings);
        const roofMat = new THREE.MeshLambertMaterial({ color: 0x8b3a2a });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(0, roofY, -D/2 - 0.5);
        scene.add(roof);
        const roofEdge = new THREE.LineSegments(new THREE.EdgesGeometry(roofGeo), new THREE.LineBasicMaterial({ color: 0x5a2010 }));
        roofEdge.position.copy(roof.position);
        scene.add(roofEdge);
      } else {
        // Terraço plano no 2º pav
        addWall(0, roofY + 0.1, 0, W + 0.4, 0.2, D + 0.4, 0x888877);
        // Guarda-corpo
        [[0, roofY+0.5, -D/2],[0, roofY+0.5, D/2],[-W/2, roofY+0.5, 0],[W/2, roofY+0.5, 0]]
          .forEach(([x,y,z], i) => {
            const isZ = i < 2;
            addWall(x, y, z, isZ ? W : 0.1, 1, isZ ? 0.1 : D, 0xcccccc);
          });
      }

      // Grama/terreno
      const terrGeo = new THREE.PlaneGeometry(W + 20, D + 20);
      const terrMat = new THREE.MeshLambertMaterial({ color: 0x2d5a1b });
      const terr = new THREE.Mesh(terrGeo, terrMat);
      terr.rotation.x = -Math.PI / 2;
      terr.position.y = -0.06;
      scene.add(terr);

      // Câmera
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
      const dist = Math.max(W, D) * 1.5;
      camera.position.set(dist, dist * 0.7, dist);
      camera.lookAt(0, kit.pavs * PAV_H / 2, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      canvasRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.target.set(0, kit.pavs * PAV_H / 2, 0);
      controls.update();

      setLoading(false);

      function animate() { animId = requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); }
      animate();
      animRef.current = animId;
    })();

    return () => {
      cancelAnimationFrame(animRef.current);
      if (rendererRef.current) { rendererRef.current.dispose(); }
    };
  }, [kitSel]);

  return (
    <div style={{ background: "#0f0f14", borderRadius: "0 0 12px 12px", border: `1px solid ${C.border}`, borderTop: "none" }}>
      {/* seletor de kit */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #1a1a2e", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#555", fontWeight: 700, letterSpacing: 1, marginRight: 4 }}>MODELO:</span>
        {KITS_3D.map(k => (
          <button key={k.id} onClick={() => setKitSel(k)} style={{
            padding: "6px 14px", borderRadius: 8, border: `1px solid ${kitSel?.id === k.id ? k.cor : "#333"}`,
            background: kitSel?.id === k.id ? k.cor + "22" : "transparent",
            color: kitSel?.id === k.id ? k.cor : "#666",
            fontSize: 11, fontWeight: kitSel?.id === k.id ? 700 : 400,
            cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
          }}>{k.nome}</button>
        ))}
      </div>

      {/* viewer */}
      <div style={{ position: "relative", height: 520 }}>
        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0f14", zIndex: 10 }}>
            <div style={{ color: "#555", fontSize: 14 }}>Gerando modelo 3D...</div>
          </div>
        )}
        <div ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      </div>

      {/* info bar */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid #1a1a2e", display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "#444" }}> Arrastar: orbitar · Scroll: zoom · Shift+drag: pan</span>
        {kitSel && (
          <div style={{ display: "flex", gap: 16, marginLeft: "auto" }}>
            {[
              { icon: "", val: `${kitSel.area} m²` },
              { icon: "", val: `${kitSel.pavs} pav.` },
              { icon: "", val: `${kitSel.quartos} qts` },
            ].map(({ icon, val }) => (
              <div key={val} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 12 }}>{icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#888" }}>{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BIM() {
  const { toast, mostrarToast } = useToast();
  useModuleLoad("obras");
  const [searchParams] = useSearchParams();
  const urlObraId    = searchParams.get("obraId");
  const urlElementId = searchParams.get("elementId");
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

  useEffect(() => {
    if (urlObraId) setObraId(urlObraId);
    else if (!obraId && obras.length > 0) setObraId(obras[0].id);
  }, [obras, obraId, urlObraId]);

  useEffect(() => {
    if (obraId) { loadBimModelos(obraId); loadBimApontamentos(obraId); }
  }, [obraId]);

  // Se veio do QR do painel com elementId → auto-abre o primeiro modelo e destaca
  useEffect(() => {
    if (!urlElementId || !obraId) return;
    const modList = bimModelos[obraId];
    if (!modList?.length) return;
    const primeiro = modList[0];
    setModeloUrl(bimUrl(primeiro.storage_path));
    setModeloNome(`${primeiro.nome} — Painel #${urlElementId}`);
    setAba("viewer");
  }, [urlElementId, obraId, bimModelos]);


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
      <div style={{ fontSize: 40, marginBottom: 16 }}><Box size={36} /></div>
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
            mostrarToast(" Modelo IFC enviado!");
          } catch (e) {
            setModalUpload(false);
            mostrarToast(" Erro ao enviar: " + (e?.message || e));
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
            mostrarToast(" Apontamento registrado!");
          }}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ width: 4, height: 42, borderRadius: 3, background: "var(--brick)", flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontFamily: "var(--cond)", fontWeight: 700, fontSize: 28, color: "var(--ink)", lineHeight: 1 }}>BIM</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Modelos IFC · Visualização 3D · Apontamentos</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {todosApt.length > 0 && (
            <button onClick={() => exportarRelatorioApontamentos(todosApt, obraAtual?.nome || "Obra")} style={btnGhost}>
               Exportar relatório
            </button>
          )}
          <button onClick={() => { setElementoSelecionado(null); setModalApt(true); }} style={btnGhost}>+ Apontamento</button>
          <button onClick={() => setModalUpload(true)} style={btnPrimary}> Importar modelo</button>
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
          ["Modelos 3D",    modelos.length,  "var(--steel)"],
          ["Apontamentos",  stats.total,     "var(--muted)"],
          ["Alta prioridade", stats.alta,    "var(--neg)"],
          ["Resolvidos",    stats.resolvidos,"var(--pos)"],
        ].map(([l, v, cor]) => (
          <div key={l} style={{ background: "var(--surface)", borderRadius: 12, border: "1px solid var(--line)", padding: "16px 18px" }}>
            <div style={{ height: 3, width: 28, borderRadius: 2, background: cor, marginBottom: 12 }} />
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>{l}</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 700, color: cor === "var(--muted)" ? "var(--ink)" : cor, lineHeight: 1 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 0 }}>
        {[
          ["modelos",      " Modelos"],
          ["revisoes",     " Revisões"],
          ["apontamentos", " Apontamentos"],
          ["viewer",       " Viewer 3D"],
          ["preview",      " Preview Kit"],
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
              <div style={{ fontSize: 36, marginBottom: 12 }}><Box size={36} /></div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Nenhum modelo importado</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Importe arquivos .IFC ou .DAE para visualizar em 3D.</div>
              <button onClick={() => setModalUpload(true)} style={btnPrimary}> Importar primeiro modelo</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {modelos.map((m) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: C.darker, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <div style={{ width: 42, height: 42, borderRadius: 8, background: "#3b6ea520", border: "2px solid #3b6ea544", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}><Box size={36} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{m.nome}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {m.disciplina} · Rev {m.versao} · {m.tamanho} · {new Date(m.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => abrirModelo(m)} style={{ padding: "7px 16px", borderRadius: 6, border: "1px solid #3b6ea544", background: "#3b6ea518", color: "var(--steel)", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                       Visualizar 3D
                    </button>
                    <button onClick={async () => { await deleteBimModelo(obraId, m.id, m.storage_path); mostrarToast(" Modelo removido."); }} style={{ padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.danger}44`, background: C.danger + "18", color: C.danger, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}><Trash2 size={13} /></button>
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
              <div style={{ fontSize: 36, marginBottom: 12 }}></div>
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
                          {i === 0 ? "" : `R${revs.length - i}`}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? C.text : C.muted }}>
                            Rev {m.versao} {i === 0 && <span style={{ fontSize: 10, background: C.red + "22", color: C.red, borderRadius: 4, padding: "1px 6px", marginLeft: 6 }}>ATUAL</span>}
                          </div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                            {m.disciplina} · {m.tamanho} · {new Date(m.created_at).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                        <button onClick={() => abrirModelo(m)} style={{ padding: "5px 12px", borderRadius: 5, border: "1px solid #3b6ea544", background: "#3b6ea518", color: "var(--steel)", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                           Abrir
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
              <button key={d} onClick={() => setFiltroDisciplina(d)} style={{ padding: "3px 10px", borderRadius: 5, fontSize: 11, fontWeight: filtroDisciplina === d ? 700 : 400, border: `1px solid ${filtroDisciplina === d ? "var(--steel)" : C.border}`, background: filtroDisciplina === d ? "#3b6ea518" : "transparent", color: filtroDisciplina === d ? "var(--steel)" : C.muted, cursor: "pointer", fontFamily: "inherit" }}>{d}</button>
            ))}
            {todosApt.length > 0 && (
              <button onClick={() => exportarRelatorioApontamentos(apts, obraAtual?.nome || "Obra")} style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 5, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                <FileText size={13} /> PDF
              </button>
            )}
          </div>

          {apts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}></div>
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
                        <span style={{ background: "#3b6ea518", color: "var(--steel)", borderRadius: 4, padding: "1px 8px", fontSize: 10 }}>{a.disciplina}</span>
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
                        <button onClick={() => updateBimApontamento(obraId, a.id, { status: "Resolvido" })} style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid #2e9e5b44", background: "#2e9e5b18", color: "#2e9e5b", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}> Resolver</button>
                      )}
                      {a.status !== "Em andamento" && a.status !== "Resolvido" && (
                        <button onClick={() => updateBimApontamento(obraId, a.id, { status: "Em andamento" })} style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid #b97a0044", background: "#b97a0018", color: "#b97a00", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>→ Iniciar</button>
                      )}
                      <button onClick={async () => { await deleteBimApontamento(obraId, a.id); mostrarToast(" Apontamento removido."); }} style={{ padding: "5px 8px", borderRadius: 5, border: `1px solid ${C.danger}44`, background: C.danger + "18", color: C.danger, fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA VIEWER */}
      {aba === "preview" && <KitPreview3D />}

      {aba === "viewer" && (
        <div style={{ background: "#1a1a1a", borderRadius: "0 0 12px 12px", border: `1px solid ${C.border}`, borderTop: "none" }}>
          {modeloUrl ? (
            <div style={{ height: urlElementId ? 560 : 600 }}>
              {urlElementId && (
                <div style={{ background: "#981915", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}></span>
                  <div>
                    <div style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>Localização do Painel — Element ID #{urlElementId}</div>
                    <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>Elemento destacado em vermelho · restante em transparência</div>
                  </div>
                </div>
              )}
              <div style={{ height: urlElementId ? "calc(100% - 56px)" : "100%" }}>
                <ModelViewer url={modeloUrl} onElementClick={handleElementClick} highlightElementId={urlElementId} />
              </div>
              <div style={{ padding: "8px 14px", background: "#111", fontSize: 11, color: "#555", borderTop: "1px solid #222", display: "flex", gap: 20 }}>
                <span> Arrastar: orbitar · Scroll: zoom · Shift+arrastar: pan</span>
                <span>· Clique em elemento para criar apontamento</span>
              </div>
            </div>
          ) : (
            <div style={{ height: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
              <div style={{ fontSize: 36 }}></div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#555" }}>Nenhum modelo aberto</div>
              <div style={{ fontSize: 12, color: "#444", marginBottom: 8 }}>Vá para "Modelos" e clique em "Visualizar 3D"</div>
              <button onClick={() => setAba("modelos")} style={{ ...btnPrimary, fontSize: 12 }}><Box size={13} /> Ver modelos</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
