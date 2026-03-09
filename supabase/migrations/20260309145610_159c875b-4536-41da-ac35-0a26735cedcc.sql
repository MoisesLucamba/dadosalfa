
-- Drop the restrictive INSERT policy on organizations
DROP POLICY IF EXISTS "Authenticated users can create organization" ON public.organizations;

-- Create a permissive INSERT policy that allows authenticated users to create organizations
CREATE POLICY "Authenticated users can create organization"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);
