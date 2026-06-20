/**
 * StickView™ — Gêmeo Digital BIM
 * Representação viva da obra: elementos 3D + execução + compras + orçamento + IFC.
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { CATALOGO_PRODUTOS } from "../../utils/insumosSF";
import { fmt } from "../../utils/format";

// ── Constantes estruturais ─────────────────────────────────────────────────
const BW = 12, BD = 8, SH = 2.8, RIDGE_H = 2.0;
const STUD_SP = 0.6, SW = 0.09, SD = 0.04;

// ── Status de execução ──────────────────────────────────────────────────────
export const STATUS_EXEC = {
  planejado:  { label: "Planejado",     emoji: "⚪", cor: "#8c847a", cor3d: 0x3a3a44, cor3dHL: 0x888898 },
  fabricando: { label: "Em fabricação", emoji: "🟡", cor: "#c0892d", cor3d: 0x7a5010, cor3dHL: 0xf0a020 },
  montando:   { label: "Em montagem",   emoji: "🔵", cor: "#3b6ea5", cor3d: 0x1e4070, cor3dHL: 0x4a90d0 },
  concluido:  { label: "Concluído",     emoji: "🟢", cor: "#3f7a4b", cor3d: 0x1e4a28, cor3dHL: 0x50c060 },
  problema:   { label: "Problema",      emoji: "🔴", cor: "#a33327", cor3d: 0x6a1a14, cor3dHL: 0xee3030 },
};
const STATUS_KEYS = Object.keys(STATUS_EXEC);

// ── Mapeamento IFC → elemento ───────────────────────────────────────────────
const IFC_ELEMENT_MAP = {
  IFCMEMBER:           "montante-90",
  IFCBEAM:             "guia-90",
  IFCCOLUMN:           "montante-90",
  IFCWALLSTANDARDCASE: "osb-externo",
  IFCWALL:             "drywall",
  IFCPLATE:            "osb-externo",
  IFCROOFING:          "cobertura",
  IFCROOF:             "cobertura",
  IFCFASTENER:         "parafuso",
  IFCMECHANICALFASTENER: "parafuso",
  IFCCOVERING:         "la-vidro",
};

// ── Registro de elementos BIM ───────────────────────────────────────────────
export const BIM_ELEMENTOS_BASE = [
  { id:"montante-90", label:"Montante 90mm",       descr:"Perfil C st37 90×40×12mm",              grupo:"Estrutura",  busca:"montante", un:"barra",  qtdBase:184 },
  { id:"guia-90",     label:"Guia 90mm",           descr:"Perfil U 90×40×1,25mm",                 grupo:"Estrutura",  busca:"guia",     un:"barra",  qtdBase:96  },
  { id:"osb-externo", label:"OSB Externo 11,1mm",  descr:"Painel OSB 1220×2440×11,1mm",           grupo:"Fechamento", busca:"osb",      un:"chapa",  qtdBase:48  },
  { id:"la-vidro",    label:"Lã de Vidro 50mm",    descr:"Manta termoacústica 50mm — 11,25m²/rl", grupo:"Isolamento", busca:"lã",       un:"rolo",   qtdBase:24  },
  { id:"drywall",     label:"Drywall BA 12,5mm",   descr:"Placa gesso acartonado 1200×2400mm",    grupo:"Fechamento", busca:"gesso",    un:"chapa",  qtdBase:60  },
  { id:"cobertura",   label:"Telha Shingle",        descr:"Asfáltico architectural — 3,1m²/fardo", grupo:"Cobertura",  busca:"shingle",  un:"fardo",  qtdBase:18  },
  { id:"parafuso",    label:"Parafuso Tek 4,2×13", descr:"Autoperfurante zincado — cx 1000un",    grupo:"Fixação",    busca:"parafuso", un:"caixa",  qtdBase:12  },
];

const GRUPO_COR = { Estrutura:"#981915", Fechamento:"#c0892d", Isolamento:"#b07a1e", Cobertura:"#3b6ea5", Fixação:"#6d557e" };

// ── IFC text parser ─────────────────────────────────────────────────────────
export function parseIFCText(text) {
  const upper = text.toUpperCase();
  const result = {};
  for (const [ifcType, elementoId] of Object.entries(IFC_ELEMENT_MAP)) {
    const re = new RegExp(`#\\d+=${ifcType}[\\s(]`, "g");
    const count = (upper.match(re) || []).length;
    if (count > 0) result[elementoId] = (result[elementoId] || 0) + count;
  }
  return result; // { "montante-90": 184, ... }
}

// ── localStorage helpers ────────────────────────────────────────────────────
function execKey(obraId) { return `bim_exec_${obraId || "demo"}`; }
function qtdKey(obraId)  { return `bim_qtd_${obraId || "demo"}`; }
function compKey(obraId) { return `bim_comp_${obraId || "demo"}`; }

function loadJSON(key, def = {}) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); }
  catch { return def; }
}
function saveJSON(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// ── Hook: status de execução ────────────────────────────────────────────────
function useExecStatus(obraId) {
  const [statusMap, setStatusMap] = useState(() => loadJSON(execKey(obraId)));
  const [qtdMap,    setQtdMap]    = useState(() => loadJSON(qtdKey(obraId)));
  const [compMap,   setCompMap]   = useState(() => loadJSON(compKey(obraId)));

  const setStatus = useCallback((id, status) => {
    setStatusMap(prev => {
      const next = { ...prev, [id]: status };
      saveJSON(execKey(obraId), next);
      return next;
    });
  }, [obraId]);

  const setQtdComprada = useCallback((id, val) => {
    setCompMap(prev => {
      const next = { ...prev, [id]: Number(val) };
      saveJSON(compKey(obraId), next);
      return next;
    });
  }, [obraId]);

  const applyIFCQtd = useCallback((ifcCounts) => {
    setQtdMap(prev => {
      const next = { ...prev, ...ifcCounts };
      saveJSON(qtdKey(obraId), next);
      return next;
    });
  }, [obraId]);

  const getEl = useCallback((id) => {
    const base = BIM_ELEMENTOS_BASE.find(e => e.id === id);
    if (!base) return null;
    return {
      ...base,
      qtdTotal:    qtdMap[id]  ?? base.qtdBase,
      qtdComprada: compMap[id] ?? Math.floor((qtdMap[id] ?? base.qtdBase) * 0.65),
      status:      statusMap[id] ?? "planejado",
    };
  }, [statusMap, qtdMap, compMap]);

  return { statusMap, setStatus, setQtdComprada, applyIFCQtd, getEl };
}

// ── Funções de cor 3D ───────────────────────────────────────────────────────
function getEl3DColor(elementoId, statusMap, selected) {
  const status = statusMap[elementoId] || "planejado";
  const sc = STATUS_EXEC[status] || STATUS_EXEC.planejado;
  if (!selected) return { hex: sc.cor3d, opacity: 1, transparent: false };
  if (elementoId === selected) return { hex: sc.cor3dHL, opacity: 1, transparent: false };
  return { hex: sc.cor3d, opacity: 0.13, transparent: true };
}

// ── Cena Three.js ────────────────────────────────────────────────────────────
async function buildThreeScene(container, onElementClick) {
  const THREE = (await import("three")).default;
  const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f0e12);
  scene.fog = new THREE.FogExp2(0x0f0e12, 0.025);

  const { width, height } = container.getBoundingClientRect();
  const camera = new THREE.PerspectiveCamera(48, width / (height || 1), 0.1, 120);
  camera.position.set(12, 8, 14);
  camera.lookAt(0, 2, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height || 400);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2, 0);
  controls.minDistance = 3; controls.maxDistance = 40;
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.update();

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const sun = new THREE.DirectionalLight(0xfff4e8, 1.3);
  sun.position.set(10, 16, 12); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  ["left","right","top","bottom"].forEach((k, i) => sun.shadow.camera[k] = [-22,22,22,-22][i]);
  sun.shadow.camera.far = 60;
  scene.add(sun);
  scene.add(Object.assign(new THREE.DirectionalLight(0xc8d8ff, 0.25), { position: { set(){ this.x=-8;this.y=4;this.z=-6; } } }));

  const grid = new THREE.GridHelper(60, 60, 0x1a1a20, 0x171720);
  grid.position.y = -0.02;
  scene.add(grid);

  // Materials keyed by elementoId
  const mats = {};
  for (const el of BIM_ELEMENTOS_BASE) {
    mats[el.id] = new THREE.MeshLambertMaterial({ color: STATUS_EXEC.planejado.cor3d });
  }

  const allMeshes = [];
  const grps = {};

  for (const el of BIM_ELEMENTOS_BASE) {
    const g = new THREE.Group();
    g.userData.tipo = el.id;
    grps[el.id] = g;
    scene.add(g);
  }

  function addMesh(geo, tipo, pos, rotZ) {
    const m = new THREE.Mesh(geo, mats[tipo]);
    m.userData.tipo = tipo;
    m.castShadow = true; m.receiveShadow = true;
    if (pos) m.position.set(...pos);
    if (rotZ) m.rotation.z = rotZ;
    grps[tipo].add(m); allMeshes.push(m);
    return m;
  }

  // Slab
  const slabMesh = new THREE.Mesh(
    new THREE.BoxGeometry(BW+1.2, 0.24, BD+1.2),
    new THREE.MeshLambertMaterial({ color: 0x555548 })
  );
  slabMesh.position.y = -0.12; slabMesh.receiveShadow = true;
  scene.add(slabMesh);

  // Montantes - 4 walls + interior divider
  const walls = [
    { count: Math.floor(BW/STUD_SP), fn: (t) => [-BW/2+t*BW, SH/2, -BD/2, SW, SD] },
    { count: Math.floor(BW/STUD_SP), fn: (t) => [-BW/2+t*BW, SH/2, BD/2,  SW, SD] },
    { count: Math.floor(BD/STUD_SP), fn: (t) => [-BW/2, SH/2, -BD/2+t*BD, SD, SW] },
    { count: Math.floor(BD/STUD_SP), fn: (t) => [BW/2,  SH/2, -BD/2+t*BD, SD, SW] },
    { count: Math.floor(BD/STUD_SP), fn: (t) => [-BW/4, SH/2, -BD/2+t*BD, SD, SW] },
  ];
  for (const { count, fn } of walls) {
    for (let i = 0; i <= count; i++) {
      const [x, y, z, gx, gz] = fn(i / count);
      addMesh(new THREE.BoxGeometry(gx, SH, gz), "montante-90", [x, y, z]);
    }
  }

  // Guias
  for (const y of [SW*0.6, SH-SW*0.6]) {
    addMesh(new THREE.BoxGeometry(BW+SD, SW*1.2, SD*1.5), "guia-90", [0, y, -BD/2]);
    addMesh(new THREE.BoxGeometry(BW+SD, SW*1.2, SD*1.5), "guia-90", [0, y, BD/2]);
    addMesh(new THREE.BoxGeometry(SD*1.5, SW*1.2, BD+SD), "guia-90", [-BW/2, y, 0]);
    addMesh(new THREE.BoxGeometry(SD*1.5, SW*1.2, BD+SD), "guia-90", [BW/2, y, 0]);
    addMesh(new THREE.BoxGeometry(SD*1.5, SW*1.2, BD+SD), "guia-90", [-BW/4, y, 0]);
  }

  // OSB, lã, drywall
  const osbT = 0.013, laT = 0.05, dwT = 0.013;
  const dwOff = SW + laT + dwT/2 + 0.003;
  addMesh(new THREE.BoxGeometry(BW, SH, osbT), "osb-externo", [0, SH/2, -BD/2-0.025]);
  addMesh(new THREE.BoxGeometry(BW, SH, osbT), "osb-externo", [0, SH/2, BD/2+0.025]);
  addMesh(new THREE.BoxGeometry(osbT, SH, BD), "osb-externo", [-BW/2-0.025, SH/2, 0]);
  addMesh(new THREE.BoxGeometry(osbT, SH, BD), "osb-externo", [BW/2+0.025, SH/2, 0]);
  addMesh(new THREE.BoxGeometry(BW-SW*2, SH-SW*2, laT), "la-vidro", [0, SH/2, -BD/2+laT/2+SW]);
  addMesh(new THREE.BoxGeometry(BW-SW*2, SH-SW*2, laT), "la-vidro", [0, SH/2, BD/2-laT/2-SW]);
  addMesh(new THREE.BoxGeometry(laT, SH-SW*2, BD-SW*2), "la-vidro", [-BW/2+laT/2+SW, SH/2, 0]);
  addMesh(new THREE.BoxGeometry(laT, SH-SW*2, BD-SW*2), "la-vidro", [BW/2-laT/2-SW, SH/2, 0]);
  addMesh(new THREE.BoxGeometry(BW-SW*3, SH-SW*2, dwT), "drywall", [0, SH/2, -BD/2+dwOff]);
  addMesh(new THREE.BoxGeometry(BW-SW*3, SH-SW*2, dwT), "drywall", [0, SH/2, BD/2-dwOff]);
  addMesh(new THREE.BoxGeometry(dwT, SH-SW*2, BD-SW*3), "drywall", [-BW/2+dwOff, SH/2, 0]);
  addMesh(new THREE.BoxGeometry(dwT, SH-SW*2, BD-SW*3), "drywall", [BW/2-dwOff, SH/2, 0]);
  addMesh(new THREE.BoxGeometry(dwT, SH-SW*2, BD-SW*3), "drywall", [-BW/4+dwOff, SH/2, 0]);
  addMesh(new THREE.BoxGeometry(dwT, SH-SW*2, BD-SW*3), "drywall", [-BW/4-dwOff, SH/2, 0]);

  // Roof trusses
  const roofHyp = Math.sqrt((BW/2)**2 + RIDGE_H**2);
  const roofAng = Math.atan2(RIDGE_H, BW/2);
  for (let z = -BD/2+0.4; z <= BD/2-0.4+0.01; z += 1.5) {
    addMesh(new THREE.BoxGeometry(roofHyp+0.3, SD, SW*2), "montante-90", [-BW/4, SH+RIDGE_H/2, z], roofAng);
    addMesh(new THREE.BoxGeometry(roofHyp+0.3, SD, SW*2), "montante-90", [BW/4, SH+RIDGE_H/2, z], -roofAng);
    addMesh(new THREE.BoxGeometry(BW+SD, SD*1.5, SD*2), "guia-90", [0, SH+SD, z]);
    addMesh(new THREE.BoxGeometry(SD, RIDGE_H, SD*2), "montante-90", [0, SH+RIDGE_H/2, z]);
  }
  addMesh(new THREE.BoxGeometry(SD*2, SD*2, BD+0.8), "guia-90", [0, SH+RIDGE_H, 0]);
  addMesh(new THREE.BoxGeometry(roofHyp+0.5, 0.07, BD+0.8), "cobertura", [-BW/4, SH+RIDGE_H/2, 0], roofAng);
  addMesh(new THREE.BoxGeometry(roofHyp+0.5, 0.07, BD+0.8), "cobertura", [BW/4, SH+RIDGE_H/2, 0], -roofAng);
  addMesh(new THREE.BoxGeometry(BW+0.4, 0.06, BD+0.8), "guia-90", [0, SH, 0]);

  // Screws
  const sg = new THREE.SphereGeometry(0.028, 5, 5);
  for (const p of [
    [-BW/2,0,-BD/2],[BW/2,0,-BD/2],[-BW/2,0,BD/2],[BW/2,0,BD/2],
    [-BW/2,SH,-BD/2],[BW/2,SH,-BD/2],[-BW/2,SH,BD/2],[BW/2,SH,BD/2],
    [-BW/4,0,-BD/2],[-BW/4,SH,-BD/2],[-BW/4,0,BD/2],[-BW/4,SH,BD/2],
  ]) addMesh(sg.clone(), "parafuso", p);

  // Raycaster
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function getCoords(e) {
    const r = container.getBoundingClientRect();
    return { x: ((e.clientX-r.left)/r.width)*2-1, y: -((e.clientY-r.top)/r.height)*2+1 };
  }
  function onMouseMove(e) { const {x,y}=getCoords(e); mouse.x=x; mouse.y=y;
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(allMeshes)[0];
    renderer.domElement.style.cursor = (hit?.object.userData.tipo) ? "pointer" : "default";
  }
  function onClick() {
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(allMeshes)[0];
    onElementClick(hit?.object.userData.tipo || null);
  }
  container.addEventListener("mousemove", onMouseMove);
  container.addEventListener("click", onClick);

  function onResize() {
    const r = container.getBoundingClientRect();
    camera.aspect = r.width/(r.height||1);
    camera.updateProjectionMatrix();
    renderer.setSize(r.width, r.height||400);
  }
  const ro = new ResizeObserver(onResize);
  ro.observe(container);

  let animId;
  function animate() {
    animId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  return {
    mats,
    dispose() {
      cancelAnimationFrame(animId);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("click", onClick);
      ro.disconnect(); renderer.dispose();
      if (renderer.domElement.parentNode === container)
        container.removeChild(renderer.domElement);
    },
  };
}

// ── Painel lateral ──────────────────────────────────────────────────────────
function ElementPanel({ el, onClose, onStatusChange, onQtdCompradaChange, onAddToOrcamento }) {
  if (!el) return null;
  const st = STATUS_EXEC[el.status] || STATUS_EXEC.planejado;
  const grCor = GRUPO_COR[el.grupo] || "#8c847a";
  const pctComp = el.qtdTotal ? Math.round((el.qtdComprada/el.qtdTotal)*100) : 0;
  const statusColor = el.qtdComprada >= el.qtdTotal ? "#3f7a4b" : el.qtdComprada > 0 ? "#c0892d" : "#a33327";

  const produto = useMemo(() =>
    CATALOGO_PRODUTOS.find(p => p.nome.toLowerCase().includes(el.busca.toLowerCase()))
  , [el.busca]);

  return (
    <div style={{
      position:"absolute",top:0,right:0,bottom:0,width:296,
      background:"rgba(12,11,16,0.97)",backdropFilter:"blur(14px)",
      borderLeft:"1px solid rgba(255,255,255,.07)",
      display:"flex",flexDirection:"column",overflow:"hidden",
      animation:"svpin .18s cubic-bezier(.2,.7,.3,1)",
    }}>
      {/* Header */}
      <div style={{padding:"15px 16px 13px",borderBottom:"1px solid rgba(255,255,255,.06)",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <span style={{fontSize:8,fontWeight:800,letterSpacing:1.4,textTransform:"uppercase",color:grCor,background:grCor+"22",padding:"3px 8px",borderRadius:4}}>{el.grupo}</span>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:7,width:26,height:26,cursor:"pointer",display:"grid",placeItems:"center"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" style={{width:13,height:13}}><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{fontSize:15,fontWeight:700,color:"#fff",lineHeight:1.25,marginTop:7}}>{el.label}</div>
        <div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginTop:3}}>{el.descr}</div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"13px 16px",display:"flex",flexDirection:"column",gap:14}}>
        {/* Status de execução */}
        <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,padding:"11px 13px"}}>
          <div style={{fontSize:9.5,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",color:"rgba(255,255,255,.3)",marginBottom:9}}>Status de Execução</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {STATUS_KEYS.map(k => {
              const s = STATUS_EXEC[k];
              const active = el.status === k;
              return (
                <button key={k} onClick={() => onStatusChange(k)} style={{
                  display:"inline-flex",alignItems:"center",gap:5,
                  background: active ? s.cor+"22" : "rgba(255,255,255,.04)",
                  border: `1px solid ${active ? s.cor+"88" : "rgba(255,255,255,.08)"}`,
                  borderRadius:7,padding:"5px 9px",fontFamily:"inherit",
                  fontSize:11,fontWeight:active?700:500,
                  color: active ? s.cor : "rgba(255,255,255,.35)",cursor:"pointer",
                }}>
                  {s.emoji} {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantidade e compras */}
        <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,padding:"11px 13px"}}>
          <div style={{fontSize:9.5,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",color:"rgba(255,255,255,.3)",marginBottom:8}}>Quantidade</div>
          <div style={{display:"flex",alignItems:"baseline",gap:5,marginBottom:9}}>
            <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:30,fontWeight:700,color:"#fff",lineHeight:1}}>{el.qtdTotal}</span>
            <span style={{fontSize:11,color:"rgba(255,255,255,.35)",fontWeight:600}}>{el.un}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"rgba(255,255,255,.4)",marginBottom:5}}>
            <span>{el.qtdComprada} comprados</span>
            <span style={{color:statusColor,fontWeight:700}}>{pctComp}%</span>
          </div>
          <div style={{height:4,background:"rgba(255,255,255,.08)",borderRadius:4,overflow:"hidden",marginBottom:6}}>
            <div style={{height:"100%",width:`${pctComp}%`,background:statusColor,borderRadius:4,transition:"width .4s"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
            <span style={{fontSize:11,color:"rgba(255,255,255,.3)",whiteSpace:"nowrap"}}>Atualizar comprados:</span>
            <input type="number" min={0} max={el.qtdTotal} value={el.qtdComprada}
              onChange={e => onQtdCompradaChange(Number(e.target.value))}
              style={{width:60,padding:"4px 7px",borderRadius:6,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.07)",color:"#fff",fontSize:12,fontFamily:"inherit",textAlign:"center",outline:"none"}}/>
          </div>
        </div>

        {/* Produto */}
        {produto && (
          <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,padding:"11px 13px"}}>
            <div style={{fontSize:9.5,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",color:"rgba(255,255,255,.3)",marginBottom:8}}>Produto — Espaço Smart</div>
            <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:3,lineHeight:1.3}}>{produto.nome}</div>
            {produto.fabricante && <div style={{fontSize:11,color:"#3b6ea5",fontWeight:600,marginBottom:8}}>{produto.fabricante}</div>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
              <div>
                <div style={{fontSize:10,color:"rgba(255,255,255,.25)",marginBottom:2}}>Unitário</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:19,fontWeight:700,color:"#fff"}}>
                  {fmt(produto.preco)}<span style={{fontSize:10,color:"rgba(255,255,255,.3)",marginLeft:2}}>/{produto.un||el.un}</span>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,color:"rgba(255,255,255,.25)",marginBottom:2}}>Total</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:"#c0892d"}}>{fmt(produto.preco*el.qtdTotal)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Pendente de compra */}
        {el.qtdComprada < el.qtdTotal && (
          <div style={{background:"rgba(176,122,30,.1)",border:"1px solid rgba(176,122,30,.25)",borderRadius:10,padding:"10px 13px"}}>
            <div style={{fontSize:10.5,fontWeight:700,color:"#c0892d",marginBottom:3}}>⚠ Compra pendente</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.5)"}}>
              {el.qtdTotal - el.qtdComprada} {el.un} ainda não comprados
              {produto && <span style={{color:"#c0892d",fontWeight:700}}> — {fmt(produto.preco*(el.qtdTotal-el.qtdComprada))}</span>}
            </div>
          </div>
        )}
      </div>

      <div style={{padding:"11px 16px",borderTop:"1px solid rgba(255,255,255,.07)",display:"flex",flexDirection:"column",gap:7,flexShrink:0}}>
        {produto && (
          <button onClick={() => onAddToOrcamento({ produtoId:produto.id, nome:produto.nome, categoria:produto.categoria||el.grupo, preco:produto.preco*el.qtdTotal, precoUnit:produto.preco, unidade:produto.un||el.un, quantidade:el.qtdTotal })}
            style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,background:"#981915",color:"#fff",border:"none",borderRadius:8,padding:"10px",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",width:"100%"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{width:14,height:14}}><path d="M12 5v14M5 12h14"/></svg>
            Adicionar ao Orçamento
          </button>
        )}
        <button onClick={onClose} style={{background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.4)",border:"1px solid rgba(255,255,255,.08)",borderRadius:8,padding:"8px",fontFamily:"inherit",fontSize:12,fontWeight:600,cursor:"pointer"}}>
          Fechar
        </button>
      </div>
    </div>
  );
}

