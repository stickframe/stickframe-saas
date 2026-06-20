import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as OBC from "@thatopen/components";

export default function IfcViewer({ file, onLoad, onError }) {
  const mountRef = useRef(null);
  const worldRef = useRef(null);
  const componentsRef = useRef(null);
  const currentModelRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // Initialize the 3D world once on mount
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const components = new OBC.Components();
    componentsRef.current = components;

    const worlds = components.get(OBC.Worlds);
    const world = worlds.create();
    worldRef.current = world;

    world.scene = new OBC.SimpleScene(components);
    world.renderer = new OBC.SimpleRenderer(components, container);
    world.camera = new OBC.SimpleCamera(components);

    components.init();

    world.scene.three.background = null;
    world.renderer.three.setClearColor(0x0f0e12, 1);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    world.scene.three.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 1.0);
    directional.position.set(5, 10, 5);
    world.scene.three.add(directional);

    world.camera.controls.setLookAt(10, 10, 10, 0, 0, 0);

    return () => {
      try {
        world.renderer.dispose();
      } catch (_) {}
      try {
        components.dispose();
      } catch (_) {}
      componentsRef.current = null;
      worldRef.current = null;
      currentModelRef.current = null;
    };
  }, []);

  // Load IFC whenever `file` changes
  useEffect(() => {
    if (!file) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const components = componentsRef.current;
        const world = worldRef.current;
        if (!components || !world) return;

        // Remove previous model if any
        if (currentModelRef.current) {
          try {
            world.scene.three.remove(currentModelRef.current.object);
          } catch (_) {}
          currentModelRef.current = null;
        }

        // Initialize fragments worker if not yet done
        const fragments = components.get(OBC.FragmentsManager);
        if (!fragments.initialized) {
          const workerUrl = await OBC.FragmentsManager.getWorker();
          fragments.init(workerUrl);
        }

        if (cancelled) return;

        // Setup IFC loader with local wasm path
        const ifcLoader = components.get(OBC.IfcLoader);
        await ifcLoader.setup({
          wasm: { path: "/", absolute: true },
          autoSetWasm: false,
        });

        if (cancelled) return;

        // Read file as Uint8Array
        const arrayBuffer = await file.arrayBuffer();
        if (cancelled) return;

        const data = new Uint8Array(arrayBuffer);
        const model = await ifcLoader.load(data, true, file.name);

        if (cancelled) return;

        currentModelRef.current = model;
        world.scene.three.add(model.object);

        // Fit camera to model bounding box
        const box = model.box;
        if (box && !box.isEmpty()) {
          const center = new THREE.Vector3();
          const size = new THREE.Vector3();
          box.getCenter(center);
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const dist = maxDim * 1.5;
          world.camera.controls.setLookAt(
            center.x + dist,
            center.y + dist,
            center.z + dist,
            center.x,
            center.y,
            center.z,
            true
          );
        }

        // Count loaded elements (best-effort)
        let elementCount = 0;
        try {
          const allLocalIds = await model.getAllLocalIds();
          elementCount = allLocalIds ? allLocalIds.length : 0;
        } catch (_) {
          elementCount = 0;
        }

        if (onLoad) onLoad(elementCount);
      } catch (err) {
        if (!cancelled) {
          console.error("IFC loading failed:", err);
          if (onError) onError(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [file]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: "relative", width: "100%", height: "460px" }}>
      <div
        ref={mountRef}
        style={{
          width: "100%",
          height: "100%",
          background: "#0f0e12",
          overflow: "hidden",
        }}
      />
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15,14,18,0.75)",
            color: "#fff",
            fontSize: "14px",
            gap: "10px",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: "spin 1s linear infinite" }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading IFC model…
        </div>
      )}
    </div>
  );
}
