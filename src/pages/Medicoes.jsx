import { useState, useMemo, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function CurvaS({ medicoes }) {
  const meses = {};
  (medicoes || []).forEach(m => {
    const mes = (m.data || m.created_at || "").substring(0, 7);
    if (!mes) return;
    if (!meses[mes]) meses[mes] = { mes, total: 0, count: 0 };
    meses[mes].total += (m.percentual_acumulado || m.percentual || 0);
    meses[mes].count += 1;
  });

  const sorted = Object.values(meses).sort((a, b) => a.mes.localeCompare(b.mes));
  const dados = sorted.map((m, i) => ({
    mes: m.mes,
    realizado: Math.min(100, Math.round(m.total / m.count)),
    previsto: Math.round(((i + 1) / Math.max(sorted.length, 1)) * 100),
  }));

  if (dados.length < 2) return (
    <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: 24, marginBottom: 20, textAlign: "center", color: "var(--text-muted)" }}>
      <p style={{ fontSize: 32, margin: "0 0 8px" }}></p>
      <p style={{ margin: 0 }}>Curva S disponível após registrar medições em 2+ meses.</p>
    </div>
  );

  return (
    <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: 24, marginBottom: 20 }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}> Curva S — Progresso Físico</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
          <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
          <Tooltip formatter={v => `${v}%`} />
          <Legend />
          <Line type="monotone" dataKey="previsto" name="Previsto" stroke="#3b82f6" strokeDasharray="5 5" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="realizado" name="Realizado" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
import Comentarios from "../components/ui/Comentarios";
import { Link, Ruler } from "../components/ui/Icon";
import { C } from "../utils/constants";
import { fmt } from "../utils/format";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import { useToast } from "../hooks/useToast";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { gerarCobrancaAsaas } from "../services/repositories/obraRepository";
import { gerarBoletimMedicao } from "../services/relatorioService";
import { useObraPermission, useObrasVisiveis } from "../hooks/useObraPermission";

