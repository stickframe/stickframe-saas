-- 
-- StickFrame Phase 3 - StickFlow Table and Enums Migration
-- 

-- 1. Criar o enum de status do StickFlow de forma segura
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stickflow_status') THEN
    CREATE TYPE public.stickflow_status AS ENUM (
      'CAPTACAO', 'QUALIFICACAO', 'ORCAMENTO', 'NEGOCIACAO', 
      'CONTRATO', 'ENGENHARIA', 'FABRICACAO', 'OBRA', 
      'ENTREGA', 'POS_VENDA', 'FINALIZADO'
    );
  END IF;
END$$;

-- 2. Criar a tabela public.stickflow
CREATE TABLE IF NOT EXISTS public.stickflow (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id          uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT null,
  cliente_id          uuid REFERENCES public.clientes(id) ON DELETE CASCADE NOT null,
  nome                text not null, -- ex: 'Casa 01 - João', 'Galpão Industrial'
  origem              text DEFAULT 'calculadora' CHECK (origem in ('calculadora', 'manual', 'api')),
  status              public.stickflow_status DEFAULT 'CAPTACAO'::public.stickflow_status,
  progresso           integer DEFAULT 0 CHECK (progresso >= 0 and progresso <= 100),
  
  -- Referências do Grafo de Relacionamentos
  lead_id             bigint, -- ID numérico do pre_orcamentos se aplicável
  orcamento_id        uuid REFERENCES public.orcamentos(id) ON DELETE SET null,
  contrato_id         uuid REFERENCES public.contratos(id) ON DELETE SET null,
  obra_id             uuid REFERENCES public.obras(id) ON DELETE SET null,
  ifc_id              uuid, -- ID do arquivo IFC
  pdf_id              uuid, -- ID do PDF da proposta
  proposta_online_id  uuid, -- ID da proposta online
  portal_id           uuid, -- ID do portal do cliente
  
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_stickflow_empresa ON public.stickflow(empresa_id);
CREATE INDEX IF NOT EXISTS idx_stickflow_cliente ON public.stickflow(cliente_id);

-- 4. Adicionar chaves estrangeiras de volta nas tabelas orcamentos, contratos e obras (se não existirem)
ALTER TABLE public.orcamentos 
  ADD COLUMN IF NOT EXISTS stickflow_id uuid REFERENCES public.stickflow(id) ON DELETE SET null;

ALTER TABLE public.contratos 
  ADD COLUMN IF NOT EXISTS stickflow_id uuid REFERENCES public.stickflow(id) ON DELETE SET null;

ALTER TABLE public.obras 
  ADD COLUMN IF NOT EXISTS stickflow_id uuid REFERENCES public.stickflow(id) ON DELETE SET null;
