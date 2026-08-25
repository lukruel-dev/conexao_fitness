import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { listBookingsByStudent, cancelBooking, retryBookingPayment, payBookingWithWallet, simulateBookingSuccess } from "@/services/bookings";
import { getMyBalance } from "@/services/wallet";
import { listServices } from "@/services/services";
import { listSlotsByService } from "@/services/slots";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime, formatBookingSchedule } from "@/lib/format";
import type { BookingStatus } from "@/types/api";
import { Calendar, MapPin, X, Star, MessageCircle, CreditCard, Wallet } from "lucide-react";
import { CheckoutModal } from "@/components/CheckoutModal";
import ReviewModal from "@/components/ReviewModal";
import ChatModal from "@/components/ChatModal";

const filters: { value: BookingStatus | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "CONFIRMED", label: "Confirmados" },
  { value: "CANCELLED", label: "Cancelados" },
];

const statusStyles: Record<BookingStatus, string> = {
  CONFIRMED: "bg-secondary/10 text-secondary",
  CANCELLED: "bg-destructive/10 text-destructive",
  PENDING: "bg-yellow-500/10 text-yellow-500",
};

const MeusAgendamentos = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [reviewBooking, setReviewBooking] = useState<{ id: string; name?: string } | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [chatBooking, setChatBooking] = useState<{ id: string; name?: string } | null>(null);
  const [readChats, setReadChats] = useState<Set<string>>(new Set());
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);

  const retryMutation = useMutation({
    mutationFn: (bookingId: string) => retryBookingPayment(bookingId),
    onSuccess: (data, bookingId) => {
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setCurrentBookingId(bookingId);
      } else {
        toast.error("Erro ao gerar pagamento.");
      }
    },
    onError: (err: Error) => toast.error("Não foi possível processar pagamento", { description: err.message }),
  });

  const payWalletMutation = useMutation({
    mutationFn: (bookingId: string) => payBookingWithWallet(bookingId),
    onSuccess: () => {
      toast.success("Pagamento com carteira realizado!");
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      qc.invalidateQueries({ queryKey: ["wallet-balance"] });
    },
    onError: (err: Error) => toast.error("Erro no pagamento com carteira", { description: err.message }),
  });

  const { data: balanceData } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: () => getMyBalance(),
    enabled: !!user,
  });

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Reserva confirmada e pagamento realizado com sucesso!");
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      qc.invalidateQueries({ queryKey: ["slots"] });
      searchParams.delete("success");
      setSearchParams(searchParams, { replace: true });
    } else if (searchParams.get("canceled") === "true") {
      toast.error("O pagamento foi cancelado ou falhou. A vaga não foi reservada.");
      qc.invalidateQueries({ queryKey: ["slots"] });
      searchParams.delete("canceled");
      setSearchParams(searchParams, { replace: true });
    }

    const chatId = searchParams.get("chat");
    if (chatId) {
      setChatBooking({ id: chatId, name: "Chat" });
      searchParams.delete("chat");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["my-bookings", user?.id, status],
    queryFn: () => listBookingsByStudent(user!.id, status || undefined),
    enabled: !!user,
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => import("@/services/notifications").then(m => m.listNotifications()),
    enabled: !!user,
  });

  const { data: services } = useQuery({ queryKey: ["services"], queryFn: () => listServices() });
  const { data: allSlots } = useQuery({
    queryKey: ["all-slots-for-bookings", bookings?.map((b) => b.serviceId).join(",")],
    queryFn: async () => {
      if (!bookings) return [];
      const unique = Array.from(new Set(bookings.map((b) => b.serviceId)));
      const lists = await Promise.all(unique.map((sid) => listSlotsByService(sid)));
      return lists.flat();
    },
    enabled: !!bookings && bookings.length > 0,
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId, { studentId: user!.id }),
    onSuccess: () => {
      toast.success("Reserva cancelada");
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      qc.invalidateQueries({ queryKey: ["slots"] });
    },
    onError: (err: Error) => toast.error("Erro ao cancelar", { description: err.message }),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-40 container mx-auto px-4 text-center">
          <h1 className="font-display text-2xl font-bold mb-3">Você precisa estar logado</h1>
          <p className="text-muted-foreground mb-6">Faça login para ver seus agendamentos.</p>
          <Button variant="hero" onClick={() => navigate("/login")}>
            Entrar
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 md:pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Meus <span className="gradient-text">agendamentos</span>
          </h1>
          <p className="text-muted-foreground mb-6">Gerencie suas reservas com facilidade.</p>

          <div className="flex gap-2 mb-6">
            {filters.map((f) => (
              <button
                key={f.label}
                onClick={() => setStatus(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  status === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : !bookings || bookings.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">
                Você ainda não tem reservas.
              </p>
              <Button variant="hero" onClick={() => navigate("/buscar")}>
                Buscar treinos
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => {
                const service = services?.find((s) => s.id === b.serviceId);
                const slot = allSlots?.find((s) => s.id === b.slotId);
                return (
                  <div
                    key={b.id}
                    className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[b.status]}`}>
                          {b.status === "CONFIRMED" ? "Confirmado" : b.status === "CANCELLED" ? "Cancelado" : "Aguardando Pagamento"}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-foreground">
                        {service?.providerName ?? "Profissional não identificado"}
                      </h3>
                      <p className="text-sm text-muted-foreground">{service?.name ?? "Serviço"}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {slot && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatBookingSchedule(
                              slot.startsAt,
                              service?.type === "DAY_PASS" ||
                              service?.type === "DIARIA" ||
                              service?.name?.toLowerCase().includes("day pass") ||
                              service?.name?.toLowerCase().includes("passe diário")
                            )}
                          </span>
                        )}
                        {service?.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {service.city}
                          </span>
                        )}
                      </div>
                    </div>
                    {b.status === "CONFIRMED" && (
                      <div className="flex flex-col md:flex-row items-center gap-3 mt-4 md:mt-0">
                        {(() => {
                          const hasUnreadChat = notifications?.some(n => !n.isRead && n.type === "CHAT" && n.referenceId === b.id);
                          return hasUnreadChat && !readChats.has(b.id) ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-medium animate-pulse border border-primary/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              Nova mensagem
                            </div>
                          ) : null;
                        })()}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setChatBooking({ id: b.id, name: service?.name });
                            setReadChats(prev => new Set(prev).add(b.id));
                          }}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                        {slot && new Date(slot.endsAt) < new Date() ? (
                          <Button
                            variant="hero"
                            size="sm"
                            disabled={reviewedIds.has(b.id)}
                            onClick={() => setReviewBooking({ id: b.id, name: service?.name })}
                          >
                            <Star className="w-4 h-4" />
                            {reviewedIds.has(b.id) ? "Avaliado" : "Avaliar aula"}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelMutation.mutate(b.id)}
                            disabled={cancelMutation.isPending}
                          >
                            <X className="w-4 h-4" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    )}
                    {b.status === "PENDING" && (
                      <div className="flex flex-col md:flex-row gap-2">
                        <Button
                          variant="hero"
                          size="sm"
                          onClick={() => retryMutation.mutate(b.id)}
                          disabled={retryMutation.isPending}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          {retryMutation.isPending ? "Processando..." : "Pagar Agora"}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => payWalletMutation.mutate(b.id)}
                          disabled={payWalletMutation.isPending || (balanceData?.current_balance ?? 0) < Number(service?.price ?? 0)}
                        >
                          <Wallet className="w-4 h-4 mr-2" />
                          {payWalletMutation.isPending ? "Pagando..." : "Pagar com Saldo"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelMutation.mutate(b.id)}
                          disabled={cancelMutation.isPending}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      {reviewBooking && (
        <ReviewModal
          open={!!reviewBooking}
          onOpenChange={(o) => !o && setReviewBooking(null)}
          bookingId={reviewBooking.id}
          serviceName={reviewBooking.name}
          onSuccess={() => setReviewedIds((prev) => new Set(prev).add(reviewBooking.id))}
        />
      )}
      {chatBooking && (
        <ChatModal
          open={!!chatBooking}
          onOpenChange={(o) => !o && setChatBooking(null)}
          bookingId={chatBooking.id}
          title={chatBooking.name}
        />
      )}
      <CheckoutModal
        isOpen={!!clientSecret}
        onClose={() => {
          setClientSecret(null);
          setCurrentBookingId(null);
        }}
        clientSecret={clientSecret}
        onSuccess={() => {
          if (currentBookingId) {
            toast.promise(
              simulateBookingSuccess(currentBookingId).then(() => {
                qc.invalidateQueries({ queryKey: ["slots"] });
                qc.invalidateQueries({ queryKey: ["my-bookings"] });
              }),
              {
                loading: 'Confirmando pagamento...',
                success: 'Pagamento concluído com sucesso!',
                error: 'Erro ao confirmar pagamento.',
              }
            );
          } else {
            toast.success("Pagamento concluído!");
          }
          setClientSecret(null);
          setCurrentBookingId(null);
        }}
      />
      <Footer />
    </div>
  );
};

export default MeusAgendamentos;
