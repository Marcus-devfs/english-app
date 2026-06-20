import type { IUser } from "@/models/User";
import {
  getDeepLinkForGoal,
  getMessageTemplate,
  interpolateTemplate,
} from "@/lib/push/messages";
import type { PushMessageContext, PushPayload, PushNotificationType } from "@/lib/push/types";

export function buildPushPayload(
  user: IUser,
  type: PushNotificationType
): PushPayload {
  const language = user.preferences?.language ?? "pt";
  const firstName = user.name.split(" ")[0] ?? user.name;
  const minutes = user.preferences?.practiceMinutesPerDay ?? 15;
  const streak = user.progress?.streakDays ?? 0;
  const goal = user.goal ?? "conversation";

  const ctx: PushMessageContext = {
    firstName,
    minutes,
    streak,
    goal,
    language,
    type,
  };

  const template = getMessageTemplate(ctx);
  const { title, body } = interpolateTemplate(template, {
    firstName,
    minutes,
    streak,
  });

  return {
    title,
    body,
    url: getDeepLinkForGoal(goal),
    type,
  };
}
