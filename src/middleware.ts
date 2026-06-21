import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/auth/admin-emails";

const PUBLIC_ROUTES = [
  "/",
  "/welcome",
  "/install",
  "/auth",
  "/login",
  "/register",
  "/privacidade",
  "/termos",
  "/~offline",
];
const AUTH_API = ["/api/auth/login", "/api/auth/register"];
const CRON_API = ["/api/push/reminders"];
const WEBHOOK_API = ["/api/webhooks/stripe"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/register") ||
    CRON_API.some((r) => pathname.startsWith(r)) ||
    WEBHOOK_API.some((r) => pathname.startsWith(r)) ||
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

  if (!session && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    session &&
    (pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/auth" ||
      pathname === "/welcome")
  ) {
    const destination = isAdminEmail(session.email) ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (session && pathname === "/" && isAdminEmail(session.email)) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
