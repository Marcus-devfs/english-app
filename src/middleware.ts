import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

const PUBLIC_ROUTES = ["/", "/login", "/register"];
const ONBOARDING_ROUTES = ["/onboarding"];
const AUTH_API = ["/api/auth/login", "/api/auth/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/register") ||
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
  const isOnboarding = ONBOARDING_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthApi = AUTH_API.some((r) => pathname.startsWith(r));

  if (isAuthApi) return NextResponse.next();

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
