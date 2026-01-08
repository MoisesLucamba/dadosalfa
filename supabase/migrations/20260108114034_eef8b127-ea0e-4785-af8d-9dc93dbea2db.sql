-- Create organizations table for company accounts
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  nif text NOT NULL UNIQUE,
  sector text NOT NULL,
  email_domain text NOT NULL,
  country text NOT NULL DEFAULT 'Angola',
  contact_email text NOT NULL,
  contact_phone text,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Anyone can view approved organizations"
ON public.organizations
FOR SELECT
USING (is_approved = true);

CREATE POLICY "Admins can view all organizations"
ON public.organizations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can create organization"
ON public.organizations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update organizations"
ON public.organizations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete organizations"
ON public.organizations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add organization_id to profiles for employee accounts
ALTER TABLE public.profiles 
ADD COLUMN organization_id uuid REFERENCES public.organizations(id),
ADD COLUMN account_type text NOT NULL DEFAULT 'personal',
ADD COLUMN job_title text;

-- Create predefined companies table
CREATE TABLE public.predefined_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sector text NOT NULL,
  email_domain text NOT NULL,
  country text NOT NULL DEFAULT 'Angola',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.predefined_companies ENABLE ROW LEVEL SECURITY;

-- Anyone can view predefined companies
CREATE POLICY "Anyone can view predefined companies"
ON public.predefined_companies
FOR SELECT
USING (true);

