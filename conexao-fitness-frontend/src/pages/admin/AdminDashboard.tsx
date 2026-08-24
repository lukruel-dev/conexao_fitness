import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Users, CreditCard, CalendarCheck, Dumbbell, ArrowRight, ShieldCheck, LogOut } from "lucide-react";
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
  const { user, isAuthenticated, logout } = useAuth();
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
      </main>
      <Footer />
    </div>
  );
}
