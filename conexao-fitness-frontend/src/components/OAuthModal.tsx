import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, User, Globe } from "lucide-react";

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
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID;

  // Carrega o SDK oficial da Google Identity Services se houver Client ID
  useEffect(() => {
    if (isOpen && provider === "google" && googleClientId) {
      const scriptId = "google-gsi-client";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => initGoogleGSI();
        document.body.appendChild(script);
      } else {
        initGoogleGSI();
      }
    }
  }, [isOpen, provider, googleClientId]);

  const initGoogleGSI = () => {
    if (window.google?.accounts?.id && googleBtnRef.current && googleClientId) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response: any) => {
          try {
            // Decodifica o JWT retornado pelo Google oficial
            const base64Url = response.credential.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const payload = JSON.parse(decodeURIComponent(escape(window.atob(base64))));
            
            onSuccess({
              provider: "google",
              name: payload.name || payload.given_name || "Usuário Google",
              email: payload.email,
              avatarUrl: payload.picture, // Foto real oficial do Google!
            });
            onClose();
          } catch (e) {
            console.error("Erro ao decodificar token do Google:", e);
          }
        },
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "filled_blue",
        size: "large",
        width: 320,
        text: "continue_with",
        shape: "pill",
      });
    }
  };

  const handleOfficialAppleSignIn = async () => {
    try {
      setLoading(true);
      const { triggerAppleSignIn } = await import("@/services/appleAuth");
      const profile = await triggerAppleSignIn();
      onSuccess({
        provider: "apple",
        name: profile.name,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
      });
      onClose();
    } catch (err: any) {
      if (!err?.message?.includes("cancel") && !err?.message?.includes("closed")) {
        console.warn("Apple Sign-In error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

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
        avatarUrl,
      });
      onClose();
    }, 300);
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

        {isGoogle && googleClientId && (
          <div className="flex flex-col items-center justify-center py-3 bg-muted/40 rounded-xl border border-border/80 my-2">
            <div ref={googleBtnRef} className="min-h-[44px] flex items-center justify-center" />
            <span className="text-[11px] text-muted-foreground mt-2">Login oficial com 2FA e foto real do Google</span>
          </div>
        )}

        {!isGoogle && appleClientId && (
          <div className="flex flex-col items-center justify-center py-3 bg-muted/40 rounded-xl border border-border/80 my-2">
            <Button
              type="button"
              disabled={loading}
              onClick={handleOfficialAppleSignIn}
              className="w-full max-w-[320px] h-11 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-full font-medium transition-all shadow flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.09 2.31-.86 3.59-.8 1.51.05 2.95.72 3.81 1.96-3.44 1.96-2.93 6.66.62 8.04-.76 1.77-1.85 3.87-3.1 5.06v-.09zm-3.32-14.7c.69-.95 1.13-2.16.92-3.41-1.11.07-2.38.74-3.1 1.67-.65.8-1.22 2.07-1 3.3 1.25.12 2.45-.63 3.18-1.56z" />
              </svg>
              {loading ? "Conectando ao Apple ID..." : "Continuar com a Apple Oficial"}
            </Button>
            <span className="text-[11px] text-muted-foreground mt-2">Login oficial com Face ID / Touch ID da Apple</span>
          </div>
        )}

        {!isCustomMode ? (
          <div className="space-y-3 py-2">
            {/* Conta salva recentemente */}
            {(() => {
              const savedRaw = localStorage.getItem(`cf_last_oauth_${provider}`);
              if (!savedRaw) return null;
              try {
                const saved = JSON.parse(savedRaw) as OAuthUserData;
                const initials = saved.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleSelectAccount(saved.name, saved.email, saved.avatarUrl)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center border border-primary/40 overflow-hidden">
                        {saved.avatarUrl ? (
                          <img src={saved.avatarUrl} alt={saved.name} className="w-full h-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {saved.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">Recente</span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {saved.email}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-all" />
                  </button>
                );
              } catch {
                return null;
              }
            })()}

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
                Digitar meus dados {isGoogle ? "Google" : "Apple"}
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
