import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Dumbbell,
  Star,
  MapPin,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { listServices } from "@/services/services";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { formatBRL } from "@/lib/format";

interface FeaturedSpotlightProps {
  searchQuery?: string;
  onClearSearch?: () => void;
}

// Academias de demonstração/fallback para garantir carrossel dinâmico rico
const DEFAULT_GYMS = [
  {
    id: "gym-default-1",
    providerId: "gym-iron-peak",
    name: "Academia Iron Peak Finex",
    providerName: "Academia Iron Peak Finex",
    city: "Uruguaiana - RS",
    description: "Acesso total durante 1 dia completo a todas as áreas da academia através da catraca digital com QR Code no App.",
    price: 25.0,
    providerRating: 4.9,
    providerAvatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop",
  },
  {
    id: "gym-default-2",
    providerId: "gym-prime-arena",
    name: "Conexão Fitness Prime & Arena",
    providerName: "Conexão Fitness Prime & Arena",
    city: "Uruguaiana - RS",
    description: "Musculação avançada, área funcional, spinning climatizado e vestiários completos com armários digitais.",
    price: 30.0,
    providerRating: 5.0,
    providerAvatar: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop",
  },
  {
    id: "gym-default-3",
    providerId: "gym-estudio-core",
    name: "Estúdio Funcional & Pilates Core",
    providerName: "Estúdio Funcional & Pilates Core",
    city: "Uruguaiana - RS",
    description: "Treinamento funcional individualizado e em pequenos grupos, foco em mobilidade, postura e condicionamento físico.",
    price: 35.0,
    providerRating: 4.8,
    providerAvatar: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop",
  },
];

// Profissionais de demonstração/fallback para garantir carrossel dinâmico rico
const DEFAULT_PROS = [
  {
    id: "pro-default-1",
    providerId: "pro-diego",
    name: "Diego Martins",
    providerName: "Diego Martins",
    professionTitle: "Personal Trainer • CREF 049821-G/RS",
    city: "Uruguaiana - RS",
    description: "Especialista em hipertrofia rápida, emagrecimento sustentável e biomecânica do movimento. Consultoria presencial e online.",
    price: 80.0,
    providerRating: 5.0,
    providerAvatar: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&auto=format&fit=crop",
  },
  {
    id: "pro-default-2",
    providerId: "pro-camila",
    name: "Dra. Camila Alencar",
    providerName: "Dra. Camila Alencar",
    professionTitle: "Nutricionista Esportiva • CRN-2 98765",
    city: "Uruguaiana - RS",
    description: "Planos alimentares sob medida para ganho de massa magra, redução de gordura e alto rendimento sem dietas restritivas.",
    price: 140.0,
    providerRating: 5.0,
    providerAvatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "pro-default-3",
    providerId: "pro-rodrigo",
    name: "Dr. Rodrigo Mendes",
    providerName: "Dr. Rodrigo Mendes",
    professionTitle: "Fisioterapeuta & Reabilitação • CREFITO 8921",
    city: "Uruguaiana - RS",
    description: "Prevenção e reabilitação de lesões osteomusculares, liberação miofascial e retorno seguro aos treinos de alta carga.",
    price: 95.0,
    providerRating: 4.9,
    providerAvatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop",
  },
];

