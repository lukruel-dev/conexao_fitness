import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PasswordInput from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/api";

import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listProfessions } from "@/services/professions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import logo from "@/assets/logo.jpeg";

const roleOptions: { value: UserRole; label: string; desc: string }[] = [
  { value: "STUDENT", label: "Aluno", desc: "Buscar e reservar treinos" },
  { value: "PERSONAL", label: "Profissional", desc: "Oferecer meus serviços" },
  { value: "ACADEMIA", label: "Academia", desc: "Cadastrar minha academia" },
];

const Cadastro = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("STUDENT");
  const [professionTitle, setProfessionTitle] = useState("");

  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const { data: professions } = useQuery({
    queryKey: ["professions"],
    queryFn: listProfessions,
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (role === "PERSONAL" && !professionTitle) {
      toast.error("Por favor, selecione sua profissão");
      return;
    }

    try {
      const newUser = await register({ name, email, password, role, professionTitle, cpf, phone });
      toast.success("Conta criada com sucesso!");
      if (newUser?.role === "ADMIN") {
        navigate("/admin");
      } else if (newUser?.role === "PERSONAL" || newUser?.role === "ACADEMIA") {
        navigate("/agenda-profissional");
      } else {
        navigate("/buscar");
      }
    } catch (err) {
      toast.error("Erro no cadastro", { description: (err as Error).message });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-start">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 rounded-lg bg-muted/60 hover:bg-muted">
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao início</span>
          </Link>
        </div>

        <Link to="/" className="flex items-center gap-3 justify-center mb-6">
          <img src={logo} alt="Conexão Fitness" className="h-12 w-auto rounded-lg" />
          <span className="font-display font-bold text-xl">
            <span className="text-foreground">Conexão</span>{" "}
            <span className="text-secondary">Fitness</span>
          </span>
        </Link>

        <div className="bg-transparent md:bg-card md:border md:border-border rounded-2xl p-2 md:p-8 md:shadow-card">
          <h1 className="font-display text-2xl font-bold mb-1">Criar conta</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Comece em menos de um minuto.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Eu sou</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                {roleOptions.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`flex-1 text-left p-3 rounded-lg border transition-all ${
                      role === r.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <div className="font-semibold text-sm text-foreground">{r.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
                      {r.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {role === "PERSONAL" && (
              <div className="space-y-2">
                <Label htmlFor="profession">Sua Profissão</Label>
                <Select value={professionTitle} onValueChange={setProfessionTitle}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione sua profissão" />
                  </SelectTrigger>
                  <SelectContent>
                    {professions?.map((p) => (
                      <SelectItem key={p.id} value={p.title}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" required className="h-12" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input 
                id="cpf" 
                required 
                className="h-12" 
                placeholder="000.000.000-00"
                value={cpf} 
                onChange={(e) => setCpf(formatCpf(e.target.value))} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Número de Telefone</Label>
              <Input 
                id="phone" 
                required 
                className="h-12" 
                placeholder="(00) 00000-0000"
                value={phone} 
                onChange={(e) => setPhone(formatPhone(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                className="h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <PasswordInput
                id="password"
                required
                minLength={6}
                className="h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" variant="hero" className="w-full h-12 text-base mt-2" disabled={loading}>
              {loading ? "Criando..." : "Criar conta"}
            </Button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs text-muted-foreground font-medium uppercase">Ou cadastre-se com</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="w-full h-12" onClick={() => toast.info("Cadastro com Google em breve!")}>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </Button>
            <Button variant="outline" className="w-full h-12" onClick={() => toast.info("Cadastro com Apple em breve!")}>
              <svg className="w-5 h-5 mr-2 text-foreground fill-current" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.09 2.31-.86 3.59-.8 1.51.05 2.95.72 3.81 1.96-3.44 1.96-2.93 6.66.62 8.04-.76 1.77-1.85 3.87-3.1 5.06v-.09zm-3.32-14.7c.69-.95 1.13-2.16.92-3.41-1.11.07-2.38.74-3.1 1.67-.65.8-1.22 2.07-1 3.3 1.25.12 2.45-.63 3.18-1.56z" />
              </svg>
              Apple
            </Button>
          </div>


          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Entrar
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Cadastro;
