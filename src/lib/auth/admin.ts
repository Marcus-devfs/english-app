import { connectDB } from "@/lib/db/mongodb";
import { User, type IUser, type UserRole } from "@/models/User";
import { getSession } from "@/lib/auth/session";
import { apiError } from "@/lib/api/response";
import { isAdminEmail } from "@/lib/auth/admin-emails";

export { isAdminEmail, getAdminEmails } from "@/lib/auth/admin-emails";

export function resolveUserRole(user: Pick<IUser, "email" | "role">): UserRole {
  if (user.role === "admin" || isAdminEmail(user.email)) return "admin";
  return "user";
}

export function isAdminUser(user: Pick<IUser, "email" | "role">): boolean {
  return resolveUserRole(user) === "admin";
}

/** Promote env-listed emails to admin role in DB (idempotent). */
export async function syncAdminRole(user: IUser): Promise<void> {
  if (isAdminEmail(user.email) && user.role !== "admin") {
    user.role = "admin";
    await user.save();
  }
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) return { error: apiError("Não autenticado", 401) };

  await connectDB();
  const user = await User.findById(session.userId);
  if (!user) return { error: apiError("Usuário não encontrado", 404) };

  await syncAdminRole(user);

  if (!isAdminUser(user)) {
    return { error: apiError("Acesso negado", 403) };
  }

  return { user, session };
}

export async function getAdminUser() {
  const session = await getSession();
  if (!session) return null;

  await connectDB();
  const user = await User.findById(session.userId);
  if (!user) return null;

  await syncAdminRole(user);
  if (!isAdminUser(user)) return null;

  return user;
}
