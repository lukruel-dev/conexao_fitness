import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useSearchParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { listBookingsByProvider, addDemoBooking, resetDemoBookings } from "@/services/bookings";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime, formatBookingSchedule } from "@/lib/format";
import type { BookingStatus } from "@/types/api";
import {
  Calendar,
  MessageCircle,
  Users,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Dumbbell,
  Utensils,
  HeartPulse,
  UserPlus,
  RotateCcw,
  Check,
} from "lucide-react";
import ChatModal from "@/components/ChatModal";
import { IntelligentPrescriptionWizard } from "@/components/prescription/IntelligentPrescriptionWizard";
import { StudentHealthReportModal } from "@/components/health/StudentHealthReportModal";
import { isNutritionist, isPersonalTrainer } from "@/utils/professionalRoles";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { sounds } from "@/lib/soundEffects";

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

const PRESET_STUDENTS = [
  {
    name: "Gabriel Souza (Aluno Demo)",
    service: "Consultoria Premium & Personal VIP",
    goal: "Hipertrofia Muscular & Ficha A/B",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
    badge: "Smartwatch Conectado",
  },
  {
    name: "Mariana Lima (Atleta)",
    service: "Periodização de Hipertrofia & Força",
    goal: "Alta Performance & Biomecânica",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
    badge: "Sono & Fases",
  },
  {
    name: "Rodrigo Alves (Iniciante)",
    service: "Treinamento de Força & Sobrecarga",
    goal: "Adaptação Neuromuscular & Cargas",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    badge: "Novo Aluno",
  },
  {
    name: "Larissa Torres (Funcional)",
    service: "Treinamento Funcional e Resistência",
    goal: "Condicionamento Físico & Core",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    badge: "Ativa",
  },
];

const PRESET_PATIENTS = [
  {
    name: "Gabriel Souza (Aluno Conexão)",
    service: "Plano Alimentar para Ganho de Massa Limpa",
    goal: "Superávit Calórico (2.800 kcal) & Proteínas",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
    badge: "Metabolismo Alto",
  },
  {
    name: "Mariana Lima (Atleta)",
    service: "Definição Muscular & Baixo Carboidrato",
    goal: "Déficit Calórico (1.650 kcal) & Jejum",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
    badge: "Bioimpedância Ok",
  },
  {
    name: "Rodrigo Alves (Iniciante)",
    service: "Reeducação Alimentar & Emagrecimento Consciente",
    goal: "Equilíbrio de Macronutrientes (1.900 kcal)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    badge: "Emagrecimento",
  },
  {
    name: "Larissa Torres (Funcional)",
    service: "Dieta Anti-inflamatória & Desempenho",
    goal: "Nutrição Funcional & Micronutrientes (2.100 kcal)",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    badge: "Anti-inflamatória",
  },
];

