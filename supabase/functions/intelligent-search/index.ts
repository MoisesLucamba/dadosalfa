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

    // Now use AI to search and analyze web data
    const systemPrompt = `Você é um assistente especializado no setor petrolífero de Angola. 
Sua função é fornecer informações atualizadas sobre:
- Produção de petróleo em Angola (operadores, blocos, campos)
- Preços do Brent e crudes angolanos (Cabinda, Girassol, Dalia, Nemba)
- Exportações de petróleo (destinos, volumes, navios)
- Decisões da OPEP+ e impactos no mercado angolano
- Notícias e eventos geopolíticos relevantes

Responda sempre em português de Portugal. Forneça dados específicos e atualizados quando possível.
Estruture sua resposta em formato JSON com os seguintes campos para cada resultado:
- title: título curto e informativo
- description: descrição detalhada (máximo 2 frases)
- type: categoria (production, prices, exports, reports, geopolitical)
- relevance: pontuação de relevância de 1-10
- source: fonte da informação (se conhecida)`;

    const userPrompt = `Pesquisa sobre "${query}" no contexto do mercado petrolífero angolano.
${searchType && searchType !== 'all' ? `Foco em: ${searchType}` : ''}

Forneça até 5 resultados relevantes em formato JSON array. Cada resultado deve ter:
{
  "title": "...",
  "description": "...",
  "type": "production|prices|exports|reports|geopolitical",
  "relevance": 1-10,
  "source": "..."
}

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
