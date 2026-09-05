import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Ban, RotateCcw, ShieldCheck, Search, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  activateUser,
  approveKyc,
  deleteUser,
  listAdminUsers,
  rejectKyc,
  suspendUser,
} from "@/services/admin";
import type { AdminUser, UserRole, UserStatus } from "@/types/api";
import { resolveMediaUrl } from "@/lib/mediaUrl";

const ROLE_OPTIONS: { value: UserRole | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todas as roles" },
  { value: "STUDENT", label: "Aluno" },
  { value: "PERSONAL", label: "Personal" },
  { value: "ACADEMIA", label: "Academia" },
  { value: "ADMIN", label: "Admin" },
];

const STATUS_OPTIONS: { value: UserStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos os status" },
  { value: "ATIVO", label: "Ativo" },
  { value: "SUSPENSO", label: "Suspenso" },
  { value: "PENDENTE_KYC", label: "Pendente KYC" },
  { value: "KYC_APROVADO", label: "KYC aprovado" },
  { value: "KYC_REJEITADO", label: "KYC rejeitado" },
];

function statusVariant(status: UserStatus) {
  switch (status) {
    case "ATIVO":
    case "KYC_APROVADO":
      return "default" as const;
    case "SUSPENSO":
    case "KYC_REJEITADO":
      return "destructive" as const;
    case "PENDENTE_KYC":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function statusLabel(status: UserStatus) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}

function roleLabel(role: UserRole) {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;
}

export default function AdminUsers() {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [rejectTarget, setRejectTarget] = useState<AdminUser | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [kycReviewTarget, setKycReviewTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "ADMIN") return <Navigate to="/" replace />;

  const filters = {
    role: roleFilter === "ALL" ? undefined : roleFilter,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  };

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ["admin", "users", filters],
    queryFn: () => listAdminUsers(filters),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });

  const suspendMut = useMutation({
    mutationFn: (id: string) => suspendUser(id),
    onSuccess: () => {
      toast.success("Usuário suspenso");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activateMut = useMutation({
    mutationFn: (id: string) => activateUser(id),
    onSuccess: () => {
      toast.success("Usuário reativado");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => approveKyc(id),
    onSuccess: () => {
      toast.success("KYC aprovado");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectKyc(id, reason),
    onSuccess: () => {
      toast.success("KYC rejeitado");
      setRejectTarget(null);
      setRejectReason("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast.success("Usuário excluído com sucesso");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao excluir usuário"),
  });

  const filtered = (users ?? []).filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-36 pb-16">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-secondary text-sm font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Painel administrativo
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">Gestão de Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Filtre, suspenda, reative, exclua e aprove o KYC de profissionais.
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="py-4 flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | "ALL")}>
              <SelectTrigger className="md:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as UserStatus | "ALL")}>
              <SelectTrigger className="md:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
                {isError && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-destructive py-8">
                      Falha ao carregar usuários.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !isError && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((u) => {
                  const isSuspended = u.status === "SUSPENSO";
                  const isCurrentUser = u.id === user?.id;
                  const canReviewKyc =
                    (u.role === "PERSONAL" || u.role === "ACADEMIA") &&
                    (u.status === "PENDENTE_KYC" || u.status === "KYC_REJEITADO");
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{roleLabel(u.role)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(u.status)}>{statusLabel(u.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2 justify-end">
                          {canReviewKyc && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setKycReviewTarget(u)}
                              >
                                Ver Documentos
                              </Button>
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => approveMut.mutate(u.id)}
                                disabled={approveMut.isPending}
                              >
                                <CheckCircle2 className="w-4 h-4" /> Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRejectTarget(u);
                                  setRejectReason("");
                                }}
                              >
                                <XCircle className="w-4 h-4" /> Rejeitar
                              </Button>
                            </>
                          )}
                          {isSuspended ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => activateMut.mutate(u.id)}
                              disabled={activateMut.isPending}
                            >
                              <RotateCcw className="w-4 h-4" /> Reativar
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => suspendMut.mutate(u.id)}
                              disabled={suspendMut.isPending}
                            >
                              <Ban className="w-4 h-4" /> Suspender
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10 border-destructive/30 hover:border-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(u)}
                            disabled={isCurrentUser || deleteMut.isPending}
                            title={isCurrentUser ? "Você não pode excluir sua própria conta" : "Excluir usuário"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
      <Footer />

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar KYC</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição para {rejectTarget?.name}. O usuário será notificado.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Ex: Documento ilegível, CREF não confere..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejectMut.isPending}
              onClick={() =>
                rejectTarget && rejectMut.mutate({ id: rejectTarget.id, reason: rejectReason.trim() })
              }
            >
              Confirmar rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Excluir Usuário
            </DialogTitle>
            <DialogDescription className="pt-2">
              Tem certeza que deseja excluir permanentemente o usuário{" "}
              <strong className="text-foreground">{deleteTarget?.name}</strong> ({deleteTarget?.email})?
              <br /><br />
              Esta ação é <strong>irreversível</strong> e removerá todos os dados e vínculos relacionados a este cadastro da base de dados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={deleteMut.isPending}
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
            >
              {deleteMut.isPending ? "Excluindo..." : "Confirmar exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!kycReviewTarget} onOpenChange={(o) => !o && setKycReviewTarget(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Revisão de Documento (KYC)</DialogTitle>
            <DialogDescription>
              Dados profissionais informados por {kycReviewTarget?.name?.trim()}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                {kycReviewTarget?.role === "ACADEMIA" ? "CNPJ" : "Número de Registro Profissional"}
              </p>
              <p className="text-lg font-medium">
                {kycReviewTarget?.personalProfile?.cref || kycReviewTarget?.academiaProfile?.cnpj || "Não informado"}
              </p>
            </div>
            {kycReviewTarget?.kycRejectionReason && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
                <span className="font-semibold block">Última rejeição registrada:</span>
                {kycReviewTarget.kycRejectionReason}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">Comprovante</p>
              {(() => {
                const rawUrl = kycReviewTarget?.personalProfile?.documentUrl || kycReviewTarget?.academiaProfile?.documentUrl;
                if (!rawUrl) return <p className="text-sm text-destructive">Nenhum documento anexado.</p>;
                const docUrl = resolveMediaUrl(rawUrl);
                return docUrl.toLowerCase().endsWith('.pdf') ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <a 
                        href={docUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Abrir documento PDF em nova guia
                      </a>
                      <a 
                        href={docUrl} 
                        download 
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                      >
                        Baixar PDF
                      </a>
                    </div>
                    <div className="border border-border rounded-lg overflow-hidden h-[300px] bg-muted relative">
                      <iframe 
                        src={docUrl} 
                        title="Documento PDF" 
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center min-h-[200px]">
                    <img 
                      src={docUrl} 
                      alt="Documento" 
                      className="max-h-[400px] object-contain"
                    />
                  </div>
                );
              })()}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setKycReviewTarget(null)}>Fechar</Button>
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(kycReviewTarget);
                setRejectReason("");
                setKycReviewTarget(null);
              }}
            >
              <XCircle className="w-4 h-4 mr-2" /> Rejeitar
            </Button>
            <Button
              variant="success"
              disabled={approveMut.isPending}
              onClick={() => {
                if (kycReviewTarget) {
                  approveMut.mutate(kycReviewTarget.id);
                  setKycReviewTarget(null);
                }
              }}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Aprovar KYC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

