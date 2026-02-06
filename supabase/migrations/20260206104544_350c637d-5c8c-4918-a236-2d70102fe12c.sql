-- Drop all existing policies on workspaces table that cause infinite recursion
DROP POLICY IF EXISTS "Users can view their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view workspaces they own" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can update their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can delete their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspaces;

-- Create simple, non-recursive policies for workspaces

-- SELECT: Users can view workspaces they own OR are members of
CREATE POLICY "Users can view owned workspaces"
ON public.workspaces
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Members can view their workspaces"
ON public.workspaces
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = id
    AND wm.user_id = auth.uid()
  )
);

-- INSERT: Any authenticated user can create a workspace
CREATE POLICY "Authenticated users can create workspaces"
ON public.workspaces
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- UPDATE: Only owners can update their workspaces
CREATE POLICY "Owners can update workspaces"
ON public.workspaces
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- DELETE: Only owners can delete their workspaces
CREATE POLICY "Owners can delete workspaces"
ON public.workspaces
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());