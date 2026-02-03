-- Add website and contact columns to predefined_companies
ALTER TABLE public.predefined_companies 
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_info text;

-- Add the same to organizations table for consistency
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS website text;