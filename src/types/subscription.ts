export type SubscriptionPlan = "free" | "pro";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "inactive";
export type SubscriptionSource = "mock" | "stripe";

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  source?: SubscriptionSource;
  currentPeriodEnd?: Date | string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  cancelAtPeriodEnd?: boolean;
  mockGrantedAt?: Date | string;
  mockMonths?: number;
}

export const PRO_PRICE_USD = 2.99;

export const PRO_FEATURES = [
  "Entrevista simulada com IA em inglês",
  "Feedback personalizado com base no seu progresso",
  "Contexto das lições que você já completou",
  "Sem limite diário na entrevista",
] as const;
