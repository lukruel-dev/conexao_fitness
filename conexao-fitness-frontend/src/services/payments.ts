import { apiRequest } from "@/lib/apiClient";

export interface OnboardResponse {
  url: string;
}

export async function onboardProvider(returnPath?: string): Promise<OnboardResponse> {
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/carteira';
  const cleanPath = typeof returnPath === 'string' && returnPath.trim().length > 0 ? returnPath : currentPath;
  return apiRequest<OnboardResponse>("/payments/onboard", {
    method: "POST",
    body: { returnPath: cleanPath },
  });
}

export interface CreateSubscriptionResponse {
  clientSecret: string;
}

export async function createSubscription(priceId: string, planName?: string): Promise<CreateSubscriptionResponse> {
  return apiRequest<CreateSubscriptionResponse>("/payments/subscriptions", {
    method: "POST",
    body: { priceId, planName },
  });
}

export async function confirmSaaSSubscription(planName: string, subscriptionId?: string): Promise<any> {
  return apiRequest<any>("/payments/subscriptions/confirm", {
    method: "POST",
    body: { planName, subscriptionId },
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

export interface CreateCheckoutIntentParams {
  providerId: string;
  amount: number;
  purpose: 'PLAN_HIRING' | 'ENROLLMENT';
  title: string;
  referenceId: string;
}

export interface CreateCheckoutIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export async function createCheckoutPaymentIntent(params: CreateCheckoutIntentParams): Promise<CreateCheckoutIntentResponse> {
  return apiRequest<CreateCheckoutIntentResponse>('/payments/create-intent', {
    method: 'POST',
    body: params,
  });
}

