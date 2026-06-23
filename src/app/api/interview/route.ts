import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { InterviewSession } from "@/models/InterviewSession";
import { getSession } from "@/lib/auth/session";
import { isPro, serializeSubscription } from "@/lib/subscription";
import { buildStudyContext } from "@/lib/lessons/study-context";
import {
  getInterviewResponse,
  getInterviewFeedback,
  getInterviewOpening,
} from "@/services/interview.service";
import { interviewMessageSchema } from "@/lib/validations/progress";
import { apiSuccess, apiError, handleZodError, handleApiError } from "@/lib/api/response";
import type { LearningGoal, CEFRLevel } from "@/types";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiError("Não autenticado", 401);

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) return apiError("Usuário não encontrado", 404);

    const subscription = serializeSubscription(user.subscription);
    const activeSession = await InterviewSession.findOne({
      userId: session.userId,
      status: "active",
    }).sort({ createdAt: -1 });

    const pastSessions = await InterviewSession.find({
      userId: session.userId,
      status: "completed",
    })
      .sort({ completedAt: -1 })
      .limit(5)
      .select("feedback startedAt completedAt messages")
      .lean();

    return apiSuccess({
      isPro: subscription.isPro,
      subscription,
      activeSession: activeSession
        ? {
            id: activeSession._id.toString(),
            messages: activeSession.messages,
            startedAt: activeSession.startedAt,
          }
        : null,
      pastSessions: pastSessions.map((s) => ({
        id: s._id.toString(),
        feedback: s.feedback,
        messageCount: s.messages?.length ?? 0,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
      })),
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
    const parsed = interviewMessageSchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) return apiError("Usuário não encontrado", 404);

    if (!isPro(user.subscription)) {
      return apiError("Entrevista disponível apenas no plano PRO", 403);
    }

    const goal = (user.goal ?? "conversation") as LearningGoal;
    const level = (user.diagnosedLevel ?? user.selfAssessedLevel ?? "B1") as CEFRLevel;
    const studyContext = await buildStudyContext(session.userId, goal, level, {
      userName: user.name,
      streakDays: user.progress?.streakDays,
      lessonsCompleted: user.progress?.lessonsCompleted,
      xp: user.progress?.xp,
      speakingScore: user.progress?.speakingScore,
    });

    const ctx = {
      goal,
      level,
      userName: user.name,
      studyContext,
      questionCount: 0,
    };

    if (parsed.data.action === "start") {
      await InterviewSession.updateMany(
        { userId: session.userId, status: "active" },
        { status: "abandoned", completedAt: new Date() }
      );

      const opening = getInterviewOpening({ goal, level, userName: user.name });
      const interviewSession = await InterviewSession.create({
        userId: session.userId,
        goal,
        level,
        studyContext,
        messages: [{ role: "assistant", content: opening, createdAt: new Date() }],
      });

      return apiSuccess({
        sessionId: interviewSession._id.toString(),
        message: { role: "assistant", content: opening },
      });
    }

    const sessionId = parsed.data.sessionId;
    if (!sessionId) return apiError("sessionId obrigatório", 400);

    const interviewSession = await InterviewSession.findOne({
      _id: sessionId,
      userId: session.userId,
      status: "active",
    });
    if (!interviewSession) return apiError("Sessão não encontrada", 404);

    if (parsed.data.action === "finish") {
      const transcript = interviewSession.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const feedback = await getInterviewFeedback(
        {
          ...ctx,
          studyContext: interviewSession.studyContext,
          questionCount: transcript.filter((m) => m.role === "assistant").length,
        },
        transcript
      );

      interviewSession.status = "completed";
      interviewSession.feedback = feedback;
      interviewSession.completedAt = new Date();
      await interviewSession.save();

      await User.findByIdAndUpdate(session.userId, {
        $inc: { "progress.xp": 30, "progress.speakingScore": 5 },
      });

      return apiSuccess({ feedback, sessionId: interviewSession._id.toString() });
    }

    const message = parsed.data.message?.trim();
    if (!message) return apiError("Mensagem obrigatória", 400);

    interviewSession.messages.push({
      role: "user",
      content: message,
      createdAt: new Date(),
    });

    const history = interviewSession.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const questionCount = history.filter((m) => m.role === "assistant").length;
    const aiResponse = await getInterviewResponse(message, { ...ctx, questionCount }, history);

    interviewSession.messages.push({
      role: "assistant",
      content: aiResponse.message,
      createdAt: new Date(),
    });
    await interviewSession.save();

    return apiSuccess({
      sessionId: interviewSession._id.toString(),
      message: { role: "assistant", content: aiResponse.message },
      aiMode: aiResponse.mode,
      questionCount: questionCount + 1,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
