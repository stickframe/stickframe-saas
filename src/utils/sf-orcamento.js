//  STICK FRAME · Orçamento SF · Dados + Engine de cálculo 
// ES module — named exports

export var SF_COMP = [
  { id:'par-ext',  nome:'Parede Externa',      tipo:'parede', esp:400, pExt:{tipo:'EXT',lados:1},  pInt:{tipo:'ST',lados:1},       mem:true,  iso:false },
  { id:'par-int',  nome:'Parede Interna',       tipo:'parede', esp:400, pExt:null,                  pInt:{tipo:'ST',lados:2},       mem:false, iso:false },
  { id:'par-ac',   nome:'Parede Acústica',      tipo:'parede', esp:400, pExt:null,                  pInt:{tipo:'ST',lados:2},       mem:false, iso:true  },
  { id:'par-ru',   nome:'Área Úmida (RU)',      tipo:'parede', esp:400, pExt:null,                  pInt:{tipo:'RU',lados:2},       mem:true,  iso:false },
  { id:'par-rf',   nome:'Corta-fogo (RF)',      tipo:'parede', esp:400, pExt:null,                  pInt:{tipo:'RF',lados:2},       mem:false, iso:false },
  { id:'par-pf',   nome:'Parede Performa',      tipo:'parede', esp:400, pExt:null,                  pInt:{tipo:'PERFORMA',lados:2}, mem:false, iso:true  },
  { id:'for-st',   nome:'Forro ST',             tipo:'forro',  esp:600, pExt:null,                  pInt:{tipo:'ST',lados:1},       mem:false, iso:false },
  { id:'for-ru',   nome:'Forro RU',             tipo:'forro',  esp:600, pExt:null,                  pInt:{tipo:'RU',lados:1},       mem:false, iso:false },
  { id:'for-leve', nome:'Forro Leve',           tipo:'forro',  esp:600, pExt:null,                  pInt:{tipo:'LEVE',lados:1},     mem:false, iso:false },
];

export var SF_PRECOS = {
  guia:57, mont:62,
  placa_ext:118, placa_st:42, placa_ru:58, placa_rf:64, placa_performa:84, placa_leve:48,
  membrana:320, iso:180,
  massa:141, fita_t10:22, parafusos:78, buchas:32, fita_anti:45,
  mao_obra:130,
};

export var SF_LABELS = {
  guia:'Guias 90mm (barra 3m)', mont:'Montantes 90mm (barra 3m)',
  placa_ext:'Placa Cimentícia 1,20×2,40', placa_st:'Placa ST 1,20×1,80',
  placa_ru:'Placa RU 1,20×1,80', placa_rf:'Placa RF 1,20×1,80',
  placa_performa:'Placa Performa 1,20×1,80', placa_leve:'Placa Leve 1,20×2,40',
  membrana:'Membrana impermeab. (rolo 75m²)', iso:'Lã de vidro (rolo 24m²)',
  massa:'Massa Basecoat (saco 25kg)', fita_t10:'Fita telada 10cm (rolo 45m)',
  parafusos:'Parafusos (caixa 1.000)', buchas:'Buchas expansão (caixa 100)',
  fita_anti:'Fita anticorrosiva (rolo 50m)', mao_obra:'Mão de obra',
};

export var SF_UNIDADES = {
  guia:'barra', mont:'barra', placa_ext:'placa', placa_st:'placa', placa_ru:'placa',
  placa_rf:'placa', placa_performa:'placa', placa_leve:'placa',
  membrana:'rolo', iso:'rolo', massa:'saco', fita_t10:'rolo',
  parafusos:'cx', buchas:'cx', fita_anti:'rolo', mao_obra:'m²',
};

export var SF_CATS = {
  'Perfis de Aço':       ['guia','mont'],
  'Placas':              ['placa_ext','placa_st','placa_ru','placa_rf','placa_performa','placa_leve'],
  'Impermeabilização':   ['membrana'],
  'Isolamento':          ['iso'],
  'Argamassas':          ['massa'],
  'Fitas':               ['fita_t10','fita_anti'],
  'Acessórios':          ['parafusos','buchas'],
  'Serviços':            ['mao_obra'],
};

export var SF_COMP_COR = {
  'par-ext':'#3b6ea5','par-int':'#57514a','par-ac':'#4f7d57',
  'par-ru':'#b07a1e','par-rf':'#a33327','par-pf':'#6d557e',
  'for-st':'#3b6ea5','for-ru':'#b07a1e','for-leve':'#57514a',
};

