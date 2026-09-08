import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getPublicUserProfile } from "@/services/users";
import { listPosts, toggleFollowUser } from "@/services/posts";
import { PostCard } from "@/components/feed/PostCard";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { PublicUserProfile } from "@/types/api";
import type { Post } from "@/types/community";
import {
  ShieldCheck,
  Star,
  MapPin,
  Calendar,
  UserPlus,
  UserCheck,
  Share2,
  ArrowLeft,
  Loader2,
  Sparkles,
  Dumbbell,
  CheckCircle2,
  Grid3X3,
  List,
  Heart,
  MessageCircle,
  Clock,
  ExternalLink,
  Edit3,
  X,
  Repeat,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PerfilPublico: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "feed">("grid");
  const [selectedPostModal, setSelectedPostModal] = useState<Post | null>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    setLoading(true);

    getPublicUserProfile(id)
      .then((data) => {
        if (!isMounted) return;
        setProfile(data);
        setFollowersCount(data.followersCount || 18);
      })
      .catch((err) => {
        console.error("Erro ao carregar perfil:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // Carregar postagens do profissional
    setPostsLoading(true);
    listPosts({ authorId: id })
      .then((res) => {
        if (!isMounted) return;
        let items = res.items || [];
        // Se a busca por authorId retornou vazia, procurar se há posts no cache com esse id ou nome
        if (items.length === 0) {
          try {
            const raw = localStorage.getItem("cf_community_posts_v1");
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                items = parsed.filter(
                  (p: any) =>
                    p.authorId === id ||
                    p.author?.id === id ||
                    (profile?.name && p.author?.name?.toLowerCase() === profile.name.toLowerCase())
                );
              }
            }
          } catch (e) {
            console.error(e);
          }
        }
        setPosts(items);
      })
      .catch((err) => {
        console.error("Erro ao carregar postagens:", err);
      })
      .finally(() => {
        if (isMounted) setPostsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, profile?.name]);

  const handleToggleFollow = async () => {
    if (!profile) return;
    if (!user) {
      toast({
        title: "Faça login para seguir",
        description: "Entre na sua conta para acompanhar as publicações deste perfil.",
      });
      navigate("/login");
      return;
    }

    setFollowLoading(true);
    const prevFollowing = isFollowing;
    const prevCount = followersCount;

    setIsFollowing(!prevFollowing);
    setFollowersCount(prevFollowing ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await toggleFollowUser(profile.id);
      setIsFollowing(res.following);
      toast({
        title: res.following
          ? `Você agora está seguindo ${profile.name}!`
          : `Você deixou de seguir ${profile.name}.`,
      });
    } catch {
      setIsFollowing(prevFollowing);
      setFollowersCount(prevCount);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShareProfile = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link do perfil copiado!",
        description: "Compartilhe com seus amigos nas redes sociais.",
      });
    } else {
      toast({ title: "Link do perfil:", description: url });
    }
  };

  const handlePostDeleted = (deletedId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedId));
    if (selectedPostModal?.id === deletedId) {
      setSelectedPostModal(null);
    }
  };

  const isOwnProfile = Boolean(user && profile && (user.id === profile.id || id === "user-me"));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-28 pb-16 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Carregando perfil...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-28 pb-16">
          <div className="container mx-auto px-4 max-w-lg text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
              <Dumbbell className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold">Perfil não encontrado</h1>
            <p className="text-sm text-muted-foreground">
              O profissional ou usuário que você está procurando não existe ou foi removido.
            </p>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const roleBadgeLabel =
    profile.role === "PERSONAL"
      ? profile.professionTitle || "Profissional da Saúde & Fitness"
      : profile.role === "ACADEMIA"
      ? "Academia Parceira"
      : "Aluno & Atleta";

  // Extrair fotos de todos os posts para a Grade estilo Instagram
  const allMediaPosts = posts.filter(
    (p) => p.mediaUrls && p.mediaUrls.length > 0
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 md:pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl space-y-6">
          {/* BOTÃO VOLTAR */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>

            {isOwnProfile && (
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 font-bold rounded-xl" asChild>
                <Link to="/perfil">
                  <Edit3 className="w-3.5 h-3.5 text-primary" /> Editar Minha Conta
                </Link>
              </Button>
            )}
          </div>

          {/* CABEÇALHO DO PERFIL NO ESTILO INSTAGRAM */}
          <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Foto de Perfil com Anel de Destaque Instagram */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-primary via-secondary to-primary shadow-lg">
                  <img
                    src={
                      profile.avatarUrl ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"
                    }
                    alt={profile.name}
                    className="w-full h-full rounded-full object-cover border-2 border-background"
                  />
                </div>
                {profile.role === "PERSONAL" && (
                  <span
                    className="absolute bottom-0 right-0 bg-emerald-500 text-white rounded-full p-1 shadow-md ring-2 ring-background"
                    title="Profissional Verificado Finex"
                  >
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                )}
              </div>

              {/* Dados e Estatísticas Estilo Instagram */}
              <div className="flex-1 space-y-4 text-center sm:text-left min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      <h1 className="font-display font-black text-xl sm:text-2xl text-foreground truncate">
                        {profile.name}
                      </h1>
                      {profile.role === "PERSONAL" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="h-3 w-3" /> Verificado
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-primary mt-0.5">
                      {roleBadgeLabel}
                    </p>
                  </div>
                </div>

                {/* Linha de Contadores: Publicações | Seguidores | Seguindo (Estilo Instagram) */}
                <div className="flex items-center justify-center sm:justify-start gap-8 text-sm">
                  <div className="text-center sm:text-left">
                    <strong className="text-foreground font-extrabold text-base block sm:inline mr-1">
                      {posts.length}
                    </strong>
                    <span className="text-muted-foreground text-xs">publicações</span>
                  </div>
                  <div className="text-center sm:text-left">
                    <strong className="text-foreground font-extrabold text-base block sm:inline mr-1">
                      {followersCount}
                    </strong>
                    <span className="text-muted-foreground text-xs">seguidores</span>
                  </div>
                  <div className="text-center sm:text-left">
                    <strong className="text-foreground font-extrabold text-base block sm:inline mr-1">
                      {profile.followingCount || 15}
                    </strong>
                    <span className="text-muted-foreground text-xs">seguindo</span>
                  </div>
                </div>

                {/* Biografia (Bio) */}
                {profile.bio && (
                  <div className="text-xs sm:text-sm text-foreground/90 whitespace-pre-line leading-relaxed pt-1">
                    {profile.bio}
                  </div>
                )}

                {/* Informações complementares: CREF, Localização, Estrelas */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-muted-foreground">
                  {profile.cref && (
                    <span className="bg-muted px-2.5 py-0.5 rounded-md font-medium text-foreground text-[11px]">
                      {profile.cref}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[11px]">
                    <MapPin className="h-3 w-3 text-primary" /> {profile.cityBase || "Uruguaiana - RS"}
                  </span>
                  {profile.averageRating && (
                    <span className="flex items-center gap-1 font-bold text-amber-400 text-[11px]">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {Number(profile.averageRating).toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Modalidades / Chips */}
                {profile.modalities && profile.modalities.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                    {profile.modalities.map((m, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}

                {/* BOTÕES DE AÇÃO ESTILO INSTAGRAM */}
                <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-2">
                  {!isOwnProfile ? (
                    <>
                      <Button
                        type="button"
                        variant={isFollowing ? "secondary" : "default"}
                        size="sm"
                        onClick={handleToggleFollow}
                        disabled={followLoading}
                        className={`h-9 px-5 text-xs font-bold gap-1.5 rounded-xl transition-all shadow-sm flex-1 sm:flex-initial ${
                          isFollowing
                            ? "bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            : "bg-primary text-primary-foreground hover:opacity-90"
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className="h-4 w-4" /> Seguindo
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" /> Seguir
                          </>
                        )}
                      </Button>

                      {profile.role === "PERSONAL" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 px-4 text-xs font-bold gap-1.5 rounded-xl border-primary/40 text-primary hover:bg-primary hover:text-white"
                          asChild
                        >
                          <Link to="/buscar?providerType=PERSONAL">
                            <Calendar className="h-3.5 w-3.5" /> Agendar
                          </Link>
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleShareProfile}
                        className="h-9 px-3 text-xs rounded-xl"
                        title="Compartilhar Perfil"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 px-4 text-xs font-bold gap-1.5 rounded-xl border-primary/40 text-primary hover:bg-primary hover:text-white"
                      asChild
                    >
                      <Link to="/perfil">
                        <Edit3 className="h-3.5 w-3.5" /> Editar Meu Perfil & Bio
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* BARRA DE NAVEGAÇÃO DE ABAS ESTILO INSTAGRAM */}
          <div className="flex items-center justify-center border-t border-border/70 pt-2 gap-8">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-t-2 -mt-2 ${
                viewMode === "grid"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span>Publicações</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("feed")}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-t-2 -mt-2 ${
                viewMode === "feed"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="w-4 h-4" />
              <span>Feed Detalhado</span>
            </button>
          </div>

          {/* CONTEÚDO DAS POSTAGENS */}
          {postsLoading ? (
            <div className="rounded-2xl border border-border/60 bg-card p-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Carregando publicações...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-3 bg-card/40">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                <Dumbbell className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">
                Nenhuma publicação ainda
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {profile.name} ainda não compartilhou fotos ou rotinas de treino.
              </p>
            </div>
          ) : viewMode === "grid" ? (
            /* ABA 1: GRADE ESTILO INSTAGRAM (3 Colunas Quadradas) */
            <div className="grid grid-cols-3 gap-1.5 sm:gap-3 rounded-2xl overflow-hidden">
              {posts.map((post) => {
                const firstMedia =
                  post.mediaUrls && post.mediaUrls.length > 0
                    ? resolveMediaUrl(
                        typeof post.mediaUrls[0] === "object"
                          ? (post.mediaUrls[0] as any).url
                          : post.mediaUrls[0]
                      )
                    : null;

                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPostModal(post)}
                    className="group relative aspect-square bg-muted/60 overflow-hidden rounded-lg sm:rounded-xl cursor-pointer border border-border/40"
                  >
                    {firstMedia ? (
                      <img
                        src={firstMedia}
                        alt="Publicação"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center p-3 text-center bg-card">
                        <Dumbbell className="h-6 w-6 text-primary mb-1 opacity-70" />
                        <p className="text-[10px] text-foreground font-medium line-clamp-3">
                          {post.content}
                        </p>
                      </div>
                    )}

                    {/* Overlay Escuro com Likes e Comentários ao passar o mouse */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-xs sm:text-sm">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4 fill-white" />
                        <span>{post.likesCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4 fill-white" />
                        <span>{post.commentsCount || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ABA 2: FEED DETALHADO VERTICAL */
            <div className="space-y-5">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostDeleted={handlePostDeleted}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL ESTILO INSTAGRAM PARA VISUALIZAÇÃO DE POST */}
      <Dialog
        open={Boolean(selectedPostModal)}
        onOpenChange={(open) => !open && setSelectedPostModal(null)}
      >
        <DialogContent className="max-w-xl p-0 overflow-hidden border-border/80 bg-card rounded-2xl">
          {selectedPostModal && (
            <div className="p-4 sm:p-5">
              <PostCard
                post={selectedPostModal}
                onPostDeleted={handlePostDeleted}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default PerfilPublico;
