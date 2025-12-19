import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon, TrendingUp, BarChart3, Ship, FileText, Globe, Clock, Loader2, ArrowRight, Sparkles, Database, AlertTriangle, MapPin, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";

interface SearchResult {
  title: string;
  description: string;
  type: string;
  source: string;
  relevance?: number;
  data?: any;
  url?: string;
  date?: string;
  chartData?: any[];
  chartType?: "line" | "bar" | "pie";
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedResult, setExpandedResult] = useState<number | null>(null);

  const recentSearches = [
    "Bloco 17 produção",
    "Preço Brent histórico",
    "Exportações China",
    "Risco geopolítico Angola",
    "OPEP+ decisões 2024"
  ];

  const quickLinks = [
    { icon: TrendingUp, label: "Preços Atuais", link: "/prices", color: "bg-emerald-500/20 text-emerald-400" },
    { icon: BarChart3, label: "Produção Angola", link: "/production", color: "bg-blue-500/20 text-blue-400" },
    { icon: Ship, label: "Exportações", link: "/exports", color: "bg-purple-500/20 text-purple-400" },
    { icon: FileText, label: "Relatórios", link: "/reports", color: "bg-amber-500/20 text-amber-400" },
    { icon: AlertTriangle, label: "Risco Geopolítico", link: "/risk", color: "bg-red-500/20 text-red-400" },
  ];

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "production": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "prices": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "exports": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "reports": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "geopolitical": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "risk": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "infrastructure": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case "investment": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case "production": return "Produção";
      case "prices": return "Preços";
      case "exports": return "Exportações";
      case "reports": return "Relatório";
      case "geopolitical": return "Geopolítico";
      case "risk": return "Risco";
      case "infrastructure": return "Infraestrutura";
      case "investment": return "Investimento";
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "production": return BarChart3;
      case "prices": return DollarSign;
      case "exports": return Ship;
      case "reports": return FileText;
      case "geopolitical": return AlertTriangle;
      case "risk": return AlertTriangle;
      default: return Globe;
    }
  };

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setSearchResults([]);
    setExpandedResult(null);

    try {
      const searchType = activeTab === "all" ? undefined : activeTab;
      
      // Fetch from database directly for more comprehensive results
      const [productionRes, priceRes, exportRes, riskRes, riskAlertRes] = await Promise.all([
        supabase.from("production_data").select("*").or(`operator.ilike.%${searchTerm}%,block.ilike.%${searchTerm}%,field.ilike.%${searchTerm}%`).limit(10),
        supabase.from("price_data").select("*").ilike("crude_type", `%${searchTerm}%`).limit(10),
        supabase.from("export_data").select("*").or(`destination.ilike.%${searchTerm}%,tanker_name.ilike.%${searchTerm}%`).limit(10),
        supabase.from("risk_data").select("*").or(`category.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`).limit(10),
        supabase.from("risk_alerts").select("*").or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`).eq("is_active", true).limit(10),
      ]);

      const results: SearchResult[] = [];

      // Process production results with chart data
      if (productionRes.data && productionRes.data.length > 0) {
        const chartData = productionRes.data.slice(0, 7).map(p => ({
          name: p.block,
          value: Number(p.daily_production),
        }));
        
        results.push({
          title: `Produção: ${productionRes.data.length} registros encontrados`,
          description: `Operadores: ${[...new Set(productionRes.data.map(p => p.operator))].join(", ")}`,
          type: "production",
          source: "database",
          relevance: 9,
          chartData,
          chartType: "bar",
          data: productionRes.data,
        });

        productionRes.data.slice(0, 3).forEach(p => {
          results.push({
            title: `${p.operator} - ${p.block}`,
            description: `Produção diária: ${Number(p.daily_production).toLocaleString()} bpd | Campo: ${p.field || "N/A"} | Status: ${p.status || "Ativo"}`,
            type: "production",
            source: "database",
            relevance: 8,
            date: p.data_date,
          });
        });
      }

      // Process price results with chart data
      if (priceRes.data && priceRes.data.length > 0) {
        const chartData = priceRes.data.slice(0, 10).reverse().map(p => ({
          name: new Date(p.data_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          value: Number(p.price),
        }));

        results.push({
          title: `Preços: ${priceRes.data.length} registros encontrados`,
          description: `Tipos de crude: ${[...new Set(priceRes.data.map(p => p.crude_type))].join(", ")}`,
          type: "prices",
          source: "database",
          relevance: 9,
          chartData,
          chartType: "line",
          data: priceRes.data,
        });

        priceRes.data.slice(0, 3).forEach(p => {
          results.push({
            title: `${p.crude_type} - $${Number(p.price).toFixed(2)}`,
            description: `Variação: ${Number(p.change_percent) >= 0 ? "+" : ""}${Number(p.change_percent).toFixed(2)}% | Volume: ${Number(p.volume).toLocaleString() || "N/A"} bbl`,
            type: "prices",
            source: "database",
            relevance: 8,
            date: p.data_date,
          });
        });
      }

      // Process export results with chart data
      if (exportRes.data && exportRes.data.length > 0) {
        const destinationVolumes: Record<string, number> = {};
        exportRes.data.forEach(e => {
          destinationVolumes[e.destination] = (destinationVolumes[e.destination] || 0) + Number(e.volume);
        });
        const chartData = Object.entries(destinationVolumes).map(([name, value]) => ({ name, value }));

        results.push({
          title: `Exportações: ${exportRes.data.length} registros encontrados`,
          description: `Destinos: ${[...new Set(exportRes.data.map(e => e.destination))].join(", ")}`,
          type: "exports",
          source: "database",
          relevance: 9,
          chartData,
          chartType: "pie",
          data: exportRes.data,
        });

        exportRes.data.slice(0, 3).forEach(e => {
          results.push({
            title: `Exportação para ${e.destination}`,
            description: `Volume: ${Number(e.volume).toLocaleString()} bbl | Navio: ${e.tanker_name || "N/A"} | Status: ${e.status === "in_transit" ? "Em Trânsito" : e.status === "delivered" ? "Entregue" : "Carregando"}`,
            type: "exports",
            source: "database",
            relevance: 8,
            date: e.data_date,
          });
        });
      }

      // Process risk results with chart data
      if (riskRes.data && riskRes.data.length > 0) {
        const categoryScores: Record<string, number> = {};
        riskRes.data.forEach(r => {
          if (!categoryScores[r.category] || categoryScores[r.category] < r.score) {
            categoryScores[r.category] = r.score;
          }
        });
        const chartData = Object.entries(categoryScores).map(([name, value]) => ({ name, value }));

        results.push({
          title: `Riscos: ${riskRes.data.length} registros encontrados`,
          description: `Categorias: ${[...new Set(riskRes.data.map(r => r.category))].join(", ")}`,
          type: "risk",
          source: "database",
          relevance: 9,
          chartData,
          chartType: "bar",
          data: riskRes.data,
        });

        riskRes.data.slice(0, 3).forEach(r => {
          results.push({
            title: `Risco ${r.category}: Score ${r.score}/100`,
            description: r.description || `Tendência: ${r.trend === "up" ? "↑ Subindo" : r.trend === "down" ? "↓ Descendo" : "→ Estável"}`,
            type: "risk",
            source: "database",
            relevance: 8,
            date: r.data_date,
          });
        });
      }

      // Process risk alerts
      if (riskAlertRes.data && riskAlertRes.data.length > 0) {
        riskAlertRes.data.forEach(a => {
          results.push({
            title: `⚠️ ${a.title}`,
            description: `${a.description} | Região: ${a.region || "Global"} | Impacto: ${a.impact || "N/A"}`,
            type: "geopolitical",
            source: "database",
            relevance: 10,
          });
        });
      }

      // Also call the AI search for additional context
      try {
        const { data, error } = await supabase.functions.invoke('intelligent-search', {
          body: { query: searchTerm, searchType }
        });

        if (data?.success && data?.results) {
          data.results.forEach((r: SearchResult) => {
            if (r.source === 'ai_search') {
              results.push({
                ...r,
                relevance: 7,
              });
            }
          });
        }
      } catch (aiError) {
        console.log('AI search unavailable, using database results only');
      }

      // Sort by relevance
      results.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));

      setSearchResults(results);
      toast.success(`Encontrados ${results.length} resultados`, {
        description: `Pesquisa completa em múltiplas fontes`
      });
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Erro na pesquisa', {
        description: error instanceof Error ? error.message : 'Tente novamente'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const filteredResults = activeTab === "all" 
    ? searchResults 
    : searchResults.filter(r => r.type.toLowerCase() === activeTab);

  const renderChart = (result: SearchResult) => {
    if (!result.chartData || result.chartData.length === 0) return null;

    return (
      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {result.chartType === "line" ? (
            <LineChart data={result.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          ) : result.chartType === "pie" ? (
            <PieChart>
              <Pie
                data={result.chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {result.chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          ) : (
            <BarChart data={result.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeItem="/search" />
      
      <div className="flex-1 flex flex-col">
        <Header activeItem="/search" />
        
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          {/* Search Header */}
          <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground text-center mb-2">
              Pesquisa Inteligente
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground text-center mb-4 sm:mb-6">
              Pesquise dados de produção, preços, exportações e riscos geopolíticos com visualizações interativas
            </p>
            
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar blocos, operadores, preços, exportações, riscos..."
                className="pl-12 pr-32 py-6 text-base sm:text-lg bg-card border-border rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button 
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90"
                onClick={() => handleSearch()}
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">{isSearching ? 'Pesquisando...' : 'Pesquisar'}</span>
              </Button>
            </div>

            {/* Recent Searches */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Sugestões:
              </span>
              {recentSearches.map((search, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                  onClick={() => {
                    setSearchQuery(search);
                    handleSearch(search);
                  }}
                >
                  {search}
                </Badge>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          {!hasSearched && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {quickLinks.map((link, index) => (
                <a 
                  key={index}
                  href={link.link}
                  className="block"
                >
                  <Card className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group h-full">
                    <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
                      <div className={`p-2 sm:p-3 rounded-lg ${link.color} mb-2 group-hover:scale-110 transition-transform`}>
                        <link.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-foreground">{link.label}</span>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          )}

          {/* Search Results */}
          {(hasSearched || searchResults.length > 0) && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg text-foreground flex items-center gap-2">
                  Resultados da Pesquisa
                  {searchResults.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {searchResults.length} resultados
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-6 mb-4 h-auto">
                    <TabsTrigger value="all" className="text-xs sm:text-sm py-2">Todos</TabsTrigger>
                    <TabsTrigger value="production" className="text-xs sm:text-sm py-2">Produção</TabsTrigger>
                    <TabsTrigger value="prices" className="text-xs sm:text-sm py-2">Preços</TabsTrigger>
                    <TabsTrigger value="exports" className="text-xs sm:text-sm py-2">Exportações</TabsTrigger>
                    <TabsTrigger value="risk" className="text-xs sm:text-sm py-2">Riscos</TabsTrigger>
                    <TabsTrigger value="geopolitical" className="text-xs sm:text-sm py-2">Geopolítico</TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="space-y-3">
                    {isSearching ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Pesquisando na base de dados e na web...</p>
                      </div>
                    ) : filteredResults.length > 0 ? (
                      filteredResults.map((result, index) => {
                        const IconComponent = getTypeIcon(result.type);
                        const isExpanded = expandedResult === index;
                        
                        return (
                          <div
                            key={index}
                            className={`p-3 sm:p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer ${isExpanded ? 'ring-2 ring-primary/50' : ''}`}
                            onClick={() => {
                              if (result.chartData) {
                                setExpandedResult(isExpanded ? null : index);
                              } else if (result.url) {
                                window.open(result.url, '_blank');
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className={`p-2 rounded-lg ${getTypeColor(result.type).split(' ')[0]}`}>
                                  <IconComponent className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                    <h4 className="font-medium text-sm text-foreground">{result.title}</h4>
                                    <div className="flex flex-wrap gap-1">
                                      <Badge className={`text-[10px] w-fit ${getTypeColor(result.type)}`}>
                                        {getTypeLabel(result.type)}
                                      </Badge>
                                      {result.source === 'database' && (
                                        <Badge variant="outline" className="text-[10px] w-fit">
                                          <Database className="h-2 w-2 mr-1" />
                                          BD
                                        </Badge>
                                      )}
                                      {result.source === 'ai_search' && (
                                        <Badge variant="outline" className="text-[10px] w-fit bg-primary/10">
                                          <Sparkles className="h-2 w-2 mr-1" />
                                          IA
                                        </Badge>
                                      )}
                                      {result.chartData && (
                                        <Badge variant="outline" className="text-[10px] w-fit bg-emerald-500/10 text-emerald-400">
                                          <BarChart3 className="h-2 w-2 mr-1" />
                                          Gráfico
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{result.description}</p>
                                  <div className="mt-2 flex flex-wrap items-center gap-3">
                                    {result.date && (
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-2 w-2" />
                                        {new Date(result.date).toLocaleDateString('pt-BR')}
                                      </span>
                                    )}
                                    {result.relevance && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-muted-foreground">Relevância:</span>
                                        <div className="flex gap-0.5">
                                          {[...Array(10)].map((_, i) => (
                                            <div 
                                              key={i} 
                                              className={`w-1.5 h-1.5 rounded-full ${i < result.relevance! ? 'bg-primary' : 'bg-muted'}`} 
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {result.chartData && (
                                      <span className="text-[10px] text-primary">
                                        {isExpanded ? 'Clique para fechar' : 'Clique para ver gráfico'} →
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Render chart if expanded */}
                                  {isExpanded && result.chartData && renderChart(result)}
                                </div>
                              </div>
                              <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12">
                        <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          {hasSearched ? 'Nenhum resultado encontrado' : 'Digite algo para pesquisar'}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default Search;
