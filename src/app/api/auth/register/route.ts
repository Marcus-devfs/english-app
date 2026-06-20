import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { signToken } from "@/lib/auth/jwt";
import { COOKIE_NAME } from "@/lib/auth/session";
import { registerSchema } from "@/lib/validations/auth";
import { getClientIp } from "@/lib/security/client-ip";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import { apiSuccess, apiError, handleZodError, handleApiError } from "@/lib/api/response";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = await checkRateLimit(
      `auth:register:${ip}`,
      RATE_LIMITS.register.limit,
      RATE_LIMITS.register.windowMs
    );
    if (!rate.allowed) return rateLimitExceededResponse(rate);

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    const { name, email, password } = parsed.data;

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) return apiError("Este email já está cadastrado", 409);

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = await signToken({ userId: user._id.toString(), email: user.email });

    const response = apiSuccess({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
      },
    }, 201);

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
