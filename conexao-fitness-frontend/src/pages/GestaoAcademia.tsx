import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
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
  DialogFooter,
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
  lookupFinexStudent,
  EnrollmentStatus,
  GymEnrollment,
  MembershipPlan,
  ValidateAccessResponse,
} from '@/services/memberships';
import { getMyAcademiaProfile, updateMyAcademiaProfile } from '@/services/users';
import { compressImage } from '@/services/uploads';
import { resolveMediaUrl } from '@/lib/mediaUrl';
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
  SwitchCamera,
  ScanLine,
  Building2,
  ImageIcon,
  MapPin,
  Phone,
  MessageCircle,
  Save,
  Eye,
  Trash2,
  Upload,
  UserPlus,
  BellRing,
  X,
  Check,
  Mail,
} from 'lucide-react';

export default function GestaoAcademia() {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'enrollments' | 'turnstile' | 'plans' | 'logs' | 'profile'>('enrollments');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | ''>('');
  const [logsSearchTerm, setLogsSearchTerm] = useState('');
  const [logsStatusFilter, setLogsStatusFilter] = useState<'ALL' | 'GRANTED' | 'DENIED'>('ALL');

  // Modais
  const [newPlanModalOpen, setNewPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [manualEnrollmentOpen, setManualEnrollmentOpen] = useState(false);
  const [renewModalEnrollment, setRenewModalEnrollment] = useState<GymEnrollment | null>(null);

  // Estados de Formulários de Planos
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: '99.90' as string | number,
    durationDays: '30' as string | number,
    modalities: 'Musculação, Cardio',
    benefits: 'Acesso Livre, Vestiários, Avaliação Física',
  });

  // Estados de Matrícula Manual, Busca por CPF Finex e Foto
  const [manualForm, setManualForm] = useState<{
    studentId: string;
    studentName: string;
    studentEmail: string;
    studentCpf: string;
    studentPhone: string;
    studentPhotoUrl: string;
    planId: string;
    planName: string;
    amountPaid: string | number;
    durationDays: number;
    notes: string;
    notifyStudent: boolean;
  }>({
    studentId: '',
    studentName: '',
    studentEmail: '',
    studentCpf: '',
    studentPhone: '',
    studentPhotoUrl: '',
    planId: '',
    planName: 'Plano Mensal Balcão',
    amountPaid: '99.90',
    durationDays: 30,
    notes: '',
    notifyStudent: true,
  });

  const [enrolledSuccessData, setEnrolledSuccessData] = useState<{
    enrollment: GymEnrollment;
    studentPhone?: string;
  } | null>(null);

  const [foundStudent, setFoundStudent] = useState<{
    id: string;
    name: string;
    email: string;
    cpf?: string;
    phone?: string;
    avatarUrl?: string;
  } | null>(null);
  const [isSearchingCpf, setIsSearchingCpf] = useState(false);

  // Câmera para captura de foto presencial do aluno
  const [isPhotoCameraOpen, setIsPhotoCameraOpen] = useState(false);
  const photoVideoRef = useRef<HTMLVideoElement | null>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const photoStreamRef = useRef<MediaStream | null>(null);

  // Estados de Renovação
  const [renewForm, setRenewForm] = useState({
    additionalDays: 30,
    amountPaid: 99.9,
  });

  // Estados da Catraca / Scanner
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanSuccessPulse, setScanSuccessPulse] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ValidateAccessResponse | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ code: string; timestamp: number }>({ code: '', timestamp: 0 });

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
    queryFn: () => getGymAccessLogs(60),
    enabled: !!user && isGym,
    refetchInterval: 4000,
  });

  const filteredAccessLogs = (accessLogs || []).filter((log) => {
    if (logsStatusFilter === 'GRANTED' && log.status !== 'GRANTED') return false;
    if (logsStatusFilter === 'DENIED' && log.status !== 'DENIED') return false;

    if (logsSearchTerm.trim()) {
      const q = logsSearchTerm.toLowerCase().trim();
      const name = log.student?.name?.toLowerCase() || '';
      const email = log.student?.email?.toLowerCase() || '';
      const cpf = log.student?.cpf?.replace(/\D/g, '') || '';
      const qDigits = q.replace(/\D/g, '');
      const plan = log.enrollment?.planName?.toLowerCase() || '';
      const reason = log.denialReason?.toLowerCase() || '';
      const device = log.deviceInfo?.toLowerCase() || '';

      const matchName = name.includes(q);
      const matchEmail = email.includes(q);
      const matchCpf = qDigits ? cpf.includes(qDigits) : false;
      const matchPlan = plan.includes(q);
      const matchReason = reason.includes(q);
      const matchDevice = device.includes(q);

      return matchName || matchEmail || matchCpf || matchPlan || matchReason || matchDevice;
    }
    return true;
  });

  const { data: dayPassPriceData } = useQuery({
    queryKey: ['gym-daypass-price', user?.id],
    queryFn: getMyGymDayPassPrice,
    enabled: !!user && isGym,
  });

  const [dayPassCustomAmount, setDayPassCustomAmount] = useState<number | ''>('');

  // Perfil da Academia (Customização Completa)
  const { data: gymProfileData, isLoading: loadingGymProfile } = useQuery({
    queryKey: ['my-gym-profile', user?.id],
    queryFn: getMyAcademiaProfile,
    enabled: !!user && isGym,
  });

  const [profileForm, setProfileForm] = useState({
    nomeFantasia: '',
    razaoSocial: '',
    cnpj: '',
    bio: '',
    avatarUrl: '',
    coverUrl: '',
    address: '',
    city: '',
    state: 'RS',
    zipCode: '',
    phone: '',
    whatsapp: '',
    instagram: '',
    website: '',
    monday_friday: '06:00 às 23:00',
    saturday: '08:00 às 18:00',
    sunday_holidays: '09:00 às 14:00',
    facilities: [] as string[],
    modalities: [] as string[],
    galleryUrls: [] as string[],
    dayPassPrice: 25.0,
  });
  const [newFacilityInput, setNewFacilityInput] = useState('');
  const [newModalityInput, setNewModalityInput] = useState('');
  const [newGalleryInput, setNewGalleryInput] = useState('');

  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handlePickLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem válido');
      return;
    }
    try {
      const dataUrl = await compressImage(file, 450, 450, 0.82);
      setProfileForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
      toast.success('Logo selecionado com sucesso!');
    } catch {
      toast.error('Não foi possível processar a imagem');
    }
    e.target.value = '';
  };

  const handlePickCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem válido');
      return;
    }
    try {
      const dataUrl = await compressImage(file, 1200, 600, 0.82);
      setProfileForm((prev) => ({ ...prev, coverUrl: dataUrl }));
      toast.success('Imagem de capa selecionada com sucesso!');
    } catch {
      toast.error('Não foi possível processar a imagem de capa');
    }
    e.target.value = '';
  };

  useEffect(() => {
    if (gymProfileData) {
      setProfileForm({
        nomeFantasia: gymProfileData.nomeFantasia || gymProfileData.name || '',
        razaoSocial: gymProfileData.razaoSocial || gymProfileData.name || '',
        cnpj: gymProfileData.cnpj || '',
        bio: gymProfileData.bio || '',
        avatarUrl: gymProfileData.avatarUrl || '',
        coverUrl: gymProfileData.coverUrl || '',
        address: gymProfileData.address || '',
        city: gymProfileData.city || 'Uruguaiana',
        state: gymProfileData.state || 'RS',
        zipCode: gymProfileData.zipCode || '',
        phone: gymProfileData.phone || '',
        whatsapp: gymProfileData.whatsapp || gymProfileData.phone || '',
        instagram: gymProfileData.instagram || '',
        website: gymProfileData.website || '',
        monday_friday: gymProfileData.openingHours?.monday_friday || '06:00 às 23:00',
        saturday: gymProfileData.openingHours?.saturday || '08:00 às 18:00',
        sunday_holidays: gymProfileData.openingHours?.sunday_holidays || '09:00 às 14:00',
        facilities:
          gymProfileData.facilities && gymProfileData.facilities.length > 0
            ? gymProfileData.facilities
            : [
                'Musculação Completa',
                'Área Cardio Climatizada',
                'Vestiários com Chuveiro',
                'Wi-Fi Gratuito',
                'Estacionamento',
              ],
        modalities:
          gymProfileData.modalities && gymProfileData.modalities.length > 0
            ? gymProfileData.modalities
            : ['Musculação', 'Spinning', 'Cross Training', 'Pilates'],
        galleryUrls: gymProfileData.galleryUrls || [],
        dayPassPrice: gymProfileData.dayPassPrice ? Number(gymProfileData.dayPassPrice) : 25.0,
      });
    }
  }, [gymProfileData]);

  const updateProfileMutation = useMutation({
    mutationFn: () =>
      updateMyAcademiaProfile({
        nomeFantasia: profileForm.nomeFantasia,
        razaoSocial: profileForm.razaoSocial,
        cnpj: profileForm.cnpj,
        bio: profileForm.bio,
        avatarUrl: profileForm.avatarUrl,
        coverUrl: profileForm.coverUrl,
        address: profileForm.address,
        city: profileForm.city,
        state: profileForm.state,
        zipCode: profileForm.zipCode,
        phone: profileForm.phone,
        whatsapp: profileForm.whatsapp,
        instagram: profileForm.instagram,
        website: profileForm.website,
        openingHours: {
          monday_friday: profileForm.monday_friday,
          saturday: profileForm.saturday,
          sunday_holidays: profileForm.sunday_holidays,
        },
        facilities: profileForm.facilities,
        modalities: profileForm.modalities,
        galleryUrls: profileForm.galleryUrls,
        dayPassPrice: Number(profileForm.dayPassPrice),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-gym-profile'] });
      qc.invalidateQueries({ queryKey: ['public-user-profile'] });
      qc.invalidateQueries({ queryKey: ['gym-daypass-price'] });
      toast.success('Perfil público da academia atualizado com sucesso!', {
        description: 'Os alunos já podem visualizar as informações atualizadas.',
      });
    },
    onError: (err: any) => {
      toast.error('Erro ao salvar perfil da academia', { description: err.message });
    },
  });

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
    mutationFn: async () => {
      const modalities = planForm.modalities.split(',').map((m) => m.trim()).filter(Boolean);
      const benefits = planForm.benefits.split(',').map((b) => b.trim()).filter(Boolean);
      const parsedPrice = typeof planForm.price === 'string'
        ? parseFloat(planForm.price.replace(',', '.'))
        : Number(planForm.price);
      const safePrice = isNaN(parsedPrice) ? 99.9 : parsedPrice;
      const parsedDays = Number(planForm.durationDays);
      const safeDays = isNaN(parsedDays) || parsedDays <= 0 ? 30 : parsedDays;

      if (editingPlan) {
        return await updateGymPlan(editingPlan.id, {
          name: planForm.name,
          description: planForm.description,
          price: safePrice,
          durationDays: safeDays,
          modalities,
          benefits,
        });
      }
      return await createGymPlan({
        name: planForm.name,
        description: planForm.description,
        price: safePrice,
        durationDays: safeDays,
        modalities,
        benefits,
      });
    },
    onSuccess: (savedPlan) => {
      if (savedPlan) {
        qc.setQueryData(['gym-my-plans', user?.id], (old: any) => {
          const list = Array.isArray(old) ? [...old] : [];
          if (editingPlan) {
            return list.map((p: any) => (p.id === editingPlan.id ? savedPlan : p));
          }
          const exists = list.some((p: any) => p.id === savedPlan.id);
          return exists ? list : [savedPlan, ...list];
        });
      }
      qc.invalidateQueries({ queryKey: ['gym-my-plans'] });
      toast.success(editingPlan ? 'Plano atualizado com sucesso!' : 'Novo plano de matrícula criado!');
      setNewPlanModalOpen(false);
      setEditingPlan(null);
    },
    onError: (err: Error) => {
      toast.error('Erro ao salvar plano', { description: err.message });
    },
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

  // Funções para Captura de Foto do Aluno Presencial
  const startPhotoCamera = async () => {
    try {
      setIsPhotoCameraOpen(true);
      await new Promise((r) => setTimeout(r, 150));
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      photoStreamRef.current = stream;
      if (photoVideoRef.current) {
        photoVideoRef.current.srcObject = stream;
      }
    } catch (e: any) {
      toast.error('Não foi possível acessar a câmera para foto.', { description: e.message });
      setIsPhotoCameraOpen(false);
    }
  };

  const stopPhotoCamera = () => {
    if (photoStreamRef.current) {
      photoStreamRef.current.getTracks().forEach((track) => track.stop());
      photoStreamRef.current = null;
    }
    setIsPhotoCameraOpen(false);
  };

  const capturePhoto = () => {
    if (photoVideoRef.current && photoCanvasRef.current) {
      const video = photoVideoRef.current;
      const canvas = photoCanvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setManualForm((prev) => ({ ...prev, studentPhotoUrl: dataUrl }));
        toast.success('Foto do aluno capturada com sucesso!');
      }
    }
    stopPhotoCamera();
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A foto deve ter no máximo 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setManualForm((prev) => ({ ...prev, studentPhotoUrl: event.target?.result as string }));
        toast.success('Foto carregada com sucesso!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCpfLookup = async (cpfVal: string) => {
    const cleanNumbers = cpfVal.replace(/\D/g, '');
    if (cleanNumbers.length < 6) return;

    setIsSearchingCpf(true);
    try {
      const res = await lookupFinexStudent(cpfVal);
      if (res.found && res.student) {
        setFoundStudent(res.student);
        setManualForm((prev) => ({
          ...prev,
          studentCpf: cpfVal,
          studentName: res.student!.name,
          studentEmail: res.student!.email,
          studentPhone: (res.student as any)?.phone || prev.studentPhone,
          studentId: res.student!.id,
          studentPhotoUrl: res.student!.avatarUrl || prev.studentPhotoUrl,
        }));
        toast.success(`Aluno Finex localizado: ${res.student.name}`, {
          description: 'Dados preenchidos automaticamente. Notificação será enviada ao aluno.',
        });
      } else {
        setFoundStudent(null);
      }
    } catch (e) {
      setFoundStudent(null);
    } finally {
      setIsSearchingCpf(false);
    }
  };

  // Envio de comprovante e instruções de acesso via WhatsApp
  const handleSendWhatsApp = (enrollment: GymEnrollment, customPhone?: string) => {
    const studentName = enrollment.student?.name || 'Aluno(a)';
    const studentEmail = enrollment.student?.email || '';
    const planName = enrollment.planName || 'Plano da Academia';
    const endDate = enrollment.endDate
      ? new Date(enrollment.endDate).toLocaleDateString('pt-BR')
      : 'em 30 dias';
    const qrCode = enrollment.qrAccessCode || 'Disponível no app';
    const gymName = user?.name || 'Academia';

    // Link direto para cadastro com preenchimento automático
    const registerUrl = studentEmail
      ? `https://conexao-fitness-web.onrender.com/cadastro?email=${encodeURIComponent(studentEmail)}&name=${encodeURIComponent(studentName)}&redirect=/minhas-matriculas`
      : 'https://conexao-fitness-web.onrender.com/cadastro?redirect=/minhas-matriculas';

    const message = `Olá, *${studentName}*! 👋 Tudo bem?
Sua matrícula na academia *${gymName}* foi confirmada com sucesso! 🏋️‍♂️✨

📋 *Detalhes da sua Matrícula:*
• *Plano:* ${planName}
• *Validade:* até ${endDate}
• *Código de Acesso:* \`${qrCode}\`

📲 *Como acessar a academia pelo seu celular:*
1️⃣ Abra o aplicativo pelo link:
👉 ${registerUrl}
2️⃣ Cadastre sua senha pessoal utilizando este mesmo e-mail: *${studentEmail}*
3️⃣ Pronto! Na tela inicial, toque em *Catraca Digital / Meu QR Code* para liberar seu acesso.

💡 *Dica:* No navegador do celular (Chrome ou Safari), toque em *"Compartilhar"* ou nos 3 pontinhos e selecione *"Adicionar à Tela de Início"*. O app funcionará como um aplicativo oficial, abrindo seu QR Code instantaneamente na catraca!

Qualquer dúvida estamos à disposição na recepção. Bons treinos! 💪🚀`;

    const rawPhone = customPhone || enrollment.student?.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');

    let waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    if (cleanPhone) {
      const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
      waUrl = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(message)}`;
    }

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Mutação para Matrícula Manual
  const manualEnrollMutation = useMutation({
    mutationFn: () => {
      const rawPaid = String(manualForm.amountPaid ?? '').trim();
      const cleanPaid = rawPaid.includes(',')
        ? rawPaid.replace(/\./g, '').replace(',', '.')
        : rawPaid;
      const numPaid = parseFloat(cleanPaid);
      const safeAmount = isNaN(numPaid) || numPaid < 0 ? 99.9 : numPaid;

      return createManualEnrollment({
        studentId: manualForm.studentId || undefined,
        studentName: manualForm.studentName,
        studentEmail: manualForm.studentEmail,
        studentCpf: manualForm.studentCpf || undefined,
        studentPhone: manualForm.studentPhone || undefined,
        studentPhotoUrl: manualForm.studentPhotoUrl || undefined,
        planId: manualForm.planId || undefined,
        planName: manualForm.planName,
        amountPaid: safeAmount,
        durationDays: Number(manualForm.durationDays) || 30,
        notes: manualForm.notes || undefined,
        notifyStudent: manualForm.notifyStudent,
      });
    },
    onSuccess: (createdEnrollment: GymEnrollment) => {
      qc.invalidateQueries({ queryKey: ['gym-enrollments'] });
      qc.invalidateQueries({ queryKey: ['gym-dashboard-stats'] });
      qc.invalidateQueries({ queryKey: ['wallet-statement'] });
      toast.success('Matrícula cadastrada com sucesso!', {
        description: `QR Code gerado e notificação enviada para ${manualForm.studentName}.`,
      });
      stopPhotoCamera();
      setManualEnrollmentOpen(false);
      setFoundStudent(null);
      setEnrolledSuccessData({
        enrollment: createdEnrollment,
        studentPhone: manualForm.studentPhone,
      });
      setManualForm({
        studentId: '',
        studentName: '',
        studentEmail: '',
        studentCpf: '',
        studentPhone: '',
        studentPhotoUrl: '',
        planId: '',
        planName: 'Plano Mensal Balcão',
        amountPaid: '99.90',
        durationDays: 30,
        notes: '',
        notifyStudent: true,
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

  // Controle de Câmera e Scanner QR com Html5Qrcode
  const handleDetectedCode = useCallback((rawCode: string) => {
    const codeText = rawCode.trim();
    if (!codeText) return;

    const now = Date.now();
    const last = lastScannedRef.current;

    // Evitar leituras repetidas do mesmo código em menos de 3.5s
    if (codeText !== last.code || now - last.timestamp > 3500) {
      lastScannedRef.current = { code: codeText, timestamp: now };
      setScanSuccessPulse(true);
      setTimeout(() => setScanSuccessPulse(false), 1200);

      if (navigator.vibrate) {
        navigator.vibrate(120);
      }

      console.log('QR Code detectado pelo Html5Qrcode:', codeText);
      validateAccessMutation.mutate(codeText);
    }
  }, [validateAccessMutation]);

  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (e) {
        console.warn('Erro ao parar scanner:', e);
      }
      try {
        html5QrCodeRef.current.clear();
      } catch (e) {}
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCamera = async (targetFacingOrId?: string) => {
    try {
      setCameraError(null);
      setIsStartingCamera(true);

      // Limpar instância anterior se houver
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
        } catch (e) {}
        try {
          html5QrCodeRef.current.clear();
        } catch (e) {}
        html5QrCodeRef.current = null;
      }

      setIsCameraActive(true);

      // Aguardar renderização do container no DOM
      await new Promise((resolve) => setTimeout(resolve, 200));

      const readerEl = document.getElementById('cf-html5-qr-reader');
      if (!readerEl) {
        throw new Error('Elemento do leitor não encontrado no DOM.');
      }

      const scanner = new Html5Qrcode('cf-html5-qr-reader', { verbose: false });
      html5QrCodeRef.current = scanner;

      // Buscar câmeras disponíveis no dispositivo
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          setAvailableCameras(
            cameras.map((c, idx) => ({
              id: c.id,
              label: c.label || `Câmera ${idx + 1}`,
            }))
          );
          setHasMultipleCameras(cameras.length > 1);
        }
      } catch (e) {
        // ignore device listing error
      }

      const config = {
        fps: 20,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.75);
          return { width: Math.max(220, edge), height: Math.max(220, edge) };
        },
        aspectRatio: 1.777778,
      };

      const facing = targetFacingOrId || (facingMode === 'environment' ? { facingMode: 'environment' } : { facingMode: 'user' });

      try {
        await scanner.start(
          facing,
          config,
          (decodedText) => handleDetectedCode(decodedText),
          () => {} // frame non-detection callback
        );
      } catch (err1) {
        // Fallback: se o facingMode falhar, tenta listar e usar o primeiro ID de câmera
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          setSelectedCameraId(cameras[0].id);
          await scanner.start(
            cameras[0].id,
            config,
            (decodedText) => handleDetectedCode(decodedText),
            () => {}
          );
        } else {
          throw err1;
        }
      }

      toast.info('Leitor de QR Code ativado!', { description: 'Aponte a câmera para o QR Code do aluno.' });
    } catch (err: any) {
      console.error('Erro ao iniciar câmera:', err);
      setCameraError(err.message || 'Permissão negada ou câmera não encontrada.');
      setIsCameraActive(false);
      toast.error('Não foi possível acessar a câmera', {
        description: 'Permita o acesso à câmera no navegador ou use a digitação rápida abaixo.',
      });
    } finally {
      setIsStartingCamera(false);
    }
  };

  const toggleCameraFacingMode = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next === 'environment' ? 'environment' : 'user');
  };

  const handleImageUploadScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Criar elemento temporário se necessário
      const tempId = 'cf-temp-file-reader';
      let tempEl = document.getElementById(tempId);
      if (!tempEl) {
        tempEl = document.createElement('div');
        tempEl.id = tempId;
        tempEl.style.display = 'none';
        document.body.appendChild(tempEl);
      }

      const fileScanner = new Html5Qrcode(tempId, { verbose: false });
      const decodedText = await fileScanner.scanFile(file, true);
      fileScanner.clear();

      if (decodedText) {
        toast.success('QR Code lido da imagem!');
        handleDetectedCode(decodedText);
      }
    } catch (err: any) {
      toast.error('Não foi possível ler o QR Code da imagem', {
        description: 'Verifique se a imagem contém um QR Code nítido.',
      });
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop();
          }
        } catch (e) {}
        try {
          html5QrCodeRef.current.clear();
        } catch (e) {}
        html5QrCodeRef.current = null;
      }
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

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              asChild
              className="gap-2 rounded-xl shadow-sm border-purple-500/30 text-purple-400 hover:bg-purple-500/15"
            >
              <Link to="/totem-catraca">
                <QrCode className="w-4 h-4 text-purple-400" /> Modo Totem (Tela Cheia)
              </Link>
            </Button>
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
                  notifyStudent: true,
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
            <History className="w-4 h-4" /> Histórico de Acessos ({accessLogs?.length ?? 0})
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
            }`}
          >
            <Building2 className="w-4 h-4" /> 🎨 Perfil Público & Estrutura
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
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendWhatsApp(e)}
                                className="h-8 px-2.5 rounded-xl border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
                                title="Enviar dados de acesso via WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="hidden sm:inline text-xs font-semibold">WhatsApp</span>
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-2xl w-52">
                                  <DropdownMenuItem
                                    onClick={() => handleSendWhatsApp(e)}
                                    className="gap-2 cursor-pointer font-semibold text-emerald-600 dark:text-emerald-400"
                                  >
                                    <MessageCircle className="w-4 h-4" /> Enviar por WhatsApp
                                  </DropdownMenuItem>

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
                            </div>
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

                  <div className="flex items-center gap-2">
                    {/* Botão de Upload de Foto do QR Code como alternativa rápida */}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUploadScan}
                        className="hidden"
                      />
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border/80 transition-all shadow-sm">
                        <Camera className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ler de Imagem</span>
                      </span>
                    </label>

                    {isCameraActive && hasMultipleCameras && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleCameraFacingMode}
                        className="gap-1.5 rounded-xl text-xs"
                        title="Alternar Câmera"
                      >
                        <SwitchCamera className="w-4 h-4" />
                        <span className="hidden sm:inline">Trocar Câmera</span>
                      </Button>
                    )}

                    <Button
                      variant={isCameraActive ? 'destructive' : 'hero'}
                      size="sm"
                      onClick={isCameraActive ? stopCamera : () => startCamera()}
                      disabled={isStartingCamera}
                      className="gap-1.5 rounded-xl text-xs font-semibold"
                    >
                      {isStartingCamera ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : isCameraActive ? (
                        <CameraOff className="w-4 h-4" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                      {isStartingCamera
                        ? 'Iniciando...'
                        : isCameraActive
                        ? 'Desativar Câmera'
                        : 'Ativar Câmera'}
                    </Button>
                  </div>
                </div>

                {/* Área de Visualização da Câmera (Html5Qrcode) */}
                {isCameraActive ? (
                  <div
                    className={`relative rounded-3xl overflow-hidden bg-black min-h-[320px] max-h-[420px] w-full flex items-center justify-center border-2 transition-all shadow-inner ${
                      scanSuccessPulse
                        ? 'border-emerald-500 ring-4 ring-emerald-500/30'
                        : 'border-primary/50'
                    }`}
                  >
                    <div id="cf-html5-qr-reader" className="w-full h-full overflow-hidden rounded-3xl" />

                    {/* Status Badge */}
                    <div className="absolute top-4 left-4 z-20 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-black/75 text-emerald-400 backdrop-blur-md border border-emerald-500/30 shadow-md">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        {scanSuccessPulse ? '✅ QR Code Lido!' : 'Leitor Óptico Ativo'}
                      </span>
                    </div>
                  </div>
                ) : isStartingCamera ? (
                  <div className="p-12 rounded-3xl bg-muted/20 border border-dashed border-border text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
                    <p className="text-sm font-semibold text-foreground">Iniciando leitor de QR Code...</p>
                  </div>
                ) : cameraError ? (
                  <div className="p-6 rounded-3xl bg-destructive/10 border border-destructive/30 text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
                    <div>
                      <h4 className="font-bold text-foreground text-sm">Não foi possível iniciar a câmera</h4>
                      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">{cameraError}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startCamera()}
                      className="rounded-xl text-xs gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" /> Tentar Novamente
                    </Button>
                  </div>
                ) : null}

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
                    <div className="text-center py-8 space-y-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                        <History className="w-5 h-5 opacity-60" />
                      </div>
                      <p className="text-xs text-muted-foreground">Nenhum acesso registrado ainda.</p>
                      <p className="text-[10px] text-muted-foreground/70">Aponte a câmera para o QR Code do aluno ou digite o código/CPF abaixo.</p>
                    </div>
                  ) : (
                    accessLogs.slice(0, 15).map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 transition-all hover:bg-muted/40 ${
                          log.status === 'GRANTED'
                            ? 'bg-muted/30 border-border/60'
                            : 'bg-destructive/5 border-destructive/20'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-border">
                            {log.student?.avatarUrl ? (
                              <img
                                src={log.student.avatarUrl}
                                alt={log.student.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              log.student?.name?.[0]?.toUpperCase() || 'A'
                            )}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-foreground block truncate text-xs">
                              {log.student?.name || 'Não identificado'}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                                  log.status === 'GRANTED' ? 'bg-emerald-500' : 'bg-destructive'
                                }`}
                              />
                              <span className="text-[10px] text-muted-foreground truncate block">
                                {log.status === 'GRANTED'
                                  ? log.enrollment?.planName || 'Entrada Liberada'
                                  : log.denialReason || 'Acesso Recusado'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono font-medium text-foreground block">
                            {new Date(log.accessedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                              log.status === 'GRANTED'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-destructive/10 text-destructive'
                            }`}
                          >
                            {log.status === 'GRANTED' ? 'Liberado' : 'Recusado'}
                          </span>
                        </div>
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
          <div className="space-y-6">
            {/* Header com CTA de Atualização */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-3xl shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  <h2 className="font-display font-black text-xl text-foreground">
                    Histórico Completo de Passagens na Catraca
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Acompanhe todos os alunos, fotos, CPFs, planos e horários de quem acessou ou tentou acessar a catraca em tempo real.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  qc.invalidateQueries({ queryKey: ['gym-access-logs'] });
                  toast.success('Histórico de acessos atualizado!');
                }}
                className="rounded-xl font-bold gap-2 text-xs shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Atualizar Histórico
              </Button>
            </div>

            {/* Barra de Filtros e Busca */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-3xl border border-border shadow-sm">
              <div className="relative flex-1 w-full sm:w-auto">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar no histórico por nome do aluno, CPF, email ou plano..."
                  value={logsSearchTerm}
                  onChange={(e) => setLogsSearchTerm(e.target.value)}
                  className="pl-10 h-10 rounded-2xl text-xs sm:text-sm bg-muted/40"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                {(
                  [
                    { label: `Todos (${accessLogs?.length ?? 0})`, value: 'ALL' },
                    {
                      label: `Liberados (${accessLogs?.filter((l) => l.status === 'GRANTED').length ?? 0})`,
                      value: 'GRANTED',
                    },
                    {
                      label: `Recusados (${accessLogs?.filter((l) => l.status === 'DENIED').length ?? 0})`,
                      value: 'DENIED',
                    },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setLogsStatusFilter(f.value as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all ${
                      logsStatusFilter === f.value
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabela Rica de Perfis */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead>Perfil do Aluno</TableHead>
                    <TableHead>Plano / Acesso</TableHead>
                    <TableHead>Dispositivo / Catraca</TableHead>
                    <TableHead>Data & Horário</TableHead>
                    <TableHead>Diagnóstico</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingLogs ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                        Carregando histórico de passagens...
                      </TableCell>
                    </TableRow>
                  ) : !filteredAccessLogs || filteredAccessLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p className="font-semibold text-foreground">Nenhum registro de acesso encontrado.</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {logsSearchTerm
                            ? 'Nenhum resultado corresponde à sua pesquisa.'
                            : 'Aproxime o QR Code do aluno na câmera da aba "Catraca Digital" para registrar acessos.'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAccessLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/20 transition-colors">
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

                        {/* Perfil Completo do Aluno */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden border border-border">
                              {log.student?.avatarUrl ? (
                                <img
                                  src={log.student.avatarUrl}
                                  alt={log.student.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                log.student?.name?.[0]?.toUpperCase() || 'A'
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-sm text-foreground block truncate">
                                {log.student?.name || 'Não identificado / Desconhecido'}
                              </span>
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 text-[11px] text-muted-foreground">
                                {log.student?.cpf && (
                                  <span>
                                    CPF:{' '}
                                    <strong className="text-foreground/80 font-mono">
                                      {log.student.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                                    </strong>
                                  </span>
                                )}
                                {log.student?.email && (
                                  <span className="flex items-center gap-1 truncate">
                                    <Mail className="w-3 h-3 opacity-60 shrink-0" />
                                    {log.student.email}
                                  </span>
                                )}
                                {log.student?.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 opacity-60 shrink-0" />
                                    {log.student.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Plano / Tipo de Acesso */}
                        <TableCell>
                          {log.enrollment?.planName ? (
                            <div>
                              <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                {log.enrollment.planName}
                              </span>
                              {log.enrollment.qrAccessCode && (
                                <span className="block text-[10px] font-mono text-muted-foreground mt-0.5">
                                  Cod: {log.enrollment.qrAccessCode}
                                </span>
                              )}
                            </div>
                          ) : log.denialReason?.includes('Day Pass') || log.denialReason?.includes('Finex') ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              Day Pass Finex
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs text-muted-foreground bg-muted/60">
                              Acesso Avulso
                            </span>
                          )}
                        </TableCell>

                        {/* Catraca / Dispositivo */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <QrCode className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                            <span>{log.deviceInfo || 'Catraca Principal'}</span>
                          </div>
                        </TableCell>

                        {/* Data & Horário */}
                        <TableCell>
                          <div className="text-xs">
                            <span className="font-bold font-mono text-foreground block">
                              {new Date(log.accessedAt).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                            <span className="text-[11px] text-muted-foreground block">
                              {new Date(log.accessedAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </TableCell>

                        {/* Diagnóstico */}
                        <TableCell>
                          {log.status === 'GRANTED' ? (
                            <span className="text-xs font-medium text-emerald-500">
                              Validação bem-sucedida
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-destructive">
                              {log.denialReason || 'Acesso negado'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 5: PERFIL PÚBLICO & ESTRUTURA DA ACADEMIA */}
        {/* ========================================================================= */}
        {activeTab === 'profile' && (
          <div className="space-y-8 animate-fade-in">
            {/* Header com CTA de Visualização */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-3xl shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Personalização da Academia
                </span>
                <h2 className="font-display font-black text-2xl text-foreground">
                  Perfil Público Profissional
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                  Personalize como os alunos veem a sua academia no marketplace, incluindo fotos da estrutura, horários, comodidades, valor do Day Pass e modalidades.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-bold gap-2 text-xs"
                  asChild
                >
                  <Link to={`/perfil/${user?.id}`} target="_blank">
                    <Eye className="w-4 h-4 text-primary" /> Ver Como os Alunos Veem
                  </Link>
                </Button>

                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => updateProfileMutation.mutate()}
                  disabled={updateProfileMutation.isPending}
                  className="rounded-xl font-black gap-2 text-xs shadow-glow"
                >
                  <Save className="w-4 h-4" />
                  {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>

            {/* Formulário em Grid de 2 Colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Coluna 1: Identidade & Mídia */}
              <div className="space-y-6">
                {/* Card 1: Identidade e Marca */}
                <div className="bg-card border border-border p-6 rounded-3xl space-y-4 shadow-sm">
                  <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" /> Identidade & Dados Cadastrais
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-semibold">Nome Fantasia (Exibido aos alunos) *</Label>
                      <Input
                        value={profileForm.nomeFantasia}
                        onChange={(e) => setProfileForm({ ...profileForm, nomeFantasia: e.target.value })}
                        placeholder="Ex: Iron Gym Fitness"
                        className="rounded-xl mt-1 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold">Razão Social</Label>
                        <Input
                          value={profileForm.razaoSocial}
                          onChange={(e) => setProfileForm({ ...profileForm, razaoSocial: e.target.value })}
                          placeholder="Ex: Iron Academia Ltda"
                          className="rounded-xl mt-1 text-xs"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold">CNPJ</Label>
                        <Input
                          value={profileForm.cnpj}
                          onChange={(e) => setProfileForm({ ...profileForm, cnpj: e.target.value })}
                          placeholder="00.000.000/0001-00"
                          className="rounded-xl mt-1 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Apresentação / Sobre a Academia (Bio)</Label>
                      <textarea
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        placeholder="Conte sobre o espaço, equipamentos importados, metodologia, equipe de professores..."
                        rows={3}
                        className="w-full mt-1 p-3 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2: Fotos & Imagens (Avatar e Banner de Capa) */}
                <div className="bg-card border border-border p-6 rounded-3xl space-y-4 shadow-sm">
                  <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" /> Imagens da Marca
                  </h3>

                  <div className="space-y-5">
                    {/* Foto de Capa / Banner */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Foto de Capa / Banner</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => coverFileInputRef.current?.click()}
                          className="h-7 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary hover:text-white font-medium"
                        >
                          <Camera className="w-3.5 h-3.5" /> Escolher do Computador / Celular
                        </Button>
                      </div>
                      <input
                        ref={coverFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePickCover}
                      />
                      <Input
                        value={profileForm.coverUrl}
                        onChange={(e) => setProfileForm({ ...profileForm, coverUrl: e.target.value })}
                        placeholder="Cole uma URL de imagem ou escolha pelo botão acima..."
                        className="rounded-xl mt-1 text-xs"
                      />
                      {profileForm.coverUrl && (
                        <div className="mt-2 h-28 rounded-xl overflow-hidden border border-border relative">
                          <img
                            src={resolveMediaUrl(profileForm.coverUrl)}
                            alt="Preview Capa"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1400&auto=format&fit=crop";
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Logo / Foto de Perfil */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Logo / Foto de Perfil</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => logoFileInputRef.current?.click()}
                          className="h-7 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary hover:text-white font-medium"
                        >
                          <Camera className="w-3.5 h-3.5" /> Escolher Logo
                        </Button>
                      </div>
                      <input
                        ref={logoFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePickLogo}
                      />
                      <Input
                        value={profileForm.avatarUrl}
                        onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                        placeholder="Cole uma URL de imagem ou escolha pelo botão acima..."
                        className="rounded-xl mt-1 text-xs"
                      />
                      {profileForm.avatarUrl && (
                        <div className="mt-2 w-16 h-16 rounded-xl overflow-hidden border border-border">
                          <img
                            src={resolveMediaUrl(profileForm.avatarUrl)}
                            alt="Preview Logo"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=400&auto=format&fit=crop";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card 3: Preço do Day Pass Finex */}
                <div className="bg-gradient-to-br from-card via-card to-secondary/10 border-2 border-secondary/40 p-6 rounded-3xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-black text-base text-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4 text-secondary fill-secondary" /> Preço do Day Pass (Treino Avulso)
                    </h3>
                    <span className="text-[10px] font-bold bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full">
                      Débito Instantâneo Finex
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Valor cobrado automaticamente quando um aluno avulso escanear o QR Code na sua catraca ou adquirir pelo app.
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-[200px]">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                        R$
                      </span>
                      <Input
                        type="number"
                        step="0.50"
                        value={profileForm.dayPassPrice}
                        onChange={(e) => setProfileForm({ ...profileForm, dayPassPrice: Number(e.target.value) })}
                        className="pl-9 rounded-xl text-sm font-bold"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">por dia de treino avulso</span>
                  </div>
                </div>
              </div>

              {/* Coluna 2: Localização, Horários, Comodidades e Galeria */}
              <div className="space-y-6">
                {/* Card 4: Localização e Contato */}
                <div className="bg-card border border-border p-6 rounded-3xl space-y-4 shadow-sm">
                  <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> Localização & Atendimento
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-semibold">Endereço Completo (Rua, Número, Bairro)</Label>
                      <Input
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        placeholder="Ex: Av. Presidente Vargas, 1420 - Centro"
                        className="rounded-xl mt-1 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs font-semibold">Cidade</Label>
                        <Input
                          value={profileForm.city}
                          onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                          placeholder="Uruguaiana"
                          className="rounded-xl mt-1 text-xs"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold">Estado (UF)</Label>
                        <Input
                          value={profileForm.state}
                          onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                          placeholder="RS"
                          className="rounded-xl mt-1 text-xs"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold">CEP</Label>
                        <Input
                          value={profileForm.zipCode}
                          onChange={(e) => setProfileForm({ ...profileForm, zipCode: e.target.value })}
                          placeholder="97500-000"
                          className="rounded-xl mt-1 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <Label className="text-xs font-semibold">WhatsApp de Atendimento</Label>
                        <Input
                          value={profileForm.whatsapp}
                          onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                          placeholder="(55) 99999-9999"
                          className="rounded-xl mt-1 text-xs"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold">Instagram (@academia)</Label>
                        <Input
                          value={profileForm.instagram}
                          onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                          placeholder="@irongymfitness"
                          className="rounded-xl mt-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 5: Horários de Funcionamento */}
                <div className="bg-card border border-border p-6 rounded-3xl space-y-4 shadow-sm">
                  <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Horários de Funcionamento
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-[11px] font-semibold">Segunda a Sexta</Label>
                      <Input
                        value={profileForm.monday_friday}
                        onChange={(e) => setProfileForm({ ...profileForm, monday_friday: e.target.value })}
                        placeholder="06:00 às 23:00"
                        className="rounded-xl mt-1 text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] font-semibold">Sábados</Label>
                      <Input
                        value={profileForm.saturday}
                        onChange={(e) => setProfileForm({ ...profileForm, saturday: e.target.value })}
                        placeholder="08:00 às 18:00"
                        className="rounded-xl mt-1 text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] font-semibold">Domingos / Feriados</Label>
                      <Input
                        value={profileForm.sunday_holidays}
                        onChange={(e) => setProfileForm({ ...profileForm, sunday_holidays: e.target.value })}
                        placeholder="09:00 às 14:00"
                        className="rounded-xl mt-1 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 6: Comodidades & Diferenciais */}
                <div className="bg-card border border-border p-6 rounded-3xl space-y-4 shadow-sm">
                  <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Comodidades & Infraestrutura
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Clique para adicionar ou remover as facilidades oferecidas:
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {[
                      'Musculação Completa',
                      'Área Cardio Climatizada',
                      'Vestiários com Chuveiro',
                      'Armários Individuais',
                      'Wi-Fi Gratuito',
                      'Estacionamento',
                      'Lanchonete Fit',
                      'Avaliação por Bioimpedância',
                    ].map((item) => {
                      const selected = profileForm.facilities.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            const next = selected
                              ? profileForm.facilities.filter((f) => f !== item)
                              : [...profileForm.facilities, item];
                            setProfileForm({ ...profileForm, facilities: next });
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            selected
                              ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {selected ? '✓ ' : '+ '} {item}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Input
                      value={newFacilityInput}
                      onChange={(e) => setNewFacilityInput(e.target.value)}
                      placeholder="Outra comodidade..."
                      className="rounded-xl text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newFacilityInput.trim()) {
                          e.preventDefault();
                          if (!profileForm.facilities.includes(newFacilityInput.trim())) {
                            setProfileForm({
                              ...profileForm,
                              facilities: [...profileForm.facilities, newFacilityInput.trim()],
                            });
                          }
                          setNewFacilityInput('');
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs"
                      onClick={() => {
                        if (newFacilityInput.trim() && !profileForm.facilities.includes(newFacilityInput.trim())) {
                          setProfileForm({
                            ...profileForm,
                            facilities: [...profileForm.facilities, newFacilityInput.trim()],
                          });
                          setNewFacilityInput('');
                        }
                      }}
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Card 7: Galeria de Fotos da Estrutura */}
                <div className="bg-card border border-border p-6 rounded-3xl space-y-4 shadow-sm">
                  <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" /> Fotos da Estrutura ({profileForm.galleryUrls.length})
                  </h3>

                  <div className="flex gap-2">
                    <Input
                      value={newGalleryInput}
                      onChange={(e) => setNewGalleryInput(e.target.value)}
                      placeholder="URL da foto (ex: https://images.unsplash.com/...)"
                      className="rounded-xl text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="hero"
                      className="rounded-xl text-xs"
                      onClick={() => {
                        if (newGalleryInput.trim()) {
                          setProfileForm({
                            ...profileForm,
                            galleryUrls: [...profileForm.galleryUrls, newGalleryInput.trim()],
                          });
                          setNewGalleryInput('');
                        }
                      }}
                    >
                      Adicionar Foto
                    </Button>
                  </div>

                  {profileForm.galleryUrls.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-2">
                      {profileForm.galleryUrls.map((url, i) => (
                        <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-border">
                          <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setProfileForm({
                                ...profileForm,
                                galleryUrls: profileForm.galleryUrls.filter((_, idx) => idx !== i),
                              });
                            }}
                            className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Barra Inferior Fixa/Flutuante de Salvar */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
              <Button
                variant="outline"
                size="lg"
                className="rounded-2xl font-bold"
                asChild
              >
                <Link to={`/perfil/${user?.id}`} target="_blank">
                  <Eye className="w-4 h-4 mr-2" /> Pré-visualizar Perfil dos Alunos
                </Link>
              </Button>

              <Button
                variant="hero"
                size="lg"
                onClick={() => updateProfileMutation.mutate()}
                disabled={updateProfileMutation.isPending}
                className="rounded-2xl font-black px-8 shadow-glow"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar Todas as Alterações'}
              </Button>
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
                  type="text"
                  placeholder="99,90"
                  value={planForm.price}
                  onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                  className="rounded-xl mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Duração em Dias *</Label>
                <Input
                  type="number"
                  placeholder="30"
                  value={planForm.durationDays}
                  onChange={(e) => setPlanForm({ ...planForm, durationDays: e.target.value })}
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

      {/* MODAL: NOVA MATRÍCULA NO BALCÃO COM FOTO PRESENCIAL E BUSCA POR CPF FINEX */}
      <Dialog
        open={manualEnrollmentOpen}
        onOpenChange={(o) => {
          if (!o) stopPhotoCamera();
          setManualEnrollmentOpen(o);
        }}
      >
        <DialogContent className="max-w-lg bg-card rounded-3xl border-border p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                <UserPlus className="w-3 h-3" /> Balcão & Recepção
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                Acesso Catraca
              </span>
            </div>
            <DialogTitle className="font-display text-xl font-bold text-foreground">
              Nova Matrícula Presencial
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Identifique o aluno pelo CPF Finex ou cadastre os dados, capture a foto presencial e ative o acesso.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* SEÇÃO 1: FOTO DO ALUNO (PRESENCIAL / WEBCAM OU UPLOAD) */}
            <div className="bg-muted/40 border border-border/70 p-4 rounded-2xl space-y-3">
              <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-primary" /> Foto do Aluno (Reconhecimento / Catraca)
                </span>
                {manualForm.studentPhotoUrl && (
                  <button
                    type="button"
                    onClick={() => setManualForm((prev) => ({ ...prev, studentPhotoUrl: '' }))}
                    className="text-[11px] text-red-500 hover:underline flex items-center gap-0.5"
                  >
                    <X className="w-3 h-3" /> Remover foto
                  </button>
                )}
              </Label>

              {/* Pré-visualização da Câmera ao Vivo */}
              {isPhotoCameraOpen ? (
                <div className="space-y-2.5">
                  <div className="relative w-full aspect-video sm:aspect-[4/3] bg-black rounded-xl overflow-hidden border-2 border-primary shadow-inner flex items-center justify-center">
                    <video
                      ref={photoVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    {/* Guia de enquadramento facial */}
                    <div className="absolute inset-0 border-2 border-white/30 rounded-full w-36 h-48 m-auto pointer-events-none border-dashed" />
                  </div>
                  <canvas ref={photoCanvasRef} className="hidden" />

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="hero"
                      size="sm"
                      onClick={capturePhoto}
                      className="flex-1 rounded-xl text-xs font-bold gap-1.5 py-2.5 shadow-md shadow-primary/20"
                    >
                      <Camera className="w-4 h-4" /> Capturar Foto Agora
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={stopPhotoCamera}
                      className="rounded-xl text-xs"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  {/* Avatar / Foto capturada */}
                  {manualForm.studentPhotoUrl ? (
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary shrink-0 shadow-md">
                      <img
                        src={manualForm.studentPhotoUrl}
                        alt="Foto do Aluno"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-center text-white py-0.5 font-bold">
                        OK
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-muted border border-dashed border-border/80 flex flex-col items-center justify-center text-muted-foreground shrink-0">
                      <Camera className="w-6 h-6 mb-0.5 opacity-40" />
                      <span className="text-[9px] font-medium">Sem foto</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={startPhotoCamera}
                        className="rounded-xl text-xs gap-1.5 font-semibold border-primary/30 text-primary hover:bg-primary/10"
                      >
                        <Camera className="w-3.5 h-3.5" /> Tirar Foto na Webcam
                      </Button>

                      <label className="cursor-pointer">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          asChild
                          className="rounded-xl text-xs gap-1.5 font-semibold text-muted-foreground hover:text-foreground"
                        >
                          <span>
                            <Upload className="w-3.5 h-3.5" /> Enviar Arquivo
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      A foto facilitará o reconhecimento na catraca e portaria da academia.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SEÇÃO 2: IDENTIFICAÇÃO DO ALUNO / BUSCA POR CPF FINEX */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>CPF do Aluno (Busca Automática de Conta Finex)</span>
                  {isSearchingCpf && (
                    <span className="text-[10px] text-primary animate-pulse flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Buscando conta...
                    </span>
                  )}
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="000.000.000-00"
                    value={manualForm.studentCpf}
                    onChange={(e) => {
                      const val = e.target.value;
                      setManualForm({ ...manualForm, studentCpf: val });
                      if (val.replace(/\D/g, '').length >= 11) {
                        handleCpfLookup(val);
                      }
                    }}
                    onBlur={() => {
                      if (manualForm.studentCpf) {
                        handleCpfLookup(manualForm.studentCpf);
                      }
                    }}
                    className="rounded-xl text-xs font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCpfLookup(manualForm.studentCpf)}
                    disabled={isSearchingCpf || !manualForm.studentCpf}
                    className="rounded-xl text-xs shrink-0 font-semibold"
                  >
                    Buscar CPF
                  </Button>
                </div>
              </div>

              {/* Card de Aluno Finex Encontrado */}
              {foundStudent && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {foundStudent.avatarUrl ? (
                      <img
                        src={foundStudent.avatarUrl}
                        alt={foundStudent.name}
                        className="w-10 h-10 rounded-xl object-cover border border-emerald-500/40 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 font-bold flex items-center justify-center shrink-0 text-xs">
                        {foundStudent.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="truncate">
                      <p className="font-bold text-xs text-foreground flex items-center gap-1 truncate">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {foundStudent.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{foundStudent.email}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shrink-0">
                    Conta Finex
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Nome Completo do Aluno *</Label>
                  <Input
                    placeholder="Ex: Lucas Ferreira"
                    value={manualForm.studentName}
                    onChange={(e) => setManualForm({ ...manualForm, studentName: e.target.value })}
                    className="rounded-xl mt-1 text-xs"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">E-mail do Aluno *</Label>
                  <Input
                    type="email"
                    placeholder="Ex: aluno@email.com"
                    value={manualForm.studentEmail}
                    onChange={(e) => setManualForm({ ...manualForm, studentEmail: e.target.value })}
                    className="rounded-xl mt-1 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp do Aluno (Opcional)
                </Label>
                <Input
                  type="tel"
                  placeholder="(55) 99999-9999"
                  value={manualForm.studentPhone}
                  onChange={(e) => setManualForm({ ...manualForm, studentPhone: e.target.value })}
                  className="rounded-xl mt-1 text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Permite enviar com 1 clique o comprovante, link de ativação e tutorial de acesso no celular.
                </p>
              </div>
            </div>

            {/* SEÇÃO 3: PLANO E VALORES */}
            <div className="space-y-3 pt-2 border-t border-border/50">
              {/* Seleção rápida de planos existentes da academia */}
              {plansData && plansData.length > 0 && (
                <div>
                  <Label className="text-xs font-semibold">Selecione o Plano da Academia</Label>
                  <select
                    value={manualForm.planId}
                    onChange={(e) => {
                      const selPlan = plansData.find((p) => p.id === e.target.value);
                      if (selPlan) {
                        setManualForm({
                          ...manualForm,
                          planId: selPlan.id,
                          planName: selPlan.name,
                          amountPaid: Number(selPlan.price),
                          durationDays: selPlan.durationDays,
                        });
                      } else {
                        setManualForm({ ...manualForm, planId: '' });
                      }
                    }}
                    className="w-full h-9 px-3 rounded-xl bg-background border border-input text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring mt-1"
                  >
                    <option value="">Personalizado / Outro plano</option>
                    {plansData.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — R$ {Number(p.price).toFixed(2)} ({p.durationDays} dias)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Nome do Plano *</Label>
                  <Input
                    value={manualForm.planName}
                    onChange={(e) => setManualForm({ ...manualForm, planName: e.target.value })}
                    className="rounded-xl mt-1 text-xs"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Valor Cobrado (R$) *</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="99,90"
                    value={manualForm.amountPaid}
                    onChange={(e) => setManualForm({ ...manualForm, amountPaid: e.target.value })}
                    className="rounded-xl mt-1 text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Duração (Dias) *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={manualForm.durationDays}
                    onChange={(e) => setManualForm({ ...manualForm, durationDays: Number(e.target.value) })}
                    className="rounded-xl mt-1 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Observações Internas (Opcional)</Label>
                <Input
                  placeholder="Ex: Pagamento no balcão em dinheiro / PIX presencial"
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="rounded-xl mt-1 text-xs"
                />
              </div>

              {/* ALERTA DE NOTIFICAÇÃO AO ALUNO */}
              <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-2.5 text-xs text-muted-foreground">
                <BellRing className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Confirmação Instantânea no App Finex</p>
                  <p className="text-[11px] mt-0.5">
                    O aluno receberá uma notificação em sua conta Finex com o comprovante e seu QR Code de acesso à catraca já liberado.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  stopPhotoCamera();
                  setManualEnrollmentOpen(false);
                }}
                className="rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="hero"
                onClick={() => manualEnrollMutation.mutate()}
                disabled={
                  manualEnrollMutation.isPending ||
                  !manualForm.studentName.trim() ||
                  !manualForm.studentEmail.trim() ||
                  !manualForm.planName.trim()
                }
                className="rounded-xl text-xs font-bold gap-2 shadow-lg shadow-primary/20 px-5"
              >
                {manualEnrollMutation.isPending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Cadastrando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Cadastrar & Notificar Aluno
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: SUCESSO DE MATRÍCULA & ENVIO WHATSAPP */}
      <Dialog
        open={!!enrolledSuccessData}
        onOpenChange={(open) => {
          if (!open) setEnrolledSuccessData(null);
        }}
      >
        <DialogContent className="max-w-md rounded-3xl p-6 bg-card border-border shadow-2xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <DialogTitle className="text-center font-display text-xl font-bold">
              Matrícula Realizada com Sucesso! 🎉
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              O aluno já está com acesso ativo à academia no sistema.
            </DialogDescription>
          </DialogHeader>

          {enrolledSuccessData && (
            <div className="space-y-4 my-2">
              {/* Resumo do Aluno */}
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden border border-primary/20">
                  {enrolledSuccessData.enrollment.student?.avatarUrl ? (
                    <img
                      src={enrolledSuccessData.enrollment.student.avatarUrl}
                      alt={enrolledSuccessData.enrollment.student.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    enrolledSuccessData.enrollment.student?.name?.[0]?.toUpperCase() || 'A'
                  )}
                </div>
                <div className="truncate flex-1">
                  <h4 className="font-bold text-sm text-foreground truncate">
                    {enrolledSuccessData.enrollment.student?.name || 'Aluno'}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {enrolledSuccessData.enrollment.student?.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-semibold text-primary">
                      {enrolledSuccessData.enrollment.planName}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border text-muted-foreground">
                      {enrolledSuccessData.enrollment.qrAccessCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloco WhatsApp */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/25 space-y-3">
                <div className="flex items-start gap-2.5">
                  <MessageCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Enviar Acesso por WhatsApp
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Envia o link direto para cadastrar senha, instruções do QR Code de entrada e dica para salvar o app na tela de início.
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Número de WhatsApp do Aluno
                  </Label>
                  <Input
                    type="tel"
                    placeholder="(55) 99999-9999"
                    value={enrolledSuccessData.studentPhone || ''}
                    onChange={(e) =>
                      setEnrolledSuccessData({
                        ...enrolledSuccessData,
                        studentPhone: e.target.value,
                      })
                    }
                    className="rounded-xl mt-1 text-xs h-9 bg-background"
                  />
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    handleSendWhatsApp(
                      enrolledSuccessData.enrollment,
                      enrolledSuccessData.studentPhone,
                    );
                    setEnrolledSuccessData(null);
                  }}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 shadow-md shadow-emerald-600/20 h-10"
                >
                  <MessageCircle className="w-4 h-4" /> Enviar Acesso via WhatsApp Agora
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-between gap-2 border-t pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEnrolledSuccessData(null)}
              className="rounded-xl text-xs w-full"
            >
              Concluir sem enviar WhatsApp
            </Button>
          </DialogFooter>
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
