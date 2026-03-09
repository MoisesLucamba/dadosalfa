
-- Fix organizations RLS: convert restrictive policies to permissive
-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can delete organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can update organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can view all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Anyone can view approved organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organization" ON public.organizations;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can delete organizations"
ON public.organizations FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update organizations"
ON public.organizations FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all organizations"
ON public.organizations FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view approved organizations"
ON public.organizations FOR SELECT TO authenticated
USING (is_approved = true);

CREATE POLICY "Authenticated users can create organization"
ON public.organizations FOR INSERT TO authenticated
WITH CHECK (true);

-- Also allow the user who just created an org to SELECT it back (for .select().single())
CREATE POLICY "Users can view own created organizations"
ON public.organizations FOR SELECT TO authenticated
USING (contact_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
