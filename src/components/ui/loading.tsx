"use client";

import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface LoadingProps {
  className?: string;
  label?: string;
  fullHeight?: boolean;
}

export function Loading({
  className,
  label = "Carregando...",
  fullHeight = true,
}: LoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        fullHeight && "h-full flex-1 min-h-[40vh]",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Image
        src="/icons/norte-icon-192.png"
        alt=""
        width={72}
        height={72}
        priority
        className="rounded-2xl shadow-sm animate-[pulse-ring_1.8s_ease-in-out_infinite]"
      />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}
