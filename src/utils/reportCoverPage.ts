/**
 * Cover page generator for reports - PROFESSIONAL MULTILINGUAL VERSION
 * Modern technical design with full i18n support
 */

import jsPDF from 'jspdf';
import { DocumentLanguageCode } from '@/i18n';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type RGBColor = [number, number, number];

export interface CoverPageData {
  generatingCompany: {
    name: string;
    fullName: string;
    description: string;
    contact: string;
    website: string;
    address: string;
  };
  dataSources: DataSource[];
  countryInfo: {
    name: string;
    region: string;
    currency: string;
    language: string;
    timezone: string;
  };
  requestingCompany?: {
    name: string;
    nif?: string;
    sector?: string;
    country?: string;
  };
  requestedBy?: {
    name: string;
    role?: string;
    email?: string;
  };
  reportTitle: string;
  reportType: string;
  reportPeriod: string;
  generatedAt: Date;
  isAiGenerated: boolean;
  logoBase64?: string;
  language?: DocumentLanguageCode;
}

export interface DataSource {
  name: string;
  type: string;
  description: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
  primary: [30, 64, 175] as RGBColor,
  brand: [220, 38, 38] as RGBColor,
  accent: [236, 72, 153] as RGBColor,
  dark: [10, 10, 10] as RGBColor,
  darkGray: [51, 65, 85] as RGBColor,
  muted: [100, 116, 139] as RGBColor,
  mediumGray: [148, 163, 184] as RGBColor,
  lightGray: [203, 213, 225] as RGBColor,
  light: [241, 245, 249] as RGBColor,
  ultraLight: [248, 250, 252] as RGBColor,
  white: [255, 255, 255] as RGBColor,
  success: [34, 197, 94] as RGBColor,
  warning: [234, 179, 8] as RGBColor,
  info: [59, 130, 246] as RGBColor,
  bgPrimary: [249, 250, 251] as RGBColor,
  bgSecondary: [243, 244, 246] as RGBColor,
} as const;

const LAYOUT = {
  MARGIN: 20,
  SECTION_SPACING: 14,
  SUBSECTION_SPACING: 8,
  LINE_SPACING: 6,
  CARD_PADDING: 8,
  BOX_RADIUS: 6,
  SMALL_BOX_RADIUS: 3,
  FOOTER_HEIGHT: 28,
  LINE_WIDTH_THICK: 2.5,
  LINE_WIDTH_MEDIUM: 1.5,
  LINE_WIDTH_THIN: 0.75,
} as const;

// ============================================================================
// MULTILINGUAL TRANSLATIONS
// ============================================================================

