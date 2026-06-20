import { useEffect, useRef, useState } from "react";
import * as OBC from "@thatopen/components";

export default function IfcViewer({ file, onLoad, onError }) {
  const mountRef     = useRef(null);
  const stateRef     = useRef({ components: null, world: null, model: null });
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState(null);

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

        // Setup IFC loader with local WASM
        const ifcLoader = components.get(OBC.IfcLoader);
        await ifcLoader.setup({
          wasm: { path: "/", absolute: true },
          autoSetWasm: false,
        });
        if (cancelled) return;

        // Load file
        const buffer = await file.arrayBuffer();
        if (cancelled) return;

        const model = await ifcLoader.load(new Uint8Array(buffer), true, file.name);
        if (cancelled) return;

        stateRef.current.model = model;
        world.scene.three.add(model.object);

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

    return () => { cancelled = true; };
  }, [file]); // eslint-disable-line react-hooks/exhaustive-deps

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
