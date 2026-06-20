import Link from "next/link";
import Image from "next/image";

interface LegalLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function LegalLayout({ title, children }: LegalLayoutProps) {
  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-norte-bg">
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-norte-bg/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href="/welcome">
            <Image
              src="/icons/norte-icon-192.png"
              alt="Norte"
              width={32}
              height={32}
              className="rounded-lg"
            />
          </Link>
          <h1 className="text-sm font-bold text-norte-ink">{title}</h1>
        </div>
      </header>
      <article className="px-4 py-6 pb-12 prose prose-sm prose-slate max-w-none">
        {children}
      </article>
      <div className="px-4 pb-8">
        <Link href="/auth" className="text-sm text-norte-blue font-medium hover:underline">
          ← Voltar
        </Link>
      </div>
    </div>
  );
}