const COVER_TRANSLATIONS: Record<DocumentLanguageCode, Record<string, string>> = {
  pt: {
    REPORT: 'RELATORIO',
    TYPE: 'Tipo:',
    PERIOD: 'Periodo:',
    GENERATED: 'Gerado:',
    CURRENT: 'Actual',
    AI_GENERATED: 'Gerado com IA',
    GENERATING_COMPANY: 'EMPRESA GERADORA',
    DATA_SOURCES: 'FONTES DE DADOS',
    DATA_SOURCES_PAGE_TITLE: 'Fontes de Dados e Referencias',
    COUNTRY_INFO: 'INFORMACOES DO PAIS',
    REQUESTING_COMPANY: 'EMPRESA SOLICITANTE',
    REQUESTED_BY: 'SOLICITADO POR',
    COUNTRY: 'Pais:',
    REGION: 'Regiao:',
    CURRENCY: 'Moeda:',
    LANGUAGE: 'Idioma:',
    TIMEZONE: 'Fuso:',
    COMPANY: 'Empresa:',
    NIF: 'NIF:',
    SECTOR: 'Sector:',
    NAME: 'Nome:',
    ROLE: 'Cargo:',
    EMAIL: 'Email:',
    CONTACT: 'Contacto:',
    WEBSITE: 'Website:',
    ADDRESS: 'Endereco:',
    CONFIDENTIAL_NOTICE: 'Este documento contem informacoes confidenciais. A sua distribuicao esta restrita a destinatarios autorizados.',
    CONFIDENTIAL_HEADER: 'CONFIDENCIAL - USO INTERNO',
    DATA_QUALITY_NOTE: 'Todas as fontes de dados sao verificadas e atualizadas regularmente para garantir precisao e confiabilidade nas analises.',
    DATA_QUALITY_TITLE: 'NOTA SOBRE QUALIDADE DOS DADOS',
    DATA_SOURCES_INTRO: 'Este relatorio baseia-se em multiplas fontes de dados verificadas e confiaveis para garantir a precisao e integridade das analises apresentadas.',
    TAGLINE: 'Inteligencia de Mercado Petrolifero Angolano',
    INFO_PAGE: 'PAGINA INFORMATIVA',
    REPORT_INFO: 'INFORMACOES DO RELATORIO',
    TITLE_LABEL: 'Titulo:',
    METHOD: 'Metodo:',
    AI_METHOD: 'Gerado com Inteligencia Artificial',
    END_INFO_PAGE: 'FIM DA PAGINA INFORMATIVA - INICIO DO CONTEUDO DO RELATORIO',
    DESCRIPTION: 'Descricao:',
    SOURCE: 'Fonte',
    SOURCE_TYPE: 'Tipo',
    SOURCE_DESC: 'Descricao',
  },
  en: {
    REPORT: 'REPORT',
    TYPE: 'Type:',
    PERIOD: 'Period:',
    GENERATED: 'Generated:',
    CURRENT: 'Current',
    AI_GENERATED: 'AI Generated',
    GENERATING_COMPANY: 'GENERATING COMPANY',
    DATA_SOURCES: 'DATA SOURCES',
    DATA_SOURCES_PAGE_TITLE: 'Data Sources and References',
    COUNTRY_INFO: 'COUNTRY INFORMATION',
    REQUESTING_COMPANY: 'REQUESTING COMPANY',
    REQUESTED_BY: 'REQUESTED BY',
    COUNTRY: 'Country:',
    REGION: 'Region:',
    CURRENCY: 'Currency:',
    LANGUAGE: 'Language:',
    TIMEZONE: 'Timezone:',
    COMPANY: 'Company:',
    NIF: 'Tax ID:',
    SECTOR: 'Sector:',
    NAME: 'Name:',
    ROLE: 'Role:',
    EMAIL: 'Email:',
    CONTACT: 'Contact:',
    WEBSITE: 'Website:',
    ADDRESS: 'Address:',
    CONFIDENTIAL_NOTICE: 'This document contains confidential information. Distribution is restricted to authorized recipients only.',
    CONFIDENTIAL_HEADER: 'CONFIDENTIAL - INTERNAL USE',
    DATA_QUALITY_NOTE: 'All data sources are verified and regularly updated to ensure accuracy and reliability in the analyses presented.',
    DATA_QUALITY_TITLE: 'DATA QUALITY NOTE',
    DATA_SOURCES_INTRO: 'This report is based on multiple verified and reliable data sources to ensure the accuracy and integrity of the analyses presented.',
    TAGLINE: 'Angolan Oil Market Intelligence',
    INFO_PAGE: 'INFORMATION PAGE',
    REPORT_INFO: 'REPORT INFORMATION',
    TITLE_LABEL: 'Title:',
    METHOD: 'Method:',
    AI_METHOD: 'Generated with Artificial Intelligence',
    END_INFO_PAGE: 'END OF INFORMATION PAGE - START OF REPORT CONTENT',
    DESCRIPTION: 'Description:',
    SOURCE: 'Source',
    SOURCE_TYPE: 'Type',
    SOURCE_DESC: 'Description',
  },
  fr: {
    REPORT: 'RAPPORT',
    TYPE: 'Type:',
    PERIOD: 'Periode:',
    GENERATED: 'Genere:',
    CURRENT: 'Actuel',
    AI_GENERATED: 'Genere par IA',
    GENERATING_COMPANY: 'SOCIETE GENERATRICE',
    DATA_SOURCES: 'SOURCES DE DONNEES',
    DATA_SOURCES_PAGE_TITLE: 'Sources de Donnees et References',
    COUNTRY_INFO: 'INFORMATIONS SUR LE PAYS',
    REQUESTING_COMPANY: 'SOCIETE DEMANDEUSE',
    REQUESTED_BY: 'DEMANDE PAR',
    COUNTRY: 'Pays:',
    REGION: 'Region:',
    CURRENCY: 'Monnaie:',
    LANGUAGE: 'Langue:',
    TIMEZONE: 'Fuseau:',
    COMPANY: 'Societe:',
    NIF: 'ID Fiscal:',
    SECTOR: 'Secteur:',
    NAME: 'Nom:',
    ROLE: 'Poste:',
    EMAIL: 'Email:',
    CONTACT: 'Contact:',
    WEBSITE: 'Site Web:',
    ADDRESS: 'Adresse:',
    CONFIDENTIAL_NOTICE: 'Ce document contient des informations confidentielles. Sa distribution est limitee aux destinataires autorises.',
    CONFIDENTIAL_HEADER: 'CONFIDENTIEL - USAGE INTERNE',
    DATA_QUALITY_NOTE: 'Toutes les sources de donnees sont verifiees et regulierement mises a jour pour garantir la precision et la fiabilite des analyses.',
    DATA_QUALITY_TITLE: 'NOTE SUR LA QUALITE DES DONNEES',
    DATA_SOURCES_INTRO: 'Ce rapport repose sur plusieurs sources de donnees verifiees et fiables pour garantir la precision et l\'integrite des analyses presentees.',
    TAGLINE: 'Intelligence du Marche Petrolier Angolais',
    INFO_PAGE: 'PAGE D\'INFORMATION',
    REPORT_INFO: 'INFORMATIONS SUR LE RAPPORT',
    TITLE_LABEL: 'Titre:',
    METHOD: 'Methode:',
    AI_METHOD: 'Genere avec l\'Intelligence Artificielle',
    END_INFO_PAGE: 'FIN DE LA PAGE D\'INFORMATION - DEBUT DU CONTENU DU RAPPORT',
    DESCRIPTION: 'Description:',
    SOURCE: 'Source',
    SOURCE_TYPE: 'Type',
    SOURCE_DESC: 'Description',
  },
};

