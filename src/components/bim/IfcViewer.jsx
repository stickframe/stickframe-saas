import { useEffect, useRef, useState } from "react";
import * as OBC from "@thatopen/components";
import * as THREE from "three";

const STATUS_COLORS = {
  planejado:  0x2e2e38,
  fabricando: 0x7a5010,
  montando:   0x1e4070,
  concluido:  0x1e4a28,
  problema:   0x6a1a14,
};

// Reverse map: IFC type keyword → element ID
const IFC_TYPE_TO_ELEM = {
  IFCMEMBER: "montante-90", IFCBEAM: "guia-90", IFCCOLUMN: "montante-90",
  IFCWALLSTANDARDCASE: "osb-externo", IFCWALL: "drywall", IFCPLATE: "osb-externo",
  IFCROOFING: "cobertura", IFCROOF: "cobertura",
  IFCFASTENER: "parafuso", IFCMECHANICALFASTENER: "parafuso",
  IFCCOVERING: "la-vidro",
  IFCSTRUCTURALMEMBER: "montante-90", IFCSTRUCTURALCURVEMEMBER: "guia-90",
  IFCPILE: "montante-90", IFCFOOTING: "montante-90",
  IFCSLAB: "osb-externo", IFCBUILDINGELEMENTPROXY: "montante-90",
};

function getElemIdFromName(name) {
  if (!name) return null;
  const upper = name.toUpperCase();
  for (const [key, id] of Object.entries(IFC_TYPE_TO_ELEM)) {
    if (upper.includes(key)) return id;
  }
  return null;
}

