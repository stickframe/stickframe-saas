import { useState } from "react";
import { C } from "../utils/constants";
import { fmt } from "../utils/format";
import useAppStore from "../store/useAppStore";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

export default function Medicoes() {
  const obras        = useAppStore((s) => s.obras);
  const financeiro   = useAppStore((s) => s.financeiro);
  const medicoes     = useAppStore((s) => s.medicoes);
  const addMedicao   = useAppStore((s) => s.addMedicao);
  const aprovarMedicao = useAppStore((s) => s.aprovarMedicao);

  const [obraId, setObraId] = useState(obras[0]?.id);
  const [modal,  setModal]  = useState(false);
  const FORM_VAZIO = { descricao: "", percentual: "", valor: "", data: "", obs: "" };
  const [form, setForm] = useState(FORM_VAZIO);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const obra  = obras.find((o) => o.id === obraId) || obras[0];
  const lista = medicoes[obraId] || [];
  const fin   = financeiro[obraId] || { contrato: 0, lancamentos: [] };

  const totalMedido   = lista.reduce((a, m) => a + Number(m.valor), 0);
  const pctMedido     = fin.contrato > 0 ? Math.round((totalMedido / fin.contrato) * 100) : 0;
  const totalAprovado = lista.filter((m) => m.status === "Aprovada").reduce((a, m) => a + Number(m.valor), 0);

  const salvar = () => {
    addMedicao(obraId, { ...form, valor: Number(form.valor), percentual: Number(form.percentual) });
    setModal(false);
    setForm(FORM_VAZIO);
  };

  return (
    <>
      {modal && (
        <Modal title="Nova medição" onClose={() => setModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>DESCRIÇÃO DA ETAPA</div><Input value={form.descricao} onChange={set("descricao")} placeholder="Ex: Estrutura steel frame — bloco A" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>VALOR (R$)</div><Input type="number" value={form.valor} onChange={set("valor")} /></div>
              <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>% DA OBRA</div><Input type="number" value={form.percentual} onChange={set("percentual")} /></div>
            </div>
            <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>DATA</div><Input value={form.data} onChange={set("data")} placeholder="DD/MM/AAAA" /></div>
            <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>OBSERVAÇÕES</div>
              <textarea value={form.obs} onChange={(e) => set("obs")(e.target.value)} rows={3}
                style={{ width: "100%", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 13px", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn disabled={!form.descricao || !form.valor || !form.data} onClick={salvar}>Registrar medição</Btn>
            </div>
          </div>
        </Modal>
      )}

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Medições de Obra</h2>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Controle de avanço físico-financeiro por etapa</p>
          </div>
          <Btn onClick={() => setModal(true)}>+ Nova medição</Btn>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
          {obras.map((o) => (
            <button key={o.id} onClick={() => setObraId(o.id)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${obraId === o.id ? C.red : C.border}`, background: obraId === o.id ? C.red + "18" : "transparent", color: obraId === o.id ? C.text : C.muted, fontSize: 12, fontWeight: obraId === o.id ? 700 : 400, cursor: "pointer" }}>{o.nome.split("—")[0].trim()}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 22 }}>
          {[
            { label: "Contrato",       value: fmt(fin.contrato || 0), color: C.border },
            { label: "Total medido",   value: fmt(totalMedido),       color: C.red },
            { label: "Total aprovado", value: fmt(totalAprovado),     color: C.success },
          ].map((k, i) => (
            <div key={i} style={{ background: C.surface, borderRadius: 10, padding: "16px 18px", border: `1px solid ${C.border}`, borderTop: `3px solid ${k.color}` }}>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: k.color === C.border ? C.text : k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: C.surface, borderRadius: 10, padding: "16px 20px", border: `1px solid ${C.border}`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
            <span style={{ color: C.muted }}>Progresso financeiro medido</span>
            <span style={{ fontWeight: 700 }}>{pctMedido}% do contrato</span>
          </div>
          <div style={{ height: 8, background: C.dark, borderRadius: 4 }}>
            <div style={{ height: 8, width: `${Math.min(pctMedido, 100)}%`, background: `linear-gradient(90deg,${C.red},#6e1210)`, borderRadius: 4, transition: "width .5s" }} />
          </div>
        </div>

        {lista.length === 0 ? (
          <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "48px 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📐</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Nenhuma medição registrada</div>
            <div style={{ fontSize: 13, color: C.muted }}>Clique em "+ Nova medição" para começar.</div>
          </div>
        ) : (
          <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.red}22` }}>
                  {["Nº", "Data", "Descrição", "% Obra", "Valor", "Status", ""].map((h) => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 10, letterSpacing: 1.2, color: C.muted, fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map((m) => (
                  <tr key={m.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700, color: C.red }}>#{m.numero}</td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: C.muted }}>{m.data}</td>
                    <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 600 }}>{m.descricao}</td>
                    <td style={{ padding: "13px 16px", fontSize: 13 }}>{m.percentual}%</td>
                    <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700 }}>{fmt(m.valor)}</td>
                    <td style={{ padding: "13px 16px" }}><Badge label={m.status} color={m.status === "Aprovada" ? C.success : C.warning} /></td>
                    <td style={{ padding: "13px 16px" }}>
                      {m.status === "Pendente" && (
                        <button onClick={() => aprovarMedicao(obraId, m.id)} style={{ padding: "5px 12px", background: C.success + "22", border: `1px solid ${C.success}44`, borderRadius: 6, color: C.success, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✓ Aprovar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
