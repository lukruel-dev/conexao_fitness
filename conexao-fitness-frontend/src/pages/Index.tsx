import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FeaturedSpotlight } from "@/components/feed/FeaturedSpotlight";
import { CreatePostCard } from "@/components/feed/CreatePostCard";
import { PostCard } from "@/components/feed/PostCard";
import { FeedSidebar } from "@/components/feed/FeedSidebar";
import { listPosts } from "@/services/posts";
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
  const { isAuthenticated } = useAuth();

  const [activeFeedTab, setActiveFeedTab] = useState<"explore" | "following">("explore");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [activeTag, setActiveTag] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleTagClick = (tag: string) => {
    setActiveTag((prev) => (prev.toLowerCase() === tag.toLowerCase() ? "" : tag));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* BANNER BOAS-VINDAS & BUSCA RÁPIDA */}
          <section className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-r from-card via-card/90 to-primary/10 border border-primary/20 p-6 sm:p-8 shadow-sm">
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold tracking-wide">
                <Sparkles className="h-3.5 w-3.5" /> O Ponto de Encontro Fitness do Brasil
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                Conecte-se com as <span className="text-primary underline decoration-primary/40">Melhores Academias</span>, Personais e a Comunidade
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Descubra treinos, tire dúvidas, compartilhe sua evolução, adquira Day Passes diários e agende sessões com profissionais credenciados.
              </p>

              {/* BARRA DE BUSCA GLOBAL RÁPIDA */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2 max-w-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar treinos, personais, academias ou tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchFeed()}
                    className="pl-10 h-10 text-xs sm:text-sm rounded-xl bg-background/80 border-border/80"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        fetchFeed();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button
                  onClick={() => fetchFeed()}
                  className="h-10 px-5 text-xs sm:text-sm font-bold gap-1.5 rounded-xl shadow-sm"
                >
                  <Search className="h-4 w-4" /> Buscar
                </Button>
              </div>
            </div>

            {/* ELEMENTO DECORATIVO DE FUNDO */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          </section>

          {/* 🌟 DESTAQUES DE ACADEMIAS & PROFISSIONAIS (MANTIDOS E ENRIQUECIDOS) */}
          <FeaturedSpotlight />

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
                        ? "Explore a comunidade, siga personais e amigos para ver as postagens deles aqui na sua aba Seguindo!"
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
      </main>

      <Footer />
    </div>
  );
};

export default Index;
