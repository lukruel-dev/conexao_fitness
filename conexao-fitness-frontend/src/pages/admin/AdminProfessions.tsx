import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { listAllProfessionsAdmin, createProfession, updateProfession, deleteProfession, Profession } from "@/services/professions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function AdminProfessions() {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProfession, setEditingProfession] = useState<Profession | null>(null);

  const [title, setTitle] = useState("");
  const [isActive, setIsActive] = useState(true);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "ADMIN") return <Navigate to="/" replace />;

  const { data: professions = [], isLoading } = useQuery({
    queryKey: ["admin", "professions"],
    queryFn: listAllProfessionsAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (newTitle: string) => createProfession(newTitle),
    onSuccess: () => {
      toast.success("Profissão cadastrada!");
      setIsAddModalOpen(false);
      setTitle("");
      qc.invalidateQueries({ queryKey: ["admin", "professions"] });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao criar"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; isActive?: boolean } }) => updateProfession(id, data),
    onSuccess: () => {
      toast.success("Profissão atualizada!");
      setIsEditModalOpen(false);
      setEditingProfession(null);
      qc.invalidateQueries({ queryKey: ["admin", "professions"] });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfession,
    onSuccess: () => {
      toast.success("Profissão removida!");
      qc.invalidateQueries({ queryKey: ["admin", "professions"] });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao remover"),
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate(title.trim());
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfession || !title.trim()) return;
    updateMutation.mutate({ id: editingProfession.id, data: { title: title.trim(), isActive } });
  };

  const openEdit = (p: Profession) => {
    setEditingProfession(p);
    setTitle(p.title);
    setIsActive(p.isActive);
    setIsEditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-24">
        <div className="mb-6 flex justify-start">
          <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
          </Link>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Profissões</h1>
            <p className="text-muted-foreground mt-1">Gerencie as opções de profissões do cadastro.</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Nova Profissão
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Opções cadastradas</CardTitle>
            <CardDescription>Esta lista aparece no formulário de cadastro de Profissional.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : professions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma profissão cadastrada.</p>
            ) : (
              <div className="space-y-4">
                {professions.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div>
                      <h4 className="font-semibold text-foreground">{p.title}</h4>
                      <p className="text-sm text-muted-foreground">Status: {p.isActive ? "Ativo" : "Inativo"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => openEdit(p)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => {
                        if (confirm(`Remover ${p.title}?`)) {
                          deleteMutation.mutate(p.id);
                        }
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle>Nova Profissão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título (Ex: Fisioterapeuta, Nutricionista)</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Editar Profissão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <Label htmlFor="isActive">Ativo (visível no cadastro)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={updateMutation.isPending}>Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
