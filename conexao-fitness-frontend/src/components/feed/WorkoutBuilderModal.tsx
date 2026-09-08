import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Dumbbell, Sparkles } from "lucide-react";
import type { WorkoutRoutine, ExerciseItem } from "@/types/community";

interface WorkoutBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialWorkout?: WorkoutRoutine;
  onSave: (workout: WorkoutRoutine | undefined) => void;
}

export const WorkoutBuilderModal: React.FC<WorkoutBuilderModalProps> = ({
  open,
  onOpenChange,
  initialWorkout,
  onSave,
}) => {
  const [title, setTitle] = useState(
    initialWorkout?.title || "Treino Personalizado"
  );
  const [level, setLevel] = useState(
    initialWorkout?.level || "Intermediário"
  );
  const [exercises, setExercises] = useState<ExerciseItem[]>(
    initialWorkout?.exercises && initialWorkout.exercises.length > 0
      ? initialWorkout.exercises
      : [
          { name: "Agachamento Livre", sets: "4", reps: "10", restSeconds: 60, notes: "Foco na postura" },
          { name: "Leg Press 45º", sets: "3", reps: "12", restSeconds: 60 },
        ]
  );

  const addExercise = () => {
    setExercises([
      ...exercises,
      { name: "", sets: "3", reps: "10-12", restSeconds: 60 },
    ]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (
    index: number,
    field: keyof ExerciseItem,
    value: string | number
  ) => {
    const next = [...exercises];
    next[index] = { ...next[index], [field]: value };
    setExercises(next);
  };

  const handleSave = () => {
    const validExercises = exercises.filter((e) => e.name.trim().length > 0);
    if (validExercises.length === 0) {
      onSave(undefined);
    } else {
      onSave({
        title: title.trim() || "Treino do Dia",
        level,
        exercises: validExercises,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Dumbbell className="h-4 w-4" />
            </div>
            Anexar Ficha de Treino
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Título do Treino</Label>
              <Input
                placeholder="Ex: Treino de Peito & Tríceps"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 text-sm h-9"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Nível / Intensidade</Label>
              <Input
                placeholder="Ex: Iniciante, Avançado"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="mt-1 text-sm h-9"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">
                Lista de Exercícios ({exercises.length})
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addExercise}
                className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar Exercício
              </Button>
            </div>

            {exercises.map((ex, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-border/70 bg-card/60 space-y-2 relative group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10">
                    #{idx + 1}
                  </span>
                  <Input
                    placeholder="Nome do exercício (ex: Supino Reto)"
                    value={ex.name}
                    onChange={(e) => updateExercise(idx, "name", e.target.value)}
                    className="h-8 text-xs font-semibold flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExercise(idx)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Séries</Label>
                    <Input
                      placeholder="4"
                      value={ex.sets || ""}
                      onChange={(e) => updateExercise(idx, "sets", e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Reps</Label>
                    <Input
                      placeholder="10-12"
                      value={ex.reps || ""}
                      onChange={(e) => updateExercise(idx, "reps", e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Descanso (s)</Label>
                    <Input
                      type="number"
                      placeholder="60"
                      value={ex.restSeconds || ""}
                      onChange={(e) =>
                        updateExercise(idx, "restSeconds", Number(e.target.value))
                      }
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            className="gap-1.5 font-bold"
          >
            <Sparkles className="h-3.5 w-3.5" /> Salvar Treino no Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
