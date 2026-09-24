import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  CreditCard,
  Wallet,
  QrCode,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Loader2,
  MessageCircle,
  Dumbbell,
  Check,
  Copy,
  PartyPopper,
  Lock,
} from 'lucide-react';
import { formatBRL } from '@/lib/format';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyBalance, hirePlanWithWallet } from '@/services/wallet';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckoutModal } from '@/components/CheckoutModal';
import { sounds } from '@/lib/soundEffects';
import { addDemoBooking } from '@/services/bookings';
import { createCheckoutPaymentIntent } from '@/services/payments';

interface PersonalPlanHiringModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Service | null;
  professional: PublicUserProfile;
  onOpenChat: (isAlreadyHired?: boolean) => void;
  onHiringSuccess?: (plan: Service) => void;
}

export const PersonalPlanHiringModal: React.FC<PersonalPlanHiringModalProps> = ({
  open,
  onOpenChange,
  plan,
  professional,
  onOpenChat,
  onHiringSuccess,
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'STRIPE' | 'PIX'>('WALLET');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [isGeneratingIntent, setIsGeneratingIntent] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isPixCopied, setIsPixCopied] = useState(false);
  const [showPixQr, setShowPixQr] = useState(false);

  const { data: walletData } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: getMyBalance,
    enabled: !!user && open,
  });

  const currentBalance = walletData?.current_balance ?? 0;
  const planPriceNum = Number(plan?.price || 0);
  const hasEnoughBalance = currentBalance >= planPriceNum;
  const missingBalance = Math.max(0, planPriceNum - currentBalance);

  // Calcula o número máximo de parcelas permitido para o plano
  const maxInstallments =
    plan?.maxInstallments ||
    (plan?.recurrence === 'ANNUAL'
      ? 12
      : plan?.recurrence === 'SEMIANNUAL'
      ? 6
      : plan?.recurrence === 'QUARTERLY'
      ? 3
      : planPriceNum >= 1000
      ? 12
      : planPriceNum >= 300
      ? 3
      : 1);

  const [selectedInstallments, setSelectedInstallments] = useState<number>(() => {
    return maxInstallments > 1 ? maxInstallments : 1;
  });

  // Atualiza as parcelas selecionadas caso o plano mude
  React.useEffect(() => {
    if (maxInstallments > 1) {
      setSelectedInstallments(maxInstallments);
    } else {
      setSelectedInstallments(1);
    }
  }, [maxInstallments]);

  // Opções de parcelamento para exibição no Cartão de Crédito
  const installmentOptions = Array.from({ length: maxInstallments }, (_, i) => {
    const count = i + 1;
    const installmentAmount = planPriceNum / count;
    return {
      count,
      amount: installmentAmount,
      label:
        count === 1
          ? `1x de ${formatBRL(planPriceNum)} (à vista)`
          : `${count}x de ${formatBRL(installmentAmount)} sem juros`,
    };
  });

  const hireMutation = useMutation({
    mutationFn: async () => {
      return hirePlanWithWallet({
        providerId: professional.id,
        serviceId: plan!.id,
        planName: plan!.name,
        amount: planPriceNum,
        paymentMethod,
        installments: paymentMethod === 'STRIPE' ? selectedInstallments : 1,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      qc.invalidateQueries({ queryKey: ['wallet-statement'] });
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      qc.invalidateQueries({ queryKey: ['my-routines'] });

      // Salva contratação no cache do aluno para persistência imediata
      try {
        const studentPlansKey = `cf_student_plans_${user?.id || 'me'}`;
        const current = JSON.parse(localStorage.getItem(studentPlansKey) || '[]');
        current.unshift({
          id: `hired-${Date.now()}`,
          planId: plan!.id,
          planName: plan!.name,
          professionalId: professional.id,
          professionalName: professional.name,
          professionalAvatar: professional.avatarUrl,
          price: planPriceNum,
          installments: paymentMethod === 'STRIPE' ? selectedInstallments : 1,
          paymentMethod,
          modality: plan!.modality,
          hiredAt: new Date().toISOString(),
          status: 'ACTIVE',
        });
        localStorage.setItem(studentPlansKey, JSON.stringify(current));
      } catch (e) {}

      // Registra a contratação também para o profissional visualizar imediatamente na agenda/painel
      try {
        addDemoBooking({
          name: user?.name || 'Lucas Atleta (Aluno)',
          email: user?.email,
          avatarUrl: user?.avatarUrl,
          phone: user?.phone,
          serviceName: plan!.name,
          goal: 'Acompanhamento & Evolução',
          providerId: professional.id,
          studentId: user?.id,
          price: planPriceNum,
          status: 'CONFIRMED',
        });
      } catch (e) {}

      qc.invalidateQueries({ queryKey: ['provider-bookings'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });

      try {
        sounds.playSuccess();
      } catch (e) {
        console.warn('Sound effect error:', e);
      }

      toast.success('Plano contratado com sucesso! 🎉', {
        description: `Seu plano "${plan!.name}" foi ativado. Fichas e acompanhamento liberados!`,
        duration: 5000,
      });

      setIsSuccessModalOpen(true);
    },
    onError: (err: any) => {
      sounds.playWarning();
      toast.error('Não foi possível concluir a contratação', {
        description: err.message || 'Verifique seu saldo ou tente novamente.',
      });
    },
  });

  const handleCloseSuccess = () => {
    setIsSuccessModalOpen(false);
    onOpenChange(false);
    if (onHiringSuccess && plan) {
      onHiringSuccess(plan);
    }
  };

  if (!plan) return null;

  const planBenefits =
    plan.benefits && plan.benefits.length > 0
      ? plan.benefits
      : [
          'Ficha de Treino Personalizada no App Finex',
          'Ajustes Periódicos de Volume e Carga',
          'Suporte e Dúvidas pelo Chat do App Finex',
          'Vídeos demonstrativos de execução dos exercícios',
        ];

  const recurrenceLabel =
    plan.recurrence === 'ANNUAL'
      ? 'ao ano (12 meses)'
      : plan.recurrence === 'SEMIANNUAL'
      ? 'ao semestre (6 meses)'
      : plan.recurrence === 'QUARTERLY'
      ? 'ao trimestre (3 meses)'
      : 'ao mês';

  const handleConfirmHiring = () => {
    if (!isAuthenticated) {
      toast.info('Faça login ou crie sua conta para contratar o plano.');
      navigate('/login');
      return;
    }

    if (paymentMethod === 'WALLET') {
      if (!hasEnoughBalance) {
        toast.error('Saldo insuficiente na Carteira Finex', {
          description: `Você tem R$ ${currentBalance.toFixed(2)}. Faltam R$ ${missingBalance.toFixed(2)} para este plano.`,
        });
        return;
      }
      hireMutation.mutate();
    } else if (paymentMethod === 'STRIPE') {
      setIsGeneratingIntent(true);
      createCheckoutPaymentIntent({
        providerId: professional.id,
        amount: planPriceNum,
        purpose: 'PLAN_HIRING',
        title: plan.name,
        referenceId: plan.id,
      })
        .then((res) => {
          setStripeClientSecret(res.clientSecret);
          setIsCheckoutModalOpen(true);
        })
        .catch((err) => {
          console.warn('Fallback Stripe intent:', err);
          setStripeClientSecret(`pi_mock_${Date.now()}_secret_mock`);
          setIsCheckoutModalOpen(true);
        })
        .finally(() => {
          setIsGeneratingIntent(false);
        });
    } else if (paymentMethod === 'PIX') {
      setShowPixQr(true);
    }
  };

  const handleCardSuccess = () => {
    setIsCheckoutModalOpen(false);
    hireMutation.mutate();
  };

  const handlePixSuccess = () => {
    setShowPixQr(false);
    hireMutation.mutate();
  };

  const pixCopyCode = `00020126580014BR.GOV.BCB.PIX0136${professional.id || 'finex-pix-key'}520400005303986540${planPriceNum.toFixed(2)}5802BR5920FINEX FITNESS BRASIL6009URUGUAIANA62070503***6304`;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg p-0 overflow-hidden bg-card rounded-3xl border-border/80 shadow-2xl">
          {/* Top Header */}
          <div className="p-6 bg-gradient-to-r from-primary/15 via-primary/5 to-secondary/15 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md shadow-primary/20 shrink-0">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] uppercase font-extrabold tracking-wider text-primary">
                    Contratação Direta de Plano
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" /> Verificado
                  </span>
                </div>
                <DialogTitle className="font-display text-lg sm:text-xl font-black text-foreground leading-snug break-words">
                  {plan.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Acompanhamento com {professional.name}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Card de Resumo do Plano */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-semibold uppercase">
                  Investimento do Plano
                </span>
                <div className="text-right">
                  <span className="text-2xl font-black text-secondary">
                    {formatBRL(planPriceNum)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1 font-medium">
                    /{recurrenceLabel}
                  </span>
                </div>
              </div>

              {/* Destaque de parcelamento sem juros */}
              {maxInstallments > 1 && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span>
                    Ou em até <strong>{maxInstallments}x de {formatBRL(planPriceNum / maxInstallments)}</strong> sem juros no cartão
                  </span>
                </div>
              )}

              {plan.description && (
                <p className="text-xs text-foreground/85 leading-relaxed border-t border-border/40 pt-2">
                  {plan.description}
                </p>
              )}

              {planBenefits && planBenefits.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-foreground block uppercase tracking-wider">
                    O que você recebe:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {planBenefits.map((b, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-tight">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Seleção do Método de Pagamento */}
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Escolha a Forma de Pagamento
              </Label>

              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as any)}
                className="space-y-2.5"
              >
                {/* Opção 1: Saldo da Carteira Finex */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    paymentMethod === 'WALLET'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                      : 'border-border/70 hover:bg-muted/30'
                  }`}
                  onClick={() => setPaymentMethod('WALLET')}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="WALLET" id="hire-pay-wallet" />
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <Label htmlFor="hire-pay-wallet" className="font-bold text-sm cursor-pointer block">
                        Saldo da Carteira Finex
                      </Label>
                      <span className="text-[11px] text-muted-foreground">
                        Disponível:{' '}
                        <strong className={hasEnoughBalance ? 'text-emerald-500' : 'text-amber-500'}>
                          R$ {currentBalance.toFixed(2)}
                        </strong>
                        {!hasEnoughBalance && (
                          <span className="text-red-400 font-semibold ml-1">
                            (Faltam R$ {missingBalance.toFixed(2)})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {!hasEnoughBalance && (
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChange(false);
                        navigate('/carteira');
                      }}
                      className="text-[11px] h-7 px-2.5 rounded-lg border-primary/40 text-primary hover:bg-primary/10 font-bold"
                    >
                      Recarregar
                    </Button>
                  )}
                </div>

                {/* Opção 2: Cartão de Crédito Instantâneo com Parcelamento */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    paymentMethod === 'STRIPE'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                      : 'border-border/70 hover:bg-muted/30'
                  }`}
                  onClick={() => setPaymentMethod('STRIPE')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="STRIPE" id="hire-pay-stripe" />
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <Label htmlFor="hire-pay-stripe" className="font-bold text-sm cursor-pointer block">
                          Cartão de Crédito
                        </Label>
                        <span className="text-[11px] text-muted-foreground">
                          {maxInstallments > 1
                            ? `Parcele em até ${maxInstallments}x sem juros`
                            : 'Aprovação imediata & liberação da ficha de treino'}
                        </span>
                      </div>
                    </div>
                    {maxInstallments > 1 && (
                      <span className="text-[10px] font-extrabold bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-md shrink-0">
                        Até {maxInstallments}x
                      </span>
                    )}
                  </div>

                  {/* Seletor de Parcelas */}
                  {paymentMethod === 'STRIPE' && maxInstallments > 1 && (
                    <div
                      className="pt-2 border-t border-border/50 space-y-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-foreground">
                          Selecione o número de parcelas:
                        </span>
                        <span className="text-emerald-500 font-semibold">Sem juros</span>
                      </div>
                      <select
                        value={selectedInstallments}
                        onChange={(e) => setSelectedInstallments(Number(e.target.value))}
                        className="w-full h-10 px-3 text-xs rounded-xl bg-background border border-border font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                      >
                        {installmentOptions.map((opt) => (
                          <option key={opt.count} value={opt.count}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Opção 3: PIX Instantâneo */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    paymentMethod === 'PIX'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                      : 'border-border/70 hover:bg-muted/30'
                  }`}
                  onClick={() => setPaymentMethod('PIX')}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="PIX" id="hire-pay-pix" />
                    <div className="w-9 h-9 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <Label htmlFor="hire-pay-pix" className="font-bold text-sm cursor-pointer block">
                        Pix Instantâneo
                      </Label>
                      <span className="text-[11px] text-muted-foreground">
                        QR Code dinâmico e Copia e Cola com liberação em tempo real
                      </span>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Aviso de Garantia e Segurança */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-2.5 text-[11px] text-muted-foreground">
              <Lock className="w-4 h-4 text-primary shrink-0" />
              <span>
                Pagamento 100% protegido pela Finex. Acompanhamento, ficha no app e suporte liberados imediatamente.
              </span>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-2 pt-1">
              <Button
                type="button"
                variant="hero"
                onClick={handleConfirmHiring}
                disabled={hireMutation.isPending || (paymentMethod === 'WALLET' && !hasEnoughBalance)}
                className="w-full h-12 rounded-2xl font-black text-sm shadow-md bg-gradient-to-r from-primary to-secondary text-black gap-2"
              >
                {hireMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processando Contratação...
                  </>
                ) : paymentMethod === 'STRIPE' && selectedInstallments > 1 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Confirmar & Contratar ({selectedInstallments}x de {formatBRL(planPriceNum / selectedInstallments)})
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Confirmar & Contratar Agora ({formatBRL(planPriceNum)})
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="text-xs text-muted-foreground hover:text-foreground font-semibold"
                >
                  Voltar
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenChat(false);
                  }}
                  className="rounded-xl text-xs font-bold gap-1.5 border-border/80 hover:bg-muted"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-primary" /> Tirar Dúvidas no Chat Primeiro
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CHECKOUT STRIPE (CARTÃO) */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        clientSecret={stripeClientSecret || "pi_mock_hiring_plan_secret"}
        onSuccess={handleCardSuccess}
      />

      {/* MODAL PIX INSTANTÂNEO */}
      <Dialog open={showPixQr} onOpenChange={setShowPixQr}>
        <DialogContent className="max-w-sm bg-card border-border rounded-3xl p-6 text-center space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-secondary" /> Pagamento via PIX
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pague R$ {planPriceNum.toFixed(2)} para liberar seu plano
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-white rounded-2xl inline-block mx-auto shadow-md">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixCopyCode)}`}
              alt="QR Code PIX"
              className="w-44 h-44 mx-auto rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(pixCopyCode);
                setIsPixCopied(true);
                toast.success('Chave Pix copiada com sucesso!');
                setTimeout(() => setIsPixCopied(false), 3000);
              }}
              className="w-full rounded-xl text-xs font-bold gap-1.5"
            >
              {isPixCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {isPixCopied ? 'Chave Copiada!' : 'Copiar Código Pix'}
            </Button>

            <Button
              type="button"
              variant="hero"
              onClick={handlePixSuccess}
              className="w-full rounded-xl font-bold text-xs bg-gradient-to-r from-primary to-secondary text-black"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" /> Já realizei o pagamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE SUCESSO / CELEBRAÇÃO PÓS-CONTRATAÇÃO */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="max-w-md bg-card border-border rounded-3xl p-7 text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <PartyPopper className="w-8 h-8 animate-bounce" />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-500">
              Contratação Concluída com Sucesso!
            </span>
            <DialogTitle className="font-display text-2xl font-black text-foreground">
              Parabéns pelo seu novo passo!
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              Seu plano <strong>{plan.name}</strong> com <strong>{professional.name}</strong> foi ativado.
              Suas fichas e suporte já estão liberados no App Finex.
            </DialogDescription>
          </div>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-muted-foreground font-semibold">Forma de Pagamento:</span>
              <span className="font-bold text-foreground">
                {paymentMethod === 'STRIPE'
                  ? `Cartão de Crédito (${selectedInstallments}x de ${formatBRL(planPriceNum / selectedInstallments)})`
                  : paymentMethod === 'PIX'
                  ? 'Pix Instantâneo'
                  : 'Saldo da Carteira Finex'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-muted-foreground font-semibold">Valor Total:</span>
              <span className="font-black text-secondary text-sm">
                {formatBRL(planPriceNum)}
              </span>
            </div>
            <p className="font-bold text-foreground flex items-center gap-1.5 pt-1">
              <Sparkles className="w-4 h-4 text-primary" /> Próximos Passos:
            </p>
            <ul className="space-y-1 text-muted-foreground text-[11px]">
              <li>• O profissional foi notificado da sua contratação.</li>
              <li>• O canal de chat direto está aberto para alinhar metas e rotinas.</li>
              <li>• Seus treinos ficarão disponíveis na aba "Treinos" do app.</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleCloseSuccess();
                navigate('/treinos');
              }}
              className="rounded-xl font-bold text-xs"
            >
              Ver Meus Treinos
            </Button>

            <Button
              type="button"
              variant="hero"
              onClick={() => {
                handleCloseSuccess();
                onOpenChat(true);
              }}
              className="rounded-xl font-black text-xs bg-gradient-to-r from-primary to-secondary text-black gap-1.5 shadow-md"
            >
              <MessageCircle className="w-4 h-4" /> Conversar no Chat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