export default function IfcViewer({ file, onLoad, onError, statusMap, onElementClick }) {
  const mountRef     = useRef(null);
  const stateRef     = useRef({ components: null, world: null, model: null });
  const modelRef     = useRef(null);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState(null);
  const [clickedEl, setClickedEl] = useState(null);

  // Init engine once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const components = new OBC.Components();
    const worlds     = components.get(OBC.Worlds);
    const world      = worlds.create();

    world.scene    = new OBC.SimpleScene(components);
    world.renderer = new OBC.SimpleRenderer(components, container);
    world.camera   = new OBC.SimpleCamera(components);

    world.scene.setup();          // ambient + directional lights
    world.scene.three.background = null;
    world.renderer.three.setClearColor(0x0f0e12, 1);
    world.renderer.showLogo = false;

    components.init();            // starts render loop

    stateRef.current = { components, world, model: null };

    return () => {
      try { components.dispose(); } catch (_) {}
      stateRef.current = { components: null, world: null, model: null };
    };
  }, []);

  // Load IFC when file changes
  useEffect(() => {
    if (!file) return;
    const { components, world } = stateRef.current;
    if (!components || !world) return;

    let cancelled = false;
    setErr(null);
    setLoading(true);

    (async () => {
      try {
        // Remove previous model
        if (stateRef.current.model) {
          try { stateRef.current.model.object.removeFromParent(); } catch (_) {}
          stateRef.current.model = null;
        }

        // Init FragmentsManager with local worker (avoids unpkg fetch)
        const fragments = components.get(OBC.FragmentsManager);
        if (!fragments.initialized) {
          await fragments.init("/fragments-worker.mjs");
        }
        if (cancelled) return;

        // Setup IFC loader with local WASM and increased memory for large files
        const ifcLoader = components.get(OBC.IfcLoader);
        await ifcLoader.setup({
          wasm: { path: "/", absolute: true },
          autoSetWasm: false,
          webIfc: {
            MEMORY_LIMIT: 2147483648, // 2GB
            TAPE_SIZE: 67108864,      // 64MB tape
          },
        });
        if (cancelled) return;

        // Load file
        const buffer = await file.arrayBuffer();
        if (cancelled) return;

        const model = await ifcLoader.load(new Uint8Array(buffer), true, file.name);
        if (cancelled) return;

        stateRef.current.model = model;
        modelRef.current = model;
        world.scene.three.add(model.object);

        // Click detection via Raycaster
        const container = mountRef.current;
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        function handleClick(e) {
          const rect = container.getBoundingClientRect();
          mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(mouse, world.camera.three);
          const meshes = [];
          model.object.traverse(c => { if (c.isMesh) meshes.push(c); });
          const hits = raycaster.intersectObjects(meshes);
          if (hits.length > 0) {
            const hit = hits[0];
            const name = hit.object.name || hit.object.parent?.name || "Elemento IFC";
            const el = { name, expressId: hit.object.userData?.expressID };
            setClickedEl(el);
            if (onElementClick) onElementClick(el);
          } else {
            setClickedEl(null);
            if (onElementClick) onElementClick(null);
          }
        }
        container.addEventListener("click", handleClick);
        // Store cleanup fn
        stateRef.current._clickCleanup = () => container.removeEventListener("click", handleClick);

        // Fit camera to bounding box
        const { Box3, Vector3 } = await import("three");
        const box = new Box3().setFromObject(model.object);
        if (!box.isEmpty()) {
          const center = new Vector3();
          const size   = new Vector3();
          box.getCenter(center);
          box.getSize(size);
          const dist = Math.max(size.x, size.y, size.z) * 1.8;
          world.camera.controls.setLookAt(
            center.x + dist, center.y + dist * 0.7, center.z + dist,
            center.x, center.y, center.z,
            true
          );
        }

        if (onLoad) onLoad(file.name);
      } catch (e) {
        if (!cancelled) {
          console.error("IfcViewer load error:", e);
          setErr(e.message || "Erro ao carregar IFC");
          if (onError) onError(e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      stateRef.current._clickCleanup?.();
      stateRef.current._clickCleanup = null;
    };
  }, [file]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply statusMap colors when statusMap changes
  useEffect(() => {
    const model = modelRef.current;
    if (!model || !statusMap) return;
    model.object.traverse(mesh => {
      if (!mesh.isMesh) return;
      const name = (mesh.name || mesh.parent?.name || "").toUpperCase();
      let elemId = getElemIdFromName(name);
      const status = elemId ? (statusMap[elemId] || "planejado") : "planejado";
      const color = STATUS_COLORS[status] ?? STATUS_COLORS.planejado;
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => { m.color?.setHex(color); m.needsUpdate = true; });
        } else {
          mesh.material.color?.setHex(color);
          mesh.material.needsUpdate = true;
        }
      }
    });
  }, [statusMap]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#0f0e12" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      {loading && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "rgba(15,14,18,.85)", gap: 12,
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#981915" strokeWidth="2"
            strokeLinecap="round" style={{ animation: "ifc-spin 1s linear infinite" }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <style>{`@keyframes ifc-spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>Carregando modelo IFC…</span>
        </div>
      )}

      {clickedEl && (
        <div style={{
          position: "absolute", bottom: 60, left: 12,
          background: "rgba(10,9,14,0.92)", backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,.1)", borderRadius: 10,
          padding: "10px 14px", maxWidth: 240,
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: "rgba(255,255,255,.3)", textTransform: "uppercase", marginBottom: 4 }}>Elemento IFC</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", wordBreak: "break-word" }}>{clickedEl.name}</div>
          {clickedEl.expressId != null && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 3 }}>ID: #{clickedEl.expressId}</div>
          )}
          <button onClick={() => setClickedEl(null)} style={{
            position: "absolute", top: 6, right: 6, background: "none", border: "none",
            cursor: "pointer", color: "rgba(255,255,255,.3)", fontSize: 14, lineHeight: 1, padding: 2,
          }}>×</button>
        </div>
      )}

      {err && !loading && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "rgba(15,14,18,.92)", gap: 10,
        }}>
          <div style={{ fontSize: 13, color: "#fca5a5", maxWidth: 320, textAlign: "center" }}>
            ⚠ Erro ao renderizar IFC<br/>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 6, display: "block" }}>{err}</span>
          </div>
        </div>
      )}
    </div>
  );
}
