import { useEffect, useState } from "react";
import { sb } from "../../services/supabase";
import { C } from "../../utils/constants";

function fmtBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function ArquivoVersoes({ arquivo, obraId, onClose, onNovaVersao }) {
  const [versoes, setVersoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function carregarVersoes() {
    setLoading(true);
    const { data, error } = await sb
      .from("arquivo_versoes")
      .select("*, enviado_por:usuarios(nome)")
      .eq("arquivo_id", arquivo.id)
      .order("versao", { ascending: false });
    if (!error) setVersoes(data || []);
    setLoading(false);
  }

  useEffect(() => { carregarVersoes(); }, [arquivo.id]);

  async function handleNovaVersao(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const proximaVersao = (arquivo.versao || 1) + 1;
      const storagePath = `${obraId}/${Date.now()}_v${proximaVersao}_${file.name}`;

      // Upload para storage
      const { error: upErr } = await sb.storage.from("arquivos").upload(storagePath, file, { upsert: false });
      if (upErr) throw upErr;

      // Busca userId do usuário atual
      const { data: { user } } = await sb.auth.getUser();

      // Insere na tabela arquivo_versoes
      const { error: insErr } = await sb.from("arquivo_versoes").insert({
        arquivo_id:   arquivo.id,
        versao:       proximaVersao,
        storage_path: storagePath,
        tamanho:      file.size,
        enviado_por:  user?.id || null,
      });
      if (insErr) throw insErr;

      // Atualiza arquivos: incrementa versao e storage_path
      const { error: updErr } = await sb
        .from("arquivos")
        .update({ versao: proximaVersao, storage_path: storagePath })
        .eq("id", arquivo.id);
      if (updErr) throw updErr;

      onNovaVersao();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, width: 520, maxWidth: "95vw", maxHeight: "80vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>📋 Histórico de versões</div>
            <div style={{ fontSize: 12, color: C.muted, maxWidth: 380, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{arquivo.nome}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted, lineHeight: 1 }}>×</button>
        </div>

        {/* Nova versão */}
        <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, cursor: uploading ? "wait" : "pointer" }}>
          <div style={{ background: C.red, color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", opacity: uploading ? 0.6 : 1 }}>
            {uploading ? "⏳ Enviando..." : "📤 Nova versão"}
          </div>
          <span style={{ fontSize: 12, color: C.muted }}>Selecione o arquivo atualizado</span>
          <input type="file" style={{ display: "none" }} disabled={uploading} onChange={handleNovaVersao} />
        </label>

        {error && (
          <div style={{ background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#c0392b", marginBottom: 12 }}>
            ❌ {error}
          </div>
        )}

        {/* Lista de versões */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: C.muted, fontSize: 13 }}>Carregando versões...</div>
          ) : versoes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: C.muted, fontSize: 13 }}>
              Nenhuma versão anterior registrada.<br />
              <span style={{ fontSize: 11 }}>A versão atual é v{arquivo.versao || 1}.</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {versoes.map((v) => {
                const isCurrent = v.versao === (arquivo.versao || 1);
                const url = sb.storage.from("arquivos").getPublicUrl(v.storage_path).data.publicUrl;
                return (
                  <div
                    key={v.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px", borderRadius: 8,
                      background: isCurrent ? "#2e9e5b11" : C.darker,
                      border: `1px solid ${isCurrent ? "#2e9e5b44" : C.border}`,
                    }}
                  >
                    {/* Badge versão */}
                    <span style={{
                      background: isCurrent ? "#2e9e5b" : C.muted,
                      color: "#fff", borderRadius: 6,
                      padding: "3px 10px", fontSize: 11, fontWeight: 800,
                      flexShrink: 0,
                    }}>
                      v{v.versao}
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: isCurrent ? "#2e9e5b" : C.text }}>
                        {isCurrent ? "Versão atual" : `Versão ${v.versao}`}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                        {new Date(v.created_at).toLocaleString("pt-BR")}
                        {v.enviado_por?.nome ? ` · ${v.enviado_por.nome}` : ""}
                        {v.tamanho ? ` · ${fmtBytes(v.tamanho)}` : ""}
                      </div>
                    </div>

                    {/* Botão download */}
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: "#4a9eff22", border: "1px solid #4a9eff44",
                        borderRadius: 6, color: "#4a9eff",
                        fontSize: 11, fontWeight: 700,
                        padding: "4px 10px", textDecoration: "none",
                        flexShrink: 0,
                      }}
                    >
                      ↓ Baixar
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
