import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { CATALOGO_PRODUTOS } from "../../utils/insumosSF";
import { fmt } from "../../utils/format";

const FAVORITOS_KEY = "catalogo_favoritos";

function loadFavoritos() {
  try { return new Set(JSON.parse(localStorage.getItem(FAVORITOS_KEY) || "[]")); }
  catch { return new Set(); }
}
function saveFavoritos(set) {
  localStorage.setItem(FAVORITOS_KEY, JSON.stringify([...set]));
}

const CATS_ORDER = Array.from(new Set(CATALOGO_PRODUTOS.map(p => p.categoria).filter(Boolean))).sort();

// Category icon map (SVG paths)
const CAT_ICONS = {
  "Fechamento":        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:21,height:21}}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  "Isolamento":        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:21,height:21}}><path d="M12 2L2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
  "Estrutura":         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:21,height:21}}><path d="M6 22V4m0 0h12v18M6 4H2v18h4M18 4h4v18h-4"/><path d="M10 22v-5h4v5"/></svg>,
  "Cobertura":         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:21,height:21}}><path d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"/></svg>,
  "Impermeabilização": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:21,height:21}}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  "Fixação":           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:21,height:21}}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  "Elétrica":          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:21,height:21}}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  "Hidráulica":        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:21,height:21}}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  "Acabamento":        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:21,height:21}}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
};
const DEFAULT_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:21,height:21}}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 014 0"/></svg>;

function getCatIcon(cat) { return CAT_ICONS[cat] || DEFAULT_ICON; }

const S = {
  ovl: {
    position:"fixed",inset:0,background:"rgba(26,25,28,.5)",backdropFilter:"blur(3px)",
    display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:30,
  },
  modal: {
    width:"min(960px,100%)",height:"min(86vh,820px)",background:"#fff",
    borderRadius:18,boxShadow:"0 24px 70px -20px rgba(0,0,0,.5)",
    display:"flex",flexDirection:"column",overflow:"hidden",
    animation:"catin .22s cubic-bezier(.2,.7,.3,1)",
  },
};