const COMPANY_TRANSLATIONS: Record<DocumentLanguageCode, { fullName: string; description: string }> = {
  pt: {
    fullName: 'AlphaData - Inteligencia de Mercado Petrolifero Angolano',
    description: 'Plataforma lider em analise de dados e inteligencia artificial para o sector petrolifero de Angola. Fornecemos insights estrategicos, previsoes de mercado e analises de risco em tempo real.',
  },
  en: {
    fullName: 'AlphaData - Angolan Oil Market Intelligence',
    description: 'Leading platform for data analysis and artificial intelligence for the Angolan oil sector. We provide strategic insights, market forecasts and real-time risk analysis.',
  },
  fr: {
    fullName: 'AlphaData - Intelligence du Marche Petrolier Angolais',
    description: 'Plateforme leader en analyse de donnees et intelligence artificielle pour le secteur petrolier angolais. Nous fournissons des insights strategiques, des previsions de marche et des analyses de risque en temps reel.',
  },
};

const DATA_SOURCES_TRANSLATIONS: Record<DocumentLanguageCode, DataSource[]> = {
  pt: [
    { name: 'BPEP - Bureau de Pesquisa Energetica e Petrolifera', type: 'Oficial', description: 'Dados oficiais de producao e exportacao do sector petrolifero angolano' },
    { name: 'ANP - Agencia Nacional do Petroleo', type: 'Regulador', description: 'Informacoes regulatorias e licenciamento de operacoes' },
    { name: 'Ministerio dos Recursos Minerais e Petroleo', type: 'Governamental', description: 'Politicas e directivas do sector energetico' },
    { name: 'APIs de Mercado Internacional', type: 'Mercado', description: 'Cotacoes Brent, WTI e futuros de petroleo em tempo real' },
    { name: 'AlphaData AI Engine', type: 'IA', description: 'Modelos proprietarios de previsao e analise de tendencias' },
  ],
  en: [
    { name: 'BPEP - Energy and Petroleum Research Bureau', type: 'Official', description: 'Official production and export data from the Angolan oil sector' },
    { name: 'ANP - National Petroleum Agency', type: 'Regulator', description: 'Regulatory information and operational licensing' },
    { name: 'Ministry of Mineral Resources and Petroleum', type: 'Government', description: 'Energy sector policies and directives' },
    { name: 'International Market APIs', type: 'Market', description: 'Real-time Brent, WTI and oil futures quotes' },
    { name: 'AlphaData AI Engine', type: 'AI', description: 'Proprietary forecasting and trend analysis models' },
  ],
  fr: [
    { name: 'BPEP - Bureau de Recherche Energetique et Petroliere', type: 'Officiel', description: 'Donnees officielles de production et exportation du secteur petrolier angolais' },
    { name: 'ANP - Agence Nationale du Petrole', type: 'Regulateur', description: 'Informations reglementaires et licences d\'operations' },
    { name: 'Ministere des Ressources Minerales et du Petrole', type: 'Gouvernemental', description: 'Politiques et directives du secteur energetique' },
    { name: 'APIs de Marche International', type: 'Marche', description: 'Cotations Brent, WTI et contrats a terme en temps reel' },
    { name: 'AlphaData AI Engine', type: 'IA', description: 'Modeles proprietaires de prevision et d\'analyse de tendances' },
  ],
};

function getCoverTranslation(lang: DocumentLanguageCode) {
  return COVER_TRANSLATIONS[lang] || COVER_TRANSLATIONS.pt;
}

// ============================================================================
// DEFAULT DATA
// ============================================================================

