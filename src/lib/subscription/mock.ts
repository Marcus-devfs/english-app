import type { UserSubscription } from "@/types/subscription";

export function isMockPaymentsMode(): boolean {
  const mode = process.env.SUBSCRIPTION_MODE?.trim().toLowerCase();
  if (mode === "stripe") return false;
  return true;
}

export function buildMockSubscription(userId: string, months = 1): UserSubscription {
  const suffix = userId.slice(-8);
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + months);

  return {
    plan: "pro",
    status: "active",
    source: "mock",
    currentPeriodEnd: periodEnd,
    stripeCustomerId: `mock_cus_${suffix}`,
    stripeSubscriptionId: `mock_sub_${Date.now()}`,
    cancelAtPeriodEnd: false,
    mockGrantedAt: new Date(),
    mockMonths: months,
  };
}

export function buildFreeSubscription(): UserSubscription {
  return {
    plan: "free",
    status: "inactive",
    source: "mock",
    cancelAtPeriodEnd: false,
  };
}
