import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const runtime = "nodejs";

function verifyCalendlySignature(
  rawBody: string,
  signatureHeader: string | null
) {
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;

  if (!signingKey || !signatureHeader) {
    return false;
  }

  const parts = Object.fromEntries(
    signatureHeader
      .split(",")
      .map((part) => part.trim().split("="))
  );

  const timestamp = parts.t;
  const signature = parts.v1;

  if (!timestamp || !signature) {
    return false;
  }

  const timestampNumber = Number(timestamp);

  if (!Number.isFinite(timestampNumber)) {
    return false;
  }

  const toleranceSeconds = 180;
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (Math.abs(nowSeconds - timestampNumber) > toleranceSeconds) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;

  const expectedSignature = crypto
    .createHmac("sha256", signingKey)
    .update(signedPayload)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "utf8");
  const received = Buffer.from(signature, "utf8");

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const signatureHeader = req.headers.get(
    "calendly-webhook-signature"
  );

  if (!verifyCalendlySignature(rawBody, signatureHeader)) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  let body: any;

  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }

  const eventName = String(body.event || "").trim();
  const payload = body.payload || {};
  const tracking = payload.tracking || {};

  const ref = String(
    tracking.utm_campaign ||
    payload.ref ||
    ""
  ).trim();

  const visitorId =
    String(
      tracking.utm_content ||
      payload.clid ||
      ""
    ).trim() || null;

  const email =
    String(payload.email || "").trim() || null;

  const externalId =
    String(payload.uri || payload.event || "").trim() || null;

  let type: string | null = null;

  if (eventName === "invitee.created") {
    type = "booking";
  }

  if (eventName === "invitee.canceled") {
    type = "booking_cancelled";
  }

  if (!type) {
    return NextResponse.json({
      received: true,
      ignored: true
    });
  }

  if (!ref) {
    return NextResponse.json({
      received: true,
      ignored: true,
      reason: "No ClientLoop attribution found"
    });
  }

  const { rows } = await pool.query(
    "SELECT id FROM campaigns WHERE tracking_token = $1 LIMIT 1",
    [ref]
  );

  if (!rows.length) {
    return NextResponse.json({
      received: true,
      ignored: true,
      reason: "Unknown campaign"
    });
  }

  try {
    await pool.query(
      `INSERT INTO events
       (campaign_id, type, ref, visitor_id, external_id, meta)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        rows[0].id,
        type,
        ref,
        visitorId,
        externalId,
        JSON.stringify({
          email,
          provider: "calendly",
          calendly_event: eventName,
          invitee_status: payload.status || null,
          scheduled_event: payload.event || null
        }),
      ]
    );
  } catch (err: any) {
    if (err?.code !== "23505") {
      throw err;
    }
  }

  return NextResponse.json({ received: true });
}