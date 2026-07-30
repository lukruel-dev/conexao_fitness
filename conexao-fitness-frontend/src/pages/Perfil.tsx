import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { onboardProvider, createSubscription } from "@/services/payments";
import { uploadAvatar, updateMyAvatar } from "@/services/uploads";
import { CreditCard, ShieldCheck, User, Crown, CalendarDays, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { CheckoutModal } from "@/components/CheckoutModal";

const PREMIUM_PRICE_ID =
  (import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID as string | undefined) ?? "price_premium_default";

const Perfil = () => {
  const { user, isAuthenticated, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (searchParams.get("subscription_success") === "true") {
      toast.success("Assinatura ativada com sucesso! Você agora é Premium!");
      searchParams.delete("subscription_success");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const onboardMutation = useMutation({
    mutationFn: () => onboardProvider(),
    onSuccess: (res) => {
      if (res?.url) {
        toast.info("Redirecionando para o Stripe...");
        window.location.href = res.url;
      } else {
        toast.error("URL de onboarding não recebida.");
      }
    },
    onError: (err: Error) =>
      toast.error("Não foi possível iniciar a configuração", { description: err.message }),
  });

  const subscribeMutation = useMutation({
    mutationFn: () => createSubscription(PREMIUM_PRICE_ID),
    onSuccess: (res) => {
      if (res?.clientSecret) {
        setClientSecret(res.clientSecret);
      } else {
        toast.error("Secret de pagamento não recebido.");
      }
    },
    onError: (err: Error) =>
      toast.error("Não foi possível iniciar a assinatura", { description: err.message }),
  });

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

  if (!user) return null;

  const isProvider = user.role === "PERSONAL" || user.role === "ACADEMIA";

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
              <div>
                <h2 className="font-display font-bold text-lg">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <span className="text-xs px-2 py-0.5 mt-1 inline-block rounded-full bg-secondary/10 text-secondary font-medium">
                  {user.role === "STUDENT"
                    ? "Aluno"
                    : user.role === "PERSONAL"
                      ? user.professionTitle || "Profissional"
                      : user.role === "ADMIN"
                        ? "Admin"
                        : "Academia"}
                </span>
                {avatarMutation.isPending && (
                  <p className="text-xs text-muted-foreground mt-1">Enviando foto...</p>
                )}
              </div>
            </div>
          </div>

          {isProvider && (
            <>
              <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <CreditCard className="w-6 h-6 text-secondary mt-0.5" />
                  <div>
                    <h3 className="font-display font-bold text-lg">Recebimentos</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure sua conta no Stripe para receber repasses automáticos das suas reservas.
                      Os pagamentos são divididos automaticamente entre a plataforma e você.
                    </p>
                  </div>
                </div>
                <Button
                  variant="hero"
                  className="w-full md:w-auto"
                  onClick={() => onboardMutation.mutate()}
                  disabled={onboardMutation.isPending}
                >
                  <ShieldCheck className="w-4 h-4" />
                  {onboardMutation.isPending ? "Redirecionando..." : "Configurar Recebimentos (Stripe)"}
                </Button>
              </div>

              <div className="relative bg-card border-2 border-yellow-400 rounded-2xl p-6 mb-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-amber-500/10 pointer-events-none" />
                <div className="relative">
                  <div className="flex items-start gap-3 mb-4">
                    <Crown className="w-6 h-6 text-yellow-500 mt-0.5" />
                    <div>
                      <h3 className="font-display font-bold text-lg flex items-center gap-2">
                        Meu Plano
                        <span className="text-[10px] font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-2 py-0.5 rounded-full">
                          PREMIUM
                        </span>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Apareça em destaque no topo das buscas, ganhe um selo exclusivo e atraia mais alunos.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="hero"
                    className="w-full md:w-auto bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black"
                    onClick={() => subscribeMutation.mutate()}
                    disabled={subscribeMutation.isPending}
                  >
                    <Crown className="w-4 h-4" />
                    {subscribeMutation.isPending ? "Processando..." : "Assinar Plano Premium"}
                  </Button>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <CalendarDays className="w-6 h-6 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-display font-bold text-lg">Minha agenda</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure seus dias e horários de trabalho e gere as vagas dos seus serviços automaticamente.
                    </p>
                  </div>
                </div>
                <Button asChild variant="hero" className="w-full md:w-auto">
                  <Link to="/minha-agenda">
                    <CalendarDays className="w-4 h-4" />
                    Gerenciar agenda
                  </Link>
                </Button>
              </div>
            </>
          )}

          <Button variant="outline" onClick={() => { logout(); navigate("/"); }}>
            Sair da conta
          </Button>
        </div>
      </main>
      <Footer />
      <CheckoutModal
        isOpen={!!clientSecret}
        onClose={() => setClientSecret(null)}
        clientSecret={clientSecret}
        onSuccess={() => {
          toast.success("Assinatura concluída com sucesso!");
          setClientSecret(null);
          // Atualizar o estado do usuário ou recarregar
          window.location.reload();
        }}
      />
    </div>
  );
};

export default Perfil;
