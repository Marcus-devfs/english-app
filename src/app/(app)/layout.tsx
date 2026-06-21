import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { parseAppLanguage, LANGUAGE_COOKIE } from "@/lib/i18n/language-persistence";

import { AppProviders } from "@/components/providers/app-providers";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/");

  const cookieStore = await cookies();
  const initialLanguage = parseAppLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value);

  try {
    await connectDB();
    const user = await User.findById(session.userId).select("onboardingCompleted");
    if (user && !user.onboardingCompleted) {
      redirect("/onboarding");
    }
  } catch {
    // DB unavailable during dev — allow access
  }

  return <AppProviders initialLanguage={initialLanguage}>{children}</AppProviders>;
}
