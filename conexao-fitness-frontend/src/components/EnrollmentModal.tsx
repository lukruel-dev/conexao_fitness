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
  Dumbbell,
  ShieldCheck,
  Calendar,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { formatBRL } from '@/lib/format';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enrollOnline, EnrollmentPaymentMethod, MembershipPlan } from '@/services/memberships';
import { getMyBalance } from '@/services/wallet';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface EnrollmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: MembershipPlan | null;
  academiaName: string;
  academiaId: string;
  onEnrollmentSuccess?: (enrollment: any) => void;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  open,
  onOpenChange,
  plan,
  academiaName,
  academiaId,
  onEnrollmentSuccess,
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState<EnrollmentPaymentMethod>('STRIPE');

  const { data: walletData } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: getMyBalance,
    enabled: !!user && open,
  });

  const currentBalance = walletData?.current_balance ?? 0;
  const planPriceNum = Number(plan?.price || 0);
  const hasEnoughBalance = currentBalance >= planPriceNum;

  const enrollMutation = useMutation({
    mutationFn: () =>
      enrollOnline(academiaId, {
        planId: plan!.id,
        paymentMethod,
      }),
    onSuccess: (enrollment) => {
      qc.invalidateQueries({ queryKey: ['student-enrollments'] });
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      toast.success('Matrícula realizada com sucesso!', {
        description: `Seu acesso à academia ${academiaName} está ativo com QR Code liberado.`,
      });
      onOpenChange(false);
      if (onEnrollmentSuccess) {
        onEnrollmentSuccess(enrollment);
      }
    },
    onError: (err: Error) => {
      toast.error('Não foi possível concluir a matrícula', {
        description: err.message || 'Verifique seus dados ou tente novamente.',
      });
    },
  });

  if (!plan) return null;

  const handleConfirmEnrollment = () => {
    if (!isAuthenticated) {
      toast.info('Faça login para continuar sua matrícula');
      navigate('/login');
      return;
    }

    if (paymentMethod === 'WALLET' && !hasEnoughBalance) {
      toast.error('Saldo insuficiente na carteira', {
        description: 'Faça uma recarga ou selecione Cartão de Crédito / Pix.',
      });
      return;
    }

    enrollMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-card rounded-3xl border-border shadow-2xl">
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-r from-primary/15 via-primary/5 to-secondary/15 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md shadow-primary/20">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider text-primary">
                Matrícula Online
              </span>
              <DialogTitle className="font-display text-xl font-bold text-foreground">
                {plan.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {academiaName}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Card de Resumo do Plano */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Valor da Matrícula</span>
              <span className="text-2xl font-bold text-foreground">
                {formatBRL(planPriceNum)}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  / {plan.durationDays} dias
                </span>
              </span>
            </div>

            {plan.description && (
              <p className="text-xs text-muted-foreground border-t border-border/40 pt-2">
                {plan.description}
              </p>
            )}

            {plan.benefits && plan.benefits.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-foreground block">
                  Benefícios inclusos:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {plan.benefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Seleção do Método de Pagamento */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Forma de Pagamento
            </Label>

            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as EnrollmentPaymentMethod)}
              className="space-y-2.5"
            >
              {/* Opção 1: Cartão de Crédito Instantâneo */}
              <div
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  paymentMethod === 'STRIPE'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                    : 'border-border/70 hover:bg-muted/30'
                }`}
                onClick={() => setPaymentMethod('STRIPE')}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="STRIPE" id="pay-stripe" />
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <Label htmlFor="pay-stripe" className="font-semibold text-sm cursor-pointer block">
                      Cartão de Crédito
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      Aprovação imediata & liberação de QR Code
                    </span>
                  </div>
                </div>
              </div>

              {/* Opção 2: Saldo da Carteira */}
              <div
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  paymentMethod === 'WALLET'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                    : 'border-border/70 hover:bg-muted/30'
                }`}
                onClick={() => setPaymentMethod('WALLET')}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="WALLET" id="pay-wallet" />
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="pay-wallet" className="font-semibold text-sm cursor-pointer">
                        Saldo Conexão Fitness
                      </Label>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-500">
                        {formatBRL(currentBalance)}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {hasEnoughBalance
                        ? 'Débito instantâneo da sua carteira'
                        : 'Saldo insuficiente para este plano'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Opção 3: Pix */}
              <div
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  paymentMethod === 'PIX'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                    : 'border-border/70 hover:bg-muted/30'
                }`}
                onClick={() => setPaymentMethod('PIX')}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="PIX" id="pay-pix" />
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <Label htmlFor="pay-pix" className="font-semibold text-sm cursor-pointer block">
                      Pix Instantâneo
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      Confirmação em tempo real
                    </span>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Dica de Segurança e Catraca */}
          <div className="p-3.5 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center gap-3 text-xs text-foreground">
            <Sparkles className="w-4 h-4 text-secondary shrink-0" />
            <span>
              Ao concluir a matrícula, seu <strong>QR Code de acesso</strong> será gerado automaticamente para liberar sua entrada na catraca da academia.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/20 border-t border-border/50 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancelar
          </Button>

          <Button
            variant="hero"
            onClick={handleConfirmEnrollment}
            disabled={enrollMutation.isPending || (paymentMethod === 'WALLET' && !hasEnoughBalance)}
            className="rounded-xl px-6"
          >
            {enrollMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando Matrícula...
              </>
            ) : (
              `Confirmar Matrícula (${formatBRL(planPriceNum)})`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
