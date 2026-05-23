import { useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const _sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

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

// ─── MOCK HISTÓRICO ───────────────────────────────────────────────────────────
const MOCK_HISTORICO = [
  { id:1,  tipo:"cliente",    acao:"criado",    desc:"Cliente Milton Ferreira cadastrado",                usuario:"André", data:"10/04/2025", hora:"09:12" },
  { id:2,  tipo:"orcamento",  acao:"criado",    desc:"Orçamento ORC-2025-031 gerado para Milton Ferreira",usuario:"André", data:"10/04/2025", hora:"09:45" },
  { id:3,  tipo:"contrato",   acao:"criado",    desc:"Contrato CTR-2025-001 criado — Residencial Bofete", usuario:"André", data:"10/04/2025", hora:"10:30" },
  { id:4,  tipo:"financeiro", acao:"receita",   desc:"Entrada de R$ 375.000 registrada — Bofete",         usuario:"André", data:"10/04/2025", hora:"14:00" },
  { id:5,  tipo:"obra",       acao:"fase",      desc:"Obra Bofete avançou para: Projeto executivo",       usuario:"André", data:"12/04/2025", hora:"08:20" },
  { id:6,  tipo:"cliente",    acao:"criado",    desc:"Cliente Pref. de Socorro cadastrado",               usuario:"André", data:"14/02/2025", hora:"10:05" },
  { id:7,  tipo:"financeiro", acao:"despesa",   desc:"Despesa de R$ 310.000 registrada — Socorro",        usuario:"André", data:"20/02/2025", hora:"11:30" },
  { id:8,  tipo:"obra",       acao:"fase",      desc:"Obra Socorro avançou para: Montagem estrutural",    usuario:"André", data:"01/04/2025", hora:"07:55" },
  { id:9,  tipo:"orcamento",  acao:"aprovado",  desc:"Orçamento ORC-2025-019 aprovado pelo cliente",      usuario:"André", data:"20/03/2025", hora:"16:40" },
  { id:10, tipo:"financeiro", acao:"receita",   desc:"Medição 1 de R$ 372.000 recebida — Socorro",        usuario:"André", data:"01/04/2025", hora:"15:10" },
]; = ["Materiais","Mão de obra","Projeto","Transporte","Equipamentos","Administrativo","Outros"];
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
function Financeiro({obras,financeiro,setFinanceiro,registrar}) {
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
    setFinanceiro(prev=>({...prev,[obraId]:{...fin,lancamentos:[...fin.lancamentos,novo]}}));
    registrar("financeiro", novo.tipo==="receita"?"receita":"despesa",
      `${novo.tipo==="receita"?"Receita":"Despesa"} de ${fmt(novo.valor)} registrada — ${obra?.nome?.split("—")[0]?.trim()||""}`);
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
// ─── SUPABASE AUTH REAL ───────────────────────────────────────────────────────
const PERFIL_MAP = {
  "andre@stickframe.com.br":       "diretor",
  "jonathan@stickframe.com.br":    "diretor",
  "vendas@stickframe.com.br":      "comercial",
  "eng@stickframe.com.br":         "engenheiro",
  "financeiro@stickframe.com.br":  "financeiro",
};

const NOME_MAP = {
  "andre@stickframe.com.br":       { nome:"André",         cargo:"Diretor Comercial"   },
  "jonathan@stickframe.com.br":    { nome:"Jonathan",      cargo:"Diretor"             },
  "vendas@stickframe.com.br":      { nome:"Equipe Vendas", cargo:"Consultor"           },
  "eng@stickframe.com.br":         { nome:"Engenheiro",    cargo:"Eng. Civil"          },
  "financeiro@stickframe.com.br":  { nome:"Financeiro",    cargo:"Analista Financeiro" },
};

const supabaseMock = {
  async signIn(email, password) {
    const { data, error } = await _sb.auth.signInWithPassword({ email, password })
    if (error) throw new Error("E-mail ou senha incorretos.")
    const info   = NOME_MAP[email.toLowerCase()] || { nome: email.split("@")[0], cargo: "Usuário" }
    const perfil = PERFIL_MAP[email.toLowerCase()] || "comercial"
    return { user: { email, nome: info.nome, cargo: info.cargo, perfil } }
  },
  async signOut() {
    await _sb.auth.signOut()
  },
};
const PERFIS = {
  diretor: {
    label: "Diretor",
    cor: C.red,
    paginas: ["dashboard","crm","orcamentos","obras","financeiro","contratos","historico"],
  },
  comercial: {
    label: "Comercial",
    cor: C.warning,
    paginas: ["dashboard","crm","orcamentos","contratos"],
  },
  engenheiro: {
    label: "Engenheiro",
    cor: "#4a9eff",
    paginas: ["dashboard","obras","historico"],
  },
  financeiro: {
    label: "Financeiro",
    cor: C.success,
    paginas: ["dashboard","financeiro","contratos","historico"],
  },
};

    await new Promise(r=>setTimeout(r,800));
    const USERS = {
      "andre@stickframe.com.br":     {password:"stick2025",  nome:"André",          cargo:"Diretor Comercial",   perfil:"diretor"   },
      "vendas@stickframe.com.br":    {password:"vendas123",  nome:"Equipe Vendas",  cargo:"Consultor",           perfil:"comercial" },
      "eng@stickframe.com.br":       {password:"eng2025",    nome:"Engenheiro",     cargo:"Eng. Civil",          perfil:"engenheiro"},
      "financeiro@stickframe.com.br":{password:"fin2025",    nome:"Financeiro",     cargo:"Analista Financeiro", perfil:"financeiro"},
      "jonathan@stickframe.com.br":  {password:"jonathan1981",nome:"Jonathan",      cargo:"Diretor",             perfil:"diretor"   },
    };
    const u = USERS[email.toLowerCase()];
    if (!u||u.password!==password) throw new Error("E-mail ou senha incorretos.");
    return {user:{email,nome:u.nome,cargo:u.cargo,perfil:u.perfil}};
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
        {/* Perfis disponíveis */}
        <div style={{background:C.darker,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",marginBottom:22}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:8}}>PERFIS DISPONÍVEIS</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {Object.entries(PERFIS).map(([k,v])=>(
              <span key={k} style={{background:v.cor+"22",color:v.cor,border:`1px solid ${v.cor}44`,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:700}}>{v.label}</span>
            ))}
          </div>
        </div>
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
  {key:"contratos",  label:"Contratos",         icon:"◑"},
  {key:"historico",  label:"Histórico",         icon:"◎"},
];

