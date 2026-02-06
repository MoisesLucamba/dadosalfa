-- Remove duplicate/conflicting policies on workspaces
DROP POLICY IF EXISTS "Users can view their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace owners can update their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view owned workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Members can view their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can update workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can delete workspaces" ON public.workspaces;

-- Create clean, simple policies for workspaces (no recursion)
-- SELECT: Owner can view their workspaces
CREATE POLICY "workspace_select_owner"
ON public.workspaces
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- SELECT: Members can view workspaces they belong to
CREATE POLICY "workspace_select_member"
ON public.workspaces
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

-- INSERT: Authenticated users can create workspaces (must be owner)
CREATE POLICY "workspace_insert"
ON public.workspaces
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- UPDATE: Only owners can update
CREATE POLICY "workspace_update"
ON public.workspaces
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- DELETE: Only owners can delete
CREATE POLICY "workspace_delete"
ON public.workspaces
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());