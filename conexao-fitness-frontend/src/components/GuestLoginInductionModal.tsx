import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  MessageSquare,
  QrCode,
  ShieldCheck,
  LogIn,
  UserPlus,
  Flame,
  ArrowRight,
} from 'lucide-react';

export const openGuestLoginModal = (reason?: string) => {
  window.dispatchEvent(new CustomEvent('cf:open-login-modal', { detail: { reason } }));
};

export const GuestLoginInductionModal: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | undefined>();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOpen = (e: CustomEvent<{ reason?: string }>) => {
      setReason(e.detail?.reason);
      setOpen(true);
    };

    window.addEventListener('cf:open-login-modal' as any, handleOpen);
    return () => window.removeEventListener('cf:open-login-modal' as any, handleOpen);
  }, []);

  // Exibição automática no primeiro acesso de visitantes não logados
  useEffect(() => {
    if (isAuthenticated) return;

    const seen = sessionStorage.getItem('cf_guest_induction_seen');
    if (!seen) {
      const timer = setTimeout(() => {
        const path = window.location.pathname;
        if (path === '/login' || path === '/cadastro') return;

        setReason('Participe da maior comunidade fitness: acompanhe treinos diários, tire dúvidas com profissionais e acesse planos exclusivos!');
        setOpen(true);
        sessionStorage.setItem('cf_guest_induction_seen', 'true');
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  if (isAuthenticated) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-primary/30 bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl z-[70]">
        {/* Banner com Gradiente e Destaque */}
        <div className="relative p-6 bg-gradient-to-br from-primary/20 via-card to-background border-b border-border/60 text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-extrabold uppercase tracking-wider mb-3">
            <Flame className="w-3.5 h-3.5" /> Comunidade Conexão Fitness
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-black font-display text-foreground leading-snug">
            Junte-se a milhares de atletas e profissionais!
          </DialogTitle>

          <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
            {reason || 'Crie sua conta gratuita em menos de 1 minuto para publicar treinos, tirar dúvidas e interagir com toda a comunidade.'}
          </DialogDescription>
        </div>

        {/* Benefícios Rápidos */}
        <div className="p-5 sm:p-6 space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40 border border-border/50">
            <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-foreground block">Publique no Feed da Comunidade</span>
              <span className="text-[11px] text-muted-foreground">Compartilhe rotinas de treino, fotos de evolução e tire dúvidas com a galera.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40 border border-border/50">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-foreground block">Catraca Digital & Day Pass</span>
              <span className="text-[11px] text-muted-foreground">Tenha seu QR Code na tela do celular para liberar entrada rápida em academias.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40 border border-border/50">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-foreground block">Profissionais e Academias Verificados</span>
              <span className="text-[11px] text-muted-foreground">Acesse consultorias, treinos e planos com garantia de autenticidade.</span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-2 pt-2">
            <Button
              variant="hero"
              className="w-full h-11 text-sm font-bold gap-2 rounded-2xl shadow-glow-blue"
              onClick={() => {
                setOpen(false);
                navigate('/cadastro');
              }}
            >
              <UserPlus className="w-4 h-4" /> Criar Conta Gratuita <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              className="w-full h-11 text-sm font-semibold gap-2 rounded-2xl border-border hover:bg-muted/80"
              onClick={() => {
                setOpen(false);
                navigate('/login');
              }}
            >
              <LogIn className="w-4 h-4 text-primary" /> Já tenho uma conta (Entrar)
            </Button>
          </div>

          {/* Opção para continuar explorando */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[11px] text-muted-foreground hover:text-foreground underline transition-colors cursor-pointer"
            >
              Continuar explorando como visitante
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
