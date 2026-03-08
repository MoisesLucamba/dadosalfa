import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Translations for report generation ──
const REPORT_TITLES: Record<string, Record<string, string>> = {
  pt: {
    production: 'Relatório de Produção',
    market: 'Análise de Mercado & Preços',
    exports: 'Exportações e Logística',
    risk: 'Avaliação de Riscos',
    predictions: 'Previsões IA',
    general: 'Relatório Geral do Setor Petrolífero Angolano',
  },
  en: {
    production: 'Production Report',
    market: 'Market & Price Analysis',
    exports: 'Exports and Logistics',
    risk: 'Risk Assessment',
    predictions: 'AI Predictions',
    general: 'General Report on the Angolan Oil Sector',
  },
  fr: {
    production: 'Rapport de Production',
    market: 'Analyse du Marché & des Prix',
    exports: 'Exportations et Logistique',
    risk: 'Évaluation des Risques',
    predictions: 'Prévisions IA',
    general: 'Rapport Général du Secteur Pétrolier Angolais',
  },
};

const HIGHLIGHT_LABELS: Record<string, Record<string, string>> = {
  pt: { totalProduction: 'Produção Total', brentPrice: 'Preço Brent', exportVolume: 'Volume Exportado', activeOperators: 'Operadoras Ativas', riskAlerts: 'Alertas de Risco' },
  en: { totalProduction: 'Total Production', brentPrice: 'Brent Price', exportVolume: 'Export Volume', activeOperators: 'Active Operators', riskAlerts: 'Risk Alerts' },
  fr: { totalProduction: 'Production Totale', brentPrice: 'Prix Brent', exportVolume: 'Volume Exporté', activeOperators: 'Opérateurs Actifs', riskAlerts: 'Alertes de Risque' },
};

const SECTION_NAMES: Record<string, string[]> = {
  pt: ['Sumário Executivo', 'Produção Petrolífera', 'Análise de Preços e Mercado', 'Exportações e Logística', 'Operadoras e Competidores', 'Avaliação de Riscos Geopolíticos', 'Eventos Regulatórios', 'Previsões e Tendências', 'Conclusões e Recomendações'],
  en: ['Executive Summary', 'Oil Production', 'Price and Market Analysis', 'Exports and Logistics', 'Operators and Competitors', 'Geopolitical Risk Assessment', 'Regulatory Events', 'Forecasts and Trends', 'Conclusions and Recommendations'],
  fr: ['Résumé Exécutif', 'Production Pétrolière', 'Analyse des Prix et du Marché', 'Exportations et Logistique', 'Opérateurs et Concurrents', 'Évaluation des Risques Géopolitiques', 'Événements Réglementaires', 'Prévisions et Tendances', 'Conclusions et Recommandations'],
};

const AI_PROMPTS: Record<string, { general: string; other: (type: string) => string }> = {
  pt: {
    general: `Você é um analista sénior do setor petrolífero angolano. Gere um resumo executivo abrangente (máximo 1500 palavras) para um relatório geral do setor.

Inclua secções para:
1. Sumário Executivo com principais destaques
2. Análise de Produção por operadora
3. Tendências de Preços e Mercado
4. Análise de Exportações
5. Avaliação de Riscos Geopolíticos
6. Eventos Regulatórios Recentes
7. Previsões e Tendências
8. Conclusões e Recomendações Estratégicas

Responda em português de Portugal/Angola. Seja detalhado e institucional.`,
    other: (type: string) => `Você é um analista sénior do setor petrolífero angolano. Gere um resumo executivo conciso (máximo 500 palavras) para um relatório de ${type}.

Inclua:
1. Principais métricas e tendências
2. Comparação com período anterior
3. Destaques e alertas importantes
4. Recomendações estratégicas

Responda em português de Portugal/Angola.`,
  },
  en: {
    general: `You are a senior analyst in the Angolan oil sector. Generate a comprehensive executive summary (maximum 1500 words) for a general sector report.

Include sections for:
1. Executive Summary with key highlights
2. Production Analysis by operator
3. Price and Market Trends
4. Export Analysis
5. Geopolitical Risk Assessment
6. Recent Regulatory Events
7. Forecasts and Trends
8. Conclusions and Strategic Recommendations

Respond in English. Be detailed and institutional.`,
    other: (type: string) => `You are a senior analyst in the Angolan oil sector. Generate a concise executive summary (maximum 500 words) for a ${type} report.

Include:
1. Key metrics and trends
2. Comparison with previous period
3. Important highlights and alerts
4. Strategic recommendations

Respond in English.`,
  },
  fr: {
    general: `Vous êtes un analyste senior du secteur pétrolier angolais. Générez un résumé exécutif complet (maximum 1500 mots) pour un rapport général du secteur.

Incluez des sections pour:
1. Résumé exécutif avec les points clés
2. Analyse de la production par opérateur
3. Tendances des prix et du marché
4. Analyse des exportations
5. Évaluation des risques géopolitiques
6. Événements réglementaires récents
7. Prévisions et tendances
8. Conclusions et recommandations stratégiques

Répondez en français. Soyez détaillé et institutionnel.`,
    other: (type: string) => `Vous êtes un analyste senior du secteur pétrolier angolais. Générez un résumé exécutif concis (maximum 500 mots) pour un rapport de ${type}.

Incluez:
1. Principales métriques et tendances
2. Comparaison avec la période précédente
3. Points importants et alertes
4. Recommandations stratégiques

Répondez en français.`,
  },
};

