import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Search, Plus, ExternalLink, Building2, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = [
  "Perfuração",
  "Logística Offshore",
  "Manutenção & Engenharia",
  "Geofísica & Sísmica",
  "Catering & Suporte",
  "Tecnologia & Software",
  "Segurança",
  "Ambiental",
  "Jurídico & Consultoria",
  "Outro",
];

interface Provider {
  id: string;
  name: string;
  logo_url: string | null;
  categories: string[];
  website: string | null;
  description: string | null;
}

export default function ServiceProviders() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("Todos");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    company_name: "", category: "", website: "", contact_email: "", notes: "",
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("service_providers")
        .select("id, name, logo_url, categories, website, description")
        .eq("is_active", true)
        .order("name");
      if (error) toast({ title: "Erro a carregar fornecedores", description: error.message, variant: "destructive" });
      else setProviders((data ?? []) as Provider[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return providers.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCat === "Todos" || p.categories?.includes(activeCat);
      return matchSearch && matchCat;
    });
  }, [providers, search, activeCat]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.company_name.trim() || !form.category) {
      toast({ title: "Preencha nome e categoria", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("service_provider_suggestions").insert({
      user_id: user.id,
      company_name: form.company_name.trim(),
      category: form.category,
      website: form.website || null,
      contact_email: form.contact_email || null,
      notes: form.notes || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Erro ao submeter", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sugestão enviada", description: "A nossa equipa irá analisar." });
      setForm({ company_name: "", category: "", website: "", contact_email: "", notes: "" });
      setOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Helmet>
        <title>Fornecedores | AlphaData</title>
        <meta name="description" content="Diretório de empresas prestadoras de serviços ao setor petrolífero em Angola." />
      </Helmet>
      <Sidebar activeItem="/service-providers" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start justify-between gap-4 mb-6 flex-wrap"
            >
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Fornecedores</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Diretório de empresas prestadoras de serviços ao setor petrolífero em Angola.
                </p>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4 mr-2" />Sugerir empresa</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sugerir nova empresa</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Nome da empresa *</Label>
                      <Input value={form.company_name} maxLength={150}
                        onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Categoria *</Label>
                      <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Website</Label>
                      <Input type="url" value={form.website} maxLength={250}
                        onChange={(e) => setForm({ ...form, website: e.target.value })} />
                    </div>
                    <div>
                      <Label>Email de contacto</Label>
                      <Input type="email" value={form.contact_email} maxLength={200}
                        onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
                    </div>
                    <div>
                      <Label>Notas</Label>
                      <Textarea value={form.notes} maxLength={500}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Submeter
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </motion.div>

            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar empresa..." value={search}
                  onChange={(e) => setSearch(e.target.value)} className="pl-9"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap mb-6">
              {["Todos", ...CATEGORIES].map((c) => (
                <Button
                  key={c} variant={activeCat === c ? "default" : "outline"} size="sm"
                  onClick={() => setActiveCat(c)}
                >
                  {c}
                </Button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">
                Nenhuma empresa encontrada.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="p-5 h-full flex flex-col gap-3 hover:border-primary/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 border border-border">
                          {p.logo_url ? (
                            <img src={p.logo_url} alt={p.name} className="w-full h-full object-contain" />
                          ) : (
                            <Building2 className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
                          {p.website && (
                            <a
                              href={p.website} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
                            >
                              Website <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      {p.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {p.categories?.map((c) => (
                          <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
