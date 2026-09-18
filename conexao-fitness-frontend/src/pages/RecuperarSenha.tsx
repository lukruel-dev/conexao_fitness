import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PasswordInput from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, KeyRound, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import FinexLogo from "@/components/FinexLogo";
import { forgotPassword, resetPassword } from "@/services/auth";

const RecuperarSenha = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"REQUEST" | "VERIFY" | "SUCCESS">("REQUEST");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Contador de reenvio
  useEffect(() => {
    if (step !== "VERIFY") return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown, step]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success("Código de recuperação enviado!", {
        description: `Verifique a caixa de entrada de ${email}`,
      });
      setStep("VERIFY");
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      toast.error("Erro ao solicitar código", {
        description: err?.message || "Não foi possível enviar o e-mail.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.replace(/\D/g, "");

    if (cleanCode.length !== 6) {
      toast.error("Código incompleto", { description: "Digite os 6 dígitos enviados por e-mail." });
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Senha muito curta", { description: "A senha deve conter no mínimo 8 caracteres." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Senhas não coincidem", { description: "Verifique a confirmação de senha." });
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        email,
        code: cleanCode,
        newPassword,
      });
      toast.success("Senha redefinida com sucesso!");
      setStep("SUCCESS");
    } catch (err: any) {
      toast.error("Falha ao redefinir senha", {
        description: err?.message || "Código inválido ou expirado.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setResending(true);
    try {
      await forgotPassword(email);
      toast.success("Novo código enviado para seu e-mail!");
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      toast.error("Falha ao reenviar", { description: err?.message });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-start">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 rounded-lg bg-muted/60 hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao login</span>
          </Link>
        </div>

        <Link to="/" className="flex items-center justify-center mb-6">
          <FinexLogo size="lg" />
        </Link>

        <div className="bg-transparent md:bg-card md:border md:border-border rounded-2xl p-2 md:p-8 md:shadow-card">
          {step === "REQUEST" && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold">Recuperar Senha</h1>
                  <p className="text-muted-foreground text-xs">
                    Enviaremos um código de verificação para o seu e-mail.
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground text-sm my-4">
                Digite o e-mail cadastrado na sua conta Conexão Fitness para receber o código de 6 dígitos.
              </p>

              <form onSubmit={handleRequestCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    className="h-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                  />
                </div>

                <Button type="submit" variant="hero" className="w-full h-12 text-base mt-2" disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      Enviando código...
                    </>
                  ) : (
                    "Enviar código de verificação"
                  )}
                </Button>
              </form>
            </>
          )}

          {step === "VERIFY" && (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-display text-xl font-bold">Definir Nova Senha</h1>
                  <p className="text-muted-foreground text-xs truncate max-w-[240px]">
                    Código enviado para {email}
                  </p>
                </div>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="code">Código de 6 dígitos</Label>
                    <button
                      type="button"
                      onClick={() => setStep("REQUEST")}
                      className="text-xs text-primary hover:underline"
                    >
                      Trocar e-mail
                    </button>
                  </div>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    className="h-12 text-center text-2xl font-mono font-bold tracking-widest border-primary/50"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha (mínimo 8 caracteres)</Label>
                  <PasswordInput
                    id="newPassword"
                    required
                    minLength={8}
                    className="h-12"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha segura"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <PasswordInput
                    id="confirmPassword"
                    required
                    minLength={8}
                    className="h-12"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                  />
                </div>

                <Button type="submit" variant="hero" className="w-full h-12 text-base mt-2" disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      Redefinindo senha...
                    </>
                  ) : (
                    "Confirmar e Salvar Senha"
                  )}
                </Button>

                <div className="text-center pt-2">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                      Reenviar código por e-mail
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Reenviar código em <strong className="font-mono text-foreground">{countdown}s</strong>
                    </span>
                  )}
                </div>
              </form>
            </>
          )}

          {step === "SUCCESS" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Senha alterada com sucesso!</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Sua conta foi atualizada e seu e-mail foi confirmado. Você já pode acessar a plataforma com sua nova credencial.
              </p>
              <Button
                variant="hero"
                className="w-full h-12 text-base"
                onClick={() => navigate(`/login?email=${encodeURIComponent(email)}`)}
              >
                Ir para o Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecuperarSenha;
