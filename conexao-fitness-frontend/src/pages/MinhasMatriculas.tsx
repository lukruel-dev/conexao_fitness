import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentEnrollments, GymEnrollment } from '@/services/memberships';
import { getMyBalance } from '@/services/wallet';
import { StudentAccessPassModal } from '@/components/StudentAccessPassModal';
import { FinexDayPassQrModal } from '@/components/FinexDayPassQrModal';
import {
  Dumbbell,
  QrCode,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Zap,
  Wallet,
} from 'lucide-react';
import { formatBRL } from '@/lib/format';

export default function MinhasMatriculas() {
  const { user, isAuthenticated } = useAuth();
  const [selectedEnrollment, setSelectedEnrollment] = useState<GymEnrollment | null>(null);
  const [dayPassModalOpen, setDayPassModalOpen] = useState(false);

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['student-enrollments', user?.id],
    queryFn: getStudentEnrollments,
    enabled: !!user,
  });

  const { data: walletBalance } = useQuery({
    queryKey: ['wallet-balance', user?.id],
    queryFn: getMyBalance,
    enabled: !!user,
  });

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-24 md:pt-28 pb-16 container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              Minha Conta
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Minhas <span className="gradient-text">Matrículas & Acessos</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Apresente sua carteirinha digital com QR Code na portaria da sua academia para liberar seu treino.
          </p>
        </div>

        {/* BANNER / CTA DE TREINO AVULSO / DAY PASS FINEX */}
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-primary/10 to-emerald-500/5 border-2 border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/25 mt-0.5">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Day Pass Finex
                </span>
                <span className="text-xs text-muted-foreground">
                  Saldo: <strong className="text-emerald-500">{formatBRL(walletBalance?.current_balance ?? 0)}</strong>
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-foreground">
                Quer fazer um Treino Avulso sem burocracia?
              </h3>
              <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                Apresente seu QR Code na recepção de qualquer academia parceira cadastrada na plataforma e o valor do <strong>Day Pass é descontado diretamente da sua carteira</strong>, sem precisar preencher cadastros!
              </p>
            </div>
          </div>

          <Button
            size="lg"
            variant="hero"
            onClick={() => setDayPassModalOpen(true)}
            className="shrink-0 rounded-2xl shadow-glow-blue bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold px-6"
          >
            <QrCode className="w-4 h-4" /> QR Day Pass
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-36 rounded-3xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !enrollments || enrollments.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-3xl p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
              <QrCode className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-foreground">
                Nenhuma matrícula ativa
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                Você ainda não possui planos de matrícula em academias parceiras. Explore as academias credenciadas e matricule-se online!
              </p>
            </div>
            <Button variant="hero" asChild className="rounded-2xl px-6">
              <Link to="/buscar">
                <Dumbbell className="w-4 h-4 mr-2" /> Encontrar Academias
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((e) => {
              const isExpired = e.isExpired || e.status === 'EXPIRED';
              const academiaTitle =
                e.academia?.academiaProfile?.nomeFantasia ||
                e.academia?.name ||
                'Academia Parceira';

              return (
                <div
                  key={e.id}
                  className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary p-0.5 shrink-0 shadow-md">
                      <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center overflow-hidden">
                        {e.academia?.avatarUrl ? (
                          <img
                            src={e.academia.avatarUrl}
                            alt={academiaTitle}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Dumbbell className="w-7 h-7 text-primary" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-lg text-foreground">
                          {academiaTitle}
                        </h3>
                        {!isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> ATIVO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-destructive/15 text-destructive border border-destructive/30">
                            <AlertCircle className="w-3 h-3" /> VENCIDO
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-primary">
                        {e.planName}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Válido até {new Date(e.endDate).toLocaleDateString('pt-BR')}
                        </span>

                        {!isExpired && e.daysRemaining !== undefined && (
                          <span className="font-semibold text-emerald-500">
                            ({e.daysRemaining} dias restantes)
                          </span>
                        )}

                        {e.academia?.cityBase && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {e.academia.cityBase}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Button
                      variant="hero"
                      size="default"
                      onClick={() =>
                        setSelectedEnrollment({
                          ...e,
                          student: {
                            name: user.name,
                            avatarUrl: user.avatarUrl,
                            cpf: user.cpf,
                            email: user.email,
                          },
                        })
                      }
                      className="rounded-2xl gap-2 w-full md:w-auto shadow-md"
                    >
                      <QrCode className="w-4 h-4" /> Apresentar QR Code
                    </Button>

                    <Button
                      variant="outline"
                      size="default"
                      asChild
                      className="rounded-2xl w-full md:w-auto"
                    >
                      <Link to={`/perfil/${e.academiaId}`}>
                        Ver Academia <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL DE CARTEIRINHA DIGITAL COM QR CODE */}
      <StudentAccessPassModal
        open={!!selectedEnrollment}
        onOpenChange={(open) => !open && setSelectedEnrollment(null)}
        enrollment={selectedEnrollment}
      />

      {/* MODAL DE TREINO AVULSO / DAY PASS FINEX */}
      <FinexDayPassQrModal
        open={dayPassModalOpen}
        onOpenChange={setDayPassModalOpen}
        walletBalance={walletBalance?.current_balance ?? 0}
      />

      <Footer />
    </div>
  );
}
