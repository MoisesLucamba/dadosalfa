
-- Dedupe price_data keeping the latest updated_at per (crude_type, data_date)
DELETE FROM public.price_data a
USING public.price_data b
WHERE a.crude_type = b.crude_type
  AND a.data_date = b.data_date
  AND a.updated_at < b.updated_at;

-- Tie-breaker for identical updated_at
DELETE FROM public.price_data a
USING public.price_data b
WHERE a.crude_type = b.crude_type
  AND a.data_date = b.data_date
  AND a.updated_at = b.updated_at
  AND a.id < b.id;

ALTER TABLE public.price_data
  ADD CONSTRAINT price_data_crude_date_unique UNIQUE (crude_type, data_date);