// ── Modal: Gerar Orçamento pelo BIM ────────────────────────────────────────
function GerarOrcamentoModal({ getEl, onConfirm, onClose }) {
  const [selecionados, setSelecionados] = useState(new Set(BIM_ELEMENTOS_BASE.map(e => e.id)));

  const items = useMemo(() =>
    BIM_ELEMENTOS_BASE.map(base => {
      const el = getEl(base.id);
      const p = CATALOGO_PRODUTOS.find(p => p.nome.toLowerCase().includes(base.busca.toLowerCase()));
      return { el, produto: p, subtotal: p ? p.preco * (el?.qtdTotal ?? base.qtdBase) : 0 };
    })
  , [getEl]);

  const selectedItems = items.filter(i => selecionados.has(i.el?.id || ""));
  const total = selectedItems.reduce((s, i) => s + i.subtotal, 0);

  function toggle(id) {
    setSelecionados(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  }

  function handleConfirm() {
    for (const { el, produto } of selectedItems) {
      if (!el || !produto) continue;
      onConfirm({ produtoId:produto.id, nome:produto.nome, categoria:produto.categoria||el.grupo, preco:produto.preco*el.qtdTotal, precoUnit:produto.preco, unidade:produto.un||el.un, quantidade:el.qtdTotal });
    }
    onClose();
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#16151a",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,width:"min(560px,100%)",maxHeight:"85vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(0,0,0,.6)"}}>
        <div style={{padding:"18px 22px 15px",borderBottom:"1px solid rgba(255,255,255,.07)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700,color:"#fff"}}>Gerar Orçamento pelo BIM</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.35)",marginTop:2}}>Selecione os elementos para incluir</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.12)",borderRadius:8,width:32,height:32,cursor:"pointer",display:"grid",placeItems:"center"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" style={{width:15,height:15}}><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"14px 22px"}}>
          {items.map(({ el, produto, subtotal }) => {
            if (!el) return null;
            const isOn = selecionados.has(el.id);
            return (
              <div key={el.id} onClick={() => toggle(el.id)} style={{
                display:"flex",alignItems:"center",gap:12,padding:"11px 13px",
                borderRadius:10,cursor:"pointer",marginBottom:6,
                background: isOn ? "rgba(152,25,21,.1)" : "rgba(255,255,255,.03)",
                border: `1px solid ${isOn ? "rgba(152,25,21,.3)" : "rgba(255,255,255,.06)"}`,
                transition:".12s",
              }}>
                <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${isOn?"#981915":"rgba(255,255,255,.2)"}`,background:isOn?"#981915":"transparent",display:"grid",placeItems:"center",flexShrink:0}}>
                  {isOn && <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" style={{width:11,height:11}}><path d="M20 6L9 17l-5-5"/></svg>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{el.label}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginTop:2}}>
                    {el.qtdTotal} {el.un}
                    {produto && <span style={{color:"rgba(255,255,255,.25)"}}> · {produto.nome}</span>}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  {produto
                    ? <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:"#c0892d"}}>{fmt(subtotal)}</div>
                    : <div style={{fontSize:11,color:"rgba(255,255,255,.25)"}}>sem produto</div>
                  }
                </div>
              </div>
            );
          })}
        </div>

        <div style={{padding:"14px 22px",borderTop:"1px solid rgba(255,255,255,.07)",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,.35)"}}>Total selecionado</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:700,color:"#fff",lineHeight:1}}>{fmt(total)}</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.06)",color:"rgba(255,255,255,.4)",border:"1px solid rgba(255,255,255,.1)",borderRadius:9,padding:"10px 16px",fontFamily:"inherit",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancelar</button>
          <button onClick={handleConfirm} disabled={selecionados.size===0} style={{background:"#981915",color:"#fff",border:"none",borderRadius:9,padding:"10px 20px",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",opacity:selecionados.size===0?.5:1}}>
            Adicionar {selecionados.size} ao Orçamento
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard KPI ───────────────────────────────────────────────────────────
function BIMDashboard({ statusMap, getEl }) {
  const els = BIM_ELEMENTOS_BASE.map(b => getEl(b.id));

  const execPct   = Math.round((els.filter(e => e?.status==="concluido").length / els.length)*100);
  const totalItens   = els.reduce((s, e) => s + (e?.qtdTotal||0), 0);
  const totalComp    = els.reduce((s, e) => s + (e?.qtdComprada||0), 0);
  const compraPct    = totalItens ? Math.round((totalComp/totalItens)*100) : 0;
  const totalCusto   = els.reduce((s, e) => {
    if (!e) return s;
    const p = CATALOGO_PRODUTOS.find(p => p.nome.toLowerCase().includes(e.busca.toLowerCase()));
    return s + (p ? p.preco * e.qtdTotal : 0);
  }, 0);
  const pendente = els.reduce((s, e) => {
    if (!e) return s;
    const p = CATALOGO_PRODUTOS.find(p => p.nome.toLowerCase().includes(e.busca.toLowerCase()));
    return s + (p ? p.preco * Math.max(0, e.qtdTotal - e.qtdComprada) : 0);
  }, 0);

  const kpis = [
    { v: `${execPct}%`, l: "Execução", c: execPct===100?"#3f7a4b":execPct>50?"#3b6ea5":"#8c847a" },
    { v: `${compraPct}%`, l: "Compras", c: compraPct===100?"#3f7a4b":compraPct>50?"#c0892d":"#a33327" },
    { v: fmt(totalCusto), l: "Custo estrutura", c: "#fff" },
    { v: fmt(pendente),   l: "A comprar",       c: pendente>0?"#c0892d":"#3f7a4b" },
  ];

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:"rgba(255,255,255,.05)"}}>
      {kpis.map((k,i) => (
        <div key={i} style={{background:"rgba(12,11,16,.95)",padding:"10px 15px",borderRight:i<3?"1px solid rgba(255,255,255,.05)":"none"}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,fontWeight:700,color:k.c,lineHeight:1}}>{k.v}</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,.3)",marginTop:3}}>{k.l}</div>
        </div>
      ))}
    </div>
  );
}

// ── Legenda ─────────────────────────────────────────────────────────────────
function Legend({ selected, onSelect, statusMap }) {
  return (
    <div style={{display:"flex",gap:5,flexWrap:"wrap",padding:"9px 13px",background:"rgba(12,11,16,.95)",borderTop:"1px solid rgba(255,255,255,.05)"}}>
      {BIM_ELEMENTOS_BASE.map(el => {
        const status = statusMap[el.id] || "planejado";
        const sc = STATUS_EXEC[status];
        const isActive = selected === el.id;
        return (
          <button key={el.id} onClick={() => onSelect(isActive ? null : el.id)} style={{
            display:"inline-flex",alignItems:"center",gap:5,
            background: isActive ? sc.cor+"22" : "rgba(255,255,255,.04)",
            border:`1.5px solid ${isActive ? sc.cor+"88" : "rgba(255,255,255,.07)"}`,
            borderRadius:20,padding:"4px 10px",fontFamily:"inherit",fontSize:11,fontWeight:600,
            color: isActive ? sc.cor : "rgba(255,255,255,.4)",cursor:"pointer",transition:".12s",whiteSpace:"nowrap",
          }}>
            <span style={{width:7,height:7,borderRadius:"50%",background:sc.cor,flexShrink:0}}/>
            {el.label}
            <span style={{fontSize:9,opacity:.6}}>{sc.emoji}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function StickViewBIM({ obraId, onAddToOrcamento }) {
  const mountRef  = useRef(null);
  const engineRef = useRef(null);
  const [selected,    setSelected]    = useState(null);
  const [ready,       setReady]       = useState(false);
  const [added,       setAdded]       = useState(null);
  const [showOrcModal, setShowOrcModal] = useState(false);
  const [ifcLabel,    setIfcLabel]    = useState(null);
  const ifcInputRef = useRef(null);

  const { statusMap, setStatus, setQtdComprada, applyIFCQtd, getEl } = useExecStatus(obraId);

  // Atualiza cores 3D sempre que selected ou statusMap mudar
  const updateColors = useCallback((sel, stMap) => {
    if (!engineRef.current) return;
    const { mats } = engineRef.current;
    for (const el of BIM_ELEMENTOS_BASE) {
      const mat = mats[el.id];
      if (!mat) continue;
      const { hex, opacity, transparent } = getEl3DColor(el.id, stMap, sel);
      mat.color.setHex(hex);
      mat.opacity = opacity;
      mat.transparent = transparent;
      // Panels always somewhat transparent (reduced when selected)
      if (!sel && ["osb-externo","la-vidro","drywall"].includes(el.id)) {
        mat.transparent = true; mat.opacity = 0.45;
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
      setSelected(prev => prev === tipo ? null : tipo);
    }).then(engine => {
      if (canceled) { engine.dispose(); return; }
      engineRef.current = engine;
      setReady(true);
    }).catch(console.error);
    return () => { canceled = true; engineRef.current?.dispose(); engineRef.current = null; };
  }, []);

  useEffect(() => { if (ready) updateColors(selected, statusMap); }, [selected, statusMap, ready, updateColors]);

  // IFC file upload
  async function handleIFCFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const counts = parseIFCText(text);
      applyIFCQtd(counts);
      setIfcLabel(file.name);
    } catch (err) {
      console.error("IFC parse error", err);
    }
    e.target.value = "";
  }

  const currentEl = selected ? getEl(selected) : null;

  function handleAdd(item) {
    onAddToOrcamento?.(item);
    setAdded(item.nome);
    setTimeout(() => setAdded(null), 2500);
  }

  return (
    <>
      <style>{`
        @keyframes svpin{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}
      `}</style>

      {showOrcModal && (
        <GerarOrcamentoModal getEl={getEl} onConfirm={handleAdd} onClose={() => setShowOrcModal(false)} />
      )}

      <div style={{border:"1px solid var(--line)",borderRadius:16,overflow:"hidden",background:"#0f0e12"}}>

        {/* Toolbar */}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",background:"rgba(12,11,16,.95)",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(152,25,21,.12)",border:"1px solid rgba(152,25,21,.3)",borderRadius:8,padding:"5px 11px"}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#981915"}}/>
            <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,color:"#fff",letterSpacing:.3}}>StickView™</span>
            <span style={{fontSize:10,color:"rgba(255,255,255,.35)",fontWeight:600}}>Gêmeo Digital</span>
          </div>

          {ifcLabel && (
            <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(63,122,75,.12)",border:"1px solid rgba(63,122,75,.3)",borderRadius:7,padding:"4px 10px",fontSize:11,color:"#3f7a4b",fontWeight:700}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:12,height:12}}><path d="M20 6L9 17l-5-5"/></svg>
              IFC: {ifcLabel}
            </div>
          )}

          <div style={{flex:1}}/>

          <input ref={ifcInputRef} type="file" accept=".ifc" style={{display:"none"}} onChange={handleIFCFile}/>
          <button onClick={() => ifcInputRef.current?.click()} style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"6px 12px",fontFamily:"inherit",fontSize:12,fontWeight:600,color:"rgba(255,255,255,.55)",cursor:"pointer"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:13,height:13}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            Importar IFC
          </button>

          <button onClick={() => setShowOrcModal(true)} style={{display:"inline-flex",alignItems:"center",gap:6,background:"#981915",border:"none",borderRadius:8,padding:"6px 14px",fontFamily:"inherit",fontSize:12,fontWeight:700,color:"#fff",cursor:"pointer"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{width:13,height:13}}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
            Gerar Orçamento
          </button>
        </div>

        {/* 3D Canvas */}
        <div style={{position:"relative",height:460}}>
          <div ref={mountRef} style={{width:"100%",height:"100%"}}/>

          {!ready && (
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#0f0e12",gap:12}}>
              <div style={{width:44,height:44,borderRadius:12,background:"rgba(152,25,21,.12)",border:"1px solid rgba(152,25,21,.25)",display:"grid",placeItems:"center"}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#981915" strokeWidth="1.8" style={{width:24,height:24}}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              </div>
              <span style={{fontSize:12,color:"rgba(255,255,255,.35)",fontWeight:600}}>Carregando modelo 3D…</span>
            </div>
          )}

          {ready && !selected && (
            <div style={{position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",background:"rgba(12,11,16,.85)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,.08)",borderRadius:20,padding:"6px 14px",fontSize:11.5,color:"rgba(255,255,255,.4)",whiteSpace:"nowrap"}}>
              Clique num elemento • Arraste para rotacionar • Scroll para zoom
            </div>
          )}

          {added && (
            <div style={{position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",background:"rgba(63,122,75,.95)",border:"1px solid rgba(255,255,255,.12)",borderRadius:20,padding:"7px 16px",fontSize:12,fontWeight:700,color:"#fff",whiteSpace:"nowrap"}}>
              ✓ Adicionado ao orçamento
            </div>
          )}

          {selected && currentEl && (
            <ElementPanel
              el={currentEl}
              onClose={() => setSelected(null)}
              onStatusChange={(s) => setStatus(selected, s)}
              onQtdCompradaChange={(v) => setQtdComprada(selected, v)}
              onAddToOrcamento={handleAdd}
            />
          )}
        </div>

        <BIMDashboard statusMap={statusMap} getEl={getEl} />
        <Legend selected={selected} onSelect={setSelected} statusMap={statusMap} />
      </div>
    </>
  );
}
