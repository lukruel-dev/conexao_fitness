import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Dumbbell,
  Play,
  Plus,
  Flame,
  Calendar,
  History,
  Trophy,
  Edit,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Utensils,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { fetchMyRoutines, fetchWorkoutHistory, deleteRoutine } from "@/services/workouts";
import { fetchGamificationSummary } from "@/services/gamification";
import { LiveWorkoutModal } from "@/components/workouts/LiveWorkoutModal";
import { WorkoutBuilderModal } from "@/components/workouts/WorkoutBuilderModal";
import { StreakCard } from "@/components/gamification/StreakCard";
import { WorkoutHeatmap } from "@/components/gamification/WorkoutHeatmap";
import { StudentDietPlanView } from "@/components/nutrition/StudentDietPlanView";
import { IntelligentPrescriptionWizard } from "@/components/prescription/IntelligentPrescriptionWizard";
import type { WorkoutRoutine } from "@/types/workouts";
import { toast } from "sonner";

const Treinos: React.FC = () => {
  const { user } = useAuth();
  const [mainSection, setMainSection] = useState<"workout" | "diet">("workout");
  const [activeTab, setActiveTab] = useState<"routines" | "history">("routines");
  const [selectedRoutine, setSelectedRoutine] = useState<WorkoutRoutine | null>(null);
  const [isLiveWorkoutOpen, setIsLiveWorkoutOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isPrescriptionWizardOpen, setIsPrescriptionWizardOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<WorkoutRoutine | null>(null);

  const isProfessional = user?.role === "PERSONAL" || user?.role === "ACADEMIA" || user?.role === "ADMIN";

  // Queries
  const { data: routines = [], refetch: refetchRoutines, isLoading: isLoadingRoutines } = useQuery({
    queryKey: ["myRoutines", user?.id],
    queryFn: () => fetchMyRoutines(),
    enabled: !!user,
  });

  const { data: history = [], refetch: refetchHistory } = useQuery({
    queryKey: ["workoutHistory", user?.id],
    queryFn: () => fetchWorkoutHistory(),
    enabled: !!user,
  });

  const { data: gamificationSummary, refetch: refetchGamification } = useQuery({
    queryKey: ["gamificationSummary", user?.id],
    queryFn: fetchGamificationSummary,
    enabled: !!user,
  });

  const handleStartWorkout = (routine: WorkoutRoutine) => {
    setSelectedRoutine(routine);
    setIsLiveWorkoutOpen(true);
  };

  const handleEditRoutine = (routine: WorkoutRoutine) => {
    setEditingRoutine(routine);
    setIsBuilderOpen(true);
  };

  const handleCreateNewRoutine = () => {
    setEditingRoutine(null);
    setIsBuilderOpen(true);
  };

  const handleDeleteRoutine = async (routineId: string) => {
    if (!confirm("Deseja realmente excluir esta ficha de treino?")) return;
    try {
      await deleteRoutine(routineId);
      toast.success("Ficha de treino removida.");
      refetchRoutines();
    } catch (err: any) {
      toast.error("Erro ao excluir", { description: err?.message });
    }
  };

  const activeDaysThisMonth = history.map((h) => h.finishedAt.split("T")[0]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container max-w-5xl mx-auto px-4 pt-24 md:pt-28 pb-20 space-y-6">
        {/* Header com Navegação */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                to="/buscar"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight flex items-center gap-2.5">
              {mainSection === "workout" ? (
                <>
                  <Dumbbell className="w-7 h-7 text-primary" />
                  <span>Meus <span className="gradient-text">Treinos & Fichas</span></span>
                </>
              ) : (
                <>
                  <Utensils className="w-7 h-7 text-emerald-400" />
                  <span>Meu <span className="text-emerald-400">Plano Alimentar</span></span>
                </>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {mainSection === "workout"
                ? "Acompanhe sua rotina de musculação, registre cargas e mantenha sua sequência ativa."
                : "Acompanhe suas metas de calorias, macronutrientes, hidratação e refeições prescritas."}
            </p>
          </div>

          {/* Ações Rápidas */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {isProfessional && (
              <Button
                variant="outline"
                onClick={() => setIsPrescriptionWizardOpen(true)}
                className="gap-1.5 text-xs font-bold rounded-2xl border-amber-500/40 text-amber-400 hover:bg-amber-500/10 shadow-sm flex-1 sm:flex-none"
              >
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                Prescritor Pro (Elite)
              </Button>
            )}

            {mainSection === "workout" && (
              <Button
                variant="hero"
                onClick={handleCreateNewRoutine}
                className="gap-2 font-semibold shadow-lg shadow-primary/20 flex-1 sm:flex-none"
              >
                <Plus className="w-4 h-4" /> Nova Ficha
              </Button>
            )}
          </div>
        </div>

        {/* Seletor Principal: Treinos vs Plano Alimentar (Dieta) */}
        <div className="p-1.5 bg-muted/60 border border-border/80 rounded-2xl flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMainSection("workout")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              mainSection === "workout"
                ? "bg-card text-foreground shadow-md border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Dumbbell className={`w-4 h-4 ${mainSection === "workout" ? "text-primary" : ""}`} />
            Fichas de Treino ({routines.length})
          </button>

          <button
            type="button"
            onClick={() => setMainSection("diet")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              mainSection === "diet"
                ? "bg-card text-foreground shadow-md border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Utensils className={`w-4 h-4 ${mainSection === "diet" ? "text-emerald-400" : ""}`} />
            Plano Alimentar (Dieta)
          </button>
        </div>

        {/* Gamification & Streak Banner */}
        <StreakCard
          gamification={gamificationSummary?.gamification}
          badges={gamificationSummary?.badges}
          onRefresh={refetchGamification}
        />

        {/* SEÇÃO 1: FICHAS DE TREINO */}
        {mainSection === "workout" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {/* Coluna Principal: Fichas ou Histórico */}
            <div className="lg:col-span-2 space-y-4">
              {/* Tabs */}
              <div className="flex items-center gap-2 p-1.5 bg-muted/40 border border-border rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab("routines")}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === "routines"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Layers className="w-4 h-4 text-primary" />
                  Fichas Ativas ({routines.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === "history"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <History className="w-4 h-4 text-primary" />
                  Histórico de Treinos ({history.length})
                </button>
              </div>

              {/* Conteúdo Tab 1: Fichas de Treino */}
              {activeTab === "routines" && (
                <div className="space-y-4">
                  {isLoadingRoutines ? (
                    <div className="p-12 text-center text-muted-foreground text-sm">
                      Carregando fichas de treino...
                    </div>
                  ) : routines.length === 0 ? (
                    <div className="p-10 text-center rounded-2xl border border-dashed border-border bg-card/40 space-y-3">
                      <Dumbbell className="w-10 h-10 text-muted-foreground/60 mx-auto" />
                      <div>
                        <h4 className="font-semibold text-foreground">Nenhuma ficha criada</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Crie sua primeira rotina de treino personalizada para iniciar.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleCreateNewRoutine}>
                        <Plus className="w-3.5 h-3.5 mr-1.5" /> Criar Treino A
                      </Button>
                    </div>
                  ) : (
                    routines.map((routine) => (
                      <div
                        key={routine.id}
                        className={`p-5 rounded-3xl border transition-all shadow-card space-y-4 group ${
                          routine.isPrescribedByPersonal
                            ? "border-primary/50 bg-gradient-to-br from-card via-card to-primary/5 shadow-glow"
                            : "border-border bg-card/70 hover:border-primary/40"
                        }`}
                      >
                        {/* Banner de Prescrição do Personal Trainer */}
                        {routine.isPrescribedByPersonal && (
                          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-primary/10 border border-primary/20">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/30 shrink-0">
                                <img
                                  src={routine.creatorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"}
                                  alt={routine.creatorName || "Personal"}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold tracking-wider text-primary">
                                  Prescrito pelo seu Personal
                                </p>
                                <p className="text-xs font-bold text-foreground">
                                  {routine.creatorName || "Personal Trainer Oficial"}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-extrabold bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              ✓ Ficha Oficial
                            </span>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold font-display text-lg text-foreground group-hover:text-primary transition-colors">
                                {routine.title}
                              </h3>
                              {routine.dayOfWeek && (
                                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                  {routine.dayOfWeek}
                                </span>
                              )}
                            </div>
                            {routine.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {routine.description}
                              </p>
                            )}
                            {routine.coachNotes && (
                              <p className="text-[11px] text-primary/90 mt-1 italic flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-primary shrink-0" />
                                Orientação do Personal: {routine.coachNotes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditRoutine(routine)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="Editar Ficha"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRoutine(routine.id)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              title="Excluir Ficha"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Lista Prévia dos Exercícios */}
                        <div className="space-y-1.5 border-t border-border/40 pt-3">
                          {(routine.exercises || []).map((ex, exIdx) => (
                            <div
                              key={ex.id || exIdx}
                              className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground font-mono text-[11px]">
                                  {exIdx + 1}.
                                </span>
                                <span className="font-medium text-foreground">{ex.name}</span>
                                {ex.muscleGroup && (
                                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                    ({ex.muscleGroup})
                                  </span>
                                )}
                              </div>
                              <div className="text-muted-foreground text-[11px] font-semibold">
                                {ex.sets} séries x {ex.reps} reps
                                {ex.targetWeightKg > 0 && ` • ${ex.targetWeightKg}kg`}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Botão de Iniciar Treino */}
                        <div className="pt-2">
                          <Button
                            variant="hero"
                            className="w-full h-11 font-semibold gap-2 shadow-md shadow-primary/20"
                            onClick={() => handleStartWorkout(routine)}
                          >
                            <Play className="w-4 h-4 fill-current" /> Iniciar Treino Ativo
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Conteúdo Tab 2: Histórico de Treinos */}
              {activeTab === "history" && (
                <div className="space-y-3">
                  {history.length === 0 ? (
                    <div className="p-10 text-center rounded-2xl border border-dashed border-border bg-card/40">
                      <History className="w-10 h-10 text-muted-foreground/60 mx-auto mb-2" />
                      <h4 className="font-semibold text-foreground">Nenhum treino registrado ainda</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Inicie um treino e marque as séries para acompanhar sua evolução de cargas e histórico!
                      </p>
                    </div>
                  ) : (
                    history.map((log) => {
                      const date = new Date(log.finishedAt);
                      const minutes = Math.round(log.durationSeconds / 60);

                      return (
                        <div
                          key={log.id}
                          className="p-4 rounded-xl border border-border bg-card/70 flex items-center justify-between gap-3 hover:border-primary/40 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-foreground">
                                {log.routineTitle}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {minutes} min
                                </span>
                                <span>•</span>
                                <span>{log.completedExercisesCount} exercícios</span>
                                {Number(log.totalWeightLiftedKg) > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-foreground font-semibold">
                                      {log.totalWeightLiftedKg} kg volume
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right text-xs">
                            <span className="font-semibold text-foreground block">
                              {date.toLocaleDateString("pt-BR")}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Coluna Lateral: Calendário de Frequência & Resumo */}
            <div className="space-y-4">
              <WorkoutHeatmap
                currentStreak={gamificationSummary?.gamification?.currentStreak || 0}
                lastWorkoutDate={gamificationSummary?.gamification?.lastWorkoutDate}
                activeDaysThisMonth={activeDaysThisMonth}
              />

              {/* Dica de Treino */}
              <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold text-xs">
                  <Sparkles className="w-4 h-4" /> Dica de Treino Finex
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Mantenha um descanso entre 45s a 90s entre séries para maximizar a hipertrofia. Ao bater o peso da sua série, anote a nova carga para acompanhar sua sobrecarga progressiva!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO 2: PLANO ALIMENTAR (DIETA) */}
        {mainSection === "diet" && (
          <StudentDietPlanView
            studentId={user?.id}
            onOpenPrescriptionWizard={() => setIsPrescriptionWizardOpen(true)}
          />
        )}
      </main>

      {/* Modais */}
      <LiveWorkoutModal
        open={isLiveWorkoutOpen}
        onOpenChange={setIsLiveWorkoutOpen}
        routine={selectedRoutine}
        onFinished={() => {
          refetchHistory();
          refetchGamification();
        }}
      />

      <WorkoutBuilderModal
        open={isBuilderOpen}
        onOpenChange={setIsBuilderOpen}
        editingRoutine={editingRoutine}
        onSaved={refetchRoutines}
      />

      <IntelligentPrescriptionWizard
        open={isPrescriptionWizardOpen}
        onOpenChange={setIsPrescriptionWizardOpen}
        onPrescriptionPublished={() => {
          refetchRoutines();
        }}
      />

      <Footer />
    </div>
  );
};

export default Treinos;
