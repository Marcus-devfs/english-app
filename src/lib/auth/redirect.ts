import { isAdminEmail } from "@/lib/auth/admin-emails";

export function getAuthenticatedRedirectPath(user: {
  email: string;
  onboardingCompleted: boolean;
  isAdmin?: boolean;
  role?: string;
}): string {
  if (user.isAdmin || user.role === "admin" || isAdminEmail(user.email)) {
    return "/admin";
  }
  if (!user.onboardingCompleted) return "/onboarding";
  return "/dashboard";
}