export const getDefaultCoverPageData = (lang: DocumentLanguageCode = 'pt'): Omit<CoverPageData, 'reportTitle' | 'reportType' | 'reportPeriod' | 'generatedAt' | 'isAiGenerated'> => {
  const companyT = COMPANY_TRANSLATIONS[lang] || COMPANY_TRANSLATIONS.pt;
  const dataSources = DATA_SOURCES_TRANSLATIONS[lang] || DATA_SOURCES_TRANSLATIONS.pt;
  return {
    generatingCompany: {
      name: 'AlphaData',
      fullName: companyT.fullName,
      description: companyT.description,
      contact: 'info@alphadata.ao',
      website: 'www.alphadata.ao',
      address: 'Luanda, Angola',
    },
    dataSources,
    countryInfo: {
      name: 'Republica de Angola',
      region: 'Africa Subsaariana',
      currency: 'Kwanza (AOA)',
      language: lang === 'en' ? 'Portuguese' : lang === 'fr' ? 'Portugais' : 'Portugues',
      timezone: 'WAT (UTC+1)',
    },
    language: lang,
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const validateCoverPageData = (data: CoverPageData): void => {
  if (!data) throw new Error('Cover page data is required');
  if (!data.reportTitle?.trim()) throw new Error('Report title is required');
  if (!data.reportType?.trim()) throw new Error('Report type is required');
  if (!data.generatedAt || !(data.generatedAt instanceof Date)) throw new Error('Generated date must be a valid Date object');
  if (!data.generatingCompany?.name) throw new Error('Generating company name is required');
  if (!Array.isArray(data.dataSources) || data.dataSources.length === 0) throw new Error('At least one data source is required');
};

const sanitizeText = (text: string): string => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '');
};

const setTextStyle = (
  doc: jsPDF,
  fontSize: number,
  fontWeight: 'normal' | 'bold' | 'italic',
  color: RGBColor
): void => {
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', fontWeight);
  doc.setTextColor(...color);
};

const formatDateTime = (date: Date, lang: DocumentLanguageCode = 'pt'): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const monthsPt = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthsFr = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
  const months = lang === 'en' ? monthsEn : lang === 'fr' ? monthsFr : monthsPt;
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  if (lang === 'en') return `${month} ${day}, ${year} at ${hours}:${minutes}`;
  if (lang === 'fr') return `${day} ${month} ${year} a ${hours}:${minutes}`;
  return `${day} de ${month} de ${year} as ${hours}:${minutes}`;
};

// ============================================================================
// COVER PAGE RENDERING - PROFESSIONAL DESIGN
// ============================================================================

