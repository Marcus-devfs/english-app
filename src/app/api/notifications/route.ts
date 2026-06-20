import { connectDB } from "@/lib/db/mongodb";
import { NotificationLog } from "@/models/NotificationLog";
import { getSession } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

    await connectDB();

    const logs = await NotificationLog.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(
        "type title body url status localDate slotHour sentCountAfter devicesDelivered createdAt"
      )
      .lean();

    return apiSuccess({ notifications: logs });
  } catch (error) {
    return handleApiError(error);
  }
}
