-- Keep a single owner-auto-membership trigger on workspaces
DROP TRIGGER IF EXISTS trg_add_workspace_owner_as_member ON public.workspaces;
DROP TRIGGER IF EXISTS on_workspace_created ON public.workspaces;

CREATE TRIGGER on_workspace_created
AFTER INSERT ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.add_workspace_owner_as_member();

-- Remove duplicate memberships (if any)
DELETE FROM public.workspace_members a
USING public.workspace_members b
WHERE a.workspace_id = b.workspace_id
  AND a.user_id = b.user_id
  AND a.ctid > b.ctid;

-- Enforce one membership row per user/workspace
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'workspace_members_workspace_id_user_id_key'
      AND conrelid = 'public.workspace_members'::regclass
  ) THEN
    ALTER TABLE public.workspace_members
      ADD CONSTRAINT workspace_members_workspace_id_user_id_key
      UNIQUE (workspace_id, user_id);
  END IF;
END $$;