// Predefined companies for Angola/SADC region
export interface Company {
  id: string;
  name: string;
  sector: string;
  emailDomain: string;
  country: string;
}

export const SECTORS = {
  oil_gas: { label: 'Petróleo & Gás', labelEn: 'Oil & Gas', labelFr: 'Pétrole & Gaz' },
  bank: { label: 'Banco / Instituição Financeira', labelEn: 'Bank / Financial Institution', labelFr: 'Banque / Institution Financière' },
  trader: { label: 'Trader', labelEn: 'Trader', labelFr: 'Trader' },
  consultant: { label: 'Consultora', labelEn: 'Consultant', labelFr: 'Consultant' },
  regulator: { label: 'Órgão Regulador', labelEn: 'Regulatory Body', labelFr: 'Organisme de Réglementation' },
  other: { label: 'Outro', labelEn: 'Other', labelFr: 'Autre' },
} as const;

export type SectorType = keyof typeof SECTORS;

// Function to get sector label by language
export const getSectorLabel = (sector: SectorType, lang: string): string => {
  const sectorData = SECTORS[sector];
  if (!sectorData) return sector;
  
  switch (lang) {
    case 'pt':
      return sectorData.label;
    case 'fr':
      return sectorData.labelFr;
    default:
      return sectorData.labelEn;
  }
};

// Function to extract email domain
export const extractEmailDomain = (email: string): string => {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : '';
};

// Function to validate corporate email against company domain
export const validateCorporateEmail = (email: string, companyEmailDomain: string): boolean => {
  if (companyEmailDomain === 'other') return true; // Skip validation for custom companies
  const emailDomain = extractEmailDomain(email);
  return emailDomain === companyEmailDomain.toLowerCase();
};
