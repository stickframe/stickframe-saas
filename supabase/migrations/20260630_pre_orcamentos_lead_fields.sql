-- Conversion Layer™ — campos Empresa + Tipo de obra no lead da calculadora.
-- Aditivo e retrocompatível: colunas com IF NOT EXISTS; a RPC ganha 2 params
-- opcionais (DEFAULT NULL) no fim da assinatura, então chamadas antigas
-- (9 args) continuam válidas. Recria a função (DROP antes) para evitar
-- ambiguidade de overload com a versão de 9 argumentos.

ALTER TABLE public.pre_orcamentos
  ADD COLUMN IF NOT EXISTS empresa_lead text,
  ADD COLUMN IF NOT EXISTS tipo_obra    text;

DROP FUNCTION IF EXISTS public.inserir_lead_publico(
  text, text, text, text, numeric, text, numeric, text, text
);

CREATE OR REPLACE FUNCTION public.inserir_lead_publico(
  p_nome         text,
  p_contato      text,
  p_email        text    DEFAULT NULL,
  p_cidade       text    DEFAULT NULL,
  p_area         numeric DEFAULT NULL,
  p_padrao       text    DEFAULT NULL,
  p_valor_min    numeric DEFAULT NULL,
  p_pavimentos   text    DEFAULT NULL,
  p_origem       text    DEFAULT 'CalculadoraPublica',
  p_empresa_lead text    DEFAULT NULL,
  p_tipo_obra    text    DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_empresa_id uuid;
  v_id         bigint;
BEGIN
  SELECT id INTO v_empresa_id FROM public.empresas ORDER BY created_at LIMIT 1;
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'No empresa found';
  END IF;

  INSERT INTO public.pre_orcamentos (
    empresa_id, nome, contato, email, cidade,
    area, padrao, valor_min, pavimentos, origem,
    empresa_lead, tipo_obra
  ) VALUES (
    v_empresa_id, p_nome, p_contato, p_email, p_cidade,
    p_area, p_padrao, p_valor_min, p_pavimentos, p_origem,
    p_empresa_lead, p_tipo_obra
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;
