/**
 * StickView™ — Gêmeo Digital BIM
 * Representação viva da obra: 3D + execução + compras + orçamento + IFC.
 * Persistência real no Supabase (obra_bim_elementos).
 */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { CATALOGO_PRODUTOS } from "../../utils/insumosSF";
import { fmt } from "../../utils/format";
import {
  listarBimElementos,
  upsertBimElemento,
  upsertBimElementosBatch,
} from "../../services/repositories/bimElementosRepository";

// ── Constantes estruturais ──────────────────────────────────────────────────
const BW = 12, BD = 8, SH = 2.8, RIDGE_H = 2.0;
const SW = 0.09, SD = 0.04;

// ── Status de execução ──────────────────────────────────────────────────────
export const STATUS_EXEC = {
  planejado:  { label: "Planejado",     emoji: "⚪", cor: "#8c847a", cor3d: 0x2e2e38, cor3dHL: 0x888898 },
  fabricando: { label: "Em fabricação", emoji: "🟡", cor: "#c0892d", cor3d: 0x7a5010, cor3dHL: 0xf0a020 },
  montando:   { label: "Em montagem",   emoji: "🔵", cor: "#3b6ea5", cor3d: 0x1e4070, cor3dHL: 0x4a90d0 },
  concluido:  { label: "Concluído",     emoji: "🟢", cor: "#3f7a4b", cor3d: 0x1e4a28, cor3dHL: 0x50c060 },
  problema:   { label: "Problema",      emoji: "🔴", cor: "#a33327", cor3d: 0x6a1a14, cor3dHL: 0xee3030 },
};
const STATUS_KEYS = Object.keys(STATUS_EXEC);

// ── Mapeamento IFC → elemento ───────────────────────────────────────────────
const IFC_ELEMENT_MAP = {
  IFCMEMBER: "montante-90", IFCBEAM: "guia-90", IFCCOLUMN: "montante-90",
  IFCWALLSTANDARDCASE: "osb-externo", IFCWALL: "drywall", IFCPLATE: "osb-externo",
  IFCROOFING: "cobertura", IFCROOF: "cobertura",
  IFCFASTENER: "parafuso", IFCMECHANICALFASTENER: "parafuso",
  IFCCOVERING: "la-vidro",
};

export function parseIFCText(text) {
  const upper = text.toUpperCase();
  const result = {};
  for (const [t, id] of Object.entries(IFC_ELEMENT_MAP)) {
    const count = (upper.match(new RegExp(`#\\d+=${t}[\\s(]`, "g")) || []).length;
    if (count > 0) result[id] = (result[id] || 0) + count;
  }
  return result;
}

// ── Registro base de elementos ──────────────────────────────────────────────
export const BIM_ELEMENTOS_BASE = [
  { id:"montante-90", label:"Montante 90mm",       descr:"Perfil C st37 90×40×12mm",              grupo:"Estrutura",  busca:"montante", un:"barra",  qtdBase:184 },
  { id:"guia-90",     label:"Guia 90mm",           descr:"Perfil U 90×40×1,25mm",                 grupo:"Estrutura",  busca:"guia",     un:"barra",  qtdBase:96  },
  { id:"osb-externo", label:"OSB Externo 11,1mm",  descr:"Painel OSB 1220×2440×11,1mm",           grupo:"Fechamento", busca:"osb",      un:"chapa",  qtdBase:48  },
  { id:"la-vidro",    label:"Lã de Vidro 50mm",    descr:"Manta termoacústica 50mm — 11,25m²/rl", grupo:"Isolamento", busca:"lã",       un:"rolo",   qtdBase:24  },
  { id:"drywall",     label:"Drywall BA 12,5mm",   descr:"Placa gesso acartonado 1200×2400mm",    grupo:"Fechamento", busca:"gesso",    un:"chapa",  qtdBase:60  },
  { id:"cobertura",   label:"Telha Shingle",        descr:"Asfáltico architectural — 3,1m²/fardo", grupo:"Cobertura",  busca:"shingle",  un:"fardo",  qtdBase:18  },
  { id:"parafuso",    label:"Parafuso Tek 4,2×13", descr:"Autoperfurante zincado — cx 1000un",    grupo:"Fixação",    busca:"parafuso", un:"caixa",  qtdBase:12  },
];

const GRUPOS_ESTRUTURAIS = ["Estrutura", "Cobertura"];

