import { useEffect, useRef } from "react";
import "../styles/landing-bim.css";

// Inject Google Fonts once
function ensureFonts() {
  if (document.getElementById("lbim-fonts")) return;
  const pre1 = document.createElement("link"); pre1.rel = "preconnect"; pre1.href = "https://fonts.googleapis.com";
  const pre2 = document.createElement("link"); pre2.rel = "preconnect"; pre2.href = "https://fonts.gstatic.com"; pre2.crossOrigin = "anonymous";
  const link = document.createElement("link");
  link.id = "lbim-fonts"; link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(pre1);
  document.head.appendChild(pre2);
  document.head.appendChild(link);
}

export default function LandingPage() {
  const rootRef = useRef(null);

  useEffect(() => {
    ensureFonts();
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = rootRef.current?.querySelectorAll(".rev") || [];
    if (prefersReduced) { els.forEach(el => el.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  function scrollTo(id) { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }

  return (
    <div className="lbim" ref={rootRef}>
      <div className="lbim-bg-before" aria-hidden="true" />
      <div className="lbim-bg-after" aria-hidden="true" />
      <div className="lbim-content">

        {/* NAV */}
        <nav className="lnav">
          <div className="wrap nav-in">
            <a className="brand" href="#top" onClick={e => { e.preventDefault(); window.scrollTo({top:0,behavior:"smooth"}); }}>
              <img src="/logo-mark.png" alt="StickFrame" />
              <span className="wm">STICK<span>FRAME</span><sup className="tm">™</sup></span>
            </a>
            <div className="nav-links">
              <a href="#como" onClick={e=>{e.preventDefault();scrollTo("como")}}>Como funciona</a>
              <a href="#produto" onClick={e=>{e.preventDefault();scrollTo("produto")}}>Plataforma</a>
              <a href="#publicos" onClick={e=>{e.preventDefault();scrollTo("publicos")}}>Para quem é</a>
              <a href="#preco" onClick={e=>{e.preventDefault();scrollTo("preco")}}>Preços</a>
            </div>
            <div className="nav-cta">
              <button className="btn btn-ghost" onClick={()=>scrollTo("como")}>Ver como funciona</button>
              <button className="btn btn-red" onClick={()=>scrollTo("final")}>Calcular grátis</button>
            </div>
            <button className="nav-burger" aria-label="Menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            </button>
          </div>
        </nav>

        <span id="top" />

        {/* HERO */}
        <section className="hero">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <span className="eyebrow rev">Plataforma BIM · Steel Frame</span>
              <h1 className="rev d1">Do BIM ao orçamento<br/>Steel Frame em <em>minutos</em>.</h1>
              <p className="sub rev d2">Importe seu IFC, extraia quantitativos, aplique composições e gere um orçamento rastreável para sua obra — do modelo digital direto para a execução.</p>
              <div className="hero-cta rev d3">
                <button className="btn btn-red btn-lg" onClick={()=>scrollTo("final")}>
                  Calcular meu projeto grátis
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </button>
                <button className="btn btn-ghost btn-lg" onClick={()=>scrollTo("como")}>Ver como funciona</button>
              </div>
              <div className="hero-meta rev d4">
                <div className="hm"><b className="num">IFC<i>.</i></b><span>Importação nativa</span></div>
                <div className="vr" />
                <div className="hm"><b className="num">&lt;5<i>min</i></b><span>Modelo → orçamento</span></div>
                <div className="vr" />
                <div className="hm"><b className="num">100<i>%</i></b><span>Rastreável e auditável</span></div>
              </div>
            </div>

            {/* BIM scene */}
            <div className="scene rev d2">
              <div className="scene-stage">
                <div className="scene-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M4 7l8-4 8 4-8 4-8-4zM4 7v10l8 4 8-4V7M12 11v10"/></svg>
                  <span>Modelo 3D Steel Frame</span>
                </div>
                <div className="scene-badge">
                  <span className="ax">
                    <i style={{background:"#e0463c"}}/>
                    <i style={{background:"#22c578"}}/>
                    <i style={{background:"#5b9bd5"}}/>
                  </span>
                  Vista BIM · estrutura + painéis
                </div>
              </div>
              <div className="fcard fc1">
                <div className="fl">
                  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.2"><path d="M4 7l8-4 8 4-8 4-8-4zM4 7v10l8 4 8-4V7M12 11v10"/></svg>
                  IFC Importado
                </div>
                <div className="ok">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.6"><path d="M20 6 9 17l-5-5"/></svg>
                  Modelo validado
                </div>
              </div>
              <div className="fcard fc2">
                <div className="fl">
                  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="var(--steel)" strokeWidth="2.2"><path d="M3 3v18h18M7 16l4-5 3 3 5-7"/></svg>
                  Quantitativo BIM
                </div>
                <div className="grid2">
                  <span className="k">Parede</span><span className="v num">186 m²</span>
                  <span className="k">Perfis</span><span className="v num">1.240 m</span>
                </div>
              </div>
              <div className="fcard fc3">
                <div className="fl">
                  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="var(--red-2)" strokeWidth="2.2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  StickQuote™
                </div>
                <div className="price num">R$ 428.500</div>
                <div className="sm">Orçamento gerado · v1</div>
              </div>
              <div className="fcard fc4">
                <div className="ring">
                  <svg viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="21" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="5"/>
                    <circle cx="25" cy="25" r="21" fill="none" stroke="#22c578" strokeWidth="5" strokeLinecap="round" strokeDasharray="131.9" strokeDashoffset="10.5"/>
                  </svg>
                  <span className="pct num">92%</span>
                </div>
                <div>
                  <div className="fl" style={{color:"var(--green)"}}>
                    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    StickTrust™
                  </div>
                  <div style={{fontSize:12,color:"var(--ink-2)",marginTop:5,fontWeight:600}}>Confiança BIM</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Strip */}
        <div className="strip">
          <div className="wrap strip-in rev">
            <span className="lbl">Compatível com o fluxo BIM que você já usa</span>
            <div className="items">
              <span>IFC 2x3 / 4</span><span>Revit</span><span>ArchiCAD</span><span>Tekla</span><span>SketchUp</span>
            </div>
          </div>
        </div>

        {/* COMO FUNCIONA */}
        <section className="how" id="como">
          <div className="wrap">
            <div className="how-top rev">
              <span className="eyebrow">Como funciona</span>
              <h2 className="sec-h2">Do arquivo ao canteiro<br/>em quatro passos.</h2>
              <p className="sec-lede">Sem planilha, sem retrabalho. O StickFrame lê a geometria do seu modelo e devolve um orçamento pronto para decisão.</p>
            </div>
            <div className="steps">
              <div className="step rev d1">
                <div className="sn num">1</div>
                <div className="si"><svg viewBox="0 0 24 24" fill="none" stroke="var(--red-2)" strokeWidth="1.9"><path d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg></div>
                <h3>Importe seu IFC</h3>
                <p>Arraste o modelo BIM exportado do seu CAD. Leitura nativa do padrão IFC, sem conversão manual.</p>
              </div>
              <div className="step rev d2">
                <div className="sn num">2</div>
                <div className="si"><svg viewBox="0 0 24 24" fill="none" stroke="var(--red-2)" strokeWidth="1.9"><path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M9 9.5l6 2.7"/></svg></div>
                <h3>Identificamos o Steel Frame</h3>
                <p>O StickMap™ reconhece paredes, lajes e perfis e mapeia cada elemento para o sistema construtivo correto.</p>
              </div>
              <div className="step rev d3">
                <div className="sn num">3</div>
                <div className="si"><svg viewBox="0 0 24 24" fill="none" stroke="var(--red-2)" strokeWidth="1.9"><path d="M4 4h16v16H4zM4 9h16M9 9v11"/></svg></div>
                <h3>Composições e preços</h3>
                <p>Aplicamos as composições técnicas e os preços de catálogo, com fator de perda e mão de obra.</p>
              </div>
              <div className="step rev d4">
                <div className="si"><svg viewBox="0 0 24 24" fill="none" stroke="var(--red-2)" strokeWidth="1.9"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 15l2 2 4-4"/></svg></div>
                <div className="sn num">4</div>
                <h3>Orçamento profissional</h3>
                <p>Gere um documento rastreável, versionado e auditável — pronto para enviar ao cliente ou ao canteiro.</p>
              </div>
            </div>
            <div className="pipe rev">
              <div className="node"><span className="chip">IFC</span><small>Modelo digital</small></div>
              <div className="arrow"><svg viewBox="0 0 26 18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 9h20m0 0-6-6m6 6-6 6"/></svg></div>
              <div className="node acc"><span className="chip">StickMap™</span><small>Mapeamento</small></div>
              <div className="arrow"><svg viewBox="0 0 26 18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 9h20m0 0-6-6m6 6-6 6"/></svg></div>
              <div className="node acc"><span className="chip">StickQuote™</span><small>Orçamento</small></div>
              <div className="arrow"><svg viewBox="0 0 26 18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 9h20m0 0-6-6m6 6-6 6"/></svg></div>
              <div className="node"><span className="chip">Obra</span><small>Execução</small></div>
            </div>
          </div>
        </section>

        {/* DIFERENCIAIS */}
        <section className="diff" id="produto">
          <div className="wrap">
            <div className="how-top rev">
              <span className="eyebrow">A plataforma</span>
              <h2 className="sec-h2">Quatro módulos, um<br/>fluxo de engenharia.</h2>
              <p className="sec-lede">Cada peça do StickFrame resolve uma etapa real do projeto Steel Frame — do modelo à confiança no número final.</p>
            </div>
            <div className="diff-grid">
              <div className="dcard r rev d1">
                <div className="di"><svg viewBox="0 0 24 24" fill="none" stroke="var(--red-2)" strokeWidth="1.8"><path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M9 9.5l6 2.7M12 11v10"/></svg></div>
                <h3>StickMap<span className="tm">™</span></h3>
                <p>Mapeamento inteligente do IFC para os sistemas Steel Frame — cada IfcWall e IfcSlab ligado à composição certa.</p>
                <span className="tag">IFC → Sistema construtivo</span>
              </div>
              <div className="dcard g rev d2">
                <div className="di"><svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.8"><path d="M9 7h6M9 11h6M9 15h4M5 3h14a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1z"/></svg></div>
                <h3>StickQuote<span className="tm">™</span></h3>
                <p>Orçamento BIM rastreável, com composição, preços de catálogo e versionamento imutável de cada proposta.</p>
                <span className="tag">Composição + preço + versão</span>
              </div>
              <div className="dcard s rev d3">
                <div className="di"><svg viewBox="0 0 24 24" fill="none" stroke="var(--steel)" strokeWidth="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg></div>
                <h3>StickView<span className="tm">™</span></h3>
                <p>Visualização digital da estrutura: navegue pelo modelo, isole sistemas e confira a geometria que gerou o número.</p>
                <span className="tag">Modelo 3D navegável</span>
              </div>
              <div className="dcard w rev d4">
                <div className="di"><svg viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></div>
                <h3>StickTrust<span className="tm">™</span></h3>
                <p>Confiança e auditoria do orçamento: cada quantidade declara sua origem — medido no modelo ou estimado.</p>
                <span className="tag">Auditoria e rastreabilidade</span>
              </div>
            </div>
          </div>
        </section>

        {/* ANTES / DEPOIS */}
        <section className="ps">
          <div className="wrap">
            <div className="how-top rev">
              <span className="eyebrow">O que muda</span>
              <h2 className="sec-h2">De projeto espalhado<br/>a decisão conectada.</h2>
            </div>
            <div className="ps-grid">
              <div className="ps-col antes rev d1">
                <div className="h"><span className="b">Antes</span> Sem BIM conectado</div>
                <ul className="ps-list">
                  {["Projetos espalhados entre arquivos e pessoas","Planilhas manuais, frágeis e desatualizadas","Erros de quantitativo que viram prejuízo","Orçamentos que demoram dias para sair"].map(t=>(
                    <li key={t}><span className="ic"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2.4"><path d="M18 6 6 18M6 6l12 12"/></svg></span>{t}</li>
                  ))}
                </ul>
              </div>
              <div className="ps-col depois rev d2">
                <div className="h"><span className="b">Depois</span> Com StickFrame</div>
                <ul className="ps-list">
                  {["Modelo BIM conectado de ponta a ponta","Quantitativo extraído automaticamente do IFC","Preço de catálogo sempre atualizado","Orçamento profissional em minutos"].map(t=>(
                    <li key={t}><span className="ic"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2.4"><path d="M20 6 9 17l-5-5"/></svg></span>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FEITO PARA */}
        <section className="aud" id="publicos">
          <div className="wrap">
            <div className="how-top rev">
              <span className="eyebrow">Feito para</span>
              <h2 className="sec-h2">Quem constrói a seco,<br/>decide com dados.</h2>
            </div>
            <div className="aud-grid">
              {[
                {d:1,icon:<path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-5h6v5M9 11h.01M15 11h.01"/>,title:"Construtoras Steel Frame",desc:"Padronize o orçamento e ganhe velocidade em cada proposta."},
                {d:2,icon:<path d="M2 20h20M4 20V8l5 3V8l5 3V8l5 3v9M9 20v-4h2v4"/>,title:"Fabricantes",desc:"Quantitativo de perfis e painéis direto do modelo, sem dupla digitação."},
                {d:3,icon:<path d="M3 3v18h18M8 17l3.5-4 2.5 2.5L20 8"/>,title:"Engenheiros",desc:"Composições técnicas rastreáveis e auditáveis para defender cada número."},
                {d:4,icon:<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>,title:"Arquitetos",desc:"Veja o custo da sua intenção de projeto antes de fechar o partido."},
              ].map(c=>(
                <div className={`acard rev d${c.d}`} key={c.title}>
                  <div className="ai"><svg viewBox="0 0 24 24" fill="none" stroke="var(--red-2)" strokeWidth="1.8">{c.icon}</svg></div>
                  <h4>{c.title}</h4>
                  <p>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="final" id="final">
          <div className="wrap">
            <div className="final-band rev">
              <span className="eyebrow" style={{justifyContent:"center"}}>Comece agora · grátis</span>
              <h2>Seu projeto já existe.<br/>Agora transforme ele em <em>decisão</em>.</h2>
              <p>Importe seu IFC e veja o orçamento BIM da sua obra Steel Frame em minutos.</p>
              <div className="cta">
                <button className="btn btn-red btn-lg" onClick={()=>window.location.href="/cadastro"}>
                  Criar orçamento BIM grátis
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </button>
                <button className="btn btn-ghost btn-lg" onClick={()=>scrollTo("como")}>Ver como funciona</button>
              </div>
              <div className="note">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.2"><path d="M20 6 9 17l-5-5"/></svg>
                Sem cartão de crédito · seu primeiro projeto é grátis
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="foot" id="preco">
          <div className="wrap foot-grid">
            <div>
              <a className="brand" href="#top" onClick={e=>{e.preventDefault();window.scrollTo({top:0,behavior:"smooth"})}}>
                <img src="/logo-mark.png" alt="StickFrame" />
                <span className="wm">STICK<span>FRAME</span><sup className="tm">™</sup></span>
              </a>
              <p className="fdesc">Plataforma BIM de engenharia para construção industrializada a seco. Do modelo digital à execução da obra.</p>
            </div>
            <div className="foot-cols">
              <div className="foot-col">
                <h5>Plataforma</h5>
                <a href="#produto" onClick={e=>{e.preventDefault();scrollTo("produto")}}>StickMap™</a>
                <a href="#produto" onClick={e=>{e.preventDefault();scrollTo("produto")}}>StickQuote™</a>
                <a href="#produto" onClick={e=>{e.preventDefault();scrollTo("produto")}}>StickView™</a>
                <a href="#produto" onClick={e=>{e.preventDefault();scrollTo("produto")}}>StickTrust™</a>
              </div>
              <div className="foot-col">
                <h5>Recursos</h5>
                <a href="#como" onClick={e=>{e.preventDefault();scrollTo("como")}}>Como funciona</a>
                <a href="#publicos" onClick={e=>{e.preventDefault();scrollTo("publicos")}}>Para quem é</a>
                <a href="#">Importação IFC</a>
                <a href="#">Composições SF</a>
              </div>
              <div className="foot-col">
                <h5>Empresa</h5>
                <a href="#">Sobre</a>
                <a href="#">Contato</a>
                <a href="#">Privacidade</a>
              </div>
            </div>
          </div>
          <div className="wrap foot-base">
            <span>© 2026 Stick Frame Sistemas Construtivos · Santo André/SP</span>
            <span>StickFrame™ · BIM para Steel Frame</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
