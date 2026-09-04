-- Extend api_usage_logs with plan references for marketplace / coverage traceability

ALTER TABLE public.api_usage_logs
  ADD COLUMN IF NOT EXISTS plan_version_id UUID REFERENCES public.plan_versions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE INDEX IF NOT EXISTS api_usage_logs_plan_version_id_idx
  ON public.api_usage_logs(plan_version_id)
  WHERE plan_version_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS api_usage_logs_plan_id_idx
  ON public.api_usage_logs(plan_id)
  WHERE plan_id IS NOT NULL;
