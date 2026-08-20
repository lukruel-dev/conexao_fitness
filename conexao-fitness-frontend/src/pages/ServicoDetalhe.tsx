import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getServiceById } from "@/services/services";
import { listSlotsByService } from "@/services/slots";
import { createBooking, simulateBookingSuccess } from "@/services/bookings";
import { formatBRL, formatDateLong, formatTime } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Clock, MapPin, Star } from "lucide-react";
import { CheckoutModal } from "@/components/CheckoutModal";

const ServicoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);

  const { data: service, isLoading: loadingService } = useQuery({
    queryKey: ["service", id],
    queryFn: () => getServiceById(id!),
    enabled: !!id,
  });

  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ["slots", id],
    queryFn: () => listSlotsByService(id!),
    enabled: !!id,
  });

  const slotsByDay = useMemo(() => {
    if (!slots) return [] as { day: string; items: typeof slots }[];
    const map = new Map<string, typeof slots>();
    slots.forEach((s) => {
      const key = new Date(s.startsAt).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return Array.from(map.entries()).map(([day, items]) => ({ day, items }));
  }, [slots]);

  const bookingMutation = useMutation({
    mutationFn: () =>
      createBooking({
        serviceId: id!,
        slotId: selectedSlotId!,
        studentId: user!.id,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["slots", id] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      if (res?.clientSecret) {
        setClientSecret(res.clientSecret);
        setCurrentBookingId(res.id);
        return;
      }
      toast.success("Reserva criada!", {
        description: "Acompanhe na aba 'Meus agendamentos'.",
      });
      navigate("/meus-agendamentos");
    },
    onError: (err: Error) => {
      toast.error("Não foi possível reservar", { description: err.message });
    },
  });

  const handleReserve = () => {
    if (!isAuthenticated) {
      toast.info("Faça login para reservar", { description: "Você será redirecionado." });
      navigate("/login");
      return;
    }
    if (!selectedSlotId) {
      toast.warning("Selecione um horário primeiro");
      return;
    }
    bookingMutation.mutate();
  };

  if (loadingService) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-32 container mx-auto px-4">
          <div className="h-64 bg-muted rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Serviço não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-36 md:pt-40 pb-16">
        <div className="container mx-auto px-4">
          <div className="pl-[env(safe-area-inset-left,16px)] sm:pl-0">
            <button
              onClick={() => {
                if (window.history.state && typeof window.history.state.idx === "number" && window.history.state.idx > 0) {
                  navigate(-1);
                } else {
                  navigate("/buscar");
                }
              }}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                {/* Provider Image */}
                <div className="shrink-0">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-[3px] bg-gradient-to-tr from-primary to-secondary shadow-[0_0_15px_rgba(45,212,191,0.5)]">
                    <img 
                      src={service.providerAvatar || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=400&auto=format&fit=crop"} 
                      alt={service.providerName || "Profissional"} 
                      className="w-full h-full rounded-full object-cover border-4 border-background"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        service.providerType === "ACADEMIA"
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary/10 text-secondary"
                      }`}
                    >
                      {service.providerType === "ACADEMIA"
                        ? "Academia"
                        : service.professionTitle || "Profissional"}
                    </span>
                    <span className="text-xs text-muted-foreground">{service.modality}</span>
                  </div>
                  <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">{service.name}</h1>
                  <p className="text-muted-foreground">
                    {service.providerName}
                    {service.providerType === "PERSONAL" && service.professionTitle ? ` • ${service.professionTitle}` : ""}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                    {service.rating && (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-foreground font-semibold">{service.rating}</span>
                        <span>({service.reviewsCount} avaliações)</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {service.durationMinutes} min
                    </span>
                    {service.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {service.city}
                      </span>
                    )}
                  </div>

                  {service.description && (
                    <p className="mt-4 text-foreground/90 leading-relaxed text-sm md:text-base">{service.description}</p>
                  )}
                </div>
              </div>

              {/* Slots */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-display text-xl font-bold mb-4">Horários disponíveis</h2>
                {loadingSlots ? (
                  <div className="h-32 bg-muted rounded animate-pulse" />
                ) : slotsByDay.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Sem horários disponíveis.</p>
                ) : (
                  <div className="space-y-5">
                    {slotsByDay.map(({ day, items }) => (
                      <div key={day}>
                        <h3 className="text-sm font-semibold text-foreground capitalize mb-2">
                          {formatDateLong(items[0].startsAt)}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {items.map((slot) => {
                            const isAvailable = slot.status === "AVAILABLE";
                            const isSelected = selectedSlotId === slot.id;
                            return (
                              <button
                                key={slot.id}
                                disabled={!isAvailable}
                                onClick={() => setSelectedSlotId(slot.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                                  isSelected
                                    ? "bg-primary text-primary-foreground border-primary shadow-glow-blue"
                                    : isAvailable
                                      ? "bg-background border-border hover:border-primary/50 text-foreground"
                                      : "bg-muted border-border text-muted-foreground line-through cursor-not-allowed"
                                }`}
                              >
                                {formatTime(slot.startsAt)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="bg-card border border-border rounded-2xl p-6 lg:sticky lg:top-24">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-secondary">{formatBRL(service.price)}</div>
                  <div className="text-xs text-muted-foreground">
                    {service.type === "PLANO_MENSAL"
                      ? "por mês"
                      : service.type === "DAY_PASS"
                        ? "day pass"
                        : "por sessão"}
                  </div>
                </div>
                <Button
                  variant="hero"
                  className="w-full mb-2"
                  onClick={handleReserve}
                  disabled={bookingMutation.isPending}
                >
                  {bookingMutation.isPending ? "Processando..." : "Reservar e pagar"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Pagamento seguro via Pix ou cartão
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
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
                qc.invalidateQueries({ queryKey: ["slots", id] });
                qc.invalidateQueries({ queryKey: ["my-bookings"] });
              }),
              {
                loading: 'Confirmando pagamento...',
                success: 'Pagamento concluído com sucesso!',
                error: 'Erro ao confirmar pagamento.',
              }
            );
          } else {
            toast.success("Pagamento concluído com sucesso!");
          }
          setClientSecret(null);
          setCurrentBookingId(null);
          navigate("/meus-agendamentos");
        }}
      />
    </div>
  );
};

export default ServicoDetalhe;
