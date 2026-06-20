"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const WELCOME_KEY = "norte_welcome_seen";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const seen = localStorage.getItem(WELCOME_KEY);
    router.replace(seen ? "/login" : "/welcome");
  }, [router]);

  return (
    <div className="flex h-dvh items-center justify-center bg-norte-bg">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-norte-blue border-t-transparent" />
    </div>
  );
}
