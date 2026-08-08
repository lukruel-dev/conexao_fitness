import { useQuery } from "@tanstack/react-query";
import { Navigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { listBookingsByProvider } from "@/services/bookings";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime } from "@/lib/format";
import type { BookingStatus } from "@/types/api";
import { Calendar, MessageCircle, Users } from "lucide-react";
import ChatModal from "@/components/ChatModal";

const filters: { value: BookingStatus | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "CONFIRMED", label: "Confirmados" },
  { value: "CANCELLED", label: "Cancelados" },
  { value: "PENDING", label: "Pendentes" },
];

const statusStyles: Record<BookingStatus, string> = {
  CONFIRMED: "bg-secondary/10 text-secondary",
  CANCELLED: "bg-destructive/10 text-destructive",
  PENDING: "bg-yellow-500/10 text-yellow-500",
};

export default function AgendaProfissional() {
  const { user, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [chatBooking, setChatBooking] = useState<{ id: string; name?: string } | null>(null);
  const [readChats, setReadChats] = useState<Set<string>>(new Set());
  const [searchParams, setSearchParams] = useSearchParams();

  const isProvider = user?.role === "PERSONAL" || user?.role === "ACADEMIA";

  useEffect(() => {
    const chatId = searchParams.get("chat");
    if (chatId) {
      setChatBooking({ id: chatId, name: "Chat" });
      searchParams.delete("chat");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["provider-bookings", user?.id, status],
    queryFn: () => listBookingsByProvider(user!.id, status || undefined),
    enabled: !!user && isProvider,
  });

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !isProvider) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16 container mx-auto px-4 max-w-4xl">
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3 pl-1 overflow-visible">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <span>Meus <span className="gradient-text">Alunos</span></span>
        </h1>
        <p className="text-muted-foreground mb-6">Acompanhe os agendamentos recebidos e converse com seus alunos.</p>

        <div className="flex flex-wrap gap-2 mb-6">
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !bookings || bookings.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-sm">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground mb-2">
              Nenhum agendamento encontrado.
            </p>
            <p className="text-xs text-muted-foreground">
              Continue divulgando seus serviços para atrair novos alunos!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b: any) => (
              <div
                key={b.id}
                className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 shadow-sm"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[b.status]}`}>
                      {b.status === "CONFIRMED" ? "Confirmado" : b.status === "CANCELLED" ? "Cancelado" : "Pendente"}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-foreground">
                    {b.student?.name ?? "Aluno não identificado"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {b.service?.name ?? "Serviço"}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {b.slot && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateTime(b.slot.startsAt)}
                      </span>
                    )}
                  </div>
                </div>
                {b.status === "CONFIRMED" && (
                  <div className="flex flex-col md:flex-row items-center gap-3 mt-4 md:mt-0">
                    {!readChats.has(b.id) && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-medium animate-pulse border border-primary/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Nova mensagem
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setChatBooking({ id: b.id, name: `${b.service?.name} (${b.student?.name})` });
                        setReadChats(prev => new Set(prev).add(b.id));
                      }}
                      className="w-full md:w-auto"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Abrir Chat
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {chatBooking && (
        <ChatModal
          open={!!chatBooking}
          onOpenChange={(o) => !o && setChatBooking(null)}
          bookingId={chatBooking.id}
          title={chatBooking.name}
        />
      )}
      <Footer />
    </div>
  );
}
