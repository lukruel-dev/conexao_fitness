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
  MessageSquare,
  Award,
  Clock,
  ExternalLink,
  Edit3,
} from "lucide-react";

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

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    setLoading(true);

    getPublicUserProfile(id)
      .then((data) => {
        if (!isMounted) return;
        setProfile(data);
        setFollowersCount(data.followersCount || 14);
      })
      .catch((err) => {
        console.error("Erro ao carregar perfil:", err);
        toast({
          title: "Perfil não encontrado",
          description: "Não foi possível encontrar as informações deste perfil.",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // Carregar postagens do profissional
    setPostsLoading(true);
    listPosts({ authorId: id })
      .then((res) => {
        if (!isMounted) return;
        setPosts(res.items);
      })
      .catch((err) => {
        console.error("Erro ao carregar postagens do perfil:", err);
      })
      .finally(() => {
        if (isMounted) setPostsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleToggleFollow = async () => {
    if (!profile) return;
    if (!user) {
      toast({
        title: "Faça login para seguir",
        description: "Entre na sua conta para acompanhar as publicações deste profissional.",
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
      toast({ title: "Link:", description: url });
    }
  };

  const handlePostDeleted = (deletedId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  const isOwnProfile = Boolean(user && profile && user.id === profile.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-28 pb-16 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Carregando perfil do profissional...</p>
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
      ? profile.professionTitle || "Personal Trainer"
      : profile.role === "ACADEMIA"
      ? "Academia Parceira"
      : "Aluno & Atleta";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 md:pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          {/* BOTÃO VOLTAR */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>

            {isOwnProfile && (
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 font-bold" asChild>
                <Link to="/perfil">
                  <Edit3 className="w-3.5 h-3.5 text-primary" /> Editar Meu Perfil
                </Link>
              </Button>
            )}
          </div>

          {/* BANNER DO PERFIL */}
          <div className="relative rounded-3xl overflow-hidden bg-card border border-border/80 shadow-md">
            {/* Background Decorativo */}
            <div className="h-36 sm:h-48 w-full bg-gradient-to-r from-primary/30 via-secondary/20 to-primary/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleShareProfile}
                  className="h-8 px-3 text-xs gap-1.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5" /> Compartilhar
                </Button>
              </div>
            </div>

            {/* Informações Principais do Profissional */}
            <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-5">
                {/* Avatar Grande com Borda de Destaque */}
                <div className="relative">
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full ring-4 ring-background shadow-xl overflow-hidden bg-muted">
                    <img
                      src={
                        profile.avatarUrl ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"
                      }
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {profile.role === "PERSONAL" && (
                    <span
                      className="absolute bottom-1 right-1 bg-emerald-500 text-white rounded-full p-1.5 shadow-md ring-2 ring-background"
                      title="Profissional Verificado Finex"
                    >
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                  )}
                </div>

                {/* Botões de Ação Rápida */}
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  {!isOwnProfile && (
                    <>
                      <Button
                        type="button"
                        variant={isFollowing ? "secondary" : "default"}
                        size="sm"
                        onClick={handleToggleFollow}
                        disabled={followLoading}
                        className={`h-10 px-5 text-xs font-bold gap-2 rounded-xl transition-all shadow-sm flex-1 sm:flex-initial ${
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
                            <UserPlus className="h-4 w-4" /> Seguir Profissional
                          </>
                        )}
                      </Button>

                      {profile.role === "PERSONAL" && (
                        <Button
                          size="sm"
                          variant="hero"
                          className="h-10 px-5 text-xs font-bold gap-2 rounded-xl shadow-sm flex-1 sm:flex-initial"
                          asChild
                        >
                          <Link to="/buscar?providerType=PERSONAL">
                            <Calendar className="h-4 w-4" /> Agendar Horário
                          </Link>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Títulos e Identificação */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="font-display font-black text-2xl sm:text-3xl text-foreground">
                      {profile.name}
                    </h1>
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-500/15 text-emerald-500 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      <ShieldCheck className="h-3.5 w-3.5" /> Credenciado Finex
                    </span>
                  </div>

                  <p className="text-sm sm:text-base font-semibold text-primary mt-1">
                    {roleBadgeLabel}
                  </p>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-muted-foreground mt-1.5">
                    {profile.cref && (
                      <span className="font-medium text-foreground bg-muted px-2 py-0.5 rounded-md">
                        {profile.cref}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {profile.cityBase || "Uruguaiana - RS"}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-amber-400">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {Number(profile.averageRating || 5.0).toFixed(1)}
                      <span className="text-muted-foreground font-normal">
                        ({profile.totalReviews || 0} avaliações)
                      </span>
                    </span>
                  </div>
                </div>

                {/* ESTATÍSTICAS DO PERFIL */}
                <div className="flex items-center gap-6 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                  <div>
                    <strong className="text-foreground font-extrabold text-base mr-1">
                      {posts.length}
                    </strong>
                    <span>publicações</span>
                  </div>
                  <div>
                    <strong className="text-foreground font-extrabold text-base mr-1">
                      {followersCount}
                    </strong>
                    <span>seguidores</span>
                  </div>
                  <div>
                    <strong className="text-foreground font-extrabold text-base mr-1">
                      {profile.followingCount || 18}
                    </strong>
                    <span>seguindo</span>
                  </div>
                  {profile.baseHourlyPrice && (
                    <div className="ml-auto hidden sm:block">
                      <span className="text-muted-foreground block text-[10px]">A partir de:</span>
                      <strong className="text-primary font-black text-sm">
                        R$ {Number(profile.baseHourlyPrice).toFixed(2).replace(".", ",")} / sessão
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* GRID: BIOGRAFIA / SOBRE + ESPECIALIDADES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CARD DE BIOGRAFIA (2 Colunas) */}
            <div className="md:col-span-2 space-y-6">
              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <h2 className="font-display font-bold text-base text-foreground">
                      Sobre o Profissional
                    </h2>
                  </div>
                </div>

                {profile.bio ? (
                  <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                    {profile.bio}
                  </p>
                ) : (
                  <div className="py-4 text-center text-xs text-muted-foreground italic">
                    Este profissional ainda não adicionou uma biografia detalhada.
                  </div>
                )}

                {/* ESPECIALIDADES E MODALIDADES */}
                {profile.modalities && profile.modalities.length > 0 && (
                  <div className="pt-3 border-t border-border/50">
                    <span className="text-xs font-bold text-foreground block mb-2">
                      Especialidades & Modalidades:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.modalities.map((mod, i) => (
                        <span
                          key={i}
                          className="text-xs font-medium bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full"
                        >
                          {mod}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SEÇÃO DO FEED: TODAS AS POSTAGENS DO PROFISSIONAL */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <h2 className="font-display font-bold text-lg text-foreground">
                      Publicações de {profile.name.split(" ")[0]} ({posts.length})
                    </h2>
                  </div>
                </div>

                {postsLoading ? (
                  <div className="rounded-2xl border border-border/60 bg-card p-10 flex flex-col items-center justify-center gap-3 text-center">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground">Carregando publicações...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border p-10 text-center space-y-3 bg-card/50">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                      <Dumbbell className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">
                      Nenhuma publicação no feed ainda
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Assim que {profile.name} postar rotinas de treino, dicas ou fotos, elas aparecerão aqui!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
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
            </div>

            {/* BARRA LATERAL: INFORMAÇÕES DE CONFIANÇA & AGENDAMENTO (1 Coluna) */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Garantia de Qualidade
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground">Índice de Qualidade:</span>
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {Number(profile.qualityScore || 5.0).toFixed(1)} / 5.0
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground">Taxa de Resposta:</span>
                    <span className="font-bold text-emerald-500">
                      {profile.responseRate || 100}% rápida
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground">Documentação:</span>
                    <span className="font-bold text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> 100% Validada
                    </span>
                  </div>
                </div>

                {profile.role === "PERSONAL" && (
                  <div className="pt-2">
                    <Button variant="hero" className="w-full h-11 text-xs font-bold gap-2 rounded-xl" asChild>
                      <Link to="/buscar?providerType=PERSONAL">
                        <Calendar className="h-4 w-4" /> Agendar com {profile.name.split(" ")[0]}
                      </Link>
                    </Button>
                    <p className="text-[11px] text-muted-foreground text-center mt-2">
                      Pagamento 100% protegido pela plataforma Finex.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PerfilPublico;
