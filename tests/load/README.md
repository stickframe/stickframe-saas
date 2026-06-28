# Testes de Carga — StickFrame™ SaaS

## Pré-requisitos

Instalar [k6](https://k6.io/docs/getting-started/installation/):

```bash
# Windows (choco)
choco install k6

# macOS
brew install k6

# Linux
sudo apt install k6
```

## Cenários

| Arquivo | Cenário | Usuários | Duração | Alvo |
|---------|---------|----------|---------|------|
| `scenario_light.js` | Leve | 50 | 2 min | P95 < 2s |
| `scenario_medium.js` | Médio | 200 | 2.5 min | P95 < 3s |
| `scenario_stress.js` | Estresse | 500 | 5 min | P95 < 5s |

## Execução

```bash
# Cenário leve
k6 run tests/load/scenario_light.js   -e BASE_URL=<supabase_url> -e SUPABASE_ANON_KEY=<anon_key>

# Cenário médio
k6 run tests/load/scenario_medium.js  -e BASE_URL=<supabase_url> -e SUPABASE_ANON_KEY=<anon_key>

# Cenário de estresse
k6 run tests/load/scenario_stress.js  -e BASE_URL=<supabase_url> -e SUPABASE_ANON_KEY=<anon_key>
```

## Interpretação dos resultados

- **P95 < 2s**: saudável
- **P95 2-5s**: aceitável, monitorar
- **P95 > 5s**: precisa de otimização
- **fail rate > 1%**: investigar gargalos

## Notas

- Os cenários usam o endpoint REST do Supabase diretamente
- Para testar autenticação real, substituir `Authorization` por um token JWT válido
- Respeitar limites do plano Supabase (ex: 50 req/s no free)
