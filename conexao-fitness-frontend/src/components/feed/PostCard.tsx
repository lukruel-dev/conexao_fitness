import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Share2,
  Repeat,
  Dumbbell,
  ShieldCheck,
  UserPlus,
  UserCheck,
  Send,
  Loader2,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  toggleLikePost,
  listComments,
  addComment,
  toggleFollowUser,
} from "@/services/posts";
import { SharePostModal } from "./SharePostModal";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { Post, PostComment } from "@/types/community";

interface PostCardProps {
  post: Post;
  onTagClick?: (tag: string) => void;
  onPostShared?: (newPost: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onTagClick,
  onPostShared,
}) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [sharesCount, setSharesCount] = useState(post.sharesCount || 0);
  const [isFollowing, setIsFollowing] = useState(post.isFollowingAuthor ?? false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  // Formatação amigável de tempo
  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return "agora";
      if (diffMins < 60) return `há ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `há ${diffHours} h`;
      const diffDays = Math.floor(diffHours / 24);
      return `há ${diffDays} d`;
    } catch {
      return "recente";
    }
  };

  const handleToggleLike = async () => {
    setLikeAnimating(true);
    const prevLiked = isLiked;
    const prevCount = likesCount;

    // Optimistic update
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await toggleLikePost(post.id);
      setIsLiked(res.liked);
      setLikesCount(res.likesCount);
    } catch {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setTimeout(() => setLikeAnimating(false), 400);
    }
  };

  const handleToggleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    const prev = isFollowing;
    setIsFollowing(!prev);

    try {
      const res = await toggleFollowUser(post.authorId);
      setIsFollowing(res.following);
      toast({
        title: res.following
          ? `Você agora segue ${post.author?.name || "este perfil"}!`
          : `Você deixou de seguir ${post.author?.name || "este perfil"}.`,
      });
    } catch {
      setIsFollowing(prev);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleToggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setCommentsLoading(true);
      try {
        const list = await listComments(post.id);
        setComments(list);
      } catch (e) {
        console.error("Erro ao carregar comentários:", e);
      } finally {
        setCommentsLoading(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      const created = await addComment(
        post.id,
        newCommentText.trim(),
        user?.name || "Você"
      );
      setComments((prev) => [...prev, created]);
      setCommentsCount((prev) => prev + 1);
      setNewCommentText("");
      toast({ title: "Comentário publicado!" });
    } catch (err: any) {
      toast({
        title: "Erro ao comentar",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const authorRoleLabel = (author = post.author) => {
    if (author?.role === "PERSONAL") {
      return author.personalProfile?.professionTitle || "Personal Trainer";
    }
    if (author?.role === "ACADEMIA") {
      return "Academia Parceira";
    }
    return "Atleta & Aluno";
  };

  return (
    <article className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm transition-all duration-200 hover:border-primary/30 mb-5">
      {/* BANNER SE FOR REPOST/COMPARTILHAMENTO */}
      {post.sharedPost && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold mb-3 bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/15">
          <Repeat className="h-3.5 w-3.5 text-primary" />
          <span>
            <strong className="text-foreground">{post.author?.name}</strong> compartilhou esta publicação
          </span>
        </div>
      )}

      {/* CABEÇALHO DO AUTOR */}
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={
                post.author?.avatarUrl ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
              }
              alt={post.author?.name || "Autor"}
              className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/20"
              loading="lazy"
            />
            {post.author?.role === "PERSONAL" && (
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5">
                <ShieldCheck className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-foreground">
                {post.author?.name || "Usuário Conexão"}
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {authorRoleLabel(post.author)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatTimeAgo(post.createdAt)}</span>
              {post.author?.cityBase && (
                <>
                  <span>•</span>
                  <span>{post.author.cityBase}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* BOTÃO SEGUIR */}
        {user?.id !== post.authorId && (
          <Button
            type="button"
            variant={isFollowing ? "secondary" : "outline"}
            size="sm"
            onClick={handleToggleFollow}
            disabled={followLoading}
            className={`h-8 text-xs font-semibold gap-1 rounded-lg px-3 transition-all ${
              isFollowing
                ? "bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                : "border-primary/40 text-primary hover:bg-primary hover:text-white"
            }`}
          >
            {isFollowing ? (
              <>
                <UserCheck className="h-3.5 w-3.5" /> Seguindo
              </>
            ) : (
              <>
                <UserPlus className="h-3.5 w-3.5" /> Seguir
              </>
            )}
          </Button>
        )}
      </div>

      {/* CONTEÚDO DO POST */}
      <div className="space-y-3 text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
        <p>{post.content}</p>

        {/* TAGS */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.tags.map((tag, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onTagClick && onTagClick(tag)}
                className="text-xs font-semibold text-primary hover:underline bg-primary/5 hover:bg-primary/15 px-2.5 py-0.5 rounded-full transition-colors"
              >
                {tag.startsWith("#") ? tag : `#${tag}`}
              </button>
            ))}
          </div>
        )}

        {/* ROTINA DE TREINO ESTRUTURADA */}
        {post.workoutRoutine && (
          <div className="rounded-xl border border-primary/20 bg-muted/40 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-primary" />
                <span className="font-bold text-xs text-foreground">
                  {post.workoutRoutine.title || "Rotina de Treino"}
                </span>
              </div>
              {post.workoutRoutine.level && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {post.workoutRoutine.level}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {post.workoutRoutine.exercises?.map((ex, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-card/80 border border-border/60 text-xs flex justify-between items-center"
                >
                  <span className="font-semibold text-foreground">
                    {i + 1}. {ex.name}
                  </span>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                    {ex.sets && <span>{ex.sets} séries</span>}
                    {ex.reps && <span>{ex.reps} reps</span>}
                    {ex.restSeconds && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" /> {ex.restSeconds}s
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOTOS / GALERIA ANEXADA */}
        {(() => {
          const sanitizedMediaUrls = (post.mediaUrls || [])
            .map((item: any) => {
              if (!item) return "";
              if (typeof item === "object" && item.url) return String(item.url);
              if (typeof item === "string") return item;
              return "";
            })
            .filter(
              (url) =>
                Boolean(url) &&
                !url.includes("[object Object]") &&
                !url.startsWith("blob:") &&
                url.trim().length > 5
            )
            .map((url) => resolveMediaUrl(url));

          if (sanitizedMediaUrls.length === 0) return null;

          return (
            <div
              className={`grid gap-2 rounded-2xl overflow-hidden mt-3 ${
                sanitizedMediaUrls.length === 1
                  ? "grid-cols-1 max-h-[500px]"
                  : sanitizedMediaUrls.length === 2
                  ? "grid-cols-2 max-h-96"
                  : "grid-cols-2 sm:grid-cols-3 max-h-96"
              }`}
            >
              {sanitizedMediaUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative overflow-hidden bg-muted/60 group rounded-xl border border-border/40"
                >
                  <img
                    src={url}
                    alt={`Foto ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 min-h-48 max-h-[500px]"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              ))}
            </div>
          );
        })()}

        {/* EMBED DO POST ORIGINAL COMPARTILHADO */}
        {post.sharedPost && (
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2 mt-2">
            <div className="flex items-center gap-2.5">
              <img
                src={
                  post.sharedPost.author?.avatarUrl ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                }
                alt="Autor Original"
                className="h-8 w-8 rounded-full object-cover ring-1 ring-primary/30"
              />
              <div>
                <span className="text-xs font-bold text-foreground block leading-tight">
                  {post.sharedPost.author?.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {authorRoleLabel(post.sharedPost.author)}
                </span>
              </div>
            </div>
            <p className="text-xs text-foreground/90 whitespace-pre-line line-clamp-3">
              {post.sharedPost.content}
            </p>
            {post.sharedPost.mediaUrls && post.sharedPost.mediaUrls.length > 0 && (
              <div className="h-40 rounded-lg overflow-hidden mt-2">
                <img
                  src={post.sharedPost.mediaUrls[0]}
                  alt="Mídia compartilhada"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* BARRA DE AÇÕES (CURTIR, COMENTAR, COMPARTILHAR) */}
      <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-border/60">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Curtir */}
          <button
            type="button"
            onClick={handleToggleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isLiked
                ? "text-red-500 bg-red-500/10"
                : "text-muted-foreground hover:text-red-500 hover:bg-muted"
            }`}
          >
            <Heart
              className={`h-4 w-4 transition-transform ${
                isLiked ? "fill-red-500 text-red-500" : ""
              } ${likeAnimating ? "scale-125" : "scale-100"}`}
            />
            <span>{likesCount}</span>
          </button>

          {/* Comentários */}
          <button
            type="button"
            onClick={handleToggleComments}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{commentsCount}</span>
          </button>

          {/* Compartilhar / Repostar */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
          >
            <Repeat className="h-4 w-4" />
            <span>{sharesCount > 0 ? sharesCount : ""}</span>
          </button>
        </div>

        {/* Compartilhar Geral */}
        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Compartilhar</span>
        </button>
      </div>

      {/* SEÇÃO DE COMENTÁRIOS EXPANSÍVEL */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-border/60 space-y-3">
          {/* Input para novo comentário */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <Input
              placeholder="Escreva um comentário ou tire uma dúvida..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="h-9 text-xs flex-1 rounded-xl"
            />
            <Button
              type="submit"
              size="sm"
              disabled={submittingComment || !newCommentText.trim()}
              className="h-9 px-3 gap-1 rounded-xl font-bold"
            >
              {submittingComment ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </form>

          {/* Lista de comentários */}
          {commentsLoading ? (
            <div className="flex items-center justify-center py-4 text-xs text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> Carregando comentários...
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              Seja o primeiro a comentar nesta postagem!
            </p>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-2.5 rounded-xl bg-muted/40 border border-border/40 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">
                      {comment.author?.name || "Membro da Comunidade"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-foreground/90">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE COMPARTILHAMENTO / REPOST */}
      <SharePostModal
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        post={post}
        onShared={(newPost) => {
          setSharesCount((prev) => prev + 1);
          if (onPostShared) onPostShared(newPost);
        }}
      />
    </article>
  );
};
