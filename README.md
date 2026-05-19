# Stick Frame — Sistema de Gestão

SaaS interno para CRM, orçamentos, gestão de obras e controle financeiro.

---

## Deploy em 5 passos

### 1. Clonar e instalar
```bash
git clone https://github.com/SEU_USUARIO/stickframe-saas.git
cd stickframe-saas
npm install
```

### 2. Configurar Supabase
1. Acesse [supabase.com](https://supabase.com) → New Project
2. Abra **SQL Editor** e cole o conteúdo de `supabase-schema.sql`
3. Vá em **Settings → API** e copie:
   - Project URL → `VITE_SUPABASE_URL`
   - anon public key → `VITE_SUPABASE_KEY`

### 3. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Edite .env com suas chaves do Supabase
```

### 4. Testar localmente
```bash
npm run dev
# Acesse http://localhost:5173
```

### 5. Publicar no Vercel
```bash
# Instale a CLI do Vercel (uma vez só)
npm i -g vercel

# Faça o deploy
vercel

# No painel do Vercel, adicione as variáveis de ambiente:
# Settings → Environment Variables
# VITE_SUPABASE_URL = https://xxx.supabase.co
# VITE_SUPABASE_KEY = eyJ...
```

---

## Criar usuários

No Supabase → **Authentication → Users → Invite user**

Adicione os e-mails da equipe. O usuário define a senha no primeiro acesso.

---

## Estrutura do projeto

```
stickframe-saas/
├── src/
│   ├── main.jsx          # Entry point React
│   ├── App.jsx           # App principal (todos os módulos)
│   └── supabase.js       # Cliente Supabase + helpers de banco
├── public/
│   └── favicon.svg
├── index.html
├── vite.config.js
├── package.json
├── .env.example
├── .gitignore
└── supabase-schema.sql   # SQL para criar as tabelas
```

---

## Módulos

| Módulo | Descrição |
|--------|-----------|
| Dashboard | KPIs consolidados, funil e progresso de obras |
| CRM | Cadastro e gestão de clientes/leads |
| Orçamentos | Geração com cálculo automático por m² e padrão |
| Gestão de Obras | Timeline por fase com avanço em tempo real |
| Financeiro | Lançamentos de receita/despesa, margem real por obra |

---

Stick Frame Sistemas Construtivos Ltda. — Santo André/SP
