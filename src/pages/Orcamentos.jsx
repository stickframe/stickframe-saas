import { useState, useEffect } from "react";
import { Bell, ClipboardList, FileText, Pencil, Smartphone, Trash2, Zap } from "../components/ui/Icon";
import FluxoOrcamentoStepper from "../components/ui/FluxoOrcamentoStepper";
import { sb, getEmpresaId } from "../services/supabase";
import { LOGO_STICKFRAME } from "../utils/cdn";
import { useToast } from "../hooks/useToast";
import { printHtml } from "../utils/printHtml";
import { C, PRECOS, FASES } from "../utils/constants";
import { fmt } from "../utils/format";
import { enviarWhatsApp, msgOrcamento } from "../services/whatsappService";
import { inserirTemplate } from "../services/repositories/quantitativoRepository";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import FormAiMemorial from "../components/ui/FormAiMemorial";
import CatalogoPicker from "../components/orcamento/CatalogoPicker";
import { CATALOGO_PRODUTOS } from "../utils/insumosSF";

const _catalogoMap = Object.fromEntries(CATALOGO_PRODUTOS.map(p => [p.id, p]));

//  Status 
const STATUS_OPTS = ["Aguardando resposta", "Em revisão", "Aprovado", "Recusado"];
const STATUS_COR  = {
  "Aguardando resposta": "#c88a00",
  "Em revisão":          "#3b6ea5",
  "Aprovado":            "#3f7a4b",
  "Recusado":            "#a33327",
};
const statusColor = (s) => STATUS_COR[s] || C.muted;

const parseCriadoDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (typeof dateStr === "string" && dateStr.includes("/")) {
    const [day, month, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
};

const getValidadeText = (criado, validadeDias = 30) => {
  const dataCriado = parseCriadoDate(criado);
  const dataValidade = new Date(dataCriado.getTime());
  dataValidade.setDate(dataValidade.getDate() + validadeDias);
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  dataValidade.setHours(0, 0, 0, 0);
  
  const diffTime = dataValidade.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return { text: `Expirado há ${absDays} ${absDays === 1 ? 'dia' : 'dias'}`, color: C.danger, isExpired: true };
  } else if (diffDays === 0) {
    return { text: "Expira hoje!", color: C.warning, isExpired: false };
  } else {
    return { text: `Expira em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`, color: C.success, isExpired: false };
  }
};

//  Cálculo 
//  Cálculo 
function calcOrcamento({ area, unidades, padrao, desconto = 0, valor_m2_custom = 0, valor = 0 }) {
  let valor_m2 = Number(valor_m2_custom) || 0;
  if (valor_m2 === 0 && valor > 0) {
    valor_m2 = Number(valor) / (Number(area || 1) * Number(unidades || 1));
  }
  if (valor_m2 === 0) {
    const preco = PRECOS[padrao] || PRECOS["Padrão"];
    valor_m2    = preco?.m2 || 0;
  }
  const valor_uh    = valor_m2 * Number(area);
  const valor_base  = valor_uh * Number(unidades);
  const desc_valor  = valor_base * (Number(desconto) / 100);
  const valor_total = valor_base - desc_valor;
  return { valor_m2, valor_uh, valor_base, desc_valor, valor_total };
}

