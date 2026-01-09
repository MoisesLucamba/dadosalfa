-- Create system_settings table for API configurations and system controls
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can modify system settings
CREATE POLICY "Super admins can manage system settings"
ON public.system_settings
FOR ALL
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- All admins can view system settings
CREATE POLICY "Admins can view system settings"
ON public.system_settings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default API settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('api_config', '{
  "oil_price_api": {"enabled": true, "name": "Oil Price API", "description": "API de preços em tempo real"},
  "eia_api": {"enabled": true, "name": "EIA API", "description": "U.S. Energy Information Administration"},
  "fred_api": {"enabled": true, "name": "FRED API", "description": "Federal Reserve Economic Data"},
  "auto_sync": {"enabled": true, "interval": "daily", "time": "06:00 UTC"}
}'::jsonb, 'Configurações das APIs de dados'),
('platform_config', '{
  "maintenance_mode": false,
  "allow_signups": true,
  "require_approval": true,
  "max_users": 1000
}'::jsonb, 'Configurações gerais da plataforma'),
('notification_config', '{
  "email_notifications": true,
  "sync_alerts": true,
  "price_alerts": true
}'::jsonb, 'Configurações de notificações')
ON CONFLICT (setting_key) DO NOTHING;

-- Create function to promote to super admin (only existing super admins can do this)
CREATE OR REPLACE FUNCTION public.promote_to_super_admin(_target_user_id uuid)
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
    RAISE EXCEPTION 'Only super admins can promote to super admin';
  END IF;
  
  -- First ensure user has admin role
  INSERT INTO public.user_roles (user_id, role, is_super_admin)
  VALUES (_target_user_id, 'admin', true)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET is_super_admin = true;
  
  RETURN true;
END;
$$;

-- Create function to demote from super admin
CREATE OR REPLACE FUNCTION public.demote_from_super_admin(_target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_super boolean;
  target_count integer;
BEGIN
  -- Check if caller is super admin
  SELECT public.is_super_admin(auth.uid()) INTO caller_is_super;
  
  IF NOT caller_is_super THEN
    RAISE EXCEPTION 'Only super admins can demote super admins';
  END IF;
  
  -- Check if this is the last super admin
  SELECT COUNT(*) INTO target_count FROM public.user_roles WHERE role = 'admin' AND is_super_admin = true;
  
  IF target_count <= 1 THEN
    RAISE EXCEPTION 'Cannot demote the last super admin';
  END IF;
  
  -- Demote from super admin but keep admin role
  UPDATE public.user_roles 
  SET is_super_admin = false
  WHERE user_id = _target_user_id AND role = 'admin';
  
  RETURN true;
END;
$$;