import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Repeat,
  Copy,
  Share2,
  MessageCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { sharePost } from "@/services/posts";
import type { Post } from "@/types/community";

interface SharePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
  onShared?: (newPost: Post) => void;
}

export const SharePostModal: React.FC<SharePostModalProps> = ({
  open,
  onOpenChange,
  post,
  onShared,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [commentary, setCommentary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRepost = async () => {
    setLoading(true);
    try {
      const created = await sharePost(post.id, commentary, user);
      if (onShared) onShared(created);
      onOpenChange(false);
      setCommentary("");
      toast({
        title: "🎉 Publicação compartilhada no seu perfil!",
        description: "Seus seguidores e a comunidade já podem ver seu repost.",
      });
    } catch (err: any) {
      toast({
        title: "Erro ao compartilhar",
        description: err.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast({
      title: "Link copiado!",
      description: "Link da postagem copiado para a área de transferência.",
    });
    onOpenChange(false);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Confira este treino de ${post.author?.name} na Conexão Fitness:\n"${post.content.slice(0, 100)}..."\n${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Repeat className="h-4 w-4" />
            </div>
            Compartilhar Publicação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* CAMPO DE CITAÇÃO / COMENTÁRIO DO REPOST */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Deseja adicionar seu comentário ao repostar? (Opcional)
            </label>
            <Textarea
              placeholder="Ex: Excelente dica para quem quer evoluir nos treinos..."
              value={commentary}
              onChange={(e) => setCommentary(e.target.value)}
              rows={2}
              className="resize-none text-xs rounded-xl"
            />
          </div>

          {/* PREVIEW DO POST ORIGINAL */}
          <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <img
                src={
                  post.author?.avatarUrl ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                }
                alt={post.author?.name || "Autor"}
                className="h-7 w-7 rounded-full object-cover"
              />
              <div>
                <span className="text-xs font-bold text-foreground block leading-tight">
                  {post.author?.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {post.author?.role === "PERSONAL"
                    ? post.author.personalProfile?.professionTitle || "Personal"
                    : "Comunidade"}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {post.content}
            </p>
          </div>

          {/* AÇÕES ADICIONAIS */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-9 text-xs gap-1.5 rounded-xl border-border/80 font-medium"
            >
              <Copy className="h-3.5 w-3.5" /> Copiar Link
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="h-9 text-xs gap-1.5 rounded-xl border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 font-medium"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleRepost}
            disabled={loading}
            className="gap-1.5 font-bold rounded-xl"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Repeat className="h-3.5 w-3.5" />
            )}
            Repostar no Feed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
