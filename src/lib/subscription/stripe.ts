import Stripe from "stripe";
import { isStripeConfigured } from "@/lib/subscription";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!isStripeConfigured()) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!.trim());
  }
  return stripeClient;
}

export async function createProCheckoutSession(params: {
  userId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: params.email,
    client_reference_id: params.userId,
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!.trim(), quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { userId: params.userId },
  });

  return session.url;
}

export async function createBillingPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  return session.url;
}
