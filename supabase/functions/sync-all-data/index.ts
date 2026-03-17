import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    // Usar SERVICE_ROLE_KEY para chamadas internas para evitar restrições de RLS e JWT
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;

    console.log("🔄 Iniciando sincronização completa de dados...");

    const endpoints = [
      { name: "Preços", url: "fetch-oil-prices" },
      { name: "Produção", url: "fetch-production-data" },
      { name: "Exportação", url: "fetch-export-data" },
      { name: "Riscos", url: "fetch-risk-data" }
    ];

    const results: Record<string, any> = {};

    // Executar sincronizações sequencialmente para evitar sobrecarga
    for (const endpoint of endpoints) {
      try {
        console.log(`📡 Sincronizando ${endpoint.name}...`);
        const response = await fetch(`${supabaseUrl}/functions/v1/${endpoint.url}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ action: "sync" })
        });
        
        if (response.ok) {
          results[endpoint.url] = { success: true };
          console.log(`✅ ${endpoint.name} sincronizado com sucesso`);
        } else {
          const errorText = await response.text();
          results[endpoint.url] = { success: false, error: errorText };
          console.warn(`⚠️ Falha ao sincronizar ${endpoint.name}: ${response.status}`);
        }
      } catch (e) {
        results[endpoint.url] = { success: false, error: e instanceof Error ? e.message : "Erro desconhecido" };
        console.error(`❌ Erro crítico em ${endpoint.name}:`, e);
      }
    }

    const allSuccess = Object.values(results).every(r => r.success);
    
    return new Response(
      JSON.stringify({
        success: allSuccess,
        results,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, // Retornar 200 mesmo com falhas parciais para evitar erro no frontend
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("❌ Erro fatal na sincronização geral:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Erro interno" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
