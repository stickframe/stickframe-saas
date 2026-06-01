import { useState, useEffect } from "react";
import { AlertTriangle } from "../components/ui/Icon";
import { useToast } from "../hooks/useToast";
import { C } from "../utils/constants";
import { fmt } from "../utils/format";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import {
  listarEquipamentos,
  adicionarEquipamento,
  atualizarEquipamento,
  removerEquipamento,
} from "../services/repositories/equipamentosRepository";

const TIPOS   = ["Ferramenta", "Máquina", "Veículo", "EPI", "Medição", "Outro"];
const STATUS  = ["Disponível", "Em Obra", "Manutenção", "Inativo"];

const STATUS_COR = {
  "Disponível": "#2e9e5b",
  "Em Obra":    "#4a9eff",
  "Manutenção": "#c88a00",
  "Inativo":    "#888",
};

const FORM_VAZIO = {
  nome: "", tipo: "Ferramenta", modelo: "", numero_serie: "",
  status: "Disponível", obra_id: "", proxima_manutencao: "",
  valor_aquisicao: "", obs: "",
};

function Label({ children, required }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6, textTransform: "uppercase" }}>
      {children}{required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

function StatCard({ label, valor, cor }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: "14px 18px", minWidth: 110,
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: cor || C.text }}>{valor}</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function Equipamentos() {
  useModuleLoad("obras");
  const obras  = useAppStore((s) => s.obras);

  const [equip,    setEquip]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null); // "novo" | "editar"
  const [editId,   setEditId]   = useState(null);
  const [confirm,  setConfirm]  = useState(null);
  const [form,     setForm]     = useState(FORM_VAZIO);
  const [filtro,   setFiltro]   = useState("Todos");
  const [busca,    setBusca]    = useState("");
  const { toast, mostrarToast } = useToast();

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    try {
      setLoading(true);
      const data = await listarEquipamentos();
      setEquip(data);
    } catch (e) {
      mostrarToast("❌ " + e.message);
    } finally {
      setLoading(false);
    }
  }

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const obraOpts = [
    { value: "", label: "— Nenhuma (disponível) —" },
    ...obras.map((o) => ({ value: o.id, label: o.nome })),
  ];

  const equipFiltrado = equip.filter((e) => {
    const matchFiltro = filtro === "Todos" || e.status === filtro;
    const matchBusca  = !busca ||
      e.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      e.modelo?.toLowerCase().includes(busca.toLowerCase()) ||
      e.tipo?.toLowerCase().includes(busca.toLowerCase());
    return matchFiltro && matchBusca;
  });

  const stats = {
    total:       equip.length,
    disponivel:  equip.filter((e) => e.status === "Disponível").length,
    emObra:      equip.filter((e) => e.status === "Em Obra").length,
    manutencao:  equip.filter((e) => e.status === "Manutenção").length,
  };

  // Alerta de manutenção próxima (próximos 7 dias)
  const hoje = new Date();
  const em7dias = new Date(hoje);
  em7dias.setDate(hoje.getDate() + 7);
  const alertaManutencao = equip.filter((e) => {
    if (!e.proxima_manutencao) return false;
    const d = new Date(e.proxima_manutencao);
    return d <= em7dias;
  });

  function abrirNovo() {
    setForm(FORM_VAZIO);
    setModal("novo");
  }

  function abrirEditar(e) {
    setEditId(e.id);
    setForm({
      nome:               e.nome              || "",
      tipo:               e.tipo              || "Ferramenta",
      modelo:             e.modelo            || "",
      numero_serie:       e.numero_serie      || "",
      status:             e.status            || "Disponível",
      obra_id:            e.obra_id           || "",
      proxima_manutencao: e.proxima_manutencao|| "",
      valor_aquisicao:    e.valor_aquisicao != null ? String(e.valor_aquisicao) : "",
      obs:                e.obs               || "",
    });
    setModal("editar");
  }

  async function salvar() {
    const payload = {
      nome:               form.nome.trim(),
      tipo:               form.tipo,
      modelo:             form.modelo || null,
      numero_serie:       form.numero_serie || null,
      status:             form.status,
      obra_id:            form.obra_id || null,
      proxima_manutencao: form.proxima_manutencao || null,
      valor_aquisicao:    form.valor_aquisicao ? Number(form.valor_aquisicao) : null,
      obs:                form.obs || null,
    };
    try {
      if (modal === "novo") {
        const novo = await adicionarEquipamento(payload);
        setEquip((prev) => [...prev, novo]);
        mostrarToast("✅ Equipamento cadastrado!");
      } else {
        const atualizado = await atualizarEquipamento(editId, payload);
        setEquip((prev) => prev.map((e) => e.id === editId ? atualizado : e));
        mostrarToast("✅ Equipamento atualizado!");
      }
      setModal(null);
    } catch (e) {
      mostrarToast("❌ " + e.message);
    }
  }

  async function excluir() {
    try {
      await removerEquipamento(confirm);
      setEquip((prev) => prev.filter((e) => e.id !== confirm));
      setConfirm(null);
      mostrarToast("🗑️ Equipamento removido.");
    } catch (e) {
      mostrarToast("❌ " + e.message);
    }
  }

  function fmtData(iso) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("T")[0].split("-");
    return `${d}/${m}/${y}`;
  }

  const thSt = { padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.8, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" };
  const tdSt = { padding: "11px 14px", fontSize: 13, borderBottom: `1px solid ${C.border}`, verticalAlign: "middle" };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Equipamentos</h1>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Controle de ferramentas, máquinas e EPIs</div>
        </div>
        <Btn onClick={abrirNovo}>+ Novo Equipamento</Btn>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard label="Total"      valor={stats.total}       cor={C.text} />
        <StatCard label="Disponível" valor={stats.disponivel}  cor="#2e9e5b" />
        <StatCard label="Em Obra"    valor={stats.emObra}      cor="#4a9eff" />
        <StatCard label="Manutenção" valor={stats.manutencao}  cor="#c88a00" />
        {alertaManutencao.length > 0 && (
          <div style={{
            background: "#fff8e1", border: "1px solid #c88a00", borderRadius: 10,
            padding: "14px 18px", display: "flex", alignItems: "center", gap: 8,
          }}>
            <span><AlertTriangle size={14} /></span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#c88a00" }}>
                {alertaManutencao.length} equipamento{alertaManutencao.length > 1 ? "s" : ""} com manutenção próxima
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>nos próximos 7 dias</div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <Input
          value={busca}
          onChange={setBusca}
          placeholder="Buscar equipamento..."
          style={{ maxWidth: 240 }}
        />
        {["Todos", ...STATUS].map((s) => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: `1px solid ${filtro === s ? (STATUS_COR[s] || C.red) : C.border}`,
              background: filtro === s ? (STATUS_COR[s] || C.red) : "transparent",
              color: filtro === s ? "#fff" : C.muted, cursor: "pointer",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Carregando...</div>
        ) : equipFiltrado.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.muted }}>
            {equip.length === 0 ? "Nenhum equipamento cadastrado. Clique em + Novo Equipamento para começar." : "Nenhum resultado para os filtros selecionados."}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.dark }}>
                <th style={thSt}>Equipamento</th>
                <th style={thSt}>Tipo</th>
                <th style={thSt}>Status</th>
                <th style={thSt}>Localização</th>
                <th style={thSt}>Próx. Manutenção</th>
                <th style={thSt}>Valor</th>
                <th style={{ ...thSt, textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {equipFiltrado.map((e) => {
                const manutAlerta = e.proxima_manutencao && new Date(e.proxima_manutencao) <= em7dias;
                return (
                  <tr key={e.id} style={{ background: C.surface }}>
                    <td style={tdSt}>
                      <div style={{ fontWeight: 600 }}>{e.nome}</div>
                      {e.modelo && <div style={{ fontSize: 11, color: C.muted }}>{e.modelo}</div>}
                      {e.numero_serie && <div style={{ fontSize: 11, color: C.muted }}>Nº {e.numero_serie}</div>}
                    </td>
                    <td style={tdSt}>
                      <span style={{ fontSize: 12, color: C.muted }}>{e.tipo}</span>
                    </td>
                    <td style={tdSt}>
                      <span style={{
                        display: "inline-block", padding: "3px 10px", borderRadius: 12,
                        fontSize: 11, fontWeight: 700,
                        background: (STATUS_COR[e.status] || "#888") + "22",
                        color: STATUS_COR[e.status] || "#888",
                      }}>
                        {e.status}
                      </span>
                    </td>
                    <td style={tdSt}>
                      <span style={{ fontSize: 13, color: e.obras?.nome ? C.text : C.muted }}>
                        {e.obras?.nome || "—"}
                      </span>
                    </td>
                    <td style={tdSt}>
                      <span style={{ color: manutAlerta ? "#c88a00" : C.text, fontWeight: manutAlerta ? 700 : 400 }}>
                        {fmtData(e.proxima_manutencao)}
                        {manutAlerta && " ⚠️"}
                      </span>
                    </td>
                    <td style={tdSt}>
                      <span style={{ color: C.muted, fontSize: 13 }}>
                        {e.valor_aquisicao ? fmt(e.valor_aquisicao) : "—"}
                      </span>
                    </td>
                    <td style={{ ...tdSt, textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <Btn size="sm" variant="ghost" onClick={() => abrirEditar(e)}>Editar</Btn>
                        <Btn size="sm" variant="ghost" onClick={() => setConfirm(e.id)}
                          style={{ color: C.danger }}>Excluir</Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal add/edit */}
      {modal && (
        <Modal
          title={modal === "novo" ? "Novo Equipamento" : "Editar Equipamento"}
          onClose={() => setModal(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <Label required>Nome</Label>
                <Input value={form.nome} onChange={set("nome")} placeholder="Ex: Parafusadeira Bosch" />
              </div>
              <div>
                <Label required>Tipo</Label>
                <Select value={form.tipo} onChange={set("tipo")} options={TIPOS.map((t) => ({ value: t, label: t }))} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <Label>Modelo</Label>
                <Input value={form.modelo} onChange={set("modelo")} placeholder="Ex: GSR 18V-55" />
              </div>
              <div>
                <Label>Número de série</Label>
                <Input value={form.numero_serie} onChange={set("numero_serie")} placeholder="Ex: SN123456" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <Label required>Status</Label>
                <Select value={form.status} onChange={set("status")} options={STATUS.map((s) => ({ value: s, label: s }))} />
              </div>
              <div>
                <Label>Obra atual</Label>
                <Select value={form.obra_id} onChange={set("obra_id")} options={obraOpts} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <Label>Próxima manutenção</Label>
                <Input type="date" value={form.proxima_manutencao} onChange={set("proxima_manutencao")} />
              </div>
              <div>
                <Label>Valor de aquisição (R$)</Label>
                <Input type="number" min="0" value={form.valor_aquisicao} onChange={set("valor_aquisicao")} placeholder="0" />
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Input value={form.obs} onChange={set("obs")} placeholder="Condição, histórico..." />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn disabled={!form.nome.trim()} onClick={salvar}>
                {modal === "novo" ? "Cadastrar" : "Salvar"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmar exclusão */}
      {confirm && (
        <Modal title="Confirmar exclusão" onClose={() => setConfirm(null)}>
          <p style={{ color: C.text, marginTop: 0 }}>Tem certeza que deseja remover este equipamento?</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => setConfirm(null)}>Cancelar</Btn>
            <Btn style={{ background: C.danger }} onClick={excluir}>Excluir</Btn>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, background: C.surface,
          border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 20px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)", fontSize: 14, zIndex: 9999,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
