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
    const currentDate = new Date().toISOString().split('T')[0];

    console.log('Analyzing geopolitical risks with AI...');

    // Fetch existing data for context
    const [priceResult, productionResult, exportResult] = await Promise.all([
      supabase.from('price_data').select('*').order('data_date', { ascending: false }).limit(10),
      supabase.from('production_data').select('*').order('data_date', { ascending: false }).limit(10),
      supabase.from('export_data').select('*').order('data_date', { ascending: false }).limit(10),
    ]);

    const contextData = {
      latestBrent: priceResult.data?.find(p => p.crude_type === 'Brent')?.price || 78,
      operators: [...new Set(productionResult.data?.map(p => p.operator) || [])],
      exportDestinations: [...new Set(exportResult.data?.map(e => e.destination) || [])],
    };

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
            content: `Você é um analista sénior de riscos geopolíticos especializado no setor petrolífero africano, com foco em Angola.

Sua tarefa é analisar os riscos atuais e gerar uma avaliação completa incluindo:
- Riscos geopolíticos globais e regionais que afetam o setor
- Riscos regulatórios em Angola e na OPEP+
- Riscos fiscais e cambiais
- Riscos operacionais e ambientais
- Alertas ativos baseados em eventos reais
- Comparação de riscos entre países produtores africanos
- Timeline regulatório previsto

IMPORTANTE: Baseie suas análises em conhecimento real sobre:
- Situação atual do Mar Vermelho e impacto no transporte
- Decisões OPEP+ sobre cotas
- Políticas fiscais angolanas
- Volatilidade do Kwanza vs USD
- Regulamentações ambientais europeias
- Tensões geopolíticas globais

Retorne APENAS um JSON válido, sem markdown.`
          },
          {
            role: 'user',
            content: `Data atual: ${currentDate}

CONTEXTO DO MERCADO ANGOLANO:
- Preço Brent: $${contextData.latestBrent}/barril
- Operadoras activas: ${contextData.operators.join(', ') || 'TotalEnergies, BP, Chevron, ExxonMobil, Eni'}
- Destinos exportação: ${contextData.exportDestinations.join(', ') || 'China, Europa, Índia, EUA'}

Gere um JSON com esta estrutura exata:
{
  "risk_scores": {
    "geopolitical": {"score": número 0-100, "trend": "up"/"down"/"stable", "description": "explicação"},
    "regulatory": {"score": número 0-100, "trend": "up"/"down"/"stable", "description": "explicação"},
    "fiscal": {"score": número 0-100, "trend": "up"/"down"/"stable", "description": "explicação"},
    "operational": {"score": número 0-100, "trend": "up"/"down"/"stable", "description": "explicação"},
    "currency": {"score": número 0-100, "trend": "up"/"down"/"stable", "description": "explicação"},
    "environmental": {"score": número 0-100, "trend": "up"/"down"/"stable", "description": "explicação"}
  },
  "global_risk_index": número 0-100,
  "alerts": [
    {
      "type": "critical"/"warning"/"info",
      "title": "título curto",
      "description": "descrição detalhada",
      "impact": "high"/"medium"/"low",
      "region": "região afetada"
    }
  ],
  "country_risks": [
    {"country": "Angola", "score": número, "trend": "up"/"down"/"stable"},
    {"country": "Nigéria", "score": número, "trend": "up"/"down"/"stable"},
    {"country": "Líbia", "score": número, "trend": "up"/"down"/"stable"},
    {"country": "Argélia", "score": número, "trend": "up"/"down"/"stable"},
    {"country": "Guiné Equatorial", "score": número, "trend": "up"/"down"/"stable"}
  ],
  "regulatory_timeline": [
    {
      "event_date": "Q1 2025",
      "title": "título",
      "description": "descrição",
      "status": "pending"/"active"/"completed",
      "impact_level": "high"/"medium"/"low"
    }
  ],
  "recommendations": [
    "recomendação 1",
    "recomendação 2"
  ]
}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response received');

    // Parse the JSON response
    let riskAnalysis;
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      riskAnalysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Generate fallback data
      riskAnalysis = generateFallbackRiskData();
    }

    // Save risk data to database
    const today = new Date().toISOString().split('T')[0];

    // Delete old data for today and insert new
    await supabase.from('risk_data').delete().eq('data_date', today);
    await supabase.from('risk_alerts').update({ is_active: false }).eq('is_active', true);
    await supabase.from('country_risk').delete().eq('data_date', today);

    // Insert risk scores
    if (riskAnalysis.risk_scores) {
      const riskDataToInsert = Object.entries(riskAnalysis.risk_scores).map(([category, data]: [string, any]) => ({
        category,
        score: data.score,
        trend: data.trend,
        description: data.description,
        source: 'AI Analysis',
        data_date: today,
      }));
      
      const { error: riskError } = await supabase.from('risk_data').insert(riskDataToInsert);
      if (riskError) console.error('Error inserting risk data:', riskError);
    }

    // Insert alerts
    if (riskAnalysis.alerts) {
      const alertsToInsert = riskAnalysis.alerts.map((alert: any) => ({
        alert_type: alert.type,
        title: alert.title,
        description: alert.description,
        impact: alert.impact,
        region: alert.region,
        is_active: true,
      }));
      
      const { error: alertError } = await supabase.from('risk_alerts').insert(alertsToInsert);
      if (alertError) console.error('Error inserting alerts:', alertError);
    }

    // Insert country risks
    if (riskAnalysis.country_risks) {
      const countryRisksToInsert = riskAnalysis.country_risks.map((cr: any) => ({
        country: cr.country,
        score: cr.score,
        trend: cr.trend,
        data_date: today,
      }));
      
      const { error: countryError } = await supabase.from('country_risk').insert(countryRisksToInsert);
      if (countryError) console.error('Error inserting country risks:', countryError);
    }

    // Insert regulatory events (upsert based on title)
    if (riskAnalysis.regulatory_timeline) {
      for (const event of riskAnalysis.regulatory_timeline) {
        const { error: regError } = await supabase
          .from('regulatory_events')
          .upsert({
            title: event.title,
            description: event.description,
            event_date: event.event_date,
            status: event.status,
            impact_level: event.impact_level,
          }, { onConflict: 'title' });
        if (regError) console.error('Error inserting regulatory event:', regError);
      }
    }

    console.log('Risk analysis saved successfully');

    return new Response(JSON.stringify({
      success: true,
      analysis: riskAnalysis,
      generated_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error analyzing risks:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateFallbackRiskData() {
  return {
    risk_scores: {
      geopolitical: { score: 72, trend: "up", description: "Tensões no Mar Vermelho elevam riscos de transporte" },
      regulatory: { score: 45, trend: "stable", description: "Ambiente regulatório angolano estável" },
      fiscal: { score: 58, trend: "up", description: "Discussões sobre alterações aos royalties" },
      operational: { score: 35, trend: "down", description: "Operações estáveis nos principais blocos" },
      currency: { score: 68, trend: "up", description: "Pressão sobre o Kwanza face ao USD" },
      environmental: { score: 42, trend: "stable", description: "Cumprimento de normas ambientais" },
    },
    global_risk_index: 58,
    alerts: [
      {
        type: "critical",
        title: "Tensões no Mar Vermelho",
        description: "Ataques a navios-tanque aumentam custos de seguro e tempo de transporte para Europa.",
        impact: "high",
        region: "Médio Oriente"
      },
      {
        type: "warning",
        title: "Revisão Fiscal em Discussão",
        description: "Governo angolano considera alterações aos royalties do setor petrolífero.",
        impact: "medium",
        region: "Angola"
      },
      {
        type: "warning",
        title: "Volatilidade Cambial",
        description: "Desvalorização do Kwanza impacta custos operacionais.",
        impact: "medium",
        region: "Angola"
      },
      {
        type: "info",
        title: "Nova Regulamentação Ambiental UE",
        description: "União Europeia propõe novas métricas de emissões para importação de crude.",
        impact: "low",
        region: "Europa"
      }
    ],
    country_risks: [
      { country: "Angola", score: 58, trend: "stable" },
      { country: "Nigéria", score: 72, trend: "up" },
      { country: "Líbia", score: 85, trend: "up" },
      { country: "Argélia", score: 52, trend: "down" },
      { country: "Guiné Equatorial", score: 48, trend: "stable" }
    ],
    regulatory_timeline: [
      { event_date: "Q1 2025", title: "Revisão Lei Petrolífera", description: "Atualização da Lei das Actividades Petrolíferas", status: "pending", impact_level: "high" },
      { event_date: "Q2 2025", title: "Novas Quotas OPEP+", description: "Revisão das quotas de produção para membros africanos", status: "pending", impact_level: "medium" },
      { event_date: "2024", title: "Regulamento Conteúdo Local", description: "Requisitos de participação angolana em projetos", status: "active", impact_level: "medium" }
    ],
    recommendations: [
      "Diversificar rotas de exportação para mitigar riscos de transporte",
      "Monitorar desenvolvimentos fiscais e preparar cenários alternativos",
      "Reforçar hedge cambial para proteger contra volatilidade do Kwanza"
    ]
  };
}
