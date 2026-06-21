import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { ChatMessage } from "@/models/ChatMessage";
import { getSession } from "@/lib/auth/session";
import { chatMessageSchema } from "@/lib/validations/auth";
import { getAIResponse, isAIConfigured } from "@/services/ai.service";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import { apiSuccess, apiError, handleZodError, handleApiError } from "@/lib/api/response";
import type { LearningGoal, CEFRLevel } from "@/types";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    await connectDB();
    const user = await User.findById(session.userId);
    const messages = await ChatMessage.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return apiSuccess({
      messages: messages.reverse(),
      aiConfigured: isAIConfigured(),
      user: user
        ? {
            name: user.name,
            goal: user.goal ?? "conversation",
            level: user.diagnosedLevel ?? "B1",
          }
        : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    const body = await request.json();
    const parsed = chatMessageSchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    const chatRate = await checkRateLimit(
      `chat:${session.userId}`,
      RATE_LIMITS.chatDaily.limit,
      RATE_LIMITS.chatDaily.windowMs
    );
    if (!chatRate.allowed) {
      return rateLimitExceededResponse({
        ...chatRate,
        retryAfterSec: chatRate.retryAfterSec,
      });
    }

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) return apiError("Usuário não encontrado", 404);

    await ChatMessage.create({
      userId: session.userId,
      role: "user",
      content: parsed.data.message,
    });

    const history = await ChatMessage.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const aiResponse = await getAIResponse(
      parsed.data.message,
      {
        goal: (user.goal ?? "conversation") as LearningGoal,
        level: (user.diagnosedLevel ?? "B1") as CEFRLevel,
        userName: user.name,
      },
      history.reverse().map((m) => ({ role: m.role, content: m.content }))
    );

    const assistantMsg = await ChatMessage.create({
      userId: session.userId,
      role: "assistant",
      content: aiResponse.message,
      corrections: aiResponse.corrections,
    });

    await User.findByIdAndUpdate(session.userId, {
      $inc: {
        "progress.xp": 5,
        "progress.speakingScore": 1,
      },
    });

    return apiSuccess({
      message: assistantMsg,
      aiMode: aiResponse.mode,
      mockReason: aiResponse.mockReason,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
