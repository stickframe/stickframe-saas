import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { CATALOGO_PRODUTOS } from "../../utils/insumosSF";
import { C } from "../../utils/constants";
import { fmt } from "../../utils/format";

const FAVORITOS_KEY = "catalogo_favoritos";

const CATEGORIAS = [
  "Favoritos",
  "Todas",
  ...Array.from(new Set(CATALOGO_PRODUTOS.map(p => p.categoria).filter(Boolean))).sort(),
];

function loadFavoritos() {
  try { return new Set(JSON.parse(localStorage.getItem(FAVORITOS_KEY) || "[]")); }
  catch { return new Set(); }
}

function saveFavoritos(set) {
  localStorage.setItem(FAVORITOS_KEY, JSON.stringify([...set]));
}

export default function CatalogoPicker({ onAdd, onClose }) {
  const [busca, setBusca]       = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [qtds, setQtds]         = useState({});
  const [favoritos, setFavoritos] = useState(loadFavoritos);
  const [adicionados, setAdicionados] = useState(new Set());
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const toggleFavorito = useCallback((id, e) => {
    e.stopPropagation();
    setFavoritos(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveFavoritos(next);
      return next;
    });
  }, []);

  const produtos = useMemo(() => {
    const q = busca.toLowerCase();
    return CATALOGO_PRODUTOS.filter(p => {
      if (categoria === "Favoritos") return favoritos.has(p.id);
      const matchCat = categoria === "Todas" || p.categoria === categoria;
      const matchBusca = !q
        || p.nome.toLowerCase().includes(q)
        || (p.categoria || "").toLowerCase().includes(q)
        || (p.subcategoria || "").toLowerCase().includes(q)
        || (p.fabricante || "").toLowerCase().includes(q);
      return matchCat && matchBusca;
    });
  }, [busca, categoria, favoritos]);

  // Agrupa por categoria quando mostrando "Todas" sem busca
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

  function handleAdd(produto) {
    const qtd = Number(qtds[produto.id]) || 1;
    onAdd({
      produtoId:  produto.id,
      nome:       produto.nome,
      categoria:  produto.categoria || "",
      preco:      produto.preco * qtd,
      precoUnit:  produto.preco,
      unidade:    produto.un || "un",
      quantidade: qtd,
    });
    setAdicionados(prev => new Set([...prev, produto.id]));
    // Reset visual "adicionado" após 1.5s
    setTimeout(() => setAdicionados(prev => { const n = new Set(prev); n.delete(produto.id); return n; }), 1500);
  }

  function setQtd(id, val) {
    setQtds(q => ({ ...q, [id]: Math.max(1, Number(val) || 1) }));
  }

  function renderProduto(p) {
    const qtd = qtds[p.id] || 1;
    const total = p.preco * qtd;
    const isFav = favoritos.has(p.id);
    const foiAdicionado = adicionados.has(p.id);

    return (
      <div key={p.id} style={{
        display: "flex", alignItems: "center", gap: 10, padding: "9px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        transition: "background .1s",
      }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        {/* Favorito */}
        <button
          onClick={e => toggleFavorito(p.id, e)}
          title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: "2px 4px",
            fontSize: 14, color: isFav ? "#f59e0b" : "rgba(255,255,255,0.2)",
            transition: "color .15s", flexShrink: 0,
          }}
        >★</button>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#e8e8f0", lineHeight: 1.3, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.nome}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {p.categoria && (
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 8 }}>
                {p.categoria}
              </span>
            )}
            {p.fabricante && (
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{p.fabricante}</span>
            )}
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{p.un || "un"}</span>
          </div>
        </div>

        {/* Preço */}
        <div style={{ textAlign: "right", minWidth: 76, flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#c0392b" }}>{fmt(p.preco)}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>/{p.un || "un"}</div>
        </div>

        {/* Quantidade */}
        <input
          type="number" min={1} value={qtd}
          onChange={e => setQtd(p.id, e.target.value)}
          onClick={e => e.stopPropagation()}
          style={{
            width: 48, padding: "5px 6px", borderRadius: 7, textAlign: "center", flexShrink: 0,
            border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)",
            color: "#fff", fontSize: 12, fontFamily: "inherit", outline: "none",
          }}
        />

        {/* Total + botão */}
        <div style={{ textAlign: "right", minWidth: 88, flexShrink: 0 }}>
          {qtd > 1 && (
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>{fmt(total)}</div>
          )}
          <button
            onClick={() => handleAdd(p)}
            style={{
              padding: "5px 12px", borderRadius: 7, border: "none",
              background: foiAdicionado ? "#3f7a4b" : "#981915",
              color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", whiteSpace: "nowrap", transition: "background .2s",
            }}
          >{foiAdicionado ? "✓ Ok!" : "+ Adicionar"}</button>
        </div>
      </div>
    );
  }

  const totalFavs = favoritos.size;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, width: "100%", maxWidth: 760,
        maxHeight: "90vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Catálogo de Produtos</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                Espaço Smart · {CATALOGO_PRODUTOS.length} produtos
                {totalFavs > 0 && <span style={{ color: "#f59e0b", marginLeft: 8 }}>★ {totalFavs} favorito{totalFavs !== 1 ? "s" : ""}</span>}
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
          </div>

          <input
            ref={inputRef}
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, categoria, fabricante..."
            style={{
              width: "100%", padding: "9px 14px", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)",
              color: "#fff", fontSize: 13, fontFamily: "inherit", outline: "none",
              boxSizing: "border-box",
            }}
          />

          {/* Categorias */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>
            {CATEGORIAS.map(cat => {
              const isActive = categoria === cat;
              const isFavCat = cat === "Favoritos";
              return (
                <button key={cat} onClick={() => setCategoria(cat)} style={{
                  padding: "3px 10px", borderRadius: 20, fontSize: 11, fontFamily: "inherit",
                  cursor: "pointer", transition: "all .12s",
                  background: isActive ? (isFavCat ? "#b07a1e" : "#981915") : "rgba(255,255,255,0.05)",
                  border: isActive ? `1px solid ${isFavCat ? "#b07a1e" : "#981915"}` : "1px solid rgba(255,255,255,0.09)",
                  color: isActive ? "#fff" : (isFavCat ? "#f59e0b" : "rgba(255,255,255,0.45)"),
                  fontWeight: isActive ? 700 : 400,
                }}>
                  {isFavCat ? `★ ${cat}` : cat}
                  {isFavCat && totalFavs > 0 && ` (${totalFavs})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {produtos.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
              {categoria === "Favoritos"
                ? "Nenhum favorito ainda. Clique em ★ nos produtos para favoritar."
                : "Nenhum produto encontrado"}
            </div>
          ) : grupos ? (
            /* Agrupado por categoria */
            grupos.map(([cat, prods]) => (
              <div key={cat}>
                <div style={{
                  padding: "8px 20px 5px", fontSize: 10, fontWeight: 700, letterSpacing: 1,
                  color: "rgba(255,255,255,0.3)", textTransform: "uppercase",
                  background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                  {cat} <span style={{ fontWeight: 400, opacity: 0.5 }}>({prods.length})</span>
                </div>
                {prods.map(renderProduto)}
              </div>
            ))
          ) : (
            /* Lista plana (busca ativa ou categoria específica) */
            produtos.map(renderProduto)
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "11px 22px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            {produtos.length} produto{produtos.length !== 1 ? "s" : ""}
            {adicionados.size > 0 && <span style={{ color: "#6ee7b7", marginLeft: 10 }}>✓ {adicionados.size} adicionado{adicionados.size !== 1 ? "s" : ""}</span>}
          </span>
          <button onClick={onClose} style={{
            background: "none", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 7,
            color: "rgba(255,255,255,0.5)", padding: "6px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
