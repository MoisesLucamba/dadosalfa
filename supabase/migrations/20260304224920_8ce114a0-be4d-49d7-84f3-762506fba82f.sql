
CREATE TABLE public.well_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  well_name TEXT NOT NULL,
  block TEXT NOT NULL,
  operator TEXT NOT NULL,
  field TEXT,
  basin TEXT NOT NULL DEFAULT 'Congo',
  well_type TEXT NOT NULL DEFAULT 'Exploração',
  depth INTEGER NOT NULL DEFAULT 0,
  water_depth INTEGER NOT NULL DEFAULT 0,
  api_gravity NUMERIC DEFAULT 0,
  daily_production NUMERIC DEFAULT 0,
  success_probability INTEGER DEFAULT 0,
  risk_level TEXT DEFAULT 'Médio',
  status TEXT DEFAULT 'Pendente',
  latitude NUMERIC,
  longitude NUMERIC,
  simulation_data JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.well_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all simulations" ON public.well_simulations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create simulations" ON public.well_simulations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own simulations" ON public.well_simulations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own simulations" ON public.well_simulations
  FOR DELETE USING (user_id = auth.uid());