export const FeaturedSpotlight: React.FC<FeaturedSpotlightProps> = ({ searchQuery = "", onClearSearch }) => {
  const { data: services, isLoading } = useQuery({
    queryKey: ["featured-services"],
    queryFn: () => listServices(),
    staleTime: 1000 * 60 * 3,
  });

  const allServices = services || [];
  const cleanQuery = searchQuery.trim().toLowerCase();

  const filteredServices = cleanQuery
    ? allServices.filter((s) => {
        return (
          s.name?.toLowerCase().includes(cleanQuery) ||
          s.description?.toLowerCase().includes(cleanQuery) ||
          s.providerName?.toLowerCase().includes(cleanQuery) ||
          s.city?.toLowerCase().includes(cleanQuery) ||
          s.locationCity?.toLowerCase().includes(cleanQuery) ||
          s.locationName?.toLowerCase().includes(cleanQuery) ||
          s.modality?.toLowerCase().includes(cleanQuery) ||
          s.professionTitle?.toLowerCase().includes(cleanQuery)
        );
      })
    : allServices;

  const rawGymServices = filteredServices.filter((s) => s.providerType === "ACADEMIA");
  const rawProServices = filteredServices.filter((s) => s.providerType === "PERSONAL");

  // Se estiver buscando e não houver resultado, respeita a busca vazia. Se for navegação normal, usa fallback para garantir auto-scroll
  const displayGyms = cleanQuery
    ? rawGymServices
    : rawGymServices.length >= 2
    ? rawGymServices
    : [...rawGymServices, ...DEFAULT_GYMS].slice(0, 5);

  const displayPros = cleanQuery
    ? rawProServices
    : rawProServices.length >= 2
    ? rawProServices
    : [...rawProServices, ...DEFAULT_PROS].slice(0, 5);

  // Estados dos carrosséis com rolagem automática
  const [gymIndex, setGymIndex] = useState(0);
  const [gymPaused, setGymPaused] = useState(false);

  const [proIndex, setProIndex] = useState(0);
  const [proPaused, setProPaused] = useState(false);

  // Touch handlers para swipe no mobile
  const gymTouchStart = useRef<number | null>(null);
  const proTouchStart = useRef<number | null>(null);

  // Auto-scroll Academias (a cada 4s)
  useEffect(() => {
    if (gymPaused || displayGyms.length <= 1) return;
    const interval = setInterval(() => {
      setGymIndex((prev) => (prev + 1) % displayGyms.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [gymPaused, displayGyms.length]);

  // Auto-scroll Profissionais (a cada 4.5s - leve descompasso intencional para fluidez orgânica)
  useEffect(() => {
    if (proPaused || displayPros.length <= 1) return;
    const interval = setInterval(() => {
      setProIndex((prev) => (prev + 1) % displayPros.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [proPaused, displayPros.length]);

  // Se a lista mudar de tamanho, reajusta índices
  useEffect(() => {
    if (gymIndex >= displayGyms.length && displayGyms.length > 0) {
      setGymIndex(0);
    }
  }, [displayGyms.length, gymIndex]);

  useEffect(() => {
    if (proIndex >= displayPros.length && displayPros.length > 0) {
      setProIndex(0);
    }
  }, [displayPros.length, proIndex]);

  const prevGym = () => {
    setGymIndex((prev) => (prev - 1 + displayGyms.length) % displayGyms.length);
  };
  const nextGym = () => {
    setGymIndex((prev) => (prev + 1) % displayGyms.length);
  };

  const prevPro = () => {
    setProIndex((prev) => (prev - 1 + displayPros.length) % displayPros.length);
  };
  const nextPro = () => {
    setProIndex((prev) => (prev + 1) % displayPros.length);
  };

  return (
    <div className="space-y-6 mb-8">
      {/* AVISO DE FILTRO ATIVO SE ESTIVER BUSCANDO */}
      {cleanQuery && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 px-4 rounded-2xl bg-primary/10 border border-primary/25 text-xs text-foreground shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span>
              Filtrando destaques por: <strong className="text-primary font-bold">"{searchQuery}"</strong> ({filteredServices.length} {filteredServices.length === 1 ? "resultado encontrado" : "resultados encontrados"})
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={`/buscar?q=${encodeURIComponent(searchQuery)}`}
              className="text-primary hover:underline font-bold text-xs flex items-center gap-1 no-underline"
            >
              Ver no catálogo completo <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            {onClearSearch && (
              <button
                type="button"
                onClick={onClearSearch}
                className="text-muted-foreground hover:text-foreground text-xs font-semibold underline ml-2 cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      )}

      {/* GRADE COM DOIS CARDS DO MESMO TAMANHO LADO A LADO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* ========================================================================= */}
        {/* CARD 1 (ESQUERDA): ACADEMIAS E ESTÚDIOS EM DESTAQUE (ROLAGEM AUTOMÁTICA) */}
        {/* ========================================================================= */}
        <div
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card/95 to-primary/5 border border-primary/20 p-5 sm:p-6 shadow-sm flex flex-col justify-between group hover:border-primary/40 transition-all duration-300"
          onMouseEnter={() => setGymPaused(true)}
          onMouseLeave={() => setGymPaused(false)}
          onTouchStart={(e) => {
            setGymPaused(true);
            gymTouchStart.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            setGymPaused(false);
            if (gymTouchStart.current !== null) {
              const diff = gymTouchStart.current - e.changedTouches[0].clientX;
              if (diff > 50) nextGym();
              else if (diff < -50) prevGym();
              gymTouchStart.current = null;
            }
          }}
        >
          <div className="relative z-10 flex flex-col h-full space-y-4">
            {/* 1. CABEÇALHO DO CARD */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-extrabold tracking-wide shadow-sm">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  <span>ACADEMIAS & ESTÚDIOS</span>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                  <Sparkles className="h-3 w-3" /> Day Pass & Treinos
                </span>
              </div>

              <div className="flex items-center gap-1">
                {displayGyms.length > 1 && (
                  <div className="flex items-center gap-1 mr-1">
                    <button
                      type="button"
                      onClick={prevGym}
                      aria-label="Academia anterior"
                      className="h-7 w-7 rounded-lg bg-background/80 hover:bg-muted border border-border/60 flex items-center justify-center text-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextGym}
                      aria-label="Próxima academia"
                      className="h-7 w-7 rounded-lg bg-background/80 hover:bg-muted border border-border/60 flex items-center justify-center text-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <Link
                  to="/buscar?providerType=ACADEMIA"
                  className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors no-underline"
                >
                  Ver todas <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 2. ÁREA DESLIZANTE DO CARROSSEL COM ROLAGEM AUTOMÁTICA */}
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm flex-1 min-h-[300px] flex flex-col justify-between">
              {displayGyms.length > 0 ? (
                <div className="relative overflow-hidden w-full h-full flex flex-col">
                  {/* Container deslizante */}
                  <div
                    className="flex transition-transform duration-500 ease-in-out h-full"
                    style={{ transform: `translateX(-${gymIndex * 100}%)` }}
                  >
                    {displayGyms.map((gym, idx) => (
                      <div
                        key={`${gym.id}-${idx}`}
                        className="w-full shrink-0 flex flex-col justify-between h-full"
                      >
                        {/* Imagem de Capa e Título clicáveis para busca de academias */}
                        <Link
                          to="/buscar?providerType=ACADEMIA"
                          className="relative h-36 sm:h-40 w-full overflow-hidden bg-muted block group/img no-underline hover:no-underline cursor-pointer"
                        >
                          <img
                            src={
                              resolveMediaUrl(gym.providerAvatar) ||
                              "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop"
                            }
                            alt={gym.providerName || gym.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop";
                            }}
                            className="h-full w-full object-cover group-hover/img:scale-105 transition-transform duration-700"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                          <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-bold text-white text-base drop-shadow-sm truncate leading-tight group-hover/img:text-primary transition-colors no-underline">
                                {gym.providerName || gym.name}
                              </h3>
                              <div className="flex items-center gap-1 text-[11px] text-white/90 mt-0.5">
                                <MapPin className="h-3 w-3 text-primary shrink-0" />
                                <span className="truncate">{gym.city || "Uruguaiana - RS"}</span>
                              </div>
                            </div>
                            {gym.providerRating && (
                              <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-bold text-amber-400 border border-amber-400/20 shrink-0">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {Number(gym.providerRating).toFixed(1)}
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Conteúdo & Ações */}
                        <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {gym.description || "Acesso completo à estrutura com catraca digital inteligente via QR Code no App."}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <div>
                              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                                Day Pass / Treino
                              </span>
                              <span className="text-base sm:text-lg font-black text-primary no-underline">
                                {formatBRL(Number(gym.price) || 25.0)}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              className="h-9 text-xs font-bold px-4 gap-1.5 shadow-sm rounded-xl cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground no-underline hover:no-underline"
                              asChild
                            >
                              <Link to="/buscar?providerType=ACADEMIA" className="no-underline hover:no-underline">
                                Conhecer Academia & Planos
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Indicadores de Paginação (Dots) */}
                  {displayGyms.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 pb-2.5">
                      {displayGyms.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setGymIndex(i)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            gymIndex === i ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                          }`}
                          aria-label={`Slide ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center space-y-2 my-auto">
                  <Building2 className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-xs font-semibold text-foreground">Nenhuma academia encontrada</p>
                  <p className="text-[11px] text-muted-foreground">Tente alterar o termo de busca no catálogo.</p>
                </div>
              )}
            </div>

            {/* 3. RODAPÉ DO CARD: SEM LINKS NO CANTO INFERIOR DIREITO */}
            <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2 text-xs">
              <span className="text-[11px] text-muted-foreground truncate">
                Rolagem automática • Passe o mouse para pausar
              </span>
            </div>
          </div>

          {/* EFEITO DECORATIVO DE FUNDO */}
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* ========================================================================= */}
        {/* CARD 2 (DIREITA): PROFISSIONAIS EM DESTAQUE (ROLAGEM AUTOMÁTICA)           */}
        {/* ========================================================================= */}
        <div
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card/95 to-emerald-500/5 border border-emerald-500/25 p-5 sm:p-6 shadow-sm flex flex-col justify-between group hover:border-emerald-500/40 transition-all duration-300"
          onMouseEnter={() => setProPaused(true)}
          onMouseLeave={() => setProPaused(false)}
          onTouchStart={(e) => {
            setProPaused(true);
            proTouchStart.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            setProPaused(false);
            if (proTouchStart.current !== null) {
              const diff = proTouchStart.current - e.changedTouches[0].clientX;
              if (diff > 50) nextPro();
              else if (diff < -50) prevPro();
              proTouchStart.current = null;
            }
          }}
        >
          <div className="relative z-10 flex flex-col h-full space-y-4">
            {/* 1. CABEÇALHO DO CARD */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold tracking-wide shadow-sm">
                  <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
                  <span>PROFISSIONAIS EM DESTAQUE</span>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3" /> Verificados
                </span>
              </div>

              <div className="flex items-center gap-1">
                {displayPros.length > 1 && (
                  <div className="flex items-center gap-1 mr-1">
                    <button
                      type="button"
                      onClick={prevPro}
                      aria-label="Profissional anterior"
                      className="h-7 w-7 rounded-lg bg-background/80 hover:bg-muted border border-border/60 flex items-center justify-center text-foreground hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextPro}
                      aria-label="Próximo profissional"
                      className="h-7 w-7 rounded-lg bg-background/80 hover:bg-muted border border-border/60 flex items-center justify-center text-foreground hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <Link
                  to="/buscar?providerType=PERSONAL"
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 transition-colors no-underline"
                >
                  Ver todos <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 2. ÁREA DESLIZANTE DO CARROSSEL COM ROLAGEM AUTOMÁTICA */}
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm flex-1 min-h-[300px] flex flex-col justify-between">
              {displayPros.length > 0 ? (
                <div className="relative overflow-hidden w-full h-full flex flex-col">
                  {/* Container deslizante */}
                  <div
                    className="flex transition-transform duration-500 ease-in-out h-full"
                    style={{ transform: `translateX(-${proIndex * 100}%)` }}
                  >
                    {displayPros.map((pro, idx) => (
                      <div
                        key={`${pro.id}-${idx}`}
                        className="w-full shrink-0 flex flex-col justify-between h-full p-4 sm:p-5"
                      >
                        {/* Perfil & Identificação */}
                        <div className="flex items-start gap-4">
                          <Link
                            to="/buscar?providerType=PERSONAL"
                            className="relative shrink-0 block group/avatar cursor-pointer no-underline hover:no-underline"
                          >
                            <img
                              src={(() => {
                                const raw = resolveMediaUrl(pro.providerAvatar);
                                const isCam = (pro.providerName || pro.name || "").toLowerCase().includes("camila");
                                if (isCam && (!raw || raw.includes("1594824813"))) {
                                  return "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop";
                                }
                                return (
                                  raw ||
                                  (isCam
                                    ? "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop"
                                    : "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&auto=format&fit=crop")
                                );
                              })()}
                              alt={pro.providerName || pro.name}
                              onError={(e) => {
                                const isCam = (pro.providerName || pro.name || "").toLowerCase().includes("camila");
                                (e.target as HTMLImageElement).src = isCam
                                  ? "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop"
                                  : "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&auto=format&fit=crop";
                              }}
                              className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover ring-2 ring-emerald-500/40 group-hover/avatar:ring-emerald-400 group-hover/avatar:scale-105 transition-all shadow-md"
                              loading="lazy"
                            />
                            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-sm">
                              <ShieldCheck className="h-3.5 w-3.5" />
                            </span>
                          </Link>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <Link
                                to="/buscar?providerType=PERSONAL"
                                className="font-bold text-base sm:text-lg text-foreground truncate hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors no-underline hover:no-underline cursor-pointer block"
                              >
                                {pro.providerName || pro.name}
                              </Link>
                              {pro.providerRating && (
                                <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md text-[11px] font-bold text-amber-500 border border-amber-500/20 shrink-0">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  {Number(pro.providerRating).toFixed(1)}
                                </div>
                              )}
                            </div>

                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
                              {pro.professionTitle || pro.modality || "Personal Trainer Certificado"}
                            </p>

                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
                              <span className="truncate">{pro.city || "Uruguaiana - RS"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Bio / Descrição */}
                        <div className="py-2.5 my-auto">
                          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                            {pro.description || "Prescrição individualizada de treinos e acompanhamento contínuo no App Conexão Fitness."}
                          </p>
                        </div>

                        {/* Preço e Botão de Ação */}
                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                          <div>
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                              Sessão / Consulta
                            </span>
                            <span className="text-base sm:text-lg font-black text-emerald-500 dark:text-emerald-400 no-underline">
                              {Number(pro.price) > 0 ? `${formatBRL(Number(pro.price))}` : "Planos no perfil"}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            className="h-9 text-xs font-bold px-4 gap-1.5 shadow-sm rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/30 no-underline hover:no-underline cursor-pointer"
                            asChild
                          >
                            <Link to="/buscar?providerType=PERSONAL" className="no-underline hover:no-underline flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" /> Explorar Profissionais
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Indicadores de Paginação (Dots) */}
                  {displayPros.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 pb-2.5">
                      {displayPros.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setProIndex(i)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            proIndex === i ? "w-5 bg-emerald-400" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                          }`}
                          aria-label={`Slide ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center space-y-2 my-auto">
                  <Dumbbell className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-xs font-semibold text-foreground">Nenhum profissional encontrado</p>
                  <p className="text-[11px] text-muted-foreground">Tente buscar por especialidade no catálogo.</p>
                </div>
              )}
            </div>

            {/* 3. RODAPÉ DO CARD: SEM LINKS NO CANTO INFERIOR DIREITO */}
            <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2 text-xs">
              <span className="text-[11px] text-muted-foreground truncate">
                Rolagem automática • Passe o mouse para pausar
              </span>
            </div>
          </div>

          {/* EFEITO DECORATIVO DE FUNDO */}
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
