import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { signToken } from "@/lib/auth/jwt";
import { COOKIE_NAME } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validations/auth";
import { getClientIp } from "@/lib/security/client-ip";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import { apiSuccess, apiError, handleZodError, handleApiError } from "@/lib/api/response";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = await checkRateLimit(
      `auth:login:${ip}`,
      RATE_LIMITS.login.limit,
      RATE_LIMITS.login.windowMs
    );
    if (!rate.allowed) return rateLimitExceededResponse(rate);

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    const { email, password } = parsed.data;

    await connectDB();

    const user = await User.findOne({ email }).select("+password");
    if (!user) return apiError("Email ou senha incorretos", 401);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return apiError("Email ou senha incorretos", 401);

    const token = await signToken({ userId: user._id.toString(), email: user.email });

    const response = apiSuccess({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
        goal: user.goal,
        diagnosedLevel: user.diagnosedLevel,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
