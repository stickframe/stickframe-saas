import { useState, useEffect } from "react";
import { Building2 } from "../components/ui/Icon";
import { useToast } from "../hooks/useToast";
import { C, FASES, PRECOS } from "../utils/constants";
import { buscarEmpresa, atualizarEmpresa } from "../services/repositories/empresaRepository";
import useAppStore from "../store/useAppStore";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";

//  Helpers 
function LabelF({ children, required }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6, textTransform: "uppercase" }}>
      {children}{required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

function StepIndicator({ current, total, labels }) {
  return (
    <div style={{ display: "flex", gap: 0, marginBottom: 32 }}>
      {labels.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            {i < total - 1 && (
              <div style={{
                position: "absolute", top: 14, left: "50%", width: "100%", height: 2,
                background: done ? C.red : C.border, zIndex: 0,
              }} />
            )}
            <div style={{
              width: 28, height: 28, borderRadius: "50%", zIndex: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800,
              background: done ? C.red : active ? C.red + "22" : C.darker,
              color: done ? "#fff" : active ? C.red : C.muted,
              border: `2px solid ${done || active ? C.red : C.border}`,
            }}>
              {done ? "" : i + 1}
            </div>
            <div style={{ fontSize: 10, color: active ? C.red : done ? C.text : C.muted, fontWeight: active ? 700 : 400, marginTop: 6, textAlign: "center" }}>
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

//  Componente principal 
export default function Onboarding({ onComplete }) {
  const empresaId   = useAppStore((s) => s.empresaId);
  const addCliente  = useAppStore((s) => s.addCliente);
  const addObra     = useAppStore((s) => s.addObra);
  const clientes    = useAppStore((s) => s.clientes);
  const obras       = useAppStore((s) => s.obras);

    const { toast, mostrarToast } = useToast();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 0 — Empresa
  const [empresa, setEmpresa] = useState({
    nome: "", cnpj: "", cidade: "", telefone: "", email: "", segmento: "Construção Steel Frame", site: "",
  });

  // Step 1 — Cliente
  const [cliente, setCliente] = useState({
    nome: "", email: "", contato: "", cidade: "",
  });

  // Step 2 — Obra
  const [obra, setObra] = useState({
    nome: "", padrao: "Padrão", area: 48, unidades: 1,
  });

  useEffect(() => {
    // Carrega dados atuais da empresa
    if (!empresaId) return;
    buscarEmpresa().then((data) => {
      if (data) setEmpresa({
        nome:     data.nome      || "",
        cnpj:     data.cnpj      || "",
        cidade:   data.cidade    || "",
        telefone: data.telefone  || "",
        email:    data.email     || "",
        segmento: data.segmento  || "Construção Steel Frame",
        site:     data.site      || "",
      });
    }).catch(e => console.warn("[Onboarding] dadosEmpresa:", e));
  }, [empresaId]);

  //  Step 0: salvar empresa 
  async function salvarEmpresa() {
    if (!empresa.nome) return;
    setSaving(true);
    try {
      await atualizarEmpresa({
        nome:     empresa.nome,
        cnpj:     empresa.cnpj     || null,
        cidade:   empresa.cidade   || null,
        telefone: empresa.telefone || null,
        email:    empresa.email    || null,
        segmento: empresa.segmento || null,
        site:     empresa.site     || null,
      });
      setStep(1);
    } catch {
      mostrarToast(" Erro ao salvar empresa.");
    } finally {
      setSaving(false);
    }
  }

  //  Step 1: salvar cliente 
  async function salvarCliente() {
    if (!cliente.nome) return;
    setSaving(true);
    try {
      await addCliente({
        nome:    cliente.nome,
        email:   cliente.email   || "",
        contato: cliente.contato || "",
        cidade:  cliente.cidade  || "",
        status:  "Lead",
        valor:   0,
      });
      setStep(2);
    } catch {
      mostrarToast(" Erro ao salvar cliente.");
    } finally {
      setSaving(false);
    }
  }

  //  Step 2: salvar obra 
  async function salvarObra() {
    if (!obra.nome) return;
    setSaving(true);
    try {
      const clienteSel = clientes[0] || null;
      const preco = PRECOS[obra.padrao] || PRECOS["Padrão"];
      await addObra({
        nome:      obra.nome,
        cliente:   clienteSel?.nome || "",
        cliente_id: clienteSel?.id || null,
        status:    "Planejamento",
        fase:      FASES[0],
        progresso: 0,
        contrato:  preco.m2 * Number(obra.area) * Number(obra.unidades),
      });
      await concluirOnboarding();
    } catch {
      mostrarToast(" Erro ao salvar obra.");
    } finally {
      setSaving(false);
    }
  }

  //  Concluir 
  async function concluirOnboarding() {
    await atualizarEmpresa({ onboarding_completo: true });
    onComplete();
  }

  const STEPS = ["Empresa", "Primeiro cliente", "Primeira obra"];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 900,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 999,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600,
          boxShadow: "0 8px 32px #0006",
        }}>{toast}</div>
      )}

      <div style={{
        background: C.surface, borderRadius: 20,
        border: `1px solid ${C.border}`,
        width: "min(520px, 96vw)",
        padding: "clamp(24px,5vw,40px)",
        boxShadow: "0 24px 80px #00000055",
        maxHeight: "92vh", overflowY: "auto",
      }}>
        {/* Logo + título */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontWeight: 900, fontSize: 24, letterSpacing: -0.5, marginBottom: 6 }}>
            <span style={{ color: C.graphite }}>Stick</span><span style={{ color: C.red }}>Frame</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Configuração inicial</div>
          <div style={{ fontSize: 13, color: C.muted }}>Leva menos de 2 minutos para começar.</div>
        </div>

        <StepIndicator current={step} total={STEPS.length} labels={STEPS} />

        {/*  Step 0: Empresa  */}
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.red + "10", border: `1px solid ${C.red}33`, borderRadius: 10, padding: "12px 16px", marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 2 }}><Building2 size={12} /> Dados da empresa</div>
              <div style={{ fontSize: 12, color: C.muted }}>Essas informações aparecerão nos relatórios e propostas.</div>
            </div>

            <div>
              <LabelF required>Nome da empresa</LabelF>
              <Input value={empresa.nome} onChange={(v) => setEmpresa((f) => ({ ...f, nome: v }))} placeholder="Ex: StickFrame Construções Ltda." />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <LabelF>CNPJ</LabelF>
                <Input value={empresa.cnpj} onChange={(v) => setEmpresa((f) => ({ ...f, cnpj: v }))} placeholder="00.000.000/0001-00" />
              </div>
              <div>
                <LabelF>Cidade / Estado</LabelF>
                <Input value={empresa.cidade} onChange={(v) => setEmpresa((f) => ({ ...f, cidade: v }))} placeholder="Ex: São Paulo / SP" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <LabelF>Telefone</LabelF>
                <Input value={empresa.telefone} onChange={(v) => setEmpresa((f) => ({ ...f, telefone: v }))} placeholder="+55 (11) 99999-9999" />
              </div>
              <div>
                <LabelF>E-mail comercial</LabelF>
                <Input type="email" value={empresa.email} onChange={(v) => setEmpresa((f) => ({ ...f, email: v }))} placeholder="contato@empresa.com.br" />
              </div>
            </div>
            <div>
              <LabelF>Site (opcional)</LabelF>
              <Input value={empresa.site} onChange={(v) => setEmpresa((f) => ({ ...f, site: v }))} placeholder="www.empresa.com.br" />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8 }}>
              <Btn disabled={!empresa.nome || saving} onClick={salvarEmpresa}>
                {saving ? "Salvando…" : "Próximo →"}
              </Btn>
            </div>
          </div>
        )}

        {/*  Step 1: Primeiro cliente  */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "#3b6ea510", border: "1px solid #3b6ea533", borderRadius: 10, padding: "12px 16px", marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#3b6ea5", marginBottom: 2 }}> Primeiro cliente</div>
              <div style={{ fontSize: 12, color: C.muted }}>Cadastre o primeiro cliente ou lead para começar a usar o CRM.</div>
            </div>

            <div>
              <LabelF required>Nome do cliente</LabelF>
              <Input value={cliente.nome} onChange={(v) => setCliente((f) => ({ ...f, nome: v }))} placeholder="Ex: João da Silva" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <LabelF>WhatsApp / Telefone</LabelF>
                <Input value={cliente.contato} onChange={(v) => setCliente((f) => ({ ...f, contato: v }))} placeholder="+55 (11) 99999-9999" />
              </div>
              <div>
                <LabelF>E-mail</LabelF>
                <Input type="email" value={cliente.email} onChange={(v) => setCliente((f) => ({ ...f, email: v }))} placeholder="cliente@email.com" />
              </div>
            </div>
            <div>
              <LabelF>Cidade</LabelF>
              <Input value={cliente.cidade} onChange={(v) => setCliente((f) => ({ ...f, cidade: v }))} placeholder="Ex: Campinas / SP" />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8 }}>
              <Btn variant="ghost" onClick={() => setStep(0)}>← Voltar</Btn>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setStep(2)}
                  style={{ padding: "8px 16px", background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Pular etapa
                </button>
                <Btn disabled={!cliente.nome || saving} onClick={salvarCliente}>
                  {saving ? "Salvando…" : "Próximo →"}
                </Btn>
              </div>
            </div>
          </div>
        )}

        {/*  Step 2: Primeira obra  */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.success + "10", border: `1px solid ${C.success}33`, borderRadius: 10, padding: "12px 16px", marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.success, marginBottom: 2 }}> Primeira obra</div>
              <div style={{ fontSize: 12, color: C.muted }}>Crie a primeira obra para acompanhar no Cronograma, Medições e Diário.</div>
            </div>

            <div>
              <LabelF required>Nome da obra</LabelF>
              <Input value={obra.nome} onChange={(v) => setObra((f) => ({ ...f, nome: v }))} placeholder="Ex: Residência Silva — Bofete/SP" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <LabelF>Padrão</LabelF>
                <Select value={obra.padrao} onChange={(v) => setObra((f) => ({ ...f, padrao: v }))}
                  options={Object.keys(PRECOS).map((p) => ({ value: p, label: p }))} />
              </div>
              <div>
                <LabelF>Área (m²)</LabelF>
                <Input type="number" min="20" value={obra.area} onChange={(v) => setObra((f) => ({ ...f, area: v }))} />
              </div>
              <div>
                <LabelF>Unidades</LabelF>
                <Input type="number" min="1" value={obra.unidades} onChange={(v) => setObra((f) => ({ ...f, unidades: v }))} />
              </div>
            </div>

            {obra.nome && (
              <div style={{ background: C.darker, borderRadius: 8, padding: "12px 16px", fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: C.muted }}>Valor estimado do contrato</span>
                  <span style={{ fontWeight: 800, color: C.success }}>
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                      (PRECOS[obra.padrao]?.m2 || 3500) * Number(obra.area) * Number(obra.unidades)
                    )}
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8 }}>
              <Btn variant="ghost" onClick={() => setStep(1)}>← Voltar</Btn>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={concluirOnboarding}
                  style={{ padding: "8px 16px", background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Pular etapa
                </button>
                <Btn disabled={!obra.nome || saving} onClick={salvarObra}>
                  {saving ? "Criando…" : " Concluir setup"}
                </Btn>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
