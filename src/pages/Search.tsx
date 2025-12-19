import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon, TrendingUp, BarChart3, Ship, FileText, Globe, Clock, Loader2, ArrowRight, Sparkles, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SearchResult {
  title: string;
  description: string;
  type: string;
  source: string;
  relevance?: number;
  data?: any;
  url?: string;
  date?: string;
}

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const recentSearches = [
    "Bloco 17 produção",
    "Preço Brent histórico",
    "Exportações China",
    "TotalEnergies Angola",
    "OPEP+ decisões 2024"
  ];

  const quickLinks = [
    { icon: TrendingUp, label: "Preços Atuais", link: "/prices", color: "bg-emerald-500/20 text-emerald-400" },
    { icon: BarChart3, label: "Produção Angola", link: "/production", color: "bg-blue-500/20 text-blue-400" },
    { icon: Ship, label: "Exportações", link: "/exports", color: "bg-purple-500/20 text-purple-400" },
    { icon: FileText, label: "Relatórios", link: "/reports", color: "bg-amber-500/20 text-amber-400" },
    { icon: Globe, label: "Risco Geopolítico", link: "/risk", color: "bg-red-500/20 text-red-400" },
  ];

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "production": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "prices": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "exports": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "reports": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "geopolitical": return "bg-red-500/20 text-red-400 border-red-500/30";
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
      case "infrastructure": return "Infraestrutura";
      case "investment": return "Investimento";
      default: return type;
    }
  };

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setSearchResults([]);

    try {
      const searchType = activeTab === "all" ? undefined : activeTab;
      
      const { data, error } = await supabase.functions.invoke('intelligent-search', {
        body: { query: searchTerm, searchType }
      });

      if (error) {
        throw error;
      }

      if (data?.success && data?.results) {
        setSearchResults(data.results);
        toast.success(`Encontrados ${data.results.length} resultados`, {
          description: `${data.dbResultsCount || 0} do banco de dados, ${data.aiResultsCount || 0} da pesquisa IA`
        });
      } else if (data?.error) {
        throw new Error(data.error);
      }
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
              Pesquise dados internos e extraia informações em tempo real de Reuters, Bloomberg, OPEC e mais
            </p>
            
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar blocos, operadores, preços, exportações..."
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
                  <TabsList className="grid grid-cols-5 mb-4 h-auto">
                    <TabsTrigger value="all" className="text-xs sm:text-sm py-2">Todos</TabsTrigger>
                    <TabsTrigger value="production" className="text-xs sm:text-sm py-2">Produção</TabsTrigger>
                    <TabsTrigger value="prices" className="text-xs sm:text-sm py-2">Preços</TabsTrigger>
                    <TabsTrigger value="exports" className="text-xs sm:text-sm py-2">Exportações</TabsTrigger>
                    <TabsTrigger value="geopolitical" className="text-xs sm:text-sm py-2">Geopolítico</TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="space-y-3">
                    {isSearching ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Pesquisando na base de dados e na web...</p>
                      </div>
                    ) : filteredResults.length > 0 ? (
                      filteredResults.map((result, index) => (
                        <div
                          key={index}
                          className="p-3 sm:p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer group"
                          onClick={() => result.url && window.open(result.url, '_blank')}
                        >
                          <div className="flex items-start justify-between gap-3">
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
                                  {result.source && result.source !== 'database' && result.source !== 'ai_search' && (
                                    <Badge variant="outline" className="text-[10px] w-fit bg-accent/20">
                                      <Globe className="h-2 w-2 mr-1" />
                                      {result.source}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">{result.description}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-3">
                                {result.date && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-2 w-2" />
                                    {result.date}
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
                                {result.url && (
                                  <span className="text-[10px] text-primary hover:underline">
                                    Ver fonte →
                                  </span>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                          </div>
                        </div>
                      ))
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