// ── Hook: status por obra (Supabase com fallback localStorage) ──────────────
function useExecStatus(obraId) {
  const lsKey = `bim_exec_${obraId || "demo"}`;

  const [data, setData]       = useState({});   // { [elementoId]: row }
  const [loading, setLoading] = useState(false);

  // Carrega do Supabase (ou localStorage se offline/sem obraId)
  useEffect(() => {
    if (!obraId) {
      try { setData(JSON.parse(localStorage.getItem(lsKey) || "{}")); } catch {}
      return;
    }
    setLoading(true);
    listarBimElementos(obraId)
      .then(rows => {
        const map = {};
        for (const r of rows) map[r.elemento_id] = r;
        setData(map);
        localStorage.setItem(lsKey, JSON.stringify(map));
      })
      .catch(() => {
        try { setData(JSON.parse(localStorage.getItem(lsKey) || "{}")); } catch {}
      })
      .finally(() => setLoading(false));
  }, [obraId]); // eslint-disable-line

  const getEl = useCallback((id) => {
    const base = BIM_ELEMENTOS_BASE.find(e => e.id === id);
    if (!base) return null;
    const row = data[id] || {};
    return {
      ...base,
      qtdTotal:    row.qtd_total    ?? base.qtdBase,
      qtdComprada: row.qtd_comprada ?? Math.floor(base.qtdBase * 0.65),
      status:      row.status       ?? "planejado",
    };
  }, [data]);

  const setStatus = useCallback(async (id, status, updatedBy) => {
    setData(prev => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), status } };
      localStorage.setItem(lsKey, JSON.stringify(next));
      return next;
    });
    if (obraId) {
      upsertBimElemento(obraId, id, { status, updated_by: updatedBy }).catch(() => {});
    }
  }, [obraId, lsKey]);

  const setQtdComprada = useCallback(async (id, qtd_comprada) => {
    setData(prev => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), qtd_comprada } };
      localStorage.setItem(lsKey, JSON.stringify(next));
      return next;
    });
    if (obraId) {
      upsertBimElemento(obraId, id, { qtd_comprada }).catch(() => {});
    }
  }, [obraId, lsKey]);

  const applyIFCQtd = useCallback(async (counts) => {
    setData(prev => {
      const next = { ...prev };
      for (const [id, qtd] of Object.entries(counts)) {
        next[id] = { ...(next[id] || {}), qtd_total: qtd };
      }
      localStorage.setItem(lsKey, JSON.stringify(next));
      return next;
    });
    if (obraId) {
      const batch = Object.entries(counts).map(([elementoId, qtd]) => ({ elementoId, qtd_total: qtd }));
      upsertBimElementosBatch(obraId, batch).catch(() => {});
    }
  }, [obraId, lsKey]);

  // Atualiza em batch — usado pelo RDO
  const applyBatch = useCallback(async (updates, updatedBy) => {
    setData(prev => {
      const next = { ...prev };
      for (const u of updates) {
        next[u.elementoId] = { ...(next[u.elementoId] || {}), status: u.status };
      }
      localStorage.setItem(lsKey, JSON.stringify(next));
      return next;
    });
    if (obraId) {
      upsertBimElementosBatch(obraId, updates.map(u => ({ ...u, updated_by: updatedBy }))).catch(() => {});
    }
  }, [obraId, lsKey]);

  return { loading, getEl, setStatus, setQtdComprada, applyIFCQtd, applyBatch, rawData: data };
}

// ── Cor 3D por status ───────────────────────────────────────────────────────
function get3DColor(id, statusMap, selected) {
  const status = statusMap[id] || "planejado";
  const sc = STATUS_EXEC[status] || STATUS_EXEC.planejado;
  if (!selected)      return { hex: sc.cor3d, opacity: 1, transparent: false };
  if (id === selected) return { hex: sc.cor3dHL, opacity: 1, transparent: false };
  return { hex: sc.cor3d, opacity: 0.12, transparent: true };
}

