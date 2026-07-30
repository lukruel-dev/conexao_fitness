import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck, X, Search, ArrowLeft } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { adminCancelBooking, adminListBookings } from "@/services/bookings";
import { formatDateTime } from "@/lib/format";
import type { Booking, BookingStatus } from "@/types/api";

const STATUS_OPTIONS: { value: BookingStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos os status" },
  { value: "CONFIRMED", label: "Confirmados" },
  { value: "PENDING", label: "Pendentes" },
  { value: "CANCELLED", label: "Cancelados" },
];

const statusStyles: Record<BookingStatus, "default" | "secondary" | "destructive" | "outline"> = {
  CONFIRMED: "default",
  PENDING: "secondary",
  CANCELLED: "destructive",
};

const statusLabel: Record<BookingStatus, string> = {
  CONFIRMED: "Confirmado",
  PENDING: "Pendente",
  CANCELLED: "Cancelado",
};

export default function AdminBookings() {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "ADMIN") return <Navigate to="/" replace />;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "bookings", statusFilter],
    queryFn: () => adminListBookings(statusFilter === "ALL" ? undefined : statusFilter),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => adminCancelBooking(id),
    onSuccess: () => {
      toast.success("Reserva cancelada e vaga liberada");
      setCancelTarget(null);
      qc.invalidateQueries({ queryKey: ["admin", "bookings"] });
      qc.invalidateQueries({ queryKey: ["slots"] });
    },
    onError: (e: Error) => toast.error("Erro ao cancelar", { description: e.message }),
  });

  const filtered = (data ?? []).filter((b) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      b.id.toLowerCase().includes(s) ||
      b.studentId.toLowerCase().includes(s) ||
      b.serviceId.toLowerCase().includes(s)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-28 pb-16">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-secondary text-sm font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Painel administrativo
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">Gestão de Agendamentos</h1>
            <p className="text-muted-foreground mt-1">
              Cancele reservas como administrador — a vaga será liberada automaticamente.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/admin"><ArrowLeft className="w-4 h-4" /> Voltar</Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="py-4 flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID da reserva, aluno ou serviço"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BookingStatus | "ALL")}>
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
                  <TableHead>Reserva</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                {isError && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-destructive py-8">
                      Falha ao carregar agendamentos.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !isError && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum agendamento encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{b.studentId.slice(0, 8)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{b.serviceId.slice(0, 8)}</TableCell>
                    <TableCell>
                      <Badge variant={statusStyles[b.status]}>{statusLabel[b.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(b.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={b.status === "CANCELLED" || cancelMut.isPending}
                          onClick={() => setCancelTarget(b)}
                        >
                          <X className="w-4 h-4" /> Cancelar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
      <Footer />

      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar esta reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação muda o status para <strong>CANCELLED</strong> e libera o horário no calendário.
              O aluno será notificado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => cancelTarget && cancelMut.mutate(cancelTarget.id)}
            >
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
