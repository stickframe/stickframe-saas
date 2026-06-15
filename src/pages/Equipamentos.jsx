import { useState, useEffect } from "react";
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
  "Disponível": "#3f7a4b",
  "Em Obra":    "#3b6ea5",
  "Manutenção": "#c0892d",
  "Inativo":    "#8c847a",
};

const FORM_VAZIO = {
  nome: "", tipo: "Ferramenta", modelo: "", numero_serie: "",
  status: "Disponível", obra_id: "", proxima_manutencao: "",
  valor_aquisicao: "", obs: "",
};

/* ── Ícones SVG inline (Lucide) ──────────────────────────────────────────── */
function Ic({ n, w, c }) {
  const P = {
    box:     <g><path d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2z" /><path d="M2 7.5l10 5.5 10-5.5" /><path d="M12 22V13" /></g>,
    pkg:     <g><path d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2z" /><path d="M2 7.5l10 5.5 10-5.5" /><path d="M12 22V13" /></g>,
    check:   <g><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></g>,
    truck:   <g><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></g>,
    wrench:  <g><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></g>,
    search:  <g><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></g>,
    plus:    <path d="M12 5v14M5 12h14" />,
    edit:    <g><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" /></g>,
    trash:   <g><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></g>,
    alert:   <g><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></g>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c || "currentColor"} strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ width: w || 15, height: w || 15, flexShrink: 0 }}>
      {P[n]}
    </svg>
  );
}

