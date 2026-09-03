-- Demo seed data — unmistakably labeled as example data
-- All records have is_demo = true and [DEMO] prefix in names

INSERT INTO public.insurers (id, name, slug, is_demo) VALUES
  ('a0000000-0000-4000-8000-000000000001', '[DEMO] Aseguradora Alpha', 'demo-alpha', true),
  ('a0000000-0000-4000-8000-000000000002', '[DEMO] Aseguradora Beta', 'demo-beta', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.plans (id, insurer_id, name, description, coverage_summary, is_demo) VALUES
  (
    'b0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    '[DEMO] Plan Básico Alpha',
    'Plan de ejemplo con cobertura hospitalaria básica. No es un producto real.',
    'Hospitalización, urgencias y consultas ambulatorias limitadas.',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    '[DEMO] Plan Plus Alpha',
    'Plan de ejemplo con mayor cobertura ambulatoria. No es un producto real.',
    'Hospitalización, urgencias, consultas ambulatorias y exámenes.',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000002',
    '[DEMO] Plan Esencial Beta',
    'Plan de ejemplo económico. No es un producto real ni precio vigente.',
    'Urgencias y hospitalización con copago moderado.',
    true
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tariffs (id, plan_id, age_min, age_max, gender, region, monthly_price, deductible, copay_pct, annual_limit, exclusions, is_demo) VALUES
  (
    'c0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000001',
    18, 65, 'femenino', 'metropolitana',
    12500, 50000, 20, 5000000,
    '["Tratamientos cosméticos", "Medicina alternativa no cubierta", "Preexistencias no declaradas"]'::jsonb,
    true
  ),
  (
    'c0000000-0000-4000-8000-000000000002',
    'b0000000-0000-4000-8000-000000000002',
    18, 65, 'femenino', 'metropolitana',
    18900, 30000, 15, 8000000,
    '["Tratamientos cosméticos", "Medicina alternativa no cubierta"]'::jsonb,
    true
  ),
  (
    'c0000000-0000-4000-8000-000000000003',
    'b0000000-0000-4000-8000-000000000003',
    18, 65, 'femenino', 'metropolitana',
    9800, 60000, 25, 4000000,
    '["Cirugías electivas no autorizadas", "Tratamientos dentales", "Preexistencias"]'::jsonb,
    true
  ),
  (
    'c0000000-0000-4000-8000-000000000004',
    'b0000000-0000-4000-8000-000000000001',
    18, 65, 'masculino', 'metropolitana',
    13200, 50000, 20, 5000000,
    '["Tratamientos cosméticos", "Medicina alternativa no cubierta", "Preexistencias no declaradas"]'::jsonb,
    true
  )
ON CONFLICT (id) DO NOTHING;
