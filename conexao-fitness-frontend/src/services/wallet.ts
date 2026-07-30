import { apiRequest } from "@/lib/apiClient";

export interface WalletBalanceResponse {
  wallet_account_id: string;
  currency: string;
  current_balance: number;
  pending_balance: number;
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
  clientSecret?: string; // Stripe PaymentIntent client secret
}

export interface SimulateSuccessResponse {
  payment_intent_id: string;
  status: string;
  new_balance: number;
}

export async function getMyBalance(): Promise<WalletBalanceResponse> {
  return apiRequest<WalletBalanceResponse>("/wallet/me/balance");
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
