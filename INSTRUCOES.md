# Tema Stick Frame — nova identidade em todas as telas

Dois arquivos centrais reskinam o sistema inteiro **sem reescrever as 25+ telas**. Seu código aplica cor de dois jeitos (objeto `C` em JS nos estilos inline + variáveis CSS nas classes `.sf-*`); mudando os **dois pontos centrais**, a nova cara se propaga sozinha.

## Arquivos (3)

```
src/utils/constants.js            ← SUBSTITUIR (novo objeto C + cores de dados)
src/styles/theme-stickframe.css   ← CRIAR (override de tokens + fontes)
src/assets/logo_branco.png        ← logo branco (caso queira referenciar na Sidebar)
```

## Passo 1 — substituir `constants.js`
Troque o arquivo inteiro. As **chaves do objeto `C` continuam as mesmas** (`red`, `surface`, `border`, `text`, `muted`, `success`...), então nada quebra — só os valores mudaram para os da marca (tijolo `#981915` + neutros quentes). Ganhou também cores de dados novas e opcionais: `C.steel`, `C.ochre`, `C.sage`, `C.plum`, `C.clay`, `C.brickSoft`.

## Passo 2 — criar e importar o tema
1. Coloque `theme-stickframe.css` em `src/styles/`.
2. No seu `src/main.jsx`, importe **depois** do globals:
   ```js
   import "./styles/globals.css";
   import "./styles/theme-stickframe.css";   // ← por último, vence a cascata
   ```

Esse arquivo:
- Sobrescreve as variáveis CSS (`--red`, `--bg`, `--border`, sombras, raios) com os tons quentes da marca;
- Troca a fonte do corpo de **Inter → Hanken Grotesk**;
- **Conserta um bug latente**: o `.btn-primary` do globals usava `var(--primary)` que não existia (ficava sem cor de fundo) — agora tem;
- Unifica os dois sistemas de badge no tom certo;
- Deixa foco, scrollbar e dark mode no tom quente.

## Passo 3 (opcional, recomendado) — números condensados
O visual "industrial-financeiro" vem do Barlow Condensed nos números. Onde houver valor de destaque (KPI, moeda), adicione a classe `num`:
```jsx
<div className="num" style={{ fontSize: 28, fontWeight: 700 }}>{fmt(totalRec)}</div>
```
Sem isso, tudo funciona — só não terá o número condensado.

## O que NÃO precisa fazer
- Não precisa editar tela por tela. Quem usa `C.xxx` (a maioria) pega a cor nova automático; quem usa classes `.sf-*` pega via o tema.
- Não precisa mexer no `globals.css` (o tema é override, não substituição).

## Ajustes finos que você talvez queira depois
- **Título do Dashboard com gradiente** vermelho→azul: é inline no `Dashboard.jsx` e não vem da paleta. Para ficar no padrão novo, troque por `color: C.text` com um marcador tijolo (como no protótipo).
- **Emojis nos KPIs de SST/Suprimentos**: continuam emojis; se quiser, troco por ícones de linha depois.
- **Sidebar**: se ela usa `C.graphite` no fundo, já fica no grafite quente. O `logo_branco.png` está incluído caso queira pôr o símbolo real no topo.

## Testar
```
npm run dev
```
Abra qualquer tela — a paleta, o fundo osso, as bordas quentes e a fonte nova já valem em tudo. Se algo destoar (uma cor hardcoded perdida num componente), me diga qual tela que eu aponto a linha.
