import React from 'react';
import { Calendar, CheckCircle2, Flame } from 'lucide-react';

interface WorkoutHeatmapProps {
  currentStreak?: number;
  lastWorkoutDate?: string | null;
  activeDaysThisMonth?: string[]; // Array of 'YYYY-MM-DD'
}

export const WorkoutHeatmap: React.FC<WorkoutHeatmapProps> = ({
  currentStreak = 0,
  lastWorkoutDate,
  activeDaysThisMonth = [],
}) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Quantidade de dias no mês atual
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Domingo

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Mapeia os dias ativos
  const activeDaysSet = new Set(
    activeDaysThisMonth.map((d) => Number(d.split('-')[2]))
  );

  // Se tiver lastWorkoutDate no mês atual, adiciona
  if (lastWorkoutDate) {
    const d = new Date(lastWorkoutDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      activeDaysSet.add(d.getDate());
    }
  }

  // Se streak > 0, adiciona os dias anteriores
  const todayDate = now.getDate();
  for (let i = 0; i < currentStreak; i++) {
    const targetDay = todayDate - i;
    if (targetDay >= 1) {
      activeDaysSet.add(targetDay);
    }
  }

  const weekLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="p-4 rounded-2xl border border-border bg-card/70 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm text-foreground">
            Frequência em {monthNames[month]}
          </h4>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-primary" />
          {activeDaysSet.size} dia(s) treinados
        </div>
      </div>

      {/* Grid de Dias */}
      <div>
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {weekLabels.map((day, idx) => (
            <span key={idx} className="text-[10px] text-muted-foreground font-semibold">
              {day}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Espaços vazios antes do 1º dia */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-7 rounded-lg" />
          ))}

          {/* Dias do Mês */}
          {daysArray.map((day) => {
            const isActive = activeDaysSet.has(day);
            const isToday = day === todayDate;

            return (
              <div
                key={day}
                className={`h-7 rounded-lg flex items-center justify-center text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/30'
                    : isToday
                    ? 'border border-primary text-primary bg-primary/5'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted/70'
                }`}
                title={`Dia ${day} de ${monthNames[month]}: ${isActive ? 'Treino Realizado!' : 'Descanso'}`}
              >
                {day}
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