// ── Cena Three.js (procedural) ──────────────────────────────────────────────
async function buildThreeScene(container, onElementClick) {
  const threeModule = await import("three");
  const THREE = threeModule.default ?? threeModule;
  const orbitModule = await import("three/addons/controls/OrbitControls.js");
  const OrbitControls = orbitModule.OrbitControls ?? orbitModule.default?.OrbitControls;

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
  sun.shadow.camera.left = -22; sun.shadow.camera.right = 22;
  sun.shadow.camera.top  =  22; sun.shadow.camera.bottom = -22;
  sun.shadow.camera.far  = 60;
  scene.add(sun);

  scene.add(new THREE.GridHelper(60, 60, 0x1a1a20, 0x171720));

  const mats = {};
  for (const el of BIM_ELEMENTOS_BASE) {
    mats[el.id] = new THREE.MeshLambertMaterial({ color: STATUS_EXEC.planejado.cor3d });
  }

  const allMeshes = [], grps = {};
  for (const el of BIM_ELEMENTOS_BASE) {
    grps[el.id] = new THREE.Group();
    grps[el.id].userData.tipo = el.id;
    scene.add(grps[el.id]);
  }

  function addMesh(geo, tipo, pos, rotZ) {
    const m = new THREE.Mesh(geo, mats[tipo]);
    m.userData.tipo = tipo; m.castShadow = true; m.receiveShadow = true;
    if (pos) m.position.set(...pos);
    if (rotZ !== undefined) m.rotation.z = rotZ;
    grps[tipo].add(m); allMeshes.push(m); return m;
  }

  // Slab
  const slabMesh = new THREE.Mesh(new THREE.BoxGeometry(BW+1.2, 0.24, BD+1.2), new THREE.MeshLambertMaterial({ color: 0x555548 }));
  slabMesh.position.y = -0.12; slabMesh.receiveShadow = true;
  scene.add(slabMesh);

  // Montantes
  const nFW = Math.floor(BW/0.6), nLW = Math.floor(BD/0.6);
  for (const walls of [
    { n: nFW, fn: (t) => [-BW/2+t*BW, SH/2, -BD/2, SW, SD] },
    { n: nFW, fn: (t) => [-BW/2+t*BW, SH/2, BD/2,  SW, SD] },
    { n: nLW, fn: (t) => [-BW/2, SH/2, -BD/2+t*BD, SD, SW] },
    { n: nLW, fn: (t) => [BW/2,  SH/2, -BD/2+t*BD, SD, SW] },
    { n: nLW, fn: (t) => [-BW/4, SH/2, -BD/2+t*BD, SD, SW] },
  ]) {
    for (let i = 0; i <= walls.n; i++) {
      const [x, y, z, gx, gz] = walls.fn(i / walls.n);
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
  // OSB
  const oT=0.013, lT=0.05, dT=0.013, dOff=SW+lT+dT/2+0.003;
  addMesh(new THREE.BoxGeometry(BW, SH, oT), "osb-externo", [0, SH/2, -BD/2-0.025]);
  addMesh(new THREE.BoxGeometry(BW, SH, oT), "osb-externo", [0, SH/2, BD/2+0.025]);
  addMesh(new THREE.BoxGeometry(oT, SH, BD), "osb-externo", [-BW/2-0.025, SH/2, 0]);
  addMesh(new THREE.BoxGeometry(oT, SH, BD), "osb-externo", [BW/2+0.025, SH/2, 0]);
  // Lã
  addMesh(new THREE.BoxGeometry(BW-SW*2, SH-SW*2, lT), "la-vidro", [0, SH/2, -BD/2+lT/2+SW]);
  addMesh(new THREE.BoxGeometry(BW-SW*2, SH-SW*2, lT), "la-vidro", [0, SH/2, BD/2-lT/2-SW]);
  addMesh(new THREE.BoxGeometry(lT, SH-SW*2, BD-SW*2), "la-vidro", [-BW/2+lT/2+SW, SH/2, 0]);
  addMesh(new THREE.BoxGeometry(lT, SH-SW*2, BD-SW*2), "la-vidro", [BW/2-lT/2-SW, SH/2, 0]);
  // Drywall
  addMesh(new THREE.BoxGeometry(BW-SW*3, SH-SW*2, dT), "drywall", [0, SH/2, -BD/2+dOff]);
  addMesh(new THREE.BoxGeometry(BW-SW*3, SH-SW*2, dT), "drywall", [0, SH/2, BD/2-dOff]);
  addMesh(new THREE.BoxGeometry(dT, SH-SW*2, BD-SW*3), "drywall", [-BW/2+dOff, SH/2, 0]);
  addMesh(new THREE.BoxGeometry(dT, SH-SW*2, BD-SW*3), "drywall", [BW/2-dOff, SH/2, 0]);
  addMesh(new THREE.BoxGeometry(dT, SH-SW*2, BD-SW*3), "drywall", [-BW/4+dOff, SH/2, 0]);
  addMesh(new THREE.BoxGeometry(dT, SH-SW*2, BD-SW*3), "drywall", [-BW/4-dOff, SH/2, 0]);
  // Trusses
  const rHyp = Math.sqrt((BW/2)**2 + RIDGE_H**2), rAng = Math.atan2(RIDGE_H, BW/2);
  for (let z = -BD/2+0.4; z <= BD/2-0.4+0.01; z += 1.5) {
    addMesh(new THREE.BoxGeometry(rHyp+0.3, SD, SW*2), "montante-90", [-BW/4, SH+RIDGE_H/2, z], rAng);
    addMesh(new THREE.BoxGeometry(rHyp+0.3, SD, SW*2), "montante-90", [BW/4,  SH+RIDGE_H/2, z], -rAng);
    addMesh(new THREE.BoxGeometry(BW+SD, SD*1.5, SD*2), "guia-90", [0, SH+SD, z]);
    addMesh(new THREE.BoxGeometry(SD, RIDGE_H, SD*2), "montante-90", [0, SH+RIDGE_H/2, z]);
  }
  addMesh(new THREE.BoxGeometry(SD*2, SD*2, BD+0.8), "guia-90", [0, SH+RIDGE_H, 0]);
  addMesh(new THREE.BoxGeometry(rHyp+0.5, 0.07, BD+0.8), "cobertura", [-BW/4, SH+RIDGE_H/2, 0], rAng);
  addMesh(new THREE.BoxGeometry(rHyp+0.5, 0.07, BD+0.8), "cobertura", [BW/4,  SH+RIDGE_H/2, 0], -rAng);
  addMesh(new THREE.BoxGeometry(BW+0.4, 0.06, BD+0.8), "guia-90", [0, SH, 0]);
  // Parafusos
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
    return { x:((e.clientX-r.left)/r.width)*2-1, y:-((e.clientY-r.top)/r.height)*2+1 };
  }
  function onMouseMove(e) {
    const {x,y}=getCoords(e); mouse.x=x; mouse.y=y;
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(allMeshes)[0];
    renderer.domElement.style.cursor = hit?.object.userData.tipo ? "pointer":"default";
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
  (function animate() { animId=requestAnimationFrame(animate); controls.update(); renderer.render(scene,camera); })();

  return {
    mats,
    dispose() {
      cancelAnimationFrame(animId);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("click", onClick);
      ro.disconnect(); renderer.dispose();
      if (renderer.domElement.parentNode===container) container.removeChild(renderer.domElement);
    },
  };
}

// ── Painel lateral ──────────────────────────────────────────────────────────
function ElementPanel({ el, user, onClose, onStatusChange, onQtdChange, onAddToOrcamento }) {
  if (!el) return null;
  const sc = STATUS_EXEC[el.status] || STATUS_EXEC.planejado;
  const grCor = { Estrutura:"#981915", Fechamento:"#c0892d", Isolamento:"#b07a1e", Cobertura:"#3b6ea5", Fixação:"#6d557e" }[el.grupo] || "#8c847a";
  const pct = el.qtdTotal ? Math.round((el.qtdComprada/el.qtdTotal)*100) : 0;
  const barCor = el.qtdComprada>=el.qtdTotal?"#3f7a4b":el.qtdComprada>0?"#c0892d":"#a33327";

  const produto = useMemo(() =>
    CATALOGO_PRODUTOS.find(p => p.nome.toLowerCase().includes(el.busca.toLowerCase()))
  , [el.busca]);

  return (
    <div style={{position:"absolute",top:0,right:0,bottom:0,width:296,background:"rgba(10,9,14,0.97)",backdropFilter:"blur(14px)",borderLeft:"1px solid rgba(255,255,255,.07)",display:"flex",flexDirection:"column",overflow:"hidden",animation:"svpin .18s cubic-bezier(.2,.7,.3,1)"}}>
      {/* Header */}
      <div style={{padding:"14px 15px 12px",borderBottom:"1px solid rgba(255,255,255,.06)",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <span style={{fontSize:8,fontWeight:800,letterSpacing:1.4,textTransform:"uppercase",color:grCor,background:grCor+"22",padding:"3px 7px",borderRadius:4}}>{el.grupo}</span>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:7,width:26,height:26,cursor:"pointer",display:"grid",placeItems:"center"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" style={{width:13,height:13}}><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{fontSize:15,fontWeight:700,color:"#fff",lineHeight:1.25,marginTop:6}}>{el.label}</div>
        <div style={{fontSize:11,color:"rgba(255,255,255,.3)",marginTop:3}}>{el.descr}</div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"12px 15px",display:"flex",flexDirection:"column",gap:12}}>
        {/* Status execução */}
        <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,padding:"10px 12px"}}>
          <div style={{fontSize:9,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",color:"rgba(255,255,255,.3)",marginBottom:8}}>Status de Execução</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {STATUS_KEYS.map(k => {
              const s=STATUS_EXEC[k], active=el.status===k;
              return (
                <button key={k} onClick={() => onStatusChange(k)} style={{display:"inline-flex",alignItems:"center",gap:4,background:active?s.cor+"22":"rgba(255,255,255,.04)",border:`1px solid ${active?s.cor+"88":"rgba(255,255,255,.08)"}`,borderRadius:7,padding:"5px 9px",fontFamily:"inherit",fontSize:10.5,fontWeight:active?700:500,color:active?s.cor:"rgba(255,255,255,.35)",cursor:"pointer"}}>
                  {s.emoji} {s.label}
                </button>
              );
            })}
          </div>
          {user && (
            <div style={{fontSize:10,color:"rgba(255,255,255,.2)",marginTop:7}}>
              Salvo por obra no banco · por {user.nome || user.email}
            </div>
          )}
        </div>

        {/* Quantidade */}
        <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,padding:"10px 12px"}}>
          <div style={{fontSize:9,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",color:"rgba(255,255,255,.3)",marginBottom:7}}>Quantidade</div>
          <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:8}}>
            <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:700,color:"#fff",lineHeight:1}}>{el.qtdTotal}</span>
            <span style={{fontSize:11,color:"rgba(255,255,255,.3)",fontWeight:600}}>{el.un}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10.5,color:"rgba(255,255,255,.35)",marginBottom:4}}>
            <span>{el.qtdComprada} comprados</span>
            <span style={{color:barCor,fontWeight:700}}>{pct}%</span>
          </div>
          <div style={{height:4,background:"rgba(255,255,255,.07)",borderRadius:4,overflow:"hidden",marginBottom:7}}>
            <div style={{height:"100%",width:`${pct}%`,background:barCor,borderRadius:4,transition:"width .4s"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <span style={{fontSize:10.5,color:"rgba(255,255,255,.3)",whiteSpace:"nowrap"}}>Comprados:</span>
            <input type="number" min={0} max={el.qtdTotal} value={el.qtdComprada}
              onChange={e => onQtdChange(Number(e.target.value))}
              style={{width:55,padding:"4px 7px",borderRadius:6,border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.07)",color:"#fff",fontSize:12,fontFamily:"inherit",textAlign:"center",outline:"none"}}/>
          </div>
        </div>

        {/* Produto */}
        {produto && (
          <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,padding:"10px 12px"}}>
            <div style={{fontSize:9,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",color:"rgba(255,255,255,.3)",marginBottom:7}}>Produto · Espaço Smart</div>
            <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:3,lineHeight:1.3}}>{produto.nome}</div>
            {produto.fabricante && <div style={{fontSize:11,color:"#3b6ea5",fontWeight:600,marginBottom:7}}>{produto.fabricante}</div>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
              <div>
                <div style={{fontSize:9.5,color:"rgba(255,255,255,.25)",marginBottom:1}}>Unitário</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700,color:"#fff"}}>
                  {fmt(produto.preco)}<span style={{fontSize:9,color:"rgba(255,255,255,.3)",marginLeft:2}}>/{produto.un||el.un}</span>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:9.5,color:"rgba(255,255,255,.25)",marginBottom:1}}>Total</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:"#c0892d"}}>{fmt(produto.preco*el.qtdTotal)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Alerta compra pendente */}
        {el.qtdComprada < el.qtdTotal && (
          <div style={{background:"rgba(176,122,30,.1)",border:"1px solid rgba(176,122,30,.2)",borderRadius:9,padding:"9px 12px"}}>
            <div style={{fontSize:10.5,fontWeight:700,color:"#c0892d",marginBottom:2}}>⚠ Compra pendente</div>
            <div style={{fontSize:11.5,color:"rgba(255,255,255,.45)"}}>
              {el.qtdTotal-el.qtdComprada} {el.un} a comprar
              {produto && <span style={{color:"#c0892d",fontWeight:700}}> · {fmt(produto.preco*(el.qtdTotal-el.qtdComprada))}</span>}
            </div>
          </div>
        )}
      </div>

      <div style={{padding:"10px 15px",borderTop:"1px solid rgba(255,255,255,.07)",display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
        {produto && (
          <button onClick={() => onAddToOrcamento?.([{ produtoId:produto.id,nome:produto.nome,categoria:produto.categoria||el.grupo,preco:produto.preco*el.qtdTotal,precoUnit:produto.preco,unidade:produto.un||el.un,quantidade:el.qtdTotal }], produto.preco*el.qtdTotal)}
            style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,background:"#981915",color:"#fff",border:"none",borderRadius:8,padding:"10px",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",width:"100%"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{width:14,height:14}}><path d="M12 5v14M5 12h14"/></svg>
            Adicionar ao Orçamento
          </button>
        )}
        <button onClick={onClose} style={{background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.35)",border:"1px solid rgba(255,255,255,.07)",borderRadius:8,padding:"8px",fontFamily:"inherit",fontSize:12,cursor:"pointer"}}>Fechar</button>
      </div>
    </div>
  );
}

// ── Modal: Gerar Orçamento pelo BIM ────────────────────────────────────────
function GerarOrcamentoModal({ getEl, onConfirm, onClose }) {
  const [sel, setSel] = useState(new Set(BIM_ELEMENTOS_BASE.map(e => e.id)));

  const items = BIM_ELEMENTOS_BASE.map(base => {
    const el = getEl(base.id);
    const p  = CATALOGO_PRODUTOS.find(p => p.nome.toLowerCase().includes(base.busca.toLowerCase()));
    return { el: el || base, produto: p, subtotal: p ? p.preco*(el?.qtdTotal??base.qtdBase) : 0 };
  });

  const total = items.filter(i => sel.has(i.el.id)).reduce((s, i) => s+i.subtotal, 0);

  function toggle(id) { setSel(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; }); }

  function confirm() {
    const lista = items
      .filter(i => sel.has(i.el.id) && i.produto)
      .map(({ el, produto }) => ({
        produtoId: produto.id, nome: produto.nome,
        categoria: produto.categoria || el.grupo,
        precoUnit: produto.preco, quantidade: el.qtdTotal || el.qtdBase,
        preco: produto.preco * (el.qtdTotal || el.qtdBase),
        unidade: produto.un || el.un,
      }));
    if (lista.length) onConfirm(lista, total);
    onClose();
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.72)",zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#14131a",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,width:"min(540px,100%)",maxHeight:"85vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(0,0,0,.6)"}}>
        <div style={{padding:"17px 20px 14px",borderBottom:"1px solid rgba(255,255,255,.07)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700,color:"#fff"}}>Gerar Orçamento pelo BIM</div>
            <div style={{fontSize:11.5,color:"rgba(255,255,255,.3)",marginTop:2}}>Selecione os elementos para incluir</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,width:30,height:30,cursor:"pointer",display:"grid",placeItems:"center"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" style={{width:14,height:14}}><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"13px 20px"}}>
          {items.map(({ el, produto, subtotal }) => {
            const on = sel.has(el.id);
            return (
              <div key={el.id} onClick={() => toggle(el.id)} style={{display:"flex",alignItems:"center",gap:11,padding:"10px 12px",borderRadius:9,cursor:"pointer",marginBottom:5,background:on?"rgba(152,25,21,.1)":"rgba(255,255,255,.03)",border:`1px solid ${on?"rgba(152,25,21,.3)":"rgba(255,255,255,.06)"}`,transition:".12s"}}>
                <div style={{width:17,height:17,borderRadius:5,border:`2px solid ${on?"#981915":"rgba(255,255,255,.18)"}`,background:on?"#981915":"transparent",display:"grid",placeItems:"center",flexShrink:0}}>
                  {on && <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" style={{width:10,height:10}}><path d="M20 6L9 17l-5-5"/></svg>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{el.label}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,.3)",marginTop:1}}>{el.qtdTotal || el.qtdBase} {el.un}{produto ? ` · ${produto.nome}` : ""}</div>
                </div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:produto?"#c0892d":"rgba(255,255,255,.2)"}}>
                  {produto ? fmt(subtotal) : "sem produto"}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{padding:"13px 20px",borderTop:"1px solid rgba(255,255,255,.07)",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <div style={{flex:1}}>
            <div style={{fontSize:10.5,color:"rgba(255,255,255,.3)"}}>Total selecionado</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:21,fontWeight:700,color:"#fff",lineHeight:1}}>{fmt(total)}</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.4)",border:"1px solid rgba(255,255,255,.09)",borderRadius:9,padding:"9px 15px",fontFamily:"inherit",fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancelar</button>
          <button onClick={confirm} disabled={!sel.size} style={{background:sel.size?"#981915":"rgba(255,255,255,.08)",color:sel.size?"#fff":"rgba(255,255,255,.2)",border:"none",borderRadius:9,padding:"9px 18px",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:sel.size?"pointer":"default"}}>
            Adicionar {sel.size} ao Orçamento
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Saúde da Obra ─────────────────────────────────────────────────
function SaudeObra({ getEl }) {
  const els = BIM_ELEMENTOS_BASE.map(b => getEl(b.id));

  const estrut = els.filter(e => e && GRUPOS_ESTRUTURAIS.includes(e.grupo));
  const estrutPct = estrut.length
    ? Math.round((estrut.filter(e => e.status==="concluido").length / estrut.length)*100)
    : 0;

  const totalQtd  = els.reduce((s,e) => s+(e?.qtdTotal||0), 0);
  const compQtd   = els.reduce((s,e) => s+(e?.qtdComprada||0), 0);
  const compraPct = totalQtd ? Math.round((compQtd/totalQtd)*100) : 0;

  const problemas = els.filter(e => e?.status==="problema").length;
  const bloqueios = els.filter(e => e?.status==="montando" && (e?.qtdComprada||0)===0).length;
  const risco     = problemas>0 ? "alto" : bloqueios>0 ? "médio" : "baixo";
  const riscoCor  = risco==="alto"?"#a33327":risco==="médio"?"#c0892d":"#3f7a4b";

  const totalCusto  = els.reduce((s,e) => {
    if (!e) return s;
    const p = CATALOGO_PRODUTOS.find(p => p.nome.toLowerCase().includes(e.busca.toLowerCase()));
    return s + (p ? p.preco*e.qtdTotal : 0);
  }, 0);
  const pendenteCusto = els.reduce((s,e) => {
    if (!e) return s;
    const p = CATALOGO_PRODUTOS.find(p => p.nome.toLowerCase().includes(e.busca.toLowerCase()));
    return s + (p ? p.preco*Math.max(0, e.qtdTotal-e.qtdComprada) : 0);
  }, 0);

  const kpis = [
    { emoji:"🏗", label:"Estrutura",   val:`${estrutPct}%`, sub:`${estrut.filter(e=>e?.status==="concluido").length}/${estrut.length} tipos`,   cor: estrutPct===100?"#3f7a4b":estrutPct>50?"#3b6ea5":"#8c847a" },
    { emoji:"📦", label:"Compras",     val:`${compraPct}%`, sub:`${compQtd}/${totalQtd} itens`,   cor: compraPct===100?"#3f7a4b":compraPct>60?"#c0892d":"#a33327" },
    { emoji:"⚡", label:"Risco",       val:risco.toUpperCase(), sub:`${problemas} problema${problemas!==1?"s":""}`, cor:riscoCor },
    { emoji:"💰", label:"A comprar",   val:fmt(pendenteCusto), sub:`de ${fmt(totalCusto)} total`, cor: pendenteCusto===0?"#3f7a4b":"#c0892d" },
  ];

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:"rgba(255,255,255,.04)"}}>
      {kpis.map((k,i) => (
        <div key={i} style={{background:"rgba(10,9,14,.97)",padding:"9px 14px",borderRight:i<3?"1px solid rgba(255,255,255,.04)":"none"}}>
          <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
            <span style={{fontSize:13}}>{k.emoji}</span>
            <span style={{fontSize:9.5,fontWeight:800,letterSpacing:.8,textTransform:"uppercase",color:"rgba(255,255,255,.3)"}}>{k.label}</span>
          </div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:k.cor,lineHeight:1}}>{k.val}</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,.25)",marginTop:2}}>{k.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── Legenda ─────────────────────────────────────────────────────────────────
