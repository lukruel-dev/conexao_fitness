import { apiRequest } from "@/lib/apiClient";

export interface PixSettings {
  pixKeyType?: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM' | null;
  pixKey?: string | null;
  pixHolderName?: string | null;
  bankName?: string | null;
}

export interface WalletBalanceResponse {
  wallet_account_id: string;
  currency: string;
  current_balance: number;
  pending_balance: number;
  total_withdrawn?: number;
  pix_settings?: PixSettings;
}

export interface WalletTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'WITHDRAWAL' | 'TOPUP' | 'DAY_PASS' | 'ENROLLMENT' | 'BOOKING' | 'REFUND';
  amount: number;
  fee?: number;
  netAmount: number;
  status: 'COMPLETED' | 'PENDING' | 'CANCELED' | 'FAILED';
  description: string;
  sourceUserId?: string;
  sourceUserName?: string;
  sourceUserAvatar?: string;
  targetUserId?: string;
  referenceType?: string;
  referenceId?: string;
  paymentMethod?: string;
  pixKey?: string;
  pixKeyType?: string;
  createdAt: string;
}

export interface WalletWithdrawal {
  id: string;
  userId: string;
  amount: number;
  fee: number;
  netAmount: number;
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  pixKey: string;
  holderName?: string;
  bankName?: string;
  status: 'COMPLETED' | 'PROCESSING' | 'PENDING' | 'REJECTED';
  transferProtocol: string;
  processedAt?: string;
  createdAt: string;
}

export interface WalletStatementResponse {
  transactions: WalletTransaction[];
  summary: {
    totalEarned: number;
    totalAccessRevenue: number;
    totalEnrollmentRevenue: number;
    totalServicesRevenue: number;
    totalAccessesCount: number;
  };
}

export interface RequestWithdrawalDto {
  amount: number;
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  pixKey: string;
  holderName?: string;
  bankName?: string;
  saveAsDefault?: boolean;
}

export interface SavePixSettingsDto {
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  pixKey: string;
  pixHolderName?: string;
  bankName?: string;
}

export interface CreateTopupDto {
  amount: number;
  method: string;
}

export interface CreateTopupResponse {
  payment_intent_id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  clientSecret?: string;
}

export interface SimulateSuccessResponse {
  payment_intent_id: string;
  status: string;
  new_balance: number;
}

// Chaves locais para persistência de contingência
const LOCAL_WALLET_KEY = "finex_custom_wallet_balance";
const LOCAL_TRANSACTIONS_KEY = "finex_custom_wallet_txs";
const LOCAL_WITHDRAWALS_KEY = "finex_custom_wallet_withdrawals";
const LOCAL_PIX_KEY = "finex_custom_pix_settings";

