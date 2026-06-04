import { useState, useEffect } from "react";
import { listarVersoes, uploadNovaRevisao } from "../../services/repositories/arquivoVersaoRepository";
import { sb } from "../../services/supabase";

export function ArquivoVersoes({ arquivoId, arquivoNome, obraId, onClose }) {
  const [versoes, setVersoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [novoArquivo, setNovoArquivo] = useState(null);
  const [notas, setNotas] = useState("");

  useEffect(() => { carregar(); }, [arquivoId]);

  async function carregar() {
    setLoading(true);
    try { setVersoes(await listarVersoes(arquivoId)); }
    finally { setLoading(false); }
  }

  async function handleUpload() {
    if (!novoArquivo) return;
    setUploading(true);
    try {
      const path = `obras/${obraId}/${Date.now()}_${novoArquivo.name}`;
      const { error: upErr } = await sb.storage.from("arquivos").upload(path, novoArquivo);
      if (upErr) throw upErr;

      await uploadNovaRevisao(arquivoId, {
        obra_id: obraId,
        nome: novoArquivo.name,
        tipo: novoArquivo.type,
        tamanho: novoArquivo.size,
        storage_path: path,
        categoria: versoes[0]?.categoria || "outro",
        data: new Date().toISOString().split("T")[0],
      }, notas);

      await carregar();
      setNovoArquivo(null);
      setNotas("");
    } finally { setUploading(false); }
  }

  function downloadUrl(storagePath) {
    return sb.storage.from("arquivos").getPublicUrl(storagePath).data.publicUrl;
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"var(--bg-card)", borderRadius:12, padding:24, width:"min(700px,95vw)", maxHeight:"80vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h3 style={{ margin:0 }}>Versões — {arquivoNome}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer" }}>✕</button>
        </div>

        {loading ? <p>Carregando...</p> : (
          <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:24 }}>
            <thead>
              <tr style={{ borderBottom:"1px solid var(--border)" }}>
                <th style={{ textAlign:"left", padding:"6px 8px" }}>Revisão</th>
                <th style={{ textAlign:"left", padding:"6px 8px" }}>Arquivo</th>
                <th style={{ textAlign:"left", padding:"6px 8px" }}>Data</th>
                <th style={{ textAlign:"left", padding:"6px 8px" }}>Por</th>
                <th style={{ textAlign:"left", padding:"6px 8px" }}>Notas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {versoes.map((v, i) => (
                <tr key={v.id} style={{ borderBottom:"1px solid var(--border)", background: i === versoes.length-1 ? "var(--bg-hover)" : "transparent" }}>
                  <td style={{ padding:"8px" }}>
                    <span style={{ background:"#3b82f6", color:"#fff", borderRadius:4, padding:"2px 8px", fontSize:12, fontWeight:700 }}>{v.revisao || "Rev A"}</span>
                    {i === versoes.length-1 && <span style={{ marginLeft:6, fontSize:11, color:"var(--text-muted)" }}>atual</span>}
                  </td>
                  <td style={{ padding:"8px", fontSize:13 }}>{v.nome}</td>
                  <td style={{ padding:"8px", fontSize:13 }}>{v.data || v.created_at?.split("T")[0]}</td>
                  <td style={{ padding:"8px", fontSize:13 }}>{v.publicado_por_usuario?.nome || "—"}</td>
                  <td style={{ padding:"8px", fontSize:13, color:"var(--text-muted)" }}>{v.notas_revisao || "—"}</td>
                  <td style={{ padding:"8px" }}>
                    <a href={downloadUrl(v.storage_path)} target="_blank" rel="noreferrer"
                      style={{ fontSize:12, color:"#3b82f6" }}>⬇ Download</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ borderTop:"1px solid var(--border)", paddingTop:16 }}>
          <h4 style={{ margin:"0 0 12px" }}>Upload nova revisão</h4>
          <input type="file" onChange={e => setNovoArquivo(e.target.files[0])} style={{ marginBottom:8, display:"block" }} />
          <textarea
            placeholder="Notas da revisão (ex: Atualizado conforme vistoria)"
            value={notas} onChange={e => setNotas(e.target.value)}
            rows={2}
            style={{ width:"100%", marginBottom:8, padding:8, borderRadius:6, border:"1px solid var(--border)", background:"var(--bg-input)", resize:"vertical" }}
          />
          <button
            onClick={handleUpload}
            disabled={!novoArquivo || uploading}
            style={{ padding:"8px 20px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", opacity: (!novoArquivo || uploading) ? 0.5 : 1 }}
          >
            {uploading ? "Enviando..." : "Publicar nova revisão"}
          </button>
        </div>
      </div>
    </div>
  );
}