const renderCoverPage = (doc: jsPDF, data: CoverPageData): void => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = LAYOUT.MARGIN;
  const lang = data.language || 'pt';
  const T = getCoverTranslation(lang);

  // === FULL DARK HEADER (top 42%) ===
  const headerHeight = pageHeight * 0.42;
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // Subtle gradient band at top
  doc.setFillColor(20, 20, 25);
  doc.rect(0, 0, pageWidth, 25, 'F');

  // Red accent line
  doc.setDrawColor(...COLORS.brand);
  doc.setLineWidth(3);
  doc.line(margin, headerHeight - 1, margin + 80, headerHeight - 1);

  // === LOGO ===
  let logoY = 30;
  if (data.logoBase64) {
    try {
      doc.addImage(data.logoBase64, 'PNG', margin, logoY, 22, 22);
      setTextStyle(doc, 28, 'bold', COLORS.white);
      doc.text('ALPHADATA', margin + 28, logoY + 15);
    } catch {
      setTextStyle(doc, 48, 'bold', COLORS.brand);
      doc.text('α', margin, logoY + 15);
      setTextStyle(doc, 28, 'bold', COLORS.white);
      doc.text('ALPHADATA', margin + 25, logoY + 15);
    }
  } else {
    setTextStyle(doc, 48, 'bold', COLORS.brand);
    doc.text('α', margin, logoY + 15);
    setTextStyle(doc, 28, 'bold', COLORS.white);
    doc.text('ALPHADATA', margin + 25, logoY + 15);
  }

  // Tagline
  setTextStyle(doc, 10, 'normal', COLORS.mediumGray);
  doc.text(T.TAGLINE, margin, logoY + 28);

  // === REPORT TITLE ===
  const titleY = logoY + 50;
  setTextStyle(doc, 9, 'bold', COLORS.mediumGray);
  doc.text(T.REPORT, margin, titleY);

  setTextStyle(doc, 22, 'bold', COLORS.white);
  const titleLines = doc.splitTextToSize(sanitizeText(data.reportTitle), pageWidth - 2 * margin);
  doc.text(titleLines, margin, titleY + 14);

  // === METADATA BAR ===
  const metaY = headerHeight + 12;
  doc.setFillColor(...COLORS.white);
  doc.roundedRect(margin, metaY, pageWidth - 2 * margin, 32, 4, 4, 'F');
  doc.setDrawColor(...COLORS.lightGray);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, metaY, pageWidth - 2 * margin, 32, 4, 4, 'S');

  const labelX = margin + 10;
  const metaTextY = metaY + 13;

  setTextStyle(doc, 8, 'bold', COLORS.muted);
  doc.text(T.TYPE, labelX, metaTextY);
  setTextStyle(doc, 9, 'normal', COLORS.dark);
  doc.text(sanitizeText(data.reportType), labelX + 16, metaTextY);

  setTextStyle(doc, 8, 'bold', COLORS.muted);
  doc.text(T.PERIOD, labelX + 65, metaTextY);
  setTextStyle(doc, 9, 'normal', COLORS.dark);
  doc.text(sanitizeText(data.reportPeriod) || T.CURRENT, labelX + 88, metaTextY);

  setTextStyle(doc, 8, 'bold', COLORS.muted);
  doc.text(T.GENERATED, labelX, metaTextY + 11);
  setTextStyle(doc, 9, 'normal', COLORS.dark);
  doc.text(formatDateTime(data.generatedAt, lang), labelX + 22, metaTextY + 11);

  if (data.isAiGenerated) {
    const badgeX = pageWidth - margin - 48;
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(badgeX, metaY + 10, 38, 13, 3, 3, 'F');
    setTextStyle(doc, 7, 'bold', COLORS.white);
    doc.text(T.AI_GENERATED, badgeX + 5, metaY + 18);
  }

  // === COMPANY INFO SECTION ===
  let yPos = metaY + 48;

  // Generating Company
  doc.setFillColor(...COLORS.brand);
  doc.roundedRect(margin, yPos, 4, 12, 1, 1, 'F');
  setTextStyle(doc, 11, 'bold', COLORS.dark);
  doc.text(T.GENERATING_COMPANY, margin + 10, yPos + 9);
  yPos += 18;

  setTextStyle(doc, 10, 'bold', COLORS.dark);
  doc.text(sanitizeText(data.generatingCompany.fullName), margin, yPos);
  yPos += 8;

  setTextStyle(doc, 9, 'normal', COLORS.darkGray);
  const descLines = doc.splitTextToSize(sanitizeText(data.generatingCompany.description), pageWidth - 2 * margin);
  doc.text(descLines, margin, yPos);
  yPos += descLines.length * 5 + 5;

  setTextStyle(doc, 8, 'normal', COLORS.muted);
  doc.text(`${T.CONTACT} ${sanitizeText(data.generatingCompany.contact)} | ${T.WEBSITE} ${sanitizeText(data.generatingCompany.website)} | ${T.ADDRESS} ${sanitizeText(data.generatingCompany.address)}`, margin, yPos);
  yPos += 14;

  // Country Info
  doc.setFillColor(...COLORS.success);
  doc.roundedRect(margin, yPos, 4, 12, 1, 1, 'F');
  setTextStyle(doc, 11, 'bold', COLORS.dark);
  doc.text(T.COUNTRY_INFO, margin + 10, yPos + 9);
  yPos += 18;

  doc.setFillColor(...COLORS.bgPrimary);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 22, 3, 3, 'F');

  const ciY = yPos + 9;
  const ciX = margin + 8;
  setTextStyle(doc, 8, 'bold', COLORS.muted);
  doc.text(T.COUNTRY, ciX, ciY);
  setTextStyle(doc, 8, 'normal', COLORS.dark);
  doc.text(sanitizeText(data.countryInfo.name), ciX + 18, ciY);

  setTextStyle(doc, 8, 'bold', COLORS.muted);
  doc.text(T.REGION, ciX + 80, ciY);
  setTextStyle(doc, 8, 'normal', COLORS.dark);
  doc.text(sanitizeText(data.countryInfo.region), ciX + 100, ciY);

  const ci2Y = ciY + 9;
  setTextStyle(doc, 8, 'bold', COLORS.muted);
  doc.text(T.CURRENCY, ciX, ci2Y);
  setTextStyle(doc, 8, 'normal', COLORS.dark);
  doc.text(sanitizeText(data.countryInfo.currency), ciX + 23, ci2Y);

  setTextStyle(doc, 8, 'bold', COLORS.muted);
  doc.text(T.LANGUAGE, ciX + 65, ci2Y);
  setTextStyle(doc, 8, 'normal', COLORS.dark);
  doc.text(sanitizeText(data.countryInfo.language), ciX + 85, ci2Y);

  setTextStyle(doc, 8, 'bold', COLORS.muted);
  doc.text(T.TIMEZONE, ciX + 115, ci2Y);
  setTextStyle(doc, 8, 'normal', COLORS.dark);
  doc.text(sanitizeText(data.countryInfo.timezone), ciX + 131, ci2Y);

  yPos += 28;

  // Requesting Company
  if (data.requestingCompany) {
    doc.setFillColor(...COLORS.warning);
    doc.roundedRect(margin, yPos, 4, 12, 1, 1, 'F');
    setTextStyle(doc, 11, 'bold', COLORS.dark);
    doc.text(T.REQUESTING_COMPANY, margin + 10, yPos + 9);
    yPos += 18;

    doc.setFillColor(...COLORS.bgPrimary);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 20, 3, 3, 'F');

    const rcY = yPos + 10;
    setTextStyle(doc, 8, 'bold', COLORS.muted);
    doc.text(T.COMPANY, margin + 8, rcY);
    setTextStyle(doc, 8, 'normal', COLORS.dark);
    doc.text(sanitizeText(data.requestingCompany.name), margin + 35, rcY);

    if (data.requestingCompany.nif) {
      setTextStyle(doc, 8, 'bold', COLORS.muted);
      doc.text(T.NIF, margin + 105, rcY);
      setTextStyle(doc, 8, 'normal', COLORS.dark);
      doc.text(sanitizeText(data.requestingCompany.nif), margin + 117, rcY);
    }

    yPos += 26;
  }

  // Requested By
  if (data.requestedBy) {
    doc.setFillColor(...COLORS.info);
    doc.roundedRect(margin, yPos, 4, 12, 1, 1, 'F');
    setTextStyle(doc, 11, 'bold', COLORS.dark);
    doc.text(T.REQUESTED_BY, margin + 10, yPos + 9);
    yPos += 18;

    doc.setFillColor(...COLORS.bgPrimary);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 14, 3, 3, 'F');

    const rbY = yPos + 9;
    setTextStyle(doc, 8, 'bold', COLORS.muted);
    doc.text(T.NAME, margin + 8, rbY);
    setTextStyle(doc, 8, 'normal', COLORS.dark);
    doc.text(sanitizeText(data.requestedBy.name), margin + 26, rbY);

    if (data.requestedBy.role) {
      setTextStyle(doc, 8, 'bold', COLORS.muted);
      doc.text(T.ROLE, margin + 85, rbY);
      setTextStyle(doc, 8, 'normal', COLORS.dark);
      doc.text(sanitizeText(data.requestedBy.role), margin + 103, rbY);
    }

    yPos += 20;
  }

  // Footer
  renderFooter(doc, lang);
};

