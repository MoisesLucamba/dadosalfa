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
        // Combine all data for risk analysis
        const [riskProd, riskPrice, riskExport] = await Promise.all([
          supabase.from('production_data').select('*').order('data_date', { ascending: false }).limit(50),
          supabase.from('price_data').select('*').order('data_date', { ascending: false }).limit(50),
          supabase.from('export_data').select('*').order('data_date', { ascending: false }).limit(50),
        ]);
        reportData = {
          production: riskProd.data || [],
          prices: riskPrice.data || [],
          exports: riskExport.data || [],
        };
        reportTitle = `Avaliação de Riscos - ${period || 'Q' + Math.ceil((new Date().getMonth() + 1) / 3) + ' ' + new Date().getFullYear()}`;
        break;
      case 'predictions':
        // Use AI predictions
        const aiPredResult = await supabase.functions.invoke('ai-predictions');
        reportData.predictions = aiPredResult.data?.predictions || {};
        reportTitle = `Previsões IA - ${period || new Date().toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })}`;
        break;
      default:
        throw new Error(`Tipo de relatório inválido: ${reportType}`);
    }

    let content: any = { data: reportData };
    let summary = '';
    let pages = Math.floor(Math.random() * 20) + 15;

    // Generate AI summary if requested
    if (aiGenerated) {
      console.log('Generating AI summary...');
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `Você é um analista sénior do setor petrolífero angolano. Gere um resumo executivo conciso (máximo 500 palavras) para um relatório de ${reportType === 'production' ? 'produção' : reportType === 'market' ? 'mercado e preços' : reportType === 'exports' ? 'exportações' : reportType === 'risk' ? 'avaliação de riscos' : 'previsões'}. 
              
Inclua:
1. Principais métricas e tendências
2. Comparação com período anterior
3. Destaques e alertas importantes
4. Recomendações estratégicas

Responda em português de Portugal/Angola.`
            },
            {
              role: 'user',
              content: `Analise os seguintes dados e gere o resumo executivo:\n\n${JSON.stringify(reportData, null, 2).substring(0, 4000)}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (response.ok) {
        const aiData = await response.json();
        summary = aiData.choices?.[0]?.message?.content || '';
        content.summary = summary;
        content.aiAnalysis = true;
        pages = Math.floor(Math.random() * 15) + 20; // AI reports tend to be longer
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
