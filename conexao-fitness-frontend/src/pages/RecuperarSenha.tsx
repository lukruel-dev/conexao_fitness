import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import FinexLogo from "@/components/FinexLogo";

const RecuperarSenha = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simular uma chamada à API para recuperar senha
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("E-mail de recuperação enviado!");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-start">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 rounded-lg bg-muted/60 hover:bg-muted">
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao login</span>
          </Link>
        </div>

        <Link to="/" className="flex items-center justify-center mb-6">
          <FinexLogo size="lg" />
        </Link>

        <div className="bg-transparent md:bg-card md:border md:border-border rounded-2xl p-2 md:p-8 md:shadow-card">
          <h1 className="font-display text-2xl font-bold mb-1">Recuperar Senha</h1>
          
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Verifique seu e-mail</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Enviamos um link de recuperação para <strong>{email}</strong>. Por favor, verifique sua caixa de entrada e a pasta de spam.
              </p>
              <Button variant="outline" className="w-full" onClick={() => setSubmitted(false)}>
                Tentar outro e-mail
              </Button>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground text-sm mb-6">
                Digite o e-mail associado à sua conta e enviaremos um link para você redefinir sua senha.
              </p>

              <form onSubmit={onSubmit} className="space-y-4">
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
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecuperarSenha;
