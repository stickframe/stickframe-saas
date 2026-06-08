import React, { useState, useEffect } from "react";
import { C } from "../../utils/constants";
import { useToast } from "../../hooks/useToast";
import Btn from "../ui/Btn";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Modal from "../ui/Modal";

const COLUNAS = ["A Fazer", "Em Andamento", "Impedimento", "Concluído"];
const PRIORIDADES = ["Baixa", "Média", "Alta"];

const COR_PRIO = { Alta: C.danger, Média: C.warning, Baixa: C.success };
const COR_COLUNA = {
  "A Fazer": C.muted,
  "Em Andamento": "#4a9eff",
  "Impedimento": C.danger,
  "Concluído": C.success,
};

const FORM_VAZIO = {
  titulo: "",
  descricao: "",
  responsavel: "",
  prazo: "",
  prioridade: "Média",
  status: "A Fazer",
};

export default function ListaTarefas({ obraId }) {
  const { mostrarToast } = useToast();
  const [tarefas, setTarefas] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [editId, setEditId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);

  // Simula persistência no banco usando localStorage com chave atrelada à Obra
  useEffect(() => {
    const storageKey = `sf_tarefas_${obraId}`;
    const salvas = localStorage.getItem(storageKey);
    if (salvas) {
      setTarefas(JSON.parse(salvas));
    } else {
      // Dados de demonstração padrão
      const dataHoje = new Date().toISOString().split("T")[0];
      const dataAmanha = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      setTarefas([
        { id: "t1", titulo: "Conferir prumo dos montantes", status: "A Fazer", prioridade: "Alta", responsavel: "Mestre Carlos", prazo: dataAmanha },
        { id: "t2", titulo: "Aguardando entrega de OSB", status: "Impedimento", prioridade: "Alta", responsavel: "Suprimentos", prazo: "" },
        { id: "t3", titulo: "Montagem painéis parede sul", status: "Em Andamento", prioridade: "Média", responsavel: "Equipe A", prazo: dataHoje },
      ]);
    }
  }, [obraId]);

  const salvarTarefas = (novasTarefas) => {
    setTarefas(novasTarefas);
    localStorage.setItem(`sf_tarefas_${obraId}`, JSON.stringify(novasTarefas));
  };

  function abrirNova(status = "A Fazer") {
    setForm({ ...FORM_VAZIO, status });
    setEditId(null);
    setModal(true);
  }

  function abrirEditar(tarefa) {
    setForm({ ...tarefa });
    setEditId(tarefa.id);
    setModal(true);
  }

  function salvar() {
    if (!form.titulo.trim()) return;
    let novas;
    if (editId) {
      novas = tarefas.map((t) => (t.id === editId ? { ...t, ...form } : t));
      mostrarToast("Tarefa atualizada!");
    } else {
      const novaTarefa = { ...form, id: `t_${Date.now()}` };
      novas = [...tarefas, novaTarefa];
      mostrarToast("Tarefa adicionada!");
    }
    salvarTarefas(novas);
    setModal(false);
  }

  function deletar() {
    const novas = tarefas.filter((t) => t.id !== editId);
    salvarTarefas(novas);
    setModal(false);
    mostrarToast("🗑 Tarefa removida.");
  }

  // ── Drag & Drop Handlers ──────────────────────────────────────────────────
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggingId(id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, novoStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;

    const atualizadas = tarefas.map((t) =>
      t.id === id ? { ...t, status: novoStatus } : t
    );
    salvarTarefas(atualizadas);
    setDraggingId(null);
  };

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const hojeStr = new Date().toISOString().split("T")[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Quadro de Tarefas (Kanban)</h3>
          <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 0" }}>
            Organize pendências, delegue responsáveis e controle os prazos desta obra.
          </p>
        </div>
        <Btn onClick={() => abrirNova("A Fazer")}>+ Nova Tarefa</Btn>
      </div>

      {/* Board Kanban */}
      <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16, minHeight: 400 }}>
        {COLUNAS.map((coluna) => {
          const tarefasColuna = tarefas.filter((t) => t.status === coluna);
          const corBase = COR_COLUNA[coluna];

          return (
            <div
              key={coluna}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, coluna)}
              style={{
                flex: 1, minWidth: 280,
                background: C.darker, borderRadius: 12,
                display: "flex", flexDirection: "column",
                border: `1px solid ${C.border}`,
              }}
            >
              {/* Cabeçalho Coluna */}
              <div style={{ padding: "14px 16px", borderBottom: `2px solid ${corBase}44`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: corBase }} />
                  <span style={{ fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, color: C.text }}>
                    {coluna}
                  </span>
                </div>
                <span style={{ background: C.border, color: C.muted, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12 }}>
                  {tarefasColuna.length}
                </span>
              </div>

              {/* Corpo Coluna */}
              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                {tarefasColuna.map((t) => {
                  const isAtrasado = t.prazo && t.prazo < hojeStr && coluna !== "Concluído";
                  const corPrio = COR_PRIO[t.prioridade] || C.muted;
                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => abrirEditar(t)}
                      style={{
                        background: C.surface, padding: 14, borderRadius: 10,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.04)", border: `1px solid ${C.border}`,
                        cursor: "grab", opacity: draggingId === t.id ? 0.5 : 1,
                        borderLeft: `4px solid ${corPrio}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: corPrio, background: corPrio + "15", padding: "2px 6px", borderRadius: 4 }}>
                          {t.prioridade}
                        </span>
                        {isAtrasado && <span style={{ fontSize: 10, fontWeight: 700, color: C.danger }}>⚠️ Atrasado</span>}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8, lineHeight: 1.3 }}>
                        {t.titulo}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: C.muted }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, background: C.border, borderRadius: "50%", color: C.text, fontWeight: 700, fontSize: 9 }}>
                            {(t.responsavel || "?")[0].toUpperCase()}
                          </span>
                          {t.responsavel || "Sem dono"}
                        </div>
                        {t.prazo && (
                          <div style={{ color: isAtrasado ? C.danger : C.muted, fontWeight: isAtrasado ? 700 : 500 }}>
                            {new Date(t.prazo + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => abrirNova(coluna)} style={{ background: "transparent", border: "none", color: C.muted, fontSize: 12, fontWeight: 600, padding: "8px 0", cursor: "pointer", textAlign: "left", opacity: 0.6 }}>+ Adicionar cartão</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nova / Editar */}
      {modal && (
        <Modal title={editId ? "Editar Tarefa" : "Nova Tarefa"} onClose={() => setModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>TÍTULO DA TAREFA *</div><Input value={form.titulo} onChange={set("titulo")} placeholder="Ex: Solicitar caçamba" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>RESPONSÁVEL</div><Input value={form.responsavel} onChange={set("responsavel")} placeholder="Ex: João" /></div>
              <div><div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>PRAZO DE ENTREGA</div><Input type="date" value={form.prazo} onChange={set("prazo")} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>STATUS</div><Select value={form.status} onChange={set("status")} options={COLUNAS.map(c => ({ value: c, label: c }))} /></div>
              <div><div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>PRIORIDADE</div><Select value={form.prioridade} onChange={set("prioridade")} options={PRIORIDADES.map(p => ({ value: p, label: p }))} /></div>
            </div>
            <div><div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>DESCRIÇÃO (Opcional)</div><textarea value={form.descricao} onChange={(e) => set("descricao")(e.target.value)} rows={3} style={{ width: "100%", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 13px", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical" }} /></div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
              {editId ? <Btn variant="ghost" onClick={deletar} style={{ color: C.danger }}>Excluir</Btn> : <div />}
              <div style={{ display: "flex", gap: 8 }}><Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn><Btn disabled={!form.titulo.trim()} onClick={salvar}>Salvar</Btn></div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}