//  Label auxiliar 
function Label({ children, required }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>
      {String(children).toUpperCase()}
      {required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

//  Formulário (fora do componente) 
function FormOrc({ form, setForm, clientes, onSave, onCancel, onDelete, btnLabel, addCliente }) {
  const [showCatalogo, setShowCatalogo] = useState(false);
  const set  = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const calc = calcOrcamento({
    area: form.area,
    unidades: form.unidades,
    padrao: form.padrao,
    desconto: form.desconto || 0,
    valor_m2_custom: form.valor_m2_custom || 0
  });

  const [criandoCliente, setCriandoCliente] = useState(false);
  const [novoCliente, setNovoCliente] = useState({ nome: "", contato: "", email: "" });
  const [salvandoCli, setSalvandoCli] = useState(false);
  const [cliErro, setCliErro] = useState("");

  async function handleSalvarCliente() {
    if (!novoCliente.nome.trim()) return;
    setSalvandoCli(true);
    setCliErro("");
    try {
      const data = await addCliente(novoCliente);
      if (data?.id) {
        setForm(f => ({ ...f, cliente_id: data.id }));
        setCriandoCliente(false);
        setNovoCliente({ nome: "", contato: "", email: "" });
      } else {
        throw new Error("Não foi possível obter o ID do cliente criado.");
      }
    } catch (e) {
      setCliErro(e?.message || "Erro ao cadastrar cliente.");
    } finally {
      setSalvandoCli(false);
    }
  }

  const clienteOpts = [
    { value: "", label: clientes.length ? "— Selecione um cliente —" : "— Nenhum cliente cadastrado —" },
    ...clientes.map((c) => ({ value: c.id, label: c.nome })),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Cliente */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <Label required>Cliente</Label>
          {!criandoCliente && (
            <button
              type="button"
              onClick={() => setCriandoCliente(true)}
              style={{
                background: "none", border: "none", color: C.red,
                fontWeight: 700, fontSize: 11, cursor: "pointer",
                padding: "2px 6px", textTransform: "uppercase", letterSpacing: 0.5
              }}
            >
              + Novo Cliente
            </button>
          )}
        </div>

        {criandoCliente ? (
          <div style={{
            background: C.bg, borderRadius: 8, padding: 12,
            border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>CADASTRAR NOVO CLIENTE</div>
            <div>
              <Label required>Nome</Label>
              <Input
                value={novoCliente.nome}
                onChange={(v) => setNovoCliente(n => ({ ...n, nome: v }))}
                placeholder="Nome completo"
              />
            </div>
            <div className="sf-grid-2">
              <div>
                <Label>WhatsApp / Contato</Label>
                <Input
                  value={novoCliente.contato}
                  onChange={(v) => setNovoCliente(n => ({ ...n, contato: v }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={novoCliente.email}
                  onChange={(v) => setNovoCliente(n => ({ ...n, email: v }))}
                  placeholder="exemplo@email.com"
                />
              </div>
            </div>
            {cliErro && (
              <div style={{ fontSize: 11, color: C.danger }}> {cliErro}</div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
              <button
                type="button"
                className="sf-btn sf-btn-sm sf-btn-ghost"
                onClick={() => setCriandoCliente(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="sf-btn sf-btn-sm sf-btn-primary"
                disabled={!novoCliente.nome.trim() || salvandoCli}
                onClick={handleSalvarCliente}
              >
                {salvandoCli ? "Salvando..." : "Salvar Cliente"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <Select value={form.cliente_id} onChange={set("cliente_id")} options={clienteOpts} />
            {!clientes.length && (
              <div style={{ fontSize: 11, color: C.warning, marginTop: 4 }}>
                 Cadastre um cliente no CRM ou crie um novo inline.
              </div>
            )}
          </>
        )}
      </div>

      {/* Unidades + Área */}
      <div className="sf-grid-2">
        <div>
          <Label>Unidades</Label>
          <Input
            type="number" min="1"
            value={form.unidades}
            onChange={(v) => set("unidades")(Math.max(1, parseInt(v) || 1))}
          />
        </div>
        <div>
          <Label required>Área (m²)</Label>
          <Input
            type="number" min="1"
            value={form.area}
            onChange={(v) => set("area")(Math.max(1, parseFloat(v) || 1))}
          />
        </div>
      </div>

      {/* Padrão + Status */}
      <div className="sf-grid-2">
        <div>
          <Label required>Padrão construtivo (Presets)</Label>
          <Select
            value={Object.entries(PRECOS).find(([k, v]) => Number(v.m2) === Number(form.valor_m2_custom))?.[0] || "Livre"}
            onChange={(val) => {
              if (val === "Livre") {
                setForm((f) => ({ ...f, padrao: "Livre" }));
              } else {
                const preset = PRECOS[val];
                setForm((f) => ({
                  ...f,
                  padrao: val,
                  valor_m2_custom: preset ? preset.m2 : 0
                }));
              }
            }}
            options={[
              ...Object.entries(PRECOS).map(([k, v]) => ({ value: k, label: `${v.label} — ${fmt(v.m2)}/m²` })),
              { value: "Livre", label: "Outro / Personalizado (Digitar abaixo)" }
            ]}
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select
            value={form.status}
            onChange={set("status")}
            options={STATUS_OPTS.map((v) => ({ value: v, label: v }))}
          />
        </div>
      </div>

      <div>
        <Label required>Valor do m² / Mão de obra (R$)</Label>
        <Input
          type="number"
          min="0"
          placeholder="Digite o valor por m² (Ex: 1200)"
          value={form.valor_m2_custom || ""}
          onChange={(val) => {
            const valNum = parseFloat(val) || 0;
            const matched = Object.entries(PRECOS).find(([k, v]) => Number(v.m2) === valNum)?.[0] || "Livre";
            setForm((f) => ({
              ...f,
              padrao: matched,
              valor_m2_custom: val
            }));
          }}
        />
      </div>

      {/* Desconto */}
      <div>
        <Label>Desconto (%)</Label>
        <Input
          type="number"
          min="0"
          max="100"
          value={form.desconto || 0}
          onChange={(v) => set("desconto")(Math.min(100, Math.max(0, parseInt(v) || 0)))}
        />
      </div>

      {/* Prévia de valores */}
      <div style={{ background: C.darker, borderRadius: 10, border: `1px solid ${C.red}33`, padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: C.red, marginBottom: 12 }}>
          PRÉVIA DO ORÇAMENTO
        </div>
        <div className="sf-grid-2">
          <div style={{ background: C.surface, borderRadius: 8, padding: "10px 12px", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Valor / m²</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{fmt(calc.valor_m2)}</div>
          </div>
          {form.unidades > 1 && (
            <div style={{ background: C.surface, borderRadius: 8, padding: "10px 12px", border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Valor / unid. (base)</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{fmt(calc.valor_uh)}</div>
            </div>
          )}
          {form.desconto > 0 && (
            <>
              <div style={{ background: C.surface, borderRadius: 8, padding: "10px 12px", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Valor Base Total</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{fmt(calc.valor_base)}</div>
              </div>
              <div style={{ background: C.surface, borderRadius: 8, padding: "10px 12px", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Desconto ({form.desconto}%)</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.danger }}>- {fmt(calc.desc_valor)}</div>
              </div>
            </>
          )}
          <div style={{
            gridColumn: "span 2",
            background: C.surface, borderRadius: 8, padding: "10px 12px",
            border: `1px solid ${C.red}44`,
          }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>TOTAL COM DESCONTO</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.red }}>{fmt(calc.valor_total)}</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>
          {form.unidades > 1 ? `${form.unidades} × ` : ""}{form.area} m² × {fmt(calc.valor_m2)}/m²
        </div>
      </div>

      {/* Itens do Orçamento */}
      {(() => {
        const itens = form.opcionais || [];

        // Subtotais por categoria (só itens do catálogo com categoria)
        const subtotaisCat = {};
        let totalManuais = 0;
        itens.forEach(op => {
          if (op.produtoId && op.categoria) {
            subtotaisCat[op.categoria] = (subtotaisCat[op.categoria] || 0) + Number(op.preco || 0);
          } else {
            totalManuais += Number(op.preco || 0);
          }
        });
        const totalItens = itens.reduce((s, op) => s + Number(op.preco || 0), 0);
        const temItens = itens.length > 0;

        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <Label>Itens do Orçamento</Label>
              {temItens && (
                <span style={{ fontSize: 12, fontWeight: 700, color: C.steel }}>
                  Total: {fmt(totalItens)}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>
              Adicione itens manualmente ou selecione do catálogo. O cliente poderá aceitar ou rejeitar cada item na proposta.
            </div>

            {itens.map((op, i) => {
              const precoAtual = op.produtoId ? _catalogoMap[op.produtoId]?.preco : null;
              const variacaoPreco = precoAtual != null && op.precoUnit != null && Math.abs(precoAtual - op.precoUnit) > 0.01
                ? precoAtual - op.precoUnit : null;

              return (
                <div key={i} style={{ marginBottom: 8 }}>
                  {op.produtoId ? (
                    <div style={{
                      display: "flex", gap: 8, alignItems: "center",
                      background: "rgba(152,25,21,0.05)", border: "1px solid rgba(152,25,21,0.2)",
                      borderRadius: 9, padding: "8px 10px",
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {op.nome}
                        </div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 2, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <span>{op.unidade} · {fmt(op.precoUnit)}/un</span>
                          {op.categoria && <span style={{ background: "rgba(152,25,21,0.1)", padding: "1px 6px", borderRadius: 8, color: "#981915", fontWeight: 600 }}>{op.categoria}</span>}
                          {variacaoPreco !== null && (
                            <span title={`Preço atual no catálogo: ${fmt(precoAtual)}/un`} style={{
                              background: variacaoPreco > 0 ? "rgba(176,122,30,0.15)" : "rgba(63,122,75,0.15)",
                              color: variacaoPreco > 0 ? "#b07a1e" : "#3f7a4b",
                              padding: "1px 6px", borderRadius: 8, fontWeight: 700, cursor: "help",
                            }}>
                              {variacaoPreco > 0 ? "↑" : "↓"} Preço {variacaoPreco > 0 ? "subiu" : "baixou"} para {fmt(precoAtual)}
                            </span>
                          )}
                        </div>
                      </div>
                      <input
                        type="number" min={1} value={op.quantidade || 1}
                        onChange={(e) => {
                          const arr = [...(form.opcionais || [])];
                          const qtd = Math.max(1, Number(e.target.value) || 1);
                          arr[i] = { ...arr[i], quantidade: qtd, preco: arr[i].precoUnit * qtd };
                          setForm((f) => ({ ...f, opcionais: arr }));
                        }}
                        style={{ width: 52, padding: "5px 7px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: "inherit", outline: "none", textAlign: "center" }}
                      />
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.steel, minWidth: 72, textAlign: "right" }}>{fmt(op.preco)}</div>
                      <button
                        onClick={() => setForm((f) => ({ ...f, opcionais: f.opcionais.filter((_, j) => j !== i) }))}
                        style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}
                      >×</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        value={op.nome}
                        onChange={(e) => {
                          const arr = [...(form.opcionais || [])];
                          arr[i] = { ...arr[i], nome: e.target.value };
                          setForm((f) => ({ ...f, opcionais: arr }));
                        }}
                        placeholder="Descrição do serviço"
                        style={{ flex: 2, padding: "8px 12px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit", outline: "none" }}
                      />
                      <input
                        value={op.preco}
                        onChange={(e) => {
                          const arr = [...(form.opcionais || [])];
                          arr[i] = { ...arr[i], preco: e.target.value };
                          setForm((f) => ({ ...f, opcionais: arr }));
                        }}
                        placeholder="Valor (R$)"
                        type="number"
                        style={{ flex: 1, padding: "8px 12px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit", outline: "none" }}
                      />
                      <button
                        onClick={() => setForm((f) => ({ ...f, opcionais: f.opcionais.filter((_, j) => j !== i) }))}
                        style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}
                      >×</button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Subtotais por categoria */}
            {Object.keys(subtotaisCat).length > 1 && (
              <div style={{ marginBottom: 12, padding: "10px 12px", background: "rgba(0,0,0,0.03)", borderRadius: 8, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Subtotais por categoria</div>
                {Object.entries(subtotaisCat).map(([cat, val]) => (
                  <div key={cat} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginBottom: 3 }}>
                    <span>{cat}</span><span style={{ fontWeight: 600 }}>{fmt(val)}</span>
                  </div>
                ))}
                {totalManuais > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginBottom: 3 }}>
                    <span>Itens manuais</span><span style={{ fontWeight: 600 }}>{fmt(totalManuais)}</span>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => setForm((f) => ({ ...f, opcionais: [...(f.opcionais || []), { nome: "", preco: "" }] }))}
                style={{ fontSize: 12, color: C.steel, background: "none", border: `1px dashed ${C.steel}`, borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit" }}
              >+ Manual</button>
              <button
                onClick={() => setShowCatalogo(true)}
                style={{ fontSize: 12, color: "#981915", background: "none", border: "1px dashed #981915", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit" }}
              >📦 Do Catálogo</button>
            </div>
          </div>
        );
      })()}

      {showCatalogo && (
        <CatalogoPicker
          onAdd={(item) => {
            setForm((f) => ({ ...f, opcionais: [...(f.opcionais || []), item] }));
          }}
          onClose={() => setShowCatalogo(false)}
        />
      )}

      {/* Ações */}
      <div style={{
        display: "flex", gap: 10, justifyContent: "flex-end",
        paddingTop: 12, borderTop: `1px solid ${C.border}`,
      }}>
        {onDelete && form.status === "Recusado" && (
          <Btn variant="danger" onClick={onDelete} style={{ marginRight: "auto" }}>
            <Trash2 size={13} /> Excluir orçamento
          </Btn>
        )}
        <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
        <Btn
          disabled={!form.cliente_id}
          onClick={onSave}
        >
          {btnLabel}
        </Btn>
      </div>
    </div>
  );
}

//  Gerador de PDF 
function gerarPDF(o) {
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
  <title>Orçamento ${o.ref}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 40px; color: #1a1a1a; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #981915; }
    .logo { font-size: 24px; font-weight: 900; letter-spacing: 3px; }
    .logo span { color: #981915; }
    .ref { font-size: 13px; color: #6b7280; margin-top: 4px; }
    h2 { font-size: 18px; margin-bottom: 20px; color: #981915; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e4e4ea; font-size: 14px; }
    .row .label { color: #6b7280; }
    .row .value { font-weight: 700; }
    .total-box { background: #f0f0f3; border-radius: 10px; padding: 20px 24px; margin-top: 28px; display: flex; justify-content: space-between; align-items: center; }
    .total-box .label { font-size: 13px; color: #6b7280; }
    .total-box .value { font-size: 28px; font-weight: 900; color: #981915; }
    .footer { margin-top: 48px; text-align: center; font-size: 11px; color: #6b7280; }
    @media print { body { padding: 20px; } }
  </style></head><body>
  <div class="header">
    <div>
      <div class="logo">STICK<span>FRAME</span></div>
      <div class="ref">SISTEMAS CONSTRUTIVOS</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:20px;font-weight:800">${o.ref}</div>
      <div class="ref">${o.criado || new Date().toLocaleDateString("pt-BR")}</div>
    </div>
  </div>
  <h2>Proposta de Orçamento</h2>
  <div class="row"><span class="label">Cliente</span><span class="value">${o.cliente}</span></div>
  <div class="row"><span class="label">Padrão construtivo</span><span class="value">${o.padrao}</span></div>
  <div class="row"><span class="label">Unidades</span><span class="value">${o.unidades}</span></div>
  <div class="row"><span class="label">Área por unidade</span><span class="value">${o.area} m²</span></div>
  <div class="row"><span class="label">Área total</span><span class="value">${o.unidades * o.area} m²</span></div>
  <div class="row"><span class="label">Valor por m²</span><span class="value">R$ ${(o.valor / (o.unidades * o.area)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
  <div class="row"><span class="label">Valor por unidade</span><span class="value">R$ ${(o.valor / o.unidades).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
  <div class="total-box">
    <div class="label">VALOR TOTAL DA PROPOSTA</div>
    <div class="value">R$ ${o.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
  </div>
  <div class="footer">
    <p>Stick Frame Sistemas Construtivos · stickframe.com.br</p>
    <p>Este orçamento é válido por 30 dias a partir da data de emissão.</p>
  </div>
  </body></html>`;
  printHtml(html, `orcamento-${o?.ref || "proposta"}`);
}

//  Contrato PDF 
function gerarContratoHTML(o) {
  const area      = Number(o.area) || 0;
  const unidades  = Number(o.unidades) || 1;
  const areaTotal = area * unidades;
  const total     = Number(o.valor) || 0;
  const sinal     = Number(o.sinal) || Math.round(total * 0.10);
  const saldo     = total - sinal;
  const hoje      = new Date().toLocaleDateString("pt-BR");
  const hojeExt   = new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  const numRef    = o.ref || `${new Date().getFullYear()}/${String(o.id || Date.now()).slice(-4).padStart(4, "0")}`;

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Contrato Nº ${numRef} — StickFrame</title>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --brick:#981915;--brick-dk:#7d1411;--brick-soft:#f3e7e5;
    --graphite:#232225;--graphite-2:#1a191c;
    --ink:#26231f;--ink-2:#57514a;--muted:#8c847a;
    --line:#e7e1d8;--line-2:#efeae2;--surface:#fff;--surface-2:#faf8f4;
    --cat:#4f7d57;
    --sans:'Hanken Grotesk',system-ui,sans-serif;
    --cond:'Barlow Condensed',var(--sans);--mono:'JetBrains Mono',ui-monospace,monospace;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:var(--sans);color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact;line-height:1.6}
  .pad{padding:18mm 16mm 14mm}
  .dochead{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding-bottom:16px;border-bottom:2px solid var(--graphite)}
  .dh-l .wm{font-family:var(--cond);font-weight:700;font-size:25px;letter-spacing:1.2px;line-height:1;color:var(--ink)}
  .dh-l .wm span{color:var(--brick)}
  .dh-l .sb{font-size:9px;letter-spacing:1.6px;text-transform:uppercase;color:var(--muted);margin-top:4px}
  .dh-r{text-align:right}
  .dh-r .ver{display:inline-flex;background:var(--graphite-2);color:#fff;font-family:var(--cond);font-weight:700;font-size:13px;letter-spacing:.5px;padding:4px 12px;border-radius:7px}
  .dh-r .gen{font-size:10.5px;color:var(--muted);margin-top:7px;line-height:1.4}
  .dh-r .gen b{color:var(--ink-2);font-weight:700}
  .doctitle{margin-top:20px;border-bottom:1px solid var(--line);padding-bottom:18px}
  .doctitle .ey{font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:var(--brick)}
  .doctitle h1{font-family:var(--cond);font-weight:700;font-size:34px;letter-spacing:.5px;line-height:.96;margin-top:6px}
  .doctitle .h-sub{font-size:12px;color:var(--ink-2);margin-top:5px}
  .clausula{margin-top:26px}
  .cl-head{display:flex;align-items:center;gap:12px;margin-bottom:12px}
  .cl-num{width:28px;height:28px;border-radius:8px;background:var(--graphite-2);color:#fff;font-family:var(--cond);font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .cl-title{font-family:var(--cond);font-weight:700;font-size:17px;letter-spacing:.5px;text-transform:uppercase;color:var(--ink)}
  .cl-body{font-size:12px;color:var(--ink-2);line-height:1.7;margin-left:40px}
  .partes-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-left:40px}
  .parte-box{border:1px solid var(--line);border-radius:10px;overflow:hidden}
  .parte-box .cap{font-size:9px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--muted);background:var(--surface-2);padding:8px 14px;border-bottom:1px solid var(--line)}
  .parte-box .body{padding:12px 14px;font-size:12px;color:var(--ink);font-weight:600;line-height:1.6}
  .parte-box .body .sub{font-size:11px;color:var(--ink-2);font-weight:500}
  .totalbox{background:var(--graphite-2);border-radius:12px;padding:18px;color:#fff;margin-left:40px;margin-top:14px;position:relative;overflow:hidden}
  .totalbox::after{content:"";position:absolute;right:-30px;top:-30px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(152,25,21,.5),transparent 70%)}
  .totalbox .tl{font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.5);position:relative}
  .totalbox .tv{font-family:var(--cond);font-weight:700;font-size:36px;line-height:.9;margin-top:6px;position:relative}
  .tbl-wrap{border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-left:40px;margin-top:14px}
  table{width:100%;border-collapse:collapse;font-size:11.5px}
  thead th{text-align:left;font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--muted);padding:10px 14px;background:var(--surface-2);border-bottom:1px solid var(--line)}
  thead th.r{text-align:right}
  tbody td{padding:11px 14px;border-bottom:1px solid var(--line-2);vertical-align:top;font-size:12px}
  tbody tr:last-child td{border-bottom:none;background:var(--brick-soft)}
  tbody tr:last-child td b{color:var(--brick-dk)}
  td.r{text-align:right;font-family:var(--cond);font-weight:700;font-size:14px}
  .fecho{margin-top:36px;text-align:center;font-size:12px;color:var(--ink-2);border-top:1px solid var(--line);padding-top:18px}
  .sign{display:grid;grid-template-columns:1fr 1fr;gap:44px;margin-top:40px}
  .sign .line{border-top:1.5px solid var(--graphite);padding-top:9px;font-size:11px;color:var(--muted);line-height:1.5}
  .sign .line b{display:block;color:var(--ink);font-size:12.5px;font-weight:700}
  .sign .line .cnpj{font-family:var(--mono);font-size:9.5px;color:var(--muted);margin-top:2px}
  .docfoot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 16mm;border-top:1px solid var(--line);font-size:9.5px;color:var(--muted);margin-top:30px}
  .docfoot b{color:var(--ink-2);font-weight:700}
  @page{size:A4;margin:0}
</style></head><body>
  <div class="pad">
    <div class="dochead">
      <div class="dh-l">
        <div class="wm">STICK<span>FRAME</span></div>
        <div class="sb">Sistemas Construtivos · Steel Frame</div>
      </div>
      <div class="dh-r">
        <span class="ver">CONTRATO Nº ${numRef}</span>
        <div class="gen">Data de emissão<br><b>${hoje}</b></div>
      </div>
    </div>

    <div class="doctitle">
      <div class="ey">Contrato de Prestação de Serviços</div>
      <h1>Sistema Construtivo<br>em Steel Frame</h1>
      <div class="h-sub">Fornecimento e montagem completo · Padrão StickFrame</div>
    </div>

    <div class="clausula">
      <div class="cl-head"><div class="cl-num">1</div><div class="cl-title">Partes</div></div>
      <div class="partes-grid">
        <div class="parte-box">
          <div class="cap">Contratada</div>
          <div class="body">Stick Frame Sistemas Construtivos Ltda.<div class="sub">CNPJ 49.458.905/0001-07<br>Rua Trento, 52 — Santo André / SP</div></div>
        </div>
        <div class="parte-box">
          <div class="cap">Contratante</div>
          <div class="body">${o.cliente}</div>
        </div>
      </div>
    </div>

    <div class="clausula">
      <div class="cl-head"><div class="cl-num">2</div><div class="cl-title">Objeto</div></div>
      <div class="cl-body">Fornecimento e montagem de sistema estrutural em Steel Frame para <b>${unidades}</b> unidade(s) habitacional(is) com área total de <b>${areaTotal} m²</b>, padrão <b>${o.padrao || "StickFrame"}</b>, contemplando estrutura, fechamentos, cobertura e instalações, conforme projeto executivo aprovado.</div>
    </div>

    <div class="clausula">
      <div class="cl-head"><div class="cl-num">3</div><div class="cl-title">Valor e Condições de Pagamento</div></div>
      <div class="totalbox">
        <div class="tl">Valor total do contrato</div>
        <div class="tv">${fmt(total)}</div>
      </div>
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>Parcela</th><th class="r">Valor</th><th>Condição</th></tr></thead>
          <tbody>
            <tr><td>Sinal / Mobilização</td><td class="r">${fmt(sinal)}</td><td>Pagamento antes do início — compra de materiais e mobilização</td></tr>
            <tr><td>Saldo</td><td class="r">${fmt(saldo)}</td><td>Conforme medições das etapas de evolução de obra</td></tr>
            <tr><td><b>Total do contrato</b></td><td class="r"><b>${fmt(total)}</b></td><td><b>Sinal de ${fmt(sinal)} + saldo conforme medições</b></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="clausula">
      <div class="cl-head"><div class="cl-num">4</div><div class="cl-title">Prazo</div></div>
      <div class="cl-body">O prazo estimado de execução será definido no cronograma físico-financeiro a ser aprovado pelas partes. A Stick Frame não se responsabiliza por atrasos decorrentes de fatores externos tais como condições climáticas adversas, atraso de fornecedores e pendências de aprovação de projeto junto a órgãos públicos.</div>
    </div>

    <div class="clausula">
      <div class="cl-head"><div class="cl-num">5</div><div class="cl-title">Garantia</div></div>
      <div class="cl-body">A estrutura em Steel Frame possui garantia de <b>5 (cinco) anos</b> contra defeitos de fabricação e montagem, conforme <b>ABNT NBR 15575</b>. A garantia não cobre danos causados por mau uso, modificações não autorizadas ou eventos de força maior.</div>
    </div>

    <div class="clausula">
      <div class="cl-head"><div class="cl-num">6</div><div class="cl-title">Disposições Gerais</div></div>
      <div class="cl-body">Fica eleito o foro da Comarca de <b>Santo André / SP</b> para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</div>
    </div>

    <div class="fecho">Santo André / SP, ${hojeExt}</div>

    <div class="sign">
      <div class="line"><b>Stick Frame Sistemas Construtivos Ltda.</b>Contratada · Santo André / SP<div class="cnpj">CNPJ 49.458.905/0001-07</div></div>
      <div class="line"><b>${o.cliente}</b>Contratante</div>
    </div>
  </div>

  <div class="docfoot">
    <span><b>Stick Frame Sistemas Construtivos Ltda.</b> · Rua Trento, 52 — Santo André / SP</span>
    <span>(11) 98985-9995 · contato@stickframe.com.br</span>
    <span>Contrato <b>${numRef}</b></span>
  </div>
</body></html>`;

  printHtml(html, `contrato-${o.ref || numRef}`);
}

//  Proposta Comercial PDF profissional
function gerarPropostaComercialPDF(o, opts = {}) {
  const area      = Number(o.area) || 0;
  const unidades  = Number(o.unidades) || 1;
  const areaTotal = area * unidades;
  const m2        = (PRECOS[o.padrao] || PRECOS["Padrão"]).m2;
  const total     = Number(o.valor) || m2 * areaTotal;

  const sinal = Number(o.sinal) || Math.round(total * 0.10);
  const saldo = total - sinal;

  const numProposta = `${new Date().getFullYear()}/${String(o.id || Date.now()).slice(-4).padStart(4, "0")}`;
  const dataHoje    = new Date().toLocaleDateString("pt-BR");
  const validade    = o.validade_dias || 30;
  const origin      = typeof window !== "undefined" ? window.location.origin : "stickframe.com.br";
  const linkAceite  = o.proposta_token ? `${origin}/proposta/${o.proposta_token}` : null;
  const projeto     = o.projeto || `Residência em Sistema Steel Frame — ${areaTotal} m²`;
  const contato     = opts.contato || o.contato || null;

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Proposta Comercial Nº ${numProposta} — StickFrame</title>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --brick:#981915;--brick-dk:#7d1411;--brick-soft:#f3e7e5;
    --graphite:#232225;--graphite-2:#1a191c;
    --ink:#26231f;--ink-2:#57514a;--muted:#8c847a;
    --line:#e7e1d8;--line-2:#efeae2;--surface:#fff;--surface-2:#faf8f4;
    --cat:#4f7d57;--steel:#3b6ea5;--steel-soft:#e7eef5;
    --sans:'Hanken Grotesk',system-ui,sans-serif;
    --cond:'Barlow Condensed',var(--sans);--mono:'JetBrains Mono',ui-monospace,monospace;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:var(--sans);color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact;line-height:1.5}
  .num{font-family:var(--cond);font-variant-numeric:tabular-nums}
  .pad{padding:18mm 16mm 14mm}
  .dochead{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding-bottom:16px;border-bottom:2px solid var(--graphite)}
  .dh-l .wm{font-family:var(--cond);font-weight:700;font-size:25px;letter-spacing:1.2px;line-height:1;color:var(--ink)}
  .dh-l .wm span{color:var(--brick)}
  .dh-l .sb{font-size:9px;letter-spacing:1.6px;text-transform:uppercase;color:var(--muted);margin-top:4px}
  .dh-r{text-align:right}
  .dh-r .ver{display:inline-flex;background:var(--brick);color:#fff;font-family:var(--cond);font-weight:700;font-size:15px;letter-spacing:.5px;padding:4px 12px;border-radius:7px}
  .dh-r .gen{font-size:10.5px;color:var(--muted);margin-top:7px;line-height:1.4}
  .dh-r .gen b{color:var(--ink-2);font-weight:700}
  .doctitle{margin-top:20px}
  .doctitle .ey{font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:var(--brick)}
  .doctitle h1{font-family:var(--cond);font-weight:700;font-size:38px;letter-spacing:.5px;line-height:.96;margin-top:6px}
  .doctitle .h-sub{font-size:12.5px;color:var(--ink-2);margin-top:5px}
  .idgrid{display:grid;grid-template-columns:1fr 248px;gap:16px;margin-top:22px}
  .idbox{border:1px solid var(--line);border-radius:12px;overflow:hidden}
  .idbox .cap{font-size:9.5px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--muted);background:var(--surface-2);padding:9px 15px;border-bottom:1px solid var(--line)}
  .idrow{display:grid;grid-template-columns:108px 1fr;gap:10px;padding:9px 15px;font-size:12px;border-bottom:1px solid var(--line-2)}
  .idrow:last-child{border-bottom:none}
  .idrow .k{color:var(--muted);font-weight:700}.idrow .v{color:var(--ink);font-weight:600;word-break:break-word}
  .totalbox{background:var(--graphite-2);border-radius:12px;padding:18px;color:#fff;display:flex;flex-direction:column;position:relative;overflow:hidden}
  .totalbox::after{content:"";position:absolute;right:-30px;top:-30px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(152,25,21,.5),transparent 70%)}
  .totalbox .tl{font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.5);position:relative}
  .totalbox .tv{font-family:var(--cond);font-weight:700;font-size:42px;line-height:.9;margin-top:6px;position:relative}
  .totalbox .tu{font-size:12px;color:rgba(255,255,255,.55);margin-top:8px;position:relative}
  .totalbox .area{display:flex;gap:16px;margin-top:14px;padding-top:13px;border-top:1px solid rgba(255,255,255,.12);position:relative}
  .totalbox .area .a b{font-family:var(--cond);font-weight:700;font-size:20px;color:#fff;display:block;line-height:1}
  .totalbox .area .a span{font-size:10px;color:rgba(255,255,255,.5)}
  .sec-h{font-family:var(--cond);font-weight:700;font-size:13px;letter-spacing:2.5px;text-transform:uppercase;color:var(--ink);display:flex;align-items:center;gap:10px;margin:26px 0 14px}
  .sec-h::after{content:"";flex:1;height:1px;background:var(--line)}
  .tbl-wrap{border:1px solid var(--line);border-radius:10px;overflow:hidden}
  table{width:100%;border-collapse:collapse;font-size:11.5px}
  thead th{text-align:left;font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--muted);padding:10px 14px;background:var(--surface-2);border-bottom:1px solid var(--line)}
  thead th.r{text-align:right}
  tbody td{padding:12px 14px;border-bottom:1px solid var(--line-2);vertical-align:top}
  tbody tr:last-child td{border-bottom:none}
  td.r{text-align:right}
  .insumo{font-weight:700;color:var(--ink);font-size:13px;line-height:1.3}
  .insumo .scope{display:block;font-weight:500;color:var(--ink-2);font-size:11px;margin-top:3px}
  .qtd{font-family:var(--cond);font-weight:700;font-size:15px;color:var(--ink);white-space:nowrap}
  .unit{color:var(--ink-2);white-space:nowrap;font-variant-numeric:tabular-nums}
  .tot{font-family:var(--cond);font-weight:700;font-size:16px;color:var(--ink);white-space:nowrap}
  .org{display:inline-flex;align-items:center;gap:5px;font-size:9.5px;font-weight:800;letter-spacing:.4px;padding:2px 8px;border-radius:20px;margin-top:6px;background:var(--steel-soft);color:var(--steel)}
  .org .d{width:7px;height:7px;border-radius:50%;background:var(--steel)}
  .pay .parc{font-weight:700;color:var(--ink);font-size:13px}
  .pay .when{display:block;color:var(--ink-2);font-size:11px;font-weight:500;margin-top:3px;line-height:1.4}
  .pay tr.tot-row td{background:var(--brick-soft);border-bottom:none}
  .pay tr.tot-row .pl{font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--brick)}
  .pay tr.tot-row .note{display:block;color:var(--brick-dk);font-weight:500;font-size:10.5px;margin-top:3px}
  .pay tr.tot-row .pv{font-family:var(--cond);font-weight:700;font-size:18px;color:var(--brick)}
  .twocol{display:grid;grid-template-columns:1.05fr .95fr;gap:18px;margin-top:14px}
  .panel{border:1px solid var(--line);border-radius:12px;overflow:hidden}
  .panel .cap{font-size:9.5px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--muted);background:var(--surface-2);padding:10px 16px;border-bottom:1px solid var(--line)}
  .panel .body{padding:14px 16px}
  .inc{list-style:none;display:flex;flex-direction:column;gap:11px}
  .inc li{font-size:12px;display:flex;gap:10px;align-items:flex-start;color:var(--ink);font-weight:600}
  .inc li svg{width:16px;height:16px;flex-shrink:0;margin-top:1px;fill:none;stroke:var(--cat);stroke-width:2.2}
  .obs{list-style:none;display:flex;flex-direction:column;gap:10px}
  .obs li{font-size:11.5px;display:flex;gap:9px;align-items:flex-start;color:var(--ink-2);line-height:1.45}
  .obs li .b{width:5px;height:5px;border-radius:50%;background:var(--brick);flex-shrink:0;margin-top:6px}
  .obs li b{color:var(--ink);font-weight:700}
  .accept-online{display:flex;gap:12px;align-items:center;margin-top:22px;background:var(--brick-soft);border:1px solid #e6cdca;border-radius:11px;padding:13px 16px;font-size:12px;color:var(--ink-2);line-height:1.45}
  .accept-online b{color:var(--brick-dk);font-weight:700}
  .accept-online .ic{width:34px;height:34px;border-radius:9px;background:var(--brick);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px}
  .sign{display:grid;grid-template-columns:1fr 1fr;gap:44px;margin-top:40px}
  .sign .line{border-top:1.5px solid var(--graphite);padding-top:9px;font-size:11px;color:var(--muted);line-height:1.5}
  .sign .line b{display:block;color:var(--ink);font-size:12.5px;font-weight:700}
  .sign .line .cnpj{font-family:var(--mono);font-size:9.5px;color:var(--muted);margin-top:2px}
  .docfoot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 16mm;border-top:1px solid var(--line);font-size:9.5px;color:var(--muted);margin-top:30px}
  .docfoot b{color:var(--ink-2);font-weight:700}
  @page{size:A4;margin:0}
</style></head><body>
  <div class="pad">
    <div class="dochead">
      <div class="dh-l">
        <div class="wm">STICK<span>FRAME</span></div>
        <div class="sb">Sistemas Construtivos · Steel Frame</div>
      </div>
      <div class="dh-r">
        <span class="ver">Nº ${numProposta}</span>
        <div class="gen">Data de emissão<br><b>${o.criado || dataHoje}</b></div>
      </div>
    </div>

    <div class="doctitle">
      <div class="ey">Proposta Comercial</div>
      <h1>Residência em<br>Sistema Steel Frame</h1>
      <div class="h-sub">Fornecimento e montagem de sistema construtivo completo · Padrão StickFrame</div>
    </div>

    <div class="idgrid">
      <div class="idbox">
        <div class="cap">Identificação do projeto</div>
        <div class="idrow"><span class="k">Cliente</span><span class="v">${o.cliente}</span></div>
        ${contato ? `<div class="idrow"><span class="k">Contato</span><span class="v">${contato}</span></div>` : ""}
        <div class="idrow"><span class="k">Projeto</span><span class="v">${projeto}</span></div>
        <div class="idrow"><span class="k">Padrão</span><span class="v">Steel Frame — ${o.padrao}</span></div>
        <div class="idrow"><span class="k">Data do orçamento</span><span class="v">${o.criado || dataHoje}</span></div>
        <div class="idrow"><span class="k">Validade</span><span class="v">${validade} dias a partir da emissão</span></div>
      </div>
      <div class="totalbox">
        <div class="tl">Valor total do contrato</div>
        <div class="tv">${fmt(total)}</div>
        <div class="tu">Sistema Steel Frame completo</div>
        <div class="area">
          <div class="a"><b class="num">${areaTotal} m²</b><span>Área total</span></div>
          <div class="a"><b class="num">${fmt(m2)}</b><span>Valor / m²</span></div>
        </div>
      </div>
    </div>

    <div class="sec-h">Composição do valor</div>
    <div class="tbl-wrap">
      <table>
        <thead><tr><th>Descrição</th><th class="r">Qtd</th><th class="r">Unid.</th><th class="r">R$ / m²</th><th class="r">Total</th></tr></thead>
        <tbody>
          <tr>
            <td><div class="insumo">Sistema Steel Frame completo<span class="scope">Estrutura + fechamentos + cobertura + instalações</span></div><span class="org"><span class="d"></span>SISTEMA</span></td>
            <td class="r"><span class="qtd">${areaTotal}</span></td>
            <td class="r unit">m²</td>
            <td class="r unit">${fmt(m2)}</td>
            <td class="r"><span class="tot">${fmt(total)}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="sec-h">Condições de pagamento</div>
    <div class="tbl-wrap">
      <table class="pay">
        <thead><tr><th>Parcela</th><th class="r">Valor</th><th>Condição</th></tr></thead>
        <tbody>
          <tr><td><span class="parc">Sinal / Mobilização</span></td><td class="r"><span class="qtd">${fmt(sinal)}</span></td><td><span class="when">Pagamento antes do início da obra, destinado à compra de materiais e mobilização da equipe</span></td></tr>
          <tr><td><span class="parc">Saldo</span></td><td class="r"><span class="qtd">${fmt(saldo)}</span></td><td><span class="when">Conforme medições das etapas de evolução de obra</span></td></tr>
          <tr class="tot-row"><td><span class="pl">Total do contrato</span></td><td class="r"><span class="pv">${fmt(total)}</span></td><td><span class="note">Sinal de ${fmt(sinal)} + saldo conforme medições</span></td></tr>
        </tbody>
      </table>
    </div>

    <div class="twocol">
      <div class="panel">
        <div class="cap">O que está incluído</div>
        <div class="body">
          <ul class="inc">
            <li><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Estrutura em perfis de aço galvanizado (Steel Frame)</li>
            <li><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Fechamentos e vedações conforme padrão contratado</li>
            <li><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Cobertura completa do sistema</li>
            <li><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Instalações da edificação</li>
          </ul>
        </div>
      </div>
      <div class="panel">
        <div class="cap">Observações gerais</div>
        <div class="body">
          <ul class="obs">
            <li><span class="b"></span><span>Proposta válida por <b>${validade} dias</b> a partir de ${o.criado || dataHoje}.</span></li>
            <li><span class="b"></span><span>Valores sujeitos a confirmação mediante <b>vistoria do terreno</b>.</span></li>
            <li><span class="b"></span><span>Não inclui <b>móveis planejados</b> e <b>paisagismo</b>.</span></li>
          </ul>
        </div>
      </div>
    </div>

    ${linkAceite ? `<div class="accept-online"><div class="ic">✓</div><div>Prefere aceitar online? Acesse <b>${linkAceite}</b> — ao aceitar, o status atualiza automaticamente e nossa equipe é avisada na hora.</div></div>` : ""}

    <div class="sign">
      <div class="line"><b>${o.cliente}</b>Contratante</div>
      <div class="line"><b>Stick Frame Sistemas Construtivos Ltda.</b>Contratada · Santo André / SP<div class="cnpj">CNPJ 49.458.905/0001-07</div></div>
    </div>
  </div>

  <div class="docfoot">
    <span><b>Stick Frame Sistemas Construtivos Ltda.</b> · Rua Trento, 52 — Santo André / SP</span>
    <span>(11) 98985-9995 · contato@stickframe.com.br</span>
    <span>Nº <b>${numProposta}</b></span>
  </div>
</body></html>`;

  printHtml(html, `proposta-${o.ref || numProposta}`);
}

//  Índices técnicos StickFrame (baseados em obras reais) 
//  Opções selecionáveis da calculadora 
const FECHAMENTO_EXT_OPTS = [
  { value: "glasroc",    label: "Glasroc X 12,5mm",    precoUnit: 86.80 },
  { value: "cimenticia", label: "Placa cimentícia",     precoUnit: 65.00 },
  { value: "osb",        label: "OSB 11mm",             precoUnit: 52.00 },
];
const VEDACAO_INT_OPTS = [
  { value: "st",       label: "Placa Gesso ST 12,5mm",       precoUnit: 17.13 },
  { value: "performa", label: "Placa Gesso Performa 12,5mm", precoUnit: 28.00 },
];

let _pid = 0;
const newParede = () => ({ id: ++_pid, desc: "", comp: "" });

function ListaParedes({ label, paredes, setParedes }) {
  function add() { setParedes((p) => [...p, newParede()]); }
  function remove(id) { setParedes((p) => p.filter((x) => x.id !== id)); }
  function upd(id, field, val) { setParedes((p) => p.map((x) => x.id === id ? { ...x, [field]: val } : x)); }
  const total = paredes.reduce((s, p) => s + (parseFloat(p.comp) || 0), 0);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <Label>{label}</Label>
        <span style={{ fontSize: 11, color: C.muted }}>Total: <strong>{total.toFixed(2)} m</strong></span>
      </div>
      {paredes.map((p) => (
        <div key={p.id} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
          <input value={p.desc} onChange={(e) => upd(p.id, "desc", e.target.value)} placeholder="Descrição (ex: Fachada Norte)"
            style={{ flex: 2, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 10px", fontSize: 12, color: C.text, fontFamily: "inherit", outline: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
            <input type="number" min="0" step="0.01" value={p.comp} onChange={(e) => upd(p.id, "comp", e.target.value)} placeholder="Comp. (m)"
              style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 10px", fontSize: 12, color: C.text, fontFamily: "inherit", outline: "none" }} />
            <span style={{ fontSize: 11, color: C.muted }}>m</span>
          </div>
          <button onClick={() => remove(p.id)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
        </div>
      ))}
      <button onClick={add} style={{ background: "none", border: `1px dashed ${C.border}`, borderRadius: 6, padding: "6px 14px", fontSize: 12, color: C.muted, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
        + Adicionar parede
      </button>
    </div>
  );
}

function CalculadoraEstimativa({ onAplicar, onClose }) {
  const [peDireito,    setPeDireito]    = useState(2.60);
  const [paredesExt,   setParedesExt]   = useState([newParede()]);
  const [paredesInt,   setParedesInt]   = useState([newParede()]);
  const [areaPiso,     setAreaPiso]     = useState("");
  const [areaMolhada,  setAreaMolhada]  = useState(8);
  const [cobertura,    setCobertura]    = useState(false);
  const [fechExt,      setFechExt]      = useState("glasroc");
  const [vedInt,       setVedInt]       = useState("st");
  const [itens,        setItens]        = useState(null);

  const mlExt      = paredesExt.reduce((s, p) => s + (parseFloat(p.comp) || 0), 0);
  const mlInt      = paredesInt.reduce((s, p) => s + (parseFloat(p.comp) || 0), 0);
  const aParExt    = mlExt * peDireito;
  const aParInt    = mlInt * peDireito;
  const aParTotal  = aParExt + aParInt;
  const aMolhWall  = areaMolhada * (peDireito / 2.6) * 4; // estimativa perímetro área molhada
  const pisoVal    = parseFloat(areaPiso) || (mlExt > 0 ? (mlExt / 4) ** 2 : 0);

  const fmtV = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const arred = (v) => Math.ceil(v * 100) / 100;

  function calcular() {
    if (mlExt === 0) return;
    const fechOpt = FECHAMENTO_EXT_OPTS.find((o) => o.value === fechExt);
    const vedOpt  = VEDACAO_INT_OPTS.find((o) => o.value === vedInt);
    const WASTE   = 1.10; // 10% perda

    const resultado = [
      //  Estrutura 
      { grupo: "Estrutura", item: "Aço LSF LE230 / Z275 (lista de corte)", un: "kg",
        qtd: arred(aParTotal * 12), precoUnit: 15.00 },
      { grupo: "Estrutura", item: "Acessórios estrutura (parafusos, conectores)", un: "vb",
        qtd: arred(aParTotal * 12 * 0.15), precoUnit: 15.00 },

      //  Vedação externa 
      { grupo: "Vedação externa", item: `${fechOpt.label} (fechamento externo)`, un: "m²",
        qtd: arred(aParExt * WASTE), precoUnit: fechOpt.precoUnit },
      { grupo: "Vedação externa", item: "Membrana hidrófuga (WRB)", un: "m²",
        qtd: arred(aParExt * WASTE), precoUnit: 16.17 },
      { grupo: "Vedação externa", item: "Tela de fibra de vidro — rolo 1m (juntas)", un: "m²",
        qtd: arred(aParExt * 0.15), precoUnit: 14.00 },
      { grupo: "Vedação externa", item: "Tela de fibra de vidro — rolo 20cm (cantos)", un: "m",
        qtd: arred((mlExt * peDireito) / 3), precoUnit: 5.50 },
      { grupo: "Vedação externa", item: "Massa Base Coat 20kg", un: "sc",
        qtd: arred(aParExt / 30), precoUnit: 88.00 },

      //  Isolamento 
      { grupo: "Isolamento", item: "Lã de vidro 50mm", un: "m²",
        qtd: arred(aParTotal * WASTE), precoUnit: 16.00 },

      //  Vedação interna 
      { grupo: "Vedação interna", item: `${vedOpt.label} — paredes secas (2 faces)`, un: "m²",
        qtd: arred(aParInt * 2 * WASTE), precoUnit: vedOpt.precoUnit },
      { grupo: "Vedação interna", item: "Placa Gesso RU 12,5mm — áreas molhadas (2 faces)", un: "m²",
        qtd: arred(aMolhWall * 2 * WASTE), precoUnit: 25.46 },
      { grupo: "Vedação interna", item: "Massa junta drywall 25kg", un: "bd",
        qtd: arred((aParInt * 2 + aMolhWall * 2) / 60), precoUnit: 80.00 },
      { grupo: "Vedação interna", item: "Fita papel perfurada (junta)", un: "pc",
        qtd: arred((aParInt * 2 + aMolhWall * 2) / 150), precoUnit: 60.00 },

      //  Forro 
      { grupo: "Forro", item: "Placa Gesso Leve 12,5mm (forro)", un: "m²",
        qtd: arred(pisoVal * WASTE), precoUnit: 22.00 },
      { grupo: "Forro", item: "Perfil forro F530 3000mm", un: "pc",
        qtd: Math.ceil(pisoVal / 1.8 / 3), precoUnit: 15.00 },
      { grupo: "Forro", item: "Pendural REG F530", un: "pc",
        qtd: Math.ceil(pisoVal / 1.44), precoUnit: 1.60 },

      //  Cobertura (opcional) 
      ...(cobertura ? [
        { grupo: "Cobertura", item: "Telha metálica sanduíche", un: "m²",
          qtd: arred(pisoVal * 1.15), precoUnit: 119.11 },
      ] : []),
    ].map((i) => ({ ...i, total: i.qtd * i.precoUnit }));

    setItens(resultado);
  }

  const totalGeral = itens ? itens.reduce((s, i) => s + i.total, 0) : 0;
  const grupos     = itens ? [...new Set(itens.map((i) => i.grupo))] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/*  Medidas do projeto  */}
      <div style={{ background: C.darker, borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.red }}>MEDIDAS DO PROJETO</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <Label required>Pé direito (m)</Label>
            <input type="number" min="2" step="0.05" value={peDireito}
              onChange={(e) => { setPeDireito(parseFloat(e.target.value) || 2.6); setItens(null); }}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none" }} />
          </div>
          <div>
            <Label>Área de piso (m²)</Label>
            <input type="number" min="0" step="0.5" value={areaPiso} placeholder="Calculado auto"
              onChange={(e) => { setAreaPiso(e.target.value); setItens(null); }}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none" }} />
          </div>
          <div>
            <Label>Área molhada (m²)</Label>
            <input type="number" min="0" step="0.5" value={areaMolhada}
              onChange={(e) => { setAreaMolhada(parseFloat(e.target.value) || 0); setItens(null); }}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none" }} />
          </div>
        </div>

        <ListaParedes label="Paredes externas — comprimento de cada parede (m)" paredes={paredesExt} setParedes={(v) => { setParedesExt(v); setItens(null); }} />
        <ListaParedes label="Paredes internas — comprimento de cada divisória (m)" paredes={paredesInt} setParedes={(v) => { setParedesInt(v); setItens(null); }} />

        {/* Resumo das áreas calculadas */}
        {mlExt > 0 && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              ["Área parede ext", `${aParExt.toFixed(1)} m²`],
              ["Área parede int", `${aParInt.toFixed(1)} m²`],
              ["ML total", `${(mlExt + mlInt).toFixed(1)} m`],
              ["Área piso", `${pisoVal.toFixed(1)} m²`],
            ].map(([k, v]) => (
              <div key={k} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", flex: 1, minWidth: 110 }}>
                <div style={{ fontSize: 10, color: C.muted }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{v}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/*  Opções de materiais  */}
      <div style={{ background: C.darker, borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.red }}>OPÇÕES DE MATERIAIS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <Label>Fechamento externo</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {FECHAMENTO_EXT_OPTS.map((o) => (
                <label key={o.value} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input type="radio" name="fechExt" checked={fechExt === o.value}
                    onChange={() => { setFechExt(o.value); setItens(null); }} />
                  {o.label}
                  <span style={{ fontSize: 11, color: C.muted }}>{fmtV(o.precoUnit)}/m²</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Vedação interna — paredes secas</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {VEDACAO_INT_OPTS.map((o) => (
                <label key={o.value} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input type="radio" name="vedInt" checked={vedInt === o.value}
                    onChange={() => { setVedInt(o.value); setItens(null); }} />
                  {o.label}
                  <span style={{ fontSize: 11, color: C.muted }}>{fmtV(o.precoUnit)}/m²</span>
                </label>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={cobertura} onChange={(e) => { setCobertura(e.target.checked); setItens(null); }} />
                Incluir cobertura (telha metálica sanduíche)
              </label>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: C.muted, padding: "6px 10px", background: C.surface, borderRadius: 6 }}>
           Membrana hidrófuga · Massa Base Coat · Telas fibra vidro · Lã de vidro · Gesso RU (área molhada) · Gesso Leve (forro) — sempre incluídos
        </div>
      </div>

      <button onClick={calcular} disabled={mlExt === 0} style={{
        background: mlExt === 0 ? C.border : C.red, color: mlExt === 0 ? C.muted : "#fff",
        border: "none", borderRadius: 8, padding: "12px 0", fontSize: 14, fontWeight: 700,
        cursor: mlExt === 0 ? "not-allowed" : "pointer", fontFamily: "inherit",
      }}>
        {mlExt === 0 ? "Informe ao menos uma parede externa para calcular" : " Calcular estimativo"}
      </button>

      {/*  Resultado  */}
      {itens && (
        <>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: C.darker }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, fontSize: 11 }}>Item</th>
                  <th style={{ padding: "8px 8px", textAlign: "center", fontWeight: 700, fontSize: 11 }}>UN</th>
                  <th style={{ padding: "8px 8px", textAlign: "right", fontWeight: 700, fontSize: 11 }}>Qtd</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, fontSize: 11 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((grupo) => (
                  <>
                    <tr key={`g-${grupo}`} style={{ background: C.red + "11" }}>
                      <td colSpan={4} style={{ padding: "6px 12px", fontSize: 10, fontWeight: 800, color: C.red, letterSpacing: 1, textTransform: "uppercase" }}>{grupo}</td>
                    </tr>
                    {itens.filter((i) => i.grupo === grupo).map((i, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "7px 12px", color: C.text }}>{i.item}</td>
                        <td style={{ padding: "7px 8px", textAlign: "center", color: C.muted }}>{i.un}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right" }}>{i.qtd % 1 === 0 ? i.qtd : i.qtd.toFixed(2)}</td>
                        <td style={{ padding: "7px 12px", textAlign: "right", fontWeight: 600 }}>{fmtV(i.total)}</td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.darker, borderRadius: 10, padding: "14px 16px" }}>
            <div>
              <div style={{ fontSize: 11, color: C.muted }}>Estimativo de materiais · {pisoVal.toFixed(0)} m² piso · {(mlExt+mlInt).toFixed(0)} m paredes</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.red }}>{fmtV(totalGeral)}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{pisoVal > 0 ? `${fmtV(totalGeral / pisoVal)}/m²` : ""}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onClose} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: C.muted }}>
                Cancelar
              </button>
              <button onClick={() => onAplicar(itens, totalGeral, pisoVal, "residencial")} style={{ background: C.red, color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Aplicar ao orçamento →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
const FORM_VAZIO = {
  cliente_id: "",
  unidades:   1,
  area:       48,
  padrao:     "Padrão",
  status:     "Aguardando resposta",
  desconto:   0,
  valor_m2_custom: 3500,
  opcionais:  [],
};

export default function Orcamentos() {
  useModuleLoad("orcamentos");
  useModuleLoad("clientes");
  useModuleLoad("obras");

  const clientes        = useAppStore((s) => s.clientes);
  const orcamentos      = useAppStore((s) => s.orcamentos);
  const addOrcamento    = useAppStore((s) => s.addOrcamento);
  const updateOrcamento = useAppStore((s) => s.updateOrcamento);
  const deleteOrcamento = useAppStore((s) => s.deleteOrcamento);
  const loadOrcamentos  = useAppStore((s) => s.loadOrcamentos);
  const addObra         = useAppStore((s) => s.addObra);
  const deleteObra      = useAppStore((s) => s.deleteObra);
  const addLancamento   = useAppStore((s) => s.addLancamento);
  const setActivePage   = useAppStore((s) => s.setActivePage);
  const addCliente      = useAppStore((s) => s.addCliente);

  const [modal,        setModal]        = useState(false);
  const [editId,       setEditId]       = useState(null);
  const [confirm,      setConfirm]      = useState(null);
  const [abertoDropId, setAbertoDropId] = useState(null);
  const { toast, mostrarToast } = useToast();
  const [form,         setForm]         = useState({ ...FORM_VAZIO });
  const [converterOrc, setConverterOrc] = useState(null);
  const [calculadora,  setCalculadora]  = useState(false);
  const [preOrcamentos, setPreOrcamentos] = useState([]);
  const [preOrcAtivo, setPreOrcAtivo] = useState(null); // ID do lead sendo convertido
  const [estimativo, setEstimativoRaw] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem("sf_estimativo") || "null");
      if (v && Array.isArray(v.itens)) return v;
      return null;
    } catch { return null; }
  });
  const [estimativoAberto, setEstimativoAberto] = useState(false);
  const [memorialOrcamento, setMemorialOrcamento] = useState(null);

  // Carrega pré-orçamentos novos
  useEffect(() => {
    const empId = getEmpresaId();
    if (!empId) return;
    sb.from("pre_orcamentos")
      .select("*")
      .eq("empresa_id", empId)
      .eq("status", "Novo")
      .order("created_at", { ascending: false })
      .then(({ data }) => setPreOrcamentos(data || []));
  }, []);

  // Realtime local (broadcast) e database changes para orçamentos aceitos online
  useEffect(() => {
    const empId = getEmpresaId();
    if (!empId) return;

    const chPg = sb.channel(`orcamentos-changes:${empId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orcamentos", filter: `empresa_id=eq.${empId}` },
        () => {
          loadOrcamentos(true);
        })
      .subscribe();

    const chBc = sb.channel(`orcamentos-public:${empId}`)
      .on("broadcast", { event: "aceite" }, () => {
        loadOrcamentos(true);
        mostrarToast(" Um cliente acabou de aceitar a proposta comercial online!");
      })
      .subscribe();

    return () => {
      chPg.unsubscribe();
      chBc.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Detecta estimativo vindo da Calculadora SF (navega para esta página e escreve em localStorage)
  useEffect(() => {
    const salvo = (() => { try { return JSON.parse(localStorage.getItem("sf_estimativo") || "null"); } catch { return null; } })();
    if (salvo && !estimativo) {
      setEstimativoRaw(salvo);
      if (salvo.area) setForm((f) => ({ ...f, area: salvo.area, padrao: salvo.tipo || f.padrao }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setEstimativo(val) {
    setEstimativoRaw(val);
    if (val) localStorage.setItem("sf_estimativo", JSON.stringify(val));
    else localStorage.removeItem("sf_estimativo");
  }
  const [obraForm,   setObraForm]   = useState({ nome: "", prazo_inicio: "", prazo_fim: "" });
  const [modoComparar, setModoComparar] = useState(false);
  const [selecionados, setSelecionados] = useState([]);



  function abrirNovo() {
    setForm({ ...FORM_VAZIO });
    setModal("novo");
  }

  function aplicarEstimativo(itens, totalGeral, area, tipo) {
    setEstimativo({ itens, totalGeral, area, tipo });
    setCalculadora(false);
    // Pré-preenche o formulário de novo orçamento com a área calculada
    setForm((f) => ({ ...f, area }));
    setModal("novo");
  }

  function abrirEditar(o) {
    setEditId(o.id);
    const isLivre = o.padrao === "Livre";
    const preco = isLivre ? null : (PRECOS[o.padrao] || PRECOS["Padrão"]);
    const valor_base = isLivre ? Number(o.valor) : (preco.m2 * Number(o.area) * Number(o.unidades));
    const desc = isLivre ? 0 : (valor_base > 0 ? Math.round(((valor_base - Number(o.valor)) / valor_base) * 100) : 0);
    setForm({
      cliente_id: o.cliente_id || clientes[0]?.id || "",
      unidades:   o.unidades   || 1,
      area:       o.area       || 48,
      padrao:     o.padrao     || "Padrão",
      status:     o.status     || "Aguardando resposta",
      desconto:   desc >= 0 && desc <= 100 ? desc : 0,
      valor_m2_custom: isLivre ? (Number(o.valor) / (Number(o.area || 1) * Number(o.unidades || 1))) : 0,
    });
    setModal("editar");
  }

  function gerarRef() {
    const ano = new Date().getFullYear();
    const prefix = `ORC-${ano}-`;
    const numMax = orcamentos
      .filter((o) => o.ref && o.ref.startsWith(prefix))
      .map((o) => {
        const partes = o.ref.split("-");
        const numPart = parseInt(partes[partes.length - 1], 10);
        return isNaN(numPart) ? 0 : numPart;
      })
      .reduce((max, val) => Math.max(max, val), 0);
    return `${prefix}${String(numMax + 1).padStart(3, "0")}`;
  }

  function salvarNovo() {
    const clienteSel = clientes.find((c) => c.id === form.cliente_id);
    const calc       = calcOrcamento(form);
    addOrcamento({
      ref:        gerarRef(),
      cliente:    clienteSel?.nome || "—",
      cliente_id: form.cliente_id,
      valor:      calc.valor_total,
      unidades:   Number(form.unidades),
      area:       Number(form.area),
      padrao:     form.padrao,
      status:     form.status,
      criado:     new Date().toLocaleDateString("pt-BR"),
      opcionais:  form.opcionais || [],
    });
    if (preOrcAtivo) {
      sb.from("pre_orcamentos").update({ status: "Analisado" }).eq("id", preOrcAtivo).then(() => {});
      setPreOrcamentos((prev) => prev.filter((x) => x.id !== preOrcAtivo));
      setPreOrcAtivo(null);
    }
    setModal(false);
    mostrarToast(" Orçamento gerado com sucesso!");
  }

  function salvarEdicao() {
    const clienteSel = clientes.find((c) => c.id === form.cliente_id);
    const calc       = calcOrcamento(form);
    updateOrcamento(editId, {
      cliente:    clienteSel?.nome || "—",
      cliente_id: form.cliente_id,         // UUID string — sem Number()!
      unidades:   Number(form.unidades),
      area:       Number(form.area),
      padrao:     form.padrao,
      valor:      calc.valor_total,
      status:     form.status,
      opcionais:  form.opcionais || [],
    });
    setModal(false);
    mostrarToast(" Orçamento atualizado!");
  }

  function confirmarDelete(id) { setConfirm(id); }

  function duplicarOrcamento(o) {
    const clienteSel = clientes.find((c) => c.id === o.cliente_id);
    addOrcamento({
      ref:        gerarRef(),
      cliente:    o.cliente,
      cliente_id: o.cliente_id,
      valor:      o.valor,
      unidades:   o.unidades,
      area:       o.area,
      padrao:     o.padrao,
      status:     "Aguardando resposta",
      criado:     new Date().toLocaleDateString("pt-BR"),
    });
    mostrarToast(" Orçamento duplicado!");
  }

  function abrirConverter(o) {
    const clienteSel = clientes.find((c) => c.id === o.cliente_id);
    const nomeSugerido = `${o.cliente} — ${new Date().getFullYear()}`;
    setObraForm({ nome: nomeSugerido, prazo_inicio: "", prazo_fim: "" });
    setConverterOrc(o);
  }

  // Mapeia grupo da calculadora → fase Steel Frame do quantitativo
  const GRUPO_PARA_FASE = {
    "Estrutura":       "Estrutura Steel Frame",
    "Vedação externa": "Fechamentos",
    "Vedação interna": "Fechamentos",
    "Isolamento":      "Fechamentos",
    "Forro":           "Acabamento",
    "Cobertura":       "Entrega",
  };
  const GRUPO_PARA_CAT = {
    "Estrutura":       "Estrutura",
    "Vedação externa": "Vedação",
    "Vedação interna": "Vedação",
    "Isolamento":      "Vedação",
    "Forro":           "Acabamento",
    "Cobertura":       "Cobertura",
  };

  async function confirmarConverter() {
    const o = converterOrc;
    const clienteSel = clientes.find((c) => c.id === o.cliente_id);
    
    let obraCriada = null;
    let orcamentoAtualizado = false;

    try {
      // 1. Criar a obra
      obraCriada = await addObra({
        nome:          obraForm.nome,
        cliente_id:    o.cliente_id,
        cliente:       o.cliente,
        email_cliente: clienteSel?.email || "",
        status:        "Planejamento",
        fase:          FASES[0],
        progresso:     0,
        contrato:      o.valor,
        prazo:         obraForm.prazo_fim || "—",
        prazo_inicio:  obraForm.prazo_inicio || null,
        prazo_fim:     obraForm.prazo_fim || null,
        area:          Number(o.area) || 0,
        padrao:        o.padrao || "Padrão",
      });

      if (!obraCriada || !obraCriada.id) {
        throw new Error("Não foi possível criar o registro da obra.");
      }

      // 2. Atualizar o orçamento (status + vinculação da obra_id)
      await updateOrcamento(o.id, { status: "Aprovado", obra_id: obraCriada.id });
      orcamentoAtualizado = true;

      // 3. Se há estimativo da calculadora, importa para quantitativos da obra
      if (estimativo?.itens?.length) {
        try {
          const rows = estimativo.itens.map((it) => ({
            fase:           GRUPO_PARA_FASE[it.grupo] || "Fechamentos",
            categoria:      GRUPO_PARA_CAT[it.grupo]  || "Vedação",
            descricao:      it.item,
            unidade:        it.un,
            quantidade:     it.qtd,
            custo_unitario: it.precoUnit,
            observacoes:    "Importado da calculadora estimativa",
          }));
          await inserirTemplate(obraCriada.id, rows);
        } catch (e) {
          mostrarToast(` Não foi possível importar itens para Quantitativos: ${e?.message || e}`);
        }
      }

      // 4. Auto-generate financial installments
      if (o.valor > 0) {
        const hoje = new Date();
        const addDays = (d) => { const dt = new Date(hoje); dt.setDate(dt.getDate() + d); return dt.toISOString().split("T")[0]; };
        const prazoMeio = obraForm.prazo_inicio && obraForm.prazo_fim
          ? new Date((new Date(obraForm.prazo_inicio).getTime() + new Date(obraForm.prazo_fim).getTime()) / 2).toISOString().split("T")[0]
          : addDays(60);
        const parcelas = [
          { descricao: "30% Entrada — " + o.cliente, valor: Math.round(o.valor * 0.30 * 100) / 100, tipo: "receita", categoria: "Contrato", data_vencimento: addDays(7), status: "A receber" },
          { descricao: "40% Meio de obra — " + o.cliente, valor: Math.round(o.valor * 0.40 * 100) / 100, tipo: "receita", categoria: "Contrato", data_vencimento: prazoMeio, status: "A receber" },
          { descricao: "30% Entrega — " + o.cliente, valor: Math.round(o.valor * 0.30 * 100) / 100, tipo: "receita", categoria: "Contrato", data_vencimento: obraForm.prazo_fim || addDays(120), status: "A receber" },
        ];
        for (const p of parcelas) {
          await addLancamento(obraCriada.id, p);
        }
      }

      setConverterOrc(null);
      mostrarToast(estimativo?.itens?.length
        ? ` Obra criada com ${estimativo.itens.length} itens do estimativo nos quantitativos!`
        : " Obra criada! Redirecionando...");
      setTimeout(() => setActivePage("obras"), 1500);

    } catch (err) {
      console.error("Erro na conversão de orçamento para obra:", err);
      
      // Rollback
      try {
        if (obraCriada && obraCriada.id) {
          await deleteObra(obraCriada.id);
        }
        if (orcamentoAtualizado) {
          await updateOrcamento(o.id, { status: o.status, obra_id: null });
        }
      } catch (rollbackErr) {
        console.error("Erro no rollback da conversão:", rollbackErr);
      }
      
      mostrarToast(` Erro na conversão: ${err?.message || err}`);
    }
  }
  async function gerarLinkProposta(o) {
    try {
      let token = o.proposta_token;
      if (!token) {
        token = crypto.randomUUID();
        await updateOrcamento(o.id, { proposta_token: token });
      }
      const url = `${window.location.origin}/proposta/${token}`;
      if (navigator.share) {
        await navigator.share({ title: "Proposta Stickframe", url });
        mostrarToast(" Proposta compartilhada!");
      } else {
        await navigator.clipboard.writeText(url);
        mostrarToast(" Link da proposta copiado!");
      }
    } catch {
      mostrarToast(" Erro ao gerar link.");
    }
  }

  async function compartilharWhatsApp(o) {
    try {
      let token = o.proposta_token;
      if (!token) {
        token = crypto.randomUUID();
        await updateOrcamento(o.id, { proposta_token: token });
      }
      const url = `${window.location.origin}/proposta/${token}`;
      const msg = encodeURIComponent(`Olá! Segue o link da sua proposta Stickframe:\n${url}`);
      window.open(`https://wa.me/?text=${msg}`, "_blank");
    } catch {
      mostrarToast(" Erro ao gerar link.");
    }
  }

  function executarDelete() {
    deleteOrcamento(confirm);
    setConfirm(null);
    mostrarToast(" Orçamento removido.");
  }

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

      {/* Modal Calculadora */}
      {calculadora && (
        <Modal title=" Calculadora Estimativa Steel Frame" onClose={() => setCalculadora(false)}>
          <CalculadoraEstimativa onAplicar={aplicarEstimativo} onClose={() => setCalculadora(false)} />
        </Modal>
      )}

      {/* Modal Memorial IA */}
      {memorialOrcamento && (
        <FormAiMemorial
          orcamento={memorialOrcamento}
          onClose={() => setMemorialOrcamento(null)}
        />
      )}

      {/* Modais */}
      {modal === "novo" && (
        <Modal title="Novo orçamento" onClose={() => { setModal(false); setPreOrcAtivo(null); }}>
          {estimativo && (
            <div style={{ background: C.red + "0d", border: `1px solid ${C.red}33`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.red, marginBottom: 4 }}><Zap size={13} /> Estimativo — {estimativo.tipo === "residencial" ? "Residencial" : "Galpão/Comercial"} · {estimativo.area}m²</div>
              <div style={{ fontSize: 12, color: C.muted }}>
                {estimativo.itens.length} itens · Custo materiais: <strong style={{ color: C.text }}>{(estimativo.totalGeral ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
                <span style={{ marginLeft: 8 }}>· {((estimativo.totalGeral ?? 0) / (estimativo.area || 1)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/m²</span>
              </div>
            </div>
          )}
          <FormOrc
            form={form} setForm={setForm} clientes={clientes}
            onSave={salvarNovo} onCancel={() => { setModal(false); setEstimativo(null); setPreOrcAtivo(null); }}
            btnLabel="Gerar orçamento"
            addCliente={addCliente}
          />
        </Modal>
      )}
      {modal === "editar" && (
        <Modal title="Editar orçamento" onClose={() => setModal(false)}>
          <FormOrc
            form={form} setForm={setForm} clientes={clientes}
            onSave={salvarEdicao} onCancel={() => setModal(false)}
            onDelete={() => { setModal(false); confirmarDelete(editId); }}
            btnLabel="Salvar alterações"
            addCliente={addCliente}
          />
        </Modal>
      )}

      {/* Confirmação de exclusão */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28, width: 360, textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}><Trash2 size={13} /></div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Deletar orçamento?</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Essa ação não pode ser desfeita.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn variant="ghost" onClick={() => setConfirm(null)}>Cancelar</Btn>
              <button onClick={executarDelete} style={{
                padding: "10px 24px", background: C.danger, border: "none",
                borderRadius: 6, color: "#fff", fontWeight: 700,
                fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}>
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal converter em obra */}
      {converterOrc && (
        <Modal title="Converter em Obra" onClose={() => setConverterOrc(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Resumo do orçamento */}
            <div style={{ background: C.darker, borderRadius: 10, padding: "14px 16px", border: `1px solid ${C.red}33` }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: C.red, marginBottom: 10 }}>ORÇAMENTO ORIGEM</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: C.muted }}>Cliente</span>
                <span style={{ fontWeight: 700 }}>{converterOrc.cliente}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 6 }}>
                <span style={{ color: C.muted }}>Padrão · Área total</span>
                <span style={{ fontWeight: 700 }}>{converterOrc.padrao} · {converterOrc.unidades * converterOrc.area} m²</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginTop: 6 }}>
                <span style={{ color: C.muted }}>Valor do contrato</span>
                <span style={{ fontWeight: 800, color: C.success }}>{fmt(converterOrc.valor)}</span>
              </div>
            </div>

            {/* Campos da obra */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>NOME DA OBRA</div>
              <Input
                value={obraForm.nome}
                onChange={(v) => setObraForm((f) => ({ ...f, nome: v }))}
                placeholder="Ex: Residência João — Bofete/SP"
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>INÍCIO PREVISTO</div>
                <Input type="date" value={obraForm.prazo_inicio} onChange={(v) => setObraForm((f) => ({ ...f, prazo_inicio: v }))} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>ENTREGA PREVISTA</div>
                <Input type="date" value={obraForm.prazo_fim} onChange={(v) => setObraForm((f) => ({ ...f, prazo_fim: v }))} />
              </div>
            </div>

            {estimativo?.itens?.length > 0 && (
              <div style={{ background: C.red + "0d", border: `1px solid ${C.red}33`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.red }}>
                <Zap size={13} /> {estimativo.itens.length} itens da calculadora estimativa serão importados automaticamente para os Quantitativos desta obra.
              </div>
            )}

            <div style={{ background: "#3b6ea511", border: "1px solid #3b6ea533", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#3b6ea5" }}>
               O valor do contrato ({fmt(converterOrc.valor)}) será preenchido automaticamente no financeiro da obra.
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <Btn variant="ghost" onClick={() => setConverterOrc(null)}>Cancelar</Btn>
              <Btn disabled={!obraForm.nome} onClick={confirmarConverter}> Criar Obra</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Layout */}
      <div>
        <FluxoOrcamentoStepper step={1} onGo={(i) => { if (i === 0) setActivePage("calculadora"); }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Orçamentos</h2>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
              {orcamentos.length} proposta{orcamentos.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setCalculadora(true)} style={{
              background: "none", border: `1px solid ${C.red}`, color: C.red,
              borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              <Zap size={13} /> Calculadora estimativa
            </button>
            <button onClick={() => { setModoComparar(v => !v); setSelecionados([]); }} style={{
              background: modoComparar ? "#2563eb22" : "none",
              border: `1px solid ${modoComparar ? "#2563eb" : C.border}`,
              color: modoComparar ? "#2563eb" : C.muted,
              borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>
               Comparar
            </button>
            <Btn onClick={abrirNovo}>+ Novo orçamento</Btn>
          </div>
        </div>

        {/* Pré-orçamentos da calculadora */}
        {preOrcamentos.length > 0 && (
          <div style={{ background: "#3f7a4b11", border: "1px solid #3f7a4b44", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#3f7a4b" }}><Bell size={13} /> {preOrcamentos.length} pré-orçamento(s) novo(s)</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Leads da calculadora aguardando sua análise</div>
              </div>
            </div>
            {preOrcamentos.map((p) => {
              const kitId = p.origem?.startsWith("Kit-") ? p.origem.replace("Kit-", "") : null;
              const KIT_NOMES = { studio: "Studio Compact 42m²", vila: "Vila 78m²", casa120: "Casa Serena 120m²", sobrado160: "Sobrado Vivo 160m²", alto200: "Residência Alto 200m²", vigo273: "Casa Vigo 273m²" };
              const kitNome = kitId ? KIT_NOMES[kitId] : null;
              return (
              <div key={p.id} style={{ background: C.surface, border: `1px solid ${kitId ? "#981915" : C.border}`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{p.nome}</span>
                      {kitNome && (
                        <span style={{ fontSize: 10, fontWeight: 800, background: "#98191518", color: "#981915", borderRadius: 4, padding: "2px 7px", border: "1px solid #98191533" }}>
                           Kit: {kitNome}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {p.area}m² · {p.padrao} · {p.pavimentos || "—"} · {p.cidade || "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "#3f7a4b", marginTop: 2, fontWeight: 700 }}>
                      R$ {Number(p.valor_min).toLocaleString("pt-BR")} – R$ {Number(p.valor_max).toLocaleString("pt-BR")}
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                      {new Date(p.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · {p.contato}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                    {kitId && (
                      <button onClick={() => {
                        localStorage.setItem("sf_kit_lead", JSON.stringify({ kitId, padrao: p.padrao }));
                        setActivePage("calculadora");
                      }} style={{ background: "#98191518", border: "1px solid #98191544", borderRadius: 6, color: "#981915", fontSize: 11, fontWeight: 700, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                         Simular na Calculadora
                      </button>
                    )}
                    <button onClick={() => {
                      let clienteId = p.cliente_id;
                      if (!clienteId) {
                        const existing = clientes.find((c) => c.contato === p.contato || c.nome === p.nome);
                        clienteId = existing?.id || clientes[0]?.id || "";
                      }
                      const leadPadrao = p.padrao || "Padrão";
                      const leadPreco = PRECOS[leadPadrao] || PRECOS["Padrão"];
                      setForm({
                        ...FORM_VAZIO,
                        cliente_id: clienteId,
                        area: p.area_m2 || p.area || 48,
                        padrao: leadPadrao,
                        valor_m2_custom: leadPreco ? leadPreco.m2 : 3500,
                        unidades: 1,
                      });
                      setPreOrcAtivo(p.id);
                      setModal("novo");
                    }} style={{ background: "#3f7a4b22", border: "1px solid #3f7a4b44", borderRadius: 6, color: "#3f7a4b", fontSize: 11, fontWeight: 700, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                       Criar Orçamento
                    </button>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={async () => {
                        await sb.from("pre_orcamentos").update({ status: "Analisado" }).eq("id", p.id);
                        setPreOrcamentos((prev) => prev.filter((x) => x.id !== p.id));
                      }} style={{ background: "#99999918", border: "1px solid #99999933", borderRadius: 6, color: "#999", fontSize: 11, fontWeight: 700, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit", flex: 1 }}>
                         Dispensar
                      </button>
                      <button onClick={() => {
                        const num = (p.contato || "").replace(/\D/g, "");
                        const msg = `Olá ${p.nome}! \n\nRecebi sua simulação de Steel Frame${kitNome ? ` — ${kitNome}` : ` (${p.area}m² · ${p.padrao})`}.\n\nVou preparar uma proposta detalhada para você. Posso entrar em contato agora?\n\nStick Frame · Santo André/SP`;
                        window.open(`https://wa.me/${num.startsWith("55") ? num : "55" + num}?text=${encodeURIComponent(msg)}`, "_blank");
                      }} style={{ background: "#3f7a4b22", border: "1px solid #3f7a4b44", borderRadius: 6, color: "#3f7a4b", fontSize: 11, fontWeight: 700, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit", flex: 1 }}>
                        <Smartphone size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* Estimativo aplicado */}
        {estimativo && (
          <div style={{ background: C.red + "0d", border: `1px solid ${C.red}33`, borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 2 }}><Zap size={13} /> Estimativo calculado — {["residencial","galpão"].includes(estimativo.tipo) ? (estimativo.tipo === "residencial" ? "Residencial" : "Galpão") : estimativo.tipo || "Residencial"} · {estimativo.area}m²</div>
                <div style={{ fontSize: 11, color: C.muted }}>{estimativo.itens.length} itens · Total materiais: <strong>{(estimativo.totalGeral ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => setEstimativoAberto((v) => !v)} style={{ background: C.red + "18", border: `1px solid ${C.red}44`, borderRadius: 6, padding: "4px 10px", color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  {estimativoAberto ? " Ocultar" : " Ver itens"}
                </button>
                <button onClick={() => { setEstimativo(null); setEstimativoAberto(false); }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 18 }}>×</button>
              </div>
            </div>
            {estimativoAberto && (
              <div style={{ borderTop: `1px solid ${C.red}22`, padding: "12px 18px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ color: C.muted, fontWeight: 700, fontSize: 10, letterSpacing: 1 }}>
                      <th style={{ textAlign: "left", paddingBottom: 8 }}>ITEM</th>
                      <th style={{ textAlign: "right", paddingBottom: 8 }}>QTD</th>
                      <th style={{ textAlign: "right", paddingBottom: 8 }}>UN</th>
                      <th style={{ textAlign: "right", paddingBottom: 8 }}>UNIT.</th>
                      <th style={{ textAlign: "right", paddingBottom: 8 }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimativo.itens.map((it, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td style={{ padding: "6px 0", color: C.text }}>{it.item}</td>
                        <td style={{ textAlign: "right", padding: "6px 0", fontFamily: "monospace" }}>{(it.qtd ?? 0).toFixed(2)}</td>
                        <td style={{ textAlign: "right", padding: "6px 0", color: C.muted }}>{it.un}</td>
                        <td style={{ textAlign: "right", padding: "6px 0", fontFamily: "monospace" }}>{(it.precoUnit ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                        <td style={{ textAlign: "right", padding: "6px 0", fontWeight: 700 }}>{(it.total ?? it.preco ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: `2px solid ${C.red}44` }}>
                      <td colSpan={4} style={{ paddingTop: 10, fontWeight: 700, fontSize: 12 }}>Total materiais</td>
                      <td style={{ textAlign: "right", paddingTop: 10, fontWeight: 900, fontSize: 14, color: C.red }}>{(estimativo.totalGeral ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Lista */}
        {orcamentos.length === 0 ? (
          <div style={{
            background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `1px solid ${C.border}`,
            padding: 48, textAlign: "center", color: C.muted,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}></div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Nenhum orçamento ainda</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Clique em "+ Novo orçamento" para começar</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {orcamentos.map((o) => {
              const clienteOrc = clientes.find((c) => c.id === o.cliente_id);
              return (
                <div key={o.id} style={{
                  background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  border: `1px solid ${C.border}`, padding: "16px 20px",
                  transition: "border-color .15s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: C.red, fontWeight: 700, letterSpacing: 1 }}>
                          {o.ref}
                        </span>
                        <Badge label={o.status} color={statusColor(o.status)} />
                        {(() => {
                          const info = getValidadeText(o.criado, o.validade_dias);
                          return <Badge label={info.text} color={info.color} dot={info.isExpired} />;
                        })()}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{o.cliente}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                        {o.unidades > 1 ? `${o.unidades} unid. · ${o.area} m²` : `${o.area} m²`} · {PRECOS[o.padrao]?.label || o.padrao} · {o.criado}
                      </div>
                    </div>

                    {/* Valor */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{fmt(o.valor)}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                        {o.unidades > 1 ? `${fmt(o.valor / o.unidades)} / unid.` : `${fmt(o.valor / o.area)}/m²`}
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
                    {modoComparar && (
                      <button onClick={() => setSelecionados(prev => {
                        if (prev.includes(o.id)) return prev.filter(id => id !== o.id);
                        if (prev.length >= 2) return prev;
                        return [...prev, o.id];
                      })} style={{
                        padding: "6px 14px",
                        background: selecionados.includes(o.id) ? "#2563eb" : "#2563eb22",
                        border: `1px solid #2563eb44`, borderRadius: 6,
                        color: selecionados.includes(o.id) ? "#fff" : "#2563eb",
                        fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                      }}>
                        {selecionados.includes(o.id) ? " Selecionado" : "Selecionar"}
                      </button>
                    )}

                    {/* Ação Principal: Proposta Comercial */}
                    <button
                      onClick={() => gerarPropostaComercialPDF(o, { contato: clientes.find(c => c.id === o.cliente_id)?.telefone || clientes.find(c => c.nome === o.cliente)?.telefone })}
                      className="sf-btn sf-btn-sm sf-btn-primary"
                    >
                      <ClipboardList size={13} /> Proposta Comercial
                    </button>

                    {/* Ações Secundárias */}
                    <Btn variant="ghost" size="sm" onClick={() => abrirEditar(o)}><Pencil size={13} /> Editar</Btn>
                    <Btn variant="danger" size="sm" onClick={() => confirmarDelete(o.id)}><Trash2 size={13} /> Excluir</Btn>

                    {o.status !== "Aprovado" && o.status !== "Recusado" && (
                      <button
                        onClick={() => abrirConverter(o)}
                        className="sf-btn sf-btn-sm sf-btn-success"
                      >
                         Converter em Obra
                      </button>
                    )}

                    <Select
                      value={o.status}
                      onChange={(v) => updateOrcamento(o.id, { status: v })}
                      options={STATUS_OPTS.map((s) => ({ value: s, label: s }))}
                    />

                    {/* Menu Dropdown de Mais Ações */}
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => setAbertoDropId(abertoDropId === o.id ? null : o.id)}
                        className="sf-btn sf-btn-sm sf-btn-ghost"
                        style={{ padding: "6px 14px" }}
                      >
                        Mais...
                      </button>
                      {abertoDropId === o.id && (
                        <>
                          <div
                            style={{ position: "fixed", inset: 0, zIndex: 10 }}
                            onClick={() => setAbertoDropId(null)}
                          />
                          <div style={{
                            position: "absolute", bottom: "100%", left: 0, marginBottom: 4,
                            background: C.surface, border: `1px solid ${C.border}`,
                            borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                            zIndex: 11, display: "flex", flexDirection: "column", minWidth: 200,
                            overflow: "hidden"
                          }}>
                            <button
                              onClick={() => { setAbertoDropId(null); gerarLinkProposta(o); }}
                              style={{
                                padding: "9px 12px", border: "none", background: "none",
                                textAlign: "left", fontSize: 12, cursor: "pointer", color: C.text,
                                fontFamily: "inherit", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6
                              }}
                            >
                               {o.proposta_token ? "Copiar link online" : "Gerar link online"}
                            </button>
                            {o.proposta_token && (
                              <button
                                onClick={() => { setAbertoDropId(null); compartilharWhatsApp(o); }}
                                style={{
                                  padding: "9px 12px", border: "none", background: "none",
                                  textAlign: "left", fontSize: 12, cursor: "pointer", color: C.text,
                                  fontFamily: "inherit", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6
                                }}
                              >
                                 WhatsApp (Link)
                              </button>
                            )}
                            {clienteOrc?.contato && (
                              <button
                                onClick={() => { setAbertoDropId(null); enviarWhatsApp(clienteOrc.contato, msgOrcamento(o)); }}
                                style={{
                                  padding: "9px 12px", border: "none", background: "none",
                                  textAlign: "left", fontSize: 12, cursor: "pointer", color: C.text,
                                  fontFamily: "inherit", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6
                                }}
                              >
                                 WhatsApp (Texto)
                              </button>
                            )}
                            <button
                              onClick={() => { setAbertoDropId(null); gerarContratoHTML(o); }}
                              style={{
                                padding: "9px 12px", border: "none", background: "none",
                                textAlign: "left", fontSize: 12, cursor: "pointer", color: C.text,
                                fontFamily: "inherit", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6
                              }}
                            >
                               Gerar Contrato
                            </button>
                            <button
                              onClick={() => { setAbertoDropId(null); gerarPDF(o); }}
                              style={{
                                padding: "9px 12px", border: "none", background: "none",
                                textAlign: "left", fontSize: 12, cursor: "pointer", color: C.text,
                                fontFamily: "inherit", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6
                              }}
                            >
                               PDF Simples (Rascunho)
                            </button>
                            <button
                              onClick={() => { setAbertoDropId(null); setMemorialOrcamento(o); }}
                              style={{
                                padding: "9px 12px", border: "none", background: "none",
                                textAlign: "left", fontSize: 12, cursor: "pointer", color: C.text,
                                fontFamily: "inherit", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6
                              }}
                            >
                               Memorial IA
                            </button>
                            <button
                              onClick={() => { setAbertoDropId(null); duplicarOrcamento(o); }}
                              style={{
                                padding: "9px 12px", border: "none", background: "none",
                                textAlign: "left", fontSize: 12, cursor: "pointer", color: C.text,
                                fontFamily: "inherit", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6
                              }}
                            >
                               Duplicar
                            </button>
                            <button
                              onClick={() => { setAbertoDropId(null); confirmarDelete(o.id); }}
                              style={{
                                padding: "9px 12px", border: "none", background: "none",
                                textAlign: "left", fontSize: 12, cursor: "pointer", color: C.danger,
                                fontFamily: "inherit", fontWeight: 700, display: "flex", alignItems: "center", gap: 6
                              }}
                            >
                               Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Painel Comparativo */}
      {modoComparar && selecionados.length === 2 && (() => {
        const [idA, idB] = selecionados;
        const a = orcamentos.find(o => o.id === idA);
        const b = orcamentos.find(o => o.id === idB);
        if (!a || !b) return null;
        const cA = clientes.find(c => c.id === a.cliente_id);
        const cB = clientes.find(c => c.id === b.cliente_id);
        const calcA = calcOrcamento({ area: a.area, unidades: a.unidades, padrao: a.padrao });
        const calcB = calcOrcamento({ area: b.area, unidades: b.unidades, padrao: b.padrao });
        const betterArea = Number(a.area) >= Number(b.area) ? "a" : "b";
        const betterM2 = calcA.valor_m2 <= calcB.valor_m2 ? "a" : "b";
        const betterTotal = calcA.valor_total <= calcB.valor_total ? "a" : "b";

        const rows = [
          { label: "Cliente",    vA: cA?.nome || "—",                    vB: cB?.nome || "—",                    highlight: null },
          { label: "Área (m²)",  vA: `${a.area} m²`,                     vB: `${b.area} m²`,                     highlight: betterArea },
          { label: "Padrão",     vA: a.padrao,                            vB: b.padrao,                           highlight: null },
          { label: "Unidades",   vA: a.unidades,                          vB: b.unidades,                         highlight: null },
          { label: "Valor/m²",   vA: fmt.moeda(calcA.valor_m2),          vB: fmt.moeda(calcB.valor_m2),          highlight: betterM2 },
          { label: "Valor total",vA: fmt.moeda(calcA.valor_total),       vB: fmt.moeda(calcB.valor_total),       highlight: betterTotal },
          { label: "Status",     vA: a.status || "—",                    vB: b.status || "—",                    highlight: null },
        ];

        return (
          <div style={{ marginTop: 24, background: C.surface, border: `1px solid #2563eb44`, borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(37,99,235,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#2563eb" }}> Comparativo de Orçamentos</div>
              <button onClick={() => { setModoComparar(false); setSelecionados([]); }} style={{
                background: "none", border: `1px solid ${C.border}`, borderRadius: 8,
                padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: C.muted,
              }}>Fechar comparativo</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: C.muted, fontWeight: 700, fontSize: 11, letterSpacing: 1, borderBottom: `1px solid ${C.border}` }}>CAMPO</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: "#2563eb", fontWeight: 700, fontSize: 11, letterSpacing: 1, borderBottom: `1px solid ${C.border}`, background: "#2563eb08", borderRadius: "8px 0 0 0" }}>Orçamento A — {a.nome || `#${String(a.id).slice(0,6)}`}</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: "#7c3aed", fontWeight: 700, fontSize: 11, letterSpacing: 1, borderBottom: `1px solid ${C.border}`, background: "#7c3aed08", borderRadius: "0 8px 0 0" }}>Orçamento B — {b.nome || `#${String(b.id).slice(0,6)}`}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ label, vA, vB, highlight }) => (
                  <tr key={label} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: C.muted, fontSize: 12 }}>{label}</td>
                    <td style={{
                      padding: "10px 12px", fontWeight: highlight === "a" ? 800 : 400,
                      color: highlight === "a" ? "#3f7a4b" : undefined,
                      background: highlight === "a" ? "#3f7a4b0a" : "#2563eb06",
                    }}>{vA}{highlight === "a" && <span style={{ marginLeft: 6, fontSize: 11, color: "#3f7a4b" }}></span>}</td>
                    <td style={{
                      padding: "10px 12px", fontWeight: highlight === "b" ? 800 : 400,
                      color: highlight === "b" ? "#3f7a4b" : undefined,
                      background: highlight === "b" ? "#3f7a4b0a" : "#7c3aed06",
                    }}>{vB}{highlight === "b" && <span style={{ marginLeft: 6, fontSize: 11, color: "#3f7a4b" }}></span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}
    </>
  );
}
