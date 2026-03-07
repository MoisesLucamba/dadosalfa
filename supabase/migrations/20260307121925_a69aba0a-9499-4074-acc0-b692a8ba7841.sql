
-- Allow authenticated users to read basic profile info of other users (needed for workspace member display)
CREATE POLICY "Authenticated users can view profiles" 
  ON public.profiles FOR SELECT 
  TO authenticated 
  USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