// ============================================================================
// DATA SOURCES PAGE
// ============================================================================

const renderDataSourcesPage = (doc: jsPDF, data: CoverPageData): void => {
  doc.addPage();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = LAYOUT.MARGIN;
  const lang = data.language || 'pt';
  const T = getCoverTranslation(lang);

  // Header bar
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, pageWidth, 60, 'F');

  if (data.logoBase64) {
    try {
      doc.addImage(data.logoBase64, 'PNG', margin, 14, 16, 16);
      setTextStyle(doc, 22, 'bold', COLORS.white);
      doc.text('ALPHADATA', margin + 22, 28);
    } catch {
      setTextStyle(doc, 36, 'bold', COLORS.brand);
      doc.text('α', margin, 32);
      setTextStyle(doc, 22, 'bold', COLORS.white);
      doc.text('ALPHADATA', margin + 22, 32);
    }
  } else {
    setTextStyle(doc, 36, 'bold', COLORS.brand);
    doc.text('α', margin, 32);
    setTextStyle(doc, 22, 'bold', COLORS.white);
    doc.text('ALPHADATA', margin + 22, 32);
  }

  setTextStyle(doc, 10, 'normal', COLORS.lightGray);
  doc.text(T.DATA_SOURCES_PAGE_TITLE, margin, 46);

  let yPos = 75;

  // Section title
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(margin, yPos, 4, 12, 1, 1, 'F');
  setTextStyle(doc, 11, 'bold', COLORS.dark);
  doc.text(T.DATA_SOURCES, margin + 10, yPos + 9);
  yPos += 22;

  // Intro text
  setTextStyle(doc, 9, 'normal', COLORS.darkGray);
  const introLines = doc.splitTextToSize(T.DATA_SOURCES_INTRO, pageWidth - 2 * margin);
  doc.text(introLines, margin, yPos);
  yPos += introLines.length * 5 + 14;

  // Data sources cards
  data.dataSources.forEach((source, index) => {
    const cardHeight = 30;
    if (yPos + cardHeight + 10 > doc.internal.pageSize.getHeight() - LAYOUT.FOOTER_HEIGHT - margin) {
      renderFooter(doc, lang);
      doc.addPage();
      yPos = margin;
    }

    doc.setFillColor(...COLORS.white);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, cardHeight, 4, 4, 'F');
    doc.setDrawColor(...COLORS.lightGray);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, cardHeight, 4, 4, 'S');

    // Number badge
    const badgeX = margin + 10;
    const badgeY = yPos + 15;
    doc.setFillColor(...COLORS.primary);
    doc.circle(badgeX, badgeY, 8, 'F');
    setTextStyle(doc, 10, 'bold', COLORS.white);
    doc.text(`${index + 1}`, badgeX, badgeY + 3, { align: 'center' });

    // Source name
    setTextStyle(doc, 10, 'bold', COLORS.dark);
    doc.text(sanitizeText(source.name), margin + 24, yPos + 11);

    // Type badge
    const typeText = `[${sanitizeText(source.type)}]`;
    const typeWidth = doc.getTextWidth(typeText) + 8;
    const typeBadgeX = pageWidth - margin - typeWidth - 6;
    doc.setFillColor(...COLORS.brand);
    doc.roundedRect(typeBadgeX, yPos + 5, typeWidth, 10, 2, 2, 'F');
    setTextStyle(doc, 7, 'bold', COLORS.white);
    doc.text(typeText, typeBadgeX + 4, yPos + 12);

    // Description
    setTextStyle(doc, 8, 'normal', COLORS.darkGray);
    doc.text(sanitizeText(source.description), margin + 24, yPos + 21);

    yPos += cardHeight + 8;
  });

  // Quality note
  yPos += 8;
  doc.setFillColor(235, 248, 255);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 24, 4, 4, 'F');

  setTextStyle(doc, 8, 'bold', COLORS.primary);
  doc.text(T.DATA_QUALITY_TITLE, margin + 8, yPos + 9);
  setTextStyle(doc, 8, 'normal', COLORS.darkGray);
  const noteLines = doc.splitTextToSize(sanitizeText(T.DATA_QUALITY_NOTE), pageWidth - 2 * margin - 16);
  doc.text(noteLines, margin + 8, yPos + 17);

  renderFooter(doc, lang);
};

