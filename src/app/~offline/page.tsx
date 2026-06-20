import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
        <WifiOff className="h-10 w-10 text-slate-400" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">Você está offline</h1>
      <p className="mt-2 max-w-sm text-slate-600">
        Verifique sua conexão e tente novamente. Algumas páginas precisam de internet
        para funcionar.
      </p>
      <Link href="/dashboard" className="mt-8">
        <Button>Tentar novamente</Button>
      </Link>
    </div>
  );
}
