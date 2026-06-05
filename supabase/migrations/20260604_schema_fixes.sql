-- Adiciona campo onboarding_completo na tabela empresas
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS onboarding_completo BOOLEAN DEFAULT FALSE;

-- Adiciona campo ativo na tabela usuarios (usado no gerenciamento de perfis)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
