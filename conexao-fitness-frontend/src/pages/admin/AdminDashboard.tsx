import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  Users,
  CreditCard,
  CalendarCheck,
  Dumbbell,
  ArrowRight,
  ShieldCheck,
  LogOut,
  Building2,
  User,
  Eye,
  CheckCircle2,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminDashboard } from "@/services/admin";

const formatNumber = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

const metricCards = [
  { key: "totalUsers" as const, label: "Usuários totais", icon: Users, gradient: "from-primary/20 to-primary/5" },
  { key: "activeSubscriptions" as const, label: "Assinaturas ativas", icon: CreditCard, gradient: "from-secondary/20 to-secondary/5" },
  { key: "totalBookings" as const, label: "Agendamentos", icon: CalendarCheck, gradient: "from-primary/20 to-secondary/10" },
  { key: "totalServices" as const, label: "Serviços cadastrados", icon: Dumbbell, gradient: "from-secondary/20 to-primary/10" },
];

export default function AdminDashboard() {
  const { user, isAuthenticated, logout, startImpersonation } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "ADMIN") return <Navigate to="/" replace />;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getAdminDashboard,
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-36 pb-16">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-secondary text-sm font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Painel administrativo
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">Centro de Comando</h1>
            <p className="text-muted-foreground mt-1">Visão geral da plataforma em tempo real.</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Button asChild variant="outline">
              <Link to="/admin/profissoes">
                Profissões
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/catalogo">
                Catálogo Base
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/servicos">
                Serviços dos Profissionais
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/assinaturas">
                Assinaturas
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/agendamentos">
                Gerenciar agendamentos
              </Link>
            </Button>
            <Button asChild variant="hero">
              <Link to="/admin/usuarios">
                Gerenciar usuários <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 font-medium ml-1"
            >
              <LogOut className="w-4 h-4" /> Sair
            </Button>
          </div>
        </div>

        {isError && (
          <Card className="border-destructive/40 bg-destructive/5 mb-6">
            <CardContent className="py-4 text-destructive">
              Não foi possível carregar as métricas. Tente novamente em instantes.
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {metricCards.map(({ key, label, icon: Icon, gradient }) => (
            <Card
              key={key}
              className={`relative overflow-hidden border-border/60 bg-gradient-to-br ${gradient} backdrop-blur shadow-sm hover:shadow-lg transition-shadow`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <span className="p-2 rounded-lg bg-background/60 border border-border/40">
                  <Icon className="w-4 h-4 text-foreground" />
                </span>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-10 w-24" />
                ) : (
                  <div className="font-display text-4xl font-bold tracking-tight">
                    {formatNumber(data?.[key] ?? 0)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* AMBIENTE DE TESTES & SIMULAÇÃO DE PERFIS (IMPERSONATION) */}
        {/* ========================================================================= */}
        <div className="mt-12 bg-card/70 border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
                <Eye className="w-4 h-4" /> Simulador de Perfis de Teste
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Ambiente de Simulação & Testes
              </h2>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Alterne instantaneamente para qualquer perfil da plataforma para testar funcionalidades práticas (catraca, agenda, pagamentos e QR Codes). Você pode retornar ao painel admin a qualquer momento com 1 clique na barra superior.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: ACADEMIA */}
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06] transition-all p-6 flex flex-col justify-between shadow-sm hover:shadow-md">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                    Academia Demo
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-bold text-lg text-foreground">
                    Olhar como Academia
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Acesse a gestão da academia com catraca digital, validador de QR Code, cadastro de planos de matrícula e atendimento no balcão.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Catraca Digital & Leitor Óptico QR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Planos de Matrícula & Mensalidades</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Matrícula Manual com envio por WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Histórico de Passagens com Fotos</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  className="w-full rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-sm"
                  onClick={() => {
                    startImpersonation('ACADEMIA');
                    navigate('/gestao-academia');
                  }}
                >
                  <Eye className="w-4 h-4" /> Entrar como Academia
                </Button>
              </div>
            </div>

            {/* Card 2: PERSONAL */}
            <div className="rounded-3xl border border-purple-500/30 bg-purple-500/[0.03] hover:bg-purple-500/[0.06] transition-all p-6 flex flex-col justify-between shadow-sm hover:shadow-md">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/15 text-purple-500 border border-purple-500/30">
                    Profissional Demo
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-bold text-lg text-foreground">
                    Olhar como Profissional
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Experimente a rotina do Personal Trainer ou Nutricionista: agenda de aulas, serviços, alunos vinculados e carteira financeira.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span>Agenda Profissional & Aulas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span>Cadastro de Serviços & Consultorias</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span>Gestão e Acompanhamento de Alunos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span>Carteira de Recebimentos & Saque</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  className="w-full rounded-2xl font-bold bg-purple-600 hover:bg-purple-500 text-white gap-2 shadow-sm"
                  onClick={() => {
                    startImpersonation('PERSONAL');
                    navigate('/agenda-profissional');
                  }}
                >
                  <Eye className="w-4 h-4" /> Entrar como Profissional
                </Button>
              </div>
            </div>

            {/* Card 3: STUDENT */}
            <div className="rounded-3xl border border-blue-500/30 bg-blue-500/[0.03] hover:bg-blue-500/[0.06] transition-all p-6 flex flex-col justify-between shadow-sm hover:shadow-md">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                    <User className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/15 text-blue-500 border border-blue-500/30">
                    Aluno Demo
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-bold text-lg text-foreground">
                    Olhar como Aluno
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Vivencie a experiência completa do aluno: passe digital dinâmico com QR Code para catraca, carteira Finex com saldo e treinos.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Passe Digital com QR Code Dinâmico</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Carteira Finex (Saldo de R$ 180,00)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Meus Treinos & Agendamentos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Busca & Contratação de Planos</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  className="w-full rounded-2xl font-bold bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-sm"
                  onClick={() => {
                    startImpersonation('STUDENT');
                    navigate('/minhas-matriculas');
                  }}
                >
                  <Eye className="w-4 h-4" /> Entrar como Aluno
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
