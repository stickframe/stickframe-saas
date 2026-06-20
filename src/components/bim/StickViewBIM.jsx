/**
 * StickView™ — BIM Inteligente
 * Gêmeo digital procedural conectado ao catálogo de produtos, orçamento e compras.
 * Elementos clicáveis com raycasting Three.js → painel de dados ao vivo.
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { CATALOGO_PRODUTOS } from "../../utils/insumosSF";
import { fmt } from "../../utils/format";

// ── Constantes do edifício ──────────────────────────────────────────────────
const BW = 12, BD = 8, SH = 2.8, RIDGE_H = 2.0;
const STUD_SP = 0.6, SW = 0.09, SD = 0.04;

// ── Registro de elementos BIM ───────────────────────────────────────────────
export const BIM_ELEMENTOS = [
  {
    id: "montante-90",
    label: "Montante 90mm",
    descr: "Perfil C st37 90×40×12mm — Montante",
    grupo: "Estrutura",
    icone: "⊞",
    cor: 0x981915, corHL: 0xff4444,
    corDim: 0x4a1010,
    qtdTotal: 184, qtdComprada: 120,
    busca: "montante",
    un: "barra",
  },
  {
    id: "guia-90",
    label: "Guia 90mm",
    descr: "Perfil U 90×40×1,25mm — Guia",
    grupo: "Estrutura",
    icone: "═",
    cor: 0xb84040, corHL: 0xff8888,
    corDim: 0x3a1818,
    qtdTotal: 96, qtdComprada: 96,
    busca: "guia",
    un: "barra",
  },
  {
    id: "osb-externo",
    label: "OSB Externo 11,1mm",
    descr: "Painel OSB 1220×2440×11,1mm — Fechamento",
    grupo: "Fechamento",
    icone: "▤",
    cor: 0xc4902a, corHL: 0xf5b83a,
    corDim: 0x5a4010,
    qtdTotal: 48, qtdComprada: 30,
    busca: "osb",
    un: "chapa",
  },
  {
    id: "la-vidro",
    label: "Lã de Vidro 50mm",
    descr: "Manta termoacústica 50mm — 11,25m²/rolo",
    grupo: "Isolamento",
    icone: "≋",
    cor: 0xd4b830, corHL: 0xffd840,
    corDim: 0x605010,
    qtdTotal: 24, qtdComprada: 0,
    busca: "lã",
    un: "rolo",
  },
  {
    id: "drywall",
    label: "Drywall BA 12,5mm",
    descr: "Placa gesso acartonado Standard 1200×2400mm",
    grupo: "Fechamento",
    icone: "▭",
    cor: 0xd8d4ce, corHL: 0xfff8f0,
    corDim: 0x505048,
    qtdTotal: 60, qtdComprada: 60,
    busca: "gesso",
    un: "chapa",
  },
  {
    id: "cobertura",
    label: "Telha Shingle Asfáltico",
    descr: "Architectural 3,1m²/fardo — cobertura inclinada",
    grupo: "Cobertura",
    icone: "◸",
    cor: 0x323240, corHL: 0x606080,
    corDim: 0x161618,
    qtdTotal: 18, qtdComprada: 0,
    busca: "shingle",
    un: "fardo",
  },
  {
    id: "parafuso",
    label: "Parafuso Tek 4,2×13",
    descr: "Autoperfurante zincado — caixa 1000 unidades",
    grupo: "Fixação",
    icone: "✦",
    cor: 0x909098, corHL: 0xccccdd,
    corDim: 0x303035,
    qtdTotal: 12, qtdComprada: 12,
    busca: "parafuso",
    un: "caixa",
  },
];

const BIM_MAP = Object.fromEntries(BIM_ELEMENTOS.map(e => [e.id, e]));

// ── Cores UI ────────────────────────────────────────────────────────────────
const GRUPO_COR = {
  "Estrutura": "#981915",
  "Fechamento": "#c0892d",
  "Isolamento": "#b07a1e",
  "Cobertura": "#3b6ea5",
  "Fixação": "#6d557e",
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function pct(a, b) { return b === 0 ? 0 : Math.round((a / b) * 100); }

function StatusBar({ comprado, total, color = "#3f7a4b" }) {
  const p = pct(comprado, total);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4, color: "rgba(255,255,255,.5)" }}>
        <span>{comprado} comprados</span>
        <span style={{ color, fontWeight: 700 }}>{p}%</span>
      </div>
      <div style={{ height: 5, background: "rgba(255,255,255,.1)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${p}%`, background: color, borderRadius: 4, transition: "width .4s" }} />
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 4 }}>
        {total - comprado} pendentes
      </div>
    </div>
  );
}

// ── Painel lateral do elemento ───────────────────────────────────────────────
function ElementPanel({ elementoId, onClose, onAddToOrcamento }) {
  const el = BIM_MAP[elementoId];
  if (!el) return null;

  const produto = useMemo(() => {
    return CATALOGO_PRODUTOS.find(p =>
      p.nome.toLowerCase().includes(el.busca.toLowerCase()) ||
      (p.subcategoria || "").toLowerCase().includes(el.busca.toLowerCase())
    );
  }, [el.busca]);

  const corStatus = el.qtdComprada >= el.qtdTotal ? "#3f7a4b"
    : el.qtdComprada > 0 ? "#c0892d"
    : "#a33327";

  const grCor = GRUPO_COR[el.grupo] || "#8c847a";

  function handleAdd() {
    if (!produto) return;
    onAddToOrcamento({
      produtoId:  produto.id,
      nome:       produto.nome,
      categoria:  produto.categoria || el.grupo,
      preco:      produto.preco * el.qtdTotal,
      precoUnit:  produto.preco,
      unidade:    produto.un || el.un,
      quantidade: el.qtdTotal,
    });
  }

  return (
    <div style={{
      position: "absolute", top: 0, right: 0, bottom: 0, width: 290,
      background: "rgba(18,17,22,0.97)", backdropFilter: "blur(12px)",
      borderLeft: "1px solid rgba(255,255,255,.08)",
      display: "flex", flexDirection: "column", overflow: "hidden",
      animation: "svpin .18s cubic-bezier(.2,.7,.3,1)",
    }}>
      <style>{`@keyframes svpin{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}`}</style>

      {/* Header */}
      <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{
            fontSize: 8.5, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase",
            color: grCor, background: grCor + "22", padding: "3px 8px", borderRadius: 4, marginBottom: 8,
          }}>{el.grupo}</div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 7, width: 28, height: 28, cursor: "pointer", display: "grid", placeItems: "center",
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" style={{ width: 14, height: 14 }}>
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1.25 }}>{el.label}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 4 }}>{el.descr}</div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Quantidade / Status */}
        <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: 10 }}>
            Quantidade
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 700, color: "#fff", lineHeight: 1 }}>
              {el.qtdTotal}
            </span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.35)", fontWeight: 600 }}>{el.un}</span>
          </div>
          <StatusBar comprado={el.qtdComprada} total={el.qtdTotal} color={corStatus} />
        </div>

        {/* Produto vinculado */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: 8 }}>
            Produto Vinculado
          </div>
          {produto ? (
            <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4, lineHeight: 1.3 }}>{produto.nome}</div>
              {produto.fabricante && (
                <div style={{ fontSize: 11, color: "#3b6ea5", fontWeight: 600, marginBottom: 8 }}>{produto.fabricante}</div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginBottom: 2 }}>Preço unitário</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>
                    {fmt(produto.preco)}
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)", fontWeight: 400, marginLeft: 3 }}>/{produto.un || el.un}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginBottom: 2 }}>Total ({el.qtdTotal} {el.un})</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700, color: "#c0892d" }}>
                    {fmt(produto.preco * el.qtdTotal)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.3)", fontStyle: "italic" }}>
              Produto não encontrado no catálogo.
            </div>
          )}
        </div>

        {/* Fornecedor */}
        {produto?.fabricante && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: 8 }}>
              Fornecedor
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",
              borderRadius: 10, padding: "10px 14px",
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#3b6ea522", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#3b6ea5" strokeWidth="1.8" style={{ width: 16, height: 16 }}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{produto.fabricante}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>Espaço Smart</div>
              </div>
            </div>
          </div>
        )}

        {/* Status de execução */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: 8 }}>
            Execução
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { label: "Planejado", color: "rgba(255,255,255,.3)", active: true },
              { label: "Em fabricação", color: "#c0892d", active: el.qtdComprada > 0 },
              { label: "Instalado", color: "#3f7a4b", active: el.qtdComprada >= el.qtdTotal },
            ].map(s => (
              <div key={s.label} style={{
                flex: 1, textAlign: "center", padding: "7px 4px",
                background: s.active ? s.color + "22" : "rgba(255,255,255,.03)",
                border: `1px solid ${s.active ? s.color + "66" : "rgba(255,255,255,.06)"}`,
                borderRadius: 7, fontSize: 10, fontWeight: 700,
                color: s.active ? s.color : "rgba(255,255,255,.2)",
              }}>
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div style={{ padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
        {produto && (
          <button onClick={handleAdd} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "#981915", color: "#fff", border: "none", borderRadius: 9,
            padding: "11px 16px", fontFamily: "inherit", fontSize: 13, fontWeight: 700,
            cursor: "pointer", transition: ".14s", width: "100%",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#7d1411"}
            onMouseLeave={e => e.currentTarget.style.background = "#981915"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 15, height: 15 }}>
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Adicionar ao Orçamento
          </button>
        )}
        <button onClick={onClose} style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.5)",
          border: "1px solid rgba(255,255,255,.1)", borderRadius: 9,
          padding: "9px 16px", fontFamily: "inherit", fontSize: 13, fontWeight: 600,
          cursor: "pointer", width: "100%",
        }}>
          Fechar
        </button>
      </div>
    </div>
  );
}

