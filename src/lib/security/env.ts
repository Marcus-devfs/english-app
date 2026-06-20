export function getJwtSecretBytes(): Uint8Array<ArrayBuffer> {
  const secret = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && (!secret || secret.length < 32)) {
    throw new Error(
      "JWT_SECRET must be set in production (minimum 32 characters). Generate with: openssl rand -base64 32"
    );
  }

  return new TextEncoder().encode(
    secret ?? "dev-secret-change-me-local-only"
  ) as Uint8Array<ArrayBuffer>;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
