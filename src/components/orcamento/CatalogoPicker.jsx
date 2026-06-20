import { useState, useMemo, useRef, useEffect } from "react";
import { CATALOGO_PRODUTOS } from "../../utils/insumosSF";
import { C } from "../../utils/constants";
import { fmt } from "../../utils/format";

const CATEGORIAS = ["Todas", ...Array.from(new Set(CATALOGO_PRODUTOS.map(p => p.categoria).filter(Boolean))).sort()];

export default function CatalogoPicker({ onAdd, onClose }) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [qtds, setQtds] = useState({});
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const produtos = useMemo(() => {
    const q = busca.toLowerCase();
    return CATALOGO_PRODUTOS.filter(p => {
      const matchCat = categoria === "Todas" || p.categoria === categoria;
      const matchBusca = !q || p.nome.toLowerCase().includes(q) || (p.categoria || "").toLowerCase().includes(q) || (p.subcategoria || "").toLowerCase().includes(q);
      return matchCat && matchBusca;
    });
  }, [busca, categoria]);

  function handleAdd(produto) {
    const qtd = Number(qtds[produto.id]) || 1;
    onAdd({
      produtoId:    produto.id,
      nome:         produto.nome,
      preco:        produto.preco * qtd,
      precoUnit:    produto.preco,
      unidade:      produto.un || "un",
      quantidade:   qtd,
    });
  }

  function setQtd(id, val) {
    setQtds(q => ({ ...q, [id]: Math.max(1, Number(val) || 1) }));
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, width: "100%", maxWidth: 720,
        maxHeight: "90vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Catálogo de Produtos</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Espaço Smart · {CATALOGO_PRODUTOS.length} produtos</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
          </div>

          {/* Busca */}
          <input
            ref={inputRef}
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, categoria..."
            style={{
              width: "100%", padding: "9px 14px", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)",
              color: "#fff", fontSize: 13, fontFamily: "inherit", outline: "none",
              boxSizing: "border-box",
            }}
          />

          {/* Filtros de categoria */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {CATEGORIAS.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoria(cat)}
                style={{
                  padding: "4px 10px", borderRadius: 20, fontSize: 11, fontFamily: "inherit",
                  cursor: "pointer", transition: "all .12s",
                  background: categoria === cat ? "#981915" : "rgba(255,255,255,0.06)",
                  border: categoria === cat ? "1px solid #981915" : "1px solid rgba(255,255,255,0.1)",
                  color: categoria === cat ? "#fff" : "rgba(255,255,255,0.5)",
                  fontWeight: categoria === cat ? 700 : 400,
                }}
              >{cat}</button>
            ))}
          </div>
        </div>

        {/* Lista de produtos */}
        <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
          {produtos.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
              Nenhum produto encontrado
            </div>
          ) : (
            produtos.map(p => {
              const qtd = qtds[p.id] || 1;
              const total = p.preco * qtd;
              return (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 24px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  transition: "background .1s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#e8e8f0", lineHeight: 1.35, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.nome}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {p.categoria && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.06)", padding: "2px 7px", borderRadius: 10 }}>{p.categoria}</span>}
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{p.un || "un"}</span>
                    </div>
                  </div>

                  {/* Preço */}
                  <div style={{ textAlign: "right", minWidth: 80 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#981915" }}>{fmt(p.preco)}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>por {p.un || "un"}</div>
                  </div>

                  {/* Quantidade */}
                  <input
                    type="number"
                    min={1}
                    value={qtd}
                    onChange={e => setQtd(p.id, e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{
                      width: 52, padding: "6px 8px", borderRadius: 7, textAlign: "center",
                      border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)",
                      color: "#fff", fontSize: 13, fontFamily: "inherit", outline: "none",
                    }}
                  />

                  {/* Total + botão */}
                  <div style={{ textAlign: "right", minWidth: 70 }}>
                    {qtd > 1 && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{fmt(total)}</div>}
                    <button
                      onClick={() => handleAdd(p)}
                      style={{
                        padding: "6px 14px", borderRadius: 7, background: "#981915", border: "none",
                        color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                        whiteSpace: "nowrap",
                      }}
                    >+ Adicionar</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 24px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{produtos.length} produto{produtos.length !== 1 ? "s" : ""} encontrado{produtos.length !== 1 ? "s" : ""}</span>
          <button onClick={onClose} style={{ background: "none", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 7, color: "rgba(255,255,255,0.5)", padding: "6px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
