import { useMutation } from "@tanstack/react-query";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { uploadAvatar, updateMyAvatar, uploadDocument, updateMyDocument } from "@/services/uploads";
import { listPosts } from "@/services/posts";
import { CreatePostCard } from "@/components/feed/CreatePostCard";
import { PostCard } from "@/components/feed/PostCard";
import type { Post } from "@/types/community";
import { 
  CreditCard, 
  User, 
  Crown, 
  CalendarDays, 
  Camera, 
  ChevronRight, 
  Users, 
  List, 
  LogOut, 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  UploadCloud, 
  ExternalLink, 
  Image as ImageIcon,
  MessageSquare,
  Dumbbell,
  Loader2,
  Settings,
  Sparkles,
  ShieldAlert,
  Eye,
  Save,
  Check,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { CameraCaptureModal } from "@/components/CameraCaptureModal";
import { isNativePlatform, captureNativePhoto } from "@/utils/nativeCamera";
import { validateBioContent } from "@/lib/bioValidator";
import { updateMyBio } from "@/services/users";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getMaxPlan = (role: string) => {
  if (role === 'STUDENT') return 'Premium';
  if (role === 'PERSONAL' || role === 'ACADEMIA') return 'Elite';
  return 'Premium';
};

const Perfil = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"feed" | "settings">("feed");

  // Estado das postagens do perfil do usuário
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Estado e validação da Biografia (Bio)
  const [bioText, setBioText] = useState(user?.bio || "");
  const [bioError, setBioError] = useState<string | null>(null);
  const [isBioDirty, setIsBioDirty] = useState(false);
  const [savingBio, setSavingBio] = useState(false);

  useEffect(() => {
    if (user?.bio !== undefined && !isBioDirty) {
      setBioText(user.bio || "");
    }
  }, [user?.bio, isBioDirty]);

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setBioText(val);
    setIsBioDirty(true);

    const validation = validateBioContent(val);
    if (!validation.isValid) {
      setBioError(validation.errorMessage || "Conteúdo não permitido na biografia.");
    } else {
      setBioError(null);
    }
  };

  const handleSaveBio = async () => {
    const validation = validateBioContent(bioText);
    if (!validation.isValid) {
      setBioError(validation.errorMessage || "Não é permitido colocar números de telefone ou contatos na bio.");
      toast.error("Não foi possível salvar a biografia", {
        description: validation.errorMessage,
      });
      return;
    }

    setSavingBio(true);
    try {
      const updated = await updateMyBio(bioText);
      setUser(updated);
      setIsBioDirty(false);
      setBioError(null);
      toast.success("Biografia atualizada com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar biografia", {
        description: err.message || "Tente novamente mais tarde.",
      });
    } finally {
      setSavingBio(false);
    }
  };

  const fetchUserFeed = async () => {
    if (!user) return;
    setPostsLoading(true);
    try {
      const res = await listPosts({ authorId: user.id });
      setUserPosts(res.items);
    } catch (err) {
      console.error("Erro ao buscar posts do usuário:", err);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserFeed();
    }
  }, [user]);

  const handlePostCreated = (newPost: Post) => {
    setUserPosts((prev) => [newPost, ...prev]);
  };

  const handlePostShared = (newPost: Post) => {
    setUserPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (deletedId: string) => {
    setUserPosts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const { url } = await uploadAvatar(file);
      return updateMyAvatar(url);
    },
    onSuccess: (updated) => {
      setUser(updated);
      toast.success("Foto de perfil atualizada!");
    },
    onError: (err: Error) =>
      toast.error("Não foi possível atualizar a foto", { description: err.message }),
  });

  const documentMutation = useMutation({
    mutationFn: async (file: File) => {
      const { url } = await uploadDocument(file);
      return updateMyDocument(url);
    },
    onSuccess: (updated) => {
      setUser(updated);
      toast.success("Comprovante enviado com sucesso para validação Finex!");
    },
    onError: (err: Error) =>
      toast.error("Erro ao reenviar documento", { description: err.message }),
  });

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    avatarMutation.mutate(file);
    e.target.value = "";
  };

  const handleTakePhoto = async () => {
    if (isNativePlatform()) {
      try {
        const file = await captureNativePhoto({ source: "camera" });
        if (file) {
          avatarMutation.mutate(file);
        }
      } catch (err: any) {
        toast.error("Não foi possível abrir a câmera nativa", { description: err?.message });
      }
    } else {
      cameraInputRef.current?.click();
    }
  };

  const handlePickGallery = async () => {
    if (isNativePlatform()) {
      try {
        const file = await captureNativePhoto({ source: "photos" });
        if (file) {
          avatarMutation.mutate(file);
        }
      } catch (err: any) {
        toast.error("Não foi possível abrir a galeria", { description: err?.message });
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleDocumentPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    documentMutation.mutate(file);
    e.target.value = "";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 md:pt-28 pb-16 flex flex-col items-center justify-center min-h-[70vh]">
          <div className="container mx-auto px-4 max-w-md text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-3">Bem-vindo ao Conexão Fitness!</h1>
            <p className="text-muted-foreground mb-8">
              Faça login ou cadastre-se para gerenciar seu perfil, postagens, agendamentos e carteira.
            </p>
            <div className="flex flex-col gap-4">
              <Button variant="hero" className="w-full h-12 text-base" asChild>
                <Link to="/cadastro">Cadastrar agora</Link>
              </Button>
              <Button variant="outline" className="w-full h-12 text-base" asChild>
                <Link to="/login">Já tenho conta</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (user.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  const isProvider = user.role === "PERSONAL" || user.role === "ACADEMIA";
  const planName = user.planName || "Gratuito";
  const isMaxPlan = planName === getMaxPlan(user.role);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 md:pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* CABEÇALHO DO PERFIL */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 mb-6 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-4 ring-primary/20">
                  {user.avatarUrl ? (
                    <img src={resolveMediaUrl(user.avatarUrl)} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-primary" />
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      disabled={avatarMutation.isPending}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 disabled:opacity-60 transition-transform active:scale-95 ring-2 ring-background"
                      aria-label="Trocar foto de perfil"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-60">
                    <DropdownMenuItem
                      onClick={handleTakePhoto}
                      className="cursor-pointer gap-2 py-2.5 font-medium"
                    >
                      <Camera className="w-4 h-4 text-primary" />
                      <span>Tirar foto (Câmera)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handlePickGallery}
                      className="cursor-pointer gap-2 py-2.5 font-medium"
                    >
                      <ImageIcon className="w-4 h-4 text-secondary" />
                      <span>Escolher da galeria</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsCameraOpen(true)}
                      className="cursor-pointer gap-2 py-2 font-normal text-xs text-muted-foreground"
                    >
                      <Camera className="w-3.5 h-3.5 opacity-70" />
                      <span>WebCam ao vivo (PC)</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Input de câmera direta do celular/dispositivo */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={handleAvatarPick}
                />

                {/* Input de galeria/arquivos */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarPick}
                />
              </div>

              <CameraCaptureModal
                open={isCameraOpen}
                onOpenChange={setIsCameraOpen}
                onCapture={(file) => avatarMutation.mutate(file)}
                title="Foto de Perfil"
                description="Tire uma foto sua pela câmera ou webcam para atualizar seu perfil."
              />

              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <h1 className="font-display font-bold text-xl sm:text-2xl text-foreground truncate">{user.name}</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary font-semibold">
                    {user.role === "STUDENT"
                      ? "Aluno"
                      : user.role === "PERSONAL"
                        ? user.professionTitle || "Profissional"
                        : "Academia"}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                    Plano: {planName}
                  </span>
                  {!isMaxPlan && (
                    <Button variant="outline" size="sm" className="h-6 text-[11px] font-bold border-primary text-primary hover:bg-primary hover:text-white transition-colors" asChild>
                      <Link to="/planos">Fazer Upgrade</Link>
                    </Button>
                  )}
                </div>

                {/* ESTATÍSTICAS SOCIAIS DO PERFIL & BOTÃO PERFIL PÚBLICO */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div>
                      <strong className="text-foreground font-bold text-sm mr-1">{userPosts.length}</strong>
                      <span>publicações</span>
                    </div>
                    <div>
                      <strong className="text-foreground font-bold text-sm mr-1">
                        {user.role === "PERSONAL" ? (user as any).followersCount || 14 : 8}
                      </strong>
                      <span>seguidores</span>
                    </div>
                    <div>
                      <strong className="text-foreground font-bold text-sm mr-1">12</strong>
                      <span>seguindo</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary hover:text-white"
                    asChild
                  >
                    <Link to={`/perfil/${user.id}`}>
                      <Eye className="w-3.5 h-3.5" /> Ver Perfil Público
                    </Link>
                  </Button>
                </div>

                {avatarMutation.isPending && (
                  <p className="text-xs text-muted-foreground mt-1 animate-pulse">Enviando foto...</p>
                )}
              </div>
            </div>
          </div>

          {/* CARD DE BIOGRAFIA (COM VALIDAÇÃO ANTI-TELEFONE) */}
          <div className="bg-card border border-border rounded-3xl p-5 sm:p-6 mb-6 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-foreground">
                    Minha Biografia & Apresentação
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Apresente suas especialidades e metodologia para novos alunos no seu perfil público
                  </p>
                </div>
              </div>

              <span className={`text-xs font-semibold ${bioText.length > 500 ? "text-amber-500" : "text-muted-foreground"}`}>
                {bioText.length}/500
              </span>
            </div>

            <div className="space-y-2">
              <textarea
                value={bioText}
                onChange={handleBioChange}
                placeholder="Ex: Especialista em hipertrofia, emagrecimento consciente e consultoria de treino. Formado em Educação Física com foco em resultados consistentes..."
                maxLength={500}
                rows={3}
                className={`w-full rounded-2xl bg-muted/40 border px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all resize-none ${
                  bioError
                    ? "border-destructive/60 focus:ring-destructive/30"
                    : "border-border/70 focus:ring-primary/40 focus:border-primary"
                }`}
              />

              {/* ALERTA VISUAL ANTI-TELEFONE / ANTI-DESINTERMEDIAÇÃO */}
              {bioError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Regra de Segurança da Plataforma:</p>
                    <p className="text-destructive/90">{bioError}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-muted-foreground">
                  * Não é permitido colocar números de telefone ou WhatsApp na bio.
                </p>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveBio}
                  disabled={savingBio || Boolean(bioError) || (!isBioDirty && bioText === (user.bio || ""))}
                  className="h-8 text-xs font-bold gap-1.5 px-4 shadow-sm"
                >
                  {savingBio ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Salvar Bio
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* NAVEGAÇÃO POR ABAS: FEED DO PERFIL VS CONFIGURAÇÕES */}
          <div className="flex items-center gap-2 mb-6 border-b border-border/70 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("feed")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "feed"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border/70"
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Minhas Postagens ({userPosts.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "settings"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border/70"
              }`}
            >
              <Settings className="w-4 h-4" /> Conta & Serviços
            </button>
          </div>

          {/* ABA 1: FEED DE POSTAGENS DO PERFIL */}
          {activeTab === "feed" && (
            <div className="space-y-6">
              {/* Criador de post no perfil */}
              <CreatePostCard onPostCreated={handlePostCreated} />

              {/* Lista de publicações do usuário */}
              {postsLoading ? (
                <div className="rounded-2xl border border-border/60 bg-card p-10 flex flex-col items-center justify-center gap-3 text-center">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Carregando suas publicações...</p>
                </div>
              ) : userPosts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-3 bg-card/40">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                    <Dumbbell className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-base text-foreground">
                    Você ainda não fez nenhuma publicação
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Compartilhe fotos de treinos, evolução, dicas ou tire dúvidas com a comunidade!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onPostShared={handlePostShared}
                      onPostDeleted={handlePostDeleted}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA 2: CONTA & SERVIÇOS */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              {/* CARD DE STATUS DE CREDENCIAMENTO / DOCUMENTAÇÃO FINEX (PROFISSIONAL & ACADEMIA) */}
              {isProvider && (
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-base text-foreground">
                          Credenciamento Profissional Finex
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Status de verificação do seu registro e documentação
                        </p>
                      </div>
                    </div>

                    {/* Badges de Status */}
                    {user.status === "ATIVO" || user.status === "KYC_APROVADO" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Credenciado
                      </span>
                    ) : user.status === "KYC_REJEITADO" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Ação Necessária
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        Em Análise
                      </span>
                    )}
                  </div>

                  {/* Detalhes do Documento e CREF */}
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Registro Profissional:</span>
                        <span className="font-semibold text-foreground text-sm">
                          {user.cref || "Informado no cadastro"}
                        </span>
                      </div>

                      {user.documentUrl && (
                        <a
                          href={resolveMediaUrl(user.documentUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-background border border-border hover:border-primary/40 hover:text-primary transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Visualizar Comprovante
                        </a>
                      )}
                    </div>

                    {/* Motivo de Rejeição, se houver */}
                    {user.status === "KYC_REJEITADO" && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                        <p className="font-semibold mb-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Motivo da recusa pela equipe Finex:
                        </p>
                        <p className="text-destructive/90">
                          {user.kycRejectionReason || "Comprovante ilegível ou dados divergentes. Por favor, reenvie um documento válido."}
                        </p>
                      </div>
                    )}

                    {/* Ação de Reenvio / Troca de Documento */}
                    <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className="text-[11px] text-muted-foreground">
                        {user.status === "ATIVO" || user.status === "KYC_APROVADO"
                          ? "Seus dados foram verificados pelo compliance da Finex."
                          : "Mantenha seu documento legível para aprovação rápida."}
                      </p>

                      <Button
                        type="button"
                        variant={user.status === "KYC_REJEITADO" ? "destructive" : "outline"}
                        size="sm"
                        className="h-8 text-xs font-semibold shrink-0 gap-1.5"
                        disabled={documentMutation.isPending}
                        onClick={() => docInputRef.current?.click()}
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        {documentMutation.isPending
                          ? "Enviando..."
                          : user.documentUrl
                          ? "Reenviar Comprovante"
                          : "Enviar Comprovante"}
                      </Button>
                      <input
                        ref={docInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={handleDocumentPick}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ATALHOS DE CONTA */}
              <div className="flex flex-col gap-2">
                <Link to="/carteira" className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">Carteira & Saldo</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
                
                {isProvider && (
                  <>
                    <Link to="/agenda-profissional" className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium text-foreground">Meus alunos</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </Link>
                    <Link to="/meus-servicos" className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <List className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium text-foreground">Meus serviços</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </Link>
                  </>
                )}

                {!isProvider && (
                  <Link to="/meus-agendamentos" className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium text-foreground">Meus agendamentos</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </Link>
                )}

                <Link to="/planos" className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">Planos & Assinaturas</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>

                <a
                  href="https://wa.me/5551991562823?text=Ol%C3%A1!%20Preciso%20de%20suporte%20no%20app%20Conex%C3%A3o%20Fitness"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.952 3.71 1.453 5.711 1.454h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    <div>
                      <span className="font-medium text-foreground block">Suporte no WhatsApp</span>
                      <span className="text-xs text-muted-foreground">Fale com nossa equipe</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                </a>

                <button onClick={() => { logout(); navigate("/"); }} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between hover:bg-destructive/5 transition-colors group mt-4">
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5 text-destructive group-hover:text-destructive/80" />
                    <span className="font-medium text-destructive group-hover:text-destructive/80">Sair da conta</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Perfil;
