
-- Create a security definer function to create workspaces
CREATE OR REPLACE FUNCTION public.create_workspace(
  _name text,
  _description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _workspace_id uuid;
  _user_id uuid := auth.uid();
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.workspaces (name, description, owner_id)
  VALUES (_name, _description, _user_id)
  RETURNING id INTO _workspace_id;

  -- Add owner as member
  INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by)
  VALUES (_workspace_id, _user_id, 'owner', _user_id)
  ON CONFLICT DO NOTHING;

  RETURN _workspace_id;
END;
$$;
