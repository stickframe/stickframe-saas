import { useState } from "react";

// ─── PALETA ──────────────────────────────────────────────────────────────────
const C = {
  red: "#981915", redDark: "#6e1210", redGlow: "#98191533",
  graphite: "#414141", dark: "#1A1A1A", darker: "#111111",
  surface: "#232323", surface2: "#2a2a2a", border: "#2e2e2e",
  text: "#f0f0f0", muted: "#888", faint: "#333",
  success: "#2e9e5b", successBg: "#2e9e5b18",
  warning: "#c88a00", warningBg: "#c88a0018",
  danger: "#c0392b", dangerBg: "#c0392b18",
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_CLIENTES = [
  { id:1, nome:"Milton Ferreira",        cidade:"Bofete/SP",      contato:"(14) 99821-4455", status:"Em negociação",   valor:1250000, unidades:25 },
  { id:2, nome:"Construtora Alphaville", cidade:"São Paulo/SP",   contato:"(11) 94500-1122", status:"Proposta enviada",valor:480000,  unidades:8  },
  { id:3, nome:"Pref. de Socorro",       cidade:"Socorro/SP",     contato:"(19) 3355-8800",  status:"Fechado",         valor:930000,  unidades:18 },
  { id:4, nome:"Ricardo Neves",          cidade:"Santo André/SP", contato:"(11) 98777-3344", status:"Lead",            valor:95000,   unidades:2  },
];
const MOCK_ORCAMENTOS = [
  { id:1, ref:"ORC-2025-031", cliente:"Milton Ferreira",        valor:1250000, unidades:25, area:48, padrao:"padrao",      status:"Aguardando resposta", criado:"10/05/2025" },
  { id:2, ref:"ORC-2025-028", cliente:"Construtora Alphaville", valor:480000,  unidades:8,  area:72, padrao:"alto_padrao", status:"Em revisão",          criado:"02/05/2025" },
  { id:3, ref:"ORC-2025-019", cliente:"Pref. de Socorro",       valor:930000,  unidades:18, area:50, padrao:"economico",   status:"Aprovado",            criado:"14/03/2025" },
];
const MOCK_OBRAS = [
  { id:1, nome:"Residencial Bofete — 25 UH", cliente:"Milton Ferreira",        progresso:12, fase:"Projeto executivo",    prazo:"Dez/2025", status:"Em andamento" },
  { id:2, nome:"Conjunto Socorro — 18 UH",   cliente:"Pref. de Socorro",       progresso:78, fase:"Montagem estrutural",  prazo:"Jun/2025", status:"Em andamento" },
  { id:3, nome:"Alphaville Offices",          cliente:"Construtora Alphaville", progresso:0,  fase:"Aguardando aprovação", prazo:"—",        status:"Pausada"       },
];

// ─── DADOS FINANCEIROS POR OBRA ───────────────────────────────────────────────
const MOCK_FINANCEIRO = {
  1: {
    contrato: 1250000,
    recebido: 375000,   // 30% entrada
    lancamentos: [
      { id:1, tipo:"receita",  categoria:"Entrada contrato",   valor:375000, data:"10/04/2025", descricao:"30% assinatura" },
      { id:2, tipo:"despesa",  categoria:"Materiais",          valor:82000,  data:"15/04/2025", descricao:"Perfis steel frame lote 1" },
      { id:3, tipo:"despesa",  categoria:"Mão de obra",        valor:28000,  data:"30/04/2025", descricao:"Equipe montagem abr/25" },
      { id:4, tipo:"despesa",  categoria:"Projeto",            valor:12000,  data:"05/04/2025", descricao:"Projeto executivo" },
      { id:5, tipo:"despesa",  categoria:"Transporte",         valor:4500,   data:"18/04/2025", descricao:"Frete perfis" },
    ],
  },
  2: {
    contrato: 930000,
    recebido: 744000,   // 80% recebido
    lancamentos: [
      { id:1, tipo:"receita",  categoria:"Entrada contrato",   valor:279000, data:"15/02/2025", descricao:"30% assinatura" },
      { id:2, tipo:"receita",  categoria:"Medição 1",          valor:372000, data:"01/04/2025", descricao:"40% estrutura concluída" },
      { id:3, tipo:"receita",  categoria:"Medição 2",          valor:93000,  data:"30/04/2025", descricao:"10% fechamentos" },
      { id:4, tipo:"despesa",  categoria:"Materiais",          valor:310000, data:"20/02/2025", descricao:"Perfis + OSB + placa cimentícia" },
      { id:5, tipo:"despesa",  categoria:"Mão de obra",        valor:98000,  data:"31/03/2025", descricao:"Equipe fev-mar/25" },
      { id:6, tipo:"despesa",  categoria:"Mão de obra",        valor:52000,  data:"30/04/2025", descricao:"Equipe abr/25" },
      { id:7, tipo:"despesa",  categoria:"Equipamentos",       valor:18000,  data:"22/02/2025", descricao:"Locação equipamentos" },
      { id:8, tipo:"despesa",  categoria:"Projeto",            valor:9000,   data:"10/02/2025", descricao:"Projeto executivo + detalhamento" },
    ],
  },
  3: {
    contrato: 480000,
    recebido: 0,
    lancamentos: [
      { id:1, tipo:"despesa",  categoria:"Projeto",            valor:3500,   data:"28/04/2025", descricao:"Anteprojeto" },
    ],
  },
};

const CATEGORIAS_DESPESA = ["Materiais","Mão de obra","Projeto","Transporte","Equipamentos","Administrativo","Outros"];
const CATEGORIAS_RECEITA = ["Entrada contrato","Medição 1","Medição 2","Medição 3","Saldo final","Outros"];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt    = v => "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 0 });
const fmtPct = v => (v * 100).toFixed(1) + "%";
const PRECOS = {
  economico:   { label:"Econômico",   estrutura:320, fechamento:180, instalacoes:120, acabamento:180 },
  padrao:      { label:"Padrão",      estrutura:420, fechamento:240, instalacoes:160, acabamento:260 },
  alto_padrao: { label:"Alto Padrão", estrutura:560, fechamento:320, instalacoes:220, acabamento:380 },
};
const MARGEM = 0.22;
const statusColor = s => {
  if (s==="Fechado"||s==="Aprovado") return C.success;
  if (s==="Lead") return C.muted;
  if (s==="Pausada") return C.warning;
  return C.red;
};
const calcOrcamento = ({area,unidades,padrao}) => {
  const p=PRECOS[padrao]||PRECOS.padrao;
  const tot=(p.estrutura+p.fechamento+p.instalacoes+p.acabamento)*area;
  const com=tot*(1+MARGEM);
  return {valor_m2:com,valor_uh:com*area,valor_total:com*area*unidades};
};

// ─── ATOMS ────────────────────────────────────────────────────────────────────
const Badge = ({label,color}) => (
  <span style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:4,padding:"2px 10px",fontSize:11,fontWeight:700,letterSpacing:0.5,whiteSpace:"nowrap"}}>{label}</span>
);
const Input = ({value,onChange,placeholder,type="text"}) => (
  <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{width:"100%",background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,padding:"10px 13px",color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
);
const Select = ({value,onChange,options}) => (
  <select value={value} onChange={e=>onChange(e.target.value)}
    style={{background:C.darker,border:`1px solid ${C.border}`,borderRadius:6,padding:"10px 13px",color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",width:"100%"}}>
    {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);
const Btn = ({children,onClick,variant="primary",size="md",disabled,fullWidth}) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding:size==="sm"?"6px 12px":"11px 20px",
    background:variant==="primary"?C.red:variant==="success"?C.success:variant==="ghost"?"transparent":C.surface2,
    border:variant==="ghost"?`1px solid ${C.border}`:"none",
    borderRadius:6,color:disabled?C.muted:C.text,fontSize:size==="sm"?11:13,fontWeight:700,
    cursor:disabled?"not-allowed":"pointer",letterSpacing:0.4,fontFamily:"inherit",
    opacity:disabled?0.6:1,width:fullWidth?"100%":"auto",
  }}>{children}</button>
);
const Modal = ({title,onClose,children}) => (
  <div style={{position:"fixed",inset:0,background:"#000b",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}}
    onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:28,width:500,maxHeight:"90vh",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <h3 style={{fontSize:15,fontWeight:700}}>{title}</h3>
        <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:22,cursor:"pointer"}}>×</button>
      </div>
      {children}
    </div>
  </div>
);

