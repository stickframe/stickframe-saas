import { useState } from "react";
import { C, TIPOS_EVENTO, COR_TIPO_EVENTO } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";

export default function Agenda() {
  useModuleLoad("clientes");
  useModuleLoad("eventos");

  const clientes    = useAppStore((s) => s.clientes);
  const eventos     = useAppStore((s) => s.eventos);
  const addEvento   = useAppStore((s) => s.addEvento);
  const deleteEvento= useAppStore((s) => s.deleteEvento);

  const [modal,    setModal]    = useState(false);
  const [verEvento,setVerEvento]= useState(null);
  const [filtro,   setFiltro]   = useState("todos");
  const FORM_VAZIO = { titulo: "", tipo: "Visita de obra", data: "", hora: "", cliente_id: "", obra: "", obs: "" };
  const [form, setForm] = useState(FORM_VAZIO);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const hoje    = new Date();
  const hojeStr = hoje.toLocaleDateString("pt-BR");
  const sortFn  = (a, b) => a.data.split("/").reverse().join("") > b.data.split("/").reverse().join("") ? 1 : -1;

  const eventosFiltro = eventos
    .filter((e) => filtro === "todos" || (filtro === "hoje" && e.data === hojeStr) || e.tipo === filtro)
    .sort(sortFn);

  const proximos = eventos.filter((e) => {
    const [d, m, a] = e.data.split("/");
    return new Date(a, m - 1, d) >= new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  }).sort(sortFn).slice(0, 3);

  const salvar = () => {
    const clienteSel = clientes.find((c) => c.id === Number(form.cliente_id));
    addEvento({ ...form, cliente: clienteSel?.nome || "—", cor: COR_TIPO_EVENTO[form.tipo] || C.muted });
    setModal(false);
    setForm(FORM_VAZIO);
  };

  const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  return (
    <>
      {modal && (
        <Modal title="Novo compromisso" onClose={() => setModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>TÍTULO</div><Input value={form.titulo} onChange={set("titulo")} placeholder="Ex: Visita de vistoria — Bofete" /></div>
            <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>TIPO</div><Select value={form.tipo} onChange={set("tipo")} options={TIPOS_EVENTO.map((t) => ({ value: t, label: t }))} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>DATA</div><Input value={form.data} onChange={set("data")} placeholder="DD/MM/AAAA" /></div>
              <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>HORA</div><Input value={form.hora} onChange={set("hora")} placeholder="HH:MM" /></div>
            </div>
            <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>CLIENTE</div>
              <Select value={form.cliente_id} onChange={set("cliente_id")} options={[{ value: "", label: "— Selecione —" }, ...clientes.map((c) => ({ value: c.id, label: c.nome }))]} />
            </div>
            <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>OBRA</div><Input value={form.obra} onChange={set("obra")} placeholder="Nome da obra (opcional)" /></div>
            <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>OBSERVAÇÕES</div>
              <textarea value={form.obs} onChange={(e) => set("obs")(e.target.value)} placeholder="Detalhes..." rows={3}
                style={{ width: "100%", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 13px", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn disabled={!form.titulo || !form.data || !form.hora} onClick={salvar}>Salvar compromisso</Btn>
            </div>
          </div>
        </Modal>
      )}

      {verEvento && (
        <Modal title={verEvento.titulo} onClose={() => setVerEvento(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <span style={{ background: verEvento.cor + "22", color: verEvento.cor, border: `1px solid ${verEvento.cor}44`, borderRadius: 4, padding: "3px 10px", fontSize: 11, fontWeight: 700, width: "fit-content" }}>{verEvento.tipo}</span>
            {[["Data", verEvento.data], ["Hora", verEvento.hora], ["Cliente", verEvento.cliente || "—"], ["Obra", verEvento.obra || "—"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
                <span style={{ fontSize: 12, color: C.muted }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            {verEvento.obs && <div style={{ background: C.darker, borderRadius: 6, padding: "12px 14px", fontSize: 13, lineHeight: 1.6 }}>{verEvento.obs}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { deleteEvento(verEvento.id); setVerEvento(null); }} style={{ padding: "8px 16px", background: C.danger + "22", border: `1px solid ${C.danger}44`, borderRadius: 6, color: C.danger, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🗑 Deletar</button>
              <Btn variant="ghost" onClick={() => setVerEvento(null)}>Fechar</Btn>
            </div>
          </div>
        </Modal>
      )}

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Agenda</h2>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{eventos.length} compromissos cadastrados</p>
          </div>
          <Btn onClick={() => setModal(true)}>+ Novo compromisso</Btn>
        </div>

        {/* Próximos */}
        {proximos.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 12 }}>PRÓXIMOS COMPROMISSOS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {proximos.map((e) => (
                <div key={e.id} onClick={() => setVerEvento(e)} style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, borderLeft: `4px solid ${e.cor}`, padding: "14px 16px", cursor: "pointer" }}>
                  <div style={{ fontSize: 11, color: e.cor, fontWeight: 700, marginBottom: 4 }}>{e.data} · {e.hora}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{e.titulo}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{e.tipo}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          {["todos", "hoje", ...TIPOS_EVENTO].map((f) => (
            <button key={f} onClick={() => setFiltro(f)} style={{
              padding: "6px 14px", borderRadius: 6, fontSize: 11,
              fontWeight: filtro === f ? 700 : 400,
              border: `1px solid ${filtro === f ? (COR_TIPO_EVENTO[f] || C.red) : C.border}`,
              background: filtro === f ? (COR_TIPO_EVENTO[f] || C.red) + "18" : "transparent",
              color: filtro === f ? (COR_TIPO_EVENTO[f] || C.text) : C.muted,
              cursor: "pointer", fontFamily: "inherit",
            }}>{f === "todos" ? "Todos" : f === "hoje" ? "Hoje" : f}</button>
          ))}
        </div>

        {/* Lista */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {eventosFiltro.length === 0 ? (
            <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "40px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>Nenhum compromisso encontrado.</div>
          ) : eventosFiltro.map((e) => (
            <div key={e.id} onClick={() => setVerEvento(e)} style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, borderLeft: `4px solid ${e.cor}`, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}>
              <div style={{ flexShrink: 0, textAlign: "center", minWidth: 48 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: e.cor, lineHeight: 1 }}>{e.data.split("/")[0]}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{MESES[Number(e.data.split("/")[1]) - 1]}</div>
              </div>
              <div style={{ width: 1, height: 36, background: C.border, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{e.titulo}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{e.tipo}{e.cliente && e.cliente !== "—" ? ` · ${e.cliente}` : ""}{e.obra ? ` · ${e.obra}` : ""}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: e.cor, flexShrink: 0 }}>{e.hora}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
