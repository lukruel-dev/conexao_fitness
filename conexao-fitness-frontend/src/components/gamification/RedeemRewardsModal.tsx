import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Gift,
  CheckCircle2,
  AlertCircle,
  Share2,
  Copy,
  Users,
  Package,
  Trophy,
  Shirt,
  Coffee,
  CupSoda,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { redeemFinexPoints } from '@/services/gamification';
import { soundEffects } from '@/utils/audioAlerts';
import type { RedeemRewardResponse, MysteryPrize } from '@/types/gamification';

interface RedeemRewardsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pointsBalance: number;
  onSuccess?: () => void;
}

export const RedeemRewardsModal: React.FC<RedeemRewardsModalProps> = ({
  open,
  onOpenChange,
  pointsBalance = 0,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'FRIEND_PASS' | 'MYSTERY_BOX'>('FRIEND_PASS');
  const [loading, setLoading] = useState(false);
  const [isOpeningBox, setIsOpeningBox] = useState(false);
  const [redeemResult, setRedeemResult] = useState<RedeemRewardResponse | null>(null);

  const FRIEND_PASS_COST = 300;
  const MYSTERY_BOX_COST = 1000;

  const handleRedeemFriendPass = async () => {
    if (pointsBalance < FRIEND_PASS_COST) {
      toast.error(`Saldo insuficiente. O Day Pass para amigo requer ${FRIEND_PASS_COST} pontos.`);
      return;
    }

    try {
      setLoading(true);
      const res = await redeemFinexPoints({ type: 'FRIEND_DAY_PASS' });
      soundEffects.playSuccessChime();
      setRedeemResult(res);
      toast.success('Day Pass para amigo resgatado com sucesso!');
      onSuccess?.();
    } catch (err: any) {
      soundEffects.playErrorTone();
      toast.error('Não foi possível resgatar', { description: err?.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMysteryBox = async () => {
    if (pointsBalance < MYSTERY_BOX_COST) {
      toast.error(`A Caixa Misteriosa requer ${MYSTERY_BOX_COST} pontos.`);
      return;
    }

    try {
      setLoading(true);
      setIsOpeningBox(true);
      soundEffects.playCountdownBeep();

      // Animação de suspense de 2 segundos
      await new Promise((resolve) => setTimeout(resolve, 1800));

      const res = await redeemFinexPoints({ type: 'MYSTERY_BOX' });
      soundEffects.playSuccessChime();
      setRedeemResult(res);
      toast.success(res.message);
      onSuccess?.();
    } catch (err: any) {
      soundEffects.playErrorTone();
      toast.error('Erro ao abrir caixa', { description: err?.message });
    } finally {
      setLoading(false);
      setIsOpeningBox(false);
    }
  };

  const handleShareWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado para a área de transferência!');
  };

  const handleClose = () => {
    setRedeemResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-6 bg-card border border-border">
        {redeemResult ? (
          /* Tela de Sucesso / Voucher */
          <div className="space-y-5 text-center py-2 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center shadow-xl shadow-amber-500/30">
              {redeemResult.rewardType === 'MYSTERY_BOX' ? (
                <Trophy className="w-8 h-8" />
              ) : (
                <Users className="w-8 h-8" />
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
                {redeemResult.rewardType === 'MYSTERY_BOX' ? '🎁 Brinde Exclusivo Ganho!' : '🎟️ Day Pass Amigo Liberado'}
              </span>
              <h3 className="text-xl font-display font-bold text-foreground mt-2">
                {redeemResult.rewardType === 'MYSTERY_BOX' && redeemResult.prize
                  ? redeemResult.prize.name
                  : 'Day Pass para seu Amigo'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {redeemResult.rewardType === 'MYSTERY_BOX'
                  ? 'Você desbloqueou um brinde oficial da edição deste mês!'
                  : 'Seu amigo tem acesso cortesia a um treino completo na academia parceira.'}
              </p>
            </div>

            {/* Cartão do Voucher */}
            <div className="p-4 rounded-2xl bg-muted/50 border border-primary/30 space-y-2">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Código do Voucher</span>
              <div className="text-2xl font-mono font-black text-primary tracking-widest bg-background/80 py-2 px-4 rounded-xl border border-border shadow-inner">
                {redeemResult.voucherCode}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {redeemResult.instructions || 'Apresente este código na recepção ou catraca para validação imediata.'}
              </p>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <Button
                variant="outline"
                className="w-full gap-2 text-xs font-semibold"
                onClick={() => handleCopyCode(redeemResult.voucherCode)}
              >
                <Copy className="w-4 h-4" /> Copiar Código
              </Button>

              <Button
                variant="hero"
                className="w-full gap-2 text-xs font-semibold shadow-lg shadow-primary/20"
                onClick={() =>
                  handleShareWhatsApp(
                    redeemResult.shareText ||
                      `E aí! Ganhei um presente no app Conexão Fitness para você: ${redeemResult.voucherCode}`
                  )
                }
              >
                <Share2 className="w-4 h-4" /> Compartilhar no WhatsApp
              </Button>
            </div>

            <Button variant="ghost" size="sm" onClick={handleClose} className="text-xs text-muted-foreground">
              Voltar ao app
            </Button>
          </div>
        ) : (
          /* Tela Principal de Seleção de Recompensas */
          <>
            <DialogHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-2 bg-gradient-to-tr from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/20">
                <Sparkles className="w-6 h-6 fill-current" />
              </div>
              <DialogTitle className="text-xl font-bold font-display">
                Recompensas Finex
              </DialogTitle>
              <DialogDescription className="text-xs">
                Troque seus pontos de treino por Day Pass para amigos e concorra à Caixa Misteriosa mensal!
              </DialogDescription>
            </DialogHeader>

            {/* Saldo de Pontos */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Seus Pontos Atuais</div>
                <div className="text-xl font-display font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 fill-current" />
                  {pointsBalance} <span className="text-xs font-normal text-muted-foreground">pts</span>
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground text-right">
                Acumule <strong className="text-foreground">+50 pts</strong> por treino
              </span>
            </div>

            {/* Abas */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 rounded-xl mt-2">
              <button
                type="button"
                onClick={() => setActiveTab('FRIEND_PASS')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'FRIEND_PASS'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Day Pass Amigo</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MYSTERY_BOX')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'MYSTERY_BOX'
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Caixa Misteriosa</span>
              </button>
            </div>

            {/* Conteúdo Aba 1: Day Pass Amigo (1x por mês) */}
            {activeTab === 'FRIEND_PASS' && (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-2xl border border-border bg-card/60 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-foreground">1 Day Pass Cortesia para Amigo</h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Traga um amigo ou parceiro de treino para treinar com você de graça em qualquer academia cadastrada na plataforma!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Limite: <strong>1 resgate por mês</strong>
                    </span>
                    <span className="font-bold text-primary">300 pts</span>
                  </div>
                </div>

                <div className="bg-muted/30 p-3 rounded-xl border border-border/40 text-[11px] text-muted-foreground space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Como funciona:
                  </div>
                  <p>
                    Ao resgatar, você recebe um voucher exclusivo que pode ser enviado diretamente pelo WhatsApp para seu amigo apresentar na recepção.
                  </p>
                </div>

                <Button
                  variant="hero"
                  className="w-full h-11 text-xs sm:text-sm font-semibold shadow-lg shadow-primary/20"
                  disabled={loading || pointsBalance < FRIEND_PASS_COST}
                  onClick={handleRedeemFriendPass}
                >
                  {pointsBalance < FRIEND_PASS_COST ? (
                    `Faltam ${FRIEND_PASS_COST - pointsBalance} pts para resgatar`
                  ) : (
                    `Resgatar Day Pass Amigo (${FRIEND_PASS_COST} pts)`
                  )}
                </Button>
              </div>
            )}

            {/* Conteúdo Aba 2: Caixa Misteriosa (1.000 pts) */}
            {activeTab === 'MYSTERY_BOX' && (
              <div className="space-y-4 pt-2">
                {isOpeningBox ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center shadow-2xl animate-bounce">
                      <Package className="w-10 h-10 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-display font-bold text-lg text-foreground animate-pulse">
                        Abrindo a Caixa Misteriosa...
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Sorteando seu brinde exclusivo da edição deste mês! 🎁
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-card via-card to-amber-500/10 space-y-3 relative overflow-hidden">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-foreground">Caixa Misteriosa Finex</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 uppercase tracking-wider">
                              Edição do Mês
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Acumule 1.000 pontos e ganhe um brinde oficial sorteado na hora! O catálogo de brindes muda todo mês.
                          </p>
                        </div>
                      </div>

                      {/* Brindes possíveis da edição */}
                      <div className="pt-2 border-t border-border/50">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block mb-1.5">
                          Itens Sorteados neste Mês:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          <div className="p-1.5 rounded-lg bg-background/60 border border-border/60 flex items-center gap-1.5">
                            <Shirt className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">Camiseta Dry-Fit Finex</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-background/60 border border-border/60 flex items-center gap-1.5">
                            <Coffee className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">Caneca Térmica Inox</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-background/60 border border-border/60 flex items-center gap-1.5">
                            <CupSoda className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">Coqueteleira Black Ed.</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-background/60 border border-border/60 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">Squeeze Pro 1L</span>
                          </div>
                        </div>
                      </div>

                      {/* Progresso de Pontos */}
                      <div className="pt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progresso para a Caixa</span>
                          <span className="font-bold text-amber-400">
                            {pointsBalance} / {MYSTERY_BOX_COST} pts
                          </span>
                        </div>
                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, (pointsBalance / MYSTERY_BOX_COST) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="hero"
                      className="w-full h-11 text-xs sm:text-sm font-semibold shadow-lg shadow-amber-500/20 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black"
                      disabled={loading || pointsBalance < MYSTERY_BOX_COST}
                      onClick={handleOpenMysteryBox}
                    >
                      {pointsBalance < MYSTERY_BOX_COST ? (
                        `Faltam ${MYSTERY_BOX_COST - pointsBalance} pts para abrir a Caixa`
                      ) : (
                        `🎁 Abrir Caixa Misteriosa (1.000 pts)`
                      )}
                    </Button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