// ── Legenda de tipos ─────────────────────────────────────────────────────────
function Legend({ selected, onSelect }) {
  return (
    <div style={{
      display: "flex", gap: 6, flexWrap: "wrap", padding: "10px 14px",
      background: "rgba(18,17,22,.9)", borderTop: "1px solid rgba(255,255,255,.06)",
    }}>
      {BIM_ELEMENTOS.map(el => {
        const isActive = selected === el.id;
        const hex = "#" + el.cor.toString(16).padStart(6, "0");
        return (
          <button key={el.id} onClick={() => onSelect(isActive ? null : el.id)} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: isActive ? hex + "22" : "rgba(255,255,255,.05)",
            border: `1.5px solid ${isActive ? hex + "88" : "rgba(255,255,255,.09)"}`,
            borderRadius: 20, padding: "4px 10px",
            fontFamily: "inherit", fontSize: 11, fontWeight: 600,
            color: isActive ? hex : "rgba(255,255,255,.45)",
            cursor: "pointer", transition: ".12s", whiteSpace: "nowrap",
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: hex, flexShrink: 0 }} />
            {el.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Dashboard KPI strip ──────────────────────────────────────────────────────
function BIMDashboard() {
  const totalItens = BIM_ELEMENTOS.reduce((s, e) => s + e.qtdTotal, 0);
  const totalComp  = BIM_ELEMENTOS.reduce((s, e) => s + e.qtdComprada, 0);
  const pctCompra  = pct(totalComp, totalItens);

  const totalCusto = BIM_ELEMENTOS.reduce((s, el) => {
    const p = CATALOGO_PRODUTOS.find(p => p.nome.toLowerCase().includes(el.busca.toLowerCase()));
    return s + (p ? p.preco * el.qtdTotal : 0);
  }, 0);

  const kpis = [
    { v: BIM_ELEMENTOS.length,       l: "Tipos de elemento" },
    { v: totalItens + " itens",      l: "Total de materiais" },
    { v: pctCompra + "%",            l: "Compras concluídas" },
    { v: fmt(totalCusto),            l: "Custo estimado estrutura" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "rgba(255,255,255,.06)" }}>
      {kpis.map((k, i) => (
        <div key={i} style={{
          background: "rgba(18,17,22,.9)", padding: "10px 16px",
          borderRight: i < 3 ? "1px solid rgba(255,255,255,.06)" : "none",
        }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{k.v}</div>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.35)", marginTop: 3 }}>{k.l}</div>
        </div>
      ))}
    </div>
  );
}

// ── Cena Three.js ────────────────────────────────────────────────────────────
async function buildThreeScene(container, onElementClick) {
  const THREE = (await import("three")).default;
  const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111014);
  scene.fog = new THREE.FogExp2(0x111014, 0.03);

  // Camera
  const { width, height } = container.getBoundingClientRect();
  const camera = new THREE.PerspectiveCamera(48, width / (height || 1), 0.1, 120);
  camera.position.set(12, 8, 14);
  camera.lookAt(0, 2, 0);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height || 400);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2, 0);
  controls.minDistance = 3;
  controls.maxDistance = 40;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.update();

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const sun = new THREE.DirectionalLight(0xfff4e8, 1.4);
  sun.position.set(10, 16, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.far = 60;
  sun.shadow.camera.left = -20; sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20; sun.shadow.camera.bottom = -20;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xc8d8ff, 0.3);
  fill.position.set(-8, 4, -6);
  scene.add(fill);

  // Ground grid
  const grid = new THREE.GridHelper(60, 60, 0x1e1e24, 0x1a1a20);
  grid.position.y = -0.02;
  scene.add(grid);

  // Materials
  const mats = {};
  for (const el of BIM_ELEMENTOS) {
    mats[el.id] = new THREE.MeshLambertMaterial({ color: el.cor });
  }
  // Panel materials (semi-transparent by default)
  mats["osb-externo"].transparent = true;   mats["osb-externo"].opacity = 0.55;
  mats["la-vidro"].transparent = true;      mats["la-vidro"].opacity = 0.40;
  mats["drywall"].transparent = true;       mats["drywall"].opacity = 0.35;

  const allMeshes = [];
  const grps = {};

  function mkGroup(tipo) {
    const g = new THREE.Group();
    g.userData.tipo = tipo;
    grps[tipo] = g;
    scene.add(g);
    return g;
  }
  for (const el of BIM_ELEMENTOS) mkGroup(el.id);

  function addMesh(geo, tipo, pos, rot) {
    const m = new THREE.Mesh(geo, mats[tipo]);
    m.userData.tipo = tipo;
    m.castShadow = true;
    m.receiveShadow = true;
    if (pos) m.position.set(...pos);
    if (rot) Object.assign(m.rotation, rot);
    grps[tipo].add(m);
    allMeshes.push(m);
    return m;
  }

  // ── SLAB ─────────────────────────────────────────────────────────────────
  const slabMat = new THREE.MeshLambertMaterial({ color: 0x6e6e60 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(BW + 1.2, 0.24, BD + 1.2), slabMat);
  slab.position.y = -0.12;
  slab.receiveShadow = true;
  scene.add(slab);

  // ── MONTANTES — paredes externas ─────────────────────────────────────────
  function studRow(count, getPos) {
    for (let i = 0; i <= count; i++) {
      const t = count === 0 ? 0 : i / count;
      const [x, y, z, gx, gz] = getPos(t);
      addMesh(new THREE.BoxGeometry(gx, SH, gz), "montante-90", [x, SH / 2, z]);
    }
  }
  const nFW = Math.floor(BW / STUD_SP);
  const nLW = Math.floor(BD / STUD_SP);
  // Front wall (z = -BD/2)
  studRow(nFW, t => [-BW/2 + t*BW, 0, -BD/2, SW, SD]);
  // Back wall
  studRow(nFW, t => [-BW/2 + t*BW, 0, BD/2, SW, SD]);
  // Left wall
  studRow(nLW, t => [-BW/2, 0, -BD/2 + t*BD, SD, SW]);
  // Right wall
  studRow(nLW, t => [BW/2, 0, -BD/2 + t*BD, SD, SW]);
  // Interior divider wall (1/3 from left)
  studRow(nLW, t => [-BW/4, 0, -BD/2 + t*BD, SD, SW]);

  // ── GUIAS (top + bottom of each wall) ────────────────────────────────────
  const guia = (w, d, x, y, z) =>
    addMesh(new THREE.BoxGeometry(w, SW * 1.2, d), "guia-90", [x, y, z]);

  for (const y of [SW * 0.6, SH - SW * 0.6]) {
    guia(BW + SD, SD * 1.5, 0, y, -BD/2);
    guia(BW + SD, SD * 1.5, 0, y, BD/2);
    guia(SD * 1.5, BD + SD, -BW/2, y, 0);
    guia(SD * 1.5, BD + SD, BW/2, y, 0);
    guia(SD * 1.5, BD + SD, -BW/4, y, 0);
  }

  // ── OSB EXTERNO ──────────────────────────────────────────────────────────
  const osbT = 0.013;
  addMesh(new THREE.BoxGeometry(BW, SH, osbT), "osb-externo", [0, SH/2, -BD/2 - 0.025]);
  addMesh(new THREE.BoxGeometry(BW, SH, osbT), "osb-externo", [0, SH/2, BD/2 + 0.025]);
  addMesh(new THREE.BoxGeometry(osbT, SH, BD), "osb-externo", [-BW/2 - 0.025, SH/2, 0]);
  addMesh(new THREE.BoxGeometry(osbT, SH, BD), "osb-externo", [BW/2 + 0.025, SH/2, 0]);

  // ── LÃ DE VIDRO ──────────────────────────────────────────────────────────
  const laT = 0.05;
  addMesh(new THREE.BoxGeometry(BW - SW*2, SH - SW*2, laT), "la-vidro", [0, SH/2, -BD/2 + laT/2 + SW]);
  addMesh(new THREE.BoxGeometry(BW - SW*2, SH - SW*2, laT), "la-vidro", [0, SH/2, BD/2 - laT/2 - SW]);
  addMesh(new THREE.BoxGeometry(laT, SH - SW*2, BD - SW*2), "la-vidro", [-BW/2 + laT/2 + SW, SH/2, 0]);
  addMesh(new THREE.BoxGeometry(laT, SH - SW*2, BD - SW*2), "la-vidro", [BW/2 - laT/2 - SW, SH/2, 0]);

  // ── DRYWALL INTERNO ───────────────────────────────────────────────────────
  const dwT = 0.013;
  const dwOff = SW + laT + dwT/2 + 0.003;
  addMesh(new THREE.BoxGeometry(BW - SW*3, SH - SW*2, dwT), "drywall", [0, SH/2, -BD/2 + dwOff]);
  addMesh(new THREE.BoxGeometry(BW - SW*3, SH - SW*2, dwT), "drywall", [0, SH/2, BD/2 - dwOff]);
  addMesh(new THREE.BoxGeometry(dwT, SH - SW*2, BD - SW*3), "drywall", [-BW/2 + dwOff, SH/2, 0]);
  addMesh(new THREE.BoxGeometry(dwT, SH - SW*2, BD - SW*3), "drywall", [BW/2 - dwOff, SH/2, 0]);
  // Interior wall drywall (both faces)
  addMesh(new THREE.BoxGeometry(dwT, SH - SW*2, BD - SW*3), "drywall", [-BW/4 + dwOff, SH/2, 0]);
  addMesh(new THREE.BoxGeometry(dwT, SH - SW*2, BD - SW*3), "drywall", [-BW/4 - dwOff, SH/2, 0]);

  // ── ROOF TRUSSES ──────────────────────────────────────────────────────────
  const roofHyp = Math.sqrt((BW/2)**2 + RIDGE_H**2);
  const roofAng = Math.atan2(RIDGE_H, BW/2);
  const rafterW = roofHyp + 0.4, rafterH = SD, rafterD = SW * 2;

  for (let z = -BD/2 + 0.4; z <= BD/2 - 0.4 + 0.01; z += 1.5) {
    // Left rafter
    const rL = new THREE.Mesh(new THREE.BoxGeometry(rafterW, rafterH, rafterD), mats["montante-90"]);
    rL.userData.tipo = "montante-90";
    rL.position.set(-BW/4, SH + RIDGE_H/2, z);
    rL.rotation.z = roofAng;
    rL.castShadow = true;
    grps["montante-90"].add(rL); allMeshes.push(rL);

    // Right rafter
    const rR = new THREE.Mesh(new THREE.BoxGeometry(rafterW, rafterH, rafterD), mats["montante-90"]);
    rR.userData.tipo = "montante-90";
    rR.position.set(BW/4, SH + RIDGE_H/2, z);
    rR.rotation.z = -roofAng;
    rR.castShadow = true;
    grps["montante-90"].add(rR); allMeshes.push(rR);

    // Bottom chord
    addMesh(new THREE.BoxGeometry(BW + SD, SD * 1.5, SD * 2), "guia-90", [0, SH + SD, z]);
    // King post (vertical central post)
    addMesh(new THREE.BoxGeometry(SD, RIDGE_H, SD * 2), "montante-90", [0, SH + RIDGE_H/2, z]);
  }

  // Ridge beam
  addMesh(new THREE.BoxGeometry(SD * 2, SD * 2, BD + 0.8), "guia-90", [0, SH + RIDGE_H, 0]);

  // ── COBERTURA (shingle panels) ────────────────────────────────────────────
  const shingleL = new THREE.Mesh(new THREE.BoxGeometry(roofHyp + 0.5, 0.07, BD + 0.8), mats["cobertura"]);
  shingleL.userData.tipo = "cobertura";
  shingleL.position.set(-BW/4, SH + RIDGE_H/2, 0);
  shingleL.rotation.z = roofAng;
  shingleL.castShadow = true;
  grps["cobertura"].add(shingleL); allMeshes.push(shingleL);

  const shingleR = new THREE.Mesh(new THREE.BoxGeometry(roofHyp + 0.5, 0.07, BD + 0.8), mats["cobertura"]);
  shingleR.userData.tipo = "cobertura";
  shingleR.position.set(BW/4, SH + RIDGE_H/2, 0);
  shingleR.rotation.z = -roofAng;
  shingleR.castShadow = true;
  grps["cobertura"].add(shingleR); allMeshes.push(shingleR);

  // Roof overhang fascia
  addMesh(new THREE.BoxGeometry(BW + 0.4, 0.06, BD + 0.8), "guia-90", [0, SH, 0]);

  // ── PARAFUSOS (connection points) ─────────────────────────────────────────
  const screwGeo = new THREE.SphereGeometry(0.028, 5, 5);
  const conns = [
    [-BW/2, 0, -BD/2], [BW/2, 0, -BD/2], [-BW/2, 0, BD/2], [BW/2, 0, BD/2],
    [-BW/2, SH, -BD/2], [BW/2, SH, -BD/2], [-BW/2, SH, BD/2], [BW/2, SH, BD/2],
    [-BW/4, 0, -BD/2], [-BW/4, SH, -BD/2], [-BW/4, 0, BD/2], [-BW/4, SH, BD/2],
  ];
  for (const pos of conns) addMesh(screwGeo.clone(), "parafuso", pos);

  // ── Raycaster ─────────────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredTipo = null;

  function getCoords(e) {
    const r = container.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 2 - 1,
      y: -((e.clientY - r.top) / r.height) * 2 + 1,
    };
  }

  function onMouseMove(e) {
    const { x, y } = getCoords(e);
    mouse.x = x; mouse.y = y;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(allMeshes);
    const tipo = hits.length > 0 ? hits[0].object.userData.tipo : null;
    if (tipo !== hoveredTipo) {
      hoveredTipo = tipo;
      renderer.domElement.style.cursor = tipo ? "pointer" : "default";
    }
  }

  function onClick() {
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(allMeshes);
    const tipo = hits.length > 0 ? hits[0].object.userData.tipo : null;
    onElementClick(tipo);
  }

  container.addEventListener("mousemove", onMouseMove);
  container.addEventListener("click", onClick);

  // ── Resize ────────────────────────────────────────────────────────────────
  function onResize() {
    const r = container.getBoundingClientRect();
    camera.aspect = r.width / (r.height || 1);
    camera.updateProjectionMatrix();
    renderer.setSize(r.width, r.height || 400);
  }
  const ro = new ResizeObserver(onResize);
  ro.observe(container);

  // ── Animation loop ─────────────────────────────────────────────────────────
  let animId;
  function animate() {
    animId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // ── Cleanup return ─────────────────────────────────────────────────────────
  return {
    mats,
    dispose() {
      cancelAnimationFrame(animId);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("click", onClick);
      ro.disconnect();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function StickViewBIM({ onAddToOrcamento }) {
  const mountRef  = useRef(null);
  const engineRef = useRef(null); // { mats, dispose }
  const [selected, setSelected] = useState(null);
  const [ready,    setReady]    = useState(false);
  const [added,    setAdded]    = useState(null); // notification

  // Highlight materials whenever selected changes
  const updateColors = useCallback((tipo) => {
    if (!engineRef.current) return;
    const { mats } = engineRef.current;
    for (const el of BIM_ELEMENTOS) {
      const mat = mats[el.id];
      if (!mat) continue;
      if (!tipo) {
        mat.color.setHex(el.cor);
        mat.emissive?.setHex(0x000000);
        // restore default transparency
        if (el.id === "osb-externo") { mat.transparent = true; mat.opacity = 0.55; }
        if (el.id === "la-vidro")    { mat.transparent = true; mat.opacity = 0.40; }
        if (el.id === "drywall")     { mat.transparent = true; mat.opacity = 0.35; }
        else if (!["osb-externo","la-vidro"].includes(el.id)) { mat.transparent = false; mat.opacity = 1; }
      } else if (el.id === tipo) {
        mat.color.setHex(el.corHL);
        mat.transparent = false; mat.opacity = 1;
        mat.emissive?.setHex(0x221108);
      } else {
        mat.color.setHex(el.corDim);
        mat.transparent = true; mat.opacity = 0.18;
        mat.emissive?.setHex(0x000000);
      }
      mat.needsUpdate = true;
    }
  }, []);

  // Build scene once
  useEffect(() => {
    if (!mountRef.current) return;
    let canceled = false;

    buildThreeScene(mountRef.current, (tipo) => {
      if (canceled) return;
      setSelected(prev => {
        const next = prev === tipo ? null : tipo;
        return next;
      });
    }).then(engine => {
      if (canceled) { engine.dispose(); return; }
      engineRef.current = engine;
      setReady(true);
    }).catch(err => {
      console.error("StickViewBIM init error:", err);
    });

    return () => {
      canceled = true;
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  // Sync colors with selected state
  useEffect(() => {
    if (ready) updateColors(selected);
  }, [selected, ready, updateColors]);

  function handleAdd(item) {
    onAddToOrcamento?.(item);
    setAdded(item.nome);
    setTimeout(() => setAdded(null), 2500);
  }

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", background: "#111014" }}>
      {/* 3D Canvas area */}
      <div style={{ position: "relative", height: 480 }}>
        <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

        {/* Loading overlay */}
        {!ready && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", background: "#111014", gap: 14,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: "rgba(152,25,21,.15)",
              border: "1px solid rgba(152,25,21,.3)", display: "grid", placeItems: "center",
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#981915" strokeWidth="1.8" style={{ width: 26, height: 26 }}>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.4)", fontWeight: 600 }}>Carregando StickView™…</div>
          </div>
        )}

        {/* Header badge */}
        {ready && (
          <div style={{
            position: "absolute", top: 14, left: 14,
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(18,17,22,.85)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,.1)", borderRadius: 10,
            padding: "7px 12px",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#981915", flexShrink: 0 }} />
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: .3 }}>
              StickView™
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontWeight: 600 }}>BIM Inteligente</span>
          </div>
        )}

        {/* Tip */}
        {ready && !selected && (
          <div style={{
            position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)",
            background: "rgba(18,17,22,.85)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,.1)", borderRadius: 20,
            padding: "7px 16px", fontSize: 12, color: "rgba(255,255,255,.4)", whiteSpace: "nowrap",
          }}>
            Clique em um elemento para ver detalhes • Arraste para rotacionar
          </div>
        )}

        {/* Success notification */}
        {added && (
          <div style={{
            position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)",
            background: "rgba(63,122,75,.95)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,.15)", borderRadius: 20,
            padding: "8px 18px", fontSize: 12.5, fontWeight: 700, color: "#fff",
            whiteSpace: "nowrap", animation: "svpin .2s ease",
          }}>
            ✓ {added} adicionado ao orçamento
          </div>
        )}

        {/* Element panel (overlay) */}
        {selected && (
          <ElementPanel
            elementoId={selected}
            onClose={() => setSelected(null)}
            onAddToOrcamento={handleAdd}
          />
        )}
      </div>

      {/* Dashboard strip */}
      <BIMDashboard />

      {/* Legend */}
      <Legend selected={selected} onSelect={setSelected} />
    </div>
  );
}
