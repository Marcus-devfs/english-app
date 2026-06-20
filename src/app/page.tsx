"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/ui/loading";
import { WELCOME_KEY } from "@/lib/constants/auth";
import { getAuthenticatedRedirectPath } from "@/lib/auth/redirect";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function route() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (data.success) {
          router.replace(getAuthenticatedRedirectPath(data.data.user));
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
      <Loading fullHeight={false} />
    </div>
  );
}
