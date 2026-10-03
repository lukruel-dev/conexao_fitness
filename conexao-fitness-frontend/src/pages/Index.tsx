import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PlansSection from "@/components/PlansSection";
import { FeaturedSpotlight } from "@/components/feed/FeaturedSpotlight";
import { CreatePostCard } from "@/components/feed/CreatePostCard";
import { PostCard } from "@/components/feed/PostCard";
import { FeedSidebar } from "@/components/feed/FeedSidebar";
import { listPosts } from "@/services/posts";
import { listServices } from "@/services/services";
import { formatBRL } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import socialFinexOfficialLogo from "@/assets/social_finex_logo_official.png";
import {
  Flame,
  Users,
  Search,
  Sparkles,
  RefreshCw,
  Loader2,
  Dumbbell,
  Filter,
  X,
  PlusCircle,
  MessageSquare,
  Building2,
  Utensils,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  QrCode,
  CreditCard,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import type { Post } from "@/types/community";

const CATEGORY_FILTERS = [
  { id: "Todos", label: "🌟 Todos os Posts" },
  { id: "Treino", label: "🏋️ Treinos & Rotinas" },
  { id: "Dieta", label: "🥗 Dieta & Nutrição" },
  { id: "Evolução", label: "🔥 Evolução & Foco" },
  { id: "Dúvidas", label: "❓ Perguntas & Dúvidas" },
];

interface AppPromo {
  id: string;
  badge: string;
  badgeIcon: React.ElementType;
  titlePrefix: string;
  titleHighlight: string;
  description: string;
  pill1: { icon: React.ElementType; title: string; subtitle: string };
  pill2: { icon: React.ElementType; title: string; subtitle: string };
  ctaText: string;
  ctaLink: string;
  accentGradient: string;
}

const APP_PROMOS: AppPromo[] = [
  {
    id: "catraca-daypass",
    badge: "CATRACA DIGITAL & PORTARIA",
    badgeIcon: QrCode,
    titlePrefix: "Acesso Inteligente na Portaria com ",
    titleHighlight: "Catraca Digital & QR Code",
    description:
      "Chega de filas e fichas de papel. Entre nas academias parceiras liberando a catraca com seu QR Code instantâneo e treine com Day Pass avulso sem fidelidade.",
    pill1: {
      icon: QrCode,
      title: "Catraca Inteligente",
      subtitle: "Leitura instantânea em totens",
    },
    pill2: {
      icon: Building2,
      title: "Day Pass Avulso",
      subtitle: "Treine quando e onde quiser",
    },
    ctaText: "Ver Academias & Day Pass",
    ctaLink: "/buscar?providerType=ACADEMIA",
    accentGradient: "from-sky-400 via-primary to-cyan-300",
  },
  {
    id: "treinos-performance",
    badge: "FICHAS DE TREINO INTELIGENTES",
    badgeIcon: Dumbbell,
    titlePrefix: "Treinos Prescritos no Celular com ",
    titleHighlight: "Cargas, Séries e Descanso",
    description:
      "Tenha suas rotinas de treino A/B/C/D organizadas pelo seu Personal, com contagem de séries, histórico de cargas e cronômetro de descanso em tempo real.",
    pill1: {
      icon: Dumbbell,
      title: "Fichas A/B/C/D",
      subtitle: "Prescrição completa do seu instrutor",
    },
    pill2: {
      icon: Flame,
      title: "Histórico de Carga",
      subtitle: "Acompanhe sua evolução treino a treino",
    },
    ctaText: "Conhecer Personal Trainers",
    ctaLink: "/buscar?providerType=PERSONAL&modality=Personal",
    accentGradient: "from-primary via-cyan-400 to-emerald-400",
  },
  {
    id: "nutricao-dietas",
    badge: "PLANOS ALIMENTARES & NUTRIÇÃO",
    badgeIcon: Utensils,
    titlePrefix: "Nutrição de Alta Precisão com ",
    titleHighlight: "Nutricionistas Credenciados",
    description:
      "Planos alimentares sob medida para ganho de massa, definição ou emagrecimento saudável, com cálculo de macros prescritos por especialistas com CRN.",
    pill1: {
      icon: Utensils,
      title: "Dieta & Macros",
      subtitle: "Metas calóricas para o seu objetivo",
    },
    pill2: {
      icon: ShieldCheck,
      title: "Profissionais CRN",
      subtitle: "Atendimento presencial e online",
    },
    ctaText: "Consultar Nutricionistas",
    ctaLink: "/buscar?providerType=PERSONAL&modality=Nutri",
    accentGradient: "from-emerald-400 via-teal-300 to-cyan-400",
  },
  {
    id: "carteira-cashback",
    badge: "CARTEIRA DIGITAL & BENEFÍCIOS",
    badgeIcon: CreditCard,
    titlePrefix: "Pague com 1 Toque e Acumule ",
    titleHighlight: "Cashback & Pontos Fitness",
    description:
      "Recarregue saldo via PIX ou cartão na sua Carteira Finex, pague mensalidades e treinos avulsos instantaneamente e garanta vantagens exclusivas.",
    pill1: {
      icon: CreditCard,
      title: "Saldo Digital Seguro",
      subtitle: "Pagamentos em 1 clique sem burocracia",
    },
    pill2: {
      icon: Sparkles,
      title: "Pontos & Recompensas",
      subtitle: "Quanto mais você treina, mais ganha",
    },
    ctaText: "Conhecer Minha Carteira",
    ctaLink: "/carteira",
    accentGradient: "from-amber-400 via-orange-400 to-primary",
  },
  {
    id: "agendamento-online",
    badge: "AGENDA 24H EM TEMPO REAL",
    badgeIcon: Calendar,
    titlePrefix: "Agende Sessões com Especialistas ",
    titleHighlight: "Sem Esperar no Chat",
    description:
      "Consulte os horários disponíveis em tempo real de personais, nutricionistas e fisioterapeutas, agendando sessões presenciais ou online com confirmação imediata.",
    pill1: {
      icon: Calendar,
      title: "Agenda Aberta 24/7",
      subtitle: "Escolha o dia e horário perfeito",
    },
    pill2: {
      icon: Users,
      title: "Presencial & Online",
      subtitle: "Flexibilidade total para sua rotina",
    },
    ctaText: "Explorar Catálogo Completo",
    ctaLink: "/buscar",
    accentGradient: "from-cyan-400 via-sky-400 to-indigo-400",
  },
];

const Index: React.FC = () => {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [activeFeedTab, setActiveFeedTab] = useState<"explore" | "following">("explore");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [activeTag, setActiveTag] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados da propaganda rotativa das funcionalidades
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [isPromoPaused, setIsPromoPaused] = useState(false);

  // Estados do carrossel do Card 2 (Social FINEX) - 2 tomadas (0: Imagem 3D, 1: Detalhes & Comunidade)
  const [socialSlideIndex, setSocialSlideIndex] = useState(0);
  const [isSocialPaused, setIsSocialPaused] = useState(false);

  // Auto-play do card de propagandas das funcionalidades (a cada 4.8s)
  useEffect(() => {
    if (isPromoPaused || isDropdownOpen || searchQuery.trim().length > 0) return;
    const timer = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % APP_PROMOS.length);
    }, 4800);
    return () => clearInterval(timer);
  }, [isPromoPaused, isDropdownOpen, searchQuery]);

  const prevPromo = () => {
    setCurrentPromoIndex((prev) => (prev - 1 + APP_PROMOS.length) % APP_PROMOS.length);
  };
  const nextPromo = () => {
    setCurrentPromoIndex((prev) => (prev + 1) % APP_PROMOS.length);
  };

  // Auto-play do card Social FINEX (alterna as 2 tomadas a cada 5s)
  useEffect(() => {
    if (isSocialPaused) return;
    const timer = setInterval(() => {
      setSocialSlideIndex((prev) => (prev === 0 ? 1 : 0));
    }, 5000);
    return () => clearInterval(timer);
  }, [isSocialPaused]);

  const prevSocialSlide = () => {
    setSocialSlideIndex((prev) => (prev === 0 ? 1 : 0));
  };
  const nextSocialSlide = () => {
    setSocialSlideIndex((prev) => (prev === 0 ? 1 : 0));
  };
  const toggleSocialSlide = () => {
    setSocialSlideIndex((prev) => (prev === 0 ? 1 : 0));
  };

  // Carrega catálogo para busca instantânea / preview na barra de pesquisa
  const { data: allServices = [] } = useQuery({
    queryKey: ["featured-services"],
    queryFn: () => listServices(),
    staleTime: 1000 * 60 * 3,
  });

  // Fecha o dropdown flutuante ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const queryLower = searchQuery.trim().toLowerCase();

  const matchingGyms = queryLower
    ? allServices
        .filter(
          (s) =>
            s.providerType === "ACADEMIA" &&
            (s.name?.toLowerCase().includes(queryLower) ||
              s.providerName?.toLowerCase().includes(queryLower) ||
              s.city?.toLowerCase().includes(queryLower) ||
              s.locationCity?.toLowerCase().includes(queryLower) ||
              s.modality?.toLowerCase().includes(queryLower))
        )
        .slice(0, 3)
    : [];

  const matchingPros = queryLower
    ? allServices
        .filter(
          (s) =>
            s.providerType === "PERSONAL" &&
            (s.name?.toLowerCase().includes(queryLower) ||
              s.providerName?.toLowerCase().includes(queryLower) ||
              s.city?.toLowerCase().includes(queryLower) ||
              s.professionTitle?.toLowerCase().includes(queryLower) ||
              s.modality?.toLowerCase().includes(queryLower))
        )
        .slice(0, 3)
    : [];

  const matchingServices = queryLower
    ? allServices
        .filter(
          (s) =>
            (s.name?.toLowerCase().includes(queryLower) ||
              s.description?.toLowerCase().includes(queryLower) ||
              s.modality?.toLowerCase().includes(queryLower)) &&
            !matchingGyms.some((g) => g.id === s.id) &&
            !matchingPros.some((p) => p.id === s.id)
        )
        .slice(0, 3)
    : [];

  const hasAnyMatches =
    matchingGyms.length > 0 || matchingPros.length > 0 || matchingServices.length > 0;

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsDropdownOpen(false);
    if (searchQuery.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/buscar");
    }
  };

  const handleConnectSocial = () => {
    if (isAuthenticated) {
      const el = document.getElementById("comunidade");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        navigate("/#comunidade");
      }
    } else {
      navigate("/login?redirect=/#comunidade");
    }
  };

  const scrollToCommunity = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const el = document.getElementById("comunidade");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.hash = "comunidade";
    }
  };

  // Smooth scroll para âncoras se houver
  useEffect(() => {
    if (!hash) return;
    const id = hash.replace("#", "");
    const tryScroll = (attempt = 0) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (attempt < 10) {
        setTimeout(() => tryScroll(attempt + 1), 50);
      }
    };
    tryScroll();
  }, [hash]);

  // Carrega feed de posts
  const fetchFeed = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await listPosts({
        feed: activeFeedTab,
        category: selectedCategory !== "Todos" ? selectedCategory : undefined,
        tag: activeTag || undefined,
      });

      let filtered = res.items;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.content.toLowerCase().includes(q) ||
            p.author?.name?.toLowerCase().includes(q) ||
            p.tags?.some((t) => t.toLowerCase().includes(q))
        );
      }

      setPosts(filtered);
    } catch (err) {
      console.error("Erro ao buscar feed de postagens:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [activeFeedTab, selectedCategory, activeTag]);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (deletedId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  const handleTagClick = (tag: string) => {
    setActiveTag((prev) => (prev.toLowerCase() === tag.toLowerCase() ? "" : tag));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      <Header />

      <main className="flex-1 pt-28 sm:pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* SEÇÃO SUPERIOR: DOIS CARDS LADO A LADO COM CORES SUAVES & ELEGANTES */}
          <section className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* CARD 1: O SUPER APP FINEX - PROPAGANDAS ROTATIVAS DAS FUNCIONALIDADES & BUSCA */}
            <div
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card/95 to-primary/[0.05] border border-border/80 hover:border-primary/40 shadow-sm p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 group min-h-[420px] sm:min-h-[420px] lg:min-h-[430px]"
              onMouseEnter={() => setIsPromoPaused(true)}
              onMouseLeave={() => {
                if (!searchQuery) setIsPromoPaused(false);
              }}
            >
              <div className="relative z-10 flex flex-col h-full space-y-3.5 justify-between">
                {/* 1. PARTE SUPERIOR DO CARD: BADGE COMPLETO E CONTROLES DE SLIDE */}
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wide shadow-xs">
                    {React.createElement(APP_PROMOS[currentPromoIndex].badgeIcon, {
                      className: "h-3.5 w-3.5 text-primary shrink-0",
                    })}
                    <span className="whitespace-normal sm:whitespace-nowrap font-bold">
                      {APP_PROMOS[currentPromoIndex].badge}
                    </span>
                  </div>

                  {/* Controles manuais do carrossel de propaganda */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={prevPromo}
                      aria-label="Funcionalidade anterior"
                      className="h-8 w-8 rounded-lg bg-background/80 hover:bg-muted border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextPromo}
                      aria-label="Próxima funcionalidade"
                      className="h-8 w-8 rounded-lg bg-background/80 hover:bg-muted border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* 2. LOGO ABAIXO: CAMPO DE BUSCA COM BOTÃO INTEGRADO */}
                <div ref={searchContainerRef} className="relative w-full">
                  <form
                    id="hero-search-form"
                    onSubmit={handleSearchSubmit}
                    className="w-full flex items-center gap-2"
                  >
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar personais, academias, treinos..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => {
                          setIsDropdownOpen(true);
                          setIsPromoPaused(true);
                          if (window.scrollY < 200) {
                            window.scrollTo({ top: 0, behavior: "instant" });
                          }
                        }}
                        onBlur={() => {
                          if (!searchQuery) setIsPromoPaused(false);
                        }}
                        className="pl-10 pr-9 h-11 text-xs sm:text-sm rounded-xl bg-background/80 border-border/70 shadow-xs focus-visible:ring-primary/40 text-foreground"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setIsDropdownOpen(false);
                            fetchFeed();
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full cursor-pointer"
                          aria-label="Limpar campo de busca"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="h-11 w-24 sm:w-28 text-xs sm:text-sm font-bold tracking-normal gap-1.5 rounded-xl shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 cursor-pointer transition-all justify-center"
                    >
                      <Search className="h-3.5 w-3.5" /> Buscar
                    </Button>
                  </form>

                  {/* DROPDOWN FLUTUANTE DE RESULTADOS INSTANTÂNEOS */}
                  {isDropdownOpen && queryLower.length >= 1 && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/80 shadow-xl overflow-hidden animate-in fade-in-50 slide-in-from-top-2">
                      <div className="max-h-72 overflow-y-auto divide-y divide-border/40 p-2 text-xs">
                        {/* Academias */}
                        {matchingGyms.length > 0 && (
                          <div className="py-2 px-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 block mb-1">
                              🏢 Academias & Estúdios
                            </span>
                            {matchingGyms.map((gym) => (
                              <Link
                                key={gym.id}
                                to={`/perfil/${gym.providerId || gym.id}`}
                                onClick={() => setIsDropdownOpen(false)}
                                className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/70 transition-colors group cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <Building2 className="h-4 w-4" />
                                  </div>
                                  <div className="truncate">
                                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                      {gym.providerName || gym.name}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                      {gym.city || "Uruguaiana - RS"} • {gym.modality || "Day Pass & Musculação"}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-primary font-bold text-xs shrink-0 pl-2">
                                  {formatBRL(gym.price)}
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}

                        {/* Profissionais */}
                        {matchingPros.length > 0 && (
                          <div className="py-2 px-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 block mb-1">
                              🏋️‍♂️ Profissionais
                            </span>
                            {matchingPros.map((pro) => (
                              <Link
                                key={pro.id}
                                to={`/perfil/${pro.providerId || pro.id}`}
                                onClick={() => setIsDropdownOpen(false)}
                                className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/70 transition-colors group cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                    <Dumbbell className="h-4 w-4" />
                                  </div>
                                  <div className="truncate">
                                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                      {pro.providerName || pro.name}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                      {pro.professionTitle || pro.modality || "Profissional"} • {pro.city || "Uruguaiana - RS"}
                                    </p>
                                  </div>
                                </div>
                                {pro.price && pro.price > 0 ? (
                                  <span className="text-foreground font-semibold text-xs shrink-0 pl-2">
                                    {formatBRL(pro.price)} / sessão
                                  </span>
                                ) : (
                                  <span className="text-primary font-semibold text-xs shrink-0 pl-2">
                                    Ver perfil
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        )}

                        {/* Treinos & Serviços */}
                        {matchingServices.length > 0 && (
                          <div className="py-2 px-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 block mb-1">
                              ⚡ Treinos & Serviços
                            </span>
                            {matchingServices.map((svc) => (
                              <Link
                                key={svc.id}
                                to={`/servico/${svc.id}`}
                                onClick={() => setIsDropdownOpen(false)}
                                className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/70 transition-colors group cursor-pointer"
                              >
                                <div className="truncate">
                                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                    {svc.name}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {svc.modality}
                                  </p>
                                </div>
                                <span className="text-primary font-bold text-xs shrink-0 pl-2">
                                  {formatBRL(svc.price)}
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}

                        {!hasAnyMatches && (
                          <div className="p-4 text-center text-muted-foreground">
                            <p className="text-xs">
                              Pressione <strong>Enter</strong> ou clique em <strong>Buscar</strong> para pesquisar "<em>{searchQuery}</em>" no catálogo completo.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* BOTÃO VER TODOS */}
                      <div className="p-2.5 bg-muted/40 border-t border-border/50 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                          Catálogo completo com mapa e filtros
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSearchSubmit()}
                          className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          Ver todos os resultados <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. TÍTULO E APRESENTAÇÃO DA FUNCIONALIDADE EM PROPAGANDA ROTATIVA */}
                <div className="space-y-1.5 transition-all duration-300">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground leading-tight min-h-[56px] sm:min-h-[64px] flex items-center">
                    <span>
                      {APP_PROMOS[currentPromoIndex].titlePrefix}
                      <span className="text-primary">
                        {APP_PROMOS[currentPromoIndex].titleHighlight}
                      </span>
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 h-[38px] sm:h-[40px]">
                    {APP_PROMOS[currentPromoIndex].description}
                  </p>
                </div>

                {/* 4. RECURSOS EM DESTAQUE (2 PILLS MODERNAS E SUAVES) */}
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5 pt-0.5">
                  <div className="h-[56px] sm:h-[60px] p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-muted/40 border border-border/60 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-1.5 text-foreground font-bold text-xs mb-0.5 min-w-0">
                      {React.createElement(APP_PROMOS[currentPromoIndex].pill1.icon, {
                        className: "h-3.5 w-3.5 text-primary shrink-0",
                      })}
                      <span className="truncate">{APP_PROMOS[currentPromoIndex].pill1.title}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight truncate">
                      {APP_PROMOS[currentPromoIndex].pill1.subtitle}
                    </p>
                  </div>

                  <div className="h-[56px] sm:h-[60px] p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-muted/40 border border-border/60 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-1.5 text-foreground font-bold text-xs mb-0.5 min-w-0">
                      {React.createElement(APP_PROMOS[currentPromoIndex].pill2.icon, {
                        className: "h-3.5 w-3.5 text-primary shrink-0",
                      })}
                      <span className="truncate">{APP_PROMOS[currentPromoIndex].pill2.title}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight truncate">
                      {APP_PROMOS[currentPromoIndex].pill2.subtitle}
                    </p>
                  </div>
                </div>

                {/* 5. RODAPÉ COM INDICADORES (DOTS) + CTA DA PROPAGANDA */}
                <div className="pt-2.5 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs mt-auto">
                  {/* Dots de navegação das 5 propagandas rotativas */}
                  <div className="flex items-center gap-1.5">
                    {APP_PROMOS.map((promo, idx) => (
                      <button
                        key={promo.id}
                        type="button"
                        onClick={() => setCurrentPromoIndex(idx)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          currentPromoIndex === idx
                            ? "w-5 bg-primary"
                            : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                        }`}
                        aria-label={`Ver funcionalidade ${idx + 1}`}
                      />
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-1">
                      {currentPromoIndex + 1}/{APP_PROMOS.length}
                    </span>
                  </div>

                  {/* Botão de ação (CTA) para a funcionalidade ativa */}
                  <Link
                    to={APP_PROMOS[currentPromoIndex].ctaLink}
                    className="text-xs font-bold text-primary hover:opacity-80 flex items-center gap-1 cursor-pointer transition-colors no-underline group/cta"
                  >
                    <span>{APP_PROMOS[currentPromoIndex].ctaText}</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover/cta:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* ELEMENTO DECORATIVO SUAVE NO FUNDO */}
              <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* CARD 2: SOCIAL FINEX (REDE SOCIAL FITNESS) - CARROSSEL COM 2 TOMADAS (IMAGEM 3D & RECURSOS DA COMUNIDADE) */}
            <div
              onMouseEnter={() => setIsSocialPaused(true)}
              onMouseLeave={() => setIsSocialPaused(false)}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card/95 to-amber-500/[0.06] border border-border/80 hover:border-amber-500/40 p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 shadow-sm group min-h-[420px] sm:min-h-[420px] lg:min-h-[430px]"
            >
              <div className="relative z-10 flex flex-col h-full space-y-3.5 justify-between">
                {/* 1. PARTE SUPERIOR DO CARD: BADGE E SETINHAS (IDÊNTICO EM POSIÇÃO AO CARD 1) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold tracking-wide shadow-xs">
                    <Flame className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="whitespace-normal sm:whitespace-nowrap font-bold">REDE SOCIAL FITNESS</span>
                  </div>

                  {/* Controles manuais (setinhas) na mesma posição espacial do Card 1 */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={prevSocialSlide}
                      aria-label="Tomada anterior"
                      className="h-8 w-8 rounded-lg bg-background/80 hover:bg-muted border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextSocialSlide}
                      aria-label="Próxima tomada"
                      className="h-8 w-8 rounded-lg bg-background/80 hover:bg-muted border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* 2. CONTEÚDO EM CARROSSEL: TOMADA 0 (LOGO GIGANTE EM DESTAQUE COMO LINK) VS TOMADA 1 (LINHA DE CONEXÃO + TEXTOS ALINHADOS + PILLS) */}
                {socialSlideIndex === 0 ? (
                  /* TOMADA 1: APENAS O LOGO OFICIAL TRANSFORMADO EM LINK PARA O FEED & FÓRUM DA COMUNIDADE */
                  <div className="flex-1 flex flex-col items-center justify-center py-2 sm:py-3">
                    <a
                      href="#comunidade"
                      onClick={scrollToCommunity}
                      className="flex flex-col items-center justify-center w-full h-full cursor-pointer group/logo select-none no-underline transition-all duration-300 hover:scale-105 active:scale-95"
                      title="Acessar o Feed & Fórum da Comunidade"
                    >
                      <img
                        src={socialFinexOfficialLogo}
                        alt="Social FINEX - Feed & Fórum da Comunidade"
                        className="h-44 sm:h-52 md:h-56 lg:h-60 max-h-[220px] w-auto max-w-full object-contain drop-shadow-[0_12px_32px_rgba(245,158,11,0.25)]"
                      />
                    </a>
                  </div>
                ) : (
                  /* TOMADA 2: ELEMENTOS PARALELOS E PERFEITAMENTE SINCRONIZADOS COM O CARD 1 */
                  <>
                    {/* LINHA DE AÇÃO COM O BOTÃO CONECTAR NA MESMA POSIÇÃO ESPACIAL DO BOTÃO BUSCAR (LARGURA E ALTURA IDÊNTICAS) */}
                    <div className="w-full flex items-center gap-2">
                      <div className="relative flex-1 h-11 rounded-xl bg-background/80 border border-border/70 shadow-xs px-3.5 flex items-center gap-2 min-w-0 text-muted-foreground">
                        <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="truncate text-xs sm:text-sm font-medium text-foreground">
                          {isAuthenticated ? "Conectado ao ecossistema FINEX" : "Participe da rede oficial fitness"}
                        </span>
                      </div>

                      <Button
                        type="button"
                        onClick={handleConnectSocial}
                        className="h-11 w-24 sm:w-28 text-xs sm:text-sm font-bold tracking-normal gap-1.5 rounded-xl shadow-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shrink-0 cursor-pointer transition-all border-0 justify-center"
                      >
                        <Users className="h-3.5 w-3.5" /> Conectar
                      </Button>
                    </div>

                    {/* TÍTULO E FRASE RIGOROSAMENTE ALINHADOS COM OS TEXTOS DO CARD 1 */}
                    <div className="space-y-1.5 transition-all duration-300">
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground leading-tight min-h-[56px] sm:min-h-[64px] flex items-center">
                        <span>
                          Social <span className="text-amber-500 dark:text-amber-400">FINEX</span>: A Rede Social da Comunidade Fitness
                        </span>
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 h-[38px] sm:h-[40px]">
                        A rede social fitness feita para quem vive o estilo de vida saudável. Compartilhe sua evolução, tire dúvidas e conecte-se com alunos e profissionais.
                      </p>
                    </div>

                    {/* RECURSOS EM DESTAQUE (2 PILLS COM A MESMA ESTRUTURA E ALTURA DO CARD 1) */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5 pt-0.5">
                      <div className="h-[56px] sm:h-[60px] p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-muted/40 border border-border/60 flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-1.5 text-foreground font-bold text-xs mb-0.5 min-w-0">
                          <MessageSquare className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="truncate">Feed ao Vivo</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-tight truncate">
                          Postagens de treinos, fotos e rotinas
                        </p>
                      </div>

                      <div className="h-[56px] sm:h-[60px] p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-muted/40 border border-border/60 flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-1.5 text-foreground font-bold text-xs mb-0.5 min-w-0">
                          <Flame className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                          <span className="truncate">Comunidade</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-tight truncate">
                          Interação com alunos e personais
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* 3. RODAPÉ COM INDICADORES DAS 2 TOMADAS + REDIRECIONAMENTO */}
                <div className="pt-2.5 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs mt-auto">
                  {/* Dots de navegação das 2 tomadas */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSocialSlideIndex(0)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        socialSlideIndex === 0
                          ? "w-5 bg-amber-500"
                          : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                      }`}
                      aria-label="Tomada 1: Imagem Oficial Social FINEX"
                    />
                    <button
                      type="button"
                      onClick={() => setSocialSlideIndex(1)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        socialSlideIndex === 1
                          ? "w-5 bg-amber-500"
                          : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                      }`}
                      aria-label="Tomada 2: Recursos da Comunidade"
                    />
                    <span className="text-[10px] text-muted-foreground ml-1">
                      {socialSlideIndex + 1}/2
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={scrollToCommunity}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:opacity-80 flex items-center gap-1 cursor-pointer transition-colors no-underline"
                  >
                    <span>Ir para o Feed da Comunidade</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* ELEMENTO DECORATIVO SUAVE NO FUNDO */}
              <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            </div>
          </section>

          {/* 🌟 DESTAQUES DE ACADEMIAS & PROFISSIONAIS (MANTIDOS E ENRIQUECIDOS) */}
          <FeaturedSpotlight
            searchQuery={searchQuery}
            onClearSearch={() => {
              setSearchQuery("");
              fetchFeed();
            }}
          />

          {/* 💬 PAINEL DE INTERAÇÕES: FEED SOCIAL & FÓRUM FITNESS */}
          <section id="comunidade" className="space-y-6">
            {/* CABEÇALHO DO FEED COM NAVEGAÇÃO ENTRE ABAS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    Feed & Fórum da Comunidade
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Troca de treinos, dúvidas e evoluções em tempo real
                  </p>
                </div>
              </div>

              {/* ABAS DO FEED: "🔥 EXPLORAR" vs "👥 SEGUINDO" */}
              <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl border border-border/60 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveFeedTab("explore")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeFeedTab === "explore"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Flame className="h-3.5 w-3.5" /> Explorar / Todos
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFeedTab("following")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeFeedTab === "following"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" /> Seguindo
                </button>
              </div>
            </div>

            {/* PÍLULAS DE FILTRO POR CATEGORIA & TAG ATIVA - EM FLEX-WRAP SEM ROLAGEM LATERAL */}
            <div className="flex flex-wrap items-center gap-2 pb-1">
              {CATEGORY_FILTERS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all border ${
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card border-border/70 text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {cat.label}
                </button>
              ))}

              {activeTag && (
                <div className="flex items-center gap-1 bg-primary/15 text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-primary/30 shrink-0">
                  <span>Tag: {activeTag}</span>
                  <button
                    type="button"
                    onClick={() => setActiveTag("")}
                    className="hover:text-destructive transition-colors ml-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* GRID PRINCIPAL: FEED (ESQUERDA) + SIDEBAR (DIREITA) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* COLUNA DO FEED */}
              <div className="lg:col-span-2 space-y-6">
                {/* CAIXA DE CRIAÇÃO RÁPIDA DE POST */}
                <CreatePostCard onPostCreated={handlePostCreated} />

                {/* BOTÃO ATUALIZAR FEED */}
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>
                    Mostrando {posts.length} {posts.length === 1 ? "publicação" : "publicações"}
                  </span>
                  <button
                    type="button"
                    onClick={() => fetchFeed(true)}
                    disabled={refreshing}
                    className="flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                    Atualizar feed
                  </button>
                </div>

                {/* LISTA DE POSTS */}
                {loading ? (
                  <div className="rounded-2xl border border-border/60 bg-card p-12 flex flex-col items-center justify-center gap-3 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-semibold text-muted-foreground">
                      Carregando publicações da comunidade...
                    </p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-3 bg-card/40">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                      <Dumbbell className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">
                      {activeFeedTab === "following"
                        ? "Nenhuma postagem dos perfis que você segue"
                        : "Nenhuma postagem encontrada nesta categoria"}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      {activeFeedTab === "following"
                        ? "Explore a comunidade, siga profissionais e amigos para ver as postagens deles aqui na sua aba Seguindo!"
                        : "Seja o primeiro a compartilhar uma rotina de treino ou dica nesta categoria!"}
                    </p>
                    {activeFeedTab === "following" && (
                      <Button
                        size="sm"
                        onClick={() => setActiveFeedTab("explore")}
                        className="text-xs font-bold gap-1 mt-2"
                      >
                        <Flame className="h-3.5 w-3.5" /> Explorar Comunidade
                      </Button>
                    )}
                  </div>
                ) : (
                  <div>
                    {posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onTagClick={handleTagClick}
                        onPostDeleted={handlePostDeleted}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* COLUNA LATERAL (SIDEBAR COM TÓPICOS & ATALHOS) */}
              <div className="hidden lg:block lg:col-span-1 sticky top-28">
                <FeedSidebar
                  activeTag={activeTag}
                  onSelectTag={(tag) => setActiveTag(tag)}
                />
              </div>
            </div>
          </section>
        </div>

        {/* 💳 SEÇÃO COMPLETA DE PLANOS & ASSINATURAS */}
        <div className="mt-20 border-t border-border/60">
          <PlansSection />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
