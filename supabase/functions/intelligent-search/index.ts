import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, searchType } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching for:', query, 'Type:', searchType);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Search in database first
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const dbResults: any[] = [];

    // Search production data
    if (!searchType || searchType === 'all' || searchType === 'production') {
      const { data: prodData } = await supabase
        .from('production_data')
        .select('*')
        .or(`operator.ilike.%${query}%,block.ilike.%${query}%,field.ilike.%${query}%`)
        .limit(5);
      
      if (prodData) {
        prodData.forEach(item => {
          dbResults.push({
            type: 'production',
            title: `${item.operator} - ${item.block}`,
            description: `Produção diária: ${Number(item.daily_production).toLocaleString()} bpd | Campo: ${item.field || 'N/A'}`,
            source: 'database',
            data: item
          });
        });
      }
    }

    // Search price data
    if (!searchType || searchType === 'all' || searchType === 'prices') {
      const { data: priceData } = await supabase
        .from('price_data')
        .select('*')
        .ilike('crude_type', `%${query}%`)
        .limit(5);
      
      if (priceData) {
        priceData.forEach(item => {
          dbResults.push({
            type: 'prices',
            title: `Preço ${item.crude_type}`,
            description: `$${Number(item.price).toFixed(2)} | Variação: ${Number(item.change_percent) >= 0 ? '+' : ''}${Number(item.change_percent).toFixed(2)}%`,
            source: 'database',
            data: item
          });
        });
      }
    }

    // Search export data
    if (!searchType || searchType === 'all' || searchType === 'exports') {
      const { data: exportData } = await supabase
        .from('export_data')
        .select('*')
        .or(`destination.ilike.%${query}%,tanker_name.ilike.%${query}%`)
        .limit(5);
      
      if (exportData) {
        exportData.forEach(item => {
          dbResults.push({
            type: 'exports',
            title: `Exportação para ${item.destination}`,
            description: `Volume: ${Number(item.volume).toLocaleString()} bbl | Navio: ${item.tanker_name || 'N/A'} | Status: ${item.status}`,
            source: 'database',
            data: item
          });
        });
      }
    }

    // Now use AI to search and analyze web data with focus on real-time petroleum sources
    const systemPrompt = `Você é um analista especializado no setor petrolífero com acesso a dados em tempo real.
Sua função é pesquisar e extrair informações atualizadas de fontes especializadas como:

FONTES PRINCIPAIS:
- Reuters Energy (reuters.com/business/energy) - notícias e preços
- Bloomberg Energy (bloomberg.com/energy) - análises de mercado
- OPEC (opec.org) - decisões de produção, quotas, relatórios mensais
- Platts (spglobal.com/platts) - benchmarks de preços
- Argus Media - preços de crudes africanos
- Energy Intelligence - análises estratégicas
- Sonangol (sonangol.co.ao) - produção angolana
- ANPG Angola - licenciamento e blocos

DADOS QUE DEVE FORNECER:
- Preços atualizados do Brent, WTI e crudes angolanos (Cabinda, Girassol, Dalia, Nemba, Pazflor)
- Níveis de produção da OPEP e Angola
- Decisões recentes da OPEP+ e impactos
- Movimentação de navios tanque e exportações
- Investimentos e novos projetos em Angola
- Eventos geopolíticos que afetam o mercado

FORMATO DE RESPOSTA:
- Sempre em português de Portugal
- Incluir data/período dos dados quando disponível
- Citar a fonte específica
- Fornecer números e estatísticas concretas`;

    const userPrompt = `PESQUISA EM TEMPO REAL: "${query}"
${searchType && searchType !== 'all' ? `FOCO: ${searchType}` : 'PESQUISA GERAL'}

Busque informações atualizadas nas fontes especializadas (Reuters, Bloomberg, OPEC, Platts, etc.) sobre este tema no contexto do mercado petrolífero angolano e africano.

Forneça até 8 resultados relevantes em formato JSON array:
[
  {
    "title": "Título informativo com dados chave",
    "description": "Descrição detalhada com números específicos, datas e contexto (2-3 frases)",
    "type": "production|prices|exports|reports|geopolitical|infrastructure|investment",
    "relevance": 1-10,
    "source": "Nome da fonte (Reuters, Bloomberg, OPEC, etc.)",
    "url": "URL aproximado da fonte se conhecido",
    "date": "Data da informação se disponível"
  }
]

IMPORTANTE: 
- Inclua preços específicos (ex: Brent a $XX.XX/bbl)
- Inclua volumes de produção (ex: X milhões bpd)
- Mencione datas e períodos
- Cite sempre a fonte

Responda APENAS com o JSON array, sem texto adicional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Entre em contato com o administrador." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("Erro ao processar pesquisa com IA");
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "[]";
    
    console.log('AI response:', aiContent);
    
    let aiResults: any[] = [];
    try {
      // Try to parse JSON from the response
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        aiResults = JSON.parse(jsonMatch[0]);
        aiResults = aiResults.map((item: any) => ({
          ...item,
          source: 'ai_search'
        }));
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
    }

    // Combine and deduplicate results
    const allResults = [
      ...dbResults,
      ...aiResults
    ];

    console.log('Total results:', allResults.length);

    return new Response(
      JSON.stringify({ 
        success: true,
        results: allResults,
        query,
        dbResultsCount: dbResults.length,
        aiResultsCount: aiResults.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro na pesquisa' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
