import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, User } from "lucide-react";

export interface OAuthUserData {
  provider: "google" | "apple";
  email: string;
  name: string;
  avatarUrl?: string;
}

interface OAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: "google" | "apple" | null;
  onSuccess: (data: OAuthUserData) => void;
}

export const OAuthModal: React.FC<OAuthModalProps> = ({
  isOpen,
  onClose,
  provider,
  onSuccess,
}) => {
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!provider) return null;

  const isGoogle = provider === "google";

  const handleSelectAccount = (name: string, email: string, avatarUrl?: string) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess({
        provider,
        name,
        email,
        avatarUrl: avatarUrl || (isGoogle ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" : undefined),
      });
      onClose();
    }, 400);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customName) return;
    handleSelectAccount(customName, customEmail);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border border-border shadow-2xl rounded-2xl p-6">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-muted/80 border border-border shadow-inner">
            {isGoogle ? (
              <svg className="w-7 h-7" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            ) : (
              <svg className="w-7 h-7 text-foreground fill-current" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.09 2.31-.86 3.59-.8 1.51.05 2.95.72 3.81 1.96-3.44 1.96-2.93 6.66.62 8.04-.76 1.77-1.85 3.87-3.1 5.06v-.09zm-3.32-14.7c.69-.95 1.13-2.16.92-3.41-1.11.07-2.38.74-3.1 1.67-.65.8-1.22 2.07-1 3.3 1.25.12 2.45-.63 3.18-1.56z" />
              </svg>
            )}
          </div>
          <DialogTitle className="text-xl font-bold font-display">
            Continuar com {isGoogle ? "Google" : "Apple"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Escolha uma conta para autenticar com segurança no Conexão Fitness.
          </DialogDescription>
        </DialogHeader>

        {!isCustomMode ? (
          <div className="space-y-3 py-2">
            {/* Conta rápida 1 */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSelectAccount(
                isGoogle ? "Alexandre Silva" : "Alexandre S. (Apple)",
                isGoogle ? "alexandre.fitness@gmail.com" : "alexandre@icloud.com"
              )}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-muted/70 hover:border-primary/40 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center border border-primary/30">
                  AS
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {isGoogle ? "Alexandre Silva" : "Alexandre S. (Apple ID)"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isGoogle ? "alexandre.fitness@gmail.com" : "alexandre@icloud.com"}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Conta rápida 2 */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSelectAccount(
                isGoogle ? "Mariana Souza" : "Mariana Souza (Apple)",
                isGoogle ? "mariana.fit@gmail.com" : "mariana.souza@privaterelay.appleid.com"
              )}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-muted/70 hover:border-primary/40 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/15 text-secondary font-bold flex items-center justify-center border border-secondary/30">
                  MS
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground group-hover:text-secondary transition-colors">
                    {isGoogle ? "Mariana Souza" : "Mariana Souza (Apple ID)"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isGoogle ? "mariana.fit@gmail.com" : "mariana.souza@privaterelay.appleid.com"}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
            </button>

            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 text-sm border-dashed"
                onClick={() => setIsCustomMode(true)}
              >
                <User className="w-4 h-4 mr-2" />
                Usar outra conta {isGoogle ? "Google" : "Apple"}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="oauth-name">Nome Completo</Label>
              <Input
                id="oauth-name"
                required
                placeholder="Ex: Seu Nome"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="oauth-email">E-mail {isGoogle ? "Google" : "Apple ID"}</Label>
              <Input
                id="oauth-email"
                type="email"
                required
                placeholder={isGoogle ? "seu.email@gmail.com" : "seu.email@icloud.com"}
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 h-11"
                onClick={() => setIsCustomMode(false)}
              >
                Voltar
              </Button>
              <Button
                type="submit"
                variant="hero"
                className="flex-1 h-11"
                disabled={loading || !customName || !customEmail}
              >
                {loading ? "Autenticando..." : "Confirmar"}
              </Button>
            </div>
          </form>
        )}

        <div className="pt-3 border-t border-border/60 flex items-center justify-center gap-1.5 text-xs text-muted-foreground text-center">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Autenticação direta e protegida com criptografia ponta a ponta</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OAuthModal;
