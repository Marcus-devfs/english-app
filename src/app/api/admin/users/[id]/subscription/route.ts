import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/auth/admin";
import { adminSubscriptionSchema } from "@/lib/validations/progress";
import { apiSuccess, apiError, handleZodError, handleApiError } from "@/lib/api/response";
import { serializeSubscription } from "@/lib/subscription";
import { buildMockSubscription, buildFreeSubscription } from "@/lib/subscription/mock";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const parsed = adminSubscriptionSchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    await connectDB();
    const user = await User.findById(id);
    if (!user) return apiError("Usuário não encontrado", 404);

    const { plan, months } = parsed.data;

    if (plan === "pro") {
      user.subscription = buildMockSubscription(id, months ?? 1);
    } else {
      user.subscription = buildFreeSubscription();
    }

    await user.save();

    return apiSuccess({
      subscription: serializeSubscription(user.subscription),
      message:
        plan === "pro"
          ? `PRO mock concedido por ${months ?? 1} mês(es).`
          : "Assinatura mock revogada.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
