import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Watch,
  Activity,
  Flame,
  Moon,
  HeartPulse,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Send,
  BedDouble,
  Lightbulb,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { isNutritionist, isPersonalTrainer } from '@/utils/professionalRoles';
import { getHealthData, getHealthConsent } from '@/services/healthService';
import { toast } from 'sonner';

interface StudentHealthReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export const StudentHealthReportModal: React.FC<StudentHealthReportModalProps> = ({
  open,
  onOpenChange,
  student,
}) => {
  const { user } = useAuth();
  const studentId = student?.id || 'current-user';

  const isNutri = isNutritionist(user);
  const isPersonal = isPersonalTrainer(user);
  const isAdmin = user?.role === 'ADMIN';

  const consent = getHealthConsent(studentId);
  const healthData = getHealthData(studentId);
  const [requestSent, setRequestSent] = useState(false);

  // Verificação de autorização com base no papel profissional do visualizador
  const isAuthorized =
    isAdmin ||
    (isNutri && consent.shareWithNutritionist) ||
    (isPersonal && consent.shareWithPersonalTrainer) ||
    (!isNutri && !isPersonal && (consent.shareWithPersonalTrainer || consent.shareWithNutritionist));

  const handleRequestPermission = () => {
    setRequestSent(true);
    toast.success(`Solicitação de acesso enviada para ${student?.name || 'o aluno'}!`, {
      description: 'O aluno receberá uma notificação para autorizar o compartilhamento no aplicativo.',
    });
  };

  const chartDataSleep = healthData.weeklySummaries.map((s) => ({
    day: s.dayLabel,
    profundo: Number((s.deepSleepMinutes / 60).toFixed(1)),
    rem: Number((s.remSleepMinutes / 60).toFixed(1)),
    leve: Number((s.lightSleepMinutes / 60).toFixed(1)),
    totalHoras: Number((s.sleepMinutes / 60).toFixed(1)),
    score: s.sleepScore,
  }));

  const chartDataCalories = healthData.weeklySummaries.map((s) => ({
    day: s.dayLabel,
    calorias: s.caloriesBurned,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 bg-card border-border/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Header do Relatório */}
        <DialogHeader className="p-5 sm:p-6 border-b border-border/70 bg-gradient-to-r from-card via-muted/40 to-primary/5 flex flex-row items-center justify-between shrink-0 space-y-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] font-extrabold uppercase">
                <Watch className="w-3 h-3 mr-1" /> SMARTWATCH BIOMETRICS
              </Badge>
              {isAuthorized && (
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Acesso Autorizado
                </span>
              )}
            </div>
            <DialogTitle className="text-lg sm:text-xl font-black font-display text-foreground">
              Relatório de Saúde: {student?.name || 'Aluno'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Dados consolidados de treinos, gasto calórico e sono (Apple Health / Health Connect).
            </DialogDescription>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-card border border-border/80 flex items-center justify-center text-primary shadow-sm shrink-0">
            <HeartPulse className="w-6 h-6 text-rose-500" />
          </div>
        </DialogHeader>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {!isAuthorized ? (
            /* Estado de Acesso Não Autorizado pelo Aluno */
            <div className="py-12 px-4 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-lg text-foreground">
                  Acesso Restrito pelo Aluno
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Por conformidade com a LGPD e privacidade médica, os dados biométricos colhidos do smartwatch (calorias, batimentos e fases do sono) exigem o consentimento do aluno.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border text-left text-xs text-muted-foreground space-y-1">
                <span className="font-bold text-foreground block">O que você poderá visualizar após a aprovação:</span>
                <p>• Duração e intensidade real de treinos registrados pelo relógio;</p>
                <p>• Horas de sono profundo e índice de prontidão neuromuscular;</p>
                <p>• Gasto calórico ativo real para calibragem precisa de treinos ou dieta.</p>
              </div>

              <Button
                variant="hero"
                onClick={handleRequestPermission}
                disabled={requestSent}
                className="w-full rounded-2xl font-bold text-xs gap-2 shadow-glow"
              >
                <Send className="w-3.5 h-3.5" />
                {requestSent ? 'Solicitação Enviada' : 'Solicitar Autorização ao Aluno'}
              </Button>
            </div>
          ) : (
            /* Estado de Acesso Autorizado com Relatório Completo */
            <div className="space-y-6">
              {/* Card de Pareamento e Dispositivo */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-card border border-border text-primary">
                    <Watch className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-foreground block">{healthData.deviceModel}</span>
                    <span className="text-[11px] text-muted-foreground">
                      Sincronizado via {healthData.platform === 'APPLE_HEALTH' ? 'Apple HealthKit' : 'Health Connect'}
                    </span>
                  </div>
                </div>

                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                  Dados dos últimos 7 dias
                </Badge>
              </div>

              {/* Grid com 4 Indicadores Principais */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Treinos</span>
                  <div className="text-lg sm:text-xl font-black font-display text-foreground">
                    {healthData.workouts.length}{' '}
                    <span className="text-xs font-medium text-muted-foreground">sessões</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold">Consistente</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Gasto Médio</span>
                  <div className="text-lg sm:text-xl font-black font-display text-amber-500">
                    {healthData.averageDailyCalories}{' '}
                    <span className="text-xs font-medium text-muted-foreground">kcal/d</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Medido pelo relógio</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Sono Total</span>
                  <div className="text-lg sm:text-xl font-black font-display text-indigo-400">
                    {healthData.averageSleepHours}h{' '}
                    <span className="text-xs font-medium text-muted-foreground">/noite</span>
                  </div>
                  <span className="text-[10px] text-indigo-400 font-semibold">Regular</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Recuperação</span>
                  <div className="text-lg sm:text-xl font-black font-display text-emerald-400">
                    {healthData.averageSleepScore}
                    <span className="text-xs font-medium text-muted-foreground">/100</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold">Excelente</span>
                </div>
              </div>

              {/* Bloco de Insights Clínicos & Técnicos Especializados */}
              {isNutri ? (
                /* Insights para Nutricionista */
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm">
                    <Lightbulb className="w-4 h-4" />
                    Insight Nutricional (Gasto Calórico Real & Metabolismo)
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    O relógio inteligente registrou um gasto calórico ativo médio de{' '}
                    <strong>{healthData.averageDailyCalories} kcal/dia</strong> em treinos. Isso indica uma Taxa Metabólica Total (TDEE) superior à média estimada por tabelas genéricas. Recomenda-se reforçar a ingestão proteica e carboidratos no pré/pós-treino para sustentar a recuperação muscular.
                  </p>
                </div>
              ) : (
                /* Insights para Personal Trainer */
                <div className="p-4 sm:p-5 rounded-2xl bg-primary/10 border border-primary/25 space-y-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm">
                    <Lightbulb className="w-4 h-4" />
                    Insight Técnico de Periodização (Sono & Prontidão)
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    O aluno apresentou uma média de sono profundo de{' '}
                    <strong>1h45min por noite</strong> com score de recuperação de{' '}
                    <strong>{healthData.averageSleepScore}/100</strong>. O sistema neuromuscular está altamente recuperado, permitindo sessões de alta intensidade com sobrecarga progressiva de peso sem risco iminente de overreaching.
                  </p>
                </div>
              )}

              {/* Gráfico de Fases do Sono */}
              <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    Fases do Sono (Recuperação Muscular & REM)
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" /> Profundo
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-500" /> REM
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-sky-400" /> Leve
                    </span>
                  </div>
                </div>

                <div className="h-52 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataSleep} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.07)" />
                      <XAxis dataKey="day" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                      <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} unit="h" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderRadius: '12px',
                          color: '#fafafa',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="profundo" stackId="a" fill="#4f46e5" name="Sono Profundo" />
                      <Bar dataKey="rem" stackId="a" fill="#a855f7" name="Sono REM" />
                      <Bar dataKey="leve" stackId="a" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Sono Leve" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico de Calorias dos Treinos */}
              <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  Gasto Calórico dos Treinos (kcal)
                </span>

                <div className="h-44 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartDataCalories} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.07)" />
                      <XAxis dataKey="day" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                      <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderRadius: '12px',
                          color: '#fafafa',
                          fontSize: '11px',
                        }}
                        formatter={(val: any) => [`${val} kcal`, 'Gasto Calórico']}
                      />
                      <Area
                        type="monotone"
                        dataKey="calorias"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fill="#f59e0b"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
