import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type for autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

interface RiskScore {
  category: string;
  score: number;
  trend: string;
  description: string;
}

interface RiskAlert {
  alert_type: string;
  title: string;
  description: string;
  impact: string;
  region: string;
}

interface CountryRisk {
  country: string;
  score: number;
  trend: string;
}

interface GeopoliticalForecast {
  region: string;
  situation: string;
  impact_on_oil: string;
  prediction_30d: string;
  prediction_90d: string;
  risk_level: string;
  key_indicators: string[];
}

interface SimulationParams {
  royaltyChange: number;
  taxChange: number;
  environmentalCompliance: number;
  opepQuotaChange: number;
  brentPriceScenario: number;
  currencyDevaluation: number;
}

interface SimulationResults {
  revenueImpact: number;
  productionCostImpact: number;
  netProfitImpact: number;
  exportVolumeImpact: number;
  governmentTakeChange: number;
  breakEvenPrice: number;
}

interface PDFData {
  riskScores: RiskScore[];
  alerts: RiskAlert[];
  countryRisks: CountryRisk[];
  geopoliticalForecasts: GeopoliticalForecast[];
  globalRiskIndex: number;
  simulationParams?: SimulationParams;
  simulationResults?: SimulationResults;
  lastUpdated?: string;
}

const COLORS = {
  primary: [30, 64, 175] as [number, number, number], // Blue
  success: [34, 197, 94] as [number, number, number], // Green
  warning: [245, 158, 11] as [number, number, number], // Amber
  danger: [239, 68, 68] as [number, number, number], // Red
  dark: [15, 23, 42] as [number, number, number], // Slate 900
  muted: [100, 116, 139] as [number, number, number], // Slate 500
  light: [241, 245, 249] as [number, number, number], // Slate 100
};

const getRiskColor = (score: number): [number, number, number] => {
  if (score >= 70) return COLORS.danger;
  if (score >= 50) return COLORS.warning;
  return COLORS.success;
};

const getTrendSymbol = (trend: string): string => {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return '→';
};

