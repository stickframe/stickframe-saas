import { useMemo, useState } from "react";
import { auditarPreDimensionamento } from "../../../services/stickfem/auditoria";
import { ENGINE_VERSION } from "../../../services/stickfem/engine/version";
import { CARD, BTN_GHOST } from "../utils/styles";

/**
 * Engineering Playground — bancada paramétrica do motor de pré-dimensionamento.
 * Mover os controles recalcula, em tempo real, utilização/esbeltez/peso/custo/
 * perfil recomendado/margem — pelo MESMO motor auditado (auditarPreDimensionamento).
 * Ferramenta de calibração e ensino; não é dimensionamento definitivo.
 */
const ACOS = [
  { nome: "ZAR-230", fy: 230 }, { nome: "ZAR-250 (usual)", fy: 250 },
  { nome: "ZAR-280", fy: 280 }, { nome: "ZAR-345", fy: 345 },
];
const COR_STATUS = { aprovado: "#3f7a4b", atencao: "#b07a1e", revisar: "#981915", indefinido: "#8c847a" };

function Slider({ label, value, min, max, step, unidade, onChange }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted, #57514a)", marginBottom: 3 }}>
        <span>{label}</span><b style={{ color: "var(--text, #26231f)" }}>{value}{unidade ? ` ${unidade}` : ""}</b>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--red, #981915)" }} />
    </label>
  );
}

