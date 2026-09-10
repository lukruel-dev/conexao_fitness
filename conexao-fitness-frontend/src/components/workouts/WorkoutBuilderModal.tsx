import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Dumbbell, GripVertical, Sparkles, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { sounds } from '@/lib/soundEffects';
import type { WorkoutRoutine, WorkoutExercise } from '@/types/workouts';
import { createRoutine, updateRoutine } from '@/services/workouts';

interface WorkoutBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRoutine?: WorkoutRoutine | null;
  studentId?: string;
  onSaved?: () => void;
}

const defaultExerciseSuggestions = [
  { name: 'Supino Reto com Barra', muscleGroup: 'Peitoral' },
  { name: 'Supino Inclinado com Halteres', muscleGroup: 'Peitoral' },
  { name: 'Crucifixo / Peck Deck', muscleGroup: 'Peitoral' },
  { name: 'Puxada Frontal na Polia', muscleGroup: 'Costas' },
  { name: 'Remada Curvada com Barra', muscleGroup: 'Costas' },
  { name: 'Remada Baixa Triângulo', muscleGroup: 'Costas' },
  { name: 'Agachamento Livre', muscleGroup: 'Pernas' },
  { name: 'Leg Press 45º', muscleGroup: 'Pernas' },
  { name: 'Cadeira Extensora', muscleGroup: 'Pernas' },
  { name: 'Mesa Flexora', muscleGroup: 'Pernas' },
  { name: 'Elevação Pélvica', muscleGroup: 'Glúteos' },
  { name: 'Desenvolvimento com Halteres', muscleGroup: 'Ombros' },
  { name: 'Elevação Lateral', muscleGroup: 'Ombros' },
  { name: 'Rosca Direta', muscleGroup: 'Bíceps' },
  { name: 'Rosca Martelo', muscleGroup: 'Bíceps' },
  { name: 'Tríceps Corda', muscleGroup: 'Tríceps' },
  { name: 'Tríceps Testa', muscleGroup: 'Tríceps' },
  { name: 'Prancha Abdominal', muscleGroup: 'Abdômen' },
  { name: 'Corrida Esteira / Cardio', muscleGroup: 'Cardio' },
];

