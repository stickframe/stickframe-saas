import { useState, useEffect, useCallback, useMemo } from "react";
import { ClipboardList, Pencil, Ruler, Trash2 } from "../components/ui/Icon";
import { useToast } from "../hooks/useToast";
import { printHtml } from "../utils/printHtml";
import { C, FASES } from "../utils/constants";
import { fmt } from "../utils/format";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import {
  listarQuantitativos, criarQuantitativo, atualizarQuantitativo,
  deletarQuantitativo, inserirTemplate,
} from "../services/repositories/quantitativoRepository";
import { criarCotacao } from "../services/repositories/fornecedoresRepository";

// ─── Templates Steel Frame por fase ──────────────────────────────────────────
const UNIDADES = ["m²","m","m³","un","kg","vb","l","hrs","cj"];

const CATEGORIAS = ["Estrutura","Fundação","Vedação","Cobertura","Instalações","Acabamento","Projeto","Administração","Outros"];

const TEMPLATES = {
  "Projeto executivo": [
    { categoria: "Projeto", descricao: "Projeto arquitetônico",       unidade: "vb", quantidade: 1,    custo_unitario: 4500  },
    { categoria: "Projeto", descricao: "Projeto estrutural Steel Frame", unidade: "m²", quantidade: 1, custo_unitario: 55   },
    { categoria: "Projeto", descricao: "Projeto elétrico",             unidade: "vb", quantidade: 1,    custo_unitario: 2200  },
    { categoria: "Projeto", descricao: "Projeto hidráulico",           unidade: "vb", quantidade: 1,    custo_unitario: 1800  },
    { categoria: "Projeto", descricao: "ART / RRT",                   unidade: "vb", quantidade: 1,    custo_unitario: 1200  },
  ],
  "Fundação": [
    { categoria: "Fundação", descricao: "Radier de concreto",         unidade: "m²", quantidade: 1,    custo_unitario: 280  },
    { categoria: "Fundação", descricao: "Brita + areia (lastro)",      unidade: "m³", quantidade: 0.1,  custo_unitario: 150  },
    { categoria: "Fundação", descricao: "Lona plástica impermeabiliz.", unidade: "m²", quantidade: 1.2, custo_unitario: 8    },
    { categoria: "Fundação", descricao: "Ferragem CA-50",              unidade: "kg", quantidade: 8,    custo_unitario: 12   },
    { categoria: "Fundação", descricao: "Concreto fck 25 MPa",        unidade: "m³", quantidade: 0.12, custo_unitario: 480  },
    { categoria: "Fundação", descricao: "Mão de obra fundação",       unidade: "m²", quantidade: 1,    custo_unitario: 90   },
  ],
  "Estrutura Steel Frame": [
    { categoria: "Estrutura", descricao: "Perfil PU 90×40×12 (montante)", unidade: "m", quantidade: 4.5, custo_unitario: 18  },
    { categoria: "Estrutura", descricao: "Perfil U 90×40 (guia)",      unidade: "m",  quantidade: 2,    custo_unitario: 14   },
    { categoria: "Estrutura", descricao: "Parafuso autobrocante 4,2×13", unidade: "un", quantidade: 80, custo_unitario: 0.28 },
    { categoria: "Estrutura", descricao: "Parafuso autobrocante 4,8×25", unidade: "un", quantidade: 40, custo_unitario: 0.35 },
    { categoria: "Estrutura", descricao: "Fita adesiva estrutural",    unidade: "m",  quantidade: 2,    custo_unitario: 3.5  },
    { categoria: "Estrutura", descricao: "Mão de obra montagem",       unidade: "m²", quantidade: 1,    custo_unitario: 140  },
  ],
  "Fechamentos": [
    { categoria: "Vedação", descricao: "OSB 11,1 mm (externo)",        unidade: "m²", quantidade: 1.1,  custo_unitario: 68  },
    { categoria: "Vedação", descricao: "Drywall 12,5 mm (interno)",    unidade: "m²", quantidade: 1.05, custo_unitario: 38  },
    { categoria: "Vedação", descricao: "Lã de vidro 50mm R-1,3",       unidade: "m²", quantidade: 1,    custo_unitario: 28  },
    { categoria: "Vedação", descricao: "Manta subcobertura",           unidade: "m²", quantidade: 1.1,  custo_unitario: 14  },
    { categoria: "Vedação", descricao: "Fita fílmica (barreira vapor)", unidade: "m",  quantidade: 3,    custo_unitario: 2.2 },
    { categoria: "Vedação", descricao: "Massa e pintura ext. (SPBI)",   unidade: "m²", quantidade: 1,    custo_unitario: 55  },
    { categoria: "Vedação", descricao: "Mão de obra fechamento",        unidade: "m²", quantidade: 1,    custo_unitario: 75  },
  ],
  "Instalações": [
    { categoria: "Instalações", descricao: "Eletroduto flex 3/4\"",    unidade: "m",  quantidade: 3,    custo_unitario: 5.5  },
    { categoria: "Instalações", descricao: "Cabo 2,5mm²",              unidade: "m",  quantidade: 8,    custo_unitario: 4.2  },
    { categoria: "Instalações", descricao: "Cabo 4mm²",                unidade: "m",  quantidade: 4,    custo_unitario: 6.8  },
    { categoria: "Instalações", descricao: "Quadro de distribuição",   unidade: "un", quantidade: 0.03, custo_unitario: 680  },
    { categoria: "Instalações", descricao: "Tubo PVC 25mm hidráulico", unidade: "m",  quantidade: 2,    custo_unitario: 8.5  },
    { categoria: "Instalações", descricao: "Mão de obra elétrica",     unidade: "m²", quantidade: 1,    custo_unitario: 65   },
    { categoria: "Instalações", descricao: "Mão de obra hidráulica",   unidade: "m²", quantidade: 1,    custo_unitario: 45   },
  ],
  "Acabamento": [
    { categoria: "Acabamento", descricao: "Porcelanato piso 60×60",    unidade: "m²", quantidade: 1.1,  custo_unitario: 85  },
    { categoria: "Acabamento", descricao: "Argamassa AC-II",           unidade: "kg", quantidade: 8,    custo_unitario: 1.8 },
    { categoria: "Acabamento", descricao: "Rejunte",                   unidade: "kg", quantidade: 1,    custo_unitario: 12  },
    { categoria: "Acabamento", descricao: "Pintura interna (2 demãos)", unidade: "m²", quantidade: 2.8, custo_unitario: 22  },
    { categoria: "Acabamento", descricao: "Gesso liso teto",           unidade: "m²", quantidade: 1,    custo_unitario: 48  },
    { categoria: "Acabamento", descricao: "Porta interna (cj)",        unidade: "un", quantidade: 0.12, custo_unitario: 980 },
    { categoria: "Acabamento", descricao: "Mão de obra acabamento",    unidade: "m²", quantidade: 1,    custo_unitario: 120 },
  ],
  "Entrega": [
    { categoria: "Administração", descricao: "Limpeza final de obra",  unidade: "m²", quantidade: 1,    custo_unitario: 22  },
    { categoria: "Administração", descricao: "Habite-se / aprovações", unidade: "vb", quantidade: 1,    custo_unitario: 1500},
    { categoria: "Administração", descricao: "BDI / administração",    unidade: "%",  quantidade: 1,    custo_unitario: 0   },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function LabelF({ children, required }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6, textTransform: "uppercase" }}>
      {children}{required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

const COR_CAT = {
  Estrutura: "#4a9eff", Fundação: "#c88a00", Vedação: "#9b59b6",
  Cobertura: "#2e9e5b", Instalações: "#e67e22", Acabamento: "#1abc9c",
  Projeto: C.red, Administração: C.muted, Outros: C.muted,
};

// ─── Componente principal ─────────────────────────────────────────────────────
const FORM_VAZIO = { fase: FASES[0], descricao: "", unidade: "m²", quantidade: "", custo_unitario: "", categoria: "Estrutura", observacoes: "" };

export default function Quantitativos() {
  useModuleLoad("obras");
  useModuleLoad("fornecedores");

  const obras        = useAppStore((s) => s.obras);
  const fornecedores = useAppStore((s) => s.fornecedores);
  const { toast, mostrarToast } = useToast();

  const [obraId,    setObraId]    = useState("");
  const [faseFiltro,setFaseFiltro] = useState("Todas");
  const [catFiltro, setCatFiltro]  = useState("Todas");
  const [items,     setItems]      = useState([]);
  const [loading,   setLoading]    = useState(false);
  const [modal,     setModal]      = useState(null);
  const [editId,    setEditId]     = useState(null);
  const [form,      setForm]       = useState(FORM_VAZIO);
  const [editCell,  setEditCell]   = useState(null); // { id, field }
  const [editVal,   setEditVal]    = useState("");
  const [confirm,   setConfirm]    = useState(null);
  const [templateModal, setTemplateModal] = useState(false);
  const [templateFases, setTemplateFases] = useState({});
  const [cotarItem, setCotarItem]  = useState(null); // item a ser cotado
  const [cotarForm, setCotarForm]  = useState({ fornecedor_id: "", valor: "", observacoes: "", atualizar_custo: true });

  const obra = obras.find((o) => o.id === obraId);


  const carregar = useCallback(async () => {
    if (!obraId) return;
    setLoading(true);
    try {
      const data = await listarQuantitativos(obraId);
      setItems(data);
    } finally { setLoading(false); }
  }, [obraId]);

  useEffect(() => { carregar(); }, [carregar]);

  // ── CRUD ─────────────────────────────────────────────────────────────────
  async function salvarItem() {
    if (!form.descricao || !form.quantidade || !form.custo_unitario) return;
    const payload = {
      obra_id:        obraId,
      fase:           form.fase,
      descricao:      form.descricao,
      unidade:        form.unidade,
      quantidade:     Number(form.quantidade),
      custo_unitario: Number(form.custo_unitario),
      categoria:      form.categoria,
      observacoes:    form.observacoes,
    };
    if (editId) {
      const updated = await atualizarQuantitativo(editId, payload);
      setItems((prev) => prev.map((i) => i.id === editId ? updated : i));
      mostrarToast("✅ Item atualizado!");
    } else {
      const created = await criarQuantitativo(payload);
      setItems((prev) => [...prev, created]);
      mostrarToast("✅ Item adicionado!");
    }
    setModal(null); setEditId(null); setForm(FORM_VAZIO);
  }

  async function removerItem(id) {
    await deletarQuantitativo(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setConfirm(null);
    mostrarToast("🗑 Item removido.");
  }

  // Edição inline de quantidade e custo_unitario
  async function commitEditCell() {
    if (!editCell) return;
    const val = Number(editVal);
    if (isNaN(val) || val < 0) { setEditCell(null); return; }
    const updated = await atualizarQuantitativo(editCell.id, { [editCell.field]: val });
    setItems((prev) => prev.map((i) => i.id === editCell.id ? updated : i));
    setEditCell(null);
  }

  // ── Template ──────────────────────────────────────────────────────────────
  function abrirTemplate() {
    const iniciais = {};
    FASES.forEach((f) => { if (TEMPLATES[f]) iniciais[f] = true; });
    setTemplateFases(iniciais);
    setTemplateModal(true);
  }

  async function aplicarTemplate() {
    const fasesSel = FASES.filter((f) => templateFases[f] && TEMPLATES[f]);
    const rows = fasesSel.flatMap((fase) =>
      (TEMPLATES[fase] || []).map((t) => ({ ...t, fase }))
    );
    if (!rows.length) return;
    const criados = await inserirTemplate(obraId, rows);
    setItems((prev) => [...prev, ...criados]);
    setTemplateModal(false);
    mostrarToast(`✅ ${criados.length} itens importados do template!`);
  }

  // ── Exportar CSV ──────────────────────────────────────────────────────────
  function exportarCSV() {
    const header = ["Fase","Categoria","Descrição","Unidade","Quantidade","Custo Unitário","Custo Total"];
    const rows = filtrados.map((i) => [
      i.fase, i.categoria || "", i.descricao, i.unidade,
      i.quantidade, i.custo_unitario, (Number(i.quantidade) * Number(i.custo_unitario)).toFixed(2),
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `quantitativos-${obra?.nome?.split("—")[0]?.trim() || "obra"}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  // ── Exportar PDF ──────────────────────────────────────────────────────────
  function exportarPDF() {
    const tabelaFases = faseGrupos.map((fase) => {
      const itensFase = filtrados.filter((i) => i.fase === fase);
      const totalFase = totalPorFaseMap[fase] || 0;
      const linhas = itensFase.map((i) => {
        const total = Number(i.quantidade) * Number(i.custo_unitario);
        return `<tr>
          <td style="padding:7px 12px;border-bottom:1px solid #f0f0f3;color:#6b7280;font-size:11px">${i.categoria || "—"}</td>
          <td style="padding:7px 12px;border-bottom:1px solid #f0f0f3">${i.descricao}</td>
          <td style="padding:7px 12px;border-bottom:1px solid #f0f0f3;text-align:center">${i.unidade}</td>
          <td style="padding:7px 12px;border-bottom:1px solid #f0f0f3;text-align:right">${Number(i.quantidade).toLocaleString("pt-BR", { maximumFractionDigits: 3 })}</td>
          <td style="padding:7px 12px;border-bottom:1px solid #f0f0f3;text-align:right">${Number(i.custo_unitario).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
          <td style="padding:7px 12px;border-bottom:1px solid #f0f0f3;text-align:right;font-weight:700">${total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
        </tr>`;
      }).join("");
      return `
        <div style="margin-bottom:24px">
          <div style="background:#f0f0f3;padding:8px 12px;border-radius:6px;margin-bottom:0;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#4b4b4b">${fase}</span>
            <span style="font-size:14px;font-weight:900;color:#981915">${totalFase.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e4e4ea;border-top:none">
            <thead><tr style="background:#fafafa">
              <th style="padding:8px 12px;text-align:left;font-size:10px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:1px">Categ.</th>
              <th style="padding:8px 12px;text-align:left;font-size:10px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:1px">Descrição</th>
              <th style="padding:8px 12px;text-align:center;font-size:10px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:1px">Und</th>
              <th style="padding:8px 12px;text-align:right;font-size:10px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:1px">Qtd</th>
              <th style="padding:8px 12px;text-align:right;font-size:10px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:1px">Unit.</th>
              <th style="padding:8px 12px;text-align:right;font-size:10px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:1px">Total</th>
            </tr></thead>
            <tbody>${linhas}</tbody>
          </table>
        </div>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<title>Quantitativos — ${obra?.nome || "Obra"}</title>
<style>* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: -apple-system, sans-serif; color: #1a1a1a; padding: 32px; max-width: 960px; margin: auto; } @media print { body { padding: 16px; } }</style>
</head><body>
<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:28px;padding-bottom:16px;border-bottom:3px solid #981915">
  <div>
    <div style="font-size:22px;font-weight:900;color:#981915;letter-spacing:-0.5px;margin-bottom:4px">Planilha de Quantitativos</div>
    <div style="font-size:14px;font-weight:700">${obra?.nome || "Obra"}</div>
    <div style="font-size:12px;color:#6b7280;margin-top:2px">${obra?.fase ? `Fase atual: ${obra.fase}` : ""} · Steel Frame</div>
  </div>
  <div style="text-align:right;font-size:12px;color:#6b7280">
    <div>Gerado em ${new Date().toLocaleDateString("pt-BR")}</div>
    <div style="font-size:24px;font-weight:900;color:#1a1a1a;margin-top:4px">${totalGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
    <div style="font-size:11px">custo total estimado</div>
  </div>
</div>
${tabelaFases}
<div style="border-top:2px solid #981915;padding-top:14px;display:flex;justify-content:flex-end;align-items:center;gap:24px">
  <span style="font-size:13px;color:#6b7280">${filtrados.length} itens · ${obra?.area ? `${Number(obra.area) * Number(obra.unidades || 1)} m² total` : ""}</span>
  <span style="font-size:20px;font-weight:900">${totalGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
</div>
</body></html>`;
    printHtml(html, `quantitativos-${obra?.nome?.split("—")[0]?.trim() || "obra"}`);
  }

  // ── Filtros e cálculos ────────────────────────────────────────────────────
  const filtrados = useMemo(() => items.filter((i) => {
    const mF = faseFiltro === "Todas" || i.fase === faseFiltro;
    const mC = catFiltro  === "Todas" || i.categoria === catFiltro;
    return mF && mC;
  }), [items, faseFiltro, catFiltro]);

  const { totalGeral, faseGrupos, totalPorFaseMap, areaTotal, custoPorM2 } = useMemo(() => {
    const totFase = {};
    let total = 0;
    filtrados.forEach((i) => {
      const v = Number(i.quantidade) * Number(i.custo_unitario);
      total += v;
      totFase[i.fase] = (totFase[i.fase] || 0) + v;
    });
    const area = obra ? Number(obra.area || 48) * Number(obra.unidades || 1) : 1;
    return {
      totalGeral:      total,
      faseGrupos:      FASES.filter((f) => totFase[f] > 0),
      totalPorFaseMap: totFase,
      areaTotal:       area,
      custoPorM2:      area > 0 ? total / area : 0,
    };
  }, [filtrados, obra]);

  const totalPorFase = (fase) => totalPorFaseMap[fase] || 0;

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  // ── Cotar com fornecedor ─────────────────────────────────────────────────
  async function confirmarCotacao() {
    if (!cotarForm.fornecedor_id || !cotarItem) return;
    const valor = parseFloat(String(cotarForm.valor).replace(",", ".")) || null;
    await criarCotacao({
      fornecedor_id: cotarForm.fornecedor_id,
      obra_id:       obraId || null,
      descricao:     cotarItem.descricao,
      valor,
      status:        "Pendente",
      observacoes:   cotarForm.observacoes || null,
    });
    if (cotarForm.atualizar_custo && valor) {
      const updated = await atualizarQuantitativo(cotarItem.id, { custo_unitario: valor });
      setItems((prev) => prev.map((i) => i.id === cotarItem.id ? updated : i));
    }
    setCotarItem(null);
    setCotarForm({ fornecedor_id: "", valor: "", observacoes: "", atualizar_custo: true });
    mostrarToast("✅ Cotação registrada" + (cotarForm.atualizar_custo && valor ? " e custo atualizado!" : "!"));
  }

  return (
    <>
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 999,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 32px #0006",
        }}>{toast}</div>
      )}

      {/* ── Modal item ── */}
      {modal && (
        <Modal title={editId ? "Editar item" : "Novo item"} onClose={() => { setModal(null); setEditId(null); setForm(FORM_VAZIO); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <LabelF required>Fase</LabelF>
                <Select value={form.fase} onChange={set("fase")} options={FASES.map((f) => ({ value: f, label: f }))} />
              </div>
              <div>
                <LabelF>Categoria</LabelF>
                <Select value={form.categoria} onChange={set("categoria")} options={CATEGORIAS.map((c) => ({ value: c, label: c }))} />
              </div>
            </div>
            <div>
              <LabelF required>Descrição do insumo</LabelF>
              <Input value={form.descricao} onChange={set("descricao")} placeholder="Ex: Perfil PU 90×40×12 (montante)" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <LabelF>Unidade</LabelF>
                <Select value={form.unidade} onChange={set("unidade")} options={UNIDADES.map((u) => ({ value: u, label: u }))} />
              </div>
              <div>
                <LabelF required>Quantidade</LabelF>
                <Input type="number" min="0" step="0.001" value={form.quantidade} onChange={set("quantidade")} placeholder="0" />
              </div>
              <div>
                <LabelF required>Custo unit. (R$)</LabelF>
                <Input type="number" min="0" step="0.01" value={form.custo_unitario} onChange={set("custo_unitario")} placeholder="0,00" />
              </div>
            </div>
            {form.quantidade && form.custo_unitario && (
              <div style={{ background: C.darker, borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: C.muted }}>Custo total deste item</span>
                <span style={{ fontWeight: 800, color: C.success }}>
                  {fmt(Number(form.quantidade) * Number(form.custo_unitario))}
                </span>
              </div>
            )}
            <div>
              <LabelF>Observações</LabelF>
              <Input value={form.observacoes} onChange={set("observacoes")} placeholder="Especificações adicionais..." />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <Btn variant="ghost" onClick={() => { setModal(null); setEditId(null); setForm(FORM_VAZIO); }}>Cancelar</Btn>
              <Btn disabled={!form.descricao || !form.quantidade || !form.custo_unitario} onClick={salvarItem}>
                {editId ? "Salvar" : "Adicionar"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal template ── */}
      {templateModal && (
        <Modal title="Importar template Steel Frame" onClose={() => setTemplateModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: C.red + "10", border: `1px solid ${C.red}33`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.text }}>
              Selecione as fases para importar os insumos padrão de uma obra Steel Frame.
              Os valores são referências — ajuste após importar.
            </div>
            {FASES.filter((f) => TEMPLATES[f]).map((fase) => (
              <label key={fase} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                border: `1px solid ${templateFases[fase] ? C.red + "66" : C.border}`,
                background: templateFases[fase] ? C.red + "06" : "transparent",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="checkbox" checked={!!templateFases[fase]}
                    onChange={() => setTemplateFases((p) => ({ ...p, [fase]: !p[fase] }))}
                    style={{ accentColor: C.red, width: 15, height: 15 }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{fase}</span>
                </div>
                <span style={{ fontSize: 11, color: C.muted }}>{TEMPLATES[fase].length} itens</span>
              </label>
            ))}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <Btn variant="ghost" onClick={() => setTemplateModal(false)}>Cancelar</Btn>
              <Btn
                disabled={!Object.values(templateFases).some(Boolean)}
                onClick={aplicarTemplate}
              >
                📥 Importar selecionados
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal Cotar com Fornecedor ── */}
      {cotarItem && (
        <Modal title="🏭 Cotar com Fornecedor" onClose={() => setCotarItem(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.darker, borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
              <span style={{ color: C.muted }}>Item: </span>
              <strong>{cotarItem.descricao}</strong>
              <span style={{ color: C.muted, marginLeft: 8 }}>{cotarItem.unidade}</span>
            </div>
            <div>
              <LabelF required>Fornecedor</LabelF>
              <Select
                value={cotarForm.fornecedor_id}
                onChange={(v) => setCotarForm((f) => ({ ...f, fornecedor_id: v }))}
                options={[
                  { value: "", label: "— Selecione um fornecedor —" },
                  ...fornecedores.filter((f) => f.status === "Ativo").map((f) => ({ value: f.id, label: `${f.nome} · ${f.especialidade}` })),
                ]}
              />
              {fornecedores.length === 0 && (
                <div style={{ fontSize: 11, color: C.warning, marginTop: 4 }}>
                  ⚠️ Cadastre fornecedores no módulo Fornecedores primeiro.
                </div>
              )}
            </div>
            <div>
              <LabelF>Valor unitário da cotação (R$)</LabelF>
              <Input
                type="number" min="0" step="0.01"
                value={cotarForm.valor}
                onChange={(v) => setCotarForm((f) => ({ ...f, valor: v }))}
                placeholder="Deixe vazio para cotação em aberto"
              />
            </div>
            <div>
              <LabelF>Observações</LabelF>
              <Input
                value={cotarForm.observacoes}
                onChange={(v) => setCotarForm((f) => ({ ...f, observacoes: v }))}
                placeholder="Especificações para o fornecedor..."
              />
            </div>
            {cotarForm.valor && (
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={cotarForm.atualizar_custo}
                  onChange={(e) => setCotarForm((f) => ({ ...f, atualizar_custo: e.target.checked }))}
                  style={{ accentColor: C.red, width: 15, height: 15 }}
                />
                Atualizar custo unitário do item com este valor
              </label>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <Btn variant="ghost" onClick={() => setCotarItem(null)}>Cancelar</Btn>
              <Btn disabled={!cotarForm.fornecedor_id} onClick={confirmarCotacao}>
                🏭 Registrar cotação
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Confirm delete ── */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28, width: 340, textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}><Trash2 size={13} /></div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Remover este item?</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn variant="ghost" onClick={() => setConfirm(null)}>Cancelar</Btn>
              <button onClick={() => removerItem(confirm)} style={{
                padding: "10px 24px", background: C.danger, border: "none",
                borderRadius: 6, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}>Remover</button>
            </div>
          </div>
        </div>
      )}

      <div>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Quantitativos</h2>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Planilha de insumos e composição de custos</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {obraId && items.length === 0 && (
              <button onClick={abrirTemplate} style={{
                padding: "8px 16px", background: C.red + "18", border: `1px solid ${C.red}44`,
                borderRadius: 8, color: C.red, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
                📥 Usar template Steel Frame
              </button>
            )}
            {obraId && items.length > 0 && (
              <>
                <button onClick={abrirTemplate} style={{
                  padding: "8px 14px", background: "transparent", border: `1px solid ${C.border}`,
                  borderRadius: 8, color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                }}>📥 Template</button>
                <button onClick={exportarCSV} style={{
                  padding: "8px 14px", background: C.success + "18", border: `1px solid ${C.success}44`,
                  borderRadius: 8, color: C.success, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>⬇ CSV</button>
                <button onClick={exportarPDF} style={{
                  padding: "8px 14px", background: "#4a9eff22", border: "1px solid #4a9eff44",
                  borderRadius: 8, color: "#4a9eff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>📄 PDF</button>
                <Btn onClick={() => { setForm({ ...FORM_VAZIO, fase: obra?.fase || FASES[0] }); setModal("novo"); }}>
                  + Adicionar item
                </Btn>
              </>
            )}
          </div>
        </div>

        {/* Seleção de obra */}
        <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `1px solid ${C.border}`, padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>Obra</div>
          <Select
            value={obraId}
            onChange={(v) => { setObraId(v); setFaseFiltro("Todas"); setCatFiltro("Todas"); }}
            options={[{ value: "", label: "— Selecione uma obra —" }, ...obras.map((o) => ({ value: o.id, label: o.nome }))]}
          />
        </div>

        {!obraId ? (
          <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `1px solid ${C.border}`, padding: "60px 0", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}><Ruler size={36} /></div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Selecione uma obra para começar</div>
            <div style={{ fontSize: 13, color: C.muted }}>A planilha de quantitativos é vinculada a cada obra.</div>
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Carregando…</div>
        ) : items.length === 0 ? (
          <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `1px solid ${C.border}`, padding: "60px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}><ClipboardList size={36} /></div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Nenhum item cadastrado</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Use o template Steel Frame ou adicione itens manualmente.</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={abrirTemplate} style={{
                padding: "10px 20px", background: C.red, border: "none",
                borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>📥 Usar template Steel Frame</button>
              <Btn variant="ghost" onClick={() => { setForm({ ...FORM_VAZIO, fase: obra?.fase || FASES[0] }); setModal("novo"); }}>
                + Adicionar manualmente
              </Btn>
            </div>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Custo total",   value: fmt(totalGeral),          sub: `${filtrados.length} itens`, accent: C.red     },
                { label: "Custo / m²",    value: fmt(custoPorM2),          sub: `${areaTotal} m² total`,     accent: "#4a9eff" },
                { label: "Fases",         value: String(faseGrupos.length),sub: `de ${FASES.length} fases`,  accent: C.warning },
                { label: "Itens totais",  value: String(items.length),     sub: "planilha completa",          accent: C.success },
              ].map((k) => (
                <div key={k.label} style={{ background: C.surface, borderRadius: 14, padding: "14px 16px", border: `1px solid ${C.border}`, borderTop: `3px solid ${k.accent}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>{k.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 900 }}>{k.value}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Filtros */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Todas", ...FASES].map((f) => (
                  <button key={f} onClick={() => setFaseFiltro(f)} style={{
                    padding: "5px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                    fontWeight: faseFiltro === f ? 700 : 400,
                    border: `1px solid ${faseFiltro === f ? C.red : C.border}`,
                    background: faseFiltro === f ? C.red + "18" : "transparent",
                    color: faseFiltro === f ? C.red : C.muted,
                  }}>{f === "Todas" ? "Todas as fases" : f.split(" ")[0]}</button>
                ))}
              </div>
              <select value={catFiltro} onChange={(e) => setCatFiltro(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 11, fontFamily: "inherit" }}>
                <option value="Todas">Todas as categorias</option>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Tabela por fase */}
            {faseGrupos.map((fase) => {
              const itensFase = filtrados.filter((i) => i.fase === fase);
              const totalFase = totalPorFase(fase);
              const percentual = totalGeral > 0 ? (totalFase / totalGeral * 100).toFixed(1) : "0";
              return (
                <div key={fase} style={{ marginBottom: 20 }}>
                  {/* Cabeçalho da fase */}
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: C.darker, borderRadius: "10px 10px 0 0",
                    padding: "10px 16px", border: `1px solid ${C.border}`, borderBottom: "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>{fase}</span>
                      <span style={{ fontSize: 11, color: C.muted }}>{itensFase.length} itens</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ fontSize: 11, color: C.muted }}>{percentual}% do total</span>
                      <span style={{ fontSize: 15, fontWeight: 900, color: C.red }}>{fmt(totalFase)}</span>
                    </div>
                  </div>

                  {/* Tabela */}
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: C.surface }}>
                          <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Categoria</th>
                          <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Descrição</th>
                          <th style={{ padding: "8px 12px", textAlign: "center", fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, width: 60 }}>Und</th>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, width: 100 }}>Quantidade</th>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, width: 120 }}>Custo unit.</th>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, width: 130 }}>Total</th>
                          <th style={{ width: 60 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {itensFase.map((item, idx) => {
                          const total = Number(item.quantidade) * Number(item.custo_unitario);
                          return (
                            <tr key={item.id} style={{ borderTop: `1px solid ${C.border}`, background: idx % 2 === 0 ? C.surface : C.dark + "66" }}>
                              <td style={{ padding: "9px 12px" }}>
                                {item.categoria && (
                                  <span style={{
                                    fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                                    background: (COR_CAT[item.categoria] || C.muted) + "18",
                                    color: COR_CAT[item.categoria] || C.muted,
                                  }}>{item.categoria}</span>
                                )}
                              </td>
                              <td style={{ padding: "9px 12px", fontWeight: 500 }}>
                                {item.descricao}
                                {item.observacoes && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{item.observacoes}</div>}
                              </td>
                              <td style={{ padding: "9px 12px", textAlign: "center", color: C.muted, fontSize: 12 }}>{item.unidade}</td>

                              {/* Quantidade — editável inline */}
                              <td style={{ padding: "9px 12px", textAlign: "right" }}>
                                {editCell?.id === item.id && editCell.field === "quantidade" ? (
                                  <input
                                    autoFocus type="number" value={editVal}
                                    onChange={(e) => setEditVal(e.target.value)}
                                    onBlur={commitEditCell}
                                    onKeyDown={(e) => { if (e.key === "Enter") commitEditCell(); if (e.key === "Escape") setEditCell(null); }}
                                    style={{ width: 80, textAlign: "right", background: C.darker, border: `1px solid ${C.red}`, borderRadius: 4, padding: "3px 6px", fontSize: 12, fontFamily: "inherit", color: C.text, outline: "none" }}
                                  />
                                ) : (
                                  <span
                                    onClick={() => { setEditCell({ id: item.id, field: "quantidade" }); setEditVal(String(item.quantidade)); }}
                                    title="Clique para editar"
                                    style={{ cursor: "pointer", borderBottom: `1px dashed ${C.border}`, paddingBottom: 1 }}
                                  >
                                    {Number(item.quantidade).toLocaleString("pt-BR", { maximumFractionDigits: 3 })}
                                  </span>
                                )}
                              </td>

                              {/* Custo unitário — editável inline */}
                              <td style={{ padding: "9px 12px", textAlign: "right" }}>
                                {editCell?.id === item.id && editCell.field === "custo_unitario" ? (
                                  <input
                                    autoFocus type="number" value={editVal}
                                    onChange={(e) => setEditVal(e.target.value)}
                                    onBlur={commitEditCell}
                                    onKeyDown={(e) => { if (e.key === "Enter") commitEditCell(); if (e.key === "Escape") setEditCell(null); }}
                                    style={{ width: 90, textAlign: "right", background: C.darker, border: `1px solid ${C.red}`, borderRadius: 4, padding: "3px 6px", fontSize: 12, fontFamily: "inherit", color: C.text, outline: "none" }}
                                  />
                                ) : (
                                  <span
                                    onClick={() => { setEditCell({ id: item.id, field: "custo_unitario" }); setEditVal(String(item.custo_unitario)); }}
                                    title="Clique para editar"
                                    style={{ cursor: "pointer", borderBottom: `1px dashed ${C.border}`, paddingBottom: 1 }}
                                  >
                                    {Number(item.custo_unitario).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </span>
                                )}
                              </td>

                              <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: total > 0 ? C.text : C.muted }}>
                                {fmt(total)}
                              </td>
                              <td style={{ padding: "9px 8px", textAlign: "center" }}>
                                <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                                  <button
                                    title="Cotar com fornecedor"
                                    onClick={() => { setCotarItem(item); setCotarForm({ fornecedor_id: "", valor: "", observacoes: "", atualizar_custo: true }); }}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#4a9eff", fontSize: 13, padding: 3 }}>🏭</button>
                                  <button onClick={() => {
                                    setEditId(item.id);
                                    setForm({ fase: item.fase, descricao: item.descricao, unidade: item.unidade, quantidade: String(item.quantidade), custo_unitario: String(item.custo_unitario), categoria: item.categoria || "Outros", observacoes: item.observacoes || "" });
                                    setModal("editar");
                                  }} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 13, padding: 3 }}><Pencil size={13} /></button>
                                  <button onClick={() => setConfirm(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 13, padding: 3 }}><Trash2 size={13} /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {/* Total geral */}
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${C.red}`,
              borderRadius: 10, padding: "16px 20px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>Custo total estimado</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{filtrados.length} itens · {areaTotal} m²</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{fmt(totalGeral)}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{fmt(custoPorM2)}/m²</div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
