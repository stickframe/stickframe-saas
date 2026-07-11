-- 
-- StickFrame Phase 3 - Universal Events and Timeline Migration
-- 

-- 1. Criar enums de visibilidade e origem de forma segura
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evento_visibilidade') THEN
    CREATE TYPE public.evento_visibilidade AS ENUM ('INTERNO', 'COMERCIAL', 'CLIENTE', 'PUBLICO');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'modulo_origem') THEN
    CREATE TYPE public.modulo_origem AS ENUM (
      'CRM', 'ORCAMENTOS', 'BIM', 'PORTAL', 'FINANCEIRO', 'OBRAS', 'SUPRIMENTOS', 'IA', 'CALCULADORA'
    );
  END IF;
END$$;

-- 2. Criar a tabela de eventos da timeline do StickFlow
CREATE TABLE IF NOT EXISTS public.stickflow_eventos (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id      uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT null,
  stickflow_id    uuid REFERENCES public.stickflow(id) ON DELETE CASCADE NOT null,
  evento_tipo     text not null, -- Mapeado de EVENT_TYPES no código frontend
  origem          public.modulo_origem not null, -- Módulo de onde partiu o evento
  usuario_id      uuid REFERENCES auth.users(id) ON DELETE SET null, -- Usuário responsável pelo evento
  visibilidade    public.evento_visibilidade DEFAULT 'INTERNO'::public.evento_visibilidade,
  payload         jsonb DEFAULT '{}'::jsonb, -- Dados flexíveis do evento
  correlation_id  uuid DEFAULT gen_random_uuid(), -- Rastreabilidade de transação lógica
  event_version   integer DEFAULT 1, -- Versão do contrato do payload para controle de drifts
  criado_em       timestamptz DEFAULT now()
);

-- 3. Criar índices para otimização da timeline e rastreamento de correlação
CREATE INDEX IF NOT EXISTS idx_eventos_stickflow ON public.stickflow_eventos(stickflow_id);
CREATE INDEX IF NOT EXISTS idx_eventos_correlation ON public.stickflow_eventos(correlation_id);
CREATE INDEX IF NOT EXISTS idx_eventos_visibilidade ON public.stickflow_eventos(visibilidade);
