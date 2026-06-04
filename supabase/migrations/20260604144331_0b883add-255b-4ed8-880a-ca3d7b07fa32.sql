
CREATE TABLE IF NOT EXISTS public.data_reconciliation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('ok','warning','critical')),
  total_checks integer NOT NULL DEFAULT 0,
  total_issues integer NOT NULL DEFAULT 0,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.data_reconciliation_runs TO authenticated;
GRANT ALL ON public.data_reconciliation_runs TO service_role;
ALTER TABLE public.data_reconciliation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read reconciliation" ON public.data_reconciliation_runs FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.data_quality_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.data_reconciliation_runs(id) ON DELETE CASCADE,
  series text NOT NULL,
  check_name text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info','warning','critical')),
  description text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  suggested_fix text,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.data_quality_issues TO authenticated;
GRANT ALL ON public.data_quality_issues TO service_role;
ALTER TABLE public.data_quality_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read issues" ON public.data_quality_issues FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_dqi_run ON public.data_quality_issues(run_id);
CREATE INDEX IF NOT EXISTS idx_dqi_severity ON public.data_quality_issues(severity);
CREATE INDEX IF NOT EXISTS idx_drr_run_at ON public.data_reconciliation_runs(run_at DESC);
