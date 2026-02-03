import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Plus, 
  Users, 
  FileText, 
  Activity,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useAuth } from "@/hooks/useAuth";
import { WorkspaceDashboard } from "@/components/workspace/WorkspaceDashboard";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const Workspace = () => {
  const { user } = useAuth();
  const { workspaces, isLoading, createWorkspace } = useWorkspaces();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: "", description: "" });

  const handleCreateWorkspace = async () => {
    if (!newWorkspace.name.trim()) {
      toast.error("Nome do workspace é obrigatório");
      return;
    }

    try {
      await createWorkspace.mutateAsync({
        name: newWorkspace.name,
        description: newWorkspace.description || undefined,
      });
      toast.success("Workspace criado com sucesso!");
      setIsCreateDialogOpen(false);
      setNewWorkspace({ name: "", description: "" });
    } catch (error) {
      toast.error("Erro ao criar workspace");
    }
  };

  const selectedWorkspace = workspaces?.find(w => w.id === selectedWorkspaceId);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeItem="/workspace" />
      
      <div className="flex-1 flex flex-col">
        <Header activeItem="/workspace" />
        
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {selectedWorkspaceId ? (
            <div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedWorkspaceId(null)}
                className="mb-4 gap-2"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Voltar aos Workspaces
              </Button>
              <WorkspaceDashboard workspaceId={selectedWorkspaceId} />
            </div>
          ) : (
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-primary" />
                    Workspaces
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gerencie seus espaços de trabalho colaborativos
                  </p>
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4" />
                      Novo Workspace
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Novo Workspace</DialogTitle>
                      <DialogDescription>
                        Crie um espaço de trabalho para colaborar com sua equipe
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome do Workspace</Label>
                        <Input
                          id="name"
                          placeholder="Ex: Equipe de Análise"
                          value={newWorkspace.name}
                          onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Descrição (opcional)</Label>
                        <Textarea
                          id="description"
                          placeholder="Descreva o propósito deste workspace..."
                          value={newWorkspace.description}
                          onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                        />
                      </div>
                      <Button 
                        onClick={handleCreateWorkspace} 
                        className="w-full"
                        disabled={createWorkspace.isPending}
                      >
                        {createWorkspace.isPending ? "Criando..." : "Criar Workspace"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Workspaces Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="bg-card border-border animate-pulse">
                      <CardContent className="p-6 h-48" />
                    </Card>
                  ))}
                </div>
              ) : workspaces && workspaces.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workspaces.map((workspace) => (
                    <Card 
                      key={workspace.id} 
                      className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group"
                      onClick={() => setSelectedWorkspaceId(workspace.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          {workspace.owner_id === user?.id && (
                            <Badge variant="secondary" className="bg-amber-500/20 text-amber-500 text-xs">
                              Proprietário
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg text-foreground mt-3 group-hover:text-primary transition-colors">
                          {workspace.name}
                        </CardTitle>
                        {workspace.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {workspace.description}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Membros
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Relatórios
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                          Criado em {format(new Date(workspace.created_at), "dd MMM yyyy", { locale: pt })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-card border-border">
                  <CardContent className="p-12 text-center">
                    <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Nenhum workspace ainda
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Crie seu primeiro workspace para começar a colaborar com sua equipe
                    </p>
                    <Button 
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Criar Workspace
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Features Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <Card className="bg-card border-border">
                  <CardContent className="p-6 text-center">
                    <div className="p-3 rounded-lg bg-primary/10 w-fit mx-auto mb-3">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-medium text-foreground mb-1">Colaboração</h4>
                    <p className="text-xs text-muted-foreground">
                      Convide membros da equipe e atribua funções
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-6 text-center">
                    <div className="p-3 rounded-lg bg-emerald-500/10 w-fit mx-auto mb-3">
                      <FileText className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h4 className="font-medium text-foreground mb-1">Partilha</h4>
                    <p className="text-xs text-muted-foreground">
                      Partilhe relatórios e métricas com a equipe
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-6 text-center">
                    <div className="p-3 rounded-lg bg-amber-500/10 w-fit mx-auto mb-3">
                      <Activity className="h-6 w-6 text-amber-500" />
                    </div>
                    <h4 className="font-medium text-foreground mb-1">Rastreamento</h4>
                    <p className="text-xs text-muted-foreground">
                      Acompanhe todas as atividades do workspace
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Workspace;