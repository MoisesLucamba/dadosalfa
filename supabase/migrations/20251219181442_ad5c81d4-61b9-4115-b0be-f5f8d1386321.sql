-- Create risk_data table for storing risk assessments
CREATE TABLE public.risk_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('geopolitical', 'regulatory', 'fiscal', 'operational', 'currency', 'environmental')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')),
  description TEXT,
  source TEXT,
  data_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create risk_alerts table for active alerts
CREATE TABLE public.risk_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('critical', 'warning', 'info')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact TEXT CHECK (impact IN ('high', 'medium', 'low')),
  region TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create country_risk table for country-specific risk scores
CREATE TABLE public.country_risk (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')),
  data_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(country, data_date)
);

-- Create regulatory_events table
CREATE TABLE public.regulatory_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT,
  status TEXT CHECK (status IN ('pending', 'active', 'completed')),
  impact_level TEXT CHECK (impact_level IN ('high', 'medium', 'low')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.risk_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_risk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_events ENABLE ROW LEVEL SECURITY;

-- Policies for viewing (all authenticated users can view)
CREATE POLICY "Users can view risk data" ON public.risk_data
  FOR SELECT USING (true);

CREATE POLICY "Users can view risk alerts" ON public.risk_alerts
  FOR SELECT USING (true);

CREATE POLICY "Users can view country risk" ON public.country_risk
  FOR SELECT USING (true);

CREATE POLICY "Users can view regulatory events" ON public.regulatory_events
  FOR SELECT USING (true);

-- Policies for modification (admins only)
CREATE POLICY "Admins can insert risk data" ON public.risk_data
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update risk data" ON public.risk_data
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete risk data" ON public.risk_data
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert risk alerts" ON public.risk_alerts
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update risk alerts" ON public.risk_alerts
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete risk alerts" ON public.risk_alerts
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert country risk" ON public.country_risk
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update country risk" ON public.country_risk
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete country risk" ON public.country_risk
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert regulatory events" ON public.regulatory_events
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update regulatory events" ON public.regulatory_events
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete regulatory events" ON public.regulatory_events
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_risk_data_updated_at
  BEFORE UPDATE ON public.risk_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risk_alerts_updated_at
  BEFORE UPDATE ON public.risk_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_country_risk_updated_at
  BEFORE UPDATE ON public.country_risk
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_regulatory_events_updated_at
  BEFORE UPDATE ON public.regulatory_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();