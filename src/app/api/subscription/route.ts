import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth/session";
import { serializeSubscription, isStripeConfigured, getPaymentsMode } from "@/lib/subscription";
import { createProCheckoutSession, createBillingPortalSession } from "@/lib/subscription/stripe";
import { PRO_PRICE_USD, PRO_FEATURES } from "@/types/subscription";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) return apiError("Usuário não encontrado", 404);

    return apiSuccess({
      subscription: serializeSubscription(user.subscription),
      price: PRO_PRICE_USD,
      currency: "USD",
      features: PRO_FEATURES,
      paymentsMode: getPaymentsMode(),
      stripeConfigured: isStripeConfigured(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    const body = await request.json().catch(() => ({}));
    const action = body.action as string;

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) return apiError("Usuário não encontrado", 404);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    if (action === "checkout") {
      if (getPaymentsMode() === "mock") {
        return apiError(
          "Pagamentos em modo mock. Peça ao admin para liberar seu PRO no painel.",
          503
        );
      }
      if (!isStripeConfigured()) {
        return apiError(
          "Pagamentos ainda não configurados. Entre em contato com o suporte ou peça ao admin para ativar o PRO.",
          503
        );
      }

      const url = await createProCheckoutSession({
        userId: session.userId,
        email: user.email,
        successUrl: `${appUrl}/pro?success=1`,
        cancelUrl: `${appUrl}/pro?canceled=1`,
      });

      if (!url) return apiError("Não foi possível iniciar o checkout", 500);
      return apiSuccess({ url });
    }

    if (action === "portal") {
      const customerId = user.subscription?.stripeCustomerId;
      if (!customerId || !isStripeConfigured()) {
        return apiError("Nenhuma assinatura Stripe encontrada", 400);
      }

      const url = await createBillingPortalSession({
        customerId,
        returnUrl: `${appUrl}/profile`,
      });

      if (!url) return apiError("Não foi possível abrir o portal de cobrança", 500);
      return apiSuccess({ url });
    }

    return apiError("Ação inválida", 400);
  } catch (error) {
    return handleApiError(error);
  }
}
