import { useState, useEffect } from "react";
import { C, NAV } from "../../utils/constants";
import Btn from "../ui/Btn";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import {
  listarPerfisCustomizados,
  criarPerfilCustomizado,
  atualizarPerfilCustomizado,
  deletarPerfilCustomizado,
} from "../../services/repositories/perfisRepository";
import useAppStore from "../../store/useAppStore";
import { useToast } from "../../hooks/useToast";

const CORES_PRESET = ["#6b7280", "#981915", "#3f7a4b", "#3b6ea5", "#c88a00", "#8b5cf6"];

const FORM_VAZIO = { nome: "", cor: "#6b7280", paginas: [] };

function LabelF({ children, required }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6, textTransform: "uppercase" }}>
      {children}{required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

export default function PerfisCustomizados() {
  const user = useAppStore((s) => s.user);
  const setPerfisCustomizados = useAppStore((s) => s.setPerfisCustomizados);
  const { mostrarToast } = useToast();

  const [perfis, setPerfis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null); // null = novo, id = editar
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    listarPerfisCustomizados()
      .then((data) => {
        setPerfis(data);
        setPerfisCustomizados(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (user?.perfil !== "diretor") return null;

  function abrirNovo() {
    setEditando(null);
    setForm(FORM_VAZIO);
    setModalAberto(true);
  }

  function abrirEditar(p) {
    setEditando(p.id);
    setForm({ nome: p.nome, cor: p.cor || "#6b7280", paginas: p.paginas || [] });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditando(null);
    setForm(FORM_VAZIO);
  }

  function togglePagina(key) {
    setForm((f) => ({
      ...f,
      paginas: f.paginas.includes(key) ? f.paginas.filter((k) => k !== key) : [...f.paginas, key],
    }));
  }

  async function salvar() {
    if (!form.nome.trim()) return;
    setSalvando(true);
    try {
      const payload = { nome: form.nome.trim(), cor: form.cor, paginas: form.paginas };
      if (editando) {
        const atualizado = await atualizarPerfilCustomizado(editando, payload);
        const novos = perfis.map((p) => (p.id === editando ? atualizado : p));
        setPerfis(novos);
        setPerfisCustomizados(novos);
        mostrarToast(" Perfil atualizado!");
      } else {
        const criado = await criarPerfilCustomizado(payload);
        const novos = [...perfis, criado];
        setPerfis(novos);
        setPerfisCustomizados(novos);
        mostrarToast(" Perfil criado!");
      }
      fecharModal();
    } catch (e) {
      mostrarToast("❌ Erro ao salvar perfil: " + e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarDelete(id) {
    try {
      await deletarPerfilCustomizado(id);
      const novos = perfis.filter((p) => p.id !== id);
      setPerfis(novos);
      setPerfisCustomizados(novos);
      mostrarToast(" Perfil removido.");
    } catch (e) {
      mostrarToast("❌ Erro ao excluir: " + e.message);
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: "24px 28px", marginBottom: 20,
      }}>
        <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Perfis personalizados</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>Crie perfis com permissões customizadas para atribuir aos usuários.</div>
          </div>
          <Btn onClick={abrirNovo}>+ Novo perfil</Btn>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: C.muted, fontSize: 13 }}>Carregando…</div>
        ) : perfis.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0", color: C.muted }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}></div>
            Nenhum perfil personalizado criado ainda.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {perfis.map((p) => (
              <div key={p.id} style={{
                borderRadius: 10, padding: "14px 16px",
                border: `1px solid ${p.cor}44`,
                background: p.cor + "08",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.cor, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: p.cor, flex: 1 }}>{p.nome}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 8,
                    background: p.cor + "22", color: p.cor,
                  }}>
                    {p.paginas?.length || 0} módulos
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {(p.paginas || []).slice(0, 6).map((pg) => (
                    <span key={pg} style={{
                      fontSize: 9, padding: "2px 6px", borderRadius: 4,
                      background: p.cor + "15", color: p.cor, fontWeight: 600, textTransform: "capitalize",
                    }}>{pg.replace(/_/g, " ")}</span>
                  ))}
                  {(p.paginas || []).length > 6 && (
                    <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: C.border, color: C.muted, fontWeight: 600 }}>
                      +{p.paginas.length - 6}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button onClick={() => abrirEditar(p)} style={{
                    flex: 1, fontSize: 11, fontWeight: 600, padding: "5px 0", borderRadius: 7,
                    background: p.cor + "18", color: p.cor, border: `1px solid ${p.cor}33`,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>Editar</button>
                  {confirmDelete === p.id ? (
                    <div style={{ display: "flex", gap: 4, flex: 1 }}>
                      <button onClick={() => confirmarDelete(p.id)} style={{
                        flex: 1, fontSize: 11, fontWeight: 700, padding: "5px 0", borderRadius: 7,
                        background: C.danger + "18", color: C.danger, border: `1px solid ${C.danger}44`,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>Confirmar</button>
                      <button onClick={() => setConfirmDelete(null)} style={{
                        flex: 1, fontSize: 11, fontWeight: 600, padding: "5px 0", borderRadius: 7,
                        background: C.border, color: C.muted, border: `1px solid ${C.border}`,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>Cancelar</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(p.id)} style={{
                      flex: 1, fontSize: 11, fontWeight: 600, padding: "5px 0", borderRadius: 7,
                      background: C.danger + "10", color: C.danger, border: `1px solid ${C.danger}22`,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>Excluir</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalAberto && (
        <Modal
          title={editando ? "Editar perfil personalizado" : "Novo perfil personalizado"}
          onClose={fecharModal}
          width={500}
        >
          <div style={{ padding: "20px 0 0", display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <LabelF required>Nome do perfil</LabelF>
              <Input
                value={form.nome}
                onChange={(v) => setForm((f) => ({ ...f, nome: v }))}
                placeholder="Ex: Estagiário, Subcontratado…"
              />
            </div>

            <div>
              <LabelF>Cor</LabelF>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {CORES_PRESET.map((cor) => (
                  <button
                    key={cor}
                    onClick={() => setForm((f) => ({ ...f, cor }))}
                    style={{
                      width: 28, height: 28, borderRadius: "50%", background: cor,
                      border: form.cor === cor ? `3px solid ${C.text}` : `2px solid transparent`,
                      cursor: "pointer", outline: "none", flexShrink: 0,
                      boxShadow: form.cor === cor ? `0 0 0 2px ${cor}55` : "none",
                      transition: "border .15s",
                    }}
                    aria-label={`Cor ${cor}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <LabelF>Módulos com acesso</LabelF>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: 6, maxHeight: 280, overflowY: "auto",
                border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px",
              }}>
                {NAV.map((n) => (
                  <label key={n.key} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 12 }}>
                    <input
                      type="checkbox"
                      checked={form.paginas.includes(n.key)}
                      onChange={() => togglePagina(n.key)}
                      style={{ accentColor: form.cor, cursor: "pointer" }}
                    />
                    <span style={{ color: form.paginas.includes(n.key) ? C.text : C.muted }}>
                      {n.label}
                    </span>
                  </label>
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                {form.paginas.length} módulo(s) selecionado(s)
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
              <Btn variant="ghost" onClick={fecharModal}>Cancelar</Btn>
              <Btn disabled={!form.nome.trim() || salvando} onClick={salvar}>
                {salvando ? "Salvando…" : "Salvar perfil"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
