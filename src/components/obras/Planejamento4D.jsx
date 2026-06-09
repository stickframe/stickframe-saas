import { useState, useEffect, useRef } from "react";
import { C } from "../../utils/constants";
import Btn from "../ui/Btn";

const FASES_4D = [
  { key: "Projeto executivo",    label: "Projeto & Planejamento", desc: "Desenho arquitetônico, marcação de gabarito e nivelamento do terreno." },
  { key: "Fundação",             label: "Fundação (Radier)",      desc: "Escavação, montagem das armaduras e concretagem da laje de fundação." },
  { key: "Estrutura Steel Frame",label: "Estrutura Steel Frame",  desc: "Montagem dos painéis de aço galvanizado, guias e montantes estruturais." },
  { key: "Fechamentos",          label: "Fechamentos & Chapas",   desc: "Instalação de placas OSB externas, barreiras de vapor e fechamento em drywall." },
  { key: "Instalações",          label: "Instalações & Esquadrias",desc: "Passagem de conduítes elétricos, tubulação hidráulica (PEX) e instalação de esquadrias." },
  { key: "Acabamento",           label: "Acabamento Geral",       desc: "Revestimento externo, pintura final, pisos e telhado acabado." },
  { key: "Entrega",              label: "Entrega da Obra",        desc: "Limpeza final, paisagismo, testes de instalações e entrega da chave ao cliente." }
];

