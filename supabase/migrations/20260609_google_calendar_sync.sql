-- Migration: Adicionar suporte ao token iCal na tabela de empresas
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ical_token uuid DEFAULT gen_random_uuid();

-- Garantir que empresas existentes tenham um token gerado
UPDATE empresas SET ical_token = gen_random_uuid() WHERE ical_token IS NULL;

-- Criar um índice único para buscas rápidas pelo token no feed iCal
CREATE UNIQUE INDEX IF NOT EXISTS idx_empresas_ical_token ON empresas(ical_token);
