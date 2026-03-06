-- Workspace access helpers (avoid recursive RLS checks)
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspaces w
    WHERE w.id = _workspace_id
      AND w.owner_id = _user_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = _workspace_id
      AND wm.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_workspace(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspaces w
    WHERE w.id = _workspace_id
      AND w.owner_id = _user_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = _workspace_id
      AND wm.user_id = _user_id
      AND wm.role = ANY (ARRAY['owner'::text, 'admin'::text])
  );
$$;

-- Ensure creator is always a member owner
CREATE OR REPLACE FUNCTION public.add_workspace_owner_as_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.owner_id, 'owner', NEW.owner_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_add_workspace_owner_as_member ON public.workspaces;
CREATE TRIGGER trg_add_workspace_owner_as_member
AFTER INSERT ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.add_workspace_owner_as_member();

-- Backfill missing owner membership rows
INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by)
SELECT w.id, w.owner_id, 'owner', w.owner_id
FROM public.workspaces w
LEFT JOIN public.workspace_members wm
  ON wm.workspace_id = w.id
 AND wm.user_id = w.owner_id
WHERE wm.id IS NULL;

-- Rebuild workspace policies without recursive dependencies
DROP POLICY IF EXISTS workspace_delete ON public.workspaces;
DROP POLICY IF EXISTS workspace_insert ON public.workspaces;
DROP POLICY IF EXISTS workspace_select_member ON public.workspaces;
DROP POLICY IF EXISTS workspace_select_owner ON public.workspaces;
DROP POLICY IF EXISTS workspace_update ON public.workspaces;

CREATE POLICY workspace_select
ON public.workspaces
FOR SELECT
USING (public.is_workspace_member(id, auth.uid()));

CREATE POLICY workspace_insert
ON public.workspaces
FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY workspace_update
ON public.workspaces
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY workspace_delete
ON public.workspaces
FOR DELETE
USING (owner_id = auth.uid());

-- Rebuild workspace member policies using helper functions
DROP POLICY IF EXISTS "Members can be removed by owners or themselves" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners and admins can add members" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can view workspace members" ON public.workspace_members;

CREATE POLICY workspace_members_select
ON public.workspace_members
FOR SELECT
USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY workspace_members_insert
ON public.workspace_members
FOR INSERT
WITH CHECK (public.can_manage_workspace(workspace_id, auth.uid()));

CREATE POLICY workspace_members_update
ON public.workspace_members
FOR UPDATE
USING (public.can_manage_workspace(workspace_id, auth.uid()))
WITH CHECK (public.can_manage_workspace(workspace_id, auth.uid()));

CREATE POLICY workspace_members_delete
ON public.workspace_members
FOR DELETE
USING (
  user_id = auth.uid()
  OR public.can_manage_workspace(workspace_id, auth.uid())
);