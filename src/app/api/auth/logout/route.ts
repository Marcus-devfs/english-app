import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth/session";
import { apiSuccess } from "@/lib/api/response";

export async function POST() {
  const response = apiSuccess({ message: "Logout realizado" });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
