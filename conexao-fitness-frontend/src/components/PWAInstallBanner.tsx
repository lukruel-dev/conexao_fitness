import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if dismissed before
    const isDismissed = localStorage.getItem('cf_pwa_banner_dismissed');
    if (isDismissed) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (isIosDevice) {
      // Show on iOS after a brief delay
      const timer = setTimeout(() => setShowBanner(true), 4000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      alert('Para instalar no iPhone/iPad: Toque no botão Compartilhar (ícone com quadrado e seta) e selecione "Adicionar à Tela de Início".');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('cf_pwa_banner_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <aside
      aria-label="Instalar aplicativo"
      className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-slide-up"
    >
      <div className="p-4 rounded-3xl bg-card/95 backdrop-blur-xl border border-primary/30 shadow-2xl space-y-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />

        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-secondary p-0.5 shrink-0 shadow-lg">
            <img src="/favicon.png" alt="Finex App" className="w-full h-full rounded-2xl object-cover" />
          </div>

          <div className="space-y-0.5 flex-1 pr-4">
            <h3 className="font-bold text-sm font-display text-foreground flex items-center gap-1.5">
              Instalar App Finex <Sparkles className="w-3.5 h-3.5 text-primary" />
            </h3>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Tenha acesso rápido aos seus treinos, carteira e catraca direto da tela inicial.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="hero"
            size="sm"
            onClick={handleInstallClick}
            className="flex-1 rounded-xl font-extrabold text-xs h-9 gap-1.5 shadow-md text-black"
          >
            <Download className="w-3.5 h-3.5" /> {isIOS ? 'Como Instalar no iPhone' : 'Instalar Agora'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="rounded-xl text-xs h-9 text-muted-foreground"
          >
            Depois
          </Button>
        </div>
      </div>
    </aside>
  );
};
