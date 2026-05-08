-- Lock down api_keys table (was completely exposed with no RLS)
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- No client policies = only service_role (edge functions) can access
CREATE POLICY "Deny all client access to api_keys"
ON public.api_keys
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);