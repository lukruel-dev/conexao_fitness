import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Image as ImageIcon,
  Dumbbell,
  Send,
  Sparkles,
  X,
  Tag,
  Loader2,
  Camera,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createPost } from "@/services/posts";
import { uploadPortfolio } from "@/services/uploads";
import { compressImage } from "@/lib/imageCompressor";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { WorkoutBuilderModal } from "./WorkoutBuilderModal";
import type { Post, WorkoutRoutine } from "@/types/community";

interface CreatePostCardProps {
  onPostCreated: (newPost: Post) => void;
}

const CATEGORIES = [
  { value: "Geral", label: "💬 Geral" },
  { value: "Treino", label: "🏋️ Treino" },
  { value: "Dieta", label: "🥗 Dieta & Nutrição" },
  { value: "Evolução", label: "🔥 Evolução" },
  { value: "Dúvidas", label: "❓ Dúvidas" },
];

const SUGGESTED_TAGS = [
  "#Treino",
  "#Hipertrofia",
  "#Dieta",
  "#Evolucao",
  "#DicaDoPersonal",
  "#CrossFit",
  "#Saude",
];

export const CreatePostCard: React.FC<CreatePostCardProps> = ({
  onPostCreated,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Geral");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [workoutRoutine, setWorkoutRoutine] = useState<WorkoutRoutine | undefined>();
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // 1. Comprime a imagem no cliente para garantir upload ultra rápido e leve
      const { file: compressedFile, dataUrl } = await compressImage(file);

      let finalUrl = "";

      // 2. Se autenticado, tenta fazer upload da foto no servidor
      if (isAuthenticated) {
        try {
          const res = await uploadPortfolio(compressedFile);
          if (res && typeof res === "object" && res.url) {
            finalUrl = resolveMediaUrl(String(res.url));
          } else if (typeof res === "string") {
            finalUrl = resolveMediaUrl(res);
          }
        } catch (uploadErr) {
          console.warn("Upload no servidor não respondeu, utilizando imagem otimizada em base64:", uploadErr);
        }
      }

      // 3. Fallback inteligente: se não recebeu URL remota ou estiver offline, usa o dataUrl comprimido
      if (!finalUrl) {
        finalUrl = dataUrl;
      }

      setMediaUrls((prev) => [...prev, finalUrl]);
      toast({
        title: "Foto anexada!",
        description: "A imagem foi otimizada e está pronta para o post.",
      });
    } catch (err: any) {
      console.error("Erro ao processar imagem:", err);
      toast({
        title: "Erro ao anexar foto",
        description: "Não foi possível carregar esta imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const removeMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Conteúdo obrigatório",
        description: "Escreva algo para compartilhar com a comunidade.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const newPost = await createPost({
        content: content.trim(),
        category,
        tags: selectedTags.length > 0 ? selectedTags : ["#Comunidade"],
        mediaUrls,
        workoutRoutine,
      });

      onPostCreated(newPost);
      setContent("");
      setSelectedTags([]);
      setMediaUrls([]);
      setWorkoutRoutine(undefined);
      setIsExpanded(false);

      toast({
        title: "🎉 Publicação criada!",
        description: "Sua postagem já está visível para a comunidade.",
      });
    } catch (err: any) {
      toast({
        title: "Erro ao publicar",
        description: err.message || "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-4 sm:p-5 shadow-sm transition-all duration-200 hover:border-primary/40 mb-6">
      <div className="flex gap-3 items-start">
        <div className="relative shrink-0">
          <img
            src={
              user?.avatarUrl ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
            }
            alt={user?.name || "Avatar"}
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-full object-cover ring-2 ring-primary/20"
          />
        </div>

        <div className="flex-1 min-w-0">
          <Textarea
            placeholder={
              isAuthenticated
                ? `O que você treinou hoje, ${user?.name?.split(" ")[0]}? Compartilhe dicas, rotinas ou dúvidas...`
                : "Compartilhe um treino, evolução, foto ou dúvida na comunidade..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            rows={isExpanded ? 3 : 2}
            className="w-full resize-none border-border/60 bg-muted/30 focus-visible:bg-background transition-all text-sm rounded-xl p-3"
          />

          {/* PREVIEWS DE FOTOS ANEXADAS */}
          {mediaUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {mediaUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative h-20 w-20 rounded-xl overflow-hidden border border-border group"
                >
                  <img
                    src={url}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeMedia(idx)}
                    className="absolute top-1 right-1 bg-black/70 hover:bg-destructive text-white rounded-full p-1 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* BADGE DE TREINO ANEXADO */}
          {workoutRoutine && (
            <div className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-primary" />
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    {workoutRoutine.title || "Treino Estruturado"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {workoutRoutine.exercises?.length || 0} exercícios inclusos
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsWorkoutModalOpen(true)}
                  className="h-7 text-xs text-primary"
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setWorkoutRoutine(undefined)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* CONTROLES EXPANSÍVEIS (CATEGORIAS E TAGS) */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
              {/* Categorias */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-muted-foreground mr-1">
                  Categoria:
                </span>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                      category === cat.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Tags Sugeridas */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1">
                  <Tag className="h-3 w-3" /> Tags:
                </span>
                {SUGGESTED_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                        active
                          ? "bg-primary/20 text-primary border border-primary/40 font-bold"
                          : "bg-muted/40 text-muted-foreground hover:text-foreground border border-transparent"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* BARRA INFERIOR DE AÇÕES */}
          <div className="flex items-center justify-between mt-3 pt-2">
            <div className="flex items-center gap-1.5">
              {/* Botão Anexar Foto */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileChange}
                  disabled={uploadingImage}
                />
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 px-2.5 py-1.5 rounded-lg transition-colors">
                  {uploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-primary" />
                  )}
                  Foto
                </span>
              </label>

              {/* Botão Anexar Treino */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsWorkoutModalOpen(true)}
                className={`h-8 text-xs font-semibold gap-1.5 px-2.5 rounded-lg transition-colors ${
                  workoutRoutine
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                }`}
              >
                <Dumbbell className="h-4 w-4 text-primary" />
                Treino
              </Button>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              className="h-8 text-xs font-bold px-4 gap-1.5 rounded-lg shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Publicando...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" /> Publicar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <WorkoutBuilderModal
        open={isWorkoutModalOpen}
        onOpenChange={setIsWorkoutModalOpen}
        initialWorkout={workoutRoutine}
        onSave={(w) => setWorkoutRoutine(w)}
      />
    </div>
  );
};
