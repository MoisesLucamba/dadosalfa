import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Crown, 
  Shield, 
  UserCog, 
  ChevronUp, 
  ChevronDown,
  Mail,
  AlertTriangle
} from "lucide-react";
import { useAllUsersWithEmail, usePromoteToAdmin, useDemoteFromAdmin } from "@/hooks/useAdmin";
import { usePromoteToSuperAdmin, useDemoteFromSuperAdmin } from "@/hooks/useSystemSettings";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AdminManagementPanel() {
  const { user } = useAuth();
  const { data: users, isLoading } = useAllUsersWithEmail();
  const promoteToAdmin = usePromoteToAdmin();
  const demoteFromAdmin = useDemoteFromAdmin();
  const promoteToSuperAdmin = usePromoteToSuperAdmin();
  const demoteFromSuperAdmin = useDemoteFromSuperAdmin();

  const handlePromoteToAdmin = (userId: string, userName: string) => {
    promoteToAdmin.mutate(userId, {
      onSuccess: () => {
        toast.success(`${userName} promovido a Administrador`);
      },
    });
  };

  const handleDemoteFromAdmin = (userId: string, userName: string) => {
    demoteFromAdmin.mutate(userId, {
      onSuccess: () => {
        toast.success(`${userName} removido de Administrador`);
      },
    });
  };

  const handlePromoteToSuperAdmin = (userId: string, userName: string) => {
    promoteToSuperAdmin.mutate(userId, {
      onSuccess: () => {
        toast.success(`${userName} promovido a Super Admin`);
      },
    });
  };

  const handleDemoteFromSuperAdmin = (userId: string, userName: string) => {
    demoteFromSuperAdmin.mutate(userId, {
      onSuccess: () => {
        toast.success(`${userName} removido de Super Admin`);
      },
    });
  };

  const admins = users?.filter(u => u.isAdmin) || [];
  const regularUsers = users?.filter(u => !u.isAdmin) || [];

  const getRoleBadge = (userItem: any) => {
    if (userItem.isSuperAdmin) {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
          <Crown className="h-3 w-3 mr-1" />
          Super Admin
        </Badge>
      );
    }
    if (userItem.isAdmin) {
      return (
        <Badge variant="default" className="bg-primary">
          <Shield className="h-3 w-3 mr-1" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <UserCog className="h-3 w-3 mr-1" />
        Utilizador
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Current Admins */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Administradores Actuais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((adminUser) => (
                <TableRow key={adminUser.id}>
                  <TableCell className="font-medium">{adminUser.contact_name}</TableCell>
                  <TableCell>{adminUser.company_name}</TableCell>
                  <TableCell>{getRoleBadge(adminUser)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {adminUser.id !== user?.id && (
                        <>
                          {adminUser.isSuperAdmin ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-amber-500 border-amber-500/50">
                                  <ChevronDown className="h-4 w-4 mr-1" />
                                  Remover Super
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar remoção de Super Admin</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja remover {adminUser.contact_name} de Super Admin?
                                    Esta pessoa continuará como Admin regular.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDemoteFromSuperAdmin(adminUser.id, adminUser.contact_name)}
                                  >
                                    Confirmar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-amber-500 border-amber-500/50"
                                onClick={() => handlePromoteToSuperAdmin(adminUser.id, adminUser.contact_name)}
                              >
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Super Admin
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="text-destructive border-destructive/50">
                                    <ChevronDown className="h-4 w-4 mr-1" />
                                    Remover Admin
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar remoção de Admin</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja remover {adminUser.contact_name} de Administrador?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDemoteFromAdmin(adminUser.id, adminUser.contact_name)}
                                      className="bg-destructive text-destructive-foreground"
                                    >
                                      Remover
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </>
                      )}
                      {adminUser.id === user?.id && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Você
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {admins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum administrador encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Promote Users */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            Promover Utilizadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-600">Atenção</p>
                <p className="text-xs text-muted-foreground">
                  Administradores têm acesso total aos dados e configurações da plataforma.
                  Apenas promova utilizadores de confiança.
                </p>
              </div>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regularUsers.slice(0, 10).map((regularUser) => (
                <TableRow key={regularUser.id}>
                  <TableCell className="font-medium">{regularUser.contact_name}</TableCell>
                  <TableCell>{regularUser.company_name}</TableCell>
                  <TableCell>
                    <Badge variant={regularUser.is_approved ? "default" : "secondary"}>
                      {regularUser.is_approved ? "Aprovado" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePromoteToAdmin(regularUser.id, regularUser.contact_name)}
                      disabled={!regularUser.is_approved}
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Promover a Admin
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {regularUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum utilizador disponível para promoção
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {regularUsers.length > 10 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Mostrando 10 de {regularUsers.length} utilizadores
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