-- Only admins can manage predefined companies
CREATE POLICY "Admins can insert predefined companies"
ON public.predefined_companies
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update predefined companies"
ON public.predefined_companies
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete predefined companies"
ON public.predefined_companies
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert predefined companies (Oil & Gas, Banks, Traders, Consultants, Regulators in Angola/SADC)
INSERT INTO public.predefined_companies (name, sector, email_domain, country) VALUES
-- Oil & Gas Companies - Angola
('Sonangol E.P.', 'oil_gas', 'sonangol.co.ao', 'Angola'),
('TotalEnergies Angola', 'oil_gas', 'totalenergies.com', 'Angola'),
('Chevron Angola', 'oil_gas', 'chevron.com', 'Angola'),
('ExxonMobil Angola', 'oil_gas', 'exxonmobil.com', 'Angola'),
('BP Angola', 'oil_gas', 'bp.com', 'Angola'),
('Eni Angola', 'oil_gas', 'eni.com', 'Angola'),
('Equinor Angola', 'oil_gas', 'equinor.com', 'Angola'),
('Azule Energy', 'oil_gas', 'azule-energy.com', 'Angola'),
('Cabinda Gulf Oil Company (CABGOC)', 'oil_gas', 'cabgoc.com', 'Angola'),
('PRODOIL', 'oil_gas', 'prodoil.co.ao', 'Angola'),
('Somoil', 'oil_gas', 'somoil.com', 'Angola'),
('Sonangol Pesquisa e Produção (P&P)', 'oil_gas', 'sonangol.co.ao', 'Angola'),
('Pumangol', 'oil_gas', 'pumangol.com', 'Angola'),
('Sonangalp', 'oil_gas', 'sonangalp.co.ao', 'Angola'),
-- Oil & Gas Companies - SADC
('Sasol Limited', 'oil_gas', 'sasol.com', 'South Africa'),
('PetroSA', 'oil_gas', 'petrosa.co.za', 'South Africa'),
('Engen Petroleum', 'oil_gas', 'engen.co.za', 'South Africa'),
('Galp Energia', 'oil_gas', 'galp.com', 'Mozambique'),
('Anadarko Mozambique', 'oil_gas', 'anadarko.com', 'Mozambique'),
('Mozambique Rovuma Venture', 'oil_gas', 'mrv-lng.com', 'Mozambique'),
('ENH - Empresa Nacional de Hidrocarbonetos', 'oil_gas', 'enh.co.mz', 'Mozambique'),
('NOCAL - National Oil Company of Liberia', 'oil_gas', 'nocal.com.lr', 'Liberia'),
('Namcor', 'oil_gas', 'namcor.com.na', 'Namibia'),
-- Banks - Angola
('Banco Nacional de Angola (BNA)', 'bank', 'bna.ao', 'Angola'),
('Banco de Fomento Angola (BFA)', 'bank', 'bfa.ao', 'Angola'),
('Banco Angolano de Investimentos (BAI)', 'bank', 'bancobai.ao', 'Angola'),
('Banco BIC', 'bank', 'bancobic.ao', 'Angola'),
('Banco Millennium Atlântico', 'bank', 'atlantico.ao', 'Angola'),
('Standard Bank Angola', 'bank', 'standardbank.co.ao', 'Angola'),
('Banco Caixa Geral Totta Angola', 'bank', 'caixatotta.ao', 'Angola'),
('Banco de Negócios Internacional (BNI)', 'bank', 'bfrni.ao', 'Angola'),
('Banco Económico', 'bank', 'bancoeconomico.ao', 'Angola'),
('Banco Yetu', 'bank', 'bancoyetu.ao', 'Angola'),
('Banco Keve', 'bank', 'bancokeve.ao', 'Angola'),
('Banco Sol', 'bank', 'bancosol.ao', 'Angola'),
-- Banks - SADC
('Standard Bank Group', 'bank', 'standardbank.com', 'South Africa'),
('FirstRand Bank', 'bank', 'firstrand.co.za', 'South Africa'),
('Absa Bank', 'bank', 'absa.co.za', 'South Africa'),
('Nedbank', 'bank', 'nedbank.co.za', 'South Africa'),
('African Development Bank', 'bank', 'afdb.org', 'Regional'),
('Development Bank of Southern Africa', 'bank', 'dbsa.org', 'South Africa'),
-- Traders
('Trafigura', 'trader', 'trafigura.com', 'International'),
('Vitol', 'trader', 'vitol.com', 'International'),
('Glencore', 'trader', 'glencore.com', 'International'),
('Gunvor', 'trader', 'gunvorgroup.com', 'International'),
('Mercuria', 'trader', 'mercuria.com', 'International'),
('SOCAR Trading', 'trader', 'socartrading.com', 'International'),
('Litasco', 'trader', 'litasco.com', 'International'),
('Unipec', 'trader', 'unipec.com.cn', 'International'),
('Petrobras Trading', 'trader', 'petrobras.com.br', 'International'),
('BB Energy', 'trader', 'bfrbenergy.com', 'International'),
-- Consultants
('Wood Mackenzie', 'consultant', 'woodmac.com', 'International'),
('Rystad Energy', 'consultant', 'rystadenergy.com', 'International'),
('McKinsey & Company', 'consultant', 'mckinsey.com', 'International'),
('Boston Consulting Group', 'consultant', 'bcg.com', 'International'),
('Deloitte Angola', 'consultant', 'deloitte.com', 'Angola'),
('PwC Angola', 'consultant', 'pwc.com', 'Angola'),
('KPMG Angola', 'consultant', 'kpmg.com', 'Angola'),
('EY Angola', 'consultant', 'ey.com', 'Angola'),
('IHS Markit', 'consultant', 'ihsmarkit.com', 'International'),
('S&P Global Platts', 'consultant', 'spglobal.com', 'International'),
('Argus Media', 'consultant', 'argusmedia.com', 'International'),
('GlobalData', 'consultant', 'globaldata.com', 'International'),
-- Regulators - Angola
('Agência Nacional de Petróleo, Gás e Biocombustíveis (ANPG)', 'regulator', 'anpg.co.ao', 'Angola'),
('Instituto Regulador dos Derivados de Petróleo (IRDP)', 'regulator', 'irdp.gov.ao', 'Angola'),
('Ministério dos Recursos Minerais, Petróleo e Gás (MIREMPET)', 'regulator', 'mirempet.gov.ao', 'Angola'),
-- Regulators - SADC
('Petroleum Agency of South Africa', 'regulator', 'petroleumagencysa.com', 'South Africa'),
('Instituto Nacional de Petróleo (INP)', 'regulator', 'inp.gov.mz', 'Mozambique'),
('Ministry of Mines and Energy Namibia', 'regulator', 'mme.gov.na', 'Namibia'),
('SADC Energy Commission', 'regulator', 'sadc.int', 'Regional'),
-- Other company for custom entries
('Outra Empresa', 'other', 'other', 'Angola');

-- Add trigger for updated_at on organizations
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();