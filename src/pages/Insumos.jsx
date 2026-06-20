import { useState, useMemo } from "react";
import { CATALOGO_PRODUTOS } from "../utils/insumosSF";
import { C } from "../utils/constants";
import { fmt } from "../utils/format";

const LS_KEY = "insumos_customizados_v1";

const CATEGORIAS = ["Todas", ...Array.from(new Set(CATALOGO_PRODUTOS.map(p => p.categoria).filter(Boolean))).sort()];

function loadCustom() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch { return {}; }
}
function saveCustom(obj) {
  localStorage.setItem(LS_KEY, JSON.stringify(obj));
}

const fmtBRL = v => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Insumos() {
  const [busca, setBusca]       = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [custom, setCustom]     = useState(loadCustom);
  const [editando, setEditando] = useState(null); // id do produto em edição
  const [editForm, setEditForm] = useState({});
  const [salvoId, setSalvoId]   = useState(null);

  const produtos = useMemo(() => {
    const q = busca.toLowerCase();
    return CATALOGO_PRODUTOS.filter(p => {
      const matchCat = categoria === "Todas" || p.categoria === categoria;
      const matchQ   = !q || p.nome.toLowerCase().includes(q)
        || (p.categoria || "").toLowerCase().includes(q)
        || (p.fabricante || "").toLowerCase().includes(q)
        || (p.codigo || "").toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [busca, categoria]);

  const grupos = useMemo(() => {
    if (categoria !== "Todas" || busca) return null;
    const map = {};
    for (const p of produtos) {
      const cat = p.categoria || "Outros";
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [produtos, categoria, busca]);

  const customizados = Object.keys(custom).length;

  function abrirEdicao(p) {
    const c = custom[p.id] || {};
    setEditForm({
      precoCustom:    c.precoCustom ?? p.preco,
      fornecedor:     c.fornecedor  ?? p.fabricante ?? "",
      urlCustom:      c.urlCustom   ?? p.url ?? "",
      observacao:     c.observacao  ?? "",
    });
    setEditando(p.id);
  }

  function salvar(id) {
    const next = { ...custom, [id]: { ...editForm, precoCustom: Number(editForm.precoCustom) } };
    setCustom(next);
    saveCustom(next);
    setEditando(null);
    setSalvoId(id);
    setTimeout(() => setSalvoId(null), 2000);
  }

  function resetar(id) {
    const next = { ...custom };
    delete next[id];
    setCustom(next);
    saveCustom(next);
    setEditando(null);
  }

  function renderProduto(p) {
    const c = custom[p.id];
    const temCustom = !!c;
    const precoExib = temCustom ? c.precoCustom : p.preco;
    const isEdit    = editando === p.id;
    const foiSalvo  = salvoId === p.id;

    return (
      <div key={p.id} style={{
        borderBottom: `1px solid ${C.border}`,
        background: temCustom ? "rgba(63,122,75,0.03)" : "transparent",
        transition: "background .15s",
      }}>
        {/* Linha principal */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px" }}
          onMouseEnter={e => !isEdit && (e.currentTarget.style.background = "rgba(0,0,0,0.02)")}
          onMouseLeave={e => !isEdit && (e.currentTarget.style.background = "transparent")}
        >
          {/* Indicador customizado */}
          <div style={{ width: 4, flexShrink: 0, alignSelf: "stretch", borderRadius: 2,
            background: temCustom ? "#3f7a4b" : "transparent" }} />

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.3,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.nome}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 3, flexWrap: "wrap" }}>
              {p.categoria && (
                <span style={{ fontSize: 10, color: C.muted, background: C.darker,
                  padding: "1px 7px", borderRadius: 8 }}>{p.categoria}</span>
              )}
              {(c?.fornecedor || p.fabricante) && (
                <span style={{ fontSize: 10, color: C.muted }}>
                  {c?.fornecedor || p.fabricante}
                  {temCustom && c?.fornecedor !== p.fabricante &&
                    <span style={{ color: "#3f7a4b", marginLeft: 4 }}>✓ customizado</span>}
                </span>
              )}
              {p.codigo && <span style={{ fontSize: 10, color: C.muted, fontFamily: "monospace" }}>#{p.codigo}</span>}
            </div>
          </div>

          {/* Un */}
          <div style={{ fontSize: 11, color: C.muted, minWidth: 28, textAlign: "center" }}>{p.un || "un"}</div>

          {/* Preço padrão */}
          <div style={{ minWidth: 80, textAlign: "right" }}>
            <div style={{ fontSize: 12, color: temCustom ? C.muted : C.text, fontWeight: temCustom ? 400 : 700,
              textDecoration: temCustom ? "line-through" : "none" }}>
              {fmtBRL(p.preco)}
            </div>
            {temCustom && (
              <div style={{ fontSize: 13, fontWeight: 800, color: "#3f7a4b" }}>{fmtBRL(c.precoCustom)}</div>
            )}
          </div>

          {/* URL */}
          {(c?.urlCustom || p.url) && (
            <a href={c?.urlCustom || p.url} target="_blank" rel="noopener noreferrer"
              title="Ver produto"
              style={{ fontSize: 11, color: C.steel, textDecoration: "none", flexShrink: 0 }}>
              🔗
            </a>
          )}

          {/* Ações */}
          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            {foiSalvo ? (
              <span style={{ fontSize: 11, color: "#3f7a4b", fontWeight: 700 }}>✓ Salvo</span>
            ) : (
              <button onClick={() => isEdit ? setEditando(null) : abrirEdicao(p)}
                style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                  background: isEdit ? C.darker : C.surface, border: `1px solid ${C.border}`,
                  color: C.text, fontFamily: "inherit" }}>
                {isEdit ? "Cancelar" : "✏ Editar"}
              </button>
            )}
            {temCustom && !isEdit && (
              <button onClick={() => resetar(p.id)}
                style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                  background: "none", border: `1px solid ${C.border}`, color: C.danger, fontFamily: "inherit" }}>
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Painel de edição inline */}
        {isEdit && (
          <div style={{ padding: "12px 16px 16px 32px", background: C.surface2,
            borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>
                  Preço do seu fornecedor (R$)
                </label>
                <input type="number" value={editForm.precoCustom} min={0} step={0.01}
                  onChange={e => setEditForm(f => ({ ...f, precoCustom: e.target.value }))}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: `1px solid ${C.border}`,
                    fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                />
                <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>
                  Padrão Espaço Smart: {fmtBRL(p.preco)}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>
                  Fornecedor local
                </label>
                <input value={editForm.fornecedor}
                  onChange={e => setEditForm(f => ({ ...f, fornecedor: e.target.value }))}
                  placeholder={p.fabricante || "Ex: Barbieri, Gypcenter..."}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: `1px solid ${C.border}`,
                    fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>
                  URL do produto (seu fornecedor)
                </label>
                <input value={editForm.urlCustom}
                  onChange={e => setEditForm(f => ({ ...f, urlCustom: e.target.value }))}
                  placeholder="https://..."
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: `1px solid ${C.border}`,
                    fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>
                Observação interna
              </label>
              <input value={editForm.observacao}
                onChange={e => setEditForm(f => ({ ...f, observacao: e.target.value }))}
                placeholder="Ex: Negociar desconto acima de 50 unidades..."
                style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: `1px solid ${C.border}`,
                  fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setEditando(null)}
                style={{ padding: "7px 16px", borderRadius: 7, border: `1px solid ${C.border}`,
                  background: "none", color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                Cancelar
              </button>
              <button onClick={() => salvar(p.id)}
                style={{ padding: "7px 20px", borderRadius: 7, border: "none",
                  background: C.red, color: "#fff", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit" }}>
                ✓ Salvar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", minHeight: "100vh", background: C.bg }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
          <div style={{ width: 4, height: 42, borderRadius: 3, background: C.red, flexShrink: 0, marginTop: 2 }} />
          <div>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1.1 }}>
              Banco de Insumos
            </h2>
            <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 12.5 }}>
              {CATALOGO_PRODUTOS.length} produtos · Espaço Smart (Jun/2026) ·
              {customizados > 0 && (
                <span style={{ color: "#3f7a4b", fontWeight: 700, marginLeft: 6 }}>
                  {customizados} personalizado{customizados !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Stats rápidos */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          {[
            { label: "Produtos", valor: CATALOGO_PRODUTOS.length },
            { label: "Categorias", valor: CATEGORIAS.length - 1 },
            { label: "Personalizados", valor: customizados, color: "#3f7a4b" },
            { label: "Menor preço", valor: fmtBRL(Math.min(...CATALOGO_PRODUTOS.map(p => p.preco))) },
            { label: "Maior preço", valor: fmtBRL(Math.max(...CATALOGO_PRODUTOS.map(p => p.preco))) },
          ].map(s => (
            <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: "10px 16px", minWidth: 110 }}>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.color || C.text }}>{s.valor}</div>
            </div>
          ))}
        </div>

        {/* Busca + categoria */}
        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, fabricante, código..."
            style={{ flex: 1, minWidth: 240, padding: "9px 14px", borderRadius: 8,
              border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit",
              outline: "none", background: C.surface }}
          />
          {busca && (
            <button onClick={() => setBusca("")}
              style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
                background: "none", color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              × Limpar
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATEGORIAS.map(cat => (
            <button key={cat} onClick={() => setCategoria(cat)}
              style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontFamily: "inherit",
                cursor: "pointer", transition: "all .12s",
                background: categoria === cat ? C.red : C.surface,
                border: `1px solid ${categoria === cat ? C.red : C.border}`,
                color: categoria === cat ? "#fff" : C.muted,
                fontWeight: categoria === cat ? 700 : 400 }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        {/* Cabeçalho */}
        <div style={{ display: "flex", gap: 10, padding: "9px 16px",
          background: C.darker, borderBottom: `1px solid ${C.border}`,
          fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>
          <div style={{ width: 4, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>Produto</div>
          <div style={{ minWidth: 28, textAlign: "center" }}>Un</div>
          <div style={{ minWidth: 80, textAlign: "right" }}>Preço</div>
          <div style={{ minWidth: 16 }} />
          <div style={{ minWidth: 110 }} />
        </div>

        {produtos.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: C.muted, fontSize: 13 }}>
            Nenhum produto encontrado
          </div>
        ) : grupos ? (
          grupos.map(([cat, prods]) => (
            <div key={cat}>
              <div style={{ padding: "7px 16px 5px 32px", fontSize: 10, fontWeight: 800,
                letterSpacing: 1.2, color: C.muted, textTransform: "uppercase",
                background: C.surface2, borderBottom: `1px solid ${C.border}` }}>
                {cat} <span style={{ fontWeight: 400, opacity: 0.6 }}>({prods.length})</span>
              </div>
              {prods.map(renderProduto)}
            </div>
          ))
        ) : (
          produtos.map(renderProduto)
        )}

        {/* Rodapé */}
        <div style={{ padding: "10px 16px", background: C.surface2, borderTop: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.muted }}>
            {produtos.length} produto{produtos.length !== 1 ? "s" : ""} exibido{produtos.length !== 1 ? "s" : ""}
          </span>
          {customizados > 0 && (
            <button
              onClick={() => {
                if (confirm(`Resetar todos os ${customizados} itens personalizados?`)) {
                  setCustom({});
                  saveCustom({});
                }
              }}
              style={{ fontSize: 11, color: C.danger, background: "none", border: "none",
                cursor: "pointer", fontFamily: "inherit" }}>
              Resetar todas as personalizações
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
        💡 As personalizações ficam salvas neste dispositivo. Preço padrão = Espaço Smart Jun/2026.
        Para atualizar os preços do catálogo, rode <code style={{ background: C.darker, padding: "1px 5px", borderRadius: 4 }}>scratch/scrape_catalog.py</code> + <code style={{ background: C.darker, padding: "1px 5px", borderRadius: 4 }}>scratch/build_insumos.py</code>.
      </div>
    </div>
  );
}
