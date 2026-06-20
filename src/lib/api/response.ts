import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function handleZodError(error: ZodError) {
  const firstError = error.issues[0]?.message ?? "Dados inválidos";
  return apiError(firstError, 422);
}

export function handleApiError(error: unknown) {
  console.error("[API Error]", error);
  if (error instanceof Error && error.message.includes("duplicate key")) {
    return apiError("Este email já está cadastrado", 409);
  }
  return apiError("Erro interno do servidor", 500);
}