export default function Medicoes() {
  const _obras       = useAppStore((s) => s.obras);
  const obras        = useObrasVisiveis(_obras);
  const financeiro   = useAppStore((s) => s.financeiro);
  const medicoes     = useAppStore((s) => s.medicoes);
  const addMedicao   = useAppStore((s) => s.addMedicao);
  const aprovarMedicao = useAppStore((s) => s.aprovarMedicao);

  const [obraId, setObraId] = useState(() => obras[0]?.id || null);
  const { podeEditar } = useObraPermission(obraId);
  const [pagina, setPagina] = useState(0);
  const POR_PAGINA = 15;

  // Sync obraId quando obras carregam depois do mount
  useEffect(() => {
    setObraId((prev) => prev || obras[0]?.id || null);
  }, [obras]);

  useModuleLoad("obras");
  useModuleLoad("financeiro");
  useModuleLoad("medicoes", obraId || obras[0]?.id);
  const [modal,  setModal]  = useState(false);
  const FORM_VAZIO = { descricao: "", percentual: "", valor: "", data: "", obs: "" };
  const [form, setForm] = useState(FORM_VAZIO);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const { toast, mostrarToast } = useToast();
  const [asaasModal, setAsaasModal] = useState(null); // null | medicao object
  const [comentariosModal, setComentariosModal] = useState(null); // null | medicao object
  const [cpfCnpjCliente, setCpfCnpjCliente] = useState("");
  const defaultVencimento = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); };
  const [vencimentoAsaas, setVencimentoAsaas] = useState(defaultVencimento);

  const obra  = obras.find((o) => o.id === obraId) || obras[0];
  const lista = medicoes[obraId] || [];
  const fin   = financeiro[obraId] || { contrato: 0, lancamentos: [] };

  const { totalMedido, pctMedido, totalAprovado, listaPage, totalPages } = useMemo(() => {
    const total   = lista.reduce((a, m) => a + Number(m.valor), 0);
    const aprovado = lista.filter((m) => m.status === "Aprovada").reduce((a, m) => a + Number(m.valor), 0);
    const pages   = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    const safePag = Math.min(pagina, pages - 1);
    return {
      totalMedido:   total,
      pctMedido:     fin.contrato > 0 ? Math.round((total / fin.contrato) * 100) : 0,
      totalAprovado: aprovado,
      listaPage:     lista.slice(safePag * POR_PAGINA, (safePag + 1) * POR_PAGINA),
      totalPages:    pages,
    };
  }, [lista, fin.contrato, pagina]);

  const salvar = () => {
    addMedicao(obraId, { ...form, valor: Number(form.valor), percentual: Number(form.percentual) });
    setModal(false);
    setForm(FORM_VAZIO);
    setPagina(0);
  };

  async function gerarBoleto() {
    if (!asaasModal) return;
    try {
      await gerarCobrancaAsaas(asaasModal.id, {
        nomeCliente: obra?.cliente || "Cliente",
        cpfCnpj: cpfCnpjCliente,
        valor: Number(asaasModal.valor),
        descricao: `Medição #${asaasModal.numero} — ${asaasModal.descricao}`,
        dataVencimento: vencimentoAsaas,
      });
      setAsaasModal(null);
      setCpfCnpjCliente("");
      mostrarToast(" Boleto gerado via Asaas!");
    } catch (e) {
      mostrarToast(` Erro: ${e?.message || "falha ao gerar boleto"}`);
    }
  }

  return (
    <>
      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: C.darker, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 32px #0006" }}>
          {toast}
        </div>
      )}

      {comentariosModal && (
        <Modal title={` Comentários — Medição #${comentariosModal.numero}`} onClose={() => setComentariosModal(null)}>
          <Comentarios entidade="medicao" entidadeId={comentariosModal.id} title={`Medição #${comentariosModal.numero} — ${comentariosModal.descricao}`} />
        </Modal>
      )}

      {asaasModal && (
        <Modal title={`Gerar cobrança — Medição #${asaasModal.numero}`} onClose={() => setAsaasModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>CPF/CNPJ DO CLIENTE</div>
              <Input value={cpfCnpjCliente} onChange={(v) => setCpfCnpjCliente(v)} placeholder="000.000.000-00 ou 00.000.000/0001-00" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>DATA DE VENCIMENTO</div>
              <Input type="date" value={vencimentoAsaas} onChange={(v) => setVencimentoAsaas(v)} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>VALOR DA MEDIÇÃO</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{fmt(asaasModal.valor)}</div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <Btn variant="ghost" onClick={() => setAsaasModal(null)}>Cancelar</Btn>
              <Btn disabled={!cpfCnpjCliente || !vencimentoAsaas} onClick={gerarBoleto}>Gerar Boleto via Asaas</Btn>
            </div>
          </div>
        </Modal>
      )}

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
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => gerarBoletimMedicao(obra, lista)}
              style={{ padding: "7px 14px", background: "#b41e1e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
               Boletim PDF
            </button>
            {podeEditar() && <Btn onClick={() => setModal(true)}>+ Nova medição</Btn>}
          </div>
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
            <div key={i} style={{ background: C.surface, borderRadius: 14, padding: "16px 18px", border: `1px solid ${C.border}`, borderTop: `3px solid ${k.color}` }}>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: k.color === C.border ? C.text : k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: C.surface, borderRadius: 14, padding: "16px 20px", border: `1px solid ${C.border}`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
            <span style={{ color: C.muted }}>Progresso financeiro medido</span>
            <span style={{ fontWeight: 700 }}>{pctMedido}% do contrato</span>
          </div>
          <div style={{ height: 8, background: C.dark, borderRadius: 4 }}>
            <div style={{ height: 8, width: `${Math.min(pctMedido, 100)}%`, background: `linear-gradient(90deg,${C.red},#6e1210)`, borderRadius: 4, transition: "width .5s" }} />
          </div>
        </div>

        <CurvaS medicoes={lista} />

        {lista.length === 0 ? (
          <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `1px solid ${C.border}`, padding: "48px 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}><Ruler size={36} /></div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Nenhuma medição registrada</div>
            <div style={{ fontSize: 13, color: C.muted }}>Clique em "+ Nova medição" para começar.</div>
          </div>
        ) : (
          <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.red}22` }}>
                  {["Nº", "Data", "Descrição", "% Obra", "Valor", "Status", ""].map((h) => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 10, letterSpacing: 1.2, color: C.muted, fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listaPage.map((m) => (
                  <tr key={m.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700, color: C.red }}>#{m.numero}</td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: C.muted }}>{m.data}</td>
                    <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 600 }}>{m.descricao}</td>
                    <td style={{ padding: "13px 16px", fontSize: 13 }}>{m.percentual}%</td>
                    <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700 }}>{fmt(m.valor)}</td>
                    <td style={{ padding: "13px 16px" }}><Badge label={m.status} color={m.status === "Aprovada" ? C.success : C.warning} /></td>
                    <td style={{ padding: "13px 16px", display: "flex", gap: 6, alignItems: "center" }}>
                      {m.status === "Pendente" && (
                        <button onClick={() => aprovarMedicao(obraId, m.id)} style={{ padding: "5px 12px", background: C.success + "22", border: `1px solid ${C.success}44`, borderRadius: 6, color: C.success, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}> Aprovar</button>
                      )}
                      {m.status !== "Pago" && (
                        <button onClick={() => { setAsaasModal(m); setVencimentoAsaas(defaultVencimento()); }} style={{ padding: "5px 10px", background: "#1a56db22", border: "1px solid #1a56db44", borderRadius: 6, color: "#1a56db", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}> Cobrança</button>
                      )}
                      {m.link_pagamento && (
                        <a href={m.link_pagamento} target="_blank" rel="noreferrer" style={{ padding: "5px 8px", background: C.border, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12, textDecoration: "none" }} title="Abrir link de pagamento"><Link size={11} /></a>
                      )}
                      <button onClick={() => setComentariosModal(m)} style={{ padding: "5px 10px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
                <button onClick={() => setPagina((p) => Math.max(0, p - 1))} disabled={pagina === 0}
                  aria-label="Página anterior"
                  style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "none", cursor: pagina === 0 ? "default" : "pointer", opacity: pagina === 0 ? 0.4 : 1 }}>
                  ‹
                </button>
                <span style={{ fontSize: 12, color: C.muted }}>
                  {pagina + 1} / {totalPages}
                </span>
                <button onClick={() => setPagina((p) => Math.min(totalPages - 1, p + 1))} disabled={pagina >= totalPages - 1}
                  aria-label="Próxima página"
                  style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "none", cursor: pagina >= totalPages - 1 ? "default" : "pointer", opacity: pagina >= totalPages - 1 ? 0.4 : 1 }}>
                  ›
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
