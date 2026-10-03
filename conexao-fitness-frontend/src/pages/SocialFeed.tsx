import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CreatePostCard } from "@/components/feed/CreatePostCard";
import { PostCard } from "@/components/feed/PostCard";
import { FeedSidebar } from "@/components/feed/FeedSidebar";
import { listPosts } from "@/services/posts";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import socialFinexOfficialLogo from "@/assets/social_finex_logo_official.png";
import {
  Flame,
  Users,
  Sparkles,
  RefreshCw,
  Loader2,
  Dumbbell,
  X,
  MessageSquare,
  ArrowLeft,
  Share2,
  Award,
  TrendingUp,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { Post } from "@/types/community";

const CATEGORY_FILTERS = [
  { id: "Todos", label: "🌟 Todos os Posts" },
  { id: "Treino", label: "🏋️ Treinos & Rotinas" },
  { id: "Dieta", label: "🥗 Dieta & Nutrição" },
  { id: "Evolução", label: "🔥 Evolução & Foco" },
  { id: "Dúvidas", label: "❓ Perguntas & Dúvidas" },
];

const SocialFeed: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Controle de Acesso: se não autenticado, redireciona para login guardando a URL de volta
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login?redirect=/social", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFeedTab, setActiveFeedTab] = useState<"explore" | "following">("explore");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [activeTag, setActiveTag] = useState<string>("");

  const fetchFeed = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await listPosts({
        feed: activeFeedTab,
        category: selectedCategory !== "Todos" ? selectedCategory : undefined,
        tag: activeTag || undefined,
      });

      setPosts(res.items || []);
    } catch (err) {
      console.error("Erro ao buscar feed da Social FINEX:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeed();
    }
  }, [activeFeedTab, selectedCategory, activeTag, isAuthenticated]);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (deletedId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  const handleTagClick = (tag: string) => {
    setActiveTag((prev) => (prev.toLowerCase() === tag.toLowerCase() ? "" : tag));
  };

  // Enquanto valida autenticação, exibe um loader elegante com a paleta âmbar
  if (authLoading || (!isAuthenticated && authLoading)) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <img
            src={socialFinexOfficialLogo}
            alt="Social FINEX"
            className="h-20 w-auto object-contain animate-pulse drop-shadow-[0_10px_25px_rgba(245,158,11,0.3)]"
          />
          <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Conectando à Social FINEX...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-500/[0.04] via-background to-background text-foreground flex flex-col selection:bg-amber-500/20">
      <Header />

      <main className="flex-1 pt-24 sm:pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-7xl space-y-8">
          
          {/* 🌟 HERO BANNER EXCLUSIVO DA REDE SOCIAL SOCIAL FINEX (PALETA DO CARD 2) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card/95 to-amber-500/[0.08] border border-amber-500/30 p-6 sm:p-8 shadow-sm">
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
              
              {/* Lado Esquerdo: Identidade e Boas-Vindas */}
              <div className="space-y-3 text-center lg:text-left flex-1 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold tracking-wide shadow-xs">
                  <Flame className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>REDE SOCIAL & COMUNIDADE FITNESS OFICIAL</span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground leading-tight">
                  Social <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">FINEX</span>
                </h1>

                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  O espaço oficial para quem vive o estilo de vida saudável. Compartilhe suas rotinas de treino, metas alcançadas, evolução física, tire dúvidas com nutricionistas e personais e motive seus amigos.
                </p>

                {/* Badges de Tópicos Rápidos */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/60 border border-amber-500/20 text-muted-foreground font-medium">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Feed ao Vivo
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/60 border border-amber-500/20 text-muted-foreground font-medium">
                    <Dumbbell className="h-3.5 w-3.5 text-amber-500" /> Fichas de Treino
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/60 border border-amber-500/20 text-muted-foreground font-medium">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-500" /> Especialistas Verificados
                  </span>
                </div>
              </div>

              {/* Lado Direito: Logotipo Oficial com Efeito Dourado */}
              <div className="shrink-0 flex items-center justify-center">
                <img
                  src={socialFinexOfficialLogo}
                  alt="Social FINEX"
                  className="h-32 sm:h-40 md:h-44 w-auto max-w-[280px] object-contain drop-shadow-[0_16px_36px_rgba(245,158,11,0.25)] transition-transform duration-300 hover:scale-105"
                />
              </div>
            </div>

            {/* Elemento de iluminação ambiente âmbar de fundo */}
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -top-10 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* 💬 SEÇÃO CENTRAL: FEED DE PUBLICAÇÕES E SIDEBAR */}
          <section className="space-y-6">
            
            {/* CABEÇALHO DO FEED COM NAVEGAÇÃO ENTRE ABAS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/20">
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
              <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl border border-amber-500/20 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveFeedTab("explore")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeFeedTab === "explore"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Flame className="h-3.5 w-3.5" /> Explorar / Todos
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFeedTab("following")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeFeedTab === "following"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" /> Seguindo
                </button>
              </div>
            </div>

            {/* PÍLULAS DE FILTRO POR CATEGORIA & TAG ATIVA */}
            <div className="flex flex-wrap items-center gap-2 pb-1">
              {CATEGORY_FILTERS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all border cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500 shadow-sm shadow-amber-500/20"
                      : "bg-card border-border/70 text-muted-foreground hover:text-foreground hover:border-amber-500/40"
                  }`}
                >
                  {cat.label}
                </button>
              ))}

              {activeTag && (
                <div className="flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-500/30 shrink-0">
                  <span>Tag: {activeTag}</span>
                  <button
                    type="button"
                    onClick={() => setActiveTag("")}
                    className="hover:text-destructive transition-colors ml-1 cursor-pointer"
                    aria-label="Remover filtro de tag"
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

                {/* BARRA DE ATUALIZAR FEED */}
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>
                    Mostrando {posts.length} {posts.length === 1 ? "publicação" : "publicações"}
                  </span>
                  <button
                    type="button"
                    onClick={() => fetchFeed(true)}
                    disabled={refreshing}
                    className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-500 cursor-pointer transition-colors"
                  >
                    <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                    Atualizar feed
                  </button>
                </div>

                {/* LISTA DE POSTS */}
                {loading ? (
                  <div className="rounded-2xl border border-border/60 bg-card p-12 flex flex-col items-center justify-center gap-3 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    <p className="text-sm font-semibold text-muted-foreground">
                      Carregando publicações da Social FINEX...
                    </p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/80 p-10 text-center space-y-3 bg-card/40">
                    <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto">
                      <Flame className="h-6 w-6" />
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
                        className="text-xs font-bold gap-1 mt-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 border-0"
                      >
                        <Flame className="h-3.5 w-3.5" /> Explorar Comunidade
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
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
              <div className="hidden lg:block lg:col-span-1 sticky top-28 space-y-6">
                <FeedSidebar
                  activeTag={activeTag}
                  onSelectTag={(tag) => setActiveTag(tag)}
                />
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SocialFeed;
