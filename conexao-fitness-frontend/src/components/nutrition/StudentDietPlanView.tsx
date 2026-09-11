import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Utensils,
  Droplets,
  Flame,
  Dumbbell,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Apple,
  Sparkles,
  MessageCircle,
  Pill,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Plus,
  Minus,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { fetchMyDietPlan } from "@/services/nutrition";
import type { DietPlan, Meal, MealItem } from "@/types/nutrition";
import { formatBRL } from "@/lib/format";
import ChatModal from "@/components/ChatModal";
import { sounds } from "@/lib/soundEffects";
import { toast } from "sonner";

interface StudentDietPlanViewProps {
  studentId?: string;
  onOpenPrescriptionWizard?: () => void;
}

export const StudentDietPlanView: React.FC<StudentDietPlanViewProps> = ({
  studentId,
  onOpenPrescriptionWizard,
}) => {
  const [completedMeals, setCompletedMeals] = useState<Set<string>>(new Set());
  const [waterDrankMl, setWaterDrankMl] = useState<number>(() => {
    return Number(localStorage.getItem("cf_water_drank_ml") || "1200");
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [expandedMealId, setExpandedMealId] = useState<string | null>("meal-1");

  const { data: dietPlan, isLoading } = useQuery({
    queryKey: ["my-diet-plan", studentId],
    queryFn: () => fetchMyDietPlan(studentId),
  });

  const toggleMealCompleted = (mealId: string) => {
    setCompletedMeals((prev) => {
      const next = new Set(prev);
      if (next.has(mealId)) {
        next.delete(mealId);
      } else {
        next.add(mealId);
        sounds.playAccessGranted();
        toast.success("Refeição marcada como realizada! Parabéns pelo foco 💪");
      }
      return next;
    });
  };

  const handleAddWater = (amountMl: number) => {
    const updated = Math.max(0, waterDrankMl + amountMl);
    setWaterDrankMl(updated);
    localStorage.setItem("cf_water_drank_ml", String(updated));
    if (amountMl > 0) {
      sounds.playNotification();
      toast.success(`+${amountMl}ml de água registrados! 💧`);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center space-y-3">
        <Utensils className="w-10 h-10 text-primary animate-bounce mx-auto opacity-70" />
        <p className="text-sm font-semibold text-foreground">Carregando seu plano alimentar...</p>
      </div>
    );
  }

  if (!dietPlan) {
    return (
      <div className="p-8 text-center bg-card rounded-3xl border border-border/80 space-y-4 shadow-sm">
        <Apple className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
        <h3 className="text-lg font-bold text-foreground">Nenhum Plano Alimentar Ativo</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Você ainda não possui uma dieta prescrita. Contrate uma consultoria com um de nossos nutricionistas parceiros ou utilize a ferramenta de prescrição inteligente.
        </p>
        {onOpenPrescriptionWizard && (
          <Button variant="hero" onClick={onOpenPrescriptionWizard} className="shadow-glow">
            <Sparkles className="w-4 h-4 mr-2" />
            Criar Dieta por Questionário
          </Button>
        )}
      </div>
    );
  }

  const waterTarget = dietPlan.waterMlTarget || 3000;
  const waterPercent = Math.min(100, Math.round((waterDrankMl / waterTarget) * 100));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Nutri Prescriber Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={
                  dietPlan.nutritionistAvatar ||
                  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150"
                }
                alt={dietPlan.nutritionistName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-white">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                  DIETA OFICIAL ATIVA
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {dietPlan.nutritionistCrn || "CRN Regularizado"}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground mt-0.5 font-display">
                {dietPlan.title}
              </h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span>Prescrito por: <strong>{dietPlan.nutritionistName}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChatOpen(true)}
              className="rounded-2xl border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 h-10 px-4 text-xs font-bold gap-1.5 shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Falar com Nutricionista
            </Button>
          </div>
        </div>
      </div>

      {/* Grid: Macros & Water Intake */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Calories & Macro Goals */}
        <div className="md:col-span-2 p-5 bg-card border border-border/80 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Meta Diária</span>
                <h3 className="text-lg font-black text-foreground">{dietPlan.dailyCaloriesTarget} kcal</h3>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {dietPlan.goalTitle || dietPlan.goal}
            </span>
          </div>

          {/* Macros Distribution */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {/* Proteínas */}
            <div className="p-3 bg-muted/40 rounded-2xl border border-border/50 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400">Proteínas</span>
                <span className="text-muted-foreground font-semibold">{dietPlan.proteinGramsTarget}g</span>
              </div>
              <Progress value={85} className="h-2 bg-emerald-950/40 [&>div]:bg-emerald-500" />
              <p className="text-[10px] text-muted-foreground">~{Math.round(dietPlan.proteinGramsTarget * 4)} kcal</p>
            </div>

            {/* Carboidratos */}
            <div className="p-3 bg-muted/40 rounded-2xl border border-border/50 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-400">Carboidratos</span>
                <span className="text-muted-foreground font-semibold">{dietPlan.carbsGramsTarget}g</span>
              </div>
              <Progress value={75} className="h-2 bg-cyan-950/40 [&>div]:bg-cyan-500" />
              <p className="text-[10px] text-muted-foreground">~{Math.round(dietPlan.carbsGramsTarget * 4)} kcal</p>
            </div>

            {/* Gorduras */}
            <div className="p-3 bg-muted/40 rounded-2xl border border-border/50 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400">Gorduras</span>
                <span className="text-muted-foreground font-semibold">{dietPlan.fatsGramsTarget}g</span>
              </div>
              <Progress value={60} className="h-2 bg-amber-950/40 [&>div]:bg-amber-500" />
              <p className="text-[10px] text-muted-foreground">~{Math.round(dietPlan.fatsGramsTarget * 9)} kcal</p>
            </div>
          </div>
        </div>

        {/* Water Intake Tracker */}
        <div className="p-5 bg-card border border-border/80 rounded-3xl space-y-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Hidratação</span>
                <h4 className="text-sm font-bold text-foreground">
                  {(waterDrankMl / 1000).toFixed(1)}L / {(waterTarget / 1000).toFixed(1)}L
                </h4>
              </div>
            </div>
            <span className="text-xs font-black text-blue-400">{waterPercent}%</span>
          </div>

          <Progress value={waterPercent} className="h-2.5 bg-blue-950/40 [&>div]:bg-blue-500" />

          {/* Water quick action buttons */}
          <div className="flex items-center justify-between gap-1.5 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddWater(250)}
              className="flex-1 h-8 text-[11px] rounded-xl font-bold bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
            >
              +250ml
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddWater(500)}
              className="flex-1 h-8 text-[11px] rounded-xl font-bold bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
            >
              +500ml
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleAddWater(-250)}
              title="Diminuir"
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
            >
              <Minus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Meals Timeline List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" />
            Refeições do Dia ({dietPlan.meals.length})
          </h3>
          <span className="text-xs text-muted-foreground">
            {completedMeals.size} de {dietPlan.meals.length} realizadas
          </span>
        </div>

        <div className="space-y-3">
          {dietPlan.meals.map((meal: Meal) => {
            const isCompleted = completedMeals.has(meal.id);
            const isExpanded = expandedMealId === meal.id;

            return (
              <div
                key={meal.id}
                className={`rounded-3xl border transition-all overflow-hidden ${
                  isCompleted
                    ? "bg-muted/30 border-border/40 opacity-80"
                    : "bg-card border-border/80 hover:border-emerald-500/40 shadow-sm"
                }`}
              >
                {/* Header da Refeição */}
                <div
                  onClick={() => setExpandedMealId(isExpanded ? null : meal.id)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMealCompleted(meal.id);
                      }}
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                        isCompleted
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                          : "border-2 border-border hover:border-emerald-500 text-transparent hover:text-emerald-500/50"
                      }`}
                      title={isCompleted ? "Desmarcar refeição" : "Marcar como realizada"}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {meal.time}
                        </span>
                        <h4 className={`text-sm sm:text-base font-bold text-foreground font-display ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                          {meal.name}
                        </h4>
                      </div>
                      {meal.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{meal.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden xs:block">
                      <span className="text-xs font-bold text-foreground">{meal.totalCalories} kcal</span>
                      <p className="text-[10px] text-muted-foreground">
                        {meal.totalProtein}g P • {meal.totalCarbs}g C • {meal.totalFats}g G
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Itens detalhados da refeição */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-border/40 bg-muted/20 space-y-2.5">
                    {meal.items.map((item: MealItem) => (
                      <div
                        key={item.id}
                        className="p-3 bg-card/80 border border-border/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            {item.name}
                          </p>
                          <p className="text-[11px] text-emerald-400/90 font-medium">
                            Porção: {item.portion}
                          </p>
                          {item.substitutions && item.substitutions.length > 0 && (
                            <div className="text-[10px] text-muted-foreground flex items-start gap-1 pt-1">
                              <RefreshCw className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                              <span>
                                <strong>Opções de troca:</strong> {item.substitutions.join(" • ")}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-muted text-muted-foreground">
                            {item.calories} kcal
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            ({item.proteinGrams}g P | {item.carbsGrams}g C | {item.fatsGrams}g G)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Suplementação Prescrita */}
      {dietPlan.supplements && dietPlan.supplements.length > 0 && (
        <div className="p-5 bg-card border border-border/80 rounded-3xl space-y-3 shadow-sm">
          <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
            <Pill className="w-5 h-5 text-secondary" />
            Suplementação Recomendada
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dietPlan.supplements.map((sup, idx) => (
              <div key={idx} className="p-3.5 bg-muted/40 rounded-2xl border border-border/50 space-y-1">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-foreground">{sup.name}</h5>
                  <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                    {sup.dosage}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-400 font-medium">⏰ {sup.timing}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{sup.purpose}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orientações Gerais */}
      {dietPlan.generalGuidelines && dietPlan.generalGuidelines.length > 0 && (
        <div className="p-5 bg-card border border-border/80 rounded-3xl space-y-2.5 shadow-sm">
          <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            Recomendações da Nutricionista
          </h3>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {dietPlan.generalGuidelines.map((guideline, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{guideline}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal de Chat com a Nutricionista */}
      <ChatModal
        open={isChatOpen}
        onOpenChange={setIsChatOpen}
        bookingId={`chat-nutri-${dietPlan.nutritionistId || "camila"}`}
        title={`Nutricionista ${dietPlan.nutritionistName}`}
        recipientName={dietPlan.nutritionistName}
        recipientAvatar={dietPlan.nutritionistAvatar}
        initialMessage={`Olá, ${dietPlan.nutritionistName}! Gostaria de tirar uma dúvida sobre meu plano alimentar.`}
      />
    </div>
  );
};
