import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatBRL } from '@/lib/format';
import { MembershipPlan } from '@/services/memberships';
import { EnrollmentModal } from '@/components/EnrollmentModal';
import { StudentAccessPassModal } from '@/components/StudentAccessPassModal';
import { PostCard } from '@/components/feed/PostCard';
import { CrowdLevelBadge } from '@/components/analytics/CrowdLevelBadge';
import { PeakHoursChart } from '@/components/analytics/PeakHoursChart';
import { fetchGymCrowdStats } from '@/services/gymAnalytics';
import type { PublicUserProfile } from '@/types/api';
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
  Wifi,
  Wind,
  Car,
  Lock,
  Coffee,
  Activity,
  Heart,
  Calendar,
  ExternalLink,
  ChevronRight,
  ImageIcon,
  X,
  Users,
} from 'lucide-react';

interface AcademiaProfileViewProps {
  profile: PublicUserProfile;
  gymPlans: MembershipPlan[];
  loadingPlans: boolean;
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

export const AcademiaProfileView: React.FC<AcademiaProfileViewProps> = ({
  profile,
  gymPlans,
  loadingPlans,
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
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<'plans' | 'daypass' | 'structure' | 'amenities' | 'posts' | 'reviews'>('plans');
  const [selectedPlanForEnrollment, setSelectedPlanForEnrollment] = useState<MembershipPlan | null>(null);
  const [createdEnrollmentForPass, setCreatedEnrollmentForPass] = useState<any | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const { data: crowdStats } = useQuery({
    queryKey: ['gym-crowd-stats', profile.id],
    queryFn: () => fetchGymCrowdStats(profile.id),
    enabled: !!profile.id,
  });

  // Valores padrão ou customizados da academia
  const coverImage =
    profile.coverUrl ||
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1400&auto=format&fit=crop';
  const avatarImage =
    profile.avatarUrl ||
    'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=400&auto=format&fit=crop';
  const gymName = profile.nomeFantasia || profile.name || 'Academia';
  const legalName = profile.razaoSocial;
  const cnpj = profile.cnpj;
  const address = profile.address || 'Endereço não informado';
  const cityState = `${profile.cityBase || 'Uruguaiana'} - ${profile.state || 'RS'}`;
  const dayPassPrice = profile.dayPassPrice ?? 25.0;

  // Horários de funcionamento
  const hours = profile.openingHours || {
    monday_friday: '06:00 às 23:00',
    saturday: '08:00 às 18:00',
    sunday_holidays: '09:00 às 14:00',
  };

  // Comodidades / Amenities
  const facilities = (profile.facilities && profile.facilities.length > 0)
    ? profile.facilities
    : [
        'Musculação Completa & Pesos Livres',
        'Área Cardio Climatizada',
        'Vestiários com Chuveiros Quentes',
        'Armários Individuais com Chave',
        'Wi-Fi 5G de Alta Velocidade',
        'Estacionamento Gratuito para Alunos',
        'Lanchonete Fit & Suplementação',
        'Avaliação Física com Bioimpedância',
      ];

  // Modalidades
  const modalities = (profile.modalities && profile.modalities.length > 0)
    ? profile.modalities
    : ['Musculação', 'Spinning', 'Cross Training', 'Pilates', 'Muay Thai', 'Dança / FitDance', 'Yoga'];

  // Galeria de Fotos
  const gallery = (profile.galleryUrls && profile.galleryUrls.length > 0)
    ? profile.galleryUrls
    : [
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1570829460005-c840387bb1ca?q=80&w=800&auto=format&fit=crop',
      ];

  const handleEnrollClick = (plan: MembershipPlan) => {
    if (!isAuthenticated) {
      toast({
        title: 'Faça login para se matricular',
        description: 'Você será redirecionado para a tela de login.',
      });
      navigate('/login');
      return;
    }
    setSelectedPlanForEnrollment(plan);
  };

  const handleDayPassClick = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Faça login para garantir seu Day Pass',
        description: 'Você será redirecionado para a tela de login.',
      });
      navigate('/login');
      return;
    }
    // Cria um objeto de plano virtual de Day Pass para abrir no modal de checkout
    const dayPassPlan: MembershipPlan = {
      id: 'daypass-instant',
      academiaId: profile.id,
      name: 'Day Pass (Treino Avulso)',
      description: 'Acesso total durante 1 dia a todas as dependências e equipamentos da academia.',
      price: dayPassPrice.toString(),
      durationDays: 1,
      recurrence: 'SINGLE',
      modalities: ['Musculação', 'Cardio'],
      benefits: [
        'Acesso livre durante 1 dia inteiro',
        'Vestiários e armários inclusos',
        'Sem taxa de matrícula ou anuidade',
        'Débito automático na Carteira Finex ou Pix',
        'QR Code liberado instantaneamente na Catraca',
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedPlanForEnrollment(dayPassPlan);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. HERO / BANNER PRINCIPAL COM BRANDING DA ACADEMIA */}
      <div className="relative rounded-3xl overflow-hidden border border-border/70 shadow-2xl bg-card">
        {/* Cover Photo */}
        <div className="relative h-48 sm:h-64 md:h-80 w-full overflow-hidden">
          <img
            src={coverImage}
            alt={gymName}
            className="w-full h-full object-cover object-center filter brightness-90 transform hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          
          {/* Badge de Verificação Finex */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-primary border border-primary/30 shadow-lg">
              <ShieldCheck className="w-4 h-4 text-primary" /> Academia Parceira Oficial
            </span>
          </div>

          {/* Botões Superiores de Ação */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              className="h-9 px-3 bg-black/50 backdrop-blur-md border-border/80 text-white hover:bg-black/80 rounded-xl"
            >
              <Share2 className="w-4 h-4 mr-1.5" /> Compartilhar
            </Button>
            {isOwnProfile && (
              <Button
                size="sm"
                variant="hero"
                className="h-9 px-3 rounded-xl font-bold shadow-glow"
                asChild
              >
                <Link to="/gestao-academia">
                  <Activity className="w-4 h-4 mr-1.5" /> Painel da Academia
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Informações da Academia (Avatar + Título + Status + CTAs) */}
        <div className="px-6 sm:px-8 pb-8 -mt-16 sm:-mt-20 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
              {/* Avatar da Academia */}
              <div className="relative shrink-0">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl p-1 bg-gradient-to-tr from-primary via-secondary to-primary shadow-2xl overflow-hidden ring-4 ring-background">
                  <img
                    src={avatarImage}
                    alt={gymName}
                    className="w-full h-full rounded-xl object-cover"
                  />
                </div>
                <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md border-2 border-background flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> ABERTO
                </span>
              </div>

              {/* Títulos e Endereço */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-foreground tracking-tight">
                    {gymName}
                  </h1>
                </div>

                {legalName && (
                  <p className="text-xs text-muted-foreground font-medium">
                    {legalName} {cnpj ? `• CNPJ: ${cnpj}` : ''}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs sm:text-sm text-muted-foreground pt-1">
                  <span className="flex items-center gap-1 text-foreground font-semibold">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    {address} • {cityState}
                  </span>
                  <span className="flex items-center gap-1 bg-yellow-400/10 text-yellow-500 font-bold px-2 py-0.5 rounded-lg border border-yellow-400/20">
                    <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                    {profile.averageRating ? Number(profile.averageRating).toFixed(1) : '5.0'} ({profile.totalReviews || 18} avaliações)
                  </span>
                  <span className="text-muted-foreground">
                    • <strong>{followersCount}</strong> seguidores
                  </span>
                </div>
              </div>
            </div>

            {/* CTAs de Destaque */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 w-full md:w-auto">
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
                    href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}?text=Ol%C3%A1!%20Vi%20o%20perfil%20da%20academia%20no%20Conex%C3%A3o%20Fitness.`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="w-4 h-4 mr-1.5" /> WhatsApp
                  </a>
                </Button>
              )}

              <Button
                variant="hero"
                size="sm"
                onClick={handleDayPassClick}
                className="h-10 px-5 rounded-xl font-extrabold shadow-glow bg-gradient-to-r from-secondary to-primary text-black"
              >
                <Zap className="w-4 h-4 mr-1.5 fill-black" /> Day Pass {formatBRL(dayPassPrice)}
              </Button>
            </div>
          </div>

          {/* Descrição / Bio da Academia */}
          {profile.bio && (
            <div className="mt-6 pt-6 border-t border-border/60 text-sm text-foreground/90 leading-relaxed max-w-4xl">
              <p className="font-semibold text-xs text-primary mb-1 uppercase tracking-wider">Sobre a Academia</p>
              {profile.bio}
            </div>
          )}

          {/* Lotação em Tempo Real & Horários */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {crowdStats && <CrowdLevelBadge stats={crowdStats} />}

              {/* Pílula Rápida de Horários */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground bg-muted/40 p-3.5 rounded-2xl border border-border/50">
                <span className="flex items-center gap-1.5 font-bold text-foreground">
                  <Clock className="w-4 h-4 text-primary" /> Horários:
                </span>
                <span><strong>Seg-Sex:</strong> {hours.monday_friday || '06h às 23h'}</span>
                <span>•</span>
                <span><strong>Sáb:</strong> {hours.saturday || '08h às 18h'}</span>
                <span>•</span>
                <span><strong>Dom/Feriados:</strong> {hours.sunday_holidays || '09h às 14h'}</span>
              </div>
            </div>

            {crowdStats && <PeakHoursChart peakHours={crowdStats.peakHours} />}
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
          <CreditCard className="w-4 h-4" /> Planos de Matrícula ({gymPlans.length})
        </button>

        <button
          onClick={() => setActiveTab('daypass')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shrink-0 ${
            activeTab === 'daypass'
              ? 'bg-secondary text-secondary-foreground shadow-md scale-[1.02]'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border/60'
          }`}
        >
          <Zap className="w-4 h-4" /> Day Pass (Treino Avulso)
        </button>

        <button
          onClick={() => setActiveTab('structure')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shrink-0 ${
            activeTab === 'structure'
              ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border/60'
          }`}
        >
          <ImageIcon className="w-4 h-4" /> Fotos & Estrutura ({gallery.length})
        </button>

        <button
          onClick={() => setActiveTab('amenities')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shrink-0 ${
            activeTab === 'amenities'
              ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border/60'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Comodidades & Modalidades
        </button>

        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shrink-0 ${
            activeTab === 'posts'
              ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border/60'
          }`}
        >
          <Activity className="w-4 h-4" /> Feed & Comunidade ({posts.length})
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shrink-0 ${
            activeTab === 'reviews'
              ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border/60'
          }`}
        >
          <Star className="w-4 h-4" /> Avaliações ({profile.totalReviews || 18})
        </button>
      </div>

      {/* 3. CONTEÚDO DA ABA SELECIONADA */}

      {/* ABA 1: PLANOS DE MATRÍCULA PERSONALIZADOS */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-foreground">
                Planos de Matrícula Oficiais
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Escolha o plano ideal para seus objetivos e matricule-se 100% online com liberação imediata via QR Code.
              </p>
            </div>
            {isOwnProfile && (
              <Button size="sm" variant="outline" className="rounded-xl font-bold" asChild>
                <Link to="/gestao-academia">
                  <CreditCard className="w-4 h-4 mr-1.5 text-primary" /> Gerenciar Meus Planos
                </Link>
              </Button>
            )}
          </div>

          {loadingPlans ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-3xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : gymPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gymPlans.map((plan, idx) => {
                const isPopular = idx === 0 || plan.name.toLowerCase().includes('semestral') || plan.name.toLowerCase().includes('black');
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
                        ⭐ Mais Escolhido
                      </span>
                    )}

                    <div className="space-y-4">
                      <div>
                        <span className="text-[11px] font-bold text-primary tracking-wider uppercase">
                          {plan.recurrence === 'ANNUAL'
                            ? 'Plano Anual'
                            : plan.recurrence === 'SEMIANNUAL'
                            ? 'Plano Semestral'
                            : plan.recurrence === 'QUARTERLY'
                            ? 'Plano Trimestral'
                            : 'Plano Mensal'}
                        </span>
                        <h3 className="font-display font-black text-xl text-foreground mt-0.5">
                          {plan.name}
                        </h3>
                        {plan.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {plan.description}
                          </p>
                        )}
                      </div>

                      {/* Preço */}
                      <div className="py-2 border-y border-border/50">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-black text-foreground">
                            {formatBRL(Number(plan.price))}
                          </span>
                          <span className="text-xs text-muted-foreground font-semibold">
                            /{plan.durationDays >= 365 ? 'ano' : plan.durationDays >= 180 ? 'semestre' : plan.durationDays >= 90 ? 'trimestre' : 'mês'}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Válido por {plan.durationDays} dias • Liberação por QR Code
                        </p>
                      </div>

                      {/* Benefícios / O que a academia dá no plano */}
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                          O que está incluso:
                        </p>
                        <ul className="space-y-2 text-xs text-foreground/90">
                          {(plan.benefits && plan.benefits.length > 0 ? plan.benefits : [
                            'Acesso total e ilimitado aos equipamentos',
                            'Aulas de ginástica e cardio inclusas',
                            'Vestiários climatizados com chuveiros',
                            'Avaliação física inicial gratuita',
                            'Sem taxa de matrícula ou anuidade surpresa',
                          ]).map((b, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Modalidades inclusas */}
                      {plan.modalities && plan.modalities.length > 0 && (
                        <div className="pt-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">
                            Modalidades liberadas:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {plan.modalities.map((m, mIdx) => (
                              <span
                                key={mIdx}
                                className="text-[10px] font-semibold bg-muted px-2 py-0.5 rounded-md text-foreground"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-border/40">
                      <Button
                        variant={isPopular ? 'hero' : 'default'}
                        className={`w-full h-11 rounded-2xl font-black text-sm shadow-md ${
                          isPopular ? 'bg-gradient-to-r from-primary to-secondary text-black' : ''
                        }`}
                        onClick={() => handleEnrollClick(plan)}
                      >
                        Matricular-se Online <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card border border-border/70 rounded-3xl p-10 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="font-display font-bold text-lg">Nenhum plano cadastrado no momento</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Esta academia ainda está configurando seus planos de matrícula online. Você também pode adquirir um Day Pass avulso para treinar hoje.
              </p>
              <Button variant="hero" onClick={handleDayPassClick} className="rounded-xl font-bold">
                <Zap className="w-4 h-4 mr-1.5" /> Garantir Day Pass Avulso
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ABA 2: DAY PASS (TREINO AVULSO FINEX) */}
      {activeTab === 'daypass' && (
        <div className="bg-gradient-to-br from-card via-card to-secondary/10 border-2 border-secondary/40 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-secondary text-secondary-foreground shadow">
                <Zap className="w-3.5 h-3.5 fill-current" /> Treino Avulso Sem Contrato
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-foreground">
                Day Pass Conexão Fitness
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Quer treinar hoje sem fazer matrícula ou pagar mensalidade? Adquira a diária avulsa com desconto direto na carteira Finex e apresente seu QR Code na catraca para liberação imediata.
              </p>
            </div>

            <div className="text-center md:text-right shrink-0 bg-card/80 p-5 rounded-2xl border border-border/60">
              <p className="text-xs text-muted-foreground font-semibold">Valor da Diária</p>
              <div className="text-3xl sm:text-4xl font-black text-secondary">{formatBRL(dayPassPrice)}</div>
              <p className="text-[11px] text-emerald-500 font-bold mt-0.5">Acesso 1 dia inteiro</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/50">
            <div className="flex items-start gap-3 bg-muted/40 p-4 rounded-2xl">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                1
              </div>
              <div>
                <p className="font-bold text-xs text-foreground">Garantir Passe</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Pague com seu saldo da Carteira Finex ou via Pix/Cartão.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-muted/40 p-4 rounded-2xl">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                2
              </div>
              <div>
                <p className="font-bold text-xs text-foreground">Apresentar QR Code</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Abra o aplicativo e aponte o QR Code do Passe na câmera da catraca.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-muted/40 p-4 rounded-2xl">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                3
              </div>
              <div>
                <p className="font-bold text-xs text-foreground">Bom Treino!</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Acesso liberado instantaneamente a todas as dependências.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 text-center md:text-left">
            <Button
              variant="hero"
              size="lg"
              onClick={handleDayPassClick}
              className="h-12 px-8 rounded-2xl font-extrabold text-sm shadow-glow bg-gradient-to-r from-secondary to-primary text-black"
            >
              <Zap className="w-4 h-4 mr-2 fill-black" /> Garantir Day Pass Agora ({formatBRL(dayPassPrice)})
            </Button>
          </div>
        </div>
      )}

      {/* ABA 3: FOTOS & ESTRUTURA */}
      {activeTab === 'structure' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display font-extrabold text-xl sm:text-2xl text-foreground">
              Estrutura & Instalações
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Conheça os aparelhos, salas de aula, área cardio e vestiários da academia.
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
                  alt={`Estrutura ${i + 1}`}
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

      {/* ABA 4: COMODIDADES & MODALIDADES */}
      {activeTab === 'amenities' && (
        <div className="space-y-8">
          {/* Comodidades */}
          <div className="space-y-4">
            <h2 className="font-display font-extrabold text-xl text-foreground">
              Comodidades & Infraestrutura
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {facilities.map((fac, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/70 hover:border-primary/40 transition-colors shadow-sm"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-foreground">{fac}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Modalidades */}
          <div className="space-y-4 pt-4 border-t border-border/60">
            <h2 className="font-display font-extrabold text-xl text-foreground">
              Modalidades & Aulas Oferecidas
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {modalities.map((mod, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 text-foreground font-bold text-xs sm:text-sm shadow-sm"
                >
                  <Dumbbell className="w-4 h-4 text-primary" /> {mod}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA 5: FEED & POSTAGENS */}
      {activeTab === 'posts' && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div>
            <h2 className="font-display font-extrabold text-xl text-foreground">
              Publicações & Novidades da Academia
            </h2>
            <p className="text-xs text-muted-foreground">
              Avisos, dicas de treino e novidades postadas pela equipe da academia.
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
              Baseado em {profile.totalReviews || 18} avaliações de alunos que treinam nesta academia.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Lucas Silveira', text: 'Estrutura sensacional, aparelhos novíssimos e os vestiários são impecáveis!', rating: 5, date: 'Há 2 dias' },
              { name: 'Mariana Costa', text: 'Melhor academia da região. As aulas de Spinning e Pilates são excelentes.', rating: 5, date: 'Há 1 semana' },
              { name: 'Rodrigo Alves', text: 'A liberação por QR Code na catraca é muito rápida e prática!', rating: 5, date: 'Há 2 semanas' },
            ].map((rev, i) => (
              <div key={i} className="bg-card border border-border/60 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground">{rev.name}</span>
                  <span className="text-[10px] text-muted-foreground">{rev.date}</span>
                </div>
                <div className="flex items-center text-yellow-500 gap-0.5">
                  {[...Array(rev.rating)].map((_, s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{rev.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL PARA FOTOS */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/20 text-white hover:bg-white/40"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Foto ampliada"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}

      {/* MODAL DE CHECKOUT DE MATRÍCULA ONLINE */}
      {selectedPlanForEnrollment && (
        <EnrollmentModal
          open={!!selectedPlanForEnrollment}
          onOpenChange={(open) => {
            if (!open) setSelectedPlanForEnrollment(null);
          }}
          plan={selectedPlanForEnrollment}
          academiaName={gymName}
          onSuccess={(enrollment) => {
            setSelectedPlanForEnrollment(null);
            setCreatedEnrollmentForPass(enrollment);
          }}
        />
      )}

      {/* MODAL DO PASSE DIGITAL GERADO */}
      {createdEnrollmentForPass && (
        <StudentAccessPassModal
          open={!!createdEnrollmentForPass}
          onOpenChange={(open) => {
            if (!open) setCreatedEnrollmentForPass(null);
          }}
          enrollment={createdEnrollmentForPass}
        />
      )}
    </div>
  );
};
