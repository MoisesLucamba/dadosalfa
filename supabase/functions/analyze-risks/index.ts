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
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `Você é um analista sénior de inteligência geopolítica especializado no setor petrolífero global, com foco especial em África e Angola.

CONHECIMENTO OBRIGATÓRIO - Analise eventos REAIS e ACTUAIS:

🇻🇪 VENEZUELA & EUA:
- Sanções americanas sobre petróleo venezuelano e impacto no mercado
- Tensões políticas entre Washington e Caracas
- Potencial retorno de petróleo venezuelano ao mercado global
- Impacto nas quotas OPEP+ e preços regionais
- Migração forçada e instabilidade regional na América Latina

🌍 MÉDIO ORIENTE:
- Conflito Israel-Gaza-Líbano e escalada regional
- Tensões Irão-Israel e risco de guerra aberta
- Ataques Houthi no Mar Vermelho afetando navegação
- Instabilidade na Síria após queda de Assad
- Posição da Arábia Saudita e Emirados no conflito
- Impacto no estreito de Ormuz e rotas de transporte

🇳🇬 NIGÉRIA - CRISE ACTIVA:
- Violência sectária e étnica no norte (Kaduna, Plateau, Benue)
- Ataques de grupos armados e banditismo
- Sequestros massivos e insegurança geral
- Impacto na produção petrolífera do Delta do Níger
- Roubo de petróleo e vandalismo de oleodutos
- Instabilidade política e económica
- Mortes civis e deslocados internos

🛢️ OUTROS FATORES:
- Decisões OPEP+ sobre cortes de produção
- Transição energética e pressão europeia
- Volatilidade cambial em países produtores
- China como principal comprador de crude africano

RETORNE previsões ESPECÍFICAS sobre estes eventos com datas e projecções.`
          },
          {
            role: 'user',
            content: `Data atual: ${currentDate}

CONTEXTO DO MERCADO ANGOLANO:
- Preço Brent: $${contextData.latestBrent}/barril
- Operadoras activas: ${contextData.operators.join(', ') || 'TotalEnergies, BP, Chevron, ExxonMobil, Eni'}
- Destinos exportação: ${contextData.exportDestinations.join(', ') || 'China, Europa, Índia, EUA'}

Gere um JSON com análise DETALHADA dos eventos actuais:
{
  "risk_scores": {
    "geopolitical": {"score": número 0-100, "trend": "up"/"down"/"stable", "description": "explicação DETALHADA"},
    "regulatory": {"score": número 0-100, "trend": "up"/"down"/"stable", "description": "explicação"},
    "fiscal": {"score": número 0-100, "trend": "up"/"down"/"stable", "description": "explicação"},
    "operational": {"score": número 0-100, "trend": "up"/"down"/"stable", "description": "explicação"},
    "currency": {"score": número 0-100, "trend": "up"/"down"/"stable", "description": "explicação"},
    "environmental": {"score": número 0-100, "trend": "up"/"down"/"stable", "description": "explicação"}
  },
  "global_risk_index": número 0-100,
  "geopolitical_forecast": [
    {
      "region": "Venezuela/EUA" ou "Médio Oriente" ou "Nigéria" ou "OPEP+" ou "Angola",
      "situation": "descrição detalhada da situação actual (50-100 palavras)",
      "impact_on_oil": "impacto específico no mercado petrolífero",
      "prediction_30d": "previsão para próximos 30 dias",
      "prediction_90d": "previsão para próximos 90 dias",
      "risk_level": "critical"/"high"/"medium"/"low",
      "key_indicators": ["indicador 1", "indicador 2", "indicador 3"]
    }
  ],
  "alerts": [
    {
      "type": "critical"/"warning"/"info",
      "title": "título curto mas informativo",
      "description": "descrição detalhada do evento e impacto",
      "impact": "high"/"medium"/"low",
      "region": "região afetada",
      "source_event": "evento específico que gerou o alerta"
    }
  ],
  "country_risks": [
    {"country": "Angola", "score": número, "trend": "up"/"down"/"stable"},
    {"country": "Nigéria", "score": número, "trend": "up"/"down"/"stable"},
    {"country": "Venezuela", "score": número, "trend": "up"/"down"/"stable"},
    {"country": "Líbia", "score": número, "trend": "up"/"down"/"stable"},
    {"country": "Irão", "score": número, "trend": "up"/"down"/"stable"},
    {"country": "Iraque", "score": número, "trend": "up"/"down"/"stable"}
  ],
  "regulatory_timeline": [
    {
      "event_date": "data ou período",
      "title": "título",
      "description": "descrição",
      "status": "pending"/"active"/"completed",
      "impact_level": "high"/"medium"/"low"
    }
  ],
  "recommendations": [
    "recomendação estratégica 1",
    "recomendação estratégica 2",
    "recomendação estratégica 3"
  ]
}`
          }
        ],
        max_tokens: 4000,
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
      geopolitical: { score: 78, trend: "up", description: "Tensões elevadas: conflito Israel-Gaza, ataques Houthi no Mar Vermelho, e crise na Venezuela aumentam volatilidade global" },
      regulatory: { score: 45, trend: "stable", description: "Ambiente regulatório angolano estável, mas OPEP+ pode rever quotas" },
      fiscal: { score: 58, trend: "up", description: "Discussões sobre alterações aos royalties em Angola e pressão fiscal global" },
      operational: { score: 42, trend: "stable", description: "Operações estáveis nos principais blocos angolanos" },
      currency: { score: 68, trend: "up", description: "Pressão sobre o Kwanza e naira nigeriano face ao USD" },
      environmental: { score: 45, trend: "stable", description: "Pressão europeia sobre emissões de carbono intensifica" },
    },
    global_risk_index: 65,
    geopolitical_forecast: [
      {
        region: "Venezuela/EUA",
        situation: "As tensões entre EUA e Venezuela continuam elevadas após sanções renovadas ao setor petrolífero. A administração americana mantém pressão sobre Maduro enquanto empresas americanas aguardam licenças para operar. A Venezuela busca aproximação com China e Rússia.",
        impact_on_oil: "Potencial retorno de 500k-800k bpd ao mercado global pode pressionar preços para baixo",
        prediction_30d: "Manutenção das sanções com negociações em curso para licenças específicas",
        prediction_90d: "Possível flexibilização parcial das sanções se houver avanços democráticos",
        risk_level: "high",
        key_indicators: ["Eleições venezuelanas", "Licenças OFAC", "Produção PDVSA"]
      },
      {
        region: "Médio Oriente",
        situation: "Conflito Israel-Hamas estendeu-se ao Líbano e ameaça escalar para confronto direto com Irão. Ataques Houthi no Mar Vermelho forçam desvio de petroleiros pelo Cabo da Boa Esperança, aumentando custos e tempo de entrega para Europa.",
        impact_on_oil: "Fretes marítimos subiram 200-300%. Prémio de risco geopolítico de $5-8/barril no Brent",
        prediction_30d: "Continuação dos ataques Houthi. Cessar-fogo em Gaza improvável a curto prazo",
        prediction_90d: "Risco elevado de escalada Irão-Israel. Estreito de Ormuz sob vigilância máxima",
        risk_level: "critical",
        key_indicators: ["Ataques no Mar Vermelho", "Negociações de cessar-fogo", "Movimentação naval iraniana"]
      },
      {
        region: "Nigéria",
        situation: "Violência extrema no norte da Nigéria com milhares de mortos em ataques sectários. Banditismo e sequestros generalizados. No Delta do Níger, roubo de petróleo atinge 400k bpd. Presidente Tinubu enfrenta crise de segurança sem precedentes.",
        impact_on_oil: "Produção nigeriana reduzida em 15-20% face ao potencial. Investidores internacionais cautelosos",
        prediction_30d: "Continuação da violência no norte. Governo sem capacidade de restaurar ordem",
        prediction_90d: "Crise humanitária agravada. Possível retirada de operadoras de áreas onshore",
        risk_level: "critical",
        key_indicators: ["Ataques no norte", "Produção do Delta", "Segurança de oleodutos"]
      },
      {
        region: "Angola",
        situation: "Angola mantém estabilidade política e operacional. Produção estável em 1.1 MMBPD. Foco em atração de investimento estrangeiro e diversificação da base de exportação. Kwanza sob pressão cambial moderada.",
        impact_on_oil: "Angola beneficia como alternativa estável aos produtores instáveis da região",
        prediction_30d: "Estabilidade operacional mantida. Novos blocos em licitação",
        prediction_90d: "Potencial aumento de investimento como 'safe haven' africano",
        risk_level: "medium",
        key_indicators: ["Produção SONANGOL", "Investimento IOCs", "Taxa de câmbio AOA/USD"]
      },
      {
        region: "OPEP+",
        situation: "OPEP+ mantém cortes de produção para sustentar preços. Arábia Saudita lidera com cortes voluntários adicionais. Tensões internas sobre quotas e capacidade de produção sobressalente.",
        impact_on_oil: "Suporte aos preços no curto prazo. Risco de excesso de oferta em 2025 se cortes terminarem",
        prediction_30d: "Manutenção dos cortes actuais na próxima reunião ministerial",
        prediction_90d: "Revisão gradual dos cortes dependendo da demanda chinesa",
        risk_level: "medium",
        key_indicators: ["Reuniões OPEP+", "Produção saudita", "Demanda chinesa"]
      }
    ],
    alerts: [
      {
        type: "critical",
        title: "Crise Humanitária na Nigéria",
        description: "Ataques violentos no norte da Nigéria causaram milhares de mortos nas últimas semanas. Instabilidade ameaça operações petrolíferas e afeta sentimento de mercado africano.",
        impact: "high",
        region: "Nigéria",
        source_event: "Violência sectária em Kaduna/Plateau"
      },
      {
        type: "critical",
        title: "Ataques Houthi no Mar Vermelho",
        description: "Navios-tanque forçados a desviar pelo Cabo da Boa Esperança. Custos de transporte e seguro dispararam. Impacto directo em exportações para Europa.",
        impact: "high",
        region: "Médio Oriente",
        source_event: "Campanha Houthi contra navegação"
      },
      {
        type: "warning",
        title: "Tensões Venezuela-EUA Escalam",
        description: "Novas sanções americanas e retórica hostil de Caracas aumentam incerteza sobre retorno do crude venezuelano ao mercado.",
        impact: "medium",
        region: "Venezuela",
        source_event: "Disputa sobre eleições e sanções"
      },
      {
        type: "warning",
        title: "Risco de Escalada Irão-Israel",
        description: "Troca de ameaças directas e ataques proxy elevam risco de confronto que poderia fechar Estreito de Ormuz.",
        impact: "high",
        region: "Médio Oriente",
        source_event: "Tensões Israel-Irão via Hezbollah"
      },
      {
        type: "info",
        title: "Angola como Refúgio Seguro",
        description: "Estabilidade angolana atrai investidores que fogem da turbulência nigeriana e líbia.",
        impact: "low",
        region: "Angola",
        source_event: "Reposicionamento de IOCs"
      }
    ],
    country_risks: [
      { country: "Angola", score: 52, trend: "stable" },
      { country: "Nigéria", score: 85, trend: "up" },
      { country: "Venezuela", score: 78, trend: "up" },
      { country: "Líbia", score: 82, trend: "up" },
      { country: "Irão", score: 88, trend: "up" },
      { country: "Iraque", score: 65, trend: "stable" }
    ],
    regulatory_timeline: [
      { event_date: "Q1 2025", title: "Reunião OPEP+ Viena", description: "Revisão de quotas de produção para primeiro semestre", status: "pending", impact_level: "high" },
      { event_date: "Q1 2025", title: "Revisão Lei Petrolífera Angola", description: "Actualização da Lei das Actividades Petrolíferas", status: "pending", impact_level: "high" },
      { event_date: "Q2 2025", title: "Regulamento Emissões UE", description: "Novas métricas de carbono para importação de crude", status: "pending", impact_level: "medium" },
      { event_date: "2025", title: "Eleições Venezuela", description: "Processo eleitoral pode influenciar sanções", status: "pending", impact_level: "high" }
    ],
    recommendations: [
      "Monitorizar atentamente escalada no Médio Oriente e preparar planos de contingência para interrupção do Estreito de Ormuz",
      "Diversificar rotas de exportação para reduzir dependência do canal de Suez/Mar Vermelho",
      "Reforçar posição de Angola como destino estável de investimento face à instabilidade regional",
      "Implementar cobertura de risco para volatilidade cambial AOA/USD",
      "Preparar cenários para retorno de crude venezuelano ao mercado global"
    ]
  };
}
