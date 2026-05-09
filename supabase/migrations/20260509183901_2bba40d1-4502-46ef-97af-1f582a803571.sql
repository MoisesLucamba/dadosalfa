-- Service providers directory
CREATE TABLE public.service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  categories text[] NOT NULL DEFAULT '{}',
  website text,
  description text,
  country text NOT NULL DEFAULT 'Angola',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view service providers"
  ON public.service_providers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert service providers"
  ON public.service_providers FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update service providers"
  ON public.service_providers FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete service providers"
  ON public.service_providers FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_service_providers_updated
  BEFORE UPDATE ON public.service_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Suggestions table
CREATE TABLE public.service_provider_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_name text NOT NULL,
  category text NOT NULL,
  website text,
  contact_email text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_provider_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit suggestions"
  ON public.service_provider_suggestions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own suggestions"
  ON public.service_provider_suggestions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage suggestions"
  ON public.service_provider_suggestions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete suggestions"
  ON public.service_provider_suggestions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed with verified Angola oil services companies
INSERT INTO public.service_providers (name, categories, website, description) VALUES
  ('Halliburton Angola', ARRAY['Perfuração','Manutenção & Engenharia'], 'https://www.halliburton.com', 'Oilfield services and drilling solutions'),
  ('Schlumberger (SLB) Angola', ARRAY['Perfuração','Geofísica & Sísmica','Tecnologia & Software'], 'https://www.slb.com', 'Reservoir characterization, drilling, production'),
  ('Baker Hughes Angola', ARRAY['Perfuração','Manutenção & Engenharia'], 'https://www.bakerhughes.com', 'Energy technology and services'),
  ('Bourbon Offshore Angola', ARRAY['Logística Offshore'], 'https://www.bourbonoffshore.com', 'Offshore marine services for oil & gas'),
  ('Saipem Angola', ARRAY['Perfuração','Manutenção & Engenharia'], 'https://www.saipem.com', 'Drilling and EPC offshore/onshore'),
  ('Subsea 7 Angola', ARRAY['Manutenção & Engenharia','Logística Offshore'], 'https://www.subsea7.com', 'Subsea engineering, construction and services'),
  ('TechnipFMC Angola', ARRAY['Manutenção & Engenharia','Tecnologia & Software'], 'https://www.technipfmc.com', 'Subsea, surface and integrated projects'),
  ('Sonils', ARRAY['Logística Offshore','Catering & Suporte'], 'https://www.sonils.com', 'Sonangol Integrated Logistics Services base'),
  ('RNA - Reparação Naval de Angola', ARRAY['Manutenção & Engenharia'], NULL, 'Naval repair and maintenance services'),
  ('Semco Maritime Angola', ARRAY['Manutenção & Engenharia','Logística Offshore'], 'https://www.semcomaritime.com', 'Engineering and maintenance for offshore'),
  ('SGS Angola', ARRAY['Ambiental','Jurídico & Consultoria'], 'https://www.sgs.com', 'Inspection, verification, testing, certification'),
  ('Bureau Veritas Angola', ARRAY['Ambiental','Jurídico & Consultoria'], 'https://www.bureauveritas.com', 'Testing, inspection and certification'),
  ('Weatherford Angola', ARRAY['Perfuração','Manutenção & Engenharia'], 'https://www.weatherford.com', 'Drilling, evaluation, completion, production'),
  ('McDermott Angola', ARRAY['Manutenção & Engenharia'], 'https://www.mcdermott.com', 'EPC for offshore and subsea'),
  ('Aker Solutions Angola', ARRAY['Manutenção & Engenharia','Tecnologia & Software'], 'https://www.akersolutions.com', 'Subsea production systems and engineering'),
  ('PetroService Angola', ARRAY['Catering & Suporte','Logística Offshore'], NULL, 'Local oilfield support services');