import { connectDB } from "@/lib/db/mongodb";
import { NotificationLog } from "@/models/NotificationLog";
import { requireAdmin } from "@/lib/auth/admin";
import { adminNotificationsSchema } from "@/lib/validations/admin";
import { apiSuccess, handleZodError, handleApiError } from "@/lib/api/response";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const parsed = adminNotificationsSchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      userId: searchParams.get("userId") ?? undefined,
    });
    if (!parsed.success) return handleZodError(parsed.error);

    const { page, limit, search, status, userId } = parsed.data;
    const skip = (page - 1) * limit;

    await connectDB();

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (search) {
      filter.$or = [
        { userEmail: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
      ];
    }

    const [logs, total] = await Promise.all([
      NotificationLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NotificationLog.countDocuments(filter),
    ]);

    return apiSuccess({
      notifications: logs.map((log) => ({
        id: log._id.toString(),
        userId: log.userId.toString(),
        userEmail: log.userEmail,
        userName: log.userName,
        type: log.type,
        title: log.title,
        body: log.body,
        status: log.status,
        localDate: log.localDate,
        timezone: log.timezone,
        slotHour: log.slotHour,
        devicesTargeted: log.devicesTargeted,
        devicesDelivered: log.devicesDelivered,
        scheduleReason: log.scheduleReason,
        createdAt: log.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
