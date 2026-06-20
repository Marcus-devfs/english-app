import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/auth/admin";
import { adminPaginationSchema } from "@/lib/validations/admin";
import { apiSuccess, handleZodError, handleApiError } from "@/lib/api/response";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const parsed = adminPaginationSchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });
    if (!parsed.success) return handleZodError(parsed.error);

    const { page, limit, search } = parsed.data;
    const skip = (page - 1) * limit;

    await connectDB();

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "name email role goal diagnosedLevel onboardingCompleted progress preferences pushSubscriptions createdAt updatedAt"
        )
        .lean(),
      User.countDocuments(filter),
    ]);

    return apiSuccess({
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role ?? "user",
        goal: u.goal,
        diagnosedLevel: u.diagnosedLevel,
        onboardingCompleted: u.onboardingCompleted,
        progress: u.progress,
        preferences: {
          language: u.preferences?.language,
          notificationsEnabled: u.preferences?.notificationsEnabled,
          timezone: u.preferences?.timezone,
        },
        pushDevices: u.pushSubscriptions?.length ?? 0,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
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
