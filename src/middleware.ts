import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

const PUBLIC_ROUTES = ["/", "/welcome", "/install", "/auth", "/login", "/register", "/~offline"];
const AUTH_API = ["/api/auth/login", "/api/auth/register"];
const CRON_API = ["/api/push/reminders"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/register") ||
    CRON_API.some((r) => pathname.startsWith(r)) ||
    pathname.startsWith("/serwist/") ||
    pathname.startsWith("/icons/") ||
    pathname === "/manifest.webmanifest" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("ingles_session")?.value;
  let session = null;

  if (token) {
    const { verifyToken } = await import("@/lib/auth/jwt");
    session = await verifyToken(token);
  }

  const isPublic = PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
  const isAuthApi = AUTH_API.some((r) => pathname.startsWith(r));

  if (isAuthApi) return NextResponse.next();

  // Sem sessão → entry point (não login direto)
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Com sessão → não ficar em telas públicas de auth
  if (
    session &&
    (pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/auth" ||
      pathname === "/welcome")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
