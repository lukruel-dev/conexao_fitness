import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { listServiceCatalog } from "@/services/service-catalog";
import { listServices, createService, updateService, removeService } from "@/services/services";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Pencil, Clock, Tag } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBRL } from "@/lib/format";

export default function MeusServicos() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [addPrice, setAddPrice] = useState("");

  // Estado para Edição
  const [editingService, setEditingService] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState("");

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "PERSONAL" && user?.role !== "ACADEMIA") return <Navigate to="/" replace />;

  const { data: allServices = [], isLoading: isLoadingMyServices } = useQuery({
    queryKey: ["my-services", user.id],
    queryFn: () => listServices({ providerType: user.role as "PERSONAL" | "ACADEMIA", q: "" }),
  });

  const myOwnServices = allServices.filter((s: any) => s.providerId === user.id);

  const { data: catalog = [], isLoading: isLoadingCatalog } = useQuery({
    queryKey: ["service-catalog"],
    queryFn: () => listServiceCatalog(),
  });

  const createMutation = useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-services", user.id] });
      toast({ title: "Sucesso", description: "Serviço adicionado ao seu portfólio" });
      setIsAddDialogOpen(false);
      setSelectedCatalogId("");
      setAddPrice("");
    },
    onError: (err: any) => {
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => updateService(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-services", user.id] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({ title: "Preço atualizado!", description: "O novo valor já está ativo em seu catálogo." });
      setEditingService(null);
      setEditPrice("");
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao atualizar",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: removeService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-services", user.id] });
      toast({ title: "Sucesso", description: "Serviço removido" });
    },
  });

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatalogId || !addPrice) return;

    createMutation.mutate({
      catalogId: selectedCatalogId,
      providerId: user.id,
      providerType: user.role,
      price: addPrice.replace(",", "."), // ensure number format
      isActive: true,
    });
  };

  const handleStartEdit = (service: any) => {
    setEditingService(service);
    setEditPrice(String(service.price ?? ""));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !editPrice) return;

    updateMutation.mutate({
      id: editingService.id,
      dto: {
        price: editPrice.replace(",", "."),
      },
    });
  };

  // Filtrar o catálogo para mostrar apenas serviços que ESTE usuário ainda não possui no portfólio dele
  const availableCatalog = catalog.filter((c) => !myOwnServices.some((ms) => ms.name === c.name));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 md:pt-28 pb-16 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-primary pl-1">
              Meus Serviços
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Gerencie os serviços que você oferece, defina e edite seus preços.
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0 shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Novo Serviço
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Serviço</DialogTitle>
                <DialogDescription>
                  Selecione um serviço do catálogo base e defina o seu preço.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddService} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Serviço Base</label>
                  <Select value={selectedCatalogId} onValueChange={setSelectedCatalogId}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={isLoadingCatalog ? "Carregando serviços..." : "Selecione um serviço"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCatalog.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.durationMinutes} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Seu Preço (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 150.00"
                    value={addPrice}
                    onChange={(e) => setAddPrice(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending || !selectedCatalogId}
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Adicionar ao Portfólio
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Listagem */}
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          {isLoadingMyServices ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground mt-2">Carregando seus serviços...</p>
            </div>
          ) : myOwnServices.length === 0 ? (
            <div className="p-12 text-center">
              <Tag className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-semibold text-lg text-foreground">Nenhum serviço cadastrado</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Clique em &quot;Novo Serviço&quot; acima para adicionar atendimentos do catálogo base ao seu perfil.
              </p>
            </div>
          ) : (
            <>
              {/* Tabela para Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="font-semibold">Serviço</TableHead>
                      <TableHead className="font-semibold">Modalidade</TableHead>
                      <TableHead className="font-semibold">Duração</TableHead>
                      <TableHead className="font-semibold">Preço Atual</TableHead>
                      <TableHead className="w-[120px] text-right font-semibold pr-6">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myOwnServices.map((service: any) => (
                      <TableRow key={service.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium text-foreground">
                          {service.name}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {service.modality}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {service.durationMinutes >= 720 ? "Dia Todo" : `${service.durationMinutes} min`}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-secondary text-base">
                          {formatBRL(service.price)}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-primary hover:text-primary hover:bg-primary/10"
                              title="Editar Preço"
                              onClick={() => handleStartEdit(service)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Remover Serviço"
                              onClick={() => {
                                if (confirm("Deseja remover este serviço do seu portfólio?")) {
                                  deleteMutation.mutate(service.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Cards para Mobile */}
              <div className="md:hidden divide-y divide-border">
                {myOwnServices.map((service: any) => (
                  <div key={service.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                          {service.modality}
                        </span>
                        <h3 className="font-bold text-base text-foreground mt-1">{service.name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {service.durationMinutes >= 720 ? "Acesso 1 dia inteiro" : `${service.durationMinutes} minutos`}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">Preço</span>
                        <span className="text-lg font-bold text-secondary">
                          {formatBRL(service.price)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-primary border-primary/30 hover:bg-primary/10"
                        onClick={() => handleStartEdit(service)}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" /> Editar Preço
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm("Deseja remover este serviço do seu portfólio?")) {
                            deleteMutation.mutate(service.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Modal de Edição de Preço */}
        <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary" /> Editar Preço do Serviço
              </DialogTitle>
              <DialogDescription>
                Atualize o valor cobrado para {editingService?.name}. O novo preço entrará em vigor para novos agendamentos.
              </DialogDescription>
            </DialogHeader>

            {editingService && (
              <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
                <div className="p-3 bg-muted/50 rounded-xl border border-border space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Serviço Selecionado</span>
                  <div className="font-semibold text-foreground text-sm">{editingService.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {editingService.modality} • {editingService.durationMinutes >= 720 ? "Dia Todo" : `${editingService.durationMinutes} min`}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Novo Preço (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 120.00"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                    autoFocus
                    className="text-lg font-medium"
                  />
                  <p className="text-xs text-muted-foreground">
                    O valor é exibido aos alunos nas buscas e agendamentos.
                  </p>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingService(null)}
                    disabled={updateMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="hero"
                    disabled={updateMutation.isPending || !editPrice}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                      </>
                    ) : (
                      "Salvar Novo Preço"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}

