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
          {/* BANNER BOAS-VINDAS & BUSCA RÁPIDA */}
          <section className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-r from-card via-card/90 to-primary/10 border border-primary/20 p-6 sm:p-8 shadow-sm">
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold tracking-wide">
                <Sparkles className="h-3.5 w-3.5" /> O Ponto de Encontro Fitness do Brasil
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                Conecte-se com as <span className="text-primary underline decoration-primary/40">Melhores Academias</span>, Profissionais e a Comunidade
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Descubra treinos, tire dúvidas, compartilhe sua evolução, adquira Day Passes e agende sessões com profissionais credenciados.
              </p>

              {/* BARRA DE BUSCA GLOBAL RÁPIDA COM AUTOCOMPLETE / PREVIEW */}
              <div ref={searchContainerRef} className="relative max-w-xl pt-2">
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <div className="relative flex-1">
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
                  <Button
                    type="submit"
                    className="h-11 px-6 text-xs sm:text-sm font-bold gap-1.5 rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 cursor-pointer"
                  >
                    <Search className="h-4 w-4" /> Buscar
                  </Button>
                </form>

                {/* DROPDOWN FLUTUANTE DE RESULTADOS INSTANTÂNEOS */}
                {isDropdownOpen && queryLower.length >= 1 && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl overflow-hidden animate-in fade-in-50 slide-in-from-top-2">
                    <div className="max-h-80 overflow-y-auto divide-y divide-border/40 p-2 text-xs">
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
                                    {pro.professionTitle || pro.modality || "Personal Trainer"} • {pro.city || "Uruguaiana - RS"}
                                  </p>
                                </div>
                              </div>
                              <span className="text-foreground font-semibold text-xs shrink-0 pl-2">
                                {formatBRL(pro.price)} / sessão
                              </span>
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

                {/* ATALHOS RÁPIDOS DE CATEGORIAS POPULARES */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 text-xs">
                  <span className="text-muted-foreground font-semibold text-[11px] mr-0.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" /> Populares:
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate("/buscar?providerType=ACADEMIA")}
                    className="px-2.5 py-1 rounded-full bg-card/70 hover:bg-primary/15 hover:text-primary border border-border/70 hover:border-primary/40 transition-all text-[11px] font-medium flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Building2 className="h-3 w-3 text-primary" /> Academias & Day Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/buscar?providerType=PERSONAL&modality=Personal")}
                    className="px-2.5 py-1 rounded-full bg-card/70 hover:bg-primary/15 hover:text-primary border border-border/70 hover:border-primary/40 transition-all text-[11px] font-medium flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Dumbbell className="h-3 w-3 text-primary" /> Personal Trainers
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/buscar?providerType=PERSONAL&modality=Nutri")}
                    className="px-2.5 py-1 rounded-full bg-card/70 hover:bg-primary/15 hover:text-primary border border-border/70 hover:border-primary/40 transition-all text-[11px] font-medium flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Utensils className="h-3 w-3 text-primary" /> Nutricionistas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("comunidade");
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="px-2.5 py-1 rounded-full bg-card/70 hover:bg-primary/15 hover:text-primary border border-border/70 hover:border-primary/40 transition-all text-[11px] font-medium flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <MessageSquare className="h-3 w-3 text-primary" /> Fórum & Dúvidas
                  </button>
                </div>
              </div>
            </div>

            {/* ELEMENTO DECORATIVO DE FUNDO */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
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
