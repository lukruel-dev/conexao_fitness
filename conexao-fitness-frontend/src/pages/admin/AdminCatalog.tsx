import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listServiceCatalog,
  createServiceCatalog,
  removeServiceCatalog,
} from "@/services/service-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Loader2 } from "lucide-react";
import type { ServiceType } from "@/types/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const AdminCatalog = () => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [modality, setModality] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [type, setType] = useState<ServiceType>("SESSAO");

  const { data: catalog = [], isLoading } = useQuery({
    queryKey: ["admin-service-catalog"],
    queryFn: () => listServiceCatalog(true),
  });

  const createMutation = useMutation({
    mutationFn: createServiceCatalog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-catalog"] });
      toast({ title: "Sucesso", description: "Serviço adicionado ao catálogo" });
      setName("");
      setModality("");
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao criar",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: removeServiceCatalog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-catalog"] });
      toast({ title: "Sucesso", description: "Serviço removido" });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !modality) return;
    createMutation.mutate({ name, modality, durationMinutes, type });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-28 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-primary">Catálogo Base de Serviços</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie os serviços que os profissionais podem adicionar.
            </p>
          </div>
        </div>

      <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-muted/30 p-4 rounded-lg border border-border">
        <div className="md:col-span-2">
          <Input 
            placeholder="Nome (ex: Aula de Crossfit - 1h)" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
        </div>
        <div>
          <Input 
            placeholder="Modalidade (ex: Crossfit)" 
            value={modality} 
            onChange={(e) => setModality(e.target.value)} 
            required 
          />
        </div>
        <div>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={type}
            onChange={(e) => setType(e.target.value as ServiceType)}
          >
            <option value="SESSAO">Sessão</option>
            <option value="DIARIA">Diária</option>
            <option value="PLANO_MENSAL">Mensalidade</option>
            <option value="DAY_PASS">Day Pass</option>
          </select>
        </div>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          Adicionar
        </Button>
      </form>

      <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : catalog.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum serviço base cadastrado no catálogo.
                </TableCell>
              </TableRow>
            ) : (
              catalog.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>{cat.modality}</TableCell>
                  <TableCell>{cat.type}</TableCell>
                  <TableCell>
                    {cat.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm("Deseja desativar este serviço do catálogo?")) {
                          deleteMutation.mutate(cat.id);
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
};

export default AdminCatalog;