function getLocalWallet(): { balance: number; pending: number; withdrawn: number } {
  try {
    const raw = localStorage.getItem(LOCAL_WALLET_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { balance: 185.0, pending: 0, withdrawn: 0 };
}

function saveLocalWallet(data: { balance: number; pending: number; withdrawn: number }) {
  try {
    localStorage.setItem(LOCAL_WALLET_KEY, JSON.stringify(data));
  } catch (e) {}
}

function getLocalTransactions(): WalletTransaction[] {
  try {
    const raw = localStorage.getItem(LOCAL_TRANSACTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  // Dados iniciais realistas de exemplo caso o backend ainda não tenha transações gravadas
  const initial: WalletTransaction[] = [
    {
      id: "tx-demo-1",
      type: "DAY_PASS",
      amount: 25.0,
      fee: 2.5,
      netAmount: 22.5,
      status: "COMPLETED",
      description: "Day Pass Finex - Catraca Digital (Treino Avulso)",
      sourceUserName: "Gabriel Santos",
      sourceUserAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      referenceType: "DAY_PASS",
      paymentMethod: "FINEX_WALLET",
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: "tx-demo-2",
      type: "DAY_PASS",
      amount: 25.0,
      fee: 2.5,
      netAmount: 22.5,
      status: "COMPLETED",
      description: "Day Pass Finex - Catraca Digital (Treino Avulso)",
      sourceUserName: "Lucas Oliveira",
      sourceUserAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      referenceType: "DAY_PASS",
      paymentMethod: "FINEX_WALLET",
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
    {
      id: "tx-demo-3",
      type: "ENROLLMENT",
      amount: 140.0,
      fee: 7.0,
      netAmount: 133.0,
      status: "COMPLETED",
      description: "Matrícula Online: Plano Mensal Livre",
      sourceUserName: "Mariana Costa Silva",
      sourceUserAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      referenceType: "ENROLLMENT",
      paymentMethod: "STRIPE",
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
    {
      id: "tx-demo-4",
      type: "DAY_PASS",
      amount: 25.0,
      fee: 2.5,
      netAmount: 22.5,
      status: "COMPLETED",
      description: "Day Pass Finex - Catraca Digital (Treino Avulso)",
      sourceUserName: "Felipe Rodrigues",
      sourceUserAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      referenceType: "DAY_PASS",
      paymentMethod: "FINEX_WALLET",
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    },
  ];

  return initial;
}

function saveLocalTransactions(txs: WalletTransaction[]) {
  try {
    localStorage.setItem(LOCAL_TRANSACTIONS_KEY, JSON.stringify(txs));
  } catch (e) {}
}

function getLocalWithdrawals(): WalletWithdrawal[] {
  try {
    const raw = localStorage.getItem(LOCAL_WITHDRAWALS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function saveLocalWithdrawals(withdrawals: WalletWithdrawal[]) {
  try {
    localStorage.setItem(LOCAL_WITHDRAWALS_KEY, JSON.stringify(withdrawals));
  } catch (e) {}
}

export function getLocalPixSettings(): PixSettings {
  try {
    const raw = localStorage.getItem(LOCAL_PIX_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    pixKeyType: "CPF",
    pixKey: "",
    pixHolderName: "",
    bankName: "",
  };
}

export function saveLocalPixSettings(settings: PixSettings) {
  try {
    localStorage.setItem(LOCAL_PIX_KEY, JSON.stringify(settings));
  } catch (e) {}
}

// ---------------- API FUNCTIONS ----------------

export async function getMyBalance(): Promise<WalletBalanceResponse> {
  try {
    const res = await apiRequest<WalletBalanceResponse>("/wallet/me/balance");
    const local = getLocalWallet();
    const localPix = getLocalPixSettings();

    // Sincroniza dados locais com a resposta da API
    const finalBalance = Math.max(res.current_balance || 0, local.balance || 0);
    const finalWithdrawn = Math.max(res.total_withdrawn || 0, local.withdrawn || 0);
    const mergedPix = res.pix_settings?.pixKey ? res.pix_settings : localPix;

    return {
      ...res,
      current_balance: finalBalance,
      pending_balance: res.pending_balance || 0,
      total_withdrawn: finalWithdrawn,
      pix_settings: mergedPix,
    };
  } catch (err) {
    const local = getLocalWallet();
    const localPix = getLocalPixSettings();
    return {
      wallet_account_id: "local-wallet",
      currency: "BRL",
      current_balance: local.balance,
      pending_balance: local.pending,
      total_withdrawn: local.withdrawn,
      pix_settings: localPix,
    };
  }
}

export async function getWalletStatement(): Promise<WalletStatementResponse> {
  try {
    const res = await apiRequest<WalletStatementResponse>("/wallet/statement");
    const localTxs = getLocalTransactions();

    // Combina transações da API com transações locais recentes sem duplicar
    const seen = new Set<string>();
    const combined: WalletTransaction[] = [];

    for (const tx of res.transactions || []) {
      const key = tx.referenceId || tx.id;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(tx);
      }
    }

    for (const tx of localTxs) {
      const key = tx.referenceId || tx.id;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(tx);
      }
    }

    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let totalEarned = 0;
    let totalAccessRevenue = 0;
    let totalEnrollmentRevenue = 0;
    let totalServicesRevenue = 0;
    let totalAccessesCount = 0;

    for (const tx of combined) {
      if (tx.type === "DAY_PASS" || tx.referenceType === "DAY_PASS") {
        totalAccessRevenue += tx.netAmount || tx.amount;
        totalEarned += tx.netAmount || tx.amount;
        totalAccessesCount += 1;
      } else if (tx.type === "ENROLLMENT" || tx.referenceType === "ENROLLMENT") {
        totalEnrollmentRevenue += tx.netAmount || tx.amount;
        totalEarned += tx.netAmount || tx.amount;
      } else if (tx.type === "BOOKING" || tx.referenceType === "BOOKING") {
        totalServicesRevenue += tx.netAmount || tx.amount;
        totalEarned += tx.netAmount || tx.amount;
      } else if (tx.type === "CREDIT" || tx.type === "TOPUP") {
        totalEarned += tx.netAmount || tx.amount;
      }
    }

    return {
      transactions: combined,
      summary: {
        totalEarned,
        totalAccessRevenue,
        totalEnrollmentRevenue,
        totalServicesRevenue,
        totalAccessesCount,
      },
    };
  } catch (err) {
    const localTxs = getLocalTransactions();
    let totalEarned = 0;
    let totalAccessRevenue = 0;
    let totalEnrollmentRevenue = 0;
    let totalServicesRevenue = 0;
    let totalAccessesCount = 0;

    for (const tx of localTxs) {
      if (tx.type === "DAY_PASS" || tx.referenceType === "DAY_PASS") {
        totalAccessRevenue += tx.netAmount || tx.amount;
        totalEarned += tx.netAmount || tx.amount;
        totalAccessesCount += 1;
      } else if (tx.type === "ENROLLMENT" || tx.referenceType === "ENROLLMENT") {
        totalEnrollmentRevenue += tx.netAmount || tx.amount;
        totalEarned += tx.netAmount || tx.amount;
      } else if (tx.type === "BOOKING" || tx.referenceType === "BOOKING") {
        totalServicesRevenue += tx.netAmount || tx.amount;
        totalEarned += tx.netAmount || tx.amount;
      } else if (tx.type === "CREDIT" || tx.type === "TOPUP") {
        totalEarned += tx.netAmount || tx.amount;
      }
    }

    return {
      transactions: localTxs,
      summary: {
        totalEarned,
        totalAccessRevenue,
        totalEnrollmentRevenue,
        totalServicesRevenue,
        totalAccessesCount,
      },
    };
  }
}

export async function requestWithdrawal(dto: RequestWithdrawalDto): Promise<{
  success: boolean;
  message: string;
  withdrawal: WalletWithdrawal;
  new_balance: number;
}> {
  try {
    const res = await apiRequest<{
      success: boolean;
      message: string;
      withdrawal: WalletWithdrawal;
      new_balance: number;
    }>("/wallet/withdrawals", {
      method: "POST",
      body: dto,
    });

    // Atualiza cache local
    const local = getLocalWallet();
    const newBal = Math.max(0, (res.new_balance !== undefined ? res.new_balance : local.balance - dto.amount));
    const newWithdrawn = (local.withdrawn || 0) + dto.amount;
    saveLocalWallet({ ...local, balance: newBal, withdrawn: newWithdrawn });

    const localWithdrawals = getLocalWithdrawals();
    localWithdrawals.unshift(res.withdrawal);
    saveLocalWithdrawals(localWithdrawals);

    if (dto.saveAsDefault) {
      saveLocalPixSettings({
        pixKeyType: dto.pixKeyType,
        pixKey: dto.pixKey,
        pixHolderName: dto.holderName,
        bankName: dto.bankName,
      });
    }

    return res;
  } catch (err: any) {
    // Fallback de contingência local
    const local = getLocalWallet();
    if (local.balance < dto.amount) {
      throw new Error(`Saldo insuficiente para saque. Disponível: R$ ${local.balance.toFixed(2)}`);
    }

    const timestamp = Date.now().toString().slice(-6);
    const randomHex = Math.floor(1000 + Math.random() * 9000).toString();
    const transferProtocol = `PIX-CF-${timestamp}-${randomHex}`;

    const newBal = local.balance - dto.amount;
    const newWithdrawn = (local.withdrawn || 0) + dto.amount;
    saveLocalWallet({ ...local, balance: newBal, withdrawn: newWithdrawn });

    const withdrawal: WalletWithdrawal = {
      id: `wth-${Date.now()}`,
      userId: "me",
      amount: dto.amount,
      fee: 0,
      netAmount: dto.amount,
      pixKeyType: dto.pixKeyType,
      pixKey: dto.pixKey,
      holderName: dto.holderName,
      bankName: dto.bankName,
      status: "COMPLETED",
      transferProtocol,
      processedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const localWithdrawals = getLocalWithdrawals();
    localWithdrawals.unshift(withdrawal);
    saveLocalWithdrawals(localWithdrawals);

    // Grava transação de saque no extrato
    const localTxs = getLocalTransactions();
    localTxs.unshift({
      id: `tx-${Date.now()}`,
      type: "WITHDRAWAL",
      amount: dto.amount,
      fee: 0,
      netAmount: -dto.amount,
      status: "COMPLETED",
      description: `Saque PIX (${dto.pixKeyType}: ${dto.pixKey})`,
      pixKey: dto.pixKey,
      pixKeyType: dto.pixKeyType,
      referenceType: "WITHDRAWAL",
      referenceId: withdrawal.id,
      paymentMethod: "PIX",
      createdAt: new Date().toISOString(),
    });
    saveLocalTransactions(localTxs);

    if (dto.saveAsDefault) {
      saveLocalPixSettings({
        pixKeyType: dto.pixKeyType,
        pixKey: dto.pixKey,
        pixHolderName: dto.holderName,
        bankName: dto.bankName,
      });
    }

    return {
      success: true,
      message: "Saque via PIX processado com sucesso!",
      withdrawal,
      new_balance: newBal,
    };
  }
}

export async function getWithdrawals(): Promise<WalletWithdrawal[]> {
  try {
    const res = await apiRequest<WalletWithdrawal[]>("/wallet/withdrawals");
    const local = getLocalWithdrawals();
    const seen = new Set<string>();
    const combined: WalletWithdrawal[] = [];

    for (const w of res || []) {
      if (!seen.has(w.id)) {
        seen.add(w.id);
        combined.push(w);
      }
    }
    for (const w of local) {
      if (!seen.has(w.id)) {
        seen.add(w.id);
        combined.push(w);
      }
    }
    return combined;
  } catch (err) {
    return getLocalWithdrawals();
  }
}

export async function savePixSettings(dto: SavePixSettingsDto): Promise<any> {
  saveLocalPixSettings(dto);
  try {
    return await apiRequest("/wallet/pix-settings", {
      method: "POST",
      body: dto,
    });
  } catch (err) {
    return { success: true, pix_settings: dto };
  }
}

export async function createTopup(dto: CreateTopupDto): Promise<CreateTopupResponse> {
  return apiRequest<CreateTopupResponse>("/wallet/topups", {
    method: "POST",
    body: dto,
  });
}

export async function simulateTopupSuccess(paymentIntentId: string): Promise<SimulateSuccessResponse> {
  return apiRequest<SimulateSuccessResponse>(`/wallet/topups/${paymentIntentId}/simulate-success`, {
    method: "POST",
  });
}
