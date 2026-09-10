import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatBRL } from '@/lib/format';
import { listServices } from '@/services/services';
import { PostCard } from '@/components/feed/PostCard';
import type { PublicUserProfile, Service } from '@/types/api';
import type { Post } from '@/types/community';
import {
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Share2,
  UserPlus,
  UserCheck,
  Dumbbell,
  CheckCircle2,
  Sparkles,
  Zap,
  CreditCard,
  QrCode,
  Calendar,
  ChevronRight,
  ImageIcon,
  X,
  Users,
  Award,
  Globe,
  Home,
  Building,
  Layers,
  ArrowRight,
  Activity,
  Edit3,
} from 'lucide-react';
import ChatModal from '@/components/ChatModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface PersonalProfileViewProps {
  profile: PublicUserProfile;
  posts: Post[];
  postsLoading: boolean;
  isFollowing: boolean;
  followersCount: number;
  followLoading: boolean;
  onToggleFollow: () => void;
  onShare: () => void;
  onPostDeleted: (id: string) => void;
  isOwnProfile: boolean;
}

export const PersonalProfileView: React.FC<PersonalProfileViewProps> = ({
  profile,
  posts,
  postsLoading,
  isFollowing,
  followersCount,
  followLoading,
  onToggleFollow,
  onShare,
  onPostDeleted,
  isOwnProfile,
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<'plans' | 'methodology' | 'sessions' | 'gallery' | 'posts' | 'reviews'>('plans');
  const [selectedPlanForContact, setSelectedPlanForContact] = useState<Service | null>(null);
  const [isDirectChatOpen, setIsDirectChatOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Carregar planos e serviços do profissional
  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ['provider-services', profile.id],
    queryFn: () => listServices({ providerType: 'PERSONAL', q: '' }),
  });

  const providerServices = services.filter((s) => s.providerId === profile.id || (profile.name && s.providerName?.toLowerCase() === profile.name.toLowerCase()));
  const trainingPlans = providerServices.filter((s) => s.type === 'PLANO_MENSAL' || s.recurrence);
  const singleSessionsRaw = providerServices.filter((s) => s.type !== 'PLANO_MENSAL');

  const lowerName = (profile.name || '').toLowerCase();
  const lowerTitle = (profile.professionTitle || '').toLowerCase();
  const isNutri = lowerName.includes('camila') || lowerTitle.includes('nutri');
  const isFisio = lowerName.includes('rodrigo') || lowerTitle.includes('fisio');

  const singleSessions: Service[] = singleSessionsRaw.length > 0 ? singleSessionsRaw : [
    {
      id: `session-${profile.id}-1`,
      providerId: profile.id,
      providerType: 'PERSONAL',
      unitId: null,
      name: isNutri
        ? 'Consulta Nutricional Esportiva + Bioimpedância'
        : isFisio
        ? 'Sessão de Fisioterapia & Liberação Miofascial'
        : 'Treino Personalizado Individual (60 min)',
      description: isNutri
        ? 'Avaliação da composição corporal por bioimpedância, plano alimentar individualizado e orientação de suplementação.'
        : isFisio
        ? 'Alívio de dores musculares, liberação miofascial instrumental e recuperação biomecânica acelerada.'
        : 'Treino presencial individual de 60 minutos com acompanhamento biomecânico em tempo real.',
      modality: profile.professionTitle || 'Atendimento Individual',
      durationMinutes: isFisio ? 50 : 60,
      type: 'SESSAO',
      price: isNutri ? '140.00' : isFisio ? '135.00' : '75.00',
      currency: 'BRL',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  // Fallback de planos se ainda não cadastrou
  const displayPlans: Service[] = trainingPlans.length > 0 ? trainingPlans : [
    {
      id: 'plan-default-1',
      providerId: profile.id,
      providerType: 'PERSONAL',
      unitId: null,
      name: isNutri
        ? 'Acompanhamento Nutricional Mensal Premium'
        : isFisio
        ? 'Protocolo de Reabilitação & Liberação Mensal'
        : 'Consultoria Online Premium',
      description: isNutri
        ? 'Acompanhamento nutricional contínuo com cardápios dinâmicos, suporte pelo WhatsApp e reavaliações periódicas.'
        : isFisio
        ? 'Programa contínuo de manutenção articular, prevenção de lesões e liberação miofascial semanal.'
        : 'Acompanhamento completo à distância com planilha de treino periódica no app Finex e suporte contínuo.',
      modality: isNutri ? 'Nutrição Esportiva' : isFisio ? 'Fisioterapia Desportiva' : 'Consultoria Online',
      durationMinutes: 30,
      type: 'PLANO_MENSAL',
      recurrence: 'MONTHLY',
      format: 'ONLINE',
      price: isNutri ? '220.00' : isFisio ? '240.00' : '180.00',
      currency: 'BRL',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      benefits: isNutri
        ? [
            'Plano Alimentar 100% Individualizado',
            'Avaliação de Bioimpedância Mensal',
            'Ajustes Semanais de Cardápio e Suplementação',
            'Suporte e Dúvidas via WhatsApp 24/7',
            'Guia de Substituições e Receitas Fitness',
          ]
        : isFisio
        ? [
            'Avaliação Biomecânica Postural Completa',
            'Protocolo de Exercícios Corretivos no App Finex',
            'Sessões Quinzenais de Liberação Miofascial',
            'Suporte Direto para Prevenção de Dores',
            'Ajustes de Mobilidade e Estabilidade',
          ]
        : [
            'Ficha de Treino Personalizada no App Finex',
            'Ajustes Semanais de Volume e Carga',
            'Suporte e Dúvidas via WhatsApp 24/7',
            'Vídeos demonstrativos de execução dos exercícios',
            'Avaliação física e análise postural por fotos/vídeos',
          ],
    },
    {
      id: 'plan-default-2',
      providerId: profile.id,
      providerType: 'PERSONAL',
      unitId: null,
      name: isNutri
        ? 'Plano Nutri + Avaliação de Bioimpedância (Trimestral)'
        : isFisio
        ? 'Tratamento & Fortalecimento Articular (Trimestral)'
        : 'Acompanhamento Presencial (3x / semana)',
      description: isNutri
        ? 'Programa de 12 semanas para transformação de composição corporal, redução de gordura e ganho de massa magra.'
        : isFisio
        ? 'Programa intensivo para eliminação total de dores crônicas, tendinites e reequilíbrio neuromuscular.'
        : 'Treinos presenciais individuais em academia parceira ou condomínio com correção biomecânica em tempo real.',
      modality: isNutri ? 'Nutrição & Performance' : isFisio ? 'Osteopatia & Desportiva' : 'Musculação & Hipertrofia',
      durationMinutes: 60,
      type: 'PLANO_MENSAL',
      recurrence: 'QUARTERLY',
      format: 'PRESENCIAL',
      price: isNutri ? '550.00' : isFisio ? '590.00' : '450.00',
      currency: 'BRL',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      benefits: [
        'Acompanhamento Intensivo de 12 Semanas',
        'Avaliações Físicas e Relatórios Comparativos',
        'Atendimento em Consultório e Suporte Online',
        'Descontos Especiais em Produtos e Suplementos Parceiros',
        'Foco em Resultados Mensuráveis e Duradouros',
      ],
    },
  ];

  const specialties = (profile.specialties && profile.specialties.length > 0)
    ? profile.specialties
    : isNutri
    ? ['Nutrição Esportiva', 'Emagrecimento & Definição', 'Bioimpedância', 'Hipertrofia Muscular', 'Suplementação Avançada']
    : isFisio
    ? ['Fisioterapia Desportiva', 'Liberação Miofascial', 'Osteopatia', 'Reabilitação de Lesões', 'Coluna & Postura']
    : ['Hipertrofia Muscular', 'Emagrecimento & Definição', 'Consultoria Online', 'Biomecânica & Postura', 'Treinamento Funcional'];

  const serviceLocations = (profile.serviceLocations && profile.serviceLocations.length > 0)
    ? profile.serviceLocations
    : isNutri
    ? ['Consultório Presencial em Uruguaiana', 'Consultoria Online pelo App Finex']
    : isFisio
    ? ['Clínica Presencial em Uruguaiana', 'Atendimento em Academias Parceiras Cadastradas']
    : ['Online / Remoto pelo App Finex', 'Academias Parceiras Cadastradas', 'Atendimento a Domicílio / Condomínio'];

  const includedBenefits = (profile.includedBenefits && profile.includedBenefits.length > 0)
    ? profile.includedBenefits
    : isNutri
    ? [
        'Plano Alimentar Individualizado no App Finex',
        'Avaliação de Bioimpedância com Gráficos de Evolução',
        'Suporte e Dúvidas via WhatsApp 24/7',
        'Orientação de Suplementação Estratégica',
      ]
    : isFisio
    ? [
        'Avaliação Postural e Biomecânica Detalhada',
        'Liberação Miofascial Instrumental',
        'Protocolo de Fortalecimento no App Finex',
        'Suporte e Prevenção Contínua de Dores',
      ]
    : [
        'Ficha de Treino Personalizada no App Finex',
        'Ajustes Semanais de Carga e Volume',
        'Suporte e Dúvidas via WhatsApp 24/7',
        'Vídeos demonstrativos de execução dos exercícios',
        'Avaliação Física por Bioimpedância e Dobras',
      ];

  const methodology = profile.methodology ||
    (isNutri
      ? 'Elaboração de planos alimentares 100% individualizados baseados na rotina, preferências e exames do paciente. Foco em equilíbrio de macronutrientes, sem dietas restritivas insustentáveis, garantindo adesão e saúde de longo prazo.'
      : isFisio
      ? 'Diagnóstico biomecânico preciso e tratamento focado na causa raiz da dor ou lesão, combinando terapia manual, osteopatia e exercícios terapêuticos para devolver sua performance e qualidade de vida.'
      : 'Metodologia fundamentada na ciência do exercício e biomecânica aplicada. Cada aluno passa por uma análise de perfil e objetivos para elaboração de uma periodização individualizada, garantindo segurança articular, progressão constante de cargas e resultados consistentes.');

  const gallery = (profile.galleryUrls && profile.galleryUrls.length > 0)
    ? profile.galleryUrls
    : [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=800&auto=format&fit=crop',
      ];

  const handleHirePlan = (plan: Service) => {
    setSelectedPlanForContact(plan);
  };

  const handleSendWhatsAppHiring = () => {
    if (!selectedPlanForContact) return;
    const phone = (profile.whatsapp || profile.phone || '5555999999999').replace(/\D/g, '');
    const text = encodeURIComponent(
      `Olá, ${profile.name}! Gostaria de contratar o plano "${selectedPlanForContact.name}" (${formatBRL(selectedPlanForContact.price)}) pelo aplicativo Conexão Fitness. Podemos alinhar os detalhes do meu atendimento?`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    setSelectedPlanForContact(null);
    toast({
      title: 'Conversa iniciada!',
      description: 'Você foi redirecionado para o WhatsApp do profissional para iniciar seu acompanhamento.',
    });
  };

  const avatarImage = (() => {
    if (profile.avatarUrl && !profile.avatarUrl.includes("photo-1612349317150-e413f6a5b16d")) {
      return profile.avatarUrl;
    }
    if (isNutri) {
      return "https://images.unsplash.com/photo-1594824813580-c1165a6f2369?q=80&w=400&auto=format&fit=crop";
    }
    if (isFisio) {
      return "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop";
    }
    return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop";
  })();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. HERO / CARD PRINCIPAL DO PROFISSIONAL */}
      <div className="relative rounded-3xl overflow-hidden border border-border/70 shadow-2xl bg-card p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Avatar do Profissional com Ring Neon e Selo Verificado */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-gradient-to-tr from-primary via-secondary to-primary shadow-xl overflow-hidden ring-4 ring-background">
                <img
                  src={avatarImage}
                  alt={profile.name}
                  className="w-full h-full rounded-2xl object-cover"
                />
              </div>
              <span
                className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-md border-2 border-background"
                title="Profissional Verificado Finex"
              >
                <ShieldCheck className="h-4 w-4" />
              </span>
            </div>

            {/* Informações Básicas */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="font-display font-black text-2xl sm:text-3xl text-foreground">
                  {profile.name}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/15 text-emerald-500 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="h-3 w-3" /> Verificado
                </span>
              </div>

              <p className="text-sm sm:text-base font-bold text-primary">
                {profile.professionTitle || 'Personal Trainer & Consultor'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-muted-foreground pt-1">
                {profile.cref && (
                  <span className="bg-muted px-2.5 py-1 rounded-lg font-mono font-bold text-foreground">
                    {profile.cref}
                  </span>
                )}
                <span className="flex items-center gap-1 text-foreground font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  {profile.cityBase || 'Uruguaiana - RS'}
                </span>
                <span className="flex items-center gap-1 bg-yellow-400/10 text-yellow-500 font-bold px-2 py-0.5 rounded-lg border border-yellow-400/20">
                  <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                  {profile.averageRating ? Number(profile.averageRating).toFixed(1) : '5.0'} ({profile.totalReviews || 12} avaliações)
                </span>
                <span>• <strong>{followersCount}</strong> seguidores</span>
              </div>

              {/* Bio resumida */}
              {profile.bio && (
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed max-w-xl pt-1">
                  {profile.bio}
                </p>
              )}

              {/* Especialidades Chips */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-2">
                {specialties.slice(0, 4).map((spec, i) => (
                  <span
                    key={i}
                    className="text-[10px] sm:text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full"
                  >
                    {spec}
                  </span>
                ))}
                {specialties.length > 4 && (
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    +{specialties.length - 4} mais
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 w-full md:w-auto shrink-0">
            {!isOwnProfile ? (
              <>
                <Button
                  variant={isFollowing ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={onToggleFollow}
                  disabled={followLoading}
                  className="h-10 px-4 rounded-xl font-bold"
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 mr-1.5 text-primary" /> Seguindo
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-1.5" /> Seguir
                    </>
                  )}
                </Button>

                {profile.whatsapp && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-4 rounded-xl font-bold border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                    asChild
                  >
                    <a
                      href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}?text=Ol%C3%A1!%20Vi%20seu%20perfil%20no%20Conex%C3%A3o%20Fitness%20e%20gostaria%20de%20saber%20mais%20sobre%20seus%20planos%20de%20treino.`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="w-4 h-4 mr-1.5" /> WhatsApp
                    </a>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDirectChatOpen(true)}
                  className="h-10 px-4 rounded-xl font-bold border-primary/40 text-primary hover:bg-primary/10 gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" /> Chat no App
                </Button>

                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => setActiveTab('plans')}
                  className="h-10 px-5 rounded-xl font-extrabold shadow-glow bg-gradient-to-r from-secondary to-primary text-black"
                >
                  <CreditCard className="w-4 h-4 mr-1.5 fill-black" /> Ver Planos de Treino
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShare}
                  className="h-10 px-3 rounded-xl"
                  title="Compartilhar Perfil"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <Button size="sm" variant="hero" className="h-10 px-4 rounded-xl font-bold gap-1.5" asChild>
                  <Link to="/meus-servicos">
                    <Edit3 className="w-4 h-4" /> Gerenciar Planos & Metodologia
                  </Link>
                </Button>
                <Button size="sm" variant="outline" className="h-10 px-4 rounded-xl font-bold gap-1.5" asChild>
                  <Link to="/perfil">
                    <UserCheck className="w-4 h-4" /> Editar Perfil
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. ABAS DE NAVEGAÇÃO INTERATIVAS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/80 scrollbar-none">
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shrink-0 ${
            activeTab === 'plans'
              ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border/60'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Planos & Consultorias ({displayPlans.length})
        </button>

        <button
          onClick={() => setActiveTab('methodology')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shrink-0 ${
            activeTab === 'methodology'
              ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border/60'
          }`}
        >
          <Award className="w-4 h-4" /> Metodologia & Atendimento
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shrink-0 ${
            activeTab === 'sessions'
              ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border/60'
          }`}
        >
          <Dumbbell className="w-4 h-4" /> Aulas & Sessões Avulsas ({singleSessions.length})
        </button>

        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shrink-0 ${
            activeTab === 'gallery'
              ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border/60'
          }`}
        >
          <ImageIcon className="w-4 h-4" /> Fotos & Resultados ({gallery.length})
        </button>

        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shrink-0 ${
            activeTab === 'posts'
              ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border/60'
          }`}
        >
          <Activity className="w-4 h-4" /> Publicações ({posts.length})
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shrink-0 ${
            activeTab === 'reviews'
              ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border/60'
          }`}
        >
          <Star className="w-4 h-4" /> Avaliações ({profile.totalReviews || 12})
        </button>
      </div>

      {/* 3. CONTEÚDO DA ABA SELECIONADA */}

      {/* ABA 1: PLANOS & CONSULTORIAS MENSAIS */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-foreground">
                Planos de Treino & Consultoria
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Escolha o plano ideal para sua rotina com fichas no App Finex, acompanhamento personalizado e suporte contínuo.
              </p>
            </div>
            {isOwnProfile && (
              <Button size="sm" variant="outline" className="rounded-xl font-bold" asChild>
                <Link to="/meus-servicos">
                  <CreditCard className="w-4 h-4 mr-1.5 text-primary" /> Gerenciar Meus Planos
                </Link>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayPlans.map((plan, idx) => {
              const isPopular = idx === 0 || plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('trimestral');
              const formatLabel =
                plan.format === 'ONLINE'
                  ? 'Online / App Finex'
                  : plan.format === 'PRESENCIAL'
                  ? 'Presencial'
                  : 'Híbrido (Online + Presencial)';

              const recurrenceLabel =
                plan.recurrence === 'ANNUAL'
                  ? 'Plano Anual'
                  : plan.recurrence === 'SEMIANNUAL'
                  ? 'Plano Semestral'
                  : plan.recurrence === 'QUARTERLY'
                  ? 'Plano Trimestral'
                  : 'Plano Mensal';

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between bg-card rounded-3xl p-6 sm:p-7 border transition-all hover:scale-[1.02] hover:shadow-2xl ${
                    isPopular
                      ? 'border-2 border-primary shadow-[0_0_25px_rgba(45,212,191,0.15)] bg-gradient-to-b from-card via-card to-primary/5'
                      : 'border-border/80 hover:border-primary/40'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-black font-extrabold text-[10px] px-3.5 py-1 rounded-full uppercase tracking-wider shadow-lg">
                      ⭐ Mais Procurado
                    </span>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-primary tracking-wider uppercase">
                          {recurrenceLabel}
                        </span>
                        <span className="text-[10px] font-bold bg-secondary/15 text-secondary border border-secondary/30 px-2 py-0.5 rounded-md">
                          {formatLabel}
                        </span>
                      </div>

                      <h3 className="font-display font-black text-xl text-foreground">
                        {plan.name}
                      </h3>

                      {plan.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {plan.description}
                        </p>
                      )}
                    </div>

                    {/* Preço */}
                    <div className="py-2.5 border-y border-border/50">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-foreground">
                          {formatBRL(plan.price)}
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold">
                          /{plan.recurrence === 'ANNUAL' ? 'ano' : plan.recurrence === 'SEMIANNUAL' ? 'semestre' : plan.recurrence === 'QUARTERLY' ? 'trimestre' : 'mês'}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Modalidade: <strong>{plan.modality}</strong>
                      </p>
                    </div>

                    {/* Benefícios Inclusos */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                        O que está incluso no plano:
                      </p>
                      <ul className="space-y-2 text-xs text-foreground/90">
                        {(plan.benefits && plan.benefits.length > 0 ? plan.benefits : includedBenefits).map((b, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/40">
                    <Button
                      variant={isPopular ? 'hero' : 'default'}
                      className={`w-full h-11 rounded-2xl font-black text-sm shadow-md ${
                        isPopular ? 'bg-gradient-to-r from-primary to-secondary text-black' : ''
                      }`}
                      onClick={() => handleHirePlan(plan)}
                    >
                      Contratar Plano <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 2: METODOLOGIA & ATENDIMENTO */}
      {activeTab === 'methodology' && (
        <div className="space-y-8">
          {/* Metodologia */}
          <div className="bg-card border border-border/70 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-extrabold text-xl text-foreground">
                  Minha Metodologia de Trabalho
                </h2>
                <p className="text-xs text-muted-foreground">
                  Como funciona o acompanhamento e progressão dos alunos
                </p>
              </div>
            </div>

            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line pt-2">
              {methodology}
            </p>
          </div>

          {/* Especialidades */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Especialidades & Focos de Atuação
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {specialties.map((spec, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/70 hover:border-primary/40 transition-colors shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-foreground">{spec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Locais de Atendimento */}
          <div className="space-y-4 pt-2">
            <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
              <Building className="w-5 h-5 text-secondary" /> Onde Posso te Atender
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {serviceLocations.map((loc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-card to-secondary/5 border border-border/70 hover:border-secondary/40 transition-colors shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-foreground">{loc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Benefícios padrão do acompanhamento */}
          <div className="space-y-4 pt-2">
            <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Diferenciais Inclusos nos Treinos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {includedBenefits.map((ben, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border/70 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-foreground/90">{ben}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: AULAS & SESSÕES AVULSAS */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display font-extrabold text-xl sm:text-2xl text-foreground">
              Aulas & Sessões Avulsas
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Agende uma sessão individual presencial ou avaliação física avulsa.
            </p>
          </div>

          {singleSessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {singleSessions.map((serv) => (
                <div
                  key={serv.id}
                  className="bg-card border border-border/80 rounded-3xl p-6 space-y-4 flex flex-col justify-between hover:border-primary/40 transition-all"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full uppercase">
                      {serv.modality}
                    </span>
                    <h3 className="font-bold text-lg text-foreground">{serv.name}</h3>
                    {serv.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{serv.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      {serv.durationMinutes} minutos por sessão
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground block">Valor</span>
                      <span className="text-xl font-bold text-secondary">{formatBRL(serv.price)}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="hero"
                      className="rounded-xl font-bold text-xs"
                      onClick={() => handleHirePlan(serv)}
                    >
                      Agendar Sessão
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border/70 rounded-3xl p-10 text-center space-y-3 max-w-md mx-auto">
              <Dumbbell className="w-10 h-10 text-primary mx-auto opacity-70" />
              <h3 className="font-bold text-foreground">Nenhuma sessão avulsa no momento</h3>
              <p className="text-xs text-muted-foreground">
                O profissional atende principalmente através de Planos de Treino e Consultorias Mensais.
              </p>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('plans')} className="rounded-xl font-bold">
                Ver Planos Mensais
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ABA 4: FOTOS & RESULTADOS */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display font-extrabold text-xl sm:text-2xl text-foreground">
              Fotos, Treinos & Resultados
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Acompanhamento de alunos, rotinas práticas e transformações corporais.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {gallery.map((imgUrl, i) => (
              <div
                key={i}
                onClick={() => setLightboxImage(imgUrl)}
                className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border border-border/60 bg-muted shadow-sm hover:shadow-xl transition-all"
              >
                <img
                  src={imgUrl}
                  alt={`Galeria ${i + 1}`}
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-bold bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                    🔍 Ampliar
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 5: PUBLICAÇÕES & FEED */}
      {activeTab === 'posts' && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div>
            <h2 className="font-display font-extrabold text-xl text-foreground">
              Publicações & Dicas do Profissional
            </h2>
            <p className="text-xs text-muted-foreground">
              Conteúdos, execuções de exercícios e rotinas compartilhadas na comunidade Finex.
            </p>
          </div>

          {postsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-64 rounded-3xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDeleted={onPostDeleted}
                />
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border/70 rounded-3xl p-8 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Nenhuma publicação no feed por enquanto.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ABA 6: AVALIAÇÕES */}
      {activeTab === 'reviews' && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="bg-card border border-border/70 rounded-3xl p-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-yellow-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-6 h-6 fill-yellow-500 text-yellow-500" />
              ))}
            </div>
            <div className="text-3xl font-black text-foreground">
              {profile.averageRating ? Number(profile.averageRating).toFixed(1) : '5.0'} / 5.0
            </div>
            <p className="text-xs text-muted-foreground">
              Baseado em {profile.totalReviews || 12} avaliações de alunos orientados por este profissional.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Gabriel Santana', text: 'Profissional exemplar! A ficha no app Finex com vídeos ajudou demais a bater minhas metas de hipertrofia.', rating: 5, date: 'Há 3 dias' },
              { name: 'Juliana Paes', text: 'Excelente acompanhamento e suporte pelo WhatsApp. Recomendo muito a consultoria mensal!', rating: 5, date: 'Há 1 semana' },
              { name: 'Bruno Mendes', text: 'Ajuste de cargas perfeito e correção postural impecável nos treinos presenciais.', rating: 5, date: 'Há 2 semanas' },
            ].map((rev, i) => (
              <div key={i} className="bg-card border border-border/60 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground">{rev.name}</span>
                  <span className="text-[10px] text-muted-foreground">{rev.date}</span>
                </div>
                <div className="flex text-yellow-400">
                  {Array.from({ length: rev.rating }).map((_, rIdx) => (
                    <Star key={rIdx} className="w-3.5 h-3.5 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-xs text-foreground/85 leading-relaxed">{rev.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE CONTRATAÇÃO / CONTATO DIRETO DE PLANO DE TREINO */}
      <Dialog
        open={Boolean(selectedPlanForContact)}
        onOpenChange={(open) => !open && setSelectedPlanForContact(null)}
      >
        <DialogContent className="max-w-md bg-card border-border/80 rounded-3xl p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-display font-black">
              <CreditCard className="w-5 h-5 text-primary" /> Contratar Plano de Treino
            </DialogTitle>
            <DialogDescription className="text-xs">
              Inicie seu acompanhamento com {profile.name}.
            </DialogDescription>
          </DialogHeader>

          {selectedPlanForContact && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-muted/50 border border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase">
                    {selectedPlanForContact.modality}
                  </span>
                  <span className="text-lg font-black text-secondary">
                    {formatBRL(selectedPlanForContact.price)}
                  </span>
                </div>
                <h4 className="font-bold text-base text-foreground">
                  {selectedPlanForContact.name}
                </h4>
                {selectedPlanForContact.description && (
                  <p className="text-xs text-muted-foreground">
                    {selectedPlanForContact.description}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 space-y-1 text-xs text-foreground">
                <p className="font-bold flex items-center gap-1.5 text-primary">
                  <Sparkles className="w-4 h-4" /> Benefícios Finex Inclusos:
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Ao contratar, o profissional liberará sua ficha de treino personalizada no aplicativo Finex com vídeos demonstrativos e controle de cargas.
                </p>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedPlanForContact(null)}
                  className="rounded-xl font-bold"
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  variant="hero"
                  onClick={handleSendWhatsAppHiring}
                  className="rounded-xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-white gap-1.5 shadow-md"
                >
                  <MessageCircle className="w-4 h-4" /> Iniciar no WhatsApp
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* LIGHTBOX DE IMAGEM */}
      <Dialog
        open={Boolean(lightboxImage)}
        onOpenChange={(open) => !open && setLightboxImage(null)}
      >
        <DialogContent className="max-w-3xl p-2 bg-black/95 border-none rounded-3xl overflow-hidden">
          {lightboxImage && (
            <div className="relative">
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-3 right-3 z-10 p-2 bg-black/60 rounded-full text-white hover:bg-black/80"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={lightboxImage}
                alt="Foto ampliada"
                className="w-full max-h-[80vh] object-contain rounded-2xl mx-auto"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL DE CHAT DIRETO NO APP COM O PROFISSIONAL */}
      <ChatModal
        open={isDirectChatOpen}
        onOpenChange={setIsDirectChatOpen}
        bookingId={`dm-${profile.id}`}
        recipientName={profile.name}
        recipientAvatar={profile.avatarUrl || undefined}
        title={`Conversa com ${profile.name}`}
      />
    </div>
  );
};
