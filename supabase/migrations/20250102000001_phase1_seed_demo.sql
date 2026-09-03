-- Phase 1 demo seed — unmistakably labeled example data only
-- Uses valid UUIDs consistent with PR #1 demo insurers/plans

-- Demo organization
INSERT INTO public.organizations (id, name, slug, status, is_demo) VALUES
  ('d0000000-0000-4000-8000-000000000001', '[DEMO] CoverÜ Partner Org', 'demo-coveru-partner', 'active', true)
ON CONFLICT (slug) DO NOTHING;

-- Demo API client
INSERT INTO public.api_clients (id, organization_id, name, description, status, is_demo) VALUES
  (
    'e0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000001',
    '[DEMO] Integración de prueba',
    'Cliente API de demostración. No usar en producción.',
    'active',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Demo API key: prefix cov_demo_, hash of "cov_demo_test_key_phase1_only"
-- Raw key for local testing only: cov_demo_test_key_phase1_only
-- SHA-256 with empty pepper (demo); production uses API_KEY_PEPPER env
INSERT INTO public.api_keys (id, api_client_id, name, key_prefix, key_hash, status, scopes) VALUES
  (
    'f0000000-0000-4000-8000-000000000001',
    'e0000000-0000-4000-8000-000000000001',
    '[DEMO] Clave de prueba',
    'cov_demo',
    'ea6954bbf586cef38e6fd81705d98c79eb93e3dff36a205d630b3667073d3fba',
    'active',
    ARRAY['read:catalog', 'read:quotes', 'read:coverage']
  )
ON CONFLICT (id) DO NOTHING;

-- Plan versions for existing demo plans
INSERT INTO public.plan_versions (id, plan_id, version_number, label, status, effective_from, published_at, changelog, is_demo) VALUES
  (
    'd1000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000001',
    1,
    '[DEMO] v1 — Plan Básico Alpha',
    'published',
    '2025-01-01',
    '2025-01-01T00:00:00Z',
    'Versión inicial de demostración.',
    true
  ),
  (
    'd1000000-0000-4000-8000-000000000002',
    'b0000000-0000-4000-8000-000000000002',
    1,
    '[DEMO] v1 — Plan Plus Alpha',
    'published',
    '2025-01-01',
    '2025-01-01T00:00:00Z',
    'Versión inicial de demostración.',
    true
  ),
  (
    'd1000000-0000-4000-8000-000000000003',
    'b0000000-0000-4000-8000-000000000003',
    1,
    '[DEMO] v1 — Plan Esencial Beta',
    'published',
    '2025-01-01',
    '2025-01-01T00:00:00Z',
    'Versión inicial de demostración.',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Coverage clauses for Plan Básico Alpha v1
INSERT INTO public.coverage_clauses (id, plan_version_id, category, title, description, coverage_status, conditions, sort_order, is_demo) VALUES
  (
    'd2000000-0000-4000-8000-000000000001',
    'd1000000-0000-4000-8000-000000000001',
    'hospitalizacion',
    'Hospitalización',
    'Cubre hospitalización en red preferente con copago.',
    'covered',
    'Requiere autorización previa para cirugías programadas.',
    1,
    true
  ),
  (
    'd2000000-0000-4000-8000-000000000002',
    'd1000000-0000-4000-8000-000000000001',
    'urgencias',
    'Urgencias',
    'Atención de urgencia en red y fuera de red con reembolso parcial.',
    'conditional',
    'Fuera de red: reembolso hasta 70% con tope mensual.',
    2,
    true
  ),
  (
    'd2000000-0000-4000-8000-000000000003',
    'd1000000-0000-4000-8000-000000000001',
    'maternidad',
    'Maternidad',
    'No incluida en plan básico de demostración.',
    'not_covered',
    NULL,
    3,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Exclusions
INSERT INTO public.exclusions (id, plan_version_id, title, description, sort_order, is_demo) VALUES
  (
    'd3000000-0000-4000-8000-000000000001',
    'd1000000-0000-4000-8000-000000000001',
    'Tratamientos cosméticos',
    'Procedimientos estéticos no cubiertos salvo reconstrucción post-trauma.',
    1,
    true
  ),
  (
    'd3000000-0000-4000-8000-000000000002',
    'd1000000-0000-4000-8000-000000000001',
    'Preexistencias no declaradas',
    'Condiciones no declaradas en la solicitud quedan excluidas.',
    2,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Waiting periods
INSERT INTO public.waiting_periods (id, plan_version_id, service_category, days, notes, is_demo) VALUES
  (
    'd4000000-0000-4000-8000-000000000001',
    'd1000000-0000-4000-8000-000000000001',
    'cirugia_programada',
    180,
    'Período de carencia de demostración para cirugías electivas.',
    true
  ),
  (
    'd4000000-0000-4000-8000-000000000002',
    'd1000000-0000-4000-8000-000000000001',
    'maternidad',
    300,
    'Aplica solo si el beneficio estuviera contratado (no cubierto en básico).',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Policy document & citations for grounded Q&A demo
INSERT INTO public.policy_documents (id, plan_version_id, title, document_type, content, is_demo) VALUES
  (
    'd5000000-0000-4000-8000-000000000001',
    'd1000000-0000-4000-8000-000000000001',
    '[DEMO] Condiciones Generales — Plan Básico Alpha v1',
    'condiciones_generales',
    'Artículo 4.1 Hospitalización: El asegurado tendrá derecho a hospitalización en la red preferente sujeto al deducible y copago vigentes. Artículo 4.2 Urgencias: Las urgencias médicas están cubiertas en red; fuera de red se reembolsa hasta el 70% con tope. Artículo 5.1 Maternidad: Este plan no incluye cobertura de maternidad. Artículo 6.1 Exclusiones: No se cubren tratamientos cosméticos ni preexistencias no declaradas. Artículo 7.1 Carencias: Cirugías programadas tienen carencia de 180 días desde la vigencia.',
    true
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.citations (id, policy_document_id, clause_ref, excerpt, page_number, is_demo) VALUES
  (
    'd6000000-0000-4000-8000-000000000001',
    'd5000000-0000-4000-8000-000000000001',
    'Art. 4.1',
    'El asegurado tendrá derecho a hospitalización en la red preferente sujeto al deducible y copago vigentes.',
    12,
    true
  ),
  (
    'd6000000-0000-4000-8000-000000000002',
    'd5000000-0000-4000-8000-000000000001',
    'Art. 4.2',
    'Las urgencias médicas están cubiertas en red; fuera de red se reembolsa hasta el 70% con tope.',
    13,
    true
  ),
  (
    'd6000000-0000-4000-8000-000000000003',
    'd5000000-0000-4000-8000-000000000001',
    'Art. 5.1',
    'Este plan no incluye cobertura de maternidad.',
    15,
    true
  ),
  (
    'd6000000-0000-4000-8000-000000000004',
    'd5000000-0000-4000-8000-000000000001',
    'Art. 6.1',
    'No se cubren tratamientos cosméticos ni preexistencias no declaradas.',
    18,
    true
  ),
  (
    'd6000000-0000-4000-8000-000000000005',
    'd5000000-0000-4000-8000-000000000001',
    'Art. 7.1',
    'Cirugías programadas tienen carencia de 180 días desde la vigencia.',
    22,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Demo scenarios for Q&A validation
INSERT INTO public.scenarios (id, plan_version_id, question, expected_status, notes, is_demo) VALUES
  (
    'd7000000-0000-4000-8000-000000000001',
    'd1000000-0000-4000-8000-000000000001',
    '¿Está cubierta la hospitalización?',
    'covered',
    'Debe citar Art. 4.1',
    true
  ),
  (
    'd7000000-0000-4000-8000-000000000002',
    'd1000000-0000-4000-8000-000000000001',
    '¿Cubre maternidad?',
    'not_covered',
    'Debe citar Art. 5.1',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Demo quotes
INSERT INTO public.quotes (id, organization_id, plan_version_id, tariff_id, external_ref, status, age, gender, region, monthly_price, metadata, expires_at, is_demo) VALUES
  (
    'd8000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000001',
    'd1000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'DEMO-QUOTE-001',
    'active',
    30,
    'femenino',
    'metropolitana',
    12500,
    '{"label": "[DEMO] Cotización de ejemplo", "disclaimer": "No es precio real ni vinculante"}'::jsonb,
    '2026-12-31T23:59:59Z',
    true
  )
ON CONFLICT (id) DO NOTHING;