export default function AgendaProfissional() {
  const qc = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [chatBooking, setChatBooking] = useState<{ id: string; name?: string } | null>(null);
  const [readChats, setReadChats] = useState<Set<string>>(new Set());
  const [searchParams, setSearchParams] = useSearchParams();
  const [isPrescriptionWizardOpen, setIsPrescriptionWizardOpen] = useState(false);
  const [selectedStudentForPrescription, setSelectedStudentForPrescription] = useState<{ id: string; name: string } | undefined>(undefined);
  const [prescriptionMode, setPrescriptionMode] = useState<"WORKOUT" | "DIET">("WORKOUT");
  const [isHealthReportOpen, setIsHealthReportOpen] = useState(false);
  const [selectedStudentForHealth, setSelectedStudentForHealth] = useState<{ id: string; name: string; avatarUrl?: string } | undefined>(undefined);

  // Modal para adicionar aluno de teste / demo
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentService, setNewStudentService] = useState("Consultoria VIP & Prescrição");

  const isProvider = user?.role === "PERSONAL" || user?.role === "ACADEMIA";
  const isNutri = isNutritionist(user);
  const isPersonal = isPersonalTrainer(user);

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

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => import("@/services/notifications").then(m => m.listNotifications()),
    enabled: !!user && isProvider,
  });

  const sortedBookings = useMemo(() => {
    if (!bookings) return [];
    
    return [...bookings].sort((a: any, b: any) => {
      const getPriority = (booking: any) => {
        if (booking.status === "CONFIRMED") {
          const hasUnreadChat = notifications?.some(n => !n.isRead && n.type === "CHAT" && n.referenceId === booking.id);
          if (hasUnreadChat && !readChats.has(booking.id)) return 1; // Com mensagens não lidas
          return 2; // Sem mensagens não lidas
        }
        if (booking.status === "PENDING") return 3;
        if (booking.status === "CANCELLED") return 4;
        return 5;
      };

      return getPriority(a) - getPriority(b);
    });
  }, [bookings, notifications, readChats]);

  const handleAddStudent = (preset?: typeof PRESET_STUDENTS[0]) => {
    const name = preset ? preset.name : newStudentName.trim();
    if (!name) {
      toast.error("Informe o nome do aluno.");
      return;
    }

    addDemoBooking({
      name,
      serviceName: preset ? preset.service : newStudentService,
      avatarUrl: preset ? preset.avatar : undefined,
      goal: preset ? preset.goal : "Hipertrofia & Saúde",
    });

    qc.invalidateQueries({ queryKey: ["provider-bookings"] });
    sounds.playAchievement();
    toast.success(`Aluno ${name} adicionado com sucesso!`, {
      description: "Agora você pode prescrever treinos, dietas e acompanhar dados do relógio.",
    });

    setIsAddStudentOpen(false);
    setNewStudentName("");
  };

  const handleResetDemo = () => {
    resetDemoBookings();
    qc.invalidateQueries({ queryKey: ["provider-bookings"] });
    toast.success("Carteira de alunos demo restaurada!");
  };

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !isProvider) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-28 sm:pt-32 md:pt-36 pb-16 container mx-auto px-4 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3 pl-1 overflow-visible">
              <div className={`p-2 sm:p-2.5 rounded-2xl ${isNutri ? "bg-emerald-500/10 text-emerald-400" : "bg-primary/10 text-primary"} flex items-center justify-center shrink-0`}>
                {isNutri ? <Utensils className="w-6 h-6 sm:w-8 sm:h-8" /> : <Users className="w-6 h-6 sm:w-8 sm:h-8" />}
              </div>
              <span>Meus <span className={isNutri ? "text-emerald-400" : "gradient-text"}>{isNutri ? "Pacientes" : "Alunos"}</span></span>
            </h1>
            <p className="text-muted-foreground text-sm">
              {isNutri
                ? "Acompanhe seus pacientes recebidos, prescreva planos alimentares personalizados, calcule macronutrientes e consulte dados de relógio inteligente."
                : "Acompanhe os agendamentos recebidos, prescreva treinos e consulte dados de relógio inteligente."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => setIsAddStudentOpen(true)}
              variant="hero"
              size="sm"
              className={`rounded-2xl gap-2 font-bold shadow-glow text-xs ${isNutri ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""}`}
            >
              <UserPlus className="w-4 h-4" />
              {isNutri ? "Adicionar Paciente (Demo)" : "Adicionar Aluno (Demo)"}
            </Button>
          </div>
        </div>

        {/* Banner de Status KYC Finex */}
        {user?.status === "KYC_REJEITADO" ? (
          <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-destructive">Documentação Recusada</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {user.kycRejectionReason || "Seu comprovante profissional precisa ser reenviado para liberação completa da sua conta."}
                </p>
              </div>
            </div>
            <Button size="sm" variant="destructive" className="shrink-0 text-xs" asChild>
              <Link to="/perfil">Corrigir Documento <ChevronRight className="w-3.5 h-3.5 ml-1" /></Link>
            </Button>
          </div>
        ) : user?.status === "PENDENTE_KYC" ? (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Credenciamento Finex em Análise</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Seus dados e documentos estão em fase de validação pela nossa equipe de compliance.
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="shrink-0 text-xs" asChild>
              <Link to="/perfil">Ver Documentos <ChevronRight className="w-3.5 h-3.5 ml-1" /></Link>
            </Button>
          </div>
        ) : null}

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
        ) : !sortedBookings || sortedBookings.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 sm:p-12 text-center shadow-sm">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-foreground font-bold mb-1">
              {isNutri ? "Nenhum paciente encontrado para este filtro." : "Nenhum aluno encontrado para este filtro."}
            </p>
            <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
              {isNutri
                ? "Adicione um paciente para testar a integração profissional com prescrição inteligente de dietas, cálculo de macronutrientes e acompanhamento de saúde."
                : "Adicione um aluno para testar a integração profissional/aluno com prescrição inteligente de treinos, dietas e leitura de relógios inteligentes."}
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Button
                onClick={() => setIsAddStudentOpen(true)}
                size="sm"
                variant="hero"
                className={`rounded-xl text-xs font-bold gap-2 shadow-glow ${isNutri ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""}`}
              >
                <UserPlus className="w-4 h-4" /> {isNutri ? "Adicionar Paciente (Demo)" : "Adicionar Aluno (Demo)"}
              </Button>
              <Button
                onClick={handleResetDemo}
                size="sm"
                variant="outline"
                className="rounded-xl text-xs font-semibold gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {isNutri ? "Restaurar Pacientes Padrão" : "Restaurar Alunos Padrão"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedBookings.map((b: any) => (
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
                        {formatBookingSchedule(
                          b.slot.startsAt,
                          b.service?.type === "DAY_PASS" ||
                          b.service?.type === "DIARIA" ||
                          b.service?.name?.toLowerCase().includes("day pass") ||
                          b.service?.name?.toLowerCase().includes("passe diário")
                        )}
                      </span>
                    )}
                  </div>
                </div>
                {b.status === "CONFIRMED" && (
                  <div className="flex flex-col sm:flex-row items-center gap-2 mt-4 md:mt-0">
                    {isNutri ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStudentForPrescription({
                            id: b.studentId || b.student?.id || "student-1",
                            name: b.student?.name || "Aluno",
                          });
                          setPrescriptionMode("DIET");
                          setIsPrescriptionWizardOpen(true);
                        }}
                        className="w-full sm:w-auto text-xs font-bold rounded-xl border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
                      >
                        <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                        Prescrever Dieta
                      </Button>
                    ) : user?.role === "ADMIN" ? (
                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStudentForPrescription({
                              id: b.studentId || b.student?.id || "student-1",
                              name: b.student?.name || "Aluno",
                            });
                            setPrescriptionMode("WORKOUT");
                            setIsPrescriptionWizardOpen(true);
                          }}
                          className="text-xs font-bold rounded-xl border-primary/40 text-primary hover:bg-primary/10 gap-1.5"
                        >
                          <Dumbbell className="w-3.5 h-3.5" />
                          Treino
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStudentForPrescription({
                              id: b.studentId || b.student?.id || "student-1",
                              name: b.student?.name || "Aluno",
                            });
                            setPrescriptionMode("DIET");
                            setIsPrescriptionWizardOpen(true);
                          }}
                          className="text-xs font-bold rounded-xl border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
                        >
                          <Utensils className="w-3.5 h-3.5" />
                          Dieta
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStudentForPrescription({
                            id: b.studentId || b.student?.id || "student-1",
                            name: b.student?.name || "Aluno",
                          });
                          setPrescriptionMode("WORKOUT");
                          setIsPrescriptionWizardOpen(true);
                        }}
                        className="w-full sm:w-auto text-xs font-bold rounded-xl border-primary/40 text-primary hover:bg-primary/10 gap-1.5"
                      >
                        <Dumbbell className="w-3.5 h-3.5 text-primary" />
                        Prescrever Treino
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedStudentForHealth({
                          id: b.studentId || b.student?.id || "student-1",
                          name: b.student?.name || "Aluno",
                          avatarUrl: b.student?.avatarUrl,
                        });
                        setIsHealthReportOpen(true);
                      }}
                      className="w-full sm:w-auto text-xs font-bold rounded-xl border-rose-500/40 text-rose-400 hover:bg-rose-500/10 gap-1.5"
                    >
                      <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                      Smartwatch
                    </Button>

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
                        setChatBooking({ id: b.id, name: `${b.service?.name} (${b.student?.name})` });
                        setReadChats(prev => new Set(prev).add(b.id));
                      }}
                      className="w-full sm:w-auto text-xs"
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

      <IntelligentPrescriptionWizard
        open={isPrescriptionWizardOpen}
        onOpenChange={setIsPrescriptionWizardOpen}
        defaultMode={prescriptionMode}
        prefilledStudent={selectedStudentForPrescription}
        onPrescriptionPublished={() => {
          qc.invalidateQueries({ queryKey: ["provider-bookings"] });
        }}
      />

      <StudentHealthReportModal
        open={isHealthReportOpen}
        onOpenChange={setIsHealthReportOpen}
        student={selectedStudentForHealth}
      />

      {/* Modal para Adicionar Aluno de Demonstração */}
      <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
        <DialogContent className="max-w-md rounded-3xl p-5 sm:p-6 bg-card border-border/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold font-display flex items-center gap-2">
              <div className={`p-2 rounded-xl ${isNutri ? "bg-emerald-500/10 text-emerald-400" : "bg-primary/10 text-primary"}`}>
                {isNutri ? <Utensils className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <span>{isNutri ? "Adicionar Paciente (Demo)" : "Adicionar Aluno (Demo)"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isNutri
                ? "Simule a consulta de um paciente para testar a prescrição inteligente de planos alimentares, cálculo de macronutrientes e chat integrado."
                : "Simule a contratação de um aluno para testar a integração profissional/aluno com prescrição inteligente de treinos, dietas, chat e relatórios de relógios inteligentes (smartwatch)."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-bold mb-2.5 block text-foreground">
                {isNutri ? "Escolha um Paciente Pré-configurado:" : "Escolha um Aluno Pré-configurado:"}
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {(isNutri ? PRESET_PATIENTS : PRESET_STUDENTS).map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddStudent(preset)}
                    className="p-3 rounded-2xl border border-border/70 hover:border-primary/50 hover:bg-primary/5 transition-all text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={preset.avatar}
                        alt={preset.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
                      />
                      <div>
                        <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5 flex-wrap">
                          <span>{preset.name}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-primary/10 text-primary">
                            {preset.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{preset.service}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
                      + Adicionar
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-card px-2 text-muted-foreground font-semibold">
                  {isNutri ? "ou cadastre um paciente personalizado" : "ou crie um aluno personalizado"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="student-name" className="text-xs font-medium">
                  {isNutri ? "Nome do Paciente" : "Nome do Aluno"}
                </Label>
                <Input
                  id="student-name"
                  placeholder={isNutri ? "Ex: Mariana Lima" : "Ex: Carlos Eduardo"}
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="rounded-xl h-9 text-xs mt-1"
                />
              </div>

              <div>
                <Label htmlFor="student-service" className="text-xs font-medium">
                  {isNutri ? "Plano Alimentar / Consulta" : "Serviço Contratado"}
                </Label>
                <Input
                  id="student-service"
                  placeholder={isNutri ? "Ex: Consulta Nutricional Esportiva (2.400 kcal)" : "Ex: Consultoria de Musculação VIP"}
                  value={newStudentService}
                  onChange={(e) => setNewStudentService(e.target.value)}
                  className="rounded-xl h-9 text-xs mt-1"
                />
              </div>

              <Button
                onClick={() => handleAddStudent()}
                disabled={!newStudentName.trim()}
                className={`w-full rounded-2xl text-xs font-bold h-10 gap-2 shadow-glow ${isNutri ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""}`}
                variant="hero"
              >
                <Check className="w-4 h-4" /> {isNutri ? "Confirmar e Adicionar Paciente" : "Confirmar e Adicionar Aluno"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
