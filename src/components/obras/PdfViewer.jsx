import { useEffect, useRef, useState, useCallback } from "react";
import { sb } from "../../services/supabase";
import useAppStore from "../../store/useAppStore";

// Lazy-load heavy libs
async function loadPdfJs() {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  return pdfjsLib;
}

async function loadFabric() {
  const { fabric } = await import("fabric");
  return fabric;
}

const TOOLS = [
  { id: "select", label: "↖ Selecionar" },
  { id: "pencil", label: "✏️ Caneta" },
  { id: "rect", label: "▭ Retângulo" },
  { id: "circle", label: "◯ Círculo" },
  { id: "arrow", label: "→ Seta" },
  { id: "text", label: "T Texto" },
];

export function PdfViewer({ arquivo, obraId, onClose }) {
  const pdfCanvasRef = useRef();
  const overlayRef = useRef();
  const fabricRef = useRef(null);
  const [tool, setTool] = useState("select");
  const [color, setColor] = useState("#ef4444");
  const [pagina, setPagina] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const empresaId = useAppStore(s => s.empresaId);
  const user = useAppStore(s => s.user);

  const url = sb.storage.from("arquivos").getPublicUrl(arquivo.storage_path).data.publicUrl;
  const isPdf = arquivo.storage_path?.toLowerCase().endsWith(".pdf");

  // Load annotations from Supabase
  const carregarAnotacoes = useCallback(async (fabricCanvas) => {
    const { data } = await sb.from("anotacoes")
      .select("layer_json")
      .eq("arquivo_id", arquivo.id)
      .eq("usuario_id", user.id)
      .eq("pagina", pagina)
      .maybeSingle();
    if (data?.layer_json && fabricCanvas) {
      fabricCanvas.loadFromJSON(data.layer_json, () => fabricCanvas.renderAll());
    }
  }, [arquivo.id, user.id, pagina]);

  useEffect(() => {
    let fabricCanvas = null;

    async function init() {
      setLoading(true);
      const fabric = await loadFabric();

      // Destroy previous canvas
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }

      const pdfCanvas = pdfCanvasRef.current;
      const overlay = overlayRef.current;
      if (!pdfCanvas || !overlay) return;

      if (isPdf) {
        const pdfjsLib = await loadPdfJs();
        const pdf = await pdfjsLib.getDocument(url).promise;
        setTotalPages(pdf.numPages);
        const page = await pdf.getPage(pagina);
        const viewport = page.getViewport({ scale: 1.5 });
        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        overlay.width = viewport.width;
        overlay.height = viewport.height;
        await page.render({ canvasContext: pdfCanvas.getContext("2d"), viewport }).promise;
      } else {
        // Image file
        const img = new Image();
        img.onload = () => {
          pdfCanvas.width = img.width;
          pdfCanvas.height = img.height;
          overlay.width = img.width;
          overlay.height = img.height;
          pdfCanvas.getContext("2d").drawImage(img, 0, 0);
        };
        img.src = url;
      }

      fabricCanvas = new fabric.Canvas(overlay, { isDrawingMode: false });
      fabricRef.current = fabricCanvas;
      await carregarAnotacoes(fabricCanvas);
      setLoading(false);
    }

    init();
    return () => { if (fabricRef.current) { fabricRef.current.dispose(); fabricRef.current = null; } };
  }, [url, pagina, isPdf]);

  // Apply tool
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.isDrawingMode = tool === "pencil";
    if (tool === "pencil") {
      fc.freeDrawingBrush.color = color;
      fc.freeDrawingBrush.width = 3;
    }
    fc.defaultCursor = tool === "text" ? "text" : "default";
  }, [tool, color]);

  function addShape() {
    const fc = fabricRef.current;
    if (!fc) return;
    if (tool === "rect") {
      import("fabric").then(({ fabric }) => {
        fc.add(new fabric.Rect({ left: 100, top: 100, width: 120, height: 80, fill: "transparent", stroke: color, strokeWidth: 3 }));
      });
    } else if (tool === "circle") {
      import("fabric").then(({ fabric }) => {
        fc.add(new fabric.Circle({ left: 100, top: 100, radius: 50, fill: "transparent", stroke: color, strokeWidth: 3 }));
      });
    } else if (tool === "text") {
      import("fabric").then(({ fabric }) => {
        const t = new fabric.IText("Anotação", { left: 100, top: 100, fill: color, fontSize: 18 });
        fc.add(t);
        fc.setActiveObject(t);
        t.enterEditing();
      });
    } else if (tool === "arrow") {
      import("fabric").then(({ fabric }) => {
        const line = new fabric.Line([50, 50, 200, 200], { stroke: color, strokeWidth: 3 });
        fc.add(line);
      });
    }
  }

  async function salvar() {
    const fc = fabricRef.current;
    if (!fc) return;
    setSaving(true);
    try {
      const json = fc.toJSON();
      const { data: me } = await sb.auth.getUser();
      await sb.from("anotacoes").upsert({
        empresa_id: empresaId,
        arquivo_id: arquivo.id,
        usuario_id: me.user?.id,
        layer_json: json,
        pagina,
      }, { onConflict: "arquivo_id,usuario_id,pagina" });
    } finally { setSaving(false); }
  }

  function limpar() {
    if (fabricRef.current) fabricRef.current.clear();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#1e1e2e", flexWrap: "wrap" }}>
        <button onClick={onClose} style={{ marginRight: 8, background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>✕ Fechar</button>
        <span style={{ color: "#fff", fontWeight: 700, marginRight: 8 }}>{arquivo.nome}</span>
        {TOOLS.map(t => (
          <button key={t.id} onClick={() => { setTool(t.id); if (["rect","circle","text","arrow"].includes(t.id)) setTimeout(addShape, 100); }}
            style={{ padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: tool === t.id ? "#3b82f6" : "#374151", color: "#fff", fontSize: 12 }}>
            {t.label}
          </button>
        ))}
        <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 32, height: 28, borderRadius: 4, border: "none", cursor: "pointer" }} title="Cor" />
        <button onClick={limpar} style={{ padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: "#6b7280", color: "#fff", fontSize: 12 }}>🗑 Limpar</button>
        <button onClick={salvar} disabled={saving} style={{ padding: "4px 14px", borderRadius: 6, border: "none", cursor: "pointer", background: "#22c55e", color: "#fff", fontWeight: 700, fontSize: 12 }}>
          {saving ? "Salvando..." : "💾 Salvar"}
        </button>
        {totalPages > 1 && (
          <div style={{ display: "flex", gap: 4, alignItems: "center", color: "#fff" }}>
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} style={{ background: "#374151", border: "none", color: "#fff", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}>‹</button>
            <span style={{ fontSize: 12 }}>Pág {pagina}/{totalPages}</span>
            <button onClick={() => setPagina(p => Math.min(totalPages, p + 1))} disabled={pagina === totalPages} style={{ background: "#374151", border: "none", color: "#fff", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}>›</button>
          </div>
        )}
      </div>

      {/* Canvas area */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: 16, background: "#111" }}>
        {loading && <p style={{ color: "#fff" }}>Carregando...</p>}
        <div style={{ position: "relative", display: "inline-block" }}>
          <canvas ref={pdfCanvasRef} style={{ display: "block" }} />
          <canvas ref={overlayRef} id="annotation-layer"
            style={{ position: "absolute", top: 0, left: 0 }}
          />
        </div>
      </div>
    </div>
  );
}