const TYPE_NAMES: Record<string, Record<string, string>> = {
  pt: { production: 'produção', market: 'mercado e preços', exports: 'exportações', risk: 'avaliação de riscos', predictions: 'previsões' },
  en: { production: 'production', market: 'market and prices', exports: 'exports', risk: 'risk assessment', predictions: 'predictions' },
  fr: { production: 'production', market: 'marché et prix', exports: 'exportations', risk: 'évaluation des risques', predictions: 'prévisions' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { reportType, period, userId, aiGenerated = true, language = 'pt' } = await req.json();
    const lang = (language && ['pt', 'en', 'fr'].includes(language)) ? language : 'pt';

    console.log('Generating report:', { reportType, period, aiGenerated, lang });

    const titles = REPORT_TITLES[lang] || REPORT_TITLES.pt;
    const hlLabels = HIGHLIGHT_LABELS[lang] || HIGHLIGHT_LABELS.pt;
    const dateLocale = lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : 'pt-AO';
    const periodStr = period || new Date().toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' });

    let reportData: any = {};
    let reportTitle = '';

    switch (reportType) {
      case 'production': {
        const { data } = await supabase.from('production_data').select('*').order('data_date', { ascending: false }).limit(100);
        reportData.production = data || [];
        reportTitle = `${titles.production} - ${periodStr}`;
        break;
      }
      case 'market': {
        const { data } = await supabase.from('price_data').select('*').order('data_date', { ascending: false }).limit(100);
        reportData.prices = data || [];
        reportTitle = `${titles.market} - ${periodStr}`;
        break;
      }
      case 'exports': {
        const { data } = await supabase.from('export_data').select('*').order('data_date', { ascending: false }).limit(100);
        reportData.exports = data || [];
        reportTitle = `${titles.exports} - ${periodStr}`;
        break;
      }
      case 'risk': {
        const [riskProd, riskPrice, riskExport, riskAlerts] = await Promise.all([
          supabase.from('production_data').select('*').order('data_date', { ascending: false }).limit(50),
          supabase.from('price_data').select('*').order('data_date', { ascending: false }).limit(50),
          supabase.from('export_data').select('*').order('data_date', { ascending: false }).limit(50),
          supabase.from('risk_alerts').select('*').eq('is_active', true).limit(20),
        ]);
        reportData = {
          production: riskProd.data || [],
          prices: riskPrice.data || [],
          exports: riskExport.data || [],
          riskAlerts: riskAlerts.data || [],
        };
        reportTitle = `${titles.risk} - Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`;
        break;
      }
      case 'predictions': {
        const aiPredResult = await supabase.functions.invoke('ai-predictions');
        reportData.predictions = aiPredResult.data?.predictions || {};
        reportTitle = `${titles.predictions} - ${periodStr}`;
        break;
      }
      case 'general': {
        console.log('Fetching general report data (parallel)...');

        // Parallel fetch - much faster, avoids timeout
        const [gProd, gPrices, gExports, gRiskAlerts, gRiskData, gCountryRisk, gRegEvents] = await Promise.all([
          supabase.from('production_data').select('*').order('data_date', { ascending: false }).limit(50),
          supabase.from('price_data').select('*').order('data_date', { ascending: false }).limit(50),
          supabase.from('export_data').select('*').order('data_date', { ascending: false }).limit(50),
          supabase.from('risk_alerts').select('*').eq('is_active', true).limit(20),
          supabase.from('risk_data').select('*').order('data_date', { ascending: false }).limit(30),
          supabase.from('country_risk').select('*').order('data_date', { ascending: false }).limit(15),
          supabase.from('regulatory_events').select('*').order('created_at', { ascending: false }).limit(15),
        ]);

        // Log any errors
        for (const [name, res] of [['production', gProd], ['prices', gPrices], ['exports', gExports], ['riskAlerts', gRiskAlerts], ['riskData', gRiskData], ['countryRisk', gCountryRisk], ['regulatoryEvents', gRegEvents]] as const) {
          if ((res as any).error) console.error(`${name} error:`, (res as any).error);
        }

        const operators = [
          { name: 'TotalEnergies EP Angola', shortName: 'Total', production: 285, marketShare: 22.8, blocks: 4 },
          { name: 'Chevron Angola', shortName: 'Chevron', production: 198, marketShare: 15.8, blocks: 3 },
          { name: 'Sonangol E.P.', shortName: 'Sonangol', production: 175, marketShare: 14.0, blocks: 4 },
          { name: 'Eni Angola', shortName: 'Eni', production: 168, marketShare: 13.4, blocks: 3 },
          { name: 'BP Angola', shortName: 'BP', production: 145, marketShare: 11.6, blocks: 2 },
          { name: 'ExxonMobil Angola', shortName: 'Exxon', production: 109, marketShare: 8.7, blocks: 1 },
          { name: 'Azule Energy', shortName: 'Azule', production: 85, marketShare: 6.8, blocks: 2 },
          { name: 'Galp Energia', shortName: 'Galp', production: 45, marketShare: 3.6, blocks: 2 },
          { name: 'Equinor Angola', shortName: 'Equinor', production: 35, marketShare: 2.8, blocks: 1 },
          { name: 'Sinopec Angola', shortName: 'Sinopec', production: 28, marketShare: 2.2, blocks: 2 },
          { name: 'Afentra plc', shortName: 'Afentra', production: 22, marketShare: 1.8, blocks: 2 },
          { name: 'Pluspetrol', shortName: 'Pluspetrol', production: 18, marketShare: 1.4, blocks: 1 },
          { name: 'ETU Energias', shortName: 'ETU', production: 15, marketShare: 1.2, blocks: 2 },
          { name: 'Petrobras Angola', shortName: 'Petrobras', production: 12, marketShare: 1.0, blocks: 1 },
        ];

        const sections = SECTION_NAMES[lang] || SECTION_NAMES.pt;

        reportData = {
          production: gProd.data || [],
          prices: gPrices.data || [],
          exports: gExports.data || [],
          riskAlerts: gRiskAlerts.data || [],
          riskData: gRiskData.data || [],
          countryRisk: gCountryRisk.data || [],
          regulatoryEvents: gRegEvents.data || [],
          operators,
          sections,
        };
        reportTitle = `${titles.general} - ${periodStr}`;
        break;
      }
      default:
        throw new Error(`Invalid report type: ${reportType}`);
    }

    let content: any = { data: reportData };
    let summary = '';
    let pages = reportType === 'general' ? Math.floor(Math.random() * 10) + 8 : Math.floor(Math.random() * 20) + 15;

    // Generate AI summary if requested
    if (aiGenerated) {
      console.log('Generating AI summary in', lang, '...');

      const prompts = AI_PROMPTS[lang] || AI_PROMPTS.pt;
      const typeNames = TYPE_NAMES[lang] || TYPE_NAMES.pt;
      const systemPrompt = reportType === 'general'
        ? prompts.general
        : prompts.other(typeNames[reportType] || reportType);

      const userMsg = lang === 'en'
        ? `Analyze the following data and generate the executive summary:\n\n${JSON.stringify(reportData, null, 2).substring(0, 4000)}`
        : lang === 'fr'
        ? `Analysez les données suivantes et générez le résumé exécutif:\n\n${JSON.stringify(reportData, null, 2).substring(0, 4000)}`
        : `Analise os seguintes dados e gere o resumo executivo:\n\n${JSON.stringify(reportData, null, 2).substring(0, 4000)}`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMsg },
          ],
          temperature: 0.7,
          max_tokens: reportType === 'general' ? 3000 : 1000,
        }),
      });

      if (response.ok) {
        const aiData = await response.json();
        summary = aiData.choices?.[0]?.message?.content || '';
      } else {
        console.error('AI response error:', response.status, await response.text());
      }
    }

    // Calculate highlights with translated labels
    const highlights = [];
    if (reportData.production?.length) {
      const totalProd = reportData.production.reduce((sum: number, p: any) => sum + (p.daily_production || 0), 0);
      highlights.push({ title: hlLabels.totalProduction, value: `${(totalProd / 1000).toFixed(0)}K bpd`, trend: 'stable' });
    }
    if (reportData.prices?.length) {
      const latestBrent = reportData.prices.find((p: any) => p.crude_type === 'Brent')?.price;
      if (latestBrent) {
        highlights.push({ title: hlLabels.brentPrice, value: `$${latestBrent.toFixed(2)}`, trend: 'up' });
      }
    }
    if (reportData.exports?.length) {
      const totalExports = reportData.exports.reduce((sum: number, e: any) => sum + (e.volume || 0), 0);
      highlights.push({ title: hlLabels.exportVolume, value: `${(totalExports / 1000000).toFixed(1)}M bbl`, trend: 'stable' });
    }
    if (reportType === 'general') {
      highlights.push({ title: hlLabels.activeOperators, value: '14', trend: 'stable' });
      if (reportData.riskAlerts?.length) {
        highlights.push({ title: hlLabels.riskAlerts, value: `${reportData.riskAlerts.length}`, trend: reportData.riskAlerts.length > 5 ? 'down' : 'stable' });
      }
    }
    content.highlights = highlights;

    // Insert report into database
    const { data: report, error: insertError } = await supabase
      .from('reports')
      .insert({
        user_id: userId || null,
        title: reportTitle,
        type: reportType,
        period: period || periodStr,
        pages,
        status: 'ready',
        ai_generated: aiGenerated,
        content,
        summary: summary || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting report:', insertError);
      throw insertError;
    }

    console.log('Report generated successfully:', report.id);

    return new Response(JSON.stringify({ success: true, report }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
