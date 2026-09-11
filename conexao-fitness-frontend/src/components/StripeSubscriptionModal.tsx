import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
  Check,
  Building2,
  User,
  Dumbbell,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { sounds } from "@/lib/soundEffects";
import { toast } from "sonner";
import { createSubscription } from "@/services/payments";
import { useQueryClient } from "@tanstack/react-query";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_test_mock");

interface StripeSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    name: string;
    price: string;
    period?: string;
    description?: string;
    features?: string[];
    priceId?: string;
    roleCategory?: "STUDENT" | "PERSONAL" | "ACADEMIA";
  } | null;
  onSuccess?: () => void;
}

const CheckoutForm: React.FC<{
  planName: string;
  planPrice: string;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ planName, planPrice, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message ?? "Não foi possível autorizar o pagamento.");
      setIsProcessing(false);
    } else {
      setIsProcessing(false);
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <PaymentElement />
      {errorMessage && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
          {errorMessage}
        </div>
      )}
      <div className="flex items-center justify-between gap-2 pt-4">
        <Button variant="outline" type="button" onClick={onCancel} disabled={isProcessing} className="rounded-xl font-bold">
          Cancelar
        </Button>
        <Button type="submit" variant="hero" disabled={isProcessing || !stripe || !elements} className="rounded-xl font-black shadow-glow">
          {isProcessing ? "Processando..." : `Pagar ${planPrice}`}
        </Button>
      </div>
    </form>
  );
};

export const StripeSubscriptionModal: React.FC<StripeSubscriptionModalProps> = ({
  isOpen,
  onClose,
  plan,
  onSuccess,
}) => {
  const { user, setUser } = useAuth();
  const qc = useQueryClient();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingSecret, setIsLoadingSecret] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isProcessingMock, setIsProcessingMock] = useState(false);

  // Form State para Simulação de Cartão
  const [cardNumber, setCardNumber] = useState("•••• •••• •••• 4242");
  const [cardHolder, setCardHolder] = useState(user?.name || "TITULAR DO CARTÃO");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("•••");

  if (!plan || !isOpen) return null;

  const isMock = !import.meta.env.VITE_STRIPE_PUBLIC_KEY || import.meta.env.VITE_STRIPE_PUBLIC_KEY.includes("mock");

  const handleCompleteSubscription = () => {
    setIsProcessingMock(true);

    setTimeout(() => {
      setIsProcessingMock(false);
      sounds.playAccessGranted();
      sounds.playAchievement();

      // Atualiza plano ativo no cache local e no context de autenticação
      if (user) {
        setUser({
          ...user,
          plan: plan.name,
        } as any);
      }
      localStorage.setItem("cf_user_plan", plan.name);

      // Invalida queries
      qc.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      qc.invalidateQueries({ queryKey: ["my-personal-profile"] });
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      qc.invalidateQueries({ queryKey: ["wallet-balance"] });

      setIsSuccessModalOpen(true);
      toast.success(`Assinatura do ${plan.name} ativada com sucesso! 💳✨`);
      onSuccess?.();
    }, 1200);
  };

  const handleFinalizeAndClose = () => {
    setIsSuccessModalOpen(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen && !isSuccessModalOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[520px] p-0 bg-card border-border/80 rounded-3xl overflow-hidden shadow-2xl">
          {/* Header com Gradiente */}
          <div className="p-6 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/15 border-b border-border/60 relative">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-primary px-3 py-1 rounded-full bg-primary/15 border border-primary/25">
                Stripe Secure Checkout
              </span>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <Lock className="w-3 h-3" /> SSL 256-bit
              </div>
            </div>

            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-2xl font-black font-display text-foreground">
                  {plan.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {plan.description || "Assinatura mensal recorrente com renovação automática."}
                </DialogDescription>
              </div>

              <div className="text-right shrink-0">
                <span className="text-2xl sm:text-3xl font-black text-foreground">{plan.price}</span>
                <span className="text-xs text-muted-foreground block">{plan.period || "/mês"}</span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Benefícios Inclusos */}
            {plan.features && plan.features.length > 0 && (
              <div className="p-3.5 bg-muted/40 rounded-2xl border border-border/50 space-y-1.5">
                <span className="text-[11px] font-bold text-foreground block uppercase">
                  O que está incluso no {plan.name}:
                </span>
                <div className="space-y-1">
                  {plan.features.slice(0, 4).map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cartão de Pagamento Stripe */}
            {isMock ? (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-border/80 text-white shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <CreditCard className="w-6 h-6 text-primary" />
                    <span className="font-mono text-xs text-primary font-bold">POWERED BY STRIPE</span>
                  </div>

                  <div className="font-mono text-lg tracking-widest text-slate-200 mb-4">
                    •••• •••• •••• 4242
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <div>
                      <span className="text-[9px] block uppercase opacity-75">Titular</span>
                      <span className="text-slate-200 font-bold">{user?.name || "ASSINANTE FINEX"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] block uppercase opacity-75">Expira</span>
                      <span className="text-slate-200 font-bold">12/28</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={onClose}
                    disabled={isProcessingMock}
                    className="rounded-2xl h-11 px-5 text-xs font-bold"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="hero"
                    onClick={handleCompleteSubscription}
                    disabled={isProcessingMock}
                    className="flex-1 rounded-2xl h-11 text-xs font-black shadow-glow text-black gap-2"
                  >
                    {isProcessingMock ? (
                      "Conectando ao Stripe..."
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Confirmar Assinatura ({plan.price})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm
                    planName={plan.name}
                    planPrice={plan.price}
                    onSuccess={handleCompleteSubscription}
                    onCancel={onClose}
                  />
                </Elements>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Celebratório de Sucesso */}
      <Dialog open={isSuccessModalOpen} onOpenChange={handleFinalizeAndClose}>
        <DialogContent className="sm:max-w-[460px] p-6 bg-card border-border/80 rounded-3xl text-center space-y-5 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-glow">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1.5">
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-black uppercase">
              Assinatura Stripe Confirmada
            </Badge>
            <h3 className="text-2xl font-black font-display text-foreground">
              Parabéns! Você agora é {plan.name}!
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
              Seu acesso a todos os recursos premium do ecossistema Finex foi liberado com sucesso.
            </p>
          </div>

          <Button
            variant="hero"
            onClick={handleFinalizeAndClose}
            className="w-full h-11 rounded-2xl font-black shadow-glow text-black"
          >
            Acessar Minha Conta <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