// ============================================================================
// FOOTER
// ============================================================================

const renderFooter = (doc: jsPDF, lang: DocumentLanguageCode = 'pt'): void => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const T = getCoverTranslation(lang);

  doc.setFillColor(...COLORS.dark);
  doc.rect(0, pageHeight - LAYOUT.FOOTER_HEIGHT, pageWidth, LAYOUT.FOOTER_HEIGHT, 'F');

  doc.setDrawColor(...COLORS.brand);
  doc.setLineWidth(LAYOUT.LINE_WIDTH_MEDIUM);
  doc.line(0, pageHeight - LAYOUT.FOOTER_HEIGHT, pageWidth, pageHeight - LAYOUT.FOOTER_HEIGHT);

  setTextStyle(doc, 8, 'normal', COLORS.mediumGray);
  doc.text(sanitizeText(T.CONFIDENTIAL_NOTICE), pageWidth / 2, pageHeight - 16, { align: 'center' });

  setTextStyle(doc, 8, 'bold', COLORS.brand);
  doc.text(T.CONFIDENTIAL_HEADER, pageWidth / 2, pageHeight - 8, { align: 'center' });
};

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

export const addCoverPageToPDF = (doc: jsPDF, data: CoverPageData): void => {
  try {
    validateCoverPageData(data);

    doc.setProperties({
      title: sanitizeText(data.reportTitle),
      subject: sanitizeText(data.reportType),
      author: sanitizeText(data.generatingCompany.name),
      keywords: 'AlphaData, Oil, Angola, Report',
      creator: 'AlphaData Platform',
    });

    renderCoverPage(doc, data);
    renderDataSourcesPage(doc, data);

  } catch (error) {
    console.error('Error generating cover page:', error);
    throw new Error(`Failed to generate cover page: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// ============================================================================
// DOCX & EXCEL EXPORTS
// ============================================================================

export const getCoverPageDOCXContent = (data: CoverPageData) => {
  validateCoverPageData(data);
  return {
    title: data.reportTitle,
    type: data.reportType,
    period: data.reportPeriod,
    generatedAt: data.generatedAt,
    isAiGenerated: data.isAiGenerated,
    generatingCompany: data.generatingCompany,
    dataSources: data.dataSources,
    countryInfo: data.countryInfo,
    requestingCompany: data.requestingCompany,
    requestedBy: data.requestedBy,
  };
};

const escapeXml = (str: string): string => {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
};

const addExcelRow = (
  styleId: string,
  label: string,
  value?: string,
  isHeader: boolean = false
): string => {
  if (isHeader) {
    return `<Row><Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(label)}</Data></Cell></Row>`;
  }
  if (value !== undefined) {
    return `<Row><Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(label)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell></Row>`;
  }
  return `<Row><Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(label)}</Data></Cell></Row>`;
};

const addExcelSeparator = (): string => `<Row></Row>`;

const addExcelDivider = (styleId: string = 'brand'): string => {
  return `<Row><Cell ss:StyleID="${styleId}"><Data ss:Type="String">===============================================================</Data></Cell></Row>`;
};

export const getCoverPageExcelRows = (data: CoverPageData): string[] => {
  validateCoverPageData(data);
  const lang = data.language || 'pt';
  const T = getCoverTranslation(lang);

  const rows: string[] = [];

  rows.push(addExcelDivider());
  rows.push(addExcelRow('brand', `a ALPHADATA - ${T.INFO_PAGE}`, undefined, true));
  rows.push(addExcelDivider());
  rows.push(addExcelSeparator());

  rows.push(addExcelRow('subheader', T.GENERATING_COMPANY, undefined, true));
  rows.push(addExcelRow('bold', T.NAME, data.generatingCompany.fullName));
  rows.push(addExcelRow('bold', T.DESCRIPTION, data.generatingCompany.description));
  rows.push(addExcelRow('bold', T.CONTACT, data.generatingCompany.contact));
  rows.push(addExcelRow('bold', T.WEBSITE, data.generatingCompany.website));
  rows.push(addExcelRow('bold', T.ADDRESS, data.generatingCompany.address));
  rows.push(addExcelSeparator());

  rows.push(addExcelRow('subheader', T.DATA_SOURCES, undefined, true));
  rows.push(
    `<Row><Cell ss:StyleID="tableHeader"><Data ss:Type="String">${T.SOURCE}</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">${T.SOURCE_TYPE}</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">${T.SOURCE_DESC}</Data></Cell></Row>`
  );
  data.dataSources.forEach((source) => {
    rows.push(
      `<Row><Cell><Data ss:Type="String">${escapeXml(source.name)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(source.type)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(source.description)}</Data></Cell></Row>`
    );
  });
  rows.push(addExcelSeparator());

  rows.push(addExcelRow('subheader', T.COUNTRY_INFO, undefined, true));
  rows.push(addExcelRow('bold', T.COUNTRY, data.countryInfo.name));
  rows.push(addExcelRow('bold', T.REGION, data.countryInfo.region));
  rows.push(addExcelRow('bold', T.CURRENCY, data.countryInfo.currency));
  rows.push(addExcelRow('bold', T.LANGUAGE, data.countryInfo.language));
  rows.push(addExcelRow('bold', T.TIMEZONE, data.countryInfo.timezone));
  rows.push(addExcelSeparator());

  if (data.requestingCompany) {
    rows.push(addExcelRow('subheader', T.REQUESTING_COMPANY, undefined, true));
    rows.push(addExcelRow('bold', T.COMPANY, data.requestingCompany.name));
    if (data.requestingCompany.nif) rows.push(addExcelRow('bold', T.NIF, data.requestingCompany.nif));
    if (data.requestingCompany.sector) rows.push(addExcelRow('bold', T.SECTOR, data.requestingCompany.sector));
    if (data.requestingCompany.country) rows.push(addExcelRow('bold', T.COUNTRY, data.requestingCompany.country));
    rows.push(addExcelSeparator());
  }

  if (data.requestedBy) {
    rows.push(addExcelRow('subheader', T.REQUESTED_BY, undefined, true));
    rows.push(addExcelRow('bold', T.NAME, data.requestedBy.name));
    if (data.requestedBy.role) rows.push(addExcelRow('bold', T.ROLE, data.requestedBy.role));
    if (data.requestedBy.email) rows.push(addExcelRow('bold', T.EMAIL, data.requestedBy.email));
    rows.push(addExcelSeparator());
  }

  rows.push(addExcelRow('subheader', T.REPORT_INFO, undefined, true));
  rows.push(addExcelRow('bold', T.TITLE_LABEL, data.reportTitle));
  rows.push(addExcelRow('bold', T.TYPE, data.reportType));
  rows.push(addExcelRow('bold', T.PERIOD, data.reportPeriod || T.CURRENT));
  rows.push(addExcelRow('bold', T.GENERATED, formatDateTime(data.generatedAt, lang)));
  if (data.isAiGenerated) {
    rows.push(addExcelRow('bold', T.METHOD, T.AI_METHOD));
  }
  rows.push(addExcelSeparator());

  rows.push(addExcelDivider());
  rows.push(addExcelRow('footer', T.END_INFO_PAGE, undefined, true));
  rows.push(addExcelDivider());
  rows.push(addExcelSeparator());
  rows.push(addExcelSeparator());

  return rows;
};