export default function Planejamento4D({ faseAtual = "Projeto executivo" }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const animRef = useRef(null);
  const sceneRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);

  // Mapeia fase da obra para índice 4D
  const getFaseIdx = (fName) => {
    const idx = FASES_4D.findIndex(f => f.key.toLowerCase() === fName.toLowerCase());
    return idx !== -1 ? idx : 0;
  };

  const [faseSel, setFaseSel] = useState(() => getFaseIdx(faseAtual));
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  // Atualiza fase selecionada se a faseAtual da obra mudar
  useEffect(() => {
    setFaseSel(getFaseIdx(faseAtual));
  }, [faseAtual]);

  // Loop de Autoplay
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setFaseSel((prev) => {
        if (prev >= FASES_4D.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Inicialização e reconstrução da cena 3D
  useEffect(() => {
    if (!canvasRef.current) return;
    setLoading(true);
    let active = true;

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");

      if (!active) return;

      // Limpa renderizador anterior se existir
      if (rendererRef.current) {
        rendererRef.current.dispose();
        canvasRef.current.innerHTML = "";
      }

      const w = canvasRef.current.clientWidth || 600;
      const h = canvasRef.current.clientHeight || 400;

      // Cena e Background escuro e elegante
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0e1013);
      sceneRef.current = scene;

      // Grid de referência
      const grid = new THREE.GridHelper(40, 20, 0x1d2127, 0x15181c);
      grid.position.y = -0.05;
      scene.add(grid);

      // Iluminação
      scene.add(new THREE.AmbientLight(0xffffff, 0.45));
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
      dirLight.position.set(15, 30, 15);
      dirLight.castShadow = true;
      scene.add(dirLight);

      const dirLight2 = new THREE.DirectionalLight(0x4a9eff, 0.25);
      dirLight2.position.set(-15, 10, -15);
      scene.add(dirLight2);

      // Parâmetros da casa modelo
      const W = 8; // largura
      const D = 6; // profundidade
      const H = 2.7; // pé direito
      const wt = 0.15; // espessura da parede

      // Função utilitária para adicionar sólidos na cena
      const addMesh = (geo, mat, x, y, z, rotX = 0, rotY = 0) => {
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (rotX) mesh.rotation.x = rotX;
        if (rotY) mesh.rotation.y = rotY;
        scene.add(mesh);
        
        // Linhas de borda para destacar a volumetria
        const edges = new THREE.EdgesGeometry(geo);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x22262d });
        const line = new THREE.LineSegments(edges, lineMat);
        line.position.copy(mesh.position);
        if (rotX) line.rotation.x = rotX;
        if (rotY) line.rotation.y = rotY;
        scene.add(line);
        return { mesh, line };
      };

      // ─── FASE 0: PROJETO EXECUTIVO (Gabarito / Footprint) ───
      if (faseSel >= 0) {
        // Linhas pontilhadas do contorno da obra no chão
        const footprintGeo = new THREE.BoxGeometry(W, 0.02, D);
        const footprintMat = new THREE.MeshBasicMaterial({ 
          color: 0x4a9eff, 
          wireframe: true, 
          transparent: true, 
          opacity: 0.65 
        });
        addMesh(footprintGeo, footprintMat, 0, 0.01, 0);

        // Estacas de gabarito nos cantos
        const cantos = [
          [-W/2, -D/2], [W/2, -D/2],
          [-W/2,  D/2], [W/2,  D/2]
        ];
        cantos.forEach(([cx, cz]) => {
          const estacaGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
          const estacaMat = new THREE.MeshLambertMaterial({ color: 0x6b4c2a });
          addMesh(estacaGeo, estacaMat, cx, 0.3, cz);
        });
      }

      // ─── FASE 1: FUNDAÇÃO (Laje Radier Concrete) ───
      if (faseSel >= 1) {
        const radierGeo = new THREE.BoxGeometry(W + 0.4, 0.25, D + 0.4);
        const radierMat = new THREE.MeshStandardMaterial({ 
          color: 0x64748b, // concreto slate
          roughness: 0.85 
        });
        addMesh(radierGeo, radierMat, 0, 0.125, 0);
      }

      // ─── FASE 2: ESTRUTURA STEEL FRAME (Guias e Montantes de Aço) ───
      if (faseSel >= 2) {
        // Material do aço galvanizado (azul brilhante / prata metálico)
        const steelMat = new THREE.MeshStandardMaterial({
          color: faseSel === 2 ? 0x4a9eff : 0x94a3b8, // destaca azul na fase dela, vira prata depois
          metalness: 0.85,
          roughness: 0.2,
          transparent: faseSel > 3, // fica translúcido nas fases seguintes
          opacity: faseSel > 3 ? 0.3 : 1.0
        });

        // Desenha montantes verticais ao longo do perímetro
        const step = 0.9; // distância de 90cm entre studs
        const studGeo = new THREE.BoxGeometry(0.06, H, 0.06);

        // Paredes traseira (z = -D/2) e dianteira (z = D/2)
        for (let x = -W/2; x <= W/2; x += step) {
          addMesh(studGeo, steelMat, x, 0.25 + H/2, -D/2);
          // Frente (deixa espaço para porta na posição x = 1.5)
          if (Math.abs(x - 1.5) > 0.6) {
            addMesh(studGeo, steelMat, x, 0.25 + H/2, D/2);
          }
        }
        // Paredes laterais (x = -W/2 e x = W/2)
        for (let z = -D/2 + step; z < D/2; z += step) {
          addMesh(studGeo, steelMat, -W/2, 0.25 + H/2, z);
          addMesh(studGeo, steelMat, W/2, 0.25 + H/2, z);
        }

        // Guias horizontais (inferior e superior)
        const trackHGeo = new THREE.BoxGeometry(W, 0.04, 0.08);
        const trackVGeo = new THREE.BoxGeometry(0.08, 0.04, D);
        // Traseira
        addMesh(trackHGeo, steelMat, 0, 0.27, -D/2);
        addMesh(trackHGeo, steelMat, 0, 0.23 + H, -D/2);
        // Dianteira
        addMesh(trackHGeo, steelMat, 0, 0.27, D/2);
        addMesh(trackHGeo, steelMat, 0, 0.23 + H, D/2);
        // Esquerda
        addMesh(trackVGeo, steelMat, -W/2, 0.27, 0);
        addMesh(trackVGeo, steelMat, -W/2, 0.23 + H, 0);
        // Direita
        addMesh(trackVGeo, steelMat, W/2, 0.27, 0);
        addMesh(trackVGeo, steelMat, W/2, 0.23 + H, 0);
      }

      // ─── FASE 3: FECHAMENTOS (Drywall / OSB Opaque Walls) ───
      if (faseSel >= 3) {
        const wallMat = new THREE.MeshStandardMaterial({
          color: 0xe2e8f0, // drywall/OSB cinza claro
          roughness: 0.9,
          transparent: faseSel === 4, // torna transparente na fase 4 para ver as tubulações!
          opacity: faseSel === 4 ? 0.35 : 0.95
        });

        // Paredes com aberturas de janelas e portas
        const whGeo = new THREE.BoxGeometry(W, H, wt);
        const wvGeo = new THREE.BoxGeometry(wt, H, D);
        // Traseira
        addMesh(whGeo, wallMat, 0, 0.25 + H/2, -D/2);
        // Esquerda
        addMesh(wvGeo, wallMat, -W/2, 0.25 + H/2, 0);
        // Direita
        addMesh(wvGeo, wallMat, W/2, 0.25 + H/2, 0);
        // Dianteira (dividida para deixar vão de porta e janela)
        const frontWallLeftGeo = new THREE.BoxGeometry(W * 0.4, H, wt);
        const frontWallRightGeo = new THREE.BoxGeometry(W * 0.4, H, wt);
        addMesh(frontWallLeftGeo, wallMat, -W * 0.3, 0.25 + H/2, D/2);
        addMesh(frontWallRightGeo, wallMat, W * 0.3, 0.25 + H/2, D/2);
      }

      // ─── FASE 4: INSTALAÇÕES & ESQUADRIAS (Pipes + Windows/Doors) ───
      if (faseSel >= 4) {
        // Tubulações hidráulicas visíveis (Cilindros Vermelho = Água Quente, Azul = Água Fria)
        const pipeBMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 }); // azul
        const pipeRMat = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // vermelho
        const pipeGeo = new THREE.CylinderGeometry(0.025, 0.025, H - 0.4, 6);

        // Tubo Azul e Vermelho subindo na parede esquerda
        addMesh(pipeGeo, pipeBMat, -W/2 + 0.1, 0.25 + H/2, -1.0);
        addMesh(pipeGeo, pipeRMat, -W/2 + 0.1, 0.25 + H/2, -0.8);

        // Tubo Horizontal correndo
        const pipeHGeo = new THREE.BoxGeometry(0.03, 0.03, 2.0);
        addMesh(pipeHGeo, pipeBMat, -W/2 + 0.1, 1.0, 0);

        // Conduítes elétricos amarelos flexíveis
        const electMat = new THREE.MeshBasicMaterial({ color: 0xeab308 }); // amarelo
        const condGeo = new THREE.CylinderGeometry(0.015, 0.015, H - 0.2, 5);
        addMesh(condGeo, electMat, W * 0.2, 0.25 + H/2, -D/2 + 0.1);

        // Esquadrias de Janela (Alumínio escuro)
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5 });
        const windowGeo = new THREE.BoxGeometry(1.4, 1.2, 0.12);
        addMesh(windowGeo, frameMat, -W * 0.3, 0.25 + 1.4, D/2); // Janela frontal

        // Vidro da janela (transparente ciano)
        const glassMat = new THREE.MeshStandardMaterial({
          color: 0xbae6fd,
          transparent: true,
          opacity: 0.5,
          roughness: 0.1
        });
        const glassGeo = new THREE.BoxGeometry(1.3, 1.1, 0.04);
        addMesh(glassGeo, glassMat, -W * 0.3, 0.25 + 1.4, D/2);

        // Porta Principal de madeira
        const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 }); // madeira
        const doorFrameGeo = new THREE.BoxGeometry(1.0, 2.15, 0.12);
        const doorGeo = new THREE.BoxGeometry(0.9, 2.1, 0.04);
        addMesh(doorFrameGeo, doorFrameMat, 1.2, 0.25 + 1.075, D/2);
        addMesh(doorGeo, doorMat, 1.2, 0.25 + 1.05, D/2);
      }

      // ─── FASE 5: ACABAMENTO (Roof + Finished Exterior) ───
      if (faseSel >= 5) {
        // Telhado de duas águas (Extruded triangular prism)
        const roofMat = new THREE.MeshStandardMaterial({ 
          color: 0x981915, // cor terracota da StickFrame
          roughness: 0.65 
        });
        const roofShape = new THREE.Shape();
        roofShape.moveTo(-W/2 - 0.3, 0);
        roofShape.lineTo(0, 1.8);
        roofShape.lineTo(W/2 + 0.3, 0);
        roofShape.lineTo(-W/2 - 0.3, 0);

        const extrudeSettings = { depth: D + 0.6, bevelEnabled: false };
        const roofGeo = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
        
        // Adiciona e foca telhado
        const { mesh: roofMesh } = addMesh(roofGeo, roofMat, 0, 0.25 + H, -D/2 - 0.3);

        // Paredes pintadas (vão cobrir as tubulações da fase 4)
        const extWallMat = new THREE.MeshStandardMaterial({ 
          color: 0xf8fafc, // premium off-white
          roughness: 0.8
        });
        const extHGeo = new THREE.BoxGeometry(W + 0.04, H, wt + 0.02);
        const extVGeo = new THREE.BoxGeometry(wt + 0.02, H, D + 0.04);
        // Recobre paredes exteriores com acabamento pintado
        addMesh(extHGeo, extWallMat, 0, 0.25 + H/2, -D/2);
        addMesh(extVGeo, extWallMat, -W/2, 0.25 + H/2, 0);
        addMesh(extVGeo, extWallMat, W/2, 0.25 + H/2, 0);
        // Frente recortada
        addMesh(new THREE.BoxGeometry(W * 0.4 + 0.02, H, wt + 0.02), extWallMat, -W * 0.3, 0.25 + H/2, D/2);
        addMesh(new THREE.BoxGeometry(W * 0.4 + 0.02, H, wt + 0.02), extWallMat, W * 0.3, 0.25 + H/2, D/2);
      }

      // ─── FASE 6: ENTREGA (Light inside + Paisagismo) ───
      if (faseSel >= 6) {
        // Gramado de paisagismo
        const grassGeo = new THREE.PlaneGeometry(W + 10, D + 8);
        const grassMat = new THREE.MeshStandardMaterial({ 
          color: 0x1b4332, // verde escuro elegante
          roughness: 0.9 
        });
        const grass = new THREE.Mesh(grassGeo, grassMat);
        grass.rotation.x = -Math.PI / 2;
        grass.position.y = 0.01;
        scene.add(grass);

        // Luz interna quente acesa (Emissive nas janelas)
        const litGlassMat = new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xca8a04,
          emissiveIntensity: 0.8,
          roughness: 0.1
        });
        const glassGeo = new THREE.BoxGeometry(1.3, 1.1, 0.04);
        // Substitui vidro frontal por um brilhante/aceso
        addMesh(glassGeo, litGlassMat, -W * 0.3, 0.25 + 1.4, D/2);

        // Árvore low-poly no quintal
        const trunkGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.2, 5);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });
        const leafGeo = new THREE.DodecahedronGeometry(0.6, 1);
        const leafMat = new THREE.MeshLambertMaterial({ color: 0x2d6a4f });

        const tx = -W/2 - 2;
        const tz = D/2 + 1;
        addMesh(trunkGeo, trunkMat, tx, 0.6, tz);
        addMesh(leafGeo, leafMat, tx, 1.4, tz);
        addMesh(leafGeo, leafMat, tx - 0.2, 1.7, tz + 0.1);
      }

      // Câmera
      const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 1000);
      cameraRef.current = camera;
      
      // Posiciona câmera dinamicamente dependendo da fase selecionada
      const camRadius = Math.max(W, D) * 1.5;
      if (faseSel <= 1) {
        // Foca de cima na fundação
        camera.position.set(camRadius * 0.7, camRadius * 0.9, camRadius * 0.7);
      } else if (faseSel === 2 || faseSel === 4) {
        // De lado para ver estrutura e tubulações
        camera.position.set(camRadius * 1.1, camRadius * 0.4, camRadius * 0.2);
      } else {
        // Perspectiva padrão
        camera.position.set(camRadius * 0.9, camRadius * 0.7, camRadius * 0.9);
      }
      camera.lookAt(0, H / 2, 0);

      // Renderizador
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      canvasRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Orbit Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.target.set(0, H / 2, 0);
      controls.maxPolarAngle = Math.PI / 2 - 0.05; // impede de entrar embaixo do grid
      controls.minDistance = 5;
      controls.maxDistance = 25;
      controls.update();
      controlsRef.current = controls;

      setLoading(false);

      // Loop de renderização
      let animId;
      const animate = () => {
        if (!active) return;
        animId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
      animRef.current = animId;

    })();

    return () => {
      active = false;
      cancelAnimationFrame(animRef.current);
      if (rendererRef.current) {
        try { rendererRef.current.dispose(); } catch(_) {}
      }
    };
  }, [faseSel]);

  const handlePhaseChange = (idx) => {
    setFaseSel(idx);
    setIsPlaying(false);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      background: "#0e1013",
      borderRadius: 14,
      border: `1px solid ${C.border}`,
      overflow: "hidden",
      width: "100%",
      position: "relative"
    }}>
      {/* Top Header Controls */}
      <div style={{
        padding: "14px 20px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Simulador 4D</span>
            <span style={{
              background: C.red + "22",
              color: C.red,
              fontSize: 10,
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: 6,
              textTransform: "uppercase"
            }}>PRO</span>
          </div>
          <p style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>Etapa ativa: {FASES_4D[faseSel].key}</p>
        </div>

        {/* Play/Pause controls */}
        <div style={{ display: "flex", gap: 8 }}>
          <Btn 
            variant={isPlaying ? "ghost" : "primary"} 
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ padding: "6px 14px", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}
          >
            <span>{isPlaying ? "⏸ Pausar" : "▶ Play 4D"}</span>
          </Btn>
          <Btn 
            variant="ghost" 
            onClick={() => { setFaseSel(0); setIsPlaying(false); }}
            style={{ padding: "6px 12px", fontSize: 11 }}
          >
            Reset
          </Btn>
        </div>
      </div>

      {/* 3D Canvas Box */}
      <div style={{ position: "relative", height: 380, width: "100%" }}>
        {loading && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "#0e1013",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12
          }}>
            <div style={{ width: 28, height: 28, border: "2px solid #222", borderTop: `2px solid ${C.red}`, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
            <div style={{ color: C.muted, fontSize: 12 }}>Carregando motor 3D...</div>
          </div>
        )}
        <div ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      </div>

      {/* Info Card de Descrição da Fase */}
      <div style={{
        padding: "14px 20px",
        background: "#12141a",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        gap: 4
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.red }}>{FASES_4D[faseSel].label}</div>
        <p style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4, margin: 0 }}>{FASES_4D[faseSel].desc}</p>
      </div>

      {/* Scrub Timeline slider */}
      <div style={{
        padding: "16px 20px",
        background: "#0b0c0e",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        gap: 8
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 0.5 }}>LINHA DO TEMPO</span>
          <span style={{ fontSize: 10, color: C.muted }}>Fase {faseSel + 1} de {FASES_4D.length}</span>
        </div>
        <input 
          type="range"
          min="0"
          max={FASES_4D.length - 1}
          value={faseSel}
          onChange={(e) => handlePhaseChange(parseInt(e.target.value))}
          style={{
            width: "100%",
            accentColor: C.red,
            cursor: "pointer",
            height: 6,
            background: "#1e293b",
            borderRadius: 3,
            outline: "none"
          }}
        />
        {/* Marcadores de fase rápidos */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          {FASES_4D.map((f, idx) => (
            <button
              key={f.key}
              onClick={() => handlePhaseChange(idx)}
              style={{
                background: "none",
                border: "none",
                color: faseSel === idx ? C.red : (idx < faseSel ? "#475569" : "#334155"),
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                padding: "2px 0",
                transition: "color .15s"
              }}
              title={f.key}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
