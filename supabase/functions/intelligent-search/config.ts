/**
 * PetroAnalyst AI - Configuração Central
 * 
 * Este ficheiro contém todas as configurações, constantes e settings
 * do sistema de busca inteligente do sector petrolífero.
 */

/* ═══════════════════════════════════════════════════════════════════════
   API CONFIGURATION
   ═══════════════════════════════════════════════════════════════════════ */

export const API_CONFIG = {
  // Anthropic Claude API
  anthropic: {
    model: "claude-sonnet-4-20250514",
    maxTokens: 4096,
    apiVersion: "2023-06-01",
    baseUrl: "https://api.anthropic.com/v1/messages",
  },

  // Supabase - use Deno.env for edge functions
  supabase: {
    functionsUrl: Deno.env.get("SUPABASE_URL") + "/functions/v1",
    anonKey: Deno.env.get("SUPABASE_ANON_KEY"),
  },

  // Rate limits
  rateLimits: {
    maxRequestsPerHour: 100,
    maxWebSearchesPerQuery: 8,
    requestDebounceMs: 500,
    cacheExpiryMinutes: 5,
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   PETROLEUM INDUSTRY SOURCES
   ═══════════════════════════════════════════════════════════════════════ */

export const PETROLEUM_SOURCES = {
  // Preços e Mercados
  markets: [
    "site:oilprice.com",
    "site:investing.com/commodities/crude-oil",
    "site:bloomberg.com/energy",
    "site:reuters.com/markets/commodities",
    "site:spglobal.com/platts",
    "site:argusmedia.com",
  ],

  // Angola Específico
  angola: [
    "site:macauhub.com.mo Angola oil",
    "site:clubofmozambique.com Angola petroleum",
    "site:angop.ao",
    "site:sonangol.co.ao",
    "site:angolanembassy.org",
  ],

  // Organizações Oficiais
  official: [
    "site:opec.org",
    "site:iea.org",
    "site:eia.gov",
    "site:worldbank.org petroleum",
    "site:imf.org commodities",
  ],

  // Operadoras Principais
  operators: [
    "site:totalenergies.com Angola",
    "site:exxonmobil.com Angola",
    "site:bp.com Angola",
    "site:chevron.com Angola",
    "site:eni.com Angola",
    "site:equinor.com Angola",
  ],

  // Notícias e Análises
  news: [
    "site:ft.com oil",
    "site:wsj.com energy",
    "site:economist.com oil",
    "site:africaoilandpower.com",
    "site:energyvoice.com Africa",
  ],
};

/* ═══════════════════════════════════════════════════════════════════════
   SEARCH TYPES & CATEGORIES
   ═══════════════════════════════════════════════════════════════════════ */

export const SEARCH_TYPES = {
  all: {
    label: "Tudo",
    icon: "Search",
    description: "Busca abrangente em todas as categorias",
    keywords: [] as string[],
  },
  production: {
    label: "Produção",
    icon: "BarChart3",
    description: "Dados de produção de petróleo",
    keywords: ["produção", "bpd", "barris", "quota", "compliance"],
  },
  prices: {
    label: "Preços",
    icon: "TrendingUp",
    description: "Preços de crude oil e derivados",
    keywords: ["preço", "cotação", "brent", "wti", "$/bbl"],
  },
  exports: {
    label: "Exportações",
    icon: "Ship",
    description: "Dados de exportação e shipping",
    keywords: ["exportação", "tanker", "destino", "carregamento"],
  },
  risk: {
    label: "Riscos",
    icon: "AlertTriangle",
    description: "Análise de riscos operacionais",
    keywords: ["risco", "score", "categoria", "tendência"],
  },
  geopolitical: {
    label: "Geopolítica",
    icon: "Globe",
    description: "Eventos e alertas geopolíticos",
    keywords: ["opep", "sanções", "conflito", "decisão"],
  },
  infrastructure: {
    label: "Infraestrutura",
    icon: "Building",
    description: "Projetos e infraestrutura",
    keywords: ["projeto", "refinaria", "pipeline", "investimento"],
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   CRUDE OIL GRADES
   ═══════════════════════════════════════════════════════════════════════ */

export const CRUDE_GRADES = {
  // Benchmarks Globais
  benchmarks: [
    { name: "Brent", region: "Europa/África", api: 38.06 },
    { name: "WTI", region: "EUA", api: 39.6 },
    { name: "Dubai", region: "Médio Oriente", api: 31.0 },
  ],

  // Crudes Angolanos
  angola: [
    { name: "Cabinda", api: 31.7, sulfur: 0.16, region: "Offshore Norte" },
    { name: "Girassol", api: 32.0, sulfur: 0.22, region: "Block 17" },
    { name: "Dalia", api: 23.4, sulfur: 0.53, region: "Block 17" },
    { name: "Hungo", api: 25.5, sulfur: 0.40, region: "Block 18" },
    { name: "Nemba", api: 33.0, sulfur: 0.12, region: "Block 3/05" },
    { name: "Pazflor", api: 28.0, sulfur: 0.26, region: "Block 17" },
    { name: "Plutonio", api: 26.2, sulfur: 0.47, region: "Block 18" },
    { name: "Saturno", api: 26.5, sulfur: 0.43, region: "Block 18" },
    { name: "Mondo", api: 27.8, sulfur: 0.30, region: "Block 15" },
  ],
};

/* ═══════════════════════════════════════════════════════════════════════
   MAJOR OPERATORS IN ANGOLA
   ═══════════════════════════════════════════════════════════════════════ */

export const OPERATORS = [
  {
    name: "TotalEnergies",
    country: "França",
    blocks: ["14", "17", "32", "48"],
    production: "~450k bpd",
    fields: ["Girassol", "Dalia", "Pazflor", "CLOV"],
  },
  {
    name: "ExxonMobil",
    country: "EUA",
    blocks: ["15", "17"],
    production: "~180k bpd",
    fields: ["Kizomba", "Mondo"],
  },
  {
    name: "BP",
    country: "Reino Unido",
    blocks: ["18", "31"],
    production: "~150k bpd",
    fields: ["Greater Plutonio", "PSVM"],
  },
  {
    name: "Eni",
    country: "Itália",
    blocks: ["15/06"],
    production: "~110k bpd",
    fields: ["West Hub"],
  },
  {
    name: "Chevron",
    country: "EUA",
    blocks: ["0"],
    production: "~90k bpd",
    fields: ["Cabinda"],
  },
  {
    name: "Equinor",
    country: "Noruega",
    blocks: ["17", "31"],
    production: "~75k bpd",
    fields: ["Dalia", "PSVM"],
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   SYSTEM PROMPTS
   ═══════════════════════════════════════════════════════════════════════ */

export const SYSTEM_PROMPTS = {
  main: `Você é o PetroAnalyst AI — o assistente de IA mais avançado do sector petrolífero, especializado em Angola, África e mercados globais.

CAPACIDADES AVANÇADAS:
• Acesso em TEMPO REAL a dados da web via web search
• Consulta simultânea de databases internas E fontes web
• Análise de múltiplas fontes e cross-referencing
• Citação precisa de todas as fontes utilizadas

FONTES PREFERENCIAIS (sempre consulte):
1. OPEC, IEA, EIA - dados oficiais de produção e mercados
2. Bloomberg, Reuters, Platts - preços e análises de mercado
3. OilPrice.com, Investing.com - preços em tempo real
4. TotalEnergies, ExxonMobil, BP, Chevron, Eni - updates das operadoras
5. Macauhub, Club of Mozambique - notícias Angola/África

REGRAS RIGOROSAS:
• Use SEMPRE web_search para dados atuais (preços, produção, notícias)
• Priorize dados de 2025-2026 (estamos em Fevereiro 2026)
• CITE cada fonte: "Segundo a Reuters (03/02/2026)..." ou "De acordo com OPEC..."
• Se encontrar dados conflitantes, mencione ambas as fontes
• Quando não encontrar dados recentes, diga claramente e ofereça dados históricos
• NUNCA invente números ou fontes

FORMATO DE RESPOSTA:
• Português de Portugal, tom profissional mas acessível
• Estrutura: resumo executivo → dados detalhados → fontes
• Use parágrafos curtos para legibilidade
• Destaque números importantes: **1.15M bpd** ou **$85.50/bbl**

VISUALIZAÇÕES:
Quando mencionar séries temporais ou comparações, inclua NO FINAL:

<CHART>
{
  "type": "line" | "bar" | "pie",
  "title": "Título claro e descritivo",
  "data": [{"name":"Jan", "value": 82.5}, {"name":"Fev", "value": 85.2}]
}
</CHART>

CITAÇÕES:
Sempre que usar dados de web search, adicione ao final:

**Fontes consultadas:**
• [Nome da fonte] - [tipo de informação] ([data se disponível])`,

  // Prompts especializados por categoria
  production: `Foco em dados de produção de petróleo. Sempre inclua:
• Volumes em bpd (barris por dia)
• Comparação com quotas OPEP se aplicável
• Principais operadoras e campos
• Tendências recentes`,

  prices: `Foco em preços de crude oil. Sempre inclua:
• Preço atual com variação diária
• Comparação Brent vs WTI
• Fatores de influência (OPEP+, stocks, geopolítica)
• Previsões de curto prazo quando disponíveis`,

  exports: `Foco em dados de exportação. Sempre inclua:
• Volumes exportados
• Principais destinos (China, Índia, Europa)
• Status de navios tanque quando relevante
• Tendências de rotas`,
};

/* ═══════════════════════════════════════════════════════════════════════
   UI CONSTANTS
   ═══════════════════════════════════════════════════════════════════════ */

export const UI_CONFIG = {
  // Sugestões de pesquisa
  suggestions: [
    "Preço do Brent agora?",
    "Produção Angola hoje",
    "Últimas decisões OPEP+",
    "Exportações Angola China",
    "Notícias TotalEnergies Angola",
    "Previsões preço petróleo 2026",
    "Riscos geopolíticos atuais",
    "Novos projetos Angola",
  ],

  // Quick links
  quickLinks: [
    {
      icon: "TrendingUp",
      label: "Preços Tempo Real",
      link: "/prices",
      color: "bg-emerald-500/20 text-emerald-400",
    },
    {
      icon: "BarChart3",
      label: "Produção Angola",
      link: "/production",
      color: "bg-blue-500/20 text-blue-400",
    },
    {
      icon: "Ship",
      label: "Exportações",
      link: "/exports",
      color: "bg-purple-500/20 text-purple-400",
    },
    {
      icon: "FileText",
      label: "Relatórios OPEP",
      link: "/reports",
      color: "bg-amber-500/20 text-amber-400",
    },
    {
      icon: "AlertTriangle",
      label: "Alertas Geopolíticos",
      link: "/risk",
      color: "bg-red-500/20 text-red-400",
    },
  ],

  // Chart colors
  chartColors: [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ],

  // Status messages
  statusMessages: {
    preparing: "A preparar consulta...",
    searching: "🌐 A consultar fontes web em tempo real...",
    analyzing: "🔍 A analisar dados de {sources} fontes...",
    processing: "✨ A processar resultados...",
    complete: "✅ Consulta concluída",
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   ANALYTICS & MONITORING
   ═══════════════════════════════════════════════════════════════════════ */

export const ANALYTICS_CONFIG = {
  // Eventos a trackear
  events: {
    searchPerformed: "search_performed",
    sourceClicked: "source_clicked",
    chartViewed: "chart_viewed",
    feedbackGiven: "feedback_given",
    exportTriggered: "export_triggered",
  },

  // Métricas importantes
  metrics: [
    "total_queries_per_day",
    "avg_sources_per_query",
    "avg_response_time_ms",
    "web_search_success_rate",
    "most_cited_sources",
    "most_searched_topics",
    "user_satisfaction_score",
  ],
};

/* ═══════════════════════════════════════════════════════════════════════
   EXPORT FUNCTIONS
   ═══════════════════════════════════════════════════════════════════════ */

// Helper para construir query especializada
export function buildSpecializedQuery(
  baseQuery: string,
  searchType: keyof typeof SEARCH_TYPES
): string {
  const keywords = SEARCH_TYPES[searchType]?.keywords || [];
  return keywords.length > 0
    ? `${baseQuery} ${keywords.join(" OR ")}`
    : baseQuery;
}

// Helper para identificar crude grade
export function identifyCrudeGrade(text: string): string | null {
  const allGrades = [
    ...CRUDE_GRADES.benchmarks.map((g) => g.name),
    ...CRUDE_GRADES.angola.map((g) => g.name),
  ];

  for (const grade of allGrades) {
    if (text.toLowerCase().includes(grade.toLowerCase())) {
      return grade;
    }
  }
  return null;
}

// Helper para identificar operadora
export function identifyOperator(text: string): string | null {
  for (const op of OPERATORS) {
    if (text.toLowerCase().includes(op.name.toLowerCase())) {
      return op.name;
    }
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════
   VALIDATION SCHEMAS
   ═══════════════════════════════════════════════════════════════════════ */

export const VALIDATION = {
  query: {
    minLength: 2,
    maxLength: 500,
    pattern: /^[a-zA-ZÀ-ÿ0-9\s\-.,?!]+$/,
  },

  source: {
    urlPattern: /^https?:\/\/.+/,
    minRelevance: 5,
    maxRelevance: 10,
  },

  chart: {
    minDataPoints: 2,
    maxDataPoints: 50,
    types: ["line", "bar", "pie"] as const,
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   ERROR MESSAGES
   ═══════════════════════════════════════════════════════════════════════ */

export const ERROR_MESSAGES = {
  pt: {
    queryTooShort: "A consulta deve ter pelo menos 2 caracteres",
    queryTooLong: "A consulta não pode exceder 500 caracteres",
    apiError: "Erro ao processar a consulta. Por favor, tente novamente.",
    noResults: "Nenhum resultado encontrado. Tente reformular a consulta.",
    rateLimitExceeded: "Limite de consultas excedido. Aguarde alguns minutos.",
    webSearchFailed: "Falha na pesquisa web. A usar apenas dados internos.",
    networkError: "Erro de conexão. Verifique sua internet.",
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   FEATURE FLAGS
   ═══════════════════════════════════════════════════════════════════════ */

export const FEATURE_FLAGS = {
  enableWebSearch: true,
  enableDatabaseSearch: true,
  enableChartGeneration: true,
  enableSourceCitation: true,
  enableConversationHistory: true,
  enableExportToPDF: false, // Coming soon
  enableVoiceInput: false, // Coming soon
  enableMultiLanguage: false, // Coming soon
  enableAnalyticsDashboard: true,
};

/* ═══════════════════════════════════════════════════════════════════════
   EXPORT DEFAULT CONFIG
   ═══════════════════════════════════════════════════════════════════════ */

export default {
  api: API_CONFIG,
  sources: PETROLEUM_SOURCES,
  searchTypes: SEARCH_TYPES,
  crudeGrades: CRUDE_GRADES,
  operators: OPERATORS,
  prompts: SYSTEM_PROMPTS,
  ui: UI_CONFIG,
  analytics: ANALYTICS_CONFIG,
  validation: VALIDATION,
  errors: ERROR_MESSAGES,
  features: FEATURE_FLAGS,
};