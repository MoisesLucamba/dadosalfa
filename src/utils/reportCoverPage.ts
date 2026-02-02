/**
 * Cover page generator for reports
 * Adds informative first page with AlphaData data, sources, country info, and requester details
 */

import jsPDF from 'jspdf';

export interface CoverPageData {
  // AlphaData (generating company) info
  generatingCompany: {
    name: string;
    fullName: string;
    description: string;
    contact: string;
    website: string;
    address: string;
  };
  // Data sources
  dataSources: {
    name: string;
    type: string;
    description: string;
  }[];
  // Country/Local info
  countryInfo: {
    name: string;
    region: string;
    currency: string;
    language: string;
    timezone: string;
  };
  // Requesting company info
  requestingCompany?: {
    name: string;
    nif?: string;
    sector?: string;
    country?: string;
  };
  // Employee who requested
  requestedBy?: {
    name: string;
    role?: string;
    email?: string;
  };
  // Report info
  reportTitle: string;
  reportType: string;
  reportPeriod: string;
  generatedAt: Date;
  isAiGenerated: boolean;
}

const COLORS = {
  primary: [30, 64, 175] as [number, number, number],
  brand: [220, 38, 38] as [number, number, number],
  dark: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  light: [241, 245, 249] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
};

export const getDefaultCoverPageData = (): Omit<CoverPageData, 'reportTitle' | 'reportType' | 'reportPeriod' | 'generatedAt' | 'isAiGenerated'> => ({
  generatingCompany: {
    name: 'AlphaData',
    fullName: 'AlphaData - Inteligência de Mercado Petrolífero Angolano',
    description: 'Plataforma líder em análise de dados e inteligência artificial para o sector petrolífero de Angola. Fornecemos insights estratégicos, previsões de mercado e análises de risco em tempo real.',
    contact: 'info@alphadata.ao',
    website: 'www.alphadata.ao',
    address: 'Luanda, Angola',
  },
  dataSources: [
    {
      name: 'BPEP - Bureau de Pesquisa Energética e Petrolífera',
      type: 'Oficial',
      description: 'Dados oficiais de produção e exportação do sector petrolífero angolano',
    },
    {
      name: 'ANP - Agência Nacional do Petróleo',
      type: 'Regulador',
      description: 'Informações regulatórias e licenciamento de operações',
    },
    {
      name: 'Ministério dos Recursos Minerais e Petróleo',
      type: 'Governamental',
      description: 'Políticas e directivas do sector energético',
    },
    {
      name: 'APIs de Mercado Internacional',
      type: 'Mercado',
      description: 'Cotações Brent, WTI e futuros de petróleo em tempo real',
    },
    {
      name: 'AlphaData AI Engine',
      type: 'IA',
      description: 'Modelos proprietários de previsão e análise de tendências',
    },
  ],
  countryInfo: {
    name: 'República de Angola',
    region: 'África Subsaariana',
    currency: 'Kwanza (AOA)',
    language: 'Português',
    timezone: 'WAT (UTC+1)',
  },
});

/**
 * Add cover page to PDF document
 */
