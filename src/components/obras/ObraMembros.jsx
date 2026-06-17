import { useEffect, useState } from "react";
import {
  listarMembros,
  adicionarMembro,
  removerMembro,
  atualizarNivel,
} from "../../services/repositories/obraMembrosRepository";
import { sb } from "../../services/supabase";
import useAppStore from "../../store/useAppStore";
import Btn from "../ui/Btn";
import Select from "../ui/Select";
import { useToast } from "../../hooks/useToast";

const NIVEL_OPTS = [
  { value: "visualizador", label: "Visualizador — só leitura" },
  { value: "colaborador",  label: "Colaborador — edita conteúdo" },
  { value: "responsavel",  label: "Responsável — gerencia membros" },
];

const NIVEL_COLOR = { visualizador: "#6b7280", colaborador: "#4a7af8", responsavel: "#981915" };

function getInitials(nome) {
  return (nome || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function ObraMembros({ obraId }) {
  const [membros, setMembros] = useState([]);
  const [todosusuarios, setTodosUsuarios] = useState([]);
  const [novoUserId, setNovoUserId] = useState("");
  const [novoNivel, setNovoNivel] = useState("colaborador");
  const [loading, setLoading] = useState(true);
  const { mostrarToast } = useToast();
  const setObraMembros = useAppStore((s) => s.setObraMembros);
  const empresaId = useAppStore((s) => s.empresaId);

  useEffect(() => {
    if (!obraId) return;
    Promise.all([
      listarMembros(obraId),
      sb.from("usuarios").select("id, nome, cargo, perfil").eq("empresa_id", empresaId).eq("ativo", true),
    ]).then(([m, { data: u }]) => {
      setMembros(m);
      setTodosUsuarios(u || []);
    }).finally(() => setLoading(false));
  }, [obraId, empresaId]);

  const sync = (list) => {
    setMembros(list);
    setObraMembros(obraId, list.map((m) => ({ obra_id: obraId, usuario_id: m.usuario_id, nivel: m.nivel })));
  };

  const handleAdicionar = async () => {
    if (!novoUserId) return;
    try {
      const m = await adicionarMembro(obraId, novoUserId, novoNivel);
      sync([...membros.filter((x) => x.usuario_id !== novoUserId), m]);
      setNovoUserId("");
      mostrarToast(" Membro adicionado");
    } catch (e) {
      mostrarToast(" " + e.message);
    }
  };

  const handleRemover = async (usuarioId) => {
    try {
      await removerMembro(obraId, usuarioId);
      sync(membros.filter((m) => m.usuario_id !== usuarioId));
      mostrarToast(" Membro removido");
    } catch (e) {
      mostrarToast(" " + e.message);
    }
  };

  const handleNivel = async (usuarioId, nivel) => {
    try {
      const m = await atualizarNivel(obraId, usuarioId, nivel);
      sync(membros.map((x) => x.usuario_id === usuarioId ? m : x));
    } catch (e) {
      mostrarToast(" " + e.message);
    }
  };

  const membroIds = new Set(membros.map((m) => m.usuario_id));
  const disponiveis = todosusuarios.filter((u) => !membroIds.has(u.id));

  const usuariosOpts = [
    { value: "", label: "— Selecionar usuário —" },
    ...disponiveis.map((u) => ({ value: u.id, label: `${u.nome} (${u.perfil})` })),
  ];

  if (loading) return <div style={{ padding: 24, color: "var(--muted)", fontSize: 13 }}>Carregando membros…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
          Membros com acesso
        </div>
        {membros.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: 13, padding: "12px 0" }}>
            Nenhum membro definido — todos da empresa têm acesso (comportamento padrão).
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {membros.map((m) => (
              <div
                key={m.usuario_id}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 10,
                  border: "1px solid var(--border)", background: "var(--surface)",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: NIVEL_COLOR[m.nivel] || "#888",
                  color: "#fff", fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {getInitials(m.usuario?.nome)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{m.usuario?.nome}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{m.usuario?.cargo || m.usuario?.perfil}</div>
                </div>
                <Select
                  value={m.nivel}
                  onChange={(v) => handleNivel(m.usuario_id, v)}
                  options={NIVEL_OPTS}
                  style={{ minWidth: 200, fontSize: 12 }}
                />
                <button
                  onClick={() => handleRemover(m.usuario_id)}
                  style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
                  title="Remover membro"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {disponiveis.length > 0 && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
              Adicionar membro
            </div>
            <Select value={novoUserId} onChange={setNovoUserId} options={usuariosOpts} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
              Nível
            </div>
            <Select value={novoNivel} onChange={setNovoNivel} options={NIVEL_OPTS} />
          </div>
          <Btn variant="primary" size="sm" onClick={handleAdicionar} disabled={!novoUserId}>
            Adicionar
          </Btn>
        </div>
      )}

      <div style={{ fontSize: 11, color: "var(--muted)", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
        <strong>Níveis:</strong> Visualizador = apenas leitura · Colaborador = edita diário e arquivos · Responsável = gerencia membros e configurações da obra
      </div>
    </div>
  );
}
