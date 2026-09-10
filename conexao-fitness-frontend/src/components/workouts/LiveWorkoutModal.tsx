import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dumbbell,
  CheckCircle2,
  Timer,
  Trophy,
  Sparkles,
  Flame,
  X,
  Play,
  Award,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import type { WorkoutRoutine, WorkoutExercise } from '@/types/workouts';
import { completeWorkoutSession } from '@/services/workouts';
import { RestTimer } from './RestTimer';
import { soundEffects } from '@/utils/audioAlerts';

interface LiveWorkoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routine: WorkoutRoutine | null;
  onFinished?: () => void;
}

interface ExerciseExecutionState {
  exerciseId: string;
  name: string;
  muscleGroup?: string;
  targetWeightKg: number;
  actualWeightKg: number;
  sets: number;
  reps: string;
  restSeconds: number;
  completedSets: boolean[];
}

export const LiveWorkoutModal: React.FC<LiveWorkoutModalProps> = ({
  open,
  onOpenChange,
  routine,
  onFinished,
}) => {
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [exercisesState, setExercisesState] = useState<ExerciseExecutionState[]>([]);
  const [restTimerSeconds, setRestTimerSeconds] = useState<number>(60);
  const [isRestTimerOpen, setIsRestTimerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finishSummary, setFinishSummary] = useState<any | null>(null);

  // Inicializa o treino ao abrir
  useEffect(() => {
    if (open && routine) {
      setStartTime(Date.now());
      setElapsedSeconds(0);
      setFinishSummary(null);

      const mapped: ExerciseExecutionState[] = (routine.exercises || []).map((ex, idx) => ({
        exerciseId: ex.id || `temp-${idx}`,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        targetWeightKg: ex.targetWeightKg || 0,
        actualWeightKg: ex.targetWeightKg || 0,
        sets: ex.sets || 3,
        reps: ex.reps || '10-12',
        restSeconds: ex.restSeconds || 60,
        completedSets: Array(ex.sets || 3).fill(false),
      }));

      setExercisesState(mapped);
    }
  }, [open, routine]);

  // Cronômetro de Duração Total do Treino
  useEffect(() => {
    let interval: any = null;
    if (open && !finishSummary) {
      interval = setInterval(() => {
        setElapsedSeconds((sec) => sec + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [open, finishSummary]);

  const formatElapsed = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleSet = (exIndex: number, setIndex: number) => {
    const updated = [...exercisesState];
    const isNowCompleted = !updated[exIndex].completedSets[setIndex];
    updated[exIndex].completedSets[setIndex] = isNowCompleted;
    setExercisesState(updated);

    // Se marcou como concluído, aciona o descanso automaticamente
    if (isNowCompleted) {
      soundEffects.playCountdownBeep(false);
      setRestTimerSeconds(updated[exIndex].restSeconds || 60);
      setIsRestTimerOpen(true);
    }
  };

  const handleWeightChange = (exIndex: number, val: string) => {
    const num = parseFloat(val) || 0;
    const updated = [...exercisesState];
    updated[exIndex].actualWeightKg = num;
    setExercisesState(updated);
  };

  const handleFinishWorkout = async () => {
    if (!routine) return;

    try {
      setIsSubmitting(true);
      const totalSetsCompleted = exercisesState.reduce(
        (acc, ex) => acc + ex.completedSets.filter(Boolean).length,
        0
      );
      const totalExercisesCompleted = exercisesState.filter((ex) =>
        ex.completedSets.every(Boolean)
      ).length;

      const totalWeightKg = exercisesState.reduce(
        (acc, ex) => acc + ex.actualWeightKg * ex.completedSets.filter(Boolean).length,
        0
      );

      const res = await completeWorkoutSession({
        routineId: routine.id,
        routineTitle: routine.title,
        startedAt: new Date(startTime).toISOString(),
        finishedAt: new Date().toISOString(),
        durationSeconds: elapsedSeconds,
        completedExercisesCount: totalExercisesCompleted || exercisesState.length,
        totalWeightLiftedKg: totalWeightKg,
        notes: `${totalSetsCompleted} séries concluídas no total.`,
      });

      soundEffects.playSuccessChime();
      setFinishSummary({
        duration: formatElapsed(elapsedSeconds),
        totalExercises: exercisesState.length,
        totalSets: totalSetsCompleted,
        totalWeight: totalWeightKg,
        pointsEarned: res.gamification?.pointsEarned || 50,
        newStreak: res.gamification?.gamification?.currentStreak || 1,
        newBadges: res.gamification?.newBadges || [],
      });

      onFinished?.();
    } catch (err: any) {
      toast.error('Erro ao finalizar treino', { description: err?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!routine) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-0 bg-card border border-border max-h-[92vh] flex flex-col overflow-hidden">
          {/* Header Fixo */}
          <div className="p-4 sm:p-5 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground leading-tight">
                  {routine.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1 text-primary font-semibold">
                    <Timer className="w-3.5 h-3.5 animate-pulse" /> {formatElapsed(elapsedSeconds)}
                  </span>
                  <span>•</span>
                  <span>{routine.exercises?.length || 0} exercícios</span>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              variant="hero"
              onClick={handleFinishWorkout}
              disabled={isSubmitting || !!finishSummary}
              className="font-semibold text-xs h-9 px-4 gap-1.5 shadow-md shadow-primary/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Finalizando...' : 'Finalizar Treino'}
            </Button>
          </div>

          {/* Conteúdo com Scroll */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {finishSummary ? (
              /* Tela de Parabéns & Conquista ao Finalizar */
              <div className="p-6 text-center space-y-4 animate-fade-in my-auto">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
                  <Trophy className="w-8 h-8 fill-current" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold font-display text-foreground">
                    Treino Concluído com Sucesso! 🦾
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Excelente trabalho! Seu progresso foi salvo e sua sequência foi atualizada.
                  </p>
                </div>

                {/* Estatísticas do Treino */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-lg mx-auto pt-2">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Tempo</div>
                    <div className="text-base font-bold text-foreground">{finishSummary.duration}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Séries</div>
                    <div className="text-base font-bold text-foreground">{finishSummary.totalSets}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Volume Carga</div>
                    <div className="text-base font-bold text-foreground">{finishSummary.totalWeight} kg</div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="text-[10px] text-amber-400 uppercase font-bold">Finex Points</div>
                    <div className="text-base font-bold text-amber-400">+{finishSummary.pointsEarned} pts</div>
                  </div>
                </div>

                {/* Badge de Streak */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 font-bold text-xs mt-2">
                  <Flame className="w-4 h-4 fill-current" />
                  <span>Sequência Atual: {finishSummary.newStreak} dia(s) seguidos!</span>
                </div>

                <div className="pt-4">
                  <Button
                    variant="hero"
                    className="w-full max-w-xs h-11"
                    onClick={() => {
                      onOpenChange(false);
                    }}
                  >
                    Fechar e Continuar
                  </Button>
                </div>
              </div>
            ) : (
              /* Lista de Exercícios Ativos */
              exercisesState.map((ex, exIdx) => {
                const isAllCompleted = ex.completedSets.every(Boolean);

                return (
                  <div
                    key={ex.exerciseId}
                    className={`p-4 rounded-xl border transition-all ${
                      isAllCompleted
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : 'border-border bg-card/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                          {exIdx + 1}
                        </span>
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{ex.name}</h4>
                          <span className="text-[11px] text-muted-foreground">
                            {ex.muscleGroup} • {ex.sets} séries x {ex.reps} reps • {ex.restSeconds}s descanso
                          </span>
                        </div>
                      </div>

                      {/* Input de Carga Real */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-muted-foreground font-medium">Carga:</span>
                        <div className="relative w-16">
                          <Input
                            type="number"
                            value={ex.actualWeightKg}
                            onChange={(e) => handleWeightChange(exIdx, e.target.value)}
                            className="h-8 text-xs font-bold text-center pr-5"
                          />
                          <span className="absolute right-1.5 top-2 text-[10px] text-muted-foreground pointer-events-none">
                            kg
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Checkboxes de Séries */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
                      {ex.completedSets.map((isDone, setIdx) => (
                        <button
                          key={setIdx}
                          type="button"
                          onClick={() => handleToggleSet(exIdx, setIdx)}
                          className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                            isDone
                              ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-sm'
                              : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isDone ? 'text-white' : 'opacity-40'}`} />
                          <span>Série {setIdx + 1}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Rest Timer */}
      <RestTimer
        isOpen={isRestTimerOpen && open && !finishSummary}
        initialSeconds={restTimerSeconds}
        onClose={() => setIsRestTimerOpen(false)}
      />
    </>
  );
};
