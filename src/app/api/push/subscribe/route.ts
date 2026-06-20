import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth/session";
import { pushSubscribeSchema } from "@/lib/validations/profile";
import { getVapidPublicKey } from "@/lib/push/web-push";
import {
  apiSuccess,
  apiError,
  handleZodError,
  handleApiError,
} from "@/lib/api/response";

export async function GET() {
  const publicKey = getVapidPublicKey();
  return apiSuccess({ publicKey: publicKey ?? null, supported: Boolean(publicKey) });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    const body = await request.json();
    const parsed = pushSubscribeSchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    const { subscription } = parsed.data;

    await connectDB();

    await User.findByIdAndUpdate(session.userId, {
      $pull: { pushSubscriptions: { endpoint: subscription.endpoint } },
    });

    await User.findByIdAndUpdate(session.userId, {
      $push: {
        pushSubscriptions: {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          createdAt: new Date(),
        },
      },
      "preferences.notificationsEnabled": true,
    });

    return apiSuccess({ subscribed: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    await connectDB();
    await User.findByIdAndUpdate(session.userId, {
      pushSubscriptions: [],
      "preferences.notificationsEnabled": false,
    });

    return apiSuccess({ unsubscribed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
