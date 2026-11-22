import "server-only";

import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "admin_auth";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < 64) {
    throw new Error("ADMIN_SESSION_SECRET is missing or too short.");
  }

  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

export function verifyAdminPassword(provided: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || !provided) return false;

  const expectedHash = createHash("sha256").update(expected).digest();
  const providedHash = createHash("sha256").update(provided).digest();

  return timingSafeEqual(expectedHash, providedHash);
}

export async function createAdminSession(): Promise<void> {
  const expiresAt = Date.now() + SESSION_DURATION;
  const payload = String(expiresAt);
  const token = `${payload}.${sign(payload)}`;

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(expiresAt),
    path: "/",
  });
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;

  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payload, suppliedSignature] = parts;
  const expiresAt = Number(payload);

  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) {
    return false;
  }

  try {
    const expectedSignature = Buffer.from(sign(payload), "base64url");
    const actualSignature = Buffer.from(suppliedSignature, "base64url");

    return (
      actualSignature.length === expectedSignature.length &&
      timingSafeEqual(actualSignature, expectedSignature)
    );
  } catch {
    return false;
  }
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function destroyAdminSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}
