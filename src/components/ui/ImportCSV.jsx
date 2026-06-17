import { useState, useRef } from "react";

function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(/[,;]/).map(h => h.trim().replace(/"/g, "").toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "_"));
  return lines.slice(1).map(line => {
    const vals = line.split(/[,;]/).map(v => v.trim().replace(/^"|"$/g, ""));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  }).filter(r => Object.values(r).some(v => v));
}

export function ImportCSV({ titulo, campos, onImportar, onClose, exemploUrl }) {
  const [arquivo, setArquivo] = useState(null);
  const [preview, setPreview] = useState([]);
  const [mapeamento, setMapeamento] = useState({});
  const [importing, setImporting] = useState(false);
  const [resultado, setResultado] = useState(null);
  const inputRef = useRef();

  function handleFile(file) {
    if (!file) return;
    setArquivo(file);
    const reader = new FileReader();
    reader.onload = e => {
      const rows = parseCSV(e.target.result);
      setPreview(rows.slice(0, 3));
      // Auto-map columns
      const auto = {};
      campos.forEach(campo => {
        const match = rows.length > 0 && Object.keys(rows[0]).find(k =>
          k === campo.key || k.includes(campo.key) || campo.aliases?.some(a => k.includes(a))
        );
        if (match) auto[campo.key] = match;
      });
      setMapeamento(auto);
    };
    reader.readAsText(file, "UTF-8");
  }

  async function executarImport() {
    if (!preview.length) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async e => {
      const rows = parseCSV(e.target.result);
      const mapped = rows.map(row => {
        const obj = {};
        campos.forEach(c => {
          if (mapeamento[c.key]) obj[c.key] = row[mapeamento[c.key]] || c.default || "";
        });
        return obj;
      }).filter(r => r[campos.find(c => c.required)?.key]);
      try {
        const res = await onImportar(mapped);
        setResultado({ ok: res.ok || mapped.length, erro: res.erro || 0 });
      } finally { setImporting(false); }
    };
    reader.readAsText(arquivo, "UTF-8");
  }

  const csvHeaders = preview.length > 0 ? Object.keys(preview[0]) : [];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--bg-card)", borderRadius: 14, padding: 28, width: "min(600px,95vw)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}> Importar {titulo}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}></button>
        </div>

        {resultado ? (
          <div style={{ textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}></div>
            <h3>Importação concluída!</h3>
            <p style={{ color: "#22c55e" }}>{resultado.ok} registro(s) importado(s)</p>
            {resultado.erro > 0 && <p style={{ color: "#ef4444" }}>{resultado.erro} erro(s)</p>}
            <button onClick={onClose} style={{ marginTop: 16, padding: "10px 24px", background: "#b41e1e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Fechar</button>
          </div>
        ) : (
          <>
            {/* Upload area */}
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              style={{ border: "2px dashed var(--border)", borderRadius: 10, padding: 32, textAlign: "center", cursor: "pointer", marginBottom: 20, transition: "border-color 0.2s" }}
            >
              <input ref={inputRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
              <p style={{ fontSize: 32, margin: "0 0 8px" }}></p>
              <p style={{ margin: 0, fontWeight: 600 }}>{arquivo ? arquivo.name : "Clique ou arraste um arquivo CSV"}</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Separado por vírgula ou ponto-e-vírgula</p>
            </div>

            {/* Column mapping */}
            {preview.length > 0 && (
              <>
                <h4 style={{ margin: "0 0 12px" }}>Mapeamento de colunas</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                  {campos.map(campo => (
                    <label key={campo.key}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>
                        {campo.label}{campo.required && " *"}
                      </span>
                      <select
                        value={mapeamento[campo.key] || ""}
                        onChange={e => setMapeamento(m => ({ ...m, [campo.key]: e.target.value }))}
                        style={{ width: "100%", padding: 7, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-input)", fontSize: 13 }}
                      >
                        <option value="">— ignorar —</option>
                        {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </label>
                  ))}
                </div>

                {/* Preview */}
                <h4 style={{ margin: "0 0 8px" }}>Preview ({preview.length} de {preview.length} linhas)</h4>
                <div style={{ overflowX: "auto", marginBottom: 20 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>{campos.filter(c => mapeamento[c.key]).map(c => <th key={c.key} style={{ padding: "5px 8px", borderBottom: "1px solid var(--border)", textAlign: "left" }}>{c.label}</th>)}</tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                          {campos.filter(c => mapeamento[c.key]).map(c => <td key={c.key} style={{ padding: "5px 8px" }}>{row[mapeamento[c.key]] || "—"}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button onClick={executarImport} disabled={importing}
                  style={{ width: "100%", padding: "11px", background: "#b41e1e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 15, opacity: importing ? 0.7 : 1 }}>
                  {importing ? "Importando..." : `Importar registros`}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
