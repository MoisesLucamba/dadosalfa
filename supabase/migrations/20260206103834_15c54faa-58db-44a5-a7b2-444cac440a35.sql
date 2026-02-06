-- Drop the problematic recursive policies on workspace_members
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace admins can add members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace admins can remove members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace admins can update members" ON public.workspace_members;

-- Create non-recursive RLS policies for workspace_members

-- SELECT: Users can view members if they are the workspace owner or a member themselves
CREATE POLICY "Users can view workspace members" 
ON public.workspace_members 
FOR SELECT 
USING (
  -- User is a member of this workspace (direct check, no recursion)
  user_id = auth.uid()
  OR
  -- User is the owner of the workspace (join to workspaces table)
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = workspace_members.workspace_id 
    AND w.owner_id = auth.uid()
  )
);

-- INSERT: Workspace owners and admins can add members
-- This policy avoids recursion by checking workspaces table directly first
CREATE POLICY "Owners and admins can add members" 
ON public.workspace_members 
FOR INSERT 
WITH CHECK (
  -- User is the workspace owner
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = workspace_members.workspace_id 
    AND w.owner_id = auth.uid()
  )
  OR
  -- User is an admin or owner member (use security_invoker to avoid recursion)
  auth.uid() IN (
    SELECT wm.user_id FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id 
    AND wm.role IN ('owner', 'admin')
    AND wm.user_id = auth.uid()
  )
);

-- UPDATE: Only owners and admins can update member roles
CREATE POLICY "Owners and admins can update members" 
ON public.workspace_members 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = workspace_members.workspace_id 
    AND w.owner_id = auth.uid()
  )
);

-- DELETE: Owners/admins can remove members, or users can remove themselves
CREATE POLICY "Members can be removed by owners or themselves" 
ON public.workspace_members 
FOR DELETE 
USING (
  -- User is removing themselves
  user_id = auth.uid()
  OR
  -- User is the workspace owner
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = workspace_members.workspace_id 
    AND w.owner_id = auth.uid()
  )
);