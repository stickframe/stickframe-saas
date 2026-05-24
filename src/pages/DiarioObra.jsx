import { useState } from "react";
import { C, CLIMAS, TURNOS } from "../utils/constants";
import { gerarDiarioPDF } from "../services/pdfService";
import useAppStore from "../store/useAppStore";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export default function DiarioObra() {
  const obras     = useAppStore((s) => s.obras);
  const diario    = useAppStore((s) => s.diario);
  const addDiario = useAppStore((s) => s.addDiario);

  const [obraId, setObraId] = useState(obras[0]?.id);
  const [modal,  setModal]  = useState(false);
  const [verReg, setVerReg] = useState(null);
  const FORM_VAZIO = { data: "", turno: "Integral", clima: "☀️ Ensolarado", equipe: 1, responsavel: "", atividades: "", ocorrencias: "" };
  const [form, setForm] = useState(FORM_VAZIO);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const obra      = obras.find((o) => o.id === obraId) || obras[0];
  const registros = diario[obraId] || [];

  const salvar = () => {
    addDiario(obraId, { ...form, fotos: [], created: new Date().toLocaleString("pt-BR") });
    setModal(false);
    setForm(FORM_VAZIO);
  };

  return (
    <>
      {modal && (
        <Modal title="Novo registro de diário" onClose={() => setModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>DATA</div><Input value={form.data} onChange={set("data")} placeholder="DD/MM/AAAA" /></div>
              <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>TURNO</div><Select value={form.turno} onChange={set("turno")} options={TURNOS.map((t) => ({ value: t, label: t }))} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>CLIMA</div><Select value={form.clima} onChange={set("clima")} options={CLIMAS.map((c) => ({ value: c, label: c }))} /></div>
              <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>EQUIPE</div><Input type="number" value={form.equipe} onChange={set("equipe")} /></div>
            </div>
            <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>RESPONSÁVEL</div><Input value={form.responsavel} onChange={set("responsavel")} placeholder="Nome do responsável" /></div>
            <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>ATIVIDADES REALIZADAS</div>
              <textarea value={form.atividades} onChange={(e) => set("atividades")(e.target.value)} placeholder="Descreva as atividades do dia..." rows={4}
                style={{ width: "100%", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 13px", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical" }} />
            </div>
            <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>OCORRÊNCIAS <span style={{ fontWeight: 400 }}>(opcional)</span></div>
              <textarea value={form.ocorrencias} onChange={(e) => set("ocorrencias")(e.target.value)} placeholder="Problemas, paralisações, visitas..." rows={3}
                style={{ width: "100%", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 13px", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn disabled={!form.data || !form.responsavel || !form.atividades} onClick={salvar}>Salvar registro</Btn>
            </div>
          </div>
        </Modal>
      )}

      {verReg && (
        <Modal title={`Registro — ${verReg.data}`} onClose={() => setVerReg(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[["Data", verReg.data], ["Turno", verReg.turno], ["Clima", verReg.clima], ["Equipe", `${verReg.equipe} pessoas`]].map(([k, v]) => (
                <div key={k} style={{ background: C.darker, borderRadius: 6, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>
            <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>RESPONSÁVEL</div><div style={{ fontSize: 13, fontWeight: 600 }}>{verReg.responsavel}</div></div>
            <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>ATIVIDADES</div>
              <div style={{ background: C.darker, borderRadius: 6, padding: "12px 14px", fontSize: 13, lineHeight: 1.7 }}>{verReg.atividades}</div>
            </div>
            {verReg.ocorrencias && (
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>OCORRÊNCIAS</div>
                <div style={{ background: C.red + "0f", border: `1px solid ${C.red}33`, borderRadius: 6, padding: "12px 14px", fontSize: 13, lineHeight: 1.7, borderLeft: `3px solid ${C.red}` }}>{verReg.ocorrencias}</div>
              </div>
            )}
          </div>
        </Modal>
      )}

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Diário de Obra</h2>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Registro diário de atividades e ocorrências</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => gerarDiarioPDF(obra, registros)} style={{ padding: "10px 16px", background: "transparent", border: `1px solid ${C.success}`, borderRadius: 6, color: C.success, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📄 Exportar PDF</button>
            <Btn onClick={() => setModal(true)}>+ Novo registro</Btn>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
          {obras.map((o) => (
            <button key={o.id} onClick={() => setObraId(o.id)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${obraId === o.id ? C.red : C.border}`, background: obraId === o.id ? C.red + "18" : "transparent", color: obraId === o.id ? C.text : C.muted, fontSize: 12, fontWeight: obraId === o.id ? 700 : 400, cursor: "pointer" }}>{o.nome.split("—")[0].trim()}</button>
          ))}
        </div>

        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "14px 20px", marginBottom: 20, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          {[["OBRA", obra?.nome], ["FASE ATUAL", obra?.fase], ["PROGRESSO", `${obra?.progresso}%`], ["REGISTROS", registros.length]].map(([k, v]) => (
            <div key={k}><div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>{k}</div><div style={{ fontSize: 13, fontWeight: 700 }}>{v}</div></div>
          ))}
        </div>

        {registros.length === 0 ? (
          <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "48px 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Nenhum registro ainda</div>
            <div style={{ fontSize: 13, color: C.muted }}>Clique em "+ Novo registro" para começar o diário.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {registros.map((r) => (
              <div key={r.id} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px" }}>
                  <div style={{ background: C.red, borderRadius: 8, padding: "10px 14px", textAlign: "center", flexShrink: 0, minWidth: 60 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{r.data.split("/")[0]}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,.8)", marginTop: 2 }}>{MESES[Number(r.data.split("/")[1]) - 1]}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{r.clima}</span>
                      <span style={{ background: "#41414133", color: C.muted, borderRadius: 4, padding: "1px 8px", fontSize: 11 }}>{r.turno}</span>
                      <span style={{ fontSize: 11, color: C.muted }}>👥 {r.equipe} pessoas</span>
                      {r.ocorrencias && <span style={{ background: C.red + "18", color: C.red, border: `1px solid ${C.red}33`, borderRadius: 4, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>⚠️ Ocorrência</span>}
                    </div>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.atividades}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Por {r.responsavel} · {r.created}</div>
                  </div>
                  <button onClick={() => setVerReg(r)} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, fontSize: 12, cursor: "pointer", padding: "8px 14px", fontFamily: "inherit", flexShrink: 0 }}>Ver detalhes</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
