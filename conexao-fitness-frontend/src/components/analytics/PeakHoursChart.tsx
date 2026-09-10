import React, { useState } from 'react';
import { Clock, Info } from 'lucide-react';
import type { PeakHourData } from '@/types/gymAnalytics';

interface PeakHoursChartProps {
  peakHours?: PeakHourData[];
}

export const PeakHoursChart: React.FC<PeakHoursChartProps> = ({ peakHours = [] }) => {
  const currentHour = new Date().getHours();
  const [selectedHour, setSelectedHour] = useState<PeakHourData | null>(null);

  if (!peakHours || peakHours.length === 0) return null;

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card/60 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm text-foreground">
            Horários Mais Movimentados
          </h4>
        </div>
        <span className="text-xs text-muted-foreground">Média dos últimos 30 dias</span>
      </div>

      {/* Gráfico de Barras de Horas */}
      <div className="pt-4 pb-2">
        <div className="h-36 flex items-end gap-1 sm:gap-2 justify-between border-b border-border/60 pb-2">
          {peakHours.map((item) => {
            const isNow = item.hourNumber === currentHour;
            const isSelected = selectedHour?.hourNumber === item.hourNumber;

            const isHigh = item.intensityPercent >= 70;
            const isMed = item.intensityPercent >= 40 && item.intensityPercent < 70;

            const barColor = isNow
              ? 'bg-primary ring-2 ring-primary/40 shadow-lg shadow-primary/30'
              : isHigh
              ? 'bg-rose-500/80 hover:bg-rose-500'
              : isMed
              ? 'bg-amber-500/80 hover:bg-amber-500'
              : 'bg-emerald-500/70 hover:bg-emerald-500';

            return (
              <div
                key={item.hour}
                className="flex-1 flex flex-col items-center gap-1 group relative cursor-pointer"
                onMouseEnter={() => setSelectedHour(item)}
                onClick={() => setSelectedHour(item)}
              >
                {/* Tooltip Hover */}
                <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all z-20 pointer-events-none whitespace-nowrap bg-black/90 text-white text-[10px] font-bold py-1 px-2 rounded-lg border border-border/80 shadow-md">
                  {item.hour} • {item.label}
                </div>

                {/* Barra */}
                <div
                  className={`w-full max-w-[22px] rounded-t-md transition-all duration-300 ${barColor}`}
                  style={{ height: `${item.intensityPercent}%` }}
                />

                {/* Rótulo da Hora */}
                <span
                  className={`text-[9px] font-semibold mt-1 ${
                    isNow ? 'text-primary font-bold' : 'text-muted-foreground'
                  }`}
                >
                  {item.hourNumber % 2 === 0 ? item.hourNumber : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda & Informações */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground pt-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span>Tranquilo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span>Moderado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            <span>Pico</span>
          </div>
        </div>

        {selectedHour ? (
          <div className="font-semibold text-foreground">
            {selectedHour.hour}: <span className="text-primary">{selectedHour.label}</span>
          </div>
        ) : (
          <div className="text-muted-foreground">Passe o mouse para ver detalhes</div>
        )}
      </div>
    </div>
  );
};
