import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { onboardProvider, createSubscription } from "@/services/payments";
import { uploadAvatar, updateMyAvatar, uploadDocument, updateMyDocument } from "@/services/uploads";
import { CreditCard, User, Crown, CalendarDays, Camera, ChevronRight, Users, List, LogOut, FileCheck, FileText, AlertCircle, CheckCircle2, Clock, UploadCloud, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef, useState } from "react";

const getMaxPlan = (role: string) => {
  if (role === 'STUDENT') return 'Premium';
  if (role === 'PERSONAL' || role === 'ACADEMIA') return 'Elite';
  return 'Premium';
};

const Perfil = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

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
              Faça login ou cadastre-se para gerenciar seu perfil, agendamentos e carteira.
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
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Meu <span className="gradient-text">perfil</span>
          </h1>
          <p className="text-muted-foreground mb-6">Gerencie sua conta e recebimentos.</p>

          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-primary" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarMutation.isPending}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 disabled:opacity-60"
                  aria-label="Trocar foto de perfil"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarPick}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display font-bold text-lg truncate">{user.name}</h2>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                <div className="flex flex-col gap-2 mt-2 items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 inline-block rounded-full bg-secondary/10 text-secondary font-medium">
                      {user.role === "STUDENT"
                        ? "Aluno"
                        : user.role === "PERSONAL"
                          ? user.professionTitle || "Profissional"
                          : "Academia"}
                    </span>
                    <span className="text-xs px-2 py-0.5 inline-block rounded-full bg-[#14b8a6]/20 text-[#14b8a6] font-bold border border-[#14b8a6]/30">
                      Plano Atual: {planName}
                    </span>
                  </div>
                  
                  {!isMaxPlan && (
                    <Button variant="outline" size="sm" className="h-7 text-xs font-bold border-[#14b8a6] text-[#14b8a6] hover:bg-[#14b8a6] hover:text-white transition-colors" asChild>
                      <Link to="/planos">Fazer Upgrade</Link>
                    </Button>
                  )}
                </div>

                {avatarMutation.isPending && (
                  <p className="text-xs text-muted-foreground mt-1">Enviando foto...</p>
                )}
              </div>
            </div>
          </div>

          {/* CARD DE STATUS DE CREDENCIAMENTO / DOCUMENTAÇÃO FINEX (PROFISSIONAL & ACADEMIA) */}
          {isProvider && (
            <div className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm">
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
                      href={user.documentUrl}
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

          <div className="flex flex-col gap-2">
            <Link to="/carteira" className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Carteira</span>
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
                <span className="font-medium text-foreground">Planos</span>
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
      </main>
      <Footer />
    </div>
  );
};

export default Perfil;
