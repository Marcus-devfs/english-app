import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  try {
    await connectDB();
    const user = await User.findById(session.userId).select("onboardingCompleted");
    if (user && !user.onboardingCompleted) {
      redirect("/onboarding");
    }
  } catch {
    // DB unavailable during dev — allow access
  }

  return <>{children}</>;
}
