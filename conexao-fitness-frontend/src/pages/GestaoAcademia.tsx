import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import {
  listMyGymEnrollments,
  getGymDashboardStats,
  listMyGymPlans,
  createGymPlan,
  updateGymPlan,
  deleteGymPlan,
  createManualEnrollment,
  renewGymEnrollment,
  updateGymEnrollmentStatus,
  validateGymAccess,
  chargeGymDayPass,
  getMyGymDayPassPrice,
  getGymAccessLogs,
  EnrollmentStatus,
  GymEnrollment,
  MembershipPlan,
  ValidateAccessResponse,
} from '@/services/memberships';
import { formatBRL } from '@/lib/format';
import { toast } from 'sonner';
import {
  Users,
  QrCode,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  Search,
  RefreshCw,
  MoreVertical,
  Camera,
  CameraOff,
  Sparkles,
  Lock,
  Crown,
  ChevronRight,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  Dumbbell,
  History,
  Play,
  Pause,
  ArrowUpRight,
  Wallet,
  Zap,
  Coins,
} from 'lucide-react';

export default function GestaoAcademia() {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'enrollments' | 'turnstile' | 'plans' | 'logs'>('enrollments');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | ''>('');

  // Modais
  const [newPlanModalOpen, setNewPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [manualEnrollmentOpen, setManualEnrollmentOpen] = useState(false);
  const [renewModalEnrollment, setRenewModalEnrollment] = useState<GymEnrollment | null>(null);

  // Estados de Formulários de Planos
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: 99.9,
    durationDays: 30,
    modalities: 'Musculação, Cardio',
    benefits: 'Acesso Livre, Vestiários, Avaliação Física',
  });

  // Estados de Matrícula Manual
  const [manualForm, setManualForm] = useState({
    studentName: '',
    studentEmail: '',
    studentCpf: '',
    planId: '',
    planName: 'Plano Mensal Balcão',
    amountPaid: 99.9,
    durationDays: 30,
    notes: '',
  });

  // Estados de Renovação
  const [renewForm, setRenewForm] = useState({
    additionalDays: 30,
    amountPaid: 99.9,
  });

  // Estados da Catraca / Scanner
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ValidateAccessResponse | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const isGym = user?.role === 'ACADEMIA' || user?.role === 'ADMIN';

  // Consultas da API
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ['gym-dashboard-stats', user?.id],
    queryFn: getGymDashboardStats,
    enabled: !!user && isGym,
  });

  const { data: enrollmentsData, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['gym-enrollments', user?.id, statusFilter, searchTerm],
    queryFn: () =>
      listMyGymEnrollments({
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      }),
    enabled: !!user && isGym,
  });

  const { data: plansData, isLoading: loadingPlans } = useQuery({
    queryKey: ['gym-my-plans', user?.id],
    queryFn: listMyGymPlans,
    enabled: !!user && isGym,
  });

  const { data: accessLogs, isLoading: loadingLogs } = useQuery({
    queryKey: ['gym-access-logs', user?.id],
    queryFn: () => getGymAccessLogs(30),
    enabled: !!user && isGym,
  });

  const { data: dayPassPriceData } = useQuery({
    queryKey: ['gym-daypass-price', user?.id],
    queryFn: getMyGymDayPassPrice,
    enabled: !!user && isGym,
  });

  const [dayPassCustomAmount, setDayPassCustomAmount] = useState<number | ''>('');

  const hasEssencialAccess = statsData?.tier?.hasAccess ?? true;

  // Efeito sonoro sintetizado no navegador para feedback de catraca
  const playBeep = (granted: boolean) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (granted) {
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } else {
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(200, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      // AudioContext não disponível ou restrito pelo navegador
    }
  };

  // Mutação para Validação de Acesso
  const validateAccessMutation = useMutation({
    mutationFn: (code: string) => validateGymAccess({ qrCode: code, deviceInfo: 'Catraca Recepção' }),
    onSuccess: (res) => {
      setLastScanResult(res);
      playBeep(res.granted);
      qc.invalidateQueries({ queryKey: ['gym-access-logs'] });
      qc.invalidateQueries({ queryKey: ['gym-dashboard-stats'] });

      if (res.granted) {
        toast.success(res.message, {
          description: `Aluno: ${res.student?.name} • Plano: ${res.enrollment?.planName}`,
        });
      } else if (res.canChargeDayPass) {
        toast.info('Aluno Finex identificado!', {
          description: `Saldo disponível: ${formatBRL(res.studentBalance ?? 0)}. Você pode debitar o Day Pass diretamente da carteira dele.`,
        });
      } else {
        toast.error(res.message, {
          description: res.reason,
        });
      }
    },
    onError: (err: Error) => {
      playBeep(false);
      toast.error('Erro na validação de acesso', { description: err.message });
    },
  });

  // Mutação para Cobrança de Day Pass instantâneo na Carteira
  const chargeDayPassMutation = useMutation({
    mutationFn: ({
      studentIdentifier,
      customAmount,
    }: {
      studentIdentifier: string;
      customAmount?: number;
    }) =>
      chargeGymDayPass({
        studentIdentifier,
        customAmount,
        deviceInfo: 'Catraca Recepção Day Pass',
      }),
    onSuccess: (res) => {
      setLastScanResult({
        granted: res.granted,
        isDayPass: true,
        canChargeDayPass: false,
        message: res.message,
        reason: res.reason,
        student: res.student,
        enrollment: res.enrollment,
        accessLogId: res.accessLogId,
      });
      playBeep(res.granted);
      qc.invalidateQueries({ queryKey: ['gym-access-logs'] });
      qc.invalidateQueries({ queryKey: ['gym-dashboard-stats'] });
      qc.invalidateQueries({ queryKey: ['gym-enrollments'] });

      if (res.granted) {
        toast.success(res.message, {
          description: `R$ ${res.amountDebited?.toFixed(2)} debitado da carteira Finex de ${res.student?.name}`,
        });
      } else {
        toast.error(res.message, {
          description: res.reason,
        });
      }
    },
    onError: (err: Error) => {
      playBeep(false);
      toast.error('Erro na cobrança do Day Pass', { description: err.message });
    },
  });

  // Mutação para Criar/Editar Plano
  const savePlanMutation = useMutation({
    mutationFn: () => {
      const modalities = planForm.modalities.split(',').map((m) => m.trim()).filter(Boolean);
      const benefits = planForm.benefits.split(',').map((b) => b.trim()).filter(Boolean);

      if (editingPlan) {
        return updateGymPlan(editingPlan.id, {
          name: planForm.name,
          description: planForm.description,
          price: Number(planForm.price),
          durationDays: Number(planForm.durationDays),
          modalities,
          benefits,
        });
      }
      return createGymPlan({
        name: planForm.name,
        description: planForm.description,
        price: Number(planForm.price),
        durationDays: Number(planForm.durationDays),
        modalities,
        benefits,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gym-my-plans'] });
      toast.success(editingPlan ? 'Plano atualizado com sucesso!' : 'Novo plano criado!');
      setNewPlanModalOpen(false);
      setEditingPlan(null);
    },
    onError: (err: Error) => toast.error('Erro ao salvar plano', { description: err.message }),
  });

  // Mutação para Deletar Plano
  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => deleteGymPlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gym-my-plans'] });
      toast.success('Plano desativado');
    },
    onError: (err: Error) => toast.error('Erro ao desativar plano', { description: err.message }),
  });

  // Mutação para Matrícula Manual
  const manualEnrollMutation = useMutation({
    mutationFn: () =>
      createManualEnrollment({
        studentName: manualForm.studentName,
        studentEmail: manualForm.studentEmail,
        studentCpf: manualForm.studentCpf || undefined,
        planId: manualForm.planId || undefined,
        planName: manualForm.planName,
        amountPaid: Number(manualForm.amountPaid),
        durationDays: Number(manualForm.durationDays),
        notes: manualForm.notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gym-enrollments'] });
      qc.invalidateQueries({ queryKey: ['gym-dashboard-stats'] });
      toast.success('Matrícula cadastrada com sucesso!');
      setManualEnrollmentOpen(false);
      setManualForm({
        studentName: '',
        studentEmail: '',
        studentCpf: '',
        planId: '',
        planName: 'Plano Mensal Balcão',
        amountPaid: 99.9,
        durationDays: 30,
        notes: '',
      });
    },
    onError: (err: Error) => toast.error('Erro ao cadastrar matrícula', { description: err.message }),
  });

  // Mutação para Renovar Matrícula
  const renewMutation = useMutation({
    mutationFn: () =>
      renewGymEnrollment(renewModalEnrollment!.id, {
        additionalDays: Number(renewForm.additionalDays),
        amountPaid: Number(renewForm.amountPaid),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gym-enrollments'] });
      qc.invalidateQueries({ queryKey: ['gym-dashboard-stats'] });
      toast.success('Matrícula renovada com sucesso!');
      setRenewModalEnrollment(null);
    },
    onError: (err: Error) => toast.error('Erro ao renovar matrícula', { description: err.message }),
  });

  // Mutação para Alterar Status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EnrollmentStatus }) =>
      updateGymEnrollmentStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gym-enrollments'] });
      toast.success('Status da matrícula atualizado!');
    },
    onError: (err: Error) => toast.error('Erro ao alterar status', { description: err.message }),
  });

  // Controle de Câmera para Scanner
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      toast.info('Câmera ativada para leitura de QR Code');
    } catch (err: any) {
      toast.error('Não foi possível acessar a câmera', {
        description: 'Verifique as permissões do navegador ou digite o código/CPF manualmente.',
      });
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !isGym) return <Navigate to="/" replace />;

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) {
      toast.warning('Digite um código QR, CPF ou email do aluno');
      return;
    }
    validateAccessMutation.mutate(manualCodeInput.trim());
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-24 md:pt-28 pb-16 container mx-auto px-4 max-w-7xl">
        {/* Cabeçalho do Painel da Academia */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                Painel da Academia
              </span>
              <span className="text-xs text-muted-foreground">
                Plano Atual: <strong className="text-foreground">{statsData?.tier?.planName || 'Essencial'}</strong>
              </span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Gestão de <span className="gradient-text">Matrículas & Catraca</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Controle de alunos, matrículas online, planos e leitor de QR Code na portaria.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => setActiveTab('turnstile')}
              className="gap-2 rounded-xl shadow-sm border-primary/30 text-primary hover:bg-primary hover:text-white"
            >
              <QrCode className="w-4 h-4" /> Catraca Digital
            </Button>
            <Button
              variant="hero"
              onClick={() => {
                setManualForm({
                  studentName: '',
                  studentEmail: '',
                  studentCpf: '',
                  planId: plansData?.[0]?.id || '',
                  planName: plansData?.[0]?.name || 'Plano Mensal Balcão',
                  amountPaid: Number(plansData?.[0]?.price || 99.9),
                  durationDays: plansData?.[0]?.durationDays || 30,
                  notes: '',
                });
                setManualEnrollmentOpen(true);
              }}
              className="gap-2 rounded-xl"
            >
              <Plus className="w-4 h-4" /> Nova Matrícula
            </Button>
          </div>
        </div>

        {/* ALERTA / BANNER EDUCATIVO DE PLANO (FEATURE GATING) */}
        {!hasEssencialAccess && (
          <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-primary/15 border-2 border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-500 shrink-0 mt-0.5">
                <Crown className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                  Recurso Exclusivo a partir do Plano Essencial
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                  Sua academia está no plano <strong>Gratuito</strong>. Para habilitar <strong>Matrículas Online automáticas</strong>, <strong>Validação de Acesso por QR Code na Entrada</strong> e <strong>Gestão Completa de Alunos</strong>, faça o upgrade para o Plano Essencial.
                </p>
              </div>
            </div>

            <Button size="lg" variant="hero" asChild className="shrink-0 rounded-2xl shadow-glow-blue">
              <Link to="/planos" className="gap-2">
                <Sparkles className="w-4 h-4" /> Desbloquear com Plano Essencial
              </Link>
            </Button>
          </div>
        )}

        {/* CARDS DE INDICADORES / KPIS DA ACADEMIA */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-3xl bg-card border border-border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Alunos Ativos</span>
              <span className="text-2xl font-bold font-display text-foreground">
                {statsData?.totalActiveStudents ?? 0}
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Total: {statsData?.totalStudents ?? 0} cadastrados
              </span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-card border border-border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Check-ins Hoje</span>
              <span className="text-2xl font-bold font-display text-foreground">
                {statsData?.checkinsToday ?? 0}
              </span>
              <span className="text-[11px] text-emerald-500 font-semibold block">
                Acessos validados na catraca
              </span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-card border border-border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Vencendo em 7 dias</span>
              <span className="text-2xl font-bold font-display text-amber-500">
                {statsData?.expiringSoon ?? 0}
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Alerta para renovação
              </span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-card border border-border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Receita Estimada (MRR)</span>
              <span className="text-2xl font-bold font-display text-foreground">
                {formatBRL(statsData?.estimatedMRR ?? 0)}
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Matrículas ativas no mês
              </span>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO ENTRE ABAS */}
        <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-border/60 pb-3">
          <button
            onClick={() => setActiveTab('enrollments')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'enrollments'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
            }`}
          >
            <Users className="w-4 h-4" /> Alunos & Matrículas ({enrollmentsData?.total ?? 0})
          </button>

          <button
            onClick={() => setActiveTab('turnstile')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'turnstile'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
            }`}
          >
            <QrCode className="w-4 h-4" /> Catraca Digital & Leitor QR
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'plans'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
            }`}
          >
            <Dumbbell className="w-4 h-4" /> Planos de Matrícula ({plansData?.length ?? 0})
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
            }`}
          >
            <History className="w-4 h-4" /> Histórico de Acessos
          </button>
        </div>

        {/* ========================================================================= */}
        {/* ABA 1: MATRÍCULAS & ALUNOS */}
        {/* ========================================================================= */}
        {activeTab === 'enrollments' && (
          <div className="space-y-6">
            {/* Barra de Filtros */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-3xl border border-border shadow-sm">
              <div className="relative flex-1 w-full sm:w-auto">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar aluno por nome, CPF, email ou código QR..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 rounded-2xl text-xs sm:text-sm bg-muted/40"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                {(
                  [
                    { label: 'Todos', value: '' },
                    { label: 'Ativos', value: 'ACTIVE' },
                    { label: 'Vencidos', value: 'EXPIRED' },
                    { label: 'Suspensos', value: 'SUSPENDED' },
                    { label: 'Cancelados', value: 'CANCELLED' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.label}
                    onClick={() => setStatusFilter(f.value as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all ${
                      statusFilter === f.value
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabela de Matrículas */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Aluno</TableHead>
                    <TableHead>Plano Contratado</TableHead>
                    <TableHead>Validade & Dias</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingEnrollments ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Carregando alunos matriculados...
                      </TableCell>
                    </TableRow>
                  ) : !enrollmentsData?.items || enrollmentsData.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p className="font-semibold text-foreground">Nenhuma matrícula encontrada.</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cadastre uma nova matrícula manual ou divulgue seus planos para matrícula online!
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    enrollmentsData.items.map((e) => {
                      const isExpired = e.status === 'EXPIRED' || e.daysRemaining === 0;
                      return (
                        <TableRow key={e.id} className="hover:bg-muted/20">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                                {e.student?.avatarUrl ? (
                                  <img src={e.student.avatarUrl} alt={e.student.name} className="w-full h-full object-cover" />
                                ) : (
                                  e.student?.name?.[0]?.toUpperCase() || 'A'
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-foreground text-sm block">
                                  {e.student?.name || 'Aluno Balcão'}
                                </span>
                                <span className="text-xs text-muted-foreground block truncate max-w-[180px]">
                                  {e.student?.email}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="font-semibold text-xs text-foreground block">
                              {e.planName}
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {e.qrAccessCode}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="text-xs">
                              <span className="text-foreground font-medium block">
                                Até {new Date(e.endDate).toLocaleDateString('pt-BR')}
                              </span>
                              {!isExpired && e.daysRemaining !== undefined && (
                                <span className={`text-[11px] font-semibold ${e.isExpiringSoon ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`}>
                                  {e.daysRemaining} dias restantes
                                </span>
                              )}
                              {isExpired && (
                                <span className="text-[11px] font-semibold text-destructive">
                                  Expirado
                                </span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="text-sm font-bold text-foreground">
                              {formatBRL(Number(e.amountPaid))}
                            </span>
                            <span className="text-[10px] text-muted-foreground block uppercase">
                              {e.paymentMethod}
                            </span>
                          </TableCell>

                          <TableCell>
                            {e.status === 'ACTIVE' && !isExpired ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" /> Ativa
                              </span>
                            ) : e.status === 'SUSPENDED' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                <Pause className="w-3 h-3" /> Suspensa
                              </span>
                            ) : isExpired ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">
                                <AlertCircle className="w-3 h-3" /> Vencida
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground">
                                {e.status}
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-2xl w-48">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setRenewModalEnrollment(e);
                                    setRenewForm({
                                      additionalDays: 30,
                                      amountPaid: Number(e.amountPaid || 99.9),
                                    });
                                  }}
                                  className="gap-2 cursor-pointer font-semibold text-primary"
                                >
                                  <RefreshCw className="w-4 h-4" /> Renovar Matrícula
                                </DropdownMenuItem>

                                {e.status === 'ACTIVE' ? (
                                  <DropdownMenuItem
                                    onClick={() => updateStatusMutation.mutate({ id: e.id, status: 'SUSPENDED' })}
                                    className="gap-2 cursor-pointer text-amber-500"
                                  >
                                    <Pause className="w-4 h-4" /> Suspender Acesso
                                  </DropdownMenuItem>
                                ) : e.status === 'SUSPENDED' ? (
                                  <DropdownMenuItem
                                    onClick={() => updateStatusMutation.mutate({ id: e.id, status: 'ACTIVE' })}
                                    className="gap-2 cursor-pointer text-emerald-500"
                                  >
                                    <Play className="w-4 h-4" /> Reativar Acesso
                                  </DropdownMenuItem>
                                ) : null}

                                <DropdownMenuItem
                                  onClick={() => updateStatusMutation.mutate({ id: e.id, status: 'CANCELLED' })}
                                  className="gap-2 cursor-pointer text-destructive"
                                >
                                  <XCircle className="w-4 h-4" /> Cancelar Matrícula
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: CATRACA DIGITAL & LEITOR DE QR CODE */}
        {/* ========================================================================= */}
        {activeTab === 'turnstile' && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Validador / Leitor */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-foreground">
                        Validador de Entrada (Catraca Digital)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Aponte a câmera para o QR Code do aluno ou digite o código/CPF para liberação instantânea.
                      </p>
                    </div>
                  </div>

                  <Button
                    variant={isCameraActive ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={isCameraActive ? stopCamera : startCamera}
                    className="gap-1.5 rounded-xl text-xs"
                  >
                    {isCameraActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                    {isCameraActive ? 'Desativar Câmera' : 'Ativar Câmera'}
                  </Button>
                </div>

                {/* Área de Visualização da Câmera */}
                {isCameraActive && (
                  <div className="relative rounded-3xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-primary/50 shadow-inner">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                    <div className="absolute inset-0 border-2 border-dashed border-primary/70 pointer-events-none m-12 rounded-3xl flex items-center justify-center">
                      <div className="w-full h-0.5 bg-primary/90 animate-pulse" />
                    </div>
                    <span className="absolute bottom-3 px-3 py-1 rounded-full bg-black/70 text-white text-xs backdrop-blur-sm">
                      Posicione o QR Code do aluno no centro
                    </span>
                  </div>
                )}

                {/* Entrada Manual de Código / CPF */}
                <form onSubmit={handleManualScanSubmit} className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Digitação Rápida (Código QR, CPF ou E-mail)
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <QrCode className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Ex: CF-ACAD-ABC12345 ou 123.456.789-00..."
                        value={manualCodeInput}
                        onChange={(e) => setManualCodeInput(e.target.value)}
                        className="pl-10 h-12 rounded-2xl text-sm bg-muted/40 font-mono"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="hero"
                      disabled={validateAccessMutation.isPending}
                      className="h-12 px-6 rounded-2xl font-bold gap-2"
                    >
                      {validateAccessMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Liberar Entrada
                    </Button>
                  </div>
                </form>

                {/* Painel de Resposta da Última Leitura */}
                {lastScanResult && (
                  <div
                    className={`p-6 rounded-3xl border-2 transition-all shadow-md animate-in fade-in zoom-in-95 ${
                      lastScanResult.granted
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500'
                        : lastScanResult.canChargeDayPass
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                        : 'bg-destructive/10 border-destructive/40 text-destructive'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-lg shrink-0 ${
                            lastScanResult.granted
                              ? 'bg-emerald-500'
                              : lastScanResult.canChargeDayPass
                              ? 'bg-gradient-to-br from-emerald-500 to-amber-500'
                              : 'bg-destructive'
                          }`}
                        >
                          {lastScanResult.granted ? (
                            <CheckCircle2 className="w-8 h-8" />
                          ) : lastScanResult.canChargeDayPass ? (
                            <Zap className="w-8 h-8 fill-current" />
                          ) : (
                            <XCircle className="w-8 h-8" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider block">
                              {lastScanResult.granted
                                ? lastScanResult.isDayPass
                                  ? 'DAY PASS FINEX LIBERADO'
                                  : 'ACESSO LIBERADO'
                                : lastScanResult.canChargeDayPass
                                ? 'ALUNO FINEX • TREINO AVULSO'
                                : 'ACESSO RECUSADO'}
                            </span>
                          </div>
                          <h4 className="font-display font-bold text-xl text-foreground">
                            {lastScanResult.student?.name || 'Aluno Não Reconhecido'}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {lastScanResult.granted
                              ? `Plano: ${lastScanResult.enrollment?.planName} • ${lastScanResult.enrollment?.daysRemaining} dia(s) de acesso`
                              : lastScanResult.reason}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-mono text-muted-foreground bg-background/50 px-2.5 py-1 rounded-xl">
                        {new Date().toLocaleTimeString('pt-BR')}
                      </span>
                    </div>

                    {/* OFERECER COBRANÇA INSTANTÂNEA DE DAY PASS SE O ALUNO FOR FINEX E NÃO TIVER MATRÍCULA ATIVA */}
                    {lastScanResult.canChargeDayPass && lastScanResult.student && (
                      <div className="mt-5 pt-4 border-t border-amber-500/30 space-y-4">
                        <div className="p-4 rounded-2xl bg-card border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-muted-foreground">
                                Saldo na Carteira do Aluno:
                              </span>
                              <span className="text-sm font-bold text-emerald-500 flex items-center gap-1">
                                <Wallet className="w-3.5 h-3.5" />
                                {formatBRL(lastScanResult.studentBalance ?? 0)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-muted-foreground">
                                Valor do Day Pass:
                              </span>
                              <span className="text-base font-bold text-foreground">
                                {formatBRL(
                                  dayPassCustomAmount ||
                                    lastScanResult.dayPassPrice ||
                                    dayPassPriceData?.dayPassPrice ||
                                    25.0,
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {lastScanResult.hasEnoughBalance !== false ? (
                              <Button
                                variant="hero"
                                size="lg"
                                onClick={() =>
                                  chargeDayPassMutation.mutate({
                                    studentIdentifier: lastScanResult.student!.id,
                                    customAmount: dayPassCustomAmount ? Number(dayPassCustomAmount) : undefined,
                                  })
                                }
                                disabled={chargeDayPassMutation.isPending}
                                className="rounded-2xl gap-2 font-bold px-6 shadow-glow-blue bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                {chargeDayPassMutation.isPending ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Zap className="w-4 h-4 fill-current" />
                                )}
                                Debitar da Carteira & Liberar Entrada
                              </Button>
                            ) : (
                              <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                                <strong>Saldo insuficiente na carteira:</strong> Aluno possui{' '}
                                {formatBRL(lastScanResult.studentBalance ?? 0)}. Peça para ele adicionar saldo no app.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Feed Lateral de Entradas Recentes Hoje */}
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    <h4 className="font-display font-bold text-sm text-foreground">Entradas Hoje</h4>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                    {statsData?.checkinsToday ?? 0} acessos
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {loadingLogs ? (
                    <p className="text-xs text-muted-foreground text-center py-6">Carregando acessos...</p>
                  ) : !accessLogs || accessLogs.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">Nenhum acesso registrado hoje.</p>
                  ) : (
                    accessLogs.slice(0, 10).map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                          log.status === 'GRANTED'
                            ? 'bg-muted/30 border-border/60'
                            : 'bg-destructive/5 border-destructive/20'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              log.status === 'GRANTED' ? 'bg-emerald-500' : 'bg-destructive'
                            }`}
                          />
                          <div className="truncate">
                            <span className="font-bold text-foreground block truncate">
                              {log.student?.name || 'Tentativa Avulsa'}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                              {log.status === 'GRANTED' ? 'Entrada Autorizada' : log.denialReason}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                          {new Date(log.accessedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 3: PLANOS DE MATRÍCULA DA ACADEMIA */}
        {/* ========================================================================= */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">
                  Planos Oferecidos para Alunos
                </h3>
                <p className="text-xs text-muted-foreground">
                  Configure os planos de matrícula que ficam disponíveis online no perfil da sua academia.
                </p>
              </div>

              <Button
                variant="hero"
                onClick={() => {
                  setEditingPlan(null);
                  setPlanForm({
                    name: '',
                    description: '',
                    price: 99.9,
                    durationDays: 30,
                    modalities: 'Musculação, Cardio',
                    benefits: 'Acesso Livre, Vestiários, Avaliação Física',
                  });
                  setNewPlanModalOpen(true);
                }}
                className="gap-2 rounded-xl"
              >
                <Plus className="w-4 h-4" /> Criar Novo Plano
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingPlans ? (
                <p className="text-xs text-muted-foreground col-span-full py-12 text-center">
                  Carregando planos da academia...
                </p>
              ) : !plansData || plansData.length === 0 ? (
                <div className="col-span-full p-12 text-center bg-card border border-dashed border-border rounded-3xl space-y-3">
                  <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                  <h4 className="font-bold text-foreground">Nenhum plano cadastrado</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Crie planos como Mensal, Trimestral ou Anual para que os alunos possam se matricular pelo app!
                  </p>
                  <Button
                    variant="hero"
                    onClick={() => setNewPlanModalOpen(true)}
                    className="rounded-xl"
                  >
                    Criar Primeiro Plano
                  </Button>
                </div>
              ) : (
                plansData.map((p) => (
                  <div
                    key={p.id}
                    className={`p-6 rounded-3xl border transition-all space-y-4 bg-card shadow-sm ${
                      p.isActive ? 'border-border hover:border-primary/40' : 'border-border/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                          {p.durationDays} dias
                        </span>
                        <h4 className="font-display font-bold text-xl text-foreground mt-0.5">
                          {p.name}
                        </h4>
                      </div>
                      <span className="text-xl font-bold text-foreground">
                        {formatBRL(Number(p.price))}
                      </span>
                    </div>

                    {p.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {p.description}
                      </p>
                    )}

                    {p.benefits && p.benefits.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-border/40">
                        {p.benefits.map((b, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">{b}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPlan(p);
                          setPlanForm({
                            name: p.name,
                            description: p.description || '',
                            price: Number(p.price),
                            durationDays: p.durationDays,
                            modalities: p.modalities?.join(', ') || '',
                            benefits: p.benefits?.join(', ') || '',
                          });
                          setNewPlanModalOpen(true);
                        }}
                        className="rounded-xl text-xs"
                      >
                        Editar
                      </Button>

                      {p.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePlanMutation.mutate(p.id)}
                          className="rounded-xl text-xs text-destructive hover:bg-destructive/10"
                        >
                          Desativar
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 4: HISTÓRICO COMPLETO DE ACESSOS */}
        {/* ========================================================================= */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Status</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Dispositivo / Catraca</TableHead>
                    <TableHead>Data & Horário</TableHead>
                    <TableHead>Diagnóstico</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingLogs ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        Carregando histórico...
                      </TableCell>
                    </TableRow>
                  ) : !accessLogs || accessLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        Nenhum registro de acesso encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    accessLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/20">
                        <TableCell>
                          {log.status === 'GRANTED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Liberado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">
                              <XCircle className="w-3.5 h-3.5" /> Recusado
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <span className="font-bold text-xs text-foreground block">
                            {log.student?.name || 'Tentativa não identificada'}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="text-xs text-muted-foreground">{log.deviceInfo}</span>
                        </TableCell>

                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.accessedAt).toLocaleString('pt-BR')}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {log.status === 'GRANTED' ? 'Validação bem-sucedida' : log.denialReason}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: CRIAR / EDITAR PLANO */}
      <Dialog open={newPlanModalOpen} onOpenChange={setNewPlanModalOpen}>
        <DialogContent className="max-w-md bg-card rounded-3xl border-border p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              {editingPlan ? 'Editar Plano de Matrícula' : 'Criar Novo Plano de Matrícula'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Defina os dados, valor e benefícios inclusos para os alunos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Nome do Plano *</Label>
              <Input
                placeholder="Ex: Plano Mensal Livre, Plano Anual VIP"
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                className="rounded-xl mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Preço (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="99.90"
                  value={planForm.price}
                  onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                  className="rounded-xl mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Duração em Dias *</Label>
                <Input
                  type="number"
                  placeholder="30"
                  value={planForm.durationDays}
                  onChange={(e) => setPlanForm({ ...planForm, durationDays: Number(e.target.value) })}
                  className="rounded-xl mt-1 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Descrição do Plano</Label>
              <Input
                placeholder="Ex: Acesso total à área de musculação e esteiras"
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                className="rounded-xl mt-1 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Benefícios (separados por vírgula)</Label>
              <Input
                placeholder="Ex: Acesso livre, Vestiários, Avaliação física"
                value={planForm.benefits}
                onChange={(e) => setPlanForm({ ...planForm, benefits: e.target.value })}
                className="rounded-xl mt-1 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
              <Button variant="ghost" onClick={() => setNewPlanModalOpen(false)} className="rounded-xl text-xs">
                Cancelar
              </Button>
              <Button
                variant="hero"
                onClick={() => savePlanMutation.mutate()}
                disabled={savePlanMutation.isPending || !planForm.name.trim()}
                className="rounded-xl text-xs"
              >
                {savePlanMutation.isPending ? 'Salvando...' : 'Salvar Plano'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: NOVA MATRÍCULA NO BALCÃO */}
      <Dialog open={manualEnrollmentOpen} onOpenChange={setManualEnrollmentOpen}>
        <DialogContent className="max-w-md bg-card rounded-3xl border-border p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              Nova Matrícula no Balcão
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre o aluno e gere o QR Code de acesso instantaneamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Nome Completo do Aluno *</Label>
              <Input
                placeholder="Ex: Lucas Ferreira"
                value={manualForm.studentName}
                onChange={(e) => setManualForm({ ...manualForm, studentName: e.target.value })}
                className="rounded-xl mt-1 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">E-mail do Aluno *</Label>
              <Input
                placeholder="Ex: aluno@email.com"
                value={manualForm.studentEmail}
                onChange={(e) => setManualForm({ ...manualForm, studentEmail: e.target.value })}
                className="rounded-xl mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">CPF (Opcional)</Label>
                <Input
                  placeholder="000.000.000-00"
                  value={manualForm.studentCpf}
                  onChange={(e) => setManualForm({ ...manualForm, studentCpf: e.target.value })}
                  className="rounded-xl mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Duração (Dias) *</Label>
                <Input
                  type="number"
                  value={manualForm.durationDays}
                  onChange={(e) => setManualForm({ ...manualForm, durationDays: Number(e.target.value) })}
                  className="rounded-xl mt-1 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Nome do Plano *</Label>
                <Input
                  value={manualForm.planName}
                  onChange={(e) => setManualForm({ ...manualForm, planName: e.target.value })}
                  className="rounded-xl mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Valor Cobrado (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={manualForm.amountPaid}
                  onChange={(e) => setManualForm({ ...manualForm, amountPaid: Number(e.target.value) })}
                  className="rounded-xl mt-1 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
              <Button variant="ghost" onClick={() => setManualEnrollmentOpen(false)} className="rounded-xl text-xs">
                Cancelar
              </Button>
              <Button
                variant="hero"
                onClick={() => manualEnrollMutation.mutate()}
                disabled={manualEnrollMutation.isPending || !manualForm.studentName.trim() || !manualForm.studentEmail.trim()}
                className="rounded-xl text-xs"
              >
                {manualEnrollMutation.isPending ? 'Cadastrando...' : 'Cadastrar e Liberar Acesso'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: RENOVAÇÃO DE MATRÍCULA */}
      <Dialog open={!!renewModalEnrollment} onOpenChange={(o) => !o && setRenewModalEnrollment(null)}>
        <DialogContent className="max-w-sm bg-card rounded-3xl border-border p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              Renovar Matrícula
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Aluno: <strong>{renewModalEnrollment?.student?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Dias Adicionais *</Label>
              <Input
                type="number"
                value={renewForm.additionalDays}
                onChange={(e) => setRenewForm({ ...renewForm, additionalDays: Number(e.target.value) })}
                className="rounded-xl mt-1 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Valor da Renovação (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                value={renewForm.amountPaid}
                onChange={(e) => setRenewForm({ ...renewForm, amountPaid: Number(e.target.value) })}
                className="rounded-xl mt-1 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
              <Button variant="ghost" onClick={() => setRenewModalEnrollment(null)} className="rounded-xl text-xs">
                Cancelar
              </Button>
              <Button
                variant="hero"
                onClick={() => renewMutation.mutate()}
                disabled={renewMutation.isPending}
                className="rounded-xl text-xs"
              >
                {renewMutation.isPending ? 'Renovando...' : 'Confirmar Renovação'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
