import React, { useState } from 'react';
import {
  Watch,
  Activity,
  Moon,
  Flame,
  HeartPulse,
  RefreshCw,
  Share2,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Sliders,
  Send,
  BedDouble,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import {
  getHealthData,
  getHealthConsent,
  updateHealthConsent,
  syncSmartwatchData,
  publishHealthEvolutionToFeed,
} from '@/services/healthService';
import { sounds } from '@/lib/soundEffects';
import { toast } from 'sonner';

export const SmartwatchHealthDashboard: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.id || 'current-user';

  const [healthData, setHealthData] = useState(() => getHealthData(studentId));
  const [consent, setConsent] = useState(() => getHealthConsent(studentId));
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal de Postar no Feed
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCaption, setShareCaption] = useState('');
  const [isPublishingPost, setIsPublishingPost] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const fresh = await syncSmartwatchData(studentId);
      setHealthData(fresh);
      sounds.playNotification();
      toast.success('Dados biométricos sincronizados com seu relógio inteligente!');
    } catch {
      toast.error('Erro ao sincronizar com o smartwatch.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleConsentPersonal = (checked: boolean) => {
    const updated = updateHealthConsent(studentId, { shareWithPersonalTrainer: checked });
    setConsent(updated);
    toast.success(
      checked
        ? 'Acesso concedido ao seu Personal Trainer!'
        : 'Acesso revogado para o seu Personal Trainer.'
    );
  };

  const handleToggleConsentNutri = (checked: boolean) => {
    const updated = updateHealthConsent(studentId, { shareWithNutritionist: checked });
    setConsent(updated);
    toast.success(
      checked
        ? 'Acesso concedido à sua Nutricionista!'
        : 'Acesso revogado para a sua Nutricionista.'
    );
  };

  const handlePublishToFeed = async () => {
    setIsPublishingPost(true);
    try {
      const totalCals = healthData.weeklySummaries.reduce((sum, d) => sum + d.caloriesBurned, 0);
      const totalWorkouts = healthData.workouts.length;
      const avgSleepMins = Math.round(
        healthData.weeklySummaries.reduce((sum, d) => sum + d.sleepMinutes, 0) /
          healthData.weeklySummaries.length
      );

      await publishHealthEvolutionToFeed(
        {
          provider: healthData.platform,
          deviceModel: healthData.deviceModel,
          date: new Date().toISOString().split('T')[0],
          periodLabel: 'Resumo Semanal de Alta Performance',
          totalCaloriesBurned: totalCals,
          workoutsCount: totalWorkouts,
          workoutDurationMinutes: healthData.weeklySummaries.reduce((sum, d) => sum + d.workoutMinutes, 0),
          sleepDurationMinutes: avgSleepMins,
          sleepScore: healthData.averageSleepScore,
          deepSleepMinutes: Math.round(
            healthData.weeklySummaries.reduce((sum, d) => sum + d.deepSleepMinutes, 0) /
              healthData.weeklySummaries.length
          ),
          remSleepMinutes: Math.round(
            healthData.weeklySummaries.reduce((sum, d) => sum + d.remSleepMinutes, 0) /
              healthData.weeklySummaries.length
          ),
        },
        shareCaption,
        user
      );

      sounds.playAchievement();
      toast.success('Sua evolução e gráficos foram compartilhados no Feed da Comunidade!');
      setIsShareModalOpen(false);
      setShareCaption('');
    } catch (err: any) {
      toast.error('Erro ao postar no feed', { description: err?.message });
    } finally {
      setIsPublishingPost(false);
    }
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
    meta: 500,
    minutosTreino: s.workoutMinutes,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header do Relógio & Status de Conexão */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-card via-card/90 to-primary/5 border border-border/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center text-primary shadow-inner shrink-0">
              <Watch className="w-7 h-7 animate-pulse" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Sincronizado
                </Badge>
                <span className="text-xs text-muted-foreground font-medium">
                  {healthData.platform === 'APPLE_HEALTH'
                    ? 'Apple HealthKit'
                    : healthData.platform === 'HEALTH_CONNECT'
                    ? 'Google Health Connect'
                    : 'Apple Watch / Health Connect'}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-display font-black text-foreground">
                {healthData.deviceModel}
              </h2>

              <p className="text-xs text-muted-foreground">
                Última leitura dos sensores às{' '}
                {new Date(healthData.lastSync).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="rounded-2xl text-xs font-bold gap-2 flex-1 sm:flex-none border-border hover:bg-muted/60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
              {isSyncing ? 'Lendo Sensores...' : 'Sincronizar Agora'}
            </Button>

            <Button
              variant="hero"
              size="sm"
              onClick={() => setIsShareModalOpen(true)}
              className="rounded-2xl text-xs font-bold gap-2 shadow-glow flex-1 sm:flex-none"
            >
              <Share2 className="w-3.5 h-3.5" />
              Postar no Feed
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Grid de 4 Métricas Principais da Semana */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Gasto Calórico */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Calorias Ativas</span>
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black font-display text-foreground">
              {healthData.averageDailyCalories}{' '}
              <span className="text-xs font-medium text-muted-foreground">kcal/dia</span>
            </div>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" /> +14% vs meta diária
            </p>
          </div>
        </div>

        {/* Card 2: Tempo de Treino */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Treinos na Semana</span>
            <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black font-display text-foreground">
              {healthData.workouts.length}{' '}
              <span className="text-xs font-medium text-muted-foreground">sessões</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Média de 58 min por treino
            </p>
          </div>
        </div>

        {/* Card 3: Sono Total */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Média de Sono</span>
            <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black font-display text-foreground">
              {healthData.averageSleepHours}{' '}
              <span className="text-xs font-medium text-muted-foreground">horas/noite</span>
            </div>
            <p className="text-[11px] text-indigo-400 font-semibold flex items-center gap-1 mt-0.5">
              <BedDouble className="w-3 h-3" /> Sono regular e consistente
            </p>
          </div>
        </div>

        {/* Card 4: Score de Sono & Recuperação */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Recuperação</span>
            <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black font-display text-foreground">
              {healthData.averageSleepScore}
              <span className="text-xs font-medium text-muted-foreground">/100</span>
            </div>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Alta prontidão para treino
            </p>
          </div>
        </div>
      </div>

      {/* 3. Gráfico 1: Análise e Fases do Sono (Profundo, REM, Leve) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-400" />
              <h3 className="font-display font-bold text-base sm:text-lg text-foreground">
                Arquitetura e Fases do Sono
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Leitura detalhada dos ciclos de sono profundo (recuperação muscular), sono REM (cognitivo) e sono leve.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Profundo
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> REM
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Leve
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartDataSleep} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.07)" />
              <XAxis dataKey="day" stroke="#a1a1aa" fontSize={12} tickLine={false} />
              <YAxis
                stroke="#a1a1aa"
                fontSize={12}
                tickLine={false}
                unit="h"
                domain={[0, 10]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#27272a',
                  borderRadius: '16px',
                  color: '#fafafa',
                  fontSize: '12px',
                }}
                formatter={(val: any, name: string) => [
                  `${val} horas`,
                  name === 'profundo'
                    ? 'Sono Profundo'
                    : name === 'rem'
                    ? 'Sono REM'
                    : 'Sono Leve',
                ]}
              />
              <Bar dataKey="profundo" stackId="a" fill="#4f46e5" radius={[0, 0, 0, 0]} name="profundo" />
              <Bar dataKey="rem" stackId="a" fill="#a855f7" radius={[0, 0, 0, 0]} name="rem" />
              <Bar dataKey="leve" stackId="a" fill="#38bdf8" radius={[6, 6, 0, 0]} name="leve" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Gráfico 2: Calorias Queimadas vs Meta Diária */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <h3 className="font-display font-bold text-base sm:text-lg text-foreground">
                Gasto Calórico dos Treinos (kcal)
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Energia ativa queimada durante as sessões de musculação, corrida e treinos funcionais.
            </p>
          </div>

          <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10 w-fit">
            Meta diária: 500 kcal
          </Badge>
        </div>

        <div className="h-60 sm:h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartDataCalories} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="calorieGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.07)" />
              <XAxis dataKey="day" stroke="#a1a1aa" fontSize={12} tickLine={false} />
              <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} unit=" kcal" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#27272a',
                  borderRadius: '16px',
                  color: '#fafafa',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [`${val} kcal`, 'Calorias Ativas']}
              />
              <Area
                type="monotone"
                dataKey="calorias"
                stroke="#f59e0b"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#calorieGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Painel de Controle de Consentimento e Privacidade LGPD */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-base sm:text-lg">
            Compartilhamento Seguro de Saúde (LGPD)
          </h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Você tem total controle sobre os seus dados biométricos. Os profissionais contratados só conseguem visualizar seus relatórios mediante sua permissão expressa.
        </p>

        <div className="space-y-3 pt-2 border-t border-border/50">
          {/* Toggle 1: Personal Trainer */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  Compartilhar com meu Personal Trainer
                </span>
                <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                  CREF
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground max-w-xl">
                Permite que o treinador veja seu volume semanal, zonas de frequência cardíaca e pontuação de sono para dosar cargas e evitar overtraining.
              </p>
            </div>
            <Switch
              checked={consent.shareWithPersonalTrainer}
              onCheckedChange={handleToggleConsentPersonal}
            />
          </div>

          {/* Toggle 2: Nutricionista */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  Compartilhar com minha Nutricionista
                </span>
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                  CRN
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground max-w-xl">
                Permite que a nutricionista analise seu gasto calórico ativo diário e horas de sono para calibrar o aporte calórico e a distribuição de macronutrientes.
              </p>
            </div>
            <Switch
              checked={consent.shareWithNutritionist}
              onCheckedChange={handleToggleConsentNutri}
            />
          </div>
        </div>
      </div>

      {/* Modal de Compartilhamento no Feed */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="max-w-md p-6 bg-card border-border/80 rounded-3xl shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase">
              <Sparkles className="w-4 h-4" /> Comunidade Finex
            </div>
            <DialogTitle className="text-xl font-black font-display text-foreground">
              Postar Evolução no Feed
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Compartilhe suas estatísticas reais colhidas pelo relógio inteligente para inspirar outros alunos da comunidade.
            </DialogDescription>
          </DialogHeader>

          {/* Card de Pré-visualização do Relógio */}
          <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-3 my-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Watch className="w-4 h-4 text-primary" />
                Dados Verificados ({healthData.platform === 'APPLE_HEALTH' ? 'Apple Health' : 'Health Connect'})
              </span>
              <Badge className="bg-primary/15 text-primary text-[10px]">7 DIAS</Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-border/50">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">Treinos</span>
                <span className="text-sm font-black text-foreground">{healthData.workouts.length}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">Gasto Total</span>
                <span className="text-sm font-black text-amber-500">
                  {healthData.weeklySummaries.reduce((acc, d) => acc + d.caloriesBurned, 0).toLocaleString('pt-BR')} kcal
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">Sono Médio</span>
                <span className="text-sm font-black text-indigo-400">
                  {healthData.averageSleepHours}h
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground">
              Adicione uma mensagem pessoal (opcional):
            </label>
            <Textarea
              placeholder="Ex: Semana concluída com 100% de consistência nos treinos e sono regulado! Vamos pra cima! 🚀"
              value={shareCaption}
              onChange={(e) => setShareCaption(e.target.value)}
              className="rounded-2xl text-xs sm:text-sm bg-muted/40 min-h-[90px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsShareModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              variant="hero"
              onClick={handlePublishToFeed}
              disabled={isPublishingPost}
              className="rounded-xl text-xs font-bold gap-2 shadow-glow"
            >
              <Send className="w-3.5 h-3.5" />
              {isPublishingPost ? 'Publicando...' : 'Publicar no Feed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
