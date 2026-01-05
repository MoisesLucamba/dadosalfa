-- Add is_super_admin column to user_roles table
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

-- Set moiseslucamba2020@gmail.com as super admin
UPDATE public.user_roles 
SET is_super_admin = true 
WHERE user_id = 'e43207fc-6df8-457a-a271-a62dc96fb783' AND role = 'admin';

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
      AND is_super_admin = true
  )
$$;

-- Create function to promote user to admin (only super admins can do this)
CREATE OR REPLACE FUNCTION public.promote_to_admin(_target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_super boolean;
BEGIN
  -- Check if caller is super admin
  SELECT public.is_super_admin(auth.uid()) INTO caller_is_super;
  
  IF NOT caller_is_super THEN
    RAISE EXCEPTION 'Only super admins can promote users';
  END IF;
  
  -- Insert or update role
  INSERT INTO public.user_roles (user_id, role, is_super_admin)
  VALUES (_target_user_id, 'admin', false)
  ON CONFLICT (user_id, role) 
  DO NOTHING;
  
  RETURN true;
END;
$$;

-- Create function to demote user from admin (only super admins can do this)
CREATE OR REPLACE FUNCTION public.demote_from_admin(_target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_super boolean;
  target_is_super boolean;
BEGIN
  -- Check if caller is super admin
  SELECT public.is_super_admin(auth.uid()) INTO caller_is_super;
  
  IF NOT caller_is_super THEN
    RAISE EXCEPTION 'Only super admins can demote users';
  END IF;
  
  -- Check if target is super admin (cannot demote super admin)
  SELECT public.is_super_admin(_target_user_id) INTO target_is_super;
  
  IF target_is_super THEN
    RAISE EXCEPTION 'Cannot demote a super admin';
  END IF;
  
  -- Remove admin role
  DELETE FROM public.user_roles 
  WHERE user_id = _target_user_id AND role = 'admin';
  
  RETURN true;
END;
$$;

-- Add RLS policy for user_roles - admins can view all
CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));