import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon, TrendingUp, BarChart3, Ship, FileText, Globe, Clock, Filter, ArrowRight } from "lucide-react";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const recentSearches = [
    "Bloco 17 produção",
    "Preço Brent histórico",
    "Exportações China",
    "TotalEnergies Angola",
    "OPEP+ decisões 2024"
  ];

  const searchResults = {
    production: [
      { title: "Bloco 17 - Produção Mensal", description: "Dados de produção do Bloco 17 operado pela TotalEnergies", type: "Produção", link: "/production" },
      { title: "Bloco 15 - Análise de Declínio", description: "Taxa de declínio e projeções para o Bloco 15", type: "Produção", link: "/production" },
    ],
    prices: [
      { title: "Histórico Preço Brent", description: "Evolução do preço do Brent nos últimos 12 meses", type: "Preços", link: "/prices" },
      { title: "Spread Cabinda vs Brent", description: "Análise comparativa de spreads", type: "Preços", link: "/prices" },
    ],
    exports: [
      { title: "Exportações para China", description: "Volume e destino das exportações angolanas para China", type: "Exportações", link: "/exports" },
      { title: "Terminal de Soyo", description: "Movimentação e capacidade do terminal", type: "Exportações", link: "/exports" },
    ],
    reports: [
      { title: "Relatório Mensal - Novembro 2024", description: "Análise completa do mercado petrolífero angolano", type: "Relatório", link: "/reports" },
      { title: "Análise OPEP+ Q4 2024", description: "Impacto das decisões OPEP+ no mercado", type: "Relatório", link: "/reports" },
    ],
  };

  const quickLinks = [
    { icon: TrendingUp, label: "Preços Atuais", link: "/prices", color: "bg-emerald-500/20 text-emerald-400" },
    { icon: BarChart3, label: "Produção Angola", link: "/production", color: "bg-blue-500/20 text-blue-400" },
    { icon: Ship, label: "Exportações", link: "/exports", color: "bg-purple-500/20 text-purple-400" },
    { icon: FileText, label: "Relatórios", link: "/reports", color: "bg-amber-500/20 text-amber-400" },
    { icon: Globe, label: "Risco Geopolítico", link: "/risk", color: "bg-red-500/20 text-red-400" },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Produção": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Preços": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "Exportações": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "Relatório": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default: return "bg-muted text-muted-foreground";
    }
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
              Encontre dados de produção, preços, exportações e relatórios
            </p>
            
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar blocos, operadores, preços, exportações..."
                className="pl-12 pr-4 py-6 text-base sm:text-lg bg-card border-border rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90">
                <Filter className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Filtros</span>
              </Button>
            </div>

            {/* Recent Searches */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Recentes:
              </span>
              {recentSearches.map((search, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                  onClick={() => setSearchQuery(search)}
                >
                  {search}
                </Badge>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {quickLinks.map((link, index) => (
              <Card 
                key={index} 
                className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group"
              >
                <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
                  <div className={`p-2 sm:p-3 rounded-lg ${link.color} mb-2 group-hover:scale-110 transition-transform`}>
                    <link.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-foreground">{link.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search Results */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg text-foreground">Resultados da Pesquisa</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid grid-cols-5 mb-4 h-auto">
                  <TabsTrigger value="all" className="text-xs sm:text-sm py-2">Todos</TabsTrigger>
                  <TabsTrigger value="production" className="text-xs sm:text-sm py-2">Produção</TabsTrigger>
                  <TabsTrigger value="prices" className="text-xs sm:text-sm py-2">Preços</TabsTrigger>
                  <TabsTrigger value="exports" className="text-xs sm:text-sm py-2">Exportações</TabsTrigger>
                  <TabsTrigger value="reports" className="text-xs sm:text-sm py-2">Relatórios</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-3">
                  {Object.values(searchResults).flat().map((result, index) => (
                    <div
                      key={index}
                      className="p-3 sm:p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <h4 className="font-medium text-sm text-foreground">{result.title}</h4>
                            <Badge className={`text-[10px] w-fit ${getTypeColor(result.type)}`}>
                              {result.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{result.description}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </TabsContent>

                {Object.entries(searchResults).map(([key, results]) => (
                  <TabsContent key={key} value={key} className="space-y-3">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className="p-3 sm:p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                              <h4 className="font-medium text-sm text-foreground">{result.title}</h4>
                              <Badge className={`text-[10px] w-fit ${getTypeColor(result.type)}`}>
                                {result.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{result.description}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Search;
