import crypto from "crypto";

export function makeTrackingToken() {
  return crypto.randomBytes(12).toString("base64url");
}

export function makeVisitorId() {
  return crypto.randomUUID();
}

export function appendTrackingParams(destination: string, token: string, visitorId: string) {
  const url = new URL(destination);
  url.searchParams.set("ref", token);
  url.searchParams.set("src", "clientloop");
  url.searchParams.set("clid", visitorId);
  return url.toString();
}
