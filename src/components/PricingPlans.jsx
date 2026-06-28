// Fonte única de verdade dos planos StickFrame™.
// Consumido pela landing (#precos) e pela página /pricing.
// Editar preço/feature aqui reflete nos dois lugares.

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M20 6 9 17l-5-5" /></svg>
);

export const PLANOS = [
  {
    key: "essencial", nome: "Essencial", preco: "R$ 97", periodo: "/mês",
    desc: "Para quem está começando",
    items: ["Orçamentos & contratos ilimitados", "Calculadora white-label", "CRM & funil de vendas", "1 usuário · suporte por e-mail"],
    cta: "Começar grátis", href: "/cadastro?plan=essencial", hot: false,
  },
  {
    key: "profissional", nome: "Profissional", preco: "R$ 197", periodo: "/mês",
    desc: "Para construtoras em crescimento",
    items: ["Tudo do Essencial", "Gestão de obras completa", "Financeiro StickCash™ por obra", "RDO mobile · 5 usuários", "Suporte prioritário no WhatsApp"],
    cta: "Testar 14 dias grátis", href: "/cadastro?plan=profissional", hot: true, tag: "Mais escolhido",
  },
  {
    key: "construtora", nome: "Construtora+", preco: "Sob consulta", periodo: "",
    desc: "Para operações maiores",
    items: ["Tudo do Profissional", "Linha Stick™ completa (IA)", "Multiempresa & multiobra", "Usuários ilimitados", "Onboarding assistido & SLA"],
    cta: "Falar com a equipe", href: "https://wa.me/551140038929?text=Ol%C3%A1%2C+tenho+interesse+no+plano+Construtora%2B", hot: false,
  },
];

const CSS = `
.sfp { --brick:#981915; --brick-dk:#7d1411; --graphite:#2b2b2e; --sage:#4f7d57;
  --ink:#26231f; --ink-2:#57514a; --muted:#8c847a; --line:#e7e1d8; --surface:#fff;
  font-family: 'Hanken Grotesk', sans-serif; }
.sfp .sfp-head { text-align: center; margin-bottom: 48px; }
.sfp .sfp-eyebrow { font-size: 12.5px; font-weight: 800; letter-spacing: 2.4px; text-transform: uppercase; display: block; margin-bottom: 12px; color: var(--brick); }
.sfp .sfp-head h2 { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: clamp(32px,4.5vw,52px); line-height: 1.02; color: var(--ink); margin: 0; }
.sfp .sfp-head p { font-size: 17px; color: var(--ink-2); margin: 12px auto 0; max-width: 560px; }
.sfp .sfp-plans { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; align-items: stretch; }
.sfp .sfp-plan { background: var(--surface); border: 1.5px solid var(--line); border-radius: 18px; padding: 30px 28px; display: flex; flex-direction: column; position: relative; }
.sfp .sfp-plan.hot { background: var(--graphite); border-color: var(--graphite); color: #fff; }
.sfp .sfp-tag { position: absolute; top: -12px; left: 28px; background: var(--brick); color: #fff; font-size: 11px; font-weight: 800; letter-spacing: 1.2px; padding: 5px 12px; border-radius: 99px; text-transform: uppercase; }
.sfp .sfp-nm { font-size: 15px; font-weight: 800; }
.sfp .sfp-ds { font-size: 13px; color: var(--muted); margin-top: 4px; }
.sfp .sfp-plan.hot .sfp-ds { color: #9a948a; }
.sfp .sfp-pr { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 46px; margin: 20px 0 2px; line-height: 1; }
.sfp .sfp-pr small { font-size: 15px; font-family: 'Hanken Grotesk', sans-serif; font-weight: 600; color: var(--muted); }
.sfp .sfp-plan.hot .sfp-pr small { color: #9a948a; }
.sfp .sfp-plan ul { list-style: none; margin: 18px 0 24px; padding: 0; display: flex; flex-direction: column; gap: 9px; flex: 1; }
.sfp .sfp-plan li { display: flex; gap: 10px; font-size: 13.5px; color: var(--ink-2); align-items: flex-start; }
.sfp .sfp-plan.hot li { color: #cfc9c0; }
.sfp .sfp-chk { color: var(--sage); flex-shrink: 0; display: flex; margin-top: 2px; }
.sfp .sfp-plan.hot .sfp-chk { color: #7fb389; }
.sfp .sfp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; min-height: 44px; font-family: 'Hanken Grotesk', sans-serif; font-weight: 700; font-size: 15px; padding: 13px 24px; border-radius: 10px; cursor: pointer; border: 1.5px solid transparent; white-space: nowrap; transition: .15s; text-decoration: none; }
.sfp .sfp-btn.brick { background: var(--brick); color: #fff; border-color: var(--brick); }
.sfp .sfp-btn.brick:hover { background: var(--brick-dk); border-color: var(--brick-dk); }
.sfp .sfp-btn.outline { background: transparent; color: var(--ink); border-color: var(--line); }
.sfp .sfp-plan.hot .sfp-btn.outline { color: #fff; border-color: rgba(255,255,255,.4); }
.sfp .sfp-btn.outline:hover { border-color: var(--muted); }
.sfp .sfp-note { text-align: center; margin-top: 20px; font-size: 13px; color: var(--muted); }
@media (max-width: 860px) {
  .sfp .sfp-plans { grid-template-columns: 1fr; }
  .sfp .sfp-plan.hot { order: -1; }
}
`;

/**
 * Bloco de planos StickFrame™.
 * @param {boolean} showHead  exibe eyebrow + título + subtítulo (default true)
 * @param {function} onSelect handler opcional (key, plano) — sobrepõe navegação por href
 */
export default function PricingPlans({ showHead = true, onSelect }) {
  return (
    <div className="sfp">
      <style>{CSS}</style>
      {showHead && (
        <div className="sfp-head">
          <span className="sfp-eyebrow">Planos</span>
          <h2>Escolha o tamanho da sua operação</h2>
          <p>Comece grátis e evolua conforme as obras crescem. Cancele quando quiser.</p>
        </div>
      )}
      <div className="sfp-plans">
        {PLANOS.map((pl) => (
          <div className={`sfp-plan${pl.hot ? " hot" : ""}`} key={pl.key}>
            {pl.tag && <div className="sfp-tag">{pl.tag}</div>}
            <div className="sfp-nm">{pl.nome}</div>
            <div className="sfp-ds">{pl.desc}</div>
            <div className="sfp-pr">{pl.preco}{pl.periodo && <small>{pl.periodo}</small>}</div>
            <ul>
              {pl.items.map((it) => (
                <li key={it}><span className="sfp-chk"><Check /></span>{it}</li>
              ))}
            </ul>
            <a
              href={pl.href}
              className={`sfp-btn${pl.hot ? " brick" : " outline"}`}
              onClick={onSelect ? (e) => { e.preventDefault(); onSelect(pl.key, pl); } : undefined}
            >
              {pl.cta}
            </a>
          </div>
        ))}
      </div>
      <p className="sfp-note">Todos os planos incluem 14 dias grátis · Sem cartão de crédito</p>
    </div>
  );
}
