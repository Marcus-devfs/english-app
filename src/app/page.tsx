"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WELCOME_KEY } from "@/lib/constants/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function route() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (data.success) {
          if (!data.data.user.onboardingCompleted) {
            router.replace("/onboarding");
          } else {
            router.replace("/dashboard");
          }
          return;
        }
      } catch {
        // sem sessão — continua fluxo público
      }

      const seen = localStorage.getItem(WELCOME_KEY);
      router.replace(seen ? "/auth?tab=login" : "/welcome");
    }

    route();
  }, [router]);

  return (
    <div className="mx-auto flex h-dvh max-w-lg items-center justify-center bg-norte-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-norte-blue border-t-transparent" />
        <p className="text-sm text-slate-500">Norte</p>
      </div>
    </div>
  );
}
