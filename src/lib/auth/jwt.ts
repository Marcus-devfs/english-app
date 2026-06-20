import { SignJWT, jwtVerify } from "jose";
import { getJwtSecretBytes } from "@/lib/security/env";

const EXPIRES_IN = "7d";

export interface JWTPayload {
  userId: string;
  email: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(getJwtSecretBytes());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
