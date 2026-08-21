import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { listServiceCatalog } from "@/services/service-catalog";
import { listServices, createService, removeService } from "@/services/services";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MeusServicos() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [price, setPrice] = useState("");

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
      setIsDialogOpen(false);
      setSelectedCatalogId("");
      setPrice("");
    },
    onError: (err: any) => {
      toast({
        title: "Erro",
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
    if (!selectedCatalogId || !price) return;

    createMutation.mutate({
      catalogId: selectedCatalogId,
      providerId: user.id,
      providerType: user.role,
      price: price.replace(",", "."), // ensure number format
      isActive: true,
    });
  };

  // Filtrar o catálogo para mostrar apenas serviços que ESTE usuário ainda não possui no portfólio dele
  const availableCatalog = catalog.filter(c => !myOwnServices.some(ms => ms.name === c.name));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 md:pt-28 pb-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-primary pl-1">Meus Serviços</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie os serviços que você oferece e defina seus preços.
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
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
                      <SelectValue placeholder={isLoadingCatalog ? "Carregando serviços..." : "Selecione um serviço"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCatalog.map(c => (
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
                    value={price} 
                    onChange={e => setPrice(e.target.value)}
                    required 
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending || !selectedCatalogId}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Adicionar ao Portfólio
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingMyServices ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : myOwnServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Você ainda não cadastrou nenhum serviço.
                  </TableCell>
                </TableRow>
              ) : (
                myOwnServices.map((service: any) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.modality}</TableCell>
                    <TableCell>{service.durationMinutes} min</TableCell>
                    <TableCell>R$ {Number(service.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm("Deseja remover este serviço?")) {
                            deleteMutation.mutate(service.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
      <Footer />
    </div>
  );
}
