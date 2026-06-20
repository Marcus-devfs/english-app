import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { ChatMessage } from "@/models/ChatMessage";
import { Assessment } from "@/models/Assessment";
import { getSession } from "@/lib/auth/session";
import { COOKIE_NAME } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    await connectDB();

    const userId = session.userId;

    await Promise.all([
      ChatMessage.deleteMany({ userId }),
      Assessment.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    const response = apiSuccess({ deleted: true });
    response.cookies.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
