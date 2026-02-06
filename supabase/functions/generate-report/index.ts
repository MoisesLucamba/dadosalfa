import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { reportType, period, userId, aiGenerated = true } = await req.json();

    console.log('Generating report:', { reportType, period, aiGenerated });

    // Fetch relevant data based on report type
    let reportData: any = {};
    let reportTitle = '';

    switch (reportType) {
      case 'production':
        const prodResult = await supabase.from('production_data').select('*').order('data_date', { ascending: false }).limit(100);
        reportData.production = prodResult.data || [];
        reportTitle = `Relatório de Produção - ${period || new Date().toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })}`;
        break;
      case 'market':
        const priceResult = await supabase.from('price_data').select('*').order('data_date', { ascending: false }).limit(100);
        reportData.prices = priceResult.data || [];
        reportTitle = `Análise de Mercado & Preços - ${period || new Date().toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })}`;
        break;
      case 'exports':
        const exportResult = await supabase.from('export_data').select('*').order('data_date', { ascending: false }).limit(100);
        reportData.exports = exportResult.data || [];
        reportTitle = `Exportações e Logística - ${period || new Date().toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })}`;
        break;
      case 'risk':
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
        reportTitle = `Avaliação de Riscos - ${period || 'Q' + Math.ceil((new Date().getMonth() + 1) / 3) + ' ' + new Date().getFullYear()}`;
        break;
      case 'predictions':
        const aiPredResult = await supabase.functions.invoke('ai-predictions');
        reportData.predictions = aiPredResult.data?.predictions || {};
        reportTitle = `Previsões IA - ${period || new Date().toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })}`;
        break;
      case 'general':
        console.log('Fetching general report data...');

        const generalProduction = await supabase.from('production_data').select('*').order('data_date', { ascending: false }).limit(50);
        const generalPrices = await supabase.from('price_data').select('*').order('data_date', { ascending: false }).limit(50);
        const generalExports = await supabase.from('export_data').select('*').order('data_date', { ascending: false }).limit(50);
        const generalRiskAlerts = await supabase.from('risk_alerts').select('*').eq('is_active', true).limit(20);
        const generalRiskData = await supabase.from('risk_data').select('*').order('data_date', { ascending: false }).limit(30);
        const generalCountryRisk = await supabase.from('country_risk').select('*').order('data_date', { ascending: false }).limit(15);
        const generalRegulatoryEvents = await supabase.from('regulatory_events').select('*').order('created_at', { ascending: false }).limit(15);

        if (generalProduction.error) console.error('Production data error:', generalProduction.error);
        if (generalPrices.error) console.error('Prices data error:', generalPrices.error);
        if (generalExports.error) console.error('Exports data error:', generalExports.error);
        if (generalRiskAlerts.error) console.error('Risk alerts error:', generalRiskAlerts.error);
        if (generalRiskData.error) console.error('Risk data error:', generalRiskData.error);
        if (generalCountryRisk.error) console.error('Country risk error:', generalCountryRisk.error);
        if (generalRegulatoryEvents.error) console.error('Regulatory events error:', generalRegulatoryEvents.error);
        
        const operators = [
          { name: 'TotalEnergies EP Angola', shortName: 'Total', production: 285, marketShare: 22.8, blocks: 4, website: 'https://totalenergies.com/angola' },
          { name: 'Chevron Angola', shortName: 'Chevron', production: 198, marketShare: 15.8, blocks: 3, website: 'https://angola.chevron.com' },
          { name: 'Sonangol E.P.', shortName: 'Sonangol', production: 175, marketShare: 14.0, blocks: 4, website: 'http://www.sonangol.co.ao/' },
          { name: 'Eni Angola', shortName: 'Eni', production: 168, marketShare: 13.4, blocks: 3, website: 'https://www.eni.com/' },
          { name: 'BP Angola', shortName: 'BP', production: 145, marketShare: 11.6, blocks: 2, website: 'https://www.bp.com/' },
          { name: 'ExxonMobil Angola', shortName: 'Exxon', production: 109, marketShare: 8.7, blocks: 1, website: 'https://corporate.exxonmobil.com/locations/angola' },
          { name: 'Azule Energy', shortName: 'Azule', production: 85, marketShare: 6.8, blocks: 2, website: 'https://www.azule-energy.com' },
          { name: 'Galp Energia', shortName: 'Galp', production: 45, marketShare: 3.6, blocks: 2, website: 'https://www.galp.com/' },
          { name: 'Equinor Angola', shortName: 'Equinor', production: 35, marketShare: 2.8, blocks: 1, website: 'https://www.equinor.com/' },
          { name: 'Sinopec Angola', shortName: 'Sinopec', production: 28, marketShare: 2.2, blocks: 2, website: 'http://www.sinopec.com/' },
          { name: 'Afentra plc', shortName: 'Afentra', production: 22, marketShare: 1.8, blocks: 2, website: 'https://www.afentra.com/' },
          { name: 'Pluspetrol', shortName: 'Pluspetrol', production: 18, marketShare: 1.4, blocks: 1, website: 'https://pluspetrol.net/' },
          { name: 'ETU Energias', shortName: 'ETU', production: 15, marketShare: 1.2, blocks: 2, website: null },
          { name: 'Petrobras Angola', shortName: 'Petrobras', production: 12, marketShare: 1.0, blocks: 1, website: 'https://petrobras.com.br/' },
        ];
        
        reportData = {
          production: generalProduction.data || [],
          prices: generalPrices.data || [],
          exports: generalExports.data || [],
          riskAlerts: generalRiskAlerts.data || [],
          riskData: generalRiskData.data || [],
          countryRisk: generalCountryRisk.data || [],
          regulatoryEvents: generalRegulatoryEvents.data || [],
          operators: operators,
          sections: [
            'Sumário Executivo',
            'Produção Petrolífera',
            'Análise de Preços e Mercado',
            'Exportações e Logística',
            'Operadoras e Competidores',
            'Avaliação de Riscos Geopolíticos',
            'Eventos Regulatórios',
            'Previsões e Tendências',
            'Conclusões e Recomendações',
          ],
        };
        reportTitle = `Relatório Geral do Setor Petrolífero Angolano - ${period || new Date().toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })}`;
        break;
      default:
        throw new Error(`Tipo de relatório inválido: ${reportType}`);
    }

    let content: any = { data: reportData };
    let summary = '';
    let pages = reportType === 'general' ? Math.floor(Math.random() * 10) + 8 : Math.floor(Math.random() * 20) + 15;

    // Generate AI summary if requested
    if (aiGenerated) {
      console.log('Generating AI summary...');

      const systemPrompt = reportType === 'general' 
        ? `Você é um analista sénior do setor petrolífero angolano. Gere um resumo executivo abrangente (máximo 1500 palavras) para um relatório geral do setor.

Inclua secções para:
1. Sumário Executivo com principais destaques
2. Análise de Produção por operadora
3. Tendências de Preços e Mercado
4. Análise de Exportações
5. Avaliação de Riscos Geopolíticos
6. Eventos Regulatórios Recentes
7. Previsões e Tendências
8. Conclusões e Recomendações Estratégicas

Responda em português de Portugal/Angola. Seja detalhado e institucional.`
        : `Você é um analista sénior do setor petrolífero angolano. Gere um resumo executivo conciso (máximo 500 palavras) para um relatório de ${reportType === 'production' ? 'produção' : reportType === 'market' ? 'mercado e preços' : reportType === 'exports' ? 'exportações' : reportType === 'risk' ? 'avaliação de riscos' : 'previsões'}.

Inclua:
1. Principais métricas e tendências
2. Comparação com período anterior
3. Destaques e alertas importantes
4. Recomendações estratégicas

Responda em português de Portugal/Angola.`;

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
            { role: 'user', content: `Analise os seguintes dados e gere o resumo executivo:\n\n${JSON.stringify(reportData, null, 2).substring(0, 4000)}` }
          ],
          temperature: 0.7,
          max_tokens: reportType === 'general' ? 3000 : 1000,
        }),
      });

      if (response.ok) {
        const aiData = await response.json();
        summary = aiData.choices?.[0]?.message?.content || '';
      }
    }

    // Calculate highlights based on data
    const highlights = [];
    if (reportData.production?.length) {
      const totalProd = reportData.production.reduce((sum: number, p: any) => sum + (p.daily_production || 0), 0);
      highlights.push({
        title: 'Produção Total',
        value: `${(totalProd / 1000).toFixed(0)}K bpd`,
        trend: 'stable'
      });
    }
    if (reportData.prices?.length) {
      const latestBrent = reportData.prices.find((p: any) => p.crude_type === 'Brent')?.price;
      if (latestBrent) {
        highlights.push({
          title: 'Preço Brent',
          value: `$${latestBrent.toFixed(2)}`,
          trend: 'up'
        });
      }
    }
    if (reportData.exports?.length) {
      const totalExports = reportData.exports.reduce((sum: number, e: any) => sum + (e.volume || 0), 0);
      highlights.push({
        title: 'Volume Exportado',
        value: `${(totalExports / 1000000).toFixed(1)}M bbl`,
        trend: 'stable'
      });
    }
    if (reportType === 'general') {
      highlights.push({
        title: 'Operadoras Ativas',
        value: '14',
        trend: 'stable'
      });
      if (reportData.riskAlerts?.length) {
        highlights.push({
          title: 'Alertas de Risco',
          value: `${reportData.riskAlerts.length}`,
          trend: reportData.riskAlerts.length > 5 ? 'down' : 'stable'
        });
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
        period: period || new Date().toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' }),
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

    return new Response(JSON.stringify({
      success: true,
      report,
    }), {
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
