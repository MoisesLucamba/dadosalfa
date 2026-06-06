
-- Audit table for production duplicate cleanups
CREATE TABLE IF NOT EXISTS public.production_data_cleanup_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL,
  triggered_by uuid,
  dry_run boolean NOT NULL DEFAULT true,
  kept_row_id uuid,
  removed_row jsonb NOT NULL,
  reason text NOT NULL DEFAULT 'exact_duplicate_operator_block_field_date',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.production_data_cleanup_audit TO authenticated;
GRANT ALL ON public.production_data_cleanup_audit TO service_role;

ALTER TABLE public.production_data_cleanup_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view cleanup audit"
ON public.production_data_cleanup_audit
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_prod_cleanup_audit_run ON public.production_data_cleanup_audit(run_id);
CREATE INDEX IF NOT EXISTS idx_prod_cleanup_audit_created ON public.production_data_cleanup_audit(created_at DESC);

-- Safe cleanup function (dry-run by default)
CREATE OR REPLACE FUNCTION public.cleanup_production_duplicates(_dry_run boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _run_id uuid := gen_random_uuid();
  _groups_affected int := 0;
  _rows_to_remove int := 0;
  _rows_removed int := 0;
BEGIN
  IF _user_id IS NULL OR NOT public.has_role(_user_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can run cleanup_production_duplicates';
  END IF;

  -- Identify duplicate groups: same operator+block+field+date.
  -- Keep the row with most recent updated_at (tiebreak created_at, then id).
  WITH ranked AS (
    SELECT
      pd.*,
      ROW_NUMBER() OVER (
        PARTITION BY pd.operator, pd.block, COALESCE(pd.field,''), pd.data_date
        ORDER BY pd.updated_at DESC NULLS LAST, pd.created_at DESC NULLS LAST, pd.id
      ) AS rn,
      FIRST_VALUE(pd.id) OVER (
        PARTITION BY pd.operator, pd.block, COALESCE(pd.field,''), pd.data_date
        ORDER BY pd.updated_at DESC NULLS LAST, pd.created_at DESC NULLS LAST, pd.id
      ) AS kept_id
    FROM public.production_data pd
  ),
  extras AS (
    SELECT * FROM ranked WHERE rn > 1
  ),
  preview AS (
    INSERT INTO public.production_data_cleanup_audit
      (run_id, triggered_by, dry_run, kept_row_id, removed_row, reason)
    SELECT
      _run_id, _user_id, _dry_run, e.kept_id,
      to_jsonb(e.*) - 'rn' - 'kept_id',
      'exact_duplicate_operator_block_field_date'
    FROM extras e
    RETURNING 1
  )
  SELECT COUNT(*) INTO _rows_to_remove FROM preview;

  SELECT COUNT(DISTINCT (operator, block, COALESCE(field,''), data_date))
    INTO _groups_affected
  FROM public.production_data_cleanup_audit
  WHERE run_id = _run_id;

  IF NOT _dry_run THEN
    DELETE FROM public.production_data pd
    WHERE pd.id IN (
      SELECT (removed_row->>'id')::uuid
      FROM public.production_data_cleanup_audit
      WHERE run_id = _run_id
    );
    GET DIAGNOSTICS _rows_removed = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'run_id', _run_id,
    'dry_run', _dry_run,
    'groups_affected', _groups_affected,
    'rows_to_remove', _rows_to_remove,
    'rows_removed', _rows_removed,
    'triggered_by', _user_id,
    'run_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_production_duplicates(boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.cleanup_production_duplicates(boolean) TO authenticated;
