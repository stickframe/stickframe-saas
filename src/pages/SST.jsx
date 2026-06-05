import { useState, useEffect, useCallback } from "react";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import Btn from "../components/ui/Btn";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { C } from "../utils/constants";
import {
  listarDDS, criarDDS, atualizarDDS, deletarDDS,
  listarIncidentes, criarIncidente, atualizarIncidente, deletarIncidente,
  listarEpis, criarEpi, atualizarEpi, deletarEpi,
} from "../services/repositories/sstRepository";
import { sb, getEmpresaId } from "../services/supabase";

const GRAVIDADES = ["Baixa", "Média", "Alta", "Crítica"];
const TIPOS_INC  = ["Quase-acidente", "Acidente", "Incidente"];
const STATUS_INC = ["Aberto", "Em andamento", "Fechado"];
const ITENS_EPI  = ["Capacete","Óculos de proteção","Luvas","Botina","Colete refletivo","Protetor auricular","Máscara PFF2","Cinto de segurança","Uniforme","Outros"];

const corGravidade = { Baixa: C.success, Média: C.warning, Alta: "#e67e22", Crítica: C.danger };
const corStatus    = { Aberto: C.danger, "Em andamento": C.warning, Fechado: C.success };

function kpiStyle(cor) {
  return { background: cor + "18", borderLeft: `4px solid ${cor}`, borderRadius: 10, padding: "14px 18px" };
}

