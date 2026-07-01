/**
 * StickFEM Score — saúde do modelo estrutural interpretado do DXF.
 *   🟢 verde    — modelo completo (elementos identificados com boa confiança)
 *   🟡 amarelo  — parcialmente identificado / precisa revisão
 *   🔴 vermelho — necessita revisão (pouco reconhecido / sem perfil)
 *
 * Conecta com a lógica de status do StickFrame (leads, saúde, trial).
 */
export function computeStickFemScore(elementos = []) {
  const paredes = elementos.filter((e) => e.tipo === "parede");
  const motivos = [];

  if (paredes.length === 0) {
    return { nivel: "vermelho", cor: "#981915", emoji: "🔴", label: "Necessita revisão",
      motivos: ["Nenhuma parede estrutural identificada"], pct: 0 };
  }

  const baixa    = paredes.filter((p) => p.confianca === "baixa").length;
  const validadas = paredes.filter((p) => p.validado).length;
  const semPerfil = paredes.filter((p) => !p.perfil_id).length;
  const semComp   = paredes.filter((p) => !p.comprimento_m).length;

  const fBaixa   = baixa / paredes.length;
  const fValid   = validadas / paredes.length;
  const fSemPerf = semPerfil / paredes.length;

  // pontuação 0–100
  let pct = 100;
  pct -= fBaixa * 40;
  pct -= fSemPerf * 25;
  pct -= (1 - fValid) * 25;
  if (semComp) pct -= 10;
  pct = Math.max(0, Math.round(pct));

  if (fBaixa > 0.4)     motivos.push(`${baixa} paredes com baixa confiança`);
  if (semPerfil)        motivos.push(`${semPerfil} paredes sem perfil atribuído`);
  if (validadas < paredes.length) motivos.push(`${paredes.length - validadas} paredes não validadas`);
  if (semComp)          motivos.push(`${semComp} elementos sem comprimento`);

  let nivel, cor, emoji, label;
  if (pct >= 80)      { nivel = "verde";    cor = "#3f7a4b"; emoji = "🟢"; label = "Modelo completo"; }
  else if (pct >= 50) { nivel = "amarelo";  cor = "#b07a1e"; emoji = "🟡"; label = "Parcialmente identificado"; }
  else                { nivel = "vermelho"; cor = "#981915"; emoji = "🔴"; label = "Necessita revisão"; }

  return { nivel, cor, emoji, label, motivos, pct };
}
