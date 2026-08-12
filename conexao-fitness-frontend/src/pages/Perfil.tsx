import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { onboardProvider, createSubscription } from "@/services/payments";
import { uploadAvatar, updateMyAvatar } from "@/services/uploads";
import { CreditCard, User, Crown, CalendarDays, Camera, ChevronRight, Users, List, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef } from "react";

const getMaxPlan = (role: string) => {
  if (role === 'STUDENT') return 'Premium';
  if (role === 'PERSONAL' || role === 'ACADEMIA') return 'Elite';
  return 'Premium';
};

const Perfil = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
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

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 flex flex-col items-center justify-center min-h-[70vh]">
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

  const isProvider = user.role === "PERSONAL" || user.role === "ACADEMIA";
  const planName = user.planName || "Gratuito";
  const isMaxPlan = planName === getMaxPlan(user.role);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
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
                          : user.role === "ADMIN"
                            ? "Admin"
                            : "Academia"}
                    </span>
                    <span className="text-xs px-2 py-0.5 inline-block rounded-full bg-[#14b8a6]/20 text-[#14b8a6] font-bold border border-[#14b8a6]/30">
                      Plano Atual: {planName}
                    </span>
                  </div>
                  
                  {!isMaxPlan && user.role !== "ADMIN" && (
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

            <Link to="/perfil" className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Perfil</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>

            <Link to="/planos" className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Planos</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>

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
