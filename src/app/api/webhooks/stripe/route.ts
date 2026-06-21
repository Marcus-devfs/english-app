import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { getStripe } from "@/lib/subscription/stripe";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import Stripe from "stripe";

export const runtime = "nodejs";

function getSubscriptionPeriodEnd(sub: Stripe.Subscription): Date {
  const item = sub.items?.data?.[0];
  if (item?.current_period_end) {
    return new Date(item.current_period_end * 1000);
  }
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

async function activatePro(params: {
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  status?: "active" | "canceled" | "past_due" | "inactive";
}) {
  await connectDB();
  await User.findByIdAndUpdate(params.userId, {
    subscription: {
      plan: "pro",
      status: params.status ?? "active",
      currentPeriodEnd: params.currentPeriodEnd,
      stripeCustomerId: params.stripeCustomerId,
      stripeSubscriptionId: params.stripeSubscriptionId,
      cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? false,
    },
  });
}

async function deactivatePro(userId: string) {
  await connectDB();
  await User.findByIdAndUpdate(userId, {
    subscription: {
      plan: "free",
      status: "inactive",
      currentPeriodEnd: undefined,
      stripeCustomerId: undefined,
      stripeSubscriptionId: undefined,
      cancelAtPeriodEnd: false,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!stripe || !webhookSecret) {
      return apiError("Webhook não configurado", 503);
    }

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature) return apiError("Assinatura ausente", 400);

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch {
      return apiError("Assinatura inválida", 400);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId ?? session.client_reference_id;
        if (!userId) break;

        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;

        let periodEnd: Date | undefined;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          periodEnd = getSubscriptionPeriodEnd(sub);
        } else {
          periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }

        await activatePro({
          userId,
          stripeCustomerId: customerId ?? undefined,
          stripeSubscriptionId: subscriptionId ?? undefined,
          currentPeriodEnd: periodEnd,
          status: "active",
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await connectDB();
        const user = await User.findOne({ "subscription.stripeSubscriptionId": sub.id });
        if (!user) break;

        const isActive = sub.status === "active" || sub.status === "trialing";
        await activatePro({
          userId: user._id.toString(),
          stripeCustomerId:
            typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
          stripeSubscriptionId: sub.id,
          currentPeriodEnd: getSubscriptionPeriodEnd(sub),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          status: isActive ? "active" : sub.status === "past_due" ? "past_due" : "canceled",
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await connectDB();
        const user = await User.findOne({ "subscription.stripeSubscriptionId": sub.id });
        if (user) await deactivatePro(user._id.toString());
        break;
      }
    }

    return apiSuccess({ received: true });
  } catch (error) {
    return handleApiError(error);
  }
}
