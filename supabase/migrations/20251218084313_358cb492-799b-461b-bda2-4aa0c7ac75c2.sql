-- Table for petroleum production data by operator/block
CREATE TABLE public.production_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator TEXT NOT NULL,
  block TEXT NOT NULL,
  field TEXT,
  daily_production NUMERIC NOT NULL DEFAULT 0,
  monthly_production NUMERIC NOT NULL DEFAULT 0,
  decline_rate NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  data_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for price data (Brent, Angolan crudes)
CREATE TABLE public.price_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crude_type TEXT NOT NULL,
  price NUMERIC NOT NULL,
  change_percent NUMERIC DEFAULT 0,
  volume NUMERIC DEFAULT 0,
  data_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for export data
CREATE TABLE public.export_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destination TEXT NOT NULL,
  volume NUMERIC NOT NULL,
  value_usd NUMERIC DEFAULT 0,
  tanker_name TEXT,
  departure_date DATE,
  arrival_date DATE,
  status TEXT DEFAULT 'in_transit',
  data_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for system notifications to users
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for user alert configurations
CREATE TABLE public.user_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  threshold_value NUMERIC,
  is_enabled BOOLEAN DEFAULT true,
  notify_email BOOLEAN DEFAULT true,
  notify_app BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for data update logs from providers
CREATE TABLE public.data_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_type TEXT NOT NULL,
  source TEXT NOT NULL,
  records_updated INTEGER DEFAULT 0,
  notes TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for user requests/support tickets
CREATE TABLE public.user_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  admin_response TEXT,
  responded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.production_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_requests ENABLE ROW LEVEL SECURITY;

-- Production data: all authenticated users can read, only admins can modify
CREATE POLICY "Authenticated users can view production data"
ON public.production_data FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert production data"
ON public.production_data FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update production data"
ON public.production_data FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete production data"
ON public.production_data FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Price data: all authenticated users can read, only admins can modify
CREATE POLICY "Authenticated users can view price data"
ON public.price_data FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert price data"
ON public.price_data FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update price data"
ON public.price_data FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete price data"
ON public.price_data FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Export data: all authenticated users can read, only admins can modify
CREATE POLICY "Authenticated users can view export data"
ON public.export_data FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert export data"
ON public.export_data FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update export data"
ON public.export_data FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete export data"
ON public.export_data FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Notifications: users see their own or global, admins can manage all
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_global = true);

CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can delete notifications"
ON public.notifications FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- User alerts: users manage their own
CREATE POLICY "Users can view own alerts"
ON public.user_alerts FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own alerts"
ON public.user_alerts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own alerts"
ON public.user_alerts FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own alerts"
ON public.user_alerts FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Data updates: all authenticated can view, admins can create
CREATE POLICY "Authenticated users can view data updates"
ON public.data_updates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert data updates"
ON public.data_updates FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User requests: users manage their own, admins see all
CREATE POLICY "Users can view own requests"
ON public.user_requests FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own requests"
ON public.user_requests FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update requests"
ON public.user_requests FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_production_data_updated_at
BEFORE UPDATE ON public.production_data
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_price_data_updated_at
BEFORE UPDATE ON public.price_data
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_export_data_updated_at
BEFORE UPDATE ON public.export_data
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_alerts_updated_at
BEFORE UPDATE ON public.user_alerts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_requests_updated_at
BEFORE UPDATE ON public.user_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();