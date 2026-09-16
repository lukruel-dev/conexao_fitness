-- ==============================================================================
-- INSERÇÃO DOS NOVOS SERVIÇOS NO CATÁLOGO BASE (MASSOTERAPIA & BEM-ESTAR)
-- ==============================================================================

INSERT INTO public.service_catalog (
  id,
  name,
  modality,
  duration_minutes,
  type,
  description,
  is_active,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  v.name,
  v.modality,
  v.duration_minutes,
  v.type::public.service_catalog_type_enum,
  v.description,
  true,
  NOW(),
  NOW()
FROM (
  VALUES
    (
      'Massagem Relaxante',
      'Massoterapia',
      60,
      'SESSAO',
      'Redução de estresse, ansiedade e tensão muscular através de movimentos suaves e fluidos com óleos essenciais.'
    ),
    (
      'Massagem Terapêutica',
      'Massoterapia',
      60,
      'SESSAO',
      'Tratamento focado em dores musculares específicas, contraturas, nós de tensão e alívio ortopédico.'
    ),
    (
      'Drenagem Linfática',
      'Massoterapia',
      50,
      'SESSAO',
      'Estímulo suave do sistema linfático para redução de retenção de líquidos, inchaços e eliminação de toxinas.'
    ),
    (
      'Reflexologia',
      'Massoterapia',
      45,
      'SESSAO',
      'Aplicação de pressão em pontos reflexos dos pés e mãos para equilíbrio energético e relaxamento sistêmico.'
    ),
    (
      'Massagem Humanizada',
      'Massoterapia',
      60,
      'SESSAO',
      'Atendimento holístico e empático centrado na escuta, acolhimento e técnicas adaptadas à sensibilidade individual.'
    )
) AS v(name, modality, duration_minutes, type, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.service_catalog sc WHERE sc.name = v.name
);

-- Conferência dos serviços de Massoterapia cadastrados
SELECT name, modality, duration_minutes, type, is_active 
FROM public.service_catalog 
WHERE modality = 'Massoterapia'
ORDER BY name;