// ─── MINI GRÁFICO DE BARRAS ───────────────────────────────────────────────────
function BarChart({data, height=100}) {
  const max = Math.max(...data.map(d=>d.value), 1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height,padding:"0 4px"}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{
            width:"100%",
            height: Math.max((d.value/max)*height*0.85, 4),
            background:d.color||C.red,
            borderRadius:"3px 3px 0 0",
            transition:"height 0.4s",
            opacity:0.85,
          }}/>
          <span style={{fontSize:9,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"100%",textAlign:"center"}}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── GERADOR DE PDF FINANCEIRO (client-side, sem dependências) ───────────────
function gerarRelatorioPDF(obras, financeiro) {
  const hoje = new Date().toLocaleDateString("pt-BR");
  const mes  = new Date().toLocaleString("pt-BR", { month:"long" });
  const ano  = new Date().getFullYear();
  const fmt  = v => "R$ " + Number(v).toLocaleString("pt-BR", {minimumFractionDigits:0});
  const fmtP = v => v.toFixed(1) + "%";

  // Calcula totais por obra
  const obrasData = obras.map(o => {
    const fin = financeiro[o.id] || { contrato:0, lancamentos:[] };
    const rec  = fin.lancamentos.filter(l=>l.tipo==="receita").reduce((a,l)=>a+l.valor,0);
    const desp = fin.lancamentos.filter(l=>l.tipo==="despesa").reduce((a,l)=>a+l.valor,0);
    const saldo = rec - desp;
    const marg  = rec>0 ? (saldo/rec*100) : 0;
    return { ...o, fin, rec, desp, saldo, marg, contrato: fin.contrato||o.contrato||0 };
  });

  const totRec  = obrasData.reduce((a,o)=>a+o.rec,0);
  const totDesp = obrasData.reduce((a,o)=>a+o.desp,0);
  const totSaldo= totRec - totDesp;
  const totMarg = totRec>0 ? (totSaldo/totRec*100) : 0;
  const totCont = obrasData.reduce((a,o)=>a+o.contrato,0);

  const cor = (v) => v>=0 ? "#2e9e5b" : "#c0392b";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Relatorio Financeiro — ${mes} ${ano}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;background:#fff;color:#222;font-size:12px;padding:0;}
  .header{background:#414141;padding:20px 30px 16px;display:flex;justify-content:space-between;align-items:center;}
  .logo-row{display:flex;align-items:center;gap:12px;}
  .logo-box{width:40px;height:40px;background:linear-gradient(135deg,#414141 50%,#981915 50%);border-radius:8px;border:1.5px solid #fff;}
  .logo-name{font-size:20px;font-weight:800;letter-spacing:3px;line-height:1;}
  .logo-name .g{color:#888;}
  .logo-name .r{color:#981915;}
  .logo-sub{font-size:8px;color:#666;letter-spacing:2px;margin-top:2px;}
  .header-right{text-align:right;color:#aaa;font-size:11px;}
  .header-right strong{color:#fff;font-size:15px;display:block;margin-bottom:3px;}
  .red-bar{height:4px;background:#981915;}
  .body{padding:24px 30px;}
  h2{font-size:8px;font-weight:700;letter-spacing:1.5px;color:#981915;margin:20px 0 8px;text-transform:uppercase;}
  .kpi-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:20px;}
  .kpi{background:#f7f7f7;border:1px solid #ddd;border-radius:8px;padding:12px;text-align:center;}
  .kpi-label{font-size:9px;color:#888;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.8px;}
  .kpi-val{font-size:14px;font-weight:800;}
  table{width:100%;border-collapse:collapse;margin-bottom:20px;}
  th{background:#414141;color:#fff;padding:8px 10px;text-align:left;font-size:9px;letter-spacing:0.8px;font-weight:700;}
  th.r{text-align:right;}
  td{padding:7px 10px;border-bottom:1px solid #eee;font-size:11px;}
  td.r{text-align:right;font-weight:700;}
  tr:nth-child(even) td{background:#f9f9f9;}
  .total-row td{background:#981915!important;color:#fff;font-weight:800;font-size:12px;}
  .obra-header{background:#f0f0f0;border:1px solid #ddd;border-radius:6px;padding:10px 14px;margin-bottom:8px;display:grid;grid-template-columns:1fr 1fr;gap:8px;}
  .oh-item{font-size:10px;} .oh-label{color:#888;margin-right:4px;}
  .badge-rec{color:#2e9e5b;font-weight:700;}
  .badge-desp{color:#981915;font-weight:700;}
  .subtotal-row td{background:#2e9e5b!important;color:#fff;font-weight:800;}
  .subtotal-row.neg td{background:#c0392b!important;}
  .footer{margin-top:40px;border-top:1px solid #ddd;padding-top:16px;display:flex;justify-content:space-between;font-size:10px;color:#aaa;}
  .assin{text-align:center;} .assin-line{border-top:1px solid #999;margin-bottom:6px;margin-top:30px;}
  @media print{body{padding:0;}.header{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style>
</head>
<body>
<div class="header">
  <div class="logo-row">
    <div class="logo-box"></div>
    <div><div class="logo-name"><span class="g">STICK</span><span class="r">FRAME</span></div><div class="logo-sub">SISTEMAS CONSTRUTIVOS</div></div>
  </div>
  <div class="header-right">
    <strong>RELATÓRIO FINANCEIRO — ${mes.toUpperCase()} ${ano}</strong>
    Emitido em ${hoje}
  </div>
</div>
<div class="red-bar"></div>
<div class="body">

<h2>Consolidado Geral</h2>
<div class="kpi-grid">
  <div class="kpi"><div class="kpi-label">Contratos</div><div class="kpi-val">${fmt(totCont)}</div></div>
  <div class="kpi"><div class="kpi-label">Receitas</div><div class="kpi-val" style="color:#2e9e5b">${fmt(totRec)}</div></div>
  <div class="kpi"><div class="kpi-label">Despesas</div><div class="kpi-val" style="color:#981915">${fmt(totDesp)}</div></div>
  <div class="kpi"><div class="kpi-label">Saldo</div><div class="kpi-val" style="color:${cor(totSaldo)}">${fmt(totSaldo)}</div></div>
  <div class="kpi"><div class="kpi-label">Margem</div><div class="kpi-val" style="color:${cor(totMarg)}">${fmtP(totMarg)}</div></div>
  <div class="kpi"><div class="kpi-label">A receber</div><div class="kpi-val" style="color:#c88a00">${fmt(totCont-totRec)}</div></div>
</div>

<h2>Resumo por Obra</h2>
<table>
<thead><tr>
  <th>Obra</th><th>Cliente</th><th>Fase</th>
  <th class="r">Receitas</th><th class="r">Despesas</th><th class="r">Saldo</th><th class="r">Margem</th>
</tr></thead>
<tbody>
${obrasData.map(o=>`
<tr>
  <td>${o.nome.split("—")[0].trim()}</td>
  <td style="color:#888">${o.cliente}</td>
  <td style="color:#888">${o.fase}</td>
  <td class="r" style="color:#2e9e5b">${fmt(o.rec)}</td>
  <td class="r" style="color:#981915">${fmt(o.desp)}</td>
  <td class="r" style="color:${cor(o.saldo)}">${fmt(o.saldo)}</td>
  <td class="r" style="color:${cor(o.marg)}">${fmtP(o.marg)}</td>
</tr>`).join("")}
<tr class="total-row">
  <td colspan="3"><strong>TOTAL CONSOLIDADO</strong></td>
  <td class="r">${fmt(totRec)}</td>
  <td class="r">${fmt(totDesp)}</td>
  <td class="r">${fmt(totSaldo)}</td>
  <td class="r">${fmtP(totMarg)}</td>
</tr>
</tbody>
</table>

${obrasData.map(o=>`
<h2>Detalhamento — ${o.nome}</h2>
<div class="obra-header">
  <div class="oh-item"><span class="oh-label">Cliente:</span><strong>${o.cliente}</strong></div>
  <div class="oh-item"><span class="oh-label">Contrato:</span><strong>${fmt(o.contrato)}</strong></div>
  <div class="oh-item"><span class="oh-label">Fase:</span>${o.fase}</div>
  <div class="oh-item"><span class="oh-label">Progresso:</span>${o.progresso}%</div>
</div>
<table>
<thead><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descricao</th><th class="r">Valor</th></tr></thead>
<tbody>
${(o.fin.lancamentos||[]).map(l=>`
<tr>
  <td style="color:#888">${l.data}</td>
  <td class="${l.tipo==="receita"?"badge-rec":"badge-desp"}">${l.tipo.charAt(0).toUpperCase()+l.tipo.slice(1)}</td>
  <td>${l.categoria}</td>
  <td>${l.descricao}</td>
  <td class="r" style="color:${l.tipo==="receita"?"#2e9e5b":"#981915"}">${l.tipo==="receita"?"+":"-"} ${fmt(l.valor)}</td>
</tr>`).join("")}
<tr class="subtotal-row${o.saldo<0?" neg":""}">
  <td colspan="4"><strong>Saldo do periodo</strong></td>
  <td class="r">${o.saldo>=0?"+":""}${fmt(o.saldo)}</td>
</tr>
</tbody>
</table>
`).join("")}

<div class="footer">
  <div>Stick Frame Sistemas Construtivos Ltda. &nbsp;|&nbsp; Documento confidencial</div>
  <div>Santo Andre, ${hoje}</div>
</div>

</div>
</body>
</html>`;

  const blob = new Blob([html], {type:"text/html"});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `Relatorio_Financeiro_StickFrame_${mes}_${ano}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── MÓDULO FINANCEIRO ────────────────────────────────────────────────────────
function Financeiro({obras,financeiro,setFinanceiro}) {
  const [obraId, setObraId]   = useState(obras[0]?.id);
  const [modal,  setModal]    = useState(null); // "receita" | "despesa"
  const [form,   setForm]     = useState({tipo:"despesa",categoria:"Materiais",valor:"",data:"",descricao:""});
  const set = k => v => setForm(f=>({...f,[k]:v}));

  const obra = obras.find(o=>o.id===obraId)||obras[0];
  const fin  = financeiro[obraId]||{contrato:0,recebido:0,lancamentos:[]};

  // Totais
  const receitas = fin.lancamentos.filter(l=>l.tipo==="receita").reduce((a,l)=>a+l.valor,0);
  const despesas = fin.lancamentos.filter(l=>l.tipo==="despesa").reduce((a,l)=>a+l.valor,0);
  const saldo    = receitas - despesas;
  const margem   = receitas>0 ? (saldo/receitas) : 0;
  const aReceber = fin.contrato - receitas;
  const pctRec   = fin.contrato>0 ? receitas/fin.contrato : 0;

  // Despesas por categoria
  const porCategoria = CATEGORIAS_DESPESA.map(cat=>{
    const total = fin.lancamentos.filter(l=>l.tipo==="despesa"&&l.categoria===cat).reduce((a,l)=>a+l.valor,0);
    return {label:cat.split(" ")[0],value:total,color:C.red};
  }).filter(d=>d.value>0);

  const salvar = () => {
    const novo = {...form,id:Date.now(),valor:parseFloat(form.valor.replace(",","."))};
    setFinanceiro(prev=>({
      ...prev,
      [obraId]:{...fin,lancamentos:[...fin.lancamentos,novo]},
    }));
    setModal(null);
    setForm({tipo:"despesa",categoria:"Materiais",valor:"",data:"",descricao:""});
  };
  const ok = form.valor && form.data && form.descricao;

  return (
    <>
      {modal && (
        <Modal title={modal==="receita"?"Nova receita":"Nova despesa"} onClose={()=>setModal(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:6}}>CATEGORIA</div>
              <Select value={form.categoria} onChange={v=>{
                set("categoria")(v);
                set("tipo")(modal)();
                setForm(f=>({...f,categoria:v,tipo:modal}));
              }} options={(modal==="receita"?CATEGORIAS_RECEITA:CATEGORIAS_DESPESA).map(c=>({value:c,label:c}))}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:6}}>VALOR (R$)</div>
                <Input value={form.valor} onChange={set("valor")} placeholder="Ex: 15000" type="number"/>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:6}}>DATA</div>
                <Input value={form.data} onChange={set("data")} placeholder="DD/MM/AAAA"/>
              </div>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:6}}>DESCRIÇÃO</div>
              <Input value={form.descricao} onChange={set("descricao")} placeholder="Detalhe do lançamento"/>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:6}}>
              <Btn variant="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
              <Btn variant={modal==="receita"?"success":"primary"} disabled={!ok} onClick={salvar}>
                {modal==="receita"?"+ Registrar receita":"+ Registrar despesa"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      <div>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
          <div>
            <h2 style={{fontSize:22,fontWeight:800}}>Controle Financeiro</h2>
            <p style={{color:C.muted,fontSize:13,marginTop:4}}>Receitas, despesas e margem por obra</p>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>gerarRelatorioPDF(obras,financeiro)} style={{
              padding:"10px 18px",background:"transparent",border:`1px solid ${C.success}`,
              borderRadius:6,color:C.success,fontSize:13,fontWeight:700,cursor:"pointer",
              fontFamily:"inherit",letterSpacing:0.4,
            }}>📄 Gerar Relatório</button>
            <Btn variant="success" onClick={()=>{ setForm(f=>({...f,tipo:"receita",categoria:"Entrada contrato"})); setModal("receita"); }}>+ Receita</Btn>
            <Btn onClick={()=>{ setForm(f=>({...f,tipo:"despesa",categoria:"Materiais"})); setModal("despesa"); }}>+ Despesa</Btn>
          </div>
        </div>

        {/* Seletor de obra */}
        <div style={{display:"flex",gap:10,marginBottom:22}}>
          {obras.map(o=>(
            <button key={o.id} onClick={()=>setObraId(o.id)} style={{
              padding:"8px 16px",borderRadius:8,
              border:`1px solid ${obraId===o.id?C.red:C.border}`,
              background:obraId===o.id?C.red+"18":"transparent",
              color:obraId===o.id?C.text:C.muted,
              fontSize:12,fontWeight:obraId===o.id?700:400,cursor:"pointer",
            }}>{o.nome.split("—")[0].trim()}</button>
          ))}
        </div>

        {/* KPIs financeiros */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:22}}>
          {[
            {label:"Contrato",    value:fmt(fin.contrato), color:C.border,   sub:"valor total" },
            {label:"Recebido",    value:fmt(receitas),     color:C.success,  sub:fmtPct(pctRec)+" do contrato" },
            {label:"A receber",   value:fmt(aReceber),     color:C.warning,  sub:"saldo em aberto" },
            {label:"Despesas",    value:fmt(despesas),     color:C.red,      sub:`${fin.lancamentos.filter(l=>l.tipo==="despesa").length} lançamentos` },
            {label:"Margem real", value:fmtPct(margem),   color:margem>0?C.success:C.danger, sub:saldo>=0?"saldo positivo":"saldo negativo" },
          ].map((k,i)=>(
            <div key={i} style={{background:C.surface,borderRadius:10,padding:"16px 18px",border:`1px solid ${C.border}`,borderTop:`3px solid ${k.color}`}}>
              <div style={{fontSize:10,color:C.muted,letterSpacing:1,marginBottom:8}}>{k.label.toUpperCase()}</div>
              <div style={{fontSize:18,fontWeight:800,color:k.color===C.border?C.text:k.color}}>{k.value}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:4}}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Barra de recebimento */}
        <div style={{background:C.surface,borderRadius:10,padding:"18px 20px",border:`1px solid ${C.border}`,marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:10}}>
            <span style={{color:C.muted}}>Progresso de recebimento</span>
            <span style={{fontWeight:700,color:C.text}}>{fmt(receitas)} <span style={{color:C.muted,fontWeight:400}}>de {fmt(fin.contrato)}</span></span>
          </div>
          <div style={{height:10,background:C.dark,borderRadius:5,overflow:"hidden"}}>
            <div style={{
              height:10,
              width:`${Math.min(pctRec*100,100)}%`,
              background:`linear-gradient(90deg,${C.success},#1a7a40)`,
              borderRadius:5,transition:"width 0.5s",
            }}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted,marginTop:6}}>
            <span>{fmtPct(pctRec)} recebido</span>
            <span>{fmtPct(1-pctRec)} a receber</span>
          </div>
        </div>

        {/* Grid: gráfico + tabela */}
        <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:18}}>

          {/* Gráfico de despesas por categoria */}
          <div style={{background:C.surface,borderRadius:10,padding:20,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:16}}>DESPESAS POR CATEGORIA</div>
            {porCategoria.length>0 ? (
              <>
                <BarChart data={porCategoria} height={110}/>
                <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:8}}>
                  {porCategoria.map(d=>(
                    <div key={d.label} style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
                      <span style={{color:C.muted}}>{d.label}</span>
                      <span style={{color:C.text,fontWeight:600}}>{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{fontSize:12,color:C.muted,textAlign:"center",padding:"24px 0"}}>Nenhuma despesa lançada</div>
            )}
          </div>

          {/* Extrato de lançamentos */}
          <div style={{background:C.surface,borderRadius:10,border:`1px solid ${C.border}`,overflow:"hidden"}}>
            <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted}}>EXTRATO DE LANÇAMENTOS</div>
              <span style={{fontSize:11,color:C.muted}}>{fin.lancamentos.length} registros</span>
            </div>
            <div style={{maxHeight:360,overflowY:"auto"}}>
              {fin.lancamentos.length===0 ? (
                <div style={{padding:32,textAlign:"center",color:C.muted,fontSize:13}}>Nenhum lançamento registrado.</div>
              ) : (
                [...fin.lancamentos].reverse().map(l=>(
                  <div key={l.id} style={{
                    display:"flex",alignItems:"center",gap:14,
                    padding:"13px 20px",
                    borderBottom:`1px solid ${C.border}`,
                  }}>
                    {/* Indicador tipo */}
                    <div style={{
                      width:8,height:8,borderRadius:"50%",flexShrink:0,
                      background:l.tipo==="receita"?C.success:C.red,
                    }}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:C.text}}>{l.descricao}</div>
                      <div style={{fontSize:11,color:C.muted,marginTop:2}}>{l.categoria} · {l.data}</div>
                    </div>
                    <div style={{
                      fontSize:14,fontWeight:700,
                      color:l.tipo==="receita"?C.success:C.red,
                      flexShrink:0,
                    }}>
                      {l.tipo==="receita"?"+":"-"} {fmt(l.valor)}
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Totalizadores rodapé extrato */}
            <div style={{
              padding:"12px 20px",borderTop:`2px solid ${C.border}`,
              display:"flex",justifyContent:"space-between",
              background:C.darker,
            }}>
              <div style={{fontSize:12}}>
                <span style={{color:C.muted}}>Receitas </span>
                <span style={{color:C.success,fontWeight:700}}>{fmt(receitas)}</span>
                <span style={{color:C.muted,margin:"0 10px"}}>·</span>
                <span style={{color:C.muted}}>Despesas </span>
                <span style={{color:C.red,fontWeight:700}}>{fmt(despesas)}</span>
              </div>
              <div style={{fontSize:13,fontWeight:800,color:saldo>=0?C.success:C.danger}}>
                Saldo: {saldo>=0?"+":""}{fmt(saldo)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SUPABASE MOCK + AUTH
// ════════════════════════════════════════════════════════════════════════════
const supabaseMock = {
  async signIn(email,password) {
    await new Promise(r=>setTimeout(r,800));
    const USERS = {
      "andre@stickframe.com.br":  {password:"stick2025",nome:"André",cargo:"Diretor Comercial"},
      "vendas@stickframe.com.br": {password:"vendas123",nome:"Equipe Vendas",cargo:"Consultor"},
    };
    const u = USERS[email.toLowerCase()];
    if (!u||u.password!==password) throw new Error("E-mail ou senha incorretos.");
    return {user:{email,nome:u.nome,cargo:u.cargo}};
  },
  async signOut() { await new Promise(r=>setTimeout(r,200)); },
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({onLogin}) {
  const [email,setEmail]       = useState("");
  const [senha,setSenha]       = useState("");
  const [erro,setErro]         = useState("");
  const [loading,setLoading]   = useState(false);
  const [showPass,setShowPass] = useState(false);

  const handleLogin = async () => {
    setErro(""); if(!email||!senha){setErro("Preencha e-mail e senha.");return;}
    setLoading(true);
    try { const {user}=await supabaseMock.signIn(email,senha); onLogin(user); }
    catch(e) { setErro(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:"100vh",background:C.darker,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${C.border} 1px,transparent 1px),linear-gradient(90deg,${C.border} 1px,transparent 1px)`,backgroundSize:"48px 48px",opacity:0.3}}/>
      <div style={{position:"absolute",width:600,height:600,background:`radial-gradient(circle,${C.redGlow} 0%,transparent 70%)`,top:"50%",left:"50%",transform:"translate(-50%,-50%)"}}/>
      <div style={{position:"relative",width:420,background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,padding:"40px 40px 36px",boxShadow:"0 0 80px #00000088"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:32}}>
          <img src="/logo.png" style={{width:44,height:44,borderRadius:10,flexShrink:0,objectFit:"contain"}}/>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,letterSpacing:3,fontSize:20,lineHeight:1}}>
              <span style={{color:C.graphite}}>STICK</span><span style={{color:C.red}}>FRAME</span>
            </div>
            <div style={{color:C.muted,fontSize:9,letterSpacing:2,marginTop:2}}>SISTEMAS CONSTRUTIVOS</div>
          </div>
        </div>
        <h1 style={{fontSize:20,fontWeight:800,marginBottom:4}}>Bem-vindo de volta</h1>
        <p style={{fontSize:13,color:C.muted,marginBottom:24}}>Entre com sua conta para acessar o sistema.</p>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:6}}>E-MAIL</div>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com.br"
              style={{width:"100%",background:"transparent",border:`1px solid ${erro?C.red:C.border}`,borderRadius:8,padding:"12px 16px",color:C.text,fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted}}>SENHA</span>
              <button onClick={()=>setShowPass(v=>!v)} style={{background:"none",border:"none",fontSize:11,color:C.red,cursor:"pointer",fontFamily:"inherit"}}>{showPass?"Ocultar":"Mostrar"}</button>
            </div>
            <input type={showPass?"text":"password"} value={senha} onChange={e=>setSenha(e.target.value)} placeholder="••••••••"
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              style={{width:"100%",background:"transparent",border:`1px solid ${erro?C.red:C.border}`,borderRadius:8,padding:"12px 16px",color:C.text,fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          {erro&&<div style={{background:C.red+"18",border:`1px solid ${C.red}44`,borderRadius:6,padding:"10px 14px",fontSize:12,color:C.red}}>{erro}</div>}
          <button onClick={handleLogin} disabled={loading}
            style={{padding:"13px 0",background:C.red,border:"none",borderRadius:8,color:C.text,fontSize:14,fontWeight:700,cursor:"pointer",width:"100%",opacity:loading?0.7:1,fontFamily:"inherit",marginTop:4}}>
            {loading?"Autenticando…":"Entrar no sistema →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const NAV = [
  {key:"dashboard",  label:"Dashboard",        icon:"▣"},
  {key:"crm",        label:"CRM / Clientes",   icon:"◈"},
  {key:"orcamentos", label:"Orçamentos",        icon:"◻"},
  {key:"obras",      label:"Gestão de Obras",  icon:"◆"},
  {key:"financeiro", label:"Financeiro",        icon:"◉"},
];

function Sidebar({active,setActive,user,onLogout}) {
  const [confirm,setConfirm] = useState(false);
  return (
    <aside style={{width:220,minHeight:"100vh",background:C.darker,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"22px 20px 18px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <img src="/logo.png" style={{width:34,height:34,borderRadius:8,flexShrink:0,objectFit:"contain"}}/>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,letterSpacing:2.5,fontSize:15,lineHeight:1}}>
              <span style={{color:C.graphite}}>STICK</span><span style={{color:C.red}}>FRAME</span>
            </div>
            <div style={{color:C.muted,fontSize:8,letterSpacing:1.5,marginTop:1}}>SISTEMAS CONSTRUTIVOS</div>
          </div>
        </div>
      </div>
      <nav style={{flex:1,padding:"12px 0"}}>
        {NAV.map(n=>(
          <button key={n.key} onClick={()=>setActive(n.key)} style={{
            display:"flex",alignItems:"center",gap:12,width:"100%",padding:"11px 20px",
            background:active===n.key?C.red+"18":"transparent",
            borderLeft:`3px solid ${active===n.key?C.red:"transparent"}`,
            border:"none",cursor:"pointer",
            color:active===n.key?C.text:C.muted,
            fontSize:13,fontWeight:active===n.key?600:400,textAlign:"left",transition:"all 0.15s",
          }}>
            <span style={{fontSize:15,color:active===n.key?C.red:C.muted}}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>
      <div style={{padding:"14px 20px",borderTop:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:C.red+"33",border:`2px solid ${C.red}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:C.red,flexShrink:0}}>{user?.nome?.[0]||"U"}</div>
          <div style={{overflow:"hidden"}}>
            <div style={{fontSize:12,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.nome}</div>
            <div style={{fontSize:10,color:C.muted}}>{user?.cargo}</div>
          </div>
        </div>
        {confirm?(
          <div style={{fontSize:11,color:C.muted}}>
            Sair mesmo?{" "}
            <button onClick={onLogout} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontWeight:700,fontSize:11}}>Sim</button>
            {" · "}
            <button onClick={()=>setConfirm(false)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:11}}>Não</button>
          </div>
        ):(
          <button onClick={()=>setConfirm(true)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,color:C.muted,fontSize:11,cursor:"pointer",padding:"6px 12px",width:"100%",fontFamily:"inherit",textAlign:"left"}}>↩ Sair da conta</button>
        )}
      </div>
    </aside>
  );
}

// ─── PÁGINAS ANTERIORES (compactadas) ────────────────────────────────────────
function Dashboard({clientes,orcamentos,obras,financeiro}) {
  const pipeline  = clientes.reduce((a,c)=>a+(c.valor||0),0);
  const totalRec  = Object.values(financeiro).reduce((a,f)=>a+f.lancamentos.filter(l=>l.tipo==="receita").reduce((b,l)=>b+l.valor,0),0);
  const totalDesp = Object.values(financeiro).reduce((a,f)=>a+f.lancamentos.filter(l=>l.tipo==="despesa").reduce((b,l)=>b+l.valor,0),0);
  const kpis = [
    {label:"Pipeline",    value:fmt(pipeline),            sub:`${clientes.length} clientes`,      accent:C.red    },
    {label:"Receitas",    value:fmt(totalRec),            sub:"total recebido",                    accent:C.success},
    {label:"Despesas",    value:fmt(totalDesp),           sub:"total lançado",                     accent:C.red    },
    {label:"Saldo geral", value:fmt(totalRec-totalDesp),  sub:"resultado consolidado",             accent:totalRec-totalDesp>=0?C.success:C.danger},
  ];
  return (
    <div>
      <h2 style={{fontSize:22,fontWeight:800,marginBottom:4}}>Dashboard</h2>
      <p style={{color:C.muted,fontSize:13,marginBottom:26}}>Visão consolidada — Maio 2025</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:26}}>
        {kpis.map((k,i)=>(
          <div key={i} style={{background:C.surface,borderRadius:12,padding:"18px 20px",border:`1px solid ${C.border}`,borderTop:`3px solid ${k.accent}`}}>
            <div style={{fontSize:10,color:C.muted,letterSpacing:1.2,marginBottom:8}}>{k.label.toUpperCase()}</div>
            <div style={{fontSize:20,fontWeight:800,color:k.accent===C.border?C.text:k.accent}}>{k.value}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:4}}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <div style={{background:C.surface,borderRadius:12,padding:20,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:14}}>FUNIL DE VENDAS</div>
          {["Lead","Em negociação","Proposta enviada","Fechado"].map(f=>{
            const n=clientes.filter(c=>c.status===f).length;
            const p=clientes.length?Math.round(n/clientes.length*100):0;
            return (<div key={f} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}><span>{f}</span><span style={{color:C.muted}}>{n}</span></div>
              <div style={{height:5,background:C.dark,borderRadius:3}}><div style={{height:5,width:`${p}%`,background:f==="Fechado"?C.success:C.red,borderRadius:3}}/></div>
            </div>);
          })}
        </div>
        <div style={{background:C.surface,borderRadius:12,padding:20,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:14}}>OBRAS — PROGRESSO</div>
          {obras.map(o=>(
            <div key={o.id} style={{marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:600,marginBottom:2}}>{o.nome.split("—")[0].trim()}</div>
              <div style={{height:5,background:C.dark,borderRadius:3}}><div style={{height:5,width:`${o.progresso}%`,background:o.progresso>50?C.success:C.red,borderRadius:3}}/></div>
              <div style={{fontSize:10,color:C.muted,marginTop:2,textAlign:"right"}}>{o.progresso}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CRM({clientes,setClientes}) {
  const [modal,setModal]   = useState(false);  // "novo" | "editar"
  const [sel,setSel]       = useState(null);
  const [confirm,setConfirm] = useState(false);
  const FORM_VAZIO = {nome:"",cidade:"",contato:"",status:"Lead"};
  const [form,setForm]     = useState(FORM_VAZIO);
  const set = k => v => setForm(f=>({...f,[k]:v}));
  const cliente = clientes.find(c=>c.id===sel);

  const abrirNovo  = () => { setForm(FORM_VAZIO); setModal("novo"); };
  const abrirEditar = (c) => { setForm({nome:c.nome,cidade:c.cidade,contato:c.contato||"",status:c.status}); setModal("editar"); };

  const salvarNovo = () => {
    setClientes(p=>[...p,{...form,id:Date.now(),valor:0,unidades:0}]);
    setModal(false);
  };
  const salvarEdicao = () => {
    setClientes(p=>p.map(c=>c.id===sel?{...c,...form}:c));
    setModal(false);
  };
  const deletar = () => {
    setClientes(p=>p.filter(c=>c.id!==sel));
    setSel(null); setConfirm(false);
  };

  const FormCliente = ({onSave,btnLabel}) => (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {[["Nome","nome","Ex: João Silva"],["Cidade/UF","cidade","Ex: Bofete/SP"],["Contato","contato","(11) 9xxxx-xxxx"]].map(([l,k,ph])=>(
        <div key={k}><div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:6}}>{l.toUpperCase()}</div><Input value={form[k]} onChange={set(k)} placeholder={ph}/></div>
      ))}
      <div><div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:6}}>STATUS</div>
        <Select value={form.status} onChange={set("status")} options={[{value:"Lead",label:"Lead"},{value:"Em negociação",label:"Em negociação"},{value:"Proposta enviada",label:"Proposta enviada"},{value:"Fechado",label:"Fechado"}]}/>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:6}}>
        <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
        <Btn disabled={!form.nome||!form.cidade} onClick={onSave}>{btnLabel}</Btn>
      </div>
    </div>
  );

  return (
    <>
      {modal==="novo"   && <Modal title="Novo cliente"   onClose={()=>setModal(false)}><FormCliente onSave={salvarNovo}   btnLabel="Salvar cliente"/></Modal>}
      {modal==="editar" && <Modal title="Editar cliente" onClose={()=>setModal(false)}><FormCliente onSave={salvarEdicao} btnLabel="Salvar alterações"/></Modal>}

      {confirm && (
        <div style={{position:"fixed",inset:0,background:"#000b",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:28,width:360,textAlign:"center"}}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Deletar cliente?</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:24}}>Essa ação não pode ser desfeita.</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <Btn variant="ghost" onClick={()=>setConfirm(false)}>Cancelar</Btn>
              <button onClick={deletar} style={{padding:"10px 20px",background:C.danger,border:"none",borderRadius:6,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Deletar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:sel?"1fr 300px":"1fr",gap:18}}>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div><h2 style={{fontSize:22,fontWeight:800}}>CRM / Clientes</h2><p style={{color:C.muted,fontSize:13,marginTop:4}}>{clientes.length} contatos</p></div>
            <Btn onClick={abrirNovo}>+ Novo cliente</Btn>
          </div>
          <div style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:`2px solid ${C.red}22`}}>
                {["Cliente","Cidade","UH","Valor","Status",""].map(h=>(
                  <th key={h} style={{padding:"11px 15px",textAlign:"left",fontSize:10,letterSpacing:1.2,color:C.muted,fontWeight:700}}>{h.toUpperCase()}</th>
                ))}
              </tr></thead>
              <tbody>{clientes.map(c=>(
                <tr key={c.id} onClick={()=>setSel(sel===c.id?null:c.id)} style={{borderBottom:`1px solid ${C.border}`,background:sel===c.id?C.red+"0e":"transparent",cursor:"pointer"}}>
                  <td style={{padding:"12px 15px",fontSize:13,fontWeight:600}}>{c.nome}</td>
                  <td style={{padding:"12px 15px",fontSize:13,color:C.muted}}>{c.cidade}</td>
                  <td style={{padding:"12px 15px",fontSize:13}}>{c.unidades||"—"}</td>
                  <td style={{padding:"12px 15px",fontSize:13,fontWeight:600}}>{c.valor?fmt(c.valor):"—"}</td>
                  <td style={{padding:"12px 15px"}}><Badge label={c.status} color={statusColor(c.status)}/></td>
                  <td style={{padding:"12px 15px",color:C.muted,fontSize:18}}>›</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
        {cliente&&(
          <div style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:22,height:"fit-content"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
              <div><div style={{fontSize:15,fontWeight:700}}>{cliente.nome}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{cliente.cidade}</div></div>
              <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>×</button>
            </div>
            <Badge label={cliente.status} color={statusColor(cliente.status)}/>
            <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:10}}>
              {[["Contato",cliente.contato||"—"],["Unidades",cliente.unidades?`${cliente.unidades} UH`:"—"],["Valor",cliente.valor?fmt(cliente.valor):"—"]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`,paddingBottom:9}}>
                  <span style={{fontSize:12,color:C.muted}}>{k}</span><span style={{fontSize:13,fontWeight:600}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8,marginTop:18}}>
              <Btn variant="ghost" size="sm" onClick={()=>abrirEditar(cliente)} fullWidth>✏️ Editar</Btn>
              <button onClick={()=>setConfirm(true)} style={{flex:1,padding:"7px 0",background:C.danger+"22",border:`1px solid ${C.danger}44`,borderRadius:6,color:C.danger,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🗑 Deletar</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Orcamentos({clientes,orcamentos,setOrcamentos}) {
  const [modal,setModal]     = useState(false); // "novo" | "editar"
  const [editId,setEditId]   = useState(null);
  const [confirm,setConfirm] = useState(null);
  const FORM_VAZIO = {cliente_id:clientes[0]?.id||"",unidades:1,area:48,padrao:"padrao"};
  const [form,setForm] = useState(FORM_VAZIO);
  const set = k => v => setForm(f=>({...f,[k]:v}));

  const calc        = calcOrcamento({area:Number(form.area),unidades:Number(form.unidades),padrao:form.padrao});
  const clienteSel  = clientes.find(c=>c.id===Number(form.cliente_id));

  const abrirNovo = () => { setForm(FORM_VAZIO); setModal("novo"); };
  const abrirEditar = (o) => {
    setEditId(o.id);
    setForm({cliente_id:o.cliente_id||clientes[0]?.id||"",unidades:o.unidades,area:o.area,padrao:o.padrao||"padrao"});
    setModal("editar");
  };

  const salvarNovo = () => {
    setOrcamentos(p=>[{id:Date.now(),ref:`ORC-2025-${String(p.length+32).padStart(3,"0")}`,cliente:clienteSel?.nome||"—",cliente_id:Number(form.cliente_id),valor:calc.valor_total,unidades:Number(form.unidades),area:Number(form.area),padrao:form.padrao,status:"Aguardando resposta",criado:new Date().toLocaleDateString("pt-BR")},...p]);
    setModal(false);
  };
  const salvarEdicao = () => {
    setOrcamentos(p=>p.map(o=>o.id===editId?{...o,cliente:clienteSel?.nome||o.cliente,cliente_id:Number(form.cliente_id),unidades:Number(form.unidades),area:Number(form.area),padrao:form.padrao,valor:calc.valor_total}:o));
    setModal(false);
  };
  const deletar = (id) => { setOrcamentos(p=>p.filter(o=>o.id!==id)); setConfirm(null); };

  const FormOrc = ({onSave,btnLabel}) => (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div><div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:6}}>CLIENTE</div><Select value={form.cliente_id} onChange={set("cliente_id")} options={clientes.map(c=>({value:c.id,label:c.nome}))}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div><div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:6}}>UNIDADES</div><Input type="number" value={form.unidades} onChange={set("unidades")}/></div>
        <div><div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:6}}>ÁREA/UH (m²)</div><Input type="number" value={form.area} onChange={set("area")}/></div>
      </div>
      <div><div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:6}}>PADRÃO</div><Select value={form.padrao} onChange={set("padrao")} options={Object.entries(PRECOS).map(([k,v])=>({value:k,label:v.label}))}/></div>
      <div style={{background:C.darker,borderRadius:8,border:`1px solid ${C.red}33`,padding:14}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:1,color:C.red,marginBottom:10}}>PRÉVIA</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[["Valor/m²",fmt(calc.valor_m2)],["Valor/UH",fmt(calc.valor_uh)],["Total",fmt(calc.valor_total)]].map(([k,v])=>(
            <div key={k} style={{background:C.surface,borderRadius:6,padding:"8px 10px"}}><div style={{fontSize:10,color:C.muted,marginBottom:3}}>{k}</div><div style={{fontSize:12,fontWeight:700,color:k==="Total"?C.red:C.text}}>{v}</div></div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
        <Btn onClick={onSave}>{btnLabel}</Btn>
      </div>
    </div>
  );

  return (
    <>
      {modal==="novo"   && <Modal title="Novo orçamento"   onClose={()=>setModal(false)}><FormOrc onSave={salvarNovo}   btnLabel="Gerar orçamento"/></Modal>}
      {modal==="editar" && <Modal title="Editar orçamento" onClose={()=>setModal(false)}><FormOrc onSave={salvarEdicao} btnLabel="Salvar alterações"/></Modal>}

      {confirm && (
        <div style={{position:"fixed",inset:0,background:"#000b",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:28,width:360,textAlign:"center"}}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Deletar orçamento?</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:24}}>Essa ação não pode ser desfeita.</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <Btn variant="ghost" onClick={()=>setConfirm(null)}>Cancelar</Btn>
              <button onClick={()=>deletar(confirm)} style={{padding:"10px 20px",background:C.danger,border:"none",borderRadius:6,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Deletar</button>
            </div>
          </div>
        </div>
      )}

      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div><h2 style={{fontSize:22,fontWeight:800}}>Orçamentos</h2><p style={{color:C.muted,fontSize:13,marginTop:4}}>{orcamentos.length} propostas</p></div>
          <Btn onClick={abrirNovo}>+ Novo orçamento</Btn>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {orcamentos.map(o=>(
            <div key={o.id} style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:"15px 20px",display:"flex",alignItems:"center",gap:16}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:4}}><span style={{fontSize:11,color:C.red,fontWeight:700,letterSpacing:1}}>{o.ref}</span><Badge label={o.status} color={statusColor(o.status)}/></div>
                <div style={{fontSize:14,fontWeight:700}}>{o.cliente}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>{o.unidades} UH · {o.area} m²/und · {PRECOS[o.padrao]?.label||"Padrão"} · {o.criado}</div>
              </div>
              <div style={{textAlign:"right"}}><div style={{fontSize:17,fontWeight:800}}>{fmt(o.valor)}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{fmt(o.valor/o.unidades)}/UH</div></div>
              <Btn variant="ghost" size="sm" onClick={()=>abrirEditar(o)}>✏️ Editar</Btn>
              <Btn variant="ghost" size="sm">Ver PDF</Btn>
              <button onClick={()=>setConfirm(o.id)} style={{padding:"6px 12px",background:C.danger+"22",border:`1px solid ${C.danger}44`,borderRadius:6,color:C.danger,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🗑</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const FASES=["Projeto executivo","Fundação","Estrutura Steel Frame","Fechamentos","Instalações","Acabamento","Entrega"];
function GestaoObras({obras,setObras}) {
  const [obraId,setObraId]=useState(obras[0]?.id);
  const obra=obras.find(o=>o.id===obraId)||obras[0];
  const avancar=()=>{const i=FASES.indexOf(obra.fase);if(i>=FASES.length-1)return;setObras(p=>p.map(o=>o.id===obra.id?{...o,fase:FASES[i+1],progresso:Math.round(((i+2)/FASES.length)*100)}:o));};
  return (
    <div>
      <h2 style={{fontSize:22,fontWeight:800,marginBottom:6}}>Gestão de Obras</h2>
      <p style={{color:C.muted,fontSize:13,marginBottom:20}}>{obras.length} projetos</p>
      <div style={{display:"flex",gap:10,marginBottom:20}}>
        {obras.map(o=>(
          <button key={o.id} onClick={()=>setObraId(o.id)} style={{padding:"8px 16px",borderRadius:8,border:`1px solid ${obraId===o.id?C.red:C.border}`,background:obraId===o.id?C.red+"18":"transparent",color:obraId===o.id?C.text:C.muted,fontSize:12,fontWeight:obraId===o.id?700:400,cursor:"pointer"}}>{o.nome.split("—")[0].trim()}</button>
        ))}
      </div>
      {obra&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 250px",gap:18}}>
          <div style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:22}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div><div style={{fontSize:15,fontWeight:700}}>{obra.nome}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{obra.cliente} · {obra.prazo}</div></div>
              <Badge label={obra.status} color={statusColor(obra.status)}/>
            </div>
            <div style={{marginBottom:22}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:5}}><span>Progresso</span><span style={{color:C.text,fontWeight:700}}>{obra.progresso}%</span></div>
              <div style={{height:8,background:C.dark,borderRadius:4}}><div style={{height:8,width:`${obra.progresso}%`,background:`linear-gradient(90deg,${C.red},${C.redDark})`,borderRadius:4,transition:"width 0.5s"}}/></div>
            </div>
            {FASES.map((f,i)=>{const idx=FASES.indexOf(obra.fase);const done=f===obra.fase;const past=idx>i;return(
              <div key={f} style={{display:"flex",alignItems:"center",gap:12,marginBottom:11}}>
                <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,background:past?C.success:done?C.red:C.dark,border:`2px solid ${past?C.success:done?C.red:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:700}}>{past?"✓":i+1}</div>
                <span style={{fontSize:13,color:done?C.text:past?C.text:C.muted,fontWeight:done?700:400}}>{f}</span>
                {done&&<Badge label="Atual" color={C.red}/>}
              </div>
            );})}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:18}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:12}}>AÇÃO RÁPIDA</div>
              <Btn onClick={avancar} disabled={obra.fase==="Entrega"} fullWidth>{obra.fase==="Entrega"?"✓ Concluída":"Avançar fase →"}</Btn>
              {obra.fase!=="Entrega"&&<div style={{fontSize:11,color:C.muted,marginTop:8}}>Próxima: {FASES[FASES.indexOf(obra.fase)+1]}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user,        setUser]        = useState(null);
  const [active,      setActive]      = useState("dashboard");
  const [clientes,    setClientes]    = useState(MOCK_CLIENTES);
  const [orcamentos,  setOrcamentos]  = useState(MOCK_ORCAMENTOS);
  const [obras,       setObras]       = useState(MOCK_OBRAS);
  const [financeiro,  setFinanceiro]  = useState(MOCK_FINANCEIRO);

  const handleLogout = async () => { await supabaseMock.signOut(); setUser(null); setActive("dashboard"); };

  const pages = {
    dashboard:  <Dashboard  clientes={clientes} orcamentos={orcamentos} obras={obras} financeiro={financeiro}/>,
    crm:        <CRM        clientes={clientes} setClientes={setClientes}/>,
    orcamentos: <Orcamentos clientes={clientes} orcamentos={orcamentos} setOrcamentos={setOrcamentos}/>,
    obras:      <GestaoObras obras={obras} setObras={setObras}/>,
    financeiro: <Financeiro obras={obras} financeiro={financeiro} setFinanceiro={setFinanceiro}/>,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&family=DM+Sans:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${C.dark};color:${C.text};font-family:'DM Sans',sans-serif;}
        input:focus,select:focus{border-color:${C.red}!important;}
        ::-webkit-scrollbar{width:6px;}
        ::-webkit-scrollbar-track{background:${C.dark};}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px;}
      `}</style>

      {!user ? (
        <LoginScreen onLogin={setUser}/>
      ) : (
        <div style={{display:"flex",minHeight:"100vh"}}>
          <Sidebar active={active} setActive={setActive} user={user} onLogout={handleLogout}/>
          <main style={{flex:1,padding:"34px 38px",overflow:"auto"}}>
            {pages[active]}
          </main>
        </div>
      )}
    </>
  );
}
