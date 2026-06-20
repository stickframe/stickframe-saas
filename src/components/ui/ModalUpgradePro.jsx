import { useState } from "react";
import { sb } from "../../services/supabase";

const PLANOS = [
  {
    id: "starter",
    nome: "Starter",
    preco: "Grátis",
    sub: "14 dias de trial",
    cor: "#57514a",
    recursos: ["CRM básico (até 20 leads)", "Calculadora de orçamento", "Dashboard resumido", "1 usuário"],
    nao: ["Gestão de obras", "Financeiro", "BIM", "Analytics", "SST"],
  },
  {
    id: "pro",
    nome: "Pro",
    preco: "R$ 297",
    sub: "/mês · até 10 usuários",
    cor: "#981915",
    destaque: true,
    recursos: ["Tudo do Starter", "Gestão de obras ilimitada", "Financeiro & DRE", "CRM completo", "SST & Checklists", "Suprimentos", "Diário de obra", "Relatórios PDF", "Suporte prioritário"],
    nao: ["BIM / IFC 3D", "Analytics avançado", "Webhooks & API"],
  },
  {
    id: "enterprise",
    nome: "Enterprise",
    preco: "R$ 597",
    sub: "/mês · usuários ilimitados",
    cor: "#3b6ea5",
    recursos: ["Tudo do Pro", "BIM / Viewer IFC 3D", "Analytics avançado", "Integrações & Webhooks", "Multi-empresa", "Gerente de conta", "SLA 99,9%"],
    nao: [],
  },
];

export default function ModalUpgradePro({ onClose, featureNome }) {
  const [planSel, setPlanSel] = useState("pro");
  const [loading, setLoading] = useState(false);

  async function handleUpgrade(planId) {
    if (planId === "starter") { onClose?.(); return; }
    setLoading(true);
    try {
      const { data, error } = await sb.functions.invoke("upgrade-pro", { body: { plano: planId } });
      if (error) throw error;
      if (data?.link) window.open(data.link, "_blank");
      onClose?.();
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.65)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(4px)" }}>
      <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:640, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 32px 80px rgba(0,0,0,.28)", position:"relative" }}>
        {/* Header */}
        <div style={{ padding:"28px 28px 0", textAlign:"center" }}>
          <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#8c847a" }}>×</button>
          {featureNome && (
            <div style={{ display:"inline-block", background:"#f3e7e5", color:"#981915", borderRadius:8, padding:"4px 12px", fontSize:12, fontWeight:700, marginBottom:12 }}>
              🔒 {featureNome} — recurso premium
            </div>
          )}
          <h2 style={{ fontSize:22, fontWeight:800, color:"#26231f", margin:"0 0 6px" }}>Escolha seu plano</h2>
          <p style={{ fontSize:13, color:"#8c847a", margin:0 }}>Sem contrato de fidelidade · Cancele quando quiser</p>
        </div>

        {/* Plans grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, padding:"24px 24px 0" }}>
          {PLANOS.map(p => (
            <div key={p.id} onClick={() => setPlanSel(p.id)} style={{
              border: `2px solid ${planSel === p.id ? p.cor : "#e7e1d8"}`,
              borderRadius:14, padding:20, cursor:"pointer", position:"relative",
              background: planSel === p.id ? p.cor + "06" : "#fff",
              transition:"all .15s",
            }}>
              {p.destaque && (
                <div style={{ position:"absolute", top:-11, left:"50%", transform:"translateX(-50%)", background:p.cor, color:"#fff", borderRadius:99, fontSize:10, fontWeight:800, padding:"3px 12px", whiteSpace:"nowrap" }}>
                  Mais popular
                </div>
              )}
              <div style={{ fontSize:16, fontWeight:800, color:"#26231f", marginBottom:4 }}>{p.nome}</div>
              <div style={{ fontSize:22, fontWeight:900, color:p.cor, lineHeight:1 }}>{p.preco}</div>
              <div style={{ fontSize:11, color:"#8c847a", marginBottom:14 }}>{p.sub}</div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {p.recursos.map(r => (
                  <div key={r} style={{ display:"flex", gap:7, alignItems:"flex-start", fontSize:12, color:"#57514a" }}>
                    <span style={{ color:"#3f7a4b", fontWeight:700, flexShrink:0 }}>✓</span>{r}
                  </div>
                ))}
                {p.nao.map(r => (
                  <div key={r} style={{ display:"flex", gap:7, alignItems:"flex-start", fontSize:12, color:"#c0b8b0" }}>
                    <span style={{ flexShrink:0 }}>—</span>{r}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding:"20px 24px 28px" }}>
          {PLANOS.map(p => planSel !== p.id ? null : (
            <button key={p.id} onClick={() => handleUpgrade(p.id)} disabled={loading} style={{
              width:"100%", padding:"14px 0", background: p.id === "starter" ? "#f4f1ec" : p.cor,
              color: p.id === "starter" ? "#57514a" : "#fff",
              border:"none", borderRadius:10, fontSize:15, fontWeight:800,
              cursor:"pointer", fontFamily:"inherit",
            }}>
              {loading ? "Aguarde…" : p.id === "starter" ? "Continuar no Starter" : `Assinar ${p.nome} →`}
            </button>
          ))}
          <div style={{ textAlign:"center", marginTop:14, display:"flex", justifyContent:"center", gap:20 }}>
            {["🔒 Pagamento seguro", "✓ Sem fidelidade", "🇧🇷 Suporte em PT-BR"].map(t => (
              <span key={t} style={{ fontSize:11, color:"#8c847a" }}>{t}</span>
            ))}
          </div>
          <button onClick={onClose} style={{ display:"block", margin:"12px auto 0", background:"none", border:"none", color:"#8c847a", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
