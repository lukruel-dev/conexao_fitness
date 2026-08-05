import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listServices, removeService } from "@/services/services";
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
import { Trash2, Loader2, Search, Dumbbell, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AdminServices() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["admin-services", search],
    queryFn: () => listServices({ q: search }),
  });

  const deleteMutation = useMutation({
    mutationFn: removeService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      toast({ title: "Sucesso", description: "Serviço removido" });
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao remover",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-28 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-secondary text-sm font-semibold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" /> Painel administrativo
            </div>
            <h1 className="text-3xl font-bold font-display text-primary flex items-center gap-2">
              <Dumbbell className="w-8 h-8" /> Serviços dos Profissionais
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualização e gestão de todos os serviços oferecidos por personal trainers e academias.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Buscar por serviço ou modalidade..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead>Tipo de Provedor</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum serviço encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                services.map((service: any) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.modality}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        service.providerType === "PERSONAL"
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary/10 text-secondary"
                      }`}>
                        {service.providerType === "PERSONAL" ? "Personal Trainer" : "Academia"}
                      </span>
                    </TableCell>
                    <TableCell>{service.durationMinutes} min</TableCell>
                    <TableCell className="font-bold text-foreground">
                      R$ {Number(service.price).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm("Deseja remover este serviço do sistema?")) {
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
