import { useState, useEffect, useRef } from "react";
import { sb } from "../../services/supabase";
import {
  listarComentarios,
  adicionarComentario,
  editarComentario,
  deletarComentario,
} from "../../services/repositories/comentariosRepository";

const AVATAR_COLORS = ["#981915", "#3f7a4b", "#4a7af8", "#b07a1e", "#7c3aed", "#0891b2"];

function avatarColor(id) {
  if (!id) return AVATAR_COLORS[0];
  return AVATAR_COLORS[id.charCodeAt(0) % 6];
}

function initials(nome) {
  if (!nome) return "?";
  const parts = nome.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d} dia${d > 1 ? "s" : ""}`;
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function Avatar({ nome, userId }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%",
      background: avatarColor(userId),
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 700, color: "#fff",
      flexShrink: 0,
    }}>
      {initials(nome)}
    </div>
  );
}

function CommentInput({ onSubmit, placeholder = "Adicionar comentário…", initialValue = "", autoFocus = false, onCancel }) {
  const [text, setText] = useState(initialValue);
  const ref = useRef(null);

  useEffect(() => {
    if (autoFocus && ref.current) ref.current.focus();
  }, [autoFocus]);

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) { onSubmit(text.trim()); setText(""); }
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        rows={2}
        style={{
          width: "100%", boxSizing: "border-box",
          background: "var(--surface, #1a1a1a)",
          border: "1px solid var(--border, #333)",
          borderRadius: 8, padding: "10px 13px",
          color: "var(--text, #eee)", fontSize: 13,
          outline: "none", fontFamily: "inherit",
          resize: "vertical",
        }}
      />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        {onCancel && (
          <button onClick={onCancel} style={{ padding: "5px 14px", borderRadius: 6, border: "1px solid var(--border, #333)", background: "transparent", color: "var(--muted, #888)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            Cancelar
          </button>
        )}
        <button
          disabled={!text.trim()}
          onClick={() => { if (text.trim()) { onSubmit(text.trim()); setText(""); } }}
          style={{
            padding: "5px 14px", borderRadius: 6, border: "none",
            background: text.trim() ? "#981915" : "var(--border, #333)",
            color: "#fff", fontSize: 12, fontWeight: 700,
            cursor: text.trim() ? "pointer" : "default", fontFamily: "inherit",
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

function CommentItem({ comment, replies, currentUid, onReply, onEdit, onDelete, depth = 0 }) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const isOwn = comment.usuario_id === currentUid;

  async function handleReply(text) {
    await onReply(text, comment.id);
    setReplying(false);
  }

  async function handleEdit(text) {
    await onEdit(comment.id, text);
    setEditing(false);
  }

  return (
    <div style={{ marginLeft: depth > 0 ? 40 : 0 }}>
      <div style={{
        display: "flex", gap: 10, padding: "12px 0",
        borderBottom: "1px solid var(--border, #2a2a2a)",
      }}>
        <Avatar nome={comment.usuario?.nome} userId={comment.usuario_id} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text, #eee)" }}>
              {comment.usuario?.nome || "Usuário"}
            </span>
            <span style={{ fontSize: 11, color: "var(--muted, #888)" }}>
              {timeAgo(comment.created_at)}
              {comment.editado && " · editado"}
            </span>
          </div>

          {editing ? (
            <CommentInput
              initialValue={comment.texto}
              autoFocus
              onSubmit={handleEdit}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <div style={{ fontSize: 13, color: "var(--text, #ddd)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
              {comment.texto}
            </div>
          )}

          {!editing && (
            <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
              <button onClick={() => setReplying(!replying)}
                style={{ fontSize: 11, color: "var(--muted, #888)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
                Responder
              </button>
              {isOwn && (
                <>
                  <button onClick={() => setEditing(true)}
                    style={{ fontSize: 11, color: "var(--muted, #888)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
                    Editar
                  </button>
                  <button onClick={() => onDelete(comment.id)}
                    style={{ fontSize: 11, color: "#981915", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
                    Excluir
                  </button>
                </>
              )}
            </div>
          )}

          {replying && (
            <div style={{ marginTop: 10 }}>
              <CommentInput
                placeholder={`Responder a ${comment.usuario?.nome || "usuário"}…`}
                autoFocus
                onSubmit={handleReply}
                onCancel={() => setReplying(false)}
              />
            </div>
          )}
        </div>
      </div>

      {replies.map((r) => (
        <CommentItem
          key={r.id}
          comment={r}
          replies={[]}
          currentUid={currentUid}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export default function Comentarios({ entidade, entidadeId, title = "Comentários" }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUid, setCurrentUid] = useState(null);

  useEffect(() => {
    sb.auth.getUser().then(({ data }) => setCurrentUid(data?.user?.id || null));
  }, []);

  useEffect(() => {
    if (!entidadeId) return;
    setLoading(true);
    listarComentarios(entidade, entidadeId)
      .then(setComments)
      .finally(() => setLoading(false));

    const channel = sb
      .channel(`comentarios:${entidade}:${entidadeId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "comentarios",
        filter: `entidade_id=eq.${entidadeId}`,
      }, () => {
        listarComentarios(entidade, entidadeId).then(setComments);
      })
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, [entidade, entidadeId]);

  async function handleAdd(text) {
    try {
      const novo = await adicionarComentario(entidade, entidadeId, text);
      setComments((prev) => [...prev, novo]);
    } catch (e) {
      console.error("Erro ao adicionar comentário:", e);
    }
  }

  async function handleReply(text, parentId) {
    try {
      const novo = await adicionarComentario(entidade, entidadeId, text, parentId);
      setComments((prev) => [...prev, novo]);
    } catch (e) {
      console.error("Erro ao responder:", e);
    }
  }

  async function handleEdit(id, texto) {
    try {
      const updated = await editarComentario(id, texto);
      setComments((prev) => prev.map((c) => c.id === id ? updated : c));
    } catch (e) {
      console.error("Erro ao editar:", e);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir este comentário?")) return;
    try {
      await deletarComentario(id);
      setComments((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id));
    } catch (e) {
      console.error("Erro ao excluir:", e);
    }
  }

  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesOf = (id) => comments.filter((c) => c.parent_id === id);

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: "var(--text, #eee)" }}>
        {title} {!loading && comments.length > 0 && <span style={{ color: "var(--muted, #888)", fontWeight: 400, fontSize: 13 }}>({comments.length})</span>}
      </div>

      {loading ? (
        <div style={{ color: "var(--muted, #888)", fontSize: 13, padding: "20px 0" }}>Carregando comentários…</div>
      ) : topLevel.length === 0 ? (
        <div style={{
          border: "1px dashed var(--border, #333)", borderRadius: 10,
          padding: "28px 20px", textAlign: "center",
          color: "var(--muted, #888)", fontSize: 13, marginBottom: 16,
        }}>
          Sem comentários ainda. Seja o primeiro a comentar.
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          {topLevel.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              replies={repliesOf(c.id)}
              currentUid={currentUid}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <div style={{
        borderTop: "1px solid var(--border, #2a2a2a)",
        paddingTop: 16, marginTop: 8,
      }}>
        <CommentInput onSubmit={handleAdd} />
      </div>
    </div>
  );
}