export default function CatalogoPicker({ onAdd, onClose }) {
  const [busca, setBusca]       = useState("");
  const [catAtiva, setCatAtiva] = useState("Todas");
  const [favoritos, setFavoritos] = useState(loadFavoritos);
  const [cart, setCart]         = useState({}); // { [produtoId]: quantity }
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const toggleFav = useCallback((id, e) => {
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
      if (catAtiva === "Favoritos") return favoritos.has(p.id);
      const matchCat = catAtiva === "Todas" || p.categoria === catAtiva;
      const matchBusca = !q
        || p.nome.toLowerCase().includes(q)
        || (p.categoria || "").toLowerCase().includes(q)
        || (p.fabricante || "").toLowerCase().includes(q)
        || (p.codigo || "").toLowerCase().includes(q);
      return matchCat && matchBusca;
    });
  }, [busca, catAtiva, favoritos]);

  const grupos = useMemo(() => {
    if (catAtiva !== "Todas" || busca) return null;
    const map = {};
    for (const p of produtos) {
      const cat = p.categoria || "Outros";
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [produtos, catAtiva, busca]);

  const cartCount = useMemo(() => Object.values(cart).reduce((s, q) => s + q, 0), [cart]);
  const cartTotal = useMemo(() => {
    return CATALOGO_PRODUTOS.reduce((s, p) => {
      const q = cart[p.id] || 0;
      return s + p.preco * q;
    }, 0);
  }, [cart]);

  function toggleCart(produto) {
    setCart(prev => {
      if (prev[produto.id]) {
        const next = { ...prev };
        delete next[produto.id];
        return next;
      }
      return { ...prev, [produto.id]: 1 };
    });
  }

  function setQtd(id, val) {
    const q = Math.max(1, parseInt(val) || 1);
    setCart(prev => ({ ...prev, [id]: q }));
  }

  function handleAdicionarTodos() {
    const ids = Object.keys(cart);
    if (!ids.length) return;
    for (const id of ids) {
      const p = CATALOGO_PRODUTOS.find(x => x.id === id);
      if (!p) continue;
      const qtd = cart[id];
      onAdd({
        produtoId:  p.id,
        nome:       p.nome,
        categoria:  p.categoria || "",
        preco:      p.preco * qtd,
        precoUnit:  p.preco,
        unidade:    p.un || "un",
        quantidade: qtd,
      });
    }
    onClose();
  }

  const chips = ["Todas", "Favoritos", ...CATS_ORDER];

  return (
    <>
      <style>{`
        @keyframes catin{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
        @keyframes cpulse{0%{box-shadow:0 0 0 0 rgba(63,122,75,.45)}70%{box-shadow:0 0 0 6px rgba(63,122,75,0)}100%{box-shadow:0 0 0 0 rgba(63,122,75,0)}}
        .cp-scrollbar::-webkit-scrollbar{width:9px}
        .cp-scrollbar::-webkit-scrollbar-thumb{background:#e7e1d8;border-radius:9px;border:2px solid #fff}
        .cp-chips::-webkit-scrollbar{display:none}
        .cp-prow:hover{background:#faf8f4}
        .cp-fav:hover svg{stroke:#c0892d}
        .cp-stp-btn:hover{background:#f3e7e5;color:#981915}
        .cp-add:hover{background:#7d1411}
        .cp-add-done:hover{background:#2d5c37}
        .cp-chip:hover{border-color:#d8cfc2;color:#26231f}
        .cp-x:hover{background:#f3e7e5;border-color:#e6c9c6}
        .cp-x:hover svg{stroke:#981915}
      `}</style>
      <div style={S.ovl} onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={S.modal}>

          {/* Header */}
          <div style={{
            padding:"20px 24px 17px",
            borderBottom:"1px solid #efeae2",
            display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,flexShrink:0,
          }}>
            <div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:25,color:"#26231f",lineHeight:1.05,letterSpacing:.2}}>
                Catálogo de Produtos
              </div>
              <div style={{display:"flex",alignItems:"center",gap:9,marginTop:7,fontSize:12.5,color:"#57514a"}}>
                <span style={{
                  display:"inline-flex",alignItems:"center",gap:6,
                  background:"#faf8f4",border:"1px solid #e7e1d8",borderRadius:20,
                  padding:"3px 10px 3px 8px",fontWeight:700,fontSize:11.5,color:"#26231f",
                }}>
                  <span style={{
                    width:7,height:7,borderRadius:"50%",background:"#3f7a4b",flexShrink:0,
                    animation:"cpulse 2s infinite",
                  }}/>
                  Espaço Smart
                </span>
                <span style={{width:3,height:3,borderRadius:"50%",background:"#8c847a"}}/>
                <span>{CATALOGO_PRODUTOS.length} produtos</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="cp-x"
              style={{
                width:36,height:36,borderRadius:9,background:"#faf8f4",border:"1px solid #e7e1d8",
                display:"grid",placeItems:"center",cursor:"pointer",flexShrink:0,transition:".14s",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#57514a" strokeWidth="2" style={{width:17,height:17}}>
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Tools: search + chips */}
          <div style={{padding:"15px 24px 0",flexShrink:0}}>
            {/* Search */}
            <div style={{position:"relative"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#8c847a" strokeWidth="2"
                style={{position:"absolute",left:15,top:"50%",transform:"translateY(-50%)",width:17,height:17}}>
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                ref={inputRef}
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar por nome, categoria, fabricante..."
                style={{
                  width:"100%",background:"#faf8f4",border:"1.5px solid #e7e1d8",borderRadius:11,
                  padding:"12px 14px 12px 42px",fontFamily:"'Hanken Grotesk',sans-serif",
                  fontSize:14,color:"#26231f",outline:"none",transition:".14s",boxSizing:"border-box",
                }}
                onFocus={e => { e.target.style.borderColor="#981915"; e.target.style.background="#fff"; }}
                onBlur={e => { e.target.style.borderColor="#e7e1d8"; e.target.style.background="#faf8f4"; }}
              />
            </div>

            {/* Chips */}
            <div className="cp-chips" style={{
              display:"flex",gap:8,overflowX:"auto",padding:"14px 0 15px",scrollbarWidth:"none",
            }}>
              {chips.map(cat => {
                const isActive = catAtiva === cat;
                const isFav = cat === "Favoritos";
                const count = cat === "Todas"
                  ? CATALOGO_PRODUTOS.length
                  : cat === "Favoritos"
                  ? favoritos.size
                  : CATALOGO_PRODUTOS.filter(p => p.categoria === cat).length;
                return (
                  <button
                    key={cat}
                    className="cp-chip"
                    onClick={() => setCatAtiva(cat)}
                    style={{
                      flexShrink:0,display:"inline-flex",alignItems:"center",gap:6,
                      background: isActive ? (isFav ? "#c0892d" : "#981915") : "#fff",
                      border: isActive
                        ? `1.5px solid ${isFav ? "#c0892d" : "#981915"}`
                        : "1.5px solid #e7e1d8",
                      borderRadius:20,padding:"7px 14px",
                      fontFamily:"'Hanken Grotesk',sans-serif",fontSize:12.5,fontWeight:600,
                      color: isActive ? "#fff" : (isFav ? "#c0892d" : "#57514a"),
                      cursor:"pointer",whiteSpace:"nowrap",transition:".13s",
                    }}
                  >
                    {isFav && (
                      <svg viewBox="0 0 24 24" strokeWidth="2" fill={isActive?"#fff":"#c0892d"}
                        stroke={isActive?"#fff":"#c0892d"} style={{width:13,height:13}}>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    )}
                    {cat}
                    <span style={{
                      fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:11.5,
                      opacity: isActive ? .85 : .6,
                    }}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div className="cp-scrollbar" style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:"2px 12px 8px"}}>
            {produtos.length === 0 ? (
              <div style={{textAlign:"center",padding:40,color:"#8c847a",fontSize:13}}>
                {catAtiva === "Favoritos"
                  ? "Nenhum favorito ainda. Clique na estrela nos produtos para favoritar."
                  : "Nenhum produto encontrado"}
              </div>
            ) : grupos ? (
              grupos.map(([cat, prods]) => (
                <div key={cat}>
                  <GrpHeader cat={cat} count={prods.length} />
                  {prods.map(p => (
                    <PRow key={p.id} p={p}
                      isFav={favoritos.has(p.id)} inCart={!!cart[p.id]} qtd={cart[p.id] || 1}
                      onFav={toggleFav} onToggleCart={toggleCart} onQtd={setQtd}
                    />
                  ))}
                </div>
              ))
            ) : (
              produtos.map(p => (
                <PRow key={p.id} p={p}
                  isFav={favoritos.has(p.id)} inCart={!!cart[p.id]} qtd={cart[p.id] || 1}
                  onFav={toggleFav} onToggleCart={toggleCart} onQtd={setQtd}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            flexShrink:0,padding:"14px 24px",borderTop:"1px solid #e7e1d8",
            background:"#faf8f4",display:"flex",alignItems:"center",gap:16,
          }}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:"#26231f"}}>
                {cartCount > 0
                  ? <><b style={{fontFamily:"'Barlow Condensed',sans-serif",color:"#981915"}}>{cartCount}</b> {cartCount === 1 ? "item selecionado" : "itens selecionados"}</>
                  : "Nenhum item selecionado"
                }
              </div>
              {cartCount > 0 && (
                <div style={{fontSize:11.5,color:"#8c847a",marginTop:2}}>
                  Clique em "+ Adicionar" nos produtos para selecionar
                </div>
              )}
            </div>
            {cartCount > 0 && (
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10.5,fontWeight:800,letterSpacing:.8,textTransform:"uppercase",color:"#8c847a"}}>Total</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:24,color:"#26231f",lineHeight:1,marginTop:2}}>
                  {fmt(cartTotal)}
                </div>
              </div>
            )}
            <button
              onClick={handleAdicionarTodos}
              disabled={cartCount === 0}
              style={{
                display:"inline-flex",alignItems:"center",gap:8,
                background: cartCount > 0 ? "#981915" : "#e7e1d8",
                color: cartCount > 0 ? "#fff" : "#8c847a",
                border:"none",borderRadius:11,padding:"12px 20px",
                fontFamily:"'Hanken Grotesk',sans-serif",fontWeight:700,fontSize:14,
                cursor: cartCount > 0 ? "pointer" : "not-allowed",transition:".14s",whiteSpace:"nowrap",
              }}
              onMouseEnter={e => cartCount > 0 && (e.currentTarget.style.background="#7d1411")}
              onMouseLeave={e => cartCount > 0 && (e.currentTarget.style.background="#981915")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{width:16,height:16}}>
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
              Adicionar ao orçamento
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

function GrpHeader({ cat, count }) {
  return (
    <div style={{
      position:"sticky",top:0,
      background:"linear-gradient(#fff 70%, rgba(255,255,255,0))",
      padding:"13px 12px 7px",display:"flex",alignItems:"center",gap:9,zIndex:2,
    }}>
      <span style={{fontSize:10.5,fontWeight:800,letterSpacing:1.4,textTransform:"uppercase",color:"#8c847a"}}>
        {cat}
      </span>
      <span style={{
        fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:11.5,
        color:"#981915",background:"#f3e7e5",padding:"1px 8px",borderRadius:20,
      }}>{count}</span>
      <div style={{flex:1,height:1,background:"#efeae2"}}/>
    </div>
  );
}

function PRow({ p, isFav, inCart, qtd, onFav, onToggleCart, onQtd }) {
  return (
    <div
      className="cp-prow"
      style={{
        display:"grid",
        gridTemplateColumns:"30px 44px minmax(0,1fr) auto auto auto",
        alignItems:"center",gap:13,padding:"11px 12px",borderRadius:12,transition:".12s",
      }}
    >
      {/* Fav button */}
      <button
        className="cp-fav"
        onClick={e => onFav(p.id, e)}
        title={isFav ? "Remover dos favoritos" : "Favoritar"}
        style={{
          width:30,height:30,display:"grid",placeItems:"center",
          cursor:"pointer",borderRadius:8,background:"none",border:"none",
          justifySelf:"start",
        }}
      >
        <svg viewBox="0 0 24 24" strokeWidth="1.9" style={{width:18,height:18,transition:".13s"}}
          fill={isFav ? "#c0892d" : "none"}
          stroke={isFav ? "#c0892d" : "#8c847a"}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </button>

      {/* Category icon tile */}
      <div style={{
        width:44,height:44,borderRadius:10,background:"#faf8f4",
        border:"1px solid #e7e1d8",display:"grid",placeItems:"center",color:"#57514a",
      }}>
        {getCatIcon(p.categoria)}
      </div>

      {/* Product info */}
      <div style={{minWidth:0}}>
        <div style={{fontSize:13.5,fontWeight:700,color:"#26231f",lineHeight:1.25}}>
          {p.nome}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7,marginTop:5,flexWrap:"wrap"}}>
          {p.categoria && (
            <span style={{
              fontSize:10,fontWeight:700,letterSpacing:.3,padding:"2px 7px",borderRadius:5,
              background:"#faf8f4",border:"1px solid #e7e1d8",color:"#57514a",
            }}>{p.categoria}</span>
          )}
          {p.fabricante && (
            <span style={{
              fontSize:10,fontWeight:700,letterSpacing:.3,padding:"2px 7px",borderRadius:5,
              background:"#eef2f7",border:"1px solid #dde6f0",color:"#3b6ea5",
            }}>{p.fabricante}</span>
          )}
          <span style={{fontSize:11,color:"#8c847a",fontWeight:600}}>{p.un || "un"}</span>
        </div>
      </div>

      {/* Price */}
      <div style={{textAlign:"right",whiteSpace:"nowrap"}}>
        <div style={{
          fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:18,
          color:"#26231f",lineHeight:1,
        }}>{fmt(p.preco)}</div>
        <div style={{fontSize:10.5,color:"#8c847a",fontWeight:600,marginTop:2}}>/{p.un || "un"}</div>
      </div>

      {/* Stepper */}
      <div style={{
        display:"inline-flex",alignItems:"center",
        border:"1.5px solid #e7e1d8",borderRadius:9,overflow:"hidden",background:"#fff",
      }}>
        <button
          className="cp-stp-btn"
          onClick={() => inCart && onQtd(p.id, qtd - 1)}
          style={{
            width:30,height:34,border:"none",background:"#faf8f4",color:"#57514a",
            fontSize:17,fontWeight:600,cursor:"pointer",display:"grid",placeItems:"center",
            lineHeight:1,transition:".12s",
          }}
        >−</button>
        <input
          type="number" min={1} value={qtd}
          onChange={e => inCart && onQtd(p.id, e.target.value)}
          onClick={e => e.stopPropagation()}
          style={{
            width:38,height:34,border:"none",
            borderLeft:"1px solid #e7e1d8",borderRight:"1px solid #e7e1d8",
            textAlign:"center",fontFamily:"'Barlow Condensed',sans-serif",
            fontWeight:700,fontSize:15,color:"#26231f",outline:"none",background:"#fff",
          }}
        />
        <button
          className="cp-stp-btn"
          onClick={() => inCart ? onQtd(p.id, qtd + 1) : onToggleCart(p)}
          style={{
            width:30,height:34,border:"none",background:"#faf8f4",color:"#57514a",
            fontSize:17,fontWeight:600,cursor:"pointer",display:"grid",placeItems:"center",
            lineHeight:1,transition:".12s",
          }}
        >+</button>
      </div>

      {/* Add button */}
      <button
        className={inCart ? "cp-add-done" : "cp-add"}
        onClick={() => onToggleCart(p)}
        style={{
          display:"inline-flex",alignItems:"center",gap:6,
          background: inCart ? "#3f7a4b" : "#981915",
          color:"#fff",border:"none",borderRadius:9,padding:"0 15px",height:36,
          fontFamily:"'Hanken Grotesk',sans-serif",fontWeight:700,fontSize:13,
          cursor:"pointer",transition:".14s",whiteSpace:"nowrap",
        }}
      >
        {inCart ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{width:15,height:15}}>
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            No carrinho
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{width:15,height:15}}>
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Adicionar
          </>
        )}
      </button>
    </div>
  );
}