export default function SST() {
  const { perfil } = useAppStore();
  useModuleLoad("sst");

  const [aba, setAba] = useState("dds");
  const [obras, setObras] = useState([]);
  const [colabs, setColabs] = useState([]);

  // DDS
  const [dds, setDds]           = useState([]);
  const [ddsLoading, setDdsLoading] = useState(false);
  const [ddsModal, setDdsModal] = useState(false);
  const [ddsEdit, setDdsEdit]   = useState(null);
  const [ddsForm, setDdsForm]   = useState({ data: new Date().toISOString().slice(0,10), tema: "", facilitador: "", participantes_txt: "", obs: "", obra_id: "" });

  // Incidentes
  const [inc, setInc]             = useState([]);
  const [incLoading, setIncLoading] = useState(false);
  const [incModal, setIncModal]   = useState(false);
  const [incEdit, setIncEdit]     = useState(null);
  const [incForm, setIncForm]     = useState({ data: new Date().toISOString().slice(0,10), tipo: "Quase-acidente", gravidade: "Baixa", descricao: "", acao_corretiva: "", status: "Aberto", obra_id: "", colaborador_id: "" });

  // EPIs
  const [epis, setEpis]           = useState([]);
  const [episLoading, setEpisLoading] = useState(false);
  const [epiModal, setEpiModal]   = useState(false);
  const [epiEdit, setEpiEdit]     = useState(null);
  const [epiForm, setEpiForm]     = useState({ item: "", quantidade: 1, data_entrega: new Date().toISOString().slice(0,10), validade: "", assinado: false, colaborador_id: "", obra_id: "", obs: "" });

  const [confirm, setConfirm] = useState(null);

  const loadObras  = useCallback(async () => {
    const { data } = await sb.from("obras").select("id,nome").eq("empresa_id", getEmpresaId()).order("nome");
    setObras(data || []);
  }, []);

  const loadColabs = useCallback(async () => {
    const { data } = await sb.from("colaboradores").select("id,nome").eq("empresa_id", getEmpresaId()).order("nome");
    setColabs(data || []);
  }, []);

  const loadDDS  = useCallback(async () => { setDdsLoading(true); try { setDds(await listarDDS()); } finally { setDdsLoading(false); } }, []);
  const loadInc  = useCallback(async () => { setIncLoading(true); try { setInc(await listarIncidentes()); } finally { setIncLoading(false); } }, []);
  const loadEpis = useCallback(async () => { setEpisLoading(true); try { setEpis(await listarEpis()); } finally { setEpisLoading(false); } }, []);

  useEffect(() => { loadObras(); loadColabs(); }, [loadObras, loadColabs]);
  useEffect(() => {
    if (aba === "dds") loadDDS();
    if (aba === "incidentes") loadInc();
    if (aba === "epis") loadEpis();
  }, [aba, loadDDS, loadInc, loadEpis]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const hoje     = new Date().toISOString().slice(0, 10);
  const mesAtual = hoje.slice(0, 7);

  const diasSemAcidente = (() => {
    const acidentes = inc.filter(i => i.tipo === "Acidente").sort((a,b) => b.data.localeCompare(a.data));
    if (!acidentes.length) return "∞";
    return Math.floor((new Date() - new Date(acidentes[0].data)) / 86400000);
  })();

  const ddsMes       = dds.filter(d => d.data?.startsWith(mesAtual)).length;
  const incAbertos   = inc.filter(i => i.status !== "Fechado").length;
  const episVencendo = epis.filter(e => {
    if (!e.validade) return false;
    const dias = Math.ceil((new Date(e.validade) - new Date()) / 86400000);
    return dias >= 0 && dias <= 30;
  }).length;

  // ── DDS handlers ─────────────────────────────────────────────────────────
  function abrirNovoDDS() { setDdsEdit(null); setDdsForm({ data: hoje, tema: "", facilitador: "", participantes_txt: "", obs: "", obra_id: "" }); setDdsModal(true); }
  function abrirEditDDS(d) { setDdsEdit(d.id); setDdsForm({ ...d, participantes_txt: (d.participantes || []).join(", ") }); setDdsModal(true); }
  async function salvarDDS() {
    const payload = {
      ...ddsForm,
      obra_id: ddsForm.obra_id || null,
      participantes: ddsForm.participantes_txt.split(",").map(s => s.trim()).filter(Boolean),
    };
    delete payload.participantes_txt;
    if (ddsEdit) await atualizarDDS(ddsEdit, payload); else await criarDDS(payload);
    setDdsModal(false); loadDDS();
  }

  // ── Incidente handlers ────────────────────────────────────────────────────
  function abrirNovoInc() { setIncEdit(null); setIncForm({ data: hoje, tipo: "Quase-acidente", gravidade: "Baixa", descricao: "", acao_corretiva: "", status: "Aberto", obra_id: "", colaborador_id: "" }); setIncModal(true); }
  function abrirEditInc(i) { setIncEdit(i.id); setIncForm({ ...i, obra_id: i.obra_id || "", colaborador_id: i.colaborador_id || "" }); setIncModal(true); }
  async function salvarInc() {
    const payload = {
      ...incForm,
      obra_id: incForm.obra_id || null,
      colaborador_id: incForm.colaborador_id || null,
    };
    if (incEdit) await atualizarIncidente(incEdit, payload); else await criarIncidente(payload);
    setIncModal(false); loadInc();
  }

  // ── EPI handlers ──────────────────────────────────────────────────────────
  function abrirNovoEpi() { setEpiEdit(null); setEpiForm({ item: "", quantidade: 1, data_entrega: hoje, validade: "", assinado: false, colaborador_id: "", obra_id: "", obs: "" }); setEpiModal(true); }
  function abrirEditEpi(e) { setEpiEdit(e.id); setEpiForm({ ...e, obra_id: e.obra_id || "", colaborador_id: e.colaborador_id || "" }); setEpiModal(true); }
  async function salvarEpi() {
    const payload = {
      ...epiForm,
      validade:        epiForm.validade        || null,
      obra_id:         epiForm.obra_id         || null,
      colaborador_id:  epiForm.colaborador_id  || null,
      quantidade:      Number(epiForm.quantidade) || 1,
    };
    if (epiEdit) await atualizarEpi(epiEdit, payload); else await criarEpi(payload);
    setEpiModal(false); loadEpis();
  }

  async function confirmarDelete() {
    if (!confirm) return;
    if (confirm.tipo === "dds")       await deletarDDS(confirm.id);
    if (confirm.tipo === "incidente") await deletarIncidente(confirm.id);
    if (confirm.tipo === "epi")       await deletarEpi(confirm.id);
    setConfirm(null);
    if (confirm.tipo === "dds")       loadDDS();
    if (confirm.tipo === "incidente") loadInc();
    if (confirm.tipo === "epi")       loadEpis();
  }

  const tabStyle = (k) => ({
    padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14,
    background: aba === k ? C.red : "transparent",
    color: aba === k ? "#fff" : C.muted,
    border: "none",
  });

  const fmt = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—";

  return (
    <div style={{ padding: "0 0 40px" }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>SST</h1>
        <p style={{ color: C.muted, fontSize: 14 }}>Saúde e Segurança no Trabalho</p>
      </div>

      {/* KPIs */}
      <div className="kpi-grid-4" style={{ marginBottom: 24 }}>
        <div style={kpiStyle(C.success)}>
          <div style={{ fontSize: 26, fontWeight: 900, color: C.success }}>{diasSemAcidente}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Dias sem acidente</div>
        </div>
        <div style={kpiStyle(C.red)}>
          <div style={{ fontSize: 26, fontWeight: 900, color: C.red }}>{ddsMes}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>DDS este mês</div>
        </div>
        <div style={kpiStyle(incAbertos > 0 ? C.danger : C.success)}>
          <div style={{ fontSize: 26, fontWeight: 900, color: incAbertos > 0 ? C.danger : C.success }}>{incAbertos}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Incidentes abertos</div>
        </div>
        <div style={kpiStyle(episVencendo > 0 ? C.warning : C.success)}>
          <div style={{ fontSize: 26, fontWeight: 900, color: episVencendo > 0 ? C.warning : C.success }}>{episVencendo}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>EPIs vencendo em 30d</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-row" style={{ display: "flex", gap: 6, marginBottom: 20, background: C.dark, borderRadius: 10, padding: 4 }}>
        {[["dds","DDS"],["incidentes","Incidentes"],["epis","EPIs / Entregas"]].map(([k,l]) => (
          <button key={k} style={tabStyle(k)} onClick={() => setAba(k)}>{l}</button>
        ))}
      </div>

      {/* ── DDS ── */}
      {aba === "dds" && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>Diálogos Diários de Segurança</h3>
            <Btn onClick={abrirNovoDDS}>+ Novo DDS</Btn>
          </div>
          {ddsLoading ? <p style={{ color: C.muted }}>Carregando...</p> : dds.length === 0 ? (
            <p style={{ color: C.muted, textAlign: "center", padding: 32 }}>Nenhum DDS registrado ainda.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {["Data","Tema","Facilitador","Obra","Participantes",""].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: C.muted, fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dds.map(d => (
                  <tr key={d.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "10px 10px" }}>{fmt(d.data)}</td>
                    <td style={{ padding: "10px 10px", fontWeight: 600 }}>{d.tema}</td>
                    <td style={{ padding: "10px 10px", color: C.muted }}>{d.facilitador || "—"}</td>
                    <td style={{ padding: "10px 10px", color: C.muted }}>{d.obra?.nome || "—"}</td>
                    <td style={{ padding: "10px 10px", color: C.muted }}>{(d.participantes || []).length} pessoa(s)</td>
                    <td style={{ padding: "10px 10px", whiteSpace: "nowrap" }}>
                      <Btn variant="ghost" size="sm" onClick={() => abrirEditDDS(d)}>Editar</Btn>
                      <Btn variant="ghost" size="sm" style={{ color: C.danger }} onClick={() => setConfirm({ id: d.id, tipo: "dds", label: d.tema })}>Excluir</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Incidentes ── */}
      {aba === "incidentes" && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>Registro de Incidentes</h3>
            <Btn onClick={abrirNovoInc}>+ Novo Incidente</Btn>
          </div>
          {incLoading ? <p style={{ color: C.muted }}>Carregando...</p> : inc.length === 0 ? (
            <p style={{ color: C.muted, textAlign: "center", padding: 32 }}>Nenhum incidente registrado. Ótimo sinal!</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {["Data","Tipo","Gravidade","Obra","Colaborador","Status",""].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: C.muted, fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inc.map(i => (
                  <tr key={i.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "10px 10px" }}>{fmt(i.data)}</td>
                    <td style={{ padding: "10px 10px", fontWeight: 600 }}>{i.tipo}</td>
                    <td style={{ padding: "10px 10px" }}>
                      <span style={{ background: (corGravidade[i.gravidade] || C.muted) + "20", color: corGravidade[i.gravidade] || C.muted, borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>{i.gravidade}</span>
                    </td>
                    <td style={{ padding: "10px 10px", color: C.muted }}>{i.obra?.nome || "—"}</td>
                    <td style={{ padding: "10px 10px", color: C.muted }}>{i.colaborador?.nome || "—"}</td>
                    <td style={{ padding: "10px 10px" }}>
                      <span style={{ background: (corStatus[i.status] || C.muted) + "20", color: corStatus[i.status] || C.muted, borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>{i.status}</span>
                    </td>
                    <td style={{ padding: "10px 10px", whiteSpace: "nowrap" }}>
                      <Btn variant="ghost" size="sm" onClick={() => abrirEditInc(i)}>Editar</Btn>
                      <Btn variant="ghost" size="sm" style={{ color: C.danger }} onClick={() => setConfirm({ id: i.id, tipo: "incidente", label: i.tipo })}>Excluir</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── EPIs ── */}
      {aba === "epis" && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>Entrega de EPIs</h3>
            <Btn onClick={abrirNovoEpi}>+ Registrar Entrega</Btn>
          </div>
          {episLoading ? <p style={{ color: C.muted }}>Carregando...</p> : epis.length === 0 ? (
            <p style={{ color: C.muted, textAlign: "center", padding: 32 }}>Nenhuma entrega de EPI registrada.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {["Colaborador","Item","Qtd","Data entrega","Validade","Assinado",""].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: C.muted, fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {epis.map(e => {
                  const venc = e.validade ? Math.ceil((new Date(e.validade) - new Date()) / 86400000) : null;
                  const vencCor = venc === null ? C.muted : venc < 0 ? C.danger : venc <= 30 ? C.warning : C.success;
                  return (
                    <tr key={e.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "10px 10px", fontWeight: 600 }}>{e.colaborador?.nome || "—"}</td>
                      <td style={{ padding: "10px 10px" }}>{e.item}</td>
                      <td style={{ padding: "10px 10px", color: C.muted }}>{e.quantidade}</td>
                      <td style={{ padding: "10px 10px", color: C.muted }}>{fmt(e.data_entrega)}</td>
                      <td style={{ padding: "10px 10px", color: vencCor, fontWeight: venc !== null && venc <= 30 ? 700 : 400 }}>{fmt(e.validade)}</td>
                      <td style={{ padding: "10px 10px" }}>
                        <span style={{ fontSize: 18 }}>{e.assinado ? "✅" : "⬜"}</span>
                      </td>
                      <td style={{ padding: "10px 10px", whiteSpace: "nowrap" }}>
                        <Btn variant="ghost" size="sm" onClick={() => abrirEditEpi(e)}>Editar</Btn>
                        <Btn variant="ghost" size="sm" style={{ color: C.danger }} onClick={() => setConfirm({ id: e.id, tipo: "epi", label: e.item })}>Excluir</Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Modal DDS ── */}
      {ddsModal && (
        <Modal onClose={() => setDdsModal(false)} title={ddsEdit ? "Editar DDS" : "Novo DDS"}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Data" type="date" value={ddsForm.data} onChange={v => setDdsForm(f => ({ ...f, data: v }))} />
            <Input label="Tema / Assunto *" value={ddsForm.tema} onChange={v => setDdsForm(f => ({ ...f, tema: v }))} placeholder="Ex: Trabalho em altura" />
            <Input label="Facilitador" value={ddsForm.facilitador} onChange={v => setDdsForm(f => ({ ...f, facilitador: v }))} placeholder="Nome do responsável" />
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Obra</label>
              <select value={ddsForm.obra_id} onChange={e => setDdsForm(f => ({ ...f, obra_id: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14 }}>
                <option value="">— Sem obra vinculada —</option>
                {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </div>
            <Input label="Participantes (separados por vírgula)" value={ddsForm.participantes_txt} onChange={v => setDdsForm(f => ({ ...f, participantes_txt: v }))} placeholder="André, João, Maria" />
            <div><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Observações</label><textarea value={ddsForm.obs} onChange={e => setDdsForm(f => ({ ...f, obs: e.target.value }))} rows={3} style={{ width: "100%", background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.text, fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} /></div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <Btn variant="ghost" onClick={() => setDdsModal(false)}>Cancelar</Btn>
              <Btn onClick={salvarDDS} disabled={!ddsForm.tema}>Salvar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal Incidente ── */}
      {incModal && (
        <Modal onClose={() => setIncModal(false)} title={incEdit ? "Editar Incidente" : "Novo Incidente"}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Data" type="date" value={incForm.data} onChange={v => setIncForm(f => ({ ...f, data: v }))} />
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Tipo</label>
                <select value={incForm.tipo} onChange={e => setIncForm(f => ({ ...f, tipo: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14 }}>
                  {TIPOS_INC.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Gravidade</label>
                <select value={incForm.gravidade} onChange={e => setIncForm(f => ({ ...f, gravidade: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14 }}>
                  {GRAVIDADES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Status</label>
                <select value={incForm.status} onChange={e => setIncForm(f => ({ ...f, status: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14 }}>
                  {STATUS_INC.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Obra</label>
              <select value={incForm.obra_id} onChange={e => setIncForm(f => ({ ...f, obra_id: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14 }}>
                <option value="">— Sem obra vinculada —</option>
                {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Colaborador envolvido</label>
              <select value={incForm.colaborador_id} onChange={e => setIncForm(f => ({ ...f, colaborador_id: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14 }}>
                <option value="">— Nenhum específico —</option>
                {colabs.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Descrição do ocorrido *</label><textarea value={incForm.descricao} onChange={e => setIncForm(f => ({ ...f, descricao: e.target.value }))} rows={3} placeholder="Descreva o que aconteceu..." style={{ width: "100%", background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.text, fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Ação corretiva</label><textarea value={incForm.acao_corretiva} onChange={e => setIncForm(f => ({ ...f, acao_corretiva: e.target.value }))} rows={2} placeholder="O que foi ou será feito..." style={{ width: "100%", background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.text, fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} /></div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <Btn variant="ghost" onClick={() => setIncModal(false)}>Cancelar</Btn>
              <Btn onClick={salvarInc} disabled={!incForm.descricao}>Salvar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal EPI ── */}
      {epiModal && (
        <Modal onClose={() => setEpiModal(false)} title={epiEdit ? "Editar EPI" : "Registrar Entrega de EPI"}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Colaborador *</label>
              <select value={epiForm.colaborador_id} onChange={e => setEpiForm(f => ({ ...f, colaborador_id: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14 }}>
                <option value="">— Selecione —</option>
                {colabs.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Item de EPI *</label>
              <select value={epiForm.item} onChange={e => setEpiForm(f => ({ ...f, item: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14 }}>
                <option value="">— Selecione —</option>
                {ITENS_EPI.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Input label="Quantidade" type="number" min="1" value={epiForm.quantidade} onChange={v => setEpiForm(f => ({ ...f, quantidade: Number(v) }))} />
              <Input label="Data entrega" type="date" value={epiForm.data_entrega} onChange={v => setEpiForm(f => ({ ...f, data_entrega: v }))} />
              <Input label="Validade" type="date" value={epiForm.validade} onChange={v => setEpiForm(f => ({ ...f, validade: v }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Obra</label>
              <select value={epiForm.obra_id} onChange={e => setEpiForm(f => ({ ...f, obra_id: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14 }}>
                <option value="">— Sem obra vinculada —</option>
                {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" id="assinado" checked={epiForm.assinado} onChange={e => setEpiForm(f => ({ ...f, assinado: e.target.checked }))} style={{ width: 18, height: 18 }} />
              <label htmlFor="assinado" style={{ fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Colaborador assinou o recibo</label>
            </div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Observações</label><textarea value={epiForm.obs} onChange={e => setEpiForm(f => ({ ...f, obs: e.target.value }))} rows={2} style={{ width: "100%", background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.text, fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} /></div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <Btn variant="ghost" onClick={() => setEpiModal(false)}>Cancelar</Btn>
              <Btn onClick={salvarEpi} disabled={!epiForm.colaborador_id || !epiForm.item}>Salvar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Confirm delete ── */}
      {confirm && (
        <Modal onClose={() => setConfirm(null)} title="Confirmar exclusão">
          <p style={{ marginBottom: 20 }}>Excluir <strong>{confirm.label}</strong>? Esta ação não pode ser desfeita.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => setConfirm(null)}>Cancelar</Btn>
            <Btn style={{ background: C.danger }} onClick={confirmarDelete}>Excluir</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
