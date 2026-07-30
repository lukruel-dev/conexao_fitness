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