function Metric({ label, value, unidade, cor, sub }) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: cor || "var(--text, #26231f)", fontFamily: "'Barlow Condensed', sans-serif", marginTop: 2 }}>
        {value}{unidade ? <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 3 }}>{unidade}</span> : null}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function EngineeringPlayground({ perfis }) {
  const montantes = useMemo(() => (perfis || []).filter((p) => p.tipo === "montante" && p.area_mm2), [perfis]);
  const [perfilId, setPerfilId] = useState(montantes[0]?.id);
  const [peDireito, setPeDireito] = useState(2.8);
  const [travamento, setTravamento] = useState(2.8);   // distância entre travamentos laterais (m)
  const [espac, setEspac] = useState(0.4);
  const [fy, setFy] = useState(250);
  const [gPerm, setGPerm] = useState(1.5);
  const [qSobre, setQSobre] = useState(2.0);
  const [v0, setV0] = useState(40);
  const [largTrib, setLargTrib] = useState(2.5);
  const [custoKg, setCustoKg] = useState(12);

  const perfil = montantes.find((p) => p.id === perfilId) || montantes[0];
  // Comprimento de flambagem = min(pé-direito, travamento) — travamento lateral
  // reduz o comprimento de flambagem (modelo correto, sem alterar o motor).
  const Lfl = Math.min(peDireito, travamento);

  const entradaBase = (perf, over = {}) => ({
    perfil: perf, material: { fy_mpa: fy, e_mpa: 200000 },
    peDireitoM: Lfl, espacMontanteM: espac, larguraTributariaM: largTrib,
    gPerm_kNm2: gPerm, qSobre_kNm2: qSobre, v0_ms: v0, ...over,
  });

  const aud = useMemo(() => (perfil ? auditarPreDimensionamento(entradaBase(perfil)) : null),
    [perfil, Lfl, espac, fy, gPerm, qSobre, v0, largTrib]);

  // Perfil recomendado: o mais leve que mantém utilização ≤ 0,85.
  const recomendado = useMemo(() => {
    if (!montantes.length) return null;
    const ordenados = [...montantes].sort((a, b) => (a.peso_kg_m || 99) - (b.peso_kg_m || 99));
    return ordenados.find((p) => auditarPreDimensionamento(entradaBase(p)).resultado.utilizacao <= 0.85) || null;
  }, [montantes, Lfl, espac, fy, gPerm, qSobre, v0, largTrib]);

  if (!perfil || !aud) {
    return <div style={CARD}><p style={{ color: "var(--muted)", margin: 0 }}>Nenhum perfil de montante disponível na base para simular.</p></div>;
  }

  const util = aud.resultado.utilizacao;
  const cor = COR_STATUS[aud.resultado.status];
  const margem = util > 0 ? (1 / util) : Infinity;          // fator de segurança sobre a resistência
  const pesoKgM2 = perfil.peso_kg_m ? +((perfil.peso_kg_m * peDireito * (Math.ceil(1 / espac) + 1)) / (1 * peDireito)).toFixed(1) : null; // kg de montante por m² de parede
  const custoM2 = pesoKgM2 != null ? +(pesoKgM2 * custoKg).toFixed(0) : null;

  return (
    <div>
      <div style={{ ...CARD, background: "rgba(109,85,126,.06)", borderColor: "rgba(109,85,126,.3)" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text, #26231f)" }}>
          🧪 Engineering Playground <span style={{ fontSize: 10, fontWeight: 800, background: "#6d557e", color: "#fff", borderRadius: 5, padding: "2px 7px", marginLeft: 6 }}>DEV / ENGENHARIA</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
          Bancada de calibração do motor v{ENGINE_VERSION}. Recalcula em tempo real pelo mesmo cálculo auditado.
          Comprimento de flambagem = min(pé-direito, travamento) = <b>{Lfl.toFixed(2)} m</b>.
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Controles */}
        <div style={{ ...CARD, flex: "1 1 320px", minWidth: 300 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted, #57514a)", marginBottom: 10 }}>Parâmetros</div>
          <label style={{ display: "block", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted, #57514a)", marginBottom: 3 }}>Perfil do montante</div>
            <select value={perfilId} onChange={(e) => setPerfilId(e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 12 }}>
              {montantes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </label>
          <label style={{ display: "block", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted, #57514a)", marginBottom: 3 }}>Tipo de aço</div>
            <select value={fy} onChange={(e) => setFy(Number(e.target.value))} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 12 }}>
              {ACOS.map((a) => <option key={a.fy} value={a.fy}>{a.nome} — fy {a.fy} MPa</option>)}
            </select>
          </label>
          <Slider label="Pé-direito" value={peDireito} min={2.2} max={6} step={0.1} unidade="m" onChange={setPeDireito} />
          <Slider label="Distância entre travamentos" value={travamento} min={0.4} max={6} step={0.1} unidade="m" onChange={setTravamento} />
          <Slider label="Espaçamento de montantes" value={espac} min={0.2} max={0.8} step={0.05} unidade="m" onChange={setEspac} />
          <Slider label="Sobrecarga Q" value={qSobre} min={0} max={15} step={0.5} unidade="kN/m²" onChange={setQSobre} />
          <Slider label="Carga permanente G" value={gPerm} min={0} max={8} step={0.25} unidade="kN/m²" onChange={setGPerm} />
          <Slider label="Largura tributária" value={largTrib} min={0.5} max={6} step={0.25} unidade="m" onChange={setLargTrib} />
          <Slider label="Vento V0" value={v0} min={30} max={50} step={1} unidade="m/s" onChange={setV0} />
          <Slider label="Preço do aço" value={custoKg} min={6} max={25} step={0.5} unidade="R$/kg" onChange={setCustoKg} />
        </div>

        {/* Saídas */}
        <div style={{ flex: "1 1 320px", minWidth: 300 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            <Metric label="Utilização η" value={util.toFixed(2)} cor={cor} sub={aud.resultado.status} />
            <Metric label="Margem (N_Rd/N_Sd)" value={Number.isFinite(margem) ? margem.toFixed(2) : "∞"} cor={cor} sub={util <= 1 ? "dentro da resistência" : "excede a resistência"} />
            <Metric label="Esbeltez λ" value={aud.resultado.esbeltez} cor={aud.resultado.esbeltezOk ? undefined : "#981915"} sub={`limite 200${aud.resultado.esbeltezOk ? "" : " ⚠"}`} />
            <Metric label="Modo governante" value={aud.resultado.modoGovernante === "esmagamento" ? "Esmag." : "Flamb."} sub={aud.resultado.modoGovernante} />
            <Metric label="Peso do montante" value={pesoKgM2 ?? "—"} unidade="kg/m²" sub="por m² de parede" />
            <Metric label="Custo estimado" value={custoM2 != null ? custoM2.toLocaleString("pt-BR") : "—"} unidade="R$/m²" sub={`aço R$ ${custoKg}/kg`} />
          </div>

          <div style={{ ...CARD, marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Perfil recomendado (η ≤ 0,85, mais leve)</div>
            {recomendado ? (
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text, #26231f)" }}>
                {recomendado.nome} <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>· {recomendado.peso_kg_m} kg/m · η = {auditarPreDimensionamento(entradaBase(recomendado)).resultado.utilizacao.toFixed(2)}</span>
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: "#981915", fontWeight: 600 }}>Nenhum perfil da base atende η ≤ 0,85 nestas condições — reduza o espaçamento, o vão livre ou as cargas.</div>
            )}
          </div>

          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 10, lineHeight: 1.5 }}>
            {aud.avisos[0]} A responsabilidade técnica é do engenheiro habilitado (ART/RRT).
          </div>
        </div>
      </div>
    </div>
  );
}
