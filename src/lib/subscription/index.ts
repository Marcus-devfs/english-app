import type { UserSubscription } from "@/types/subscription";
import { PRO_PRICE_USD } from "@/types/subscription";
import { isMockPaymentsMode } from "@/lib/subscription/mock";

export { PRO_PRICE_USD };

export function getDefaultSubscription(): UserSubscription {
  return { plan: "free", status: "inactive", source: "mock" };
}

export function isPro(subscription?: UserSubscription | null): boolean {
  if (!subscription || subscription.plan !== "pro") return false;
  if (subscription.status !== "active" && subscription.status !== "canceled") {
    return false;
  }
  if (subscription.currentPeriodEnd) {
    return new Date(subscription.currentPeriodEnd) > new Date();
  }
  return subscription.status === "active";
}

export function serializeSubscription(
  sub?: UserSubscription | null
): UserSubscription & { isPro: boolean; isMock: boolean } {
  const normalized = sub ?? getDefaultSubscription();
  const periodEnd = normalized.currentPeriodEnd
    ? new Date(normalized.currentPeriodEnd).toISOString()
    : undefined;
  const subscription: UserSubscription = {
    plan: normalized.plan ?? "free",
    status: normalized.status ?? "inactive",
    source: normalized.source ?? "mock",
    currentPeriodEnd: periodEnd,
    stripeCustomerId: normalized.stripeCustomerId,
    stripeSubscriptionId: normalized.stripeSubscriptionId,
    cancelAtPeriodEnd: normalized.cancelAtPeriodEnd,
    mockGrantedAt: normalized.mockGrantedAt
      ? new Date(normalized.mockGrantedAt).toISOString()
      : undefined,
    mockMonths: normalized.mockMonths,
  };
  return {
    ...subscription,
    isPro: isPro(subscription),
    isMock: subscription.source === "mock",
  };
}

export function getPaymentsMode(): "mock" | "stripe" {
  return isMockPaymentsMode() ? "mock" : "stripe";
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_PRO_PRICE_ID?.trim()
  );
}
