import { useState } from "react";
import { C, TIPOS_EVENTO, COR_TIPO_EVENTO } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";

// ─── Helpers de data ──────────────────────────────────────────────────────────
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// Normaliza qualquer formato para ISO (YYYY-MM-DD) para comparar
function toISO(data = "") {
  if (!data) return "";
  if (data.includes("-")) return data;           // já é YYYY-MM-DD
  const [d, m, a] = data.split("/");
  return `${a}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
}

// Extrai dia e mês legível para exibição
function parseDia(data = "") {
  if (data.includes("-")) return data.split("-")[2];
  return data.split("/")[0];
}
function parseMesIdx(data = "") {
  if (data.includes("-")) return Number(data.split("-")[1]);
  return Number(data.split("/")[1]);
}
function fmtDataBR(data = "") {
  if (!data) return "—";
  if (data.includes("-")) {
    const [y,m,d] = data.split("-");
    return `${d}/${m}/${y}`;
  }
  return data;
}

// ─── Label ───────────────────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>
      {String(children).toUpperCase()}
      {required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

// ─── Formulário de evento ────────────────────────────────────────────────────
function FormEvento({ form, setForm, clientes, obras, onSave, onCancel }) {
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  function handleClienteChange(v) {
    const c = clientes.find((x) => x.id === v);
    setForm((f) => ({ ...f, cliente_id: v, cliente: c?.nome || "" }));
  }

  const obraOpts = [
    { value: "", label: "— Sem obra vinculada —" },
    ...obras.map((o) => ({ value: o.nome, label: o.nome?.split("—")[0]?.trim() })),
  ];

  const ok = form.titulo && form.data && form.hora;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Título */}
      <div>
        <Label required>Título</Label>
        <Input value={form.titulo} onChange={set("titulo")} placeholder="Ex: Visita de vistoria — Bofete" />
      </div>

      {/* Tipo */}
      <div>
        <Label>Tipo</Label>
        <Select value={form.tipo} onChange={(v) => setForm((f) => ({ ...f, tipo: v, cor: COR_TIPO_EVENTO[v] || C.red }))}
          options={TIPOS_EVENTO.map((t) => ({ value: t, label: t }))} />
      </div>

      {/* Data + Hora */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label required>Data</Label>
          <Input value={form.data} onChange={set("data")} type="date" />
        </div>
        <div>
          <Label required>Hora</Label>
          <Input value={form.hora} onChange={set("hora")} type="time" />
        </div>
      </div>

      {/* Cliente */}
      <div>
        <Label>Cliente</Label>
        <Select
          value={form.cliente_id}
          onChange={handleClienteChange}
          options={[{ value: "", label: "— Selecione —" }, ...clientes.map((c) => ({ value: c.id, label: c.nome }))]}
        />
      </div>

      {/* Obra */}
      <div>
        <Label>Obra</Label>
        <Select value={form.obra} onChange={set("obra")} options={obraOpts} />
      </div>

      {/* Observações */}
      <div>
        <Label>Observações</Label>
        <textarea
          value={form.obs}
          onChange={(e) => set("obs")(e.target.value)}
          placeholder="Detalhes do compromisso..."
          rows={3}
          style={{
            width: "100%", background: "transparent",
            border: `1px solid ${C.border}`, borderRadius: 6,
            padding: "10px 13px", color: C.text, fontSize: 13,
            outline: "none", fontFamily: "inherit", resize: "vertical",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Ações */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
        <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
        <Btn disabled={!ok} onClick={onSave}>💾 Salvar compromisso</Btn>
      </div>
    </div>
  );
}

// ─── Calendário ──────────────────────────────────────────────────────────────
const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function CalendarioMes({ eventos, onDiaClick, mesRef }) {
  const ano = mesRef.getFullYear();
  const mes = mesRef.getMonth();
  const hoje = new Date().toISOString().slice(0, 10);

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes   = new Date(ano, mes + 1, 0).getDate();

  const celulas = [];
  for (let i = 0; i < primeiroDia; i++) celulas.push(null);
  for (let d = 1; d <= diasNoMes; d++) celulas.push(d);

  function isoDate(d) {
    return `${ano}-${String(mes + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, marginBottom: 4 }}>
        {DIAS_SEMANA.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, color: C.muted, fontWeight: 700, padding: "4px 0" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {celulas.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso  = isoDate(d);
          const evs  = eventos.filter((e) => toISO(e.data) === iso);
          const isHj = iso === hoje;
          return (
            <div
              key={i}
              onClick={() => onDiaClick(iso, evs)}
              style={{
                minHeight: 52, borderRadius: 6, padding: "4px 6px",
                border: `1px solid ${isHj ? C.red : C.border}`,
                background: isHj ? C.red + "12" : evs.length ? C.darker : "transparent",
                cursor: "pointer", position: "relative",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: isHj ? 800 : 400, color: isHj ? C.red : C.text }}>{d}</div>
              {evs.slice(0, 2).map((e, j) => (
                <div key={j} style={{
                  fontSize: 9, fontWeight: 600, lineHeight: 1.2, marginTop: 2,
                  color: e.cor || C.red, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {e.hora} {e.titulo}
                </div>
              ))}
              {evs.length > 2 && (
                <div style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>+{evs.length - 2} mais</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Agenda ──────────────────────────────────────────────────────────────────
const hoje    = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const FORM_VAZIO = {
  titulo: "", tipo: "Visita de obra",
  data: hoje, hora: "09:00",
  cliente_id: "", cliente: "",
  obra: "", obs: "",
  cor: COR_TIPO_EVENTO["Visita de obra"] || C.red,
};

export default function Agenda() {
  useModuleLoad("clientes");
  useModuleLoad("obras");
  useModuleLoad("eventos");

  const clientes    = useAppStore((s) => s.clientes);
  const obras       = useAppStore((s) => s.obras);
  const perfil      = useAppStore((s) => s.user?.perfil);
  const userName    = useAppStore((s) => s.user?.nome);
  const allEventos  = useAppStore((s) => s.eventos);
  const addEvento   = useAppStore((s) => s.addEvento);
  const deleteEvento = useAppStore((s) => s.deleteEvento);

  // Engenheiro vê só eventos vinculados a obras (Visita de obra, Vistoria, Medição)
  const TIPOS_ENG = ["Visita de obra", "Vistoria", "Medição"];
  const eventos = perfil === "engenheiro"
    ? allEventos.filter((e) => TIPOS_ENG.includes(e.tipo))
    : allEventos;

  const [modal,     setModal]     = useState(false);
  const [verEvento, setVerEvento] = useState(null);
  const [filtro,    setFiltro]    = useState("todos");
  const [toast,     setToast]     = useState(null);
  const [form,      setForm]      = useState(FORM_VAZIO);
  const [viewMode,  setViewMode]  = useState("lista"); // "lista" | "calendario"
  const [mesRef,    setMesRef]    = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [diaModal,  setDiaModal]  = useState(null); // { iso, eventos }

  function mostrarToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function abrirNovo() {
    setForm({ ...FORM_VAZIO, data: new Date().toISOString().slice(0, 10) });
    setModal(true);
  }

  function salvar() {
    // Envia apenas campos do schema — sem campos de UI extras
    addEvento({
      titulo:     form.titulo,
      tipo:       form.tipo,
      data:       form.data,
      hora:       form.hora,
      cliente_id: form.cliente_id || null,
      cliente:    form.cliente || "—",
      obra:       form.obra || "",
      obs:        form.obs || "",
      cor:        form.cor || C.red,
    });
    setModal(false);
    setForm(FORM_VAZIO);
    mostrarToast("✅ Compromisso agendado!");
  }

  // ── Filtragem e ordenação ──────────────────────────────────────────────────
  const sortFn = (a, b) => toISO(a.data).localeCompare(toISO(b.data)) || (a.hora || "").localeCompare(b.hora || "");

  const eventosFiltro = eventos
    .filter((e) => {
      if (filtro === "todos") return true;
      if (filtro === "hoje")  return toISO(e.data) === hoje;
      return e.tipo === filtro;
    })
    .sort(sortFn);

  const proximos = eventos
    .filter((e) => toISO(e.data) >= hoje)
    .sort(sortFn)
    .slice(0, 3);

  const temHoje = eventos.some((e) => toISO(e.data) === hoje);

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 999,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "12px 20px",
          fontSize: 13, fontWeight: 600, boxShadow: "0 8px 32px #0006",
        }}>
          {toast}
        </div>
      )}

      {/* Modal novo compromisso */}
      {modal && (
        <Modal title="📅 Novo compromisso" onClose={() => setModal(false)}>
          <FormEvento
            form={form} setForm={setForm}
            clientes={clientes} obras={obras}
            onSave={salvar} onCancel={() => setModal(false)}
          />
        </Modal>
      )}

      {/* Modal detalhes do evento */}
      {verEvento && (
        <Modal title={verEvento.titulo} onClose={() => setVerEvento(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <span style={{
              background: (verEvento.cor || C.red) + "22",
              color: verEvento.cor || C.red,
              border: `1px solid ${(verEvento.cor || C.red)}44`,
              borderRadius: 4, padding: "3px 10px",
              fontSize: 11, fontWeight: 700, width: "fit-content",
            }}>
              {verEvento.tipo}
            </span>

            {[
              ["Data",    fmtDataBR(verEvento.data)],
              ["Hora",    verEvento.hora || "—"],
              ["Cliente", verEvento.cliente || "—"],
              ["Obra",    verEvento.obra || "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
                <span style={{ fontSize: 12, color: C.muted }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
              </div>
            ))}

            {verEvento.obs && (
              <div style={{ background: C.darker, borderRadius: 6, padding: "12px 14px", fontSize: 13, lineHeight: 1.6 }}>
                {verEvento.obs}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { deleteEvento(verEvento.id); setVerEvento(null); mostrarToast("🗑 Compromisso removido."); }} style={{
                padding: "8px 16px", background: C.danger + "22",
                border: `1px solid ${C.danger}44`, borderRadius: 6,
                color: C.danger, fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>🗑 Deletar</button>
              <Btn variant="ghost" onClick={() => setVerEvento(null)}>Fechar</Btn>
            </div>
          </div>
        </Modal>
      )}

      <div>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Agenda</h2>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
              {eventos.length} compromisso{eventos.length !== 1 ? "s" : ""} cadastrado{eventos.length !== 1 ? "s" : ""}
              {temHoje && <span style={{ marginLeft: 8, background: C.red + "22", color: C.red, borderRadius: 4, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>● Hoje</span>}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
              {[["lista","☰ Lista"],["calendario","📅 Mês"]].map(([v, l]) => (
                <button key={v} onClick={() => setViewMode(v)} style={{
                  padding: "7px 14px", fontSize: 11, fontWeight: viewMode === v ? 700 : 400,
                  background: viewMode === v ? C.red + "18" : "transparent",
                  color: viewMode === v ? C.red : C.muted,
                  border: "none", cursor: "pointer", fontFamily: "inherit",
                }}>{l}</button>
              ))}
            </div>
            <Btn onClick={abrirNovo}>+ Novo compromisso</Btn>
          </div>
        </div>

        {/* View calendário */}
        {viewMode === "calendario" && (
          <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}`, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <button onClick={() => setMesRef(new Date(mesRef.getFullYear(), mesRef.getMonth() - 1, 1))}
                style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 12px", cursor: "pointer", color: C.muted, fontSize: 14 }}>‹</button>
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                {MESES[mesRef.getMonth()]} {mesRef.getFullYear()}
              </span>
              <button onClick={() => setMesRef(new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 1))}
                style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 12px", cursor: "pointer", color: C.muted, fontSize: 14 }}>›</button>
            </div>
            <CalendarioMes
              eventos={eventos}
              mesRef={mesRef}
              onDiaClick={(iso, evs) => {
                if (evs.length === 1) setVerEvento(evs[0]);
                else if (evs.length > 1) setDiaModal({ iso, eventos: evs });
                else { setForm({ ...FORM_VAZIO, data: iso }); setModal(true); }
              }}
            />
          </div>
        )}

        {/* Modal eventos do dia */}
        {diaModal && (
          <Modal title={`Compromissos — ${diaModal.iso.split("-").reverse().join("/")}`} onClose={() => setDiaModal(null)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {diaModal.eventos.map((e) => (
                <div key={e.id} onClick={() => { setVerEvento(e); setDiaModal(null); }} style={{
                  padding: "12px 16px", borderRadius: 8, border: `1px solid ${C.border}`,
                  borderLeft: `4px solid ${e.cor || C.red}`, cursor: "pointer",
                }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{e.titulo}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{e.hora} · {e.tipo}</div>
                </div>
              ))}
            </div>
          </Modal>
        )}

        {/* Próximos eventos */}
        {proximos.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 12 }}>PRÓXIMOS COMPROMISSOS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {proximos.map((e) => (
                <div key={e.id} onClick={() => setVerEvento(e)} style={{
                  background: C.surface, borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  borderLeft: `4px solid ${e.cor || C.red}`,
                  padding: "14px 16px", cursor: "pointer",
                  transition: "opacity .15s",
                }}>
                  <div style={{ fontSize: 11, color: e.cor || C.red, fontWeight: 700, marginBottom: 4 }}>
                    {fmtDataBR(e.data)} · {e.hora}
                  </div>
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
            }}>
              {f === "todos" ? "Todos" : f === "hoje" ? "Hoje" : f}
            </button>
          ))}
        </div>

        {/* Lista */}
        {eventosFiltro.length === 0 ? (
          <div style={{
            background: C.surface, borderRadius: 12,
            border: `1px solid ${C.border}`, padding: "48px 0",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
              {filtro === "hoje" ? "Nenhum compromisso hoje" : "Nenhum compromisso encontrado"}
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>
              {filtro === "todos" ? "Agende visitas, reuniões e entregas." : "Tente outro filtro."}
            </div>
            {filtro === "todos" && <Btn onClick={abrirNovo}>+ Criar primeiro compromisso</Btn>}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {eventosFiltro.map((e) => {
              const isHoje = toISO(e.data) === hoje;
              const isPast = toISO(e.data) < hoje;
              return (
                <div key={e.id} onClick={() => setVerEvento(e)} style={{
                  background: C.surface, borderRadius: 10,
                  border: `1px solid ${isHoje ? (e.cor || C.red) + "66" : C.border}`,
                  borderLeft: `4px solid ${isPast ? C.border : (e.cor || C.red)}`,
                  padding: "14px 20px",
                  display: "flex", alignItems: "center", gap: 16,
                  cursor: "pointer", opacity: isPast ? .6 : 1,
                  transition: "opacity .15s",
                }}>
                  {/* Data */}
                  <div style={{ flexShrink: 0, textAlign: "center", minWidth: 48 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: isPast ? C.muted : (e.cor || C.red), lineHeight: 1 }}>
                      {parseDia(e.data)}
                    </div>
                    <div style={{ fontSize: 10, color: C.muted }}>
                      {MESES[(parseMesIdx(e.data) || 1) - 1]}
                    </div>
                  </div>

                  <div style={{ width: 1, height: 36, background: C.border, flexShrink: 0 }} />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{e.titulo}</span>
                      {isHoje && (
                        <span style={{ background: (e.cor || C.red) + "22", color: e.cor || C.red, borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>
                          HOJE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {e.tipo}
                      {e.cliente && e.cliente !== "—" ? ` · ${e.cliente}` : ""}
                      {e.obra ? ` · ${e.obra?.split("—")[0]?.trim()}` : ""}
                    </div>
                  </div>

                  {/* Hora */}
                  <div style={{ fontSize: 14, fontWeight: 700, color: isPast ? C.muted : (e.cor || C.red), flexShrink: 0 }}>
                    {e.hora}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
