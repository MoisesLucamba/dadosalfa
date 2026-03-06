
-- Drop all existing RESTRICTIVE policies on workspaces
DROP POLICY IF EXISTS "workspace_delete" ON public.workspaces;
DROP POLICY IF EXISTS "workspace_insert" ON public.workspaces;
DROP POLICY IF EXISTS "workspace_select" ON public.workspaces;
DROP POLICY IF EXISTS "workspace_update" ON public.workspaces;

-- Recreate as PERMISSIVE policies
CREATE POLICY "workspace_select" ON public.workspaces
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(id, auth.uid()));

CREATE POLICY "workspace_insert" ON public.workspaces
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "workspace_update" ON public.workspaces
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "workspace_delete" ON public.workspaces
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Also fix workspace_members policies (same issue)
DROP POLICY IF EXISTS "workspace_members_delete" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_select" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_update" ON public.workspace_members;

CREATE POLICY "workspace_members_select" ON public.workspace_members
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "workspace_members_insert" ON public.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_workspace(workspace_id, auth.uid()));

CREATE POLICY "workspace_members_update" ON public.workspace_members
  FOR UPDATE TO authenticated
  USING (public.can_manage_workspace(workspace_id, auth.uid()))
  WITH CHECK (public.can_manage_workspace(workspace_id, auth.uid()));

CREATE POLICY "workspace_members_delete" ON public.workspace_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.can_manage_workspace(workspace_id, auth.uid()));

-- Fix workspace_activity policies
DROP POLICY IF EXISTS "Members can log activity" ON public.workspace_activity;
DROP POLICY IF EXISTS "Members can view workspace activity" ON public.workspace_activity;

CREATE POLICY "Members can view workspace activity" ON public.workspace_activity
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Members can log activity" ON public.workspace_activity
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));

-- Fix workspace_invitations policies
DROP POLICY IF EXISTS "Admins can create invitations" ON public.workspace_invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON public.workspace_invitations;
DROP POLICY IF EXISTS "Users can view invitations for their workspaces" ON public.workspace_invitations;

CREATE POLICY "Users can view invitations" ON public.workspace_invitations
  FOR SELECT TO authenticated
  USING (public.can_manage_workspace(workspace_id, auth.uid()));

CREATE POLICY "Admins can create invitations" ON public.workspace_invitations
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_workspace(workspace_id, auth.uid()));

CREATE POLICY "Admins can update invitations" ON public.workspace_invitations
  FOR UPDATE TO authenticated
  USING (public.can_manage_workspace(workspace_id, auth.uid()));

-- Fix workspace_reports policies
DROP POLICY IF EXISTS "Editors can share reports" ON public.workspace_reports;
DROP POLICY IF EXISTS "Editors can unshare reports" ON public.workspace_reports;
DROP POLICY IF EXISTS "Members can view shared reports" ON public.workspace_reports;

CREATE POLICY "Members can view shared reports" ON public.workspace_reports
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Editors can share reports" ON public.workspace_reports
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Editors can unshare reports" ON public.workspace_reports
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
