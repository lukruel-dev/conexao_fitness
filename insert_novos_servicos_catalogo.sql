-- ==============================================================================
-- SCRIPT UNIVERSAL DE INSERÇÃO DOS 5 SERVIÇOS NO CATÁLOGO BASE
-- Compatível tanto com camelCase ("durationMinutes") quanto snake_case (duration_minutes)
-- ==============================================================================

DO $$
DECLARE
  col_duration text;
  col_active text;
  col_created text;
  col_updated text;
  type_type text;
  insert_query text;
BEGIN
  -- Detecta os nomes exatos das colunas existentes na tabela
  SELECT column_name INTO col_duration 
  FROM information_schema.columns 
  WHERE table_name = 'service_catalog' AND column_name IN ('durationMinutes', 'duration_minutes') 
  LIMIT 1;

  SELECT column_name INTO col_active 
  FROM information_schema.columns 
  WHERE table_name = 'service_catalog' AND column_name IN ('isActive', 'is_active') 
  LIMIT 1;

  SELECT column_name INTO col_created 
  FROM information_schema.columns 
  WHERE table_name = 'service_catalog' AND column_name IN ('createdAt', 'created_at') 
  LIMIT 1;

  SELECT column_name INTO col_updated 
  FROM information_schema.columns 
  WHERE table_name = 'service_catalog' AND column_name IN ('updatedAt', 'updated_at') 
  LIMIT 1;

  SELECT udt_name INTO type_type 
  FROM information_schema.columns 
  WHERE table_name = 'service_catalog' AND column_name = 'type' 
  LIMIT 1;

  -- Se durationMinutes for camelCase
  IF col_duration = 'durationMinutes' THEN
    insert_query := '
      INSERT INTO public.service_catalog (id, name, modality, "durationMinutes", type, description, "isActive", "createdAt", "updatedAt")
      SELECT 
        gen_random_uuid(),
        v.name,
        v.modality,
        v.duration,
        v.type::' || quote_ident(type_type) || ',
        v.description,
        true,
        NOW(),
        NOW()
      FROM (
        VALUES
          (''Massagem Relaxante'', ''Massoterapia'', 60, ''SESSAO'', ''Redução de estresse, ansiedade e tensão muscular através de movimentos suaves e fluidos com óleos essenciais.''),
          (''Massagem Terapêutica'', ''Massoterapia'', 60, ''SESSAO'', ''Tratamento focado em dores musculares específicas, contraturas, nós de tensão e alívio ortopédico.''),
          (''Drenagem Linfática'', ''Massoterapia'', 50, ''SESSAO'', ''Estímulo suave do sistema linfático para redução de retenção de líquidos, inchaços e eliminação de toxinas.''),
          (''Reflexologia'', ''Massoterapia'', 45, ''SESSAO'', ''Aplicação de pressão em pontos reflexos dos pés e mãos para equilíbrio energético e relaxamento sistêmico.''),
          (''Massagem Humanizada'', ''Massoterapia'', 60, ''SESSAO'', ''Atendimento holístico e empático centrado na escuta, acolhimento e técnicas adaptadas à sensibilidade individual.'')
      ) AS v(name, modality, duration, type, description)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.service_catalog sc WHERE sc.name = v.name
      );';
  ELSE
    -- Se duration_minutes for snake_case
    insert_query := '
      INSERT INTO public.service_catalog (id, name, modality, duration_minutes, type, description, is_active, created_at, updated_at)
      SELECT 
        gen_random_uuid(),
        v.name,
        v.modality,
        v.duration,
        v.type::' || quote_ident(type_type) || ',
        v.description,
        true,
        NOW(),
        NOW()
      FROM (
        VALUES
          (''Massagem Relaxante'', ''Massoterapia'', 60, ''SESSAO'', ''Redução de estresse, ansiedade e tensão muscular através de movimentos suaves e fluidos com óleos essenciais.''),
          (''Massagem Terapêutica'', ''Massoterapia'', 60, ''SESSAO'', ''Tratamento focado em dores musculares específicas, contraturas, nós de tensão e alívio ortopédico.''),
          (''Drenagem Linfática'', ''Massoterapia'', 50, ''SESSAO'', ''Estímulo suave do sistema linfático para redução de retenção de líquidos, inchaços e eliminação de toxinas.''),
          (''Reflexologia'', ''Massoterapia'', 45, ''SESSAO'', ''Aplicação de pressão em pontos reflexos dos pés e mãos para equilíbrio energético e relaxamento sistêmico.''),
          (''Massagem Humanizada'', ''Massoterapia'', 60, ''SESSAO'', ''Atendimento holístico e empático centrado na escuta, acolhimento e técnicas adaptadas à sensibilidade individual.'')
      ) AS v(name, modality, duration, type, description)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.service_catalog sc WHERE sc.name = v.name
      );';
  END IF;

  EXECUTE insert_query;
END $$;

-- Consulta de confirmação dos serviços inseridos
SELECT * FROM public.service_catalog WHERE modality = 'Massoterapia' ORDER BY name;