export const WorkoutBuilderModal: React.FC<WorkoutBuilderModalProps> = ({
  open,
  onOpenChange,
  editingRoutine,
  studentId,
  onSaved,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [coachNotes, setCoachNotes] = useState('');
  const [isPrescribedForStudent, setIsPrescribedForStudent] = useState(user?.role === 'PERSONAL');
  const [targetStudentName, setTargetStudentName] = useState('');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingRoutine) {
      setTitle(editingRoutine.title || '');
      setDescription(editingRoutine.description || '');
      setDayOfWeek(editingRoutine.dayOfWeek || '');
      setCoachNotes(editingRoutine.coachNotes || '');
      setIsPrescribedForStudent(Boolean(editingRoutine.isPrescribedByPersonal));
      setExercises(editingRoutine.exercises || []);
    } else {
      setTitle('Treino A - Peito & Tríceps');
      setDescription('Foco em força e hipertrofia.');
      setDayOfWeek('Segunda-feira');
      setCoachNotes('Aquecer 5 min na esteira. Manter execução controlada na fase excêntrica.');
      setIsPrescribedForStudent(user?.role === 'PERSONAL');
      setExercises([
        {
          order: 1,
          name: 'Supino Reto com Barra',
          muscleGroup: 'Peitoral',
          sets: 4,
          reps: '10-12',
          targetWeightKg: 40,
          restSeconds: 60,
        },
        {
          order: 2,
          name: 'Supino Inclinado com Halteres',
          muscleGroup: 'Peitoral',
          sets: 3,
          reps: '10-12',
          targetWeightKg: 20,
          restSeconds: 60,
        },
        {
          order: 3,
          name: 'Tríceps Corda',
          muscleGroup: 'Tríceps',
          sets: 4,
          reps: '12-15',
          targetWeightKg: 25,
          restSeconds: 45,
        },
      ]);
    }
  }, [editingRoutine, open, user?.role]);

  const handleAddExercise = (suggestion?: { name: string; muscleGroup: string }) => {
    const newEx: WorkoutExercise = {
      order: exercises.length + 1,
      name: suggestion?.name || '',
      muscleGroup: suggestion?.muscleGroup || 'Peitoral',
      sets: 3,
      reps: '10-12',
      targetWeightKg: 10,
      restSeconds: 60,
    };
    setExercises([...exercises, newEx]);
  };

  const handleUpdateExercise = (index: number, field: keyof WorkoutExercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleRemoveExercise = (index: number) => {
    const updated = exercises.filter((_, idx) => idx !== index);
    setExercises(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Informe o título do treino.');
      return;
    }
    if (exercises.length === 0) {
      toast.error('Adicione ao menos um exercício à ficha.');
      return;
    }

    try {
      setLoading(true);
      const isPersonal = user?.role === 'PERSONAL';

      if (editingRoutine) {
        await updateRoutine(editingRoutine.id, {
          title,
          description,
          dayOfWeek,
          coachNotes,
          exercises,
        });
        sounds.playWorkoutComplete();
        toast.success('Ficha de treino atualizada com sucesso!');
      } else {
        await createRoutine({
          studentId,
          creatorName: isPersonal ? user?.name : undefined,
          creatorRole: isPersonal ? 'PERSONAL' : undefined,
          creatorAvatar: isPersonal ? user?.avatarUrl || undefined : undefined,
          isPrescribedByPersonal: isPersonal || isPrescribedForStudent,
          coachNotes,
          title,
          description: isPersonal && targetStudentName ? `Prescrito para ${targetStudentName}. ${description}` : description,
          dayOfWeek,
          exercises,
        });
        sounds.playWorkoutComplete();
        toast.success(
          isPersonal
            ? 'Ficha de treino prescrita com sucesso!'
            : 'Nova ficha de treino criada com sucesso!'
        );
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Erro ao salvar treino', { description: err?.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6 bg-card border border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold font-display">
            <Dumbbell className="w-5 h-5 text-primary" />
            {editingRoutine ? 'Editar Ficha de Treino' : 'Nova Ficha de Treino'}
          </DialogTitle>
          <DialogDescription>
            Defina o nome da rotina, dias recomendados e adicione a lista de exercícios com séries e cargas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="routine-title">Nome da Ficha *</Label>
              <Input
                id="routine-title"
                required
                placeholder="Ex: Treino A - Peitoral & Tríceps"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="routine-day">Dia Recomendado / Divisão</Label>
              <Input
                id="routine-day"
                placeholder="Ex: Segunda & Quinta ou Treino A"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          {/* Prescrição para Aluno (Personal Trainer) */}
          {user?.role === 'PERSONAL' && (
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <ShieldCheck className="w-4 h-4" /> Prescrição Profissional de Treino Finex
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-foreground">Aluno / Destinatário</Label>
                  <Input
                    placeholder="Nome do Aluno (ex: Gabriel Santana)"
                    value={targetStudentName}
                    onChange={(e) => setTargetStudentName(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-foreground">Orientações do Personal</Label>
                  <Input
                    placeholder="Ex: Aquecimento, cadência 3x1 e hidratação"
                    value={coachNotes}
                    onChange={(e) => setCoachNotes(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="routine-desc">Observações / Foco do Treino</Label>
            <Input
              id="routine-desc"
              placeholder="Ex: Descanso de 60s entre séries, focar na fase excêntrica."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          {/* Lista de Exercícios */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-sm text-foreground">
                Exercícios ({exercises.length})
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddExercise()}
                className="gap-1.5 text-xs h-8 border-primary/40 text-primary hover:bg-primary/10"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Exercício
              </Button>
            </div>

            {exercises.map((ex, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2.5 relative group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-6">#{idx + 1}</span>
                  <Input
                    required
                    placeholder="Nome do Exercício (ex: Supino Reto)"
                    value={ex.name}
                    onChange={(e) => handleUpdateExercise(idx, 'name', e.target.value)}
                    className="h-9 text-xs font-semibold flex-1"
                  />
                  <Input
                    placeholder="Grupo Muscular"
                    value={ex.muscleGroup || ''}
                    onChange={(e) => handleUpdateExercise(idx, 'muscleGroup', e.target.value)}
                    className="h-9 text-xs w-28 hidden sm:block"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveExercise(idx)}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Séries</span>
                    <Input
                      type="number"
                      value={ex.sets}
                      onChange={(e) => handleUpdateExercise(idx, 'sets', parseInt(e.target.value) || 3)}
                      className="h-8 text-xs text-center font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Reps</span>
                    <Input
                      value={ex.reps}
                      onChange={(e) => handleUpdateExercise(idx, 'reps', e.target.value)}
                      className="h-8 text-xs text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Carga (kg)</span>
                    <Input
                      type="number"
                      value={ex.targetWeightKg}
                      onChange={(e) => handleUpdateExercise(idx, 'targetWeightKg', parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs text-center font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Descanso (s)</span>
                    <Input
                      type="number"
                      value={ex.restSeconds}
                      onChange={(e) => handleUpdateExercise(idx, 'restSeconds', parseInt(e.target.value) || 60)}
                      className="h-8 text-xs text-center"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sugestões Rápidas de Exercícios */}
          <div className="pt-2 border-t border-border/50 space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Sugestões rápidas para adicionar:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {defaultExerciseSuggestions.slice(0, 10).map((sugg, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => handleAddExercise(sugg)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-muted hover:bg-primary/20 hover:text-primary transition-all flex items-center gap-1 border border-border/60"
                >
                  <Plus className="w-2.5 h-2.5" /> {sugg.name}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="hero"
              disabled={loading}
              className="gap-2"
            >
              <Dumbbell className="w-4 h-4" />
              {loading ? 'Salvando...' : 'Salvar Ficha de Treino'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
