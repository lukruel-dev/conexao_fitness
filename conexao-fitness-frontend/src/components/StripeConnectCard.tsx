import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  Loader2,
  RefreshCw,
  Building2,
  Sparkles,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getPaymentAccountStatus, onboardProvider } from "@/services/payments";

interface StripeConnectCardProps {
  role: "PERSONAL" | "ACADEMIA";
  compact?: boolean;
}

export const StripeConnectCard: React.FC<StripeConnectCardProps> = ({ role, compact = false }) => {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Consulta do status atual da conta na Stripe
  const {
    data: status,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["stripe-account-status"],
    queryFn: getPaymentAccountStatus,
    staleTime: 1000 * 60 * 3, // 3 minutos
    retry: 1,
  });

  // Mutação para gerar link de Onboarding Stripe Connect
  const onboardMutation = useMutation({
    mutationFn: onboardProvider,
    onMutate: () => {
      setIsRedirecting(true);
    },
    onSuccess: (data) => {
      if (data.url) {
        toast.info("Redirecionando para o ambiente seguro da Stripe...", {
          description: "Cadastre sua conta bancária para receber seus repasses automáticos.",
        });
        window.location.href = data.url;
      } else {
        setIsRedirecting(false);
        toast.error("Erro ao gerar link de conexão bancária.");
      }
    },
    onError: (err: any) => {
      setIsRedirecting(false);
      toast.error("Não foi possível iniciar a conexão com a Stripe", {
        description: err.message || "Tente novamente em instantes.",
      });
    },
  });

  // Listener para capturar o retorno da Stripe no navegador
  useEffect(() => {
    const stripeParam = searchParams.get("stripe");
    if (stripeParam === "success") {
      toast.success("Conta bancária conectada com sucesso!", {
        description: "Seus dados foram vinculados à Stripe e sua conta está ativa para recebimento.",
      });
      qc.invalidateQueries({ queryKey: ["stripe-account-status"] });
      searchParams.delete("stripe");
      setSearchParams(searchParams, { replace: true });
    } else if (stripeParam === "refresh") {
      toast.warning("Sessão da Stripe expirada.", {
        description: "Clique no botão abaixo para retomar o preenchimento da sua conta.",
      });
      searchParams.delete("stripe");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, qc]);

  const handleStartOnboarding = () => {
    onboardMutation.mutate();
  };

  const isConnected = !!status?.isConnected;
  const isReady = !!status?.payoutsEnabled;
  const isPending = isConnected && !isReady;

  const roleLabel = role === "ACADEMIA" ? "sua academia" : "você";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card/95 to-primary/5 p-5 sm:p-6 shadow-sm transition-all hover:shadow-md">
      {/* Detalhe de fundo decorativo em gradiente */}
      <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Cabeçalho do Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 text-white shadow-md shadow-primary/20">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-base text-foreground flex items-center gap-1.5">
                  Recebimento Automático
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold border border-violet-500/20">
                    Stripe Connect
                  </span>
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Receba pagamentos com cartão, parcelamento em até 12x e repasses em D+2
              </p>
            </div>
          </div>

          {/* Badges de Status */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verificando...
              </span>
            ) : isReady ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Conta Ativa & Pronta
              </span>
            ) : isPending ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                Configuração Pendente
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-3.5 h-3.5" />
                Pronto para Conectar
              </span>
            )}
          </div>
        </div>

        {/* Grade de Benefícios / Destaques */}
        {!compact && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-background/50 border border-border/50 text-xs">
              <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground block">Split Instantâneo</span>
                <span className="text-muted-foreground text-[11px] leading-tight block">
                  Sua parte de 90% é separada no momento exato do pagamento.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-background/50 border border-border/50 text-xs">
              <Banknote className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground block">Repasse em D+2</span>
                <span className="text-muted-foreground text-[11px] leading-tight block">
                  Depósito direto na conta bancária cadastrada sem complicação.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-background/50 border border-border/50 text-xs">
              <ShieldCheck className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground block">Segurança Stripe</span>
                <span className="text-muted-foreground text-[11px] leading-tight block">
                  Proteção antifraude de ponta a ponta e compliance financeiro.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Informações de Status e Ações */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-muted-foreground">
            {isReady ? (
              <p className="flex items-center gap-1.5 text-foreground font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Sua conta Stripe está habilitada para receber pagamentos de alunos e clientes.
              </p>
            ) : isPending ? (
              <p className="text-amber-600 dark:text-amber-400">
                Falta apenas confirmar seus dados bancários no portal seguro da Stripe para liberar seus saques.
              </p>
            ) : (
              <p>
                Conecte a conta bancária onde {roleLabel} deseja receber os valores de aulas, consultorias e planos.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isReady ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartOnboarding}
                disabled={isRedirecting || onboardMutation.isPending}
                className="gap-2 text-xs font-semibold border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 h-9"
              >
                {isRedirecting || onboardMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Abrindo portal...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3.5 h-3.5" />
                    Gerenciar no Stripe
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleStartOnboarding}
                disabled={isRedirecting || onboardMutation.isPending}
                className="gap-2 text-xs font-bold bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white shadow-sm shadow-primary/25 h-9 px-4 transition-transform active:scale-95"
              >
                {isRedirecting || onboardMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Conectando...
                  </>
                ) : isPending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Completar Cadastro Bancário
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3.5 h-3.5" />
                    Conectar Conta Bancária
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