function Legend({ selected, onSelect, getEl }) {
  return (
    <div style={{display:"flex",gap:5,flexWrap:"wrap",padding:"8px 12px",background:"rgba(10,9,14,.97)",borderTop:"1px solid rgba(255,255,255,.04)"}}>
      {BIM_ELEMENTOS_BASE.map(base => {
        const el     = getEl(base.id);
        const status = el?.status || "planejado";
        const sc     = STATUS_EXEC[status];
        const isActive = selected === base.id;
        return (
          <button key={base.id} onClick={() => onSelect(isActive?null:base.id)} style={{display:"inline-flex",alignItems:"center",gap:5,background:isActive?sc.cor+"22":"rgba(255,255,255,.04)",border:`1.5px solid ${isActive?sc.cor+"88":"rgba(255,255,255,.07)"}`,borderRadius:20,padding:"4px 10px",fontFamily:"inherit",fontSize:10.5,fontWeight:600,color:isActive?sc.cor:"rgba(255,255,255,.4)",cursor:"pointer",whiteSpace:"nowrap",transition:".12s"}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:sc.cor,flexShrink:0}}/>
            {base.label}
            <span style={{fontSize:8.5,opacity:.55}}>{sc.emoji}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function StickViewBIM({ obraId, user, onAddToOrcamento }) {
  const mountRef   = useRef(null);
  const engineRef  = useRef(null);
  const ifcRef     = useRef(null);
  const [selected,  setSelected]  = useState(null);
  const [ready,     setReady]     = useState(false);
  const [added,     setAdded]     = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [ifcLabel,  setIfcLabel]  = useState(null);

  const { loading, getEl, setStatus, setQtdComprada, applyIFCQtd } = useExecStatus(obraId);

  // statusMap derivado do getEl para colorir
  const statusMap = useMemo(() => {
    const m = {};
    for (const el of BIM_ELEMENTOS_BASE) m[el.id] = getEl(el.id)?.status || "planejado";
    return m;
  }, [getEl]);

  const updateColors = useCallback((sel, sMap) => {
    if (!engineRef.current) return;
    const { mats } = engineRef.current;
    for (const el of BIM_ELEMENTOS_BASE) {
      const mat = mats[el.id];
      if (!mat) continue;
      const { hex, opacity, transparent } = get3DColor(el.id, sMap, sel);
      mat.color.setHex(hex);
      mat.opacity = opacity;
      mat.transparent = transparent;
      if (!sel && ["osb-externo","la-vidro","drywall"].includes(el.id)) {
        mat.transparent = true; mat.opacity = 0.42;
      }
      mat.needsUpdate = true;
    }
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    let canceled = false;

    function launch() {
      if (canceled || engineRef.current) return;
      const { width } = mountRef.current.getBoundingClientRect();
      if (!width) return; // still zero, observer will retry

      buildThreeScene(mountRef.current, tipo => {
        if (!canceled) setSelected(prev => prev===tipo?null:tipo);
      }).then(engine => {
        if (canceled) { engine.dispose(); return; }
        engineRef.current = engine;
        setReady(true);
      }).catch(err => {
        console.error("StickViewBIM Three.js error:", err);
        if (!canceled) setReady(true); // show UI even if 3D fails
      });
    }

    // Try immediately, then observe for when container gets painted width
    launch();
    const ro = new ResizeObserver(launch);
    ro.observe(mountRef.current);

    return () => {
      canceled = true;
      ro.disconnect();
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => { if (ready) updateColors(selected, statusMap); }, [selected, statusMap, ready, updateColors]);

  async function handleIFC(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const counts = parseIFCText(await file.text());
      await applyIFCQtd(counts);
      setIfcLabel(file.name);
    } catch(err) { console.error("IFC error", err); }
    e.target.value = "";
  }

  function handleAdd(lista, total) {
    onAddToOrcamento?.(lista, total);
    setAdded(`${lista.length} itens`);
    setTimeout(() => setAdded(null), 2500);
  }

  const currentEl = selected ? getEl(selected) : null;

  return (
    <>
      <style>{`@keyframes svpin{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}`}</style>
      {showModal && <GerarOrcamentoModal getEl={getEl} onConfirm={handleAdd} onClose={() => setShowModal(false)} />}

      <div style={{border:"1px solid var(--line)",borderRadius:16,overflow:"hidden",background:"#0f0e12"}}>
        {/* Toolbar */}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"rgba(10,9,14,.97)",borderBottom:"1px solid rgba(255,255,255,.05)"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(152,25,21,.1)",border:"1px solid rgba(152,25,21,.25)",borderRadius:8,padding:"5px 10px"}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:"#981915"}}/>
            <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,color:"#fff",letterSpacing:.3}}>StickView™</span>
            <span style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>Gêmeo Digital</span>
          </div>
          {ifcLabel && (
            <span style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(63,122,75,.1)",border:"1px solid rgba(63,122,75,.25)",borderRadius:6,padding:"3px 9px",fontSize:10.5,color:"#3f7a4b",fontWeight:700}}>
              ✓ {ifcLabel}
            </span>
          )}
          {loading && <span style={{fontSize:11,color:"rgba(255,255,255,.25)"}}>carregando…</span>}
          <div style={{flex:1}}/>
          <input ref={ifcRef} type="file" accept=".ifc" style={{display:"none"}} onChange={handleIFC}/>
          <button onClick={() => ifcRef.current?.click()} style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.09)",borderRadius:7,padding:"5px 11px",fontFamily:"inherit",fontSize:11.5,fontWeight:600,color:"rgba(255,255,255,.5)",cursor:"pointer"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:12,height:12}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            Importar IFC
          </button>
          <button onClick={() => setShowModal(true)} style={{display:"inline-flex",alignItems:"center",gap:5,background:"#981915",border:"none",borderRadius:7,padding:"5px 13px",fontFamily:"inherit",fontSize:11.5,fontWeight:700,color:"#fff",cursor:"pointer"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{width:12,height:12}}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
            Gerar Orçamento
          </button>
        </div>

        {/* Canvas 3D */}
        <div style={{position:"relative",height:460}}>
          <div ref={mountRef} style={{width:"100%",height:"100%"}}/>
          {!ready && (
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#0f0e12",gap:10}}>
              <div style={{width:40,height:40,borderRadius:10,background:"rgba(152,25,21,.1)",border:"1px solid rgba(152,25,21,.2)",display:"grid",placeItems:"center"}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#981915" strokeWidth="1.8" style={{width:22,height:22}}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              </div>
              <span style={{fontSize:11.5,color:"rgba(255,255,255,.3)"}}>Carregando modelo 3D…</span>
            </div>
          )}
          {ready && !selected && (
            <div style={{position:"absolute",bottom:12,left:"50%",transform:"translateX(-50%)",background:"rgba(10,9,14,.85)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,.07)",borderRadius:20,padding:"5px 14px",fontSize:11,color:"rgba(255,255,255,.35)",whiteSpace:"nowrap"}}>
              Clique num elemento • Arraste para rotacionar • Scroll para zoom
            </div>
          )}
          {added && (
            <div style={{position:"absolute",bottom:12,left:"50%",transform:"translateX(-50%)",background:"rgba(63,122,75,.95)",borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:700,color:"#fff",whiteSpace:"nowrap"}}>
              ✓ Adicionado ao orçamento
            </div>
          )}
          {selected && currentEl && (
            <ElementPanel
              el={currentEl} user={user}
              onClose={() => setSelected(null)}
              onStatusChange={s => setStatus(selected, s, user?.nome||user?.email)}
              onQtdChange={v => setQtdComprada(selected, v)}
              onAddToOrcamento={handleAdd}
            />
          )}
        </div>

        <SaudeObra getEl={getEl} />
        <Legend selected={selected} onSelect={setSelected} getEl={getEl} />
      </div>
    </>
  );
}

// Export para uso externo (RDO)
export { useExecStatus };
