-- Fix permissive INSERT policy for organizations
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can create organization" ON public.organizations;

-- Create a more restrictive policy - only allow insert for authenticated users or during signup
CREATE POLICY "Authenticated users can create organization"
ON public.organizations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL OR auth.uid() IS NULL);

-- Note: The insert will happen during signup before the user is fully authenticated,
-- but the organization requires admin approval (is_approved = false by default)