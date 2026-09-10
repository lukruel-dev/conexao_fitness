import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Volume2, VolumeX, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { soundEffects } from '@/utils/audioAlerts';

interface RestTimerProps {
  initialSeconds?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  initialSeconds = 60,
  isOpen,
  onClose,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setIsActive(true);
  }, [initialSeconds, isOpen]);

  useEffect(() => {
    let interval: any = null;

    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((sec) => {
          if (sec <= 4 && sec > 1 && soundEnabled) {
            soundEffects.playCountdownBeep(false);
          } else if (sec === 1 && soundEnabled) {
            soundEffects.playCountdownBeep(true);
          }
          return sec - 1;
        });
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      setIsActive(false);
    }

    return () => clearInterval(interval);
  }, [isActive, secondsLeft, soundEnabled]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.max(
    0,
    Math.min(100, ((initialSeconds - secondsLeft) / initialSeconds) * 100)
  );

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 animate-slide-in">
      <div className="bg-card/95 backdrop-blur-md border border-primary/40 shadow-2xl rounded-2xl p-4 w-72 flex flex-col gap-3 relative ring-2 ring-primary/20">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Descanso entre Séries
          </span>
        </div>

        {/* Display do Cronômetro */}
        <div className="flex items-center justify-between">
          <div className="text-3xl font-display font-black text-foreground tracking-tight">
            {formatTime(secondsLeft)}
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Silenciar' : 'Ativar Som'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4" />}
            </Button>

            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => {
                setSecondsLeft(initialSeconds);
                setIsActive(true);
              }}
              title="Reiniciar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>

            <Button
              size="icon"
              variant="hero"
              className="h-8 w-8"
              onClick={() => setIsActive(!isActive)}
            >
              {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Atalhos Rápidos */}
        <div className="flex items-center gap-1.5 justify-between pt-1">
          {[30, 45, 60, 90].map((sec) => (
            <button
              key={sec}
              onClick={() => {
                setSecondsLeft(sec);
                setIsActive(true);
              }}
              className="px-2 py-1 rounded-md text-[10px] font-semibold bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex-1"
            >
              {sec}s
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
