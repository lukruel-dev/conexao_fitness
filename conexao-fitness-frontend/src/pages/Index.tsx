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
} from "lucide-react";
import type { Post } from "@/types/community";

const CATEGORY_FILTERS = [
  { id: "Todos", label: "🌟 Todos os Posts" },
  { id: "Treino", label: "🏋️ Treinos & Rotinas" },
  { id: "Dieta", label: "🥗 Dieta & Nutrição" },
  { id: "Evolução", label: "🔥 Evolução & Foco" },
  { id: "Dúvidas", label: "❓ Perguntas & Dúvidas" },
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
          {/* SEÇÃO SUPERIOR: DOIS CARDS LADO A LADO (BUSCA & SOCIAL FINEX) */}
          <section className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CARD 1: BUSCA & CATÁLOGO */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card/95 to-primary/5 border border-primary/20 p-5 sm:p-6 shadow-sm flex flex-col justify-between group hover:border-primary/40 transition-all duration-300">
              <div className="relative z-10 flex flex-col h-full space-y-3.5">
                {/* 1. PARTE SUPERIOR DO CARD: BADGE E BOTÃO BUSCAR */}
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-extrabold tracking-wide shadow-sm">
                    <Search className="h-3.5 w-3.5 text-primary" />
                    <span>BUSCA RÁPIDA FINEX</span>
                  </div>

                  <Button
                    type="submit"
                    form="hero-search-form"
                    className="h-11 sm:h-12 min-w-[130px] sm:min-w-[145px] px-6 sm:px-7 text-sm sm:text-base font-bold tracking-normal gap-2 rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 cursor-pointer transition-all hover:scale-[1.03]"
                  >
                    <Search className="h-4 w-4" /> Buscar
                  </Button>
                </div>

                {/* 2. LOGO ABAIXO: CAMPO DE PREENCHIMENTO */}
                <div ref={searchContainerRef} className="relative w-full">
                  <form
                    id="hero-search-form"
                    onSubmit={handleSearchSubmit}
                    className="w-full"
                  >
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar treinos, profissionais, academias ou cidades..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => {
                          setIsDropdownOpen(true);
                          if (window.scrollY < 200) {
                            window.scrollTo({ top: 0, behavior: "instant" });
                          }
                        }}
                        className="pl-10 pr-9 h-11 text-xs sm:text-sm rounded-xl bg-background/90 border-border/80 shadow-inner focus-visible:ring-primary/50"
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
                  </form>

                  {/* DROPDOWN FLUTUANTE DE RESULTADOS INSTANTÂNEOS */}
                  {isDropdownOpen && queryLower.length >= 1 && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl overflow-hidden animate-in fade-in-50 slide-in-from-top-2">
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

                {/* 3. LOGO ABAIXO: LINKS MAIS POPULARES */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
                  <span className="text-muted-foreground font-semibold text-[11px] mr-0.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" /> Populares:
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate("/buscar?providerType=ACADEMIA")}
                    className="px-2.5 py-1 rounded-full bg-card/80 hover:bg-primary/15 hover:text-primary border border-border/70 hover:border-primary/40 transition-all text-[11px] font-medium flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Building2 className="h-3 w-3 text-primary" /> Academias & Day Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/buscar?providerType=PERSONAL&modality=Personal")}
                    className="px-2.5 py-1 rounded-full bg-card/80 hover:bg-primary/15 hover:text-primary border border-border/70 hover:border-primary/40 transition-all text-[11px] font-medium flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Dumbbell className="h-3 w-3 text-primary" /> Personal Trainers
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/buscar?providerType=PERSONAL&modality=Nutri")}
                    className="px-2.5 py-1 rounded-full bg-card/80 hover:bg-primary/15 hover:text-primary border border-border/70 hover:border-primary/40 transition-all text-[11px] font-medium flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Utensils className="h-3 w-3 text-primary" /> Nutricionistas
                  </button>
                </div>

                {/* 4. E SÓ DEPOIS O TÍTULO SOLICITADO */}
                <div className="pt-3 border-t border-border/50 mt-auto">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight text-foreground leading-snug">
                    Conecte-se com as <span className="text-primary underline decoration-primary/40">Melhores Academias</span> e Profissionais
                  </h1>
                </div>
              </div>

              {/* ELEMENTO DECORATIVO DE FUNDO */}
              <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* CARD 2: SOCIAL FINEX (REDE SOCIAL FITNESS) */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#071728] via-[#09253d] to-[#043d56] border-2 border-cyan-400/40 hover:border-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.18)] hover:shadow-[0_0_40px_rgba(6,182,212,0.28)] p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 group">
              <div className="relative z-10 flex flex-col h-full space-y-3.5">
                {/* 1. PARTE SUPERIOR DO CARD: BADGE E BOTÃO CONECTAR */}
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-extrabold tracking-wide shadow-sm">
                    <Flame className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                    <span>REDE SOCIAL FITNESS</span>
                  </div>

                  <Button
                    type="button"
                    onClick={handleConnectSocial}
                    className="h-11 sm:h-12 min-w-[130px] sm:min-w-[145px] px-6 sm:px-7 text-sm sm:text-base font-bold tracking-normal gap-2 rounded-xl shadow-lg bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white border border-cyan-300/40 transition-all hover:scale-[1.03] cursor-pointer"
                  >
                    <Users className="h-4 w-4" /> Conectar
                  </Button>
                </div>

                {/* 2. TÍTULO E APRESENTAÇÃO DO SOCIAL FINEX */}
                <div className="space-y-1.5">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
                    Social <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 drop-shadow-[0_0_25px_rgba(34,211,238,0.5)]">FINEX</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-cyan-100/80 leading-relaxed">
                    A rede social fitness da Finex feita para quem vive o estilo de vida saudável. Compartilhe sua evolução, tire dúvidas, curta treinos e conecte-se com alunos e profissionais.
                  </p>
                </div>

                {/* 3. RECURSOS EM DESTAQUE (PILLS MODERNAS) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 backdrop-blur-sm flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs mb-0.5">
                      <MessageSquare className="h-3.5 w-3.5 text-cyan-400" /> Feed ao Vivo
                    </div>
                    <p className="text-[11px] text-cyan-100/60 leading-tight">Postagens de treinos, fotos e rotinas</p>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 backdrop-blur-sm flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs mb-0.5">
                      <Flame className="h-3.5 w-3.5 text-emerald-400" /> Comunidade
                    </div>
                    <p className="text-[11px] text-cyan-100/60 leading-tight">Interação diária com alunos e personais</p>
                  </div>
                </div>

                {/* 4. RODAPÉ COM REDIRECIONAMENTO EXPLÍCITO */}
                <div className="pt-2.5 border-t border-cyan-500/30 flex flex-wrap items-center justify-between gap-3 text-xs mt-auto">
                  <div className="flex items-center gap-2 text-cyan-200/90 text-xs">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-medium">
                      {isAuthenticated ? "Sua conta está conectada!" : "Acesse com sua conta ou cadastre-se"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleConnectSocial}
                    className="text-xs font-bold text-cyan-300 hover:text-cyan-100 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{isAuthenticated ? "Ir para o Feed da Comunidade" : "Acessar Comunidade Fitness"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* ELEMENTOS DECORATIVOS DE LUZ NO FUNDO */}
              <div className="absolute -right-8 -top-8 w-44 h-44 bg-cyan-500/25 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-8 -bottom-8 w-44 h-44 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
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

            {/* PÍLULAS DE FILTRO POR CATEGORIA & TAG ATIVA */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORY_FILTERS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all border ${
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