function Sidebar({active,setActive,user,onLogout}) {
  const [confirm,setConfirm] = useState(false);
  const perfil    = PERFIS[user?.perfil] || PERFIS.diretor;
  const navFiltro = NAV.filter(n => perfil.paginas.includes(n.key));

  // Se a página ativa não está permitida, vai para dashboard
  const paginaAtiva = perfil.paginas.includes(active) ? active : "dashboard";

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
        {navFiltro.map(n=>(
          <button key={n.key} onClick={()=>setActive(n.key)} style={{
            display:"flex",alignItems:"center",gap:12,width:"100%",padding:"11px 20px",
            background:paginaAtiva===n.key?C.red+"18":"transparent",
            borderLeft:`3px solid ${paginaAtiva===n.key?C.red:"transparent"}`,
            border:"none",cursor:"pointer",
            color:paginaAtiva===n.key?C.text:C.muted,
            fontSize:13,fontWeight:paginaAtiva===n.key?600:400,textAlign:"left",transition:"all 0.15s",
          }}>
            <span style={{fontSize:15,color:paginaAtiva===n.key?C.red:C.muted}}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>
      <div style={{padding:"14px 20px",borderTop:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:perfil.cor+"33",border:`2px solid ${perfil.cor}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:perfil.cor,flexShrink:0}}>{user?.nome?.[0]||"U"}</div>
          <div style={{overflow:"hidden",flex:1}}>
            <div style={{fontSize:12,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.nome}</div>
            <div style={{fontSize:10,color:C.muted}}>{user?.cargo}</div>
          </div>
        </div>
        {/* Badge de perfil */}
        <div style={{marginBottom:10}}>
          <span style={{background:perfil.cor+"22",color:perfil.cor,border:`1px solid ${perfil.cor}44`,borderRadius:4,padding:"2px 10px",fontSize:10,fontWeight:700,letterSpacing:0.5}}>
            {perfil.label}
          </span>
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

// ─── GRÁFICOS ─────────────────────────────────────────────────────────────────
function GraficoBarras({data, height=120, showValues=true}) {
  const max = Math.max(...data.map(d=>Math.max(d.rec||0, d.desp||0, d.value||0)), 1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:8,height,paddingTop:8}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
          {d.rec !== undefined ? (
            <div style={{width:"100%",display:"flex",gap:2,alignItems:"flex-end",height:height-20}}>
              <div style={{flex:1,height:`${(d.rec/max)*100}%`,background:C.success,borderRadius:"3px 3px 0 0",minHeight:2,opacity:0.9}}/>
              <div style={{flex:1,height:`${(d.desp/max)*100}%`,background:C.red,borderRadius:"3px 3px 0 0",minHeight:2,opacity:0.9}}/>
            </div>
          ) : (
            <div style={{width:"100%",height:`${(d.value/max)*100}%`,background:d.color||C.red,borderRadius:"3px 3px 0 0",minHeight:2,opacity:0.85,transition:"height 0.4s"}}/>
          )}
          <span style={{fontSize:9,color:C.muted,textAlign:"center",lineHeight:1.2,maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function GraficoLinha({data, height=80, color=C.red}) {
  if (data.length < 2) return null;
  const max  = Math.max(...data.map(d=>d.value), 1);
  const w    = 100, h = height;
  const pts  = data.map((d,i)=>{
    const x = (i/(data.length-1))*w;
    const y = h - (d.value/max)*(h*0.85);
    return `${x},${y}`;
  });
  const area = `M ${pts.join(" L ")} L ${w},${h} L 0,${h} Z`;
  return (
    <div style={{position:"relative",height}}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{width:"100%",height:"100%",overflow:"visible"}} preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={area} fill="url(#lineGrad)"/>
        <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2"/>
        {data.map((d,i)=>{
          const x=(i/(data.length-1))*w;
          const y=h-(d.value/max)*(h*0.85);
          return <circle key={i} cx={x} cy={y} r="3" fill={color}/>;
        })}
      </svg>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
        {data.map((d,i)=>(
          <span key={i} style={{fontSize:9,color:C.muted}}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({clientes,orcamentos,obras,financeiro}) {
  const pipeline  = clientes.reduce((a,c)=>a+(c.valor||0),0);
  const totalRec  = Object.values(financeiro).reduce((a,f)=>a+f.lancamentos.filter(l=>l.tipo==="receita").reduce((b,l)=>b+l.valor,0),0);
  const totalDesp = Object.values(financeiro).reduce((a,f)=>a+f.lancamentos.filter(l=>l.tipo==="despesa").reduce((b,l)=>b+l.valor,0),0);
  const saldo     = totalRec - totalDesp;
  const margem    = totalRec>0 ? ((saldo/totalRec)*100).toFixed(1) : "0.0";

  const kpis = [
    {label:"Pipeline",    value:fmt(pipeline),   sub:`${clientes.length} clientes`,    accent:C.red,     icon:"◈"},
    {label:"Receitas",    value:fmt(totalRec),   sub:"total recebido",                 accent:C.success, icon:"↑"},
    {label:"Despesas",    value:fmt(totalDesp),  sub:"total lançado",                  accent:C.red,     icon:"↓"},
    {label:"Saldo geral", value:fmt(saldo),      sub:"resultado consolidado",          accent:saldo>=0?C.success:C.danger, icon:"="},
    {label:"Margem",      value:`${margem}%`,    sub:"sobre receitas",                 accent:Number(margem)>=20?C.success:C.warning, icon:"%"},
    {label:"Obras ativas",value:String(obras.filter(o=>o.status==="Em andamento").length), sub:"em execução", accent:C.graphite, icon:"◆"},
  ];

  // Dados para gráfico de receita/despesa por obra
  const graficoObras = obras.map(o=>{
    const fin  = financeiro[o.id]||{lancamentos:[]};
    const rec  = fin.lancamentos.filter(l=>l.tipo==="receita").reduce((a,l)=>a+l.valor,0);
    const desp = fin.lancamentos.filter(l=>l.tipo==="despesa").reduce((a,l)=>a+l.valor,0);
    return {label:o.nome.split("—")[0].trim().split(" ")[0]+"..", rec, desp};
  });

  // Pipeline por status
  const statusData = ["Lead","Em negociação","Proposta enviada","Fechado"].map(s=>({
    label: s.split(" ")[0],
    value: clientes.filter(c=>c.status===s).reduce((a,c)=>a+(c.valor||0),0),
    count: clientes.filter(c=>c.status===s).length,
    color: s==="Fechado"?C.success:C.red,
  }));

  // Evolução fictícia dos últimos 6 meses (baseada nos dados reais)
  const evolucao = [
    {label:"Dez", value:totalRec*0.10},
    {label:"Jan", value:totalRec*0.22},
    {label:"Fev", value:totalRec*0.38},
    {label:"Mar", value:totalRec*0.55},
    {label:"Abr", value:totalRec*0.82},
    {label:"Mai", value:totalRec},
  ];

  // Composição de despesas consolidada
  const despCats = CATEGORIAS_DESPESA.map(cat=>{
    const total = Object.values(financeiro).reduce((a,f)=>
      a+f.lancamentos.filter(l=>l.tipo==="despesa"&&l.categoria===cat).reduce((b,l)=>b+l.valor,0),0);
    return {label:cat.split(" ")[0], value:total, color:C.red};
  }).filter(d=>d.value>0);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:24}}>
        <div>
          <h2 style={{fontSize:22,fontWeight:800,marginBottom:2}}>Dashboard</h2>
          <p style={{color:C.muted,fontSize:13}}>Visão consolidada — {new Date().toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</p>
        </div>
        <div style={{fontSize:11,color:C.muted}}>Atualizado agora</div>
      </div>

      {/* KPIs — 6 cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:22}}>
        {kpis.map((k,i)=>(
          <div key={i} style={{background:C.surface,borderRadius:12,padding:"16px 14px",border:`1px solid ${C.border}`,borderTop:`3px solid ${k.accent}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{fontSize:10,color:C.muted,letterSpacing:1}}>{k.label.toUpperCase()}</div>
              <div style={{fontSize:12,color:k.accent,fontWeight:700}}>{k.icon}</div>
            </div>
            <div style={{fontSize:17,fontWeight:800,color:k.accent===C.border?C.text:k.accent}}>{k.value}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:4}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Linha 2: Gráfico receita/despesa + evolução */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>

        {/* Receita vs Despesa por obra */}
        <div style={{background:C.surface,borderRadius:12,padding:20,border:`1px solid ${C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted}}>RECEITA VS DESPESA POR OBRA</div>
            <div style={{display:"flex",gap:12,fontSize:10}}>
              <span style={{display:"flex",alignItems:"center",gap:4,color:C.success}}><span style={{width:8,height:8,background:C.success,borderRadius:2,display:"inline-block"}}/>Receita</span>
              <span style={{display:"flex",alignItems:"center",gap:4,color:C.red}}><span style={{width:8,height:8,background:C.red,borderRadius:2,display:"inline-block"}}/>Despesa</span>
            </div>
          </div>
          <GraficoBarras data={graficoObras} height={130}/>
        </div>

        {/* Evolução de receitas */}
        <div style={{background:C.surface,borderRadius:12,padding:20,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:4}}>EVOLUÇÃO DE RECEITAS</div>
          <div style={{fontSize:18,fontWeight:800,color:C.success,marginBottom:14}}>{fmt(totalRec)}</div>
          <GraficoLinha data={evolucao} height={80} color={C.success}/>
        </div>
      </div>

      {/* Linha 3: Pipeline por status + despesas por categoria + obras */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>

        {/* Pipeline por status */}
        <div style={{background:C.surface,borderRadius:12,padding:20,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:16}}>PIPELINE POR ETAPA</div>
          <GraficoBarras data={statusData} height={90}/>
          <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:8}}>
            {statusData.filter(s=>s.count>0).map(s=>(
              <div key={s.label} style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
                <span style={{color:C.muted}}>{["Lead","Em negociação","Proposta enviada","Fechado"].find(x=>x.startsWith(s.label))||s.label}</span>
                <span style={{fontWeight:700,color:s.color}}>{s.count} · {fmt(s.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Despesas por categoria */}
        <div style={{background:C.surface,borderRadius:12,padding:20,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:16}}>DESPESAS POR CATEGORIA</div>
          {despCats.length>0 ? (
            <>
              <GraficoBarras data={despCats} height={90}/>
              <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:7}}>
                {despCats.slice(0,4).map(d=>(
                  <div key={d.label} style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
                    <span style={{color:C.muted}}>{d.label}</span>
                    <span style={{fontWeight:700,color:C.red}}>{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{textAlign:"center",padding:"20px 0",color:C.muted,fontSize:12}}>Sem despesas</div>
          )}
        </div>

        {/* Obras — progresso */}
        <div style={{background:C.surface,borderRadius:12,padding:20,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:16}}>PROGRESSO DAS OBRAS</div>
          {obras.map(o=>(
            <div key={o.id} style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:600}}>{o.nome.split("—")[0].trim()}</span>
                <span style={{fontSize:11,color:C.muted}}>{o.progresso}%</span>
              </div>
              <div style={{height:6,background:C.dark,borderRadius:3}}>
                <div style={{height:6,width:`${o.progresso}%`,background:o.progresso>50?C.success:C.red,borderRadius:3,transition:"width 0.5s"}}/>
              </div>
              <div style={{fontSize:10,color:C.muted,marginTop:3}}>{o.fase}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CRM({clientes,setClientes,registrar}) {
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
    const novo = {...form,id:Date.now(),valor:0,unidades:0};
    setClientes(p=>[...p, novo]);
    registrar("cliente","criado",`Cliente ${form.nome} cadastrado`);
    setModal(false);
  };
  const salvarEdicao = () => {
    setClientes(p=>p.map(c=>c.id===sel?{...c,...form}:c));
    registrar("cliente","editado",`Cliente ${form.nome} atualizado`);
    setModal(false);
  };
  const deletar = () => {
    registrar("cliente","deletado",`Cliente ${cliente?.nome} removido`);
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

function Orcamentos({clientes,orcamentos,setOrcamentos,registrar}) {
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
    const novo = {id:Date.now(),ref:`ORC-2025-${String(orcamentos.length+32).padStart(3,"0")}`,cliente:clienteSel?.nome||"—",cliente_id:Number(form.cliente_id),valor:calc.valor_total,unidades:Number(form.unidades),area:Number(form.area),padrao:form.padrao,status:"Aguardando resposta",criado:new Date().toLocaleDateString("pt-BR")};
    setOrcamentos(p=>[novo,...p]);
    registrar("orcamento","criado",`Orçamento ${novo.ref} gerado para ${clienteSel?.nome||"—"}`);
    setModal(false);
  };
  const salvarEdicao = () => {
    setOrcamentos(p=>p.map(o=>o.id===editId?{...o,cliente:clienteSel?.nome||o.cliente,cliente_id:Number(form.cliente_id),unidades:Number(form.unidades),area:Number(form.area),padrao:form.padrao,valor:calc.valor_total}:o));
    registrar("orcamento","editado",`Orçamento editado — ${clienteSel?.nome||"—"}`);
    setModal(false);
  };
  const deletar = (id) => {
    const o = orcamentos.find(x=>x.id===id);
    registrar("orcamento","deletado",`Orçamento ${o?.ref||""} removido`);
    setOrcamentos(p=>p.filter(o=>o.id!==id));
    setConfirm(null);
  };

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

const MOCK_ARQUIVOS = {
  1: [
    { id:1, nome:"Planta_baixa_tipo.pdf",     tipo:"pdf",   tamanho:"2.4 MB", data:"10/04/2025", categoria:"Projeto"    },
    { id:2, nome:"Projeto_estrutural.pdf",    tipo:"pdf",   tamanho:"5.1 MB", data:"12/04/2025", categoria:"Projeto"    },
    { id:3, nome:"Foto_fundacao_01.jpg",      tipo:"imagem",tamanho:"3.2 MB", data:"20/04/2025", categoria:"Foto"       },
  ],
  2: [
    { id:1, nome:"Contrato_assinado.pdf",     tipo:"pdf",   tamanho:"1.1 MB", data:"15/02/2025", categoria:"Documento"  },
    { id:2, nome:"Cronograma_fisico.xlsx",    tipo:"outro", tamanho:"0.4 MB", data:"16/02/2025", categoria:"Documento"  },
    { id:3, nome:"Foto_estrutura_pronta.jpg", tipo:"imagem",tamanho:"4.8 MB", data:"05/04/2025", categoria:"Foto"       },
    { id:4, nome:"ART_responsavel.pdf",       tipo:"pdf",   tamanho:"0.8 MB", data:"15/02/2025", categoria:"Documento"  },
  ],
  3: [],
};

const ICONE_TIPO = { pdf:"📄", imagem:"🖼️", outro:"📎" };
const CATS = ["Projeto","Foto","Documento","Outro"];

function GestaoObras({obras,setObras,registrar}) {
  const [obraId,   setObraId]   = useState(obras[0]?.id);
  const [arquivos, setArquivos] = useState(MOCK_ARQUIVOS);
  const [dragOver, setDragOver] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("fases"); // "fases" | "arquivos"
  const [catFiltro,setCatFiltro]= useState("Todos");
  const fileRef = useState(null);

  const obra      = obras.find(o=>o.id===obraId)||obras[0];
  const arqObra   = arquivos[obraId]||[];
  const arqFiltro = catFiltro==="Todos" ? arqObra : arqObra.filter(a=>a.categoria===catFiltro);

  const avancar=()=>{
    const i=FASES.indexOf(obra.fase);
    if(i>=FASES.length-1)return;
    const novaFase=FASES[i+1];
    setObras(p=>p.map(o=>o.id===obra.id?{...o,fase:novaFase,progresso:Math.round(((i+2)/FASES.length)*100)}:o));
    registrar("obra","fase",`Obra ${obra.nome.split("—")[0].trim()} avançou para: ${novaFase}`);
  };

  const adicionarArquivos = (files) => {
    const novos = Array.from(files).map(f=>({
      id: Date.now() + Math.random(),
      nome: f.name,
      tipo: f.type.startsWith("image/")?"imagem": f.name.endsWith(".pdf")?"pdf":"outro",
      tamanho: (f.size/1024/1024).toFixed(1)+" MB",
      data: new Date().toLocaleDateString("pt-BR"),
      categoria: f.name.endsWith(".pdf")?"Documento":"Foto",
    }));
    setArquivos(prev=>({...prev,[obraId]:[...novos,...(prev[obraId]||[])]}));
    registrar("obra","editado",`${novos.length} arquivo(s) adicionado(s) em ${obra?.nome?.split("—")[0]?.trim()}`);
  };

  const remover = (arqId) => {
    setArquivos(prev=>({...prev,[obraId]:prev[obraId].filter(a=>a.id!==arqId)}));
  };

  return (
    <div>
      <h2 style={{fontSize:22,fontWeight:800,marginBottom:6}}>Gestão de Obras</h2>
      <p style={{color:C.muted,fontSize:13,marginBottom:20}}>{obras.length} projetos</p>

      {/* Seletor de obra */}
      <div style={{display:"flex",gap:10,marginBottom:20}}>
        {obras.map(o=>(
          <button key={o.id} onClick={()=>setObraId(o.id)} style={{padding:"8px 16px",borderRadius:8,border:`1px solid ${obraId===o.id?C.red:C.border}`,background:obraId===o.id?C.red+"18":"transparent",color:obraId===o.id?C.text:C.muted,fontSize:12,fontWeight:obraId===o.id?700:400,cursor:"pointer"}}>{o.nome.split("—")[0].trim()}</button>
        ))}
      </div>

      {obra&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 260px",gap:18}}>
          {/* Coluna principal */}
          <div>
            {/* Abas Fases / Arquivos */}
            <div style={{display:"flex",gap:0,marginBottom:0,borderBottom:`1px solid ${C.border}`}}>
              {[["fases","📋 Fases da obra"],["arquivos","📁 Arquivos"]].map(([k,l])=>(
                <button key={k} onClick={()=>setAbaAtiva(k)} style={{
                  padding:"10px 20px",background:"transparent",border:"none",
                  borderBottom:`2px solid ${abaAtiva===k?C.red:"transparent"}`,
                  color:abaAtiva===k?C.text:C.muted,fontSize:13,
                  fontWeight:abaAtiva===k?700:400,cursor:"pointer",fontFamily:"inherit",
                  transition:"all 0.15s",
                }}>{l}</button>
              ))}
            </div>

            {/* ABA FASES */}
            {abaAtiva==="fases"&&(
              <div style={{background:C.surface,borderRadius:"0 0 12px 12px",border:`1px solid ${C.border}`,borderTop:"none",padding:22}}>
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
            )}

            {/* ABA ARQUIVOS */}
            {abaAtiva==="arquivos"&&(
              <div style={{background:C.surface,borderRadius:"0 0 12px 12px",border:`1px solid ${C.border}`,borderTop:"none",padding:22}}>

                {/* Drop zone */}
                <label style={{
                  display:"block",
                  border:`2px dashed ${dragOver?C.red:C.border}`,
                  borderRadius:10, padding:"24px 20px", textAlign:"center",
                  cursor:"pointer", marginBottom:18,
                  background: dragOver?C.red+"0a":C.darker,
                  transition:"all 0.2s",
                }}
                  onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                  onDragLeave={()=>setDragOver(false)}
                  onDrop={e=>{e.preventDefault();setDragOver(false);adicionarArquivos(e.dataTransfer.files);}}>
                  <input type="file" multiple style={{display:"none"}} onChange={e=>adicionarArquivos(e.target.files)}/>
                  <div style={{fontSize:28,marginBottom:8}}>📁</div>
                  <div style={{fontSize:13,fontWeight:700,color:dragOver?C.red:C.text,marginBottom:4}}>
                    {dragOver?"Solte os arquivos aqui":"Arraste arquivos ou clique para enviar"}
                  </div>
                  <div style={{fontSize:11,color:C.muted}}>PDF, imagens, planilhas — qualquer formato</div>
                </label>

                {/* Filtro por categoria */}
                <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                  {["Todos",...CATS].map(c=>(
                    <button key={c} onClick={()=>setCatFiltro(c)} style={{
                      padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:catFiltro===c?700:400,
                      border:`1px solid ${catFiltro===c?C.red:C.border}`,
                      background:catFiltro===c?C.red+"18":"transparent",
                      color:catFiltro===c?C.text:C.muted,cursor:"pointer",fontFamily:"inherit",
                    }}>{c}</button>
                  ))}
                  <span style={{marginLeft:"auto",fontSize:11,color:C.muted,alignSelf:"center"}}>{arqFiltro.length} arquivo(s)</span>
                </div>

                {/* Lista de arquivos */}
                {arqFiltro.length===0?(
                  <div style={{textAlign:"center",padding:"24px 0",color:C.muted,fontSize:13}}>
                    {arqObra.length===0?"Nenhum arquivo enviado ainda.":"Nenhum arquivo nesta categoria."}
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {arqFiltro.map(a=>(
                      <div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:C.darker,borderRadius:8,border:`1px solid ${C.border}`}}>
                        <span style={{fontSize:22,flexShrink:0}}>{ICONE_TIPO[a.tipo]||"📎"}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.nome}</div>
                          <div style={{fontSize:11,color:C.muted,marginTop:2}}>{a.categoria} · {a.tamanho} · {a.data}</div>
                        </div>
                        <button onClick={()=>remover(a.id)} style={{background:C.danger+"22",border:`1px solid ${C.danger}44`,borderRadius:6,color:C.danger,fontSize:11,fontWeight:700,cursor:"pointer",padding:"4px 10px",fontFamily:"inherit",flexShrink:0}}>🗑</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Coluna lateral */}
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:18}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:12}}>AÇÃO RÁPIDA</div>
              <Btn onClick={avancar} disabled={obra.fase==="Entrega"} fullWidth>{obra.fase==="Entrega"?"✓ Concluída":"Avançar fase →"}</Btn>
              {obra.fase!=="Entrega"&&<div style={{fontSize:11,color:C.muted,marginTop:8}}>Próxima: {FASES[FASES.indexOf(obra.fase)+1]}</div>}
            </div>
            <div style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:18}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:14}}>RESUMO</div>
              {[["Fase",obra.fase],["Prazo",obra.prazo],["Concluído",`${obra.progresso}%`],["Arquivos",`${arqObra.length} arquivo(s)`]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`,paddingBottom:9,marginBottom:9}}>
                  <span style={{fontSize:12,color:C.muted}}>{k}</span>
                  <span style={{fontSize:12,fontWeight:600}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MÓDULO CONTRATOS ────────────────────────────────────────────────────────
const MOCK_CONTRATOS = [
  { id:1, ref:"CTR-2025-001", cliente:"Milton Ferreira",        obra:"Residencial Bofete — 25 UH", valor:1250000, unidades:25, area:48, padrao:"Padrão",      prazo:"Dez/2025", status:"Assinado",    data:"10/04/2025" },
  { id:2, ref:"CTR-2025-002", cliente:"Pref. de Socorro",       obra:"Conjunto Socorro — 18 UH",   valor:930000,  unidades:18, area:50, padrao:"Econômico",   prazo:"Jun/2025", status:"Em execução",  data:"15/02/2025" },
  { id:3, ref:"CTR-2025-003", cliente:"Construtora Alphaville", obra:"Alphaville Offices",          valor:480000,  unidades:8,  area:72, padrao:"Alto Padrão", prazo:"—",        status:"Aguardando",   data:"28/04/2025" },
];

function gerarContratoPDF(contrato) {
  const hoje = new Date().toLocaleDateString("pt-BR");
  const fmt  = v => "R$ " + Number(v).toLocaleString("pt-BR", {minimumFractionDigits:0});
  const v30  = fmt(contrato.valor * 0.30);
  const v40  = fmt(contrato.valor * 0.40);
  const v30f = fmt(contrato.valor * 0.30);

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Contrato ${contrato.ref}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;color:#222;font-size:12px;padding:0;background:#fff;}
  .header{background:#414141;padding:22px 36px 18px;display:flex;justify-content:space-between;align-items:center;}
  .logo-row{display:flex;align-items:center;gap:12px;}
  .logo-box{width:40px;height:40px;background:linear-gradient(135deg,#414141 50%,#981915 50%);border-radius:8px;border:1.5px solid #fff;}
  .logo-name{font-size:20px;font-weight:800;letter-spacing:3px;}
  .logo-name .g{color:#888;} .logo-name .r{color:#981915;}
  .logo-sub{font-size:8px;color:#666;letter-spacing:2px;margin-top:2px;}
  .header-right{text-align:right;color:#aaa;font-size:11px;}
  .header-right strong{color:#fff;font-size:13px;display:block;margin-bottom:2px;}
  .red-bar{height:4px;background:#981915;}
  .body{padding:32px 36px;}
  .titulo{font-size:22px;font-weight:800;color:#414141;margin-bottom:4px;}
  .subtitulo{font-size:12px;color:#888;margin-bottom:28px;}
  h3{font-size:9px;font-weight:700;letter-spacing:1.5px;color:#981915;text-transform:uppercase;margin:24px 0 10px;border-bottom:1px solid #eee;padding-bottom:6px;}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:0;}
  .field{padding:9px 14px;border:1px solid #eee;font-size:11px;}
  .field:nth-child(even){background:#f9f9f9;}
  .field-label{font-size:9px;color:#888;margin-bottom:3px;text-transform:uppercase;letter-spacing:0.5px;}
  .field-val{font-weight:600;color:#222;}
  .clausula{margin-bottom:14px;line-height:1.7;font-size:11.5px;color:#333;}
  .clausula strong{color:#222;}
  .valor-box{background:#f7f7f7;border:1px solid #ddd;border-radius:8px;padding:16px 20px;margin:12px 0;}
  .valor-total{font-size:22px;font-weight:800;color:#981915;}
  .pgto-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px;}
  .pgto-item{background:#fff;border:1px solid #ddd;border-radius:6px;padding:12px;text-align:center;}
  .pgto-pct{font-size:18px;font-weight:800;color:#981915;margin-bottom:4px;}
  .pgto-desc{font-size:9px;color:#888;margin-bottom:6px;}
  .pgto-val{font-size:12px;font-weight:700;color:#222;}
  .assin-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:50px;}
  .assin-box{text-align:center;}
  .assin-line{border-top:1px solid #999;margin-bottom:8px;margin-top:50px;}
  .assin-nome{font-size:11px;font-weight:700;color:#222;}
  .assin-cargo{font-size:10px;color:#888;}
  .footer{margin-top:40px;padding-top:12px;border-top:1px solid #eee;display:flex;justify-content:space-between;font-size:9px;color:#aaa;}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style>
</head>
<body>
<div class="header">
  <div class="logo-row">
    <div class="logo-box"></div>
    <div><div class="logo-name"><span class="g">STICK</span><span class="r">FRAME</span></div><div class="logo-sub">SISTEMAS CONSTRUTIVOS</div></div>
  </div>
  <div class="header-right">
    <strong>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</strong>
    ${contrato.ref} &nbsp;|&nbsp; ${contrato.data}
  </div>
</div>
<div class="red-bar"></div>
<div class="body">

<div class="titulo">Contrato de Prestação de Serviços</div>
<div class="subtitulo">Sistema Construtivo Steel Frame — ${contrato.obra}</div>

<h3>Partes Contratantes</h3>
<div class="grid2">
  <div class="field"><div class="field-label">Contratada</div><div class="field-val">Stick Frame Sistemas Construtivos Ltda.</div></div>
  <div class="field"><div class="field-label">CNPJ</div><div class="field-val">XX.XXX.XXX/0001-XX</div></div>
  <div class="field"><div class="field-label">Endereço</div><div class="field-val">Santo André / SP</div></div>
  <div class="field"><div class="field-label">Representante</div><div class="field-val">André Queiroz Candido</div></div>
  <div class="field"><div class="field-label">Contratante</div><div class="field-val">${contrato.cliente}</div></div>
  <div class="field"><div class="field-label">Data do contrato</div><div class="field-val">${contrato.data}</div></div>
</div>

<h3>Objeto do Contrato</h3>
<div class="clausula">
  <strong>Cláusula 1ª.</strong> O presente contrato tem por objeto a prestação de serviços de construção de <strong>${contrato.unidades} unidades habitacionais</strong> pelo sistema construtivo <strong>Steel Frame</strong>, com área de <strong>${contrato.area} m² por unidade</strong> (área total: <strong>${contrato.unidades * contrato.area} m²</strong>), padrão <strong>${contrato.padrao}</strong>, conforme especificações técnicas do projeto executivo, a ser executado no empreendimento <strong>${contrato.obra}</strong>.
</div>

<h3>Valor e Condições de Pagamento</h3>
<div class="valor-box">
  <div style="font-size:10px;color:#888;margin-bottom:4px;">VALOR TOTAL DO CONTRATO</div>
  <div class="valor-total">${fmt(contrato.valor)}</div>
  <div style="font-size:10px;color:#888;margin-top:4px;">${fmt(contrato.valor / contrato.unidades)} por unidade · ${fmt(contrato.valor / (contrato.unidades * contrato.area))} por m²</div>
</div>
<div class="pgto-grid">
  <div class="pgto-item"><div class="pgto-pct">30%</div><div class="pgto-desc">Na assinatura do contrato</div><div class="pgto-val">${v30}</div></div>
  <div class="pgto-item"><div class="pgto-pct">40%</div><div class="pgto-desc">Na conclusão da estrutura</div><div class="pgto-val">${v40}</div></div>
  <div class="pgto-item"><div class="pgto-pct">30%</div><div class="pgto-desc">Na entrega da obra</div><div class="pgto-val">${v30f}</div></div>
</div>

<h3>Prazo de Execução</h3>
<div class="clausula">
  <strong>Cláusula 3ª.</strong> O prazo de execução é de <strong>${contrato.prazo !== "—" ? contrato.prazo : "a definir conforme cronograma"}</strong>, contado a partir da emissão da Ordem de Serviço e do recebimento do primeiro pagamento. O prazo poderá ser prorrogado mediante aditivo contratual em caso de situações excepcionais devidamente justificadas.
</div>

<h3>Obrigações da Contratada</h3>
<div class="clausula">
  <strong>Cláusula 4ª.</strong> Compete à Stick Frame: (a) fornecer todos os materiais e mão de obra necessários à execução da obra; (b) elaborar e fornecer o projeto executivo completo; (c) garantir a qualidade dos serviços conforme normas ABNT NBR 15575 e NBR 6118; (d) apresentar ART/RRT do responsável técnico; (e) manter o canteiro organizado e seguro; (f) fornecer garantia estrutural de <strong>10 anos</strong>.
</div>

<h3>Obrigações do Contratante</h3>
<div class="clausula">
  <strong>Cláusula 5ª.</strong> Compete ao Contratante: (a) efetuar os pagamentos nas datas acordadas; (b) disponibilizar o terreno livre e desembaraçado para início das obras; (c) obter as licenças e alvarás necessários; (d) garantir acesso ao local da obra; (e) não interferir na execução técnica dos serviços.
</div>

<h3>Rescisão</h3>
<div class="clausula">
  <strong>Cláusula 6ª.</strong> O contrato poderá ser rescindido por qualquer das partes mediante notificação por escrito com antecedência mínima de 30 dias, devendo ser quitados todos os valores relativos aos serviços já executados até a data da rescisão.
</div>

<h3>Foro</h3>
<div class="clausula">
  <strong>Cláusula 7ª.</strong> Fica eleito o foro da Comarca de Santo André/SP para dirimir quaisquer dúvidas ou litígios oriundos do presente contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
</div>

<div class="assin-grid">
  <div class="assin-box">
    <div class="assin-line"></div>
    <div class="assin-nome">Stick Frame Sistemas Construtivos Ltda.</div>
    <div class="assin-cargo">Contratada — André Queiroz Candido</div>
  </div>
  <div class="assin-box">
    <div class="assin-line"></div>
    <div class="assin-nome">${contrato.cliente}</div>
    <div class="assin-cargo">Contratante</div>
  </div>
</div>

<div class="footer">
  <div>Santo André, ${hoje} &nbsp;|&nbsp; ${contrato.ref}</div>
  <div>Stick Frame Sistemas Construtivos Ltda. — Documento confidencial</div>
</div>

</div>
</body>
</html>`;

  const blob = new Blob([html], {type:"text/html"});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `Contrato_${contrato.ref}_${contrato.cliente.replace(/\s/g,"_")}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function Contratos({clientes, registrar}) {
  const [contratos, setContratos] = useState(MOCK_CONTRATOS);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState({cliente_id: clientes[0]?.id||"", obra:"", valor:"", unidades:1, area:48, padrao:"Padrão", prazo:""});
  const set = k => v => setForm(f=>({...f,[k]:v}));
  const clienteSel = clientes.find(c=>c.id===Number(form.cliente_id));

  const statusColor2 = s => {
    if (s==="Assinado"||s==="Em execução") return C.success;
    if (s==="Aguardando") return C.warning;
    return C.muted;
  };

  const salvar = () => {
    const novo = {
      id: Date.now(),
      ref: `CTR-2025-${String(contratos.length+4).padStart(3,"0")}`,
      cliente: clienteSel?.nome||"—",
      obra: form.obra||clienteSel?.nome||"—",
      valor: Number(form.valor),
      unidades: Number(form.unidades),
      area: Number(form.area),
      padrao: form.padrao,
      prazo: form.prazo||"—",
      status: "Aguardando",
      data: new Date().toLocaleDateString("pt-BR"),
    };
    setContratos(p=>[novo,...p]);
    registrar("contrato","criado",`Contrato ${novo.ref} criado para ${clienteSel?.nome||"—"}`);
    setModal(false);
  };

  return (
    <>
      {modal && (
        <Modal title="Novo contrato" onClose={()=>setModal(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:6}}>CLIENTE</div>
              <Select value={form.cliente_id} onChange={set("cliente_id")} options={clientes.map(c=>({value:c.id,label:c.nome}))}/>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:6}}>NOME DA OBRA</div>
              <Input value={form.obra} onChange={set("obra")} placeholder="Ex: Residencial Vista Verde — 10 UH"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:6}}>VALOR TOTAL (R$)</div><Input type="number" value={form.valor} onChange={set("valor")} placeholder="Ex: 500000"/></div>
              <div><div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:6}}>UNIDADES</div><Input type="number" value={form.unidades} onChange={set("unidades")}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:6}}>ÁREA/UH (m²)</div><Input type="number" value={form.area} onChange={set("area")}/></div>
              <div><div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:6}}>PRAZO</div><Input value={form.prazo} onChange={set("prazo")} placeholder="Ex: Dez/2025"/></div>
            </div>
            <div><div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:C.muted,marginBottom:6}}>PADRÃO</div>
              <Select value={form.padrao} onChange={set("padrao")} options={["Econômico","Padrão","Alto Padrão"].map(v=>({value:v,label:v}))}/>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:6}}>
              <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
              <Btn disabled={!form.valor||!clienteSel} onClick={salvar}>Criar contrato</Btn>
            </div>
          </div>
        </Modal>
      )}

      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div>
            <h2 style={{fontSize:22,fontWeight:800}}>Contratos</h2>
            <p style={{color:C.muted,fontSize:13,marginTop:4}}>{contratos.length} contratos cadastrados</p>
          </div>
          <Btn onClick={()=>setModal(true)}>+ Novo contrato</Btn>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {contratos.map(c=>(
            <div key={c.id} style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:"18px 22px"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:16}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6}}>
                    <span style={{fontSize:11,color:C.red,fontWeight:700,letterSpacing:1}}>{c.ref}</span>
                    <Badge label={c.status} color={statusColor2(c.status)}/>
                    <span style={{fontSize:11,color:C.muted}}>· {c.data}</span>
                  </div>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:2}}>{c.cliente}</div>
                  <div style={{fontSize:12,color:C.muted}}>{c.obra}</div>
                  <div style={{display:"flex",gap:20,marginTop:10}}>
                    {[
                      ["Unidades", `${c.unidades} UH`],
                      ["Área/UH",  `${c.area} m²`],
                      ["Padrão",   c.padrao],
                      ["Prazo",    c.prazo],
                    ].map(([k,v])=>(
                      <div key={k}>
                        <div style={{fontSize:10,color:C.muted,marginBottom:2}}>{k}</div>
                        <div style={{fontSize:12,fontWeight:600}}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:20,fontWeight:800,color:C.text}}>{fmt(c.valor)}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2,marginBottom:16}}>{fmt(c.valor/c.unidades)}/UH</div>
                  <button onClick={()=>gerarContratoPDF(c)} style={{
                    padding:"9px 16px",background:C.red,border:"none",borderRadius:6,
                    color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                    display:"block",width:"100%",marginBottom:8,
                  }}>📄 Gerar Contrato</button>
                  <Btn variant="ghost" size="sm" fullWidth>✏️ Editar</Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── MÓDULO HISTÓRICO ────────────────────────────────────────────────────────
const TIPO_CONFIG = {
  cliente:    { cor: C.success,  icone: "◈", label: "Cliente"    },
  orcamento:  { cor: C.red,      icone: "◻", label: "Orçamento"  },
  contrato:   { cor: C.warning,  icone: "◑", label: "Contrato"   },
  financeiro: { cor: "#4a9eff",  icone: "◉", label: "Financeiro" },
  obra:       { cor: C.graphite, icone: "◆", label: "Obra"       },
};

const ACAO_CONFIG = {
  criado:   { cor: C.success, label: "Criado"   },
  editado:  { cor: C.warning, label: "Editado"  },
  deletado: { cor: C.danger,  label: "Deletado" },
  receita:  { cor: C.success, label: "Receita"  },
  despesa:  { cor: C.red,     label: "Despesa"  },
  fase:     { cor: "#4a9eff", label: "Fase"     },
  aprovado: { cor: C.success, label: "Aprovado" },
};

function Historico({ historico }) {
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busca, setBusca]           = useState("");

  const itens = historico
    .filter(h => filtroTipo === "todos" || h.tipo === filtroTipo)
    .filter(h => !busca || h.desc.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => b.id - a.id);

  const tipos = ["todos", "cliente", "orcamento", "contrato", "financeiro", "obra"];

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Histórico de Atividades</h2>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 22 }}>{historico.length} registros no sistema</p>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar no histórico..."
            style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {tipos.map(t => (
            <button key={t} onClick={() => setFiltroTipo(t)} style={{
              padding: "8px 14px", borderRadius: 8, border: `1px solid ${filtroTipo === t ? (TIPO_CONFIG[t]?.cor || C.red) : C.border}`,
              background: filtroTipo === t ? (TIPO_CONFIG[t]?.cor || C.red) + "18" : "transparent",
              color: filtroTipo === t ? (TIPO_CONFIG[t]?.cor || C.text) : C.muted,
              fontSize: 12, fontWeight: filtroTipo === t ? 700 : 400, cursor: "pointer", fontFamily: "inherit",
              textTransform: "capitalize",
            }}>
              {t === "todos" ? "Todos" : TIPO_CONFIG[t]?.label || t}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {itens.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: C.muted, fontSize: 13 }}>Nenhuma atividade encontrada.</div>
        ) : (
          itens.map((h, i) => {
            const tc = TIPO_CONFIG[h.tipo] || { cor: C.muted, icone: "●", label: h.tipo };
            const ac = ACAO_CONFIG[h.acao] || { cor: C.muted, label: h.acao };
            return (
              <div key={h.id} style={{
                display: "flex", alignItems: "flex-start", gap: 16,
                padding: "14px 20px",
                borderBottom: i < itens.length - 1 ? `1px solid ${C.border}` : "none",
                transition: "background 0.15s",
              }}>
                {/* Ícone do tipo */}
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: tc.cor + "22", border: `2px solid ${tc.cor}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, color: tc.cor, marginTop: 2,
                }}>{tc.icone}</div>

                {/* Conteúdo */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ background: tc.cor + "22", color: tc.cor, border: `1px solid ${tc.cor}44`, borderRadius: 4, padding: "1px 8px", fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>{tc.label}</span>
                    <span style={{ background: ac.cor + "22", color: ac.cor, border: `1px solid ${ac.cor}44`, borderRadius: 4, padding: "1px 8px", fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>{ac.label}</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginBottom: 3 }}>{h.desc}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    Por <strong style={{ color: C.text }}>{h.usuario}</strong> · {h.data} às {h.hora}
                  </div>
                </div>

                {/* Data destaque */}
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: C.muted }}>{h.data}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{h.hora}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Legenda */}
      <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
        {Object.entries(TIPO_CONFIG).map(([k, v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: v.cor }} />
            {v.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SISTEMA DE NOTIFICAÇÕES ──────────────────────────────────────────────────
function calcAlerta(obra) {
  // Prazo formato "Mes/AAAA" ex: "Jun/2025"
  const MESES = {Jan:0,Fev:1,Mar:2,Abr:3,Mai:4,Jun:5,Jul:6,Ago:7,Set:8,Out:9,Nov:10,Dez:11};
  if (!obra.prazo || obra.prazo === "—") return null;
  const [mesStr, ano] = obra.prazo.split("/");
  const mes = MESES[mesStr];
  if (mes === undefined || !ano) return null;
  const prazoDate = new Date(Number(ano), mes, 1);
  const hoje = new Date();
  const diffMs = prazoDate - hoje;
  const diffDias = Math.ceil(diffMs / (1000*60*60*24));
  if (obra.status === "Pausada" || obra.progresso === 100) return null;
  if (diffDias < 0)   return { tipo:"atrasada", texto:`${obra.nome.split("—")[0].trim()} está ATRASADA (${obra.prazo})`, cor:C.danger };
  if (diffDias <= 30) return { tipo:"urgente",  texto:`${obra.nome.split("—")[0].trim()} — prazo em ${diffDias} dias (${obra.prazo})`, cor:C.warning };
  if (diffDias <= 90) return { tipo:"atencao",  texto:`${obra.nome.split("—")[0].trim()} — prazo em ${Math.ceil(diffDias/30)} meses (${obra.prazo})`, cor:C.red };
  return null;
}

function Notificacoes({obras}) {
  const [aberto, setAberto] = useState(false);
  const alertas = obras.map(calcAlerta).filter(Boolean);
  const count   = alertas.length;

  return (
    <div style={{position:"relative"}}>
      <button onClick={()=>setAberto(v=>!v)} style={{
        position:"relative", background:"none", border:`1px solid ${count>0?C.warning:C.border}`,
        borderRadius:8, padding:"8px 12px", cursor:"pointer", color:count>0?C.warning:C.muted,
        fontSize:16, display:"flex", alignItems:"center", gap:6, fontFamily:"inherit",
        transition:"all 0.2s",
      }}>
        🔔
        {count>0 && (
          <span style={{
            position:"absolute", top:-6, right:-6,
            background:C.danger, color:"#fff",
            borderRadius:"50%", width:18, height:18,
            fontSize:10, fontWeight:800,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>{count}</span>
        )}
      </button>

      {aberto && (
        <>
          <div style={{position:"fixed",inset:0,zIndex:98}} onClick={()=>setAberto(false)}/>
          <div style={{
            position:"absolute", top:"calc(100% + 8px)", right:0,
            width:340, background:C.surface, border:`1px solid ${C.border}`,
            borderRadius:12, zIndex:99, boxShadow:"0 8px 32px #00000055",
            overflow:"hidden",
          }}>
            <div style={{padding:"14px 18px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <span style={{fontSize:13, fontWeight:700}}>Alertas de prazo</span>
              <span style={{fontSize:11, color:C.muted}}>{count} {count===1?"alerta":"alertas"}</span>
            </div>
            {count===0 ? (
              <div style={{padding:"24px 18px", textAlign:"center", color:C.muted, fontSize:13}}>
                ✅ Nenhum prazo crítico no momento.
              </div>
            ) : (
              alertas.map((a,i)=>(
                <div key={i} style={{
                  padding:"12px 18px", borderBottom:`1px solid ${C.border}`,
                  borderLeft:`3px solid ${a.cor}`,
                  background: a.cor + "0a",
                }}>
                  <div style={{fontSize:12, fontWeight:700, color:a.cor, marginBottom:3}}>
                    {a.tipo==="atrasada"?"⛔ ATRASADA":a.tipo==="urgente"?"⚠️ URGENTE":"🔶 ATENÇÃO"}
                  </div>
                  <div style={{fontSize:12, color:C.text}}>{a.texto}</div>
                </div>
              ))
            )}
            <div style={{padding:"10px 18px", background:C.darker}}>
              <span style={{fontSize:11, color:C.muted}}>Atualizado agora</span>
            </div>
          </div>
        </>
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
  const [historico,   setHistorico]   = useState(MOCK_HISTORICO);

  const registrar = useCallback((tipo, acao, desc) => {
    const agora = new Date();
    setHistorico(prev => [{
      id: Date.now(),
      tipo, acao, desc,
      usuario: "André",
      data: agora.toLocaleDateString("pt-BR"),
      hora: agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    }, ...prev]);
  }, []);

  const handleLogout = async () => { await supabaseMock.signOut(); setUser(null); setActive("dashboard"); };

  const pages = {
    dashboard:  <Dashboard  clientes={clientes} orcamentos={orcamentos} obras={obras} financeiro={financeiro}/>,
    crm:        <CRM        clientes={clientes} setClientes={setClientes} registrar={registrar}/>,
    orcamentos: <Orcamentos clientes={clientes} orcamentos={orcamentos} setOrcamentos={setOrcamentos} registrar={registrar}/>,
    obras:      <GestaoObras obras={obras} setObras={setObras} registrar={registrar}/>,
    financeiro: <Financeiro obras={obras} financeiro={financeiro} setFinanceiro={setFinanceiro} registrar={registrar}/>,
    contratos:  <Contratos  clientes={clientes} registrar={registrar}/>,
    historico:  <Historico  historico={historico}/>,
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
          <div style={{flex:1,display:"flex",flexDirection:"column"}}>
            {/* TOPBAR */}
            <div style={{
              padding:"12px 38px", borderBottom:`1px solid ${C.border}`,
              display:"flex", justifyContent:"flex-end", alignItems:"center",
              background:C.darker, gap:12,
            }}>
              <Notificacoes obras={obras}/>
            </div>
            <main style={{flex:1,padding:"34px 38px",overflow:"auto"}}>
              {pages[active]}
            </main>
          </div>
        </div>
      )}
    </>
  );
}
