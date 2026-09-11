import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Dumbbell,
  Utensils,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Zap,
  Clock,
  ShieldCheck,
  Flame,
  Award,
  AlertTriangle,
  Send,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  User,
  HeartPulse,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { sounds } from "@/lib/soundEffects";
import { toast } from "sonner";
import {
  generateDietFromQuestionnaire,
  generateWorkoutFromQuestionnaire,
  saveDietPlan,
} from "@/services/nutrition";
import { createRoutine } from "@/services/workouts";
import type {
  DietQuestionnaireData,
  WorkoutQuestionnaireData,
  DietPlan,
} from "@/types/nutrition";
import type { WorkoutRoutine, WorkoutExercise } from "@/types/workouts";

interface IntelligentPrescriptionWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: "WORKOUT" | "DIET";
  prefilledStudent?: { id: string; name: string };
  onPrescriptionPublished?: () => void;
}

export const IntelligentPrescriptionWizard: React.FC<IntelligentPrescriptionWizardProps> = ({
  open,
  onOpenChange,
  defaultMode = "WORKOUT",
  prefilledStudent,
  onPrescriptionPublished,
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [mode, setMode] = useState<"WORKOUT" | "DIET">(defaultMode);

  // Aluno Selecionado
  const [studentName, setStudentName] = useState(prefilledStudent?.name || "Aluno Finex");
  const [studentId, setStudentId] = useState(prefilledStudent?.id || "current-user");

  // Estado do Questionário de Treino
  const [workoutData, setWorkoutData] = useState<WorkoutQuestionnaireData>({
    studentId: studentId,
    studentName: studentName,
    goal: "HIPERTROFIA",
    level: "INTERMEDIARIO",
    weeklyFrequency: 4,
    sessionDurationMinutes: 60,
    splitPreference: "AUTO",
    priorityMuscleFocus: "EQUILIBRADO",
    jointRestrictions: "NENHUMA",
    trainingEnvironment: "ACADEMIA_COMPLETA",
    advancedMethods: ["DROP_SET"],
  });

  // Estado do Questionário de Dieta
  const [dietData, setDietData] = useState<DietQuestionnaireData>({
    studentId: studentId,
    studentName: studentName,
    gender: "MASCULINO",
    age: 26,
    weightKg: 78,
    heightCm: 178,
    activityLevel: "MODERADO",
    goal: "HIPERTROFIA",
    dietaryPreference: "ONIVORO",
    mealsCount: 4,
    selectedSupplements: ["CREATINA", "WHEY_PROTEIN", "OMEGA_3"],
  });

  // Resultados Gerados
  const [generatedWorkout, setGeneratedWorkout] = useState<WorkoutRoutine[] | null>(null);
  const [generatedDiet, setGeneratedDiet] = useState<DietPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerate = () => {
    sounds.playAchievement();
    if (mode === "WORKOUT") {
      const routines = generateWorkoutFromQuestionnaire(
        { ...workoutData, studentId, studentName },
        user
      );
      setGeneratedWorkout(routines);
    } else {
      const diet = generateDietFromQuestionnaire(
        { ...dietData, studentId, studentName },
        user
      );
      setGeneratedDiet(diet);
    }
    setStep(4);
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    try {
      if (mode === "WORKOUT" && generatedWorkout) {
        for (const routine of generatedWorkout) {
          await createRoutine(routine);
        }
        sounds.playWorkoutComplete();
        toast.success(
          `Fichas de treino (${generatedWorkout.length} divisões) enviadas com sucesso para ${studentName}!`
        );
      } else if (mode === "DIET" && generatedDiet) {
        await saveDietPlan(generatedDiet);
        sounds.playWorkoutComplete();
        toast.success(
          `Plano alimentar enviado com sucesso para a aba de Dieta de ${studentName}!`
        );
      }
      setStep(5);
      onPrescriptionPublished?.();
    } catch (err: any) {
      toast.error("Erro ao publicar prescrição", { description: err?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setGeneratedWorkout(null);
    setGeneratedDiet(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 bg-card border-border/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Header Superior com Selo Elite */}
        <DialogHeader className="p-5 sm:p-6 border-b border-border/70 bg-gradient-to-r from-amber-500/15 via-primary/10 to-transparent flex flex-row items-center justify-between shrink-0 space-y-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-none text-[10px] font-black uppercase tracking-wider shadow">
                <Sparkles className="w-3 h-3 mr-1" /> PLANO ELITE PRO
              </Badge>
              <span className="text-xs font-bold text-primary">Prescritor Inteligente</span>
            </div>
            <DialogTitle className="text-lg sm:text-xl font-black font-display text-foreground">
              {mode === "WORKOUT" ? "Gerador de Fichas de Treino" : "Gerador de Planos Alimentares"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Prescrição ideal baseada em algoritmos de periodização e cálculo metabólico.
            </DialogDescription>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-card border border-border/80 flex items-center justify-center text-primary shadow-sm shrink-0">
            {mode === "WORKOUT" ? <Dumbbell className="w-6 h-6" /> : <Utensils className="w-6 h-6 text-emerald-400" />}
          </div>
        </DialogHeader>

        {/* Corpo do Wizard com Scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ETAPA 1: Tipo de Prescrição & Aluno */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  1. O que você deseja prescrever hoje?
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode("WORKOUT")}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      mode === "WORKOUT"
                        ? "bg-primary/15 border-primary shadow-glow scale-[1.01]"
                        : "bg-muted/40 border-border hover:bg-muted/70"
                    }`}
                  >
                    <div className="p-2 w-fit rounded-xl bg-primary/20 text-primary mb-2">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground">Ficha de Treino</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Para Personal Trainers (Divisões A/B/C, séries, cargas e descanso).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("DIET")}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      mode === "DIET"
                        ? "bg-emerald-500/15 border-emerald-500 shadow-glow scale-[1.01]"
                        : "bg-muted/40 border-border hover:bg-muted/70"
                    }`}
                  >
                    <div className="p-2 w-fit rounded-xl bg-emerald-500/20 text-emerald-400 mb-2">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground">Plano Alimentar</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Para Nutricionistas (Calorias, macros, refeições e suplementos).
                    </p>
                  </button>
                </div>
              </div>

              {/* Seleção do Aluno */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  2. Nome do Aluno Destinatário
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Ex: Gabriel Santos"
                      className="pl-9 rounded-2xl h-11 text-xs sm:text-sm bg-muted/40"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  A prescrição será disponibilizada instantaneamente na aba <strong>Meus Treinos & Dieta</strong> do aluno.
                </p>
              </div>
            </div>
          )}

          {/* ETAPA 2 & 3: Questionário de Treino */}
          {mode === "WORKOUT" && (step === 2 || step === 3) && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {step === 2 ? (
                <>
                  {/* Objetivo do Treino */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Objetivo Principal do Aluno</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { val: "HIPERTROFIA", label: "Hipertrofia Muscular", icon: "💪" },
                        { val: "EMAGRECIMENTO", label: "Emagrecimento & Definição", icon: "🔥" },
                        { val: "FORCA", label: "Força Máxima", icon: "🏋️‍♂️" },
                        { val: "RESISTENCIA", label: "Resistência Muscular", icon: "⚡" },
                        { val: "CONDICIONAMENTO", label: "Condicionamento Físico", icon: "🏃‍♂️" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setWorkoutData({ ...workoutData, goal: item.val as any })}
                          className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                            workoutData.goal === item.val
                              ? "bg-primary/15 border-primary text-foreground shadow-sm"
                              : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/70"
                          }`}
                        >
                          <span className="text-base mr-1.5">{item.icon}</span>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nível do Aluno */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Experiência / Nível de Treinamento</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: "INICIANTE", label: "Iniciante (< 6 meses)" },
                        { val: "INTERMEDIARIO", label: "Intermediário (6m a 2 anos)" },
                        { val: "AVANCADO", label: "Avançado (+ 2 anos)" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setWorkoutData({ ...workoutData, level: item.val as any })}
                          className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all ${
                            workoutData.level === item.val
                              ? "bg-secondary/15 border-secondary text-foreground shadow-sm"
                              : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/70"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frequência Semanal */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Frequência Semanal de Treinos</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {[2, 3, 4, 5, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setWorkoutData({ ...workoutData, weeklyFrequency: num as any })}
                          className={`p-2.5 rounded-2xl border text-center text-xs font-black transition-all ${
                            workoutData.weeklyFrequency === num
                              ? "bg-primary text-black border-primary shadow-glow"
                              : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/70"
                          }`}
                        >
                          {num}x / sem
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Restrições Articulares */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Restrições Articulares ou Lesões</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { val: "NENHUMA", label: "Sem Restrições ✅" },
                        { val: "LOMBAR_COLUNA", label: "Dor Lombar / Coluna ⚠️" },
                        { val: "JOELHO", label: "Desconforto Joelho ⚠️" },
                        { val: "OMBRO", label: "Impacto no Ombro ⚠️" },
                        { val: "PUNHO", label: "Dor no Punho ⚠️" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setWorkoutData({ ...workoutData, jointRestrictions: item.val as any })}
                          className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                            workoutData.jointRestrictions === item.val
                              ? "bg-amber-500/15 border-amber-500 text-foreground shadow-sm"
                              : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/70"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Foco Muscular Prioritário */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Foco Muscular Prioritário</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { val: "EQUILIBRADO", label: "Equilíbrio Geral" },
                        { val: "PEITORAL_BRACOS", label: "Peitoral & Braços" },
                        { val: "PERNAS_GLUTEOS", label: "Pernas & Glúteos" },
                        { val: "COSTAS_OMBROS", label: "Dorsal & Ombros" },
                        { val: "CORE_ABDOMEN", label: "Core & Abdômen" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setWorkoutData({ ...workoutData, priorityMuscleFocus: item.val as any })}
                          className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all ${
                            workoutData.priorityMuscleFocus === item.val
                              ? "bg-primary/15 border-primary text-foreground shadow-sm"
                              : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/70"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tempo por sessão */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Tempo Disponível por Sessão</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[30, 45, 60, 90].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setWorkoutData({ ...workoutData, sessionDurationMinutes: mins as any })}
                          className={`p-2.5 rounded-2xl border text-center text-xs font-bold transition-all ${
                            workoutData.sessionDurationMinutes === mins
                              ? "bg-secondary text-secondary-foreground border-secondary shadow-sm"
                              : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/70"
                          }`}
                        >
                          {mins} min
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ETAPA 2 & 3: Questionário de Dieta */}
          {mode === "DIET" && (step === 2 || step === 3) && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {step === 2 ? (
                <>
                  {/* Dados Biométricos para TMB */}
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-emerald-400" />
                      Dados Antropométricos do Aluno
                    </Label>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <span className="text-[11px] text-muted-foreground font-semibold">Sexo Biológico</span>
                        <select
                          value={dietData.gender}
                          onChange={(e) => setDietData({ ...dietData, gender: e.target.value as any })}
                          className="w-full mt-1 h-10 rounded-xl bg-muted/40 border border-border text-xs px-2.5 font-bold"
                        >
                          <option value="MASCULINO">Masculino</option>
                          <option value="FEMININO">Feminino</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[11px] text-muted-foreground font-semibold">Idade (anos)</span>
                        <Input
                          type="number"
                          value={dietData.age}
                          onChange={(e) => setDietData({ ...dietData, age: Number(e.target.value) })}
                          className="mt-1 h-10 rounded-xl bg-muted/40 text-xs font-bold"
                        />
                      </div>

                      <div>
                        <span className="text-[11px] text-muted-foreground font-semibold">Peso Atual (kg)</span>
                        <Input
                          type="number"
                          value={dietData.weightKg}
                          onChange={(e) => setDietData({ ...dietData, weightKg: Number(e.target.value) })}
                          className="mt-1 h-10 rounded-xl bg-muted/40 text-xs font-bold"
                        />
                      </div>

                      <div>
                        <span className="text-[11px] text-muted-foreground font-semibold">Altura (cm)</span>
                        <Input
                          type="number"
                          value={dietData.heightCm}
                          onChange={(e) => setDietData({ ...dietData, heightCm: Number(e.target.value) })}
                          className="mt-1 h-10 rounded-xl bg-muted/40 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Objetivo Nutricional */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Objetivo Nutricional</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { val: "EMAGRECIMENTO", label: "Déficit Calórico (Emagrecer)", icon: "🔥" },
                        { val: "HIPERTROFIA", label: "Superávit Limpo (Ganho Massa)", icon: "💪" },
                        { val: "MANUTENCAO", label: "Manutenção & Definição", icon: "⚖️" },
                        { val: "PERFORMANCE", label: "Performance Esportiva", icon: "⚡" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setDietData({ ...dietData, goal: item.val as any })}
                          className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                            dietData.goal === item.val
                              ? "bg-emerald-500/15 border-emerald-500 text-foreground shadow-sm"
                              : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/70"
                          }`}
                        >
                          <span className="text-base block mb-1">{item.icon}</span>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nível de Atividade Física */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Nível de Atividade Diária</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: "SEDENTARIO", label: "Sedentário / Escritório" },
                        { val: "MODERADO", label: "Moderado (Treino 3-5x)" },
                        { val: "INTENSO", label: "Intenso (Atleta / Trabalho Pesado)" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setDietData({ ...dietData, activityLevel: item.val as any })}
                          className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all ${
                            dietData.activityLevel === item.val
                              ? "bg-primary/15 border-primary text-foreground shadow-sm"
                              : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/70"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Padrão Alimentar / Preferências */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Padrão Alimentar & Restrições</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { val: "ONIVORO", label: "Onívoro / Flexível 🥩" },
                        { val: "VEGETARIANO", label: "Ovolactovegetariano 🥚" },
                        { val: "VEGANO", label: "100% Vegano 🥑" },
                        { val: "LOW_CARB", label: "Low Carb / Cetogênica 🥗" },
                        { val: "SEM_LACTOSE", label: "Sem Lactose 🥛" },
                        { val: "SEM_GLUTEN", label: "Sem Glúten 🌾" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setDietData({ ...dietData, dietaryPreference: item.val as any })}
                          className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                            dietData.dietaryPreference === item.val
                              ? "bg-emerald-500/15 border-emerald-500 text-foreground shadow-sm"
                              : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/70"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantidade de Refeições */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Refeições ao Longo do Dia</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[3, 4, 5, 6].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setDietData({ ...dietData, mealsCount: n as any })}
                          className={`p-2.5 rounded-2xl border text-center text-xs font-black transition-all ${
                            dietData.mealsCount === n
                              ? "bg-emerald-500 text-black border-emerald-500 shadow-glow"
                              : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/70"
                          }`}
                        >
                          {n} Refeições
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Suplementação */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Suplementação Sugerida</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { val: "CREATINA", label: "Creatina Pura 5g" },
                        { val: "WHEY_PROTEIN", label: "Whey Protein" },
                        { val: "OMEGA_3", label: "Ômega 3 Concentrado" },
                        { val: "MULTIVITAMINICO", label: "Multivitamínico" },
                        { val: "CAFEINA", label: "Cafeína / Pré-Treino" },
                      ].map((sup) => {
                        const isSelected = dietData.selectedSupplements.includes(sup.val);
                        return (
                          <button
                            key={sup.val}
                            type="button"
                            onClick={() => {
                              const updated = isSelected
                                ? dietData.selectedSupplements.filter((s) => s !== sup.val)
                                : [...dietData.selectedSupplements, sup.val];
                              setDietData({ ...dietData, selectedSupplements: updated });
                            }}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                              isSelected
                                ? "bg-secondary/15 border-secondary text-foreground"
                                : "bg-muted/40 border-border text-muted-foreground"
                            }`}
                          >
                            {isSelected ? "✅ " : "⚪ "} {sup.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ETAPA 4: Visualização e Ajuste Fino */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">
                      Prescrição Gerada com Sucesso para {studentName}!
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Revise os detalhes abaixo antes de publicar no aplicativo do aluno.
                    </p>
                  </div>
                </div>
              </div>

              {/* Prévia do Treino Gerado */}
              {mode === "WORKOUT" && generatedWorkout && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground">
                      Divisões de Treino ({generatedWorkout.length} Fichas)
                    </h4>
                    <span className="text-[11px] text-primary font-bold">Foco: {workoutData.goal}</span>
                  </div>

                  {generatedWorkout.map((routine, rIdx) => (
                    <div key={rIdx} className="p-4 bg-muted/40 border border-border/70 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-bold text-foreground font-display">{routine.title}</h5>
                          <span className="text-[10px] text-muted-foreground">{routine.dayOfWeek}</span>
                        </div>
                        <span className="text-xs font-bold text-primary bg-primary/15 px-2.5 py-0.5 rounded-full">
                          {routine.exercises.length} Exercícios
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {routine.exercises.map((ex, eIdx) => (
                          <div
                            key={eIdx}
                            className="p-2.5 bg-card rounded-xl border border-border/50 text-xs flex items-center justify-between gap-2"
                          >
                            <span className="font-semibold text-foreground">
                              {ex.order}. {ex.name}
                            </span>
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0 text-[11px]">
                              <span className="font-bold text-foreground">{ex.sets}x {ex.reps}</span>
                              <span>• {ex.targetWeightKg}kg</span>
                              <span>• {ex.restSeconds}s desc.</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Prévia da Dieta Gerada */}
              {mode === "DIET" && generatedDiet && (
                <div className="space-y-3">
                  {/* Card de Calorias & Macros */}
                  <div className="p-4 bg-card border border-border/80 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-2 bg-muted/40 rounded-xl">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Calorias</span>
                      <p className="text-base font-black text-foreground">{generatedDiet.dailyCaloriesTarget} kcal</p>
                    </div>
                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                      <span className="text-[10px] text-emerald-400 uppercase font-bold">Proteínas</span>
                      <p className="text-base font-black text-emerald-400">{generatedDiet.proteinGramsTarget}g</p>
                    </div>
                    <div className="p-2 bg-cyan-500/10 rounded-xl">
                      <span className="text-[10px] text-cyan-400 uppercase font-bold">Carboidratos</span>
                      <p className="text-base font-black text-cyan-400">{generatedDiet.carbsGramsTarget}g</p>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded-xl">
                      <span className="text-[10px] text-blue-400 uppercase font-bold">Água</span>
                      <p className="text-base font-black text-blue-400">{((generatedDiet.waterMlTarget || 3000)/1000).toFixed(1)}L</p>
                    </div>
                  </div>

                  {/* Refeições */}
                  <div className="space-y-2">
                    {generatedDiet.meals.map((meal, idx) => (
                      <div key={idx} className="p-3.5 bg-muted/40 border border-border/60 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400">
                            ⏰ {meal.time} — {meal.name}
                          </span>
                          <span className="text-xs font-bold text-foreground">{meal.totalCalories} kcal</span>
                        </div>
                        <ul className="text-xs space-y-1 text-muted-foreground">
                          {meal.items.map((it, itIdx) => (
                            <li key={itIdx} className="flex justify-between">
                              <span>• {it.name} ({it.portion})</span>
                              <span className="font-semibold text-foreground/80">{it.calories} kcal</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ETAPA 5: Sucesso & Confirmação */}
          {step === 5 && (
            <div className="py-10 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-glow">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-foreground font-display">
                Prescrição Disponibilizada com Sucesso!
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                O aluno <strong>{studentName}</strong> já pode acessar a ficha completa e personalizada na aba <strong>Meus Treinos & Dieta</strong> do app Finex.
              </p>
              <Button variant="hero" onClick={handleClose} className="rounded-2xl px-6 h-11 font-bold shadow-glow">
                Concluir
              </Button>
            </div>
          )}
        </div>

        {/* Rodapé com Navegação */}
        {step < 5 && (
          <div className="p-4 sm:p-5 border-t border-border/70 bg-card flex items-center justify-between gap-3 shrink-0">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep((prev) => (prev - 1) as any)}
                className="rounded-2xl h-10 px-4 text-xs font-bold"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              {step < 3 ? (
                <Button
                  type="button"
                  variant="hero"
                  size="sm"
                  onClick={() => {
                    sounds.playNotification();
                    setStep((prev) => (prev + 1) as any);
                  }}
                  className="rounded-2xl h-10 px-5 text-xs font-black shadow-glow text-black"
                >
                  Continuar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : step === 3 ? (
                <Button
                  type="button"
                  variant="hero"
                  size="sm"
                  onClick={handleGenerate}
                  className="rounded-2xl h-10 px-5 text-xs font-black shadow-glow text-black gap-1.5"
                >
                  <Sparkles className="w-4 h-4" /> Gerar Prescrição Inteligente
                </Button>
              ) : step === 4 ? (
                <Button
                  type="button"
                  variant="hero"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={handlePublish}
                  className="rounded-2xl h-10 px-6 text-xs font-black shadow-glow text-black gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? "Publicando..." : "Disponibilizar no App do Aluno"}
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
