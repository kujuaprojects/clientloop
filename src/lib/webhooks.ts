import crypto from "crypto";
import { NextRequest } from "next/server";

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

export function verifySharedSecret(req: NextRequest, envName: string) {
  const expected = process.env[envName];
  if (!expected) return process.env.NODE_ENV !== "production";
  const header = req.headers.get("x-clientloop-secret") || "";
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
  return safeEqual(header || bearer, expected);
}

export function cleanEventType(value: unknown) {
  const allowed = new Set([
    "lead",
    "booking_started",
    "booking",
    "attended",
    "client_won",
    "revenue",
    "booking_cancelled",
  ]);
  const type = String(value || "").trim().toLowerCase();
  return allowed.has(type) ? type : null;
}