export const addCoverPageToPDF = (
  doc: jsPDF,
  data: CoverPageData
): void => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = 0;

  // Background gradient effect
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, pageWidth, 120, 'F');

  // Brand header
  doc.setTextColor(...COLORS.brand);
  doc.setFontSize(48);
  doc.setFont('helvetica', 'bold');
  doc.text('α', margin, 45);

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(36);
  doc.text('ALPHADATA', margin + 25, 45);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Inteligência de Mercado Petrolífero Angolano', margin, 60);

  // Decorative line
  doc.setDrawColor(...COLORS.brand);
  doc.setLineWidth(3);
  doc.line(margin, 75, margin + 60, 75);

  // Report title
  doc.setFontSize(12);
  doc.setTextColor(200, 200, 200);
  doc.text('RELATÓRIO', margin, 95);

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(data.reportTitle, pageWidth - 2 * margin);
  doc.text(titleLines, margin, 108);

  yPos = 135;

  // Report metadata box
  doc.setFillColor(...COLORS.light);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 30, 4, 4, 'F');

  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const metaY = yPos + 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Tipo:', margin + 10, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.reportType, margin + 28, metaY);

  doc.setFont('helvetica', 'bold');
  doc.text('Período:', margin + 70, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.reportPeriod || 'Actual', margin + 92, metaY);

  doc.setFont('helvetica', 'bold');
  doc.text('Gerado:', margin + 10, metaY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.generatedAt.toLocaleDateString('pt-AO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }), margin + 32, metaY + 10);

  if (data.isAiGenerated) {
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(pageWidth - margin - 35, yPos + 8, 30, 14, 2, 2, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(7);
    doc.text('✨ Gerado com IA', pageWidth - margin - 33, yPos + 17);
  }

  yPos += 45;

  // Section: Generating Company (AlphaData)
  doc.setFillColor(...COLORS.brand);
  doc.rect(margin, yPos, 4, 12, 'F');
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('EMPRESA GERADORA', margin + 8, yPos + 9);
  yPos += 18;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(data.generatingCompany.name, margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  doc.text(' - ' + data.generatingCompany.fullName, margin + 25, yPos);
  yPos += 6;

  const descLines = doc.splitTextToSize(data.generatingCompany.description, pageWidth - 2 * margin);
  doc.setTextColor(...COLORS.dark);
  doc.text(descLines, margin, yPos);
  yPos += descLines.length * 4 + 4;

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(`📧 ${data.generatingCompany.contact}  |  🌐 ${data.generatingCompany.website}  |  📍 ${data.generatingCompany.address}`, margin, yPos);
  yPos += 12;

  // Section: Data Sources
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, yPos, 4, 12, 'F');
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FONTES DE DADOS', margin + 8, yPos + 9);
  yPos += 18;

  data.dataSources.forEach((source) => {
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 14, 2, 2, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text(source.name, margin + 4, yPos + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.setFontSize(7);
    doc.text(`[${source.type}] ${source.description}`, margin + 4, yPos + 11);

    yPos += 16;
  });
  yPos += 5;

  // Section: Country Info
  doc.setFillColor(...COLORS.success);
  doc.rect(margin, yPos, 4, 12, 'F');
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMAÇÕES DO PAÍS', margin + 8, yPos + 9);
  yPos += 18;

  doc.setFillColor(...COLORS.light);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 22, 2, 2, 'F');

  doc.setFontSize(9);
  const countryY = yPos + 8;
  doc.setFont('helvetica', 'bold');
  doc.text('País:', margin + 5, countryY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.countryInfo.name, margin + 22, countryY);

  doc.setFont('helvetica', 'bold');
  doc.text('Região:', margin + 80, countryY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.countryInfo.region, margin + 100, countryY);

  doc.setFont('helvetica', 'bold');
  doc.text('Moeda:', margin + 5, countryY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(data.countryInfo.currency, margin + 25, countryY + 8);

  doc.setFont('helvetica', 'bold');
  doc.text('Idioma:', margin + 60, countryY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(data.countryInfo.language, margin + 80, countryY + 8);

  doc.setFont('helvetica', 'bold');
  doc.text('Fuso:', margin + 115, countryY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(data.countryInfo.timezone, margin + 130, countryY + 8);

  yPos += 30;

  // Section: Requesting Company (if available)
  if (data.requestingCompany) {
    doc.setFillColor(180, 130, 50);
    doc.rect(margin, yPos, 4, 12, 'F');
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('EMPRESA SOLICITANTE', margin + 8, yPos + 9);
    yPos += 18;

    doc.setFillColor(...COLORS.light);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 20, 2, 2, 'F');

    doc.setFontSize(9);
    const reqY = yPos + 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Empresa:', margin + 5, reqY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.requestingCompany.name, margin + 30, reqY);

    if (data.requestingCompany.nif) {
      doc.setFont('helvetica', 'bold');
      doc.text('NIF:', margin + 100, reqY);
      doc.setFont('helvetica', 'normal');
      doc.text(data.requestingCompany.nif, margin + 112, reqY);
    }

    if (data.requestingCompany.sector) {
      doc.setFont('helvetica', 'bold');
      doc.text('Sector:', margin + 5, reqY + 8);
      doc.setFont('helvetica', 'normal');
      doc.text(data.requestingCompany.sector, margin + 25, reqY + 8);
    }

    if (data.requestingCompany.country) {
      doc.setFont('helvetica', 'bold');
      doc.text('País:', margin + 80, reqY + 8);
      doc.setFont('helvetica', 'normal');
      doc.text(data.requestingCompany.country, margin + 95, reqY + 8);
    }

    yPos += 28;
  }

  // Section: Requested By (if available)
  if (data.requestedBy) {
    doc.setFillColor(100, 100, 180);
    doc.rect(margin, yPos, 4, 12, 'F');
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('SOLICITADO POR', margin + 8, yPos + 9);
    yPos += 18;

    doc.setFillColor(...COLORS.light);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 14, 2, 2, 'F');

    doc.setFontSize(9);
    const byY = yPos + 9;
    doc.setFont('helvetica', 'bold');
    doc.text('Nome:', margin + 5, byY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.requestedBy.name, margin + 22, byY);

    if (data.requestedBy.role) {
      doc.setFont('helvetica', 'bold');
      doc.text('Cargo:', margin + 80, byY);
      doc.setFont('helvetica', 'normal');
      doc.text(data.requestedBy.role, margin + 98, byY);
    }

    if (data.requestedBy.email) {
      doc.setFont('helvetica', 'bold');
      doc.text('Email:', margin + 140, byY);
      doc.setFont('helvetica', 'normal');
      doc.text(data.requestedBy.email, margin + 155, byY);
    }

    yPos += 20;
  }

  // Footer confidentiality notice
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');

  doc.setTextColor(180, 180, 180);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Este documento contém informações confidenciais. A sua distribuição está restrita a destinatários autorizados.', pageWidth / 2, pageHeight - 15, { align: 'center' });

  doc.setTextColor(...COLORS.brand);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENCIAL - USO INTERNO', pageWidth / 2, pageHeight - 8, { align: 'center' });
};

/**
 * Get cover page content for DOCX
 */
export const getCoverPageDOCXContent = (data: CoverPageData) => {
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

/**
 * Get cover page rows for Excel
 */
export const getCoverPageExcelRows = (data: CoverPageData): string[] => {
  const escapeXml = (str: string): string => {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const rows: string[] = [];

  // Title section
  rows.push(`<Row><Cell ss:StyleID="brand"><Data ss:Type="String">═══════════════════════════════════════════════════════════════</Data></Cell></Row>`);
  rows.push(`<Row><Cell ss:StyleID="brand"><Data ss:Type="String">α ALPHADATA - PÁGINA INFORMATIVA</Data></Cell></Row>`);
  rows.push(`<Row><Cell ss:StyleID="brand"><Data ss:Type="String">═══════════════════════════════════════════════════════════════</Data></Cell></Row>`);
  rows.push(`<Row></Row>`);

  // Generating Company
  rows.push(`<Row><Cell ss:StyleID="subheader"><Data ss:Type="String">EMPRESA GERADORA</Data></Cell></Row>`);
  rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">Nome:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.generatingCompany.fullName)}</Data></Cell></Row>`);
  rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">Descrição:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.generatingCompany.description)}</Data></Cell></Row>`);
  rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">Contacto:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.generatingCompany.contact)}</Data></Cell></Row>`);
  rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">Website:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.generatingCompany.website)}</Data></Cell></Row>`);
  rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">Endereço:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.generatingCompany.address)}</Data></Cell></Row>`);
  rows.push(`<Row></Row>`);

  // Data Sources
  rows.push(`<Row><Cell ss:StyleID="subheader"><Data ss:Type="String">FONTES DE DADOS</Data></Cell></Row>`);
  rows.push(`<Row><Cell ss:StyleID="tableHeader"><Data ss:Type="String">Fonte</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">Tipo</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">Descrição</Data></Cell></Row>`);
  data.dataSources.forEach((source) => {
    rows.push(`<Row><Cell><Data ss:Type="String">${escapeXml(source.name)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(source.type)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(source.description)}</Data></Cell></Row>`);
  });
  rows.push(`<Row></Row>`);

  // Country Info
  rows.push(`<Row><Cell ss:StyleID="subheader"><Data ss:Type="String">INFORMAÇÕES DO PAÍS</Data></Cell></Row>`);
  rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">País:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.countryInfo.name)}</Data></Cell></Row>`);
  rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">Região:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.countryInfo.region)}</Data></Cell></Row>`);
  rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">Moeda:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.countryInfo.currency)}</Data></Cell></Row>`);
  rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">Idioma:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.countryInfo.language)}</Data></Cell></Row>`);
  rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">Fuso Horário:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.countryInfo.timezone)}</Data></Cell></Row>`);
  rows.push(`<Row></Row>`);

  // Requesting Company
  if (data.requestingCompany) {
    rows.push(`<Row><Cell ss:StyleID="subheader"><Data ss:Type="String">EMPRESA SOLICITANTE</Data></Cell></Row>`);
    rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">Empresa:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.requestingCompany.name)}</Data></Cell></Row>`);
    if (data.requestingCompany.nif) {
      rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">NIF:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.requestingCompany.nif)}</Data></Cell></Row>`);
    }
    if (data.requestingCompany.sector) {
      rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">Sector:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.requestingCompany.sector)}</Data></Cell></Row>`);
    }
    if (data.requestingCompany.country) {
      rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">País:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.requestingCompany.country)}</Data></Cell></Row>`);
    }
    rows.push(`<Row></Row>`);
  }

  // Requested By
  if (data.requestedBy) {
    rows.push(`<Row><Cell ss:StyleID="subheader"><Data ss:Type="String">SOLICITADO POR</Data></Cell></Row>`);
    rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">Nome:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.requestedBy.name)}</Data></Cell></Row>`);
    if (data.requestedBy.role) {
      rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">Cargo:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.requestedBy.role)}</Data></Cell></Row>`);
    }
    if (data.requestedBy.email) {
      rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">Email:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.requestedBy.email)}</Data></Cell></Row>`);
    }
    rows.push(`<Row></Row>`);
  }

  // Report Info
  rows.push(`<Row><Cell ss:StyleID="subheader"><Data ss:Type="String">INFORMAÇÕES DO RELATÓRIO</Data></Cell></Row>`);
  rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">Título:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.reportTitle)}</Data></Cell></Row>`);
  rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">Tipo:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.reportType)}</Data></Cell></Row>`);
  rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">Período:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.reportPeriod || 'Actual')}</Data></Cell></Row>`);
  rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">Gerado em:</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.generatedAt.toLocaleString('pt-AO'))}</Data></Cell></Row>`);
  if (data.isAiGenerated) {
    rows.push(`<Row><Cell ss:StyleID="bold"><Data ss:Type="String">Método:</Data></Cell><Cell><Data ss:Type="String">✨ Gerado com Inteligência Artificial</Data></Cell></Row>`);
  }
  rows.push(`<Row></Row>`);

  // Separator
  rows.push(`<Row><Cell ss:StyleID="brand"><Data ss:Type="String">═══════════════════════════════════════════════════════════════</Data></Cell></Row>`);
  rows.push(`<Row><Cell ss:StyleID="footer"><Data ss:Type="String">FIM DA PÁGINA INFORMATIVA - INÍCIO DO CONTEÚDO DO RELATÓRIO</Data></Cell></Row>`);
  rows.push(`<Row><Cell ss:StyleID="brand"><Data ss:Type="String">═══════════════════════════════════════════════════════════════</Data></Cell></Row>`);
  rows.push(`<Row></Row>`);
  rows.push(`<Row></Row>`);

  return rows;
};