export function gerarId(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

export function fmtR(v){ return 'R$ ' + (v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
export function fmtN(v,d){ return (v||0).toLocaleString('pt-BR',{minimumFractionDigits:d||0,maximumFractionDigits:d||2}); }

function placaKey(tipo){
  return tipo === 'EXT' ? 'placa_ext'
       : tipo === 'RU'  ? 'placa_ru'
       : tipo === 'RF'  ? 'placa_rf'
       : tipo === 'PERFORMA' ? 'placa_performa'
       : tipo === 'LEVE' ? 'placa_leve'
       : 'placa_st';
}
function placaM2(tipo){ return (tipo === 'EXT' || tipo === 'LEVE') ? 2.88 : 2.16; }

export function calcPainel(p, comp){
  var larg = +p.largura || 0;
  var alt  = +p.altura  || 0;
  var area = larg * alt;
  var ap   = area * 1.10;
  var mG   = 2 * larg;

  var mats = {
    guia: Math.ceil(mG / 3),
    mont: Math.ceil(((Math.floor(larg / (comp.esp / 1000)) + 1) * alt) / 3),
  };
  if(comp.pExt){ var k = placaKey(comp.pExt.tipo); mats[k] = (mats[k]||0) + Math.ceil(ap * comp.pExt.lados / placaM2(comp.pExt.tipo)); }
  if(comp.pInt){ var k2 = placaKey(comp.pInt.tipo); mats[k2] = (mats[k2]||0) + Math.ceil(ap * comp.pInt.lados / placaM2(comp.pInt.tipo)); }
  if(comp.mem)  mats.membrana   = Math.ceil(area / 75);
  if(comp.iso)  mats.iso        = Math.ceil(area / 24);
  mats.massa     = Math.ceil(ap * 4 / 25);
  mats.fita_t10  = Math.ceil(ap / 20);
  mats.parafusos = Math.ceil(ap * 35 / 1000);
  mats.buchas    = Math.max(1, Math.ceil(mG / 100));
  mats.fita_anti = Math.max(1, Math.ceil(mG / 50));
  mats.mao_obra  = area;
  return { area: area, areap: ap, mG: mG, mats: mats };
}

export function somarMats(a, b){
  Object.keys(b).forEach(function(k){ a[k] = (a[k]||0) + (b[k]||0); });
  return a;
}

export function calcAmbiente(amb, compMap){
  var area = 0, mats = {};
  (amb.paineis||[]).forEach(function(p){
    var c = compMap[p.composicaoId]; if(!c) return;
    var r = calcPainel(p, c);
    area += r.area;
    somarMats(mats, r.mats);
  });
  return { area: area, mats: mats };
}

export function calcProjeto(proj, composicoes, precos, margem){
  var compMap = {};
  composicoes.forEach(function(c){ compMap[c.id] = c; });
  var totalArea = 0, totalMats = {}, porAmbiente = [];
  (proj.ambientes||[]).forEach(function(amb){
    var r = calcAmbiente(amb, compMap);
    totalArea += r.area;
    somarMats(totalMats, r.mats);
    var cMat = 0;
    Object.keys(r.mats).forEach(function(k){ if(k !== 'mao_obra') cMat += (r.mats[k]||0) * (precos[k]||0); });
    var cMO = (r.mats.mao_obra||0) * (precos.mao_obra||0);
    var custo = cMat + cMO;
    var venda = margem < 100 ? custo / (1 - margem / 100) : custo;
    porAmbiente.push({ id:amb.id, nome:amb.nome, area:r.area, mats:r.mats, cMat:cMat, cMO:cMO, custo:custo, venda:venda });
  });
  var totCMat = 0;
  Object.keys(totalMats).forEach(function(k){ if(k !== 'mao_obra') totCMat += (totalMats[k]||0) * (precos[k]||0); });
  var totCMO  = (totalMats.mao_obra||0) * (precos.mao_obra||0);
  var totCusto = totCMat + totCMO;
  var totVenda = margem < 100 ? totCusto / (1 - margem / 100) : totCusto;
  return { totalArea:totalArea, totalMats:totalMats, porAmbiente:porAmbiente, totCMat:totCMat, totCMO:totCMO, totCusto:totCusto, totVenda:totVenda, margem:margem };
}
