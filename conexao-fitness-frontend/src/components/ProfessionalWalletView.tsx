import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wallet,
  ArrowUpRight,
  UserCheck,
  Search,
  CheckCircle2,
  Clock,
  Send,
  ShieldCheck,
  Zap,
  TrendingUp,
  Calendar,
  DollarSign,
  Receipt,
  FileCheck,
  Dumbbell,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getMyBalance,
  getWalletStatement,
  getWithdrawals,
  requestWithdrawal,
  WalletWithdrawal,
} from "@/services/wallet";
import { WithdrawalReceiptModal } from "@/components/WithdrawalReceiptModal";

export function ProfessionalWalletView() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"statement" | "withdraw" | "history">("statement");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  // Formulário de Saque
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKeyType, setPixKeyType] = useState<"CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM">("CPF");
  const [pixKey, setPixKey] = useState("");
  const [holderName, setHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(true);

  // Modal de Comprovante
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WalletWithdrawal | null>(null);

  // Consultas
  const { data: balanceData, isLoading: loadingBalance } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: getMyBalance,
  });

  const { data: statementData, isLoading: loadingStatement } = useQuery({
    queryKey: ["wallet-statement"],
    queryFn: getWalletStatement,
  });

  const { data: withdrawalsData } = useQuery({
    queryKey: ["wallet-withdrawals"],
    queryFn: getWithdrawals,
  });

  // Mutation para Saque PIX
  const withdrawMutation = useMutation({
    mutationFn: requestWithdrawal,
    onSuccess: (data) => {
      toast.success(data.message || "Saque via PIX realizado com sucesso!");
      qc.invalidateQueries({ queryKey: ["wallet-balance"] });
      qc.invalidateQueries({ queryKey: ["wallet-statement"] });
      qc.invalidateQueries({ queryKey: ["wallet-withdrawals"] });
      setWithdrawAmount("");
      setSelectedWithdrawal(data.withdrawal);
      setReceiptModalOpen(true);
    },
    onError: (err: any) => {
      toast.error("Erro ao solicitar saque", { description: err.message });
    },
  });

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(withdrawAmount.replace(",", "."));
    if (isNaN(val) || val <= 0) {
      toast.error("Valor inválido para saque.");
      return;
    }
    if (val < 5) {
      toast.error("O valor mínimo para saque via PIX é de R$ 5,00.");
      return;
    }
    const currentBal = balanceData?.current_balance || 0;
    if (val > currentBal) {
      toast.error(`Saldo insuficiente. Você possui R$ ${currentBal.toFixed(2)} disponível.`);
      return;
    }
    if (!pixKey.trim()) {
      toast.error("Informe a chave PIX de destino.");
      return;
    }

    withdrawMutation.mutate({
      amount: val,
      pixKeyType,
      pixKey: pixKey.trim(),
      holderName: holderName.trim() || undefined,
      bankName: bankName.trim() || undefined,
      saveAsDefault,
    });
  };

  const handleQuickAmount = (val: number) => {
    const currentBal = balanceData?.current_balance || 0;
    if (val > currentBal) {
      setWithdrawAmount(currentBal.toFixed(2));
    } else {
      setWithdrawAmount(val.toFixed(2));
    }
  };

  const availableBalance = balanceData?.current_balance || 0;
  const pendingBalance = balanceData?.pending_balance || 0;
  const totalWithdrawn = balanceData?.total_withdrawn || 0;
  const totalEarned = statementData?.summary.totalEarned || 0;

  // Filtragem do Extrato
  const transactions = statementData?.transactions || [];
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      !searchTerm ||
      (tx.sourceUserName && tx.sourceUserName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      tx.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === "ALL") return true;
    if (filterType === "BOOKING") return tx.type === "BOOKING" || tx.referenceType === "BOOKING";
    if (filterType === "WITHDRAWAL") return tx.type === "WITHDRAWAL";
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner Principal Profissional */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card/90 to-primary/5 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 border border-primary/30 text-primary flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5" /> Carteira Profissional
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Recebimentos Garantidos
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-foreground">
              Rendimentos & <span className="gradient-text">Saques</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1 max-w-xl">
              Acompanhe seus rendimentos com aulas, consultorias e atendimentos prestados, e transfira para sua conta via PIX.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="hero"
              onClick={() => setActiveTab("withdraw")}
              className="rounded-2xl gap-2 font-bold px-5 py-3 shadow-lg shadow-primary/20"
            >
              <Send className="w-4 h-4" /> Solicitar Saque PIX
            </Button>
          </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Saldo Disponível */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Saldo Disponível
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-display font-extrabold text-foreground">
              R$ {availableBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-emerald-500 font-medium flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3 shrink-0" /> Pronto para saque imediato
            </p>
          </div>
        </div>

        {/* Saldo Pendente (Aulas Agendadas) */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Saldo Pendente
            </span>
            <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-500">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-display font-extrabold text-yellow-500">
              R$ {pendingBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Liberado após a realização das aulas
            </p>
          </div>
        </div>

        {/* Total Já Faturado */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Faturado
            </span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-display font-extrabold text-foreground">
              R$ {totalEarned.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Aulas e consultorias concluídas
            </p>
          </div>
        </div>

        {/* Total Sacado */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Sacado
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-display font-extrabold text-foreground">
              R$ {totalWithdrawn.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Transferidos para sua conta PIX
            </p>
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex border-b border-border/60 gap-2 sm:gap-4 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("statement")}
          className={`pb-3.5 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "statement"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Extrato de Aulas por Cliente</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-muted font-mono">
            {filteredTransactions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("withdraw")}
          className={`pb-3.5 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "withdraw"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Solicitar Saque (PIX)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`pb-3.5 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Histórico de Saques</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-muted font-mono">
            {withdrawalsData?.length || 0}
          </span>
        </button>
      </div>

      {/* ABA 1: EXTRATO DE AULAS */}
      {activeTab === "statement" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nome do cliente ou aula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm rounded-xl"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
              {[
                { id: "ALL", label: "Todos" },
                { id: "BOOKING", label: "Aulas / Atendimentos" },
                { id: "WITHDRAWAL", label: "Saques" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterType(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    filterType === f.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loadingStatement ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-card/60 animate-pulse rounded-2xl border border-border/40" />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-16 bg-card/40 border border-dashed border-border rounded-3xl p-8">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Nenhum atendimento registrado</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Quando os alunos agendarem e pagarem suas aulas, os recebimentos aparecerão detalhados aqui com o nome de cada aluno.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => {
                const isWithdrawal = tx.type === "WITHDRAWAL";
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
                    className="bg-card hover:bg-card/80 transition-colors border border-border/70 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3.5">
                      {isWithdrawal ? (
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
                          <ArrowUpRight className="w-6 h-6" />
                        </div>
                      ) : tx.sourceUserAvatar ? (
                        <img
                          src={tx.sourceUserAvatar}
                          alt={tx.sourceUserName || "Aluno"}
                          className="w-12 h-12 rounded-2xl object-cover border border-border/80 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-bold flex items-center justify-center shrink-0 text-sm">
                          {tx.sourceUserName
                            ? tx.sourceUserName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()
                            : "AL"}
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-sm sm:text-base text-foreground">
                            {isWithdrawal ? "Saque PIX" : tx.sourceUserName || "Cliente"}
                          </h4>

                          {!isWithdrawal && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 border border-primary/30 text-primary flex items-center gap-1">
                              <Dumbbell className="w-3 h-3" /> Aula / Atendimento
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                          <span>{tx.description}</span>
                          <span>•</span>
                          <span>{dateFormatted}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
                      <p
                        className={`text-base sm:text-lg font-display font-extrabold ${
                          isWithdrawal ? "text-amber-500" : "text-emerald-500"
                        }`}
                      >
                        {isWithdrawal ? "-" : "+"} R${" "}
                        {Math.abs(tx.netAmount || tx.amount).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {isWithdrawal ? "Transferido via PIX" : "Creditado na Carteira"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: FORMULÁRIO DE SAQUE */}
      {activeTab === "withdraw" && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-foreground">
                  Solicitar Saque para Conta Bancária
                </h3>
                <p className="text-xs text-muted-foreground">
                  Receba os valores das suas aulas diretamente via PIX sem tarifas.
                </p>
              </div>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-6">
              <div className="bg-muted/40 border border-border/60 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-medium">Saldo Disponível para Saque</span>
                  <p className="text-2xl font-bold font-display text-emerald-500">
                    R$ {availableBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWithdrawAmount(availableBalance.toFixed(2))}
                  className="rounded-xl text-xs border-primary/30 text-primary hover:bg-primary/10 font-bold"
                >
                  Sacar Tudo
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-primary" /> Valor do Saque (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="5"
                    max={availableBalance}
                    placeholder="0,00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="pl-11 text-lg font-bold rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[50, 100, 200, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickAmount(val)}
                      disabled={val > availableBalance}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                        withdrawAmount === val.toFixed(2)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 border-border/80 hover:bg-muted text-foreground disabled:opacity-40"
                      }`}
                    >
                      R$ {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-border/50">
                <h4 className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Chave PIX de Destino
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Tipo de Chave</label>
                    <select
                      value={pixKeyType}
                      onChange={(e) => setPixKeyType(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-xl bg-background border border-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="CPF">CPF</option>
                      <option value="EMAIL">E-mail</option>
                      <option value="PHONE">Telefone</option>
                      <option value="RANDOM">Chave Aleatória (EVP)</option>
                      <option value="CNPJ">CNPJ</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Chave PIX</label>
                    <Input
                      type="text"
                      placeholder="Chave PIX..."
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="rounded-xl font-mono text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Nome do Titular</label>
                    <Input
                      type="text"
                      placeholder="Seu nome completo"
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      className="rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Banco / Instituição</label>
                    <Input
                      type="text"
                      placeholder="Ex: Nubank, Inter, Caixa..."
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor Solicitado</span>
                  <span className="font-bold text-foreground">
                    R$ {parseFloat(withdrawAmount || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de Saque Conexão Fitness</span>
                  <span className="font-bold text-emerald-500">R$ 0,00 (Grátis)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-primary/20 text-sm">
                  <span className="font-bold text-foreground">Total Creditado via PIX</span>
                  <span className="font-bold text-emerald-500 font-display">
                    R$ {parseFloat(withdrawAmount || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                variant="hero"
                disabled={
                  withdrawMutation.isPending ||
                  !withdrawAmount ||
                  parseFloat(withdrawAmount) <= 0 ||
                  parseFloat(withdrawAmount) > availableBalance ||
                  !pixKey.trim()
                }
                className="w-full py-4 text-sm font-bold rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
              >
                {withdrawMutation.isPending ? (
                  "Processando Saque PIX..."
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Confirmar Transferência PIX Instantânea</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ABA 3: HISTÓRICO DE SAQUES */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-foreground">Histórico de Transferências PIX</h3>
            <span className="text-xs text-muted-foreground">
              Total de {withdrawalsData?.length || 0} transferências
            </span>
          </div>

          {!withdrawalsData || withdrawalsData.length === 0 ? (
            <div className="text-center py-16 bg-card/40 border border-dashed border-border rounded-3xl p-8">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Nenhum saque realizado ainda</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Os comprovantes de transferências bancárias via PIX aparecerão salvos aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawalsData.map((w) => {
                const formattedDate = new Date(w.createdAt).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={w.id}
                    className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm sm:text-base text-foreground">
                            Saque PIX • {w.pixKeyType}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                            Transferido
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                          <span className="font-mono bg-muted/60 px-1.5 py-0.5 rounded text-[11px]">
                            {w.pixKey}
                          </span>
                          <span>•</span>
                          <span>{formattedDate}</span>
                          <span>•</span>
                          <span className="font-mono text-[11px]">{w.transferProtocol}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
                      <p className="text-lg font-bold font-display text-foreground">
                        R${" "}
                        {Number(w.amount).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedWithdrawal(w);
                          setReceiptModalOpen(true);
                        }}
                        className="rounded-xl text-xs gap-1 hover:bg-primary/10 text-primary font-bold"
                      >
                        <FileCheck className="w-3.5 h-3.5" /> Ver Comprovante
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Comprovante de Saque */}
      <WithdrawalReceiptModal
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
        withdrawal={selectedWithdrawal}
      />
    </div>
  );
}