function Label({ children, required }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6, textTransform: "uppercase" }}>
      {children}{required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

/* KPI card neutro — sem bordas coloridas */
function KpiCard({ icon, iconBg, iconColor, valor, label }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
      padding: "16px 18px",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center",
        marginBottom: 10, background: iconBg,
      }}>
        <Ic n={icon} w={16} c={iconColor} />
      </div>
      <div className="num" style={{
        fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 700,
        lineHeight: 1, marginBottom: 3, color: C.text,
      }}>
        {valor}
      </div>
      <div style={{ fontSize: 11.5, color: C.muted }}>{label}</div>
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
      mostrarToast("Erro: " + e.message);
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
        mostrarToast("Equipamento cadastrado!");
      } else {
        const atualizado = await atualizarEquipamento(editId, payload);
        setEquip((prev) => prev.map((e) => e.id === editId ? atualizado : e));
        mostrarToast("Equipamento atualizado!");
      }
      setModal(null);
    } catch (e) {
      mostrarToast("Erro: " + e.message);
    }
  }

  async function excluir() {
    try {
      await removerEquipamento(confirm);
      setEquip((prev) => prev.filter((e) => e.id !== confirm));
      setConfirm(null);
      mostrarToast("Equipamento removido.");
    } catch (e) {
      mostrarToast("Erro: " + e.message);
    }
  }

  function fmtData(iso) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("T")[0].split("-");
    return `${d}/${m}/${y}`;
  }

  const thSt = {
    padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 800,
    color: C.muted, letterSpacing: 1, textTransform: "uppercase",
    borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap",
  };
  const tdSt = {
    padding: "12px 14px", fontSize: 13, color: "#57514a",
    borderBottom: `1px solid #efeae2`, verticalAlign: "middle",
  };

  return (
    <div style={{ padding: 24, maxWidth: 1180, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 28, color: C.text, lineHeight: 1 }}>
          Equipamentos
        </h1>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
          Controle de ferramentas, máquinas e EPIs
        </p>
      </div>

      {/* KPI strip — cards neutros (sem bordas coloridas) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard icon="pkg"    iconBg={C.surface2} iconColor="#57514a"  valor={stats.total}      label="Total de equipamentos" />
        <KpiCard icon="check"  iconBg="#e8f3eb"    iconColor={C.success} valor={stats.disponivel} label="Disponíveis" />
        <KpiCard icon="truck"  iconBg="#eef3f9"    iconColor={C.steel}   valor={stats.emObra}     label="Em obra" />
        <KpiCard icon="wrench" iconBg="#fef5e7"    iconColor={C.ochre}   valor={stats.manutencao} label="Em manutenção" />
      </div>

      {/* Alerta de manutenção */}
      {alertaManutencao.length > 0 && (
        <div style={{
          background: "#fef5e7", border: `1px solid ${C.ochre}`, borderRadius: 10,
          padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
        }}>
          <Ic n="alert" w={18} c={C.ochre} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ochre }}>
              {alertaManutencao.length} equipamento{alertaManutencao.length > 1 ? "s" : ""} com manutenção próxima
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>nos próximos 7 dias</div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", maxWidth: 260, flex: "1 1 220px" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted, pointerEvents: "none" }}>
            <Ic n="search" w={15} />
          </span>
          <Input
            value={busca}
            onChange={setBusca}
            placeholder="Buscar equipamento..."
            style={{ paddingLeft: 32 }}
          />
        </div>
        {["Todos", ...STATUS].map((s) => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
              fontFamily: "inherit",
              border: `1px solid ${filtro === s ? (STATUS_COR[s] || C.red) : C.border}`,
              background: filtro === s ? (STATUS_COR[s] || C.red) : C.surface,
              color: filtro === s ? "#fff" : C.muted, cursor: "pointer", transition: ".12s",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid #efeae2`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>Equipamentos cadastrados</div>
          <button
            onClick={abrirNovo}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7, background: C.red,
              color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px",
              fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: ".14s",
            }}
            onMouseEnter={(ev) => (ev.currentTarget.style.background = C.redDark)}
            onMouseLeave={(ev) => (ev.currentTarget.style.background = C.red)}
          >
            <Ic n="plus" w={14} c="#fff" /> Novo Equipamento
          </button>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Carregando...</div>
        ) : equipFiltrado.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.muted }}>
            {equip.length === 0 ? "Nenhum equipamento cadastrado. Clique em Novo Equipamento para começar." : "Nenhum resultado para os filtros selecionados."}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
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
                  <tr key={e.id}>
                    <td style={tdSt}>
                      <div style={{ fontWeight: 700, color: C.text }}>{e.nome}</div>
                      {e.modelo && <div style={{ fontSize: 11, color: C.muted }}>{e.modelo}</div>}
                      {e.numero_serie && <div style={{ fontSize: 11, color: C.muted }}>Nº {e.numero_serie}</div>}
                    </td>
                    <td style={tdSt}>
                      <span style={{ fontSize: 12, color: C.muted }}>{e.tipo}</span>
                    </td>
                    <td style={tdSt}>
                      <span style={{
                        display: "inline-block", padding: "3px 9px", borderRadius: 5,
                        fontSize: 11, fontWeight: 800, letterSpacing: 0.3,
                        background: (STATUS_COR[e.status] || "#8c847a") + "22",
                        color: STATUS_COR[e.status] || "#8c847a",
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
                      <span style={{
                        fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13.5,
                        color: manutAlerta ? C.ochre : C.text, fontWeight: manutAlerta ? 700 : 500,
                        display: "inline-flex", alignItems: "center", gap: 5,
                      }}>
                        {fmtData(e.proxima_manutencao)}
                        {manutAlerta && <Ic n="alert" w={13} c={C.ochre} />}
                      </span>
                    </td>
                    <td style={tdSt}>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.muted, fontSize: 13.5 }}>
                        {e.valor_aquisicao ? fmt(e.valor_aquisicao) : "—"}
                      </span>
                    </td>
                    <td style={{ ...tdSt, textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => abrirEditar(e)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            background: C.surface2, color: "#57514a", border: `1px solid ${C.border}`,
                            borderRadius: 6, padding: "5px 9px", fontFamily: "inherit",
                            fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          <Ic n="edit" w={12} /> Editar
                        </button>
                        <button
                          onClick={() => setConfirm(e.id)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            background: C.surface2, color: C.danger, border: `1px solid ${C.border}`,
                            borderRadius: 6, padding: "5px 9px", fontFamily: "inherit",
                            fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          <Ic n="trash" w={12} c={C.danger} /> Excluir
                        </button>
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