export const generateRiskPDF = (data: PDFData): void => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Helper function to add new page if needed
  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      addHeader();
    }
  };

  // Add header with logo and title
  const addHeader = () => {
    doc.setFillColor(...COLORS.dark);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('AlphaData', margin, 18);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório de Análise Geopolítica e Riscos', margin, 28);
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-PT', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, pageWidth - margin - 80, 28);
    
    yPos = 45;
  };

  // Add footer
  const addFooter = () => {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFillColor(...COLORS.light);
      doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
      
      doc.setTextColor(...COLORS.muted);
      doc.setFontSize(8);
      doc.text('AlphaData - Inteligência de Mercado Petrolífero', margin, pageHeight - 6);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 6);
      doc.text('CONFIDENCIAL', pageWidth / 2, pageHeight - 6, { align: 'center' });
    }
  };

  // Section title helper
  const addSectionTitle = (title: string, icon?: string) => {
    checkNewPage(20);
    doc.setFillColor(...COLORS.primary);
    doc.rect(margin, yPos, 3, 10, 'F');
    
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${icon ? icon + ' ' : ''}${title}`, margin + 6, yPos + 7);
    yPos += 15;
  };

  // Start PDF generation
  addHeader();

  // Executive Summary
  addSectionTitle('Sumário Executivo');
  
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const summaryText = `Este relatório apresenta uma análise abrangente dos riscos geopolíticos, regulatórios e fiscais que afetam o setor petrolífero angolano. O Índice de Risco Global atual é de ${data.globalRiskIndex}/100, classificado como ${data.globalRiskIndex >= 70 ? 'ELEVADO' : data.globalRiskIndex >= 50 ? 'MODERADO' : 'BAIXO'}.`;
  
  const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 2 * margin);
  doc.text(splitSummary, margin, yPos);
  yPos += splitSummary.length * 5 + 10;

  // Global Risk Index Card
  checkNewPage(30);
  doc.setFillColor(...getRiskColor(data.globalRiskIndex));
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ÍNDICE DE RISCO GLOBAL', margin + 10, yPos + 10);
  
  doc.setFontSize(24);
  doc.text(`${data.globalRiskIndex}/100`, pageWidth - margin - 30, yPos + 16);
  
  yPos += 35;

  // Risk Scores Table
  if (data.riskScores && data.riskScores.length > 0) {
    addSectionTitle('Perfil de Risco por Categoria');
    
    const riskTableData = data.riskScores.map(risk => [
      risk.category,
      `${risk.score}/100`,
      getTrendSymbol(risk.trend),
      risk.description || '-'
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Categoria', 'Score', 'Tendência', 'Descrição']],
      body: riskTableData,
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: COLORS.dark,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: COLORS.dark,
      },
      alternateRowStyles: {
        fillColor: COLORS.light,
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 'auto' },
      },
    });

    yPos = doc.lastAutoTable.finalY + 15;
  }

  // Geopolitical Forecasts
  if (data.geopoliticalForecasts && data.geopoliticalForecasts.length > 0) {
    addSectionTitle('Previsões Geopolíticas');
    
    data.geopoliticalForecasts.forEach((forecast, index) => {
      checkNewPage(60);
      
      // Region header
      const riskLevelColor = forecast.risk_level === 'critical' ? COLORS.danger : 
                             forecast.risk_level === 'high' ? COLORS.warning : COLORS.success;
      
      doc.setFillColor(...riskLevelColor);
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 8, 2, 2, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(forecast.region.toUpperCase(), margin + 5, yPos + 5.5);
      
      const riskLabel = forecast.risk_level === 'critical' ? 'CRÍTICO' : 
                        forecast.risk_level === 'high' ? 'ALTO' : 
                        forecast.risk_level === 'medium' ? 'MÉDIO' : 'BAIXO';
      doc.text(`Risco: ${riskLabel}`, pageWidth - margin - 30, yPos + 5.5);
      
      yPos += 12;
      
      // Situation
      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Situação Actual:', margin, yPos);
      yPos += 4;
      
      doc.setFont('helvetica', 'normal');
      const situationLines = doc.splitTextToSize(forecast.situation, pageWidth - 2 * margin);
      doc.text(situationLines, margin, yPos);
      yPos += situationLines.length * 4 + 3;
      
      // Impact on Oil
      doc.setFont('helvetica', 'bold');
      doc.text('Impacto no Petróleo:', margin, yPos);
      yPos += 4;
      
      doc.setFont('helvetica', 'normal');
      const impactLines = doc.splitTextToSize(forecast.impact_on_oil, pageWidth - 2 * margin);
      doc.text(impactLines, margin, yPos);
      yPos += impactLines.length * 4 + 3;
      
      // Predictions table
      doc.autoTable({
        startY: yPos,
        head: [['Horizonte', 'Previsão']],
        body: [
          ['30 dias', forecast.prediction_30d],
          ['90 dias', forecast.prediction_90d],
        ],
        margin: { left: margin, right: margin },
        headStyles: {
          fillColor: COLORS.primary,
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 25 },
        },
      });
      
      yPos = doc.lastAutoTable.finalY + 10;
    });
  }

  // Active Alerts
  if (data.alerts && data.alerts.length > 0) {
    addSectionTitle('Alertas Activos');
    
    const alertsTableData = data.alerts.map(alert => [
      alert.alert_type === 'critical' ? '🔴' : alert.alert_type === 'warning' ? '🟠' : '🔵',
      alert.title,
      alert.region || '-',
      alert.impact === 'high' ? 'Alto' : alert.impact === 'medium' ? 'Médio' : 'Baixo',
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['', 'Alerta', 'Região', 'Impacto']],
      body: alertsTableData,
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: COLORS.danger,
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 70 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25, halign: 'center' },
      },
    });

    yPos = doc.lastAutoTable.finalY + 15;
  }

  // Country Risk Comparison
  if (data.countryRisks && data.countryRisks.length > 0) {
    addSectionTitle('Comparativo de Risco por País');
    
    const countryTableData = data.countryRisks.map(cr => [
      cr.country,
      `${cr.score}/100`,
      getTrendSymbol(cr.trend),
      cr.score >= 70 ? 'Elevado' : cr.score >= 50 ? 'Moderado' : 'Baixo',
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['País', 'Score', 'Tendência', 'Classificação']],
      body: countryTableData,
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: COLORS.dark,
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 35, halign: 'center' },
      },
    });

    yPos = doc.lastAutoTable.finalY + 15;
  }

  // Simulation Results
  if (data.simulationParams && data.simulationResults) {
    doc.addPage();
    yPos = margin;
    addHeader();
    
    addSectionTitle('Simulação de Impacto Regulatório');
    
    // Parameters
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Parâmetros da Simulação:', margin, yPos);
    yPos += 8;
    
    const params = data.simulationParams;
    const paramsData = [
      ['Alteração Royalties', `${params.royaltyChange > 0 ? '+' : ''}${params.royaltyChange}%`],
      ['Alteração Impostos', `${params.taxChange > 0 ? '+' : ''}${params.taxChange}%`],
      ['Custos Ambientais', `+${params.environmentalCompliance}%`],
      ['Quota OPEP+', `${params.opepQuotaChange > 0 ? '+' : ''}${params.opepQuotaChange}%`],
      ['Preço Brent', `$${params.brentPriceScenario}/bbl`],
      ['Desvalorização Cambial', `+${params.currencyDevaluation}%`],
    ];

    doc.autoTable({
      startY: yPos,
      body: paramsData,
      margin: { left: margin, right: margin },
      theme: 'grid',
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { halign: 'right', cellWidth: 30 },
      },
    });

    yPos = doc.lastAutoTable.finalY + 15;
    
    // Results
    doc.setFont('helvetica', 'bold');
    doc.text('Resultados da Simulação:', margin, yPos);
    yPos += 8;
    
    const results = data.simulationResults;
    const resultsData = [
      ['Impacto na Receita', `${results.revenueImpact > 0 ? '+' : ''}${results.revenueImpact.toFixed(1)}%`],
      ['Impacto nos Custos', `${results.productionCostImpact > 0 ? '+' : ''}${results.productionCostImpact.toFixed(1)}%`],
      ['Impacto no Lucro Líquido', `${results.netProfitImpact > 0 ? '+' : ''}${results.netProfitImpact.toFixed(1)}%`],
      ['Impacto nas Exportações', `${results.exportVolumeImpact > 0 ? '+' : ''}${results.exportVolumeImpact.toFixed(1)}%`],
      ['Alteração Government Take', `${results.governmentTakeChange > 0 ? '+' : ''}${results.governmentTakeChange.toFixed(0)}pp`],
      ['Break-Even Price', `$${results.breakEvenPrice.toFixed(0)}/bbl`],
    ];

    doc.autoTable({
      startY: yPos,
      body: resultsData,
      margin: { left: margin, right: margin },
      theme: 'grid',
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { halign: 'right', cellWidth: 30 },
      },
      didParseCell: function(data: any) {
        if (data.column.index === 1 && data.section === 'body') {
          const val = parseFloat(data.cell.text[0]);
          if (!isNaN(val)) {
            if (data.row.index === 1) { // Costs - inverted
              data.cell.styles.textColor = val > 0 ? COLORS.danger : COLORS.success;
            } else if (data.row.index < 4) {
              data.cell.styles.textColor = val > 0 ? COLORS.success : COLORS.danger;
            }
          }
        }
      },
    });

    yPos = doc.lastAutoTable.finalY + 15;
  }

  // Disclaimer
  checkNewPage(30);
  doc.setFillColor(...COLORS.light);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 2, 2, 'F');
  
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  const disclaimer = 'AVISO LEGAL: Este relatório é fornecido apenas para fins informativos e não constitui aconselhamento financeiro, jurídico ou de investimento. As previsões e análises apresentadas baseiam-se em dados disponíveis e modelos analíticos, podendo diferir dos resultados reais. A AlphaData não se responsabiliza por decisões tomadas com base neste documento.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 2 * margin - 10);
  doc.text(disclaimerLines, margin + 5, yPos + 6);

  // Add footers to all pages
  addFooter();

  // Save the PDF
  const fileName = `AlphaData_Analise_Geopolitica_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
