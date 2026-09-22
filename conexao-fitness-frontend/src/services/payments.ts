import { apiRequest } from "@/lib/apiClient";

export interface OnboardResponse {
  url: string;
}

export async function onboardProvider(): Promise<OnboardResponse> {
  return apiRequest<OnboardResponse>("/payments/onboard", { method: "POST" });
}

export interface CreateSubscriptionResponse {
  clientSecret: string;
}

export async function createSubscription(priceId: string): Promise<CreateSubscriptionResponse> {
  return apiRequest<CreateSubscriptionResponse>("/payments/subscriptions", {
    method: "POST",
    body: { priceId },
  });
}

export interface PaymentAccountStatus {
  isConnected: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  error?: string;
}

export async function getPaymentAccountStatus(): Promise<PaymentAccountStatus> {
  return apiRequest<PaymentAccountStatus>("/payments/status", { method: "GET" });
}

