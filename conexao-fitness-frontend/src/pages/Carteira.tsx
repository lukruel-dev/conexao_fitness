import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Wallet,
  Plus,
  CreditCard,
  ArrowRight,
  QrCode,
  Zap,
  Building2,
  Calendar,
  Receipt,
  Search,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getMyBalance,
  createTopup,
  simulateTopupSuccess,
  getWalletStatement,
} from "@/services/wallet";
import { CheckoutModal } from "@/components/CheckoutModal";
import { FinexDayPassQrModal } from "@/components/FinexDayPassQrModal";
import { AcademiaWalletView } from "@/components/AcademiaWalletView";
import { ProfessionalWalletView } from "@/components/ProfessionalWalletView";

export default function Carteira() {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [amount, setAmount] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [currentPaymentIntentId, setCurrentPaymentIntentId] = useState<string | null>(null);
  const [dayPassModalOpen, setDayPassModalOpen] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");

  const { data: balance, isLoading } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: getMyBalance,
    enabled: !!user,
  });

  const { data: statementData } = useQuery({
    queryKey: ["wallet-statement"],
    queryFn: getWalletStatement,
    enabled: !!user && user.role === "STUDENT",
  });

  useEffect(() => {
    const success = searchParams.get("success");
    const paymentIntent = searchParams.get("payment_intent");
    const canceled = searchParams.get("canceled");

    if (success === "true" && paymentIntent) {
      toast.promise(
        simulateTopupSuccess(paymentIntent).then(() => {
          qc.invalidateQueries({ queryKey: ["wallet-balance"] });
          qc.invalidateQueries({ queryKey: ["wallet-statement"] });
        }),
        {
          loading: "Confirmando pagamento...",
          success: "Recarga realizada com sucesso!",
          error: "Erro ao confirmar recarga.",
        }
      );

      searchParams.delete("success");
      searchParams.delete("payment_intent");
      setSearchParams(searchParams, { replace: true });
    } else if (canceled === "true") {
      toast.error("O pagamento da recarga foi cancelado.");
      searchParams.delete("canceled");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, qc]);

  const topupMutation = useMutation({
    mutationFn: (val: number) => createTopup({ amount: val, method: "CARD" }),
    onSuccess: (data) => {
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setCurrentPaymentIntentId(data.payment_intent_id);
      } else {
        toast.error("Erro", { description: "Secret não retornado." });
      }
    },
    onError: (err: any) => {
      toast.error("Erro ao adicionar saldo", { description: err.message });
    },
  });

  const handleAddFunds = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount.replace(",", "."));
    if (isNaN(val) || val <= 0) {
      toast.error("Valor inválido");
      return;
    }
    topupMutation.mutate(val);
  };

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Se o usuário logado for Academia, renderiza a visão completa de Faturamento, Extrato com Nome dos Alunos e Saques
  if (user?.role === "ACADEMIA") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 pt-24 md:pt-28 pb-16 max-w-5xl">
          <AcademiaWalletView />
        </main>
        <Footer />
      </div>
    );
  }

  // Se o usuário logado for Profissional (Personal Trainer, Nutri, Fisio), renderiza a visão profissional de rendimentos
  if (user?.role === "PERSONAL") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 pt-24 md:pt-28 pb-16 max-w-5xl">
          <ProfessionalWalletView />
        </main>
        <Footer />
      </div>
    );
  }

  // Visão padrão para Aluno / Atleta (Consumidor)
  const studentTransactions = (statementData?.transactions || []).filter(
    (t) =>
      !studentSearchTerm ||
      t.description.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 md:pt-28 pb-16 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-primary flex items-center gap-3 mb-2 pl-1">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <span>Minha <span className="gradient-text">Carteira</span></span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base mb-8">
          Gerencie seu saldo e adicione fundos para pagar treinos avulsos (Day Pass), aulas e matrículas.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 flex flex-col justify-center items-center text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Wallet className="w-32 h-32" />
            </div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Saldo Atual (Disponível)
            </h2>
            {isLoading ? (
              <div className="h-12 w-32 bg-muted animate-pulse rounded-lg mb-2"></div>
            ) : (
              <p className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-foreground">
                R${" "}
                {(balance?.current_balance || 0).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            )}

            <div className="mt-5 pt-5 border-t border-border/60 w-full flex flex-col items-center gap-2.5">
              <p className="text-xs text-muted-foreground text-center">
                Apresente seu QR Code na catraca de qualquer academia para debitar seu Day Pass instantaneamente.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDayPassModalOpen(true)}
                className="rounded-2xl text-xs gap-1.5 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 font-bold px-5 py-2.5 shadow-sm"
              >
                <QrCode className="w-4 h-4" /> Abrir QR Day Pass Finex
              </Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Adicionar Saldo
            </h3>
            <form onSubmit={handleAddFunds} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Recarga rápida:
                </label>
                <div className="grid grid-cols-4 gap-2 mb-1">
                  {[20, 50, 100, 200].map((quickAmount) => (
                    <button
                      key={quickAmount}
                      type="button"
                      onClick={() => setAmount(quickAmount.toString())}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                        amount === quickAmount.toString()
                          ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                          : "bg-muted/60 border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      + R$ {quickAmount}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Outro Valor (R$)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-muted-foreground font-medium text-sm">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="5"
                    className="pl-11 text-base rounded-xl"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Valor mínimo de R$ 5,00.</p>
              </div>
              <Button
                type="submit"
                variant="hero"
                className="w-full h-auto py-3.5 px-3 text-xs sm:text-sm font-semibold whitespace-normal leading-snug flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-primary/20"
                disabled={topupMutation.isPending || !amount}
              >
                {topupMutation.isPending ? (
                  "Processando..."
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <span>Pagar com Cartão (Stripe)</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Extrato do Aluno */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" /> Extrato de Pagamentos & Recargas
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar compras..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                className="pl-8 text-xs rounded-xl h-9"
              />
            </div>
          </div>

          {studentTransactions.length === 0 ? (
            <div className="text-center py-10 bg-card/40 border border-dashed border-border rounded-2xl p-6">
              <p className="text-xs text-muted-foreground">Nenhuma movimentação encontrada.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {studentTransactions.map((tx) => {
                const isDebit = tx.type === "DEBIT" || tx.type === "DAY_PASS";
                const dateFormatted = new Date(tx.createdAt).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={tx.id}
                    className="bg-card border border-border/70 rounded-2xl p-4 flex items-center justify-between shadow-sm"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-foreground">{tx.description}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> {dateFormatted}
                      </p>
                    </div>
                    <p
                      className={`font-display font-extrabold text-base ${
                        isDebit ? "text-foreground" : "text-emerald-500"
                      }`}
                    >
                      {isDebit ? "-" : "+"} R${" "}
                      {Math.abs(tx.netAmount || tx.amount).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <CheckoutModal
        isOpen={!!clientSecret}
        onClose={() => {
          setClientSecret(null);
          setCurrentPaymentIntentId(null);
        }}
        clientSecret={clientSecret}
        onSuccess={() => {
          toast.success("Pagamento concluído!");
          setClientSecret(null);
          if (currentPaymentIntentId) {
            toast.promise(
              simulateTopupSuccess(currentPaymentIntentId).then(() => {
                qc.invalidateQueries({ queryKey: ["wallet-balance"] });
                qc.invalidateQueries({ queryKey: ["wallet-statement"] });
              }),
              {
                loading: "Confirmando recarga...",
                success: "Recarga creditada na sua carteira!",
                error: "Erro ao confirmar saldo.",
              }
            );
          }
        }}
      />

      <FinexDayPassQrModal
        open={dayPassModalOpen}
        onOpenChange={setDayPassModalOpen}
        walletBalance={balance?.current_balance ?? 0}
      />
    </div>
  );
}
